import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateStudyPlan } from "@/lib/ai";
import { ApUnit, ApCourse } from "@prisma/client";
import { COURSE_UNITS } from "@/lib/utils";
import { VALID_AP_COURSES, COURSE_REGISTRY } from "@/lib/courses";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const course = (searchParams.get("course") as ApCourse) || "AP_WORLD_HISTORY";

    const activePlan = await prisma.studyPlan.findFirst({
      where: { userId: session.user.id, course, isActive: true },
      orderBy: { generatedAt: "desc" },
    });

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

    if (!VALID_AP_COURSES.includes(course)) {
      return NextResponse.json({ error: "Invalid course" }, { status: 400 });
    }

    // Get mastery scores for units in this course
    const courseUnitKeys = Object.keys(COURSE_UNITS[course]) as ApUnit[];

    const masteryScores = await prisma.masteryScore.findMany({
      where: { userId: session.user.id, unit: { in: courseUnitKeys } },
    });

    // Get recent responses from sessions of this course
    const courseSessionIds = (
      await prisma.practiceSession.findMany({
        where: { userId: session.user.id, course },
        select: { id: true },
        orderBy: { startedAt: "desc" },
        take: 20,
      })
    ).map((s) => s.id);

    const recentResponses =
      courseSessionIds.length > 0
        ? await prisma.studentResponse.findMany({
            where: { userId: session.user.id, sessionId: { in: courseSessionIds } },
            orderBy: { answeredAt: "desc" },
            take: 100,
          })
        : [];

    const recentAccuracy =
      recentResponses.length > 0
        ? (recentResponses.filter((r) => r.isCorrect).length / recentResponses.length) * 100
        : 0;

    let planData;

    // Static plan for users with < 20 questions answered (save AI tokens)
    if (recentResponses.length < 20) {
      const config = COURSE_REGISTRY[course];
      const unitKeys = Object.keys(COURSE_UNITS[course]) as ApUnit[];
      planData = {
        weeklyGoal: `Complete your first 20 ${config.name} practice questions to unlock your personalized AI study plan`,
        dailyMinutes: 30,
        isStatic: true,
        focusAreas: unitKeys.slice(0, 3).map((unit, i) => ({
          unit: config.units[unit as ApUnit]?.name ?? unit,
          priority: i === 0 ? "high" : i === 1 ? "medium" : "low",
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
      // Deactivate old plans for this course
      await prisma.studyPlan.updateMany({
        where: { userId: session.user.id, course, isActive: true },
        data: { isActive: false },
      });
      const plan = await prisma.studyPlan.create({
        data: { userId: session.user.id, course, planData },
      });
      return NextResponse.json({ plan: plan.planData });
    }

    try {
      planData = await generateStudyPlan(
        masteryScores.map((m) => ({
          unit: m.unit as ApUnit,
          masteryScore: m.masteryScore,
          accuracy: m.accuracy,
        })),
        { accuracy: recentAccuracy, totalAnswered: recentResponses.length },
        course
      );
    } catch (aiError) {
      console.error("AI study plan generation failed:", aiError);
      const courseLabel = COURSE_REGISTRY[course]?.name || course;

      planData = {
        weeklyGoal: `Build consistent daily practice habits across all ${courseLabel} units`,
        dailyMinutes: 30,
        focusAreas: [
          {
            unit: "Start with your weakest units",
            priority: "high",
            reason: "Build foundation in areas with lowest mastery",
            mcqCount: 15,
            saqCount: 0,
            estimatedMinutes: 30,
            resources: ["College Board AP Central", "Khan Academy"],
          },
        ],
        strengths: ["Keep practicing to identify your strengths!"],
        tips: [
          "Practice 30 minutes daily for best results",
          "Review explanations for every wrong answer",
          "Use the AI tutor for topics you don't understand",
        ],
      };
    }

    // Deactivate old plans for this course
    await prisma.studyPlan.updateMany({
      where: { userId: session.user.id, course, isActive: true },
      data: { isActive: false },
    });

    const plan = await prisma.studyPlan.create({
      data: {
        userId: session.user.id,
        course,
        planData,
      },
    });

    return NextResponse.json({ plan: plan.planData });
  } catch (error) {
    console.error("POST /api/study-plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
