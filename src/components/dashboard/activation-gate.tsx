"use client";

/**
 * 2026-06-01 — Fix C for new-user activation gap.
 *
 * Wraps dashboard cards that need >= N questions of history to render
 * meaningful data. For first-week users (Yin pattern: 1-day, 3-Q), hides
 * the wrapped cards entirely and renders a single focused first-week
 * activation CTA in their place.
 *
 * Without this, new users see speculative empty-state cards stacked
 * with the warmup nudge — a CTA traffic jam that drives bounce.
 *
 * Usage:
 *   <ActivationGate>
 *     <PassProbabilityHero ... />
 *     <SatSkillHeatmap ... />
 *   </ActivationGate>
 *
 * The wrapped cards render only when the user has >= 10 responses.
 */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActivationStats {
  course: string | null;
  totalAnswered: number;
  threshold: number;
  hasDiagnostic: boolean;
  daysActive: number;
  activated: boolean;
}

interface Props {
  children: ReactNode;
  /** Course to scope the activation count to. When set, only responses
   *  on this course count toward the threshold (matches how the
   *  readiness formula consumes data per-course). */
  course?: string;
}

export function ActivationGate({ children, course }: Props) {
  const [stats, setStats] = useState<ActivationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const url = course
      ? `/api/me/activation-progress?course=${encodeURIComponent(course)}`
      : "/api/me/activation-progress";
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ActivationStats | null) => {
        if (cancelled) return;
        setStats(d);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [course]);

  // While loading, render nothing (no flicker between placeholder and real card)
  if (loading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card p-5 text-center" data-testid="activation-gate-loading">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
      </div>
    );
  }

  // Activated → show the real cards
  if (!stats || stats.activated) {
    return <>{children}</>;
  }

  // 2026-06-02 — Per user UX feedback ("What's the ONE most useful
  // next step?"): when the user hasn't taken the diagnostic yet,
  // JourneyHeroCard already surfaces "Take 10-min Diagnostic" as the
  // primary CTA at the top of the dashboard. Rendering ANOTHER
  // diagnostic CTA here would duplicate the call. Render null so
  // JourneyHero is the single primary action.
  //
  // When the user HAS a diagnostic but hasn't yet hit the activation
  // threshold (e.g., 4/20 random Qs answered), the readiness score
  // genuinely isn't reliable yet — keep the "answer N more" CTA as
  // the focused continuation.
  if (!stats.hasDiagnostic) {
    return null;
  }
  const remaining = stats.threshold - stats.totalAnswered;
  const threshold = stats.threshold;
  return (
    <div
      className="rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/8 via-blue-500/4 to-transparent p-6"
      data-testid="activation-gate-firstweek"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-5 w-5 text-blue-700 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold leading-tight mb-1">
            {stats.totalAnswered === 0
              ? "Answer a few questions to unlock your readiness score"
              : `Answer ${remaining} more to unlock your readiness score`}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {stats.totalAnswered === 0
              ? "We'll pinpoint your weakest areas after your first few questions, then your dashboard will adapt."
              : `${stats.totalAnswered} / ${threshold} answered. The more we see, the sharper your weak-area map gets.`}
          </p>
          <Button asChild>
            <Link href="/practice">
              {stats.totalAnswered === 0 ? "Start practice →" : "Continue →"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Suppress dashboard cards that surface premature recommendations for
 * users who haven't yet taken a diagnostic. Companion to ActivationGate —
 * use to wrap TodaysSetCard / weak-area suggestions so a 4-question user
 * doesn't get "Strengthen Geometry" on noisy data.
 */
export function PreDiagnosticSuppress({ children, course }: { children: ReactNode; course?: string }) {
  const [stats, setStats] = useState<ActivationStats | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const url = course
      ? `/api/me/activation-progress?course=${encodeURIComponent(course)}`
      : "/api/me/activation-progress";
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ActivationStats | null) => {
        if (cancelled) return;
        setStats(d);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [course]);
  if (loading) return null;
  if (!stats || stats.hasDiagnostic) return <>{children}</>;
  return null;
}
