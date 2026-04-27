#!/usr/bin/env node
/**
 * Stage 3 of the AP-quality fix sprint (Beta 8.6).
 *
 * Scores every approved MCQ across all 24 AP courses (and SAT/ACT/CLEP)
 * using the question-style-scorer rubric. Outputs:
 *   - Per-course summary: % standard / % salvageable / % regen
 *   - Top 10 most-common issues per course
 *   - Worst 50 question IDs per course (for Stage 4 regen)
 *   - Full JSON dump to data/question-quality-audit-YYYY-MM-DD.json
 *
 * Usage:
 *   node scripts/audit-question-quality.mjs                  # all courses
 *   node scripts/audit-question-quality.mjs AP_CHEMISTRY     # one course
 */

import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

// Inline the scorer logic since this is a node script (not transpiled)
// — duplicate of src/lib/question-style-scorer.ts to avoid TS import overhead.
const QUANT = new Set([
  "AP_CHEMISTRY", "AP_PHYSICS_1", "AP_PHYSICS_2",
  "AP_PHYSICS_C_MECHANICS", "AP_PHYSICS_C_ELECTRICITY",
  "AP_BIOLOGY", "AP_STATISTICS",
  "AP_CALCULUS_AB", "AP_CALCULUS_BC", "AP_PRECALCULUS",
  "SAT_MATH", "ACT_MATH", "ACT_SCIENCE",
]);

function parseOpts(o) {
  if (!o) return [];
  if (Array.isArray(o)) return o;
  try { return JSON.parse(o); } catch { return []; }
}

function score(q) {
  const issues = [];
  const b = { stim: 0, stem: 0, opts: 0, cog: 0, len: 0 };
  const isQ = QUANT.has(q.course);

  // Stimulus
  const sl = (q.stimulus ?? "").length;
  if (isQ) {
    if (sl < 30) { b.stim = 0; issues.push("missing_stimulus_quant"); }
    else if (sl < 80) { b.stim = 1; issues.push("stimulus_too_short"); }
    else if (sl > 400) { b.stim = 1; issues.push("stimulus_too_long"); }
    else b.stim = 2;
  } else {
    if (sl === 0) b.stim = 2;
    else if (sl >= 30 && sl <= 400) b.stim = 2;
    else if (sl > 400) { b.stim = 1; issues.push("stimulus_too_long"); }
    else { b.stim = 1; issues.push("stimulus_too_short"); }
  }

  // Stem
  const stemL = q.questionText.length;
  if (stemL < 50) { b.stem = 0; issues.push("stem_too_short"); }
  else if (stemL > 250) { b.stem = 0; issues.push("stem_too_long"); }
  else if (stemL > 180) { b.stem = 1; issues.push("stem_long"); }
  else b.stem = 2;
  if (/\b(best|most|primary|primarily|chiefly|main)\b/i.test(q.questionText)
      && !/\b(according to|per|defined by|specified in)\b/i.test(q.questionText)) {
    issues.push("hedging_unanchored");
    if (b.stem === 2) b.stem = 1;
  }

  // Options
  const opts = parseOpts(q.options);
  if (opts.length < 2) { b.opts = 0; issues.push("options_invalid"); }
  else {
    const lens = opts.map((o) => o.length);
    const avg = lens.reduce((s, n) => s + n, 0) / lens.length;
    const max = Math.max(...lens);
    if (avg < 12) { b.opts = 0; issues.push("options_too_terse"); }
    else if (max > 120) { b.opts = 1; issues.push("options_too_long"); }
    else if (avg > 80) { b.opts = 1; issues.push("options_long"); }
    else b.opts = 2;
  }

  // Cognitive
  const stem = q.questionText;
  const calc = /\b(calculate|compute|determine|find|derive|solve)\b/i.test(stem);
  const contr = /\b(compare|contrast|differs|unlike|whereas|both|either)\b/i.test(stem);
  const multi = /\b(then|next|after|finally)\b/i.test(stem);
  const recall = /^(which|what|identify|name)\b/i.test(stem.trim());
  if (q.difficulty === "HARD") {
    if (recall && !calc && !contr && !multi) { b.cog = 0; issues.push("hard_but_recall_style"); }
    else if (calc || contr || multi) b.cog = 2;
    else b.cog = 1;
  } else if (q.difficulty === "MEDIUM") {
    if (calc || contr) b.cog = 2;
    else b.cog = 1;
  } else {
    b.cog = 2;
  }

  // Length + letter-leak
  const eL = q.explanation.length;
  if (eL < 100) { b.len = 0; issues.push("explanation_too_short"); }
  else if (eL > 600) { b.len = 0; issues.push("explanation_too_long"); }
  else if (eL > 450) { b.len = 1; issues.push("explanation_long"); }
  else b.len = 2;
  if (/\b[A-E]\s+(?:is|was)\s+(?:correct|wrong|incorrect|right)\b/i.test(q.explanation)) {
    issues.push("explanation_letter_ref_leak");
    if (b.len === 2) b.len = 1;
  }

  const total = b.stim + b.stem + b.opts + b.cog + b.len;
  const bucket = total >= 7 ? "standard" : total >= 5 ? "salvageable" : "regen";
  return { score: total, breakdown: b, issues, bucket };
}

