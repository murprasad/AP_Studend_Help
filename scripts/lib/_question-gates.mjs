/**
 * Shared deterministic question gates for ALL seed/generation scripts.
 *
 * Ports `src/lib/deterministic-question-gates.ts` (TypeScript runtime gate)
 * to plain ESM so .mjs scripts can use the same logic. Keep both in sync.
 *
 * Usage in a seed script:
 *   import { runDeterministicGates, normalizeQuestion } from "./lib/_question-gates.mjs";
 *   const result = runDeterministicGates(q);
 *   if (!result.ok) { console.log("rejected:", result.gate, result.reason); continue; }
 *
 * Per the project rule (feedback_validator_must_be_deterministic.md):
 * "AI judging AI is theater — validators must be deterministic."
 * These gates are pure functions, microseconds, no network/DB.
 */

// Per CB-spec exceptions (2026-05-17 audit).
// Most CLEP MCQs use 5 options. Documented exceptions:
const FOUR_CHOICE_COURSES = new Set([
  "CLEP_COLLEGE_MATH",
  "CLEP_SPANISH",
  "CLEP_SPANISH_WRITING",
  "CLEP_FRENCH",
  "CLEP_GERMAN",
]);

// AP/SAT/ACT/PSAT use 4 options universally (post-2025 redesigns).
const FOUR_CHOICE_PREFIXES = ["DSST_", "AP_", "SAT_", "ACT_", "PSAT_", "ACCUPLACER"];

export function expectedOptionCount(course) {
  if (!course) return 5;
  if (FOUR_CHOICE_PREFIXES.some((p) => course.startsWith(p))) return 4;
  if (FOUR_CHOICE_COURSES.has(course)) return 4;
  return 5;
}

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
  "closest match", "miscalculation", "calculation error",
  "incorrect option values", "might be due to",
  "given the options provided", "given the options",
  "approximate", "rounded to match", "wedged",
];

const LETTER_CLAIM_REGEX = /(?:^|[^A-Z])(?:option\s+|answer\s+is\s+)?\(?([A-E])\)?\s+is\s+correct/i;

// Broader letter-claim patterns — captures every "X is the answer" style.
// Each regex MUST capture the claimed letter in group 1.
const LETTER_CLAIM_PATTERNS = [
  /\bletter\s+\(?([A-E])\)?\s+is\s+correct\b/i,
  /\boption\s+\(?([A-E])\)?\s+is\s+correct\b/i,
  /\bchoice\s+\(?([A-E])\)?\s+is\s+correct\b/i,
  /\b(?:the\s+)?(?:correct\s+)?answer\s+is\s+\(?([A-E])\)?\b/i,
  /\b(?:the\s+)?correct\s+(?:choice|option|answer)\s+is\s+\(?([A-E])\)?\b/i,
  /^\s*\(?([A-E])\)?\s+is\s+correct\b/i,
  /^\s*\(?([A-E])\)\s*(?:[.:,)]|$)/m,
];

// Negation cue words in the stem — when present, the correct answer should be the FALSE statement.
// We don't have a deterministic way to know if the answer matches; but we can flag stems with negation cue
// whose CORRECT option starts with affirming language like "All of", "Both", "Always" etc. as risky.
const NEGATION_STEM_CUES = [
  /\bwhich\s+(?:is|are)\s+not\s/i,
  /\ball\s+of\s+the\s+following.*\bexcept\b/i,
  /\bwhich\s+of\s+the\s+following\s+is\s+(?:not|false|incorrect)\b/i,
  /\bwhich\s+statement\s+is\s+(?:not|false|incorrect)\b/i,
];

// Stimulus-reference cues in the stem — when present, the question must have a stimulus.
const STIMULUS_REFERENCE_CUES = [
  /\bbased\s+on\s+(?:the\s+)?(?:passage|excerpt|quote|text|document|chart|graph|figure|table|image|map|paragraph)\s+(?:above|below|provided)/i,
  /\baccording\s+to\s+(?:the\s+)?(?:passage|excerpt|quote|text|document|chart|graph|figure|table|paragraph)\b/i,
  /\bthe\s+(?:passage|excerpt|quote)\s+(?:above|below)/i,
  /\bin\s+the\s+(?:passage|excerpt|quote)\s+above\b/i,
];
const DOUBLE_PREFIX_REGEX = /^[A-E]\)\s*[A-E]\)/;
const YES_NO_SET = new Set(["yes", "no", "true", "false", "agree", "disagree", "valid", "invalid"]);

