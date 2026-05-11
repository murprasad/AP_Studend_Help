/**
 * scripts/openstax/determine-answers.mjs
 *
 * Phase 2 of OpenStax ingest. OpenStax AP books embed questions but
 * don't always have a standalone answer-key appendix. Pragmatic
 * approach: use Groq (free, fast) to determine the correct answer
 * for each extracted question.
 *
 * Reads:  data/openstax/<slug>/extracted.json
 * Writes: data/openstax/<slug>/extracted-with-answers.json
 *
 * Cost: ~$0.0005/q via Groq llama-3.3-70b. 2000 Qs ≈ $1.
 *
 * Usage:
 *   node scripts/openstax/determine-answers.mjs --book=biology-ap-courses
 *   node scripts/openstax/determine-answers.mjs --book=biology-ap-courses --limit=10
 *   node scripts/openstax/determine-answers.mjs --book=biology-ap-courses --concurrency=4
 */
import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const BOOK = args.book;
const LIMIT = args.limit ? parseInt(args.limit, 10) : null;
const CONCURRENCY = args.concurrency ? parseInt(args.concurrency, 10) : 4;

if (!BOOK) {
  console.error("usage: --book=<slug> [--limit=N] [--concurrency=4]");
  process.exit(1);
}

const dir = join(process.cwd(), "data", "openstax", BOOK);
const inPath = join(dir, "extracted.json");
const outPath = join(dir, "extracted-with-answers.json");

if (!existsSync(inPath)) {
  console.error(`Missing: ${inPath}. Run extract-questions.mjs first.`);
  process.exit(2);
}

const data = JSON.parse(readFileSync(inPath, "utf-8"));
const questions = LIMIT ? data.questions.slice(0, LIMIT) : data.questions;
console.log(`Determining answers for ${questions.length} questions from ${BOOK} (concurrency=${CONCURRENCY})`);

const key = process.env.GROQ_API_KEY;
if (!key) { console.error("GROQ_API_KEY not set"); process.exit(3); }

async function askGroq(q) {
  const prompt = `You are an expert ${BOOK.replace(/-/g, " ")} tutor. Read this question and pick the SINGLE best answer.

Question: ${q.stem}

Options:
${q.options.join("\n")}

Respond with JSON only: {"answer":"A"|"B"|"C"|"D"|"E","confidence":"high"|"medium"|"low","reasoning":"<short>"}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 200,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return { answer: null, confidence: "low", reason: `http ${res.status}` };
    const data = await res.json();
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
    return {
      answer: typeof parsed?.answer === "string" ? parsed.answer.toUpperCase().slice(0, 1) : null,
      confidence: parsed?.confidence ?? "low",
      reasoning: typeof parsed?.reasoning === "string" ? parsed.reasoning.slice(0, 200) : "",
    };
  } catch (e) {
    return { answer: null, confidence: "low", reason: e.message?.slice(0, 80) ?? "err" };
  }
}

const results = [...questions];
let processed = 0;
let answered = 0;
let i = 0;
const startTs = Date.now();

async function worker() {
  while (i < results.length) {
    const idx = i++;
    const q = results[idx];
    const r = await askGroq(q);
    q.correctAnswer = r.answer;
    q.answerConfidence = r.confidence;
    q.answerReasoning = r.reasoning;
    processed++;
    if (r.answer) answered++;
    if (processed % 25 === 0) {
      const elapsed = ((Date.now() - startTs) / 1000).toFixed(0);
      console.log(`[${processed}/${results.length}] answered=${answered} elapsed=${elapsed}s`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

console.log(`\nDone. processed=${processed} answered=${answered} (${(100*answered/processed).toFixed(1)}%)`);

writeFileSync(outPath, JSON.stringify({
  ...data,
  determinedAt: new Date().toISOString(),
  determinerModel: "groq-llama-3.3-70b",
  questions: results,
}, null, 2));
console.log(`Wrote ${outPath}`);
