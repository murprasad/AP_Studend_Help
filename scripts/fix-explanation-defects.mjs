#!/usr/bin/env node
/**
 * Sweep + fix two explanation defect classes from CB audit:
 *   1. Phys 1 distractor-merge: e.g. "v = (4 Hz)(0.5 m) = 2 m/s.5 = 8 m/s,
 *      confusing..." — distractor explanations got concatenated into the
 *      correct-answer explanation. Pattern: digit-letter-digit run, or
 *      ".N = N" inline arithmetic glitch.
 *   2. CSP truncated prefix: e.g. "e., 7 MOD 2 = 1, which is NOT 0..." —
 *      "i.e.," got chopped to "e., ". Affects 10-30 questions.
 *   3. Metadata-only explanations: "This question tests understanding of..."
 *      with no actual content reasoning. Pattern: starts with "This X
 *      question tests" or "Correct answer's reasoning is based on".
 *
 * For each detected defect, regenerate the explanation via Groq with the
 * full question + correct answer context.
 *
 * Idempotent — modelUsed marker "expl-defect-fixed-2026-04-27".
 *
 * Usage:
 *   node scripts/fix-explanation-defects.mjs --dry            # report
 *   node scripts/fix-explanation-defects.mjs --limit 50
 *   node scripts/fix-explanation-defects.mjs                  # full sweep
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const limitArg = args.find((a, i) => args[i - 1] === "--limit");
const LIMIT = limitArg ? parseInt(limitArg, 10) : Infinity;

const PACE_MS = 1500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY && !dry) { console.error("Missing GROQ_API_KEY"); process.exit(1); }

const MARKER = "expl-defect-fixed-2026-04-27";

// Defect detection patterns
const DEFECTS = [
  { name: "truncated-prefix", re: /^(e\.,|\.,|, |confusing |suggesting that the )\s/i },
  { name: "digit-merge", re: /\d\s*(m\/s|kg|N|J|s|Hz)\.\d/ }, // e.g. "2 m/s.5 = 8"
  { name: "metadata-only", re: /^(This (HARD|MEDIUM|EASY) question (tests|requires)|This tests understanding of|Correct answer's reasoning is based on)/i },
  { name: "inline-glitch", re: /=\s*\d+\s*[a-z]+\.\d+\s*=\s*\d+/i },
];

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

const rows = await sql`
  SELECT id, course::text as course, "questionText", stimulus, options,
         "correctAnswer", explanation
  FROM questions
  WHERE "isApproved" = true
    AND "questionType" = 'MCQ'
    AND explanation IS NOT NULL
    AND LENGTH(explanation) > 20
    AND ("modelUsed" IS NULL OR "modelUsed" NOT LIKE ${'%' + MARKER + '%'})
`;

// Detect defects
const flagged = [];
for (const r of rows) {
  for (const def of DEFECTS) {
    if (def.re.test(r.explanation)) {
      flagged.push({ ...r, defect: def.name });
      break;
    }
  }
}
console.log(`Scanned ${rows.length} approved MCQ explanations. Flagged ${flagged.length} defects.`);

const byDefect = {};
for (const f of flagged) byDefect[f.defect] = (byDefect[f.defect] || 0) + 1;
console.log("By defect type:");
Object.entries(byDefect).forEach(([d, n]) => console.log(`  ${d}: ${n}`));

const byCourse = {};
for (const f of flagged) byCourse[f.course] = (byCourse[f.course] || 0) + 1;
console.log("By course:");
Object.entries(byCourse).sort(([, a], [, b]) => b - a).forEach(([c, n]) => console.log("  " + c + ": " + n));

const target = Math.min(flagged.length, LIMIT);
let totalFixed = 0, totalErr = 0;

for (let i = 0; i < target; i++) {
  const r = flagged[i];
  try {
    if (dry) {
      if (i < 5) console.log(`  [DRY] ${r.id.slice(0, 8)} ${r.course} [${r.defect}]: "${r.explanation.slice(0, 100)}..."`);
      continue;
    }
    const opts = typeof r.options === "string" ? JSON.parse(r.options) : (r.options ?? []);
    const optsList = Array.isArray(opts) ? opts.join("\n") : "";
    const prompt = `Rewrite this AP MCQ explanation. The current one has a defect: ${r.defect}.

Question: ${r.questionText}
${r.stimulus ? "Stimulus: " + r.stimulus.slice(0, 300) + "\n" : ""}
Options:
${optsList}
Correct answer: ${r.correctAnswer}
Current (defective) explanation: ${r.explanation}

Write a clean replacement, 100-300 chars (40-80 words):
- Show the actual reasoning step-by-step
- For math/physics: compute with the actual numbers
- Cite the underlying concept/principle
- No letter references like "A is correct"
- Do NOT start with "This question" or "i.e.," or "e.,"

Return JSON: {"explanation": "..."}`;

    const result = await callGroq(
      `You are an AP teacher writing precise, content-grounded explanations. Fix corrupted/metadata-only explanations.`,
      prompt,
    );
    if (!result.explanation || result.explanation.length < 60) {
      totalErr++;
      continue;
    }
    await sql`
      UPDATE questions
      SET explanation = ${result.explanation},
          "modelUsed" = COALESCE("modelUsed", '') || ${'|' + MARKER + ':' + r.defect},
          "updatedAt" = NOW()
      WHERE id = ${r.id}
    `;
    totalFixed++;
    if (totalFixed <= 3 || totalFixed % 25 === 0) {
      console.log(`  ✓ [${totalFixed}] ${r.id.slice(0, 8)} ${r.course} [${r.defect}]: ${result.explanation.slice(0, 80)}…`);
    }
  } catch (e) {
    totalErr++;
    if (totalErr <= 5) console.error(`  ✗ ${r.id.slice(0, 8)} ${r.course}: ${e.message?.slice(0, 100)}`);
  }
  await sleep(PACE_MS);
}

console.log(`\n── Summary ──`);
console.log(`  Defects detected: ${flagged.length}`);
console.log(`  Fixed: ${totalFixed}`);
console.log(`  Errors: ${totalErr}`);
