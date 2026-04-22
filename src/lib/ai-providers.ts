/**
 * Multi-provider AI engine with automatic cascade fallback.
 *
 * Provider priority order (first available key wins):
 *  1. Google Gemini       – GOOGLE_AI_API_KEY        (free tier, 1 500 req/day)
 *  2. Groq                – GROQ_API_KEY             (free tier, fast Llama 3)
 *  3. Together.ai         – TOGETHER_AI_API_KEY      (free $1 credit on sign-up)
 *  4. OpenRouter          – OPENROUTER_API_KEY       (aggregator, free models)
 *  5. HuggingFace         – HUGGINGFACE_API_KEY      (free serverless inference)
 *  6. Cohere              – COHERE_API_KEY           (free tier, Command-R)
 *  7. Vertex AI           – VERTEX_AI_PROJECT_ID +   (GCP, needs service account)
 *                           VERTEX_AI_LOCATION +
 *                           GOOGLE_APPLICATION_CREDENTIALS (JSON string)
 *  8. Ollama              – OLLAMA_BASE_URL           (self-hosted, e.g. http://host:11434)
 *  9. Anthropic           – ANTHROPIC_API_KEY        (last resort / paid)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Circuit breaker — auto-disable broken providers for 10 minutes ──────────
// Prevents wasting time on providers that are consistently failing.
// Each provider gets a failure count; after 3 consecutive failures, it's
// disabled for CIRCUIT_BREAKER_COOLDOWN_MS. Resets on success.
const CIRCUIT_BREAKER_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
const CIRCUIT_BREAKER_THRESHOLD = 3; // failures before tripping

interface CircuitState {
  failures: number;
  disabledUntil: number; // timestamp
}

const circuitBreakers = new Map<string, CircuitState>();

function isProviderDisabled(name: string): boolean {
  const state = circuitBreakers.get(name);
  if (!state) return false;
  if (state.disabledUntil > Date.now()) return true;
  // Cooldown expired — reset
  circuitBreakers.delete(name);
  return false;
}

function recordProviderFailure(name: string): void {
  const state = circuitBreakers.get(name) || { failures: 0, disabledUntil: 0 };
  state.failures++;
  if (state.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    state.disabledUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS;
    console.warn(`[AI][circuit-breaker] ${name} disabled for 10 min after ${state.failures} consecutive failures`);
  }
  circuitBreakers.set(name, state);
}

// Trip the circuit breaker in a single strike for permanent errors (429/402/401/403 etc.)
// These errors will not recover within a job run — no sense re-trying across requests.
function recordProviderFailureHard(name: string, reason: string): void {
  const state = { failures: CIRCUIT_BREAKER_THRESHOLD, disabledUntil: Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS };
  circuitBreakers.set(name, state);
  console.warn(`[AI][circuit-breaker] ${name} disabled for 10 min (hard fail: ${reason})`);
}

function recordProviderSuccess(name: string): void {
  circuitBreakers.delete(name);
}

export interface AICallResult {
  response: string;
  modelUsed: string;
}

export interface ValidationResult {
  approved: boolean;
  reason?: string;
}

// ── Provider instances (lazy-created only when the key exists) ─────────────

function getGemini() {
  return process.env.GOOGLE_AI_API_KEY
    ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
    : null;
}


// ── Individual provider call functions ─────────────────────────────────────

async function callGemini(
  prompt: string,
  systemPrompt?: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const client = getGemini();
  if (!client) throw new Error("No GOOGLE_AI_API_KEY");

  const model = client.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
  });

  if (history && history.length > 0) {
    const chatHistory = history.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }));
    const lastMsg = history[history.length - 1];
    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(lastMsg.content);
    return result.response.text();
  }

  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}

async function callGroq(
  prompt: string,
  systemPrompt?: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("No GROQ_API_KEY");

  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  if (history) messages.push(...history.map((m) => ({ role: m.role, content: m.content })));
  messages.push({ role: "user", content: prompt });

  // Use plain fetch (works on both Node.js and Cloudflare Workers)
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 1500,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Groq error ${res.status}: ${err.slice(0, 100)}`);
  }
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq: empty response");
  return content;
}

async function callTogetherAI(
  prompt: string,
  systemPrompt?: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  if (!process.env.TOGETHER_AI_API_KEY) throw new Error("No TOGETHER_AI_API_KEY");

  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  if (history) messages.push(...history);
  messages.push({ role: "user", content: prompt });

  const res = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TOGETHER_AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "meta-llama/Llama-3-70b-chat-hf",
      messages,
      max_tokens: 1500,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`Together.ai error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callOpenRouter(
  prompt: string,
  systemPrompt?: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("No OPENROUTER_API_KEY");

  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  if (history) messages.push(...history);
  messages.push({ role: "user", content: prompt });

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://studentnest.ai",
      "X-Title": "StudentNest",
    },
    body: JSON.stringify({
      model: "openrouter/free",  // OpenRouter auto-selects best available free model
      messages,
      max_tokens: 1500,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callOpenRouterPremium(
  prompt: string,
  systemPrompt?: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("No OPENROUTER_API_KEY");

  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  if (history) messages.push(...history);
  messages.push({ role: "user", content: prompt });

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://studentnest.ai",
      "X-Title": "StudentNest",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o",
      messages,
      max_tokens: 1500,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`OpenRouter-Premium error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callHuggingFace(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("No HUGGINGFACE_API_KEY");

  const messages = [
    ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
    { role: "user", content: prompt },
  ];

  // HuggingFace Inference via featherless-ai provider
  const res = await fetch("https://router.huggingface.co/featherless-ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "meta-llama/Meta-Llama-3-8B-Instruct", messages, max_tokens: 1200, temperature: 0.7 }),
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) throw new Error(`HuggingFace error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callCohere(
  prompt: string,
  systemPrompt?: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) throw new Error("No COHERE_API_KEY");

  const chatHistory = history
    ? history.map((m) => ({ role: m.role === "assistant" ? "CHATBOT" : "USER", message: m.content }))
    : [];

  const res = await fetch("https://api.cohere.ai/v1/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "command-r", message: prompt, preamble: systemPrompt, chat_history: chatHistory, max_tokens: 1200 }),
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) throw new Error(`Cohere error: ${res.status}`);
  const data = await res.json() as { text?: string };
  return data.text || "";
}

async function callVertexAI(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const projectId = process.env.VERTEX_AI_PROJECT_ID;
  const location = process.env.VERTEX_AI_LOCATION || "us-central1";
  const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!projectId || !credsJson) throw new Error("No Vertex AI credentials");

  const creds = JSON.parse(credsJson);

  // Get access token via service account
  const tokenRes = await fetch(
    `https://oauth2.googleapis.com/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: await createServiceAccountJWT(creds),
      }),
    }
  );
  if (!tokenRes.ok) throw new Error("Vertex AI token error");
  const { access_token } = await tokenRes.json();

  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

  const res = await fetch(
    `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-1.5-flash:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig: { maxOutputTokens: 1500 },
      }),
      signal: AbortSignal.timeout(30000),
    }
  );
  if (!res.ok) throw new Error(`Vertex AI error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function createServiceAccountJWT(creds: Record<string, string>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: creds.client_email,
    sub: creds.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/cloud-platform",
  };

  // Encode JWT header and payload
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const unsigned = `${header}.${body}`;

  // Sign with private key using Node.js crypto
  const { createSign } = await import("crypto");
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  const signature = sign.sign(creds.private_key, "base64url");

  return `${unsigned}.${signature}`;
}

async function callOllama(
  prompt: string,
  systemPrompt?: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL;
  if (!baseUrl) throw new Error("No OLLAMA_BASE_URL");

  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  if (history) messages.push(...history);
  messages.push({ role: "user", content: prompt });

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL || "llama3",
      messages,
      stream: false,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return data.message?.content || "";
}

async function callAnthropic(
  prompt: string,
  systemPrompt?: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("No ANTHROPIC_API_KEY");

  const messages = [
    ...(history || []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: prompt },
  ];

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages,
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Anthropic error ${res.status}: ${err.slice(0, 100)}`);
  }
  const data = await res.json() as { content?: Array<{ type: string; text?: string }> };
  const content = data.content?.[0];
  if (!content || content.type !== "text") throw new Error("Anthropic: empty response");
  return content.text!;
}

// Direct-to-Sonnet generator (bulk admin paths only).
// Bypasses the cascade and circuit breaker — we want every bulk call to hit
// Sonnet unless the caller explicitly opts out via BULK_USE_SONNET env.
// Returns AICallResult so the existing generateQuestion → validateQuestion
// cross-model detection (via modelUsed) kicks in automatically.
export async function callSonnetDirect(
  prompt: string,
  systemPrompt?: string,
): Promise<AICallResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("No ANTHROPIC_API_KEY");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(40000),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Anthropic-Sonnet-direct error ${res.status}: ${err.slice(0, 100)}`);
  }
  const data = await res.json() as { content?: Array<{ type: string; text?: string }> };
  const content = data.content?.[0];
  if (!content || content.type !== "text") throw new Error("Anthropic-Sonnet-direct: empty response");
  return { response: content.text!.trim(), modelUsed: "anthropic/claude-sonnet-4-6" };
}

// ── Provider cascade ───────────────────────────────────────────────────────

type ProviderFn = (
  prompt: string,
  systemPrompt?: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
) => Promise<string>;

interface Provider {
  name: string;
  envKey: string;
  modelId: string;
  call: ProviderFn;
}

// ── Pollinations.ai — completely free, no API key needed ──────────────────
async function callPollinationsFree(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  // Condense system prompt into the user message for GET endpoint
  const combined = systemPrompt
    ? `${systemPrompt.slice(0, 500)}\n\nQuestion: ${prompt}`
    : prompt;

  // Try OpenAI-compatible POST first
  try {
    const messages = [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
      { role: "user", content: prompt },
    ];
    const postRes = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai", messages, seed: 42, private: true }),
      signal: AbortSignal.timeout(25000),
    });
    if (postRes.ok) {
      const text = await postRes.text();
      if (text?.trim() && !text.includes("Bad Gateway")) return text.trim();
    }
  } catch { /* fall through to GET */ }

  // Fallback: GET endpoint (simpler, more reliable)
  const encodedPrompt = encodeURIComponent(combined.slice(0, 1000));
  const getRes = await fetch(
    `https://text.pollinations.ai/${encodedPrompt}?model=openai&seed=42`,
    { signal: AbortSignal.timeout(25000) }
  );
  if (!getRes.ok) throw new Error(`Pollinations error: ${getRes.status}`);
  const text = await getRes.text();
  if (!text?.trim()) throw new Error("Pollinations: empty response");
  return text.trim();
}

