/**
 * AP score predictor: projects a 1-5 score from student activity.
 *
 * Public source for the scoring scale:
 * https://apstudents.collegeboard.org/about-ap-scores
 * - 5 = extremely well qualified
 * - 4 = well qualified
 * - 3 = qualified (earns college credit at most institutions — the passing line)
 * - 2 = possibly qualified
 * - 1 = no recommendation
 *
 * Input model matches PrepLion's pass-engine so the UI surface code can
 * stay generic across exam lines.
 */

export interface ScoreInput {
  masteryData: Array<{ unit: string; masteryScore: number; totalAttempts: number }>;
  bestMockPercent: number | null;
  recentAccuracy: number;      // 0-100
  totalSessions: number;
  totalAnswered: number;
}

export interface APReadiness {
  scaledScore: 1 | 2 | 3 | 4 | 5;
  rawPercent: number;          // 0-100 composite (pre-scale)
  label: string;
  confidence: "low" | "medium" | "high";
  showScore: boolean;
  distanceToThree: number;     // pp gap to a 3 (passing) — 0 if already there
}

// Piecewise rawPercent → AP score. These are average cutoffs derived
// from public CB percentile distributions across the post-2019 course
// redesigns. Per-course overrides live in `COURSE_REGISTRY[course].apCutoffs`
// when a course has known harder/easier scoring (e.g., AP Physics 1 is
// historically tougher to 5 than AP Psychology).
const DEFAULT_CUTOFFS = { s5: 70, s4: 55, s3: 40, s2: 25 } as const;

export interface APCutoffs { s5: number; s4: number; s3: number; s2: number }

function computeRaw(input: ScoreInput): number {
  const { masteryData, bestMockPercent, recentAccuracy, totalAnswered } = input;
  const avgMastery = masteryData.length > 0
    ? masteryData.reduce((s, m) => s + m.masteryScore, 0) / masteryData.length
    : 0;

  // Low-signal guard: if totalAnswered < 20 and no mock, the composite is
  // too noisy to anchor a score. Return mastery as-is and let the caller
  // decide whether to show the number.
  if (totalAnswered < 20 && bestMockPercent === null) {
    return Math.round(avgMastery);
  }

  // Weighted composite — matches PrepLion's pattern but re-weighted:
  // - With a mock exam: mock is the strongest predictor of real exam performance.
  //   mastery 40% + recent-accuracy 30% + mock 30%.
  // - Without mock: mastery 60% + recent 40%, soft-capped at 85% (can't hit 5
  //   without mock validation).
  let composite: number;
  if (bestMockPercent !== null) {
    composite = 0.4 * avgMastery + 0.3 * recentAccuracy + 0.3 * bestMockPercent;
  } else {
    composite = Math.min(85, 0.6 * avgMastery + 0.4 * recentAccuracy);
  }
  return Math.round(Math.max(0, Math.min(100, composite)));
}

function computeConfidence(input: ScoreInput): "low" | "medium" | "high" {
  const { totalAnswered, bestMockPercent } = input;
  if (totalAnswered >= 100 && bestMockPercent !== null) return "high";
  if (totalAnswered >= 30 || bestMockPercent !== null) return "medium";
  return "low";
}

function scaleToAp(rawPercent: number, cutoffs: APCutoffs): 1 | 2 | 3 | 4 | 5 {
  if (rawPercent >= cutoffs.s5) return 5;
  if (rawPercent >= cutoffs.s4) return 4;
  if (rawPercent >= cutoffs.s3) return 3;
  if (rawPercent >= cutoffs.s2) return 2;
  return 1;
}

function labelFor(scaled: 1 | 2 | 3 | 4 | 5, confidence: "low" | "medium" | "high", hasDiagnostic: boolean): string {
  if (!hasDiagnostic) return "Take diagnostic to start";
  if (confidence === "low") return "Keep building — more practice needed";
  if (scaled === 5) return "On track for a 5";
  if (scaled === 4) return "On track for a 4";
  if (scaled === 3) return "On track for a 3 — college credit line";
  if (scaled === 2) return "Building toward a 3";
  return "Just getting started";
}

export function predictApScore(
  input: ScoreInput,
  cutoffs: APCutoffs = DEFAULT_CUTOFFS,
  hasDiagnostic: boolean = input.totalAnswered > 0,
): APReadiness {
  const rawPercent = computeRaw(input);
  const confidence = computeConfidence(input);
  const scaledScore = scaleToAp(rawPercent, cutoffs);
  const label = labelFor(scaledScore, confidence, hasDiagnostic);

  // Hide the raw % when the user has zero signal. Show the scaled 1-5
  // once they've taken the diagnostic (parallels PrepLion REQ-025).
  const showScore = hasDiagnostic || confidence !== "low" || rawPercent >= 40;

  const distanceToThree = Math.max(0, cutoffs.s3 - rawPercent);

  return { scaledScore, rawPercent, label, confidence, showScore, distanceToThree };
}
