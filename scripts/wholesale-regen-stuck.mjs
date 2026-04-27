#!/usr/bin/env node
/**
 * Wholesale regen for "stuck salvageable" questions.
 *
 * The targeted-fix regen (regen-low-quality-questions.mjs) hit a plateau:
 * questions stuck at 5-6/10 have multiple structural issues each, and
 * single-priority fixes can't lift them past 7/10. ~1,000 such questions
 * exist across all AP courses post-Stage4.
 *
 * Approach: replace the question entirely. Keep id, course, unit, topic,
 * difficulty, questionType. Ask AI to generate a NEW CB-style question
 * for that combination. Replace stem + stimulus + options + correctAnswer
 * + explanation atomically. Bumps the question to 8-10/10 in one pass.
 *
 * Trade-off: loses any prior responses' link semantics (the question is
 * effectively a new one), but stuck-salvageable questions weren't being
 * answered well anyway. Net: cleaner content for new sessions.
 *
 * Usage:
 *   node scripts/wholesale-regen-stuck.mjs              # all courses
 *   node scripts/wholesale-regen-stuck.mjs AP_PRECALCULUS
 *   node scripts/wholesale-regen-stuck.mjs --limit 50
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
      temperature: 0.5,
      max_tokens: 1000,
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

// Pull stuck-salvageable questions from latest audit
import { readFile } from "node:fs/promises";
const today = new Date().toISOString().slice(0, 10);
const audit = JSON.parse(await readFile(`data/question-quality-audit-${today}.json`, "utf8"));

const targets = courseFilter
  ? audit.perCourse.filter((c) => c.course === courseFilter)
  : audit.perCourse.filter((c) => c.course.startsWith("AP_"));

(async () => {
  console.log(`\n🔁 Wholesale regen for stuck-salvageable questions ${dry ? "(DRY)" : ""}\n`);

  let totalDone = 0, totalErr = 0;

  for (const c of targets) {
    // worstIds entries with bucket="salvageable" and score 5-6
    const stuck = (c.worstIds ?? []).filter((q) => q.bucket === "salvageable" && q.score >= 5 && q.score <= 6);
    const target = Math.min(stuck.length, LIMIT);
    if (target === 0) continue;
    console.log(`\n=== ${c.course} — ${target}/${stuck.length} stuck questions to regen ===\n`);

    for (let i = 0; i < target; i++) {
      const ref = stuck[i];
      try {
        // Fetch the existing row
        const rows = await sql`
          SELECT id, course, unit, topic, subtopic, difficulty, "questionType"
          FROM questions WHERE id = ${ref.id}
        `;
        if (!rows[0]) continue;
        const row = rows[0];

        const courseDisplay = row.course.replace(/^AP_/, "AP ").replace(/_/g, " ");
        const userPrompt = `Generate a fresh CB-style ${row.questionType} for ${courseDisplay}.

Course: ${row.course}
Unit: ${row.unit}
Topic: ${row.topic}
Subtopic: ${row.subtopic ?? ""}
Difficulty: ${row.difficulty}

Requirements (CB-style hard gates):
- Stem: 50-180 chars, no superlative hedging without anchor
- 4 options A/B/C/D, each 8-60 chars
- Stimulus: include if topic warrants (data/equation/quote with attribution)
- Explanation: 100-450 chars naming the correct answer's reasoning + why
- For quantitative courses, stimulus MUST contain numeric setup (e.g. "f(x) = 2x²")
- DO NOT use letter references in explanation ("A is correct"); reference content directly
- Correct answer must be uniformly random across A/B/C/D, not always A

Return JSON: {
  "questionText": "...",
  "stimulus": "..." or null,
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correctAnswer": "A" | "B" | "C" | "D",
  "explanation": "..."
}`;

        if (dry) {
          totalDone++;
          if (i < 3) console.log(`  [DRY] ${row.id.slice(0, 8)} — would wholesale-regen`);
          continue;
        }

        const gen = await callGroq(
          `You are an AP exam content writer trained on College Board ${row.course.replace('AP_', '')} CED standards.`,
          userPrompt,
        );
        if (!gen.questionText || !gen.options || !gen.correctAnswer || !gen.explanation) {
          totalErr++;
          continue;
        }
        const optsJson = JSON.stringify(gen.options);
        await sql`
          UPDATE questions SET
            "questionText" = ${gen.questionText},
            stimulus = ${gen.stimulus ?? null},
            options = ${optsJson}::jsonb,
            "correctAnswer" = ${gen.correctAnswer},
            explanation = ${gen.explanation},
            "modelUsed" = 'llama-3.3-70b-versatile-wholesale',
            "updatedAt" = NOW()
          WHERE id = ${row.id}
        `;
        totalDone++;
        if (totalDone <= 3 || totalDone % 25 === 0) {
          console.log(`  ✓ ${row.id.slice(0, 8)} (was ${ref.score}/10) — wholesale replaced`);
        }
      } catch (e) {
        totalErr++;
        if (totalErr <= 3) console.error(`  ✗ ${ref.id.slice(0, 8)}: ${e.message?.slice(0, 80)}`);
      }
      await sleep(PACE_MS);
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`  Wholesale-regenerated: ${totalDone}`);
  console.log(`  Errors: ${totalErr}`);
})().catch((e) => { console.error("Fatal:", e); process.exit(1); });