function normalizeOptForDupe(s) {
  return String(s).toLowerCase()
    .replace(/^[A-E]\)\s*/i, "")
    .replace(/\s+/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[−]/g, "-")
    .replace(/[∪]/g, "U")
    .replace(/[∩]/g, "n")
    .replace(/[∞]/g, "inf")
    .trim();
}

/**
 * Extract numeric tokens (integers, decimals, simple fractions, negatives,
 * including ones inside expressions like "x = 8" or "P = 2L + 2W"). Returns
 * sorted, deduplicated numbers rounded to 8 decimals.
 */
function extractNumericTokens(s) {
  if (!s) return [];
  const out = new Set();
  const re = /-?\d+(?:\.\d+)?(?:\/\d+)?/g;
  let m;
  while ((m = re.exec(String(s))) !== null) {
    const raw = m[0];
    let val;
    if (raw.includes("/")) {
      const [num, den] = raw.split("/").map(Number);
      val = den ? num / den : NaN;
    } else {
      val = Number(raw);
    }
    if (!Number.isNaN(val)) out.add(Number(val.toFixed(8)));
  }
  return [...out].sort((a, b) => a - b);
}

/**
 * Permutation-tolerant + numeric-tolerant normalization.
 *
 * Only fires for two specific shapes — solution-set options (which can be
 * reordered) and pure numeric values (which can be expressed as decimal or
 * fraction). Algebraic-expression options like "W = (P + L) / 2" are NOT
 * touched here — for those, exact-string and structural-shape dedup handle.
 *
 * Returns "[n1,n2,...]" for set/disjunction shapes, "num:<val>" for pure
 * numerics, or null if the option doesn't match these shapes (signals
 * "don't apply permutation check").
 *
 *   "x = 3 or x = -8" === "x = -8 or x = 3"     → "[-8,3]" both
 *   "{-2, 3}" === "{3, -2}"                       → "[-2,3]" both
 *   "0.5" === "1/2"                                → "num:0.5" both
 *   "(2, 5)" interval shape                        → "[2,5]"
 *   "W = (P + L) / 2"                              → null (algebraic; skip)
 *   "Linear" "Quadratic"                           → null (prose; skip)
 */
