"use client";

/**
 * AutoLaunchNudge — gentle modal for the "Nawal pattern".
 *
 * Targets students who've loaded the dashboard 2+ times today without
 * answering any practice question. Rather than a silent redirect (which
 * feels pushy and removes agency), shows a dismissible modal asking if
 * they want a 3-question warmup.
 *
 * Signal source: /api/auto-launch-check (fires on dashboard mount).
 * Dismissal: sessionStorage flag so dismissal persists for the tab
 * session but re-surfaces if the user opens a new tab later that day
 * without practicing.
 *
 * Renders null most of the time — by design. The bar for interrupting a
 * student with a modal should be high.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, X } from "lucide-react";

const DISMISS_KEY = "auto_launch_nudge_dismissed_today";

interface Props {
  course: string;
}

export function AutoLaunchNudge({ course }: Props) {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if the user dismissed it today. Key includes YYYY-MM-DD so
    // dismissal naturally resets overnight.
    const today = new Date().toISOString().slice(0, 10);
    try {
      const dismissed = sessionStorage.getItem(DISMISS_KEY);
      if (dismissed === today) return;
    } catch {
      /* sessionStorage unavailable — still check the API */
    }

    let cancelled = false;
    fetch("/api/auto-launch-check", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.shouldNudge === true) setShow(true);
      })
      .catch(() => { /* silent — the nudge is enhancement */ });
    return () => { cancelled = true; };
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      sessionStorage.setItem(DISMISS_KEY, today);
    } catch { /* non-blocking */ }
    setShow(false);
  };

  const accept = () => {
    dismiss();
    router.push(`/practice?mode=focused&count=3&src=auto_warmup&course=${course}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auto-launch-title"
    >
      <Card className="max-w-md w-full rounded-2xl border border-primary/30 shadow-2xl">
        <CardContent className="p-6 space-y-4 relative">
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p id="auto-launch-title" className="text-[17px] font-bold leading-tight">
                Start with a 3-question warmup?
              </p>
              <p className="text-[13px] text-muted-foreground mt-1.5">
                You&apos;ve opened the dashboard a few times today. Get your
                score moving with a quick warmup — takes about a minute.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={accept} className="flex-1 h-11 rounded-full">
              Start warmup →
            </Button>
            <Button onClick={dismiss} variant="ghost" className="h-11 rounded-full">
              Not now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
