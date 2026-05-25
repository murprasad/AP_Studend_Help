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
]);

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
  if (FOUR_CHOICE_COURSES.has(course)) return 4;
  return 5;
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
  if (!q.correctAnswer || !/^[A-E]$/.test(q.correctAnswer)) {
    return { ok: false, gate: "structure", reason: `correctAnswer "${q.correctAnswer}" not a single letter A-E` };
  }
  if (!q.explanation || typeof q.explanation !== "string" || q.explanation.length < 40) {
    return { ok: false, gate: "structure", reason: "explanation missing or shorter than 40 chars" };
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
