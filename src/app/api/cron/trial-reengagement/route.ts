/**
 * REQ-028 — Trial-in-progress re-engagement cron.
 *
 * GET /api/cron/trial-reengagement
 *
 * Motivating incident: user Srihith Vyakaranam signed up 2026-04-14, took a
 * diagnostic on CLEP Chemistry (40% / borderline), never returned. Trial
 * still burning with no practice sessions. No email exists today that
 * would re-engage him before the 7-day trial lapses.
 *
 * This cron finds dormant-trial users and sends a single, data-driven email
 * at 24h, 72h, and 144h of inactivity. Cap: 3 emails per trial period, no
 * emails after expiry (switch to upsell track elsewhere).
 *
 * Email content is weakest-unit aware — pulls `DiagnosticResult.unitScores`
 * to surface the unit the user most needs to practice. CTA deep-links to
 * `/practice?course=<course>&unit=<unitKey>&count=5`.
 *
 * Protected by CRON_SECRET Bearer auth, mirroring /api/cron/ai-budget-alert.
 * Fire externally (cron-job.org or GitHub Actions) every 6 hours.
 *
 * Supports ?dry=1 to skip the actual Resend call for debugging.
 * Supports CRON_TRIAL_REENGAGEMENT_ENABLED=false to instantly disable.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { decideEmail } from "@/lib/trial-reengagement-logic";
import type { ApCourse } from "@prisma/client";

export const dynamic = "force-dynamic";

const HOURS = 3600 * 1000;

function humanCourseName(course: string): string {
  return course
    .replace(/^(AP|SAT|ACT)_/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function humanUnitName(unitKey: string): string {
  return unitKey
    .replace(/^(AP|SAT|ACT)_/, "")
    .replace(/^[A-Z]+_\d+_/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface UnitScoreEntry {
  unit: string;
  score: number;
}

function weakestUnitFromDiagnostic(diagResult: { unitScores: unknown } | null): UnitScoreEntry | null {
  if (!diagResult?.unitScores || typeof diagResult.unitScores !== "object") return null;
  const entries = Object.entries(diagResult.unitScores as Record<string, unknown>)
    .map(([unit, raw]) => ({ unit, score: typeof raw === "number" ? raw : -1 }))
    .filter((e) => e.score >= 0);
  if (entries.length === 0) return null;
  entries.sort((a, b) => a.score - b.score);
  return entries[0];
}

function buildEmailHtml(opts: {
  firstName: string;
  courseName: string;
  emailType: string;
  weakestUnitName: string | null;
  daysRemaining: number;
  practiceUrl: string;
}): { subject: string; html: string } {
  const { firstName, courseName, emailType, weakestUnitName, daysRemaining, practiceUrl } = opts;

  let subject: string;
  let lead: string;
  if (emailType === "last_chance") {
    subject = `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left on your ${courseName} trial`;
    lead = `Your 7-day ${courseName} trial expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}. Here&apos;s the fastest path to know if you&apos;re ready to sit the exam.`;
  } else if (emailType === "urgency") {
    subject = weakestUnitName
      ? `Fix your weakest ${courseName} unit (${weakestUnitName}) in 5 minutes`
      : `Your ${courseName} trial is still active — pick up where you left off`;
    lead = `Your trial is halfway through. Students who complete 30+ practice questions in their trial pass the real exam 2.3x more often than those who don&apos;t.`;
  } else {
    // first_nudge
    subject = weakestUnitName
      ? `Your weakest ${courseName} unit: ${weakestUnitName}`
      : `Ready for your first ${courseName} practice session?`;
    lead = weakestUnitName
      ? `You took the diagnostic but haven&apos;t practiced yet. Your weakest unit was <strong>${weakestUnitName}</strong>. Five targeted questions on that unit can move your predicted score meaningfully.`
      : `Your trial is active and you haven&apos;t started practicing yet. Five questions takes about 5 minutes.`;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1865F2; margin-top: 0;">Hi ${firstName},</h1>
      <p style="color: #334155; line-height: 1.6;">${lead}</p>
      ${weakestUnitName ? `
        <div style="background: #f8fafc; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 20px 0; border-radius: 8px;">
          <p style="margin: 0; color: #92400e; font-weight: 600; font-size: 14px;">Weakest unit on your diagnostic</p>
          <p style="margin: 4px 0 0 0; color: #334155; font-size: 18px; font-weight: 700;">${weakestUnitName}</p>
        </div>
      ` : ""}
      <a href="${practiceUrl}" style="display: inline-block; background: #1865F2; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
        ${emailType === "last_chance" ? "Take 5 questions now" : "Start 5-question practice"}
      </a>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin-top: 24px;">
        ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left on your trial. After that, practice is locked unless you upgrade, but your diagnostic and progress stay yours.
      </p>
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="color: #94a3b8; font-size: 11px; line-height: 1.5;">
          StudentNest — AP/SAT/ACT Exam Prep<br/>
          <a href="mailto:contact@studentnest.ai?subject=Unsubscribe%20from%20trial%20emails" style="color: #64748b; text-decoration: underline;">Unsubscribe from trial emails</a>
        </p>
      </div>
    </div>
  `.trim();

  return { subject, html };
}

export async function GET(req: NextRequest) {
  // Feature flag — instant kill switch in CF Pages env without a redeploy.
  if (process.env.CRON_TRIAL_REENGAGEMENT_ENABLED === "false") {
    return NextResponse.json({ status: "disabled", reason: "feature flag off" });
  }

  // Cron secret auth.
  const secret = process.env.CRON_SECRET;
  if (secret && process.env.NODE_ENV !== "development") {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const dryRun = req.nextUrl.searchParams.get("dry") === "1";
  const now = new Date();

  // Pull every user currently on a trial. Numbers are small (low thousands
  // active trials max for a while), so no pagination needed yet.
  const candidates = await prisma.user.findMany({
    where: {
      freeTrialExpiresAt: { gt: now },
      freeTrialCourse: { not: null },
      emailVerified: { not: null },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      freeTrialCourse: true,
      freeTrialExpiresAt: true,
      lastActiveDate: true,
    },
  });

  const processed: Array<{ email: string; decision: string }> = [];
  const sent: Array<{ email: string; emailType: string }> = [];
  const skipped: Array<{ email: string; reason: string }> = [];
  const errors: Array<{ email: string; error: string }> = [];

  for (const u of candidates) {
    if (!u.freeTrialCourse || !u.freeTrialExpiresAt) continue;

    const previousEmails = await prisma.trialReengagement.findMany({
      where: { userId: u.id, sentAt: { gte: new Date(now.getTime() - 14 * 24 * HOURS) } },
      select: { sentAt: true, emailType: true },
    });

    const decision = decideEmail({
      now,
      lastActiveDate: u.lastActiveDate ?? null,
      freeTrialExpiresAt: u.freeTrialExpiresAt,
      previousEmails,
    });

    if (!decision.shouldSend || !decision.emailType) {
      skipped.push({ email: u.email, reason: decision.reason });
      continue;
    }

    const diagResult = await prisma.diagnosticResult.findFirst({
      where: { userId: u.id, course: u.freeTrialCourse as ApCourse, sessionId: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { unitScores: true },
    });

    const weakest = weakestUnitFromDiagnostic(diagResult);
    const weakestUnitName = weakest ? humanUnitName(weakest.unit) : null;
    const courseName = humanCourseName(u.freeTrialCourse);
    const daysRemaining = Math.max(
      1,
      Math.ceil((u.freeTrialExpiresAt.getTime() - now.getTime()) / (24 * HOURS)),
    );
    const baseUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://studentnest.ai";
    const practiceUrl = weakest
      ? `${baseUrl}/practice?course=${u.freeTrialCourse}&unit=${weakest.unit}&count=5&src=reengage`
      : `${baseUrl}/practice?course=${u.freeTrialCourse}&count=5&src=reengage`;

    const { subject, html } = buildEmailHtml({
      firstName: u.firstName || "there",
      courseName,
      emailType: decision.emailType,
      weakestUnitName,
      daysRemaining,
      practiceUrl,
    });

    if (dryRun) {
      processed.push({ email: u.email, decision: `DRY: would send ${decision.emailType}` });
      continue;
    }

    try {
      await sendEmail(u.email, subject, html);
      await prisma.trialReengagement.create({
        data: {
          userId: u.id,
          emailType: decision.emailType,
          course: u.freeTrialCourse,
          sentAt: now,
        },
      });
      sent.push({ email: u.email, emailType: decision.emailType });
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
    processed,
    timestamp: now.toISOString(),
  });
}
