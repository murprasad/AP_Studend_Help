/**
 * FEATURE #53 — Post-fail recovery email cron.
 *
 * GET /api/cron/post-fail-recovery
 *
 * Sister cron to /api/cron/free-user-reengagement and
 * /api/cron/trial-reengagement. Targets users who recently "bombed" a
 * completed session (low correct ratio) and never heard from us about it.
 * Sends ONE warm "that was a tough set — here's how to bounce back" email.
 *
 * Motivating cohort (2026-06-03 conversion drop-off analysis): 5 of 7
 * PrepLion signups dropped immediately after a bad diagnostic. Neither SN
 * nor PL emails users who bomb a session — they leave and never return.
 *
 * Criteria:
 *   - emailVerified IS NOT NULL
 *   - Has a COMPLETED PracticeSession in the last RECENT_WINDOW_DAYS days
 *     with score < BOMB_SCORE_THRESHOLD (%) AND totalQuestions >= MIN_QS
 *     (skip trivially-short sessions where one miss tanks the ratio)
 *   - Hasn't already received the "post_fail_recovery" email
 *
 * Email content references the bombed course + a calibrating, no-shame
 * framing + a 5-question "bounce back" CTA on that course.
 *
 * Protected by CRON_SECRET Bearer auth, mirroring the sibling crons.
 * Fire externally (cron-job.org or GitHub Actions) every ~6 hours.
 *
 * Supports ?dry=1 to log candidates without sending.
 * Supports CRON_POST_FAIL_RECOVERY_ENABLED=false to instantly disable.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ⚠️ DEFAULT-DISABLED — READ BEFORE ENABLING (idempotency note)
 * ─────────────────────────────────────────────────────────────────────────
 * The PO spec requires PER-INCIDENT idempotency (never re-email for the
 * SAME bombed session). The cleanest marker for that is a per-incident
 * stamp — e.g. a `postFailEmailSentAt DateTime?` column on PracticeSession
 * (or a `sessionId` column on TrialReengagement). NEITHER exists in the
 * current schema, and this task must NOT invent a migration.
 *
 * Until a per-incident marker column ships, this cron dedups PER-USER via a
 * TrialReengagement row with emailType="post_fail_recovery" — i.e. a user
 * gets AT MOST ONE post-fail recovery email, ever. That is safe (never
 * spams) but coarser than per-incident (a user who bombs again months later
 * won't be re-contacted).
 *
 * Because the requested per-incident guarantee is not yet fully achievable,
 * this cron DEFAULTS TO DISABLED: it only runs when the operator explicitly
 * sets CRON_POST_FAIL_RECOVERY_ENABLED="true" in the environment. Any other
 * value (unset, "false", anything else) returns {status:"disabled"} without
 * touching the DB or sending mail.
 *
 * To enable per-incident behavior later:
 *   1. Add `postFailEmailSentAt DateTime?` to PracticeSession in
 *      prisma/schema.prisma + migrate.
 *   2. Filter candidate sessions on `postFailEmailSentAt: null` and stamp it
 *      on send instead of (or in addition to) the per-user TrialReengagement
 *      row.
 *   3. Flip the default-enabled logic below if desired.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";

// Node runtime — Prisma WASM raw SQL / Neon HTTP adapter break under edge.
export const dynamic = "force-dynamic";

const HOURS = 3600 * 1000;
const RECENT_WINDOW_DAYS = 3;
const BOMB_SCORE_THRESHOLD = 40; // score is 0-100 (accuracy %) on the session row
const MIN_QS = 4; // ignore very short sessions where one miss tanks the ratio
const DEDUP_EMAIL_TYPE = "post_fail_recovery";

function humanCourseName(course: string | null | undefined): string {
  if (!course) return "your exam";
  return course
    .replace(/^(AP|SAT|ACT|PSAT|CLEP|DSST|ACCUPLACER)_/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildEmailHtml(opts: {
  firstName: string;
  courseName: string;
  practiceUrl: string;
}): { subject: string; html: string } {
  const { firstName, courseName, practiceUrl } = opts;
  const subject = `That ${courseName} set was a tough one — here's how to bounce back`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1865F2; margin-top: 0;">Hi ${firstName},</h1>
      <p style="color: #334155; line-height: 1.6;">
        Your last ${courseName} set didn&apos;t go the way you wanted &mdash; and that&apos;s
        completely okay. A rough set is information, not a verdict. It just shows us exactly
        where to aim next.
      </p>
      <p style="color: #334155; line-height: 1.6;">
        <strong>Here&apos;s the bounce-back plan:</strong> a short, 5-question set calibrated to
        where you actually are right now. No timer, no pressure &mdash; just a clean reset.
        Most students climb fastest right after a tough session, because the gaps are fresh.
      </p>
      <a href="${practiceUrl}" style="display: inline-block; background: #1865F2; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
        Start my bounce-back set
      </a>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin-top: 24px;">
        One tough set says nothing about your final score. The students who improve the most
        are the ones who come back the day after a bad set &mdash; not the ones who never have one.
      </p>
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="color: #94a3b8; font-size: 11px; line-height: 1.5;">
          StudentNest — AP/SAT/ACT Exam Prep<br/>
          <a href="mailto:contact@studentnest.ai?subject=Unsubscribe%20from%20recovery%20emails" style="color: #64748b; text-decoration: underline;">Unsubscribe</a>
        </p>
      </div>
    </div>
  `.trim();
  return { subject, html };
}

export async function GET(req: NextRequest) {
  // Kill-switch — DEFAULTS TO DISABLED. Only runs when explicitly enabled.
  // See the per-incident idempotency note in the file header for why.
  if (process.env.CRON_POST_FAIL_RECOVERY_ENABLED !== "true") {
    return NextResponse.json({
      status: "disabled",
      reason:
        "CRON_POST_FAIL_RECOVERY_ENABLED is not \"true\" — cron defaults DISABLED pending a per-incident marker column (see route header).",
    });
  }

  // Cron secret auth — identical shape to sibling crons.
  const secret = process.env.CRON_SECRET;
  if (secret && process.env.NODE_ENV !== "development") {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const dryRun = req.nextUrl.searchParams.get("dry") === "1";
  const now = new Date();
  const windowStart = new Date(now.getTime() - RECENT_WINDOW_DAYS * 24 * HOURS);

  // Find bombed sessions in the recent window. Numbers are small enough that
  // a single findMany is fine; we take the most recent bombed session per
  // user below. Single read — no transaction (Neon HTTP constraint).
  const bombedSessions = await prisma.practiceSession.findMany({
    where: {
      status: "COMPLETED",
      completedAt: { gte: windowStart, lte: now },
      totalQuestions: { gte: MIN_QS },
      score: { lt: BOMB_SCORE_THRESHOLD },
      user: { emailVerified: { not: null } },
    },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      course: true,
      score: true,
      totalQuestions: true,
      completedAt: true,
      userId: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
        },
      },
    },
  });

  // Collapse to the single most-recent bombed session per user (the list is
  // already sorted completedAt DESC, so the first occurrence wins).
  const seenUsers = new Set<string>();
  const perUser: typeof bombedSessions = [];
  for (const s of bombedSessions) {
    if (seenUsers.has(s.userId)) continue;
    seenUsers.add(s.userId);
    perUser.push(s);
  }

  const sent: Array<{ email: string; course: string; score: number | null }> = [];
  const skipped: Array<{ email: string; reason: string }> = [];
  const errors: Array<{ email: string; error: string }> = [];

  for (const s of perUser) {
    const u = s.user;
    if (!u?.email) {
      skipped.push({ email: "(no email)", reason: "missing user/email" });
      continue;
    }

    // Per-user dedup (best available without a per-incident column).
    const existing = await prisma.trialReengagement.findFirst({
      where: { userId: u.id, emailType: DEDUP_EMAIL_TYPE },
    });
    if (existing) {
      skipped.push({ email: u.email, reason: "already sent post-fail recovery" });
      continue;
    }

    const courseName = humanCourseName(s.course);
    const baseUrl =
      process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://studentnest.ai";
    const practiceUrl = `${baseUrl}/practice?course=${s.course}&count=5&src=post-fail-recovery`;
    const { subject, html } = buildEmailHtml({
      firstName: u.firstName || "there",
      courseName,
      practiceUrl,
    });

    if (dryRun) {
      sent.push({ email: u.email, course: s.course, score: s.score });
      continue;
    }

    try {
      await sendEmail(u.email, subject, html);
      // Best-effort native push — failures never block the email path.
      await sendPushToUser(u.id, {
        title: `That ${courseName} set was tough — here's the bounce-back`,
        body: "A short 5-question reset, calibrated to where you are right now.",
        url: practiceUrl,
        tag: DEDUP_EMAIL_TYPE,
      }).catch(() => {});
      // Stamp the per-user dedup marker. Single create — no transaction.
      await prisma.trialReengagement.create({
        data: {
          userId: u.id,
          emailType: DEDUP_EMAIL_TYPE,
          course: s.course,
          sentAt: now,
        },
      });
      sent.push({ email: u.email, course: s.course, score: s.score });
    } catch (err) {
      errors.push({
        email: u.email,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    status: "ok",
    dryRun,
    candidates: perUser.length,
    sent: sent.length,
    skipped: skipped.length,
    errors: errors.length,
    sentDetail: sent,
    skippedDetail: skipped,
    errorsDetail: errors,
    timestamp: now.toISOString(),
  });
}
