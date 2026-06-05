/**
 * Deterministic question gates — F5 (2026-05-17).
 *
 * Runs BEFORE any LLM call to catch the bug classes we've seen in production:
 * - Explanation letter-mismatch (Gregory's bug: explanation says "B is correct"
 *   but stored correctAnswer is "C")
 * - Option count mismatch (CLEP digital = 4 vs 5)
 * - Topic-unit drift (Quadratics filed under Foundations)
 * - Duplicate options
 * - "A) A) ..." double-prefix bug
 * - Confession phrases ("closest match", "given the options")
 * - Short / empty explanations
 *
 * All checks are pure functions over the candidate question JSON.
 * No LLM, no DB, no network calls. Microseconds. 100% reliable for the
 * specific bug classes — false positives are very rare.
 *
 * Used by:
 * 1. src/lib/ai-providers.ts validateQuestion() — gates before LLM judge
 * 2. CLI seed scripts — gates before INSERT
 * 3. Retroactive bank sweeps — finds existing offenders
 *
 * Per feedback_validator_must_be_deterministic.md:
 * "AI judging AI is theater — validators must be deterministic.
 *  Self-judging LLMs share blind spots with generator. Real validators
 *  are deterministic recomputes (mathjs, parsers, allowlists). LLM
 *  judgment is the LAST layer never the first."
 */

import { validateRenderHazards } from "./render-hazard-validator";

export interface QuestionCandidate {
  questionText?: string;
  options?: string[] | string;
  correctAnswer?: string;
  explanation?: string;
  topic?: string;
  unit?: string;
  course?: string;
  stimulus?: string | null;
  // 2026-05-31 (#100 SAT=CB parity / validation engine integration) —
  // questionType is consulted by the SAT/PSAT gates: NUMERICAL items
  // have a numeric correctAnswer (not a letter A-E) and may legitimately
  // have no options. MCQ items continue through the standard letter +
  // option count gates.
  questionType?: string;
  // 2026-06-02 — claims-visual gate. AI generators occasionally produce
  // "Figure: A right triangle with legs 3, 4..." style stems that
  // CLAIM a visual exists but no image is attached. Students hit these
  // as blockers — text alone may not be sufficient. The gate compares
  // visual-claim language in questionText/stimulus against the presence
  // of stimulusImageUrl.
  stimulusImageUrl?: string | null;
}

export interface GateResult {
  ok: boolean;
  reason?: string;
  gate?: string;  // which gate failed (for telemetry)
}

const FOUR_CHOICE_COURSES = new Set([
  "CLEP_COLLEGE_MATH",
  "CLEP_SPANISH",
  "CLEP_SPANISH_WRITING",
  "CLEP_FRENCH",
  "CLEP_GERMAN",
  // 2026-05-31 — SAT/PSAT correction (#100 SAT=CB parity, validation
  // engine integration). The digital SAT (since March 2024) uses 4
  // choices (A–D) on every MCQ, not 5. Previously fell through to the
  // default 5 — every SAT/PSAT generation would either pass with 5
  // (wrong) or fail option-count for being 4 (correct). PSAT mirrors
  // SAT structure.
  "SAT_MATH",
  "SAT_READING_WRITING",
  "PSAT_MATH",
  "PSAT_READING_WRITING",
  // 2026-05-31 — Enhanced ACT (April 2025 paper / fall 2025 online)
  // changed ACT Math from the legacy 5-choice format to 4-choice.
  // English/Reading/Science were always 4-choice. ACT_MATH is now in
  // the FOUR_CHOICE_COURSES set — the legacy 5-choice generation
  // pipeline is queued for regen + un-approve in #103 A3.
  "ACT_MATH",
  "ACT_ENGLISH",
  "ACT_READING",
  "ACT_SCIENCE",
]);

/**
 * 2026-05-31 — Courses where every question MUST have a non-trivial
 * stimulus (passage, table, or figure). SAT/PSAT R&W is the canonical
 * case: every question pairs with a 1-2 paragraph passage and is fully
 * answerable from that passage alone. A generated R&W item with no
 * stimulus is automatically un-shippable.
 */
const STIMULUS_REQUIRED_COURSES = new Set([
  "SAT_READING_WRITING",
  "PSAT_READING_WRITING",
]);

const MIN_STIMULUS_CHARS = 50;

/**
 * 2026-05-17 — Hint-in-option patterns. CB style says options must be bare
 * answer values; explanation goes in the explanation field. AI generators
 * tend to add "because X" or "(which is Y)" inside options, leaking the
 * reasoning and breaking option parallelism.
 *
 * Caught by user's daughter on the Psych course (170+ offenders in 3 psych
 * courses alone). Real student-visible quality issue.
 */
const HINT_IN_OPTION_PATTERNS = [
  /\([^)]{25,}\)/,             // parenthetical with >25 chars inside (likely explanation)
  / — | -- /,                   // em-dash followed by extra info
  /,\s*because\s/i,             // ", because ..." within an option
  /,\s*which\s+is\s/i,
  /,\s*which\s+refers\s+to\s/i,
  /,\s*also\s+called\s/i,
  /\bi\.e\.\,/i,                // "i.e.," explanation marker
  /\be\.g\.\,/i,
];

const CONFESSION_PHRASES = [
  "closest match",
  "miscalculation",
  "calculation error",
  "incorrect option values",
  "might be due to",
  "given the options provided",
  "given the options",
  "approximate",
  "rounded to match",
  "wedged",
];

const LETTER_CLAIM_REGEX = /(?:^|[^A-Z])(?:option\s+|answer\s+is\s+)?\(?([A-E])\)?\s+is\s+correct/i;
const DOUBLE_PREFIX_REGEX = /^[A-E]\)\s*[A-E]\)/;

