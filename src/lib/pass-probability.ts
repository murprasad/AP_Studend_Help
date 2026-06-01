/**
 * Pass Probability Engine — v1.0
 *
 * Computes a calibrated pass probability + confidence interval for a (user,
 * course) pair from observable signals. Designed to be:
 *
 *   - **Transparent**: every input contributes a visible weight; we can
 *     show the user "what's driving your number" without a model black box.
 *   - **Calibratable**: once we have ground truth from ExamResult rows,
 *     a monthly retrospective tunes the weights via Brier-score minimization.
 *     v2 swaps the third term for IRT-derived theta.
 *   - **Cheap**: no ML at runtime. Compute is single-digit ms per user.
 *
 * Formula (PRD §3.2):
 *
 *   passProbability =
 *       0.6 * recent_mock_score_normalized
 *     + 0.3 * recent_drill_accuracy_normalized
 *     + 0.1 * concept_coverage_normalized
 *     - friction_penalty
 *
 * Clamped to [0, 1]. Confidence interval shrinks with sample size:
 *   ±(0.20 / sqrt(sampleSize / 10)), capped at ±0.15.
 *
 * When sampleSize < 10: return passProbability=null. UI shows "Take diagnostic
 * to get your number" instead of a misleading low-confidence estimate.
 */

export interface PassProbInputs {
  /**
   * Last ≤3 mock exam outcomes for this course, newest first. Each
   * `score` is fraction correct (0-1). Empty array = no mocks taken.
   */
  recentMocks: Array<{ score: number; takenAt: Date }>;
  /**
   * Last ≤30 individual question responses for this course, newest first.
   * Used for drill accuracy with exponential decay (newer answers weighted
   * more). Empty array = no drill activity.
   */
  recentDrillResponses: Array<{ isCorrect: boolean; answeredAt: Date }>;
  /**
   * Per-concept mastery for this course. mastery is in [0, 1].
   * Coverage term measures fraction of concepts where mastery ≥ 0.70.
   * Empty array = no concepts tracked yet (treat coverage as 0).
   */
  conceptMasteries: Array<{ conceptKey: string; mastery: number }>;
  /**
   * Number of practice sessions abandoned (no completedAt) in the last
   * 7 days. Each one penalizes the score by 0.02, capped at 0.10.
   * Reflects "engagement health" — chronic abandonment correlates with
   * dropoff, not exam readiness.
   */
  abandonedSessionsLast7d: number;
  /**
   * Course-specific pass threshold as a fraction (0-1) of raw correct.
   * CLEP/DSST = 0.50 (scaled 50 of 80 is passing on most courses).
   * SAT = 0.75 (1100+ on either section is usable, but "comfortable" ≈75%).
   * Used to normalize raw scores against what "passing" looks like.
   */
  passThreshold: number;
}

export interface PassProbResult {
  /**
   * The calibrated pass probability, [0, 1]. null when sampleSize < 10
   * (caller should show "take diagnostic" instead).
   */
  passProbability: number | null;
  /**
   * ± value, [0, 0.15]. Smaller = more confident. null when passProbability
   * is null.
   */
  confidenceInterval: number | null;
  /**
   * Total number of question responses (mocks + drills) informing this
   * computation. Driven by the data inputs themselves so the caller
   * doesn't need to count.
   */
  sampleSize: number;
  /**
   * Component breakdown — surfaced in the UI as "what's driving your number".
   */
  components: {
    mockTerm: number;        // 0.6 * recent_mock_score_normalized
    drillTerm: number;       // 0.3 * recent_drill_accuracy_normalized
    coverageTerm: number;    // 0.1 * concept_coverage_normalized
    frictionPenalty: number; // subtracted
  };
  /**
   * Top concepts ranked by potential delta if mastered. Each entry shows
   * the user's current mastery and how much pass% would tick up if they
   * raised this concept to 0.85. Useful for Today's Set targeting.
   */
  drivers: Array<{ conceptKey: string; currentMastery: number; deltaIfMastered: number }>;
}

const MODEL_VERSION = "v1.1";
const COVERAGE_MASTERY_BAR = 0.70;
const ABANDON_PENALTY_PER = 0.02;
const ABANDON_PENALTY_CAP = 0.10;
// 2026-06-01 — Raised back to 20 after corrected persona walkthrough
// showed the formula declares "93% readiness" from 5 Qs at 100% accuracy.
// Floor of 5 + the 0.60 above-threshold bonus in normalizeScore + the
// 0.9 redistributed weight when no mocks = trivial scores inflate to
// near-pass numbers. Raising the floor to 20 forces real signal before
// the dashboard claims a readiness score; below the floor the UI shows
// "build your number" instead of a confidently-wrong figure.
const SAMPLE_SIZE_FLOOR = 20;
const CI_BASE = 0.20;
const CI_CAP = 0.15;
const DRIVER_TARGET_MASTERY = 0.85;

