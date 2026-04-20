// Phase C — Grounded regeneration.
//
// Uses src/lib/grounded-generator.ts to fill or replace Question rows,
// gated by the SME validator. Every new Question is:
//   - Original (RAG-grounded by real CB/ACT/OpenStax/MIT exemplars)
//   - SME-validated (passes the structural + reasoning audit)
//   - contentHash-deduplicated
//
// Usage:
//   node scripts/regen-grounded.mjs --course=AP_CSP --target=50 --count=50
//   node scripts/regen-grounded.mjs --course=AP_BIOLOGY --mode=fill-to-target --target=500
//   node scripts/regen-grounded.mjs --all --target=500 --max-per-course=20 --mode=fill-to-target
//
// Flags:
//   --course=CODE           single course (omit with --all to loop all ingested courses)
//   --all                   loop every course with at least 3 OfficialSample rows
//   --target=N              approved target per course (default 500)
//   --count=N               generate exactly N new (override target math)
//   --mode=fill-to-target   generate (target - approvedCount) new rows, skip if at/over target
//   --max-per-course=N      cap per-course generation in one run (default 50)
//   --dry-run               don't write to DB
//   --question-type=MCQ     default "MCQ"
//   --difficulty=MEDIUM     default cycles EASY/MEDIUM/HARD
//
// Periodically logs progress to stdout + appends results to
//   scripts/logs/regen-grounded-{ts}.jsonl
//
// Safe to run multiple times per course — contentHash prevents duplicates.
// On SME-validation failure the candidate is discarded and NOT counted
// toward --count, so we get N good rows, never N bad rows.

import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import "dotenv/config";
import { validatePlagiarism, validateAi } from "./ai-validator.mjs";

const prisma = new PrismaClient();

// Provider cascade — Groq is currently blocked (spend alert), so we prefer
// Google AI (Gemini, 1.5k req/day free), Together (free credit), OpenRouter
// (free models), HuggingFace, Cohere, Anthropic (paid last resort).
// Provider order (2026-04-19, after user topped up Groq + Anthropic):
//   Groq (fast Llama 3.3 70B) → Anthropic Haiku 4.5 (high quality) →
//   OpenRouter free → Gemini/Together as last resorts.
const PROVIDERS = [
  { name: "groq", envKey: "GROQ_API_KEY" },
  { name: "anthropic", envKey: "ANTHROPIC_API_KEY" },
  { name: "openrouter", envKey: "OPENROUTER_API_KEY" },
  { name: "gemini", envKey: "GOOGLE_AI_API_KEY" },
  { name: "together", envKey: "TOGETHER_AI_API_KEY" },
];

// Circuit breaker: disable a provider for 10 min after 3 consecutive errors.
const cb = new Map();
function cbDisabled(name) {
  const s = cb.get(name);
  if (!s) return false;
  if (s.until > Date.now()) return true;
  cb.delete(name);
  return false;
}
function cbFail(name) {
  const s = cb.get(name) || { fails: 0, until: 0 };
  s.fails++;
  if (s.fails >= 3) s.until = Date.now() + 10 * 60 * 1000;
  cb.set(name, s);
}
function cbOk(name) { cb.delete(name); }

function parseArgs() {
  const args = {
    course: null,
    all: false,
    target: 500,
    count: null,
    mode: "fill-to-target",
    maxPerCourse: 50,
    dryRun: false,
    questionType: "MCQ",
    difficulty: null,
  };
  for (const a of process.argv.slice(2)) {
    if (a === "--all") args.all = true;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a.startsWith("--course=")) args.course = a.slice(9);
    else if (a.startsWith("--target=")) args.target = parseInt(a.slice(9), 10);
    else if (a.startsWith("--count=")) args.count = parseInt(a.slice(8), 10);
    else if (a.startsWith("--mode=")) args.mode = a.slice(7);
    else if (a.startsWith("--max-per-course=")) args.maxPerCourse = parseInt(a.slice(17), 10);
    else if (a.startsWith("--question-type=")) args.questionType = a.slice(16);
    else if (a.startsWith("--difficulty=")) args.difficulty = a.slice(13);
  }
  return args;
}

