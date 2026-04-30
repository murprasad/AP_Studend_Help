import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const fresh = await sql`SELECT COUNT(*)::int AS n FROM questions WHERE course='AP_PHYSICS_C_MECHANICS' AND "createdAt" > NOW() - INTERVAL '1 hour'`;
const total = await sql`SELECT COUNT(*)::int AS n FROM questions WHERE course='AP_PHYSICS_C_MECHANICS'`;
const sample = await sql`SELECT id, unit, LEFT("questionText", 80) AS q, "createdAt", "modelUsed" FROM questions WHERE course='AP_PHYSICS_C_MECHANICS' ORDER BY "createdAt" DESC LIMIT 5`;
console.log("Last 1h:", fresh[0].n);
console.log("Total :", total[0].n);
console.log("Sample (newest):");
for (const r of sample) console.log(" -", r.unit, "|", r.q, "|", r.modelUsed?.slice(0,60), "|", r.createdAt);
