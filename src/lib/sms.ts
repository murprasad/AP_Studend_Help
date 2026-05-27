/**
 * SMS channel via Twilio REST API.
 *
 * Uses plain fetch — Twilio Node SDK is not CF Workers-safe and matches
 * the project ban on AI SDKs in src/lib/ai-providers.ts.
 *
 * Required env vars (set in Cloudflare Pages → Environment):
 *   TWILIO_ACCOUNT_SID         — starts AC...
 *   TWILIO_AUTH_TOKEN          — Account auth token
 *   TWILIO_FROM_NUMBER         — E.164 sender (e.g. +18885551234)
 *   TWILIO_VERIFY_SERVICE_SID  — optional, starts VA... for Verify API
 *
 * Opt-in/out: writes smsOptedInAt at verification, smsOptedOutAt when
 * Twilio webhook receives STOP. sendSmsToUser refuses to send to
 * unverified or opted-out users.
 */

import { prisma } from "@/lib/prisma";

interface SmsPayload {
  body: string;
}

interface SendResult {
  sent: boolean;
  reason?: string;
  twilioSid?: string;
}

function envOrNull(name: string): string | null {
  const v = process.env[name];
  return v && v.length > 0 ? v : null;
}

export function smsConfigured(): boolean {
  return !!(envOrNull("TWILIO_ACCOUNT_SID") && envOrNull("TWILIO_AUTH_TOKEN") && envOrNull("TWILIO_FROM_NUMBER"));
}

export function verifyConfigured(): boolean {
  return !!(envOrNull("TWILIO_ACCOUNT_SID") && envOrNull("TWILIO_AUTH_TOKEN") && envOrNull("TWILIO_VERIFY_SERVICE_SID"));
}

function basicAuth(): string {
  const sid = envOrNull("TWILIO_ACCOUNT_SID")!;
  const token = envOrNull("TWILIO_AUTH_TOKEN")!;
  return "Basic " + btoa(`${sid}:${token}`);
}

/**
 * Send a one-off SMS by user id. Best-effort: returns sent=false on
 * any precondition fail (no phone, not verified, opted out, no config).
 */
export async function sendSmsToUser(userId: string, payload: SmsPayload): Promise<SendResult> {
  if (!smsConfigured()) return { sent: false, reason: "twilio_not_configured" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phoneNumber: true, phoneVerifiedAt: true, smsOptedInAt: true, smsOptedOutAt: true },
  });
  if (!user) return { sent: false, reason: "user_not_found" };
  if (!user.phoneNumber) return { sent: false, reason: "no_phone" };
  if (!user.phoneVerifiedAt) return { sent: false, reason: "phone_unverified" };
  if (!user.smsOptedInAt) return { sent: false, reason: "not_opted_in" };
  if (user.smsOptedOutAt) return { sent: false, reason: "opted_out" };

  const sid = envOrNull("TWILIO_ACCOUNT_SID")!;
  const from = envOrNull("TWILIO_FROM_NUMBER")!;

  const body = new URLSearchParams({
    From: from,
    To: user.phoneNumber,
    Body: payload.body,
  });

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: basicAuth(), "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json().catch(() => ({}))) as { sid?: string; code?: number; message?: string };
    if (!res.ok) {
      // Auto-opt-out on Twilio "STOP" / "blocked" error codes:
      // 21610 = recipient unsubscribed, 21614 = invalid recipient, 21408 = permission denied
      const errCode = data?.code ?? 0;
      if (errCode === 21610 || errCode === 21614 || errCode === 21408) {
        await prisma.user.update({
          where: { id: userId },
          data: { smsOptedOutAt: new Date() },
        }).catch(() => {});
      }
      return { sent: false, reason: `twilio_${res.status}_${errCode}` };
    }
    return { sent: true, twilioSid: data?.sid };
  } catch (e) {
    return { sent: false, reason: `error_${e instanceof Error ? e.message : String(e)}` };
  }
}

/**
 * Start phone verification — sends a 6-digit code via Twilio Verify.
 * Returns { ok: true } on success or { ok: false, reason } on fail.
 */
export async function startPhoneVerification(phoneE164: string): Promise<{ ok: boolean; reason?: string }> {
  if (!verifyConfigured()) return { ok: false, reason: "verify_not_configured" };
  const serviceSid = envOrNull("TWILIO_VERIFY_SERVICE_SID")!;

  const body = new URLSearchParams({ To: phoneE164, Channel: "sms" });
  const res = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`, {
    method: "POST",
    headers: { Authorization: basicAuth(), "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { code?: number; message?: string };
    return { ok: false, reason: `twilio_${res.status}_${data?.code ?? 0}` };
  }
  return { ok: true };
}

/**
 * Check the 6-digit code the user typed. Returns true on match.
 */
export async function checkPhoneVerification(phoneE164: string, code: string): Promise<boolean> {
  if (!verifyConfigured()) return false;
  const serviceSid = envOrNull("TWILIO_VERIFY_SERVICE_SID")!;

  const body = new URLSearchParams({ To: phoneE164, Code: code });
  const res = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`, {
    method: "POST",
    headers: { Authorization: basicAuth(), "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return false;
  const data = (await res.json().catch(() => ({}))) as { status?: string };
  return data?.status === "approved";
}

/**
 * Normalise raw user-entered phone to E.164 (US assumed if no country
 * code present). Returns null if too short to be plausible.
 */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return null;
}
