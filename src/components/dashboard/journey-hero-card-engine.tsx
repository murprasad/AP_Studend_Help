"use client";

/**
 * JourneyHeroCardEngine — Beta 10 (2026-05-01).
 *
 * Engine-driven renderer that consumes useNextStep() and produces the
 * dashboard hero card from a single decision. Replaces the 11-state
 * machine in journey-hero-card.tsx with one fetch + one switch.
 *
 * Active when the `next_step_engine_enabled` SiteSetting flag is true.
 * The legacy JourneyHeroCard remains the fallback while the flag is off.
 */

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  Target,
  ScrollText,
  TrendingUp,
  Zap,
  Lock,
  Crown,
  RotateCcw,
} from "lucide-react";
import { useNextStep } from "@/hooks/use-next-step";
import type { NextStepKind, NextStepTone } from "@/lib/next-step-engine";

interface Props {
  course: string;
}

const KIND_ICON: Record<NextStepKind, typeof Sparkles> = {
  start_journey: Sparkles,
  resume_journey: ArrowRight,
  capped_today: Lock,
  frq_capped: Lock,
  premium_welcome: Sparkles,
  premium_active: TrendingUp,
  returning_after_gap: RotateCcw,
  brand_new: Sparkles,
  mcq_fresh: Zap,
  first_frq: ScrollText,
  first_diagnostic: Sparkles,
  fix_weakest: Target,
  daily_drill: TrendingUp,
  maintain: TrendingUp,
};

const TONE_CLASSES: Record<NextStepTone, { card: string; iconBg: string; iconColor: string; eyebrow: string; cta: string }> = {
  amber: {
    card: "border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-transparent",
    iconBg: "bg-amber-500/25",
    iconColor: "text-amber-700 dark:text-amber-400",
    eyebrow: "text-amber-700 dark:text-amber-400",
    cta: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  blue: {
    card: "border-blue-500/40 bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-blue-500/5",
    iconBg: "bg-blue-500/25",
    iconColor: "text-blue-700 dark:text-blue-400",
    eyebrow: "text-blue-700 dark:text-blue-400",
    cta: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  indigo: {
    card: "border-indigo-500/40 bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-indigo-500/5",
    iconBg: "bg-indigo-500/20",
    iconColor: "text-indigo-700 dark:text-indigo-400",
    eyebrow: "text-indigo-700 dark:text-indigo-400",
    cta: "bg-indigo-600 hover:bg-indigo-700 text-white",
  },
  emerald: {
    card: "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-transparent",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-700 dark:text-emerald-400",
    eyebrow: "text-emerald-700 dark:text-emerald-400",
    cta: "",
  },
  purple: {
    card: "border-purple-500/40 bg-gradient-to-br from-purple-500/10 to-purple-500/5",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-700 dark:text-purple-400",
    eyebrow: "text-purple-700 dark:text-purple-400",
    cta: "bg-purple-600 hover:bg-purple-700 text-white",
  },
  neutral: {
    card: "border-border/40 bg-card",
    iconBg: "bg-muted",
    iconColor: "text-foreground",
    eyebrow: "text-muted-foreground",
    cta: "",
  },
};

export function JourneyHeroCardEngine({ course }: Props) {
  const { nextStep, isLoading } = useNextStep(course);

  if (isLoading || !nextStep) return null;

  const Icon = KIND_ICON[nextStep.kind] ?? Sparkles;
  const tone = TONE_CLASSES[nextStep.tone] ?? TONE_CLASSES.neutral;
  const isUpgrade = nextStep.primaryCta.variant === "upgrade";

  return (
    <Card className={`card-glow ${tone.card}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl ${tone.iconBg} flex items-center justify-center flex-shrink-0`}>
            {isUpgrade ? <Crown className={`h-6 w-6 ${tone.iconColor}`} /> : <Icon className={`h-6 w-6 ${tone.iconColor}`} />}
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${tone.eyebrow}`}>
              {nextStep.eyebrow}
            </p>
            <p className="text-base font-semibold leading-snug">
              {nextStep.headline}
            </p>
            {nextStep.body && (
              <p className="text-xs text-muted-foreground">{nextStep.body}</p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                asChild
                size="sm"
                className={`rounded-full gap-2 ${tone.cta}`}
              >
                <Link href={nextStep.primaryCta.href}>
                  {nextStep.primaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {(nextStep.secondaryCtas ?? []).map((cta) => (
                <Button key={cta.href} asChild size="sm" variant="outline" className="rounded-full gap-2">
                  <Link href={cta.href}>{cta.label}</Link>
                </Button>
              ))}
            </div>

            {/* Distinct upgrade CTA below — only when engine populates it
                AND the primary CTA isn't already an upgrade (avoid dual). */}
            {nextStep.upgradeCta && !isUpgrade && (
              <div className="pt-1">
                <Link
                  href={nextStep.upgradeCta.href}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <Crown className="h-3 w-3" />
                  {nextStep.upgradeCta.label}
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