function normalizeText(s) {
  return String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function hashQuestion(questionText) {
  return createHash("sha256").update(normalizeText(questionText)).digest("hex");
}

// Inline TS loader: we cannot import a .ts module from .mjs directly.
// Instead we register tsx-like runtime via dynamic import of a CJS bridge.
// Approach: Prisma generates a compiled client; the grounded-generator lives
// in src/lib/*.ts. To call it from a node script, we compile on-the-fly with tsx.
//
// Running: tsx scripts/regen-grounded.ts would be cleanest, but we keep .mjs
// for consistency with other scripts. Use require() via createRequire to
// load the tsx-compiled module or invoke through a thin bridge.
//
// Simpler alternative used here: the grounded generator's logic is small
// enough to inline without importing the TS module. This avoids the toolchain
// friction while preserving identical behavior.

async function retrieveExemplars(course, questionType, unit, numExemplars = 5) {
  const qtype = questionType || "MCQ";
  // Overfetch 8× so we can shuffle + pick a variable subset each call, preventing
  // identical prompt→identical output convergence across repeat generations for
  // low-exemplar courses (SAT_MATH has only 60 rows).
  let rows = await prisma.officialSample.findMany({
    where: {
      course,
      ...(unit ? { unit } : {}),
      questionType: qtype,
    },
    take: numExemplars * 8,
  });
  if (rows.length < numExemplars) {
    const extra = await prisma.officialSample.findMany({
      where: { course, questionType: qtype },
      take: numExemplars * 3,
    });
    const seen = new Set(rows.map((r) => r.id));
    for (const e of extra) if (!seen.has(e.id)) rows.push(e);
  }
  if (rows.length < numExemplars) {
    const extra = await prisma.officialSample.findMany({
      where: { course },
      take: numExemplars * 3,
    });
    const seen = new Set(rows.map((r) => r.id));
    for (const e of extra) if (!seen.has(e.id)) rows.push(e);
  }
  // Re-rank by source priority, then shuffle within each tier so repeat calls
  // pick different exemplars and prompts diverge (prevents duplicate-stem
  // convergence when Groq is given identical context).
  const priority = (sn) => {
    const s = (sn || "").toLowerCase();
    if (/college board|collegeboard|act, inc|prometric|dantes|fact sheet/.test(s)) return 1;
    if (/modern states|khan academy/.test(s)) return 2;
    if (/openstax|mit opencourseware|aops|art of problem solving/.test(s)) return 3;
    return 4;
  };
  // Group by tier, shuffle within tier, then concat tiers.
  const byTier = new Map();
  for (const r of rows) {
    const t = priority(r.sourceName);
    if (!byTier.has(t)) byTier.set(t, []);
    byTier.get(t).push(r);
  }
  const tiers = Array.from(byTier.keys()).sort((a, b) => a - b);
  const out = [];
  for (const t of tiers) {
    const bucket = byTier.get(t);
    for (let i = bucket.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
    }
    out.push(...bucket);
  }
  return out.slice(0, numExemplars);
}

function buildPrompt(course, questionType, difficulty, exemplars) {
  const qtype = questionType || "MCQ";
  const header = `You are generating an ORIGINAL practice question for ${course} that matches the style, rigor, topic alignment, and vocabulary of real released exam content.

QUESTION TYPE: ${qtype}
${difficulty ? `DIFFICULTY: ${difficulty}\n` : ""}
Below are ${exemplars.length} REAL released sample questions from official sources. Use them as STYLE + RIGOR + FORMAT targets. Generate an ORIGINAL question — do NOT copy or closely paraphrase any exemplar. Match:
  - Stem length and phrasing convention
  - Answer option structure (${qtype === "MCQ" ? "4 options A-D with exact letter prefixes" : "per the question type's format"})
  - Distractor pattern (wrong answers should be plausibly attractive based on specific misconceptions)
  - Explanation style (confirm correct + 1 sentence per wrong option explaining the trap)
  - Vocabulary (use phrases CB/ACT/DANTES actually use, not synonyms)

EXEMPLARS:
`;
  const exemplarBlocks = exemplars.map((e, i) => {
    let b = `\n--- EXEMPLAR ${i + 1} (source: ${e.sourceName}) ---\n`;
    if (e.stimulus) b += `STIMULUS:\n${e.stimulus}\n\n`;
    b += `QUESTION: ${e.questionText}\n`;
    if (Array.isArray(e.options)) b += `OPTIONS:\n${e.options.join("\n")}\n`;
    if (e.correctAnswer) b += `CORRECT: ${e.correctAnswer}\n`;
    if (e.explanation) b += `EXPLANATION: ${String(e.explanation).slice(0, 400)}\n`;
    return b;
  }).join("\n");

  const tail = `

NOW GENERATE ONE ORIGINAL ${qtype} QUESTION IN JSON FORMAT (no markdown fences, no commentary):
{
  "questionText": "...",
  ${qtype === "MCQ" ? '"options": ["A) ...", "B) ...", "C) ...", "D) ..."],\n  "correctAnswer": "A|B|C|D",\n  ' : ""}"explanation": "Confirming sentence for correct + trap analysis per wrong option.",
  "difficulty": "EASY|MEDIUM|HARD",
  "topic": "specific topic",
  "subtopic": "specific subtopic if applicable",
  "unit": "unit name matching the course's unit enum"
}

CRITICAL RULES:
1. Question must be ORIGINAL — different problem/scenario than any exemplar.
2. If MCQ: exactly 4 options, prefixes "A) ", "B) ", "C) ", "D) ", correctAnswer single letter.
3. Explanation must start with "{correctAnswer} is correct" followed by reasoning.
4. No placeholder text. No "[FIGURE]" / "[image]" references.
5. Math/science content must be CORRECT — verify step-by-step.
6. Use exact vocabulary and sentence patterns of the exemplar source.`;

  return header + exemplarBlocks + tail;
}

function tryParseJson(s) {
  const cleaned = String(s).replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { return JSON.parse(m[0]); } catch { return null; }
  }
}

