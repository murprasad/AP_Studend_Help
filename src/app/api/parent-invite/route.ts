/**
 * POST /api/parent-invite
 * Body: { parentEmail: string, parentName?: string }
 *
 * Student-triggered flow: student hits a paywall, clicks "Ask parent to
 * upgrade," enters their parent's email. We send the parent a personalized
 * email containing the student's actual progress + a checkout link.
 *
 * The email is the conversion mechanic — it transforms an abstract upgrade
 * ask into a concrete "here's what your kid is doing and here's what
 * unlocking gets them" pitch. Anchored at $9.99/mo.
 *
 * Builds on existing progress aggregation (MasteryScore, PracticeSession).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import type { ApCourse } from "@prisma/client";

export const dynamic = "force-dynamic";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function pct(n: number, d: number): number {
  if (d === 0) return 0;
  return Math.round((100 * n) / d);
}

function validEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function buildParentEmail(opts: {
  parentName?: string;
  studentName: string;
  courseLabel: string;
  sessionsLast14d: number;
  qsAnswered: number;
  accuracy: number;
  weakestUnitName: string | null;
  checkoutUrl: string;
}): string {
  const {
    parentName, studentName, courseLabel, sessionsLast14d,
    qsAnswered, accuracy, weakestUnitName, checkoutUrl,
  } = opts;
  const hi = parentName ? `Hi ${escapeHtml(parentName)},` : `Hi there,`;

  return `<!doctype html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <div style="border-bottom: 3px solid #f59e0b; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="margin: 0; font-size: 22px;">${escapeHtml(studentName)} is practicing on StudentNest</h1>
    <p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">${escapeHtml(courseLabel)}</p>
  </div>

  <p style="font-size: 16px;">${hi}</p>

  <p style="font-size: 15px; line-height: 1.5;">
    ${escapeHtml(studentName)} has been practicing <strong>${escapeHtml(courseLabel)}</strong> on StudentNest.
    Here's what ${escapeHtml(studentName)} has done in the last two weeks:
  </p>

  <div style="background: #fff8ed; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
    <div style="font-size: 15px; line-height: 1.9;">
      <strong>${sessionsLast14d}</strong> practice session${sessionsLast14d === 1 ? "" : "s"}<br>
      <strong>${qsAnswered}</strong> questions answered (${accuracy}% accuracy)
      ${weakestUnitName ? `<br><strong>Currently working on:</strong> ${escapeHtml(weakestUnitName)}` : ""}
    </div>
  </div>

  <p style="font-size: 15px; line-height: 1.6;">
    ${escapeHtml(studentName)} has hit the free-tier limit and wants to keep going. Unlock unlimited practice for <strong>$9.99/month</strong> — about <strong>33¢ a day</strong>, less than one specialty coffee a month.
  </p>

  <ul style="font-size: 14px; line-height: 1.8; padding-left: 20px;">
    <li>Unlimited practice across AP, SAT, ACT</li>
    <li>Every question reviewed against College Board's Course &amp; Exam Description</li>
    <li>Weekly progress email (like this one) so you can see ${escapeHtml(studentName)}'s momentum</li>
    <li>Cancel anytime — one click, no phone calls</li>
  </ul>

  <div style="margin: 32px 0; text-align: center;">
    <a href="${escapeHtml(checkoutUrl)}"
       style="display: inline-block; background: #f59e0b; color: #1a1a1a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
      Unlock ${escapeHtml(studentName)}'s practice — $9.99/mo
    </a>
    <p style="font-size: 12px; color: #888; margin-top: 8px;">Starts with a 14-day free trial. Cancel anytime.</p>
  </div>

  <hr style="border: 0; border-top: 1px solid #e5e5e5; margin: 32px 0;">

  <p style="font-size: 12px; color: #888; line-height: 1.5;">
    ${escapeHtml(studentName)} shared this email with us so you could see their progress.
    We don't store it for anything else. Questions? Reply to this email.
  </p>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parentEmail = String(body.parentEmail || "").trim().toLowerCase();
  const parentName = body.parentName ? String(body.parentName).trim().slice(0, 60) : undefined;

  if (!validEmail(parentEmail)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  // Anti-abuse: 1 invite per student per 24h (prevents spamming anyone).
  // We reuse trialReengagements table as a lightweight audit log since it
  // already has userId+sentAt — less good than a proper table but ships
  // today with zero migration.
  const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000);
  const recent = await prisma.trialReengagement.count({
    where: {
      userId: session.user.id,
      sentAt: { gte: oneDayAgo },
      // Hack: we co-opt a reengagement row with a sentinel course name
      course: "PARENT_INVITE",
    },
  }).catch(() => 0);
  if (recent >= 1) {
    return NextResponse.json({ error: "rate_limited", message: "You can send one parent invite per day." }, { status: 429 });
  }

  // Gather student progress for the email.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true },
  });
  if (!user?.firstName) {
    return NextResponse.json({ error: "profile_incomplete" }, { status: 400 });
  }

  const windowStart = new Date(Date.now() - 14 * 24 * 3600 * 1000);
  const sessions = await prisma.practiceSession.findMany({
    where: { userId: session.user.id, startedAt: { gte: windowStart } },
    select: { course: true, correctAnswers: true, totalQuestions: true },
  });

  // Pick the most-practiced course as context
  const courseMap = new Map<string, number>();
  for (const s of sessions) courseMap.set(s.course, (courseMap.get(s.course) ?? 0) + 1);
  const course = Array.from(courseMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "AP_WORLD_HISTORY";
  const courseLabel = course.replace(/_/g, " ");

  const courseSessions = sessions.filter((s) => s.course === course);
  const qsAnswered = courseSessions.reduce((s, x) => s + (x.totalQuestions ?? 0), 0);
  const qsCorrect = courseSessions.reduce((s, x) => s + (x.correctAnswers ?? 0), 0);
  const accuracy = pct(qsCorrect, qsAnswered);

  // Weakest unit name
  const mastery = await prisma.masteryScore.findMany({
    where: { userId: session.user.id, course: course as never },
    orderBy: { masteryScore: "asc" },
    take: 1,
  });
  const weakestUnitName = mastery[0]
    ? String(mastery[0].unit).replace(/^[A-Z]+_\d+_/, "").replace(/_/g, " ")
    : null;

  const checkoutUrl = `https://studentnest.ai/pricing?ref=parent-invite&student=${encodeURIComponent(session.user.id)}`;

  const html = buildParentEmail({
    parentName,
    studentName: user.firstName,
    courseLabel,
    sessionsLast14d: courseSessions.length,
    qsAnswered,
    accuracy,
    weakestUnitName,
    checkoutUrl,
  });

  try {
    await sendEmail(
      parentEmail,
      `${user.firstName} is practicing on StudentNest — unlock unlimited for $9.99/mo`,
      html,
    );
  } catch (e) {
    console.error("[parent-invite] send failed", e);
    return NextResponse.json({ error: "email_send_failed" }, { status: 500 });
  }

  // Audit log (best-effort — don't block response)
  prisma.trialReengagement.create({
    data: {
      userId: session.user.id,
      course: "PARENT_INVITE",
      emailType: "parent_invite",
      sentAt: new Date(),
    },
  }).catch(() => { /* ignore */ });

  return NextResponse.json({ ok: true, sent: true, maskedEmail: parentEmail.replace(/^(.{2}).*(@.*)$/, "$1***$2") });
}
