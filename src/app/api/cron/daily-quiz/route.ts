/**
 * Daily Quiz Email — cron.
 *
 * GET /api/cron/daily-quiz
 *
 * Goal: at 07:30 UTC every day, for each opted-in user, ship an email
 * with 3 questions that PULL them back into the app:
 *   1. Weak-area question (lowest-mastery unit, MEDIUM)
 *   2. Confidence booster  (unit with >=80% accuracy, MEDIUM)
 *   3. Trap question       (globally trappy HARD: <35% correct, >=5 attempts)
 *
 * Crucially the email does NOT render the MCQ options. It teases the
 * question stem and hands each one a deep-link into /practice with an
 * emailToken seed for attribution:
 *   https://studentnest.ai/practice?src=daily-email&q={qid}&seed={token}
 *
 * Protected by CRON_SECRET Bearer auth, mirroring the trial-reengagement
 * cron. Fire externally (cron-job.org or GH Actions) once a day at 07:30 UTC.
 *
 * Flags:
 *   ?dry=1                              — skip Resend call, still logs
 *   CRON_DAILY_QUIZ_ENABLED=false       — kill switch (no redeploy needed)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { selectDailyQuestions } from "@/lib/daily-quiz-logic";
import type { ApCourse, Question } from "@prisma/client";

export const dynamic = "force-dynamic";

function humanCourseName(course: string): string {
  return course
    .replace(/^(AP|SAT|ACT|CLEP|DSST)_/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Trim stem to a teaser length. We explicitly DO NOT include the options
// array — clicking the button is the only way to see them. That's the
// entire "pull them back" thesis of this feature.
function teaseQuestion(q: Question): string {
  const raw = (q.questionText ?? "").trim();
  if (raw.length <= 220) return escapeHtml(raw);
  return escapeHtml(raw.slice(0, 217)) + "&hellip;";
}

function buildPracticeUrl(baseUrl: string, questionId: string, emailToken: string): string {
  const params = new URLSearchParams({
    src: "daily-email",
    q: questionId,
    seed: emailToken,
  });
  return `${baseUrl}/practice?${params.toString()}`;
}

function buildPixelUrl(baseUrl: string, emailToken: string): string {
  const params = new URLSearchParams({ t: emailToken, event: "open" });
  return `${baseUrl}/api/daily-quiz-track?${params.toString()}`;
}

function buildEmailHtml(opts: {
  firstName: string;
  courseName: string;
  baseUrl: string;
  emailToken: string;
  weak: Question;
  booster: Question;
  trap: Question;
}): { subject: string; html: string } {
  const { firstName, courseName, baseUrl, emailToken, weak, booster, trap } = opts;

  const subject = `Your 3 ${courseName} questions for today`;

  const rows: Array<{ label: string; tint: string; q: Question; cta: string }> = [
    { label: "Your weak spot", tint: "#fef3c7", q: weak,    cta: "Answer now" },
    { label: "Quick win",      tint: "#dcfce7", q: booster, cta: "Try it" },
    { label: "The trap",       tint: "#fee2e2", q: trap,    cta: "Outsmart it" },
  ];

  const rowsHtml = rows.map((r) => {
    const url = buildPracticeUrl(baseUrl, r.q.id, emailToken);
    return `
      <div style="background: ${r.tint}; border-radius: 12px; padding: 18px 20px; margin: 14px 0;">
        <p style="margin: 0 0 6px 0; color: #475569; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${r.label}</p>
        <p style="margin: 0 0 14px 0; color: #0f172a; font-size: 15px; line-height: 1.5;">${teaseQuestion(r.q)}</p>
        <a href="${url}" style="display: inline-block; background: #1865F2; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">${r.cta}</a>
      </div>
    `;
  }).join("");

  const pixelUrl = buildPixelUrl(baseUrl, emailToken);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1865F2; margin: 0 0 8px 0; font-size: 22px;">Morning, ${escapeHtml(firstName)}.</h1>
      <p style="color: #334155; line-height: 1.6; margin: 0 0 8px 0;">Three ${escapeHtml(courseName)} questions, hand-picked for you this morning. Each one takes about 60 seconds.</p>
      ${rowsHtml}
      <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-top: 24px; text-align: center;">
        StudentNest Daily Quiz<br/>
        <a href="${baseUrl}/billing" style="color: #64748b; text-decoration: underline;">Turn off daily emails</a>
      </p>
      <img src="${pixelUrl}" width="1" height="1" alt="" style="display: block; width: 1px; height: 1px;" />
    </div>
  `.trim();

  return { subject, html };
}

// Pick the user's "active" course — the one with the most recent mastery
// update. Falls back to freeTrialCourse, then null.
async function resolveActiveCourse(userId: string, freeTrialCourse: string | null): Promise<string | null> {
  const latest = await prisma.masteryScore.findFirst({
    where: { userId, totalAttempts: { gt: 0 } },
    orderBy: { updatedAt: "desc" },
    select: { course: true },
  });
  if (latest?.course) return latest.course;
  return freeTrialCourse;
}

// Minimal crypto-safe UUID. `crypto.randomUUID` exists in Node 19+ and
// the Cloudflare Workers runtime — both of our targets.
function generateEmailToken(): string {
  return crypto.randomUUID();
}

export async function GET(req: NextRequest) {
  if (process.env.CRON_DAILY_QUIZ_ENABLED === "false") {
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
  const baseUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://studentnest.ai";

  const candidates = await prisma.user.findMany({
    where: {
      dailyQuizOptIn: true,
      emailVerified: { not: null },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      freeTrialCourse: true,
    },
  });

  const sent: Array<{ email: string; course: string }> = [];
  const skipped: Array<{ email: string; reason: string }> = [];
  const errors: Array<{ email: string; error: string }> = [];

  for (const u of candidates) {
    try {
      const course = await resolveActiveCourse(u.id, u.freeTrialCourse ?? null);
      if (!course) {
        skipped.push({ email: u.email, reason: "no active course (no mastery yet)" });
        continue;
      }

      const picks = await selectDailyQuestions(u.id, course, prisma);
      if (!picks) {
        skipped.push({ email: u.email, reason: "insufficient data or no eligible questions" });
        continue;
      }

      const emailToken = generateEmailToken();
      const { subject, html } = buildEmailHtml({
        firstName: u.firstName || "there",
        courseName: humanCourseName(course),
        baseUrl,
        emailToken,
        weak: picks.weak,
        booster: picks.booster,
        trap: picks.trap,
      });

      if (dryRun) {
        sent.push({ email: u.email, course: `${course} (DRY)` });
        continue;
      }

      await sendEmail(u.email, subject, html);

      // Only record the send after Resend confirms delivery — otherwise
      // the 30-day dedup window would eat questions we never actually shipped.
      await prisma.dailyQuizSend.create({
        data: {
          userId: u.id,
          course,
          emailToken,
          weakQuestionId: picks.weak.id,
          boosterQuestionId: picks.booster.id,
          trapQuestionId: picks.trap.id,
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

// Silence unused-import warning for ApCourse — the type is re-exported
// transitively through selectDailyQuestions and we want the module to
// compile even if tree-shaken.
export type _ApCourseRef = ApCourse;
