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

export function useJourneyForcing(course?: string): { forcing: boolean; loading: boolean } {
  const [state, setState] = useState<{ forcing: boolean; loading: boolean }>({
    forcing: false,
    loading: true,
  });

  useEffect(() => {
    let aborted = false;
    const url = course
      ? `/api/user/conversion-signal?course=${course}`
      : "/api/user/conversion-signal";
    fetch(url, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Signal | null) => {
        if (aborted) return;
        if (!d) {
          setState({ forcing: false, loading: false });
          return;
        }
        // Beta 9.4 — mature/forcing decision is now per-course when
        // course was supplied. A user who's mature in one course but
        // brand-new in this one should see the journey hero (forcing)
        // here.
        const hasDiag = d.hasDiagnosticInCourse ?? d.hasDiagnostic;
        const isMature = d.cohortAgeDays > 14 && hasDiag;
        const isCapped =
          typeof d.answeredToday === "number" &&
          typeof d.capLimit === "number" &&
          d.answeredToday >= d.capLimit;
        const forcing = isCapped || !isMature;
        setState({ forcing, loading: false });
      })
      .catch(() => {
        if (!aborted) setState({ forcing: false, loading: false });
      });
    return () => { aborted = true; };
  }, [course]);

  return state;
}
