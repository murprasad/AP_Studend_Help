/**
 * Daily goal pure logic — tied to score movement, not Q count.
 *
 * We reuse `projectImprovement` from pass-engine so the daily-goal language
 * stays numerically consistent with the Confidence Repair screen projection.
 *
 * Contract:
 * - `currentPassPercent` is the 0-100 composite mapped from the family's
 *   native score (AP: scaledScore × 20; SAT: scaled/16; ACT: scaled × 2.78).
 *   Caller derives this from /api/readiness so we don't duplicate math.
 * - `answeredToday` is the number of MC questions the user has answered
 *   since local-midnight (caller supplies — DB read lives at the API layer).
 *
 * Output uses the same 0-100 scale so the UI can decide how to render
 * (AP wants "3.5 → 3.8", SAT wants "1200 → 1230"); the delta math is the
 * single source.
 */

import { projectImprovement } from "./pass-engine";

export interface DailyGoal {
  /** Target question count for the day — 10 is our house default. */
  targetQs: number;

  /** Projected pp gained if the user hits target (1 full day of practice). */
  scoreDeltaProjected: number;

  /** true once answeredToday >= targetQs. */
  goalHit: boolean;

  /** 0-100 — fraction of target completed today. Clamped. */
  progressPercent: number;
}

export const DEFAULT_DAILY_TARGET = 10;

/**
 * Compute the day's goal from current readiness + today's answer count.
 *
 * Pure. No DB, no fetch. Callable from server routes, the seeding script,
 * or unit tests.
 */
export function computeDailyGoal(
  currentPassPercent: number,
  answeredToday: number,
  targetQs: number = DEFAULT_DAILY_TARGET,
): DailyGoal {
  const safeCurrent = Number.isFinite(currentPassPercent)
    ? Math.max(0, Math.min(100, currentPassPercent))
    : 0;
  const safeAnswered = Math.max(0, Math.floor(answeredToday || 0));
  const safeTarget = Math.max(1, Math.floor(targetQs || DEFAULT_DAILY_TARGET));

  const projected = projectImprovement(safeCurrent, 1);
  const scoreDeltaProjected = Math.max(0, projected - safeCurrent);

  const goalHit = safeAnswered >= safeTarget;
  const progressPercent = Math.min(100, Math.round((safeAnswered / safeTarget) * 100));

  return {
    targetQs: safeTarget,
    scoreDeltaProjected,
    goalHit,
    progressPercent,
  };
}
