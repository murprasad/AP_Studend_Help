/**
 * POST /api/sms/verify
 *
 * Body: { code: string }
 *
 * Confirms the 6-digit code the user typed against Twilio Verify.
 * On success: sets phoneVerifiedAt + smsOptedInAt and clears
 * smsOptedOutAt. On failure: leaves the row untouched so the user
 * can retry.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPhoneVerification } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as { code?: string } | null;
  const code = body?.code?.replace(/\D/g, "");
  if (!code || code.length < 4 || code.length > 8) {
    return NextResponse.json({ error: "code required (4-8 digits)" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phoneNumber: true },
  });
  if (!user?.phoneNumber) {
    return NextResponse.json({ error: "No phone on file" }, { status: 400 });
  }
  const ok = await checkPhoneVerification(user.phoneNumber, code);
  if (!ok) {
    return NextResponse.json({ error: "code_invalid" }, { status: 400 });
  }
  const now = new Date();
  await prisma.user.update({
    where: { id: session.user.id },
    data: { phoneVerifiedAt: now, smsOptedInAt: now, smsOptedOutAt: null },
  });
  return NextResponse.json({ ok: true });
}
