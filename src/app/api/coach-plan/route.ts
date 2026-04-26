/**
 * GET /api/coach-plan — Dashboard "Coach Mode" prescription.
 *
 * One server call returns everything the CoachCard renders: rough score
 * (even pre-diagnostic), confidence, target, questions-to-target, the
 * single weakest unit, a single "next action" CTA, and the accuracy
 * delta vs the prior two-week window.
 *
 * Reads from the same `loadReadinessSnapshot` the ReadinessCard uses so
 * score numbers can't drift between the hero card and the coach card.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApCourse } from "@prisma/client";
import { VALID_AP_COURSES } from "@/lib/courses";
import { loadReadinessSnapshot } from "@/lib/score-engine-inputs";
import { buildCoachPlan } from "@/lib/coach-plan";
import { COURSE_UNITS } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const course = (searchParams.get("course") as ApCourse) || "AP_WORLD_HISTORY";
    if (!VALID_AP_COURSES.includes(course)) {
      return NextResponse.json({ error: "Invalid course" }, { status: 400 });
    }

    // Wrap each parallel query in a safe-fallback so one Neon HTTP blip
    // doesn't 500 the whole route. Deploy13 surfaced 4 simultaneous 500s
    // on /api/coach-plan from a single /dashboard load — was breaking the
    // primary-action-strip even though loadReadinessSnapshot has its own
    // safeRun internally.
    type SafeUser = { examDate: Date | null } | null;
    type SafeSessions = Array<{ totalQuestions: number; correctAnswers: number | null }>;
    type SafeMasteryRows = Array<{
      unit: string;
      masteryScore: number | null;
      accuracy: number | null;
      totalAttempts: number;
    }>;
    const safe = async <T,>(p: Promise<T>, fallback: T): Promise<T> => {
      try { return await p; } catch { return fallback; }
    };
    const [snapshot, user, priorSessions, masteryRows] = await Promise.all([
      loadReadinessSnapshot(userId, course, prisma),
      safe<SafeUser>(prisma.user.findUnique({ where: { id: userId }, select: { examDate: true } }), null),
      safe<SafeSessions>(
        prisma.practiceSession.findMany({
          where: {
            userId,
            course,
            completedAt: {
              gte: new Date(Date.now() - 2 * TWO_WEEKS_MS),
              lt: new Date(Date.now() - TWO_WEEKS_MS),
            },
            status: "COMPLETED",
          },
          select: { totalQuestions: true, correctAnswers: true },
        }),
        [],
      ),
      safe<SafeMasteryRows>(
        prisma.masteryScore.findMany({
          where: { userId, course },
          select: { unit: true, masteryScore: true, accuracy: true, totalAttempts: true },
        }),
        [],
      ),
    ]);

    const priorAnswered = priorSessions.reduce((s, r) => s + (r.totalQuestions ?? 0), 0);
    const priorCorrect = priorSessions.reduce((s, r) => s + (r.correctAnswers ?? 0), 0);
    const priorAccuracy = priorAnswered > 0 ? (priorCorrect / priorAnswered) * 100 : null;

    const unitMap = COURSE_UNITS[course] as Record<string, string> | undefined;
    const mastery = masteryRows.map((m) => ({
      unit: m.unit,
      unitName: unitMap?.[m.unit] ?? m.unit,
      masteryScore: m.masteryScore ?? 0,
      accuracy: m.accuracy ?? 0,
      totalAttempts: m.totalAttempts ?? 0,
    }));
    const masteryAvg =
      mastery.length > 0
        ? mastery.reduce((s, r) => s + (r.masteryScore ?? 0), 0) / mastery.length
        : 0;

    const plan = buildCoachPlan({
      family: snapshot.family as "AP" | "SAT" | "ACT",
      scaledScore: snapshot.scaledScore,
      scaleMax: snapshot.scaleMax,
      showScore: snapshot.showScore,
      hasDiagnostic: snapshot.hasDiagnostic,
      totalAnswered: snapshot.totalAnswered,
      recentAccuracy: snapshot.recentAccuracy,
      priorAccuracy,
      examDate: user?.examDate ?? null,
      mastery,
      masteryAvg,
    });

    // ── PrepLion-compatible additions (2026-04-20 dashboard port) ─────────
    // Map AP's 1-5 / SAT's 1600 / ACT's 36 scaled score onto a 0-100 %
    // "pass equivalent" the cleaner PrepLion dashboard components consume.
    // Keeps all existing consumers working (they read roughScore) while
    // letting the new PrimaryActionStrip/OutcomeProgressStrip/etc. use
    // passPercent + tierLabel directly.
    const passPercent = Math.max(0, Math.min(100,
      ((plan.roughScore - 1) / Math.max(1, snapshot.scaleMax - 1)) * 100,
    ));
    const tierLabel: "high_risk" | "below_passing" | "near_passing" | "on_track" | "ready" =
      passPercent < 30 ? "high_risk" :
      passPercent < 60 ? "below_passing" :
      passPercent < 80 ? "near_passing" :
      "on_track";

    // In-progress session lookup so the hero can show "Resume" instead of
    // "Start" when the student abandoned a session earlier.
    const ipRow = await prisma.practiceSession.findFirst({
      where: { userId: session.user.id, course: course as ApCourse, status: "IN_PROGRESS" },
      orderBy: { startedAt: "desc" },
      select: { id: true, sessionType: true, totalQuestions: true, startedAt: true },
    });
    let inProgressSession = null as null | {
      id: string; startedAt: string; answered: number; total: number; sessionType: string;
    };
    if (ipRow) {
      const answered = await prisma.studentResponse.count({
        where: { sessionId: ipRow.id, userId: session.user.id },
      });
      inProgressSession = {
        id: ipRow.id,
        sessionType: String(ipRow.sessionType),
        startedAt: ipRow.startedAt.toISOString(),
        total: ipRow.totalQuestions ?? 0,
        answered,
      };
    }

    return NextResponse.json(
      {
        ...plan,
        family: snapshot.family,
        scaleMax: snapshot.scaleMax,
        passPercent,
        tierLabel,
        inProgressSession,
        // Anti-demoralization flags — PrepLion REQ-025 port. Consumers can
        // hide the raw percent when showScore=false (zero-signal users)
        // and soften copy when hasDiagnostic=false.
        showScore: snapshot.showScore,
        hasDiagnostic: snapshot.hasDiagnostic,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (err) {
    console.error("[/api/coach-plan] error:", err);
    // Cold-start defense (Beta 8.0 hotfix #4, 2026-04-26): the coach card
    // is dashboard-prominent and a 500 here breaks the dashboard
    // network-graph test. Return a soft "needs more practice" plan
    // instead of 500 — lets the dashboard render with a gentle CTA.
    return NextResponse.json(
      {
        score: null,
        confidence: "low",
        target: 4,
        questionsToTarget: 20,
        weakestUnit: null,
        nextAction: { label: "Start a practice session", href: "/practice" },
        accuracyDelta: null,
        showScore: false,
        hasDiagnostic: false,
        family: "AP",
        scaleMax: 5,
        passPercent: 60,
        tierLabel: "Building Foundation",
        inProgressSession: null,
        _degraded: true,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