(async () => {
  const sql = neon(process.env.DATABASE_URL);
  const onlyCourse = process.argv[2];
  console.log(`\n🔍 Stage 3 — bulk question quality audit ${onlyCourse ? `(${onlyCourse})` : "(all courses)"}\n`);

  const rows = onlyCourse
    ? await sql`
        SELECT id, course, "questionText", stimulus, options, "correctAnswer", explanation, difficulty, topic
        FROM questions
        WHERE "questionType" = 'MCQ' AND "isApproved" = true AND course = ${onlyCourse}::"ApCourse"
      `
    : await sql`
        SELECT id, course, "questionText", stimulus, options, "correctAnswer", explanation, difficulty, topic
        FROM questions
        WHERE "questionType" = 'MCQ' AND "isApproved" = true
      `;
  console.log(`Loaded ${rows.length} MCQs.\n`);

  // Per-course aggregation
  const perCourse = {};
  for (const q of rows) {
    if (!perCourse[q.course]) {
      perCourse[q.course] = {
        course: q.course,
        total: 0, standard: 0, salvageable: 0, regen: 0,
        issues: {}, worstIds: [],
      };
    }
    const c = perCourse[q.course];
    const s = score(q);
    c.total++;
    c[s.bucket]++;
    for (const iss of s.issues) c.issues[iss] = (c.issues[iss] || 0) + 1;
    c.worstIds.push({ id: q.id, score: s.score, bucket: s.bucket, issues: s.issues });
  }

  // Sort + trim worstIds per course
  for (const c of Object.values(perCourse)) {
    c.worstIds.sort((a, b) => a.score - b.score);
    c.worstIds = c.worstIds.slice(0, 50);
  }

  // Print per-course summary
  console.log(`${"course".padEnd(35)} ${"total".padStart(5)} ${"std%".padStart(6)} ${"salv%".padStart(6)} ${"regen%".padStart(7)}`);
  console.log("─".repeat(70));
  const sorted = Object.values(perCourse).sort((a, b) => (a.standard / a.total) - (b.standard / b.total));
  for (const c of sorted) {
    const stdPct = ((c.standard / c.total) * 100).toFixed(1);
    const salvPct = ((c.salvageable / c.total) * 100).toFixed(1);
    const regenPct = ((c.regen / c.total) * 100).toFixed(1);
    console.log(`${c.course.padEnd(35)} ${String(c.total).padStart(5)} ${stdPct.padStart(5)}% ${salvPct.padStart(5)}% ${regenPct.padStart(6)}%`);
  }

  // Top issues across all courses
  const allIssues = {};
  for (const c of Object.values(perCourse)) {
    for (const [iss, n] of Object.entries(c.issues)) {
      allIssues[iss] = (allIssues[iss] || 0) + n;
    }
  }
  console.log(`\n=== TOP 10 ISSUES ACROSS ALL COURSES ===`);
  Object.entries(allIssues)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([iss, n]) => console.log(`  ${String(n).padStart(5)}× ${iss}`));

  // Per-course top issues
  console.log(`\n=== TOP 5 ISSUES PER COURSE ===`);
  for (const c of sorted) {
    const top5 = Object.entries(c.issues).sort(([, a], [, b]) => b - a).slice(0, 5);
    if (top5.length === 0) continue;
    console.log(`\n${c.course}:`);
    for (const [iss, n] of top5) console.log(`  ${String(n).padStart(4)}× ${iss}`);
  }

  // Aggregate
  const totals = Object.values(perCourse).reduce(
    (acc, c) => ({
      total: acc.total + c.total,
      standard: acc.standard + c.standard,
      salvageable: acc.salvageable + c.salvageable,
      regen: acc.regen + c.regen,
    }),
    { total: 0, standard: 0, salvageable: 0, regen: 0 },
  );
  console.log(`\n=== AGGREGATE ===`);
  console.log(`  Total MCQs: ${totals.total}`);
  console.log(`  Standard (≥7/10): ${totals.standard} (${((totals.standard / totals.total) * 100).toFixed(1)}%)`);
  console.log(`  Salvageable (5-6/10): ${totals.salvageable} (${((totals.salvageable / totals.total) * 100).toFixed(1)}%)`);
  console.log(`  Need regen (<5/10): ${totals.regen} (${((totals.regen / totals.total) * 100).toFixed(1)}%)`);

  // Write JSON dump
  const today = new Date().toISOString().slice(0, 10);
  const outPath = `data/question-quality-audit-${today}.json`;
  await writeFile(outPath, JSON.stringify({
    runAt: new Date().toISOString(),
    aggregate: totals,
    perCourse: Object.values(perCourse),
  }, null, 2));
  console.log(`\n📝 Full report: ${outPath}`);
})().catch((e) => { console.error("Fatal:", e); process.exit(1); });
