/**
 * GET /api/flashcards
 *
 * Returns the next ~10 cards due for the signed-in user in a given course.
 *
 * Card selection priority (highest → lowest):
 *   1. Cards where the user has a FlashcardReview with `nextReviewAt <= now`
 *      (true SM-2-due cards — overdue first, then due-today)
 *   2. Cards the user has never reviewed (new cards from the global deck)
 *
 * Cap at 10 per request — UX rule from PrepLion: more than ~10 in a session
 * blows past the spaced-repetition sweet spot. Frontend asks for the next
 * batch when the user finishes the current set.
 *
 * Query params: ?course=AP_PHYSICS_1 (required)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApCourse } from "@prisma/client";
import { VALID_AP_COURSES } from "@/lib/courses";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 10;

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

    // 1) Due-and-overdue: user-specific reviews with nextReviewAt past.
    //    We want the LATEST review per flashcard so we know the current
    //    SM-2 state. Pull a healthy slab and dedupe in JS — Neon HTTP
    //    adapter doesn't support window functions cleanly across the
    //    Prisma WASM client.
    const recentReviews = await prisma.flashcardReview.findMany({
      where: {
        userId,
        nextReviewAt: { lte: now },
        flashcard: { course: course as ApCourse, isApproved: true },
      },
      orderBy: { reviewedAt: "desc" },
      take: BATCH_SIZE * 4,
      include: {
        flashcard: {
          select: {
            id: true, course: true, unit: true, topic: true, concept: true,
            cardType: true, difficulty: true, front: true, back: true,
            explanation: true, cardData: true, hints: true, examRelevance: true,
          },
        },
      },
    });

    const seenIds = new Set<string>();
    const dueCards: Array<{ card: typeof recentReviews[0]["flashcard"]; sm2: { easeFactor: number; interval: number; repetitions: number } }> = [];
    for (const r of recentReviews) {
      if (seenIds.has(r.flashcardId)) continue;
      seenIds.add(r.flashcardId);
      dueCards.push({
        card: r.flashcard,
        sm2: { easeFactor: r.easeFactor, interval: r.interval, repetitions: r.repetitions },
      });
      if (dueCards.length >= BATCH_SIZE) break;
    }

    // 2) Fill the rest with NEW cards (no review yet for this user).
    const remaining = BATCH_SIZE - dueCards.length;
    let newCards: typeof recentReviews[0]["flashcard"][] = [];
    if (remaining > 0) {
      // Find approved global flashcards in this course not yet reviewed.
      // Two-step query because Prisma+Neon HTTP doesn't love subselects.
      const reviewedIds = await prisma.flashcardReview.findMany({
        where: { userId, flashcard: { course: course as ApCourse } },
        select: { flashcardId: true },
        distinct: ["flashcardId"],
      });
      const excludedIds = reviewedIds.map((r) => r.flashcardId);
      newCards = await prisma.flashcard.findMany({
        where: {
          course: course as ApCourse,
          isApproved: true,
          // Only global deck (userId null) — per-user cards are out of scope here.
          userId: null,
          ...(excludedIds.length ? { id: { notIn: excludedIds } } : {}),
        },
        take: remaining,
        orderBy: { createdAt: "asc" },
        select: {
          id: true, course: true, unit: true, topic: true, concept: true,
          cardType: true, difficulty: true, front: true, back: true,
          explanation: true, cardData: true, hints: true, examRelevance: true,
        },
      });
    }

    return NextResponse.json({
      cards: [
        ...dueCards.map((c) => ({ ...c.card, sm2: c.sm2, isNew: false })),
        ...newCards.map((c) => ({ ...c, sm2: { easeFactor: 2.5, interval: 1, repetitions: 0 }, isNew: true })),
      ],
      counts: {
        dueReturned: dueCards.length,
        newReturned: newCards.length,
      },
    });
  } catch (e) {
    console.error("[/api/flashcards] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
