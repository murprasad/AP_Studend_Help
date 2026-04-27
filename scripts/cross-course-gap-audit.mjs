#!/usr/bin/env node
/**
 * Cross-course gap audit — surfaces the same defects per-course that the
 * AP_WORLD_HISTORY 2025 gap analysis (docs/AP_WH_GAP_ANALYSIS_2026-04-27.md)
 * found, but applied to every approved course in the bank.
 *
 * Per-course dimensions:
 *   - Total approved MCQs
 *   - FRQ rows (SAQ/DBQ/LEQ/CODING) — CB exam is 30-60% FRQ; we should have any
 *   - Questions with stimulusImageUrl (visual-stimulus questions; near zero today)
 *   - Questions with empty explanation
 *   - Questions with stale letter-references (post Beta 8.5.1 strip)
 *   - Questions with stimulus shorter than 30 chars on quantitative courses
 *   - Questions with stimulus referencing visuals via heuristic ("the map", "the graph",
 *     "the cartoon", "the photograph", "shown above", "described below" — implies an
 *     image that doesn't exist)
 *   - Source-attribution coverage (count of stimuli with `Source: …, …, …, YYYY` shape —
 *     the strict CB DBQ/SAQ format)
 *
 * Output: docs/cross-course-gap-audit-YYYY-MM-DD.md with a sortable table per
 * course (AP first, SAT, ACT, CLEP, DSST). Highlights worst gaps in red text.
 *
 * Usage:
 *   node scripts/cross-course-gap-audit.mjs
 */