// Inline SME validator — duplicates src/lib/sme-validator.ts core checks.
// Structural guards only (no AI second pass) — cheap and deterministic.
function validateSme(q) {
  const failures = [];
  if (!q.questionText || q.questionText.length < 20) failures.push("stem_too_short");
  if (!q.explanation || q.explanation.length < 20) failures.push("explanation_too_short");
  if (!q.correctAnswer) failures.push("no_correct_answer");

  if (Array.isArray(q.options)) {
    if (q.options.length !== 4) failures.push("mcq_option_count_not_4");
    const letters = ["A", "B", "C", "D"];
    for (let i = 0; i < Math.min(q.options.length, 4); i++) {
      const opt = String(q.options[i] || "").trim();
      if (!opt.startsWith(`${letters[i]})`)) failures.push(`option_${letters[i]}_bad_prefix`);
    }
    // Explanation-letter alignment
    const expLetter = (q.explanation || "").match(/^([ABCD])\s+is\s+correct/i);
    if (q.correctAnswer && expLetter && expLetter[1].toUpperCase() !== q.correctAnswer.toUpperCase()) {
      failures.push("explanation_letter_mismatch");
    }
    // Correct answer must be a single letter A-D
    if (!/^[ABCD]$/.test(q.correctAnswer || "")) failures.push("correct_answer_not_letter");
  }

  // Placeholder/image refs
  const combined = `${q.questionText || ""} ${(q.options || []).join(" ")} ${q.explanation || ""}`;
  if (/\[FIGURE\]|\[IMAGE\]|\[image\]|\[figure\]/.test(combined)) failures.push("placeholder_image_ref");
  if (/lorem ipsum|xxxxx|placeholder/i.test(combined)) failures.push("placeholder_text");

  return { ok: failures.length === 0, failures };
}

