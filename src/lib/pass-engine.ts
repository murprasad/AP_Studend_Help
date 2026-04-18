/**
 * Pass Engine helpers (ported from PrepLion).
 *
 * Pure utilities — no DB, no React. Kept minimal on StudentNest; extend
 * when the full pass-probability pipeline is ported from PrepLion.
 */

export interface ReadinessDisplay {
  label: string;
  showPercent: boolean;
  percent: number;
}

/**
 * Single source of truth for how a pass % is rendered next to the gauge.
 * Hides a raw "2%" number from users with genuinely zero signal (no
 * diagnostic AND low confidence AND pp<40).
 */
export function getReadinessDisplay(
  passPercent: number,
  confidence: "low" | "medium" | "high",
  hasDiagnostic: boolean,
): ReadinessDisplay {
  const hideAtLowConfidence = confidence === "low" && passPercent < 40 && !hasDiagnostic;

  let label: string;
  if (passPercent >= 80) label = "Ready to pass!";
  else if (passPercent >= 60) label = "Getting close";
  else if (passPercent >= 40) label = "Keep building";
  else if (passPercent > 0 && confidence === "low") label = "Just getting started";
  else if (passPercent > 0) label = "You're on your way";
  else if (hasDiagnostic) label = "Momentum started";
  else label = "Take diagnostic to start";

  return {
    label,
    showPercent: !hideAtLowConfidence,
    percent: passPercent,
  };
}

/**
 * Conservative daily-improvement projection used by the Confidence Repair
 * screen. Intentionally LOW — we'd rather underpromise and have a student
 * beat the number than overpromise and have them quit when reality lags.
 *
 * Baseline: ~3 pp/day for a motivated student.
 * Diminishing returns: every 10 points gained cuts the next day's rate by ~25%.
 * Ceiling: 95%.
 */
export function projectImprovement(currentPassPercent: number, days: number): number {
  if (days <= 0) return currentPassPercent;
  if (currentPassPercent >= 95) return 95;

  let projected = Math.max(0, currentPassPercent);
  for (let d = 0; d < days; d++) {
    const pointsAbove = Math.max(0, projected - currentPassPercent);
    const dampening = Math.max(0.25, 1 - (pointsAbove / 10) * 0.25);
    const dailyGain = 3 * dampening;
    projected = Math.min(95, projected + dailyGain);
  }
  return Math.round(projected);
}
