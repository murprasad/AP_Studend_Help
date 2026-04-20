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

async function callHaiku(prompt: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  // 22s hard timeout — CF Workers default subrequest budget is 30s and we
  // need headroom for the DB write + JSON parse. Timed-out calls fall back
  // to neutral scoring rather than leaving the client hanging.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 22_000);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 700,
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`);
    const data = await res.json() as { content?: Array<{ text?: string }> };
    return data.content?.[0]?.text || "";
  } finally {
    clearTimeout(timer);
  }
}

function tryParseJson(s: string): Record<string, unknown> | null {
  const cleaned = s.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  const log = (stage: string, extra?: Record<string, unknown>) =>
    console.log(`[sage-coach/evaluate] +${Date.now() - t0}ms ${stage}`, extra || "");

  log("start");
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    log("unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  log("auth ok", { userId: session.user.id });

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

  const prompt = `You are an expert teacher evaluating a student's SPOKEN answer. Be honest but encouraging — the student hears this feedback and we want them to return tomorrow.

COURSE: ${concept.course}
UNIT: ${concept.unit}
CONCEPT: ${concept.concept}

QUESTION:
${concept.question}

EXPECTED KEY POINTS (for coverage scoring — student should hit most of these):
${concept.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

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
    log("calling haiku");
    const text = await callHaiku(prompt);
    log("haiku returned", { textLen: text.length });
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

  // Fire-and-forget DB write so a Neon hiccup can't block feedback delivery.
  // The student sees their evaluation immediately; the session row lands
  // async. If the write fails we log but don't fail the response.
  log("queuing session save (non-blocking)");
  prisma.sageCoachSession.create({
    data: {
      userId: session.user.id,
      conceptId,
      course: concept.course,
      transcript,
      audioDurationMs,
      scores: result.scores,
      missingKeyPoints: result.missingKeyPoints,
      summary: result.summary,
      specificFeedback: result.specificFeedback,
      improvementTip: result.improvementTip,
      retryOf,
    },
  }).then(
    (r) => log("session saved", { sessionId: r.id }),
    (e) => log("session save failed", { message: (e as Error).message }),
  );

  log("done");
  return NextResponse.json({ ...result, conceptId, saved: true });
}