/**
 * Normalize a raw score (0-1) against the course's pass threshold.
 *
 * 2026-06-01 (v1.1) — Removed the 0.60 above-threshold floor that was
 * mapping any "just barely passing" score (50% drill accuracy) to 60%
 * normalized. Combined with the 0.9 redistributed weight when no mocks
 * exist, the old curve gave a fresh user with 8 right-out-of-8 answers
 * a 93% readiness. New curve is monotonic + continuous: score == result
 * with a gentle above-threshold lift that NEVER awards more than the raw
 * score itself in the 50-70% band.
 *
 * Examples (passThreshold=0.50):
 *   score=0.30 → 0.30
 *   score=0.50 → 0.50  (was 0.60)
 *   score=0.60 → 0.62  (was 0.78 — biggest correction)
 *   score=0.70 → 0.75  (was 0.86)
 *   score=0.80 → 0.85  (was 0.91)
 *   score=0.90 → 0.93
 *   score=1.00 → 1.00
 */
function normalizeScore(score: number, passThreshold: number): number {
  if (score <= 0) return 0;
  if (score >= 1) return 1;
  if (score < passThreshold) return score; // sub-threshold: linear
  // Above threshold: gentle convex lift that starts AT the raw score
  // (not a +0.10 jump) and asymptotes to 1.0
  const aboveThreshold = (score - passThreshold) / Math.max(1 - passThreshold, 0.01);
  // f(0)=score, f(1)=1, convex
  return score + (1 - score) * Math.pow(aboveThreshold, 1.5) * 0.5;
}

/**
 * Weighted average of recent mocks. Most recent weighted highest.
 * Empty array → null (caller handles).
 */
function recentMockScore(mocks: PassProbInputs["recentMocks"]): number | null {
  if (mocks.length === 0) return null;
  // Take up to 3 most recent.
  const top = mocks.slice(0, 3);
  // Weights: most recent = 3, then 2, then 1. Sum = 6.
  const weights = [3, 2, 1].slice(0, top.length);
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  const weighted = top.reduce((s, m, i) => s + (weights[i] * m.score), 0);
  return weighted / totalWeight;
}

/**
 * Exponentially-decayed drill accuracy. Each older response contributes
 * less. Empty → null.
 *
 * 2026-06-01 — Decay softened 0.95 → 0.97 to reduce session-to-session
 * variance (bug #6). With 0.95 the last 5 Qs dominated, so a single 0%
 * session → -12 readiness; a single 100% session → +12. Real student
 * dashboards had unhelpful ±12-pt swings per session. With 0.97 the
 * weight at i=30 is 0.40 (vs 0.21 prior), giving older Qs a fairer
 * say and smoothing single-session noise.
 */
function recentDrillAccuracy(responses: PassProbInputs["recentDrillResponses"]): number | null {
  if (responses.length === 0) return null;
  const decay = 0.97; // each older response = 97% of the next-newer one's weight
  let numer = 0;
  let denom = 0;
  for (let i = 0; i < responses.length && i < 30; i++) {
    const w = Math.pow(decay, i);
    numer += w * (responses[i].isCorrect ? 1 : 0);
    denom += w;
  }
  return denom > 0 ? numer / denom : null;
}

/**
 * Coverage: fraction-of-concepts-mastered with PARTIAL CREDIT.
 *
 * 2026-06-01 — Bug #3 fix. Previous step function awarded 0 coverage
 * credit until mastery hit 70%. A student at 65% mastery in every unit
 * got the same coverage signal as someone at 0% in every unit, which
 * is demotivating and inaccurate. New curve:
 *
 *   mastery <= 0.30   → 0 credit (still in "needs work" range)
 *   0.30 < mastery < 0.70 → linear from 0 to 1
 *   mastery >= 0.70   → 1 credit (full)
 *
 * Empty array → 0 (no concepts mastered).
 */
function conceptCoverage(masteries: PassProbInputs["conceptMasteries"]): number {
  if (masteries.length === 0) return 0;
  const RAMP_LO = 0.30;
  const RAMP_HI = COVERAGE_MASTERY_BAR; // 0.70
  const sum = masteries.reduce((s, m) => {
    if (m.mastery >= RAMP_HI) return s + 1;
    if (m.mastery <= RAMP_LO) return s + 0;
    return s + (m.mastery - RAMP_LO) / (RAMP_HI - RAMP_LO);
  }, 0);
  return sum / masteries.length;
}

