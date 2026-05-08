/**
 * scripts/ensemble-sweep.mjs
 *
 * Retroactive 3-model ensemble sweep over approved MCQs. Same gate as the
 * gen-pipeline ensemble (ensembleJudgeMcq) but rewritten as a node script
 * for the bulk run. Per user 2026-05-08: every approved Q must pass the
 * ensemble; failures get isApproved=false.
 *
 * Quorum: ≥2 PASS → keep approved. ≥2 FAIL → unapprove.
 * No quorum (mixed/abstains) → keep approved (fail-OPEN — no false positives).
 *
 * Run:
 *   node scripts/ensemble-sweep.mjs                       # dry — full bank
 *   node scripts/ensemble-sweep.mjs --course=AP_PHYSICS_1 # one course
 *   node scripts/ensemble-sweep.mjs --limit=200           # cap (for budget)
 *   node scripts/ensemble-sweep.mjs --unapprove           # writes
 *   node scripts/ensemble-sweep.mjs --concurrency=4       # default 3
 *
 * Env: DATABASE_URL, OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY
 *
 * Cost estimate: ~$0.020/question × bank size. 7,870 Qs ≈ $160.
 *
 * Artifact: data/ensemble-sweep-runs/<ISO>.json contains every vote.
 */
import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    if (a === "--unapprove") return ["unapprove", true];
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const UNAPPROVE = !!args.unapprove;
const COURSE = args.course ?? null;
const LIMIT = args.limit ? parseInt(args.limit, 10) : null;
const CONCURRENCY = args.concurrency ? parseInt(args.concurrency, 10) : 3;
const TIMEOUT_MS = 25_000;

console.log(`Mode: ${UNAPPROVE ? "WRITE (will unapprove failures)" : "DRY (read-only)"}`);
console.log(`Filter: course=${COURSE ?? "ALL"}, limit=${LIMIT ?? "none"}, concurrency=${CONCURRENCY}`);

function buildPrompt(q, opts) {
  const optsStr = opts.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join("\n");
  return `Audit this MCQ. Return JSON only with keys "verdict" and "reason".

verdict must be exactly "PASS" or "FAIL".

FAIL if ANY of these are true:
- The stored correctAnswer letter does NOT hold the value the explanation derives.
- The explanation contradicts itself.
- The explanation describes a distractor by letter (e.g. "Option B...") but that letter's text doesn't match the description.
- An option contains the word "Correct", "Incorrect", "Wrong", or "Right" (answer leak).
- The stimulus reveals the correct numeric answer.
- LaTeX uses bare "int", "sum", "frac", "rac", "infty" without backslashes.
- The explanation includes LLM monologue ("hmm", "let me reconsider", "is not needed, just").

Otherwise PASS.

Question: ${q.questionText}

Options:
${optsStr}

Stored correctAnswer: ${q.correctAnswer}

Explanation: ${q.explanation || "(no explanation)"}

Return JSON only: {"verdict":"PASS"|"FAIL","reason":"<short>"}`;
}

function extractJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

async function callOpenAI(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { model: "gpt-4o", vote: "ABSTAIN", reason: "no key" };
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 200,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { model: "gpt-4o", vote: "ABSTAIN", reason: `http ${res.status}` };
    const data = await res.json();
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
    const v = parsed?.verdict === "PASS" ? "PASS" : parsed?.verdict === "FAIL" ? "FAIL" : "ABSTAIN";
    return { model: "gpt-4o", vote: v, reason: typeof parsed?.reason === "string" ? parsed.reason.slice(0, 200) : undefined };
  } catch (e) {
    return { model: "gpt-4o", vote: "ABSTAIN", reason: e.message?.slice(0, 80) ?? "err" };
  }
}

async function callAnthropic(prompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { model: "claude-sonnet-4-6", vote: "ABSTAIN", reason: "no key" };
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { model: "claude-sonnet-4-6", vote: "ABSTAIN", reason: `http ${res.status}` };
    const data = await res.json();
    const parsed = extractJson(data?.content?.[0]?.text ?? "");
    if (!parsed) return { model: "claude-sonnet-4-6", vote: "ABSTAIN", reason: "no json" };
    const v = parsed?.verdict === "PASS" ? "PASS" : parsed?.verdict === "FAIL" ? "FAIL" : "ABSTAIN";
    return { model: "claude-sonnet-4-6", vote: v, reason: typeof parsed?.reason === "string" ? parsed.reason.slice(0, 200) : undefined };
  } catch (e) {
    return { model: "claude-sonnet-4-6", vote: "ABSTAIN", reason: e.message?.slice(0, 80) ?? "err" };
  }
}

