/**
 * GET /api/flashcards/due-count?course=X
 *
 * Returns the count of cards the signed-in user could review right now
 * in the given course. Used by the dashboard's FlashcardsDueCard block.
 *
 * Count = (cards with a review whose nextReviewAt ≤ now) + (approved
 * global cards the user has never reviewed). Capped at 50 to keep the
 * UI copy sane ("50+" display if hit).
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApCourse } from "@prisma/client";
import { VALID_AP_COURSES } from "@/lib/courses";

export const dynamic = "force-dynamic";

const COUNT_CAP = 50;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const course = req.nextUrl.searchParams.get("course");
    if (!course || !VALID_AP_COURSES.includes(course as ApCourse)) {
      return NextResponse.json({ error: "Invalid course" }, { status: 400 });
    }

    const now = new Date();

    // Due: latest review per card past its nextReviewAt. Dedupe on flashcardId.
    const dueReviews = await prisma.flashcardReview.findMany({
      where: {
        userId,
        nextReviewAt: { lte: now },
        flashcard: { course: course as ApCourse, isApproved: true },
      },
      select: { flashcardId: true },
      distinct: ["flashcardId"],
      take: COUNT_CAP + 1,
    });
    const dueCount = dueReviews.length;

    // Never-reviewed new cards in this course. Subtract any already-reviewed.
    const reviewedIds = await prisma.flashcardReview.findMany({
      where: { userId, flashcard: { course: course as ApCourse } },
      select: { flashcardId: true },
      distinct: ["flashcardId"],
    });
    const excluded = reviewedIds.map((r) => r.flashcardId);
    const newCount = await prisma.flashcard.count({
      where: {
        course: course as ApCourse,
        isApproved: true,
        userId: null,
        ...(excluded.length ? { id: { notIn: excluded } } : {}),
      },
    });

    const total = Math.min(dueCount + newCount, COUNT_CAP);

    return NextResponse.json({ count: total, due: dueCount, new: newCount });
  } catch (e) {
    console.error("[/api/flashcards/due-count] error:", e);
    return NextResponse.json({ count: 0, error: "server_error" });
  }
}
