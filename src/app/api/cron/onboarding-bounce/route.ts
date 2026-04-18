/**
 * Onboarding-bounce re-engagement cron.
 *
 * GET /api/cron/onboarding-bounce
 *
 * Motivating incident: user Adithya Narayana signed up 2026-04-18, blew
 * through onboarding in 17 seconds, started a diagnostic (1 PracticeSession,
 * IN_PROGRESS, 0/4 answered), and never returned. No email exists today
 * that would re-engage users in that specific "onboarded but answered zero
 * questions" bucket — the trial-reengagement cron only fires for users
 * with an active freeTrialExpiresAt window + diagnostic row, and Adithya
 * has neither.
 *
 * Logic:
 *   - Find users with onboardingCompletedAt NOT NULL
 *   - Account created within last 14 days (older bounces are stale — no point)
 *   - Zero StudentResponse rows (they never answered a question)
 *   - No prior TrialReengagement row with emailType="onboarding_bounce"
 *     (dedup — we send exactly once)
 *   - Email verified (don't spam unverified addresses)
 *
 * Each matched user gets a single, warm, data-light email via sendEmail() —
 * CTA lands on /dashboard where the Coach Card surfaces the first step.
 *
 * Protected by CRON_SECRET Bearer auth, mirroring /api/cron/trial-reengagement
 * and /api/cron/daily-quiz.
 *
 * Flags:
 *   ?dry=1                               — skip Resend call; still logs candidates
 *   CRON_ONBOARDING_BOUNCE_ENABLED=false — instant kill switch (no redeploy)
 *
 * Register externally at cron-job.org or GitHub Actions. Daily at 14:00 UTC.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOnboardingBounceEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const DAYS = 24 * 3600 * 1000;

// Human-friendly course name — preserves exam-family acronyms. Previously
// this title-cased the whole string, which turned a track-only fallback
// like "ap" into "Ap" (shipped a subject line reading "Your rough Ap
// score is ready" on Adithya's send). Preserving the acronym avoids that.
const ACRONYMS = ["AP", "SAT", "ACT", "CLEP", "DSST"];
function humanCourseName(course: string): string {
  const upper = course.toUpperCase();
  // Track-only fallback: "ap" → "AP"
  if (ACRONYMS.includes(upper)) return upper;
  const prefix = ACRONYMS.find((a) => upper.startsWith(a + "_"));
  if (!prefix) {
    return course.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const rest = course
    .slice(prefix.length + 1)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return `${prefix} ${rest}`.trim();
}

export async function GET(req: NextRequest) {
  // Feature flag — instant kill switch without a redeploy.
  if (process.env.CRON_ONBOARDING_BOUNCE_ENABLED === "false") {
    return NextResponse.json({ status: "disabled", reason: "feature flag off" });
  }

  // Cron secret auth — same pattern as daily-quiz / trial-reengagement.
  const secret = process.env.CRON_SECRET;
  if (secret && process.env.NODE_ENV !== "development") {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const dryRun = req.nextUrl.searchParams.get("dry") === "1";
  const now = new Date();
  const cutoff = new Date(now.getTime() - 14 * DAYS);

  // Pull candidates: onboarded, recent signup, email verified. We filter
  // the "zero responses" and "no prior bounce email" checks per-user below
  // because the Neon HTTP adapter can't do relational counts in a single
  // query efficiently and the candidate set is small.
  const candidates = await prisma.user.findMany({
    where: {
      onboardingCompletedAt: { not: null },
      createdAt: { gte: cutoff },
      emailVerified: { not: null },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      freeTrialCourse: true,
      track: true,
    },
  });

  const sent: Array<{ email: string; course: string }> = [];
  const skipped: Array<{ email: string; reason: string }> = [];
  const errors: Array<{ email: string; error: string }> = [];

  for (const u of candidates) {
    try {
      // Has this user answered any question? If yes, they're engaged —
      // skip. (studentResponses count is cheap; users who haven't answered
      // will return 0.)
      const responseCount = await prisma.studentResponse.count({
        where: { userId: u.id },
      });
      if (responseCount > 0) {
        skipped.push({ email: u.email, reason: `has ${responseCount} responses` });
        continue;
      }

      // Have we already sent the onboarding-bounce email to this user?
      const priorBounce = await prisma.trialReengagement.findFirst({
        where: { userId: u.id, emailType: "onboarding_bounce" },
        select: { id: true },
      });
      if (priorBounce) {
        skipped.push({ email: u.email, reason: "already received onboarding_bounce" });
        continue;
      }

      // Resolve the course this user is actually working on. Priority:
      //   1. freeTrialCourse (explicit course picked during onboarding)
      //   2. fall back to track-derived default ("AP" / "SAT" / "CLEP")
      // If we can't land on anything better than the track we still send —
      // the copy says "your [TRACK] plan" which reads fine.
      const course = u.freeTrialCourse ?? u.track?.toUpperCase() ?? "exam";
      const courseName = humanCourseName(course);

      if (dryRun) {
        sent.push({ email: u.email, course: `${course} (DRY)` });
        continue;
      }

      await sendOnboardingBounceEmail({
        email: u.email,
        firstName: u.firstName || "there",
        courseName,
      });

      // Dedup row — records the send so we never double-email. Reuse
      // TrialReengagement; the `emailType` column is an open string.
      await prisma.trialReengagement.create({
        data: {
          userId: u.id,
          emailType: "onboarding_bounce",
          course,
          sentAt: now,
        },
      });

      sent.push({ email: u.email, course });
    } catch (err) {
      errors.push({ email: u.email, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({
    status: "ok",
    dryRun,
    candidates: candidates.length,
    sent: sent.length,
    skipped: skipped.length,
    errors: errors.length,
    sentDetail: sent,
    skippedDetail: skipped,
    errorsDetail: errors,
    timestamp: now.toISOString(),
  });
}
