import "dotenv/config";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);
const since = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(); // last 4 hours
const r = await sql`
  SELECT course::text AS course,
         SUM(CASE WHEN "isApproved" = true THEN 1 ELSE 0 END)::int AS approved,
         SUM(CASE WHEN "isApproved" = false THEN 1 ELSE 0 END)::int AS unapproved,
         COUNT(*)::int AS total
  FROM questions
  WHERE "createdAt" > ${since}
  GROUP BY course
  ORDER BY total DESC
`;
console.log(`Questions created since ${since}:`);
for (const row of r) {
  console.log(`  ${row.course.padEnd(40)} approved=${row.approved} unapproved=${row.unapproved} total=${row.total}`);
}
const total = r.reduce((s, x) => s + Number(x.total), 0);
console.log(`Total: ${total}`);