async function callGemini(prompt) {
  const key = process.env.GOOGLE_AI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 1400 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callTogether(prompt) {
  const key = process.env.TOGETHER_AI_API_KEY;
  const res = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 1400,
    }),
  });
  if (!res.ok) throw new Error(`Together HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callOpenRouter(prompt) {
  const key = process.env.OPENROUTER_API_KEY;
  // OpenRouter free tier models (verified working as of 2026-04-19).
  // Ordered by capability; first to return 200 wins.
  const models = [
    "openai/gpt-oss-120b:free",
    "z-ai/glm-4.5-air:free",
    "openai/gpt-oss-20b:free",
    "google/gemma-4-31b-it:free",
  ];
  let lastErr;
  for (const model of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.6,
          max_tokens: 1400,
        }),
      });
      if (!res.ok) {
        lastErr = new Error(`${model} HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text && text.trim().length > 10) return text;
      lastErr = new Error(`${model} empty`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("OpenRouter: all free models failed");
}

async function callCohere(prompt) {
  const key = process.env.COHERE_API_KEY;
  const res = await fetch("https://api.cohere.ai/v1/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "command-r", message: prompt, temperature: 0.6, max_tokens: 1400 }),
  });
  if (!res.ok) throw new Error(`Cohere HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.text || "";
}

async function callAnthropic(prompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1400,
      temperature: 0.6,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

async function callGroq(prompt) {
  const key = process.env.GROQ_API_KEY;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 1400,
    }),
  });
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

const CALLERS = {
  groq: callGroq,
  anthropic: callAnthropic,
  gemini: callGemini,
  together: callTogether,
  openrouter: callOpenRouter,
  cohere: callCohere,
};

async function callAI(prompt) {
  const available = PROVIDERS.filter(p => process.env[p.envKey] && !cbDisabled(p.name));
  if (available.length === 0) {
    const allConfigured = PROVIDERS.filter(p => process.env[p.envKey]).map(p => p.name);
    throw new Error(`No providers available (all disabled by circuit breaker). Configured: ${allConfigured.join(",")}`);
  }
  const errors = [];
  for (const p of available) {
    const fn = CALLERS[p.name];
    if (!fn) continue;
    try {
      const out = await fn(prompt);
      if (out && out.trim().length > 20) {
        cbOk(p.name);
        return out;
      }
      cbFail(p.name);
      errors.push(`${p.name}: empty_output`);
    } catch (e) {
      cbFail(p.name);
      errors.push(`${p.name}: ${String(e.message || e).slice(0, 120)}`);
    }
  }
  throw new Error(`all providers failed — ${errors.join(" | ")}`);
}

async function generateOne(course, questionType, difficulty) {
  const exemplars = await retrieveExemplars(course, questionType, null, 5);
  if (exemplars.length === 0) {
    return { ok: false, reason: "no_exemplars", exemplarIds: [] };
  }
  const prompt = buildPrompt(course, questionType, difficulty, exemplars);
  let text;
  try {
    text = await callAI(prompt);
  } catch (e) {
    return { ok: false, reason: `ai_error: ${e.message.slice(0, 120)}`, exemplarIds: exemplars.map(e => e.id) };
  }
  const parsed = tryParseJson(text);
  if (!parsed) {
    return { ok: false, reason: "model_output_not_json", exemplarIds: exemplars.map(e => e.id) };
  }

  const question = {
    questionText: String(parsed.questionText || "").trim(),
    stimulus: typeof parsed.stimulus === "string" ? parsed.stimulus.trim() : null,
    options: Array.isArray(parsed.options) ? parsed.options : null,
    correctAnswer: typeof parsed.correctAnswer === "string" ? parsed.correctAnswer.trim() : null,
    explanation: typeof parsed.explanation === "string" ? parsed.explanation.trim() : null,
    difficulty: (parsed.difficulty || difficulty || "MEDIUM").toString().toUpperCase(),
    topic: typeof parsed.topic === "string" ? parsed.topic : null,
    subtopic: typeof parsed.subtopic === "string" ? parsed.subtopic : null,
    unit: typeof parsed.unit === "string" ? parsed.unit : null,
  };
  const sme = validateSme(question);
  if (!sme.ok) {
    return { ok: false, reason: "sme_failed:" + sme.failures.join(","), exemplarIds: exemplars.map(e => e.id) };
  }

  // Batch 1 Gate A: plagiarism guard — reject if near-paraphrase of any exemplar
  const plag = validatePlagiarism(question, exemplars, 0.30);
  if (!plag.ok) {
    return {
      ok: false,
      reason: `plagiarism:${plag.similarity}_vs_${plag.matchedExemplarId}`,
      exemplarIds: exemplars.map(e => e.id),
    };
  }

  // Batch 1 Gate B: Haiku 4.5 factual + consensus review
  const ai = await validateAi(question, course);
  if (ai.severity === "reject") {
    return {
      ok: false,
      reason: `ai_reject:${String(ai.reason).slice(0, 80)}`,
      exemplarIds: exemplars.map(e => e.id),
      aiAudit: ai,
    };
  }

  return {
    ok: true,
    question,
    exemplarIds: exemplars.map(e => e.id),
    aiAudit: ai,
    plagiarism: plag,
  };
}

async function enumsFor(course) {
  // Query an existing Question row for this course to learn the `unit` enum
  const sample = await prisma.question.findFirst({ where: { course }, select: { unit: true } });
  return { defaultUnit: sample?.unit || null };
}

async function withDbRetry(fn, attempts = 6) {
  // Neon auto-suspends idle pools AND drops long-open sockets (P1017). Retry
  // all transient connectivity errors with exponential backoff.
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      const msg = String(e.message || e);
      const code = e?.code || "";
      const transient =
        /Can't reach database server|ECONNRESET|ETIMEDOUT|fetch failed|connection terminated|Server has closed the connection|Closed connection/i.test(msg)
        || code === "P1001" || code === "P1008" || code === "P1017";
      if (!transient || i === attempts - 1) throw e;
      const wait = 500 * Math.pow(2, i);
      await new Promise(r => setTimeout(r, wait));
      lastErr = e;
    }
  }
  throw lastErr;
}

async function writeQuestion(course, q, defaultUnit) {
  const contentHash = hashQuestion(q.questionText);
  const existing = await withDbRetry(() => prisma.question.findUnique({ where: { contentHash } }));
  if (existing) return { wrote: false, reason: "duplicate_content_hash", id: existing.id };

  // Resolve unit: always fall back to defaultUnit unless parsed.unit matches an enum.
  // AI frequently returns free-form unit strings ("Unit 1: Chemistry of Life") that
  // don't match the enum exactly, and Prisma throws on bad enum input, so we must
  // guard with try/catch and only accept matches that Prisma validates.
  let unit = defaultUnit;
  if (q.unit) {
    try {
      const existingUnit = await prisma.question.findFirst({
        where: { course, unit: q.unit },
        select: { unit: true },
      });
      if (existingUnit) unit = existingUnit.unit;
    } catch {
      // parsed.unit is not a valid enum — silently fall back to defaultUnit
    }
  }
  if (!unit) return { wrote: false, reason: "no_unit_resolvable" };

  const data = {
    course,
    unit,
    topic: q.topic || "General",
    subtopic: q.subtopic || null,
    difficulty: q.difficulty,
    questionType: Array.isArray(q.options) ? "MCQ" : "FRQ",
    questionText: q.questionText,
    stimulus: q.stimulus || null,
    options: q.options ? q.options : undefined,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    isAiGenerated: true,
    isApproved: true,
    modelUsed: "grounded-cascade",
    contentHash,
    bloomLevel: null,
  };
  try {
    const created = await withDbRetry(() => prisma.question.create({ data }));
    return { wrote: true, id: created.id };
  } catch (e) {
    return { wrote: false, reason: `db_error: ${e.message.slice(0, 100)}` };
  }
}

async function runCourse(course, args, logStream) {
  const approved = await prisma.question.count({ where: { course, isApproved: true } });
  const officialSamples = await prisma.officialSample.count({ where: { course } });
  if (officialSamples < 3) {
    console.log(`  SKIP ${course}: only ${officialSamples} OfficialSample rows (need ≥3 for grounding)`);
    return { course, generated: 0, failed: 0, skipped: true };
  }
  let toMake;
  if (args.count != null) toMake = args.count;
  else if (args.mode === "fill-to-target") toMake = Math.max(0, args.target - approved);
  else toMake = args.target;
  toMake = Math.min(toMake, args.maxPerCourse);

  if (toMake === 0) {
    console.log(`  SKIP ${course}: approved=${approved} already ≥ target=${args.target}`);
    return { course, generated: 0, failed: 0, skipped: true };
  }

  console.log(`\n-- ${course}: approved=${approved}, target=${args.target}, making=${toMake}, exemplars=${officialSamples} --`);
  const { defaultUnit } = await enumsFor(course);

  const difficultyCycle = args.difficulty ? [args.difficulty] : ["EASY", "MEDIUM", "HARD"];
  let generated = 0, failed = 0, attempted = 0;
  const maxAttempts = toMake * 3;

  while (generated < toMake && attempted < maxAttempts) {
    const diff = difficultyCycle[attempted % difficultyCycle.length];
    attempted++;
    const r = await generateOne(course, args.questionType, diff);
    if (!r.ok) {
      failed++;
      logStream.write(JSON.stringify({ course, diff, ok: false, reason: r.reason, ts: new Date().toISOString() }) + "\n");
      if (attempted % 5 === 0) console.log(`    ${generated}/${toMake} good (${failed} failed, ${attempted} attempted)`);
      continue;
    }
    if (args.dryRun) {
      generated++;
      logStream.write(JSON.stringify({
        course, diff, ok: true, dryRun: true,
        exemplarIds: r.exemplarIds,
        plagiarismSim: r.plagiarism?.similarity,
        aiVerdict: r.aiAudit?.severity,
        aiAgrees: r.aiAudit?.agreesWithCandidate,
        ts: new Date().toISOString()
      }) + "\n");
      continue;
    }
    const w = await writeQuestion(course, r.question, defaultUnit);
    if (w.wrote) {
      generated++;
      logStream.write(JSON.stringify({
        course, diff, ok: true, id: w.id,
        exemplarIds: r.exemplarIds,
        plagiarismSim: r.plagiarism?.similarity,
        aiVerdict: r.aiAudit?.severity,
        aiAgrees: r.aiAudit?.agreesWithCandidate,
        collegeLevelRigor: r.aiAudit?.collegeLevelRigor,
        ambiguity: r.aiAudit?.ambiguity,
        ts: new Date().toISOString()
      }) + "\n");
    } else {
      failed++;
      logStream.write(JSON.stringify({ course, diff, ok: false, reason: w.reason, ts: new Date().toISOString() }) + "\n");
    }
    if (generated % 5 === 0) console.log(`    ${generated}/${toMake} good (${failed} failed, ${attempted} attempted)`);
  }

  console.log(`  ${course}: +${generated} generated, ${failed} failed, ${attempted} attempts`);
  return { course, generated, failed, attempted };
}

async function main() {
  const args = parseArgs();
  const logDir = path.resolve("scripts/logs");
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, `regen-grounded-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`);
  const logStream = fs.createWriteStream(logPath);
  console.log(`Log: ${logPath}`);
  console.log(`Mode: ${args.mode}  target=${args.target}  maxPerCourse=${args.maxPerCourse}  dryRun=${args.dryRun}`);

  let courses;
  if (args.all) {
    const g = await prisma.officialSample.groupBy({ by: ["course"], _count: true });
    courses = g.filter(r => r._count >= 3).map(r => r.course);
  } else if (args.course) {
    courses = [args.course];
  } else {
    console.error("Specify --course=CODE or --all");
    process.exit(1);
  }

  const results = [];
  for (const c of courses) {
    const r = await runCourse(c, args, logStream);
    results.push(r);
  }

  console.log("\n==== REGEN SUMMARY ====");
  let totalGenerated = 0, totalFailed = 0;
  for (const r of results) {
    console.log(`  ${r.course.padEnd(40)} +${r.generated || 0} generated, ${r.failed || 0} failed${r.skipped ? " (skipped)" : ""}`);
    totalGenerated += r.generated || 0;
    totalFailed += r.failed || 0;
  }
  console.log(`\nTOTAL: +${totalGenerated} generated, ${totalFailed} failed across ${results.length} courses`);

  logStream.end();
  await prisma.$disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
