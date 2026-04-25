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
import { sendRegistrationStallEmail, sendRegistrationStallFollowupEmail } from "@/lib/email";

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
  // Pass 1 (Email 1): users 24h+ since signup, never onboarded, never emailed.
  // 24h matches the 2026-04-25 spec — was 2h previously which felt mid-
  // registration. The friendly "we saved your spot" tone presumes the user
  // had real intent + an inbox break, not that they were still typing.
  const pass1GraceCutoff = new Date(now.getTime() - 24 * HOURS);
  // Pass 2 (Email 2): users who got Email 1 ≥ 48h ago and STILL haven't
  // onboarded → 72h-since-signup follow-up. Capped at one followup per user.
  const pass2EmailedBefore = new Date(now.getTime() - 48 * HOURS);

  // ── Pass 1 — first 24h recovery email ────────────────────────────────────
  const pass1Candidates = await prisma.user.findMany({
    where: {
      emailVerified: { not: null },
      onboardingCompletedAt: null,
      createdAt: { gte: oldCutoff, lte: pass1GraceCutoff },
    },
    select: { id: true, email: true, firstName: true },
  });

  const sent: Array<{ email: string; pass: 1 | 2 }> = [];
  const skipped: Array<{ email: string; reason: string }> = [];
  const errors: Array<{ email: string; error: string }> = [];

  for (const u of pass1Candidates) {
    try {
      const priorStall = await prisma.trialReengagement.findFirst({
        where: { userId: u.id, emailType: "registration_stall" },
        select: { id: true },
      });
      if (priorStall) {
        skipped.push({ email: u.email, reason: "pass1: already sent" });
        continue;
      }

      if (dryRun) {
        sent.push({ email: `${u.email} (DRY)`, pass: 1 });
        continue;
      }

      await sendRegistrationStallEmail({ email: u.email, firstName: u.firstName || "there" });
      await prisma.trialReengagement.create({
        data: {
          userId: u.id,
          emailType: "registration_stall",
          course: "none",
          sentAt: now,
        },
      });
      sent.push({ email: u.email, pass: 1 });
    } catch (err) {
      errors.push({ email: u.email, error: err instanceof Error ? err.message : String(err) });
    }
  }

  // ── Pass 2 — 72h follow-up email (urgency-tone, AP-season aware) ─────────
  // Eligibility: got Email 1 at least 48h ago, never received Email 2,
  // STILL not onboarded. The 48h gap between sends is intentional — too
  // close together is spammy, too far apart loses momentum.
  const pass2Subjects = await prisma.trialReengagement.findMany({
    where: {
      emailType: "registration_stall",
      sentAt: { lte: pass2EmailedBefore },
    },
    select: { userId: true },
    take: 500,
  });

  for (const row of pass2Subjects) {
    try {
      const u = await prisma.user.findUnique({
        where: { id: row.userId },
        select: { id: true, email: true, firstName: true, onboardingCompletedAt: true },
      });
      if (!u) continue;
      if (u.onboardingCompletedAt) {
        skipped.push({ email: u.email, reason: "pass2: now onboarded — skip" });
        continue;
      }

      const priorFollowup = await prisma.trialReengagement.findFirst({
        where: { userId: u.id, emailType: "registration_stall_2" },
        select: { id: true },
      });
      if (priorFollowup) {
        skipped.push({ email: u.email, reason: "pass2: followup already sent" });
        continue;
      }

      if (dryRun) {
        sent.push({ email: `${u.email} (DRY)`, pass: 2 });
        continue;
      }

      await sendRegistrationStallFollowupEmail({ email: u.email, firstName: u.firstName || "there" });
      await prisma.trialReengagement.create({
        data: {
          userId: u.id,
          emailType: "registration_stall_2",
          course: "none",
          sentAt: now,
        },
      });
      sent.push({ email: u.email, pass: 2 });
    } catch (err) {
      errors.push({ email: row.userId, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({
    status: "ok",
    dryRun,
    pass1Candidates: pass1Candidates.length,
    pass2Subjects: pass2Subjects.length,
    sent: sent.length,
    skipped: skipped.length,
    errors: errors.length,
    sentDetail: sent,
    skippedDetail: skipped,
    errorsDetail: errors,
    timestamp: now.toISOString(),
  });
}