// Gate v2 (2026-05-21) — broader letter-claim patterns. Each must capture letter in group 1.
const LETTER_CLAIM_PATTERNS_V2: RegExp[] = [
  /\bletter\s+\(?([A-E])\)?\s+is\s+correct\b/i,
  /\boption\s+\(?([A-E])\)?\s+is\s+correct\b/i,
  /\bchoice\s+\(?([A-E])\)?\s+is\s+correct\b/i,
  /\b(?:the\s+)?(?:correct\s+)?answer\s+is\s+\(?([A-E])\)?\b/i,
  /\b(?:the\s+)?correct\s+(?:choice|option|answer)\s+is\s+\(?([A-E])\)?\b/i,
  /^\s*\(?([A-E])\)?\s+is\s+correct\b/i,
];

/** Parse options to a string array regardless of whether it's already array or JSON string. */
function parseOptions(options: string[] | string | undefined): string[] {
  if (Array.isArray(options)) return options.map(String);
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Expected option count for a given course.
 *
 * B4 (2026-05-17): verified against College Board official sample pages.
 * Per https://clep.collegeboard.org/prepare-for-an-exam/practice-questions-study-guides/sample-questions-biology
 * and -college-algebra and -college-composition: standard CLEP MCQs use
 * "five suggested answers or completions" (A-E). Format unchanged through
 * 2020 digital transition.
 *
 * Exceptions:
 *   - DSST: 4 options (A-D)
 *   - CLEP College Math / Spanish / French / German listening: 4 options
 *     (mixed item types include numeric-entry and listening — not standard MCQs)
 */
export function expectedOptionCount(course: string | undefined): number {
  if (!course) return 5; // default to CLEP standard
  if (course.startsWith("DSST_")) return 4;
  // AP MCQs are 4-option (A-D) since the 2020 College Board redesign. AP_*
  // courses were missing from FOUR_CHOICE_COURSES, so they fell through to the
  // CLEP default of 5 — making this gate FALSE-FLAG 100% of every AP MCQ.
  if (course.startsWith("AP_")) return 4;
  if (FOUR_CHOICE_COURSES.has(course)) return 4;
  return 5; // CLEP standard
}

/**
 * Topic-unit alignment map. Keyed by course, then by unit, listing the
 * topic-keywords expected for that unit. A candidate topic must match
 * the keyword set of its declared unit to pass this gate.
 *
 * Built incrementally — add courses as we discover bug patterns.
 * For courses not in this map, the topic-unit gate is skipped (pass).
 */
const TOPIC_UNIT_KEYWORDS: Record<string, Record<string, string[]>> = {
  CLEP_COLLEGE_ALGEBRA: {
    CLEP_ALGEBRA_1_FOUNDATIONS: [
      "foundations", "real numbers", "number sense", "order of operations",
      "absolute value", "exponents and radicals", "algebraic expressions",
      "number sets", "properties of real",
    ],
    CLEP_ALGEBRA_2_EQUATIONS_INEQUALITIES: [
      "linear equation", "systems", "quadratic equation", "linear inequalit",
      "word problem", "radical equation", "absolute value equation",
      "algebraic equation",
    ],
    CLEP_ALGEBRA_3_FUNCTIONS_GRAPHS: [
      "function", "graph", "domain", "range", "composition", "inverse function",
      "transformation",
    ],
    CLEP_ALGEBRA_4_POLYNOMIAL_RATIONAL: [
      "polynomial", "rational function", "asymptote", "factoring",
      "polynomial division",
    ],
    CLEP_ALGEBRA_5_EXPONENTIAL_LOGARITHMIC: [
      "exponential function", "logarithmic", "exponential growth", "log",
      "ln", "natural log",
    ],
  },
};

/** Check that a topic looks plausible for its declared unit, given the keyword map. */
function topicMatchesUnit(course: string | undefined, unit: string | undefined, topic: string | undefined): boolean {
  if (!course || !unit || !topic) return true; // can't check without all three
  const courseMap = TOPIC_UNIT_KEYWORDS[course];
  if (!courseMap) return true; // no mapping defined for this course → skip
  const expectedKeywords = courseMap[unit];
  if (!expectedKeywords) return true; // unit not mapped → skip
  const t = topic.toLowerCase();
  // Match on substring of any expected keyword (case-insensitive).
  return expectedKeywords.some((kw) => t.includes(kw));
}

/**
 * Main gate. Returns { ok: false, reason, gate } on first failure.
 * Order: cheapest, most-reliable checks first.
 */
export function runDeterministicGates(q: QuestionCandidate): GateResult {
  // 1. Basic structural
  if (!q.questionText || typeof q.questionText !== "string" || q.questionText.length < 10) {
    return { ok: false, gate: "structure", reason: "questionText empty or too short" };
  }
  // 2026-05-31 (#100) — SAT/PSAT NUMERICAL (SPR/grid-in) items have a
  // numeric correctAnswer like "5/2" or "0.75", not a letter A-E. Branch
  // the structural check by questionType. MCQs continue with the strict
  // letter-form check; NUMERICAL just requires a non-empty string.
  const isNumeric = q.questionType === "NUMERICAL";
  if (isNumeric) {
    if (!q.correctAnswer || typeof q.correctAnswer !== "string" || q.correctAnswer.length === 0) {
      return { ok: false, gate: "structure", reason: "NUMERICAL correctAnswer empty" };
    }
  } else if (!q.correctAnswer || !/^[A-E]$/.test(q.correctAnswer)) {
    return { ok: false, gate: "structure", reason: `correctAnswer "${q.correctAnswer}" not a single letter A-E` };
  }
  if (!q.explanation || typeof q.explanation !== "string" || q.explanation.length < 40) {
    return { ok: false, gate: "structure", reason: "explanation missing or shorter than 40 chars" };
  }
  // 1b. Stimulus presence — for courses where CB spec requires every
  // question to be paired with a passage / table / figure (SAT/PSAT R&W).
  // A bare-stem R&W item is automatically un-shippable per the digital
  // SAT spec.
  if (STIMULUS_REQUIRED_COURSES.has(q.course ?? "")) {
    const stim = (q.stimulus ?? "").trim();
    if (!stim || stim.length < MIN_STIMULUS_CHARS) {
      return {
        ok: false,
        gate: "stimulus-required",
        reason: `${q.course} requires a passage stimulus (≥${MIN_STIMULUS_CHARS} chars); got ${stim.length}`,
      };
    }
  }
  // 1c. NUMERICAL items skip the options-related gates entirely — they
  // don't have options to validate. Early-return after a question-text
  // check above.
  if (isNumeric) {
    return { ok: true };
  }

  // 1d. CLAIMS-VISUAL-NO-IMAGE gate (2026-06-02). User-reported defect
  // (journey diagnostic on SN): "Figure: a right triangle with legs 3
  // and 4, hypotenuse unknown" rendered with NO actual figure. 5 ACT_MATH
  // "Figure:" MCQs + 26 broader "the diagram / the graph below / shown
  // in the figure" MCQs were approved with no stimulusImageUrl. Some
  // are answerable from text (those got rewritten), but most need a
  // real image — student is stuck without it. This gate prevents
  // future AI generations from re-entering the bank in this state.
  //
  // Patterns are conservative: only language that clearly REFERENCES
  // a visual the student must see ("Figure:", "Figure shows X",
  // "the diagram below/above", "the graph below/above",
  // "shown in the figure/graph", "as shown in the figure/diagram/graph",
  // "in the figure/diagram/graph above/below"). Generic mentions like
  // "diagram of cellular respiration" (informational, not load-bearing)
  // are not flagged because they often appear in stimulus text.
  {
    const text = `${q.questionText ?? ""} ${q.stimulus ?? ""}`;
    const claimsVisual =
      /(^|\s)Figure:\s/i.test(text) ||
      /Figure shows\b/i.test(text) ||
      /the diagram (below|above|shown)/i.test(text) ||
      /the graph (below|above|shown)/i.test(text) ||
      /shown in the (figure|graph|diagram)/i.test(text) ||
      /as shown in the (figure|graph|diagram)/i.test(text) ||
      /in the (figure|graph|diagram) (above|below)/i.test(text);
    const hasImage =
      typeof q.stimulusImageUrl === "string" && q.stimulusImageUrl.trim().length > 0;
    if (claimsVisual && !hasImage) {
      return {
        ok: false,
        gate: "claims-visual-no-image",
        reason:
          "Question references a figure/diagram/graph that the student must see, but no stimulusImageUrl is attached. Either attach the image or rewrite the question to be answerable from text alone.",
      };
    }
  }

  // 1e. SCAFFOLD-TOKEN-LEAK gate (2026-06-04). User-reported defect
  // (Morgan Rhodes SAT R&W diagnostic, 2026-06-04 09:21 UTC). AI emitted
  // its own scaffold/section labels into the rendered fields:
  //   - questionText: "STIMULUS: The teacher gave the students ___ homework..."
  //     (literal "STIMULUS:" prefix from JSON-shaped prompt template)
  //
  // RCA per [[feedback_rca_for_every_defect]]:
  //   Tech 5-Why: scaffold label was inside the AI's JSON output → no
  //   gate stripped it on save → validator was LLM-judged and accepted
  //   the leaked label → no deterministic check for known template tokens
  //   → fail-open default.
  //   Process 5-Why: validator-must-be-deterministic principle
  //   ([[feedback_validator_must_be_deterministic]]) applied to math +
  //   visual-claim but NOT to MCQ-stem structural integrity. Gap in gate set.
  //
  // PCA: hard-reject any question whose stem starts with these tokens.
  {
    const stem = (q.questionText ?? "").trimStart();
    const stim = (q.stimulus ?? "").trimStart();
    const SCAFFOLD_RX = /^(STIMULUS|QUESTION|STEM|PROMPT|OPTIONS|ANSWER|EXPLANATION|CONTEXT|PASSAGE)\s*[:：]/i;
    if (SCAFFOLD_RX.test(stem)) {
      return {
        ok: false,
        gate: "scaffold-token-leak",
        reason: `questionText starts with a scaffold token (e.g. 'STIMULUS:', 'QUESTION:') — generator template leaked into the rendered field. Strip the prefix or regenerate.`,
      };
    }
    if (SCAFFOLD_RX.test(stim)) {
      return {
        ok: false,
        gate: "scaffold-token-leak",
        reason: `stimulus starts with a scaffold token — generator template leaked into the rendered field. Strip the prefix or regenerate.`,
      };
    }
  }

  // 1f. JSON-OBJECT-STIMULUS gate (2026-06-04). Same RCA above.
  //   - Morgan Q4: stimulus = '{"Text 1":"A study...","Text 2":"While..."}'
  //     rendered to user as raw JSON braces instead of CB-style two-text
  //     side-by-side layout. AI emitted structured object as a JSON string
  //     because the prompt asked for "Text 1" and "Text 2" as separate
  //     fields but the candidate spec stored it in `stimulus` flat.
  //
  // PCA: reject when stimulus starts with `{` and contains a known
  // multi-text key-pattern (Text 1, Passage 1, Source A, etc.) — these
  // are render-broken. Generic JSON-shaped text (rare) is also rejected
  // because the renderer treats stimulus as plain markdown, not JSON.
  {
    const stim = (q.stimulus ?? "").trimStart();
    if (stim.length > 0) {
      const looksLikeJsonStart = /^[{[]/.test(stim);
      const hasMultiTextKey =
        /"(Text|Passage|Source|Excerpt)\s*\d?"\s*:/i.test(stim) ||
        /"(Text|Passage|Source)\s+[AB12]"\s*:/i.test(stim);
      if (looksLikeJsonStart && (hasMultiTextKey || /"[A-Za-z][\w\s]{0,30}"\s*:\s*"/.test(stim))) {
        return {
          ok: false,
          gate: "json-object-stimulus",
          reason:
            "stimulus is a serialized JSON object — renders as raw braces to the student. Parse the fields and store as formatted markdown (e.g., '**Text 1**\\n\\n...\\n\\n**Text 2**\\n\\n...').",
        };
      }
    }
  }

  // 1g. MISSING-QUESTION-MARKER gate (2026-06-04). MCQ-only. Same RCA above.
  //   - Morgan Q1: questionText = "The teacher gives the students their
  //     homework." — declarative statement with no ?, no fill-blank, no
  //     underlined word marker. Student sees a sentence + 4 buttons with
  //     no question.
  //
  // PCA: every MCQ stem MUST contain one of: question mark (?), fill-
  // blank pattern (3+ underscores), inline-underline tag (<u>, **bold-
  // word**), CB-style "Which of the following / What / Why / How / In
  // the / Based on / According to" interrogative opener, OR a SAT R&W
  // "underlined portion" reference. If none → reject.
  //
  // Skipped for NUMERICAL (handled earlier) and for FRQ types (no MCQ
  // shape). The check stays loose enough that legitimate CB-style stems
  // never trigger.
  if (!isNumeric) {
    const stem = (q.questionText ?? "").trim();
    const hasQuestionMark = /\?/.test(stem);
    const hasFillBlank = /_{3,}/.test(stem);
    const hasUnderlineMarker = /<u>|\*\*[A-Za-z][^*]{1,40}\*\*/i.test(stem);
    const hasUnderlinedReference = /\bunderlined\s+(word|phrase|portion|sentence|clause|text|part)\b/i.test(stem);
    const hasInterrogativeOpener =
      /^(which|what|why|how|when|where|who|whom|whose|in the|based on|according to|the author|the (writer|speaker|narrator|passage|text|excerpt|study|figure|graph|table|chart|diagram)|select|choose|identify|describe|explain|determine|find|calculate|solve|estimate|evaluate|consider|assume|suppose|if\s)/i.test(stem);
    const hasStandardInstruction = /\b(complete|fill in|fills the blank|best (completes|describes|explains|fits|expresses)|most (accurately|likely|nearly|appropriate|effectively))\b/i.test(stem);
    // 2026-06-04 refinement: sentence-completion stems are a legitimate
    // CB MCQ format. They end WITHOUT terminal punctuation (no .!?;) OR
    // end with a preposition/article waiting for the option to complete
    // the thought. Stem "The Fugitive Slave Act of 1850 required" reads as
    // a fragment alone but is perfectly clear paired with the options.
    //
    // Morgan's Q1 — "The teacher gives the students their homework." —
    // ends with a period AND is a complete declarative. THAT is broken.
    const lastChar = stem.slice(-1);
    const endsWithTerminator = /[.!?;]/.test(lastChar);
    const endsWithPrepOrArticle =
      /\b(to|of|by|in|at|from|as|with|for|on|into|onto|upon|about|over|under|between|the|a|an|that|this|these|those|than|because|since|while|after|before|during|whereas)$/i.test(stem.replace(/[.!?;:,]$/, ""));
    const isSentenceCompletion = !endsWithTerminator || endsWithPrepOrArticle;

    const hasMarker =
      hasQuestionMark || hasFillBlank || hasUnderlineMarker ||
      hasUnderlinedReference || hasInterrogativeOpener || hasStandardInstruction ||
      isSentenceCompletion;

    if (!hasMarker) {
      return {
        ok: false,
        gate: "missing-question-marker",
        reason:
          "MCQ stem is a complete declarative sentence with no question marker. No '?', no fill-blank, no underlined-word reference, no interrogative opener, no 'best completes' instruction, and the stem ends with a period — not a sentence-completion fragment. Student would see a statement followed by 4 unrelated answer buttons.",
      };
    }
  }

  // 2. Options
  const opts = parseOptions(q.options);
  if (opts.length === 0) {
    return { ok: false, gate: "options", reason: "options array empty or unparseable" };
  }
  const expected = expectedOptionCount(q.course);
  if (opts.length !== expected) {
    return { ok: false, gate: "options-count", reason: `expected ${expected} options for course ${q.course}, got ${opts.length}` };
  }
  // 2026-05-27 — Unescaped currency $ in stem. Caught by College Algebra
  // ensemble (5+ real cases) but not by any deterministic gate. Heuristic:
  // - Strip escaped \$ first
  // - 0 or 1 bare $ → pass (currency in single dollar amount is fine)
  // - 2+ bare $ → must form valid LaTeX math pairs (math content between)
  //   or fail as currency-that-needs-escaping.
  {
    const stemStripped = (q.questionText ?? "").replace(/\\\$/g, "");
    const dollars = (stemStripped.match(/\$/g) ?? []).length;
    if (dollars >= 2) {
      let suspect = false;
      if (dollars % 2 !== 0) {
        suspect = true;
      } else {
        const parts = stemStripped.split("$");
        for (let i = 1; i < parts.length; i += 2) {
          const inside = (parts[i] ?? "").trim();
          if (!inside) { suspect = true; break; }
          const hasMathSymbol = /[=+\-*/\\^_{}<>(),]/.test(inside);
          const hasOnlyShortToken = /^[\w.,^_{}=+\-*/\\<>()|]{1,40}$/.test(inside);
          const looksLikeMath = hasMathSymbol || hasOnlyShortToken;
          const looksLikeCurrency = /^\d/.test(inside) && /\s[a-z]{4,}/i.test(inside);
          if (!looksLikeMath || looksLikeCurrency) {
            suspect = true;
            break;
          }
        }
      }
      if (suspect) {
        return {
          ok: false,
          gate: "stem-unescaped-currency-dollar",
          reason: `stem has ${dollars} bare $ chars that don't form valid paired math delimiters — likely currency that should be escaped as \\$ or written as "dollars"`,
        };
      }
    }
  }

  // 2a. Double letter-prefix bug ("A) A) text")
  for (const o of opts) {
    if (DOUBLE_PREFIX_REGEX.test(o)) {
      return { ok: false, gate: "options-prefix-dup", reason: `option has duplicate letter prefix: "${o.slice(0, 30)}"` };
    }
  }
  // 2b. Duplicate options — case-insensitive + whitespace + Unicode-normalized.
  // 2026-05-18 — strengthen against subtle whitespace/Unicode-different duplicates
  // that slipped through (e.g., "( -∞, -3 ) ∪ ( 2, ∞ )" repeated with extra space).
  function normalizeOptForDupe(s: string): string {
    return s.toLowerCase()
      .replace(/^[A-E]\)\s*/, "")                  // strip letter prefix if present
      .replace(/\s+/g, " ")                         // collapse whitespace
      .replace(/[–—]/g, "-")              // en/em-dash → hyphen
      .replace(/[‘’]/g, "'")              // curly quotes
      .replace(/[“”]/g, '"')
      .replace(/[−]/g, "-")                    // minus sign → hyphen
      .replace(/[∪]/g, "U")                    // ∪ → U (set union)
      .replace(/[∩]/g, "n")                    // ∩ → n (intersection)
      .replace(/[∞]/g, "inf")                  // ∞ → inf
      .trim();
  }
  const seen = new Set<string>();
  for (const o of opts) {
    const norm = normalizeOptForDupe(o);
    if (seen.has(norm)) {
      return { ok: false, gate: "options-duplicate", reason: `duplicate option value (normalized): "${o.slice(0, 30)}"` };
    }
    seen.add(norm);
  }

  // 2e. MISSING_LETTER_PREFIX — when course expects standard MCQ, every option
  // must start with "A) " "B) " etc. Without prefixes, the practice page used
  // option.charAt(0) for letter derivation (now fixed) — but the data layer
  // should never have had prefix-less options approved. 469 legacy Qs failed
  // this check (2026-05-18). Gate added retroactively.
  const expectsLetterPrefix = !FOUR_CHOICE_COURSES.has(q.course ?? "")
    || q.course?.startsWith("DSST_")
    || true; // all CLEP/DSST/Accuplacer MCQs should have A)/B)/C)/D)/E) prefix
  if (expectsLetterPrefix && opts.length >= 4) {
    const prefixCount = opts.filter(o => /^[A-E][\)\.]\s*/.test(o.trim())).length;
    if (prefixCount === 0) {
      return {
        ok: false,
        gate: "options-missing-prefix",
        reason: `none of the ${opts.length} options have an A)/B) letter prefix`,
      };
    }
    if (prefixCount > 0 && prefixCount < opts.length) {
      return {
        ok: false,
        gate: "options-partial-prefix",
        reason: `inconsistent letter prefixes: ${prefixCount}/${opts.length} options have prefix`,
      };
    }
  }

  // 2f. MIXED_OPTION_TYPES — Yes/No coexisting with algebraic/numeric options
  // in the same array is a CB-style violation (options must be parallel).
  // Caught the f(g(x))=x bug on 2026-05-18.
  const YES_NO_SET = new Set(["yes", "no", "true", "false", "agree", "disagree", "valid", "invalid"]);
  const strippedOpts = opts.map(o => normalizeOptForDupe(o));
  const hasYesNo = strippedOpts.some(o => YES_NO_SET.has(o));
  const hasAlgOrNum = strippedOpts.some(o => !YES_NO_SET.has(o) && /[+\-*/^=()0-9]/.test(o) && o.length <= 60);
  if (hasYesNo && hasAlgOrNum) {
    return {
      ok: false,
      gate: "options-mixed-types",
      reason: `Yes/No options coexist with algebraic/numeric options — CB style requires parallel options`,
    };
  }
  // 2d. Hint-in-option (CB style violation — daughter feedback 2026-05-17).
  // Strip the leading letter prefix "X) " before checking, since that's
  // not a hint, just the option label.
  for (const o of opts) {
    const stripped = String(o).replace(/^[A-E]\)\s*/, "");
    for (const re of HINT_IN_OPTION_PATTERNS) {
      if (re.test(stripped)) {
        return {
          ok: false,
          gate: "option-contains-hint",
          reason: `option contains hint/explanation pattern (${re.source}): "${stripped.slice(0, 60)}..."`,
        };
      }
    }
  }
  // 2c. correctAnswer letter must point to a valid option index
  const correctIndex = q.correctAnswer.charCodeAt(0) - 65;
  if (correctIndex < 0 || correctIndex >= opts.length) {
    return { ok: false, gate: "correctAnswer-index", reason: `correctAnswer "${q.correctAnswer}" out of range for ${opts.length} options` };
  }

  // 3. Explanation letter-mismatch v2 (2026-05-21).
  // Aggregates EVERY claimed letter from broader regex patterns AND the
  // original LETTER_CLAIM_REGEX. Catches:
  //  - "Letter E is correct" / "Option E is correct" / "Answer is E"
  //  - Self-contradiction: explanation cites multiple disagreeing letters
  const head = q.explanation.slice(0, 500);
  const claimedLetters = new Set<string>();
  const baseMatch = head.match(LETTER_CLAIM_REGEX);
  if (baseMatch) claimedLetters.add(baseMatch[1].toUpperCase());
  for (const re of LETTER_CLAIM_PATTERNS_V2) {
    const m = head.match(re);
    if (m && m[1]) claimedLetters.add(m[1].toUpperCase());
  }
  if (claimedLetters.size > 0) {
    const claimedArr = Array.from(claimedLetters);
    if (!claimedLetters.has(q.correctAnswer)) {
      return {
        ok: false,
        gate: "explanation-letter-mismatch",
        reason: `explanation claims "${claimedArr.join("/")}" correct but stored correctAnswer is "${q.correctAnswer}"`,
      };
    }
    if (claimedLetters.size > 1) {
      return {
        ok: false,
        gate: "explanation-self-contradiction",
        reason: `explanation claims multiple letters correct: ${claimedArr.join(", ")}`,
      };
    }
  }

  // 3a. EXPLANATION_DERIVES_CONTRADICTORY_VALUE (2026-05-27) — derivation
  // ends with "so x = N" / "therefore x = N" / "x must be N" / etc. that
  // differs from the stored answer's option value. Triggered by live bug:
  // "Solve 3^x = 81, correctAnswer=E (option '2'). Explanation: '2 is correct
  // because 3^2 = 9 and 3^4 = 81, so x = 4.'" Surface letter-match passes
  // ('2' = option E text) but the math walk derives 4. Conservative gate:
  // only flag when stored option is a single number AND derivation is
  // unambiguous, so we never false-positive on conceptual options.
  const FINAL_VALUE_PATTERNS: RegExp[] = [
    /\bso\s+([xyz])\s*=\s*(-?\d+(?:\.\d+)?)\b/i,
    /\btherefore\s+([xyz])\s*=\s*(-?\d+(?:\.\d+)?)\b/i,
    /\bthus\s+([xyz])\s*=\s*(-?\d+(?:\.\d+)?)\b/i,
    /\b([xyz])\s+must\s+be\s+(-?\d+(?:\.\d+)?)\b/i,
    /\b([xyz])\s+equals?\s+(-?\d+(?:\.\d+)?)\b/i,
    /\bvalue\s+of\s+([xyz])\s+is\s+(-?\d+(?:\.\d+)?)\b/i,
  ];
  const storedOptForDerivCheck = String(opts[correctIndex] || "").replace(/^[A-E]\)\s*/, "").replace(/\$|\\|`/g, "").trim();
  const storedNumMatch = storedOptForDerivCheck.match(/^(-?\d+(?:\.\d+)?)$/);
  if (storedNumMatch) {
    for (const re of FINAL_VALUE_PATTERNS) {
      const m = q.explanation.match(re);
      if (m && m[2] && m[2] !== storedNumMatch[1]) {
        return {
          ok: false,
          gate: "explanation-derives-contradictory-value",
          reason: `explanation derives "${m[0]}" but stored correctAnswer ${q.correctAnswer} = "${storedOptForDerivCheck}"`,
        };
      }
    }
  }

  // 3b. EXPLANATION_VALUE_MISMATCH (2026-05-18) — explanation's reasoning chain
  // ends with a value matching a DIFFERENT option than the stored letter.
  // Generalizes letter-mismatch: catches cases where the model wrote correct
  // math reasoning ending in the right value, but assigned the wrong letter
  // OR cases where explanation text claims a value that matches no option.
  // Approach: tokenize each option's bare value, scan the END of the explanation
  // for the values of non-correct options. If a non-correct option's value
  // appears in the closing 80 chars of the explanation, flag mismatch.
  const correctOptText = normalizeOptForDupe(opts[correctIndex]);
  const explLower = q.explanation.toLowerCase();
  const explTail = explLower.slice(-200); // last 200 chars often contain final answer
  if (correctOptText.length >= 6) {
    // Only check if the correct option's text is substantive enough to expect
    // it to appear in the explanation (skip 1-2 char options like "5").
    const correctAppears = explTail.includes(correctOptText) || explLower.includes(correctOptText);
    if (!correctAppears) {
      // Now check if a DIFFERENT option's value appears in the tail.
      // If so, the explanation reasoning produced the wrong-letter result.
      for (let i = 0; i < opts.length; i++) {
        if (i === correctIndex) continue;
        const otherText = normalizeOptForDupe(opts[i]);
        if (otherText.length < 6) continue;
        if (explTail.includes(otherText)) {
          return {
            ok: false,
            gate: "explanation-value-mismatch",
            reason: `explanation tail contains option ${String.fromCharCode(65 + i)} text ("${otherText.slice(0, 40)}") but stored correctAnswer is ${q.correctAnswer}`,
          };
        }
      }
    }
  }

  // 4. Confession phrases (generator gave up and faked an answer)
  const expLower = q.explanation.toLowerCase();
  for (const phrase of CONFESSION_PHRASES) {
    if (expLower.includes(phrase)) {
      return { ok: false, gate: "confession-phrase", reason: `explanation contains confession phrase "${phrase}"` };
    }
  }

  // 5. Topic-unit alignment (where map is defined)
  if (!topicMatchesUnit(q.course, q.unit, q.topic)) {
    return {
      ok: false,
      gate: "topic-unit-mismatch",
      reason: `topic "${q.topic}" doesn't match expected keywords for unit ${q.unit}`,
    };
  }

  // 6. Render hazards — unescaped currency $ (renders as LaTeX) and
  // phantom-stimulus references ("the figure above" with empty stimulus).
  // Caught real student-facing bugs 2026-05-12 (currency) + 2026-05-12
  // (Klexevork's Q2 phantom diagram). B3 (2026-05-17).
  const hazard = validateRenderHazards(q.questionText, q.stimulus);
  if (hazard) {
    return { ok: false, gate: "render-hazard", reason: hazard };
  }

  // 7. Extended gates (2026-05-24) — ChatGPT v2 + Sprint A. Closes UARP §14.1
  // gap: runtime serve now uses the same gate set as gen-time + daily sweep
  // (scripts/lib/_question-gates.mjs).
  const extended = runExtendedGates(q, opts);
  if (!extended.ok) return extended;

  return { ok: true };
}

