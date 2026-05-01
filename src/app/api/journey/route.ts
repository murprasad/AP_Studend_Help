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

  // Beta 9.7.3 (2026-04-30) — Step 5 tile-click loop hardening.
  // When the journey is complete, re-affirm both onboarded sentinels on
  // EVERY GET. Two guards because either alone has been flaky in the wild:
  //   (a) idempotently set User.onboardingCompletedAt if null — covers
  //       the case where /api/journey advance step:5 raced or the User
  //       update threw silently.
  //   (b) re-set the bridge cookie on the response — covers JWT-stale
  //       scenarios where useSession().update() didn't actually persist
  //       a fresh JWT cookie. Middleware short-circuits on this cookie.
  // The journey page calls /api/journey GET on every mount, so any
  // reload of /journey at step 5 (boot effect, refresh, prefetch)
  // re-fixes the bounce-back loop.
  if (journey && journey.currentStep >= 5 && journey.currentStep !== 99) {
    try {
      const u = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { onboardingCompletedAt: true },
      });
      if (u && !u.onboardingCompletedAt) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { onboardingCompletedAt: new Date() },
        });
      }
    } catch { /* non-fatal — fall through to cookie set */ }
    const res = NextResponse.json({ journey });
    // 2026-05-01 — cookie value is the userId (not "true") so a stale
    // cookie left in the browser after a different user completes the
    // journey can't bypass the /journey redirect for a fresh-state user.
    // Middleware compares the cookie value to JWT.id and ignores mismatches.
    res.cookies.set("onboarding_completed", session.user.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      secure: true,
    });
    return res;
  }

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
    // Beta 9.6 — exit-intent feedback fields
    reason?: string;
    feedback?: string;
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

    // Beta 9.7.1 — when journey completes, ALSO mark the User as
    // onboarded so the middleware (which can't query Prisma at edge)
    // doesn't bounce them back to /journey when they tap a Step 5
    // next-step tile (-> /dashboard) and the JWT still has null
    // onboardingCompletedAt. We update both:
    //   1. User.onboardingCompletedAt in DB (so the next JWT refresh
    //      picks it up cleanly).
    //   2. onboarding_completed=true bridge cookie on this response,
    //      which middleware checks before the redirect — so the very
    //      next /dashboard navigation works without a JWT refresh.
    if (nextStep >= 5) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { onboardingCompletedAt: new Date() },
        });
      } catch { /* non-fatal — journey is already advanced */ }
      const res = NextResponse.json({ journey });
      // 2026-05-01 — cookie value is the userId (not "true") so a stale
    // cookie left in the browser after a different user completes the
    // journey can't bypass the /journey redirect for a fresh-state user.
    // Middleware compares the cookie value to JWT.id and ignores mismatches.
    res.cookies.set("onboarding_completed", session.user.id, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
        secure: true,
      });
      return res;
    }
    return NextResponse.json({ journey });
  }

  if (action === "exit") {
    // Beta 9.6 — capture optional exit-intent feedback (preloaded reason
    // + optional free text). Both nullable; modal can be skipped.
    const reason = typeof body.reason === "string" ? body.reason.slice(0, 100) : null;
    const feedback = typeof body.feedback === "string" ? body.feedback.slice(0, 1000) : null;
    const exitData: Record<string, unknown> = {
      currentStep: 99,
      exitAt: new Date(),
    };
    if (reason) exitData.exitReason = reason;
    if (feedback) exitData.exitFeedback = feedback;
    const journey = await prisma.userJourney.upsert({
      where: { userId },
      update: exitData,
      create: { userId, course: "AP_WORLD_HISTORY", ...exitData },
    });
    return NextResponse.json({ journey });
  }

  if (action === "reset") {
    await prisma.userJourney.deleteMany({ where: { userId } });
    return NextResponse.json({ journey: null });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
