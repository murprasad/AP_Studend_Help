/**
 * SAT score predictor: projects a 400-1600 composite from student activity.
 *
 * Public source for the scoring scale:
 * https://satsuite.collegeboard.org/sat/scores/understanding-scores
 * - Math section: 200-800
 * - Reading and Writing section: 200-800 (merged in the digital SAT)
 * - Total composite: 400-1600
 *
 * Input model matches PrepLion's pass-engine so the UI surface can
 * stay generic. Sections are predicted independently then summed.
 *
 * Disclaimer: PrepLion/StudentNest are not affiliated with the College
 * Board. The number below is our estimate from your practice activity —
 * not an official score. College Board is the official scorer.
 */

export interface SatInput {
  // Per-section mastery data. Section code is "math" | "reading_writing".
  sectionMastery: Record<"math" | "reading_writing", { avgMastery: number; totalAttempts: number }>;
  sectionMockPercent: Record<"math" | "reading_writing", number | null>;
  recentAccuracy: number;
  totalSessions: number;
  totalAnswered: number;
}

export interface SatReadiness {
  scaledScore: number;       // 400-1600 composite
  sectionScores: { math: number; readingWriting: number };   // 200-800 each
  label: string;
  confidence: "low" | "medium" | "high";
  showScore: boolean;
  percentile: number;        // rough national percentile (0-100)
}

// Per-section raw→scaled map. Logistic curve calibrated to CB's
// published concordance anchors (400, 800, 1200, 1400, 1520, 1600).
// Input: rawPercent 0-100. Output: 200-800 integer per section.
function sectionScale(rawPercent: number): number {
  const clamped = Math.max(0, Math.min(100, rawPercent));
  // Piecewise anchors derived from CB Qs-correct → scaled charts:
  //   0%  → 200     (floor, guessing)
  //   50% → 510     (cohort average math + R&W each)
  //   75% → 660
  //   90% → 750
  //   100% → 800    (ceiling)
  if (clamped >= 90) return Math.round(750 + (clamped - 90) * 5);
  if (clamped >= 75) return Math.round(660 + (clamped - 75) * 6);
  if (clamped >= 50) return Math.round(510 + (clamped - 50) * 6);
  // Below 50: linear from 200 at 0% to 510 at 50%
  return Math.round(200 + clamped * 6.2);
}

function sectionComposite(avgMastery: number, sectionMock: number | null, recentAccuracy: number): number {
  if (sectionMock !== null) {
    return 0.4 * avgMastery + 0.3 * recentAccuracy + 0.3 * sectionMock;
  }
  return Math.min(85, 0.6 * avgMastery + 0.4 * recentAccuracy);
}

// Convert a 400-1600 composite to a rough national percentile.
// Source anchors from CB 2024 percentile tables.
function compositePercentile(total: number): number {
  if (total >= 1500) return 98;
  if (total >= 1400) return 94;
  if (total >= 1300) return 86;
  if (total >= 1200) return 74;
  if (total >= 1100) return 58;
  if (total >= 1000) return 40;
  if (total >= 900) return 24;
  if (total >= 800) return 12;
  return 5;
}

function labelFor(total: number, confidence: "low" | "medium" | "high", hasDiagnostic: boolean): string {
  if (!hasDiagnostic) {
    if (total >= 1400) return `Rough estimate: trending toward ${total}`;
    if (total >= 1200) return "Rough estimate: above national average";
    if (total >= 1050) return "Rough estimate: near national average";
    return "Rough estimate: just getting started";
  }
  if (confidence === "low") return "Keep building — more practice needed";
  if (total >= 1500) return "Reach-school range";
  if (total >= 1400) return "Competitive school range";
  if (total >= 1300) return "Strong composite";
  if (total >= 1200) return "Above national average";
  if (total >= 1100) return "Near national average";
  return "Building from the base";
}

export function predictSatScore(
  input: SatInput,
  hasDiagnostic: boolean = input.totalAnswered > 0,
): SatReadiness {
  const mathRaw = sectionComposite(
    input.sectionMastery.math.avgMastery,
    input.sectionMockPercent.math,
    input.recentAccuracy,
  );
  const rwRaw = sectionComposite(
    input.sectionMastery.reading_writing.avgMastery,
    input.sectionMockPercent.reading_writing,
    input.recentAccuracy,
  );

  const mathScaled = sectionScale(mathRaw);
  const rwScaled = sectionScale(rwRaw);
  const total = mathScaled + rwScaled;

  const { totalAnswered } = input;
  const anyMock = input.sectionMockPercent.math !== null || input.sectionMockPercent.reading_writing !== null;
  const confidence: "low" | "medium" | "high" =
    totalAnswered >= 100 && anyMock ? "high" :
    totalAnswered >= 30 || anyMock ? "medium" :
    "low";

  const label = labelFor(total, confidence, hasDiagnostic);
  const showScore = hasDiagnostic || confidence !== "low" || total >= 900;
  const percentile = compositePercentile(total);

  return {
    scaledScore: total,
    sectionScores: { math: mathScaled, readingWriting: rwScaled },
    label,
    confidence,
    showScore,
    percentile,
  };
}
