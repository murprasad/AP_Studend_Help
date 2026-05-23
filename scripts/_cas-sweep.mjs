/**
 * CAS-based sweep — recomputes math answers via mathjs and flags
 * questions where the stored correctAnswer disagrees with the recomputed
 * value. Phase 1 covers quadratic + linear + function-eval + factor
 * patterns. Returns SKIP for ~70% of Qs (conceptual / unparseable) —
 * those are unchanged.
 *
 * Scope: math-heavy courses (College Algebra, Calculus, Precalculus,
 * College Math). Same logic as src/lib/math-recompute-validator.ts but
 * runs against the DB directly.
 *
 * Usage:
 *   node scripts/_cas-sweep.mjs                    # dry-run all math courses
 *   node scripts/_cas-sweep.mjs --apply            # unapprove failures
 *   node scripts/_cas-sweep.mjs --course=CLEP_COLLEGE_ALGEBRA
 */
import "dotenv/config";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const APPLY = !!args.apply;
const COURSE_FILTER = args.course ?? null;

const MATH_COURSES = [
  "CLEP_COLLEGE_ALGEBRA",
  "CLEP_CALCULUS",
  "CLEP_PRECALCULUS",
  "CLEP_COLLEGE_MATH",
];

// Dynamic-import the validator from src so we share logic
const { validateMathRecompute } = await import("../src/lib/math-recompute-validator.ts").catch(async () => {
  // tsx not available — fall back to a local copy of just the entry point
  console.error("Could not import TS validator. Use `npx tsx scripts/_cas-sweep.mjs` or run via Node with .mjs port.");
  process.exit(1);
});

const courses = COURSE_FILTER ? [COURSE_FILTER] : MATH_COURSES;

let totalScanned = 0;
let totalFailed = 0;
let totalSkipped = 0;
const failures = [];

for (const course of courses) {
  const rows = await sql`
    SELECT id, "questionText", options, "correctAnswer", "modelUsed"
    FROM questions
    WHERE course::text = ${course}
      AND "isApproved" = true
      AND "questionType" = 'MCQ'`;
  console.log(`\n══ ${course}: ${rows.length} approved MCQs ══`);
  for (const q of rows) {
    totalScanned++;
    const opts = Array.isArray(q.options) ? q.options.map(String) : [];
    if (opts.length < 2) continue;
    let result;
    try { result = validateMathRecompute(q.questionText, opts, q.correctAnswer); }
    catch (e) { continue; }
    if (result.status === "skip") { totalSkipped++; continue; }
    if (!result.ok) {
      totalFailed++;
      failures.push({ id: q.id, course, reason: result.reason, model: q.modelUsed, stem: q.questionText.slice(0, 80) });
    }
  }
}

console.log(`\n══ TOTAL: ${totalScanned} scanned, ${totalFailed} failed, ${totalSkipped} skipped (~${Math.round(totalSkipped/totalScanned*100)}% unrecomputable) ══\n`);

if (failures.length === 0) {
  console.log("No failures found.");
  process.exit(0);
}

console.log("First 10 failures:");
for (const f of failures.slice(0, 10)) {
  console.log(`  ${f.course} ${f.id}: ${f.reason} [${f.model}]`);
  console.log(`    "${f.stem}"`);
}

if (!APPLY) {
  console.log(`\n(dry-run — pass --apply to unapprove ${failures.length} questions)`);
  process.exit(0);
}

const ids = failures.map((f) => f.id);
const chunkSize = 100;
let done = 0;
for (let i = 0; i < ids.length; i += chunkSize) {
  const chunk = ids.slice(i, i + chunkSize);
  await sql`UPDATE questions SET "isApproved" = false WHERE id = ANY(${chunk})`;
  done += chunk.length;
  console.log(`  unapproved ${done}/${ids.length}`);
}
console.log(`Done. Unapproved ${ids.length}.`);
