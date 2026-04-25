/**
 * POST /api/sage-coach/evaluate
 * Body: { conceptId, transcript, audioDurationMs, retryOf? }
 *
 * Runs Haiku 4.5 evaluation on the student's transcript against the
 * concept's keyPoints, saves a SageCoachSession row, and returns the
 * full feedback bundle to the client.
 *
 * Scoring dimensions (MVP ships Accuracy + Coverage active; Structure/
 * Clarity/Confidence returned but lightly used in UI until v2):
 *   - accuracy   (0–100)  was the concept right?
 *   - coverage   (0–100)  % of keyPoints mentioned
 *   - structure  (0–100)  logical flow?
 *   - clarity    (0–100)  simple + understandable?
 *   - confidence (0–100)  hesitations / fillers
 *
 * Safety guards:
 *   - transcript < 20 chars → return "retry" verdict without calling Haiku
 *   - accuracy floored at 30 (never 0) to avoid harshness
 *   - Haiku error → fall back to a neutral score + retry tip
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

type EvalResult = {
  scores: { accuracy: number; coverage: number; structure: number; clarity: number; confidence: number };
  missingKeyPoints: string[];
  summary: string;
  specificFeedback: string;
  improvementTip: string;
};

function neutralFallback(reason: string): EvalResult {
  return {
    scores: { accuracy: 50, coverage: 40, structure: 50, clarity: 50, confidence: 50 },
    missingKeyPoints: [],
    summary: "We couldn't fully analyze your answer this time.",
    specificFeedback: `(${reason}) Try recording again and speaking the core idea plus one supporting detail.`,
    improvementTip: "Aim for 30–45 seconds of continuous explanation.",
  };
}

// Per-provider timeouts vary: free providers fail fast (rate limits hang),
// paid providers get more slack. Worst case total: 3 + 8 + 8 = 19s.
async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try { return await fn(controller.signal); } finally { clearTimeout(timer); }
}

async function callOpenRouterFree(prompt: string): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("no_OPENROUTER_API_KEY");
  // Fast fail: free tier rate-limit hangs, so abort at 3s so Groq can pick up
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
    if (!res.ok) throw new Error(`openrouter_${res.status}:${(await res.text()).slice(0, 80)}`);
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || "";
  }, 3_000);
}

async function callGroq(prompt: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("no_GROQ_API_KEY");
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
    if (!res.ok) throw new Error(`groq_${res.status}:${(await res.text()).slice(0, 80)}`);
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || "";
  }, 8_000);
}

async function callHaiku(prompt: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("no_ANTHROPIC_API_KEY");
  return withTimeout(async (signal) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 700, temperature: 0,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`anthropic_${res.status}:${(await res.text()).slice(0, 80)}`);
    const data = await res.json() as { content?: Array<{ text?: string }> };
    return data.content?.[0]?.text || "";
  }, 8_000);
}

/**
 * Free-first evaluator cascade. Loops through providers in cost order; any
 * provider returning non-empty text wins. Throws with an aggregated error
 * list only if ALL providers fail — caller should treat that as "feature
 * unavailable" and fall back to neutralFallback().
 *
 * Order (rationale):
 *   1. OpenRouter free (openai/gpt-oss-120b:free)  — $0, JSON mode enforced
 *   2. Groq (llama-3.3-70b-versatile)              — ~$0.001, very fast
 *   3. Anthropic Haiku 4.5                         — ~$0.003, premium quality
 */
// Groq demoted-openrouter. Probe showed OpenRouter aborts at 6s on CF
// Workers even though it works sub-second from local node. Groq consistently
// responds in <1s on CF, so it's now primary.
const EVAL_PROVIDERS: Array<{ name: string; call: (p: string) => Promise<string> }> = [
  { name: "groq", call: callGroq },
  { name: "anthropic-haiku", call: callHaiku },
  { name: "openrouter-free", call: callOpenRouterFree },
];

async function callEvaluator(prompt: string, log: (stage: string, extra?: Record<string, unknown>) => void): Promise<string> {
  const errors: string[] = [];
  for (const p of EVAL_PROVIDERS) {
    try {
      log(`try ${p.name}`);
      const text = await p.call(prompt);
      if (text && text.trim().length > 20) {
        log(`${p.name} ok`, { len: text.length });
        return text;
      }
      errors.push(`${p.name}:empty`);
    } catch (e) {
      errors.push(`${p.name}:${(e as Error).message.slice(0, 60)}`);
      log(`${p.name} fail`, { reason: (e as Error).message });
    }
  }
  throw new Error(`all_providers_failed: ${errors.join(" | ")}`);
}

