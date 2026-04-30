/**
 * GET /api/user/conversion-signal[?course=AP_WORLD_HISTORY]
 *
 * Single-shot endpoint that tells the client everything it needs to
 * decide which next-step CTA to render.
 *
 * Beta 9.4 (2026-04-30): per-course aware. Without `?course=`, we
 * return only the lifetime/global counters (back-compat). With a
 * course, we *also* return *InCourse counters so JourneyHeroCard +
 * PostSessionNextStep can choose the right state for the current
 * course — previously a user who switched to a fresh course saw
 * "You've unlocked your score" / "22+ questions" messaging from
 * their global stats, even with 0 Qs in this course.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApCourse } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Optional course param — when present, also return per-course stats.
  const url = new URL(req.url);
  const courseParam = url.searchParams.get("course");
  const validCourses = new Set(Object.values(ApCourse));
  const course =
    courseParam && validCourses.has(courseParam as ApCourse)
      ? (courseParam as ApCourse)
      : null;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    responseCount,
    diag,
    user,
    frqAttempt,
    sessionsToday,
    latestResponse,
    premiumSub,
    // Per-course (only fetched when course param is supplied)
    responseCountInCourse,
    diagInCourse,
    frqAttemptInCourse,
    answeredTodayInCourse,
  ] = await Promise.all([
    prisma.studentResponse.count({ where: { userId } }),
    prisma.diagnosticResult.findFirst({ where: { userId }, select: { id: true } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { freeTrialCourse: true, subscriptionTier: true, createdAt: true },
    }),
    prisma.frqAttempt.findFirst({ where: { userId }, select: { id: true, frq: { select: { course: true } } } }),
    prisma.studentResponse.count({ where: { userId, answeredAt: { gte: startOfDay } } }),
    prisma.studentResponse.findFirst({
      where: { userId },
      orderBy: { answeredAt: "desc" },
      select: { answeredAt: true },
    }),
    prisma.moduleSubscription.findFirst({
      where: { userId, status: { in: ["active", "ACTIVE", "trialing", "TRIALING"] } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    course
      ? prisma.studentResponse.count({ where: { userId, question: { course } } })
      : Promise.resolve(0),
    course
      ? prisma.diagnosticResult.findFirst({ where: { userId, course }, select: { id: true } })
      : Promise.resolve(null),
    course
      ? prisma.frqAttempt.findFirst({ where: { userId, frq: { course } }, select: { id: true } })
      : Promise.resolve(null),
    course
      ? prisma.studentResponse.count({
          where: { userId, answeredAt: { gte: startOfDay }, question: { course } },
        })
      : Promise.resolve(0),
  ]);

  const cohortAgeDays = user?.createdAt
    ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const daysSinceLastSession = latestResponse?.answeredAt
    ? Math.floor((Date.now() - new Date(latestResponse.answeredAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isPremium = !!premiumSub || (user?.subscriptionTier && user.subscriptionTier !== "FREE");
  const daysAsPremium = premiumSub
    ? Math.floor((Date.now() - new Date(premiumSub.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return NextResponse.json({
    // Global (back-compat)
    responseCount,
    hasDiagnostic: !!diag,
    hasFrqAttempt: !!frqAttempt,
    frqAttemptCourse: frqAttempt?.frq?.course ?? null,
    hasTrial: !!user?.freeTrialCourse,
    subscriptionTier: user?.subscriptionTier ?? "FREE",
    cohortAgeDays,
    answeredToday: sessionsToday,
    daysSinceLastSession,
    isPremium,
    daysAsPremium,
    // Per-course (only meaningful when ?course= was supplied; zeros otherwise)
    course: course ?? null,
    responseCountInCourse,
    hasDiagnosticInCourse: !!diagInCourse,
    hasFrqAttemptInCourse: !!frqAttemptInCourse,
    answeredTodayInCourse,
  });
}
