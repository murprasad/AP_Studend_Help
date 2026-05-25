/** Revert today's options-lazy-shared-prefix-word unapprovals — gate was over-aggressive on lit/comp courses. */
import "dotenv/config";
import { runDeterministicGates } from "./lib/_question-gates.mjs";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

// Re-approve every Q unapproved in the last 2 hours that fails ONLY because of
// options-lazy-shared-prefix-word (and not any other gate).
const recent = await sql`
  SELECT id, course::text AS course, "questionText", options, "correctAnswer", explanation
  FROM questions
  WHERE "isApproved" = false
    AND "updatedAt" > NOW() - INTERVAL '2 hours'
    AND "questionType" = 'MCQ'
`;
console.log(`Scanning ${recent.length} recently-unapproved Qs for revert candidates…`);

let reverted = 0, kept = 0;
for (const r of recent) {
  const opts = Array.isArray(r.options) ? r.options : JSON.parse(r.options || "[]");
  // Temporarily skip the lazy-prefix gate by stubbing it (cheap: use a stem placeholder
  // that bypasses, then re-run). Cleanest: run the original gate and inspect.
  const gate = runDeterministicGates({
    questionText: r.questionText, options: opts, correctAnswer: r.correctAnswer,
    explanation: r.explanation, course: r.course,
  });
  if (gate.ok || gate.gate === "options-lazy-shared-prefix-word") {
    // Re-approve — failure was only the over-aggressive gate (or now passes)
    await sql`UPDATE questions SET "isApproved" = true, "updatedAt" = NOW() WHERE id = ${r.id}`;
    reverted++;
  } else {
    kept++;
  }
}
console.log(`\nReverted (re-approved): ${reverted}`);
console.log(`Kept unapproved (other real failures): ${kept}`);
