// AP Statistics Mock Exam was silently skipping the "Multipart FRQs"
// section because no questions were tagged subtopic="Multipart" — the
// 105 generic FRQs in the bank had subtopic=NULL.
//
// Real CB AP Stats exam: Section II = 6 FRQs total. Q1-Q5 are multipart
// (each ~13 min, multiple sub-prompts) + Q6 is the Investigative Task.
// We already tag the Investigative Task; this script tags 25 generic
// FRQs as "Multipart" so the Mock Exam route can serve real Section II.
//
// Idempotent — only updates rows where subtopic IS NULL or doesn't
// already match a known subtopic.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const TARGET = 25;

const candidates = await sql`
  SELECT id, "questionText", subtopic
  FROM questions
  WHERE course = 'AP_STATISTICS'::"ApCourse"
    AND "isApproved" = true
    AND "questionType" = 'FRQ'::"QuestionType"
    AND (subtopic IS NULL OR subtopic = '' OR subtopic NOT IN ('Multipart', 'Investigative Task'))
  ORDER BY LENGTH("questionText") DESC
  LIMIT ${TARGET}
`;

console.log(`Found ${candidates.length} candidate Stats FRQs to tag as 'Multipart'`);

let tagged = 0;
for (const c of candidates) {
  await sql`UPDATE questions SET subtopic = 'Multipart', "updatedAt" = NOW() WHERE id = ${c.id}`;
  tagged++;
  if (tagged <= 3) console.log(`  ✓ ${c.id.slice(0, 8)}: ${c.questionText.slice(0, 80)}…`);
}
console.log(`\nTagged ${tagged} Stats FRQs with subtopic='Multipart'`);

// Sanity verify
const v = await sql`SELECT COUNT(*)::int AS n FROM questions WHERE course='AP_STATISTICS'::"ApCourse" AND subtopic='Multipart' AND "isApproved"=true`;
console.log(`Verification — Multipart-tagged Stats FRQs in DB: ${v[0].n}`);
