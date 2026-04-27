#!/usr/bin/env node
/**
 * Backfill empty explanations across the MCQ bank.
 *
 * Agent audit (2026-04-27) found 974 MCQs with empty/null explanation
 * across 5 courses: HuGeo 354, APES 231, USGov 195, APUSH 154, CSP 40.
 * Empty explanation = student answers, sees feedback "Correct" / "Wrong",
 * but learns nothing about why. Big trust gap.
 *
 * For each empty-explanation MCQ, ask Groq to write a 100-300 char
 * teacher-style explanation: name the correct answer's reasoning + WHY,
 * cite the principle/concept. No letter references.
 *
 * Idempotent — re-running skips MCQs that already have non-empty explanations.
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
             "correctAnswer"
      FROM questions
      WHERE "isApproved" = true
        AND course = ${courseFilter}::"ApCourse"
        AND (explanation IS NULL OR LENGTH(explanation) < 20)
    `
  : await sql`
      SELECT id, course::text as course, "questionText", stimulus, options,
             "correctAnswer"
      FROM questions
      WHERE "isApproved" = true
        AND (explanation IS NULL OR LENGTH(explanation) < 20)
    `;
console.log(`Found ${rows.length} MCQs with empty/missing explanation${courseFilter ? ` (${courseFilter})` : ""}`);

const target = Math.min(rows.length, LIMIT);
let totalDone = 0, totalErr = 0;

const byCourse = {};
for (const r of rows) byCourse[r.course] = (byCourse[r.course] || 0) + 1;
console.log("By course:");
Object.entries(byCourse).sort(([, a], [, b]) => b - a).forEach(([c, n]) => console.log("  " + c + ": " + n));

for (let i = 0; i < target; i++) {
  const r = rows[i];
  try {
    if (dry) {
      totalDone++;
      if (i < 3) console.log(`  [DRY] ${r.id.slice(0, 8)} ${r.course}`);
      continue;
    }
    const opts = typeof r.options === "string" ? JSON.parse(r.options) : (r.options ?? []);
    const optsList = Array.isArray(opts) ? opts.join("\n") : "";
    const prompt = `Write a teacher-style explanation for this AP MCQ. 100-300 chars (40-80 words).

Question: ${r.questionText}
${r.stimulus ? "Stimulus: " + r.stimulus.slice(0, 400) + "\n" : ""}
Options:
${optsList}
Correct answer: ${r.correctAnswer}

Write a 1-2 sentence explanation:
- Name the correct answer's reasoning + cite the underlying concept/principle
- Do NOT use letter references like "A is correct" — reference content directly
- Be specific to the topic, not generic

Return JSON: {"explanation": "..."}`;

    const result = await callGroq(
      `You are an experienced AP teacher writing concise, content-grounded explanations.`,
      prompt,
    );
    if (!result.explanation || result.explanation.length < 20) {
      totalErr++;
      continue;
    }
    await sql`UPDATE questions SET explanation = ${result.explanation}, "updatedAt" = NOW() WHERE id = ${r.id}`;
    totalDone++;
    if (totalDone <= 3 || totalDone % 50 === 0) {
      console.log(`  ✓ [${totalDone}/${target}] ${r.id.slice(0, 8)} ${r.course}: ${result.explanation.slice(0, 80)}…`);
    }
  } catch (e) {
    totalErr++;
    if (totalErr <= 5) console.error(`  ✗ ${r.id.slice(0, 8)} ${r.course}: ${e.message?.slice(0, 80)}`);
  }
  await sleep(PACE_MS);
}

console.log(`\n── Summary ──`);
console.log(`  Backfilled: ${totalDone}`);
console.log(`  Errors: ${totalErr}`);
