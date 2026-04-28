import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const empty = await sql`
  SELECT COUNT(*)::int as n
  FROM questions
  WHERE "isApproved" = true
    AND (explanation IS NULL OR LENGTH(explanation) < 20)
`;
console.log(`Empty explanations remaining: ${empty[0].n}`);

const noStim = await sql`
  SELECT COUNT(*)::int as n, course::text as course
  FROM questions
  WHERE "isApproved" = true
    AND "questionType" = 'MCQ'
    AND course IN ('AP_US_GOVERNMENT', 'AP_HUMAN_GEOGRAPHY', 'AP_ENVIRONMENTAL_SCIENCE')
    AND (stimulus IS NULL OR LENGTH(stimulus) < 20)
  GROUP BY course
`;
console.log("\nUSGov/HuGeo/APES naked-stem MCQs remaining:");
noStim.forEach(r => console.log(`  ${r.course}: ${r.n}`));
const sumNoStim = noStim.reduce((s, r) => s + r.n, 0);
console.log(`  TOTAL: ${sumNoStim}`);

const realImg = await sql`
  SELECT COUNT(*)::int as n, course::text as course
  FROM questions
  WHERE "isApproved" = true
    AND "stimulusImageUrl" IS NOT NULL
    AND course IN ('AP_BIOLOGY', 'AP_CHEMISTRY', 'AP_PHYSICS_1', 'AP_PSYCHOLOGY', 'AP_HUMAN_GEOGRAPHY', 'AP_ENVIRONMENTAL_SCIENCE', 'AP_US_GOVERNMENT', 'AP_US_HISTORY', 'AP_WORLD_HISTORY')
  GROUP BY course
  ORDER BY n DESC
`;
console.log("\nReal images attached so far (Wikimedia Commons):");
realImg.forEach(r => console.log(`  ${r.course}: ${r.n}`));
const totalImg = realImg.reduce((s, r) => s + r.n, 0);
console.log(`  TOTAL: ${totalImg}`);

const dbq = await sql`SELECT COUNT(*)::int as n FROM questions WHERE course = 'AP_US_HISTORY'::"ApCourse" AND "questionType" = 'DBQ' AND "isApproved" = true`;
console.log(`\nAPUSH DBQ pool: ${dbq[0].n}`);
