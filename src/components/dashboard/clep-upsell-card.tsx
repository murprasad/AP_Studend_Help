"use client";

/**
 * CLEPUpsellCard — StudentNest → PrepLion cross-sell.
 *
 * Shown to engaged StudentNest students (≥ 10 lifetime sessions) who
 * aren't paid yet. Pitches CLEP as a way to earn real college credit —
 * adjacent to their AP/SAT/ACT practice mindset, different monetization.
 *
 * Renders null when:
 *   - User has < 10 sessions (not engaged enough; avoid early upsell)
 *   - User dismissed it already (localStorage flag)
 *   - User is already paid (don't pitch cross-sell to existing customers)
 *
 * Copy is CB-credit-focused ("skip a semester of tuition") not
 * product-focused — addresses why a parent/student cares about CLEP,
 * not what CLEP is.
 */

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, X, ExternalLink } from "lucide-react";

const DISMISSED_KEY = "clep_upsell_dismissed";
const MIN_SESSIONS_THRESHOLD = 10;

export function CLEPUpsellCard() {
  const [sessionsCount, setSessionsCount] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    // Localstorage dismiss flag
    try {
      if (localStorage.getItem(DISMISSED_KEY) === "1") {
        setDismissed(true);
        return;
      }
    } catch { /* ignore */ }

    // Fetch session count + subscription status in parallel
    let cancelled = false;
    Promise.all([
      fetch("/api/user/sessions-count", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/user", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([countRes, userRes]) => {
        if (cancelled) return;
        if (countRes?.count != null) setSessionsCount(countRes.count);
        const tier = userRes?.user?.subscriptionTier;
        if (tier && tier !== "FREE") setIsPaid(true);
      })
      .catch(() => { /* silent — card just stays hidden */ });
    return () => { cancelled = true; };
  }, []);

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, "1"); } catch { /* ignore */ }
    setDismissed(true);
  };

  if (dismissed) return null;
  if (isPaid) return null;
  if (sessionsCount == null) return null;
  if (sessionsCount < MIN_SESSIONS_THRESHOLD) return null;

  return (
    <Card className="rounded-[16px] border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 relative">
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="absolute top-3 right-3 text-muted-foreground/60 hover:text-muted-foreground transition"
      >
        <X className="h-4 w-4" />
      </button>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0 pr-5">
            <p className="text-[15px] font-semibold leading-tight">
              Earn real college credit before you graduate
            </p>
            <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
              You&apos;re crushing AP practice. CLEP exams let you skip intro college courses —
              saving a semester of tuition (avg $5,000+). Pass 6 exams = 1 year of credit.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href="https://preplion.ai?ref=studentnest-upsell"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="sm"
              className="rounded-full h-9 bg-emerald-600 text-white hover:bg-emerald-700 gap-1.5"
            >
              Explore PrepLion (CLEP/DSST)
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
          <button
            onClick={handleDismiss}
            className="text-[12px] text-muted-foreground hover:text-foreground px-3"
          >
            Not now
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
