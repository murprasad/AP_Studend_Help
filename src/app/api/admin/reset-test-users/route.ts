/**
 * GET  /api/admin/reset-test-users — Fetch current state of test user accounts
 * POST /api/admin/reset-test-users — Reset one or all test users to fresh state
 * PATCH /api/admin/reset-test-users — Set tier for a test user (simulate Premium)
 *
 * Ported from PrepLion. StudentNest version covers AP/SAT/ACT tracks
 * (no CLEP/DSST/Accuplacer). Reset clears all activity data + resets the
 * User row to a fresh state so QA can re-walk onboarding, diagnostic, etc.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RESET_USER_FIELDS } from "@/lib/reset-test-users";

export const dynamic = "force-dynamic";

const TEST_EMAILS = [
  "murprasad+std@gmail.com",
  "murprasad+sat@gmail.com",
  "murprasad+act@gmail.com",
  "murprasad+appass@gmail.com",
];

const TEST_LABELS: Record<string, string> = {
  "murprasad+std@gmail.com": "AP Free",
  "murprasad+sat@gmail.com": "SAT Premium",
  "murprasad+act@gmail.com": "ACT Premium",
  "murprasad+appass@gmail.com": "AP Premium",
};

// Per-slot intended track. Drives reset + the "Pass"/Premium tier action.
const TEST_TRACKS: Record<string, "ap" | "sat" | "act"> = {
  "murprasad+std@gmail.com": "ap",
  "murprasad+sat@gmail.com": "sat",
  "murprasad+act@gmail.com": "act",
  "murprasad+appass@gmail.com": "ap",
};

// Which subscription tier each slot should land on when "Premium" is
// clicked. Mirrors the per-track premium tiers on StudentNest.
const TEST_PREMIUM_TIER: Record<string, "PREMIUM" | "AP_PREMIUM" | "SAT_PREMIUM" | "ACT_PREMIUM"> = {
  "murprasad+std@gmail.com": "AP_PREMIUM",
  "murprasad+sat@gmail.com": "SAT_PREMIUM",
  "murprasad+act@gmail.com": "ACT_PREMIUM",
  "murprasad+appass@gmail.com": "AP_PREMIUM",
};

// ── GET: Fetch current state ────────────────────────────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { email: { in: TEST_EMAILS } },
    select: {
      id: true,
      email: true,
      subscriptionTier: true,
      totalXp: true,
      level: true,
      streakDays: true,
      freeTrialCourse: true,
      freeTrialExpiresAt: true,
      trialEmailsSent: true,
      track: true,
      _count: { select: { practiceSessions: true, responses: true, masteryScores: true, frqAttempts: true } },
    },
    orderBy: { email: "asc" },
  });

  const result = users.map((u) => ({
    id: u.id,
    email: u.email,
    label: TEST_LABELS[u.email] || "Test",
    tier: u.subscriptionTier,
    xp: u.totalXp,
    level: u.level,
    streakDays: u.streakDays,
    freeTrialCourse: u.freeTrialCourse,
    freeTrialExpiresAt: u.freeTrialExpiresAt,
    trialEmailsSent: u.trialEmailsSent,
    track: u.track,
    sessions: u._count.practiceSessions,
    responses: u._count.responses,
    masteryUnits: u._count.masteryScores,
    frqAttempts: u._count.frqAttempts,
  }));

  return NextResponse.json({ users: result });
}

// ── POST: Reset test users ──────────────────────────────────────────────────

async function resetUser(email: string) {
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) return { email, success: false, deleted: 0, error: "Not found" };

  const uid = user.id;
  let totalDeleted = 0;

  // Delete all activity data (order matters for FK constraints)
  totalDeleted += (await prisma.moduleSubscription.deleteMany({ where: { userId: uid } })).count;
  totalDeleted += (await prisma.sessionFeedback.deleteMany({ where: { userId: uid } })).count;
  totalDeleted += (await prisma.tutorKnowledgeCheck.deleteMany({ where: { userId: uid } })).count;
  totalDeleted += (await prisma.tutorConversation.deleteMany({ where: { userId: uid } })).count;
  totalDeleted += (await prisma.discussionReply.deleteMany({ where: { userId: uid } })).count;
  totalDeleted += (await prisma.discussionThread.deleteMany({ where: { userId: uid } })).count;
  totalDeleted += (await prisma.questionReport.deleteMany({ where: { userId: uid } })).count;
  totalDeleted += (await prisma.userAchievement.deleteMany({ where: { userId: uid } })).count;
  totalDeleted += (await prisma.diagnosticResult.deleteMany({ where: { userId: uid } })).count;
  totalDeleted += (await prisma.studyPlan.deleteMany({ where: { userId: uid } })).count;
  totalDeleted += (await prisma.masteryScore.deleteMany({ where: { userId: uid } })).count;
  totalDeleted += (await prisma.masteryGoal.deleteMany({ where: { userId: uid } })).count;
  totalDeleted += (await prisma.studentResponse.deleteMany({ where: { userId: uid } })).count;
  totalDeleted += (await prisma.trialReengagement.deleteMany({ where: { userId: uid } })).count;
  // Beta 9.1.1 — FRQ attempts were NOT being reset. User reported: FRQ
  // responses persist after admin reset. Without this, the per-type/
  // per-course FRQ free-attempt cap stays consumed across resets, blocking
  // re-test of the FRQ flow.
  totalDeleted += (await prisma.frqAttempt.deleteMany({ where: { userId: uid } })).count;
  // 2026-05-11 — user_journeys row was NOT being reset. User reported:
  // murprasad+std stuck on Step 5 after admin reset because /api/journey
  // returned the old completed row (currentStep=5, completedAt set), and
  // the journey page short-circuited to Step 5 instead of starting fresh
  // at Step 0. Reset must delete the journey row so the user gets a clean
  // start-of-journey on next login.
  totalDeleted += (await prisma.userJourney.deleteMany({ where: { userId: uid } })).count;

  // SessionQuestion — delete via sessions
  const sessions = await prisma.practiceSession.findMany({ where: { userId: uid }, select: { id: true } });
  const sessionIds = sessions.map((s) => s.id);
  if (sessionIds.length > 0) {
    totalDeleted += (await prisma.sessionQuestion.deleteMany({ where: { sessionId: { in: sessionIds } } })).count;
  }
  totalDeleted += (await prisma.practiceSession.deleteMany({ where: { userId: uid } })).count;

  await prisma.user.update({
    where: { id: uid },
    data: { ...RESET_USER_FIELDS, track: TEST_TRACKS[email] ?? "ap" },
  });

  return { email, success: true, deleted: totalDeleted };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let emailFilter: string | null = null;
  try {
    const body = await req.json();
    emailFilter = body?.email || null;
  } catch {
    // No body = reset all
  }

  const emails = emailFilter ? [emailFilter] : TEST_EMAILS;

  for (const e of emails) {
    if (!TEST_EMAILS.includes(e)) {
      return NextResponse.json({ error: `Email ${e} is not a test account` }, { status: 400 });
    }
  }

  const results = [];
  for (const email of emails) {
    try {
      results.push(await resetUser(email));
    } catch (err) {
      console.error(`reset-test-users failed for ${email}:`, err);
      results.push({ email, success: false, deleted: 0, error: "Reset failed — see server logs" });
    }
  }

  return NextResponse.json({ results });
}

// ── PATCH: Set tier for a test user (simulate Premium) ──────────────────────

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { email, tier } = body as { email: string; tier: "free" | "premium" };

  if (!email || !tier) {
    return NextResponse.json({ error: "email and tier required" }, { status: 400 });
  }
  if (!TEST_EMAILS.includes(email)) {
    return NextResponse.json({ error: `${email} is not a test account` }, { status: 400 });
  }

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const uid = user.id;
  const now = new Date();

  if (tier === "premium") {
    const slotTrack = TEST_TRACKS[email] ?? "ap";
    const premiumTier = TEST_PREMIUM_TIER[email] ?? "AP_PREMIUM";

    await prisma.moduleSubscription.deleteMany({ where: { userId: uid } });
    await prisma.moduleSubscription.create({
      data: {
        userId: uid,
        module: slotTrack,
        status: "active",
        stripeSubscriptionId: `test_sub_${uid}_${slotTrack}_${Date.now()}`,
        stripeCurrentPeriodEnd: new Date(now.getTime() + 30 * 86400000),
      },
    });
    await prisma.user.update({
      where: { id: uid },
      data: { subscriptionTier: premiumTier },
    });
    return NextResponse.json({ success: true, tier: premiumTier, module: slotTrack });
  }

  // tier === "free"
  await prisma.moduleSubscription.deleteMany({ where: { userId: uid } });
  await prisma.user.update({
    where: { id: uid },
    data: { subscriptionTier: "FREE" },
  });
  return NextResponse.json({ success: true, tier: "free" });
}
