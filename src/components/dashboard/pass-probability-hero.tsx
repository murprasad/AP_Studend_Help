"use client";

/**
 * Pass Probability Hero — the dashboard's centerpiece UX.
 *
 * Renders one of three states:
 *   1. LOADING — skeleton while /api/pass-probability fetches
 *   2. INSUFFICIENT — "Take 9-Q diagnostic to get your number"
 *   3. SHOWN — big "X% likely to pass" + CI + delta + top driver
 *
 * Calls /api/pass-probability?course=X on mount. Cheap (single fetch).
 * Tracks impressions for telemetry. Refreshes on course change.
 *
 * Pass Plan + Free both render the same widget. The widget itself drives
 * conversion via the "What would lift your number" cards underneath.
 */

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, TrendingDown, Target, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Driver {
  conceptKey: string;
  currentMastery: number;
  deltaIfMastered: number;
}

interface PassProbResponse {
  passProbability: number | null;
  confidenceInterval: number | null;
  sampleSize: number;
  components: { mockTerm: number; drillTerm: number; coverageTerm: number; frictionPenalty: number };
  drivers: Driver[];
  modelVersion: string;
  priorSnapshot: { passProbability: number; computedAt: string } | null;
}

interface Props {
  course: string;
  courseDisplayName: string;
}

export function PassProbabilityHero({ course, courseDisplayName }: Props) {
  const [data, setData] = useState<PassProbResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/pass-probability?course=${encodeURIComponent(course)}`)
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(String(e)); setLoading(false); } });
    return () => { cancelled = true; };
  }, [course]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card p-6 text-center" data-testid="passprob-hero-loading">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
        <p className="text-xs text-muted-foreground mt-2">Reading your pass probability…</p>
      </div>
    );
  }

  if (error) {
    return null; // fail silent — caller's fallback (legacy tiles) carries.
  }

  const insufficient = !data || data.passProbability === null;
  if (insufficient) {
    return (
      <div className="rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 p-6" data-testid="passprob-hero-empty">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{courseDisplayName}</p>
        <h2 className="text-xl font-semibold mb-2">Take a 9-Q diagnostic to see your pass probability.</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Once you have a baseline, every session updates a calibrated estimate
          of your pass odds on the real exam.
        </p>
        <Button asChild>
          <Link href="/diagnostic">Start diagnostic →</Link>
        </Button>
      </div>
    );
  }

  const pp = Math.round(data!.passProbability! * 100);
  const ci = Math.round((data!.confidenceInterval ?? 0) * 100);
  const prior = data!.priorSnapshot?.passProbability ?? null;
  const delta = prior !== null ? Math.round((data!.passProbability! - prior) * 100) : null;

  // Top driver — what would move the number most.
  const topDriver = data!.drivers[0];

  return (
    <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6" data-testid="passprob-hero">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{courseDisplayName}</p>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-6xl font-bold text-emerald-700 dark:text-emerald-400 leading-none">{pp}%</span>
        <span className="text-base text-muted-foreground">(±{ci}%)</span>
      </div>
      <p className="text-sm font-medium text-foreground mb-3">likely to pass</p>

      {delta !== null && (
        <p className="text-xs flex items-center gap-1 mb-3" data-testid="passprob-delta">
          {delta >= 0 ? (
            <>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">+{delta}%</span>
            </>
          ) : (
            <>
              <TrendingDown className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-amber-700 dark:text-amber-400 font-medium">{delta}%</span>
            </>
          )}
          <span className="text-muted-foreground">since last session</span>
        </p>
      )}

      {topDriver && (
        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">What would lift your number</p>
          <div className="flex items-start gap-2">
            <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm">
                Drill <span className="font-semibold">{formatConcept(topDriver.conceptKey)}</span>{" "}
                <span className="text-muted-foreground">(at {Math.round(topDriver.currentMastery * 100)}%)</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium"> +{Math.round(topDriver.deltaIfMastered * 100)}%</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatConcept(key: string): string {
  // "unit:RESEARCH_METHODS" → "Research methods"
  const v = key.replace(/^unit:/, "").replace(/_/g, " ").toLowerCase();
  return v.charAt(0).toUpperCase() + v.slice(1);
}
