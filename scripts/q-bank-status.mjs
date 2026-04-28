import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
const rows = await sql`
  SELECT course::text AS course,
         COUNT(*) FILTER (WHERE "isApproved" = true) AS approved,
         COUNT(*) FILTER (WHERE "isApproved" = true AND "questionType" = 'MCQ') AS mcq,
         COUNT(*) FILTER (WHERE "isApproved" = true AND "questionType" <> 'MCQ') AS frq,
         COUNT(*) FILTER (WHERE "isApproved" = true AND stimulus IS NOT NULL AND LENGTH(stimulus) > 20) AS with_stim,
         COUNT(*) FILTER (WHERE "isApproved" = true AND "stimulusImageUrl" IS NOT NULL) AS with_image
  FROM questions
  WHERE course::text LIKE 'AP_%'
  GROUP BY course
  ORDER BY approved DESC
`;
console.log("AP question bank — approved counts");
console.log("Course                              Total   MCQ   FRQ   w/Stim   w/Img");
for (const r of rows) {
  console.log(
    r.course.padEnd(36) +
    String(r.approved).padStart(6) +
    String(r.mcq).padStart(6) +
    String(r.frq).padStart(6) +
    String(r.with_stim).padStart(9) +
    String(r.with_image).padStart(8)
  );
}
const total = rows.reduce((a, r) => a + Number(r.approved), 0);
console.log("----------------------------------------------------------");
console.log("TOTAL".padEnd(36) + String(total).padStart(6));
