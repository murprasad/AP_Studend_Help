import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { CohereClient } from "cohere-ai";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const TEST_PROMPT = "Reply with only the word: OK";

async function testGemini(): Promise<string> {
  if (!process.env.GOOGLE_AI_API_KEY) return "NO_KEY";
  const client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(TEST_PROMPT);
  return result.response.text() ? "OK" : "EMPTY_RESPONSE";
}

async function testGroq(): Promise<string> {
  if (!process.env.GROQ_API_KEY) return "NO_KEY";
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const res = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: TEST_PROMPT }],
    max_tokens: 10,
  });
  return res.choices[0]?.message?.content ? "OK" : "EMPTY_RESPONSE";
}

async function testTogether(): Promise<string> {
  if (!process.env.TOGETHER_AI_API_KEY) return "NO_KEY";
  const res = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.TOGETHER_AI_API_KEY}` },
    body: JSON.stringify({ model: "meta-llama/Llama-3-8b-chat-hf", messages: [{ role: "user", content: TEST_PROMPT }], max_tokens: 10 }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return `HTTP_${res.status}`;
  const d = await res.json();
  return d.choices?.[0]?.message?.content ? "OK" : "EMPTY_RESPONSE";
}

async function testOpenRouter(): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) return "NO_KEY";
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "HTTP-Referer": "https://prepnova.netlify.app", "X-Title": "StudentNest" },
    body: JSON.stringify({ model: "google/gemini-flash-1.5", messages: [{ role: "user", content: TEST_PROMPT }], max_tokens: 10 }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return `HTTP_${res.status}`;
  const d = await res.json();
  return d.choices?.[0]?.message?.content ? "OK" : "EMPTY_RESPONSE";
}

async function testHuggingFace(): Promise<string> {
  if (!process.env.HUGGINGFACE_API_KEY) return "NO_KEY";
  const res = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
    body: JSON.stringify({ inputs: TEST_PROMPT, parameters: { max_new_tokens: 10 } }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return `HTTP_${res.status}`;
  return "OK";
}

async function testCohere(): Promise<string> {
  if (!process.env.COHERE_API_KEY) return "NO_KEY";
  const client = new CohereClient({ token: process.env.COHERE_API_KEY });
  const res = await client.chat({ model: "command-r", message: TEST_PROMPT, maxTokens: 10 });
  return res.text ? "OK" : "EMPTY_RESPONSE";
}

async function testAnthropic(): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return "NO_KEY";
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 10,
    messages: [{ role: "user", content: TEST_PROMPT }],
  });
  return res.content[0]?.type === "text" ? "OK" : "EMPTY_RESPONSE";
}

export async function GET() {
  const tests = [
    { name: "Gemini (Google AI)",   key: "GOOGLE_AI_API_KEY",    fn: testGemini },
    { name: "Groq",                 key: "GROQ_API_KEY",         fn: testGroq },
    { name: "Together.ai",          key: "TOGETHER_AI_API_KEY",  fn: testTogether },
    { name: "OpenRouter",           key: "OPENROUTER_API_KEY",   fn: testOpenRouter },
    { name: "HuggingFace",          key: "HUGGINGFACE_API_KEY",  fn: testHuggingFace },
    { name: "Cohere",               key: "COHERE_API_KEY",       fn: testCohere },
    { name: "Anthropic (Claude)",   key: "ANTHROPIC_API_KEY",    fn: testAnthropic },
  ];

  const results: Record<string, string> = {};
  let activeProvider: string | null = null;

  for (const t of tests) {
    if (!process.env[t.key]) {
      results[t.name] = "not_configured";
      continue;
    }
    try {
      const r = await t.fn();
      results[t.name] = r;
      if (r === "OK" && !activeProvider) activeProvider = t.name;
    } catch (err) {
      results[t.name] = err instanceof Error ? err.message.slice(0, 100) : "error";
    }
  }

  return NextResponse.json({
    status: activeProvider ? "ok" : "error",
    activeProvider,
    providers: results,
    message: activeProvider
      ? `AI is working via ${activeProvider}`
      : "No working AI provider found. See providers for details.",
  });
}
