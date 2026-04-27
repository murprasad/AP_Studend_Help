#!/usr/bin/env node
/**
 * Math correctness LLM-judge sweep.
 *
 * Per CB audit (2026-04-27), Precalc + Calc AB/BC + Phys 1 ship MCQs with
 * confidently-wrong explanations and ill-posed stems:
 *   - cmo7z7oiy (Calc AB): "fastest rate of increase" of f'(x) = 6x-5 on
 *     unbounded domain — no answer.
 *   - cmo9jzavb (Precalc): explanation says "simplifies by cancelling (x-2)"
 *     when there is no (x-2) factor.
 *   - cmo3tu645 (Phys 1): distractor explanation merged into correct one
 *     ("v = 2 m/s.5 = 8 m/s").
 *
 * For each math/physics MCQ, ask Groq (cold judge):
 *   - Is the stem well-posed?
 *   - Is the explanation arithmetically correct?
 *   - Does the explanation reference the stimulus?
 *   - Does the math match the marked correct answer?
 * If verdict is FAIL, regenerate the explanation with a corrected version.
 *
 * Idempotent — uses modelUsed marker "math-judged-2026-04-27".
 *
 * Usage:
 *   node scripts/judge-math-correctness.mjs --dry --limit 5 AP_PRECALCULUS
 *   node scripts/judge-math-correctness.mjs                 # all 5 courses
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const limitArg = args.find((a, i) => args[i - 1] === "--limit");
const LIMIT = limitArg ? parseInt(limitArg, 10) : Infinity;
const courseFilter = args.find((a) => a.startsWith("AP_"));

const PACE_MS = 1500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY && !dry) { console.error("Missing GROQ_API_KEY"); process.exit(1); }

const TARGET_COURSES = [
  "AP_PRECALCULUS",
  "AP_CALCULUS_AB",
  "AP_CALCULUS_BC",
  "AP_PHYSICS_1",
  "AP_CHEMISTRY",
];

const JUDGED_MARKER = "math-judged-2026-04-27";

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
      temperature: 0.2,
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
      WHERE course = ${courseFilter}::"ApCourse"
        AND "isApproved" = true
        AND "questionType" = 'MCQ'
        AND ("modelUsed" IS NULL OR "modelUsed" NOT LIKE ${'%' + JUDGED_MARKER + '%'})
      ORDER BY RANDOM()
    `
  : await sql`
      SELECT id, course::text as course, "questionText", stimulus, options,
             "correctAnswer", explanation
      FROM questions
      WHERE course = ANY(${TARGET_COURSES}::"ApCourse"[])
        AND "isApproved" = true
        AND "questionType" = 'MCQ'
        AND ("modelUsed" IS NULL OR "modelUsed" NOT LIKE ${'%' + JUDGED_MARKER + '%'})
      ORDER BY RANDOM()
    `;

const target = Math.min(rows.length, LIMIT);
console.log(`Math-judging ${target} of ${rows.length} candidate MCQs across ${courseFilter || TARGET_COURSES.join(",")}`);

let passed = 0, failed = 0, regenned = 0, errors = 0;

for (let i = 0; i < target; i++) {
  const r = rows[i];
  try {
    const opts = typeof r.options === "string" ? JSON.parse(r.options) : (r.options ?? []);
    const optsList = Array.isArray(opts) ? opts.join("\n") : "";

    const judgePrompt = `Judge this AP MCQ for mathematical/physical correctness.

Question: ${r.questionText}
${r.stimulus ? "Stimulus: " + r.stimulus.slice(0, 500) + "\n" : ""}
Options:
${optsList}
Correct answer (marked): ${r.correctAnswer}
Explanation: ${r.explanation || "(empty)"}

Verify:
1. Is the stem mathematically well-posed (unique answer, bounded domain where required)?
2. Is the marked correct answer actually correct given the stem?
3. Is the explanation arithmetically correct (no fake cancellations, sign errors, unit errors)?
4. Does the explanation reference and use the stimulus values (not generic platitudes)?

Return JSON:
{
  "verdict": "PASS" or "FAIL",
  "reason": "1 sentence — only if FAIL, name the specific defect (e.g. 'ill-posed: unbounded max', 'broken cancellation: no (x-2) factor', 'sign error in answer')",
  "fixedExplanation": "150-300 char corrected explanation that does the math step-by-step. Empty string if PASS."
}`;

    if (dry) {
      if (i < 3) console.log(`  [DRY] ${r.id.slice(0, 8)} ${r.course}: "${r.questionText.slice(0, 60)}"`);
      continue;
    }

    const result = await callGroq(
      `You are a precise AP exam math/physics auditor. You catch confidently-wrong explanations, sign errors, and ill-posed stems.`,
      judgePrompt,
    );

    if (result.verdict === "PASS") {
      passed++;
      // Mark as judged so we don't re-process
      await sql`UPDATE questions SET "modelUsed" = COALESCE("modelUsed", '') || ${'|' + JUDGED_MARKER}, "updatedAt" = NOW() WHERE id = ${r.id}`;
    } else if (result.verdict === "FAIL") {
      failed++;
      if (result.fixedExplanation && result.fixedExplanation.length >= 80) {
        await sql`
          UPDATE questions
          SET explanation = ${result.fixedExplanation},
              "modelUsed" = COALESCE("modelUsed", '') || ${'|' + JUDGED_MARKER + '|repaired'},
              "updatedAt" = NOW()
          WHERE id = ${r.id}
        `;
        regenned++;
      } else {
        // Mark as judged but couldn't auto-repair — flag for manual review
        await sql`UPDATE questions SET "modelUsed" = COALESCE("modelUsed", '') || ${'|' + JUDGED_MARKER + '|fail-noregen'}, "updatedAt" = NOW() WHERE id = ${r.id}`;
      }
      if (failed <= 5 || failed % 10 === 0) {
        console.log(`  ✗ [${failed}] ${r.id.slice(0, 8)} ${r.course}: ${(result.reason || "").slice(0, 100)}${result.fixedExplanation ? " — repaired" : " — flagged"}`);
      }
    }
    if ((passed + failed) % 50 === 0) {
      console.log(`  …progress: ${passed} pass, ${failed} fail (${regenned} repaired), ${errors} err`);
    }
  } catch (e) {
    errors++;
    if (errors <= 5) console.error(`  ✗ ${r.id.slice(0, 8)}: ${e.message?.slice(0, 100)}`);
  }
  await sleep(PACE_MS);
}

console.log(`\n── Summary ──`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed} (${regenned} auto-repaired, ${failed - regenned} flagged for manual review)`);
console.log(`  Errors: ${errors}`);
