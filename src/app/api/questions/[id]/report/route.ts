import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { reason, details } = await req.json()
  if (!reason) return NextResponse.json({ error: "Reason required" }, { status: 400 })

  const report = await prisma.questionReport.upsert({
    where: { questionId_userId: { questionId: params.id, userId: session.user.id } },
    create: { questionId: params.id, userId: session.user.id, reason, details },
    update: { reason, details, status: "pending" }
  })

  await prisma.$executeRawUnsafe(
    `UPDATE "questions" SET "reportedCount" = "reportedCount" + 1 WHERE id = $1`,
    params.id
  )

  return NextResponse.json({ success: true, reportId: report.id })
}
