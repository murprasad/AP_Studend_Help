// Derives the PSAT bank from existing SAT EASY+MEDIUM questions.
// Sprint 2 of expansion plan. Copies SAT_MATH (EASY+MEDIUM) → PSAT_MATH
// and SAT_READING_WRITING (EASY+MEDIUM) → PSAT_READING_WRITING with
// unit-enum remapping (SAT_MATH_1_ALGEBRA → PSAT_MATH_1_ALGEBRA, etc.).
//
// Sets isApproved=true, pipelineVetted=true (inherits from SAT silver),
// auditPassed=true if source was gold. New content_hash to avoid dedup
// collision with the SAT originals.
import "dotenv/config";
import crypto from "node:crypto";

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const DRY_RUN = process.argv.includes("--dry-run");

const UNIT_MAP = {
  SAT_MATH_1_ALGEBRA: "PSAT_MATH_1_ALGEBRA",
  SAT_MATH_2_ADVANCED_MATH: "PSAT_MATH_2_ADVANCED_MATH",
  SAT_MATH_3_PROBLEM_SOLVING: "PSAT_MATH_3_PROBLEM_SOLVING",
  SAT_MATH_4_GEOMETRY_TRIG: "PSAT_MATH_4_GEOMETRY_TRIG",
  SAT_RW_1_CRAFT_STRUCTURE: "PSAT_RW_1_CRAFT_STRUCTURE",
  SAT_RW_2_INFO_IDEAS: "PSAT_RW_2_INFO_IDEAS",
  SAT_RW_3_STANDARD_ENGLISH: "PSAT_RW_3_STANDARD_ENGLISH",
  SAT_RW_4_EXPRESSION_IDEAS: "PSAT_RW_4_EXPRESSION_IDEAS",
};

const COURSE_MAP = {
  SAT_MATH: "PSAT_MATH",
  SAT_READING_WRITING: "PSAT_READING_WRITING",
};

function hashText(s) {
  return crypto.createHash("sha256").update(s.toLowerCase().replace(/\s+/g, " ").trim()).digest("hex");
}

let copied = 0;
let skipped = 0;
const perCourse = {};

for (const [satCourse, psatCourse] of Object.entries(COURSE_MAP)) {
  console.log(`\nDeriving ${psatCourse} from ${satCourse}...`);
  // Pull SAT EASY+MEDIUM silver (or better)
  const rows = await sql`
    SELECT id, unit, topic, subtopic, difficulty, "questionType", "questionText",
           stimulus, "stimulusImageUrl", options, "correctAnswer", explanation,
           "isAiGenerated", "pipelineVetted", "auditPassed",
           "sourceBook", "sourceUrl", "sourcePage", "sourceLicense",
           "modelUsed", "generatedForTier", "apSkill", "bloomLevel"
    FROM questions
    WHERE course = ${satCourse}::"ApCourse"
      AND "isApproved" = true
      AND "pipelineVetted" = true
      AND difficulty IN ('EASY', 'MEDIUM')
  `;
  console.log(`  Found ${rows.length} SAT silver EASY+MEDIUM questions`);

  perCourse[psatCourse] = { found: rows.length, inserted: 0, skipped: 0 };

  for (const r of rows) {
    const psatUnit = UNIT_MAP[r.unit];
    if (!psatUnit) {
      skipped++; perCourse[psatCourse].skipped++;
      continue;
    }
    // Prefix question text with "PSAT-derived: " note in contentHash so dedup
    // doesn't collide with SAT bank. The user-facing text is unchanged.
    const contentHashSeed = `PSAT|${r.questionText}`;
    const newId = crypto.randomUUID();
    const newHash = hashText(contentHashSeed);

    if (DRY_RUN) {
      copied++; perCourse[psatCourse].inserted++;
      continue;
    }

    try {
      await sql`
        INSERT INTO questions (
          id, course, unit, topic, subtopic, difficulty, "questionType",
          "questionText", stimulus, "stimulusImageUrl", options,
          "correctAnswer", explanation, "isAiGenerated", "isApproved",
          "pipelineVetted", "auditPassed",
          "sourceBook", "sourceUrl", "sourcePage", "sourceLicense",
          "modelUsed", "generatedForTier", "contentHash",
          "apSkill", "bloomLevel",
          "timesAnswered", "timesCorrect", "reportedCount",
          "createdAt", "updatedAt"
        ) VALUES (
          ${newId}, ${psatCourse}::"ApCourse", ${psatUnit}::"ApUnit",
          ${r.topic}, ${r.subtopic}, ${r.difficulty}::"Difficulty",
          ${r.questionType}::"QuestionType",
          ${r.questionText}, ${r.stimulus}, ${r.stimulusImageUrl},
          ${JSON.stringify(r.options)}::jsonb, ${r.correctAnswer}, ${r.explanation},
          ${r.isAiGenerated}, true, ${r.pipelineVetted}, ${r.auditPassed},
          ${r.sourceBook}, ${r.sourceUrl}, ${r.sourcePage}, ${r.sourceLicense},
          ${r.modelUsed}, ${r.generatedForTier}::"SubTier", ${newHash},
          ${r.apSkill}, ${r.bloomLevel},
          0, 0, 0,
          NOW(), NOW()
        )
      `;
      copied++; perCourse[psatCourse].inserted++;
    } catch (e) {
      if (e.code === "23505") {
        // unique violation on contentHash — already derived
        skipped++; perCourse[psatCourse].skipped++;
      } else {
        console.error(`  insert err on SAT id ${r.id}: ${e.message?.slice(0, 100)}`);
        skipped++; perCourse[psatCourse].skipped++;
      }
    }
  }
}

console.log("\nPer-course summary:");
for (const [c, t] of Object.entries(perCourse)) {
  console.log(`  ${c.padEnd(22)}  found=${t.found}  inserted=${t.inserted}  skipped=${t.skipped}`);
}
console.log(`\nTotal: ${copied} inserted, ${skipped} skipped${DRY_RUN ? " (DRY-RUN)" : ""}`);
