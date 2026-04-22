import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClepEnabled, isDsstEnabled } from "@/lib/settings";

export const dynamic = "force-dynamic";

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
    const [user, clepEnabled, dsstEnabled, moduleSubs] = await Promise.all([
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
      isClepEnabled(),
      isDsstEnabled(),
      prisma.moduleSubscription.findMany({
        where: { userId: session.user.id },
        select: { module: true, status: true, stripeCurrentPeriodEnd: true },
      }),
    ]);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user, flags: { clepEnabled, dsstEnabled }, moduleSubs });
  } catch (error) {
    console.error("GET /api/user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
