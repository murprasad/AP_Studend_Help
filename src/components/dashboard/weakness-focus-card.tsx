"use client";

/**
 * WeaknessFocusCard — Dashboard v2 Block 3 (Fastest Path).
 *
 * Shows ONE weakest unit + miss-rate + "Fix this unit" CTA. All free.
 *
 * Reviewer 2026-04-22: keep diagnosis free, prescription paid.
 * For FREE users we surface the lock copy "See exactly what to fix, not
 * just where you're weak" as a locked secondary CTA. Premium users get
 * a real "See what to fix" link into the full analytics view.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle, Lock } from "lucide-react";
import { LOCK_COPY } from "@/lib/tier-limits";

interface Props {
  course: string;
}

interface WeakestUnitSnippet {
  weakestUnit: {
    unit: string;
    unitName: string;
    masteryScore: number;
    missRatePct: number;
    likelyMissesOn50Q: number;
  } | null;
}

interface LimitsSnippet {
  tier: "FREE" | "PREMIUM";
  unlimited: boolean;
}

export function WeaknessFocusCard({ course }: Props) {
  const [data, setData] = useState<WeakestUnitSnippet | null>(null);
  const [limits, setLimits] = useState<LimitsSnippet | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/coach-plan?course=${course}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d && !d.error) setData(d); })
      .catch(() => { /* silent */ });
    fetch(`/api/user/limits`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: LimitsSnippet | null) => { if (!cancelled && d) setLimits(d); })
      .catch(() => { /* silent — UI falls back to free-tier framing */ });
    return () => { cancelled = true; };
  }, [course]);

  if (!data || !data.weakestUnit) return null;
  const w = data.weakestUnit;

  // Hide when the "weakest" is actually strong — avoids false alarm on users near ready state.
  if (w.missRatePct < 25) return null;

  const isPremium = limits?.tier === "PREMIUM" || limits?.unlimited === true;

  return (
    <Card className="rounded-[16px] border-border/40">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-muted-foreground">Weakest area</p>
            <p className="text-[16px] font-semibold leading-tight truncate">{w.unitName}</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              You&apos;re missing <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">~{w.missRatePct}%</span> here.
              Fixing this = fastest path to passing.
            </p>
          </div>
        </div>
        <Link href={`/practice?mode=focused&unit=${encodeURIComponent(w.unit)}&course=${course}`} className="block">
          <Button size="sm" className="w-full h-10 gap-2 rounded-[10px]">
            Fix this unit
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        {/* Prescription line — diagnosis (above) is free; the
            "exactly what to fix" prescription is Premium. */}
        {isPremium ? (
          <Link
            href={`/analytics?unit=${encodeURIComponent(w.unit)}&course=${course}`}
            className="block text-[12px] text-primary hover:underline text-center"
          >
            See exactly what to fix →
          </Link>
        ) : (
          <Link
            href="/billing?utm_source=weakness_card&utm_campaign=prescription_lock"
            className="flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"
          >
            <Lock className="h-3 w-3" />
            <span className="italic">{LOCK_COPY.analyticsLocked}</span>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
