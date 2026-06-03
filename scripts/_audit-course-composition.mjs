// Course-composition audit per goal: "Why didn't the validation gate
// catch that SAT_MATH has 0 image-based questions?"
//
// Each course has a CB-spec target composition (numeric %, image-stim %,
// passage-stim %, etc.). The deterministic per-question gates don't
// validate aggregate composition. This script does — and is wireable
// into pre-release-check.js as a gate.
//
// Usage:
//   node scripts/_audit-course-composition.mjs                  # all SAT/PSAT/ACT/AP visible courses
//   node scripts/_audit-course-composition.mjs --course=SAT_MATH
//   node scripts/_audit-course-composition.mjs --json           # machine-readable
import { config } from "dotenv";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
config({ path: "C:/Users/akkil/project/AP_Help/.env" });
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), "..");

const FLAGS = process.argv.slice(2);
const COURSE_FILTER = FLAGS.find((f) => f.startsWith("--course="))?.split("=")[1];
const AS_JSON = FLAGS.includes("--json");

// CB / official-source composition expectations.
// Derived from spot-checking practice tests + assessment frameworks.
// Sources for SAT/PSAT: https://satsuite.collegeboard.org/sat/practice-preparation/practice-tests/paper
// All percentages are TARGET BANK COMPOSITION ratios (not exact-per-test).
// Acceptable deviation listed in the `tolerance` field.
const EXPECTATIONS = {
  // SAT Math (digital): ~25% numeric (SPR/grid-in), ~35-40% with image/figure,
  // most questions have a stem-only context (no separate passage).
  SAT_MATH: {
    numeric_pct: { target: 25, tolerance: 8, label: "numeric (SPR) Qs" },
    image_pct: { target: 35, tolerance: 10, label: "Qs with image/figure" },
    stimulus_pct: { target: 30, tolerance: 15, label: "Qs with stimulus text or image" },
  },
  PSAT_MATH: {
    numeric_pct: { target: 25, tolerance: 8, label: "numeric (SPR) Qs" },
    image_pct: { target: 30, tolerance: 10, label: "Qs with image/figure" },
    stimulus_pct: { target: 25, tolerance: 15, label: "Qs with stimulus" },
  },
  SAT_READING_WRITING: {
    numeric_pct: { target: 0, tolerance: 2, label: "numeric (RW is all MCQ)" },
    image_pct: { target: 0, tolerance: 5, label: "Qs with image (RW rarely has images)" },
    stimulus_pct: { target: 95, tolerance: 5, label: "Qs with passage stimulus (required)" },
  },
  PSAT_READING_WRITING: {
    numeric_pct: { target: 0, tolerance: 2, label: "numeric" },
    image_pct: { target: 0, tolerance: 5, label: "Qs with image" },
    stimulus_pct: { target: 95, tolerance: 5, label: "Qs with passage stimulus (required)" },
  },
  // ACT Math (paper): MCQ-only, ~25-30% with figures.
  ACT_MATH: {
    numeric_pct: { target: 0, tolerance: 5, label: "numeric (ACT is all MCQ)" },
    image_pct: { target: 28, tolerance: 10, label: "Qs with image/figure" },
    stimulus_pct: { target: 20, tolerance: 15, label: "Qs with stimulus" },
  },
  ACT_READING: {
    image_pct: { target: 0, tolerance: 5, label: "Qs with image" },
    stimulus_pct: { target: 100, tolerance: 1, label: "Qs with passage stimulus (required)" },
  },
  ACT_SCIENCE: {
    image_pct: { target: 80, tolerance: 15, label: "Qs with chart/graph/diagram (Science is data-driven)" },
    stimulus_pct: { target: 100, tolerance: 1, label: "Qs with passage+data stimulus (required)" },
  },
};

const SHOULD_RUN = (course) => COURSE_FILTER ? course === COURSE_FILTER : Object.prototype.hasOwnProperty.call(EXPECTATIONS, course);

// ── Audit ──────────────────────────────────────────────────────────────────
const results = [];
const courses = Object.keys(EXPECTATIONS).filter(SHOULD_RUN);
for (const course of courses) {
  const c = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE "isApproved" = true)::int AS approved,
      COUNT(*) FILTER (WHERE "isApproved" = true AND "questionType"::text = 'NUMERICAL')::int AS numeric_n,
      COUNT(*) FILTER (WHERE "isApproved" = true AND "stimulusImageUrl" IS NOT NULL AND "stimulusImageUrl" != '')::int AS image_n,
      COUNT(*) FILTER (WHERE "isApproved" = true AND ((stimulus IS NOT NULL AND stimulus != '') OR ("stimulusImageUrl" IS NOT NULL AND "stimulusImageUrl" != '')))::int AS stim_n
    FROM questions
    WHERE course::text = ${course}
  `;
  const r = c[0];
  if (r.approved === 0) continue;
  const numericPct = Math.round(100 * r.numeric_n / r.approved);
  const imagePct = Math.round(100 * r.image_n / r.approved);
  const stimPct = Math.round(100 * r.stim_n / r.approved);
  const exp = EXPECTATIONS[course];
  const checks = [];
  const checkOne = (key, actual) => {
    const e = exp[key];
    if (!e) return;
    const within = Math.abs(actual - e.target) <= e.tolerance;
    checks.push({ key, label: e.label, actual, target: e.target, tolerance: e.tolerance, within });
  };
  checkOne("numeric_pct", numericPct);
  checkOne("image_pct", imagePct);
  checkOne("stimulus_pct", stimPct);
  results.push({
    course,
    counts: { total: r.total, approved: r.approved, numeric: r.numeric_n, with_image: r.image_n, with_stim: r.stim_n },
    pct: { numeric: numericPct, image: imagePct, stimulus: stimPct },
    checks,
    pass: checks.every((c) => c.within),
  });
}

if (AS_JSON) {
  console.log(JSON.stringify({ courses: results }, null, 2));
  process.exit(results.every((r) => r.pass) ? 0 : 1);
}

// ── Pretty print ───────────────────────────────────────────────────────────
let totalFail = 0;
for (const r of results) {
  console.log(`\n═══ ${r.course} ═══`);
  console.log(`  approved=${r.counts.approved} (of ${r.counts.total} total)  |  numeric=${r.counts.numeric}  image=${r.counts.with_image}  stim=${r.counts.with_stim}`);
  for (const c of r.checks) {
    const icon = c.within ? "✅" : "❌";
    const delta = c.actual - c.target;
    const arrow = delta > 0 ? `+${delta}` : `${delta}`;
    console.log(`  ${icon} ${c.label.padEnd(45)} actual=${c.actual.toString().padStart(3)}%  target=${c.target}% ±${c.tolerance}  (${arrow})`);
    if (!c.within) totalFail++;
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Courses audited: ${results.length}`);
console.log(`Composition checks failed: ${totalFail}`);

if (totalFail > 0) {
  console.log(`\nFailed checks are the gaps the per-question gates can't catch.`);
  console.log(`Action: feed generator on the under-represented format. For image gaps,`);
  console.log(`a separate image-stimulus pipeline is required (text-only generator can't fix it).`);
}

process.exit(totalFail > 0 ? 1 : 0);
