import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ApCourse, ApUnit } from "@prisma/client"
import { COURSE_UNITS } from "@/lib/utils"
import { callAIWithCascade } from "@/lib/ai-providers"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // 2026-05-13 — the original contract required `answers` in the body, but
  // step-3-diagnostic.tsx and other callers have always passed only
  // { sessionId }. That mismatch made this endpoint return 400 "Missing
  // fields" on every call, triggering the 3-retry fallback in the client
  // and the "Couldn't save your full diagnostic" toast.
  //
  // Real-user impact: every fresh diagnostic since the Beta 9.5 journey
  // shipped surfaced predictedScore=1 + no weakest unit. Saranya class of
  // bounce.
  //
  // Fix: pull the answers from student_responses (already written per-Q
  // during the carousel via /api/practice/[sessionId]). The DB is the
  // authoritative source — no reason to demand them in the body. `course`
  // can still be provided in the body for backwards compatibility but
  // defaults to whatever the session was created against.
  const body = await req.json().catch(() => ({}))
  const sessionId: string | undefined = body?.sessionId
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })
  const course: string = body?.course ?? "AP_WORLD_HISTORY"

  // Verify session belongs to user
  const diagSession = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId: session.user.id, sessionType: "DIAGNOSTIC" },
  })
  if (!diagSession) return NextResponse.json({ error: "Session not found" }, { status: 404 })

  // Get questions for this session + per-Q responses from this user.
  const [sessionQuestions, responses] = await Promise.all([
    prisma.sessionQuestion.findMany({
      where: { sessionId },
      include: { question: { select: { id: true, unit: true, correctAnswer: true } } },
      orderBy: { order: "asc" },
    }),
    prisma.studentResponse.findMany({
      where: { sessionId, userId: session.user.id },
      select: { questionId: true, isCorrect: true },
    }),
  ])
  const responseByQ = new Map(responses.map((r) => [r.questionId, r.isCorrect]))

  // Calculate unit scores using DB-recorded isCorrect (server is authority).
  const unitResults: Record<string, { correct: number; total: number }> = {}
  for (const sq of sessionQuestions) {
    const unit = sq.question.unit
    if (!unitResults[unit]) unitResults[unit] = { correct: 0, total: 0 }
    unitResults[unit].total++
    if (responseByQ.get(sq.questionId) === true) {
      unitResults[unit].correct++
    }
  }

  const unitScores: Record<string, number> = {}
  for (const [unit, result] of Object.entries(unitResults)) {
    unitScores[unit] = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0
  }

  const sortedUnits = Object.entries(unitScores).sort((a, b) => a[1] - b[1])
  const weakUnits = sortedUnits.slice(0, 3).map(([unit]) => unit)
  const strongUnits = sortedUnits.slice(-3).map(([unit]) => unit).reverse()

  const courseUnits = COURSE_UNITS[course as ApCourse]

  // Complete the session FIRST — must not be gated on AI cascade latency.
  // (Pre-2026-05-12 the AI call ran ahead of this update; when the cascade
  // exceeded CF Workers' 30s wall-clock, the session row stayed IN_PROGRESS
  // forever and the user's journey state was orphaned. 95% stuck-rate on prod
  // since May 1. Real victims: ansonbruh@gmail.com, mbaled58@gmail.com, etc.)
  const totalCorrect = Object.values(unitResults).reduce((s, r) => s + r.correct, 0)
  const totalQuestions = Object.values(unitResults).reduce((s, r) => s + r.total, 0)
  await prisma.practiceSession.update({
    where: { id: sessionId },
    data: {
      status: "COMPLETED",
      correctAnswers: totalCorrect,
      completedAt: new Date(),
      score: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
    }
  })

  // Fallback recommendation built deterministically — used if AI cascade is
  // slow/down. Real CB-style sentences using the actual unit names.
  const fallbackRecommendation = `Focus on your weakest units: ${weakUnits.map(u => courseUnits[u as ApUnit] || u).join(", ")}. Practice MCQ questions in those units daily and review the explanations carefully.`

  // AI recommendation with hard 8s timeout — caps blast radius if cascade hangs.
  const unitSummary = Object.entries(unitScores)
    .map(([u, s]) => `${courseUnits[u as ApUnit] || u}: ${s}%`)
    .join(", ")
  const AI_TIMEOUT_MS = 8000
  let recommendation = fallbackRecommendation
  try {
    recommendation = await Promise.race([
      callAIWithCascade(
        `Based on this student's AP diagnostic results, give a 2-3 sentence personalized study recommendation:\n${unitSummary}\n\nFocus on their weakest areas and what to prioritize.`,
        undefined,
        undefined
      ),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error("ai-cascade-timeout")), AI_TIMEOUT_MS))
    ])
  } catch {
    recommendation = fallbackRecommendation
  }

  const diagResult = await prisma.diagnosticResult.create({
    data: {
      userId: session.user.id,
      course: course as ApCourse,
      sessionId,
      unitScores,
      weakUnits,
      strongUnits,
      recommendation,
    }
  })

  return NextResponse.json({
    resultId: diagResult.id,
    unitScores,
    weakUnits,
    strongUnits,
    recommendation,
  })
}
