import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateStudyPlan } from "@/lib/ai";
import { ApUnit } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const activePlan = await prisma.studyPlan.findFirst({
    where: { userId: session.user.id, isActive: true },
    orderBy: { generatedAt: "desc" },
  });

  return NextResponse.json({ plan: activePlan?.planData || null });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const masteryScores = await prisma.masteryScore.findMany({
    where: { userId: session.user.id },
  });

  const recentResponses = await prisma.studentResponse.findMany({
    where: { userId: session.user.id },
    orderBy: { answeredAt: "desc" },
    take: 100,
  });

  const recentAccuracy =
    recentResponses.length > 0
      ? (recentResponses.filter((r) => r.isCorrect).length / recentResponses.length) * 100
      : 0;

  let planData;
  try {
    planData = await generateStudyPlan(
      masteryScores.map((m) => ({
        unit: m.unit as ApUnit,
        masteryScore: m.masteryScore,
        accuracy: m.accuracy,
      })),
      { accuracy: recentAccuracy, totalAnswered: recentResponses.length }
    );
  } catch {
    // Fallback plan if AI fails
    planData = {
      weeklyGoal: "Build consistent daily practice habits across all AP World History units",
      dailyMinutes: 30,
      focusAreas: [
        {
          unit: "Start with your weakest units",
          priority: "high",
          reason: "Build foundation in areas with lowest mastery",
          mcqCount: 15,
          saqCount: 2,
          estimatedMinutes: 30,
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

  // Deactivate old plans
  await prisma.studyPlan.updateMany({
    where: { userId: session.user.id, isActive: true },
    data: { isActive: false },
  });

  const plan = await prisma.studyPlan.create({
    data: {
      userId: session.user.id,
      planData,
    },
  });

  return NextResponse.json({ plan: plan.planData });
}
