import "dotenv/config";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);
const r = await sql`
  SELECT course::text AS course,
         COUNT(*) FILTER (WHERE "isApproved" = true AND "questionType" = 'MCQ') AS approved_mcq,
         COUNT(*) FILTER (WHERE "questionType" = 'MCQ') AS total_mcq
  FROM questions
  GROUP BY course
  ORDER BY approved_mcq DESC
`;
console.log("Course bank state (approved MCQ / total MCQ):");
for (const row of r) {
  const tier = row.course.startsWith("AP_") ? "AP " : row.course.startsWith("SAT_") ? "SAT" : row.course.startsWith("ACT_") ? "ACT" : row.course.startsWith("CLEP_") ? "CLEP" : "?  ";
  const visible = Number(row.approved_mcq) >= 200 ? "✓" : "✗";
  console.log(`  [${tier}] ${visible} ${row.course.padEnd(40)} ${String(row.approved_mcq).padStart(5)} / ${row.total_mcq}`);
}
