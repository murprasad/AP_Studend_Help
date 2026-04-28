"use client";

/**
 * SessionLimitHitCard — shown on /practice when the user hits the FREE
 * daily practice cap (FREE_LIMITS.practiceQuestionsPerDay).
 *
 * Reviewer 2026-04-22: the paywall must *feel* at the moment of motivation.
 * Three pieces of copy do that work:
 *   1. LOCK_COPY.practiceCap — "You're improving, but this pace is too slow to pass"
 *   2. Projected-time-to-pass comparison — free days vs premium days
 *   3. Price-anchored CTA — $9.99/mo, not just "Upgrade"
 *
 * Fetches /api/coach-plan to pull `questionsToTarget` so the time-to-pass
 * math is personalized to the specific student, not a generic projection.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, TrendingUp } from "lucide-react";
import { LOCK_COPY, projectedDaysToTarget } from "@/lib/tier-limits";

interface CoachPlanSlim {
  questionsToTarget?: number;
}

export function SessionLimitHitCard({ course }: { course: string }) {
  const [qsToTarget, setQsToTarget] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/coach-plan?course=${course}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: CoachPlanSlim | null) => {
        if (!cancelled && d && typeof d.questionsToTarget === "number") {
          setQsToTarget(d.questionsToTarget);
        }
      })
      .catch(() => { /* fallback uses the coarse default below */ });
    return () => { cancelled = true; };
  }, [course]);

  // Fallback if coach-plan hasn't resolved — coarse but still directionally right.
  const qs = qsToTarget ?? 300;
  const { freeDays, premiumDays } = projectedDaysToTarget(qs);

  return (
    <Card className="card-glow border-yellow-500/30 bg-yellow-500/5">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Crown className="h-5 w-5 text-yellow-700 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <p className="font-semibold text-yellow-300">
              You&apos;ve hit today&apos;s practice cap.
            </p>
            <p className="text-sm text-foreground/90">{LOCK_COPY.practiceCap}</p>
          </div>
        </div>

        {/* Time-to-pass comparison — the killer conversion argument per
            reviewer: "makes upgrade feel like time compression." */}
        <div className="rounded-lg border border-border/40 bg-background/40 p-3 text-[13px]">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">At your current pace</p>
                <p className="font-semibold tabular-nums">~{freeDays} day{freeDays === 1 ? "" : "s"} to passing</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">With unlimited practice</p>
                <p className="font-semibold text-emerald-500 tabular-nums">~{premiumDays} day{premiumDays === 1 ? "" : "s"} to passing</p>
              </div>
            </div>
          </div>
        </div>

        <Link href={`/billing?utm_source=daily_cap&utm_campaign=q_limit&course=${course}`} className="block">
          <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 w-full">
            <Crown className="h-4 w-4" /> Upgrade — $9.99/mo
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
