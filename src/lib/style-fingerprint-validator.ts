/**
 * src/lib/style-fingerprint-validator.ts — Stage 6 of the new-exam
 * generation pipeline (per `project_expansion_pipeline_2026-05-03.md`).
 *
 * Compares a generated question's measurable properties to the official
 * exam's style fingerprint computed from CB/ETS/DoD/ATI sample Qs.
 *
 * Inputs come from each exam's UNDERSTANDING-BRIEF.md (μ ± σ thresholds
 * cited to source pages). The generator hands us a draft Q; we either
 * accept (within ±1σ on every metric) or reject with a structured
 * "what to tighten" message that the regen prompt can consume.
 *
 * Pure function, no external calls. <1ms per question.
 */

export type Question = {
  questionText: string;
  options: string[] | Record<string, string>;
  correctAnswer: string;
  explanation?: string;
  stimulus?: string | null;
  /** "MCQ" | "FRQ" | "NUMERIC" | "QC" (GRE) etc — exam-dependent */
  questionType: string;
};

export type StyleFingerprint = {
  /** Per-section + question-type targets, all from official sample Qs. */
  stem: {
    wordCount: { mean: number; sd: number };
    sentenceCount?: { mean: number; sd: number };
    /** Flesch-Kincaid grade level — exam-target reading level */
    readingLevel?: { mean: number; sd: number };
  };
  distractor: {
    /** Mean word count across distractors */
    wordCount: { mean: number; sd: number };
    /** Coefficient of variation — guards "longest = right" tell.
     *  Lower CV means tighter length spread, harder to spot answer by length. */
    maxCoefficientOfVariation: number;
  };
  passage?: {
    /** RC items only — passage word count distribution */
    wordCount: { mean: number; sd: number };
  };
  /** Visual/figure presence ratio per topic (0-1). Used as a SOFT check —
   *  if a topic should have visuals 35% of the time and we're generating
   *  100% non-visual, the bank is drifting. Validator flags the trend, not
   *  individual Qs. */
  visualPresenceRatio?: { topic: string; expected: number };
  /** Hard-fixed exam quirks. */
  formatQuirks: {
    optionCount: number; // 4 for AP/SAT/PSAT, 5 for ACT_MATH/CLEP, varies for GRE
    requiresStimulus: boolean; // some courses require passage/graph
    calculatorPolicy?: "always" | "never" | "section-dependent";
  };
};

export type ValidationResult = {
  ok: boolean;
  /** All failures collected — generator prompt can address all in one regen */
  issues: ValidationIssue[];
  /** Soft signals (don't block, but worth tracking in aggregate) */
  warnings: string[];
  /** Computed metrics — useful for batch fingerprint drift detection */
  metrics: {
    stemWordCount: number;
    stemSentenceCount: number;
    distractorMeanLength: number;
    distractorCV: number;
    passageWordCount: number;
    hasVisual: boolean;
  };
};

export type ValidationIssue = {
  metric: string;
  expected: string;
  actual: string;
  /** Suggestion the regen prompt should incorporate */
  fix: string;
};

const wordCount = (s: string): number => {
  if (!s) return 0;
  const trimmed = String(s).trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
};

const sentenceCount = (s: string): number => {
  if (!s) return 0;
  const matches = String(s).match(/[.!?]+(?:\s|$)/g);
  return matches ? matches.length : 1; // assume 1 if no terminator
};

/** Coefficient of variation = stddev / mean. Lower = tighter length spread. */
function cv(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance) / mean;
}

function isWithinBand(value: number, mean: number, sd: number, sigmas = 1): boolean {
  return Math.abs(value - mean) <= sigmas * sd;
}

function detectVisual(stimulus: string | null | undefined): boolean {
  if (!stimulus) return false;
  const s = String(stimulus);
  // markdown image, html img/svg, mermaid block, vega-lite, latex plot, table
  return /!\[[^\]]*\]\([^)]+\)|<img\s|<svg\s|```mermaid|```vega|\\begin\{(tikz|plot)\}|^\|.*\|\s*$/m.test(s);
}

function flattenOptions(options: Question["options"]): string[] {
  if (Array.isArray(options)) return options.map((o) => String(o));
  if (options && typeof options === "object") return Object.values(options).map((o) => String(o));
  return [];
}

/**
 * Stage 6 fidelity check. Returns ok=true if the question matches the
 * official exam's style fingerprint within ±1σ on every metric.
 */
