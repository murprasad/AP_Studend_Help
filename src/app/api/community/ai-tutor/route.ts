/**
 * AI Peer Tutor — Premium-only endpoint
 * Generates an educational AI reply to a community thread.
 * The reply is posted as a DiscussionReply with isAiTutor=true.
 */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { callAIWithCascade } from "@/lib/ai-providers"

export const dynamic = "force-dynamic"

const AI_TUTOR_SYSTEM = `You are an expert AP/SAT/ACT tutor answering a student's question in the StudentNest community.

Guidelines:
- Give a clear, accurate, exam-focused answer (3-6 sentences max)
- Reference the specific AP/SAT/ACT topic or skill being asked about
- If there's a common misconception or exam trap, mention it briefly
- End with ONE short study tip or encouragement
- Do NOT use markdown headers or bullet points — write in plain paragraphs
- Never mention you are an AI in the body (it's labeled separately in the UI)`

export async function POST(req: NextRequest) {
  try {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { threadId } = await req.json()
  if (!threadId) {
    return NextResponse.json({ error: "threadId required" }, { status: 400 })
  }

  // Load thread for context
  const thread = await prisma.discussionThread.findUnique({
    where: { id: threadId },
    select: { title: true, body: true, course: true, isRemoved: true },
  })
  if (!thread || thread.isRemoved) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 })
  }

  // Check: only one AI tutor reply per thread
  const existing = await prisma.discussionReply.findFirst({
    where: { threadId, isAiTutor: true },
    select: { id: true, body: true, createdAt: true, user: { select: { firstName: true, lastName: true } } },
  })
  if (existing) {
    return NextResponse.json({ reply: existing, alreadyExists: true })
  }

  const userPrompt = `Course: ${thread.course}
Thread title: ${thread.title}
Question: ${thread.body.slice(0, 600)}

Please give a helpful, concise tutoring response for this student's question.`

  let aiBody: string | null = null
  try {
    aiBody = await callAIWithCascade(userPrompt, AI_TUTOR_SYSTEM)
  } catch (e) {
    console.error("[AI Tutor] All providers failed:", e)
    return NextResponse.json(
      { error: "AI tutor unavailable. Try again in a moment.", debug: { error: String(e) } },
      { status: 503 }
    )
  }

  // Split create + include into two queries to avoid Neon WASM adapter issues
  const created = await prisma.discussionReply.create({
    data: {
      threadId,
      userId: session.user.id,
      body: aiBody,
      isAiTutor: true,
    },
  })

  const reply = await prisma.discussionReply.findUnique({
    where: { id: created.id },
    include: { user: { select: { firstName: true, lastName: true } } },
  })

  return NextResponse.json({ reply })
  } catch (e) {
    console.error("POST /api/community/ai-tutor error:", e)
    return NextResponse.json({ error: `Server error: ${String(e)}` }, { status: 500 })
  }
}
