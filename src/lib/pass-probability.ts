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

const MODEL_VERSION = "v1.0";
const COVERAGE_MASTERY_BAR = 0.70;
const ABANDON_PENALTY_PER = 0.02;
const ABANDON_PENALTY_CAP = 0.10;
// 2026-05-29 — Lowered from 10 to 5 after persona walkthrough showed
// a Pass Plan user with 4 algebra responses fell into the "take diagnostic"
// state — most real users cluster activity in 1-2 courses, making per-course
// floor of 10 too aggressive. With 5 the CI auto-widens to its 0.15 cap,
// which is honest signaling.
const SAMPLE_SIZE_FLOOR = 5;
const CI_BASE = 0.20;
const CI_CAP = 0.15;
const DRIVER_TARGET_MASTERY = 0.85;

/**
 * Normalize a raw score (0-1) against the course's pass threshold. Maps
 * threshold → 0.50, twice-threshold → 1.00, sub-threshold → linear ramp
 * down. Above threshold curves toward 1.0 but never overshoots.
 *
 * Examples (passThreshold=0.50):
 *   score=0.30 → 0.30 (below threshold = same scale)
 *   score=0.50 → 0.60 (at threshold = slight cushion)
 *   score=0.70 → 0.80
 *   score=0.90 → 0.95
 *   score=1.00 → 1.00
 */
function normalizeScore(score: number, passThreshold: number): number {
  if (score <= 0) return 0;
  if (score >= 1) return 1;
  if (score < passThreshold) return score; // sub-threshold: linear
  // Above threshold: map [threshold, 1] → [0.60, 1.00] with diminishing returns
  const aboveThreshold = (score - passThreshold) / Math.max(1 - passThreshold, 0.01);
  return 0.60 + 0.40 * Math.sqrt(aboveThreshold);
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
 */
function recentDrillAccuracy(responses: PassProbInputs["recentDrillResponses"]): number | null {
  if (responses.length === 0) return null;
  const decay = 0.95; // each older response = 95% of the next-newer one's weight
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
 * Fraction of concepts where mastery ≥ COVERAGE_MASTERY_BAR.
 * Empty array → 0 (no concepts mastered).
 */
function conceptCoverage(masteries: PassProbInputs["conceptMasteries"]): number {
  if (masteries.length === 0) return 0;
  const covered = masteries.filter(m => m.mastery >= COVERAGE_MASTERY_BAR).length;
  return covered / masteries.length;
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
