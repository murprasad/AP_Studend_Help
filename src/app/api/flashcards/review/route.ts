/**
 * POST /api/flashcards/review
 *
 * Submit a rating for a flashcard. Body:
 *   { flashcardId: string, rating: 0|1|2|3, responseTimeMs: number }
 *
 * Looks up the user's previous SM-2 state for this card (most recent
 * FlashcardReview row), runs `calculateNextReview()`, writes a new
 * FlashcardReview row with the updated state. The next GET /api/flashcards
 * will pick it up at `nextReviewAt`.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateNextReview, DEFAULT_SM2 } from "@/lib/spaced-repetition";

export const dynamic = "force-dynamic";

interface Body {
  flashcardId?: string;
  rating?: number;
  responseTimeMs?: number;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    let body: Body = {};
    try {
      body = (await req.json()) as Body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { flashcardId, rating, responseTimeMs } = body;
    if (!flashcardId || typeof rating !== "number" || rating < 0 || rating > 3) {
      return NextResponse.json({ error: "flashcardId + rating(0-3) required" }, { status: 400 });
    }
    const rt = typeof responseTimeMs === "number" && Number.isFinite(responseTimeMs) ? Math.max(0, responseTimeMs) : 0;

    // Confirm the flashcard exists + is approved (cheap check; defensive).
    const card = await prisma.flashcard.findUnique({
      where: { id: flashcardId },
      select: { id: true, isApproved: true },
    });
    if (!card || !card.isApproved) {
      return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });
    }

    // Pull the most recent review (if any) so we have the prior SM-2 state.
    const last = await prisma.flashcardReview.findFirst({
      where: { userId, flashcardId },
      orderBy: { reviewedAt: "desc" },
      select: { easeFactor: true, interval: true, repetitions: true },
    });
    const current = last ?? DEFAULT_SM2;

    const next = calculateNextReview({ rating, responseTimeMs: rt, current });

    await prisma.flashcardReview.create({
      data: {
        userId,
        flashcardId,
        rating,
        responseTimeMs: rt,
        easeFactor: next.easeFactor,
        interval: next.interval,
        repetitions: next.repetitions,
        nextReviewAt: next.nextReviewAt,
      },
    });

    return NextResponse.json({
      ok: true,
      nextReviewAt: next.nextReviewAt.toISOString(),
      interval: next.interval,
      easeFactor: next.easeFactor,
      repetitions: next.repetitions,
    });
  } catch (e) {
    console.error("[/api/flashcards/review] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
