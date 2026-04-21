import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * Auto-quarantine threshold. When a question accumulates this many unique-user
 * reports, we flip `isApproved=false` immediately so it stops serving to the
 * next student. Prevents one broken question from generating multiple Reddit
 * complaints (the 2026-04-19 AP CSP incident motivation).
 *
 * Chosen at 3 — one off report could be user-subjective, but three distinct
 * users flagging the same question is a strong quality signal that warrants
 * pulling the question pending admin review.
 */
const AUTO_QUARANTINE_THRESHOLD = 3;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { reason, details } = await req.json()
  if (!reason) return NextResponse.json({ error: "Reason required" }, { status: 400 })

  // Check if a report already exists so we only increment reportedCount on
  // genuinely new reports (not on a same-user re-report of the same question).
  const existing = await prisma.questionReport.findUnique({
    where: { questionId_userId: { questionId: params.id, userId: session.user.id } },
    select: { id: true },
  })

  const report = await prisma.questionReport.upsert({
    where: { questionId_userId: { questionId: params.id, userId: session.user.id } },
    create: { questionId: params.id, userId: session.user.id, reason, details },
    update: { reason, details, status: "pending" }
  })

  let autoQuarantined = false;
  if (!existing) {
    await prisma.$executeRawUnsafe(
      `UPDATE "questions" SET "reportedCount" = "reportedCount" + 1 WHERE id = $1`,
      params.id
    )

    // Auto-quarantine check: if this new report pushes us to/past the
    // threshold, pull the question from circulation immediately.
    const q = await prisma.question.findUnique({
      where: { id: params.id },
      select: { reportedCount: true, isApproved: true },
    });
    if (q && q.isApproved && q.reportedCount >= AUTO_QUARANTINE_THRESHOLD) {
      await prisma.question.update({
        where: { id: params.id },
        data: { isApproved: false },
      });
      console.log(`[auto-quarantine] questionId=${params.id} unapproved after ${q.reportedCount} user reports`);
      autoQuarantined = true;
    }
  }

  return NextResponse.json({ success: true, reportId: report.id, autoQuarantined })
}
