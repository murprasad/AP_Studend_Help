#!/usr/bin/env node
/**
 * CB-grounded gap audit — compare prod questions against ACTUAL CB 2025
 * released exam content for each AP course. Mirrors the methodology used
 * by the agent for AP_WORLD_HISTORY 2025 gap analysis, but applied to all
 * AP courses where we have CB PDFs locally.
 *
 * Reads:
 *   data/cb-frqs/<COURSE>-2025/*.pdf   (downloaded 2026-04-27)
 *   data/cb-frqs/<COURSE>/*.pdf        (older years, from Beta 7.4 ingestion)
 *   data/cb-frqs/AP_WORLD_HISTORY/2025-extracted/*.txt  (already extracted)
 *
 * For each course:
 *   1. Extract text from any local CB PDFs (via pdf-parse)
 *   2. Compute structural metrics on CB content:
 *      - avg stim length, multi-part stem density, visual reference density,
 *        source citation density, word count distribution
 *   3. Sample 30 random approved MCQs from prod
 *   4. Compute same metrics on prod sample
 *   5. Emit delta per dimension to docs/cb-grounded-gap-<COURSE>-<DATE>.md
 *
 * Aggregate report: docs/cb-grounded-all-AP-<DATE>.md
 *
 * Usage:
 *   node scripts/cb-grounded-gap-audit.mjs              # all 14 AP courses
 *   node scripts/cb-grounded-gap-audit.mjs AP_CHEMISTRY # one course
 */

