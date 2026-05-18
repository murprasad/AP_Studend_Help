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
 * answer values; explanation goes in the explanation field. Caught on PL
 * Psych courses (170+ offenders) and mirrored here. B6.
 */
const HINT_IN_OPTION_PATTERNS = [
  /\([^)]{25,}\)/,
  / — | -- /,
  /,\s*because\s/i,
  /,\s*which\s+is\s/i,
  /,\s*which\s+refers\s+to\s/i,
  /,\s*also\s+called\s/i,
  /\bi\.e\.\,/i,
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
  // 2b. Duplicate options (case-insensitive)
  const seen = new Set<string>();
  for (const o of opts) {
    const norm = o.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(norm)) {
      return { ok: false, gate: "options-duplicate", reason: `duplicate option value: "${o.slice(0, 30)}"` };
    }
    seen.add(norm);
  }
  // 2d. Hint-in-option (CB style violation — B6, 2026-05-17).
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

  // 3. Explanation letter-mismatch (Gregory's bug)
  const head = q.explanation.slice(0, 300);
  const letterMatch = head.match(LETTER_CLAIM_REGEX);
  if (letterMatch) {
    const claimedLetter = letterMatch[1].toUpperCase();
    if (claimedLetter !== q.correctAnswer) {
      return {
        ok: false,
        gate: "explanation-letter-mismatch",
        reason: `explanation says "${claimedLetter} is correct" but stored correctAnswer is "${q.correctAnswer}"`,
      };
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
  // B3 (2026-05-17).
  const hazard = validateRenderHazards(q.questionText, q.stimulus);
  if (hazard) {
    return { ok: false, gate: "render-hazard", reason: hazard };
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
