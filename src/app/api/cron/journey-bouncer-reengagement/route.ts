/**
 * Pre-onboarding bouncer re-engagement cron.
 *
 * GET /api/cron/journey-bouncer-reengagement
 *
 * 2026-05-28 — sister to /api/cron/free-user-reengagement.
 *
 * The free re-engagement cron targets "completed onboarding then bounced"
 * users (the Shria pattern). This cron covers the OTHER pre-conversion
 * cohort: students who signed up, STARTED the journey, but never
 * finished it (no onboardingCompletedAt). Dev Ya hit this pattern today
 * (signed up, picked SAT_MATH on Step 0, bailed before completing Step 1
 * MCQ, then tried a 3-Q practice and quit on Q1).
 *
 * Criteria:
 *   - emailVerified IS NOT NULL
 *   - onboardingCompletedAt IS NULL (never finished journey)
 *   - UserJourney row exists with currentStep IN (0, 1, 2) (= actually
 *     started the journey, vs never opening it)
 *   - createdAt between 23-48 hours ago (send at ~24h)
 *   - Hasn't already received "journey_bouncer_nudge"
 *
 * Email content: course-aware, references the step they were on, offers
 * a 60-second alternative entry point (3-Q warmup) instead of pushing
 * them back into the same journey screen they bounced from.
 *
 * Protected by CRON_SECRET. Fire every 6h on the same cron-job.org
 * schedule as the sister crons.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

const HOURS = 3600 * 1000;
const NUDGE_WINDOW_MIN_HOURS = 23;
const NUDGE_WINDOW_MAX_HOURS = 48;

function humanCourseName(course: string | null | undefined): string {
  if (!course) return "your exam";
  return course
    .replace(/^(AP|SAT|ACT|PSAT|CLEP|DSST)_/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildEmailHtml(opts: {
  firstName: string;
  courseName: string;
  examFamily: string;
  practiceUrl: string;
  journeyUrl: string;
}): { subject: string; html: string } {
  const { firstName, courseName, examFamily, practiceUrl, journeyUrl } = opts;
  const subject = `Hey ${firstName} — your ${courseName} diagnostic is 5 minutes away`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1865F2; margin-top: 0;">Hi ${firstName},</h1>
      <p style="color: #334155; line-height: 1.6;">
        You started picking your ${examFamily} prep yesterday and didn't finish. No pressure — most students need
        two passes to commit to an exam.
      </p>
      <p style="color: #334155; line-height: 1.6;">
        Two ways to pick up where you left off:
      </p>
      <p style="color: #334155; line-height: 1.6;">
        <a href="${practiceUrl}" style="display: inline-block; background: #1865F2; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 8px 0;">
          Try 3 questions (60 sec)
        </a>
      </p>
      <p style="color: #334155; line-height: 1.6;">
        <a href="${journeyUrl}" style="display: inline-block; background: transparent; color: #1865F2; padding: 8px 0; text-decoration: underline; font-weight: 600;">
          Or finish the full diagnostic (~10 min)
        </a>
      </p>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin-top: 24px;">
        The 3-Q warmup is the fastest way to see if the prep loop matches how you study. The diagnostic is the
        most accurate score projection. Pick whichever fits your moment.
      </p>
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="color: #94a3b8; font-size: 11px; line-height: 1.5;">
          StudentNest — AP &amp; SAT &amp; ACT Exam Prep<br/>
          <a href="mailto:contact@studentnest.ai?subject=Unsubscribe%20from%20re-engagement%20emails" style="color: #64748b; text-decoration: underline;">Unsubscribe</a>
        </p>
      </div>
    </div>
  `.trim();
  return { subject, html };
}

export async function GET(req: NextRequest) {
  if (process.env.CRON_JOURNEY_BOUNCER_ENABLED === "false") {
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

  // Targets: users signed up 23-48h ago who started the journey but
  // never finished. We join via UserJourney to filter for "actually
  // started" (currentStep > 0 means they at least left Step 0).
  const candidates = await prisma.user.findMany({
    where: {
      emailVerified: { not: null },
      onboardingCompletedAt: null,
      createdAt: { gte: windowStart, lte: windowEnd },
      // 2026-05-28 — also catch explicit-exit bouncers (currentStep=99 is
      // the marker UserJourney uses for "user clicked Exit"). Emily LaFemina
      // hit this: completed Step 1, hit Exit, currentStep flipped 1→99.
      // The earlier cron would have skipped her. The exitAt IS NOT NULL
      // arm covers any future exit-marker convention change.
      userJourney: {
        OR: [
          { currentStep: { in: [0, 1, 2] } },
          { exitAt: { not: null } },
        ],
      },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      userJourney: { select: { course: true, currentStep: true } },
    },
  });

  const sent: Array<{ email: string }> = [];
  const skipped: Array<{ email: string; reason: string }> = [];
  const errors: Array<{ email: string; error: string }> = [];

  for (const u of candidates) {
    const existing = await prisma.trialReengagement.findFirst({
      where: { userId: u.id, emailType: "journey_bouncer_nudge" },
    });
    if (existing) {
      skipped.push({ email: u.email, reason: "already nudged" });
      continue;
    }

    const course = u.userJourney?.course ?? null;
    const courseName = humanCourseName(course);
    const family = course?.split("_")[0] ?? "AP";
    const baseUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://studentnest.ai";
    const practiceUrl = course
      ? `${baseUrl}/practice?course=${course}&count=3&src=journey-bouncer`
      : `${baseUrl}/practice?count=3&src=journey-bouncer`;
    const journeyUrl = `${baseUrl}/journey?src=journey-bouncer`;

    const { subject, html } = buildEmailHtml({
      firstName: u.firstName || "there",
      courseName,
      examFamily: family,
      practiceUrl,
      journeyUrl,
    });

    if (dryRun) {
      sent.push({ email: u.email });
      continue;
    }

    try {
      await sendEmail(u.email, subject, html);
      await sendPushToUser(u.id, {
        title: subject,
        body: "3 questions, 60 seconds. See if the loop fits how you study.",
        url: practiceUrl,
        tag: "journey_bouncer_nudge",
      }).catch(() => {});
      await prisma.trialReengagement.create({
        data: {
          userId: u.id,
          emailType: "journey_bouncer_nudge",
          course: (course ?? "AP_BIOLOGY") as never,
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
