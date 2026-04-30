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
};

export function useJourneyForcing(): { forcing: boolean; loading: boolean } {
  const [state, setState] = useState<{ forcing: boolean; loading: boolean }>({
    forcing: false,
    loading: true,
  });

  useEffect(() => {
    let aborted = false;
    fetch("/api/user/conversion-signal", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Signal | null) => {
        if (aborted) return;
        if (!d) {
          setState({ forcing: false, loading: false });
          return;
        }
        // Mature exit (matches journey-hero-card.tsx line 145):
        //   cohortAgeDays > 14 AND hasDiagnostic AND no other gate.
        const isMature =
          d.cohortAgeDays > 14 && d.hasDiagnostic;
        // Capped state always forces.
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
  }, []);

  return state;
}