function permuteNormalize(s) {
  const stripped = normalizeOptForDupe(s);
  // Reject options that look like algebraic expressions, exponents, or roots.
  // These often share number tokens by accident — we'd get false positives.
  if (/\^/.test(stripped)) return null;          // exponent
  if (/\bsqrt\b|√/.test(stripped)) return null;  // square root
  if (/[+*]/.test(stripped)) return null;        // explicit + or * operator
  // Reject ORDERED pair / interval shapes like "(3, 5)" — order matters there.
  // We catch sets {} only.
  if (/^\s*\(/.test(stripped)) return null;
  if (/^\s*\[/.test(stripped)) return null;
  // Pure numeric: starts/ends with digits or +-./% and no alphabetic chars
  // beyond optional "%" suffix. Catches "0.5", "1/2", "-3.14", "50%".
  // Reject pure-numeric multi-token (like "1, 2, 3, 4" — sequences where order matters)
  // unless wrapped in set braces.
  const pureNumeric = /^[-+]?[\d.,/\s]+%?$/.test(stripped);
  if (pureNumeric) {
    const nums = extractNumericTokens(stripped);
    if (nums.length === 1) {
      const v = nums[0];
      return "num:" + Number(v.toFixed(6));
    }
    // Multi-number pure-numeric strings ("1, 2, 3, 4") are ambiguous —
    // could be sequences. Skip — too prone to false positives.
    return null;
  }
  // Set / disjunction shape: explicit braces, OR "x = N or x = M"
  const isSetBraces = /^\s*\{/.test(stripped);
  const isXEqDisjunction =
    /\bx\s*=\s*-?\d/.test(stripped) &&
    /\b(?:or|and)\b/.test(stripped);
  const isYEqDisjunction =
    /\by\s*=\s*-?\d/.test(stripped) &&
    /\b(?:or|and)\b/.test(stripped);
  if (!isSetBraces && !isXEqDisjunction && !isYEqDisjunction) return null;
  const cleaned = stripped
    .replace(/[\{\}]/g, " ")
    .replace(/\bx\s*=\s*/g, "")
    .replace(/\by\s*=\s*/g, "")
    .replace(/\b(?:or|and)\b/g, " ");
  const alphaChars = cleaned.replace(/[^a-z]/g, "").length;
  if (alphaChars > 2) return null;
  const nums = extractNumericTokens(cleaned);
  if (nums.length < 2) return null;
  return "[" + nums.join(",") + "]";
}

function parseOptions(options) {
  if (Array.isArray(options)) return options.map(String);
  if (typeof options === "string") {
    try { const parsed = JSON.parse(options); return Array.isArray(parsed) ? parsed.map(String) : []; }
    catch { return []; }
  }
  return [];
}

/**
 * Normalize a candidate question in-place so it'll INSERT cleanly.
 * Returns the (mutated) candidate.
 * Run BEFORE validation.
 */
export function normalizeQuestion(q) {
  // Normalize correctAnswer to single letter A-E
  if (typeof q.correctAnswer === "string") {
    const m = q.correctAnswer.trim().toUpperCase().match(/^[A-E]/);
    if (m) q.correctAnswer = m[0];
  }
  // Normalize difficulty enum
  if (typeof q.difficulty === "string") {
    q.difficulty = q.difficulty.toUpperCase();
    if (!["EASY", "MEDIUM", "HARD"].includes(q.difficulty)) q.difficulty = "MEDIUM";
  } else {
    q.difficulty = "MEDIUM";
  }
  // Normalize options into array
  q.options = parseOptions(q.options);
  // Trim stem
  if (typeof q.questionText === "string") q.questionText = q.questionText.trim();
  if (typeof q.explanation === "string") q.explanation = q.explanation.trim();
  return q;
}

/**
 * Main gate. Returns { ok: false, gate, reason } on first failure, { ok: true } otherwise.
 * Order: cheapest, most-reliable checks first.
 */
export function runDeterministicGates(q) {
  // 1. Basic structural
  if (!q.questionText || typeof q.questionText !== "string" || q.questionText.length < 10) {
    return { ok: false, gate: "structure", reason: "questionText empty or shorter than 10 chars" };
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
    return { ok: false, gate: "options-count", reason: `expected ${expected} options for ${q.course}, got ${opts.length}` };
  }
  // 2a. Double-letter-prefix bug
  for (const o of opts) {
    if (DOUBLE_PREFIX_REGEX.test(o)) {
      return { ok: false, gate: "options-prefix-dup", reason: `option has duplicate letter prefix: "${o.slice(0, 30)}"` };
    }
  }
  // 2b. Duplicate options (Unicode-normalized)
  const seen = new Set();
  for (const o of opts) {
    const norm = normalizeOptForDupe(o);
    if (seen.has(norm)) {
      return { ok: false, gate: "options-duplicate", reason: `duplicate option (normalized): "${o.slice(0, 30)}"` };
    }
    seen.add(norm);
  }
  // 2b'. Permutation-equivalent + numeric-equivalent duplicates.
  // Catches: "x = 3 or x = -8" ≡ "x = -8 or x = 3", "{a,b}" ≡ "{b,a}",
  // "0.5" ≡ "1/2", "x = 2 and x = 4/3" ≡ "x = 4/3 and x = 2".
  // (2026-05-21 — added after the |2x-5|=11 incident where A≡B and D≡E.)
  const seenPerm = new Map(); // key -> first-seen option (for error message)
  for (const o of opts) {
    const pkey = permuteNormalize(o);
    // permuteNormalize returns null for shapes we shouldn't compare (prose,
    // algebraic expressions). Only compare keys that came back as either
    // a sorted-numeric list "[...]" or a pure-numeric scalar "num:...".
    if (pkey && (pkey.startsWith("[") || pkey.startsWith("num:"))) {
      if (seenPerm.has(pkey)) {
        return { ok: false, gate: "options-permutation-equivalent",
          reason: `option "${String(o).slice(0, 40)}" is permutation/numeric-equivalent to "${String(seenPerm.get(pkey)).slice(0, 40)}"` };
      }
      seenPerm.set(pkey, o);
    }
  }
  // 2c. Letter prefix presence (every option needs "X) " prefix for standard MCQs)
  if (opts.length >= 4) {
    const prefixCount = opts.filter((o) => /^[A-E][\)\.]\s*/.test(o.trim())).length;
    if (prefixCount === 0) {
      return { ok: false, gate: "options-missing-prefix", reason: `none of ${opts.length} options have A)/B) letter prefix` };
    }
    if (prefixCount > 0 && prefixCount < opts.length) {
      return { ok: false, gate: "options-partial-prefix", reason: `${prefixCount}/${opts.length} options have prefix, inconsistent` };
    }
  }
  // 2d. Mixed option types (Yes/No coexisting with algebraic/numeric)
  const strippedOpts = opts.map((o) => normalizeOptForDupe(o));
  const hasYesNo = strippedOpts.some((o) => YES_NO_SET.has(o));
  const hasAlgOrNum = strippedOpts.some((o) => !YES_NO_SET.has(o) && /[+\-*/^=()0-9]/.test(o) && o.length <= 60);
  if (hasYesNo && hasAlgOrNum) {
    return { ok: false, gate: "options-mixed-types", reason: "Yes/No coexists with algebraic/numeric options" };
  }
  // 2e. Hint-in-option (CB style violation)
  for (const o of opts) {
    const stripped = String(o).replace(/^[A-E]\)\s*/, "");
    for (const re of HINT_IN_OPTION_PATTERNS) {
      if (re.test(stripped)) {
        return { ok: false, gate: "option-contains-hint", reason: `option contains hint/explanation (${re.source}): "${stripped.slice(0, 60)}"` };
      }
    }
  }
  // 2f. correctAnswer letter must point to a valid option index
  const correctIndex = q.correctAnswer.charCodeAt(0) - 65;
  if (correctIndex < 0 || correctIndex >= opts.length) {
    return { ok: false, gate: "correctAnswer-index", reason: `correctAnswer "${q.correctAnswer}" out of range for ${opts.length} options` };
  }

  // 3. Explanation letter-mismatch (Gregory's bug). v2: broader patterns +
  // self-contradiction detection (multiple disagreeing letter claims).
  const head = q.explanation.slice(0, 500);
  const claimedLetters = new Set();
  // Original wide regex (kept for the "X is correct" baseline)
  const baseMatch = head.match(LETTER_CLAIM_REGEX);
  if (baseMatch) claimedLetters.add(baseMatch[1].toUpperCase());
  // Each specific pattern — gather every claim so we can detect contradiction
  for (const re of LETTER_CLAIM_PATTERNS) {
    const m = head.match(re);
    if (m && m[1]) claimedLetters.add(m[1].toUpperCase());
  }
  if (claimedLetters.size > 0) {
    if (!claimedLetters.has(q.correctAnswer)) {
      const claimed = [...claimedLetters].join("/");
      return { ok: false, gate: "explanation-letter-mismatch", reason: `explanation claims "${claimed}" correct but stored correctAnswer is "${q.correctAnswer}"` };
    }
    if (claimedLetters.size > 1) {
      // Self-contradiction: explanation says multiple different letters are correct.
      return { ok: false, gate: "explanation-self-contradiction", reason: `explanation claims multiple letters correct: ${[...claimedLetters].join(", ")}` };
    }
  }

  // 3a. Numeric coherence — only fires for clearly SCALAR answers where
  // the digit *is* the answer (not an incidental year/edition/ordinal).
  // Examples that fire: "x = 7", "0.5", "42", "$1,200".
  // Examples that DO NOT fire: "APA-7" (edition), "2022 article" (year),
  // "19th-20th centuries" (ordinal), citations, intervals, expressions.
  const correctOpt = String(opts[correctIndex] || "");
  const correctOptStripped = correctOpt.replace(/^[A-E]\)\s*/i, "").trim();
  const looksScalarAnswer =
    /^[xyzfgp]\s*=\s*-?\d/i.test(correctOptStripped) ||      // "x = 7"
    /^-?\d+(?:\.\d+)?(?:\/\d+)?\s*%?\s*$/.test(correctOptStripped) || // "7", "0.5", "1/2", "50%"
    /^\$\s*-?[\d,]+(?:\.\d+)?$/.test(correctOptStripped);    // "$1,200"
  if (looksScalarAnswer) {
    const correctNums = extractNumericTokens(correctOpt);
    if (correctNums.length > 0 && correctNums.length <= 3) {
      const explNums = new Set(extractNumericTokens(q.explanation));
      const hit = correctNums.some((n) => explNums.has(n));
      if (!hit) {
        return { ok: false, gate: "explanation-numeric-mismatch",
          reason: `correct option "${correctOpt.slice(0, 40)}" contains [${correctNums.join(",")}] but none appear in explanation` };
      }
    }
  }

  // 3b. Length-skewed correct option — when the correct option is dramatically
  // longer than the median distractor, that's a CB-style violation (and a
  // tell-tale of AI gen with weak distractor parity).
  const optLens = opts.map((o) => normalizeOptForDupe(o).length);
  const correctLen = optLens[correctIndex];
  const distractorLens = optLens.filter((_, i) => i !== correctIndex).sort((a, b) => a - b);
  const median = distractorLens[Math.floor(distractorLens.length / 2)] || 1;
  // Trigger only on extreme skew (correct option > 2.5× median distractor) AND
  // when the absolute gap matters (>= 30 chars). Keeps signal-to-noise good.
  if (median >= 6 && correctLen > median * 2.5 && (correctLen - median) >= 30) {
    return { ok: false, gate: "options-length-skewed",
      reason: `correct option length ${correctLen} vs median distractor ${median} — CB style violation (parity)` };
  }

  // 3c. Stimulus-reference in stem must match a present stimulus.
  if (!q.stimulus || (typeof q.stimulus === "string" && q.stimulus.trim().length < 20)) {
    for (const re of STIMULUS_REFERENCE_CUES) {
      if (re.test(q.questionText)) {
        return { ok: false, gate: "stem-missing-stimulus",
          reason: `stem references a passage/chart/figure but no stimulus is present (matched: ${re.source.slice(0, 50)})` };
      }
    }
  }

  // 4. Confession phrases
  const explLower = q.explanation.toLowerCase();
  for (const phrase of CONFESSION_PHRASES) {
    if (explLower.includes(phrase)) {
      return { ok: false, gate: "confession-phrase", reason: `explanation contains confession phrase: "${phrase}"` };
    }
  }

  // 5. Truncated-stem (math-completeness) gate — added 2026-05-24 from ChatGPT
  // recommendation. Catches stems like "Factor the expression", "Solve for x",
  // "What is the expanded form of" with no actual math object afterwards.
  // Gregory (PASS user) hit "What is the expanded form of" in his session.
  const stemTrim = (q.questionText || "").trim();
  const TRUNC_PATTERNS = [
    /^(factor|simplify|evaluate|expand|solve|compute|calculate|differentiate|integrate)\s+(the\s+)?(expression|equation|polynomial|function|formula|value|form)\.?$/i,
    /^(factor|simplify|evaluate|expand|solve|compute|calculate)\s+(the\s+)?(following|above|given|next)\b/i,
    /\bexpanded\s+form\s+of\s*[?:.]?$/i,
    /\bfactored\s+form\s+of\s*[?:.]?$/i,
    /\bsolve\s+for\s+[a-z]\.?\s*$/i,                          // "Solve for x" with no equation
    /\bwhat\s+(is|are)\s+(the\s+)?value\s+of\s*[?:.]?$/i,
    /\bthe\s+expression\s*[?:.]?$/i,                          // ends with bare "the expression"
  ];
  for (const re of TRUNC_PATTERNS) {
    if (re.test(stemTrim)) {
      return { ok: false, gate: "stem-truncated-math",
        reason: `stem appears truncated (no math object after verb): "${stemTrim.slice(0, 60)}"` };
    }
  }

  return { ok: true };
}

/**
 * Convenience: normalize + validate in one call.
 * Returns { ok, gate, reason } and mutates q in-place.
 */
export function normalizeAndValidate(q) {
  normalizeQuestion(q);
  return runDeterministicGates(q);
}
