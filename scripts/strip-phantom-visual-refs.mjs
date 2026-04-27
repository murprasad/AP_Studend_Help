#!/usr/bin/env node
/**
 * Strip phantom-visual references from stimuli.
 *
 * The CB-grounded gap audit (2026-04-27) found that AP_CALCULUS_BC has
 * 11/30 sampled MCQs (134/495 total) where the stimulus says "the figure
 * shows..." or "the graph shown..." but no actual image is rendered.
 * Students who can't see what doesn't exist get confused.
 *
 * Two paths to fix:
 *   A) Generate matching visuals — slower, requires per-question AI
 *   B) Rewrite stimuli to remove phantom-visual language — fast, preserves
 *      descriptive content
 *
 * This script does (B). The stimuli already describe the visual
 * analytically (e.g. "Graph description: f is a continuous curve on [−2, 6].
 * Key plotted points: f(−2) = 4, f(1) = 3, ..."). Replacing "the figure
 * shows" → "consider" / "the graph shows" → "let f be defined by" makes
 * the stimulus a self-sufficient analytical setup that doesn't lie about
 * a missing image.
 *
 * Affects all courses but mostly hits visual-heavy ones (Calc BC, Calc AB,
 * Stats, Bio, Phys 1).
 *
 * Usage:
 *   node scripts/strip-phantom-visual-refs.mjs --dry        # report
 *   node scripts/strip-phantom-visual-refs.mjs              # apply
 *   node scripts/strip-phantom-visual-refs.mjs AP_CALCULUS_BC
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const courseFilter = args.find((a) => a.startsWith("AP_"));

// Order matters: more-specific replacements first.
const REWRITES = [
  // "The figure shows X" / "The figure depicts X" → "Consider X"
  [/\bThe\s+figure\s+(?:shows|depicts)\s+/gi, "Consider "],
  // "The graph of f shows X" → "Let f be the function with X"
  [/\bThe\s+graph\s+of\s+(\w+)\s+(?:shows|depicts)\s+/gi, "The function $1 has "],
  // "The graph shows X" / "The graph depicts X" → "X"
  [/\bThe\s+graph\s+(?:shows|depicts)\s+/gi, ""],
  // "The chart shows X" → "X"
  [/\bThe\s+chart\s+(?:shows|depicts)\s+/gi, ""],
  // "The diagram shows X" → "X"
  [/\bThe\s+diagram\s+(?:shows|depicts)\s+/gi, ""],
  // "Graph description:" → "" (already analytical)
  [/^Graph description:\s*/im, ""],
  [/^Diagram description:\s*/im, ""],
  // "shown above" / "depicted above" / "shown in the figure" → ""
  [/\s*\(?\s*shown\s+above\s*\)?/gi, ""],
  [/\s*\(?\s*depicted\s+above\s*\)?/gi, ""],
  [/\s*\(?\s*shown\s+in\s+the\s+figure\s*\)?/gi, ""],
  [/\s*\(?\s*depicted\s+in\s+the\s+figure\s*\)?/gi, ""],
  // "as shown in the graph" → ""
  [/\s*as\s+shown\s+in\s+the\s+(?:graph|chart|diagram|figure|map|cartoon|image)\b/gi, ""],
  [/\s*based\s+on\s+the\s+(?:graph|chart|diagram|figure|map|cartoon|image)\b/gi, ""],
  // Trailing period cleanup
  [/\s+([.,])/g, "$1"],
  [/\.{2,}/g, "."],
  [/\s{2,}/g, " "],
];

const PHANTOM_DETECT = /\bthe\s+(?:map|image|graph|chart|photograph|cartoon|diagram|figure|illustration|drawing)\b|\bshown\s+above\b|\bdepicted\s+(?:in|above)\b/i;

function rewriteStimulus(s) {
  if (!s) return s;
  let out = s;
  for (const [pattern, replacement] of REWRITES) {
    out = out.replace(pattern, replacement);
  }
  out = out.trim();
  // Capitalize first letter (handles cases where stripping "The diagram
  // shows" leaves "the replication fork..." with leading lowercase).
  if (out.length > 0 && /^[a-z]/.test(out)) {
    out = out[0].toUpperCase() + out.slice(1);
  }
  return out;
}

(async () => {
  console.log(`\n🔧 Strip phantom-visual refs ${dry ? "(DRY RUN)" : "(WRITE)"}\n`);

  const rows = courseFilter
    ? await sql`
        SELECT id, course, stimulus FROM questions
        WHERE course = ${courseFilter}::"ApCourse"
          AND "isApproved" = true
          AND "questionType" = 'MCQ'
          AND "stimulusImageUrl" IS NULL
          AND stimulus IS NOT NULL
      `
    : await sql`
        SELECT id, course, stimulus FROM questions
        WHERE "isApproved" = true
          AND "questionType" = 'MCQ'
          AND "stimulusImageUrl" IS NULL
          AND stimulus IS NOT NULL
      `;
  console.log(`Loaded ${rows.length} MCQs without images.`);

  const affected = [];
  for (const r of rows) {
    if (!PHANTOM_DETECT.test(r.stimulus)) continue;
    const rewritten = rewriteStimulus(r.stimulus);
    // Only apply if rewrite actually changed anything AND new stim doesn't
    // STILL contain a phantom reference.
    if (rewritten === r.stimulus) continue;
    affected.push({ id: r.id, course: r.course, before: r.stimulus, after: rewritten });
  }

  console.log(`Affected: ${affected.length} (would rewrite)\n`);

  // Show 3 samples
  for (const s of affected.slice(0, 3)) {
    console.log(`--- ${s.id.slice(0, 10)} ${s.course} ---`);
    console.log(`  BEFORE: ${s.before.slice(0, 200)}`);
    console.log(`  AFTER:  ${s.after.slice(0, 200)}`);
    console.log();
  }

  if (dry) {
    console.log(`(dry run — no DB writes)`);
    return;
  }

  let fixed = 0;
  let err = 0;
  for (const a of affected) {
    try {
      await sql`UPDATE questions SET stimulus = ${a.after} WHERE id = ${a.id}`;
      fixed++;
    } catch (e) {
      err++;
      console.error(`  ✗ ${a.id.slice(0, 8)}: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`\n── Summary ──`);
  console.log(`  Fixed:  ${fixed}`);
  console.log(`  Errors: ${err}`);

  // Per-course breakdown
  const byCourse = {};
  for (const a of affected) {
    byCourse[a.course] = (byCourse[a.course] || 0) + 1;
  }
  console.log(`\n  By course:`);
  Object.entries(byCourse)
    .sort(([, a], [, b]) => b - a)
    .forEach(([c, n]) => console.log(`    ${c}: ${n}`));
})().catch((e) => { console.error("Fatal:", e); process.exit(1); });
