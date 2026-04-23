/**
 * GET /api/user/limits
 *
 * Returns the effective tier limits + current usage for the authenticated
 * user. UI components read from this response; they MUST NOT hardcode the
 * same numbers that live in src/lib/tier-limits.ts — if they do, a future
 * limit change requires editing multiple files and we invite UI/API drift.
 *
 * This endpoint is tiny on purpose: no caching, no PII beyond the session
 * userId that NextAuth already holds. ~2 queries. Called once per dashboard
 * load by LockedValueCard (and later by limit-hit modals).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FREE_LIMITS, LOCK_COPY, projectedDaysToTarget, type SubTier } from "@/lib/tier-limits";
import { isPremiumForTrack, hasAnyPremium, type ModuleSub } from "@/lib/tiers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const moduleSubs: ModuleSub[] = (session.user as { moduleSubs?: ModuleSub[] }).moduleSubs ?? [];
    const hasPremium =
      hasAnyPremium(moduleSubs) ||
      isPremiumForTrack(session.user.subscriptionTier, session.user.track ?? "ap");
    const tier: SubTier = hasPremium ? "PREMIUM" : "FREE";

    if (tier === "PREMIUM") {
      return NextResponse.json({
        tier,
        unlimited: true,
        limits: null,
        usage: null,
        lockCopy: LOCK_COPY, // shipped anyway so UI can pre-bind; component will hide
      });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [practiceAnsweredToday, tutorChatsToday] = await Promise.all([
      prisma.studentResponse.count({
        where: { userId, answeredAt: { gte: startOfDay } },
      }),
      prisma.tutorConversation.count({
        where: { userId, createdAt: { gte: startOfDay } },
      }),
    ]);

    const practiceRemaining = Math.max(
      0,
      FREE_LIMITS.practiceQuestionsPerDay - practiceAnsweredToday,
    );
    const tutorRemaining = Math.max(
      0,
      FREE_LIMITS.tutorChatsPerDay - tutorChatsToday,
    );

    return NextResponse.json({
      tier,
      unlimited: false,
      limits: FREE_LIMITS,
      usage: {
        practice: {
          used: practiceAnsweredToday,
          limit: FREE_LIMITS.practiceQuestionsPerDay,
          remaining: practiceRemaining,
        },
        tutor: {
          used: tutorChatsToday,
          limit: FREE_LIMITS.tutorChatsPerDay,
          remaining: tutorRemaining,
        },
        mockExam: {
          previewQuestions: FREE_LIMITS.mockExamQuestions,
          fullExamLocked: true,
        },
      },
      lockCopy: LOCK_COPY,
      // Projected-days-to-target helpers — UI passes questionsToTarget
      // (from /api/coach-plan) into `projectedDaysToTarget()` directly.
      // We don't return a precomputed value here because we don't know
      // the user's current roughScore from this endpoint.
      projectDays: {
        qsPerFreeDay: FREE_LIMITS.practiceQuestionsPerDay,
        qsPerPremiumDay: 50,
      },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
