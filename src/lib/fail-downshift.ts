/**
 * A22.4 — Fail-downshift decision helper.
 *
 * When a student gets 2 consecutive questions wrong in the same unit, the
 * "keep drilling the weak unit" routing becomes punishing: repeated failure
 * with no recovery beat. Per ChatGPT's confidence-recovery analysis, two
 * straight wrongs should trigger a buffer — swap the upcoming question to
 * either a different unit OR an easier difficulty.
 *
 * This module is framework-free so it can be unit-tested and reused from
 * either the client or the server without hauling in React/Prisma.
 */

export type DifficultyTier = "EASY" | "MEDIUM" | "HARD";

export interface ShiftableQuestion {
  id: string;
  unit: string;
  difficulty: DifficultyTier;
}

export interface ShiftResultItem {
  unit: string;
  correct: boolean;
}

/**
 * Decide whether the upcoming question should be swapped.
 * Rule: last 2 answered in the SAME unit, both wrong.
 */
export function shouldDownshift(recentResults: ShiftResultItem[]): boolean {
  if (recentResults.length < 2) return false;
  const last = recentResults[recentResults.length - 1];
  const prev = recentResults[recentResults.length - 2];
  return !last.correct && !prev.correct && last.unit === prev.unit;
}

/**
 * Given the current question, the remaining question pool, and the
 * struggling unit, pick the index (inside `remaining`) of a question to
 * promote to "next up". Priority:
 *   1. A different unit (any difficulty) — breaks the tunnel of failure.
 *   2. Same unit but easier difficulty — keeps the concept, lowers the bar.
 * Returns -1 if no swap candidate exists (no remaining Qs match).
 */
export function pickDownshiftIndex(
  strugglingUnit: string,
  currentDifficulty: DifficultyTier,
  remaining: ShiftableQuestion[],
): number {
  if (remaining.length === 0) return -1;
  const diffOrder: Record<DifficultyTier, number> = { EASY: 0, MEDIUM: 1, HARD: 2 };
  const curRank = diffOrder[currentDifficulty];

  // Pass 1: any other unit
  const otherUnitIdx = remaining.findIndex((q) => q.unit !== strugglingUnit);
  if (otherUnitIdx !== -1) return otherUnitIdx;

  // Pass 2: same unit, strictly easier
  const easierIdx = remaining.findIndex((q) => diffOrder[q.difficulty] < curRank);
  if (easierIdx !== -1) return easierIdx;

  return -1;
}

/**
 * Convenience combinator: given full question array + full result array +
 * currentIndex, return either (null = no change) or the reordered questions
 * array with the chosen swap promoted to `currentIndex + 1`.
 */
export function applyDownshift<T extends ShiftableQuestion>(
  questions: T[],
  results: ShiftResultItem[],
  currentIndex: number,
): T[] | null {
  if (!shouldDownshift(results)) return null;
  if (currentIndex + 1 >= questions.length) return null;

  const struggling = questions[currentIndex];
  const remaining = questions.slice(currentIndex + 1);
  const offset = pickDownshiftIndex(struggling.unit, struggling.difficulty, remaining);
  if (offset === -1) return null;

  const swapAbsoluteIdx = currentIndex + 1 + offset;
  const next = [...questions];
  [next[currentIndex + 1], next[swapAbsoluteIdx]] = [next[swapAbsoluteIdx], next[currentIndex + 1]];
  return next;
}
