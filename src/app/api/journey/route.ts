/**
 * GET  /api/journey         — current journey state for signed-in user
 * POST /api/journey         — { action: "start"|"advance"|"exit"|"reset", course?, step?, payload? }
 *
 * Beta 9.5 (2026-04-30). The state lives in `user_journeys`. One row per user.
 * Idempotent — calling start/advance multiple times in a row is safe.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VALID_COURSE_PREFIX = ["AP_", "SAT_", "ACT_", "CLEP_", "DSST_"];
function isValidCourse(c: string): boolean {
  return typeof c === "string" && VALID_COURSE_PREFIX.some((p) => c.startsWith(p));
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const journey = await prisma.userJourney.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({ journey });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    course?: string;
    step?: number;
    weakestUnit?: string;
    artifactId?: string;
  };
  const userId = session.user.id;
  const action = body.action;

  if (action === "start") {
    const course = body.course && isValidCourse(body.course) ? body.course : "AP_WORLD_HISTORY";
    const journey = await prisma.userJourney.upsert({
      where: { userId },
      update: { course, currentStep: 0, completedAt: null },
      create: { userId, course, currentStep: 0 },
    });
    return NextResponse.json({ journey });
  }

  if (action === "advance") {
    const existing = await prisma.userJourney.findUnique({ where: { userId } });
    if (!existing) return NextResponse.json({ error: "No journey to advance" }, { status: 404 });
    const nextStep = typeof body.step === "number" ? body.step : existing.currentStep + 1;
    const updates: Record<string, unknown> = { currentStep: nextStep };
    if (body.weakestUnit) updates.weakestUnit = body.weakestUnit;
    if (body.artifactId && existing.currentStep === 1) updates.step1SessionId = body.artifactId;
    if (body.artifactId && existing.currentStep === 2) updates.step2FrqId = body.artifactId;
    if (body.artifactId && existing.currentStep === 3) updates.step3DiagnosticId = body.artifactId;
    if (body.artifactId && existing.currentStep === 4) updates.step4SessionId = body.artifactId;
    if (nextStep >= 5) updates.completedAt = new Date();
    const journey = await prisma.userJourney.update({
      where: { userId },
      data: updates,
    });
    return NextResponse.json({ journey });
  }

  if (action === "exit") {
    const journey = await prisma.userJourney.upsert({
      where: { userId },
      update: { currentStep: 99 },
      create: { userId, course: "AP_WORLD_HISTORY", currentStep: 99 },
    });
    return NextResponse.json({ journey });
  }

  if (action === "reset") {
    await prisma.userJourney.deleteMany({ where: { userId } });
    return NextResponse.json({ journey: null });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
