#!/usr/bin/env node
// Audit AP World History question bank: stimulus presence + answer distribution.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

(async () => {
  console.log("\n=== AP World History MCQ audit ===\n");

  // Total count.
  const [total] = await sql`
    SELECT COUNT(*)::int AS n
    FROM questions
    WHERE course = 'AP_WORLD_HISTORY' AND "questionType" = 'MCQ'
  `;
  console.log(`Total approved MCQs: ${total.n}`);

  // Stimulus presence.
  const [withStim] = await sql`
    SELECT COUNT(*)::int AS n
    FROM questions
    WHERE course = 'AP_WORLD_HISTORY' AND "questionType" = 'MCQ'
      AND stimulus IS NOT NULL AND length(stimulus) > 50
  `;
  const [shortStim] = await sql`
    SELECT COUNT(*)::int AS n
    FROM questions
    WHERE course = 'AP_WORLD_HISTORY' AND "questionType" = 'MCQ'
      AND stimulus IS NOT NULL AND length(stimulus) <= 50
  `;
  const [noStim] = await sql`
    SELECT COUNT(*)::int AS n
    FROM questions
    WHERE course = 'AP_WORLD_HISTORY' AND "questionType" = 'MCQ'
      AND stimulus IS NULL
  `;
  console.log(`\n--- Stimulus presence ---`);
  console.log(`  With stimulus (>50 chars):   ${withStim.n}  (${((withStim.n / total.n) * 100).toFixed(1)}%)`);
  console.log(`  Short stimulus (<=50 chars): ${shortStim.n}  (${((shortStim.n / total.n) * 100).toFixed(1)}%)`);
  console.log(`  NO stimulus (null):          ${noStim.n}  (${((noStim.n / total.n) * 100).toFixed(1)}%)`);

  // Answer distribution.
  const dist = await sql`
    SELECT "correctAnswer", COUNT(*)::int AS n
    FROM questions
    WHERE course = 'AP_WORLD_HISTORY' AND "questionType" = 'MCQ'
    GROUP BY "correctAnswer"
    ORDER BY "correctAnswer"
  `;
  console.log(`\n--- Answer distribution ---`);
  for (const r of dist) {
    const pct = ((r.n / total.n) * 100).toFixed(1);
    const bar = "█".repeat(Math.round(r.n / total.n * 40));
    console.log(`  ${r.correctAnswer}: ${String(r.n).padStart(4)}  (${pct.padStart(5)}%)  ${bar}`);
  }

  // Cross-course distribution for context.
  console.log(`\n=== Answer distribution across ALL courses (for comparison) ===\n`);
  const allDist = await sql`
    SELECT course, "correctAnswer", COUNT(*)::int AS n
    FROM questions
    WHERE "questionType" = 'MCQ'
    GROUP BY course, "correctAnswer"
    ORDER BY course, "correctAnswer"
  `;
  let curCourse = "";
  for (const r of allDist) {
    if (r.course !== curCourse) {
      console.log(`\n  ${r.course}:`);
      curCourse = r.course;
    }
    console.log(`    ${r.correctAnswer}: ${r.n}`);
  }

  // 5 example WHist questions to spot-check stimulus quality.
  console.log(`\n=== 5 random AP World History MCQ samples ===\n`);
  const samples = await sql`
    SELECT id, "questionText", stimulus, "correctAnswer", unit, topic
    FROM questions
    WHERE course = 'AP_WORLD_HISTORY' AND "questionType" = 'MCQ'
    ORDER BY random()
    LIMIT 5
  `;
  for (const q of samples) {
    console.log(`--- Q ${q.id.slice(0, 8)} (Unit: ${q.unit}, Topic: ${q.topic}) ---`);
    console.log(`  Stimulus: ${q.stimulus ? `"${q.stimulus.slice(0, 120)}${q.stimulus.length > 120 ? '...' : ''}"` : 'NULL ❌'}`);
    console.log(`  Question: ${q.questionText.slice(0, 200)}${q.questionText.length > 200 ? '...' : ''}`);
    console.log(`  Correct: ${q.correctAnswer}\n`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