import "dotenv/config";
import { readdir, writeFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";
import { PDFParse } from "pdf-parse";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const courseFilter = args.find((a) => a.startsWith("AP_"));
const SAMPLE_SIZE = parseInt(args.find((a, i) => args[i - 1] === "--sample") ?? "30", 10);

const AP_COURSES = [
  "AP_WORLD_HISTORY", "AP_US_HISTORY", "AP_US_GOVERNMENT", "AP_HUMAN_GEOGRAPHY",
  "AP_PSYCHOLOGY", "AP_ENVIRONMENTAL_SCIENCE", "AP_BIOLOGY", "AP_CHEMISTRY",
  "AP_PHYSICS_1", "AP_STATISTICS", "AP_CALCULUS_AB", "AP_CALCULUS_BC",
  "AP_PRECALCULUS", "AP_COMPUTER_SCIENCE_PRINCIPLES",
];

// CB PDF folder lookup. Maintained as: courses with locally-downloaded
// 2025 PDFs OR older Beta 7.4 ingestion PDFs.
async function loadCBContent(course) {
  const folders = [
    course === "AP_WORLD_HISTORY" ? "AP World History -2025" : null, // user's manual download
    `data/cb-frqs/${course}-2025`,                                    // 2025 fetch
    `data/cb-frqs/${course}`,                                         // older Beta 7.4
  ].filter(Boolean);

  const contents = [];
  for (const folder of folders) {
    let files;
    try {
      files = await readdir(folder);
    } catch { continue; }

    for (const f of files) {
      if (!f.endsWith(".pdf")) continue;
      // Skip score-distribution / scoring-statistics PDFs (no question text)
      if (/scoring-stat|score-distribution/i.test(f)) continue;
      try {
        const buf = await readFile(join(folder, f));
        const result = await new PDFParse({ data: buf }).getText();
        contents.push({ source: `${folder}/${f}`, text: result.text });
      } catch (e) {
        // Skip unreadable PDFs silently.
      }
    }
  }
  return contents;
}

// Compute structural metrics on a body of text (treating it as one
// contiguous CB document — stems, stimuli, scoring rubrics intermixed).
function computeMetrics(text) {
  // Filter out CB boilerplate (page headers, copyright)
  const stripped = text
    .replace(/Visit College Board.*$/gm, "")
    .replace(/©\s*\d{4}\s*College Board.*$/gm, "")
    .replace(/-- \d+ of \d+ --/g, "")
    .replace(/AP\s+\w+(?:\s+\w+)?\s+\d{4}\s*◼\s*FREE-RESPONSE\s+QUESTIONS/g, "");

  // Question stems (A/B/C parts) — count "(A)" or "Part A" or "Question 1"
  const multiPartStems = (stripped.match(/\b\(?[Aa]\)?\.\s+(?:Identify|Describe|Explain|State|Compare|Calculate|Evaluate)\b/g) || []).length;

  // Source citations in CB strict format: "Source: <Author>, <occupation>, <type>, <year>"
  const cbSources = (stripped.match(/Source:\s*[A-Z][^,]+,\s*[^,]+,\s*[^,]+,\s*\d{3,4}/g) || []).length;

  // Visual references — "the map", "the cartoon", "shown above", etc.
  const visualRefs = (stripped.match(/\b(?:the\s+(?:map|chart|graph|cartoon|photograph|image|diagram|figure|table)\b|shown\s+above|depicted\s+in)\b/gi) || []).length;

  // Italicized passages — proxy for primary-source quotes
  const italicizedQuotes = (stripped.match(/[""][^""]{50,500}[""]/g) || []).length;

  // Word count
  const words = stripped.split(/\s+/).filter(Boolean).length;

  // Sample stem lengths — pull all "(A)" through "(C)" passages and count
  // the chars between them as stem length proxies.
  const stemMatches = stripped.match(/\([Aa]\)[^()]{30,500}\([Bb]\)/g) || [];
  const avgStemLen = stemMatches.length > 0
    ? Math.round(stemMatches.reduce((s, m) => s + m.length, 0) / stemMatches.length)
    : 0;

  return {
    words,
    multiPartStems,
    cbSources,
    visualRefs,
    italicizedQuotes,
    avgStemLen,
    stems: stemMatches.length,
  };
}

const PHANTOM_VISUAL = /\bthe\s+(?:map|image|graph|chart|photograph|cartoon|diagram|figure|illustration|drawing)\b|\bshown\s+above\b|\bdepicted\s+in\b/i;
const STALE_LETTER = /\b[A-E]\s+(?:is|was)\s+(?:correct|wrong|incorrect|right)\b|\b(?:the\s+)?correct\s+answer\s+(?:is|was)\s*[\(\[]?[A-E]\b/i;
const CB_SOURCE = /Source:\s*[A-Z][^,]+,\s*[^,]+,\s*[^,]+,\s*\d{3,4}/;
const HEDGING = /\b(best|most|primary|primarily|chiefly|main)\b/i;
const HEDGING_ANCHOR = /\b(according to|per|defined by|specified in)\b/i;

function hasVisualContent(s) {
  if (!s) return false;
  if (/\|\s*[^|\n]+\s*\|/m.test(s) && /\n\s*\|/.test(s)) return true;
  if (/\$[^$\n]+\$/.test(s) || /\$\$[\s\S]+\$\$/.test(s)) return true;
  if (/```[\s\S]+```/.test(s)) return true;
  if (/[→⇌⇄↔]/.test(s)) return true;
  if (/[—–-]\s*[A-Z][a-zA-Z .]+,\s*\d{3,4}/.test(s)) return true;
  if (/\d+(\.\d+)?\s*(mol|mL|kg|g|cm|m\/s|°C|kJ|N|Pa|atm|ppm|Hz|V|A|Ω|J|W)/i.test(s)) return true;
  return false;
}

async function auditCourse(course) {
  console.log(`\n=== ${course} ===`);

  // 1. Load CB content
  const cb = await loadCBContent(course);
  if (cb.length === 0) {
    console.log(`  no CB PDFs found — skipping`);
    return null;
  }
  console.log(`  CB sources: ${cb.length} files`);

  // 2. Compute aggregate CB metrics
  const cbAgg = cb.reduce((acc, c) => {
    const m = computeMetrics(c.text);
    return {
      words: acc.words + m.words,
      multiPartStems: acc.multiPartStems + m.multiPartStems,
      cbSources: acc.cbSources + m.cbSources,
      visualRefs: acc.visualRefs + m.visualRefs,
      italicizedQuotes: acc.italicizedQuotes + m.italicizedQuotes,
      stems: acc.stems + m.stems,
      stemLenSum: acc.stemLenSum + (m.avgStemLen * m.stems),
    };
  }, { words: 0, multiPartStems: 0, cbSources: 0, visualRefs: 0, italicizedQuotes: 0, stems: 0, stemLenSum: 0 });

  const cbMetrics = {
    sourceFiles: cb.length,
    totalWords: cbAgg.words,
    multiPartStems: cbAgg.multiPartStems,
    cbSourceCitations: cbAgg.cbSources,
    visualReferences: cbAgg.visualRefs,
    italicizedQuotes: cbAgg.italicizedQuotes,
    avgStemLen: cbAgg.stems > 0 ? Math.round(cbAgg.stemLenSum / cbAgg.stems) : 0,
    multiPartStemsPer1k: cbAgg.words > 0 ? (cbAgg.multiPartStems / cbAgg.words * 1000).toFixed(2) : "0",
    cbSourcesPer1k: cbAgg.words > 0 ? (cbAgg.cbSources / cbAgg.words * 1000).toFixed(2) : "0",
    visualRefsPer1k: cbAgg.words > 0 ? (cbAgg.visualRefs / cbAgg.words * 1000).toFixed(2) : "0",
  };

  // 3. Sample prod MCQs
  const rows = await sql`
    SELECT id, course, "questionText", stimulus, options, "correctAnswer",
           explanation, difficulty, unit, "stimulusImageUrl"
    FROM questions
    WHERE course = ${course}::"ApCourse" AND "isApproved" = true AND "questionType" = 'MCQ'
    ORDER BY RANDOM()
    LIMIT ${SAMPLE_SIZE}
  `;
  if (rows.length === 0) {
    console.log(`  no prod MCQs — skipping`);
    return null;
  }
  console.log(`  prod MCQ sample: ${rows.length}`);

  // 4. Prod metrics
  let prodWordsTotal = 0;
  let prodMultiPart = 0;
  let prodCBSources = 0;
  let prodVisualRefs = 0;
  let prodImages = 0;
  let prodVisualContent = 0;
  let prodPhantomVisual = 0;
  let prodStaleLetter = 0;
  let prodHedgingUnanchored = 0;
  let stimLens = [];
  let stemLens = [];
  let explLens = [];

  for (const r of rows) {
    const stim = r.stimulus ?? "";
    const stem = r.questionText ?? "";
    const expl = r.explanation ?? "";
    stimLens.push(stim.length);
    stemLens.push(stem.length);
    explLens.push(expl.length);
    prodWordsTotal += stim.split(/\s+/).filter(Boolean).length + stem.split(/\s+/).filter(Boolean).length;
    if (/\(A\).+\(B\)/.test(stem)) prodMultiPart++;
    if (CB_SOURCE.test(stim)) prodCBSources++;
    if (PHANTOM_VISUAL.test(stim)) prodVisualRefs++;
    if (r.stimulusImageUrl) prodImages++;
    if (hasVisualContent(stim)) prodVisualContent++;
    if (PHANTOM_VISUAL.test(stim) && !r.stimulusImageUrl) prodPhantomVisual++;
    if (STALE_LETTER.test(expl)) prodStaleLetter++;
    if (HEDGING.test(stem) && !HEDGING_ANCHOR.test(stem)) prodHedgingUnanchored++;
  }

  const avg = (a) => Math.round(a.reduce((s, x) => s + x, 0) / a.length);

  // 5. Build report
  const today = new Date().toISOString().slice(0, 10);
  const lines = [];
  lines.push(`# ${course} — CB-grounded gap audit (${today})`);
  lines.push(``);
  lines.push(`Compares ${SAMPLE_SIZE} random approved MCQs from prod DB vs ${cb.length} actual College Board released PDFs (locally extracted).`);
  lines.push(``);
  lines.push(`## CB content reference (what the real exam looks like)`);
  lines.push(``);
  lines.push(`| Metric | Value | Per 1k words |`);
  lines.push(`|---|---:|---:|`);
  lines.push(`| Total words across CB sources | ${cbMetrics.totalWords.toLocaleString()} | — |`);
  lines.push(`| Multi-part stems (A/B/C) | ${cbMetrics.multiPartStems} | ${cbMetrics.multiPartStemsPer1k} |`);
  lines.push(`| CB-strict source citations | ${cbMetrics.cbSourceCitations} | ${cbMetrics.cbSourcesPer1k} |`);
  lines.push(`| Visual references (map/chart/cartoon/etc.) | ${cbMetrics.visualReferences} | ${cbMetrics.visualRefsPer1k} |`);
  lines.push(`| Italicized primary-source quotes | ${cbMetrics.italicizedQuotes} | — |`);
  lines.push(`| Avg multi-part stem length (chars) | ${cbMetrics.avgStemLen} | — |`);
  lines.push(``);
  lines.push(`## Our prod content (sampled ${rows.length} MCQs)`);
  lines.push(``);
  lines.push(`| Metric | Our value | Gap vs CB |`);
  lines.push(`|---|---:|---|`);
  lines.push(`| Avg stimulus length (chars) | ${avg(stimLens)} | ${cbMetrics.avgStemLen ? "CB stems avg " + cbMetrics.avgStemLen : "n/a"} |`);
  lines.push(`| Avg stem length (chars) | ${avg(stemLens)} | — |`);
  lines.push(`| Avg explanation length (chars) | ${avg(explLens)} | — |`);
  lines.push(`| Multi-part stems | ${prodMultiPart}/${rows.length} | CB has ${cbMetrics.multiPartStems} multi-part across ${cb.length} files. ${prodMultiPart === 0 ? "❌ Our MCQs are single-part only — CB FRQs are multi-part" : "✅"} |`);
  lines.push(`| CB-strict source citations | ${prodCBSources}/${rows.length} | CB has ${cbMetrics.cbSourceCitations} citations. ${prodCBSources === 0 && cbMetrics.cbSourceCitations > 0 ? "❌ We don't use CB source format" : "✅"} |`);
  lines.push(`| Visual references | ${prodVisualRefs}/${rows.length} | CB has ${cbMetrics.visualReferences}. ${prodVisualRefs > 0 && prodImages === 0 ? "⚠ We reference visuals but have no images" : ""} |`);
  lines.push(`| Real images (stimulusImageUrl) | ${prodImages}/${rows.length} | ${prodImages === 0 ? "❌ Zero images platform-wide" : "✅"} |`);
  lines.push(`| Visual-content stimuli (table/KaTeX/code/etc.) | ${prodVisualContent}/${rows.length} | — |`);
  lines.push(`| Phantom-visual references (refs visual w/o image) | ${prodPhantomVisual}/${rows.length} | ${prodPhantomVisual > 0 ? "⚠ confusing for student" : "✅"} |`);
  lines.push(`| Stale-letter explanation leak | ${prodStaleLetter}/${rows.length} | ${prodStaleLetter > 0 ? "❌ shuffle damage remnant" : "✅"} |`);
  lines.push(`| Unanchored hedging in stem | ${prodHedgingUnanchored}/${rows.length} | ${prodHedgingUnanchored > 0 ? "⚠ best/most without anchor" : "✅"} |`);
  lines.push(``);
  lines.push(`## CB content excerpt (first 1k chars from largest file)`);
  lines.push(``);
  if (cb.length > 0) {
    const largest = cb.reduce((a, b) => b.text.length > a.text.length ? b : a);
    lines.push(`From \`${largest.source}\`:`);
    lines.push(``);
    lines.push("```");
    lines.push(largest.text.slice(0, 1000).replace(/\n{2,}/g, "\n"));
    lines.push("```");
  }
  lines.push(``);
  lines.push(`## Our content samples (3 random MCQs in full)`);
  lines.push(``);
  for (let i = 0; i < Math.min(3, rows.length); i++) {
    const r = rows[i];
    lines.push(`### Sample ${i + 1} — ${r.id.slice(0, 10)} [${r.difficulty} | ${r.unit}]`);
    lines.push(``);
    if (r.stimulus) {
      lines.push(`**Stimulus:** ${r.stimulus.slice(0, 400)}`);
      lines.push(``);
    }
    lines.push(`**Question:** ${r.questionText.slice(0, 300)}`);
    lines.push(``);
    lines.push(`**Correct:** ${r.correctAnswer} · **Explanation:** ${(r.explanation ?? "").slice(0, 250)}`);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  await mkdir("docs", { recursive: true });
  const outPath = `docs/cb-grounded-gap-${course}-${today}.md`;
  await writeFile(outPath, lines.join("\n"));
  console.log(`  → ${outPath}`);

  return {
    course,
    cbFiles: cb.length,
    cbWords: cbMetrics.totalWords,
    cbMultiPart: cbMetrics.multiPartStems,
    cbSources: cbMetrics.cbSourceCitations,
    cbVisualRefs: cbMetrics.visualReferences,
    sampleSize: rows.length,
    avgStimLen: avg(stimLens),
    avgStemLen: avg(stemLens),
    avgExplLen: avg(explLens),
    prodMultiPart,
    prodCBSources,
    prodVisualRefs,
    prodImages,
    prodVisualContent,
    prodPhantomVisual,
    prodStaleLetter,
  };
}

(async () => {
  console.log(`\n📊 CB-grounded gap audit — sample size: ${SAMPLE_SIZE}\n`);

  const courses = courseFilter ? [courseFilter] : AP_COURSES;
  const aggregates = [];
  for (const c of courses) {
    const a = await auditCourse(c);
    if (a) aggregates.push(a);
  }

  // Aggregate report
  const today = new Date().toISOString().slice(0, 10);
  const lines = [];
  lines.push(`# All-AP CB-grounded gap audit — ${today}`);
  lines.push(``);
  lines.push(`Sample: ${SAMPLE_SIZE} random approved MCQs per course, compared against locally-stored CB 2025 + older PDFs.`);
  lines.push(``);
  lines.push(`## Cross-course summary`);
  lines.push(``);
  lines.push(`| Course | CB files | CB words | CB multi-part | CB sources | Sample n | Multi-part | CB-src | Image | Phantom | Stale |`);
  lines.push(`|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|`);
  for (const a of aggregates) {
    lines.push(
      `| ${a.course} | ${a.cbFiles} | ${a.cbWords.toLocaleString()} ` +
      `| ${a.cbMultiPart} | ${a.cbSources} | ${a.sampleSize} ` +
      `| ${a.prodMultiPart} | ${a.prodCBSources} | ${a.prodImages} ` +
      `| ${a.prodPhantomVisual} | ${a.prodStaleLetter} |`
    );
  }
  lines.push(``);
  lines.push(`## Per-course details`);
  lines.push(``);
  for (const a of aggregates) {
    lines.push(`- [\`${a.course}\`](cb-grounded-gap-${a.course}-${today}.md)`);
  }
  lines.push(``);
  lines.push(`## Top gaps surfaced`);
  lines.push(``);
  const noImages = aggregates.filter((a) => a.prodImages === 0);
  const noCBSources = aggregates.filter((a) => a.prodCBSources === 0 && a.cbSources > 5);
  const noMultiPart = aggregates.filter((a) => a.prodMultiPart === 0 && a.cbMultiPart > 5);
  const phantomVisuals = aggregates.filter((a) => a.prodPhantomVisual > 0);
  lines.push(`- **${noImages.length}/${aggregates.length} courses have 0 real images** despite CB heavy visual use.`);
  lines.push(`- **${noCBSources.length}/${aggregates.length} courses have 0 CB-strict source citations** despite CB using them.`);
  lines.push(`- **${noMultiPart.length}/${aggregates.length} courses have 0 multi-part stems** in MCQ sample (expected — multi-part is FRQ feature).`);
  lines.push(`- **${phantomVisuals.length}/${aggregates.length} courses have phantom-visual stimuli** (refs visual w/o image).`);

  const aggPath = `docs/cb-grounded-all-AP-${today}.md`;
  await writeFile(aggPath, lines.join("\n"));
  console.log(`\n✅ Cross-course report: ${aggPath}`);
  console.log(`   Per-course: docs/cb-grounded-gap-*-${today}.md`);
})().catch((e) => { console.error("Fatal:", e); process.exit(1); });
