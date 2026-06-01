/**
 * 2026-05-31 — F14 SAT domain-paced study plan (#100 Sprint S4).
 *
 * Generates a multi-day study plan that allocates each remaining day
 * between SAT sections + within sections by content-domain weakness.
 * Plays alongside the existing `generateTodaysSet` (which picks the
 * 12 questions for a given day) — this module picks WHICH course +
 * which domains to focus on that day.
 *
 * Per CB digital SAT spec, each section has 4 content domains. A
 * well-paced plan:
 *   1. Allocates more days to the lower-scaled section first.
 *   2. Within each section, prioritizes the weakest domain.
 *   3. Always reserves the last 1-2 days for full-length mock
 *      simulation (the day(s) right before the exam).
 *
 * Pure functions — no I/O. Test-friendly and easy to swap for an
 * IRT-aware planner when F11 lands.
 */

export interface SatStudyPlanInputs {
  /** Days remaining until the student's real exam date (≥1). */
  daysToExam: number;
  /** Current scaled section scores from the latest mock (200-800 each). */
  sectionScores: {
    math: number | null;
    readingWriting: number | null;
  };
  /** Per-domain mastery (0-100) for both Math and R&W. */
  domainMasteries: Array<{
    unit: string;
    masteryScore: number;
  }>;
}

export interface SatPlannedDay {
  dayIndex: number; // 0 = today, 1 = tomorrow, …
  primaryCourse: "SAT_MATH" | "SAT_READING_WRITING" | "MOCK";
  primaryDomain: string | null;
  secondaryDomain: string | null;
  rationale: string;
}

export interface SatStudyPlanResult {
  totalDays: number;
  /** Days dedicated to a full-length mock (typically last 1-2 days). */
  mockDays: number[];
  schedule: SatPlannedDay[];
}

const MATH_UNITS = [
  "SAT_MATH_1_ALGEBRA",
  "SAT_MATH_2_ADVANCED_MATH",
  "SAT_MATH_3_PROBLEM_SOLVING",
  "SAT_MATH_4_GEOMETRY_TRIG",
];
const RW_UNITS = [
  "SAT_RW_1_CRAFT_STRUCTURE",
  "SAT_RW_2_INFO_IDEAS",
  "SAT_RW_3_STANDARD_ENGLISH",
  "SAT_RW_4_EXPRESSION_IDEAS",
];

function unitsForCourse(course: "SAT_MATH" | "SAT_READING_WRITING"): string[] {
  return course === "SAT_MATH" ? MATH_UNITS : RW_UNITS;
}

/**
 * Pick the weakest domain (lowest mastery) within a section, optionally
 * excluding a unit already used.
 */
function weakestDomainIn(
  course: "SAT_MATH" | "SAT_READING_WRITING",
  masteries: Map<string, number>,
  exclude?: string | null,
): string | null {
  const units = unitsForCourse(course).filter((u) => u !== exclude);
  if (units.length === 0) return null;
  let weakest = units[0];
  let weakestScore = masteries.get(weakest) ?? 0;
  for (const u of units) {
    const s = masteries.get(u) ?? 0;
    if (s < weakestScore) {
      weakest = u;
      weakestScore = s;
    }
  }
  return weakest;
}

/**
 * Allocate days per section based on inverse-score. A 500 student needs
 * ~equal time on both; a 700/500 split needs heavier R&W days.
 * Always reserves the last `min(2, daysToExam-1)` days for mocks.
 */
export function generateSatStudyPlan(
  inputs: SatStudyPlanInputs,
): SatStudyPlanResult {
  const days = Math.max(1, inputs.daysToExam);

  // Reserve last days for mock practice (final day always; second-to-last
  // day too if we have ≥4 days total).
  const mockDays: number[] = [];
  if (days >= 1) mockDays.push(days - 1);
  if (days >= 4) mockDays.push(days - 2);
  mockDays.sort((a, b) => a - b);

  const trainingDays = days - mockDays.length;

  // Compute per-section weighting from current scaled scores. Lower
  // score → more days. Default to even split when no scores yet.
  const m = inputs.sectionScores.math ?? 500;
  const rw = inputs.sectionScores.readingWriting ?? 500;
  // Inverse-distance from 800: a student at 800 needs no days, at 200
  // needs all the days. Weight is the gap.
  const mGap = Math.max(0, 800 - m);
  const rwGap = Math.max(0, 800 - rw);
  const totalGap = mGap + rwGap;
  const mathDays = totalGap > 0
    ? Math.round((mGap / totalGap) * trainingDays)
    : Math.floor(trainingDays / 2);
  const rwDays = trainingDays - mathDays;

  // Build the schedule: training days first (interleaving Math + R&W),
  // then mock days at the end.
  const masteryMap = new Map(
    inputs.domainMasteries.map((m) => [m.unit, m.masteryScore]),
  );
  const schedule: SatPlannedDay[] = [];

  // Interleave Math and R&W training days so we don't burn 4 days of
  // Math in a row and forget R&W. Pattern: M R M R ... with extras
  // appended in the lower-scored section.
  const queue: Array<"SAT_MATH" | "SAT_READING_WRITING"> = [];
  let mRemaining = mathDays;
  let rwRemaining = rwDays;
  while (mRemaining > 0 || rwRemaining > 0) {
    if (mRemaining > rwRemaining) {
      queue.push("SAT_MATH");
      mRemaining -= 1;
    } else {
      queue.push("SAT_READING_WRITING");
      rwRemaining -= 1;
    }
  }

  // Track which domain we last drilled per section so the next session
  // in that section rotates onto the second-weakest domain.
  const lastDomainByCourse = new Map<string, string | null>();
  for (let i = 0; i < queue.length; i += 1) {
    const course = queue[i];
    const last = lastDomainByCourse.get(course) ?? null;
    const primaryDomain = weakestDomainIn(course, masteryMap, last);
    const secondaryDomain = weakestDomainIn(course, masteryMap, primaryDomain);
    lastDomainByCourse.set(course, primaryDomain);
    schedule.push({
      dayIndex: i,
      primaryCourse: course,
      primaryDomain,
      secondaryDomain,
      rationale: primaryDomain
        ? `${course === "SAT_MATH" ? "Math" : "R&W"} — drill weakest domain (${primaryDomain.replace(/^SAT_(MATH|RW)_\d+_/, "")})`
        : `${course === "SAT_MATH" ? "Math" : "R&W"} — general practice`,
    });
  }

  // Mock days at the end.
  for (const d of mockDays) {
    schedule.push({
      dayIndex: d,
      primaryCourse: "MOCK",
      primaryDomain: null,
      secondaryDomain: null,
      rationale:
        d === days - 1
          ? "Test-day rehearsal — full-length adaptive mock + scoring review"
          : "Mock practice — surface remaining gaps before test day",
    });
  }

  // Re-sort by dayIndex so the schedule is chronological.
  schedule.sort((a, b) => a.dayIndex - b.dayIndex);

  return {
    totalDays: days,
    mockDays,
    schedule,
  };
}
