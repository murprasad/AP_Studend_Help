/**
 * LoginTipModal — Phase 4 user-feedback loop.
 *
 * Pops up on every login (per user 2026-05-09) showing a "Real Student Tip"
 * sourced from real test-taker reports. Reads from /api/tip?course=<x>.
 * Dismissable forever via "don't show again" preference (localStorage).
 *
 * Per project_feedback_loop_standard_spec.md.
 */
"use client";

import { useEffect, useState } from "react";

interface PopupTip {
  tip_id: string;
  text: string;
  source_attribution: string;
}

interface Props {
  course: string;
}

const STORAGE_KEY_DISABLE = "real_student_tip_disabled";
const STORAGE_KEY_SEEN = "real_student_tip_seen_v1";

export function LoginTipModal({ course }: Props) {
  const [tip, setTip] = useState<PopupTip | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Honor "don't show me tips" preference
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY_DISABLE) === "1") return;
    if (!course) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tip?course=${encodeURIComponent(course)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (!data?.tip) return;

        // 7-day-per-user dedup: don't show same tip_id within 7 days
        const seenStr = localStorage.getItem(STORAGE_KEY_SEEN) ?? "{}";
        let seen: Record<string, number> = {};
        try { seen = JSON.parse(seenStr); } catch { seen = {}; }
        const now = Date.now();
        const lastSeen = seen[data.tip.tip_id] ?? 0;
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
        if (now - lastSeen < SEVEN_DAYS) return;

        setTip(data.tip);
        setOpen(true);
        seen[data.tip.tip_id] = now;
        localStorage.setItem(STORAGE_KEY_SEEN, JSON.stringify(seen));
        // Fire-and-forget telemetry
        fetch("/api/tip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tip_id: data.tip.tip_id, action: "shown" }),
        }).catch(() => {});
      } catch {
        // silent
      }
    })();
    return () => { cancelled = true; };
  }, [course]);

  if (!open || !tip) return null;

  function dismiss() {
    setOpen(false);
    fetch("/api/tip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tip_id: tip!.tip_id, action: "dismissed" }),
    }).catch(() => {});
  }
  function dontShowAgain() {
    localStorage.setItem(STORAGE_KEY_DISABLE, "1");
    dismiss();
  }

  return (
    <div role="dialog" aria-labelledby="real-student-tip-title" className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 pointer-events-none">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-5 pointer-events-auto animate-in slide-in-from-bottom-4 fade-in">
        <div className="flex items-start justify-between mb-2">
          <h3 id="real-student-tip-title" className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="text-amber-500">★</span> Real Student Tip
          </h3>
          <button onClick={dismiss} aria-label="Close" className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
        </div>
        <p className="text-sm text-foreground mb-3">{tip.text}</p>
        <p className="text-xs text-muted-foreground mb-4">{tip.source_attribution}</p>
        <div className="flex justify-between items-center">
          <button onClick={dontShowAgain} className="text-xs text-muted-foreground hover:text-foreground underline">Don&apos;t show again</button>
          <button onClick={dismiss} className="text-sm font-medium px-3 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90">Got it</button>
        </div>
      </div>
    </div>
  );
}
