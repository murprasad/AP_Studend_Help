import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { moderateContentFast } from "@/lib/community-moderation"

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const replies = await prisma.discussionReply.findMany({
    where: { threadId: params.id, isRemoved: { not: true } },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { firstName: true, lastName: true } },
    },
  })

  return NextResponse.json({ replies })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { body } = await req.json()
    if (!body?.trim()) return NextResponse.json({ error: "Body required" }, { status: 400 })

    const mod = moderateContentFast("", body.trim())
    if (!mod.allowed) {
      return NextResponse.json(
        { error: "Reply blocked by moderation. Keep discussions AP/SAT/ACT focused and respectful.", reason: mod.reason },
        { status: 422 }
      )
    }

    // Split create + include into two queries to avoid Neon WASM adapter issues
    const created = await prisma.discussionReply.create({
      data: {
        threadId: params.id,
        userId: session.user.id,
        body: body.trim().slice(0, 2000),
      },
    })

    const reply = await prisma.discussionReply.findUnique({
      where: { id: created.id },
      include: { user: { select: { firstName: true, lastName: true } } },
    })

    return NextResponse.json({ reply })
  } catch (e) {
    console.error("POST /api/community/threads/[id]/replies error:", e)
    return NextResponse.json({ error: "Unable to post reply right now. Please try again." }, { status: 500 })
  }
}
