import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApCourse, ApUnit } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/mastery-goal?course=AP_WORLD_HISTORY — returns all goals for the course
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const course = req.nextUrl.searchParams.get("course") as ApCourse | null;

  const goals = await prisma.masteryGoal.findMany({
    where: {
      userId: session.user.id,
      ...(course ? { course } : {}),
    },
  });

  return NextResponse.json({ goals });
}

// POST /api/mastery-goal — upsert a goal for a unit
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { course, unit, targetScore, targetDate } = body as {
    course: ApCourse;
    unit: ApUnit;
    targetScore: number;
    targetDate?: string;
  };

  if (!course || !unit || typeof targetScore !== "number") {
    return NextResponse.json({ error: "course, unit, targetScore required" }, { status: 400 });
  }

  if (targetScore < 0 || targetScore > 100) {
    return NextResponse.json({ error: "targetScore must be 0-100" }, { status: 400 });
  }

  const goal = await prisma.masteryGoal.upsert({
    where: { userId_course_unit: { userId: session.user.id, course, unit } },
    create: {
      userId: session.user.id,
      course,
      unit,
      targetScore,
      targetDate: targetDate ? new Date(targetDate) : null,
    },
    update: {
      targetScore,
      targetDate: targetDate ? new Date(targetDate) : null,
    },
  });

  return NextResponse.json({ goal });
}

// DELETE /api/mastery-goal?unit=UNIT_1_GLOBAL_TAPESTRY&course=AP_WORLD_HISTORY
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const unit = req.nextUrl.searchParams.get("unit") as ApUnit | null;
  const course = req.nextUrl.searchParams.get("course") as ApCourse | null;
  if (!unit || !course) return NextResponse.json({ error: "unit and course required" }, { status: 400 });

  await prisma.masteryGoal.deleteMany({
    where: { userId: session.user.id, unit, course },
  });

  return NextResponse.json({ ok: true });
}
