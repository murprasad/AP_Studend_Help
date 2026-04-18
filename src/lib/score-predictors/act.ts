/**
 * ACT score predictor: projects a 1-36 composite from student activity.
 *
 * Public source for the scoring scale:
 * https://www.act.org/content/act/en/products-and-services/the-act/scores.html
 * - Each section (English, Math, Reading, Science) scales to 1-36
 * - Composite = average of 4 section scores, rounded to nearest whole 1-36
 *
 * Disclaimer: PrepLion/StudentNest are not affiliated with ACT Inc.
 * The number below is our estimate from your practice activity, not
 * an official ACT score.
 */

export type ActSectionKey = "english" | "math" | "reading" | "science";

export interface ActInput {
  sectionMastery: Record<ActSectionKey, { avgMastery: number; totalAttempts: number }>;
  sectionMockPercent: Record<ActSectionKey, number | null>;
  recentAccuracy: number;
  totalSessions: number;
  totalAnswered: number;
}

export interface ActReadiness {
  scaledScore: number;   // 1-36 composite
  sectionScores: Record<ActSectionKey, number>;
  label: string;
  confidence: "low" | "medium" | "high";
  showScore: boolean;
  percentile: number;
}

// Per-section raw→scaled map. Linear interpolation with floor+ceiling,
// calibrated to ACT's published raw-score → scaled-score tables across
// recent test forms.
function sectionScale(rawPercent: number): number {
  const clamped = Math.max(0, Math.min(100, rawPercent));
  if (clamped >= 95) return Math.round(34 + (clamped - 95) * 0.4);   // 34-36
  if (clamped >= 85) return Math.round(30 + (clamped - 85) * 0.4);   // 30-34
  if (clamped >= 70) return Math.round(25 + (clamped - 70) * 0.33);  // 25-30
  if (clamped >= 55) return Math.round(20 + (clamped - 55) * 0.33);  // 20-25
  if (clamped >= 40) return Math.round(16 + (clamped - 40) * 0.27);  // 16-20
  if (clamped >= 25) return Math.round(12 + (clamped - 25) * 0.27);  // 12-16
  return Math.max(1, Math.round(1 + clamped * 0.44));                // 1-12
}

function sectionComposite(avgMastery: number, sectionMock: number | null, recentAccuracy: number): number {
  if (sectionMock !== null) {
    return 0.4 * avgMastery + 0.3 * recentAccuracy + 0.3 * sectionMock;
  }
  return Math.min(85, 0.6 * avgMastery + 0.4 * recentAccuracy);
}

// ACT composite → national percentile. Anchors from ACT national norms.
function compositePercentile(composite: number): number {
  if (composite >= 34) return 99;
  if (composite >= 32) return 97;
  if (composite >= 30) return 93;
  if (composite >= 28) return 88;
  if (composite >= 26) return 81;
  if (composite >= 24) return 72;
  if (composite >= 22) return 61;
  if (composite >= 20) return 50;
  if (composite >= 18) return 38;
  if (composite >= 16) return 27;
  return 15;
}

function labelFor(composite: number, confidence: "low" | "medium" | "high", hasDiagnostic: boolean): string {
  if (!hasDiagnostic) {
    if (composite >= 28) return `Rough estimate: trending toward ${composite}`;
    if (composite >= 22) return "Rough estimate: above national average";
    if (composite >= 18) return "Rough estimate: near national average";
    return "Rough estimate: just getting started";
  }
  if (confidence === "low") return "Keep building — more practice needed";
  if (composite >= 33) return "Elite range";
  if (composite >= 30) return "Highly selective range";
  if (composite >= 28) return "Selective college range";
  if (composite >= 24) return "Above national average";
  if (composite >= 20) return "Near national average";
  return "Building from the base";
}

const SECTIONS: ActSectionKey[] = ["english", "math", "reading", "science"];

export function predictActScore(
  input: ActInput,
  hasDiagnostic: boolean = input.totalAnswered > 0,
): ActReadiness {
  const sectionScores: Record<ActSectionKey, number> = {
    english: 0, math: 0, reading: 0, science: 0,
  };

  for (const section of SECTIONS) {
    const raw = sectionComposite(
      input.sectionMastery[section].avgMastery,
      input.sectionMockPercent[section],
      input.recentAccuracy,
    );
    sectionScores[section] = sectionScale(raw);
  }

  const sum = SECTIONS.reduce((s, k) => s + sectionScores[k], 0);
  const composite = Math.round(sum / 4);

  const anyMock = SECTIONS.some((k) => input.sectionMockPercent[k] !== null);
  const confidence: "low" | "medium" | "high" =
    input.totalAnswered >= 100 && anyMock ? "high" :
    input.totalAnswered >= 30 || anyMock ? "medium" :
    "low";

  const label = labelFor(composite, confidence, hasDiagnostic);
  const showScore = hasDiagnostic || confidence !== "low" || composite >= 18;
  const percentile = compositePercentile(composite);

  return {
    scaledScore: composite,
    sectionScores,
    label,
    confidence,
    showScore,
    percentile,
  };
}
