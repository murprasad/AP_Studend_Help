/**
 * GET /api/sage-coach/health
 *
 * Returns {available: boolean, providers: [{name, ok}]} — the Sage Coach
 * page hits this on mount so we can show "feature currently unavailable"
 * instead of letting students record a 60-second answer that nothing can
 * evaluate. Fast: sends a tiny 1-token probe to each provider in parallel
 * with a 5-second timeout.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PROBE = { role: "user", content: 'Return JSON {"ok":true}' };

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms = 5_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try { return await fn(controller.signal); } finally { clearTimeout(timer); }
}

async function probeOpenRouterFree(): Promise<boolean> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return false;
  try {
    return await withTimeout(async (signal) => {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST", signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b:free",
          messages: [PROBE], max_tokens: 20,
          response_format: { type: "json_object" },
        }),
      });
      return res.ok;
    });
  } catch { return false; }
}

async function probeGroq(): Promise<boolean> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return false;
  try {
    return await withTimeout(async (signal) => {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [PROBE], max_tokens: 20,
        }),
      });
      return res.ok;
    });
  } catch { return false; }
}

async function probeAnthropic(): Promise<boolean> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return false;
  try {
    return await withTimeout(async (signal) => {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", signal,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 20, messages: [PROBE],
        }),
      });
      return res.ok;
    });
  } catch { return false; }
}

export async function GET() {
  const [openrouter, groq, anthropic] = await Promise.all([
    probeOpenRouterFree(), probeGroq(), probeAnthropic(),
  ]);
  const providers = [
    { name: "openrouter-free", ok: openrouter },
    { name: "groq", ok: groq },
    { name: "anthropic-haiku", ok: anthropic },
  ];
  return NextResponse.json({
    available: openrouter || groq || anthropic,
    providers,
  });
}
