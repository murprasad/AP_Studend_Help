/**
 * scripts/backfill-stuck-diagnostics.mjs
 *
 * Retroactive fix for diagnostic sessions that got stuck IN_PROGRESS
 * due to the /api/diagnostic/complete AI-cascade timeout bug (95% stuck
 * rate since May 1, fixed in commit 0d3fc6c).
 *
 * For every stuck session:
 *   1. Aggregate student_responses to compute per-unit scores
 *   2. Compute weakUnits / strongUnits from unitScores
 *   3. Build deterministic recommendation (no AI call needed)
 *   4. Insert into diagnostic_results
 *   5. Update practice_sessions: status=COMPLETED + correctAnswers + completedAt + score
 *   6. Update user_journeys.weakestUnit if currently null
 *
 * Usage:
 *   node scripts/backfill-stuck-diagnostics.mjs           # dry — print plan
 *   node scripts/backfill-stuck-diagnostics.mjs --write   # apply
 */
import "dotenv/config";
import crypto from "node:crypto";

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const WRITE = process.argv.includes("--write");
console.log(`Mode: ${WRITE ? "WRITE" : "DRY (read-only)"}\n`);

// Find all stuck DIAGNOSTIC sessions
const stuck = await sql`
  SELECT id, "userId", course::text AS course, "totalQuestions", "startedAt"
  FROM practice_sessions
  WHERE "sessionType" = 'DIAGNOSTIC' AND status = 'IN_PROGRESS'
  ORDER BY "startedAt" ASC
`;
console.log(`Found ${stuck.length} stuck diagnostic sessions.\n`);

let fixed = 0;
let skipped = 0;
let journeysUpdated = 0;

for (const s of stuck) {
  // Aggregate responses by unit. The student_responses table joins to questions for unit.
  const resps = await sql`
    SELECT sr."isCorrect", q.unit::text AS unit
    FROM student_responses sr
    JOIN questions q ON q.id = sr."questionId"
    WHERE sr."sessionId" = ${s.id}
  `;
  if (resps.length === 0) {
    console.log(`  skip ${s.id.slice(0,8)} (${s.course}): no responses`);
    skipped++;
    continue;
  }

  const unitResults = {};
  for (const r of resps) {
    if (!unitResults[r.unit]) unitResults[r.unit] = { correct: 0, total: 0 };
    unitResults[r.unit].total++;
    if (r.isCorrect) unitResults[r.unit].correct++;
  }
  const unitScores = {};
  for (const [u, x] of Object.entries(unitResults)) {
    unitScores[u] = x.total > 0 ? Math.round(100 * x.correct / x.total) : 0;
  }
  const sortedUnits = Object.entries(unitScores).sort((a, b) => a[1] - b[1]);
  const weakUnits = sortedUnits.slice(0, 3).map(([u]) => u);
  const strongUnits = sortedUnits.slice(-3).map(([u]) => u).reverse();
  const recommendation = `Focus on your weakest units: ${weakUnits.join(", ")}. Practice MCQ questions in those units daily and review the explanations carefully.`;
  const totalCorrect = Object.values(unitResults).reduce((acc, r) => acc + r.correct, 0);
  const totalQuestions = Object.values(unitResults).reduce((acc, r) => acc + r.total, 0);
  const score = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  console.log(`  ${s.id.slice(0,8)} (${s.course}): ${totalCorrect}/${totalQuestions} → weakest=[${weakUnits.join(",")}]`);

  if (WRITE) {
    const resultId = `bkfl_${crypto.randomBytes(12).toString("hex")}`;

    // Idempotency: only create diagnostic_result if missing
    const existing = await sql`SELECT id FROM diagnostic_results WHERE "sessionId" = ${s.id} LIMIT 1`;
    if (existing.length === 0) {
      await sql`
        INSERT INTO diagnostic_results (id, "userId", course, "sessionId", "unitScores", "weakUnits", "strongUnits", recommendation, "createdAt")
        VALUES (${resultId}, ${s.userId}, ${s.course}::"ApCourse", ${s.id}, ${JSON.stringify(unitScores)}::jsonb, ${JSON.stringify(weakUnits)}::jsonb, ${JSON.stringify(strongUnits)}::jsonb, ${recommendation}, NOW())
      `;
    }
    await sql`
      UPDATE practice_sessions
      SET status = 'COMPLETED', "correctAnswers" = ${totalCorrect}, "completedAt" = NOW(), score = ${score}
      WHERE id = ${s.id}
    `;
    // If user_journeys row references this session AND has null weakestUnit, set it
    const j = await sql`UPDATE user_journeys SET "weakestUnit" = ${weakUnits[0]}::"ApUnit" WHERE "step3DiagnosticId" = ${s.id} AND "weakestUnit" IS NULL RETURNING id`;
    if (j.length > 0) journeysUpdated++;
    fixed++;
  } else {
    fixed++;
  }
}

console.log(`\n${WRITE ? "Wrote" : "Would write"}: ${fixed} session(s) completed, ${journeysUpdated} journey rows got weakestUnit, ${skipped} skipped (no responses).`);
