import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClepEnabled, isDsstEnabled, isNextStepEngineEnabled } from "@/lib/settings";

export const dynamic = "force-dynamic";

// Per-query cold-start defense (Beta 8.0 fix, 2026-04-26). /api/user is
// called on every dashboard load and cascades into broken /dashboard,
// /analytics, /study-plan if it 500s. Wrapping each query individually
// means at worst the user sees stale-but-valid data, not a 500.
async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (e) {
    console.warn("[/api/user] safe() caught:", e instanceof Error ? e.message : String(e));
    return fallback;
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const update: { track?: string; onboardingCompletedAt?: Date; dailyQuizOptIn?: boolean } = {};

    if (body.track !== undefined) {
      const validTracks = ["ap", "sat", "act", "clep", "dsst"];
      if (!validTracks.includes(body.track)) {
        return NextResponse.json({ error: "Invalid track" }, { status: 400 });
      }
      update.track = body.track;
    }

    // Allow the onboarding page to mark the user complete. Only accepts
    // `completeOnboarding: true` (not arbitrary dates) so callers can't
    // backdate or forward-date the field.
    if (body.completeOnboarding === true) {
      update.onboardingCompletedAt = new Date();
    }

    // 2026-05-28 Sprint B1 — Settings page support.
    if (typeof body.dailyQuizOptIn === "boolean") {
      update.dailyQuizOptIn = body.dailyQuizOptIn;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: update,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/user — GDPR / CCPA Right to Erasure.
 *
 * 2026-05-28 Sprint B1 — ported from PL. SN had no delete-account
 * endpoint at all; the student walkthrough flagged this as a P0
 * compliance exposure. Wipes user data in FK-dependency order.
 */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  try {
    await prisma.studentResponse.deleteMany({ where: { userId } });
    await prisma.sessionFeedback.deleteMany({ where: { session: { userId } } });
    await prisma.sessionQuestion.deleteMany({ where: { session: { userId } } });
    await prisma.practiceSession.deleteMany({ where: { userId } });
    await prisma.masteryScore.deleteMany({ where: { userId } });
    await prisma.masteryGoal.deleteMany({ where: { userId } });
    await prisma.flashcardReview.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.userAchievement.deleteMany({ where: { userId } });
    await prisma.tutorConversation.deleteMany({ where: { userId } });
    await prisma.tutorKnowledgeCheck.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.diagnosticResult.deleteMany({ where: { userId } });
    await prisma.studyPlan.deleteMany({ where: { userId } });
    await prisma.discussionReply.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.discussionThread.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.questionReport.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.moduleSubscription.deleteMany({ where: { userId } });
    await prisma.verificationToken.deleteMany({ where: { userId } });
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
    await prisma.account.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true, message: "Account and all data deleted." });
  } catch (error) {
    console.error("DELETE /api/user error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [user, clepEnabled, dsstEnabled, nextStepEngineEnabled, moduleSubs] = await Promise.all([
      safe(
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            gradeLevel: true,
            school: true,
            role: true,
            subscriptionTier: true,
            streakDays: true,
            longestStreak: true,
            streakFreezes: true,
            examDate: true,
            totalXp: true,
            level: true,
            lastActiveDate: true,
            track: true,
            onboardingCompletedAt: true,
            createdAt: true,
            freeTrialExpiresAt: true,
            freeTrialCourse: true,
            passGuaranteeEligible: true,
            passGuaranteeEligibleAt: true,
            passGuaranteeClaimedAt: true,
            passGuaranteeRefundCents: true,
          },
        }),
        null,
      ),
      safe(isClepEnabled(), false),
      safe(isDsstEnabled(), false),
      safe(isNextStepEngineEnabled(), false),
      safe(
        prisma.moduleSubscription.findMany({
          where: { userId: session.user.id },
          select: { module: true, status: true, stripeCurrentPeriodEnd: true },
        }),
        [] as Array<{ module: string; status: string; stripeCurrentPeriodEnd: Date | null }>,
      ),
    ]);

    if (!user) {
      // Stale-but-valid fallback: returns minimal session-derived user so the
      // dashboard renders instead of crashing. Real DB will recover next call.
      return NextResponse.json({
        user: {
          id: session.user.id,
          email: session.user.email ?? "",
          subscriptionTier: "FREE",
          track: "ap",
        },
        flags: { clepEnabled, dsstEnabled, nextStepEngineEnabled },
        moduleSubs,
        _degraded: true,
      });
    }

    return NextResponse.json({ user, flags: { clepEnabled, dsstEnabled, nextStepEngineEnabled }, moduleSubs });
  } catch (error) {
    console.error("GET /api/user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
