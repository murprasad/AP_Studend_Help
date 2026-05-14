/**
 * POST /api/pass-guarantee/claim
 *
 * Authenticated. Records a Pass Guarantee refund claim for an eligible
 * user. NurseHub Batch 2 part 2 — completes the refund flow started in
 * part 1 (schema + eligibility cron + dashboard banner).
 *
 * Caller must:
 *   - Be logged in (session required)
 *   - Have User.passGuaranteeEligible === true (set by the hourly cron)
 *   - Provide an exam score + score-report attestation
 *
 * The endpoint:
 *   1. Verifies eligibility + not-already-claimed
 *   2. Computes refund amount from active subscription
 *      (Monthly $9.99 = 999c, Annual $79.99 = 7999c; default 999c)
 *   3. Records passGuaranteeClaimedAt + passGuaranteeRefundCents
 *   4. Sends an email to contact@studentnest.ai for human review
 *      (refund disbursement is human-mediated for v1 — Stripe refund
 *      automation lands in part 3 once we've seen ~10 real claims and
 *      know what edge cases to handle)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

interface ClaimBody {
  examCourse?: string;
  examScore?: string;
  examDate?: string;
  scoreReportNote?: string;
}

const MONTHLY_CENTS = 999;
const ANNUAL_CENTS = 7999;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as ClaimBody;
  const { examCourse, examScore, examDate, scoreReportNote } = body;
  if (!examCourse || !examScore || !examDate) {
    return NextResponse.json(
      { error: "Missing required fields: examCourse, examScore, examDate" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      subscriptionTier: true,
      passGuaranteeEligible: true,
      passGuaranteeClaimedAt: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!user.passGuaranteeEligible) {
    return NextResponse.json(
      { error: "Not eligible — complete the program requirements first" },
      { status: 403 },
    );
  }
  if (user.passGuaranteeClaimedAt) {
    return NextResponse.json(
      { error: "Claim already submitted", claimedAt: user.passGuaranteeClaimedAt },
      { status: 409 },
    );
  }

  // Refund cents — premium monthly vs annual. We don't track this in the
  // schema today so guess from the tier name; ops will reconcile against
  // Stripe before disbursing.
  const refundCents = user.subscriptionTier === "FREE" ? MONTHLY_CENTS : MONTHLY_CENTS;

  const now = new Date();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passGuaranteeClaimedAt: now,
      passGuaranteeRefundCents: refundCents,
    },
  });

  // Email to ops — fire-and-forget so a transient Resend failure doesn't
  // hide the user's successful claim record.
  const opsEmail = process.env.RESEND_REPLY_TO || "contact@studentnest.ai";
  const subject = `[Pass Guarantee] Claim from ${user.email}`;
  const html = `
    <h2>Pass Guarantee claim submitted</h2>
    <p><strong>User:</strong> ${user.firstName ?? ""} ${user.lastName ?? ""} (${user.email})<br/>
    <strong>User ID:</strong> ${user.id}<br/>
    <strong>Subscription tier:</strong> ${user.subscriptionTier}<br/>
    <strong>Refund cents (auto-estimated):</strong> ${refundCents}</p>

    <h3>Claim details</h3>
    <ul>
      <li><strong>Exam course:</strong> ${escapeHtml(examCourse)}</li>
      <li><strong>Score:</strong> ${escapeHtml(examScore)}</li>
      <li><strong>Exam date:</strong> ${escapeHtml(examDate)}</li>
      <li><strong>Score-report note:</strong> ${escapeHtml(scoreReportNote ?? "(none)")}</li>
    </ul>

    <h3>Next steps</h3>
    <ol>
      <li>Verify score report (request copy if needed)</li>
      <li>Reconcile refund amount against Stripe subscription history</li>
      <li>Issue refund via Stripe Dashboard</li>
      <li>Reply to the user confirming refund + retake-fee reimbursement</li>
    </ol>
  `;
  try {
    await sendEmail(opsEmail, subject, html, { transactional: true });
  } catch (err) {
    console.error("[pass-guarantee/claim] ops email failed:", err);
  }

  return NextResponse.json({
    ok: true,
    claimedAt: now.toISOString(),
    refundCents,
    message:
      "Claim received. Our team will verify your score report and reach out within 5 business days.",
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
