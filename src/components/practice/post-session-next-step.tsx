"use client";

/**
 * PostSessionNextStep — Beta 9.3.5 (2026-04-30).
 *
 * User feedback: "After every step, completing a practice / mock /
 * diagnostic / FRQ, there should be clear next step. I still see its
 * missing." — the practice summary previously stacked 3 conditional
 * nudges (FrqTasteNudge + NextSessionNudge + CrossModuleNudge) below
 * the stats card, none of which felt like THE next step.
 *
 * This component is the ONE forward CTA. It reads conversion-signal +
 * frq-attempts-count + course state, picks a single "best next action"
 * for the user, and renders it as a hero at the TOP of the summary
 * (above the stats card). Mirrors JourneyHeroCard's role on the
 * dashboard but specialized for the post-completion moment.
 *
 * Decision tree (priority order — first match wins):
 *   1. capped today           → "You hit today's cap. Set tomorrow's goal."
 *   2. !hasFrqAttempt          → "Try a real FRQ — see the AP rubric."
 *   3. hasFrq + !hasDiagnostic → "10-min Diagnostic → projected AP score."
 *   4. weakestUnit known       → "Drill your weakest unit: <unit>."
 *   5. mature                  → "Take a Mock Exam — full readiness check."
 *   6. fallback                → "Keep practicing — same course, +10 Qs."
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ScrollText, Telescope, Target, Trophy, ArrowRight, Crown, Zap,
} from "lucide-react";
import { JourneyHeroCardEngine } from "@/components/dashboard/journey-hero-card-engine";

interface Props {
  course: string;
  /** Source label for analytics — e.g. "practice_summary" / "mock_summary" / "diag_summary" / "frq_summary". */
  source: string;
}

type Sig = {
  responseCount: number;
  hasDiagnostic: boolean;
  hasFrqAttempt: boolean;
  cohortAgeDays: number;
  answeredToday?: number;
  capLimit?: number;
  isPremium?: boolean;
  weakestUnit?: { unit: string; unitName: string; missRatePct: number } | null;
  // Beta 9.4 — per-course aware
  responseCountInCourse?: number;
  hasDiagnosticInCourse?: boolean;
  hasFrqAttemptInCourse?: boolean;
  answeredTodayInCourse?: number;
};

type State =
  | { kind: "loading" }
  | { kind: "capped" }
  | { kind: "try-frq" }
  | { kind: "take-diagnostic" }
  | { kind: "drill-weakest"; unit: string; unitName: string; missRatePct: number }
  | { kind: "mock-exam" }
  | { kind: "keep-going" };

