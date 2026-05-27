"use client";

/**
 * Push permission opt-in banner.
 *
 * Rendered conditionally (e.g. on dashboard) when:
 *  - Browser supports Notification + serviceWorker + PushManager
 *  - User hasn't already granted permission
 *  - User hasn't already dismissed the banner (localStorage flag)
 *
 * On accept: requests permission → calls pushManager.subscribe →
 * POSTs subscription to /api/push/subscribe.
 *
 * No external dependency — uses native browser APIs only.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "studentnest.push.dismissed";

function urlBase64ToUint8Array(b64: string): Uint8Array {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushPermissionBanner() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    setShow(true);
  }, []);

  async function handleEnable() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setShow(false);
        localStorage.setItem(DISMISS_KEY, "denied");
        return;
      }
      const keyRes = await fetch("/api/push/vapid-public-key");
      if (!keyRes.ok) throw new Error("VAPID key not configured");
      const { publicKey } = await keyRes.json();
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      const subscribeRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!subscribeRes.ok) throw new Error("Subscribe failed");
      setShow(false);
      localStorage.setItem(DISMISS_KEY, "subscribed");
    } catch (e) {
      console.error("Push subscribe failed:", e);
      setShow(false);
      localStorage.setItem(DISMISS_KEY, "error");
    } finally {
      setBusy(false);
    }
  }

  function handleDismiss() {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "dismissed");
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-border bg-card p-4 shadow-lg">
      <p className="font-semibold text-sm">Get a 5-second daily nudge?</p>
      <p className="mt-1 text-xs text-muted-foreground">
        We&apos;ll ping you when your weakest unit is ready for a quick win. No spam, easy to disable.
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={handleEnable} disabled={busy}>
          {busy ? "Enabling..." : "Yes, enable"}
        </Button>
        <Button size="sm" variant="ghost" onClick={handleDismiss} disabled={busy}>
          Not now
        </Button>
      </div>
    </div>
  );
}
