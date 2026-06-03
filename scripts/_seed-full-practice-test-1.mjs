// Seed Full Practice Test 1 — tag 44 existing approved SAT_MATH Qs with
// practiceTestSet=1 + sequential practiceTestPosition.
//
// Selection criteria (CB-aligned per cb_spec/SAT_MATH.json):
//   - 14 from Algebra (ALL units → topic match)
//   - 14 from Advanced Math
//   - 8 from Problem-Solving and Data Analysis
//   - 8 from Geometry and Trigonometry
//
// Prefer questions with:
//   1. distractorExplanations populated (CB-style wrong-answer feedback)
//   2. stimulusImageUrl populated (figure-based, matches CB)
//   3. Random selection from remaining pool
//
// Run: node scripts/_seed-full-practice-test-1.mjs            # seeds set 1
//      node scripts/_seed-full-practice-test-1.mjs --set=2    # seeds set 2
//      node scripts/_seed-full-practice-test-1.mjs --all      # seeds 1, 2, 3

import { config } from "dotenv";
config({ path: "C:/Users/akkil/project/AP_Help/.env" });
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");

const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const FLAGS = process.argv.slice(2);
const SET_FLAG = FLAGS.find((f) => f.startsWith("--set="))?.split("=")[1];
const ALL = FLAGS.includes("--all");
const SETS_TO_SEED = ALL ? [1, 2, 3] : SET_FLAG ? [parseInt(SET_FLAG, 10)] : [1];

const TARGETS = [
  // Tag each unit's target Q count for Test 1 (CB spec: 13-15 / 13-15 / 5-7 / 5-7)
  { domain: "Algebra", units: ["SAT_MATH_1_ALGEBRA"], count: 14 },
  { domain: "Advanced Math", units: ["SAT_MATH_2_ADVANCED_MATH"], count: 14 },
  { domain: "PSDA", units: ["SAT_MATH_3_PROBLEM_SOLVING"], count: 8 },
  { domain: "Geometry & Trig", units: ["SAT_MATH_4_GEOMETRY_TRIG"], count: 8 },
];

for (const setN of SETS_TO_SEED) {
  console.log(`\n═══ Seeding Full Practice Test ${setN} ═══`);

  // Clear any prior seed for this set
  await sql`UPDATE questions SET "practiceTestSet" = NULL, "practiceTestPosition" = NULL WHERE "practiceTestSet" = ${setN}`;
  console.log(`Cleared prior set=${setN} assignments.`);

  let position = 1;
  const selected = [];

  for (const target of TARGETS) {
    const rows = await sql`
      SELECT id, "questionText", unit, topic,
        ("distractorExplanations" IS NOT NULL) AS has_distractors,
        ("stimulusImageUrl" IS NOT NULL AND "stimulusImageUrl" != '') AS has_image
      FROM questions
      WHERE course::text = 'SAT_MATH'
        AND "isApproved" = true
        AND "questionType"::text = 'MCQ'
        AND unit::text = ANY(${target.units}::text[])
        AND "practiceTestSet" IS NULL
      ORDER BY has_distractors DESC, has_image DESC, RANDOM()
      LIMIT ${target.count}
    `;

    console.log(`\n  ${target.domain}: found ${rows.length} candidates (target ${target.count})`);
    for (const r of rows) {
      selected.push({ id: r.id, position: position++, domain: target.domain });
    }
  }

  console.log(`\n  Total selected: ${selected.length} / 44 target.`);

  for (const s of selected) {
    await sql`
      UPDATE questions
      SET "practiceTestSet" = ${setN},
          "practiceTestPosition" = ${s.position},
          "updatedAt" = NOW()
      WHERE id = ${s.id}
    `;
  }
  console.log(`  Set ${setN} → ${selected.length} rows tagged.`);
}

console.log(`\nDone. /full-practice-test → Start Test {N} will deliver each set deterministically.\n`);
