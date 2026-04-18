import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export const runtime = "edge";

interface Body {
  email: string;
  course: string;
  courseName: string;
  scaledScore: number;
  family: "AP" | "SAT" | "ACT";
}

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;
}

function scaleMaxFor(family: "AP" | "SAT" | "ACT"): number {
  if (family === "AP") return 5;
  if (family === "SAT") return 1600;
  return 36;
}

function resultEmailHtml(opts: {
  courseName: string;
  family: "AP" | "SAT" | "ACT";
  scaledScore: number;
  course: string;
}): string {
  const { courseName, family, scaledScore, course } = opts;
  const max = scaleMaxFor(family);
  const appUrl =
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://studentnest.ai";
  const registerUrl = `${appUrl}/register?course=${encodeURIComponent(course)}&from=am-i-ready-email`;
  return `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #0f172a;">
    <h1 style="color: #1865F2; margin: 0 0 8px 0;">Your ${courseName} readiness result</h1>
    <p style="color: #475569; margin: 0 0 24px 0;">Here's your estimated ${family} score and a free 7-day plan to close the gap.</p>

    <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 16px 0;">
      <p style="margin: 0; color: #64748b; font-size: 13px;">Est. ${family} Score</p>
      <p style="margin: 4px 0 0 0; font-size: 36px; font-weight: 700; color: #1865F2;">${scaledScore}${max === 5 ? "/5" : ` / ${max}`}</p>
    </div>

    <h2 style="font-size: 18px; margin: 24px 0 8px 0;">Your free 7-day study plan</h2>
    <ol style="color: #334155; line-height: 1.6; padding-left: 20px;">
      <li><strong>Day 1 — Diagnose:</strong> Take the full 25-question diagnostic to pin down your weakest unit.</li>
      <li><strong>Days 2-3 — Attack your weakest unit:</strong> 20 questions/day with AI feedback on every wrong answer.</li>
      <li><strong>Day 4 — Mixed practice:</strong> 30 questions across all units to rebuild confidence.</li>
      <li><strong>Day 5 — Trap recovery:</strong> Retry the traps (questions students commonly miss).</li>
      <li><strong>Day 6 — Mini mock:</strong> 15-question timed section to test endurance.</li>
      <li><strong>Day 7 — Full mock:</strong> Full-length timed mock exam. You'll see a new projected score.</li>
    </ol>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${registerUrl}" style="display: inline-block; background: #1865F2; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Start my free 7-day plan
      </a>
      <p style="color: #64748b; font-size: 12px; margin: 8px 0 0 0;">No credit card. Takes 30 seconds.</p>
    </div>

    <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
      The projected score is a directional estimate based on a short preview quiz — not a guaranteed ${family} score. To unsubscribe, reply with "unsubscribe".
    </p>
  </div>
  `;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const { email, course, courseName, scaledScore, family } = body;
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!course || !courseName || typeof scaledScore !== "number") {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (family !== "AP" && family !== "SAT" && family !== "ACT") {
    return NextResponse.json({ error: "invalid_family" }, { status: 400 });
  }

  const now = new Date();
  let emailedAt: Date | null = null;

  try {
    await sendEmail(
      email.toLowerCase(),
      `Your ${courseName} readiness result + free 7-day plan`,
      resultEmailHtml({ courseName, family, scaledScore, course }),
    );
    emailedAt = now;
  } catch (err) {
    console.error("[am-i-ready-save] email send failed", err);
  }

  try {
    await prisma.amIReadyLead.create({
      data: {
        email: email.toLowerCase(),
        course,
        family,
        scaledScore,
        courseName,
        emailedAt,
      },
    });
  } catch (err) {
    console.error("[am-i-ready-save] lead insert failed", err);
  }

  return NextResponse.json({ ok: true, emailed: emailedAt !== null });
}
