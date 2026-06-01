/**
 * 2026-06-01 — Shared free-LLM cascade.
 *
 * Lifted from scripts/tag-sat-skill-codes.mjs after the F13 run proved the
 * pattern: Gemini 2.0 Flash → Groq llama-3.3-70b → OpenRouter gpt-oss-120b
 * (free) → Anthropic Haiku. Marks any provider returning 4xx/429 as dead
 * for the run so we stop hammering depleted credits.
 *
 * Used by:
 *   - scripts/tag-sat-skill-codes.mjs (F13 skill-code classifier)
 *   - scripts/_fill-mirror-haiku.mjs  (F1c rebalance generation)
 *   - any other Haiku-dependent script that needs a free fallback
 *
 * Two entry points:
 *   - callJson(system, user)  — returns text, caller parses JSON
 *   - callJsonObject(system, user) — returns parsed JSON object (best-effort)
 *
 * Provider selection happens once at module load via PROVIDERS_AVAILABLE.
 * Order is fixed (Gemini → Groq → OpenRouter → Anthropic) so the cheapest
 * provider gets called first. Each provider call has a 60s timeout.
 *
 * Re-exporting parseJsonBestEffort + providerDead lets the caller introspect
 * for debugging.
 */
import "dotenv/config";

export const PROVIDERS_AVAILABLE = [
  process.env.GOOGLE_AI_API_KEY ? "gemini" : null,
  process.env.GROQ_API_KEY ? "groq" : null,
  process.env.OPENROUTER_API_KEY ? "openrouter" : null,
  process.env.ANTHROPIC_API_KEY ? "anthropic" : null,
].filter(Boolean);

export const providerDead = new Set();

const TIMEOUT_MS = 60_000;

function withTimeout(promise, ms = TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

async function callGemini(system, user, maxTokens) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;
  const res = await withTimeout(fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `${system}\n\n${user}` }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: maxTokens, temperature: 0.3 },
    }),
  }));
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function callGroq(system, user, maxTokens) {
  const res = await withTimeout(fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.GROQ_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      response_format: { type: "json_object" },
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  }));
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callOpenRouter(system, user, maxTokens) {
  const res = await withTimeout(fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b:free",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  }));
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(system, user, maxTokens) {
  const res = await withTimeout(fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  }));
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

const PROVIDER_CALLS = { gemini: callGemini, groq: callGroq, openrouter: callOpenRouter, anthropic: callAnthropic };

/**
 * Call providers in order until one succeeds. Mark 4xx/429 providers as
 * dead for the rest of the process lifetime. Returns { text, provider }.
 * Throws if every available provider fails.
 */
export async function callJson(system, user, { maxTokens = 4000 } = {}) {
  let lastErr = null;
  for (const provider of PROVIDERS_AVAILABLE) {
    if (providerDead.has(provider)) continue;
    try {
      const text = await PROVIDER_CALLS[provider](system, user, maxTokens);
      return { text, provider };
    } catch (e) {
      const msg = String(e?.message ?? e);
      lastErr = `${provider}: ${msg}`;
      if (/(4(00|01|02|03)|429)/.test(msg)) {
        providerDead.add(provider);
      }
    }
  }
  throw new Error(`All providers failed. Last: ${lastErr}`);
}

/**
 * Best-effort JSON parsing for LLM output. Handles:
 *   - whole-string JSON (Groq json_object mode)
 *   - markdown-fenced JSON
 *   - object-wrapped arrays ({"items":[...]}, {"questions":[...]})
 *   - regex-extracted [...]
 */
export function parseJsonBestEffort(text) {
  if (!text) return null;
  const stripped = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  try {
    return JSON.parse(stripped);
  } catch {
    // fall through
  }
  // Try array extraction
  const arr = stripped.match(/\[[\s\S]*\]/);
  if (arr) {
    try { return JSON.parse(arr[0]); } catch {}
  }
  // Try object extraction
  const obj = stripped.match(/\{[\s\S]*\}/);
  if (obj) {
    try { return JSON.parse(obj[0]); } catch {}
  }
  return null;
}

/** Convenience: call + parse object. Returns parsed JSON or throws. */
export async function callJsonObject(system, user, opts) {
  const { text, provider } = await callJson(system, user, opts);
  const parsed = parseJsonBestEffort(text);
  if (parsed == null) throw new Error(`Could not parse JSON from ${provider}: ${text.slice(0, 200)}`);
  return { parsed, provider };
}
