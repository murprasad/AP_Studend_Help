/**
 * SM-2 Spaced Repetition for StudentNest Flashcards.
 *
 * Ported verbatim from PrepLion's implementation. Ratings 0=Forgot,
 * 1=Hard, 2=Good, 3=Easy. Failed reviews (<2) reset repetition count +
 * 1-day interval. Correct but slow (>15s) get a small ease-factor penalty
 * to push them back into rotation sooner. Based on SuperMemo SM-2 with
 * response-time weighting.
 */

export interface SM2State {
  easeFactor: number;   // min 1.3, default 2.5
  interval: number;     // days until next review
  repetitions: number;  // consecutive successful reviews
}

export interface SM2Input {
  rating: number;        // 0-3
  responseTimeMs: number;
  current: SM2State;
}

export interface SM2Result extends SM2State {
  nextReviewAt: Date;
}

export function calculateNextReview(input: SM2Input): SM2Result {
  const { rating, responseTimeMs, current } = input;
  let { easeFactor, interval, repetitions } = current;

  if (rating < 2) {
    // Failed — reset to shortest interval
    repetitions = 0;
    interval = 1;
  } else {
    // Passed — extend interval
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 3;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }

  // Adjust ease factor based on rating (lower rating → bigger drop)
  easeFactor = easeFactor + (0.1 - (3 - rating) * (0.08 + (3 - rating) * 0.02));
  easeFactor = Math.max(1.3, easeFactor);

  // Slow correct answers (>15s) get a slight penalty — the card was
  // "recalled" but fluency is poor, so it needs more exposure.
  if (responseTimeMs > 15000 && rating >= 2) {
    easeFactor = Math.max(1.3, easeFactor - 0.1);
  }

  // Cap to 365 days so an ultra-mastered card still surfaces annually.
  interval = Math.min(365, interval);

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  return { easeFactor, interval, repetitions, nextReviewAt };
}

/** Default state for a newly generated flashcard. */
export const DEFAULT_SM2: SM2State = {
  easeFactor: 2.5,
  interval: 1,
  repetitions: 0,
};
