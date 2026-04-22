// One-off: print the first 3 approved USGov questions for quality review.
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const qs = await sql`
  SELECT "questionText", unit, difficulty, topic, options, "correctAnswer", "explanation", "modelUsed"
  FROM "questions"
  WHERE course = 'AP_US_GOVERNMENT' AND "isApproved" = true
  ORDER BY "createdAt" DESC
  LIMIT 3
`;

for (let i = 0; i < qs.length; i++) {
  const q = qs[i];
  console.log(`\n── Q${i + 1} — ${q.difficulty} — unit: ${q.unit} — topic: ${q.topic} — model: ${q.modelUsed || "n/a"} ──`);
  console.log(q.questionText);
  if (q.options) {
    const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
    for (const o of opts) console.log(`  ${o}`);
  }
  console.log(`Correct: ${q.correctAnswer}`);
  console.log(`Explanation: ${(q.explanation || "").slice(0, 300)}${(q.explanation || "").length > 300 ? "…" : ""}`);
}
