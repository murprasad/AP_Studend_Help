/**
 * GET /api/cron/weekly-progress-digest
 *
 * Weekly retention email. Fires every Sunday evening via cron-job.org.
 * Sends a personalized digest to each student who's been active in the
 * last 14 days (more permissive than "past week" so we catch borderline
 * lapses and pull them back).
 *
 * Digest content: sessions this week, Qs answered, accuracy, streak,
 * weakest unit, CTA back to dashboard. At $9.99/mo, this is the primary
 * anti-cancel lever for paying users — parents see visible progress and
 * keep the subscription, students see momentum and come back.
 *
 * Protected by CRON_SECRET Bearer auth (matches other /api/cron/* routes).
 * ?dry=1 skips the actual Resend call for debugging.
 * Set CRON_WEEKLY_DIGEST_ENABLED=false to instantly disable.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const ENABLED = (process.env.CRON_WEEKLY_DIGEST_ENABLED ?? "true") !== "false";
const ACTIVE_WINDOW_DAYS = 14;

function pct(n: number, d: number): number {
  if (d === 0) return 0;
  return Math.round((100 * n) / d);
}

function friendlyDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

interface PerUserDigest {
  userId: string;
  email: string;
  firstName: string;
  sessionsThisWeek: number;
  qsAnswered: number;
  qsCorrect: number;
  accuracy: number;
  streakDays: number;
  weakestUnitName: string | null;
  course: string;
  prevWeekAccuracy: number | null;
}

function buildHtml(d: PerUserDigest): string {
  const improved = d.prevWeekAccuracy !== null && d.accuracy > d.prevWeekAccuracy;
  const delta = d.prevWeekAccuracy !== null ? d.accuracy - d.prevWeekAccuracy : null;
  const courseLabel = d.course.replace(/_/g, " ");

  return `<!doctype html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <div style="border-bottom: 3px solid #f59e0b; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="margin: 0; font-size: 22px; color: #1a1a1a;">Your week on StudentNest</h1>
    <p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">${courseLabel} · ${friendlyDate(new Date())}</p>
  </div>

  <p style="font-size: 16px;">Hi ${d.firstName},</p>

  <p style="font-size: 15px; line-height: 1.5;">
    Here's what you did this week:
  </p>

  <div style="background: #fff8ed; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
    <div style="font-size: 15px; line-height: 1.9;">
      <strong>${d.sessionsThisWeek}</strong> practice session${d.sessionsThisWeek === 1 ? "" : "s"}<br>
      <strong>${d.qsAnswered}</strong> questions answered (${d.accuracy}% correct)<br>
      <strong>${d.streakDays}</strong>-day streak 🔥
    </div>
  </div>

  ${improved && delta !== null ? `
    <p style="font-size: 15px; color: #059669;">
      📈 <strong>You improved ${delta} percentage point${delta === 1 ? "" : "s"}</strong> from last week. Keep it going.
    </p>
  ` : d.prevWeekAccuracy !== null && delta !== null && delta < 0 ? `
    <p style="font-size: 15px; color: #666;">
      Your accuracy dipped ${Math.abs(delta)}pp this week. One bad day doesn't define your trajectory — get back in tomorrow.
    </p>
  ` : ""}

  ${d.weakestUnitName ? `
    <p style="font-size: 15px; line-height: 1.5;">
      <strong>Focus next:</strong> ${d.weakestUnitName}. This is your biggest gap — fixing it moves your projected score the most.
    </p>
  ` : ""}

  <div style="margin: 32px 0;">
    <a href="https://studentnest.ai/dashboard"
       style="display: inline-block; background: #f59e0b; color: #1a1a1a; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
      Continue your pass plan →
    </a>
  </div>

  <hr style="border: 0; border-top: 1px solid #e5e5e5; margin: 32px 0;">

  <p style="font-size: 12px; color: #888; line-height: 1.5;">
    You're getting this because you practiced on StudentNest recently. We send one digest a week, Sundays.
    <br><br>
    <a href="https://studentnest.ai/settings?unsubscribe=weekly-digest" style="color: #888;">Unsubscribe from weekly digests</a>
  </p>
</body>
</html>`;
}

async function buildDigestForUser(userId: string, windowStart: Date): Promise<PerUserDigest | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      streakDays: true,
      dailyQuizOptIn: true,
    },
  });
  if (!user?.email || !user.firstName) return null;

  // Pick most-active course this week as the context
  const weekSessions = await prisma.practiceSession.findMany({
    where: { userId, startedAt: { gte: windowStart } },
    select: { course: true, correctAnswers: true, totalQuestions: true },
  });

  if (weekSessions.length === 0) return null;

  const courseMap = new Map<string, number>();
  for (const s of weekSessions) courseMap.set(s.course, (courseMap.get(s.course) ?? 0) + 1);
  const course = Array.from(courseMap.entries()).sort((a, b) => b[1] - a[1])[0][0];

  // Metrics for the selected course
  const courseSessions = weekSessions.filter((s) => s.course === course);
  const qsAnswered = courseSessions.reduce((s, x) => s + (x.totalQuestions ?? 0), 0);
  const qsCorrect = courseSessions.reduce((s, x) => s + (x.correctAnswers ?? 0), 0);
  const accuracy = pct(qsCorrect, qsAnswered);

  // Prev week accuracy for delta
  const prevWindowStart = new Date(windowStart.getTime() - 7 * 24 * 3600 * 1000);
  const prevSessions = await prisma.practiceSession.findMany({
    where: { userId, course: course as never, startedAt: { gte: prevWindowStart, lt: windowStart } },
    select: { correctAnswers: true, totalQuestions: true },
  });
  const prevAnswered = prevSessions.reduce((s, x) => s + (x.totalQuestions ?? 0), 0);
  const prevCorrect = prevSessions.reduce((s, x) => s + (x.correctAnswers ?? 0), 0);
  const prevWeekAccuracy = prevAnswered > 0 ? pct(prevCorrect, prevAnswered) : null;

  // Weakest unit from MasteryScore
  const mastery = await prisma.masteryScore.findMany({
    where: { userId, course: course as never },
    orderBy: { masteryScore: "asc" },
    take: 1,
  });
  const weakestUnitName = mastery[0] ? String(mastery[0].unit).replace(/^[A-Z]+_\d+_/, "").replace(/_/g, " ") : null;

  return {
    userId,
    email: user.email,
    firstName: user.firstName,
    sessionsThisWeek: courseSessions.length,
    qsAnswered,
    qsCorrect,
    accuracy,
    streakDays: user.streakDays ?? 0,
    weakestUnitName,
    course,
    prevWeekAccuracy,
  };
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ENABLED) {
    return NextResponse.json({ sent: 0, skipped: true, reason: "disabled_via_env" });
  }

  const dryRun = new URL(req.url).searchParams.get("dry") === "1";

  const windowStart = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 24 * 3600 * 1000);

  // Active users = anyone who started a practice session in the last 14d
  const activeSessions = await prisma.practiceSession.findMany({
    where: { startedAt: { gte: windowStart } },
    select: { userId: true },
    distinct: ["userId"],
  });

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const { userId } of activeSessions) {
    try {
      const digest = await buildDigestForUser(userId, new Date(Date.now() - 7 * 24 * 3600 * 1000));
      if (!digest) { skipped++; continue; }

      if (dryRun) { sent++; continue; }

      const html = buildHtml(digest);
      await sendEmail(
        digest.email,
        `${digest.firstName}, your week on StudentNest`,
        html,
      );
      sent++;
    } catch (e) {
      errors.push(`${userId}: ${(e as Error).message.slice(0, 80)}`);
    }
  }

  return NextResponse.json({
    sent,
    skipped,
    errors,
    dryRun,
    windowDays: ACTIVE_WINDOW_DAYS,
  });
}