export function PostSessionNextStep({ course, source }: Props) {
  const [state, setState] = useState<State>({ kind: "loading" });
  // Beta 10 (2026-05-01) — feature-flag dispatch. When on, hand off to the
  // shared engine renderer so post-session and dashboard hero stay in sync.
  // The `source` analytics tag is not threaded through yet — engine has its
  // own analyticsTag from computeNextStep().
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
    fetch(`/api/user/conversion-signal?course=${course}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((sigRaw: Sig | null) => {
        if (cancelled) return;
        if (!sigRaw) {
          setState({ kind: "keep-going" });
          return;
        }
        const sig = sigRaw;
        // Beta 9.4 — drive next-step decisions off PER-COURSE counters when
        // available. A user mature in WH but new in Bio should see "try
        // first FRQ" on Bio, not "take Mock Exam" carried over from WH.
        const responseCountHere = sig.responseCountInCourse ?? sig.responseCount;
        const hasFrqHere = sig.hasFrqAttemptInCourse ?? sig.hasFrqAttempt;
        const hasDiagHere = sig.hasDiagnosticInCourse ?? sig.hasDiagnostic;

        if (
          typeof sig.answeredToday === "number" &&
          typeof sig.capLimit === "number" &&
          sig.answeredToday >= sig.capLimit
        ) {
          setState({ kind: "capped" });
        } else if (!hasFrqHere) {
          setState({ kind: "try-frq" });
        } else if (!hasDiagHere) {
          setState({ kind: "take-diagnostic" });
        } else if (sig.weakestUnit && sig.weakestUnit.missRatePct >= 30) {
          setState({
            kind: "drill-weakest",
            unit: sig.weakestUnit.unit,
            unitName: sig.weakestUnit.unitName,
            missRatePct: sig.weakestUnit.missRatePct,
          });
        } else if (sig.cohortAgeDays >= 7 && responseCountHere >= 30) {
          setState({ kind: "mock-exam" });
        } else {
          setState({ kind: "keep-going" });
        }
      });
    return () => { cancelled = true; };
  }, [course, engineEnabled]);

  // Engine path
  if (engineEnabled === true) return <JourneyHeroCardEngine course={course} />;
  if (engineEnabled === null) return null; // wait for flag

  if (state.kind === "loading") return null;

  // ── Capped (FREE hit daily cap) ────────────────────────────────────────────
  if (state.kind === "capped") {
    return (
      <Hero
        accent="amber"
        icon={<Crown className="h-5 w-5 text-amber-700 dark:text-amber-400" />}
        eyebrow="Today's cap reached"
        title="You're done for today — Premium removes the cap"
        subtitle="$9.99/mo unlocks unlimited practice + FRQ rubric grading. Or come back tomorrow."
        href={`/billing?utm_source=${source}_capped`}
        cta="See Premium — $9.99/mo"
      />
    );
  }

  // ── Try first FRQ ──────────────────────────────────────────────────────────
  if (state.kind === "try-frq") {
    return (
      <Hero
        accent="blue"
        icon={<ScrollText className="h-5 w-5 text-blue-700 dark:text-blue-400" />}
        eyebrow="Your next step"
        title="Try a real AP-style FRQ"
        subtitle="See the official rubric in action. Free first attempt — no setup."
        href={`/frq-practice?course=${course}&src=${source}_first_taste&first_taste=1`}
        cta="Start your first FRQ"
      />
    );
  }

  // ── Take diagnostic ────────────────────────────────────────────────────────
  if (state.kind === "take-diagnostic") {
    return (
      <Hero
        accent="indigo"
        icon={<Telescope className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />}
        eyebrow="Your next step"
        title="Take the 10-min Diagnostic"
        subtitle="Get your projected AP score + your weakest unit so every session counts."
        href={`/diagnostic?course=${course}&src=${source}_diag_unlock`}
        cta="Start 10-min Diagnostic"
      />
    );
  }

  // ── Drill weakest unit ─────────────────────────────────────────────────────
  if (state.kind === "drill-weakest") {
    return (
      <Hero
        accent="emerald"
        icon={<Target className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />}
        eyebrow="Your next step"
        title={`Drill your weakest unit: ${state.unitName}`}
        subtitle={`You're missing ${state.missRatePct}% here. 10 focused questions today moves the needle the most.`}
        href={`/practice?mode=focused&unit=${encodeURIComponent(state.unit)}&course=${course}&count=10&src=${source}_weakest`}
        cta="Start 10-question drill"
      />
    );
  }

  // ── Mock exam ──────────────────────────────────────────────────────────────
  if (state.kind === "mock-exam") {
    return (
      <Hero
        accent="purple"
        icon={<Trophy className="h-5 w-5 text-purple-700 dark:text-purple-400" />}
        eyebrow="Your next step"
        title="Take a Mock Exam — full readiness check"
        subtitle="Real AP exam structure, scored against the official rubric. No surprises on test day."
        href={`/mock-exam?course=${course}&src=${source}_mock_invite`}
        cta="Start Mock Exam"
      />
    );
  }

  // ── Fallback: keep going ───────────────────────────────────────────────────
  return (
    <Hero
      accent="blue"
      icon={<Zap className="h-5 w-5 text-blue-700 dark:text-blue-400" />}
      eyebrow="Your next step"
      title="Keep going — 10 more questions"
      subtitle="Spaced practice beats cramming. One short session today locks in what you just learned."
      href={`/practice?mode=focused&count=10&course=${course}&src=${source}_keep_going`}
      cta="Continue practice"
    />
  );
}

interface HeroProps {
  accent: "blue" | "indigo" | "emerald" | "amber" | "purple";
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
  href: string;
  cta: string;
}

function Hero({ accent, icon, eyebrow, title, subtitle, href, cta }: HeroProps) {
  const tone = {
    blue: "border-blue-500/40 from-blue-500/10 via-indigo-500/5 to-blue-500/5",
    indigo: "border-indigo-500/40 from-indigo-500/10 via-purple-500/5 to-indigo-500/5",
    emerald: "border-emerald-500/40 from-emerald-500/10 via-teal-500/5 to-emerald-500/5",
    amber: "border-amber-500/40 from-amber-500/10 via-yellow-500/5 to-amber-500/5",
    purple: "border-purple-500/40 from-purple-500/10 via-pink-500/5 to-purple-500/5",
  }[accent];

  const eyebrowTone = {
    blue: "text-blue-700 dark:text-blue-400",
    indigo: "text-indigo-700 dark:text-indigo-400",
    emerald: "text-emerald-700 dark:text-emerald-400",
    amber: "text-amber-700 dark:text-amber-400",
    purple: "text-purple-700 dark:text-purple-400",
  }[accent];

  return (
    <Card className={`card-glow border bg-gradient-to-br ${tone}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${eyebrowTone}`}>
              {eyebrow}
            </p>
            <p className="text-base font-semibold leading-snug">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
            <Link href={href}>
              <Button size="sm" className="rounded-full mt-1 gap-2">
                {cta}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
