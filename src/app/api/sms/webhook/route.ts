/**
 * POST /api/sms/webhook
 *
 * Twilio messaging webhook. Configure on the Twilio phone number's
 * Messaging Service so inbound SMS posts here. Handles:
 *  - STOP / UNSUBSCRIBE / CANCEL / END / QUIT → set smsOptedOutAt
 *  - START / YES → re-opt-in (clear smsOptedOutAt + set smsOptedInAt)
 *  - HELP / INFO → reply with a one-liner pointing to support
 *
 * Twilio posts form-encoded: From, To, Body, MessageSid, etc.
 *
 * Twilio recommends signature validation but we accept the trade-off of
 * not validating in v1 — webhook URL is the only auth and the worst
 * case is a forged opt-out (low-impact). Sign validation can land later
 * if we see abuse.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STOP_WORDS = new Set(["STOP", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "STOPALL"]);
const START_WORDS = new Set(["START", "UNSTOP", "YES"]);
const HELP_WORDS = new Set(["HELP", "INFO"]);

function twimlReply(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response><Message>${message}</Message></Response>`;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const from = String(form.get("From") ?? "").trim();
  const bodyRaw = String(form.get("Body") ?? "").trim();
  const keyword = bodyRaw.toUpperCase();

  if (!from) return new NextResponse("", { status: 200 });

  const user = await prisma.user.findFirst({ where: { phoneNumber: from }, select: { id: true } });

  if (STOP_WORDS.has(keyword)) {
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { smsOptedOutAt: new Date(), smsOptedInAt: null },
      });
    }
    // Twilio auto-sends a default STOP reply, so an empty TwiML response is fine.
    return new NextResponse(twimlReply("You're unsubscribed. Reply START to opt back in."), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (START_WORDS.has(keyword)) {
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { smsOptedInAt: new Date(), smsOptedOutAt: null },
      });
    }
    return new NextResponse(twimlReply("Welcome back. We'll text occasional practice reminders. Reply STOP to leave."), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (HELP_WORDS.has(keyword)) {
    return new NextResponse(twimlReply("StudentNest practice reminders. Email contact@studentnest.ai for help. Reply STOP to unsubscribe."), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  return new NextResponse("", { status: 200 });
}
