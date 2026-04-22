"use client";

/**
 * TrialBanner — "X days left on your trial" banner.
 *
 * Renders only when:
 *   - user is on FREE tier
 *   - freeTrialExpiresAt is set and in the future
 *   - days remaining <= 3
 *
 * Intentionally non-dismissable — the whole point is a visible countdown.
 * Not a blocking gate; trial-expiry gating is a separate follow-up decision.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";

interface UserData {
  subscriptionTier?: string;
  freeTrialExpiresAt?: string | null;
  freeTrialCourse?: string | null;
}

function daysBetween(future: Date, now: Date): number {
  const ms = future.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 3600 * 1000)));
}

export function TrialBanner() {
  const [data, setData] = useState<UserData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.user) setData(d.user); })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, []);

  if (!data) return null;
  const { subscriptionTier, freeTrialExpiresAt } = data;
  if (subscriptionTier && subscriptionTier !== "FREE") return null;
  if (!freeTrialExpiresAt) return null;

  const expiry = new Date(freeTrialExpiresAt);
  if (Number.isNaN(expiry.getTime())) return null;

  const now = new Date();
  if (expiry <= now) return null; // already expired — handled elsewhere
  const days = daysBetween(expiry, now);
  if (days > 3) return null; // not urgent yet

  // Severity copy — different tone at 3d vs 1d.
  const isCritical = days <= 1;
  const headline = days === 1
    ? "Last day of your free trial"
    : `${days} days left on your free trial`;
  const sub = isCritical
    ? "Upgrade to keep your progress, pass plan, and unlimited practice."
    : "Upgrade any time before it ends to keep unlimited practice and your pass plan.";

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "mx-auto max-w-5xl w-full rounded-xl border px-4 py-2.5 mb-3 flex items-center gap-3",
        isCritical
          ? "border-red-500/40 bg-red-500/5 text-red-900 dark:text-red-200"
          : "border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200",
      ].join(" ")}
    >
      <Clock className={`h-4 w-4 flex-shrink-0 ${isCritical ? "text-red-500" : "text-amber-500"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight truncate">{headline}</p>
        <p className="text-[12px] text-muted-foreground leading-snug truncate">{sub}</p>
      </div>
      <Link
        href={`/billing?utm_source=trial_banner&utm_campaign=days_left_${days}`}
        className={[
          "flex-shrink-0 inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg",
          isCritical
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-amber-600 text-white hover:bg-amber-700",
        ].join(" ")}
      >
        Upgrade <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
