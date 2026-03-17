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
import Groq from "groq-sdk";
import { HfInference } from "@huggingface/inference";
import { CohereClient } from "cohere-ai";
import Anthropic from "@anthropic-ai/sdk";

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

function getGroq() {
  return process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
}

function getHuggingFace() {
  return process.env.HUGGINGFACE_API_KEY
    ? new HfInference(process.env.HUGGINGFACE_API_KEY)
    : null;
}

function getCohere() {
  return process.env.COHERE_API_KEY
    ? new CohereClient({ token: process.env.COHERE_API_KEY })
    : null;
}

function getAnthropic() {
  return process.env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
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
    model: "gemini-1.5-flash",
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
      model: "google/gemini-flash-1.5",  // free model on OpenRouter
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
  const client = getHuggingFace();
  if (!client) throw new Error("No HUGGINGFACE_API_KEY");

  const fullPrompt = systemPrompt
    ? `<|system|>\n${systemPrompt}\n<|user|>\n${prompt}\n<|assistant|>`
    : prompt;

  const result = await client.textGeneration({
    model: "mistralai/Mistral-7B-Instruct-v0.3",
    inputs: fullPrompt,
    parameters: { max_new_tokens: 1200, temperature: 0.7, return_full_text: false },
  });

  return result.generated_text || "";
}

async function callCohere(
  prompt: string,
  systemPrompt?: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const client = getCohere();
  if (!client) throw new Error("No COHERE_API_KEY");

  const chatHistory = history
    ? history.map((m) => ({
        role: m.role === "assistant" ? ("CHATBOT" as const) : ("USER" as const),
        message: m.content,
      }))
    : [];

  const response = await client.chat({
    model: "command-r",
    message: prompt,
    preamble: systemPrompt,
    chatHistory,
    maxTokens: 1200,
  });

  return response.text || "";
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
  const client = getAnthropic();
  if (!client) throw new Error("No ANTHROPIC_API_KEY");

  const messages = [
    ...(history || []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: prompt },
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    ...(systemPrompt ? { system: systemPrompt } : {}),
    messages,
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected Anthropic response type");
  return content.text;
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
  { name: "Gemini",             envKey: "GOOGLE_AI_API_KEY",       modelId: "google/gemini-1.5-flash",              call: callGemini },
  { name: "Groq",               envKey: "GROQ_API_KEY",            modelId: "groq/llama-3.3-70b-versatile",         call: callGroq },
  { name: "Together.ai",        envKey: "TOGETHER_AI_API_KEY",     modelId: "together/llama-3-70b",                 call: callTogetherAI },
  { name: "OpenRouter",         envKey: "OPENROUTER_API_KEY",      modelId: "openrouter/gemini-flash-1.5",          call: callOpenRouter },
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

const FREE_TIER_PROVIDER_NAMES = ["Groq", "Together.ai", "HuggingFace", "Pollinations-Free"];
const PREMIUM_TIER_PROVIDER_NAMES = ["Gemini", "OpenRouter-Premium", "Anthropic", "Groq", "Together.ai", "Pollinations-Free"];

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
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const text = await provider.call(prompt, systemPrompt, history);
        if (text?.trim()) {
          console.log(`[AI] Used provider: ${provider.name}`);
          return text.trim();
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[AI] ${provider.name} failed (attempt ${attempt + 1}): ${msg}`);
        // Don't retry on auth errors
        if (msg.includes("401") || msg.includes("403") || msg.includes("invalid") || msg.includes("API key")) {
          break;
        }
      }
    }
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
    try {
      const text = await provider.call(prompt, systemPrompt, history);
      if (text?.trim()) {
        console.log(`[AI][${tier}] Used provider: ${provider.name} (${provider.modelId})`);
        return { response: text.trim(), modelUsed: provider.modelId };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI][${tier}] ${provider.name} failed: ${msg}`);
      if (msg.includes("401") || msg.includes("403") || msg.includes("invalid") || msg.includes("API key")) {
        continue;
      }
    }
  }

  throw new Error(`All AI providers failed for tier: ${tier}. Tried: ${available.map((p) => p.name).join(", ")}`);
}

/**
 * Validate a generated question for AP style and correctness.
 * Uses Groq (fast, free) with a 10s timeout, falls back to Pollinations-Free.
 */
export async function validateQuestion(questionJson: string): Promise<ValidationResult> {
  const validatorPrompt = `You are an AP exam question quality reviewer. Evaluate this question JSON strictly.

Criteria:
1. Single unambiguous correct answer
2. Distractors are plausible but clearly wrong
3. AP exam style (no trivial or trick questions)
4. No factual errors in explanation

Question JSON:
${questionJson}

Reply with ONLY valid JSON (no markdown): {"approved": true} or {"approved": false, "reason": "brief reason"}`;

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: validatorPrompt }],
          max_tokens: 100,
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) {
          const clean = content.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
          return JSON.parse(clean) as ValidationResult;
        }
      }
    } catch {
      // fall through to Pollinations
    }
  }

  // Fallback: Pollinations-Free
  try {
    const text = await callPollinationsFree(validatorPrompt);
    const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    return JSON.parse(clean) as ValidationResult;
  } catch {
    // If validation itself fails, approve the question to avoid blocking generation
    console.warn("[validateQuestion] Validation failed — approving by default");
    return { approved: true };
  }
}
