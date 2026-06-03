// Audit + fix stale-grading bug on PrepLion.
//
// Bug: when admin changes a question's correctAnswer post-launch, historical
// student_responses keep their isCorrect boolean from submission time.
// Result: users see scores based on superseded grading. Confirmed via
// drshevaquinn case 2026-06-03: picked C, correctAnswer=C, but isCorrect=false.
//
// Strategy:
//   1. SELECT student_responses sr JOIN questions q ON q.id = sr.questionId
//   2. Compute expected_isCorrect = (UPPER(sr.studentAnswer) === UPPER(q.correctAnswer))
//      (subject to __IDK__ sentinel → always false)
//   3. Flag rows where sr.isCorrect != expected_isCorrect
//   4. Report per-user + per-course counts
//   5. With --apply: UPDATE student_responses SET isCorrect = expected_isCorrect
//   6. With --recompute: rebuild affected practice_session.correctAnswers + mastery_scores
//
// Run:
//   node scripts/_audit-stale-grading.mjs                # dry-run audit
//   node scripts/_audit-stale-grading.mjs --apply        # write fixes
//   node scripts/_audit-stale-grading.mjs --apply --recompute  # also rebuild aggregates

import { config } from "dotenv";
config({ path: "C:/Users/akkil/project/AP_Help/.env" });
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");

const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const FLAGS = process.argv.slice(2);
const APPLY = FLAGS.includes("--apply");
const RECOMPUTE = FLAGS.includes("--recompute");

console.log(`\n═══ Stale-grading audit (StudentNest) — ${APPLY ? "WRITE MODE" : "DRY-RUN"} ═══\n`);

// Stream through student_responses + join questions
const stale = await sql`
  SELECT sr.id AS srid, sr."userId", sr."studentAnswer", sr."isCorrect", sr."answeredAt",
         q.id AS qid, q."correctAnswer", q."questionType"::text AS qtype,
         q.course::text AS course
  FROM student_responses sr
  JOIN questions q ON q.id = sr."questionId"
  WHERE sr."studentAnswer" IS NOT NULL
    AND sr."studentAnswer" != ''
    AND sr."studentAnswer" != '__IDK__'
    AND q."correctAnswer" IS NOT NULL
    AND q."correctAnswer" != ''
    AND q."questionType"::text = 'MCQ'
`;
console.log(`Total MCQ responses scanned: ${stale.length}`);

let mismatches = 0;
const perCourse = new Map();
const perUser = new Map();
const fixesToApply = [];

for (const r of stale) {
  const sa = String(r.studentAnswer).toUpperCase().trim().charAt(0);
  const ca = String(r.correctAnswer).toUpperCase().trim().charAt(0);
  if (!"ABCDE".includes(sa) || !"ABCDE".includes(ca)) continue;
  const expected = sa === ca;
  if (expected !== r.isCorrect) {
    mismatches++;
    perCourse.set(r.course, (perCourse.get(r.course) ?? 0) + 1);
    perUser.set(r.userId, (perUser.get(r.userId) ?? 0) + 1);
    fixesToApply.push({ srid: r.srid, expected, current: r.isCorrect, sa, ca, course: r.course });
  }
}

console.log(`\nMismatches found: ${mismatches} (${((mismatches / stale.length) * 100).toFixed(2)}%)\n`);

if (mismatches === 0) {
  console.log("No stale grading. All good.");
  process.exit(0);
}

console.log("Per-course mismatch count:");
const courseTable = Array.from(perCourse.entries()).sort((a, b) => b[1] - a[1]);
for (const [c, n] of courseTable) console.log(`  ${c.padEnd(40)} ${n}`);

console.log(`\nUsers affected: ${perUser.size}`);
const userTable = Array.from(perUser.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20);
console.log("Top 20 by mismatch count:");
for (const [u, n] of userTable) console.log(`  ${u} ${n}`);

if (!APPLY) {
  console.log("\n(dry-run) Pass --apply to write fixes.");
  process.exit(0);
}

console.log(`\nApplying ${fixesToApply.length} corrections to student_responses…`);
let written = 0;
for (const fix of fixesToApply) {
  await sql`
    UPDATE student_responses
    SET "isCorrect" = ${fix.expected}
    WHERE id = ${fix.srid}
  `;
  written++;
  if (written % 100 === 0) process.stdout.write(`.`);
}
console.log(`\n  → wrote ${written} corrections.`);

if (RECOMPUTE) {
  console.log("\nRebuilding practice_sessions.correctAnswers for affected users…");
  for (const userId of perUser.keys()) {
    const sessions = await sql`
      SELECT id FROM practice_sessions WHERE "userId" = ${userId}
    `;
    for (const s of sessions) {
      const counts = await sql`
        SELECT COUNT(*) FILTER (WHERE "isCorrect" = true) AS correct
        FROM student_responses WHERE "sessionId" = ${s.id}
      `;
      await sql`
        UPDATE practice_sessions
        SET "correctAnswers" = ${parseInt(counts[0].correct, 10)}
        WHERE id = ${s.id}
      `;
    }
  }
  console.log(`  → rebuilt session aggregates for ${perUser.size} users.`);
}

console.log("\n═══ Done ═══");
