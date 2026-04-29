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
    // Reset the test user's onboarding flag so E2E can walk through the
    // full wizard (course picker → how it works → you're set → pick plan).
    // Does NOT touch other user state — safe to call before an onboarding
    // walkthrough test.
    // Seed the test user's daily practice-question usage to a target count.
    // Used by Journey 1 (Revenue) to exercise the FREE_LIMITS.practiceQuestionsPerDay
    // = 20 cap without actually answering 20 questions through the UI.
    //
    // We write N rows of StudentResponse dated today. The practice-cap check
    // counts StudentResponse rows with createdAt within today for this user,
    // so seeding N rows puts the user at N/20.
    //
    // Params: { action: "seed-usage", count: 20, clear?: true }
    // Always uses course=AP_WORLD_HISTORY and the first approved question in
    // that course as the link target (no test-question invention).
    if (action === "seed-usage") {
      const count = Math.min(100, Math.max(0, Number(body.count ?? 20)));
      const clear = body.clear === true;
      const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL }, select: { id: true } });
      if (!user) return NextResponse.json({ error: "Test user not found — create first" }, { status: 404 });
      if (clear) {
        await prisma.studentResponse.deleteMany({ where: { userId: user.id } });
      }
      // Seed against multiple different questions to avoid breaking the
      // practice-route's dedupe logic (which filters out already-answered-
      // correctly questions and tries AI generation when the fresh pool is
      // empty). Pulling N distinct questions prevents that failure path.
      // Also mark them INCORRECT so the dedupe doesn't treat them as
      // "mastered" — the cap check doesn't care about correctness.
      const qs = await prisma.question.findMany({
        where: { isApproved: true },
        select: { id: true },
        take: Math.max(count, 1),
      });
      if (qs.length === 0) return NextResponse.json({ error: "No approved questions to seed against" }, { status: 500 });
      const now = new Date();
      for (let i = 0; i < count; i++) {
        await prisma.studentResponse.create({
          data: {
            userId: user.id,
            // Cycle through available questions; if count > bank size, reuse.
            questionId: qs[i % qs.length].id,
            studentAnswer: "A",
            isCorrect: false, // don't pollute the dedupe cache
            timeSpentSecs: 30,
            answeredAt: new Date(now.getTime() - i * 1000), // stagger
          },
        });
      }
      return NextResponse.json({ seeded: count, userId: user.id, clearedFirst: clear });
    }

    if (action === "reset-onboarding") {
      const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL }, select: { id: true } });
      if (!user) return NextResponse.json({ error: "Test user not found — create first" }, { status: 404 });
      await prisma.user.update({
        where: { id: user.id },
        data: { onboardingCompletedAt: null },
      });
      return NextResponse.json({ reset: true, userId: user.id });
    }

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

      // Beta 8.12 (2026-04-29) — ensure onboardingCompletedAt is set when
      // seeding impressions. The premise of the nawal-nudge tests is "user
      // has visited dashboard 2+ times" which implies they're past
      // onboarding. Without this, the dashboard layout's first-time-user
      // redirect (to /practice/quickstart) fires and tests can't run.
      await prisma.user.update({
        where: { id: user.id },
        data: { onboardingCompletedAt: new Date() },
      });

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
        select: { id: true, role: true, subscriptionTier: true, track: true, onboardingCompletedAt: true, createdAt: true },
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
            // Pre-age the account so time-gated features (e.g. the
            // AutoLaunchNudge 30-min-old rule, or the
            // diagnostic-cooldown check) don't always fail on a freshly
            // created test user. functional-tests.js cleanup deletes
            // the test user at the end of each deploy, so every next
            // deploy's auth.setup would otherwise recreate with
            // createdAt=now. Backdate 2 hours to comfortably clear any
            // "≥30 min old" threshold without affecting other logic.
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          select: { id: true, role: true, subscriptionTier: true, track: true, onboardingCompletedAt: true, createdAt: true },
        });
      } else {
        // Existing test user — always ensure they're onboarded AND
        // backdated so age-gated features don't fail during tests.
        // functional-tests.js deletes the test user on every deploy,
        // so on the next deploy the auth.setup creates fresh (now ~3 min
        // old) and features gated on "account ≥30 min old" break.
        // This branch covers the path where the user DID persist but
        // their createdAt is recent.
        const ageMinutes = (Date.now() - new Date(user.createdAt).getTime()) / 60_000;
        const updates: Record<string, unknown> = {};
        if (!user.onboardingCompletedAt) updates.onboardingCompletedAt = new Date();
        if (ageMinutes < 60) updates.createdAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
        if (Object.keys(updates).length > 0) {
          await prisma.user.update({ where: { id: user.id }, data: updates });
        }
      }
      // After both branches, `user` is guaranteed non-null.
      if (!user) {
        return NextResponse.json({ error: "Test user provisioning failed" }, { status: 500 });
      }

      // Forge a valid JWT using the server's NEXTAUTH_SECRET
      const secret = process.env.NEXTAUTH_SECRET;
      if (!secret) {
        return NextResponse.json({ error: "NEXTAUTH_SECRET not configured" }, { status: 500 });
      }

      // Mirror the production JWT callback — read fresh moduleSubs from
      // the DB so test fixtures that pre-seed a ModuleSubscription get
      // the right entitlement in the forged JWT. Previously hardcoded to
      // [], which made it impossible to test Premium-only paths and
      // hid the Beta 7.1 all-access entitlement from verification probes.
      const moduleSubs = (await prisma.moduleSubscription.findMany({
        where: { userId: user.id },
        select: { module: true, status: true },
      })).map((s) => ({ module: s.module, status: s.status }));

      const sessionToken = await encode({
        token: {
          id: user.id,
          email: TEST_EMAIL,
          name: "Functional Test",
          role: user.role,
          subscriptionTier: user.subscriptionTier,
          track: user.track ?? "ap",
          moduleSubs,
          onboardingCompletedAt: user.onboardingCompletedAt?.toISOString() ?? null,
        },
        secret,
        // Extended 2026-04-24: previous 5-min expiry caused every authed
        // test after deploy7 to be redirected to /login because the
        // Playwright pipeline now runs 500+ public tests (15-30 min)
        // before the authed project. JWT expired mid-run → tests saw
        // "Received: /login?callbackUrl=...".
        // 2 hours covers any plausible full suite run while still being
        // short-lived relative to a real user session.
        maxAge: 7200, // 2 hours
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
