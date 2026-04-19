/**
 * Registration-stall re-engagement cron.
 *
 * GET /api/cron/registration-stall
 *
 * Catches the "Sarayu case" — users who registered + verified their email
 * but NEVER completed onboarding. Distinct from /api/cron/onboarding-bounce
 * (which targets users who finished onboarding but answered zero questions).
 *
 * Canonical incident (PrepLion side): sarayurk98@gmail.com — registered,
 * clicked the email verification link, landed on /onboarding, bounced.
 * onboardingCompletedAt stayed null; no course ever picked. She would
 * never be caught by the onboarding-bounce cron because that cron requires
 * onboardingCompletedAt to be NOT NULL. Different psychology, different
 * email: she needs "finish setup", not "come see your score".
 *
 * Logic:
 *   - emailVerified NOT NULL   (we trust the email)
 *   - onboardingCompletedAt IS NULL   (never finished setup)
 *   - createdAt > now - 14 days    (not ancient)
 *   - createdAt < now - 2 hours    (grace window — don't spam mid-registration)
 *   - No prior TrialReengagement row with emailType="registration_stall"
 *
 * Course name is intentionally NOT resolved here — these users never picked
 * a course. The email uses neutral copy ("personalized plan") instead.
 *
 * Protected by CRON_SECRET Bearer auth, mirroring /api/cron/onboarding-bounce
 * and /api/cron/trial-reengagement.
 *
 * Flags:
 *   ?dry=1                                   — skip Resend call; still logs candidates
 *   CRON_REGISTRATION_STALL_ENABLED=false    — instant kill switch (no redeploy)
 *
 * Register externally at cron-job.org. Daily at 14:00 UTC.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendRegistrationStallEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const HOURS = 3600 * 1000;
const DAYS = 24 * HOURS;

export async function GET(req: NextRequest) {
  if (process.env.CRON_REGISTRATION_STALL_ENABLED === "false") {
    return NextResponse.json({ status: "disabled", reason: "feature flag off" });
  }

  const secret = process.env.CRON_SECRET;
  if (secret && process.env.NODE_ENV !== "development") {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const dryRun = req.nextUrl.searchParams.get("dry") === "1";
  const now = new Date();
  const oldCutoff = new Date(now.getTime() - 14 * DAYS); // ignore older than 14d
  const graceCutoff = new Date(now.getTime() - 2 * HOURS); // require >= 2h old

  const candidates = await prisma.user.findMany({
    where: {
      emailVerified: { not: null },
      onboardingCompletedAt: null,
      createdAt: { gte: oldCutoff, lte: graceCutoff },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
    },
  });

  const sent: Array<{ email: string }> = [];
  const skipped: Array<{ email: string; reason: string }> = [];
  const errors: Array<{ email: string; error: string }> = [];

  for (const u of candidates) {
    try {
      const priorStall = await prisma.trialReengagement.findFirst({
        where: { userId: u.id, emailType: "registration_stall" },
        select: { id: true },
      });
      if (priorStall) {
        skipped.push({ email: u.email, reason: "already received registration_stall" });
        continue;
      }

      if (dryRun) {
        sent.push({ email: `${u.email} (DRY)` });
        continue;
      }

      await sendRegistrationStallEmail({
        email: u.email,
        firstName: u.firstName || "there",
      });

      await prisma.trialReengagement.create({
        data: {
          userId: u.id,
          emailType: "registration_stall",
          // No course picked yet — record a neutral placeholder.
          // Consumers of this table treat `course` as free-form metadata.
          course: "none",
          sentAt: now,
        },
      });

      sent.push({ email: u.email });
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
