import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
const rows = await sql`
  SELECT id, unit::text as unit, topic, LEFT(stimulus, 250) as stim_preview, LEFT("questionText", 250) as q_preview
  FROM questions
  WHERE course = 'AP_US_HISTORY'::"ApCourse"
    AND "questionType" = 'MCQ'
    AND "isApproved" = true
  ORDER BY RANDOM()
  LIMIT 8
`;
console.log(JSON.stringify(rows, null, 2));
const u = await sql`SELECT DISTINCT unit::text as unit FROM questions WHERE course = 'AP_US_HISTORY'::"ApCourse" ORDER BY unit`;
console.log('UNITS:', u.map(r => r.unit).join(', '));
const dist = await sql`SELECT unit::text as unit, COUNT(*) FROM questions WHERE course = 'AP_US_HISTORY'::"ApCourse" AND "isApproved"=true AND "questionType"='MCQ' GROUP BY unit ORDER BY COUNT(*) DESC`;
console.log('DIST:', JSON.stringify(dist));
