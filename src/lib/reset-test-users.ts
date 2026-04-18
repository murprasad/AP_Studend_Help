/**
 * Shape of the User.update payload used by /api/admin/reset-test-users.
 * Kept in a lib file (not the route file) because Next.js App Router
 * routes can only export HTTP handlers + a small allowlist of config.
 *
 * Load-bearing field: `onboardingCompletedAt: null`. Without this, a
 * reset user is treated as already-onboarded and lands on /dashboard
 * instead of /onboarding — which blocks QA of any flow gated on
 * fresh-onboarding.
 *
 * `track` is NOT included here — the route layer sets it per-test-user
 * (ap / sat / act) so each slot resets back to its intended product line.
 */
export const RESET_USER_FIELDS = {
  totalXp: 0,
  level: 1,
  streakDays: 0,
  longestStreak: 0,
  lastActiveDate: null,
  subscriptionTier: "FREE",
  freeTrialExpiresAt: null,
  freeTrialCourse: null,
  trialEmailsSent: 0,
} as const;
