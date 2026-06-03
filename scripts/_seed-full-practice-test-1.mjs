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
// Run: node scripts/_seed-full-practice-test-1.mjs

import { config } from "dotenv";
config({ path: "C:/Users/akkil/project/AP_Help/.env" });
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");

const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const TARGETS = [
  // Tag each unit's target Q count for Test 1 (CB spec: 13-15 / 13-15 / 5-7 / 5-7)
  { domain: "Algebra", units: ["SAT_MATH_1_ALGEBRA"], count: 14 },
  { domain: "Advanced Math", units: ["SAT_MATH_2_ADVANCED_MATH"], count: 14 },
  { domain: "PSDA", units: ["SAT_MATH_3_PROBLEM_SOLVING"], count: 8 },
  { domain: "Geometry & Trig", units: ["SAT_MATH_4_GEOMETRY_TRIG"], count: 8 },
];

console.log(`\n═══ Seeding Full Practice Test 1 ═══`);

// Clear any prior seed for set=1
const cleared = await sql`UPDATE questions SET "practiceTestSet" = NULL, "practiceTestPosition" = NULL WHERE "practiceTestSet" = 1`;
console.log(`Cleared prior set=1 assignments.`);

let position = 1;
const selected = [];

for (const target of TARGETS) {
  // Prefer: distractorExplanations populated + stimulus + recent
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

  console.log(`\n${target.domain}: found ${rows.length} candidates (target ${target.count})`);
  for (const r of rows) {
    selected.push({ id: r.id, position: position++, domain: target.domain });
    process.stdout.write(`  [${position - 1}] ${r.id.slice(0, 8)} ${r.has_distractors ? "✓distr" : "—"} ${r.has_image ? "✓img" : "—"}\n`);
  }
}

console.log(`\nTotal selected: ${selected.length} / 44 target.`);

// Apply set=1 tag
let updated = 0;
for (const s of selected) {
  await sql`
    UPDATE questions
    SET "practiceTestSet" = 1,
        "practiceTestPosition" = ${s.position},
        "updatedAt" = NOW()
    WHERE id = ${s.id}
  `;
  updated++;
}

console.log(`\nUpdated ${updated} rows.`);
console.log(`Module 1 (positions 1-22): Algebra + first half of Advanced Math`);
console.log(`Module 2 (positions 23-44): Advanced Math + PSDA + Geometry`);
console.log(`\nFull Practice Test 1 is now seeded. /full-practice-test → Start Test 1 will deliver these Qs.\n`);
