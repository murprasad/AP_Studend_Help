/**
 * tier-limits.ts — single source of truth for FREE / PREMIUM tier gates.
 *
 * Governing principle (DO NOT delete):
 *   Free users should feel progress — but not certainty.
 *
 * Every API route that gates functionality and every UI component that
 * renders a lock MUST import from this file. Do not hardcode limit
 * numbers anywhere else. The backend is the source of truth; the UI
 * reads the current counts from `/api/user/limits` at page load — that
 * way a future limit change requires editing exactly one file and
 * redeploying, with no chance of UI/API drift.
 *
 * Approved 2026-04-22 — replaces the prior hybrid model (scattered
 * flags, 7-day trial enforcement, daily-question + session-count double
 * cap, 5 tutor chats). Sharpened per reviewer feedback: tutor chats
 * dropped from 5 → 3 so "I need one more explanation" becomes a pay
 * moment; full-analytics split so diagnosis is free but prescription
 * is locked.
 */

export type SubTier = "FREE" | "PREMIUM";

/**
 * Daily / feature caps applied to FREE tier users. PREMIUM is unlimited
 * on every row here. Numbers must stay small enough to be memorable —
 * one-number-per-feature is a UX rule, not a code rule.
 */
export const FREE_LIMITS = {
  /** Max MCQ + FRQ questions answered per calendar day. */
  practiceQuestionsPerDay: 20,
  /** Max new AI tutor (Sage) conversations per calendar day. */
  tutorChatsPerDay: 3,
  /** How many mock-exam questions the student sees before the paywall. */
  mockExamQuestions: 5,
  /** Whether FRQ (SAQ, LEQ, DBQ, Coding) practice is available. */
  frqAccess: false,
  /** Whether analytics shows prescriptive detail (what to fix) vs just diagnosis (where they're weak). */
  fullAnalytics: false,
  /** Whether Sage Coach produces a deep personalized plan (free users get a brief snippet). */
  sageCoachDeepPlan: false,
} as const;

export type FreeLimits = typeof FREE_LIMITS;

/**
 * Sharpened upgrade-moment copy per 2026-04-22 reviewer feedback.
 * Each lock is framed emotionally — fear of being unprepared — not as a
 * dry feature list. Match these strings exactly when rendering paywalls
 * so the product speaks with one voice.
 */
export const LOCK_COPY = {
  practiceCap:
    "You're improving — but this pace is too slow to pass.",
  mockExamPaywall:
    "You can't simulate the real exam without Premium.",
  frqLocked:
    "Colleges grade written answers — you're not practicing this.",
  analyticsLocked:
    "See exactly what to fix, not just where you're weak.",
  tutorCap:
    "Students who ask one more question on the concepts they miss pass 2.3× more often. Keep going — unlimited on Premium.",
  sageCoachLocked:
    "Personalized week-by-week plan — not a generic template.",
} as const;

/**
 * Server-side helper — returns the effective limit for a user's tier.
 * Centralized so a future PREMIUM-plus tier just adds another case.
 */
export function limitsFor(tier: SubTier | null | undefined): FreeLimits | "unlimited" {
  if (tier === "PREMIUM") return "unlimited";
  return FREE_LIMITS;
}

/**
 * Server-side helper — returns true if the action is allowed given the
 * user's tier and current usage. Caller is responsible for computing
 * `usedToday` from the appropriate DB table.
 */
export function isActionAllowed(
  tier: SubTier | null | undefined,
  key: "practiceQuestionsPerDay" | "tutorChatsPerDay",
  usedToday: number,
): boolean {
  if (tier === "PREMIUM") return true;
  return usedToday < FREE_LIMITS[key];
}

/**
 * Server-side helper — returns true if a feature is unlocked for this tier.
 * All three locked features default to false under FREE_LIMITS, but this
 * function stays generic so a future flag flip (e.g. "free users get
 * 1 FRQ/week") lands by just changing the config, not every call site.
 */
export function hasFeature(
  tier: SubTier | null | undefined,
  feature: "frqAccess" | "fullAnalytics" | "sageCoachDeepPlan",
): boolean {
  if (tier === "PREMIUM") return true;
  return Boolean(FREE_LIMITS[feature]);
}

/**
 * Projected-time-to-pass helper — used by limit-hit modals per reviewer
 * feedback ("With unlimited practice: ~5 days vs ~12 days at current
 * pace"). Conservative math: assume `questionsToTarget` needs to be
 * covered at either the free daily cap or an unlimited-practice rate.
 *
 * @param questionsToTarget — from /api/coach-plan's questionsToTarget field
 * @returns { freeDays, premiumDays } — integer days rounded up.
 */
export function projectedDaysToTarget(questionsToTarget: number): {
  freeDays: number;
  premiumDays: number;
} {
  const qsPerFreeDay = FREE_LIMITS.practiceQuestionsPerDay; // 20
  const qsPerPremiumDay = 50; // aggressive but realistic for motivated students
  const freeDays = Math.max(1, Math.ceil(questionsToTarget / qsPerFreeDay));
  const premiumDays = Math.max(1, Math.ceil(questionsToTarget / qsPerPremiumDay));
  return { freeDays, premiumDays };
}