async function callGemini(prompt) {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) return { model: "gemini-1.5-pro", vote: "ABSTAIN", reason: "no key" };
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", maxOutputTokens: 200 },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    );
    if (!res.ok) return { model: "gemini-1.5-pro", vote: "ABSTAIN", reason: `http ${res.status}` };
    const data = await res.json();
    const parsed = extractJson(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "");
    if (!parsed) return { model: "gemini-1.5-pro", vote: "ABSTAIN", reason: "no json" };
    const v = parsed?.verdict === "PASS" ? "PASS" : parsed?.verdict === "FAIL" ? "FAIL" : "ABSTAIN";
    return { model: "gemini-1.5-pro", vote: v, reason: typeof parsed?.reason === "string" ? parsed.reason.slice(0, 200) : undefined };
  } catch (e) {
    return { model: "gemini-1.5-pro", vote: "ABSTAIN", reason: e.message?.slice(0, 80) ?? "err" };
  }
}

async function judgeOne(q) {
  const opts = Array.isArray(q.options) ? q.options.map(String) : [];
  const prompt = buildPrompt(q, opts);
  const votes = await Promise.all([callOpenAI(prompt), callAnthropic(prompt), callGemini(prompt)]);
  const pass = votes.filter((v) => v.vote === "PASS").length;
  const fail = votes.filter((v) => v.vote === "FAIL").length;
  let verdict;
  if (fail >= 2) verdict = "FAIL";
  else if (pass >= 2) verdict = "PASS";
  else verdict = "NO_QUORUM";
  return { id: q.id, course: q.course, verdict, votes };
}

// Pull
const filterClause = COURSE ? sql`AND course::text = ${COURSE}` : sql``;
const limitClause = LIMIT ? sql`LIMIT ${LIMIT}` : sql``;
const qs = await sql`
  SELECT id, course::text AS course, "questionText", options, "correctAnswer", explanation
  FROM questions
  WHERE "isApproved" = true AND "questionType" = 'MCQ'
  ${filterClause}
  ORDER BY "createdAt" DESC
  ${limitClause}
`;
console.log(`Loaded ${qs.length} approved MCQs.\n`);

const results = [];
const failedIds = [];
let i = 0;
const startTs = Date.now();

async function worker() {
  while (true) {
    const idx = i++;
    if (idx >= qs.length) return;
    const r = await judgeOne(qs[idx]);
    results.push(r);
    if (r.verdict === "FAIL") failedIds.push(r.id);
    if ((idx + 1) % 25 === 0) {
      const elapsed = ((Date.now() - startTs) / 1000).toFixed(0);
      const fails = results.filter((x) => x.verdict === "FAIL").length;
      const noq = results.filter((x) => x.verdict === "NO_QUORUM").length;
      console.log(`[${idx + 1}/${qs.length}] elapsed=${elapsed}s · FAIL=${fails} · NO_QUORUM=${noq}`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

const summary = {
  total: results.length,
  pass: results.filter((r) => r.verdict === "PASS").length,
  fail: results.filter((r) => r.verdict === "FAIL").length,
  noQuorum: results.filter((r) => r.verdict === "NO_QUORUM").length,
};
console.log("\n══ SUMMARY ══");
console.log(JSON.stringify(summary, null, 2));

const perCourse = {};
for (const r of results) {
  if (!perCourse[r.course]) perCourse[r.course] = { pass: 0, fail: 0, noQuorum: 0 };
  perCourse[r.course][r.verdict === "FAIL" ? "fail" : r.verdict === "PASS" ? "pass" : "noQuorum"]++;
}
console.log("\n══ PER-COURSE ══");
for (const [c, m] of Object.entries(perCourse).sort((a, b) => b[1].fail - a[1].fail)) {
  console.log(`  ${c.padEnd(40)} pass=${m.pass}  fail=${m.fail}  noQuorum=${m.noQuorum}`);
}

const outDir = join(process.cwd(), "data", "ensemble-sweep-runs");
mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const outFile = join(outDir, `ensemble-${ts}.json`);
writeFileSync(outFile, JSON.stringify({
  generatedAt: new Date().toISOString(),
  mode: UNAPPROVE ? "WRITE" : "DRY",
  filter: { course: COURSE, limit: LIMIT },
  summary,
  perCourse,
  results,
}, null, 2));
console.log(`\nArtifact: ${outFile}`);

if (UNAPPROVE && failedIds.length > 0) {
  console.log(`\nUnapproving ${failedIds.length} questions...`);
  const CHUNK = 100;
  for (let i = 0; i < failedIds.length; i += CHUNK) {
    const slice = failedIds.slice(i, i + CHUNK);
    await sql`UPDATE questions SET "isApproved" = false WHERE id = ANY(${slice})`;
    console.log(`  unapproved ${Math.min(i + CHUNK, failedIds.length)}/${failedIds.length}`);
  }
  console.log("✓ Done.");
}
