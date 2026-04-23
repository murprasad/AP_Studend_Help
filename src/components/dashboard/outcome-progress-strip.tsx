"use client";

/**
 * OutcomeProgressStrip — the signal card. Shows the student's PREDICTED
 * native-scale score (AP 1-5, SAT 400-1600, ACT 1-36) as the hero number,
 * with a gap-to-next-target progress bar and a single-line effort statement.
 * The internal `passPercent` signal drives the tier color only — never shown.
 * State-shifting language driven by `tierCopyFor()` in pass-engine.ts.
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
  // Internal signal used for tier-label color bucket. NEVER shown to the
  // user (renamed from the "pass probability" framing 2026-04-22 —
  // students care about their actual score on the exam's native scale,
  // not an abstract %).
  passPercent?: number;
  tierLabel?: TierLabel;
  questionsToTarget: number;
  targetScore?: number;
  accuracyDelta?: { from: number; to: number; deltaPct: number } | null;
  // Native-scale score fields — AP 1-5, SAT 400-1600, ACT 1-36.
  family?: "AP" | "SAT" | "ACT";
  roughScore?: number;
  scaleMax?: number;
  // Zero-signal users get the raw score hidden with a qualitative label
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

  // Animate the gap-to-next-target bar width on mount / when score lands.
  // Bar is tied to gapBarPct (progress within the current score bucket),
  // not to the internal passPercent signal.
  useEffect(() => {
    if (!coach || typeof coach.roughScore !== "number") return;
    const s = coach.roughScore;
    const fam = coach.family ?? "AP";
    let pct = 0;
    if (fam === "AP") {
      const nextInt = Math.min(5, Math.floor(s) + 1);
      const fromInt = nextInt - 1;
      pct = ((s - fromInt) / (nextInt - fromInt)) * 100;
    } else if (fam === "SAT") {
      const bucket = Math.floor(s / 100) * 100;
      pct = ((s - bucket) / 100) * 100;
    } else {
      const bucket = Math.floor(s / 2) * 2;
      pct = ((s - bucket) / 2) * 100;
    }
    const target = Math.max(0, Math.min(100, pct));
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

  // passPercent stays as an INTERNAL signal feeding the tier color. The
  // user-facing number is the exam's native scaled score (AP 1-5, SAT
  // 400-1600, ACT 1-36) — students think in their exam's grade, not in
  // a uniform 0-100% probability.
  const copy = tierCopyFor(coach.passPercent, false /* hasStrongMock — not yet threaded; safe fallback */);
  const palette = TIER_COLOR_CLASSES[copy.color];

  const family = coach.family ?? "AP";
  const scoreLabel = family === "AP" ? "AP Score" : family === "SAT" ? "SAT" : "ACT";
  const scaleMax = coach.scaleMax ?? (family === "AP" ? 5 : family === "SAT" ? 1600 : 36);
  // Format the score: AP 1-decimal, SAT whole number, ACT whole.
  const formattedScore = (() => {
    const s = typeof coach.roughScore === "number" ? coach.roughScore : 0;
    if (family === "AP") return s.toFixed(1).replace(/\.0$/, "");
    return String(Math.round(s));
  })();
  // "3 / 5", "1240 / 1600", "26 / 36" — denominator is always the scale max.
  const scoreDisplay = `${formattedScore} / ${scaleMax}`;

  // Gap-to-next-target bar %. Rather than a flat pass-probability %, show
  // how close the student is to their next realistic jump (next AP point,
  // next SAT 100-bucket, next ACT 2-bucket).
  const gapBarPct = (() => {
    const s = typeof coach.roughScore === "number" ? coach.roughScore : 0;
    if (family === "AP") {
      const nextInt = Math.min(5, Math.floor(s) + 1);
      const fromInt = nextInt - 1;
      const pct = ((s - fromInt) / (nextInt - fromInt)) * 100;
      return Math.max(0, Math.min(100, pct));
    }
    if (family === "SAT") {
      const bucket = Math.floor(s / 100) * 100;
      const nextBucket = bucket + 100;
      const pct = ((s - bucket) / (nextBucket - bucket)) * 100;
      return Math.max(0, Math.min(100, pct));
    }
    // ACT: 2-point buckets
    const bucket = Math.floor(s / 2) * 2;
    const nextBucket = bucket + 2;
    const pct = ((s - bucket) / (nextBucket - bucket)) * 100;
    return Math.max(0, Math.min(100, pct));
  })();
  // Target score we're progressing toward. Shown under the bar.
  const nextTarget = (() => {
    const s = typeof coach.roughScore === "number" ? coach.roughScore : 0;
    if (family === "AP") return Math.min(5, Math.floor(s) + 1);
    if (family === "SAT") return Math.min(1600, Math.floor(s / 100) * 100 + 100);
    return Math.min(36, Math.floor(s / 2) * 2 + 2);
  })();

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
        {/* ── 1. The score (exam native scale) or rough-estimate fallback ── */}
        {coach.showScore !== false ? (
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={`text-[28px] leading-none font-bold tabular-nums ${palette.number}`}>
              {scoreDisplay}
            </span>
            <span className="text-[13px] text-muted-foreground">predicted {scoreLabel}</span>
            <span
              className={`ml-auto text-[12px] font-medium px-2 py-0.5 rounded-full border ${palette.chipText} ${palette.chipBg}`}
            >
              {copy.dotEmoji} {copy.heroLabel}
            </span>
          </div>
        ) : (
          // REQ-025 anti-demoralization: zero-signal users see a directional
          // label instead of a specific score that crushes motivation.
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[20px] leading-tight font-semibold text-foreground/90">
              Rough estimate
            </span>
            <span className="text-[13px] text-muted-foreground">
              — a 10-min diagnostic sharpens this
            </span>
          </div>
        )}

        {/* ── 2. Gap-to-next-target bar (progress within the current tier) ── */}
        {coach.showScore !== false && (
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full ${palette.bar} transition-[width] duration-[600ms] ease-out`}
              style={{ width: `${animatedPct}%` }}
            />
          </div>
        )}

        {/* ── 3. Effort line ─────────────────────────────────────────── */}
        {coach.questionsToTarget > 0 && coach.passPercent < 80 && (
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
