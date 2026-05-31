/**
 * 2026-05-31 — Digital SAT scaled score module (F7 of #100 SAT=CB parity).
 *
 * Per the College Board score scale:
 *   - Each SAT section reports 200–800 (Math, Reading & Writing).
 *   - Total SAT score = sum of the two section scores, 400–1600.
 *   - PSAT/NMSQT uses 160–760 per section and 320–1520 total.
 *
 * A real SAT score curve is IRT-calibrated and weighted across the
 * two-module adaptive structure. We don't have IRT difficulty per Q yet
 * (that's queued as F11 / PRD Phase 2 IRT wire), so this module ships
 * a calibrated linear-piecewise curve that:
 *   - Anchors a 0% accuracy mock to the floor (200 / 160).
 *   - Anchors a 100% accuracy mock to the ceiling (800 / 760).
 *   - Bends at 50%/70%/85% to match the published CB scoring tables'
 *     general shape (low accuracy ranges convert to mid-300s, mid-range
 *     accuracy to mid-500s, 85%+ accuracy to 700+).
 *
 * F8 will replace the constant bend points with a Module-2-tier-aware
 * curve (an M2-hard ceiling vs M2-easy ceiling will yield different
 * scaled-score bands at the same raw accuracy).
 *
 * F11 / IRT will replace the entire piecewise curve with a true theta
 * estimate that respects per-Q difficulty rather than treating all Qs
 * as equally weighted.
 */

export type SatFamily = "SAT" | "PSAT";

export interface SatSectionScore {
  /** Scaled section score (200–800 SAT / 160–760 PSAT) */
  scaledScore: number;
  /** Floor of the score scale */
  scaleMin: number;
  /** Ceiling of the score scale */
  scaleMax: number;
  /** Family the score belongs to */
  family: SatFamily;
}

export interface SatScaledScoreInputs {
  accuracyPercent: number; // 0–100
  totalAnswered: number;
  family: SatFamily;
}

const CURVE: Array<{ accuracy: number; sat: number; psat: number }> = [
  { accuracy: 0,   sat: 200, psat: 160 },
  { accuracy: 25,  sat: 350, psat: 300 },
  { accuracy: 50,  sat: 500, psat: 460 },
  { accuracy: 70,  sat: 620, psat: 580 },
  { accuracy: 85,  sat: 720, psat: 680 },
  { accuracy: 100, sat: 800, psat: 760 },
];

/**
 * Convert accuracy → scaled section score using a published-curve-shaped
 * linear interpolation. Returns null when sample size is too small for the
 * estimate to be meaningful (<10 answered).
 */
export function computeSatSectionScore(
  inputs: SatScaledScoreInputs,
): SatSectionScore | null {
  if (inputs.totalAnswered < 10) return null;
  const acc = Math.max(0, Math.min(100, inputs.accuracyPercent));
  // Find the two curve anchors the accuracy lies between
  let lo = CURVE[0];
  let hi = CURVE[CURVE.length - 1];
  for (let i = 0; i < CURVE.length - 1; i += 1) {
    if (acc >= CURVE[i].accuracy && acc <= CURVE[i + 1].accuracy) {
      lo = CURVE[i];
      hi = CURVE[i + 1];
      break;
    }
  }
  const t = hi.accuracy === lo.accuracy
    ? 0
    : (acc - lo.accuracy) / (hi.accuracy - lo.accuracy);
  const sat = lo.sat + t * (hi.sat - lo.sat);
  const psat = lo.psat + t * (hi.psat - lo.psat);
  const family = inputs.family;
  const scaled = family === "PSAT" ? psat : sat;
  // Round to the nearest 10, like CB's published score tables.
  const rounded = Math.round(scaled / 10) * 10;
  return {
    scaledScore: rounded,
    scaleMin: family === "PSAT" ? 160 : 200,
    scaleMax: family === "PSAT" ? 760 : 800,
    family,
  };
}

const SAT_COURSE_TO_FAMILY: Record<string, SatFamily | undefined> = {
  SAT_MATH: "SAT",
  SAT_READING_WRITING: "SAT",
  PSAT_MATH: "PSAT",
  PSAT_READING_WRITING: "PSAT",
};

export function familyForCourse(course: string): SatFamily | null {
  return SAT_COURSE_TO_FAMILY[course] ?? null;
}

export function isSatLikeCourse(course: string): boolean {
  return familyForCourse(course) !== null;
}
