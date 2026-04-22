/**
 * Post-diagnostic navigation helpers.
 *
 * Ported from PrepLion — the same focused-practice URL is used by the
 * inline NextStepCard on the results page and (future) dashboard recovery
 * hero. Centralizing here prevents the surfaces from drifting.
 */

/**
 * Build the URL that drops the user into a focused practice session on
 * a specific unit. Defaults to the 5-question "2-minute commitment" that
 * converts post-diagnostic curiosity into a first practice session.
 *
 * - `unit` may be null/undefined; falls back to a no-unit focused session
 *   that still picks 5 questions from the course.
 * - Unit enum values are safe identifiers (e.g. `AP_WORLD_UNIT_1`) but we
 *   run them through encodeURIComponent defensively.
 */
export function buildFocusedPracticeUrl(unit?: string | null, count: number = 5): string {
  const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 5;
  if (unit) {
    return `/practice?unit=${encodeURIComponent(unit)}&mode=focused&count=${safeCount}`;
  }
  return `/practice?mode=focused&count=${safeCount}`;
}