const PROVIDERS: Provider[] = [
  { name: "Gemini",             envKey: "GOOGLE_AI_API_KEY",       modelId: "google/gemini-2.0-flash-lite",         call: callGemini },
  { name: "Groq",               envKey: "GROQ_API_KEY",            modelId: "groq/llama-3.3-70b-versatile",         call: callGroq },
  { name: "Together.ai",        envKey: "TOGETHER_AI_API_KEY",     modelId: "together/llama-3-70b",                 call: callTogetherAI },
  { name: "OpenRouter",         envKey: "OPENROUTER_API_KEY",      modelId: "openrouter/free",                      call: callOpenRouter },
  { name: "OpenRouter-Premium", envKey: "OPENROUTER_API_KEY",      modelId: "openrouter/gpt-4o",                    call: callOpenRouterPremium },
  { name: "HuggingFace",        envKey: "HUGGINGFACE_API_KEY",     modelId: "huggingface/mistral-7b",               call: callHuggingFace },
  { name: "Cohere",             envKey: "COHERE_API_KEY",          modelId: "cohere/command-r",                     call: callCohere },
  { name: "Vertex AI",          envKey: "VERTEX_AI_PROJECT_ID",    modelId: "vertex/gemini-1.5-flash",              call: callVertexAI },
  { name: "Ollama",             envKey: "OLLAMA_BASE_URL",         modelId: "ollama/local",                         call: callOllama },
  { name: "Anthropic",          envKey: "ANTHROPIC_API_KEY",       modelId: "anthropic/claude-sonnet-4-6",          call: callAnthropic },
  // Always-available fallback — Pollinations.ai (no key, free, GPT-4o-mini quality)
  { name: "Pollinations-Free",  envKey: "ALWAYS_AVAILABLE",        modelId: "pollinations/openai",                  call: callPollinationsFree },
];

