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
 *   - brand-new           → "Welcome — answer 1 to warm up"
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

interface Signal {
  responseCount: number;
  hasDiagnostic: boolean;
  hasFrqAttempt: boolean;
  frqAttemptCourse: string | null;
  cohortAgeDays: number;
  answeredToday: number;
  subscriptionTier: string;
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
  | { kind: "brand-new" }
  | { kind: "mcq-fresh"; count: number }
  | { kind: "mcq-done-pre-frq" }
  | { kind: "frq-done-pre-diag" }
  | { kind: "diag-done-with-weak"; unitName: string; unit: string; missRatePct: number }
  | { kind: "diag-done-no-weak" }
  | { kind: "mature" };

export function JourneyHeroCard({ course }: Props) {
  const [state, setState] = useState<JourneyState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/user/conversion-signal", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`/api/readiness?course=${course}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([signal, readiness]: [Signal | null, ReadinessData | null]) => {
      if (cancelled) return;
      if (!signal) { setState({ kind: "mature" }); return; }

      const isPremium = signal.subscriptionTier !== "FREE";
      // Capped check — applies to FREE users regardless of journey state
      if (!isPremium && signal.answeredToday >= FREE_LIMITS.practiceQuestionsPerDay) {
        setState({ kind: "capped", isPremium });
        return;
      }

      // Mature — has completed the journey, let standard dashboard show
      if (signal.hasDiagnostic && signal.cohortAgeDays > 14) {
        setState({ kind: "mature" });
        return;
      }

      // Journey states
      if (signal.responseCount === 0) {
        setState({ kind: "brand-new" });
      } else if (signal.responseCount > 0 && signal.responseCount < 5 && !signal.hasFrqAttempt) {
        setState({ kind: "mcq-fresh", count: signal.responseCount });
      } else if (!signal.hasFrqAttempt) {
        setState({ kind: "mcq-done-pre-frq" });
      } else if (!signal.hasDiagnostic) {
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
  }, [course]);

  if (state.kind === "loading" || state.kind === "mature") return null;

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
                Answer one question to warm up. ~30 seconds.
              </p>
              <p className="text-xs text-muted-foreground">
                One question. Smart-default course. No setup.
              </p>
              <Link href="/practice/quickstart">
                <Button size="sm" className="rounded-full mt-1 gap-2">
                  Start your first question
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

  // ─── FRQ done, no Diagnostic ────────────────────────────────────────────
  if (state.kind === "frq-done-pre-diag") {
    return (
      <Card className="card-glow border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Target className="h-6 w-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Next: see your score
              </p>
              <p className="text-base font-semibold leading-snug">
                Take a 10-minute diagnostic — get your projected AP score.
              </p>
              <p className="text-xs text-muted-foreground">
                Diagnoses your weakest units, projects a 1–5 score, and personalizes everything else.
              </p>
              <Link href={`/diagnostic?course=${course}&src=journey_hero`}>
                <Button size="sm" className="rounded-full mt-1 gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                  Take Diagnostic
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