/**
 * Extended gates (2026-05-24, UARP §14.1).
 *
 * Adds gates introduced in ChatGPT v2 (#17 all-of-the-above, #18 multi-answer,
 * #20 subjectivity) and Sprint A (negation §3.3, semantic-contract §3.1).
 * Kept separate so the original runDeterministicGates body stays stable.
 *
 * All gates are mirrors of scripts/lib/_question-gates.mjs implementations.
 * Keep both in sync — runtime and gen-time MUST agree.
 */
function runExtendedGates(q: QuestionCandidate, opts: string[]): GateResult {
  const expl = q.explanation ?? "";
  const stem = q.questionText ?? "";

  // ChatGPT v2 #17 — All/None of the above
  for (const o of opts) {
    const body = o.replace(/^[A-E]\)\s*/i, "").trim().toLowerCase();
    if (/^(all|none)\s+of\s+the\s+above/.test(body)) {
      return { ok: false, gate: "options-all-or-none-of-above",
        reason: `option uses "${body.slice(0, 25)}" — not used in real CB exams` };
    }
  }

  // ChatGPT v2 #20 — Subjectivity leak in explanation
  if (/\b(best\s+answer|most\s+comprehensive|arguably|most\s+complete|strongest\s+answer)\b/i.test(expl)
      && !/\b(best|strongest|most)\b/i.test(stem)) {
    return { ok: false, gate: "explanation-subjectivity-leak",
      reason: `explanation uses "best/most" without stem cue — undermines single-answer objectivity` };
  }

  // ChatGPT v2 #18 — Multi-answer implication
  const multiAns = /\b(however|but|although)\b[^.]*\b(?:is\s+also\s+correct|the\s+more|the\s+most|also\s+(?:works|valid|right))\b/i.exec(expl);
  if (multiAns) {
    return { ok: false, gate: "explanation-multi-answer-implication",
      reason: `explanation implies multiple correct answers ("${multiAns[0].slice(0, 40)}")` };
  }

  // Sprint A — Negation §3.3
  const NEGATION_STEM_REGEX = /\b(?:which\s+(?:is|are|of\s+the\s+following|statement)\s+(?:is\s+|are\s+)?(?:not|false|incorrect)\b|except\b|least\s+likely\b|not\s+(?:true|correct|accurate|incorrect|false|wrong|associated|considered|an\s+example|a\s+characteristic|a\s+feature|typically|usually|generally)\b|\bNOT\b(?=\s+(?:true|correct|incorrect|false|considered|associated|typically|usually|a|an|the)))/i;
  if (NEGATION_STEM_REGEX.test(stem)) {
    if (/\bnot\b[^.?]{0,40}\b(?:not|never|incorrect|false|wrong|untrue|fails?\s+to)\b/i.test(stem)) {
      return { ok: false, gate: "stem-double-negation",
        reason: `stem has double negation — ambiguous logic` };
    }
    const NEGATION_ACK = /\b(not|except|false|incorrect|exception|violates?|does\s+not|is\s+the\s+only|only\s+one|opposite|contradicts?|does\s+not\s+(?:apply|fit|match|belong|hold)|fails?\s+to|unlike|whereas\s+the\s+others)\b/i;
    if (!NEGATION_ACK.test(expl)) {
      return { ok: false, gate: "explanation-ignores-negation",
        reason: `stem has negation cue but explanation never acknowledges the inversion` };
    }
  }

  // Sprint A — Semantic contract §3.1: extremum
  const extremumMatch = stem.match(/\b(smallest|largest|greatest|least|highest|lowest|maximum|minimum|biggest|max\b|min\b)\b/i);
  if (extremumMatch && q.correctAnswer) {
    const word = extremumMatch[1].toLowerCase();
    const wantsMax = /^(largest|greatest|highest|maximum|biggest|max)/.test(word);
    const optNums = opts.map((o) => {
      const stripped = o.replace(/^[A-E]\)\s*/, "").replace(/[\$%,\s]/g, "");
      return /^-?\d+(?:\.\d+)?$/.test(stripped) ? Number(stripped) : NaN;
    });
    if (optNums.every((n) => Number.isFinite(n)) && new Set(optNums).size === optNums.length) {
      const correctIdx = q.correctAnswer.charCodeAt(0) - 65;
      const correctVal = optNums[correctIdx];
      const extremumVal = wantsMax ? Math.max(...optNums) : Math.min(...optNums);
      if (correctVal !== extremumVal) {
        return { ok: false, gate: "stem-extremum-mismatch",
          reason: `stem asks "${word}" but correctAnswer (${correctVal}) is not the ${wantsMax ? "max" : "min"} of [${optNums.join(", ")}]` };
      }
    }
  }

  // Sprint A — Semantic contract §3.1: trend
  const trendMatch = stem.match(/\b(increase|decrease|rise|fall|grow|shrink|expand|contract|gain|lose|appreciate|depreciate)s?\b/i);
  if (trendMatch) {
    const TREND_ACK = /\b(increase|decrease|rise|ros[ei]|fall|fell|grow|grew|shrink|shrank|shrunk|expand|contract|gain|lost?|appreciat|depreciat|higher|lower|more|less|greater|smaller|up|down|positive|negative|inverse|direct|proportional)/i;
    if (!TREND_ACK.test(expl)) {
      return { ok: false, gate: "explanation-ignores-trend",
        reason: `stem asks about "${trendMatch[1]}" trend but explanation has no direction words` };
    }
  }

  // UARP §3.6 — Hallucination patterns (fabricated citations/authorities)
  const HALLUCINATION_PATTERNS: { re: RegExp; name: string; desc: string }[] = [
    { re: /\b[A-Z][a-z]+\s+et\s+al\.\s*\(\d{4}\)/, name: "fake-citation", desc: 'fabricated academic citation' },
    { re: /\baccording\s+to\s+(?:recent\s+)?research\b/i, name: "fake-research-appeal", desc: '"according to research" without source' },
    { re: /\bstudies\s+have\s+shown\b/i, name: "vague-studies", desc: '"studies have shown" — vague appeal' },
    { re: /\bresearch\s+(?:indicates|suggests|demonstrates)\b/i, name: "vague-research", desc: '"research indicates" — unsourced' },
    { re: /\bexactly\s+\d+\.\d+\s*%/i, name: "suspicious-precision", desc: 'suspiciously precise statistic' },
    { re: /\bit\s+(?:can|could|may|might)\s+be\s+(?:said|argued|claimed)\b/i, name: "weak-hedging", desc: 'weak hedging — generator unsure' },
    { re: /\bsome\s+(?:experts|scholars|sources)\s+(?:argue|believe|suggest)/i, name: "fake-expert-appeal", desc: '"some experts argue" — no name' },
  ];
  for (const { re, name, desc } of HALLUCINATION_PATTERNS) {
    if (re.test(expl)) return { ok: false, gate: `explanation-hallucination-${name}`, reason: desc };
  }

  // UARP §5 surrogate — Domain Vocabulary Expectations (Ayu meiosis-Q class)
  const DOMAIN_VOCAB: { stemRe: RegExp; terms: string[]; min: number; courses: RegExp; name: string; desc: string }[] = [
    { stemRe: /\bploidy\b/i, terms: ["haploid","diploid","triploid","tetraploid","polyploid","monoploid"], min: 2, courses: /^CLEP_BIOLOGY|^AP_BIOLOGY/i, name: "ploidy", desc: 'ploidy Q lacks canonical terms' },
    { stemRe: /\btype\s+of\s+(?:natural\s+)?selection\b/i, terms: ["stabilizing","directional","disruptive","balancing","frequency-dependent"], min: 2, courses: /BIOLOGY|EVOLUTION/i, name: "selection-type", desc: 'selection-type Q lacks canonical terms' },
    { stemRe: /\bphase\s+of\s+(?:mitosis|meiosis|cell\s+cycle)\b/i, terms: ["prophase","metaphase","anaphase","telophase","interphase","cytokinesis"], min: 2, courses: /BIOLOGY/i, name: "cell-cycle-phase", desc: 'cell-cycle-phase Q lacks canonical terms' },
    { stemRe: /\btype\s+of\s+inheritance\b/i, terms: ["dominant","recessive","codominance","incomplete dominance","polygenic","sex-linked","autosomal","x-linked"], min: 2, courses: /BIOLOGY|GENETICS/i, name: "inheritance-type", desc: 'inheritance-type Q lacks canonical terms' },
    { stemRe: /\btype\s+of\s+(?:chemical\s+)?bond\b/i, terms: ["ionic","covalent","hydrogen","metallic","peptide","disulfide","glycosidic","phosphodiester"], min: 2, courses: /BIOLOGY|CHEMISTRY/i, name: "bond-type", desc: 'bond-type Q lacks canonical terms' },
    { stemRe: /\b(?:state|phase)\s+of\s+matter\b/i, terms: ["solid","liquid","gas","plasma"], min: 3, courses: /CHEMISTRY|PHYSICS/i, name: "state-of-matter", desc: 'state-of-matter Q lacks canonical terms' },
    { stemRe: /\bbranch(?:es)?\s+of\s+(?:the\s+)?(?:U\.?S\.?\s+)?government\b/i, terms: ["legislative","executive","judicial"], min: 2, courses: /GOVERNMENT|HISTORY/i, name: "gov-branch", desc: 'gov-branch Q lacks canonical terms' },
    { stemRe: /\btype\s+of\s+(?:function|number)\b/i, terms: ["linear","quadratic","polynomial","exponential","logarithmic","rational","integer","irrational","real","complex"], min: 2, courses: /COLLEGE_ALGEBRA|COLLEGE_MATH|PRECALCULUS|CALCULUS/i, name: "function-type", desc: 'function/number-type Q lacks canonical terms' },
  ];
  for (const { stemRe, terms, min, courses, name, desc } of DOMAIN_VOCAB) {
    if (!stemRe.test(stem)) continue;
    if (q.course && !courses.test(q.course)) continue;
    const allOptsLower = opts.map((o) => o.toLowerCase()).join(" || ");
    const matched = terms.filter((t) => allOptsLower.includes(t.toLowerCase())).length;
    if (matched < min) {
      return { ok: false, gate: `options-missing-canonical-${name}`, reason: `${desc} (matched ${matched}/${min})` };
    }
  }

  return { ok: true };
}

