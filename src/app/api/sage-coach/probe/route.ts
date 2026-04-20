/**
 * TEMPORARY — Sage Coach hang diagnostics.
 *
 * GET /api/sage-coach/probe?step=N
 *
 *   step=1  touch only — returns immediately (baseline)
 *   step=2  Prisma findFirst on SageCoachConcept (DB reachability)
 *   step=3  step 2 + fetch OpenRouter free with short prompt
 *   step=4  step 2 + full evaluator cascade
 *   step=5  step 4 + fire-and-forget prisma create (no await)
 *
 * Each step logs timings. Returns {step, ms, ok, result}. Used to
 * bisect which part of /evaluate hangs in the CF Workers runtime.
 *
 * No auth. Safe because it only READS concept data + runs evaluator;
 * no user-identifying input taken. Delete after root cause found.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try { return await fn(c.signal); } finally { clearTimeout(t); }
}

async function callOpenRouter(prompt: string): Promise<{ ms: number; ok: boolean; status?: number; body?: string }> {
  const t0 = Date.now();
  const key = process.env.OPENROUTER_API_KEY || "";
  try {
    return await withTimeout(async (signal) => {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST", signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b:free",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200, temperature: 0,
          response_format: { type: "json_object" },
        }),
      });
      const body = await r.text();
      return { ms: Date.now() - t0, ok: r.ok, status: r.status, body: body.slice(0, 200) };
    }, 6_000);
  } catch (e) {
    return { ms: Date.now() - t0, ok: false, body: `ERR: ${(e as Error).message.slice(0, 120)}` };
  }
}

async function callGroq(prompt: string): Promise<{ ms: number; ok: boolean; status?: number; body?: string }> {
  const t0 = Date.now();
  const key = process.env.GROQ_API_KEY || "";
  try {
    return await withTimeout(async (signal) => {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200, temperature: 0,
          response_format: { type: "json_object" },
        }),
      });
      const body = await r.text();
      return { ms: Date.now() - t0, ok: r.ok, status: r.status, body: body.slice(0, 200) };
    }, 8_000);
  } catch (e) {
    return { ms: Date.now() - t0, ok: false, body: `ERR: ${(e as Error).message.slice(0, 120)}` };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const step = parseInt(searchParams.get("step") || "1", 10);
  const t0 = Date.now();
  const trail: Array<{ stage: string; ms: number; detail?: unknown }> = [];
  const mark = (stage: string, detail?: unknown) => trail.push({ stage, ms: Date.now() - t0, detail });

  mark("start");

  if (step < 2) {
    mark("done-touch");
    return NextResponse.json({ step, ms: Date.now() - t0, trail });
  }

  // Step 2: Prisma
  let concept;
  try {
    concept = await prisma.sageCoachConcept.findFirst({ where: { course: "AP_WORLD_HISTORY" } });
    mark("prisma-ok", { found: !!concept });
  } catch (e) {
    mark("prisma-fail", { message: (e as Error).message.slice(0, 120) });
    return NextResponse.json({ step, ms: Date.now() - t0, trail, error: "prisma_failed" });
  }
  if (!concept) return NextResponse.json({ step, ms: Date.now() - t0, trail, error: "no_concept" });

  if (step < 3) {
    mark("done-prisma");
    return NextResponse.json({ step, ms: Date.now() - t0, trail });
  }

  // Step 3: OpenRouter only
  if (step === 3) {
    const r = await callOpenRouter('Return JSON {"ok":true}');
    mark("openrouter-done", r);
    return NextResponse.json({ step, ms: Date.now() - t0, trail, openrouter: r });
  }

  // Step 4: full evaluator cascade (same shape as /evaluate)
  const prompt = `Return STRICT JSON {"scores":{"accuracy":N,"coverage":N,"structure":N,"clarity":N,"confidence":N},"missingKeyPoints":[],"summary":"","specificFeedback":"","improvementTip":""}. Question: ${concept.question}. Student: I have no idea about this topic.`;
  const orRes = await callOpenRouter(prompt);
  mark("openrouter", orRes);
  if (orRes.ok) {
    return NextResponse.json({ step, ms: Date.now() - t0, trail, from: "openrouter" });
  }
  const groqRes = await callGroq(prompt);
  mark("groq", groqRes);
  if (groqRes.ok) {
    return NextResponse.json({ step, ms: Date.now() - t0, trail, from: "groq" });
  }

  if (step < 5) {
    return NextResponse.json({ step, ms: Date.now() - t0, trail, error: "all_failed" });
  }

  // Step 5: fire-and-forget DB write
  mark("creating-session (no-await)");
  prisma.sageCoachSession.create({
    data: {
      userId: "probe-test-user",
      conceptId: concept.id,
      course: concept.course,
      transcript: "probe",
      audioDurationMs: 0,
      scores: { accuracy: 30, coverage: 0, structure: 0, clarity: 0, confidence: 0 },
      missingKeyPoints: [],
      summary: "probe",
      specificFeedback: "probe",
      improvementTip: "probe",
    },
  }).then(
    (r) => console.log("[probe] session saved", r.id),
    (e) => console.log("[probe] session save failed", (e as Error).message),
  );
  mark("returning");

  return NextResponse.json({ step, ms: Date.now() - t0, trail });
}
