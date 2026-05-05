/**
 * src/lib/stimulus-validator.ts — deterministic gate that catches the
 * #1 audit gap (6/8 questions had no stimulus when CB always provides
 * one). Anchors to a per-course/unit contract that says "this kind of
 * question REQUIRES this kind of stimulus."
 *
 * Failure modes caught:
 *
 * 1. Required stimulus is missing/empty/too short
 *    Every CB AP US History MCQ is anchored to a primary source.
 *    Every CB AP World History MCQ same. Every CB AP Stats MCQ has a
 *    data table or scenario. A question that says "Which of the
 *    following best describes the cause of WWI?" with no source is
 *    not a CB-style MCQ — it's a flashcard.
 *
 * 2. Synthesized stimulus instead of primary source
 *    Generators love to fabricate: "Imagine a scientist conducting an
 *    experiment...". CB never does this for history; for science it's
 *    rare. We detect synthesized openers ("Imagine", "Consider the
 *    following hypothetical", "A student claims...") for question
 *    types where a real source is required.
 *
 * 3. Stimulus type mismatch
 *    Spec says `requiredStimulusType: "primarySource"` but the
 *    stimulus is a paraphrase or summary. We detect via heuristics:
 *    primary sources are quoted (start with " or have ' opening),
 *    have a citation (— Author, Year), and are >100 chars. A
 *    paraphrase has none of these.
 *
 * 4. Reference-without-content
 *    Question says "the graph above" / "the passage below" but
 *    stimulus is missing or too short. Already partially handled in
 *    src/lib/ai.ts (refsPassage / refsDiagram checks); this
 *    consolidates and strengthens.
 *
 * Pure function, <1ms per question, no LLM call. Runs in stage 4
 * (RECOMPUTE) of the design-v1 pipeline.
 */

export type StimulusRequirement = {
  required: boolean;
  type?: "primarySource" | "readingPassage" | "graph" | "table" | "diagram" | "image" | "scenario";
  minChars?: number; // default 40 for stimulus, 100 for primary source, 1500 for reading passage
};

const SYNTHESIZED_OPENERS = [
  /^\s*imagine\s+/i,
  /^\s*consider\s+(the\s+following\s+)?(hypothetical|scenario|case)\b/i,
  /^\s*a\s+student\s+(is\s+)?(claims?|argues?|wonders?|thinks?)\b/i,
  /^\s*suppose\s+/i,
  /^\s*let'?s?\s+say\s+/i,
  /^\s*hypothetically\b/i,
];

