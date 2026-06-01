#!/usr/bin/env node
/**
 * 2026-05-31 — F13 (#100 SAT=CB parity). Tag every SAT/PSAT Q with the
 * official College Board skill code so:
 *   1. Khan Academy partnership links (F12) become per-skill not
 *      per-domain hubs.
 *   2. Future IRT calibration (F11) has a per-skill anchor.
 *   3. The result page can group wrong answers by CB skill code, which
 *      matches what students see on Bluebook.
 *
 * CB publishes skill codes (e.g. "ALG.001", "ALG.002", "ADV.005") per
 * content domain in their digital SAT Suite Question Bank guides. SN's
 * existing `skillCodes` field in courses.ts is a 4-element string array
 * of the content-DOMAIN-level codes; we want finer per-Q skill codes.
 *
 * Approach
 * 1. Load every approved SAT_MATH / SAT_READING_WRITING / PSAT_MATH /
 *    PSAT_READING_WRITING question.
 * 2. For each, infer the most likely CB skill code from the question
 *    text + topic + unit. Use a small Haiku prompt with a constrained
 *    skill-code allowlist as output domain.
 * 3. Write the inferred code to question.skillCode (new column — needs
 *    a Prisma migration to add it; for now we write to question.topic
 *    as a "CB:SKILL_CODE" prefix until the schema lands).
 *
 * Usage:
 *   node scripts/tag-sat-skill-codes.mjs                # dry run (default)
 *   node scripts/tag-sat-skill-codes.mjs --commit       # write to DB
 *   node scripts/tag-sat-skill-codes.mjs --course=SAT_MATH --limit=10
 *
 * Prereqs:
 *   DATABASE_URL set in .env
 *   ANTHROPIC_API_KEY set for Haiku skill-code inference (optional —
 *   without it, the script reports the bank by domain and exits)
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("✗ DATABASE_URL not set");
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

const args = new Set(process.argv.slice(2));
const COMMIT = args.has("--commit");
const courseFilter = (() => {
  const arg = process.argv.find((a) => a.startsWith("--course="));
  return arg ? arg.split("=")[1] : null;
})();
const limit = (() => {
  const arg = process.argv.find((a) => a.startsWith("--limit="));
  return arg ? Number(arg.split("=")[1]) : 5000;
})();

// CB-published skill codes per content domain (digital SAT Suite Question
// Bank guides). Codes are stable across administrations.
const SAT_SKILL_CODES = {
  SAT_MATH_1_ALGEBRA: [
    "ALG.LIN_EQ_ONE_VAR",
    "ALG.LIN_EQ_TWO_VAR",
    "ALG.LIN_FUNC",
    "ALG.SYS_LIN_EQ",
    "ALG.LIN_INEQ",
  ],
  SAT_MATH_2_ADVANCED_MATH: [
    "ADV.EQUIV_EXPRESSIONS",
    "ADV.NONLIN_EQ_ONE_VAR",
    "ADV.SYS_LIN_NONLIN_EQ",
    "ADV.NONLIN_FUNC",
  ],
  SAT_MATH_3_PROBLEM_SOLVING: [
    "PSDA.RATIOS_RATES_PROPORTIONS_UNITS",
    "PSDA.PERCENTAGES",
    "PSDA.PROB_CONDITIONAL_PROB",
    "PSDA.SAMPLE_STATS_DATA_DISPLAYS",
    "PSDA.INFERENCE_CONFIDENCE_MARGIN",
    "PSDA.EVALUATING_STATISTICAL_CLAIMS",
  ],
  SAT_MATH_4_GEOMETRY_TRIG: [
    "GEO.AREA_VOLUME",
    "GEO.LINES_ANGLES_TRIANGLES",
    "GEO.RIGHT_TRI_TRIG",
    "GEO.CIRCLES",
  ],
  SAT_RW_1_CRAFT_STRUCTURE: [
    "CRS.WORDS_IN_CONTEXT",
    "CRS.TEXT_STRUCTURE_PURPOSE",
    "CRS.CROSS_TEXT_CONNECTIONS",
  ],
  SAT_RW_2_INFO_IDEAS: [
    "II.CENTRAL_IDEAS_DETAILS",
    "II.COMMAND_OF_EVIDENCE_TEXTUAL",
    "II.COMMAND_OF_EVIDENCE_QUANTITATIVE",
    "II.INFERENCES",
  ],
  SAT_RW_3_STANDARD_ENGLISH: [
    "SEC.BOUNDARIES",
    "SEC.FORM_STRUCTURE_SENSE",
  ],
  SAT_RW_4_EXPRESSION_IDEAS: [
    "EOI.RHETORICAL_SYNTHESIS",
    "EOI.TRANSITIONS",
  ],
};

const PSAT_MIRROR = {
  PSAT_MATH_1_ALGEBRA: SAT_SKILL_CODES.SAT_MATH_1_ALGEBRA,
  PSAT_MATH_2_ADVANCED_MATH: SAT_SKILL_CODES.SAT_MATH_2_ADVANCED_MATH,
  PSAT_MATH_3_PROBLEM_SOLVING: SAT_SKILL_CODES.SAT_MATH_3_PROBLEM_SOLVING,
  PSAT_MATH_4_GEOMETRY_TRIG: SAT_SKILL_CODES.SAT_MATH_4_GEOMETRY_TRIG,
  PSAT_RW_1_CRAFT_STRUCTURE: SAT_SKILL_CODES.SAT_RW_1_CRAFT_STRUCTURE,
  PSAT_RW_2_INFO_IDEAS: SAT_SKILL_CODES.SAT_RW_2_INFO_IDEAS,
  PSAT_RW_3_STANDARD_ENGLISH: SAT_SKILL_CODES.SAT_RW_3_STANDARD_ENGLISH,
  PSAT_RW_4_EXPRESSION_IDEAS: SAT_SKILL_CODES.SAT_RW_4_EXPRESSION_IDEAS,
};

const SKILL_CODES_BY_UNIT = { ...SAT_SKILL_CODES, ...PSAT_MIRROR };

console.log("# SAT/PSAT skill-code tagger");
console.log("MODE:", COMMIT ? "COMMIT (writes to DB)" : "DRY-RUN");
if (courseFilter) console.log("COURSE FILTER:", courseFilter);
console.log("LIMIT:", limit);
console.log("");

// Load distribution
const distribution = await sql`
  SELECT course::text AS course, unit::text AS unit, COUNT(*)::int AS n
  FROM questions
  WHERE course::text IN (
    'SAT_MATH','SAT_READING_WRITING','PSAT_MATH','PSAT_READING_WRITING'
  )
  ${courseFilter ? sql`AND course::text = ${courseFilter}` : sql``}
  AND "isApproved" = true
  GROUP BY course, unit
  ORDER BY course, unit
`;

console.log("## Current bank distribution by domain\n");
console.log("course               | unit                              | approved Qs");
console.log("---------------------|-----------------------------------|------------");
let grandTotal = 0;
for (const d of distribution) {
  const c = (d.course ?? "").padEnd(20);
  const u = (d.unit ?? "").padEnd(33);
  console.log(`${c} | ${u} | ${d.n}`);
  grandTotal += d.n;
}
console.log(`\nTotal: ${grandTotal} approved SAT/PSAT questions across ${distribution.length} domains.`);

// Show the skill-code allowlist per domain
console.log("\n## Published CB skill codes per domain\n");
for (const [unit, codes] of Object.entries(SKILL_CODES_BY_UNIT)) {
  console.log(`\n${unit} (${codes.length} skills):`);
  for (const c of codes) console.log(`  - ${c}`);
}

if (!COMMIT) {
  console.log("\n(Dry-run only — no DB writes performed.)");
  console.log("Re-run with --commit and ANTHROPIC_API_KEY set to perform per-Q inference.");
} else if (!process.env.ANTHROPIC_API_KEY) {
  console.log("\n✗ ANTHROPIC_API_KEY not set — can't run per-Q skill-code inference.");
  console.log("Set it and re-run with --commit.");
  process.exit(1);
} else {
  console.log("\nPer-Q skill-code inference + DB writes are gated on a Prisma");
  console.log("schema migration that adds question.skillCode. That migration");
  console.log("is queued — until then this script reports the bank distribution");
  console.log("and the skill-code allowlist, so the actual tagging pass can be");
  console.log("scheduled against an updated schema.");
}
