"use client";

import { useEffect, useState } from "react";

/**
 * useJourneyForcing — returns whether JourneyHeroCard is currently
 * displaying a "forcing" state (one mandatory next-step CTA).
 *
 * Used by dashboard-view to suppress competing surfaces
 * (PrimaryActionStrip, SingleQuestionEntry, DiagnosticPromptCard) so the
 * brand-new user sees ONE welcome card + ONE start button, not 4 stacked
 * "warm up" / "try it" CTAs (Beta 9.3.3 fix — 2026-04-30).
 *
 * "Forcing" means the user is in any state EXCEPT loading/mature:
 *   capped, premium-welcome, premium-active, returning-after-gap,
 *   brand-new, mcq-fresh, mcq-done-pre-frq, frq-done-pre-diag,
 *   diag-done-with-weak, diag-done-no-weak.
 *
 * Hook is intentionally tiny: same fetch as JourneyHeroCard. CF Pages
 * caches the response so the second hit on the same URL is free.
 */
type Signal = {
  responseCount: number;
  hasDiagnostic: boolean;
  hasFrqAttempt: boolean;
  cohortAgeDays: number;
  daysSinceLastSession: number | null;
  isPremium?: boolean;
  daysAsPremium?: number | null;
  answeredToday?: number;
  capLimit?: number;
  // Beta 9.4 — per-course aware
  responseCountInCourse?: number;
  hasDiagnosticInCourse?: boolean;
  hasFrqAttemptInCourse?: boolean;
  answeredTodayInCourse?: number;
};

type JourneyResp = {
  journey: {
    currentStep: number;
    completedAt?: string | null;
    weakestUnit?: string | null;
    course?: string | null;
  } | null;
} | null;

/**
 * Beta 9.7 — post-journey state
 *
 * Returned alongside `forcing` so the dashboard can render a streamlined
 * "one action based on diagnostic" view for the first 3 days after a
 * user completes the journey rail. After 3 days, postJourney.active is
 * false and the dashboard graduates to its standard "mature" view.
 *
 * Contract:
 *   active = true       UserJourney.currentStep >= 5
 *                       AND UserJourney.completedAt within last 3 days
 *   weakestUnit = unit  captured during Step 3 diagnostic
 *   daysSince  = 0..3   for celebration / "Day N of your plan" framing
 */
export type PostJourneyState = {
  active: boolean;
  daysSinceCompleted: number;
  weakestUnit: string | null;
  course: string | null;
};

export function useJourneyForcing(course?: string): {
  forcing: boolean;
  loading: boolean;
  postJourney: PostJourneyState | null;
} {
  const [state, setState] = useState<{
    forcing: boolean;
    loading: boolean;
    postJourney: PostJourneyState | null;
  }>({
    forcing: false,
    loading: true,
    postJourney: null,
  });

  useEffect(() => {
    let aborted = false;
    // Beta 9.6 fix — also check the user's journey state. If they
    // explicitly Exited (currentStep=99) or completed (>=5), they
    // should see the standard dashboard NOT have surfaces hidden by
    // forcing. Previously: a fresh exited user still had forcing=true
    // because cohortAgeDays<14, which broke the focus-pulse target on
    // /dashboard?focus=X.
    const sigUrl = course
      ? `/api/user/conversion-signal?course=${course}`
      : "/api/user/conversion-signal";
    Promise.all([
      fetch(sigUrl, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/journey", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([d, jResp]: [Signal | null, JourneyResp]) => {
      if (aborted) return;

      // Beta 9.7 — post-journey detection. Compute once and pass through.
      const completedAtStr = jResp?.journey?.completedAt ?? null;
      const journeyStep = jResp?.journey?.currentStep ?? null;
      let postJourney: PostJourneyState | null = null;
      if (
        journeyStep !== null &&
        journeyStep >= 5 &&
        completedAtStr
      ) {
        const daysSince = Math.floor(
          (Date.now() - new Date(completedAtStr).getTime()) / (1000 * 60 * 60 * 24),
        );
        postJourney = {
          active: daysSince <= 3,
          daysSinceCompleted: daysSince,
          weakestUnit: jResp?.journey?.weakestUnit ?? null,
          course: jResp?.journey?.course ?? null,
        };
      }

      if (!d) {
        setState({ forcing: false, loading: false, postJourney });
        return;
      }
      // Exited (99) or completed (>=5) → never force
      if (journeyStep !== null && (journeyStep === 99 || journeyStep >= 5)) {
        setState({ forcing: false, loading: false, postJourney });
        return;
      }
      const hasDiag = d.hasDiagnosticInCourse ?? d.hasDiagnostic;
      const isMature = d.cohortAgeDays > 14 && hasDiag;
      const isCapped =
        typeof d.answeredToday === "number" &&
        typeof d.capLimit === "number" &&
        d.answeredToday >= d.capLimit;
      const forcing = isCapped || !isMature;
      setState({ forcing, loading: false, postJourney });
    }).catch(() => {
      if (!aborted) setState({ forcing: false, loading: false, postJourney: null });
    });
    return () => { aborted = true; };
  }, [course]);

  return state;
}
