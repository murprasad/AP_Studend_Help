/**
 * 2026-05-31 — ACT scoring module (#103 A4 / SN=ACT parity).
 *
 * Enhanced ACT (April 2025 paper / fall 2025 online) scoring:
 *   - Per-section scaled score 1–36 (English, Math, Reading, Science)
 *   - Composite = avg of English + Math + Reading (Science EXCLUDED)
 *   - STEM = avg of Math + Science (only when Science was taken)
 *   - Total per-section question counts after the enhancement:
 *       English  50 / 35 min
 *       Math     45 / 50 min   ← 4-option MCQ (was 5)
 *       Reading  36 / 40 min
 *       Science  40 / 40 min   ← OPTIONAL, doesn't enter composite
 *
 * Section scaling
 * - ACT publishes per-administration raw-to-scale conversion tables
 *   that vary slightly. Like CB's SAT curves, the shape is the same:
 *   piecewise interpolation anchored at the published conversion bands.
 * - The curves below are calibrated to ACT's most recent published
 *   practice-test scoring sheets (Form 23MC4 / Practice Test 2 / 2025
 *   Enhanced-ACT scoring guide). 50%-accuracy → mid-20s; 80% → low-30s;
 *   95%+ → 35-36.
 * - Will be replaced by per-administration IRT calibration when F11
 *   (the SAT-side IRT wiring) gets generalized.
 */

export type ActSection = "ENGLISH" | "MATH" | "READING" | "SCIENCE";

export interface ActSectionScore {
  scaledScore: number; // 1-36
  scaleMin: 1;
  scaleMax: 36;
  section: ActSection;
}

export interface ActScoringInputs {
  accuracyPercent: number; // 0-100
  totalAnswered: number;
  section: ActSection;
}

export interface ActCompositeInputs {
  english: number | null; // 1-36 scaled
  math: number | null;
  reading: number | null;
  science: number | null; // optional — null means student skipped
}

export interface ActCompositeResult {
  composite: number | null; // 1-36; null if any of English/Math/Reading missing
  stem: number | null; // 1-36; null unless BOTH Math + Science are present
  includesScience: boolean;
}

// Per-section curve: accuracy → scale anchors. Shape calibrated against
// ACT's published practice-test scoring tables.
const CURVE_BY_SECTION: Record<ActSection, Array<{ accuracy: number; scaled: number }>> = {
  ENGLISH: [
    { accuracy: 0,   scaled: 1 },
    { accuracy: 25,  scaled: 14 },
    { accuracy: 50,  scaled: 22 },
    { accuracy: 70,  scaled: 27 },
    { accuracy: 85,  scaled: 31 },
    { accuracy: 95,  scaled: 34 },
    { accuracy: 100, scaled: 36 },
  ],
  MATH: [
    { accuracy: 0,   scaled: 1 },
    { accuracy: 25,  scaled: 16 },
    { accuracy: 50,  scaled: 22 },
    { accuracy: 70,  scaled: 26 },
    { accuracy: 85,  scaled: 30 },
    { accuracy: 95,  scaled: 33 },
    { accuracy: 100, scaled: 36 },
  ],
  READING: [
    { accuracy: 0,   scaled: 1 },
    { accuracy: 25,  scaled: 14 },
    { accuracy: 50,  scaled: 22 },
    { accuracy: 70,  scaled: 27 },
    { accuracy: 85,  scaled: 31 },
    { accuracy: 95,  scaled: 34 },
    { accuracy: 100, scaled: 36 },
  ],
  SCIENCE: [
    { accuracy: 0,   scaled: 1 },
    { accuracy: 25,  scaled: 15 },
    { accuracy: 50,  scaled: 21 },
    { accuracy: 70,  scaled: 26 },
    { accuracy: 85,  scaled: 30 },
    { accuracy: 95,  scaled: 33 },
    { accuracy: 100, scaled: 36 },
  ],
};

/**
 * Convert (accuracy%, section) → 1–36 scaled score using ACT's
 * published curve shape. Returns null when sample size is too small
 * to be meaningful (<10 answered).
 */
export function computeActSectionScore(
  inputs: ActScoringInputs,
): ActSectionScore | null {
  if (inputs.totalAnswered < 10) return null;
  const acc = Math.max(0, Math.min(100, inputs.accuracyPercent));
  const curve = CURVE_BY_SECTION[inputs.section];
  let lo = curve[0];
  let hi = curve[curve.length - 1];
  for (let i = 0; i < curve.length - 1; i += 1) {
    if (acc >= curve[i].accuracy && acc <= curve[i + 1].accuracy) {
      lo = curve[i];
      hi = curve[i + 1];
      break;
    }
  }
  const t = hi.accuracy === lo.accuracy
    ? 0
    : (acc - lo.accuracy) / (hi.accuracy - lo.accuracy);
  const raw = lo.scaled + t * (hi.scaled - lo.scaled);
  // Round to the nearest integer — ACT scores are whole numbers.
  const scaled = Math.max(1, Math.min(36, Math.round(raw)));
  return {
    scaledScore: scaled,
    scaleMin: 1,
    scaleMax: 36,
    section: inputs.section,
  };
}

/**
 * Compute Composite + STEM per the Enhanced ACT rules.
 *
 * Composite = round((English + Math + Reading) / 3). Requires all three.
 * STEM      = round((Math + Science) / 2). Requires both; null otherwise.
 *
 * Per ACT scoring spec, both averages round to the nearest integer.
 * ACT's scoring guides state .5 rounds UP (away from zero) for these
 * derived scores; that's reflected here.
 */
export function computeActComposite(
  inputs: ActCompositeInputs,
): ActCompositeResult {
  const { english, math, reading, science } = inputs;
  const coreComplete = english != null && math != null && reading != null;
  const composite = coreComplete
    ? Math.round((english + math + reading) / 3)
    : null;
  const stem = math != null && science != null
    ? Math.round((math + science) / 2)
    : null;
  return {
    composite,
    stem,
    includesScience: science != null,
  };
}

const COURSE_TO_SECTION: Record<string, ActSection | undefined> = {
  ACT_ENGLISH: "ENGLISH",
  ACT_MATH: "MATH",
  ACT_READING: "READING",
  ACT_SCIENCE: "SCIENCE",
};

export function sectionForCourse(course: string): ActSection | null {
  return COURSE_TO_SECTION[course] ?? null;
}

export function isActCourse(course: string | null | undefined): boolean {
  return !!course && course in COURSE_TO_SECTION;
}
