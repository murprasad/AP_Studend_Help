// Pull 3 random approved MCQs per AP course. Print full question with
// stimulus, options, correct answer, explanation. For me to judge as
// a CB-savvy 10-11th grader.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const courses = [
  "AP_WORLD_HISTORY", "AP_US_HISTORY", "AP_US_GOVERNMENT", "AP_HUMAN_GEOGRAPHY",
  "AP_PSYCHOLOGY", "AP_ENVIRONMENTAL_SCIENCE", "AP_BIOLOGY", "AP_CHEMISTRY",
  "AP_PHYSICS_1", "AP_STATISTICS", "AP_CALCULUS_AB", "AP_CALCULUS_BC",
  "AP_PRECALCULUS", "AP_COMPUTER_SCIENCE_PRINCIPLES",
];

for (const c of courses) {
  const rows = await sql`
    SELECT id, course::text AS course, unit::text AS unit, "questionText",
           stimulus, options, "correctAnswer", explanation
    FROM questions
    WHERE course = ${c}::"ApCourse"
      AND "isApproved" = true
      AND "questionType" = 'MCQ'
    ORDER BY RANDOM()
    LIMIT 3
  `;
  console.log("\n" + "=".repeat(80));
  console.log(c);
  console.log("=".repeat(80));
  for (const q of rows) {
    console.log("\n--- " + q.id.slice(0, 8) + " | unit=" + q.unit + " ---");
    if (q.stimulus) console.log("STIMULUS: " + q.stimulus);
    console.log("Q: " + q.questionText);
    const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
    if (Array.isArray(opts)) for (const o of opts) console.log("  " + o);
    console.log("CORRECT: " + q.correctAnswer);
    console.log("EXPL: " + (q.explanation ?? "").slice(0, 400));
  }
}
