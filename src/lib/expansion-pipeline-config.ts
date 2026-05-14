/**
 * Per-course generation/validation overrides for the expansion pipeline.
 *
 * The base ensemble (5-judge, ≥2 PASS quorum, 200-floor safety) handles
 * AP / SAT / ACT / CLEP cleanly. New verticals (TEAS, PSAT, ASVAB, GRE)
 * need targeted strictness adjustments that aren't appropriate to apply
 * globally — e.g., TEAS_SCIENCE A&P needs ≥3 PASS + paid-judge co-sign
 * because of the higher fact-error stakes for nursing-school applicants.
 *
 * Rules are matched by course-name prefix, longest-prefix-wins, so
 * "TEAS_SCIENCE" beats "TEAS_". Defaults apply to any course without
 * a matching rule — every current AP/SAT/ACT/CLEP course is unaffected.
 *
 * See docs/TEAS-build-plan.md and docs/PSAT-build-plan.md for the
 * design context behind each rule.
 */

export interface ExpansionCourseConfig {
  /** Min PASS votes required for ensemble approval. Default 2. */
  minPassQuorum: number;
  /**
   * If true, at least one PASS vote must come from a "paid" model
   * (Anthropic Sonnet or Gemini). For high-fact-stakes courses where
   * the free pool's biomedical/clinical knowledge isn't dependable.
   */
  requirePaidJudgeInQuorum: boolean;
  /** If true, generator MUST emit `source_page` referencing the RAG corpus. */
  requireSourceCitation: boolean;
  /** Canonical fact-table validator id; runs BEFORE LLM judges. */
  canonicalFactTableId?: string;
  /** RAG corpus name for the generator to query. */
  ragCorpus?: string;
  /**
   * Difficulty cap when re-using an existing bank (e.g., PSAT re-uses
   * SAT, capped at MEDIUM since PSAT is roughly SAT-minus-one-grade).
   */
  difficultyCap?: "EASY" | "MEDIUM" | "HARD";
}

export const DEFAULT_CONFIG: ExpansionCourseConfig = {
  minPassQuorum: 2,
  requirePaidJudgeInQuorum: false,
  requireSourceCitation: false,
};

interface PrefixRule {
  prefix: string;
  config: Partial<ExpansionCourseConfig>;
  note: string;
}

const RULES: PrefixRule[] = [
  // TEAS Science — A&P fact-error stakes are highest. See
  // docs/TEAS-build-plan.md §"Layer 3 Stricter ensemble quorum".
  {
    prefix: "TEAS_SCIENCE",
    config: {
      minPassQuorum: 3,
      requirePaidJudgeInQuorum: true,
      requireSourceCitation: true,
      canonicalFactTableId: "teas-ap-facts-v1",
      ragCorpus: "openstax-anatomy-physiology-2e",
    },
    note: "Science section — A&P fact-error mitigation (6-layer defense)",
  },

  // TEAS Reading / Math / ELU — RAG-grounded but standard quorum.
  {
    prefix: "TEAS_",
    config: {
      requireSourceCitation: true,
    },
    note: "TEAS general — source-citation required, default quorum",
  },

  // PSAT — re-uses SAT bank with difficulty cap. See
  // docs/PSAT-build-plan.md §"Difficulty recalibration".
  {
    prefix: "PSAT_",
    config: {
      difficultyCap: "MEDIUM",
    },
    note: "PSAT — derived from SAT bank, capped at MEDIUM difficulty",
  },

  // GRE (future) — paid-judge co-sign on Quant section, source-citation on Verbal.
  // ASVAB (future) — no blueprint weights from DoD; relies on style fingerprint.
];

/**
 * Returns the merged config for a given course id (e.g. "TEAS_SCIENCE_1_BIO").
 * Longest-prefix-wins; defaults fill any unspecified field.
 */
export function getExpansionConfig(courseId: string): ExpansionCourseConfig {
  // Sort longest-prefix-first to ensure TEAS_SCIENCE wins over TEAS_.
  const sorted = [...RULES].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const rule of sorted) {
    if (courseId.startsWith(rule.prefix)) {
      return { ...DEFAULT_CONFIG, ...rule.config };
    }
  }
  return DEFAULT_CONFIG;
}

/**
 * True if the course is a new vertical (TEAS, PSAT, ASVAB, GRE).
 * Used by callers that want to gate "show expansion-specific UI/copy".
 */
export function isExpansionCourse(courseId: string): boolean {
  return ["TEAS_", "PSAT_", "ASVAB_", "GRE_"].some((p) => courseId.startsWith(p));
}
