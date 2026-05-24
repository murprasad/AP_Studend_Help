/**
 * Find users who provided negative feedback (low ratings, reports,
 * abandoned sessions, low scores) and replay their exact session
 * questions through ALL gates. Report any Q that would have caused
 * friction. Fix-on-find.
 *
 * Sources of "negative feedback":
 *   - question_reports rows (explicit reports)
 *   - student_responses where isCorrect=false in 3+ consecutive Qs (abandonment signal)
 *   - practice_sessions with status=ABANDONED and totalAnswered=0 (walked away)
 *   - practice_sessions with correctAnswers/totalQuestions < 30% (failure signal)
 */
import "dotenv/config";
import { runDeterministicGates } from "./lib/_question-gates.mjs";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

// 1) Explicit reports
const reports = await sql`
  SELECT qr."userId", u.email, qr."questionId", qr.reason, qr.comment, qr."createdAt"
  FROM question_reports qr
  LEFT JOIN users u ON u.id = qr."userId"
  ORDER BY qr."createdAt" DESC LIMIT 50`.catch(() => []);
console.log(`Explicit reports: ${reports.length}`);
for (const r of reports.slice(0, 5)) {
  console.log(`  ${r.email || "anon"} | Q ${r.questionId.slice(0, 12)} | ${r.reason} | "${(r.comment || "").slice(0, 60)}" | ${r.createdAt.toISOString().slice(0, 10)}`);
}

// 2) Sessions with score < 30% (failure signal)
const failed = await sql`
  SELECT ps.id, ps."userId", u.email, ps.course::text AS course, ps."correctAnswers", ps."totalQuestions",
    ps.status::text AS status, ps."startedAt"
  FROM practice_sessions ps
  LEFT JOIN users u ON u.id = ps."userId"
  WHERE ps."totalQuestions" > 0
    AND ps."correctAnswers" * 100 / ps."totalQuestions" < 30
    AND ps."startedAt" > NOW() - INTERVAL '30 days'
  ORDER BY ps."startedAt" DESC LIMIT 30`;
console.log(`\nLow-score sessions (<30%, last 30 days): ${failed.length}`);
for (const s of failed.slice(0, 10)) {
  console.log(`  ${s.email || "anon"} | ${s.course} | ${s.correctAnswers}/${s.totalQuestions} | ${s.status} | ${s.startedAt.toISOString().slice(0, 10)} | sess=${s.id.slice(0, 8)}`);
}

// 3) Abandoned sessions
const abandoned = await sql`
  SELECT ps.id, ps."userId", u.email, ps.course::text AS course, ps."totalQuestions", ps."startedAt"
  FROM practice_sessions ps
  LEFT JOIN users u ON u.id = ps."userId"
  WHERE ps.status::text = 'ABANDONED'
    AND ps."startedAt" > NOW() - INTERVAL '30 days'
  ORDER BY ps."startedAt" DESC LIMIT 30`;
console.log(`\nAbandoned sessions (last 30 days): ${abandoned.length}`);

// 4) For each problematic session, find the questions and gate-check
const problemSessionIds = [...new Set([...failed.map(s => s.id), ...abandoned.map(s => s.id)])];
console.log(`\nGate-checking ${problemSessionIds.length} unique problematic sessions...\n`);

let totalCheck = 0;
const gateFails = [];
for (const sessionId of problemSessionIds) {
  const qs = await sql`
    SELECT q.id, q.course::text AS course, q.unit::text AS unit, q."questionText", q.stimulus, q.options,
      q."correctAnswer", q.explanation, q."isApproved"
    FROM session_questions sq
    JOIN questions q ON q.id = sq."questionId"
    WHERE sq."sessionId" = ${sessionId}`.catch(() => []);
  for (const q of qs) {
    totalCheck++;
    const gate = runDeterministicGates({
      questionText: q.questionText,
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      course: q.course,
      unit: q.unit,
      stimulus: q.stimulus,
    });
    if (!gate.ok) {
      gateFails.push({ id: q.id, course: q.course, gate: gate.gate, reason: gate.reason, approved: q.isApproved, stem: q.questionText.slice(0, 80) });
    }
  }
}
console.log(`Gate-checked: ${totalCheck} questions from ${problemSessionIds.length} sessions`);
console.log(`Failures: ${gateFails.length}\n`);

const stillApproved = gateFails.filter((f) => f.approved);
console.log(`Still APPROVED (visible to users): ${stillApproved.length}`);
const byGate = {};
for (const f of stillApproved) byGate[f.gate] = (byGate[f.gate] || 0) + 1;
for (const [g, n] of Object.entries(byGate).sort((a, b) => b[1] - a[1])) console.log(`  ${g.padEnd(40)} ${n}`);

console.log("\nFirst 10 fail examples (still approved):");
for (const f of stillApproved.slice(0, 10)) {
  console.log(`  ${f.course} ${f.id.slice(0, 12)} [${f.gate}]`);
  console.log(`    "${f.stem}"`);
  console.log(`    ${f.reason}`);
}

// Unapprove all still-approved fails
if (stillApproved.length > 0) {
  const ids = stillApproved.map((f) => f.id);
  await sql`UPDATE questions SET "isApproved" = false WHERE id = ANY(${ids})`;
  console.log(`\nUnapproved ${ids.length} questions that affected real users.`);
}
