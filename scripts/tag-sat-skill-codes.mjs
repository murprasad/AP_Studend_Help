#!/usr/bin/env node
/**
 * 2026-05-31 — F13 (#100 SAT=CB parity). Tag every SAT/PSAT Q with the
 * official College Board skill code so:
 *   1. Khan Academy partnership links (F12) become per-skill not
 *      per-domain hubs.
 *   2. Future IRT calibration (F11) has a per-skill anchor.
 *   3. The result page can group wrong answers by CB skill code, which
 *      matches what students see on Bluebook.
 *
 * CB publishes skill codes (e.g. "ALG.001", "ALG.002", "ADV.005") per
 * content domain in their digital SAT Suite Question Bank guides. SN's
 * existing `skillCodes` field in courses.ts is a 4-element string array
 * of the content-DOMAIN-level codes; we want finer per-Q skill codes.
 *
 * Approach
 * 1. Load every approved SAT_MATH / SAT_READING_WRITING / PSAT_MATH /
 *    PSAT_READING_WRITING question.
 * 2. For each, infer the most likely CB skill code from the question
 *    text + topic + unit. Use a small Haiku prompt with a constrained
 *    skill-code allowlist as output domain.
 * 3. Write the inferred code to question.skillCode (new column — needs
 *    a Prisma migration to add it; for now we write to question.topic
 *    as a "CB:SKILL_CODE" prefix until the schema lands).
 *
 * Usage:
 *   node scripts/tag-sat-skill-codes.mjs                # dry run (default)
 *   node scripts/tag-sat-skill-codes.mjs --commit       # write to DB
 *   node scripts/tag-sat-skill-codes.mjs --course=SAT_MATH --limit=10
 *
 * Prereqs:
 *   DATABASE_URL set in .env
 *   ANTHROPIC_API_KEY set for Haiku skill-code inference (optional —
 *   without it, the script reports the bank by domain and exits)
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("✗ DATABASE_URL not set");
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

const args = new Set(process.argv.slice(2));
const COMMIT = args.has("--commit");
const courseFilter = (() => {
  const arg = process.argv.find((a) => a.startsWith("--course="));
  return arg ? arg.split("=")[1] : null;
})();
const limit = (() => {
  const arg = process.argv.find((a) => a.startsWith("--limit="));
  return arg ? Number(arg.split("=")[1]) : 5000;
})();

// CB-published skill codes per content domain (digital SAT Suite Question
// Bank guides). Codes are stable across administrations.
const SAT_SKILL_CODES = {
  SAT_MATH_1_ALGEBRA: [
    "ALG.LIN_EQ_ONE_VAR",
    "ALG.LIN_EQ_TWO_VAR",
    "ALG.LIN_FUNC",
    "ALG.SYS_LIN_EQ",
    "ALG.LIN_INEQ",
  ],
  SAT_MATH_2_ADVANCED_MATH: [
    "ADV.EQUIV_EXPRESSIONS",
    "ADV.NONLIN_EQ_ONE_VAR",
    "ADV.SYS_LIN_NONLIN_EQ",
    "ADV.NONLIN_FUNC",
  ],
  SAT_MATH_3_PROBLEM_SOLVING: [
    "PSDA.RATIOS_RATES_PROPORTIONS_UNITS",
    "PSDA.PERCENTAGES",
    "PSDA.PROB_CONDITIONAL_PROB",
    "PSDA.SAMPLE_STATS_DATA_DISPLAYS",
    "PSDA.INFERENCE_CONFIDENCE_MARGIN",
    "PSDA.EVALUATING_STATISTICAL_CLAIMS",
  ],
  SAT_MATH_4_GEOMETRY_TRIG: [
    "GEO.AREA_VOLUME",
    "GEO.LINES_ANGLES_TRIANGLES",
    "GEO.RIGHT_TRI_TRIG",
    "GEO.CIRCLES",
  ],
  SAT_RW_1_CRAFT_STRUCTURE: [
    "CRS.WORDS_IN_CONTEXT",
    "CRS.TEXT_STRUCTURE_PURPOSE",
    "CRS.CROSS_TEXT_CONNECTIONS",
  ],
  SAT_RW_2_INFO_IDEAS: [
    "II.CENTRAL_IDEAS_DETAILS",
    "II.COMMAND_OF_EVIDENCE_TEXTUAL",
    "II.COMMAND_OF_EVIDENCE_QUANTITATIVE",
    "II.INFERENCES",
  ],
  SAT_RW_3_STANDARD_ENGLISH: [
    "SEC.BOUNDARIES",
    "SEC.FORM_STRUCTURE_SENSE",
  ],
  SAT_RW_4_EXPRESSION_IDEAS: [
    "EOI.RHETORICAL_SYNTHESIS",
    "EOI.TRANSITIONS",
  ],
};

const PSAT_MIRROR = {
  PSAT_MATH_1_ALGEBRA: SAT_SKILL_CODES.SAT_MATH_1_ALGEBRA,
  PSAT_MATH_2_ADVANCED_MATH: SAT_SKILL_CODES.SAT_MATH_2_ADVANCED_MATH,
  PSAT_MATH_3_PROBLEM_SOLVING: SAT_SKILL_CODES.SAT_MATH_3_PROBLEM_SOLVING,
  PSAT_MATH_4_GEOMETRY_TRIG: SAT_SKILL_CODES.SAT_MATH_4_GEOMETRY_TRIG,
  PSAT_RW_1_CRAFT_STRUCTURE: SAT_SKILL_CODES.SAT_RW_1_CRAFT_STRUCTURE,
  PSAT_RW_2_INFO_IDEAS: SAT_SKILL_CODES.SAT_RW_2_INFO_IDEAS,
  PSAT_RW_3_STANDARD_ENGLISH: SAT_SKILL_CODES.SAT_RW_3_STANDARD_ENGLISH,
  PSAT_RW_4_EXPRESSION_IDEAS: SAT_SKILL_CODES.SAT_RW_4_EXPRESSION_IDEAS,
};

const SKILL_CODES_BY_UNIT = { ...SAT_SKILL_CODES, ...PSAT_MIRROR };

console.log("# SAT/PSAT skill-code tagger");
console.log("MODE:", COMMIT ? "COMMIT (writes to DB)" : "DRY-RUN");
if (courseFilter) console.log("COURSE FILTER:", courseFilter);
console.log("LIMIT:", limit);
console.log("");

// Load distribution
const distribution = courseFilter
  ? await sql`
      SELECT course::text AS course, unit::text AS unit, COUNT(*)::int AS n
      FROM questions
      WHERE course::text IN (
        'SAT_MATH','SAT_READING_WRITING','PSAT_MATH','PSAT_READING_WRITING'
      )
      AND course::text = ${courseFilter}
      AND "isApproved" = true
      GROUP BY course, unit
      ORDER BY course, unit
    `
  : await sql`
      SELECT course::text AS course, unit::text AS unit, COUNT(*)::int AS n
      FROM questions
      WHERE course::text IN (
        'SAT_MATH','SAT_READING_WRITING','PSAT_MATH','PSAT_READING_WRITING'
      )
      AND "isApproved" = true
      GROUP BY course, unit
      ORDER BY course, unit
    `;

console.log("## Current bank distribution by domain\n");
console.log("course               | unit                              | approved Qs");
console.log("---------------------|-----------------------------------|------------");
let grandTotal = 0;
for (const d of distribution) {
  const c = (d.course ?? "").padEnd(20);
  const u = (d.unit ?? "").padEnd(33);
  console.log(`${c} | ${u} | ${d.n}`);
  grandTotal += d.n;
}
console.log(`\nTotal: ${grandTotal} approved SAT/PSAT questions across ${distribution.length} domains.`);

// Show the skill-code allowlist per domain
console.log("\n## Published CB skill codes per domain\n");
for (const [unit, codes] of Object.entries(SKILL_CODES_BY_UNIT)) {
  console.log(`\n${unit} (${codes.length} skills):`);
  for (const c of codes) console.log(`  - ${c}`);
}

if (!COMMIT) {
  console.log("\n(Dry-run only — no DB writes performed.)");
  console.log("Re-run with --commit set to perform per-Q inference.");
  process.exit(0);
}

// 2026-05-31 — User chose free-LLM cascade after ANTHROPIC_API_KEY ran out
// of credits. Order: Gemini 2.0 Flash → Groq llama-3.3-70b → OpenRouter
// free GPT-OSS. Skip providers without an env key. At least one needed.
const PROVIDERS_AVAILABLE = [
  process.env.GOOGLE_AI_API_KEY ? "gemini" : null,
  process.env.GROQ_API_KEY ? "groq" : null,
  process.env.OPENROUTER_API_KEY ? "openrouter" : null,
  process.env.ANTHROPIC_API_KEY ? "anthropic" : null,
].filter(Boolean);
if (PROVIDERS_AVAILABLE.length === 0) {
  console.log("\n✗ No LLM provider keys set (need GOOGLE_AI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, or ANTHROPIC_API_KEY).");
  process.exit(1);
}
console.log("\n## Provider cascade:", PROVIDERS_AVAILABLE.join(" → "));

// ── Per-Q Haiku inference + DB writes ─────────────────────────────────────
console.log("\n## Per-Q Haiku inference\n");

const rows = courseFilter
  ? await sql`
      SELECT id, course::text AS course, unit::text AS unit, topic,
             LEFT("questionText", 600) AS qtext, LEFT(COALESCE(stimulus, ''), 400) AS stim
      FROM questions
      WHERE course::text IN (
        'SAT_MATH','SAT_READING_WRITING','PSAT_MATH','PSAT_READING_WRITING'
      )
      AND course::text = ${courseFilter}
      AND "isApproved" = true
      AND "skillCode" IS NULL
      ORDER BY id
      LIMIT ${limit}
    `
  : await sql`
      SELECT id, course::text AS course, unit::text AS unit, topic,
             LEFT("questionText", 600) AS qtext, LEFT(COALESCE(stimulus, ''), 400) AS stim
      FROM questions
      WHERE course::text IN (
        'SAT_MATH','SAT_READING_WRITING','PSAT_MATH','PSAT_READING_WRITING'
      )
      AND "isApproved" = true
      AND "skillCode" IS NULL
      ORDER BY id
      LIMIT ${limit}
    `;

console.log(`Loaded ${rows.length} approved SAT/PSAT Qs still missing skillCode.`);
if (rows.length === 0) {
  console.log("Nothing to tag. Done.");
  process.exit(0);
}

const BATCH_SIZE = 15;
let totalTagged = 0;
let totalSkipped = 0;
const startedAt = Date.now();

function parseJsonArray(text) {
  if (!text) return null;
  const stripped = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  // Try whole-string parse first (Groq json_object mode returns {"items": [...]})
  try {
    const whole = JSON.parse(stripped);
    if (Array.isArray(whole)) return whole;
    if (whole && Array.isArray(whole.items)) return whole.items;
    if (whole && Array.isArray(whole.classifications)) return whole.classifications;
    if (whole && Array.isArray(whole.results)) return whole.results;
  } catch {
    // fall through to regex extraction
  }
  const m = stripped.match(/\[[\s\S]*\]/);
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[0]);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function callGemini(system, user) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `${system}\n\n${user}` }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 2000, temperature: 0 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function callGroq(system, user) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callOpenRouter(system, user) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b:free",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 2000,
      temperature: 0,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(system, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

const PROVIDER_CALLS = { gemini: callGemini, groq: callGroq, openrouter: callOpenRouter, anthropic: callAnthropic };
// Memoize provider failure to avoid hammering a known-dead provider.
// Reset on next process invocation, which is fine for our use case.
const providerDead = new Set();

async function callWithCascade(system, user) {
  let lastErr = null;
  for (const provider of PROVIDERS_AVAILABLE) {
    if (providerDead.has(provider)) continue;
    try {
      const text = await PROVIDER_CALLS[provider](system, user);
      return { text, provider };
    } catch (e) {
      const msg = String(e?.message ?? e);
      lastErr = msg;
      // 400/401/402/403 = config/quota; mark dead so we stop hammering it
      if (/^[A-Z][\w]+ (4(00|01|02|03)|429)/i.test(msg)) {
        providerDead.add(provider);
        console.log(`  ⚠  ${provider} disabled for this run: ${msg.slice(0, 120)}`);
      }
    }
  }
  throw new Error(`All providers failed. Last: ${lastErr}`);
}

async function inferBatch(batch) {
  // Group by unit so each batch shares an allowlist
  const byUnit = new Map();
  for (const r of batch) {
    if (!byUnit.has(r.unit)) byUnit.set(r.unit, []);
    byUnit.get(r.unit).push(r);
  }
  const results = new Map();
  for (const [unit, qs] of byUnit) {
    const allowlist = SKILL_CODES_BY_UNIT[unit];
    if (!allowlist) {
      for (const _q of qs) totalSkipped += 1;
      continue;
    }
    const promptItems = qs.map((q, i) => `[${i}] (id: ${q.id})
TOPIC: ${q.topic ?? ""}
${q.stim ? `PASSAGE: ${q.stim}\n` : ""}QUESTION: ${q.qtext}`).join("\n\n");
    const system = `You classify College Board digital SAT questions by official skill code.
For each question, return EXACTLY ONE skill code from the allowlist below.
Output JSON ONLY (no prose, no markdown fences) shaped exactly:
{"items": [{"i": <index>, "id": "<id>", "code": "<SKILL_CODE>"}]}
ALLOWLIST for ${unit}:
${allowlist.map((c) => `  - ${c}`).join("\n")}`;
    const user = `Classify each question with one skill code from the allowlist:\n\n${promptItems}`;
    let text = "";
    let provider = "";
    try {
      const r = await callWithCascade(system, user);
      text = r.text;
      provider = r.provider;
    } catch (e) {
      console.log(`  ✗ ${unit}: ${String(e?.message ?? e).slice(0, 180)}`);
      for (const _q of qs) totalSkipped += 1;
      continue;
    }
    const parsed = parseJsonArray(text);
    if (!Array.isArray(parsed)) {
      console.log(`  ✗ ${unit} (${provider}): unparsable output: ${text.slice(0, 150)}`);
      for (const _q of qs) totalSkipped += 1;
      continue;
    }
    for (const item of parsed) {
      if (!item?.id || !item?.code) continue;
      if (!allowlist.includes(item.code)) continue;
      results.set(item.id, item.code);
    }
  }
  return results;
}

for (let i = 0; i < rows.length; i += BATCH_SIZE) {
  const batch = rows.slice(i, i + BATCH_SIZE);
  const tagged = await inferBatch(batch);
  // Bulk update
  for (const [id, code] of tagged) {
    try {
      await sql`UPDATE questions SET "skillCode" = ${code} WHERE id = ${id}`;
      totalTagged += 1;
    } catch (e) {
      totalSkipped += 1;
      console.log(`  ✗ UPDATE failed for ${id}: ${e.message}`);
    }
  }
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
  console.log(`  Progress: ${i + batch.length}/${rows.length}  (tagged: ${totalTagged}, skipped: ${totalSkipped}, ${elapsed}s)`);
}

console.log(`\n# Done. Tagged ${totalTagged} / ${rows.length}. Skipped ${totalSkipped}.`);
