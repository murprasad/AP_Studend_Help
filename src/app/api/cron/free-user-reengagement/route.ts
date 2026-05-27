/**
 * Free-tier dropped-off re-engagement cron.
 *
 * GET /api/cron/free-user-reengagement
 *
 * Sister cron to /api/cron/trial-reengagement. Targets FREE-tier users
 * who completed onboarding but bounced within an hour and haven't come
 * back. Sends one email at +24h after signup.
 *
 * Motivating user: Shria Gaddam (gaddamshria@gmail.com) 2026-05-27 —
 * verified email → onboarded → did 4 sessions in 3 min including a 0/8
 * diagnostic → left → no re-engagement path exists for free users.
 *
 * Criteria:
 *   - emailVerified IS NOT NULL
 *   - onboardingCompletedAt IS NOT NULL
 *   - NOT on a trial (freeTrialExpiresAt IS NULL OR < now)
 *   - lastActiveDate < onboardingCompletedAt + 1 hr (bounced fast)
 *   - createdAt between 23-48 hours ago (send at ~24h)
 *   - Hasn't already received "free_first_nudge" type
 *
 * Email content references their selected course + offers a 3-Q quick win.
 *
 * Protected by CRON_SECRET. Fire externally every 6 hours via
 * cron-job.org or GitHub Actions.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const HOURS = 3600 * 1000;
const NUDGE_WINDOW_MIN_HOURS = 23;
const NUDGE_WINDOW_MAX_HOURS = 48;
const BOUNCE_THRESHOLD_HOURS = 1;

function humanCourseName(course: string | null | undefined): string {
  if (!course) return "your exam";
  return course
    .replace(/^(CLEP|DSST|ACCUPLACER)_/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildEmailHtml(opts: { firstName: string; courseName: string; practiceUrl: string }): {
  subject: string;
  html: string;
} {
  const { firstName, courseName, practiceUrl } = opts;
  const subject = `Hey ${firstName} — your ${courseName} baseline is ready`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1865F2; margin-top: 0;">Hi ${firstName},</h1>
      <p style="color: #334155; line-height: 1.6;">
        You started exploring ${courseName} on StudentNest yesterday. We saved your progress.
      </p>
      <p style="color: #334155; line-height: 1.6;">
        <strong>3 questions, 60 seconds.</strong> See where you stand now vs. yesterday — most
        students improve 15-20 points after their first real practice session.
      </p>
      <a href="${practiceUrl}" style="display: inline-block; background: #1865F2; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
        Pick up where you left off
      </a>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin-top: 24px;">
        First sessions can feel like a wall. That's normal — the diagnostic is intentionally
        hard so we can map your gaps. The real practice is calibrated to where you are.
      </p>
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="color: #94a3b8; font-size: 11px; line-height: 1.5;">
          PrepLion — AP &amp; SAT &amp; ACT Exam Prep<br/>
          <a href="mailto:contact@studentnest.ai?subject=Unsubscribe%20from%20re-engagement%20emails" style="color: #64748b; text-decoration: underline;">Unsubscribe</a>
        </p>
      </div>
    </div>
  `.trim();
  return { subject, html };
}

export async function GET(req: NextRequest) {
  if (process.env.CRON_FREE_REENGAGEMENT_ENABLED === "false") {
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
  const windowStart = new Date(now.getTime() - NUDGE_WINDOW_MAX_HOURS * HOURS);
  const windowEnd = new Date(now.getTime() - NUDGE_WINDOW_MIN_HOURS * HOURS);

  // Targets: free users signed up 23-48 hr ago who bounced within 1 hr.
  const candidates = await prisma.user.findMany({
    where: {
      emailVerified: { not: null },
      onboardingCompletedAt: { not: null },
      createdAt: { gte: windowStart, lte: windowEnd },
      // not currently on an active trial
      OR: [
        { freeTrialExpiresAt: null },
        { freeTrialExpiresAt: { lt: now } },
      ],
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      track: true,
      lastActiveDate: true,
      onboardingCompletedAt: true,
      createdAt: true,
      practiceSessions: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { course: true },
      },
    },
  });

  const sent: Array<{ email: string }> = [];
  const skipped: Array<{ email: string; reason: string }> = [];
  const errors: Array<{ email: string; error: string }> = [];

  for (const u of candidates) {
    // Did they bounce fast? lastActiveDate - onboardingCompletedAt < 1 hr.
    const onboardedAt = u.onboardingCompletedAt!;
    const lastActive = u.lastActiveDate ?? onboardedAt;
    const minutesActive = (lastActive.getTime() - onboardedAt.getTime()) / 60000;
    if (minutesActive > BOUNCE_THRESHOLD_HOURS * 60) {
      skipped.push({ email: u.email, reason: `active ${Math.round(minutesActive)}min after onboarding — not a bounce` });
      continue;
    }

    // Already sent the free-tier nudge?
    const existing = await prisma.trialReengagement.findFirst({
      where: { userId: u.id, emailType: "free_first_nudge" },
    });
    if (existing) {
      skipped.push({ email: u.email, reason: "already nudged" });
      continue;
    }

    const inferredCourse = u.practiceSessions[0]?.course ?? null;
    const courseName = humanCourseName(inferredCourse);
    const baseUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://studentnest.ai";
    const courseQuery = inferredCourse ? `?course=${inferredCourse}&count=3&src=free-reengage` : "?count=3&src=free-reengage";
    const practiceUrl = `${baseUrl}/practice${courseQuery}`;
    const { subject, html } = buildEmailHtml({
      firstName: u.firstName || "there",
      courseName,
      practiceUrl,
    });

    if (dryRun) {
      sent.push({ email: u.email });
      continue;
    }

    try {
      await sendEmail(u.email, subject, html);
      await prisma.trialReengagement.create({
        data: {
          userId: u.id,
          emailType: "free_first_nudge",
          course: (inferredCourse ?? "AP_BIOLOGY") as never, // placeholder when no sessions yet
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
