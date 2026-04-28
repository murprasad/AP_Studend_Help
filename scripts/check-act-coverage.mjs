import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

for (const c of ["ACT_READING", "ACT_ENGLISH", "ACT_SCIENCE", "ACT_MATH"]) {
  const r = await sql`
    SELECT
      COUNT(*) FILTER (WHERE "isApproved" = true)::int AS approved,
      COUNT(*) FILTER (WHERE "isApproved" = true AND (stimulus IS NULL OR LENGTH(stimulus) < 100))::int AS no_passage,
      COUNT(*) FILTER (WHERE "isApproved" = true AND LENGTH(stimulus) >= 100)::int AS has_passage
    FROM questions WHERE course = ${c}::"ApCourse" AND "questionType" = 'MCQ'
  `;
  console.log(c.padEnd(15), JSON.stringify(r[0]));
}
