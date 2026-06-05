// Full-bank re-sweep (CB-fidelity goal). Runs the COMPREHENSIVE TS gate set
// (src/lib/deterministic-question-gates.ts runDeterministicGates — incl. the
// Morgan render-broken classes the cron .mjs lib was missing) across EVERY
// approved question, all courses. Answers "did we sweep all questions?".
//
// Default = DRY-RUN (no writes). --apply unapproves offenders with a per-course
// 200-floor (override: --force-below-floor). Run via tsx (imports the TS gate):
//   npx tsx scripts/_resweep-everything.mjs            # dry-run
//   npx tsx scripts/_resweep-everything.mjs --apply
import "dotenv/config";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);
const { runDeterministicGates } = await import("../src/lib/deterministic-question-gates.ts");

const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force-below-floor");
const FLOOR = 200;

console.log(`Full-bank re-sweep. Mode: ${APPLY ? "APPLY" : "DRY-RUN"}${FORCE ? " (force-below-floor)" : ""}\n`);

// MCQ ONLY — the deterministic gates assume A-E options + letter answers, so
// NUMERICAL/grid-in (SPR) and FRQ-family types must be excluded or they get
// massively false-flagged (option-count/structure). This is a real gate
// limitation (questionType-blind); we scope the sweep instead.
const rows = await sql`
  SELECT id, course::text AS course, "questionText", options, "correctAnswer", explanation, stimulus,
         "questionType"::text AS "questionType"
  FROM questions
  WHERE "isApproved" = true
    AND "questionType" = 'MCQ'
`;
const nonMcq = (await sql`SELECT COUNT(*)::int AS n FROM questions WHERE "isApproved"=true AND "questionType" <> 'MCQ'`)[0].n;
console.log(`Loaded ${rows.length} approved MCQs (excluded ${nonMcq} non-MCQ: NUMERICAL/grid-in/FRQ — gates don't apply).\n`);

// Only these gates are HIGH-CONFIDENCE render-broken (safe to auto-unapprove).
// stimulus-required + claims-visual-no-image OVER-FLAG (embedded-text SAT R&W /
// text-described data) and are EXCLUDED from --apply; reported for review only.
const HIGH_CONFIDENCE = new Set([
  "render-hazard", "stem-unescaped-currency-dollar", "scaffold-token-leak",
  "json-object-stimulus", "missing-question-marker",
  "explanation-derives-contradictory-value", "options-partial-prefix",
  "explanation-multi-answer-implication", "options-count", "structure",
]);

const approvedByCourse = {};
const failedByCourse = {};   // course -> [ids]  (HIGH-CONFIDENCE only — drives --apply)
const reasonTally = {};      // gate/reason -> count (ALL failures, for reporting)
for (const r of rows) {
  approvedByCourse[r.course] = (approvedByCourse[r.course] ?? 0) + 1;
  let opts;
  try { opts = typeof r.options === "string" ? JSON.parse(r.options) : r.options; } catch { opts = r.options; }
  const res = runDeterministicGates({
    questionText: r.questionText ?? "",
    options: Array.isArray(opts) ? opts : undefined,
    correctAnswer: r.correctAnswer,
    explanation: r.explanation,
    course: r.course,
    stimulus: r.stimulus ?? undefined,
  });
  if (!res.ok) {
    const key = res.gate ?? "unknown";
    reasonTally[key] = (reasonTally[key] ?? 0) + 1;
    if (HIGH_CONFIDENCE.has(key)) (failedByCourse[r.course] ??= []).push(r.id);
  }
}

const totalFailed = Object.values(failedByCourse).reduce((a, v) => a + v.length, 0);
console.log(`=== BROKEN BY GATE (${totalFailed} total) ===`);
Object.entries(reasonTally).sort((a, b) => b[1] - a[1]).forEach(([g, n]) => console.log(`  ${g.padEnd(28)} ${n}`));

console.log(`\n=== BY COURSE (only courses with failures) ===`);
console.log("  " + "course".padEnd(34) + "approved".padStart(9) + "broken".padStart(8) + "wouldUnappr".padStart(13) + "  notes");
let totalWould = 0;
const applyIds = [];
for (const course of Object.keys(failedByCourse).sort((a, b) => failedByCourse[b].length - failedByCourse[a].length)) {
  const approved = approvedByCourse[course] ?? 0;
  const broken = failedByCourse[course].length;
  const after = approved - broken;
  const blocked = !FORCE && after < FLOOR;
  const would = blocked ? 0 : broken;
  totalWould += would;
  if (!blocked) applyIds.push(...failedByCourse[course]);
  console.log("  " + course.padEnd(34) + String(approved).padStart(9) + String(broken).padStart(8) + String(would).padStart(13) + (blocked ? "  BLOCKED(200-floor)" : ""));
}
console.log(`  ${"TOTAL".padEnd(34)}${"".padStart(9)}${String(totalFailed).padStart(8)}${String(totalWould).padStart(13)}`);

if (!APPLY) {
  console.log(`\nDRY-RUN — no writes. Re-run with --apply (add --force-below-floor to ignore the 200-floor for render-broken items).`);
  process.exit(0);
}

console.log(`\nAPPLY: unapproving ${applyIds.length} questions...`);
const B = 500;
for (let i = 0; i < applyIds.length; i += B) {
  const batch = applyIds.slice(i, i + B);
  await sql`UPDATE questions SET "isApproved" = false WHERE id = ANY(${batch})`;
  console.log(`  batch ${Math.floor(i / B) + 1}: ${batch.length}`);
}
console.log(`✓ Unapproved ${applyIds.length}.`);
process.exit(0);
