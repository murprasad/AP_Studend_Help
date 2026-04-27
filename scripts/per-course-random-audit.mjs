#!/usr/bin/env node
/**
 * Per-course random audit — mirrors AP_WORLD_HISTORY 2025 gap analysis
 * methodology (`docs/AP_WH_GAP_ANALYSIS_2026-04-27.md`) but applied to
 * any course on demand.
 *
 * Per user directive 2026-04-27: "Once you are done, do a random audit just
 * like I did." After Pass 2 sweep, sample 30 random MCQs per course and
 * score against CB-style rubric.
 *
 * Output per course: docs/per-course-audit-<COURSE>-<DATE>.md
 * Output aggregate: docs/all-courses-audit-<DATE>.md
 *
 * Usage:
 *   node scripts/per-course-random-audit.mjs              # all AP courses
 *   node scripts/per-course-random-audit.mjs AP_CHEMISTRY # one course
 *   node scripts/per-course-random-audit.mjs --all        # AP + SAT + ACT
 */

import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const all = args.includes("--all");
const courseFilter = args.find((a) => a.startsWith("AP_") || a.startsWith("SAT_") || a.startsWith("ACT_"));
const SAMPLE_SIZE = parseInt(args.find((a, i) => args[i - 1] === "--sample") ?? "30", 10);

const VISUAL_REQUIRED = new Set([
  "AP_STATISTICS", "AP_CALCULUS_AB", "AP_CALCULUS_BC", "AP_PRECALCULUS",
  "AP_PHYSICS_1", "AP_CHEMISTRY", "AP_BIOLOGY",
  "AP_HUMAN_GEOGRAPHY", "AP_US_HISTORY", "AP_WORLD_HISTORY",
  "AP_ENVIRONMENTAL_SCIENCE", "AP_COMPUTER_SCIENCE_PRINCIPLES",
  "SAT_MATH", "ACT_MATH", "ACT_SCIENCE",
]);

// CB-style markers (same heuristics used in cross-course audit)
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

function hasMultiPart(stem) {
  return /\(A\).+\(B\)/i.test(stem) || /\bpart\s+[A-D]\b/i.test(stem) || /\bidentify\b.+\bdescribe\b/i.test(stem);
}

const PHANTOM_VISUAL = /\bthe\s+(?:map|image|graph|chart|photograph|cartoon|diagram|figure|illustration|drawing)\b|\bshown\s+above\b|\bdepicted\s+in\b/i;

