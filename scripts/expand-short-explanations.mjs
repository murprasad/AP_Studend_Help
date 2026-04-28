#!/usr/bin/env node
/**
 * Expand short explanations (>20 chars, <80 chars) to full teacher-quality
 * answers. Targets the remaining trust-gate failures:
 *   - Calc AB: 46 one-sentence
 *   - Calc BC: 26 one-sentence
 *   - USHist: 14 one-sentence
 *   - CSP: 14 one-sentence
 *
 * These slipped past prior backfill because they had >20 chars (above
 * the empty-explanation cutoff) but were still single-sentence
 * non-content placeholders.
 *
 * Idempotent — uses modelUsed marker "expl-expanded-2026-04-27".
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

const MARKER = "expl-expanded-2026-04-27";

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
      temperature: 0.4,
      max_tokens: 400,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(45_000),
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
        AND explanation IS NOT NULL
        AND LENGTH(explanation) >= 20
        AND LENGTH(explanation) < 80
        AND ("modelUsed" IS NULL OR "modelUsed" NOT LIKE ${'%' + MARKER + '%'})
    `
  : await sql`
      SELECT id, course::text as course, "questionText", stimulus, options,
             "correctAnswer", explanation
      FROM questions
      WHERE "isApproved" = true
        AND "questionType" = 'MCQ'
        AND explanation IS NOT NULL
        AND LENGTH(explanation) >= 20
        AND LENGTH(explanation) < 80
        AND ("modelUsed" IS NULL OR "modelUsed" NOT LIKE ${'%' + MARKER + '%'})
    `;

const target = Math.min(rows.length, LIMIT);
console.log(`Expanding ${target} of ${rows.length} short MCQ explanations${courseFilter ? ` (${courseFilter})` : ""}`);

const byCourse = {};
for (const r of rows) byCourse[r.course] = (byCourse[r.course] || 0) + 1;
console.log("By course:");
Object.entries(byCourse).sort(([, a], [, b]) => b - a).forEach(([c, n]) => console.log("  " + c + ": " + n));

let totalDone = 0, totalErr = 0;

for (let i = 0; i < target; i++) {
  const r = rows[i];
  try {
    const opts = typeof r.options === "string" ? JSON.parse(r.options) : (r.options ?? []);
    const optsList = Array.isArray(opts) ? opts.join("\n") : "";

    const prompt = `Expand this AP MCQ explanation. The current one is too short — under 80 characters. Write a full teacher-style explanation, 120-300 chars (40-80 words).

Question: ${r.questionText}
${r.stimulus ? "Stimulus: " + r.stimulus.slice(0, 400) + "\n" : ""}
Options:
${optsList}
Correct answer: ${r.correctAnswer}
Current (too short) explanation: ${r.explanation}

Write a fuller replacement:
- Show step-by-step reasoning
- For math/physics: do the actual computation with the numbers
- Cite the underlying concept/principle
- No letter references like "A is correct"
- Reference the stimulus if there is one

Return JSON: {"explanation": "..."}`;

    if (dry) {
      if (i < 5) console.log(`  [DRY] ${r.id.slice(0, 8)} ${r.course} (${r.explanation.length}ch): "${r.explanation.slice(0, 60)}..."`);
      continue;
    }

    const result = await callGroq(
      `You are an experienced AP teacher. Expand short, placeholder-feeling explanations into substantive content-grounded ones.`,
      prompt,
    );
    if (!result.explanation || result.explanation.length < 100) {
      totalErr++;
      continue;
    }
    await sql`
      UPDATE questions
      SET explanation = ${result.explanation},
          "modelUsed" = COALESCE("modelUsed", '') || ${'|' + MARKER},
          "updatedAt" = NOW()
      WHERE id = ${r.id}
    `;
    totalDone++;
    if (totalDone <= 3 || totalDone % 20 === 0) {
      console.log(`  ✓ [${totalDone}/${target}] ${r.id.slice(0, 8)} ${r.course}: ${result.explanation.slice(0, 80)}…`);
    }
  } catch (e) {
    totalErr++;
    if (totalErr <= 5) console.error(`  ✗ ${r.id.slice(0, 8)} ${r.course}: ${e.message?.slice(0, 100)}`);
  }
  await sleep(PACE_MS);
}

console.log(`\n── Summary ──`);
console.log(`  Expanded: ${totalDone}`);
console.log(`  Errors: ${totalErr}`);