import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Same regex as scripts/repair-shuffle-explanations.mjs (post Beta 8.5.1).
const STALE_PATTERN = /\b[A-E]\s+(?:is|was)\s+(?:correct|wrong|incorrect|right)\b|\bWhy\s+[A-E]\s|\b(?:the\s+)?correct\s+answer\s+(?:is|was|would\s+be|here\s+is|=)\s*[\(\[]?[A-E]\b|\b(?:the\s+)?answer\s+(?:is|was|would\s+be|here\s+is|=)\s*[\(\[]?[A-E]\b|\bcorrect\s+answer[,\s]+[A-E]\b|\bOption\s+[A-E]\b|\bChoice\s+[A-E]\b|\bAnswer\s+[A-E]\b|\b(?:selecting|choosing|picking)\s+[\(\[]?[A-E]\b/i;

// Phantom-visual: stimulus claims an image but stimulusImageUrl is null.
const PHANTOM_VISUAL = /\bthe\s+(?:map|image|graph|chart|photograph|cartoon|diagram|figure|table|illustration|drawing)\b|\bshown\s+above\b|\bdepicted\s+in\b|\bbased\s+on\s+the\s+(?:map|image|graph|chart|photograph|cartoon|diagram|figure|illustration)\b/i;

// CB strict source format: "Source: <Author>, <descriptor>, <type>, <year>"
const CB_SOURCE_FORMAT = /Source:\s*[A-Z][^,]+,\s*[^,]+,\s*[^,]+,\s*\d{3,4}/;

const QUANTITATIVE = new Set([
  "AP_CHEMISTRY", "AP_PHYSICS_1", "AP_BIOLOGY", "AP_STATISTICS",
  "AP_CALCULUS_AB", "AP_CALCULUS_BC", "AP_PRECALCULUS",
  "SAT_MATH", "ACT_MATH", "ACT_SCIENCE",
]);

(async () => {
  console.log(`\n📊 Cross-course gap audit — running…\n`);

  const rows = await sql`
    SELECT id, course, "questionType", "questionText", stimulus,
           explanation, "stimulusImageUrl", "isApproved"
    FROM questions
    WHERE "isApproved" = true
  `;
  console.log(`Loaded ${rows.length} approved questions across all courses.\n`);

  const byCourse = {};
  for (const r of rows) {
    const c = r.course;
    if (!byCourse[c]) {
      byCourse[c] = {
        course: c,
        total: 0,
        mcq: 0,
        frq: 0,
        withImage: 0,
        emptyExpl: 0,
        staleLetterLeak: 0,
        thinStimQuant: 0,
        phantomVisual: 0,
        cbStyleSource: 0,
      };
    }
    const e = byCourse[c];
    e.total++;
    if (r.questionType === "MCQ") e.mcq++;
    else e.frq++;
    if (r.stimulusImageUrl) e.withImage++;
    if (!r.explanation || r.explanation.trim().length === 0) e.emptyExpl++;
    if (r.explanation && STALE_PATTERN.test(r.explanation)) e.staleLetterLeak++;
    if (QUANTITATIVE.has(c) && r.questionType === "MCQ") {
      const stimLen = (r.stimulus ?? "").length;
      if (stimLen < 30) e.thinStimQuant++;
    }
    if (r.stimulus && PHANTOM_VISUAL.test(r.stimulus) && !r.stimulusImageUrl) e.phantomVisual++;
    if (r.stimulus && CB_SOURCE_FORMAT.test(r.stimulus)) e.cbStyleSource++;
  }

  // Sort: AP first, then SAT, ACT, CLEP, DSST. Within each, by total desc.
  const order = (c) =>
    c.startsWith("AP_") ? 0 : c.startsWith("SAT_") ? 1 : c.startsWith("ACT_") ? 2 : c.startsWith("CLEP_") ? 3 : 4;
  const courses = Object.values(byCourse).sort((a, b) => {
    const oa = order(a.course), ob = order(b.course);
    return oa !== ob ? oa - ob : b.total - a.total;
  });

  // Build markdown report
  const today = new Date().toISOString().slice(0, 10);
  const lines = [];
  lines.push(`# Cross-course gap audit — ${today}`);
  lines.push(``);
  lines.push(`Methodology mirrors \`docs/AP_WH_GAP_ANALYSIS_2026-04-27.md\` but applied across every approved course in the bank. Same defects, surfaced as counts.`);
  lines.push(``);
  lines.push(`**Dimensions:**`);
  lines.push(`- **Total** — approved questions in the course bank`);
  lines.push(`- **MCQ** vs **FRQ** — CB exams are typically 50/50 by score weight; we are MCQ-heavy`);
  lines.push(`- **Image** — questions with \`stimulusImageUrl\` populated (visual literacy questions)`);
  lines.push(`- **Empty expl** — questions with no/blank explanation`);
  lines.push(`- **Stale letter** — explanation references "A is correct" or similar but DB \`correctAnswer\` may differ (Beta 8.2 shuffle damage; should be 0 after Beta 8.5.1 strip)`);
  lines.push(`- **Thin stim** — quantitative-course MCQs with stimulus shorter than 30 chars`);
  lines.push(`- **Phantom visual** — stimulus references "the map/image/graph/cartoon" but no \`stimulusImageUrl\` — student is asked to read a visual that doesn't exist`);
  lines.push(`- **CB-source** — stimuli matching the strict CB \`Source: <Author>, <descriptor>, <type>, <year>\` format`);
  lines.push(``);
  lines.push(`## Results`);
  lines.push(``);
  lines.push(`| Course | Total | MCQ | FRQ | Image | Empty Expl | Stale Letter | Thin Stim | Phantom Visual | CB-Source |`);
  lines.push(`|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|`);
  for (const e of courses) {
    lines.push(
      `| ${e.course} ` +
      `| ${e.total} | ${e.mcq} | ${e.frq} | ${e.withImage} ` +
      `| ${e.emptyExpl} | ${e.staleLetterLeak} | ${e.thinStimQuant} | ${e.phantomVisual} | ${e.cbStyleSource} |`
    );
  }

  // Aggregate row
  const agg = courses.reduce((a, e) => ({
    total: a.total + e.total, mcq: a.mcq + e.mcq, frq: a.frq + e.frq,
    withImage: a.withImage + e.withImage, emptyExpl: a.emptyExpl + e.emptyExpl,
    staleLetterLeak: a.staleLetterLeak + e.staleLetterLeak,
    thinStimQuant: a.thinStimQuant + e.thinStimQuant,
    phantomVisual: a.phantomVisual + e.phantomVisual,
    cbStyleSource: a.cbStyleSource + e.cbStyleSource,
  }), { total: 0, mcq: 0, frq: 0, withImage: 0, emptyExpl: 0, staleLetterLeak: 0, thinStimQuant: 0, phantomVisual: 0, cbStyleSource: 0 });
  lines.push(`| **TOTAL** | **${agg.total}** | **${agg.mcq}** | **${agg.frq}** | **${agg.withImage}** | **${agg.emptyExpl}** | **${agg.staleLetterLeak}** | **${agg.thinStimQuant}** | **${agg.phantomVisual}** | **${agg.cbStyleSource}** |`);
  lines.push(``);
  lines.push(`## Headline gaps`);
  lines.push(``);
  lines.push(`- **${agg.frq} of ${agg.total} (${((agg.frq / agg.total) * 100).toFixed(1)}%)** are FRQ. CB exams are ~30–60% FRQ by score weight. **Massive practice-shape mismatch.**`);
  lines.push(`- **${agg.withImage} of ${agg.total} (${((agg.withImage / agg.total) * 100).toFixed(2)}%)** have a real image. CB has document-stimulus / map / cartoon / chart in 25–60% of items. **Visual fidelity gap.**`);
  lines.push(`- **${agg.phantomVisual} of ${agg.total} (${((agg.phantomVisual / agg.total) * 100).toFixed(1)}%)** stimuli reference a visual ("the map", "shown above") but \`stimulusImageUrl\` is null. **Student is asked to read an image that doesn't exist.**`);
  lines.push(`- **${agg.staleLetterLeak} of ${agg.total} (${((agg.staleLetterLeak / agg.total) * 100).toFixed(2)}%)** explanations still leak a letter reference after Beta 8.5.1 strip. Should be ~0.`);
  lines.push(`- **${agg.cbStyleSource} of ${agg.total}** stimuli use the CB strict source format. Adoption: ${((agg.cbStyleSource / agg.total) * 100).toFixed(1)}%. **Source-attribution gap.**`);
  lines.push(``);
  lines.push(`## Worst-3 per dimension`);
  lines.push(``);
  const worstBy = (key, label) => {
    const ranked = courses
      .filter((c) => c.total > 50)
      .sort((a, b) => (key === "frq" || key === "withImage" || key === "cbStyleSource"
        ? (a[key] / a.total) - (b[key] / b.total)
        : (b[key] / b.total) - (a[key] / a.total)))
      .slice(0, 3);
    lines.push(`### ${label}`);
    for (const c of ranked) {
      const pct = ((c[key] / c.total) * 100).toFixed(1);
      lines.push(`- ${c.course}: ${c[key]} of ${c.total} (${pct}%)`);
    }
    lines.push(``);
  };
  worstBy("frq", "Fewest FRQs (by ratio)");
  worstBy("withImage", "Fewest images");
  worstBy("phantomVisual", "Most phantom-visual references");
  worstBy("staleLetterLeak", "Most leftover stale letter leaks");
  worstBy("emptyExpl", "Most empty explanations");
  worstBy("cbStyleSource", "Lowest CB-source-format adoption");

  const outPath = `docs/cross-course-gap-audit-${today}.md`;
  await writeFile(outPath, lines.join("\n"));
  console.log(`\n✅ Written: ${outPath}`);
  console.log(`\n=== HEADLINE NUMBERS ===`);
  console.log(`  Total: ${agg.total}`);
  console.log(`  FRQ: ${agg.frq} (${((agg.frq / agg.total) * 100).toFixed(1)}%)`);
  console.log(`  Images: ${agg.withImage} (${((agg.withImage / agg.total) * 100).toFixed(2)}%)`);
  console.log(`  Stale letter leaks: ${agg.staleLetterLeak} (${((agg.staleLetterLeak / agg.total) * 100).toFixed(2)}%)`);
  console.log(`  Phantom visuals: ${agg.phantomVisual} (${((agg.phantomVisual / agg.total) * 100).toFixed(1)}%)`);
})().catch((e) => { console.error("Fatal:", e); process.exit(1); });