const STALE_LETTER = /\b[A-E]\s+(?:is|was)\s+(?:correct|wrong|incorrect|right)\b|\bWhy\s+[A-E]\s|\b(?:the\s+)?correct\s+answer\s+(?:is|was|would\s+be|here\s+is|=)\s*[\(\[]?[A-E]\b|\b(?:the\s+)?answer\s+(?:is|was|would\s+be|here\s+is|=)\s*[\(\[]?[A-E]\b|\bcorrect\s+answer[,\s]+[A-E]\b|\bOption\s+[A-E]\b|\bChoice\s+[A-E]\b|\bAnswer\s+[A-E]\b/i;

const CB_SOURCE = /Source:\s*[A-Z][^,]+,\s*[^,]+,\s*[^,]+,\s*\d{3,4}/;

const HEDGING = /\b(best|most|primary|primarily|chiefly|main)\b/i;
const HEDGING_ANCHOR = /\b(according to|per|defined by|specified in)\b/i;

// Score a single sample row.
function scoreSample(r) {
  const s = r.stimulus ?? "";
  const stem = r.questionText ?? "";
  const expl = r.explanation ?? "";
  return {
    stimLen: s.length,
    stemLen: stem.length,
    explLen: expl.length,
    hasVisual: hasVisualContent(s),
    visualRequired: VISUAL_REQUIRED.has(r.course),
    multiPart: hasMultiPart(stem),
    phantomVisual: PHANTOM_VISUAL.test(s) && !r.stimulusImageUrl,
    hasImage: !!r.stimulusImageUrl,
    cbSource: CB_SOURCE.test(s),
    staleLetter: STALE_LETTER.test(expl),
    hedgingUnanchored: HEDGING.test(stem) && !HEDGING_ANCHOR.test(stem),
    explEmpty: expl.trim().length === 0,
    options: r.options,
  };
}

async function auditCourse(course) {
  console.log(`\n=== ${course} ===`);

  const rows = await sql`
    SELECT id, course, "questionType", "questionText", stimulus, options,
           "correctAnswer", explanation, difficulty, unit, topic, "stimulusImageUrl"
    FROM questions
    WHERE course = ${course}::"ApCourse" AND "isApproved" = true AND "questionType" = 'MCQ'
    ORDER BY RANDOM()
    LIMIT ${SAMPLE_SIZE}
  `;
  if (rows.length === 0) {
    console.log(`  no MCQs found.`);
    return null;
  }

  const scores = rows.map(scoreSample);

  // Aggregate
  const agg = {
    course,
    sampleSize: rows.length,
    avgStimLen: Math.round(scores.reduce((a, x) => a + x.stimLen, 0) / scores.length),
    avgStemLen: Math.round(scores.reduce((a, x) => a + x.stemLen, 0) / scores.length),
    avgExplLen: Math.round(scores.reduce((a, x) => a + x.explLen, 0) / scores.length),
    visualRequired: VISUAL_REQUIRED.has(course),
    withVisualContent: scores.filter((x) => x.hasVisual).length,
    withImage: scores.filter((x) => x.hasImage).length,
    multiPart: scores.filter((x) => x.multiPart).length,
    phantomVisual: scores.filter((x) => x.phantomVisual).length,
    cbSource: scores.filter((x) => x.cbSource).length,
    staleLetter: scores.filter((x) => x.staleLetter).length,
    hedgingUnanchored: scores.filter((x) => x.hedgingUnanchored).length,
    explEmpty: scores.filter((x) => x.explEmpty).length,
  };

  // Markdown report
  const today = new Date().toISOString().slice(0, 10);
  const lines = [];
  lines.push(`# ${course} — random audit (${today})`);
  lines.push(``);
  lines.push(`Sample size: **${agg.sampleSize}** random approved MCQs`);
  lines.push(``);
  lines.push(`## Quantitative scorecard`);
  lines.push(``);
  lines.push(`| Dimension | Value | CB target | Gap |`);
  lines.push(`|---|---:|---|---|`);
  lines.push(`| Avg stimulus length | ${agg.avgStimLen} chars | 60-200 (CB) | ${agg.avgStimLen < 30 ? "❌ too short" : agg.avgStimLen > 400 ? "❌ too long" : agg.avgStimLen >= 60 ? "✅" : "⚠ thin"} |`);
  lines.push(`| Avg stem length | ${agg.avgStemLen} chars | 50-180 | ${agg.avgStemLen < 50 ? "❌ too short" : agg.avgStemLen > 180 ? "❌ too long" : "✅"} |`);
  lines.push(`| Avg explanation length | ${agg.avgExplLen} chars | 100-450 (40-80 words) | ${agg.avgExplLen < 100 ? "❌ too short" : agg.avgExplLen > 600 ? "❌ too long" : "✅"} |`);
  lines.push(`| Stimuli with visual content (table/KaTeX/code/etc.) | ${agg.withVisualContent}/${agg.sampleSize} | ${agg.visualRequired ? "≥70% (visual-required course)" : "depends"} | ${agg.visualRequired && agg.withVisualContent / agg.sampleSize < 0.5 ? "❌ visual-required but mostly text" : "✅"} |`);
  lines.push(`| Stimuli with real image (stimulusImageUrl) | ${agg.withImage}/${agg.sampleSize} | 25-60% on visual-heavy CB exams | ${agg.withImage === 0 ? "❌ no images" : "⚠"} |`);
  lines.push(`| Multi-part stems (A/B/C) | ${agg.multiPart}/${agg.sampleSize} | rare in MCQ, common in FRQ | ${agg.multiPart > 0 ? "✅" : "ℹ MCQ-style — OK"} |`);
  lines.push(`| Phantom-visual stimuli (refs image, none present) | ${agg.phantomVisual}/${agg.sampleSize} | 0 | ${agg.phantomVisual > 0 ? "⚠ confusing" : "✅"} |`);
  lines.push(`| CB-strict source format | ${agg.cbSource}/${agg.sampleSize} | 25-50% on history/lit/ELA | ${agg.cbSource === 0 ? "❌ no CB-format sources" : "✅"} |`);
  lines.push(`| Stale-letter explanation leak | ${agg.staleLetter}/${agg.sampleSize} | 0 | ${agg.staleLetter > 0 ? "❌ shuffle damage" : "✅"} |`);
  lines.push(`| Unanchored hedging in stem | ${agg.hedgingUnanchored}/${agg.sampleSize} | 0 | ${agg.hedgingUnanchored > 0 ? "⚠ best/most without anchor" : "✅"} |`);
  lines.push(`| Empty explanations | ${agg.explEmpty}/${agg.sampleSize} | 0 | ${agg.explEmpty > 0 ? "❌ blank" : "✅"} |`);
  lines.push(``);

  lines.push(`## Sample 5 questions in full`);
  lines.push(``);
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const r = rows[i];
    lines.push(`### Sample ${i + 1} — ${r.id.slice(0, 10)} [${r.difficulty} | ${r.unit}]`);
    lines.push(``);
    if (r.stimulus) {
      lines.push(`**Stimulus** (${r.stimulus.length} chars):`);
      lines.push(`> ${r.stimulus.replace(/\n/g, "\n> ")}`);
      lines.push(``);
    }
    lines.push(`**Question** (${r.questionText.length} chars): ${r.questionText}`);
    lines.push(``);
    const opts = typeof r.options === "string" ? JSON.parse(r.options) : (r.options ?? []);
    if (Array.isArray(opts)) {
      lines.push(`**Options:**`);
      for (const o of opts) lines.push(`- ${o}`);
      lines.push(``);
    }
    lines.push(`**Correct:** ${r.correctAnswer}`);
    lines.push(``);
    lines.push(`**Explanation** (${(r.explanation ?? "").length} chars): ${r.explanation}`);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  const outPath = `docs/per-course-audit-${course}-${today}.md`;
  await writeFile(outPath, lines.join("\n"));
  console.log(`  → ${outPath}`);

  return agg;
}

(async () => {
  console.log(`\n📋 Per-course random audit (sample size: ${SAMPLE_SIZE})\n`);

  let courses;
  if (courseFilter) {
    courses = [courseFilter];
  } else if (all) {
    const distinct = await sql`SELECT DISTINCT course FROM questions WHERE "isApproved" = true ORDER BY course`;
    courses = distinct.filter((c) => c.course.startsWith("AP_") || c.course.startsWith("SAT_") || c.course.startsWith("ACT_")).map((c) => c.course);
  } else {
    const distinct = await sql`SELECT DISTINCT course FROM questions WHERE "isApproved" = true ORDER BY course`;
    courses = distinct.filter((c) => c.course.startsWith("AP_")).map((c) => c.course);
  }
  console.log(`Auditing ${courses.length} courses...\n`);

  const aggregates = [];
  for (const c of courses) {
    const a = await auditCourse(c);
    if (a) aggregates.push(a);
  }

  // Aggregate report
  const today = new Date().toISOString().slice(0, 10);
  const aggLines = [];
  aggLines.push(`# Cross-course random audit — ${today}`);
  aggLines.push(``);
  aggLines.push(`Sample size per course: ${SAMPLE_SIZE} random approved MCQs.`);
  aggLines.push(``);
  aggLines.push(`## Cross-course scorecard`);
  aggLines.push(``);
  aggLines.push(`| Course | n | Avg stim | Avg stem | Avg expl | Visual | Image | Multi-part | Phantom | CB-src | Stale | Hedge | Empty |`);
  aggLines.push(`|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|`);
  for (const a of aggregates) {
    aggLines.push(
      `| ${a.course} | ${a.sampleSize} ` +
      `| ${a.avgStimLen} | ${a.avgStemLen} | ${a.avgExplLen} ` +
      `| ${a.withVisualContent} | ${a.withImage} | ${a.multiPart} ` +
      `| ${a.phantomVisual} | ${a.cbSource} | ${a.staleLetter} | ${a.hedgingUnanchored} | ${a.explEmpty} |`
    );
  }
  aggLines.push(``);
  aggLines.push(`## Per-course details`);
  aggLines.push(``);
  for (const a of aggregates) {
    aggLines.push(`- [\`${a.course}\`](per-course-audit-${a.course}-${today}.md)`);
  }

  const aggPath = `docs/all-courses-random-audit-${today}.md`;
  await writeFile(aggPath, aggLines.join("\n"));
  console.log(`\n✅ Cross-course report: ${aggPath}`);
  console.log(`   Per-course reports: docs/per-course-audit-*-${today}.md`);
})().catch((e) => { console.error("Fatal:", e); process.exit(1); });
