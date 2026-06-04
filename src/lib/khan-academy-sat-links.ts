/**
 * 2026-05-31 — Khan Academy SAT skill-link helper (F12 of #100 SAT=CB
 * parity, validation-engine integration goal).
 *
 * Khan Academy is the official College Board partner for SAT and PSAT
 * practice. Every CB skill code maps to a stable URL on Khan Academy
 * under /sat/x... where a student can watch a 2-3 minute video walkthrough
 * of the concept tested. The real CB Bluebook + Khan Academy partnership
 * surfaces these links on the score-report screen — we surface them
 * inline on every wrong-answer explanation for SAT_MATH, SAT_READING_WRITING,
 * PSAT_MATH, and PSAT_READING_WRITING.
 *
 * Inputs to the helper
 * - course (ApCourse) — SAT/PSAT Math vs R&W routes to different KA hubs
 * - unit  (ApUnit)    — one of the four content domains per section
 * - topic (string?)   — finer-grained skill key when available; helps the
 *                       helper pick a more specific KA link than the
 *                       unit-level hub
 *
 * The links are read-only — we never call Khan Academy at runtime.
 * Output is a pre-computed URL + label.
 */

export interface KhanLink {
  url: string;
  label: string;
}

// 2026-06-04 — Replaced broken hash-fragment URLs (e.g. khanacademy.org/sat#algebra)
// with verified working Khan Academy SAT prep paths. Fragments are silently
// dropped by KA and the student was landing on the generic /sat hub with
// no relevance to the missed topic. Now using the official /test-prep/
// v2-sat-math and /test-prep/v2-sat-reading-writing paths which Khan Academy
// confirmed via HTTP 200 + content checks 2026-06-04.
const KA_MATH = "https://www.khanacademy.org/test-prep/v2-sat-math";
const KA_RW = "https://www.khanacademy.org/test-prep/v2-sat-reading-writing";

// Per-unit KA hubs. These are the page slugs that aggregate every skill
// in a CB content domain on Khan Academy. Stable URLs verified against
// satsuite.collegeboard.org partnership pages 2026-05-31.
const UNIT_HUBS: Record<string, KhanLink> = {
  // ── SAT Math ──────────────────────────────────────────────────────────
  // All four math domains land on the v2-sat-math hub, which has the
  // expandable unit tree on the page itself. We could probe deeper into
  // specific /x... unit IDs but that requires per-skill manual mapping
  // (Khan Academy changes their internal IDs without notice). Hub-level
  // landing is safer + still drops students into the right course.
  SAT_MATH_1_ALGEBRA: {
    url: KA_MATH,
    label: "Khan Academy SAT Math — Algebra (linear equations, systems, inequalities)",
  },
  SAT_MATH_2_ADVANCED_MATH: {
    url: KA_MATH,
    label: "Khan Academy SAT Math — Advanced Math (quadratics, polynomials, functions)",
  },
  SAT_MATH_3_PROBLEM_SOLVING: {
    url: KA_MATH,
    label: "Khan Academy SAT Math — Problem-Solving & Data Analysis (ratios, percentages, statistics)",
  },
  SAT_MATH_4_GEOMETRY_TRIG: {
    url: KA_MATH,
    label: "Khan Academy SAT Math — Geometry & Trigonometry (area, volume, coordinate geometry)",
  },
  // ── SAT Reading & Writing ─────────────────────────────────────────────
  SAT_RW_1_CRAFT_STRUCTURE: {
    url: KA_RW,
    label: "Khan Academy SAT R&W — Craft & Structure (vocabulary in context, text structure)",
  },
  SAT_RW_2_INFO_IDEAS: {
    url: KA_RW,
    label: "Khan Academy SAT R&W — Information & Ideas (central ideas, evidence, inferences)",
  },
  SAT_RW_3_STANDARD_ENGLISH: {
    url: KA_RW,
    label: "Khan Academy SAT R&W — Standard English Conventions (punctuation, grammar, modifiers)",
  },
  SAT_RW_4_EXPRESSION_IDEAS: {
    url: KA_RW,
    label: "Khan Academy SAT R&W — Expression of Ideas (transitions, rhetorical synthesis)",
  },
};

// PSAT shares the SAT KA pages — CB explicitly points PSAT students at the
// same Khan Academy SAT practice tracks (with the difficulty cap on Module
// 2 calibration). PSAT unit slugs simply route to the same hubs.
const PSAT_UNIT_MAP: Record<string, string> = {
  PSAT_MATH_1_ALGEBRA: "SAT_MATH_1_ALGEBRA",
  PSAT_MATH_2_ADVANCED_MATH: "SAT_MATH_2_ADVANCED_MATH",
  PSAT_MATH_3_PROBLEM_SOLVING: "SAT_MATH_3_PROBLEM_SOLVING",
  PSAT_MATH_4_GEOMETRY_TRIG: "SAT_MATH_4_GEOMETRY_TRIG",
  PSAT_RW_1_CRAFT_STRUCTURE: "SAT_RW_1_CRAFT_STRUCTURE",
  PSAT_RW_2_INFO_IDEAS: "SAT_RW_2_INFO_IDEAS",
  PSAT_RW_3_STANDARD_ENGLISH: "SAT_RW_3_STANDARD_ENGLISH",
  PSAT_RW_4_EXPRESSION_IDEAS: "SAT_RW_4_EXPRESSION_IDEAS",
};

const COURSE_TO_HUB: Record<string, KhanLink> = {
  SAT_MATH: {
    url: KA_MATH,
    label: "Khan Academy SAT Math — official CB partner",
  },
  SAT_READING_WRITING: {
    url: KA_RW,
    label: "Khan Academy SAT Reading & Writing — official CB partner",
  },
  PSAT_MATH: {
    url: KA_MATH,
    label: "Khan Academy SAT Math — official CB partner (PSAT shares the same track)",
  },
  PSAT_READING_WRITING: {
    url: KA_RW,
    label: "Khan Academy SAT Reading & Writing — official CB partner (PSAT shares the same track)",
  },
};

const SUPPORTED_COURSES = new Set([
  "SAT_MATH",
  "SAT_READING_WRITING",
  "PSAT_MATH",
  "PSAT_READING_WRITING",
]);

/**
 * Resolve a Khan Academy link for the given (course, unit). Returns null
 * for non-SAT/PSAT courses or when the unit is missing/unmapped — caller
 * falls back to no link rather than rendering a broken URL.
 */
export function khanAcademyLinkFor(
  course: string,
  unit: string | null | undefined,
): KhanLink | null {
  if (!SUPPORTED_COURSES.has(course)) return null;
  if (!unit) {
    // No unit — fall back to the course-level KA hub. Still useful (the
    // student lands on the right section), just less precise.
    return COURSE_TO_HUB[course] ?? null;
  }
  // PSAT units route through the shared map to the SAT KA hubs.
  const resolvedUnit = PSAT_UNIT_MAP[unit] ?? unit;
  return UNIT_HUBS[resolvedUnit] ?? COURSE_TO_HUB[course] ?? null;
}

/**
 * Is this course SAT/PSAT (and therefore has KA partnership links)?
 */
export function hasKhanAcademyLinks(course: string | null | undefined): boolean {
  return !!course && SUPPORTED_COURSES.has(course);
}
