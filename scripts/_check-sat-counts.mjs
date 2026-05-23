import "dotenv/config";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);
const r = await sql`
  SELECT course::text AS course, COUNT(*)::int AS n
  FROM questions
  WHERE course::text LIKE 'SAT_%' OR course::text LIKE 'ACT_%' OR course::text LIKE 'PSAT_%'
  GROUP BY course ORDER BY course`;
console.table(r);
