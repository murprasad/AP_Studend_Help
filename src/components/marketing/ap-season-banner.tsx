"use client";

/**
 * AP Season Urgency Banner — conversion lever for the May 5–16 AP exam window.
 *
 * Shipped 2026-04-25 in response to funnel analysis: only 4% of last-48
 * users became Premium (and both were comp grants). With AP exams 10–21
 * days away, classic "activation → retention → monetize" sequencing
 * doesn't apply — the customer lifecycle compresses to weeks.
 *
 * Behavior:
 *   - Renders only between SHOW_FROM (now-ish) and HIDE_AFTER (2026-05-17)
 *     — auto-hides post-AP-season so it doesn't become stale
 *   - Renders only on landing-style public surfaces (host page chooses)
 *   - Dismissible — sets sessionStorage flag so it doesn't re-show in the
 *     same session
 *   - Calendar-aware countdown: "AP exams in 12 days" recalculated client-side
 *
 * No external dep. Render with <APSeasonBanner /> in landing/marketing
 * layouts.
 *
 * Anti-patterns this avoids:
 *   - Discount spam (no % off)
 *   - Mid-trial card capture (free trial advertised as "no card")
 *   - Hiding the free tier (urgency about the time, not about the price)
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

// Hard calendar bounds — AP exam window per CB 2026 schedule. Update
// these annually OR drive from settings if you want a CMS knob.
const AP_EXAM_END = new Date("2026-05-17T00:00:00Z"); // banner hides after this
const SHOW_FROM = new Date("2026-04-15T00:00:00Z");   // banner shows from this

// Dismiss flag key (sessionStorage — clears on browser close).
const DISMISS_KEY = "ap_season_banner_dismissed";

function daysUntil(target: Date): number {
  const ms = target.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function APSeasonBanner() {
  const [visible, setVisible] = useState(false);
  const [days, setDays] = useState(0);

  useEffect(() => {
    const now = Date.now();
    if (now < SHOW_FROM.getTime() || now > AP_EXAM_END.getTime()) return;

    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "true") return;
    } catch { /* private mode — fall through */ }

    setDays(daysUntil(AP_EXAM_END));
    setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "true");
    } catch { /* ignore */ }
  }

  return (
    <div
      role="region"
      aria-label="AP exam season notice"
      className="relative bg-gradient-to-r from-blue-600 to-violet-600 text-white px-4 py-2.5 text-sm font-medium"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 flex-wrap pr-8">
        <span className="hidden sm:inline" aria-hidden="true">📅</span>
        <span>
          AP exams in <strong className="font-bold">{days} days</strong> —
        </span>
        <Link
          href="/register?track=ap&utm_source=apseason_banner&utm_campaign=spring_2026"
          className="underline underline-offset-2 decoration-white/70 hover:decoration-white font-semibold"
        >
          start free now
        </Link>
        <span className="hidden md:inline opacity-90">
          · personalized 14-day plan + mock exam preview, no card needed
        </span>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss AP season banner"
        className="absolute right-1 top-1/2 -translate-y-1/2 p-3 -m-1 rounded hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