const PRIMARY_SOURCE_SIGNALS = [
  /["“][^"”]{30,}["”]/, // a long quoted passage
  /^\s*["“]/, // opens with a quote mark
  /\s—\s+[A-Z][a-z]+\s+[A-Z]/, // em-dash attribution: "— John Smith"
  /,\s+(\d{4}|c\.\s*\d{4})\s*$/, // date attribution at end: ", 1862"
  /\b(written|published|signed|delivered)\s+(in|by)\s+/i,
];

/**
 * Is this stimulus text a clearly synthesized scenario rather than a
 * real source?
 */
function isSynthesizedStimulus(stimulus: string): boolean {
  if (!stimulus) return false;
  return SYNTHESIZED_OPENERS.some((re) => re.test(stimulus));
}

/**
 * Does this stimulus look like a primary source (quoted text with
 * attribution)?
 */
function looksLikePrimarySource(stimulus: string): boolean {
  if (!stimulus) return false;
  const signals = PRIMARY_SOURCE_SIGNALS.filter((re) => re.test(stimulus)).length;
  return signals >= 2; // multiple signals = high confidence
}

/**
 * Does the question text reference a stimulus that doesn't exist or is
 * too short? (e.g., "the passage above" when stimulus is empty.)
 */
function questionReferencesMissingStimulus(
  questionText: string,
  stimulus: string,
): { missing: boolean; reference?: string } {
  const refPatterns: { pattern: RegExp; type: string; minChars: number }[] = [
    { pattern: /\b(passage|excerpt|letter|document|source|text|quotation)\s+(above|below|shown)\b/i, type: "passage/excerpt", minChars: 60 },
    { pattern: /\b(graph|chart|diagram|figure|table|image|map|free-body|FBD)\s+(above|below|shown)\b/i, type: "graph/figure/table", minChars: 10 },
    { pattern: /\b(based\s+on|according\s+to)\s+the\s+(passage|excerpt|graph|chart|table|figure|diagram|map|source|document)\b/i, type: "based-on reference", minChars: 40 },
    { pattern: /\bin\s+the\s+(passage|excerpt|graph|chart|table|figure|diagram)\b/i, type: "in-the reference", minChars: 40 },
  ];
  const stim = stimulus?.trim() ?? "";
  for (const { pattern, type, minChars } of refPatterns) {
    if (pattern.test(questionText) && stim.length < minChars) {
      return { missing: true, reference: type };
    }
  }
  return { missing: false };
}

/**
 * Top-level validator. Given a question + spec requirement, returns
 * null on pass or an error string on fail.
 */
export function validateStimulus(
  questionText: string,
  stimulus: string | null | undefined,
  requirement: StimulusRequirement,
): string | null {
  // Defensive: Flash sometimes outputs non-string stimulus (object literal,
  // number, boolean). Coerce to string before processing.
  const stim = (typeof stimulus === "string" ? stimulus : (stimulus ? JSON.stringify(stimulus) : "")).trim();
  const minChars = requirement.minChars
    ?? (requirement.type === "primarySource" ? 100
        : requirement.type === "readingPassage" ? 1500
        : 40);

  // Reference check runs first — if the question text references a
  // stimulus, the stimulus must exist regardless of spec requirement.
  const refCheck = questionReferencesMissingStimulus(questionText, stim);
  if (refCheck.missing) {
    return `Question text references "${refCheck.reference}" but stimulus is missing or too short (${stim.length} chars)`;
  }

  if (!requirement.required) return null;

  if (stim.length < minChars) {
    return `Required ${requirement.type ?? "stimulus"} is missing or too short (${stim.length} chars, need ≥${minChars})`;
  }

  if (requirement.type === "primarySource") {
    if (isSynthesizedStimulus(stim)) {
      return `Stimulus opens with a synthesized scenario (e.g. "Imagine...") but spec requires a primary source. CB never fabricates — anchor to a real document.`;
    }
    if (!looksLikePrimarySource(stim)) {
      return `Stimulus does not look like a primary source — needs at least 2 of: long quoted passage, em-dash attribution, date attribution, or "written/published/signed/delivered" provenance language.`;
    }
  }

  if (requirement.type === "readingPassage") {
    // ACT Reading / SAT R&W: contemporary prose excerpts (literary
    // narrative, social science, humanities, natural science) — NOT
    // historical primary sources. Real passages are 700-900 words with
    // a byline (©YEAR, "by [Name]", italic title). They should not be
    // fabricated openers ("Imagine a student...").
    if (isSynthesizedStimulus(stim)) {
      return `Stimulus opens with a synthesized scenario (e.g. "Imagine...") but spec requires a published reading passage. Anchor to a real excerpt with a byline.`;
    }
    // We do NOT require em-dash / quoted-passage primary-source signals
    // here — those are AP-history patterns, not ACT/SAT reading patterns.
    return null;
  }

  if (requirement.type === "scenario") {
    // For science scenarios (e.g. lab setup), synthesized openers are
    // acceptable — but the scenario must still have substance.
    if (stim.length < (requirement.minChars ?? 60)) {
      return `Scenario stimulus is too short (${stim.length} chars, need ≥${requirement.minChars ?? 60})`;
    }
  }

  // graph/table/diagram/image: we can't deterministically verify the
  // figure exists from text alone. The figure-validator (task #25)
  // handles render-time verification; this gate just ensures the
  // stimulus field is populated as intended.
  return null;
}
