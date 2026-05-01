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
    const update: { track?: string; onboardingCompletedAt?: Date } = {};

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
