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

  const { sessionId, answers, course = "AP_WORLD_HISTORY" } = await req.json()
  if (!sessionId || !answers) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  // Verify session belongs to user
  const diagSession = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId: session.user.id, sessionType: "DIAGNOSTIC" },
  })
  if (!diagSession) return NextResponse.json({ error: "Session not found" }, { status: 404 })

  // Get questions for this session
  const sessionQuestions = await prisma.sessionQuestion.findMany({
    where: { sessionId },
    include: { question: { select: { id: true, unit: true, correctAnswer: true } } },
    orderBy: { order: "asc" },
  })

  // Calculate unit scores
  const unitResults: Record<string, { correct: number; total: number }> = {}
  for (const sq of sessionQuestions) {
    const unit = sq.question.unit
    if (!unitResults[unit]) unitResults[unit] = { correct: 0, total: 0 }
    unitResults[unit].total++
    const userAnswer = answers[sq.questionId]
    if (userAnswer && userAnswer === sq.question.correctAnswer) {
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

  // Get AI recommendation
  const courseUnits = COURSE_UNITS[course as ApCourse]
  const unitSummary = Object.entries(unitScores)
    .map(([u, s]) => `${courseUnits[u as ApUnit] || u}: ${s}%`)
    .join(", ")

  let recommendation = ""
  try {
    recommendation = await callAIWithCascade(
      `Based on this student's AP diagnostic results, give a 2-3 sentence personalized study recommendation:\n${unitSummary}\n\nFocus on their weakest areas and what to prioritize.`,
      undefined,
      undefined
    )
  } catch {
    recommendation = `Focus on your weakest units: ${weakUnits.map(u => courseUnits[u as ApUnit] || u).join(", ")}. Practice MCQ questions in those units daily and review the explanations carefully.`
  }

  // Save diagnostic result
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

  // Complete the session
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

  return NextResponse.json({
    resultId: diagResult.id,
    unitScores,
    weakUnits,
    strongUnits,
    recommendation,
  })
}
