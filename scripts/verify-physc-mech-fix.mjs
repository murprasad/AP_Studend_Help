import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const r = await sql`
  SELECT id, unit, topic, LEFT("questionText", 100) AS qt, "createdAt"
  FROM questions
  WHERE "modelUsed" LIKE 'groq/llama-3.3-70b-versatile|ced-gap-fill-1777561458361'
  ORDER BY "createdAt" DESC
`;
console.log(`Smoke-test produced ${r.length} questions (should be 5):\n`);
for (const row of r) {
  console.log(`UNIT: ${row.unit}`);
  console.log(`TOPIC: ${row.topic?.slice(0, 80)}`);
  console.log(`Q: ${row.qt}`);
  console.log("---");
}
// Check unit distribution
const byUnit = {};
for (const row of r) byUnit[row.unit] = (byUnit[row.unit] || 0) + 1;
console.log("Unit distribution:", byUnit);
