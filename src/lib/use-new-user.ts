"use client";

/**
 * 2026-06-01 — Days since onboarding completed, derived from session JWT.
 *
 * Used to gate "second-week+" dashboard chrome (upsell, exam-countdown
 * prompt, AutoLaunchNudge warmup) for brand-new users. New users get a
 * minimal post-onboarding dashboard with just the Today's Set CTA so they
 * have ONE clear next action — no second-form-fill, no upgrade pitch, no
 * competing warmup CTA.
 *
 * Returns Infinity when no onboardingCompletedAt is present in session.
 * Components default to "show" behaviour in that case (mature-user path).
 */

import { useSession } from "next-auth/react";

export function useDaysSinceOnboard(): number {
  const { data: session } = useSession();
  const completedAtIso = (session?.user as { onboardingCompletedAt?: string | null } | undefined)
    ?.onboardingCompletedAt;
  if (!completedAtIso) return Infinity;
  const completedAt = Date.parse(completedAtIso);
  if (!Number.isFinite(completedAt)) return Infinity;
  const days = (Date.now() - completedAt) / 86400000;
  return Math.max(0, days);
}

/**
 * Convenience for the minimum brand-new threshold: just-onboarded in the
 * last 24 hours. Suppresses upgrade pitches + duplicate CTAs.
 */
export function useIsFreshlyOnboarded(): boolean {
  return useDaysSinceOnboard() < 1;
}

/**
 * Convenience for "this week" gating: hide friction-adding cards like
 * exam-countdown prompt for the first ~3 days.
 */
export function useIsFirstWeekUser(): boolean {
  return useDaysSinceOnboard() < 3;
}