/**
 * Bulk check helper for retroactive bank sweeps. Returns array of failures.
 * Used by scripts/_deterministic-gate-sweep.mjs.
 */
export function runGatesBulk(candidates: (QuestionCandidate & { id: string })[]): Array<{ id: string; gate: string; reason: string }> {
  const failures: Array<{ id: string; gate: string; reason: string }> = [];
  for (const c of candidates) {
    const r = runDeterministicGates(c);
    if (!r.ok) failures.push({ id: c.id, gate: r.gate ?? "unknown", reason: r.reason ?? "" });
  }
  return failures;
}

/**
 * Layer 8 runtime helper — filter a list of questions by gate, return only
 * passing ones plus the IDs that failed. Routes should call this AFTER
 * findMany and BEFORE returning to the user, then fire-and-forget unapprove
 * the failed IDs.
 *
 * @param questions  must include questionText, options, correctAnswer,
 *                   explanation, course, stimulus
 * @returns { passing, failedIds }
 */
export function filterByLayer8Gate<T extends {
  id: string;
  questionText?: string;
  options?: string[] | string | unknown;
  correctAnswer?: string;
  explanation?: string;
  course?: string;
  stimulus?: string | null;
}>(questions: T[]): { passing: T[]; failedIds: string[] } {
  const passing: T[] = [];
  const failedIds: string[] = [];
  for (const q of questions) {
    const gate = runDeterministicGates({
      questionText: q.questionText,
      options: Array.isArray(q.options) ? (q.options as string[]) : undefined,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      course: q.course,
      stimulus: q.stimulus ?? undefined,
    });
    if (gate.ok) passing.push(q);
    else failedIds.push(q.id);
  }
  return { passing, failedIds };
}
