/**
 * A22.8 — Early-win guarantee for low-diagnostic users.
 *
 * If a user's most recent diagnostic on a course scored below the threshold,
 * the existing "attack weakness first" routing is counter-productive: their
 * first 1-2 questions land in their weakest unit and confidence collapses
 * before any learning happens.
 *
 * Fix: promote up to N EASY questions from a DIFFERENT unit than the
 * weakest-unit set to the front of the question pool. Gives the student 1-2
 * guaranteed confidence wins BEFORE the weakness drill starts.
 *
 * Pure helper — same shape as interleaveByUnit so the decision can be
 * unit-tested without a DB or React.
 */

export type DifficultyTier = "EASY" | "MEDIUM" | "HARD";

export interface BoostableQuestion {
  id: string;
  unit: string;
  difficulty: DifficultyTier;
}

/**
 * Decide whether the early-win boost should apply.
 * Threshold: diagnostic average < 50% (low-confidence zone).
 */
export function shouldBoost(avgDiagnosticScore: number, threshold = 50): boolean {
  return Number.isFinite(avgDiagnosticScore) && avgDiagnosticScore < threshold;
}

/**
 * Reorder: promote up to `count` EASY questions from units OUTSIDE `weakUnits`
 * to the front of `questions`. Preserves relative order of the rest.
 * Returns a new array (does not mutate).
 *
 * If no non-weak-unit EASY Q exists → returns original array unchanged.
 */
export function applyEarlyWinBoost<T extends BoostableQuestion>(
  questions: T[],
  weakUnits: string[],
  count = 2,
): T[] {
  if (questions.length < count + 1) return questions;
  const weakSet = new Set(weakUnits);
  const boostable = questions.filter(
    (q) => q.difficulty === "EASY" && !weakSet.has(q.unit),
  );
  if (boostable.length === 0) return questions;

  const boosted = boostable.slice(0, count);
  const boostedIds = new Set(boosted.map((q) => q.id));
  const rest = questions.filter((q) => !boostedIds.has(q.id));
  return [...boosted, ...rest];
}