// ── Tier-based provider lists ───────────────────────────────────────────────

// Ordered by reliability: Groq (fast+free) → Together.ai (paid backup) → Anthropic (quality) → Pollinations (always-on)
// HuggingFace removed from FREE tier (too slow/unreliable)
const FREE_TIER_PROVIDER_NAMES = ["Groq", "Together.ai", "Anthropic", "Pollinations-Free"];
const PREMIUM_TIER_PROVIDER_NAMES = ["Groq", "Anthropic", "OpenRouter-Premium", "Gemini", "Together.ai", "Pollinations-Free"];

/**
 * Call the first available provider.
 * Returns { text, provider } so callers know which succeeded.
 */
export async function callAIWithCascade(
  prompt: string,
  systemPrompt?: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>,
  maxRetries = 1
): Promise<string> {
  // ALWAYS_AVAILABLE is a sentinel key — always included as last resort
  const available = PROVIDERS.filter(
    (p) => p.envKey === "ALWAYS_AVAILABLE" || !!process.env[p.envKey]
  );

  if (available.length === 0) {
    throw new Error(
      "No AI provider configured. Please set at least one API key: GOOGLE_AI_API_KEY, GROQ_API_KEY, TOGETHER_AI_API_KEY, OPENROUTER_API_KEY, HUGGINGFACE_API_KEY, COHERE_API_KEY, ANTHROPIC_API_KEY, or OLLAMA_BASE_URL."
    );
  }

  for (const provider of available) {
    // Circuit breaker: skip providers that are consistently failing
    if (isProviderDisabled(provider.name)) {
      console.log(`[AI] Skipping ${provider.name} — circuit breaker active`);
      continue;
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const text = await provider.call(prompt, systemPrompt, history);
        if (text?.trim()) {
          console.log(`[AI] Used provider: ${provider.name}`);
          recordProviderSuccess(provider.name);
          return text.trim();
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[AI] ${provider.name} failed (attempt ${attempt + 1}): ${msg}`);
        // Hard-fail immediately on auth, billing, rate-limit, or spend errors — trip breaker for full cooldown
        if (msg.includes("401") || msg.includes("403") || msg.includes("402")
          || msg.includes("429") || msg.includes("400") || msg.includes("invalid") || msg.includes("API key")
          || msg.includes("rate") || msg.includes("quota") || msg.includes("spend")) {
          recordProviderFailureHard(provider.name, msg.slice(0, 80));
          break;
        }
      }
    }
    recordProviderFailure(provider.name);
  }

  throw new Error(
    `All AI providers failed. Configured: ${available.map((p) => p.name).join(", ")}`
  );
}

/**
 * Returns list of configured provider names for status display.
 */
export function getConfiguredProviders(): string[] {
  return PROVIDERS.filter(
    (p) => p.envKey === "ALWAYS_AVAILABLE" || !!process.env[p.envKey]
  ).map((p) => p.name);
}

/**
 * Call AI providers filtered by subscription tier.
 * FREE → open/fast models; PREMIUM → top-tier models.
 * Returns { response, modelUsed } so callers can record which model was used.
 */
export async function callAIForTier(
  tier: "FREE" | "PREMIUM",
  prompt: string,
  systemPrompt?: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<AICallResult> {
  const tierNames = tier === "PREMIUM" ? PREMIUM_TIER_PROVIDER_NAMES : FREE_TIER_PROVIDER_NAMES;
  const available = PROVIDERS.filter(
    (p) =>
      tierNames.includes(p.name) &&
      (p.envKey === "ALWAYS_AVAILABLE" || !!process.env[p.envKey])
  );

  if (available.length === 0) {
    throw new Error(`No AI providers available for tier: ${tier}`);
  }

  for (const provider of available) {
    if (isProviderDisabled(provider.name)) {
      console.log(`[AI][${tier}] Skipping ${provider.name} — circuit breaker active`);
      continue;
    }
    try {
      const text = await provider.call(prompt, systemPrompt, history);
      if (text?.trim()) {
        console.log(`[AI][${tier}] Used provider: ${provider.name} (${provider.modelId})`);
        recordProviderSuccess(provider.name);
        return { response: text.trim(), modelUsed: provider.modelId };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI][${tier}] ${provider.name} failed: ${msg}`);
      if (msg.includes("401") || msg.includes("403") || msg.includes("402")
        || msg.includes("429") || msg.includes("400") || msg.includes("invalid") || msg.includes("API key")
        || msg.includes("rate") || msg.includes("quota") || msg.includes("spend")) {
        recordProviderFailureHard(provider.name, msg.slice(0, 80));
      } else {
        recordProviderFailure(provider.name);
      }
      if (msg.includes("401") || msg.includes("403") || msg.includes("402")
        || msg.includes("429") || msg.includes("invalid") || msg.includes("API key")) {
        continue;
      }
    }
  }

  throw new Error(`All AI providers failed for tier: ${tier}. Tried: ${available.map((p) => p.name).join(", ")}`);
}