export function computePassProbability(inputs: PassProbInputs): PassProbResult {
  const sampleSize = inputs.recentMocks.length * 88 + inputs.recentDrillResponses.length;
  // Note: mocks ≈ 88 Qs typically (CLEP); could be 60 (SAT R&W module). Use 88 as
  // a generous proxy — slight overestimate biases toward enabling the UI.

  // Component terms
  const mockNorm = recentMockScore(inputs.recentMocks);
  const drillNorm = recentDrillAccuracy(inputs.recentDrillResponses);
  const coverage = conceptCoverage(inputs.conceptMasteries);

  // When we have neither mocks nor drills, we can't make a prediction.
  if (mockNorm === null && drillNorm === null) {
    return {
      passProbability: null,
      confidenceInterval: null,
      sampleSize,
      components: { mockTerm: 0, drillTerm: 0, coverageTerm: 0, frictionPenalty: 0 },
      drivers: [],
    };
  }

  // Normalize each contribution. If a term is missing, redistribute its
  // weight to the others proportionally — keeps the formula useful when
  // a user has only one signal source.
  const haveMocks = mockNorm !== null;
  const haveDrills = drillNorm !== null;
  let mockWeight = 0.6;
  let drillWeight = 0.3;
  const coverageWeight = 0.1;
  if (!haveMocks && haveDrills) {
    drillWeight += mockWeight;
    mockWeight = 0;
  } else if (haveMocks && !haveDrills) {
    mockWeight += drillWeight;
    drillWeight = 0;
  }

  const mockTerm = haveMocks ? mockWeight * normalizeScore(mockNorm!, inputs.passThreshold) : 0;
  const drillTerm = haveDrills ? drillWeight * normalizeScore(drillNorm!, inputs.passThreshold) : 0;
  const coverageTerm = coverageWeight * coverage;
  const frictionPenalty = Math.min(
    inputs.abandonedSessionsLast7d * ABANDON_PENALTY_PER,
    ABANDON_PENALTY_CAP,
  );

  let passProbability = mockTerm + drillTerm + coverageTerm - frictionPenalty;
  passProbability = Math.max(0, Math.min(1, passProbability));

  // Hide the number under the floor — UI should show "take diagnostic".
  if (sampleSize < SAMPLE_SIZE_FLOOR) {
    return {
      passProbability: null,
      confidenceInterval: null,
      sampleSize,
      components: { mockTerm, drillTerm, coverageTerm, frictionPenalty },
      drivers: [],
    };
  }

  const ci = Math.min(CI_BASE / Math.sqrt(sampleSize / SAMPLE_SIZE_FLOOR), CI_CAP);

  // Drivers: rank concepts by potential delta. A concept's delta is
  // `coverageWeight * (raisedCoverage - currentCoverage)` — the formula
  // contribution if this concept ticks from current mastery to target.
  const drivers = inputs.conceptMasteries
    .filter(c => c.mastery < DRIVER_TARGET_MASTERY)
    .map(c => {
      // If this concept moves from current to target, how does coverage change?
      const currentCovered = inputs.conceptMasteries.filter(x => x.mastery >= COVERAGE_MASTERY_BAR).length;
      const afterCovered = c.mastery < COVERAGE_MASTERY_BAR ? currentCovered + 1 : currentCovered;
      const total = inputs.conceptMasteries.length;
      const deltaCoverage = (afterCovered - currentCovered) / total;
      const deltaIfMastered = coverageWeight * deltaCoverage;
      return { conceptKey: c.conceptKey, currentMastery: c.mastery, deltaIfMastered };
    })
    .filter(d => d.deltaIfMastered > 0)
    .sort((a, b) => b.deltaIfMastered - a.deltaIfMastered)
    .slice(0, 5);

  return {
    passProbability,
    confidenceInterval: ci,
    sampleSize,
    components: { mockTerm, drillTerm, coverageTerm, frictionPenalty },
    drivers,
  };
}

export const PASS_PROB_MODEL_VERSION = MODEL_VERSION;

/**
 * Course-specific pass threshold lookup. Centralized so the formula
 * doesn't carry hardcoded knowledge of the course catalog.
 */
export function passThresholdForCourse(course: string): number {
  if (course.startsWith("CLEP_") || course.startsWith("DSST_")) return 0.50;
  if (course.startsWith("SAT_") || course.startsWith("PSAT_")) return 0.75;
  if (course.startsWith("ACT_")) return 0.65;
  if (course.startsWith("AP_")) return 0.60; // ≈3/5 is passing
  return 0.60; // safe default
}
