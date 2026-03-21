import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ApCourse, ApUnit } from "@prisma/client"
import { COURSE_REGISTRY, VALID_AP_COURSES, getCourseTrack } from "@/lib/courses"
import { COURSE_UNITS } from "@/lib/utils"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { course = "AP_WORLD_HISTORY" } = await req.json()
  if (!VALID_AP_COURSES.includes(course as ApCourse)) {
    return NextResponse.json({ error: "Invalid course" }, { status: 400 })
  }

  const userTrack = session.user.track ?? "ap"
  if (getCourseTrack(course as ApCourse) !== userTrack) {
    return NextResponse.json(
      { error: "This course is not available on your current track." },
      { status: 403 }
    )
  }

  const courseUnitKeys = Object.keys(COURSE_UNITS[course as ApCourse]) as ApUnit[]
  // Select one question per unit (up to 15 questions total for diagnostic)
  const maxUnits = Math.min(courseUnitKeys.length, 15)
  const selectedUnits = courseUnitKeys.slice(0, maxUnits)

  const questionsByUnit: { id: string; unit: ApUnit }[] = []
  for (const unit of selectedUnits) {
    const q = await prisma.question.findFirst({
      where: { course: course as ApCourse, unit, isApproved: true, questionType: "MCQ" },
      select: { id: true, unit: true },
    })
    if (q) questionsByUnit.push(q)
  }

  if (questionsByUnit.length === 0) {
    return NextResponse.json({ error: "No questions available for diagnostic" }, { status: 400 })
  }

  // Create a diagnostic practice session
  const diagSession = await prisma.practiceSession.create({
    data: {
      userId: session.user.id,
      course: course as ApCourse,
      sessionType: "DIAGNOSTIC",
      status: "IN_PROGRESS",
      totalQuestions: questionsByUnit.length,
    }
  })

  // Insert session questions using raw SQL (no transactions)
  if (questionsByUnit.length > 0) {
    const placeholders = questionsByUnit.map((_, i) => {
      const b = i * 4
      return `($${b+1}, $${b+2}, $${b+3}, $${b+4})`
    }).join(", ")
    await prisma.$executeRawUnsafe(
      `INSERT INTO session_questions (id, "sessionId", "questionId", "order") VALUES ${placeholders}`,
      ...questionsByUnit.flatMap((q, i) => [crypto.randomUUID(), diagSession.id, q.id, i])
    )
  }

  const questions = await prisma.question.findMany({
    where: { id: { in: questionsByUnit.map(q => q.id) } },
    select: {
      id: true, unit: true, topic: true, difficulty: true, questionType: true,
      questionText: true, stimulus: true, options: true, course: true,
    }
  })

  return NextResponse.json({
    sessionId: diagSession.id,
    questions,
    totalQuestions: questions.length,
  })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const course = (searchParams.get("course") || "AP_WORLD_HISTORY") as ApCourse

  const latest = await prisma.diagnosticResult.findFirst({
    where: { userId: session.user.id, course },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ result: latest })
}
