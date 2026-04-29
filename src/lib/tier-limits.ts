/**
 * tier-limits.ts — single source of truth for FREE / PREMIUM tier gates.
 *
 * Governing principle (DO NOT delete — refined 2026-04-23 by reviewer):
 *   Free users should feel progress, curiosity, and limits — but never
 *   completion.
 *
 * Every API route that gates functionality and every UI component that
 * renders a lock MUST import from this file. Do not hardcode limit
 * numbers anywhere else. The backend is the source of truth; the UI
 * reads the current counts from `/api/user/limits` at page load — that
 * way a future limit change requires editing exactly one file and
 * redeploying, with no chance of UI/API drift.
 *
 * Evolution:
 * - 2026-04-22: Replaced hybrid model (scattered flags, 7-day trial,
 *   double cap). Single source of truth. Sharpened tutor chats 5 → 3.
 * - 2026-04-23: Reviewer sharpening pass. Diagnostic 30 → 14 days so
 *   the retake rhythm matches product cadence. 1 free FRQ attempt
 *   lifetime to let users experience AI scoring once (strong
 *   conversion trigger). Flashcards stay unlimited but lose SM-2
 *   smart scheduling for free (linear order). Analytics moved from
 *   label-free to explanation-locked.
 */

export type SubTier = "FREE" | "PREMIUM";

/**
 * Daily / feature caps applied to FREE tier users. PREMIUM is unlimited
 * on every row here. Numbers must stay small enough to be memorable —
 * one-number-per-feature is a UX rule, not a code rule.
 */
export const FREE_LIMITS = {
  /** Max MCQ + FRQ questions answered per calendar day.
   *  Bumped 20 → 30 (2026-04-27) — user feedback: serious AP students do
   *  30-50 q/day; 20 cap signaled "this tool can't support real prep load."
   *  Better to give enough rope to develop habit, then upsell on FRQ + Sage. */
  practiceQuestionsPerDay: 30,
  /** Max new AI tutor (Sage) conversations per calendar day. */
  tutorChatsPerDay: 3,
  /** How many mock-exam questions the student sees before the paywall. */
  mockExamQuestions: 5,
  /** Legacy blanket FRQ access flag — superseded by per-type/per-course
   *  caps below in Beta 8.13. Kept for backward compat with old gates that
   *  may still read it; new code should use the per-type limits. */
  frqAccess: false,
  /** Legacy lifetime cap (across all FRQ types). Superseded by per-type. */
  frqFreeAttempts: 1,
  /**
   * Beta 8.13 (2026-04-29) — taste-first conversion model.
   *
   * Free users get 1 attempt of EACH FRQ type PER COURSE (lifetime).
   * They see the FULL prompt + DBQ documents + scoring rubric BEFORE
   * answering. They can submit and receive a basic AI score with the
   * rubric points they hit. PREMIUM unlocks: detailed line-by-line
   * coaching ("on line 3 you said X, the rubric expects Y because…")
   * + unlimited attempts + "+1 point" coaching.
   *
   * Reasoning: students don't pay for access — they pay for confidence
   * the tool will lift their score. They build that confidence by
   * SEEING the DBQ/LEQ format firsthand. Hard-paywalling these means
   * they never trust us. Conversion now happens AFTER first DBQ/LEQ
   * attempt instead of trying to gate users into pre-paying for
   * something they haven't seen.
   */
  dbqFreeAttemptsPerCourse: 1,
  leqFreeAttemptsPerCourse: 1,
  saqFreeAttemptsPerCourse: 1,
  /** Generic non-history FRQ type (Math/Science/CS) — also 1 per course. */
  frqFreeAttemptsPerCourse: 1,
  /**
   * Whether AI grading produces detailed line-by-line coaching.
   * FREE: basic rubric points hit + sample answer.
   * PREMIUM: line-by-line feedback + "+1 point" specific coaching.
   * THIS is the monetization lever, not access itself.
   */
  detailedFrqFeedback: false,
  /** Whether analytics shows prescriptive detail (what to fix) vs just diagnosis (where they're weak). */
  fullAnalytics: false,
  /** Whether Sage Coach produces a deep personalized plan (free users get a brief snippet). */
  sageCoachDeepPlan: false,
  /** Whether flashcards use SM-2 smart scheduling. Free = linear order; Premium = spaced-repetition optimized. */
  flashcardSmartScheduling: false,
  /** Cooldown between diagnostics in days. Premium is uncapped. Cadence matches product loop. */
  diagnosticCooldownDays: 14,
} as const;

export type FreeLimits = typeof FREE_LIMITS;

/**
 * Sharpened upgrade-moment copy per 2026-04-22 reviewer feedback.
 * Each lock is framed emotionally — fear of being unprepared — not as a
 * dry feature list. Match these strings exactly when rendering paywalls
 * so the product speaks with one voice.
 */
export const LOCK_COPY = {
  // Refined 2026-04-23 per reviewer — less aggressive, more credible.
  practiceCap:
    "Daily practice limit reached. More practice = faster score improvement.",
  mockExamPaywall:
    "You can't simulate the real exam without Premium.",
  // Refined 2026-04-23 — exam-specific + more direct.
  frqLocked:
    "AP exams are graded on written answers — you're not practicing this.",
  analyticsLocked:
    "See exactly what to fix, not just where you're weak.",
  tutorCap:
    "Students who ask one more question on the concepts they miss pass 2.3× more often. Keep going — unlimited on Premium.",
  sageCoachLocked:
    "Personalized week-by-week plan — not a generic template.",
  // Refined 2026-04-23 with new 14-day cadence.
  diagnosticCooldown:
    "Your diagnostic updates every 14 days. Upgrade to track progress anytime.",
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
