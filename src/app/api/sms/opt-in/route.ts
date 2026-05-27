/**
 * POST /api/sms/opt-in
 *
 * Body: { phoneNumber: string }
 *
 * Saves the phone number on the user (no opt-in yet — that happens
 * after they confirm the code) and sends a 6-digit verification code
 * via Twilio Verify. Idempotent — re-posting starts a new code.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalisePhone, startPhoneVerification, verifyConfigured } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!verifyConfigured()) {
    return NextResponse.json({ error: "Twilio Verify not configured" }, { status: 503 });
  }
  const body = (await req.json().catch(() => null)) as { phoneNumber?: string } | null;
  const raw = body?.phoneNumber;
  if (!raw || typeof raw !== "string") {
    return NextResponse.json({ error: "phoneNumber required" }, { status: 400 });
  }
  const phone = normalisePhone(raw);
  if (!phone) {
    return NextResponse.json({ error: "Invalid phone format" }, { status: 400 });
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { phoneNumber: phone, phoneVerifiedAt: null, smsOptedInAt: null, smsOptedOutAt: null },
  });
  const result = await startPhoneVerification(phone);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason ?? "send_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, phone });
}
