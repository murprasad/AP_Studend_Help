/**
 * One-off: fire the onboarding-bounce re-engagement email to Adithya
 * Narayana (nadithya349@gmail.com), the 2026-04-18 signup who breezed
 * through onboarding in 17 seconds and never answered a question.
 *
 * This is the same logic as GET /api/cron/onboarding-bounce, but for
 * a single named user, runnable immediately without waiting for the
 * external cron to hit 14:00 UTC.
 *
 * Usage:
 *   node scripts/send-onboarding-bounce-adithya.mjs
 *
 * Requires: DATABASE_URL + RESEND_API_KEY in .env.
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env if keys not already present.
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.+)$/);
    if (!m) continue;
    const [, key, val] = m;
    if (!process.env[key]) process.env[key] = val.trim().replace(/^['"]|['"]$/g, "");
  }
}
loadEnv();

const EMAIL = "nadithya349@gmail.com";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@studentnest.ai";
const BASE_URL = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://studentnest.ai";

if (!RESEND_API_KEY) {
  console.error("RESEND_API_KEY is not set. Add it to .env and retry.");
  process.exit(1);
}

function humanCourseName(course) {
  return course
    .replace(/^(AP|SAT|ACT|CLEP|DSST)_/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildEmail(firstName, courseName) {
  const subject = `Your rough ${courseName} score is ready`;
  const dashboardUrl = `${BASE_URL}/dashboard?src=onboarding-bounce`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1865F2; margin: 0 0 12px 0; font-size: 22px;">Hi ${firstName},</h1>
      <p style="color: #334155; line-height: 1.6; margin: 0 0 20px 0; font-size: 15px;">
        You set up a ${courseName} plan but haven&apos;t answered a question yet. We&apos;ve still got a rough projected score for you based on your track &mdash; come see it. Takes 60 seconds to answer one question and sharpen it.
      </p>
      <a href="${dashboardUrl}" style="display: inline-block; background: #1865F2; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 8px 0 24px 0;">
        See my rough score
      </a>
      <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-top: 24px;">
        We only email once; unsubscribe anytime by replying.
      </p>
    </div>
  `.trim();
  return { subject, html };
}

async function sendResend(to, subject, html) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend ${res.status}: ${errText}`);
  }
  return await res.json();
}

const p = new PrismaClient();
try {
  const user = await p.user.findUnique({
    where: { email: EMAIL },
    select: {
      id: true,
      email: true,
      firstName: true,
      track: true,
      freeTrialCourse: true,
      onboardingCompletedAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    console.error(`User not found: ${EMAIL}`);
    process.exit(1);
  }

  console.log("=== USER ===");
  console.log(`  id:     ${user.id}`);
  console.log(`  name:   ${user.firstName}`);
  console.log(`  email:  ${user.email}`);
  console.log(`  track:  ${user.track}`);
  console.log(`  course: ${user.freeTrialCourse ?? "(none — falling back to track)"}`);
  console.log(`  onboardedAt: ${user.onboardingCompletedAt?.toISOString() ?? "null"}`);
  console.log(`  createdAt:   ${user.createdAt.toISOString()}`);

  // Sanity check: zero responses?
  const responseCount = await p.studentResponse.count({ where: { userId: user.id } });
  console.log(`  responses:   ${responseCount}`);
  if (responseCount > 0) {
    console.error(`ABORT: Adithya has ${responseCount} responses — cron logic would skip him. Refusing to force-send.`);
    process.exit(1);
  }

  // Dedup check.
  const prior = await p.trialReengagement.findFirst({
    where: { userId: user.id, emailType: "onboarding_bounce" },
    select: { id: true, sentAt: true },
  });
  if (prior) {
    console.error(`ABORT: Already sent onboarding_bounce email on ${prior.sentAt.toISOString()} (row id=${prior.id}).`);
    process.exit(1);
  }

  const course = user.freeTrialCourse ?? user.track?.toUpperCase() ?? "exam";
  const courseName = humanCourseName(course);
  const { subject, html } = buildEmail(user.firstName || "there", courseName);

  console.log("\n=== SENDING ===");
  console.log(`  to:      ${user.email}`);
  console.log(`  subject: ${subject}`);

  const resendResult = await sendResend(user.email, subject, html);
  console.log(`  Resend id: ${resendResult?.id ?? "(no id in response)"}`);

  const row = await p.trialReengagement.create({
    data: {
      userId: user.id,
      emailType: "onboarding_bounce",
      course,
      sentAt: new Date(),
    },
  });
  console.log(`  TrialReengagement row written: id=${row.id}, course=${row.course}, sentAt=${row.sentAt.toISOString()}`);

  console.log("\nDONE — send succeeded and dedup row written.");
} finally {
  await p.$disconnect();
}
