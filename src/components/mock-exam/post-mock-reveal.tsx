"use client";

/**
 * Post-Mock Pass Probability Reveal — the conversion moment.
 *
 * Per PRD §4.2: every assessment completion (mock OR diagnostic) should
 * end with: "Your pass probability is now X% (±Y%). Today's Set drills
 * these N concepts to lift you toward Z%."
 *
 * Fetches /api/pass-probability after the mock saves; the snapshot the
 * endpoint writes captures THIS mock in the formula. Then surfaces the
 * delta + a one-tap entry into Today's Set.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, TrendingUp, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  course: string;
}

interface PPResp {
  passProbability: number | null;
  confidenceInterval: number | null;
  sampleSize: number;
  drivers: Array<{ conceptKey: string; currentMastery: number; deltaIfMastered: number }>;
  priorSnapshot: { passProbability: number; computedAt: string } | null;
}

export function PostMockReveal({ course }: Props) {
  const [data, setData] = useState<PPResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/pass-probability?course=${encodeURIComponent(course)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [course]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card p-5 text-center" data-testid="post-mock-loading">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
        <p className="text-xs text-muted-foreground mt-2">Updating your pass probability…</p>
      </div>
    );
  }

  if (!data || data.passProbability === null) return null;

  const pp = Math.round(data.passProbability * 100);
  const ci = Math.round((data.confidenceInterval ?? 0) * 100);
  const prior = data.priorSnapshot?.passProbability ?? null;
  const delta = prior !== null ? Math.round((data.passProbability - prior) * 100) : null;

  // Aggregate driver potential — how much pass% the user could lift by mastering top 3 drivers.
  const drivers = data.drivers.slice(0, 3);
  const liftPotential = Math.round(drivers.reduce((s, d) => s + d.deltaIfMastered, 0) * 100);
  const targetPp = Math.min(100, pp + liftPotential);

  return (
    <div
      className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-blue-500/5 p-6"
      data-testid="post-mock-reveal"
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">After this mock</p>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-5xl font-bold text-emerald-700 dark:text-emerald-400 leading-none">{pp}%</span>
        <span className="text-base text-muted-foreground">(±{ci}%)</span>
      </div>
      <p className="text-sm font-semibold text-foreground mb-2">likely to pass</p>

      {delta !== null && delta !== 0 && (
        <p className="text-xs flex items-center gap-1 mb-4">
          <TrendingUp className={`h-3.5 w-3.5 ${delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}`} />
          <span className={`font-medium ${delta >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
            {delta > 0 ? "+" : ""}{delta}%
          </span>
          <span className="text-muted-foreground">vs your last mock</span>
        </p>
      )}

      {liftPotential >= 3 && (
        <div className="rounded-xl bg-background/60 border border-border/30 p-3 mb-4">
          <p className="text-xs text-muted-foreground mb-1">If you master your weak concepts:</p>
          <p className="text-sm">
            You could lift to <span className="font-semibold text-emerald-700 dark:text-emerald-400">~{targetPp}%</span>
          </p>
        </div>
      )}

      <Button asChild className="w-full" data-testid="post-mock-todays-set-cta">
        <Link href={`/practice?course=${encodeURIComponent(course)}&plan=today&count=12&src=post_mock`}>
          <Play className="h-4 w-4 mr-2" fill="currentColor" />
          Start Today&apos;s Set to lift it
        </Link>
      </Button>
    </div>
  );
}
