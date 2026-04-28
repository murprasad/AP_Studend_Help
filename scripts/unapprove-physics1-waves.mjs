// Extension of unapprove-physics1-deprecated-units.mjs.
// PHY1_10 (Mechanical Waves & Sound) was also moved to AP Physics 2 in the
// 2024-25 CB redesign. Audit script (audit-ap-curriculum-drift.mjs) flagged
// 52 still-approved questions. User authorized "similar issues" sweep.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const MARKER = "ap-physics-1-redesign-2024-waves";
const dry = process.argv.includes("--dry");

const before = await sql`
  SELECT unit::text AS unit, COUNT(*)::int AS n
  FROM questions
  WHERE course = 'AP_PHYSICS_1'::"ApCourse"
    AND "isApproved" = true
    AND unit::text = 'PHY1_10_WAVES_AND_SOUND'
  GROUP BY unit::text
`;
console.log("BEFORE:", before);

if (dry) { console.log("DRY"); process.exit(0); }

const result = await sql`
  UPDATE questions
  SET "isApproved" = false,
      "modelUsed" = COALESCE("modelUsed", '') || ${'|' + MARKER},
      "updatedAt" = NOW()
  WHERE course = 'AP_PHYSICS_1'::"ApCourse"
    AND "isApproved" = true
    AND unit::text = 'PHY1_10_WAVES_AND_SOUND'
  RETURNING id
`;
console.log(`Unapproved: ${result.length} questions`);
