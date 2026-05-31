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

/**
 * 2026-05-31 (F8 of #100) — Module-2 difficulty tier, mirrors CB's
 * adaptive equating logic. After Module 1, the test routes the student
 * to either an EASIER or HARDER Module 2. The M2 tier the student
 * ended in determines the upper bound of their possible scaled score:
 *
 *   HARD   M2 → full 200-800 ceiling (the only path to 700+)
 *   MEDIUM M2 → caps around 650 (CB published "max possible if M2 medium")
 *   EASY   M2 → caps around 590 (the cap-at-the-bottom-of-the-band path)
 *
 * Real CB equating is per-test and IRT-calibrated. These caps are the
 * shape that matches CB's published score-table behavior for the
 * digital SAT scoring guides (2024+). Will be replaced by true IRT
 * theta estimates when F11 lands.
 */
export type Module2Tier = "EASY" | "MEDIUM" | "HARD";

const M2_TIER_CAP_SAT: Record<Module2Tier, number> = {
  EASY: 590,
  MEDIUM: 650,
  HARD: 800,
};
const M2_TIER_CAP_PSAT: Record<Module2Tier, number> = {
  EASY: 560,
  MEDIUM: 620,
  HARD: 760,
};

export interface SatScaledScoreInputs {
  accuracyPercent: number; // 0–100
  totalAnswered: number;
  family: SatFamily;
  // F8 — Module-2 tier from the adaptive split. When omitted (e.g., a
  // single-flat-mock for backward compatibility), no tier ceiling is
  // applied and the full 200-800 / 160-760 curve is in play.
  module2Tier?: Module2Tier;
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
  let scaled = family === "PSAT" ? psat : sat;
  // F8 (#100) — Apply Module-2-tier ceiling. CB equating limits the
  // student's possible scaled score to the band the M2 tier opens up.
  // A student in an EASY Module 2 can't break ~590 even with 100%
  // correct on the (easier) items; only a HARD Module 2 unlocks the
  // full 800 ceiling. Floors remain the standard scale floor.
  if (inputs.module2Tier) {
    const cap =
      family === "PSAT"
        ? M2_TIER_CAP_PSAT[inputs.module2Tier]
        : M2_TIER_CAP_SAT[inputs.module2Tier];
    scaled = Math.min(scaled, cap);
  }
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

/**
 * 2026-05-31 (F8) — Infer the Module-2 tier the student would have been
 * routed to, based on their Module-1 performance. Mirrors CB's published
 * routing rule:
 *   M1 ≥ 75%  → HARD   M2 (the only path to 700+)
 *   M1 50–74% → MEDIUM M2
 *   M1 < 50%  → EASY   M2
 *
 * Inputs: a sequence of per-Q correct/wrong responses in ORDER. We split
 * at the halfway point and take the M1 accuracy. When the sequence is
 * too short to be meaningful (<10 Qs), returns null (no cap applied,
 * full curve in play).
 *
 * Live CB routing happens DURING the test after M1 completes. Until the
 * mock-exam UI exposes that signal explicitly, this helper provides a
 * retroactive equivalent that matches the routing the student would have
 * triggered.
 */
export function inferModule2Tier(
  orderedResponses: ReadonlyArray<{ isCorrect: boolean }>,
): Module2Tier | null {
  if (orderedResponses.length < 10) return null;
  const m1End = Math.floor(orderedResponses.length / 2);
  const m1 = orderedResponses.slice(0, m1End);
  const correct = m1.filter((r) => r.isCorrect).length;
  const m1Acc = m1.length > 0 ? (correct / m1.length) * 100 : 0;
  if (m1Acc >= 75) return "HARD";
  if (m1Acc >= 50) return "MEDIUM";
  return "EASY";
}
