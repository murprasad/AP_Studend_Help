"use client";

/**
 * OutcomeProgressStrip — the signal card. Shows pass probability as one
 * large number, a tier-colored progress bar, and a single-line effort
 * statement. Replaces the old stats row + pass-prob widget + effort copy
 * scattered across the dashboard. State-shifting language driven by
 * `tierCopyFor()` in pass-engine.ts (single source of truth).
 */

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame } from "lucide-react";
import { tierCopyFor, type TierLabel } from "@/lib/pass-engine";

interface Props {
  course: string;
}

interface CoachPlanSnippet {
  passPercent?: number;
  tierLabel?: TierLabel;
  questionsToTarget: number;
  accuracyDelta?: { from: number; to: number; deltaPct: number } | null;
  // Zero-signal users get the raw % hidden with a qualitative label
  // instead. Forwarded from loadReadinessSnapshot through /api/coach-plan.
  showScore?: boolean;
  hasDiagnostic?: boolean;
}

interface TodaySnippet {
  answeredToday: number;
  dailyGoal: number;
  streak: number;
}

const TIER_COLOR_CLASSES: Record<"red" | "amber" | "blue" | "emerald", { bar: string; chipText: string; chipBg: string; number: string }> = {
  red:     { bar: "bg-red-500",     chipText: "text-red-600 dark:text-red-400",     chipBg: "bg-red-500/10 border-red-500/30",     number: "text-red-600 dark:text-red-400" },
  amber:   { bar: "bg-amber-500",   chipText: "text-amber-600 dark:text-amber-400", chipBg: "bg-amber-500/10 border-amber-500/30", number: "text-foreground" },
  blue:    { bar: "bg-blue-500",    chipText: "text-blue-600 dark:text-blue-400",   chipBg: "bg-blue-500/10 border-blue-500/30",   number: "text-foreground" },
  emerald: { bar: "bg-emerald-500", chipText: "text-emerald-600 dark:text-emerald-400", chipBg: "bg-emerald-500/10 border-emerald-500/30", number: "text-emerald-600 dark:text-emerald-400" },
};

export function OutcomeProgressStrip({ course }: Props) {
  const [coach, setCoach] = useState<CoachPlanSnippet | null>(null);
  const [today, setToday] = useState<TodaySnippet | null>(null);
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/coach-plan?course=${course}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d && !d.error) setCoach(d); })
      .catch(() => { /* silent */ });
    fetch(`/api/daily-goal?course=${course}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) {
          setToday({
            answeredToday: d.answeredToday ?? 0,
            dailyGoal: d.targetQs ?? 10,
            streak: d.streakDays ?? 0,
          });
        }
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, [course]);

  // Animate the bar width on mount / when pct lands
  useEffect(() => {
    if (!coach || typeof coach.passPercent !== "number") return;
    const target = Math.max(0, Math.min(100, coach.passPercent));
    const raf = requestAnimationFrame(() => setAnimatedPct(target));
    return () => cancelAnimationFrame(raf);
  }, [coach]);

  if (!coach || typeof coach.passPercent !== "number") {
    // Loading / no signal — render a subdued placeholder so layout doesn't pop.
    return (
      <Card className="rounded-[16px] border-border/40">
        <CardContent className="p-5 space-y-2">
          <div className="h-7 w-32 rounded bg-muted animate-pulse" />
          <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const passPct = Math.round(coach.passPercent);
  const copy = tierCopyFor(coach.passPercent, false /* hasStrongMock — not yet threaded; safe fallback */);
  const palette = TIER_COLOR_CLASSES[copy.color];

  const todayAnswered = today?.answeredToday ?? 0;
  const todayGoal = today?.dailyGoal ?? 10;
  const streak = today?.streak ?? 0;

  const deltaLine = coach.accuracyDelta && coach.accuracyDelta.deltaPct !== 0
    ? coach.accuracyDelta.deltaPct > 0
      ? `Accuracy ↑ ${coach.accuracyDelta.from}% → ${coach.accuracyDelta.to}%`
      : `Accuracy ↓ ${coach.accuracyDelta.from}% → ${coach.accuracyDelta.to}%`
    : null;

  return (
    <Card className="rounded-[16px] border-border/40">
      <CardContent className="p-5 space-y-3">
        {/* ── 1. The number (or rough-estimate label) ─────────────────── */}
        {coach.showScore !== false ? (
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={`text-[28px] leading-none font-bold tabular-nums ${palette.number}`}>
              {passPct}%
            </span>
            <span className="text-[13px] text-muted-foreground">pass probability</span>
            <span
              className={`ml-auto text-[12px] font-medium px-2 py-0.5 rounded-full border ${palette.chipText} ${palette.chipBg}`}
            >
              {copy.dotEmoji} {copy.heroLabel}
            </span>
          </div>
        ) : (
          // REQ-025 anti-demoralization: zero-signal users see a directional
          // label instead of a raw "0%" number that crushes motivation.
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[20px] leading-tight font-semibold text-foreground/90">
              Rough estimate
            </span>
            <span className="text-[13px] text-muted-foreground">
              — a 10-min diagnostic sharpens this
            </span>
          </div>
        )}

        {/* ── 2. The bar (suppressed for zero-signal so the 0% isn't implied) ── */}
        {coach.showScore !== false && (
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full ${palette.bar} transition-[width] duration-[600ms] ease-out`}
              style={{ width: `${animatedPct}%` }}
            />
          </div>
        )}

        {/* ── 3. Effort line ─────────────────────────────────────────── */}
        {coach.questionsToTarget > 0 && passPct < 80 && (
          <p className="text-[13px] text-muted-foreground">
            ~<span className="font-semibold text-foreground tabular-nums">{coach.questionsToTarget}</span> questions {copy.effortSuffix}
          </p>
        )}

        {/* ── 4. Today + streak (single line) ─────────────────────────── */}
        <div className="flex items-center gap-3 text-[12px] text-muted-foreground pt-1 border-t border-border/30">
          <span>
            Today: <span className="font-semibold text-foreground tabular-nums">{todayAnswered}/{todayGoal}</span> questions
          </span>
          {streak > 0 && (
            <span className="inline-flex items-center gap-1">
              · <Flame className="h-3.5 w-3.5 text-orange-500" /> <span className="tabular-nums">{streak}</span>-day streak
            </span>
          )}
          {deltaLine && <span className="ml-auto hidden sm:inline">· {deltaLine}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
