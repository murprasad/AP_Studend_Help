/**
 * GA4 event tracking utilities (StudentNest).
 * Port of PrepLion's gtag.ts, adapted for AP/SAT/ACT tracks.
 *
 * Setup required (user action — task #73 in PrepLion ledger):
 *   1. Create a GA4 property for studentnest.ai at analytics.google.com
 *   2. Replace GA_ID below with the measurement ID
 *   3. The GA4 loader script is injected by cookie-consent.tsx after
 *      consent (same pattern as PL). No layout changes needed if that
 *      surface is already in place.
 */

// TODO: replace with real measurement ID once GA4 property is provisioned
const GA_ID = "G-XXXXXXXXXX";

type GtagEvent = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: string | number | undefined;
};

function gtag(...args: unknown[]) {
  if (typeof window === "undefined" || !(window as any).gtag) return;
  (window as any).gtag(...args);
}

export function trackEvent({ action, category, label, value, ...rest }: GtagEvent) {
  gtag("event", action, {
    event_category: category,
    event_label: label,
    value,
    ...rest,
  });
}

// ── Auth ──────────────────────────────────────────────────────────────────

export function trackSignup(method: "credentials" | "google") {
  trackEvent({ action: "sign_up", category: "auth", method });
}

export function trackLogin(method: "credentials" | "google") {
  trackEvent({ action: "login", category: "auth", method });
}

// ── Onboarding ────────────────────────────────────────────────────────────

export function trackOnboardingStep(step: number, label: string) {
  trackEvent({ action: "onboarding_step", category: "onboarding", label, value: step });
}

export function trackTrackSelected(track: "ap" | "sat" | "act" | "psat") {
  trackEvent({ action: "track_selected", category: "onboarding", label: track });
}

export function trackCourseSelected(course: string) {
  trackEvent({ action: "course_selected", category: "onboarding", label: course });
}

export function trackPlanSelected(plan: "free" | "free_trial" | "premium" | "annual") {
  trackEvent({ action: "plan_selected", category: "monetization", label: plan });
}

// ── Engagement ────────────────────────────────────────────────────────────

export function trackDiagnosticStarted(course: string) {
  trackEvent({ action: "diagnostic_started", category: "engagement", label: course });
}

export function trackDiagnosticCompleted(course: string, predictedScore: number) {
  trackEvent({
    action: "diagnostic_completed",
    category: "engagement",
    label: course,
    value: Math.round(predictedScore),
  });
}

export function trackPracticeStarted(course: string, questionCount: number) {
  trackEvent({ action: "practice_started", category: "engagement", label: course, value: questionCount });
}

export function trackPracticeCompleted(course: string, accuracy: number) {
  trackEvent({
    action: "practice_completed",
    category: "engagement",
    label: course,
    value: Math.round(accuracy),
  });
}

export function trackMockExamStarted(course: string) {
  trackEvent({ action: "mock_started", category: "engagement", label: course });
}

export function trackMockExamCompleted(course: string, score: number) {
  trackEvent({ action: "mock_completed", category: "engagement", label: course, value: score });
}

// ── Monetization funnel ──────────────────────────────────────────────────

export function trackCheckoutStarted(plan: string) {
  trackEvent({ action: "checkout_started", category: "monetization", label: plan });
}

/** Generic trial-start. Fires regardless of entry surface. */
export function trackTrialStarted(course: string, source: string) {
  trackEvent({ action: "trial_started", category: "monetization", label: course, source });
}

/** Fires on Stripe success-return — captures first paid moment. */
export function trackPaidConverted(course: string, plan: "premium_month" | "premium_year") {
  trackEvent({ action: "paid_converted", category: "monetization", label: course, plan });
}

/** Activation signal: first PRACTICE (not diagnostic) completed. */
export function trackFirstPracticeCompleted(course: string, accuracy: number) {
  trackEvent({
    action: "first_practice_completed",
    category: "activation",
    label: course,
    value: Math.round(accuracy),
  });
}

/** Fires on trial-end. Pair with trial_started for trial→paid rate. */
export function trackTrialExpired(course: string, daysActive: number) {
  trackEvent({
    action: "trial_expired",
    category: "monetization",
    label: course,
    value: daysActive,
  });
}
