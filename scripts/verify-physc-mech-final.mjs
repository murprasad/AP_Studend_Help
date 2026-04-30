import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const total = await sql`SELECT COUNT(*)::int AS n FROM questions WHERE course='AP_PHYSICS_C_MECHANICS'`;
const fresh = await sql`SELECT COUNT(*)::int AS n FROM questions WHERE course='AP_PHYSICS_C_MECHANICS' AND "modelUsed" LIKE 'groq/llama-3.3-70b-versatile|ced-gap-fill-1777561509560'`;
const byUnit = await sql`SELECT unit, COUNT(*)::int AS n FROM questions WHERE course='AP_PHYSICS_C_MECHANICS' AND "modelUsed" LIKE 'groq/llama-3.3-70b-versatile|ced-gap-fill-1777561509560' GROUP BY unit ORDER BY unit`;
const sample = await sql`SELECT unit, topic, LEFT("questionText", 90) AS qt FROM questions WHERE course='AP_PHYSICS_C_MECHANICS' AND "modelUsed" LIKE 'groq/llama-3.3-70b-versatile|ced-gap-fill-1777561509560' ORDER BY RANDOM() LIMIT 8`;
console.log(`Total Physics C Mech: ${total[0].n} (was 39)`);
console.log(`From this run: ${fresh[0].n}`);
console.log(`\nUnit distribution:`);
for (const r of byUnit) console.log(`  ${r.unit.padEnd(40)} ${r.n}`);
console.log(`\nRandom sample:`);
for (const r of sample) {
  console.log(`  [${r.unit}] ${r.topic?.slice(0, 50)}`);
  console.log(`    ${r.qt}`);
}
