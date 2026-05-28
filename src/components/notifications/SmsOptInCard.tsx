"use client";

/**
 * Phone + SMS opt-in card. Two-step:
 *  1. User types phone → POST /api/sms/opt-in (server sends code)
 *  2. User types 6-digit code → POST /api/sms/verify (server confirms)
 *
 * Lives next to PushPermissionBanner. Self-hides on `dismissed` /
 * `verified` flag in localStorage so it doesn't nag.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "studentnest.sms.dismissed";

export function SmsOptInCard() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // 2026-05-27 — Default OFF until owner flips NEXT_PUBLIC_NOTIFICATIONS_ENABLED=true.
    // Prevents the card showing in prod before Twilio env vars are configured.
    if (process.env.NEXT_PUBLIC_NOTIFICATIONS_ENABLED !== "true") return;
    // 2026-05-28 — Separate SMS-only gate. Owner explicitly deferred SMS
    // (doesn't want to own a Twilio number), so the card stays hidden even
    // when push is enabled. Flip NEXT_PUBLIC_SMS_ENABLED=true if/when
    // Twilio gets wired.
    if (process.env.NEXT_PUBLIC_SMS_ENABLED !== "true") return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    // Defer 30s so it doesn't fire alongside the push opt-in on first
    // dashboard load — back-to-back permission asks bury conversion.
    const t = setTimeout(() => setShow(true), 30000);
    return () => clearTimeout(t);
  }, []);

  async function handleSendCode() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/sms/opt-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }
      setStep("code");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send code");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/sms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }
      localStorage.setItem(DISMISS_KEY, "verified");
      setShow(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wrong code");
    } finally {
      setBusy(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "dismissed");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm rounded-xl border border-border bg-card p-4 shadow-lg">
      <p className="font-semibold text-sm">Text reminders?</p>
      <p className="mt-1 text-xs text-muted-foreground">
        We&apos;ll text you a 60-second nudge when your weakest unit is ready. Reply STOP anytime.
      </p>
      {step === "phone" ? (
        <div className="mt-3 flex flex-col gap-2">
          <input
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={busy}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSendCode} disabled={busy || phone.replace(/\D/g, "").length < 10}>
              {busy ? "Sending..." : "Send code"}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss} disabled={busy}>
              Not now
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={busy}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleVerify} disabled={busy || code.replace(/\D/g, "").length < 4}>
              {busy ? "Checking..." : "Verify"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setStep("phone")} disabled={busy}>
              Change phone
            </Button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
