import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ApCourse } from "@prisma/client"
import { rateLimit } from "@/lib/rate-limit"
import { VALID_AP_COURSES } from "@/lib/courses"
import { moderateContentFast } from "@/lib/community-moderation"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const course = (searchParams.get("course") || "AP_WORLD_HISTORY") as ApCourse

  if (!VALID_AP_COURSES.includes(course)) {
    return NextResponse.json({ error: "Invalid course" }, { status: 400 })
  }

  const threads = await prisma.discussionThread.findMany({
    where: { course, isRemoved: { not: true } },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 50,
    include: {
      user: { select: { firstName: true, lastName: true } },
      _count: { select: { replies: true } },
    },
  })

  return NextResponse.json({ threads })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Beta 7.9 (2026-04-25): rate limit thread creation. Prior gap flagged
    // by A2 wave-2 scan: a single user could POST 50 threads in 60s, no
    // throttle. 5/min is generous for legitimate use (typical user posts
    // <1/day) but kills spam-flood vector.
    const { allowed } = rateLimit(session.user.id, "community:create-thread", 5)
    if (!allowed) {
      return NextResponse.json(
        { error: "You're posting threads too quickly. Wait a minute and try again." },
        { status: 429 }
      )
    }

    const { course, title, body } = await req.json()
    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: "Title and body required" }, { status: 400 })
    }

    const mod = moderateContentFast(title.trim(), body.trim())
    if (!mod.allowed) {
      return NextResponse.json(
        { error: "Post blocked by moderation. Keep discussions AP/SAT/ACT focused and respectful.", reason: mod.reason },
        { status: 422 }
      )
    }

    // Split create + include into two queries to avoid Neon WASM adapter issues
    const created = await prisma.discussionThread.create({
      data: {
        userId: session.user.id,
        course: (course || "AP_WORLD_HISTORY") as ApCourse,
        title: title.trim().slice(0, 200),
        body: body.trim().slice(0, 5000),
      },
    })

    const thread = await prisma.discussionThread.findUnique({
      where: { id: created.id },
      include: {
        user: { select: { firstName: true, lastName: true } },
        _count: { select: { replies: true } },
      },
    })

    return NextResponse.json({ thread })
  } catch (e) {
    console.error("POST /api/community/threads error:", e)
    return NextResponse.json({ error: "Unable to post thread right now. Please try again." }, { status: 500 })
  }
}
