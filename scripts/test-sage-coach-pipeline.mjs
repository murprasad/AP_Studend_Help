// Integration test for Sage Coach evaluator pipeline.
//
// Mirrors the exact logic in src/app/api/sage-coach/evaluate/route.ts but
// without Next.js + auth overhead. Pulls a real concept from the DB, sends
// a realistic transcript through the cascade, asserts the response shape.
//
// Run: node scripts/test-sage-coach-pipeline.mjs

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function withTimeout(fn, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try { return await fn(controller.signal); } finally { clearTimeout(timer); }
}

async function callOpenRouterFree(prompt) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("no_OPENROUTER_API_KEY");
  return withTimeout(async (signal) => {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b:free",
        messages: [{ role: "user", content: prompt }],
        temperature: 0, max_tokens: 700,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) throw new Error(`openrouter_${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }, 3_000);
}
async function callGroq(prompt) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("no_GROQ");
  return withTimeout(async (signal) => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0, max_tokens: 700,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) throw new Error(`groq_${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }, 8_000);
}
async function callHaiku(prompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("no_ANTHROPIC");
  return withTimeout(async (signal) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal,
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 700, temperature: 0,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`anthropic_${res.status}`);
    const data = await res.json();
    return data.content?.[0]?.text || "";
  }, 8_000);
}
const EVAL_PROVIDERS = [
  { name: "openrouter-free", call: callOpenRouterFree },
  { name: "groq", call: callGroq },
  { name: "anthropic-haiku", call: callHaiku },
];

async function callEvaluator(prompt) {
  const attempts = [];
  for (const p of EVAL_PROVIDERS) {
    const t0 = Date.now();
    try {
      const text = await p.call(prompt);
      attempts.push({ name: p.name, ms: Date.now() - t0, ok: text && text.length > 20 });
      if (text && text.length > 20) return { text, from: p.name, attempts };
    } catch (e) {
      attempts.push({ name: p.name, ms: Date.now() - t0, ok: false, err: e.message.slice(0, 60) });
    }
  }
  throw new Error(`all_providers_failed: ${JSON.stringify(attempts)}`);
}

function tryParseJson(s) {
  const cleaned = String(s).replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

async function main() {
  console.log("\n=== Sage Coach pipeline test ===\n");

  // 1. Fetch a real concept
  const concept = await prisma.sageCoachConcept.findFirst({ where: { course: "AP_WORLD_HISTORY" } });
  if (!concept) { console.error("❌ No concepts in DB"); process.exit(1); }
  console.log("✓ Concept loaded:", concept.concept, `(${concept.keyPoints.length} key points)`);

  // 2. Simulated student transcript
  const transcript = "The Columbian Exchange was the exchange of plants, animals, and diseases between the Old and New Worlds after 1492. It led to population growth in Europe because of new crops, and killed many Native Americans from diseases like smallpox that they had no immunity to.";
  console.log("✓ Transcript:", transcript.length, "chars");

  // 3. Build prompt (same shape as route)
  const prompt = `You are an expert teacher evaluating a student's SPOKEN answer.

COURSE: ${concept.course}
UNIT: ${concept.unit}
CONCEPT: ${concept.concept}

QUESTION: ${concept.question}

EXPECTED KEY POINTS:
${concept.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

STUDENT TRANSCRIPT:
"""${transcript}"""

Return STRICT JSON: {"scores":{"accuracy":N,"coverage":N,"structure":N,"clarity":N,"confidence":N},"missingKeyPoints":[],"summary":"","specificFeedback":"","improvementTip":""}. Floor accuracy at 30.`;

  // 4. Run cascade
  const t0 = Date.now();
  let result;
  try {
    result = await callEvaluator(prompt);
  } catch (e) {
    console.error("❌ All providers failed:", e.message);
    process.exit(1);
  }
  console.log(`✓ Evaluator returned from ${result.from} in ${Date.now() - t0}ms`);
  console.log("  Attempts:", result.attempts);

  // 5. Parse
  const parsed = tryParseJson(result.text);
  if (!parsed) { console.error("❌ Parse failed. Raw:", result.text.slice(0, 300)); process.exit(1); }
  console.log("✓ Parsed keys:", Object.keys(parsed));

  // 6. Validate shape
  const required = ["scores", "missingKeyPoints", "summary", "specificFeedback", "improvementTip"];
  const missing = required.filter(k => !(k in parsed));
  if (missing.length) { console.error("❌ Missing fields:", missing); process.exit(1); }
  console.log("✓ Shape OK");

  // 7. Validate scores
  const scores = parsed.scores || {};
  const dims = ["accuracy", "coverage", "structure", "clarity", "confidence"];
  const scoreIssues = [];
  for (const d of dims) {
    const v = Number(scores[d]);
    if (!Number.isFinite(v) || v < 0 || v > 100) scoreIssues.push(`${d}=${scores[d]}`);
  }
  if (scoreIssues.length) { console.error("❌ Bad scores:", scoreIssues); process.exit(1); }
  console.log("✓ Scores:", scores);
  console.log("✓ Feedback:", parsed.specificFeedback?.slice(0, 180));
  console.log("✓ Tip:", parsed.improvementTip?.slice(0, 180));

  console.log("\n✅ PIPELINE TEST PASSED\n");
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