// ── CLEP-specific provider list ──────────────────────────────────────────────
// Gemini fails on CF Workers (GoogleGenerativeAI SDK uses Node.js APIs).
// Groq is fast + reliable on edge. Gemini is used in auto-populate (Node.js env) via full cascade.
const CLEP_PROVIDER_NAMES = ["Groq", "Together.ai", "Pollinations-Free"];

/**
 * CLEP-optimized AI cascade: Gemini (best for educational content) → Groq → Together.ai → Pollinations-Free.
 * Falls back to the full cascade if all CLEP-tier providers fail.
 */
export async function callAIForCLEP(
  prompt: string,
  systemPrompt?: string,
): Promise<AICallResult> {
  const available = PROVIDERS.filter(
    (p) =>
      CLEP_PROVIDER_NAMES.includes(p.name) &&
      (p.envKey === "ALWAYS_AVAILABLE" || !!process.env[p.envKey])
  );

  for (const provider of available) {
    if (isProviderDisabled(provider.name)) {
      console.log(`[AI][CLEP] Skipping ${provider.name} — circuit breaker active`);
      continue;
    }
    try {
      const text = await provider.call(prompt, systemPrompt);
      if (text?.trim()) {
        console.log(`[AI][CLEP] Used provider: ${provider.name} (${provider.modelId})`);
        recordProviderSuccess(provider.name);
        return { response: text.trim(), modelUsed: provider.modelId };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI][CLEP] ${provider.name} failed: ${msg}`);
      recordProviderFailure(provider.name);
      if (msg.includes("401") || msg.includes("403") || msg.includes("402")
        || msg.includes("429") || msg.includes("invalid") || msg.includes("API key")) {
        continue;
      }
    }
  }

  // Final fallback: full cascade
  console.warn("[AI][CLEP] All CLEP providers failed — falling back to full cascade");
  const text = await callAIWithCascade(prompt, systemPrompt);
  return { response: text, modelUsed: "cascade/fallback" };
}

/**
 * Validate a generated question for AP/SAT/ACT style and correctness.
 * Uses Groq (fast, free) with a 10s timeout, falls back to Pollinations-Free.
 *
 * @param questionJson - JSON string of the generated question
 * @param difficulty - Optional difficulty level (EASY/MEDIUM/HARD) for calibration check
 * @param difficultyRubricEntry - Optional rubric text for the requested difficulty, used as 6th criterion
 */
export async function validateQuestion(
  questionJson: string,
  difficulty?: string,
  difficultyRubricEntry?: string,
  course?: string,
  generatorModel?: string,
): Promise<ValidationResult> {
  const difficultySection = difficulty && difficultyRubricEntry
    ? `\n6. Difficulty calibration — The question matches the ${difficulty} difficulty standard: "${difficultyRubricEntry}"`
    : "";

  const clepCriteria = course?.startsWith("CLEP_") ? `
6. SCENARIO-BASED: The question presents a scenario, case study, or concrete context (NOT bare "What is X?" recall)
7. DISTRACTOR DISTINCTNESS: All 4 options test different misconceptions (no two distractors representing the same error type)
8. EXPLANATION TEACHES: The explanation explains why the correct answer is right AND why each wrong answer is wrong` : "";

  const apCriteria = course?.startsWith("AP_") ? `
6. AUTHENTIC AP STEM PATTERN: The stem uses College Board style — "Which of the following best/most directly/most clearly...", scenario/passage-based, or data/stimulus-driven. NOT bare "What is X?" recall.
7. STIMULUS INTEGRITY: If the question REFERENCES a stimulus (passage, graph, pseudocode, table, diagram), the stimulus MUST be present in the "stimulus" field AND actually match what the question asks. Questions that reference non-existent stimuli FAIL.
8. NUMERICAL CONSISTENCY: For calculation questions, the numbers in the stem, stimulus, correctAnswer, and explanation MUST be consistent and mathematically correct. Cross-check all values.
9. DISTRACTOR PLAUSIBILITY: Each wrong answer represents a distinct, realistic student misconception (NOT obviously wrong, NOT duplicate errors across options).
10. EXPLANATION COMPLETENESS: The explanation is complete (not truncated mid-sentence), names the correct answer, and explains WHY each distractor is wrong.` : "";

  const allExtraCriteria = `${difficultySection}${clepCriteria}${apCriteria}`;
  const apCount = course?.startsWith("AP_");
  const criteriaCount = apCount
    ? (difficultyRubricEntry ? "ELEVEN" : "TEN")
    : course?.startsWith("CLEP_")
      ? (difficultyRubricEntry ? "NINE" : "EIGHT")
      : (difficultyRubricEntry ? "SIX" : "FIVE");

  const validatorPrompt = `You are a College Board AP exam quality reviewer. Evaluate this question on ${criteriaCount} criteria:
1. Factual accuracy — Is the content and explanation factually correct?
2. Single unambiguous answer — Only one choice is clearly correct; ALL others must be definitively wrong on a factual / doctrinal / procedural basis. FAIL this criterion if the stem uses "primary", "main", "most important", "best example", "chief purpose", or any superlative framing where two or more options are each defensibly correct interpretations. A question with three Senate powers (ratify treaties, impeachment trials, confirm appointees) asking for the "primary" one MUST FAIL this criterion — there is no single textual answer.
3. Distractor quality — Wrong answers are plausible but clearly incorrect on careful reflection; each represents a distinct common misconception.
4. Cognitive level — Tests understanding, analysis, or application (NOT pure rote memorization or trivia).
5. Exam alignment — Matches AP/SAT/ACT/CLEP exam style (appropriate stimulus if needed, appropriate stem verb, no trick questions).${allExtraCriteria}

Score each criterion PASS or FAIL.

Question JSON:
${questionJson}

Reply ONLY with valid JSON (no markdown, no extra text):
{"approved": true} if all criteria pass, or {"approved": false, "reason": "criterion: explanation"}`;

  // Cross-model validation: validator MUST be from a different model family than the generator.
  // Tries in order: Gemini, Groq, Anthropic, Pollinations — skips the one matching the generator.
  const generatorIsGroq = generatorModel?.includes("llama") || generatorModel?.includes("groq");
  const generatorIsGemini = generatorModel?.includes("gemini");
  const generatorIsAnthropic = generatorModel?.includes("claude") || generatorModel?.includes("anthropic");
  const generatorIsSonnet = !!(generatorModel && (generatorModel.includes("sonnet") || generatorModel.includes("claude-sonnet")));
  const geminiKey = process.env.GOOGLE_AI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const tryValidator = async (
    name: string,
    matchesGenerator: boolean,
    fn: () => Promise<string>,
  ): Promise<ValidationResult | null> => {
    if (matchesGenerator) return null; // cross-model constraint
    if (isProviderDisabled(name)) return null; // circuit breaker
    try {
      const text = await fn();
      if (!text?.trim()) return null;
      const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
      const match = clean.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(match ? match[0] : clean) as ValidationResult;
      if (typeof parsed.approved === "boolean") {
        console.log(`[validateQuestion] Used ${name} (cross-model: generator=${generatorModel ?? "unknown"})`);
        return parsed;
      }
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429") || msg.includes("400") || msg.includes("402") || msg.includes("403") || msg.includes("quota") || msg.includes("rate")) {
        recordProviderFailureHard(name, msg.slice(0, 60));
      }
      return null;
    }
  };

  // Priority 1: Anthropic validator (highest-quality, catches factual errors best).
  // When generator was Sonnet, validator downgrades to Haiku 4.5 — still a meaningful
  // cross-model check within the Anthropic family (avoids same-model-bias).
  if (anthropicKey) {
    const validatorModel = generatorIsSonnet ? "claude-haiku-4-5-20251001" : "claude-sonnet-4-6";
    const validatorName = generatorIsSonnet ? "Anthropic-Haiku-validator" : "Anthropic-Sonnet-validator";
    const validatorMaxTokens = generatorIsSonnet ? 600 : 400;
    const result = await tryValidator(validatorName, false, async () => {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: validatorModel,
          max_tokens: validatorMaxTokens,
          messages: [{ role: "user", content: validatorPrompt }],
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text().catch(() => res.statusText)}`);
      const data = await res.json() as { content?: Array<{ text?: string }> };
      return data.content?.[0]?.text ?? "";
    });
    if (result) return result;
  }

  // Priority 2: Gemini
  if (geminiKey) {
    const result = await tryValidator("Gemini-validator", !!generatorIsGemini, () =>
      callGemini(validatorPrompt),
    );
    if (result) return result;
  }

  // Priority 3: Groq
  if (groqKey) {
    const result = await tryValidator("Groq-validator", !!generatorIsGroq, async () => {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: validatorPrompt }],
          max_tokens: 200, temperature: 0.1,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`Groq ${res.status}`);
      const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content ?? "";
    });
    if (result) return result;
  }

  // Priority 4: Pollinations-Free (last resort — known to be lenient, but non-zero signal)
  try {
    const text = await callPollinationsFree(validatorPrompt);
    const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    const match = clean.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : clean) as ValidationResult;
    if (typeof parsed.approved === "boolean") {
      console.log(`[validateQuestion] Used Pollinations-Free (last-resort validator)`);
      return parsed;
    }
  } catch { /* fall through */ }

  // Fail-closed: reject the question if all validators failed.
  // Prior behavior was "fail-open" (approve by default) but that shipped low-quality Qs.
  console.warn("[validateQuestion] All validators failed — rejecting question (fail-closed)");
  return { approved: false, reason: "All validators unreachable" };
}
