/**
 * FULL gate sweep — runs the shared deterministic gates from
 * scripts/lib/_question-gates.mjs against every approved question.
 *
 * Catches all 10 bug classes the gate covers:
 *   1. structure (empty stem, short explanation, bad correctAnswer)
 *   2. options-count (wrong number of options per course spec)
 *   3. options-prefix-dup (double "A) A)")
 *   4. options-duplicate (Unicode-normalized dupes)
 *   5. options-missing-prefix (no A)/B) labels)
 *   6. options-partial-prefix (inconsistent labels)
 *   7. options-mixed-types (Yes/No + algebraic)
 *   8. option-contains-hint (reasoning leaked into option)
 *   9. correctAnswer-index (correctAnswer points past end)
 *  10. explanation-letter-mismatch (Gregory's bug)
 *  11. confession-phrase ("closest match", etc.)
 *
 * Usage:
 *   node _sweep-full-gates.mjs              # dry-run, all courses
 *   node _sweep-full-gates.mjs --apply      # unapprove all failures
 *   node _sweep-full-gates.mjs --course=CLEP_COLLEGE_ALGEBRA
 *   node _sweep-full-gates.mjs --visible-only   # only courses in visible_courses
 */
import "dotenv/config";
import { runDeterministicGates } from "./lib/_question-gates.mjs";
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
const COURSE = args.course ?? null;
const VISIBLE_ONLY = !!args["visible-only"];
// User-visible bug classes (default). To include data-quality classes
// (missing-prefix, partial-prefix), pass --include-prefix-issues.
const INCLUDE_PREFIX = !!args["include-prefix-issues"];
const USER_VISIBLE_GATES = new Set([
  "structure",
  "structure-frq-leak",                // 2026-05-24
  "options-count",
  "options-duplicate",
  "options-permutation-equivalent",   // v2 (2026-05-21)
  "options-mixed-types",
  "options-duplicate-prefix-letters",  // 2026-05-24
  "options-out-of-order-prefix",       // 2026-05-24
  "options-all-or-none-of-above",      // 2026-05-24 ChatGPT v2 #17
  "option-contains-hint",
  "correctAnswer-index",
  "explanation-letter-mismatch",
  "explanation-self-contradiction",    // v2
  "explanation-numeric-mismatch",      // v2
  "explanation-body-letter-ref",       // 2026-05-24
  "explanation-subjectivity-leak",     // 2026-05-24 ChatGPT v2 #20
  "explanation-multi-answer-implication", // 2026-05-24 ChatGPT v2 #18
  "explanation-unmatched-parens",      // 2026-05-24
  "explanation-abrupt-end",            // 2026-05-24
  "explanation-dangling-operator",     // 2026-05-24
  "explanation-no-reasoning",          // 2026-05-24
  "options-length-skewed",             // v2
  "stem-missing-stimulus",             // v2
  "stem-truncated-math",               // 2026-05-24
  "stem-double-negation",              // 2026-05-24 Sprint A (UARP §3.3)
  "stem-extremum-mismatch",            // 2026-05-24 Sprint A (UARP §3.1)
  "explanation-ignores-negation",      // 2026-05-24 Sprint A (UARP §3.3)
  "explanation-ignores-trend",         // 2026-05-24 Sprint A (UARP §3.1)
  "confession-phrase",
]);

let visibleCourses = null;
if (VISIBLE_ONLY) {
  const setting = (await sql`SELECT value FROM site_settings WHERE key = 'visible_courses'`)[0];
  if (setting) {
    try { visibleCourses = new Set(JSON.parse(setting.value)); console.log(`Visible-only mode: ${visibleCourses.size} courses`); } catch {}
  }
}

// Filter to MCQ only — the gate's "structure" check expects correctAnswer to be A-E,
// which FRQs intentionally violate (they store essay text).
const rows = COURSE
  ? await sql`SELECT id, course::text AS course, "questionText", options, "correctAnswer", explanation, "modelUsed" FROM questions WHERE course::text = ${COURSE} AND "isApproved" = true AND "questionType" = 'MCQ'`
  : await sql`SELECT id, course::text AS course, "questionText", options, "correctAnswer", explanation, "modelUsed" FROM questions WHERE "isApproved" = true AND "questionType" = 'MCQ'`;

