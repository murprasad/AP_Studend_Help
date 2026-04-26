#!/usr/bin/env node
/**
 * Re-randomize MCQ answer positions across the question bank.
 *
 * Why: audit (2026-04-26) showed answer distribution heavily skewed to A
 * across every course (AP_WORLD_HISTORY 86.6% A, AP_CALC_AB 84% A, etc.).
 * Real AP exams use ~25% per option. Students learning to "just guess A"
 * defeats the practice purpose entirely.
 *
 * Approach (per question):
 *   1. Parse options array (e.g. ["A) text", "B) text", "C) text", "D) text"])
 *   2. Strip the "X)" / "X." letter prefix from each option text
 *   3. Identify the correct option by current correctAnswer letter
 *   4. Fisher-Yates shuffle the option text array
 *   5. Re-prefix in new order with A/B/C/D (or A/B/C/D/E if 5-choice)
 *   6. Compute new correctAnswer letter (find original correct text in shuffled array)
 *   7. Update DB row with new options + new correctAnswer
 *
 * Idempotent: safe to run multiple times. Each run produces a fresh
 * random permutation. Run multiple times if a single shuffle still
 * looks skewed (statistically: target is 25% per option).
 *
 * Usage:
 *   node scripts/shuffle-mcq-answers.mjs                  # all courses, ALL questions
 *   node scripts/shuffle-mcq-answers.mjs AP_WORLD_HISTORY # single course
 *   node scripts/shuffle-mcq-answers.mjs --dry            # report only, no DB write
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const dryRun = args.includes("--dry");
const courseFilter = args.find((a) => a.startsWith("AP_") || a.startsWith("SAT_") || a.startsWith("ACT_") || a.startsWith("CLEP_"));

// Strip "A) ", "A. ", "A: ", "(A) " prefixes — handle the various formats AI generates.
function stripLetterPrefix(text) {
  return String(text).replace(/^[ \t]*[\(]?[A-E][\)\.\:]\s*/i, "").trim();
}

// Add "X) " prefix to option text.
function addLetterPrefix(text, letter) {
  return `${letter}) ${text}`;
}

// Fisher-Yates shuffle (in-place).
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

(async () => {
  console.log(`\n🔀 MCQ answer shuffle ${dryRun ? "(DRY RUN)" : "(WRITE)"}\n`);

  const rows = courseFilter
    ? await sql`
        SELECT id, course, options, "correctAnswer"
        FROM questions
        WHERE "questionType" = 'MCQ' AND course = ${courseFilter}::"ApCourse"
      `
    : await sql`
        SELECT id, course, options, "correctAnswer"
        FROM questions
        WHERE "questionType" = 'MCQ'
      `;
  console.log(`Loaded ${rows.length} MCQs from ${courseFilter ?? "ALL courses"}\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      // options is stored as JSON STRING in our DB (per inspect-question-shape).
      const opts = typeof row.options === "string" ? JSON.parse(row.options) : row.options;
      if (!Array.isArray(opts) || opts.length < 2) {
        skipped++;
        continue;
      }
      const numOpts = opts.length;
      const letters = ["A", "B", "C", "D", "E"].slice(0, numOpts);

      // Strip prefixes to get clean option text.
      const cleanOpts = opts.map(stripLetterPrefix);

      // Find current correct option's text (by current letter).
      const currentLetter = String(row.correctAnswer).trim().toUpperCase();
      const currentIdx = letters.indexOf(currentLetter);
      if (currentIdx === -1 || currentIdx >= cleanOpts.length) {
        // Malformed — skip
        skipped++;
        continue;
      }
      const correctText = cleanOpts[currentIdx];

      // Shuffle clean options.
      const shuffled = shuffleArray([...cleanOpts]);
      // Find new index of correct option.
      const newIdx = shuffled.indexOf(correctText);
      if (newIdx === -1) {
        errors++;
        continue;
      }
      const newLetter = letters[newIdx];

      // Re-prefix in new order.
      const newOptions = shuffled.map((text, i) => addLetterPrefix(text, letters[i]));

      if (dryRun) {
        if (currentLetter !== newLetter) {
          console.log(`  [DRY] ${row.id.slice(0, 8)} ${row.course} — was ${currentLetter}, now ${newLetter}`);
        }
        updated++;
      } else {
        await sql`
          UPDATE questions
          SET options = ${JSON.stringify(newOptions)}, "correctAnswer" = ${newLetter}
          WHERE id = ${row.id}
        `;
        updated++;
      }
    } catch (e) {
      errors++;
      console.error(`  ✗ ${row.id.slice(0, 8)} error: ${e.message}`);
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`  Total MCQs:  ${rows.length}`);
  console.log(`  Updated:     ${updated}`);
  console.log(`  Skipped:     ${skipped} (malformed or non-array options)`);
  console.log(`  Errors:      ${errors}`);

  if (!dryRun) {
    // Verify new distribution.
    console.log(`\n=== New distribution (post-shuffle) ===\n`);
    const dist = courseFilter
      ? await sql`
          SELECT course, "correctAnswer", COUNT(*)::int AS n
          FROM questions
          WHERE "questionType" = 'MCQ' AND course = ${courseFilter}::"ApCourse"
          GROUP BY course, "correctAnswer"
          ORDER BY course, "correctAnswer"
        `
      : await sql`
          SELECT course, "correctAnswer", COUNT(*)::int AS n
          FROM questions
          WHERE "questionType" = 'MCQ'
          GROUP BY course, "correctAnswer"
          ORDER BY course, "correctAnswer"
        `;
    let curCourse = "";
    let courseCount = {};
    for (const r of dist) {
      if (r.course !== curCourse) {
        if (curCourse) {
          const total = Object.values(courseCount).reduce((a, b) => a + b, 0);
          for (const [letter, n] of Object.entries(courseCount)) {
            const pct = ((n / total) * 100).toFixed(1);
            console.log(`    ${letter}: ${String(n).padStart(4)}  (${pct.padStart(5)}%)`);
          }
        }
        console.log(`\n  ${r.course}:`);
        curCourse = r.course;
        courseCount = {};
      }
      courseCount[r.correctAnswer] = r.n;
    }
    // Final course flush.
    if (curCourse) {
      const total = Object.values(courseCount).reduce((a, b) => a + b, 0);
      for (const [letter, n] of Object.entries(courseCount)) {
        const pct = ((n / total) * 100).toFixed(1);
        console.log(`    ${letter}: ${String(n).padStart(4)}  (${pct.padStart(5)}%)`);
      }
    }
  }
})().catch((e) => { console.error("Fatal:", e); process.exit(1); });
