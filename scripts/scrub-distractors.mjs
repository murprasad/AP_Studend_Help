#!/usr/bin/env node
/**
 * Pedagogical distractor scrub — make each MCQ option target a documented
 * misconception rather than feeling arbitrary.
 *
 * User feedback (2026-04-27): "students don't consciously say 'distractor
 * quality is off' — they feel 'this doesn't feel like AP'." Real CB
 * distractors map to specific misconceptions (sign errors, confusing
 * similar terms, partial-understanding traps). Many of ours are random
 * negations or unrelated facts.
 *
 * For each approved MCQ, ask AI to evaluate the 3 wrong options. If any
 * are arbitrary, replace them with misconception-grounded distractors
 * that preserve correctness of the marked answer.
 *
 * Idempotent — uses a "scrubbed" model marker to skip already-processed.
 *
 * Targets only MCQs with options (skips FRQ/SAQ/etc.). Filterable by
 * course. Pacing 1.5s + Groq throttle.
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const limitArg = args.find((a, i) => args[i - 1] === "--limit");
const LIMIT = limitArg ? parseInt(limitArg, 10) : Infinity;
const courseFilter = args.find((a) => a.startsWith("AP_") || a.startsWith("SAT_") || a.startsWith("ACT_"));

const PACE_MS = 1500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY && !dry) { console.error("Missing GROQ_API_KEY"); process.exit(1); }

const SCRUBBED_MARKER = "scrubbed-2026-04-27";

async function callGroq(systemPrompt, userPrompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
}

const rows = courseFilter
  ? await sql`
      SELECT id, course::text as course, "questionText", stimulus, options,
             "correctAnswer", explanation
      FROM questions
      WHERE "isApproved" = true
        AND course = ${courseFilter}::"ApCourse"
        AND "questionType" = 'MCQ'
        AND ("modelUsed" IS NULL OR "modelUsed" NOT LIKE ${'%' + SCRUBBED_MARKER + '%'})
      ORDER BY RANDOM()
    `
  : await sql`
      SELECT id, course::text as course, "questionText", stimulus, options,
             "correctAnswer", explanation
      FROM questions
      WHERE "isApproved" = true
        AND "questionType" = 'MCQ'
        AND ("modelUsed" IS NULL OR "modelUsed" NOT LIKE ${'%' + SCRUBBED_MARKER + '%'})
      ORDER BY RANDOM()
    `;

const target = Math.min(rows.length, LIMIT);
console.log(`Scrubbing distractors on ${target} of ${rows.length} candidates`);

let totalScrubbed = 0, totalSkipped = 0, totalErr = 0;

for (let i = 0; i < target; i++) {
  const r = rows[i];
  try {
    const opts = typeof r.options === "string" ? JSON.parse(r.options) : (r.options ?? []);
    if (!Array.isArray(opts) || opts.length < 3) {
      totalSkipped++;
      continue;
    }

    const prompt = `Review this AP MCQ's 3 distractor options. For each WRONG option, judge: does it target a DOCUMENTED student misconception (sign error, confusing-similar-terms, partial-understanding trap, formula confusion, etc.) — or is it arbitrary?

If any wrong option is arbitrary, REWRITE it to target a specific misconception. Preserve which letter is correct. Keep options 8-60 chars.

Question: ${r.questionText}
${r.stimulus ? "Stimulus: " + r.stimulus.slice(0, 300) + "\n" : ""}
Options:
${opts.join("\n")}
Correct: ${r.correctAnswer}

Return JSON:
{
  "needsScrub": true | false,
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "rationale": "1 sentence on what was changed and which misconceptions the new distractors target. Empty string if no change."
}

If options are already pedagogically sound, set needsScrub=false and return options unchanged.`;

    if (dry) {
      totalSkipped++;
      if (i < 3) console.log(`  [DRY] ${r.id.slice(0, 8)} ${r.course}`);
      continue;
    }

    const result = await callGroq(
      `You are an AP exam writer trained on College Board distractor design principles. Each wrong option must target a documented student misconception.`,
      prompt,
    );

    if (!result.needsScrub) {
      // Mark as scrubbed (no rewrite needed)
      await sql`UPDATE questions SET "modelUsed" = COALESCE("modelUsed", '') || ${'|' + SCRUBBED_MARKER}, "updatedAt" = NOW() WHERE id = ${r.id}`;
      totalSkipped++;
      continue;
    }
    if (!Array.isArray(result.options) || result.options.length < 3) {
      totalErr++;
      continue;
    }

    const optsJson = JSON.stringify(result.options);
    await sql`
      UPDATE questions
      SET options = ${optsJson}::jsonb,
          "modelUsed" = COALESCE("modelUsed", '') || ${'|' + SCRUBBED_MARKER},
          "updatedAt" = NOW()
      WHERE id = ${r.id}
    `;
    totalScrubbed++;
    if (totalScrubbed <= 3 || totalScrubbed % 25 === 0) {
      console.log(`  ✓ [${totalScrubbed}] ${r.id.slice(0, 8)} ${r.course}: ${(result.rationale || "").slice(0, 100)}`);
    }
  } catch (e) {
    totalErr++;
    if (totalErr <= 5) console.error(`  ✗ ${r.id.slice(0, 8)} ${r.course}: ${e.message?.slice(0, 80)}`);
  }
  await sleep(PACE_MS);
}

console.log(`\n── Summary ──`);
console.log(`  Scrubbed (rewrote distractors): ${totalScrubbed}`);
console.log(`  Skipped (already-OK or marked): ${totalSkipped}`);
console.log(`  Errors: ${totalErr}`);