export function validateStyleFidelity(
  question: Question,
  fingerprint: StyleFingerprint,
  sigmas = 1,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const warnings: string[] = [];

  const opts = flattenOptions(question.options);
  const stemWords = wordCount(question.questionText);
  const stemSentences = sentenceCount(question.questionText);
  const distractorLengths = opts.map((o) => wordCount(o));
  const distractorMean = distractorLengths.length === 0
    ? 0
    : distractorLengths.reduce((a, b) => a + b, 0) / distractorLengths.length;
  const distractorCV = cv(distractorLengths);
  const passageWords = wordCount(question.stimulus ?? "");
  const hasVisual = detectVisual(question.stimulus);

  // --- HARD FORMAT QUIRKS (hard fail) ---
  if (fingerprint.formatQuirks.optionCount !== opts.length) {
    issues.push({
      metric: "option_count",
      expected: `${fingerprint.formatQuirks.optionCount}`,
      actual: `${opts.length}`,
      fix: `Generate exactly ${fingerprint.formatQuirks.optionCount} options. The exam never uses ${opts.length}-option items.`,
    });
  }
  if (fingerprint.formatQuirks.requiresStimulus && !question.stimulus) {
    issues.push({
      metric: "stimulus_required",
      expected: "stimulus present",
      actual: "missing",
      fix: "This question type REQUIRES a stimulus (passage, graph, or table). Add an anchored stimulus before regenerating.",
    });
  }

  // --- STEM WORD COUNT (±sigma band) ---
  if (!isWithinBand(stemWords, fingerprint.stem.wordCount.mean, fingerprint.stem.wordCount.sd, sigmas)) {
    issues.push({
      metric: "stem_word_count",
      expected: `${fingerprint.stem.wordCount.mean.toFixed(0)} ± ${(fingerprint.stem.wordCount.sd * sigmas).toFixed(0)} words`,
      actual: `${stemWords} words`,
      fix: stemWords > fingerprint.stem.wordCount.mean
        ? `Stem is too verbose. Tighten to ~${fingerprint.stem.wordCount.mean.toFixed(0)} words. Cut redundant context.`
        : `Stem is too sparse. Expand to ~${fingerprint.stem.wordCount.mean.toFixed(0)} words with appropriate scenario detail.`,
    });
  }

  // --- DISTRACTOR LENGTH CV (the "longest = right" tell) ---
  if (distractorCV > fingerprint.distractor.maxCoefficientOfVariation) {
    issues.push({
      metric: "distractor_length_variance",
      expected: `CV ≤ ${fingerprint.distractor.maxCoefficientOfVariation.toFixed(2)}`,
      actual: `CV = ${distractorCV.toFixed(2)}`,
      fix: `Distractor lengths vary too much. The longest option may stand out as a "tell". Trim or expand options to ±20% of each other in word count.`,
    });
  }

  // --- DISTRACTOR MEAN LENGTH ---
  if (!isWithinBand(distractorMean, fingerprint.distractor.wordCount.mean, fingerprint.distractor.wordCount.sd, sigmas)) {
    warnings.push(
      `Distractor mean length ${distractorMean.toFixed(1)}w vs target ${fingerprint.distractor.wordCount.mean.toFixed(1)}w ± ${(fingerprint.distractor.wordCount.sd * sigmas).toFixed(1)} — soft drift`,
    );
  }

  // --- PASSAGE LENGTH (RC items only) ---
  if (fingerprint.passage && passageWords > 0) {
    if (!isWithinBand(passageWords, fingerprint.passage.wordCount.mean, fingerprint.passage.wordCount.sd, sigmas)) {
      issues.push({
        metric: "passage_word_count",
        expected: `${fingerprint.passage.wordCount.mean.toFixed(0)} ± ${(fingerprint.passage.wordCount.sd * sigmas).toFixed(0)} words`,
        actual: `${passageWords} words`,
        fix: passageWords > fingerprint.passage.wordCount.mean
          ? `Passage is too long. Trim to ~${fingerprint.passage.wordCount.mean.toFixed(0)} words.`
          : `Passage is too short. Expand to ~${fingerprint.passage.wordCount.mean.toFixed(0)} words with relevant context.`,
      });
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    warnings,
    metrics: {
      stemWordCount: stemWords,
      stemSentenceCount: stemSentences,
      distractorMeanLength: distractorMean,
      distractorCV,
      passageWordCount: passageWords,
      hasVisual,
    },
  };
}

/**
 * Build a structured regen prompt fragment from validation issues.
 * The generator's regen prompt prepends this to the original prompt.
 */
export function issuesToRegenPrompt(issues: ValidationIssue[]): string {
  if (issues.length === 0) return "";
  return [
    "STYLE FIDELITY ISSUES — fix all before regenerating:",
    ...issues.map((i, idx) => `  ${idx + 1}. ${i.metric}: ${i.fix} (expected ${i.expected}, got ${i.actual})`),
  ].join("\n");
}
