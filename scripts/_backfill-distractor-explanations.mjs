// Backfill distractorExplanations on existing approved SAT_MATH questions.
//
// Background:
//   Existing SAT_MATH bank has 1792 approved questions, each with a single
//   `explanation` field. Per Fidelity P4, every wrong option should have its
//   own targeted explanation that addresses the specific misconception. This
//   script generates those per-option explanations for existing questions in
//   batches so the inline-distractor UI lights up retroactively.
//
// Strategy:
//   - Pull N approved MCQ questions where distractorExplanations IS NULL
//   - For each, call Groq with a strict-JSON prompt
//   - Validate response shape; update DB on success; skip on fail
//   - Rate-limit-aware: 1.2s gap between calls
//
// Run:
//   node scripts/_backfill-distractor-explanations.mjs --course=SAT_MATH --limit=50
//   node scripts/_backfill-distractor-explanations.mjs --course=SAT_MATH --limit=1 --dry-run

import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
config({ path: "C:/Users/akkil/project/AP_Help/.env" });
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FLAGS = process.argv.slice(2);
const COURSE = FLAGS.find((f) => f.startsWith("--course="))?.split("=")[1] ?? "SAT_MATH";
const LIMIT = parseInt(FLAGS.find((f) => f.startsWith("--limit="))?.split("=")[1] ?? "20", 10);
const DRY_RUN = FLAGS.includes("--dry-run");

const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const GROQ_KEY = process.env.GROQ_API_KEY;
if (!GROQ_KEY) {
  console.error("GROQ_API_KEY not set in .env. Aborting.");
  process.exit(1);
}

console.log(`\n═══ Distractor backfill — ${COURSE} (limit=${LIMIT}, dry-run=${DRY_RUN}) ═══`);

const rows = await sql`
  SELECT id, "questionText", options, "correctAnswer", explanation, course, unit, topic
  FROM questions
  WHERE course::text = ${COURSE}
    AND "isApproved" = true
    AND "questionType"::text = 'MCQ'
    AND "distractorExplanations" IS NULL
  ORDER BY "createdAt" DESC
  LIMIT ${LIMIT}
`;

console.log(`Found ${rows.length} eligible questions.`);
if (rows.length === 0) {
  console.log("Nothing to backfill. Exiting.");
  process.exit(0);
}

let success = 0;
let skipped = 0;
let failed = 0;

for (let i = 0; i < rows.length; i++) {
  const q = rows[i];
  process.stdout.write(`[${i + 1}/${rows.length}] ${q.id.slice(0, 8)} ${q.topic ?? q.unit}... `);

  // Parse options array (each entry typically "A) text..." or "A. text...")
  const opts = Array.isArray(q.options) ? q.options : (typeof q.options === "string" ? JSON.parse(q.options) : []);
  if (opts.length !== 4) {
    process.stdout.write(`skipped (options.length=${opts.length})\n`);
    skipped++;
    continue;
  }
  const correctLetter = (q.correctAnswer || "").toUpperCase().trim().charAt(0);
  if (!"ABCD".includes(correctLetter)) {
    process.stdout.write(`skipped (correctAnswer="${q.correctAnswer}")\n`);
    skipped++;
    continue;
  }

  const wrongLetters = "ABCD".split("").filter((L) => L !== correctLetter);

  const prompt = `You are reviewing an SAT Math question for a student who picked the wrong answer.

Question: ${q.questionText}
Options:
${opts.join("\n")}
Correct answer: ${correctLetter}
Worked solution: ${q.explanation || "(none provided)"}

Write a SHORT, CB-style explanation (60-120 words each) for each of the three wrong options (${wrongLetters.join(", ")}). For each wrong option, name the specific misconception or arithmetic error that leads a student to pick it, then point to the correct approach.

Respond with ONLY valid JSON in this exact shape (no prose before or after):
{
  "${wrongLetters[0]}": "explanation...",
  "${wrongLetters[1]}": "explanation...",
  "${wrongLetters[2]}": "explanation..."
}`;

  try {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1000,
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!resp.ok) {
      process.stdout.write(`failed (HTTP ${resp.status})\n`);
      failed++;
      continue;
    }
    const j = await resp.json();
    const content = j.choices?.[0]?.message?.content;
    if (!content) {
      process.stdout.write(`failed (no content)\n`);
      failed++;
      continue;
    }
    const parsed = JSON.parse(content);
    const valid = wrongLetters.every((L) => typeof parsed[L] === "string" && parsed[L].length > 30);
    if (!valid) {
      process.stdout.write(`failed (validation — keys: ${Object.keys(parsed).join(",")})\n`);
      failed++;
      continue;
    }

    if (DRY_RUN) {
      process.stdout.write(`OK (dry-run)\n`);
      console.log(`    sample: ${wrongLetters[0]} = "${parsed[wrongLetters[0]].slice(0, 80)}..."`);
    } else {
      await sql`
        UPDATE questions
        SET "distractorExplanations" = ${JSON.stringify(parsed)}::jsonb,
            "updatedAt" = NOW()
        WHERE id = ${q.id}
      `;
      process.stdout.write(`OK\n`);
    }
    success++;
  } catch (err) {
    process.stdout.write(`failed (${err.message || err})\n`);
    failed++;
  }

  // Rate limit guard
  await new Promise((r) => setTimeout(r, 1200));
}

console.log(`\n═══ Summary ═══`);
console.log(`  Success: ${success}`);
console.log(`  Skipped: ${skipped}`);
console.log(`  Failed:  ${failed}`);
console.log(`  Total:   ${rows.length}`);
