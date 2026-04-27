"use client";

/**
 * WeaknessFocusCard — Dashboard v2 Block 3 (Fastest Path).
 *
 * Beta 8.1.1 (2026-04-26) upgrade: shows the weakest unit hero plus
 * 2 additional ranked actions from Phase A's getScoreActions() so the
 * full "Boost your score — do these next" picture lands in one card.
 *
 * Two display modes:
 *   1. Hero + 2 secondary actions (when actions[] has 3 items)
 *   2. Hero only (legacy fallback when actions[] is empty)
 *
 * Cold-start safety: when /api/coach-plan soft-fails (weakestUnit=null,
 * actions=[]), card now renders a "Building your path" placeholder
 * instead of returning null. Stops the screen-flip bug where the card
 * would disappear on cold-start and reappear on warm-start.
 *
 * Reviewer 2026-04-22: diagnosis free, prescription paid. For FREE users
 * the "See exactly what to fix" line is a locked CTA → /billing. Premium
 * users get a real link to analytics.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle, Lock, Zap, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LOCK_COPY } from "@/lib/tier-limits";
import { fetchCached } from "@/lib/dashboard-cache";

interface Props {
  course: string;
}

interface ScoreAction {
  unit: string;
  unitLabel: string;
  currentMastery: number;
  totalAttempts: number;
  estQuestionsToTier: number;
  href: string;
  reason: string;
}

interface CoachPlanSnippet {
  weakestUnit: {
    unit: string;
    unitName: string;
    masteryScore: number;
    missRatePct: number;
    likelyMissesOn50Q: number;
  } | null;
  /** Phase A actions (Beta 8.1) — top 3 ranked weak units to practice. */
  actions?: ScoreAction[];
  _degraded?: boolean;
}

interface LimitsSnippet {
  tier: "FREE" | "PREMIUM";
  unlimited: boolean;
}

export function WeaknessFocusCard({ course }: Props) {
  const [data, setData] = useState<CoachPlanSnippet | null>(null);
  const [limits, setLimits] = useState<LimitsSnippet | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCached<CoachPlanSnippet & { error?: unknown }>(`/api/coach-plan?course=${course}`)
      .then((d) => { if (!cancelled && d && !d.error) setData(d); })
      .catch(() => { /* silent */ });
    fetchCached<LimitsSnippet>(`/api/user/limits`)
      .then((d) => { if (!cancelled && d) setLimits(d); })
      .catch(() => { /* silent — UI falls back to free-tier framing */ });
    return () => { cancelled = true; };
  }, [course]);

  // Loading state — return null until data arrives so the dashboard
  // doesn't show two stacked skeleton cards (OutcomeProgressStrip
  // already has its own). User-reported 2026-04-26: dual-skeleton load
  // looks "broken" on slow cold-starts. The screen-flip fix below still
  // covers the soft-fail case (renders "Building your path" instead of
  // disappearing) — that was the real bug.
  if (!data) return null;

  const isPremium = limits?.tier === "PREMIUM" || limits?.unlimited === true;
  const w = data.weakestUnit;
  const actions = data.actions ?? [];
  const secondaryActions = w
    // When weakestUnit is present, drop matching action from secondaries
    // so we don't show the same unit twice.
    ? actions.filter((a) => a.unit !== w.unit).slice(0, 2)
    : actions.slice(0, 3);

  // Cold-start / no-signal fallback — render a "build your path" prompt
  // instead of returning null. Stops the screen-flip bug.
  if (!w && actions.length === 0) {
    return (
      <Card className="rounded-[16px] border-border/40">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-muted-foreground">Building your path</p>
              <p className="text-[15px] font-medium leading-tight">Answer a few questions and we&apos;ll show you exactly where to focus.</p>
            </div>
          </div>
          <Link href={`/practice?course=${course}`} className="block">
            <Button size="sm" className="w-full h-10 gap-2 rounded-[10px]">
              Start practice
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Hide hero when "weakest" is actually strong AND we have no secondary
  // actions to show — avoids false alarm on users near ready state.
  // (If we have secondary actions, keep rendering so they see them.)
  if (w && w.missRatePct < 25 && secondaryActions.length === 0) return null;

  return (
    <Card className="rounded-[16px] border-border/40">
      <CardContent className="p-5 space-y-3">
        {/* ── Hero: weakest unit (when present) ─────────────────────── */}
        {w && (
          <>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-muted-foreground">Weakest area</p>
                <p className="text-[16px] font-semibold leading-tight truncate">{w.unitName}</p>
                <p className="text-[13px] text-muted-foreground mt-1">
                  You&apos;re missing about{" "}
                  <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                    {Math.max(0, Math.min(100, w.missRatePct))}%
                  </span>{" "}
                  here. Fixing this = fastest path to passing.
                </p>
              </div>
            </div>
            <Link href={`/practice?mode=focused&unit=${encodeURIComponent(w.unit)}&course=${course}`} className="block">
              <Button size="sm" className="w-full h-10 gap-2 rounded-[10px]">
                Fix this unit
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </>
        )}

        {/* ── Phase A actions: 2-3 secondary ranked targets ────────── */}
        {secondaryActions.length > 0 && (
          <div className={w ? "pt-2 border-t border-border/30 space-y-1.5" : "space-y-1.5"}>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
              <Zap className="h-3 w-3" />
              <span>{w ? "More to boost your score" : "Boost your score — do these next"}</span>
            </div>
            {secondaryActions.map((a) => (
              <Link
                key={a.unit}
                href={a.href}
                className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 hover:bg-accent transition-colors group"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-[13px] font-medium truncate">{a.unitLabel}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5">{a.reason}</Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {a.totalAttempts > 0
                        ? `${a.currentMastery}% mastery · ~${a.estQuestionsToTier} Qs`
                        : `Untouched · ~${a.estQuestionsToTier} Qs`}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {/* Prescription line — diagnosis (above) is free; the
            "exactly what to fix" prescription is Premium. */}
        {w && (isPremium ? (
          <Link
            href={`/analytics?unit=${encodeURIComponent(w.unit)}&course=${course}`}
            className="block text-[12px] text-primary underline underline-offset-2 decoration-primary/60 hover:decoration-primary text-center"
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
        ))}
      </CardContent>
    </Card>
  );
}
