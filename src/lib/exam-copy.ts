/**
 * src/lib/exam-copy.ts — exam-family-aware copy helper.
 *
 * Course strings on StudentNest are like "AP_BIOLOGY", "SAT_MATH",
 * "ACT_ENGLISH", "CLEP_..." (CLEP rows are vestigial schema entries —
 * never visible on StudentNest). Many UI surfaces had hardcoded AP
 * language ("projected AP score", "gap to a 4", "weakest unit") that
 * was wrong for SAT/ACT students.
 *
 * One source of truth, one helper. UI surfaces call `getExamCopy(course)`
 * and pull the strings/values they need. New courses → add a branch here.
 *
 * Pure function, no I/O, no React hooks.
 */

export type ExamFamily = "AP" | "SAT" | "ACT" | "CLEP" | "DSST";

export type ExamCopy = {
  /** Family code: AP, SAT, ACT, CLEP, DSST */
  family: ExamFamily;
  /** Display name of the exam family ("AP", "SAT", "ACT") */
  examName: string;
  /** Full label for "the score" — "AP score", "SAT score", "ACT composite" */
  scoreLabel: string;
  /** "projected AP score", "projected SAT score", etc — used in CTAs */
  projectedScoreLabel: string;
  /** Lowest possible score, highest possible score, target ("good") score */
  scoreScale: { min: number; max: number; target: number };
  /** "/5", "/1600", "/36", "/80" — for predicted-score chips */
  scoreSuffix: string;
  /** Phrase for "the gap to a good score" — "the units closing the gap to a 4" */
  gapPhrase: string;
  /** Plural noun for syllabus subdivisions: "units" (AP), "sections" (ACT), "domains" (SAT) */
  unitTerm: string;
  /** Whether this exam family has FRQs / open-response items.
   *  AP yes (mostly); SAT no; ACT no; CLEP no for most subjects. */
  hasFreeResponse: boolean;
  /** When-it-matters copy for stakes framing.
   *  AP: "exam in May"; SAT/ACT: "before your test date"; CLEP: "earn college credit" */
  stakesCopy: string;
};

const AP_COPY: Omit<ExamCopy, "family"> = {
  examName: "AP",
  scoreLabel: "AP score",
  projectedScoreLabel: "projected AP score",
  scoreScale: { min: 1, max: 5, target: 4 },
  scoreSuffix: "/5",
  gapPhrase: "the units closing the gap to a 4",
  unitTerm: "units",
  hasFreeResponse: true,
  stakesCopy: "before your AP exam in May",
};

const SAT_COPY: Omit<ExamCopy, "family"> = {
  examName: "SAT",
  scoreLabel: "SAT score",
  projectedScoreLabel: "projected SAT score",
  scoreScale: { min: 400, max: 1600, target: 1400 },
  scoreSuffix: "/1600",
  gapPhrase: "the sections closing the gap to a 1400+",
  unitTerm: "domains",
  hasFreeResponse: false,
  stakesCopy: "before your SAT test date",
};

const ACT_COPY: Omit<ExamCopy, "family"> = {
  examName: "ACT",
  scoreLabel: "ACT composite",
  projectedScoreLabel: "projected ACT score",
  scoreScale: { min: 1, max: 36, target: 30 },
  scoreSuffix: "/36",
  gapPhrase: "the sections closing the gap to a 30+",
  unitTerm: "sections",
  hasFreeResponse: false,
  stakesCopy: "before your ACT test date",
};

const CLEP_COPY: Omit<ExamCopy, "family"> = {
  examName: "CLEP",
  scoreLabel: "CLEP score",
  projectedScoreLabel: "projected CLEP score",
  scoreScale: { min: 20, max: 80, target: 50 },
  scoreSuffix: "/80",
  gapPhrase: "the topics closing the gap to a passing score",
  unitTerm: "topics",
  hasFreeResponse: false,
  stakesCopy: "to earn college credit and save ~$1,200 in tuition",
};

const DSST_COPY: Omit<ExamCopy, "family"> = {
  examName: "DSST",
  scoreLabel: "DSST score",
  projectedScoreLabel: "projected DSST score",
  scoreScale: { min: 200, max: 500, target: 400 },
  scoreSuffix: "/500",
  gapPhrase: "the topics closing the gap to a passing score",
  unitTerm: "topics",
  hasFreeResponse: false,
  stakesCopy: "to earn college credit",
};

/**
 * Map a course code to the family-appropriate copy bundle.
 * Defaults to AP if the course code doesn't match a known prefix —
 * preserves existing behavior on edge cases.
 */
export function getExamCopy(course: string | null | undefined): ExamCopy {
  const c = (course ?? "").toUpperCase();
  if (c.startsWith("ACT_")) return { family: "ACT", ...ACT_COPY };
  if (c.startsWith("SAT_") || c.startsWith("PSAT_")) return { family: "SAT", ...SAT_COPY };
  if (c.startsWith("CLEP_")) return { family: "CLEP", ...CLEP_COPY };
  if (c.startsWith("DSST_")) return { family: "DSST", ...DSST_COPY };
  return { family: "AP", ...AP_COPY };
}

/**
 * Convenience: just the family code, for branching (e.g., hide FRQ tab
 * for non-AP families).
 */
export function getExamFamily(course: string | null | undefined): ExamFamily {
  return getExamCopy(course).family;
}

/**
 * Single-source link to the family-appropriate full-length simulator.
 * SAT/PSAT/ACT students go to /full-practice-test ("Full Practice Test" —
 * CB / ACT native term). AP / CLEP students go to /mock-exam ("Mock Exam"
 * — established AP term).
 *
 * Used by every dashboard / post-session surface that promotes the
 * full-length test, so a SAT student never sees "Mock Exam" copy or
 * lands on the AP-only /mock-exam route. PCA per
 * [[project_sn_ap_first_architecture_debt_2026-06-04]].
 */
export function getFullExamLink(
  course: string | null | undefined,
  extraQuery?: Record<string, string>,
): { href: string; label: string; shortLabel: string } {
  const family = getExamFamily(course);
  const qs = extraQuery
    ? "?" + new URLSearchParams(extraQuery).toString()
    : "";
  if (family === "SAT" || family === "ACT") {
    return {
      href: `/full-practice-test${qs}`,
      label: "Full Practice Test",
      shortLabel: "Full Test",
    };
  }
  return {
    href: `/mock-exam${qs}`,
    label: "Mock Exam",
    shortLabel: "Mock",
  };
}
