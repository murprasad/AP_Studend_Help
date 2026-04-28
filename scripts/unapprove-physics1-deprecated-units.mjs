// Unapprove AP Physics 1 questions in units PHY1_8 (Electric Charge & Force)
// and PHY1_9 (DC Circuits). College Board redesigned AP Physics 1 effective
// 2024-25 — these topics were MOVED to AP Physics 2.
//
// Trigger: user feedback from Luke Hagood (2026-04-29):
//   "Circuits/charges are not in the curriculum anymore"
//
// Reversible: only flips isApproved=false + adds modelUsed marker.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const MARKER = "ap-physics-1-redesign-2024";
const dry = process.argv.includes("--dry");

const before = await sql`
  SELECT unit::text AS unit, COUNT(*)::int AS n
  FROM questions
  WHERE course = 'AP_PHYSICS_1'::"ApCourse"
    AND "isApproved" = true
    AND unit::text IN ('PHY1_8_ELECTRIC_CHARGE_AND_FORCE', 'PHY1_9_DC_CIRCUITS')
  GROUP BY unit::text
`;
console.log("BEFORE:", before);

if (dry) { console.log("DRY — no writes"); process.exit(0); }

const result = await sql`
  UPDATE questions
  SET "isApproved" = false,
      "modelUsed" = COALESCE("modelUsed", '') || ${'|' + MARKER},
      "updatedAt" = NOW()
  WHERE course = 'AP_PHYSICS_1'::"ApCourse"
    AND "isApproved" = true
    AND unit::text IN ('PHY1_8_ELECTRIC_CHARGE_AND_FORCE', 'PHY1_9_DC_CIRCUITS')
  RETURNING id
`;
console.log(`Unapproved: ${result.length} questions`);
