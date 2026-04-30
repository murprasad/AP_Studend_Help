import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

// Roll back the 4 bad inserts from the buggy run (marker ced-gap-fill-1777560640753).
// They were generated with [object Object] as topic prompt → off-topic content
// + all stored under PHYC_M_1_KINEMATICS regardless of actual subject.
const r = await sql`DELETE FROM questions WHERE "modelUsed" = 'groq/llama-3.3-70b-versatile|ced-gap-fill-1777560640753' RETURNING id, "questionText"`;
console.log(`Deleted ${r.length} bad inserts`);
for (const row of r) console.log(" -", row.id, "|", row.questionText.slice(0, 80));
const total = await sql`SELECT COUNT(*)::int AS n FROM questions WHERE course='AP_PHYSICS_C_MECHANICS'`;
console.log(`AP_PHYSICS_C_MECHANICS total now: ${total[0].n}`);
