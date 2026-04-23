/**
 * POST /api/test/auth
 *
 * CRON_SECRET-gated test authentication endpoint.
 * Creates a test user + forges a valid JWT for functional tests.
 * Used by scripts/functional-tests.js in the release pipeline.
 *
 * Actions:
 *   { action: "create" }  — Create test user (idempotent), return JWT
 *   { action: "cleanup" } — Delete test user + all related data
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashSync } from "bcrypt-ts";
import { encode } from "next-auth/jwt";

export const dynamic = "force-dynamic";

const TEST_EMAIL = "functional-test-runner@test.studentnest.ai";
const TEST_PASSWORD = "TestRunner2026!";

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    // Seed a target DashboardImpression count for the test user — used by
    // authed E2E fixtures that need to reproduce specific dashboard-view
    // patterns (e.g. "2+ visits with 0 practice" for the Nawal-pattern
    // AutoLaunchNudge). Optionally clears existing DB state first so tests
    // are deterministic.
    if (action === "seed-dashboard-impressions") {
      const count = Math.min(20, Math.max(0, Number(body.count ?? 2)));
      const course = String(body.course ?? "AP_WORLD_HISTORY").slice(0, 64);
      const clearFirst = body.clearFirst === true;
      // spreadMinutes: if set, backdate the first impression by this many
      // minutes so the DB rows span a realistic time window. Needed for
      // the AutoLaunchNudge rule added 2026-04-23 that requires >= 30 min
      // spread between first and last impression (prevents SSR/hydrate
      // bursts from triggering the nudge for brand-new users).
      const spreadMinutes = Math.max(0, Number(body.spreadMinutes ?? 0));
      const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL }, select: { id: true } });
      if (!user) return NextResponse.json({ error: "Test user not found — create first" }, { status: 404 });

      if (clearFirst) {
        // Reset the slate for this test fixture. Only remove test-user rows.
        await prisma.studentResponse.deleteMany({ where: { userId: user.id } });
        await prisma.dashboardImpression.deleteMany({ where: { userId: user.id } });
      }

      // Create N impressions across a spread window. Row i gets timestamp
      // (now - spreadMinutes) + (i / (count-1)) * spreadMinutes, so the
      // first is `spreadMinutes` old and the last is now-ish.
      const now = Date.now();
      for (let i = 0; i < count; i++) {
        const offsetMinutes = count > 1
          ? spreadMinutes - (i / (count - 1)) * spreadMinutes
          : 0;
        const when = new Date(now - offsetMinutes * 60_000);
        await prisma.dashboardImpression.create({
          data: { userId: user.id, course, dashboardLoadedAt: when },
        });
      }
      return NextResponse.json({ seeded: count, userId: user.id, course, clearedFirst: clearFirst, spreadMinutes });
    }

    if (action === "cleanup") {
      // Delete test user and all related data (no transactions — sequential deletes)
      const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL }, select: { id: true } });
      if (!user) {
        return NextResponse.json({ cleaned: false, message: "Test user not found" });
      }
      const uid = user.id;

      // Delete in dependency order (children first)
      await prisma.dashboardImpression.deleteMany({ where: { userId: uid } });
      await prisma.studentResponse.deleteMany({ where: { userId: uid } });
      await prisma.practiceSession.deleteMany({ where: { userId: uid } });
      await prisma.tutorKnowledgeCheck.deleteMany({ where: { userId: uid } });
      await prisma.masteryScore.deleteMany({ where: { userId: uid } });
      await prisma.masteryGoal.deleteMany({ where: { userId: uid } });
      await prisma.studyPlan.deleteMany({ where: { userId: uid } });
      await prisma.tutorConversation.deleteMany({ where: { userId: uid } });
      await prisma.verificationToken.deleteMany({ where: { userId: uid } });
      await prisma.sessionFeedback.deleteMany({ where: { userId: uid } });
      await prisma.userAchievement.deleteMany({ where: { userId: uid } });
      await prisma.questionReport.deleteMany({ where: { userId: uid } });
      await prisma.diagnosticResult.deleteMany({ where: { userId: uid } });
      await prisma.discussionReply.deleteMany({ where: { userId: uid } });
      await prisma.discussionThread.deleteMany({ where: { userId: uid } });
      await prisma.moduleSubscription.deleteMany({ where: { userId: uid } });
      await prisma.user.delete({ where: { id: uid } });

      return NextResponse.json({ cleaned: true, userId: uid });
    }

    if (action === "create") {
      // Find or create test user
      let user = await prisma.user.findUnique({
        where: { email: TEST_EMAIL },
        select: { id: true, role: true, subscriptionTier: true, track: true, onboardingCompletedAt: true },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: TEST_EMAIL,
            passwordHash: hashSync(TEST_PASSWORD, 10),
            firstName: "Functional",
            lastName: "Test",
            gradeLevel: "11",
            track: "ap",
            emailVerified: new Date(),
            // Skip onboarding redirect — this is a test user; tests that
            // specifically exercise onboarding can null this back via a
            // separate action if needed.
            onboardingCompletedAt: new Date(),
          },
          select: { id: true, role: true, subscriptionTier: true, track: true, onboardingCompletedAt: true },
        });
      } else if (!user.onboardingCompletedAt) {
        // Existing test user was created before we added this field.
        // Mark onboarded so dashboard doesn't redirect in tests.
        await prisma.user.update({
          where: { id: user.id },
          data: { onboardingCompletedAt: new Date() },
        });
      }

      // Forge a valid JWT using the server's NEXTAUTH_SECRET
      const secret = process.env.NEXTAUTH_SECRET;
      if (!secret) {
        return NextResponse.json({ error: "NEXTAUTH_SECRET not configured" }, { status: 500 });
      }

      const sessionToken = await encode({
        token: {
          id: user.id,
          email: TEST_EMAIL,
          name: "Functional Test",
          role: user.role,
          subscriptionTier: user.subscriptionTier,
          track: user.track ?? "ap",
          moduleSubs: [],
        },
        secret,
        maxAge: 300, // 5 min — short-lived for safety
      });

      // Cookie name depends on whether the site is HTTPS
      const isSecure = req.url.startsWith("https://");
      const cookieName = isSecure
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token";

      return NextResponse.json({
        userId: user.id,
        sessionToken,
        cookieName,
        email: TEST_EMAIL,
      });
    }

    return NextResponse.json({ error: "Invalid action. Use 'create' or 'cleanup'" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/test/auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
