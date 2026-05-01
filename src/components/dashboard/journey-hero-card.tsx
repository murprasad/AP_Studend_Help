"use client";

/**
 * JourneyHeroCard — Beta 9.1.4 (2026-04-29).
 *
 * The single forced next-step CTA at the top of the dashboard. Replaces
 * the buffet of competing cards (Diagnostic prompt + Weakness focus +
 * Daily plan + Mastery + ...) for users who haven't yet completed the
 * onboarding journey. Once they're a mature user (cohortAgeDays > 14
 * AND hasDiagnostic), this card hides and the standard dashboard renders.
 *
 * State machine:
 *   - capped-today        → "You've hit today's cap" (Premium upgrade)
 *   - brand-new           → "Welcome — answer 3 to see your level"
 *   - mcq-fresh           → "Keep going — finish your warm-up"
 *   - mcq-done-pre-frq    → "Now try a real FRQ — see the rubric"
 *   - frq-done-pre-diag   → "Take 10-min Diagnostic — get your score"
 *   - diag-done           → "Today: 10 Qs in [weakest unit]"
 *   - mature              → null (returns null — buffet shows)
 *
 * The 'cap' check applies regardless of journey state — a capped user
 * should always see the cap message.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Target, ScrollText, TrendingUp, Zap, Lock } from "lucide-react";
import { FREE_LIMITS } from "@/lib/tier-limits";
import { JourneyHeroCardEngine } from "./journey-hero-card-engine";

interface Signal {
  responseCount: number;
  hasDiagnostic: boolean;
  hasFrqAttempt: boolean;
  frqAttemptCourse: string | null;
  cohortAgeDays: number;
  answeredToday: number;
  subscriptionTier: string;
  daysSinceLastSession: number | null;
  isPremium: boolean;
  daysAsPremium: number | null;
  // Beta 9.4 — per-course aware
  responseCountInCourse?: number;
  hasDiagnosticInCourse?: boolean;
  hasFrqAttemptInCourse?: boolean;
  answeredTodayInCourse?: number;
}

interface ReadinessData {
  weakestUnit?: { unit: string; unitName: string; missRatePct: number } | null;
}

interface Props {
  course: string;
}

type JourneyState =
  | { kind: "loading" }
  | { kind: "capped"; isPremium: boolean }
  | { kind: "premium-welcome" }
  | { kind: "premium-active" }
  | { kind: "returning-after-gap"; daysSince: number; weakestUnitName: string | null; unit: string | null }
  | { kind: "brand-new" }
  | { kind: "mcq-fresh"; count: number }
  | { kind: "mcq-done-pre-frq" }
  | { kind: "frq-done-pre-diag" }
  | { kind: "diag-done-with-weak"; unitName: string; unit: string; missRatePct: number }
  | { kind: "diag-done-no-weak" }
  | { kind: "mature" };

export function JourneyHeroCard({ course }: Props) {
  const [state, setState] = useState<JourneyState>({ kind: "loading" });
  // Beta 10 (2026-05-01) — feature-flag dispatch. While flag is off the
  // legacy 11-state machine below renders. Flip `next_step_engine_enabled`
  // in SiteSetting to roll the engine out — no redeploy needed.
  const [engineEnabled, setEngineEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        setEngineEnabled(Boolean(d?.flags?.nextStepEngineEnabled));
      })
      .catch(() => {
        if (!cancelled) setEngineEnabled(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (engineEnabled !== false) return; // engine path or still loading flag
    let cancelled = false;
    Promise.all([
      fetch(`/api/user/conversion-signal?course=${course}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`/api/readiness?course=${course}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([signal, readiness]: [Signal | null, ReadinessData | null]) => {
      if (cancelled) return;
      if (!signal) { setState({ kind: "mature" }); return; }

      const isPremium = signal.isPremium;

      // Beta 9.4 — drive onboarding states off PER-COURSE counters when
      // available. A user who has done 22 Qs in AP World History but
      // just switched to AP Bio should see "brand-new" on AP Bio, not
      // "frq-done-pre-diag" carried over from the other course.
      const responseCountForJourney = signal.responseCountInCourse ?? signal.responseCount;
      const hasFrqForJourney = signal.hasFrqAttemptInCourse ?? signal.hasFrqAttempt;
      const hasDiagForJourney = signal.hasDiagnosticInCourse ?? signal.hasDiagnostic;
      const answeredTodayForCap = signal.answeredTodayInCourse ?? signal.answeredToday;

      // Premium states take priority — different journey for paying users
      if (isPremium) {
        // Day 1 of Premium: welcome carousel
        if ((signal.daysAsPremium ?? 0) <= 1) {
          setState({ kind: "premium-welcome" });
          return;
        }
        // Mature Premium: trend-based hero
        setState({ kind: "premium-active" });
        return;
      }

      // FREE: capped today → cap message regardless of journey state
      if (answeredTodayForCap >= FREE_LIMITS.practiceQuestionsPerDay) {
        setState({ kind: "capped", isPremium });
        return;
      }

      // FREE: returning after 3+ days inactive AND has done diagnostic
      // (mid-journey or mature) → welcome-back card to re-anchor habit
      // BEFORE the upgrade push. (Use global hasDiagnostic + global
      // daysSinceLastSession — the gap is about the user, not a course.)
      if (
        signal.hasDiagnostic &&
        signal.daysSinceLastSession !== null &&
        signal.daysSinceLastSession >= 3
      ) {
        setState({
          kind: "returning-after-gap",
          daysSince: signal.daysSinceLastSession,
          weakestUnitName: readiness?.weakestUnit?.unitName ?? null,
          unit: readiness?.weakestUnit?.unit ?? null,
        });
        return;
      }

      // FREE: mature in THIS course — has completed the journey here
      if (hasDiagForJourney && signal.cohortAgeDays > 14) {
        setState({ kind: "mature" });
        return;
      }

      // FREE: onboarding journey states (per-course)
      if (responseCountForJourney === 0) {
        setState({ kind: "brand-new" });
      } else if (responseCountForJourney > 0 && responseCountForJourney < 5 && !hasFrqForJourney) {
        setState({ kind: "mcq-fresh", count: responseCountForJourney });
      } else if (!hasFrqForJourney) {
        setState({ kind: "mcq-done-pre-frq" });
      } else if (!hasDiagForJourney) {
        setState({ kind: "frq-done-pre-diag" });
      } else if (readiness?.weakestUnit) {
        setState({
          kind: "diag-done-with-weak",
          unitName: readiness.weakestUnit.unitName,
          unit: readiness.weakestUnit.unit,
          missRatePct: readiness.weakestUnit.missRatePct,
        });
      } else {
        setState({ kind: "diag-done-no-weak" });
      }
    });
    return () => { cancelled = true; };
  }, [course, engineEnabled]);

  // Engine path — flag on, hand off entirely. The engine renderer subscribes
  // to /api/next-step and returns a single CTA card with the same shape.
  if (engineEnabled === true) return <JourneyHeroCardEngine course={course} />;
  // Still loading the flag — render nothing rather than flash legacy then
  // swap to engine.
  if (engineEnabled === null) return null;

  if (state.kind === "loading" || state.kind === "mature") return null;

  // ─── Premium Day 1 — welcome to Premium ────────────────────────────────
  if (state.kind === "premium-welcome") {
    return (
      <Card className="card-glow border-blue-500/40 bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-blue-500/5">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/25 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-blue-700 dark:text-blue-400" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                Welcome to Premium 🎉
              </p>
              <p className="text-base font-semibold leading-snug">
                You just unlocked everything. Here&apos;s what changed:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-1">
                <li>· <strong>Line-by-line FRQ coaching</strong> — exactly which rubric points to add</li>
                <li>· <strong>Unlimited daily practice</strong> — no 30/day cap</li>
                <li>· <strong>Personalized study plan</strong> — Sage Coach deep plan</li>
                <li>· <strong>Smart-scheduled flashcards</strong> — SM-2 spaced repetition</li>
                <li>· <strong>Full analytics</strong> — prescriptive weak-area breakdowns</li>
              </ul>
              <Link href={`/diagnostic?course=${course}&src=premium_welcome`}>
                <Button size="sm" className="rounded-full mt-2 gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  Take a Diagnostic — see your starting point
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Premium active — trend / momentum hero, NO upgrade CTAs ───────────
  if (state.kind === "premium-active") {
    return (
      <Card className="card-glow border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-transparent">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                Today&apos;s practice — Premium
              </p>
              <p className="text-base font-semibold leading-snug">
                Keep climbing. No daily cap, full coaching, full analytics.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link href={`/practice?course=${course}&src=premium_hero`}>
                  <Button size="sm" className="rounded-full gap-2">
                    Practice <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/frq-practice?course=${course}&src=premium_hero`}>
                  <Button size="sm" variant="outline" className="rounded-full gap-2">
                    FRQ practice
                  </Button>
                </Link>
                <Link href="/sage-coach">
                  <Button size="sm" variant="outline" className="rounded-full gap-2">
                    Sage Coach
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Returning after gap — re-anchor habit ─────────────────────────────
  if (state.kind === "returning-after-gap") {
    const href = state.unit
      ? `/practice?mode=focused&unit=${encodeURIComponent(state.unit)}&course=${course}&src=returning`
      : `/practice?course=${course}&src=returning`;
    return (
      <Card className="card-glow border-blue-500/40 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-blue-700 dark:text-blue-400" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                Welcome back — {state.daysSince} day{state.daysSince === 1 ? "" : "s"} away
              </p>
              <p className="text-base font-semibold leading-snug">
                {state.weakestUnitName
                  ? `Pick up in ${state.weakestUnitName} — your biggest gap.`
                  : "Pick up where you left off — 5 quick questions."}
              </p>
              <p className="text-xs text-muted-foreground">
                Streaks restart fast. One session today rebuilds momentum.
              </p>
              <Link href={href}>
                <Button size="sm" className="rounded-full mt-1 gap-2">
                  {state.weakestUnitName ? `Practice ${state.weakestUnitName}` : "Start a session"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Capped today ───────────────────────────────────────────────────────
  if (state.kind === "capped") {
    return (
      <Card className="card-glow border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-yellow-500/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Lock className="h-6 w-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                You&apos;ve hit today&apos;s practice cap
              </p>
              <p className="text-base font-semibold leading-snug">
                Come back tomorrow — or upgrade for unlimited daily practice.
              </p>
              <p className="text-xs text-muted-foreground">
                Free tier: {FREE_LIMITS.practiceQuestionsPerDay} questions/day. Premium: unlimited.
              </p>
              <Link href="/billing?utm_source=journey_hero_capped">
                <Button size="sm" className="rounded-full mt-1 gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                  Upgrade — $9.99/mo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Brand new ──────────────────────────────────────────────────────────
  if (state.kind === "brand-new") {
    return (
      <Card className="card-glow border-blue-500/40 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-blue-500/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-blue-700 dark:text-blue-400" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                Welcome — let&apos;s start
              </p>
              <p className="text-base font-semibold leading-snug">
                Answer 3 questions to see your level. ~60 seconds.
              </p>
              <p className="text-xs text-muted-foreground">
                Three questions. Smart-default course. No setup.
              </p>
              <Link href="/practice/quickstart">
                <Button size="sm" className="rounded-full mt-1 gap-2">
                  Start your warm-up
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── MCQ fresh (< 5 questions in) ───────────────────────────────────────
  if (state.kind === "mcq-fresh") {
    return (
      <Card className="card-glow border-blue-500/40 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Zap className="h-6 w-6 text-blue-700 dark:text-blue-400" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                Keep going
              </p>
              <p className="text-base font-semibold leading-snug">
                {state.count}/5 questions answered. Finish your warm-up.
              </p>
              <p className="text-xs text-muted-foreground">
                A few more questions and you&apos;ll see the real differentiator: AP-rubric FRQ scoring.
              </p>
              <Link href={`/practice?mode=focused&count=5&course=${course}&src=journey_hero&quickstart=1`}>
                <Button size="sm" className="rounded-full mt-1 gap-2">
                  Continue practice
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── MCQ done, no FRQ yet ───────────────────────────────────────────────
  if (state.kind === "mcq-done-pre-frq") {
    return (
      <Card className="card-glow border-indigo-500/40 bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-indigo-500/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <ScrollText className="h-6 w-6 text-indigo-700 dark:text-indigo-400" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400">
                Next: try a real FRQ
              </p>
              <p className="text-base font-semibold leading-snug">
                See exactly how AP rubrics grade your written answers.
              </p>
              <p className="text-xs text-muted-foreground">
                MCQs warm you up. The exam is graded on essays. Your free FRQ attempt: score against the official College Board rubric.
              </p>
              <Link href={`/frq-practice?course=${course}&first_taste=1&src=journey_hero`}>
                <Button size="sm" className="rounded-full mt-1 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                  Try a real FRQ — free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── FRQ done, no Diagnostic — REWARD framing (Beta 9.3) ────────────────
  // Was 'Take a 10-minute diagnostic' (task framing). Now reward framing:
  // 'Want your projected AP score?' — feels like an unlock, not a chore.
  if (state.kind === "frq-done-pre-diag") {
    return (
      <Card className="card-glow border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-transparent">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/25 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                You&apos;ve unlocked your score
              </p>
              <p className="text-base font-semibold leading-snug">
                Want your projected AP score?
              </p>
              <p className="text-xs text-muted-foreground">
                10 minutes, then you&apos;ll see exactly where you stand on a 1–5 scale and which units to fix first.
              </p>
              <Link href={`/diagnostic?course=${course}&src=journey_hero`}>
                <Button size="sm" className="rounded-full mt-1 gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                  Take 10-min Diagnostic
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Diagnostic done with a weakest unit ────────────────────────────────
  if (state.kind === "diag-done-with-weak") {
    return (
      <Card className="card-glow border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-transparent">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                Today&apos;s focused practice
              </p>
              <p className="text-base font-semibold leading-snug">
                10 questions in {state.unitName}
              </p>
              <p className="text-xs text-muted-foreground">
                Your biggest gap. {Math.round(state.missRatePct)}% miss rate. Fix this → fastest score lift.
              </p>
              <Link href={`/practice?mode=focused&unit=${encodeURIComponent(state.unit)}&course=${course}&src=journey_hero`}>
                <Button size="sm" className="rounded-full mt-1 gap-2">
                  Start today&apos;s session
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Diagnostic done, no obvious weak unit ──────────────────────────────
  if (state.kind === "diag-done-no-weak") {
    return (
      <Card className="card-glow border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-transparent">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                Keep practicing
              </p>
              <p className="text-base font-semibold leading-snug">
                10 questions today — keep your score climbing.
              </p>
              <Link href={`/practice?course=${course}&src=journey_hero`}>
                <Button size="sm" className="rounded-full mt-1 gap-2">
                  Start today&apos;s session
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