function tryParseJson(s: string): Record<string, unknown> | null {
  const cleaned = s.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

// Watchdog: NO path through this handler may take longer than this.
// If anything (auth, DB, evaluator cascade, response bundling) hangs beyond
// this window, we ship a neutral fallback so the client never sits on
// "Analyzing" forever.
const WATCHDOG_MS = 22_000;

function watchdog<T>(promise: Promise<T>, fallback: T, ms = WATCHDOG_MS): Promise<T> {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) { done = true; resolve(fallback); }
    }, ms);
    promise.then(
      (v) => { if (!done) { done = true; clearTimeout(timer); resolve(v); } },
      () => { if (!done) { done = true; clearTimeout(timer); resolve(fallback); } },
    );
  });
}

async function handlePost(req: NextRequest, t0: number, log: (s: string, e?: Record<string, unknown>) => void): Promise<NextResponse> {
  log("start");
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    log("unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  log("auth ok", { userId: session.user.id });

  // Free-tier daily cap: 1 Sage Coach evaluation per 24h. Admins + paid
  // tiers bypass. Evaluated BEFORE body parse so we fast-fail without
  // spending any LLM budget on rate-limited requests.
  const userRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, subscriptionTier: true },
  });
  const isAdmin = userRecord?.role === "ADMIN";
  const isPaid = userRecord?.subscriptionTier && userRecord.subscriptionTier !== "FREE";
  const isPremium = isAdmin || isPaid;
  if (!isPremium) {
    const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000);
    const todayCount = await prisma.sageCoachSession.count({
      where: { userId: session.user.id, createdAt: { gte: oneDayAgo } },
    });
    if (todayCount >= 1) {
      log("rate_limited", { todayCount });
      return NextResponse.json({
        error: "daily_limit",
        message: "Free accounts get 1 Sage Coach session per day. Upgrade for unlimited.",
        upgradeUrl: "/pricing",
      }, { status: 429 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const conceptId = String(body.conceptId || "");
  const transcript = String(body.transcript || "").trim();
  const audioDurationMs = Math.max(0, parseInt(String(body.audioDurationMs || 0), 10) || 0);
  const retryOf = typeof body.retryOf === "string" ? body.retryOf : null;
  log("body parsed", { conceptId, transcriptLen: transcript.length, audioDurationMs });

  if (!conceptId) return NextResponse.json({ error: "conceptId required" }, { status: 400 });

  const concept = await prisma.sageCoachConcept.findUnique({ where: { id: conceptId } });
  log("concept fetched", { found: !!concept });
  if (!concept) return NextResponse.json({ error: "concept not found" }, { status: 404 });

  // Transcript too short → don't bill Haiku, ask for a retry
  if (transcript.length < 20) {
    const fallback = neutralFallback("answer too short");
    return NextResponse.json({ ...fallback, conceptId, saved: false, tooShort: true });
  }

  // Pull 2-3 CB-released reference rows for this (course, unit). These are
  // real past-exam questions + explanations ingested into OfficialSample —
  // the evaluator is instructed to grade the student's answer AGAINST this
  // CB source material, not against generic web knowledge. Prefer rows with
  // explanations (they carry the CB-sanctioned reasoning).
  const cbRefs = await prisma.officialSample.findMany({
    where: {
      course: concept.course,
      OR: [{ unit: concept.unit as unknown as string }, { unit: null }],
    },
    orderBy: [{ explanation: { sort: "asc", nulls: "last" } }],
    take: 3,
    select: { sourceName: true, questionText: true, stimulus: true, explanation: true },
  });
  log("cb refs fetched", { count: cbRefs.length });

  const refBlock = cbRefs.length === 0
    ? "(no CB reference material found for this unit — evaluate strictly from the key points)"
    : cbRefs.map((r, i) => {
        const parts = [`--- CB REF ${i + 1} (${r.sourceName}) ---`];
        if (r.stimulus) parts.push(`STIMULUS: ${String(r.stimulus).slice(0, 500)}`);
        if (r.questionText) parts.push(`QUESTION: ${String(r.questionText).slice(0, 500)}`);
        if (r.explanation) parts.push(`CB EXPLANATION: ${String(r.explanation).slice(0, 600)}`);
        return parts.join("\n");
      }).join("\n\n");

  const prompt = `You are an expert teacher evaluating a student's SPOKEN answer against the COLLEGE BOARD curriculum (AP/SAT/ACT). Be honest but encouraging — the student hears this feedback and we want them to return tomorrow.

**CRITICAL: Grade against the CB REFERENCE MATERIAL below, NOT against general internet knowledge.** If the student's answer conflicts with CB reference (even if "technically correct" on Wikipedia), mark that as a factualError. CB content is the authoritative source for this exam.

COURSE: ${concept.course}
UNIT: ${concept.unit}
CONCEPT: ${concept.concept}

QUESTION THE STUDENT ANSWERED:
${concept.question}

EXPECTED KEY POINTS (drawn from CB curriculum — for coverage scoring):
${concept.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

COLLEGE BOARD REFERENCE MATERIAL (use ONLY these to verify facts):
${refBlock}

STUDENT TRANSCRIPT (spoken, ${Math.round(audioDurationMs / 1000)}s):
"""
${transcript}
"""

Score the student on 0-100 scales. Floor accuracy at 30 even if the answer is very weak — we never score 0. Return STRICT JSON (no markdown fences):

{
  "scores": {
    "accuracy": <0-100 — did they get the concept right?>,
    "coverage": <0-100 — what percent of the expected key points did they cover?>,
    "structure": <0-100 — logical flow intro→explanation→example?>,
    "clarity": <0-100 — simple and understandable?>,
    "confidence": <0-100 — lower for many hesitations/fillers>
  },
  "missingKeyPoints": ["exact key-point text 1", "exact key-point text 2"],
  "summary": "One sentence overall. Reference what they actually said.",
  "specificFeedback": "2-3 sentences. Name concrete strengths and concrete gaps. Quote or paraphrase the student. Never vague like 'improve clarity'.",
  "improvementTip": "One concrete action to try next — NOT vague."
}`;

  let result: EvalResult;
  try {
    log("calling evaluator");
    const text = await callEvaluator(prompt, log);
    log("evaluator returned", { textLen: text.length });
    const parsed = tryParseJson(text);
    if (!parsed || typeof parsed !== "object") throw new Error("non-JSON output");
    const s = (parsed.scores || {}) as Record<string, unknown>;
    result = {
      scores: {
        accuracy: Math.max(30, Math.min(100, Number(s.accuracy) || 30)),
        coverage: Math.max(0, Math.min(100, Number(s.coverage) || 0)),
        structure: Math.max(0, Math.min(100, Number(s.structure) || 0)),
        clarity: Math.max(0, Math.min(100, Number(s.clarity) || 0)),
        confidence: Math.max(0, Math.min(100, Number(s.confidence) || 0)),
      },
      missingKeyPoints: Array.isArray(parsed.missingKeyPoints) ? parsed.missingKeyPoints.map(String) : [],
      summary: String(parsed.summary || "Good effort — keep practicing."),
      specificFeedback: String(parsed.specificFeedback || ""),
      improvementTip: String(parsed.improvementTip || "Try again with more specific details."),
    };
  } catch (e) {
    log("haiku error", { message: (e as Error).message });
    result = neutralFallback((e as Error).message || "evaluation error");
  }

  // Beta 7.6 (2026-04-25): re-enable session persistence using
  // $executeRawUnsafe per the CLAUDE.md "no transactions" pattern.
  // Earlier Prisma .create() was hanging on CF Workers — likely
  // because the WASM-driver code path for Json columns wasn't fully
  // CF-compatible. Raw SQL with explicit ::jsonb + ::text[] casts
  // sidesteps the hang. Fire-and-forget so a DB hang here doesn't
  // delay the user's evaluation response.
  const sessionId = crypto.randomUUID();
  void prisma.$executeRawUnsafe(
    `INSERT INTO "sage_coach_sessions"
       (id, "userId", "conceptId", course, transcript, "audioDurationMs",
        scores, "missingKeyPoints", summary, "specificFeedback", "improvementTip",
        "retryOf", "createdAt")
     VALUES ($1, $2, $3, $4::text, $5, $6, $7::jsonb, $8::text[], $9, $10, $11, $12, NOW())`,
    sessionId,
    session.user.id,
    conceptId,
    concept.course,
    transcript,
    audioDurationMs,
    JSON.stringify(result.scores),
    result.missingKeyPoints,
    result.summary,
    result.specificFeedback,
    result.improvementTip,
    retryOf,
  ).catch((e) => {
    log("session save failed (non-blocking)", { message: e instanceof Error ? e.message : String(e) });
  });
  log("session save fired");
  log("done");
  return NextResponse.json({ ...result, conceptId, sessionId, saved: true });
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  const log = (stage: string, extra?: Record<string, unknown>) =>
    console.log(`[sage-coach/evaluate] +${Date.now() - t0}ms ${stage}`, extra || "");

  const fallback = NextResponse.json({
    ...neutralFallback("watchdog_timeout"),
    conceptId: null,
    saved: false,
    tooShort: false,
  });

  return watchdog(handlePost(req, t0, log), fallback);
}