console.log(`Scanning ${rows.length} approved questions${COURSE ? ` for ${COURSE}` : ""}…`);

const failures = [];
let scanned = 0;
for (const r of rows) {
  if (visibleCourses && !visibleCourses.has(r.course)) continue;
  scanned++;
  const candidate = {
    questionText: r.questionText,
    options: r.options,
    correctAnswer: r.correctAnswer,
    explanation: r.explanation,
    course: r.course,
  };
  const gate = runDeterministicGates(candidate);
  if (!gate.ok) {
    // Skip non-user-visible data-quality issues unless --include-prefix-issues
    if (!INCLUDE_PREFIX && !USER_VISIBLE_GATES.has(gate.gate)) continue;
    failures.push({
      id: r.id, course: r.course, modelUsed: r.modelUsed,
      gate: gate.gate, reason: (gate.reason || "").slice(0, 200),
    });
  }
}

console.log(`\n══ Scanned: ${scanned} | Failures: ${failures.length} ══`);

if (failures.length > 0) {
  const byGate = {}, byCourse = {}, byModel = {};
  failures.forEach((x) => {
    byGate[x.gate] = (byGate[x.gate] || 0) + 1;
    byCourse[x.course] = (byCourse[x.course] || 0) + 1;
    byModel[x.modelUsed || "null"] = (byModel[x.modelUsed || "null"] || 0) + 1;
  });
  console.log("\nBy gate (failure type):");
  Object.entries(byGate).sort((a, b) => b[1] - a[1]).forEach(([g, n]) => console.log(`  ${(g || "null").padEnd(34)} ${n}`));
  console.log("\nBy course (top 20):");
  Object.entries(byCourse).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([c, n]) => console.log(`  ${c.padEnd(38)} ${n}`));
  console.log("\nBy model (top 10):");
  Object.entries(byModel).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([m, n]) => console.log(`  ${(m || "null").padEnd(48)} ${n}`));

  console.log("\nFirst 10 examples:");
  failures.slice(0, 10).forEach((x) => console.log(`  ${x.id} [${x.course}] gate=${x.gate}\n    ${x.reason}`));
}

// High-precision gates (>95% precision based on manual spot-check) — safe to auto-unapprove.
// Review-only gates (50-80% precision) — flag but don't auto-unapprove.
const HIGH_PRECISION_GATES = new Set([
  "structure",
  "options-count",
  "options-duplicate",
  "options-permutation-equivalent",
  "options-mixed-types",
  "option-contains-hint",
  "correctAnswer-index",
  "explanation-letter-mismatch",
  "explanation-self-contradiction",
  "confession-phrase",
]);

if (!APPLY) {
  console.log("\n(dry-run — no DB changes. Use --apply to unapprove high-precision gates only.)");
  console.log(`Would unapprove ${failures.filter(f => HIGH_PRECISION_GATES.has(f.gate)).length} (high-precision); flag ${failures.filter(f => !HIGH_PRECISION_GATES.has(f.gate)).length} (review-only) without unapproving.`);
  process.exit(0);
}

// 2026-05-23 — Per user mandate ("don't assume questions are good"),
// unapprove ALL failures, not just high-precision. The review-only gates
// (numeric-mismatch, length-skewed) have ~10-20% false positives but the
// trade-off favors aggressive culling for quality protection. Pass
// --high-precision-only to revert to old behavior.
const STRICT_ALL = !args["high-precision-only"];

let unapproved = 0, flagged = 0;
for (const x of failures) {
  const shouldUnapprove = STRICT_ALL || HIGH_PRECISION_GATES.has(x.gate);
  if (shouldUnapprove) {
    await sql`UPDATE questions SET "isApproved" = false, "updatedAt" = NOW() WHERE id = ${x.id}`;
    unapproved++;
  } else {
    flagged++;
  }
}
console.log(`\nUnapproved: ${unapproved} | Flagged-only: ${flagged}${STRICT_ALL ? " (strict mode — all failures unapproved)" : " (high-precision only)"}`);
