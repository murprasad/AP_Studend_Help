import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateStudyPlan, generateCLEP7DayPlan, staticCLEP7DayPlan } from "@/lib/ai";
import { ApUnit, ApCourse } from "@prisma/client";
import { COURSE_UNITS } from "@/lib/utils";
import { VALID_AP_COURSES, COURSE_REGISTRY } from "@/lib/courses";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const course = (searchParams.get("course") as ApCourse) || "AP_WORLD_HISTORY";

    if (!VALID_AP_COURSES.includes(course)) {
      return NextResponse.json({ error: "Invalid course" }, { status: 400 });
    }

    // Feature flag + DB query in parallel
    const [enabledFlag, activePlan] = await Promise.all([
      getSetting("study_plan_enabled", "true"),
      prisma.studyPlan.findFirst({
        where: { userId: session.user.id, course, isActive: true },
        orderBy: { generatedAt: "desc" },
      }),
    ]);

    if (enabledFlag !== "true") {
      return NextResponse.json({ error: "Feature temporarily unavailable" }, { status: 503 });
    }

    return NextResponse.json({ plan: activePlan?.planData || null });
  } catch (error) {
    console.error("GET /api/study-plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const course: ApCourse = body.course || "AP_WORLD_HISTORY";
    const mode = body.mode || "weekly";

    if (!VALID_AP_COURSES.includes(course)) {
      return NextResponse.json({ error: "Invalid course" }, { status: 400 });
    }

    if (mode === "7day" && !course.startsWith("CLEP_")) {
      return NextResponse.json({ error: "7-day intensive plans are only available for CLEP courses" }, { status: 400 });
    }

    const config = COURSE_REGISTRY[course];
    const courseUnitKeys = Object.keys(COURSE_UNITS[course]) as ApUnit[];

    // Build static plan first — this NEVER fails (no DB dependency)
    const staticPlan = {
      weeklyGoal: `Complete your first 20 ${config.name} practice questions to unlock your personalized AI study plan`,
      dailyMinutes: 30,
      isStatic: true,
      focusAreas: courseUnitKeys.slice(0, 3).map((unit, i) => ({
        unit: config.units[unit as ApUnit]?.name ?? unit,
        priority: (i === 0 ? "high" : i === 1 ? "medium" : "low") as "high" | "medium" | "low",
        reason: "Start here to build a solid foundation",
        mcqCount: 10,
        saqCount: 0,
        estimatedMinutes: 20,
        resources: ["College Board AP Central", "Khan Academy", "Fiveable"],
      })),
      strengths: ["Complete more practice to identify your strengths!"],
      tips: [
        "Do 10 practice questions daily for the best results",
        "Read every explanation, even for correct answers",
        "Use the AI Tutor to clarify any confusing concepts",
      ],
      dailySchedule: {
        Monday: "Unit 1 practice — 10 MCQs",
        Tuesday: "Unit 2 practice — 10 MCQs",
        Wednesday: "Review wrong answers + AI Tutor session",
        Thursday: "Unit 3 practice — 10 MCQs",
        Friday: "Mixed practice across all units",
        Weekend: "Rest or bonus practice on your weakest unit",
      },
    };

    // Static 7-day plan for CLEP courses
    const static7DayPlan = mode === "7day" ? staticCLEP7DayPlan(course) : null;

    // Try to fetch data and enhance plan — if ANY step fails, use static plan
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let planData: any = mode === "7day" ? static7DayPlan : staticPlan;

    try {
      // Feature flag check
      const enabledFlag = await getSetting("study_plan_enabled", "true");
      if (enabledFlag !== "true") {
        return NextResponse.json({ error: "Feature temporarily unavailable" }, { status: 503 });
      }

      // Stage 1: parallel queries with allSettled
      const results = await Promise.allSettled([
        prisma.masteryScore.findMany({
          where: { userId: session.user.id, unit: { in: courseUnitKeys } },
        }),
        prisma.practiceSession.findMany({
          where: { userId: session.user.id, course },
          select: { id: true },
          orderBy: { startedAt: "desc" },
          take: 20,
        }),
      ]);

      const masteryScores = results[0].status === "fulfilled" ? results[0].value : [];
      const recentSessions = results[1].status === "fulfilled" ? results[1].value : [];

      // Stage 2: responses
      const sessionIds = recentSessions.map((s) => s.id);
      let recentResponses: { isCorrect: boolean }[] = [];
      if (sessionIds.length > 0) {
        try {
          recentResponses = await prisma.studentResponse.findMany({
            where: { userId: session.user.id, sessionId: { in: sessionIds } },
            orderBy: { answeredAt: "desc" },
            take: 100,
            select: { isCorrect: true },
          });
        } catch { /* use empty responses — static plan will be returned */ }
      }

      const recentAccuracy = recentResponses.length > 0
        ? (recentResponses.filter((r) => r.isCorrect).length / recentResponses.length) * 100
        : 0;

      // If user has 20+ responses, try AI-enhanced plan
      if (recentResponses.length >= 20) {
        try {
          if (mode === "7day") {
            planData = (await Promise.race([
              generateCLEP7DayPlan(
                course,
                masteryScores.map((m) => ({
                  unit: m.unit as ApUnit,
                  masteryScore: m.masteryScore,
                  accuracy: m.accuracy,
                })),
              ),
              new Promise((_, reject) => setTimeout(() => reject(new Error("AI timeout")), 10000)),
            ])) as Record<string, unknown>;
          } else {
            planData = (await Promise.race([
              generateStudyPlan(
                masteryScores.map((m) => ({
                  unit: m.unit as ApUnit,
                  masteryScore: m.masteryScore,
                  accuracy: m.accuracy,
                })),
                { accuracy: recentAccuracy, totalAnswered: recentResponses.length },
                course
              ),
              new Promise((_, reject) => setTimeout(() => reject(new Error("AI timeout")), 10000)),
            ])) as Record<string, unknown>;
          }
        } catch (aiError) {
          console.error("AI study plan generation failed:", aiError);
          // Keep staticPlan / static7DayPlan as fallback — already set above
        }
      }
    } catch (dataError) {
      console.error("Study plan data fetch failed, using static plan:", dataError);
      // planData is already set to staticPlan — continue to save it
    }

    // Save plan to DB (best-effort — if this fails, still return the plan data)
    try {
      await prisma.studyPlan.updateMany({
        where: { userId: session.user.id, course, isActive: true },
        data: { isActive: false },
      });
      await prisma.studyPlan.create({
        data: { userId: session.user.id, course, planData },
      });
    } catch (saveError) {
      console.error("Study plan save failed (returning plan anyway):", saveError);
    }

    return NextResponse.json({ plan: planData });
  } catch (error) {
    // Last resort — even auth failure gets a response, never a crash
    console.error("POST /api/study-plan critical error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
