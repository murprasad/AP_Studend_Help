/**
 * 2026-06-01 — Fix C for new-user activation gap.
 *
 * GET /api/me/activation-progress?course=ACT_ENGLISH
 *
 * Returns the lightweight stats used by <ActivationGate /> to decide
 * whether to hide the "advanced" dashboard cards (PassProbabilityHero,
 * SatSkillHeatmap) for users who haven't generated meaningful signal yet.
 *
 * 2026-06-01 #2 — Counts are now per-COURSE, not total. Without this,
 * a user with 5 Qs each on 2 courses bypasses the gate on either
 * dashboard while having insufficient per-course data for the readiness
 * formula to produce meaningful output.
 *
 * Yin forensic (2026-06-01):
 *   - 1 day signed up, 1 quick practice, 3 Qs total
 *   - Dashboard surfaced FOUR competing CTAs (warmup, diagnostic,
 *     today's set, primary action strip) — she bounced after one
 *     impression
 *   - The PassProbability hero's "Take a 9-Q diagnostic" CTA conflicts
 *     with the AutoLaunchNudge 3-Q warmup higher up on the page; users
 *     can't tell which one to click
 *
 * Threshold: 10 questions answered. Below that, the heavy cards hide and
 * a single focused first-week CTA renders in their place.
 *
 * Auth required. Returns 200 always for authed users.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApCourse } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_COURSE_PREFIX = ["AP_", "SAT_", "PSAT_", "ACT_", "CLEP_", "DSST_"];
// Align with pass-probability.ts SAMPLE_SIZE_FLOOR (raised 5 → 20 on
// 2026-06-01 to stop the formula from claiming "93% ready" off 5 Qs).
const ACTIVATION_THRESHOLD = 20;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const courseParam = searchParams.get("course");
    const scopedCourse = courseParam && VALID_COURSE_PREFIX.some((p) => courseParam.startsWith(p))
      ? (courseParam as ApCourse)
      : null;

    const responseWhere = scopedCourse
      ? { userId, question: { course: scopedCourse } }
      : { userId };
    const sessionWhere = scopedCourse
      ? { userId, course: scopedCourse, sessionType: "DIAGNOSTIC" as const, completedAt: { not: null } }
      : { userId, sessionType: "DIAGNOSTIC" as const, completedAt: { not: null } };

    const [totalAnswered, diagnosticSessions, distinctDays] = await Promise.all([
      prisma.studentResponse.count({ where: responseWhere }),
      prisma.practiceSession.count({ where: sessionWhere }),
      prisma.studentResponse.findMany({
        where: responseWhere,
        select: { answeredAt: true },
        take: 200,
      }),
    ]);

    const dayBucket = new Set(
      distinctDays.map((r) => r.answeredAt.toISOString().slice(0, 10)),
    );

    return NextResponse.json({
      course: scopedCourse,
      totalAnswered,
      threshold: ACTIVATION_THRESHOLD,
      hasDiagnostic: diagnosticSessions > 0,
      daysActive: dayBucket.size,
      activated: totalAnswered >= ACTIVATION_THRESHOLD,
    });
  } catch (e) {
    console.error("[/api/me/activation-progress] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
