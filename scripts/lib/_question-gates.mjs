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

// 2026-05-24 — UARP §3.6 hallucination patterns. Beyond confession phrases.
// Catches generator hedging that masks fabricated facts.
const HALLUCINATION_PATTERNS = [
  // Fabricated citation patterns (no real CB explanation cites named studies)
  { re: /\b[A-Z][a-z]+\s+et\s+al\.\s*\(\d{4}\)/, name: "fake-citation",
    desc: 'fabricated academic citation (e.g., "Smith et al. (2024)")' },
  { re: /\baccording\s+to\s+(?:recent\s+)?research\b/i, name: "fake-research-appeal",
    desc: '"according to research" without source — generator filler' },
  { re: /\bstudies\s+have\s+shown\b/i, name: "vague-studies",
    desc: '"studies have shown" — vague appeal to authority' },
  { re: /\bresearch\s+(?:indicates|suggests|demonstrates)\b/i, name: "vague-research",
    desc: '"research indicates/suggests" — unsourced authority' },
  // Suspicious decimal-precision facts (likely hallucinated)
  { re: /\bexactly\s+\d+\.\d+\s*%/i, name: "suspicious-precision",
    desc: 'suspiciously precise statistic ("exactly 73.4%")' },
  // Generator hedging tells
  { re: /\bit\s+(?:can|could|may|might)\s+be\s+(?:said|argued|claimed)\b/i, name: "weak-hedging",
    desc: 'weak hedging ("it can be said") — generator unsure' },
  { re: /\bsome\s+(?:experts|scholars|sources)\s+(?:argue|believe|suggest)/i, name: "fake-expert-appeal",
    desc: '"some experts argue" — no actual expert named' },
];

// 2026-05-24 — Domain Vocabulary Expectations (UARP §5 surrogate).
//
// Catches the "Meiosis ploidy" bug class (Ayu, CLEP_BIOLOGY 2026-05-25):
//   Stem: "Meiosis results in cells with what ploidy?"
//   Options: Increased / Variable / Zero / Unchanged / Decreased
//   Bug: NONE of the options use the canonical bio term "haploid" / "diploid".
//
// When a stem matches a known pattern, the options collectively MUST contain at
// least MIN of the expected canonical terms. Deterministic, fast, no false
// positives (rejections are clean signal — option set actually lacks vocab).
const DOMAIN_VOCAB_EXPECTATIONS = [
  // Biology
  { stemRe: /\bploidy\b/i, terms: ["haploid","diploid","triploid","tetraploid","polyploid","monoploid"], min: 2,
    courses: /^CLEP_BIOLOGY|^AP_BIOLOGY/i,
    name: "ploidy", desc: 'stem asks about ploidy but options lack canonical terms (haploid/diploid/etc.)' },
  { stemRe: /\btype\s+of\s+(?:natural\s+)?selection\b/i, terms: ["stabilizing","directional","disruptive","balancing","frequency-dependent"], min: 2,
    courses: /BIOLOGY|EVOLUTION/i,
    name: "selection-type", desc: 'stem asks selection type but options lack canonical terms (stabilizing/directional/disruptive)' },
  { stemRe: /\bphase\s+of\s+(?:mitosis|meiosis|cell\s+cycle)\b/i, terms: ["prophase","metaphase","anaphase","telophase","interphase","cytokinesis"], min: 2,
    courses: /BIOLOGY/i,
    name: "cell-cycle-phase", desc: 'stem asks cell cycle phase but options lack canonical terms (prophase/metaphase/etc.)' },
  { stemRe: /\btype\s+of\s+inheritance\b/i, terms: ["dominant","recessive","codominance","incomplete dominance","polygenic","sex-linked","autosomal","x-linked"], min: 2,
    courses: /BIOLOGY|GENETICS/i,
    name: "inheritance-type", desc: 'inheritance-type Q lacks canonical terms (dominant/codominance/etc.)' },
  { stemRe: /\btype\s+of\s+(?:chemical\s+)?bond\b/i, terms: ["ionic","covalent","hydrogen","metallic","peptide","disulfide","glycosidic","phosphodiester"], min: 2,
    courses: /BIOLOGY|CHEMISTRY/i,
    name: "bond-type", desc: 'bond-type Q lacks canonical terms (ionic/covalent/etc.)' },
  // Chemistry
  { stemRe: /\b(?:state|phase)\s+of\s+matter\b/i, terms: ["solid","liquid","gas","plasma"], min: 3,
    courses: /CHEMISTRY|PHYSICS/i,
    name: "state-of-matter", desc: 'state/phase-of-matter Q lacks canonical terms (solid/liquid/gas)' },
  // Government / History
  { stemRe: /\bbranch(?:es)?\s+of\s+(?:the\s+)?(?:U\.?S\.?\s+)?government\b/i, terms: ["legislative","executive","judicial"], min: 2,
    courses: /GOVERNMENT|HISTORY/i,
    name: "gov-branch", desc: 'branch-of-government Q lacks canonical terms (legislative/executive/judicial)' },
  // Math
  { stemRe: /\btype\s+of\s+(?:function|number)\b/i, terms: ["linear","quadratic","polynomial","exponential","logarithmic","rational","integer","rational","irrational","real","complex"], min: 2,
    courses: /COLLEGE_ALGEBRA|COLLEGE_MATH|PRECALCULUS|CALCULUS/i,
    name: "function-type", desc: 'function/number-type Q lacks canonical terms (linear/quadratic/polynomial/etc.)' },

  // 2026-05-25 extension batch
  // Psychology
  { stemRe: /\btype\s+of\s+(?:classical\s+)?conditioning\b/i, terms: ["classical","operant","observational","habituation","sensitization"], min: 2,
    courses: /PSYCHOLOG/i,
    name: "conditioning-type", desc: 'conditioning-type Q lacks canonical terms (classical/operant/observational)' },
  { stemRe: /\btype\s+of\s+memory\b/i, terms: ["short-term","long-term","sensory","working","episodic","semantic","procedural","implicit","explicit"], min: 2,
    courses: /PSYCHOLOG/i,
    name: "memory-type", desc: 'memory-type Q lacks canonical terms (short-term/long-term/episodic/etc.)' },
  { stemRe: /\bschool\s+of\s+(?:thought\s+in\s+)?psycholog/i, terms: ["behaviorism","cognitivism","humanism","psychoanalysis","gestalt","functionalism","structuralism"], min: 2,
    courses: /PSYCHOLOG/i,
    name: "psych-school", desc: 'psych-school Q lacks canonical terms (behaviorism/cognitivism/humanism)' },

  // Chemistry — reaction types
  { stemRe: /\btype\s+of\s+(?:chemical\s+)?reaction\b/i, terms: ["synthesis","combination","decomposition","single replacement","double replacement","combustion","redox","neutralization","precipitation","acid-base"], min: 2,
    courses: /CHEMISTRY/i,
    name: "reaction-type", desc: 'reaction-type Q lacks canonical terms (synthesis/decomposition/redox/etc.)' },

  // Government — types of government
  { stemRe: /\btype\s+of\s+government\b/i, terms: ["democracy","republic","monarchy","oligarchy","autocracy","theocracy","dictatorship","totalitarian","authoritarian","parliamentary","federal"], min: 2,
    courses: /GOVERNMENT|HISTORY|SOCIAL/i,
    name: "gov-type", desc: 'government-type Q lacks canonical terms (democracy/republic/monarchy/etc.)' },

  // Biology — organelles
  { stemRe: /\borganelle\b/i, terms: ["mitochondria","nucleus","ribosome","endoplasmic reticulum","golgi","lysosome","vacuole","chloroplast","peroxisome","cytoskeleton"], min: 2,
    courses: /BIOLOGY|NATURAL_SCIENCES/i,
    name: "organelle", desc: 'organelle Q lacks canonical names (mitochondria/nucleus/ribosome/etc.)' },

  // English — parts of speech
  { stemRe: /\bpart\s+of\s+speech\b/i, terms: ["noun","verb","adjective","adverb","pronoun","preposition","conjunction","interjection"], min: 2,
    courses: /ENGLISH|COMPOSITION|LITERATURE|GRAMMAR/i,
    name: "part-of-speech", desc: 'part-of-speech Q lacks canonical terms (noun/verb/adjective/etc.)' },

  // English — literary devices
  { stemRe: /\bliterary\s+(?:device|technique)\b/i, terms: ["metaphor","simile","personification","alliteration","hyperbole","irony","symbolism","onomatopoeia","oxymoron","foreshadowing","allusion","imagery"], min: 2,
    courses: /LITERATURE|ENGLISH|COMPOSITION/i,
    name: "literary-device", desc: 'literary-device Q lacks canonical terms (metaphor/simile/irony/etc.)' },

  // History — types of revolution
  { stemRe: /\btype\s+of\s+revolution\b/i, terms: ["industrial","political","scientific","agricultural","social","cultural","economic","commercial"], min: 2,
    courses: /HISTORY|WESTERN_CIV/i,
    name: "revolution-type", desc: 'revolution-type Q lacks canonical adjectives (industrial/political/scientific/etc.)' },
];

// 2026-05-25 — additional hallucination patterns (UARP §3.6 extension).
const HALLUCINATION_PATTERNS_V2 = [
  { re: /\bit\s+is\s+(?:well[\s-]?known|widely\s+accepted|generally\s+agreed)\s+that\b/i, name: "v2-appeal-to-consensus",
    desc: '"it is well-known/widely accepted that" — appeal to consensus without source' },
  { re: /\b(?:often|typically|generally)\s+(?:considered|regarded|believed)\s+to\s+be\b/i, name: "v2-vague-attribution",
    desc: '"often considered to be" — vague attribution, no agent' },
  { re: /\baccording\s+to\s+(?:some|many|most)\s+(?:experts|scholars|psychologists|economists|historians)\b/i, name: "v2-anonymous-experts",
    desc: '"according to some/many experts" — no expert actually identified' },
  { re: /\bapproximately\s+\d{2,}(?:,\d{3})*\s+(?:people|cases|individuals|patients|subjects)\b/i, name: "v2-suspect-population",
    desc: 'suspect population figure (approximately N people) — likely invented' },
  { re: /\b(?:research|studies?)\s+(?:from\s+)?\d{4}\s+(?:show|suggest|reveal|prove)/i, name: "v2-fake-year-citation",
    desc: '"research from YYYY shows" — bare-year citation with no source' },
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
  // 2026-05-24 Rule 12 — FRQ-format leak: correctAnswer like "Same as explanation",
  // "See above", "Refer to rubric" should NEVER pass MCQ gate. Already caught by
  // single-letter check above, but adding explicit signal for telemetry.
  if (/^(?:same|see|refer|consult|review|check)\b/i.test(String(q.correctAnswer))) {
    return { ok: false, gate: "structure-frq-leak", reason: `MCQ correctAnswer "${q.correctAnswer}" looks like FRQ rubric text — schema violation` };
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
  // 2026-05-27 — Unescaped currency $ in stem. Caught by College Algebra
  // ensemble (5+ real cases) but not by any deterministic gate. Heuristic:
  // - Strip escaped \$ first
  // - Count remaining $; if odd → unbalanced → FAIL
  // - If even, check that each pair surrounds LaTeX-shaped math content
  //   (no whitespace adjacent to the delimiters AND content uses ^/_/\\/{)
  // - If pairs don't look like math (digit-only / spaces / no LaTeX symbols),
  //   they're currency that should be escaped → FAIL
  {
    const stemStripped = String(q.questionText || "").replace(/\\\$/g, "");
    const dollars = (stemStripped.match(/\$/g) || []).length;
    if (dollars >= 2) {
      // Split on $ to inspect content between delimiters
      const parts = stemStripped.split("$");
      // Even number of $ → odd number of "parts" (3, 5, 7...) where odd-indexed are inside delimiters
      let suspect = false;
      if (dollars % 2 !== 0) {
        suspect = true; // unbalanced
      } else {
        // Check each "inside" section. Math-shaped content uses operators
        // (=, +, -, *, /, ^, _, \), grouping {}, or is just a short token
        // (variable / number / simple expression). Currency-shaped content
        // is "75 and …" — digits followed by English prose.
        for (let i = 1; i < parts.length; i += 2) {
          const inside = (parts[i] || "").trim();
          if (!inside) { suspect = true; break; } // empty between dollars = unmatched
          const hasMathSymbol = /[=+\-*/\\^_{}<>(),]/.test(inside);
          const hasOnlyShortToken = /^[\w.,^_{}=+\-*/\\<>()|]{1,40}$/.test(inside);
          const looksLikeMath = hasMathSymbol || hasOnlyShortToken;
          // Currency-shaped: starts with digit and contains English prose
          // (a word ≥4 chars + a space).
          const looksLikeCurrency = /^\d/.test(inside) && /\s[a-z]{4,}/i.test(inside);
          if (!looksLikeMath || looksLikeCurrency) {
            suspect = true;
            break;
          }
        }
      }
      if (suspect) {
        return { ok: false, gate: "stem-unescaped-currency-dollar", reason: `stem has ${dollars} bare $ chars that don't form valid paired math delimiters — likely currency that should be escaped as \\$ or written as "dollars"` };
      }
    }
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
    // 2026-05-24 — Catch "all options labeled with the same letter" bug.
    // User-reported: MARKETING champion had ["A) ...","A) ...","A) ...","A) ...","A) ..."]
    // and HUMANITIES (replacement) had the same pattern. Data corruption.
    const prefixLetters = opts
      .map((o) => o.trim().match(/^([A-E])[\)\.]/)?.[1])
      .filter(Boolean);
    if (prefixLetters.length === opts.length) {
      const distinct = new Set(prefixLetters);
      if (distinct.size !== opts.length) {
        return { ok: false, gate: "options-duplicate-prefix-letters",
          reason: `${opts.length} options but only ${distinct.size} distinct prefix letters (e.g. all "A)")` };
      }
      // Verify prefixes are sequential A, B, C, D[, E]
      const expected = "ABCDE".slice(0, opts.length).split("");
      const got = prefixLetters.join("");
      if (got !== expected.join("")) {
        return { ok: false, gate: "options-out-of-order-prefix",
          reason: `prefix letters ${got} not sequential (expected ${expected.join("")})` };
      }
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

  // 2026-05-27 — Self-contradicting explanation: derives a final value
  // (so x = N / therefore x = N / x must be N) that differs from the
  // stored answer's value. Triggered by live bug: "Solve 3^x = 81,
  // correctAnswer=E (option "2"). Explanation: '2 is correct because
  // 3^2 = 9 and 3^4 = 81, so x = 4.' The "so x = 4" contradicts the
  // stored "2". Surface letter-match passes ("2" is option E) — but the
  // math walk derives a different value than the claim. Conservative:
  // only flag when stored option is a single number AND the derivation
  // is unambiguous ("so x = N" / "therefore x = N" / "x must be N").
  const FINAL_VALUE_PATTERNS = [
    /\bso\s+([xyz])\s*=\s*(-?\d+(?:\.\d+)?)\b/i,
    /\btherefore\s+([xyz])\s*=\s*(-?\d+(?:\.\d+)?)\b/i,
    /\bthus\s+([xyz])\s*=\s*(-?\d+(?:\.\d+)?)\b/i,
    /\b([xyz])\s+must\s+be\s+(-?\d+(?:\.\d+)?)\b/i,
    /\b([xyz])\s+equals?\s+(-?\d+(?:\.\d+)?)\b/i,
    /\bvalue\s+of\s+([xyz])\s+is\s+(-?\d+(?:\.\d+)?)\b/i,
  ];
  const storedOptText = String(opts[correctIndex] || "").replace(/^[A-E]\)\s*/, "").replace(/\$|\\|`/g, "").trim();
  const storedNum = storedOptText.match(/^(-?\d+(?:\.\d+)?)$/);
  if (storedNum) {
    for (const re of FINAL_VALUE_PATTERNS) {
      const m = q.explanation.match(re);
      if (m && m[2] && m[2] !== storedNum[1]) {
        return { ok: false, gate: "explanation-derives-contradictory-value",
          reason: `explanation derives "${m[0]}" but stored correctAnswer ${q.correctAnswer} = "${storedOptText}"` };
      }
    }
  }

  // 2026-05-24 — Body letter references in explanation are brittle on
  // shuffle. Catches "B is incorrect", "Option C is wrong", "A is not
  // correct" anywhere after position 60. Plus 2026-05-24 (Isabel report):
  // "C is a type of mnemonic, but D is the most comprehensive answer" —
  // contradictory phrasing using "[Letter] is the/a [adjective]" pattern.
  const INCORRECT_LETTER_RE = /[.,]\s*(?:Letter|Option|Choice|Answer)?\s*\(?[A-E]\)?\s+(?:is\s+(?:in)?correct|is\s+wrong|is\s+not\s+correct|is\s+(?:the|a|an)\s+(?:most|more|less|least|best|better|worse|comprehensive|correct|complete|accurate)\b|is\s+a\s+type\s+of)\b/i;
  const incorrM = q.explanation.match(INCORRECT_LETTER_RE);
  if (incorrM && incorrM.index !== undefined && incorrM.index >= 60) {
    return { ok: false, gate: "explanation-body-letter-ref",
      reason: `body references option letter ("${incorrM[0].trim().slice(0, 50)}") — brittle on shuffle. Use value-based reasoning only.` };
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

  // 4b. Hallucination patterns (UARP §3.6) — fabricated citations/authorities
  for (const { re, name, desc } of HALLUCINATION_PATTERNS) {
    if (re.test(q.explanation)) {
      return { ok: false, gate: `explanation-hallucination-${name}`,
        reason: desc };
    }
  }
  // 4b-v2. Additional hallucination patterns (2026-05-25)
  for (const { re, name, desc } of HALLUCINATION_PATTERNS_V2) {
    if (re.test(q.explanation)) {
      return { ok: false, gate: `explanation-hallucination-${name}`,
        reason: desc };
    }
  }

  // 4c. Domain vocabulary expectations (UARP §5 surrogate) — Meiosis ploidy
  // bug class (Ayu, 2026-05-25). When stem matches a known pattern, options
  // collectively must contain >= min canonical terms for that domain.
  for (const { stemRe, terms, min, courses, name, desc } of DOMAIN_VOCAB_EXPECTATIONS) {
    if (!stemRe.test(q.questionText)) continue;
    if (q.course && courses && !courses.test(q.course)) continue;
    const allOptsLower = opts.map((o) => o.toLowerCase()).join(" || ");
    const matched = terms.filter((t) => allOptsLower.includes(t.toLowerCase())).length;
    if (matched < min) {
      return { ok: false, gate: `options-missing-canonical-${name}`,
        reason: `${desc} (matched ${matched}/${min} required of [${terms.slice(0,5).join(", ")}…])` };
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

  // 2026-05-24 — Tier-3 Token Truncation Gate (ChatGPT v2 #12).
  // Detects silently-truncated generations: unmatched parens, abrupt
  // ending mid-word, dangling math operators.
  const expl = q.explanation;
  // Unmatched parens (count open vs close)
  const openP = (expl.match(/\(/g) || []).length;
  const closeP = (expl.match(/\)/g) || []).length;
  if (Math.abs(openP - closeP) >= 2) {
    return { ok: false, gate: "explanation-unmatched-parens",
      reason: `explanation has ${openP} open vs ${closeP} close parens — likely truncated` };
  }
  // Ends mid-word (last char is a letter not punctuation, and prev char isn't whitespace)
  const last = expl.trim().slice(-2);
  if (last && /[a-z][a-z]/.test(last) && !/[.?!:)\]}]$/.test(expl.trim())) {
    // Allow if ends with common closing words
    if (!/(\.|\?|!|\bequals|true|false|positive|negative|zero|one|two|three|four|five|six|seven|eight|nine|ten|none|all)$/i.test(expl.trim())) {
      return { ok: false, gate: "explanation-abrupt-end",
        reason: `explanation appears truncated mid-word: ends with "${last}"` };
    }
  }
  // Ends with dangling operator (=, +, -, ×, etc.)
  if (/[=+\-*/×÷^]\s*$/.test(expl.trim())) {
    return { ok: false, gate: "explanation-dangling-operator",
      reason: `explanation ends with dangling math operator — likely truncated` };
  }

  // 2026-05-24 — ChatGPT v2 Gate 20: SUBJECTIVITY LEAK.
  // MCQs must be objectively gradable. Reject explanations introducing
  // ranking/preference language ("best answer", "most comprehensive",
  // "closest", "arguably", "better choice") UNLESS the stem itself asks
  // for it ("which is the BEST"). Isabel report: explanation said "D is
  // the most comprehensive answer" after declaring A correct — broke
  // single-answer assumption.
  const SUBJ_LEAK_RE = /\b(?:most\s+comprehensive|best\s+answer|closest\s+answer|better\s+choice|arguably|most\s+reasonable|more\s+correct|strongest\s+choice)\b/i;
  const stemAsksForBest = /\b(?:best|strongest|most\s+likely|most\s+accurate|primary|main|chief)\b/i.test(q.questionText);
  if (SUBJ_LEAK_RE.test(q.explanation) && !stemAsksForBest) {
    return { ok: false, gate: "explanation-subjectivity-leak",
      reason: `explanation contains ranking/preference language ("${q.explanation.match(SUBJ_LEAK_RE)[0]}") but stem doesn't ask for "best/strongest/most" — undermines single-answer objectivity` };
  }

  // 2026-05-24 — ChatGPT v2 Gate 17: ALL/NONE-OF-THE-ABOVE VALIDATION.
  // CB exams almost never use "All of the above" / "None of the above"
  // outside specific course conventions. Isabel report: mnemonic Q used
  // both ("A) All of the above … E) None of the above") creating ambiguity.
  // Reject globally — better to lose a few legit Qs than serve broken ones.
  const optsLower = opts.map((o) => o.toLowerCase().replace(/^[a-e][\)\.]\s*/, "").trim());
  const hasAllOfAbove = optsLower.some((o) => /^all\s+of\s+the\s+(above|other|previous|listed)/i.test(o));
  const hasNoneOfAbove = optsLower.some((o) => /^none\s+of\s+the\s+(above|other|previous|listed)/i.test(o));
  if (hasAllOfAbove || hasNoneOfAbove) {
    return { ok: false, gate: "options-all-or-none-of-above",
      reason: `option uses "${hasAllOfAbove ? 'All' : 'None'} of the above" — not used in real CB exams; creates ambiguity (Isabel's mnemonic-device Q hit this)` };
  }

  // 2026-05-24 — ChatGPT v2 Gate 18: EXPLANATION CONTRADICTION.
  // Reject if explanation contradicts itself — implies multiple correct
  // answers OR weakens uniqueness of stored answer. Patterns: "however,
  // X is also", "but X is the most…", "X could also be correct".
  const CONTRADICTION_RE = /(?:however|but|although|though|while|despite),?\s+(?:option|choice|letter)?\s*\(?[A-E]\)?\s+(?:is\s+(?:also|the\s+(?:more|most|best))|could\s+(?:also|be\s+correct)|might\s+(?:also|be)|works?\s+too|is\s+a\s+valid)/i;
  const contraM = q.explanation.match(CONTRADICTION_RE);
  if (contraM) {
    return { ok: false, gate: "explanation-multi-answer-implication",
      reason: `explanation implies multiple correct answers ("${contraM[0].slice(0, 50)}") — MCQ must support EXACTLY one answer` };
  }

  // 2026-05-25 ext — Stem quality gates (UARP §4.1 distractor-pedagogy supports).
  // Stem-vague: "Which is true?" / "What is the answer?" / "Which is correct?"
  // — no specific noun-phrase, generator was lazy.
  if (/^(?:which|what)\s+(?:is|are)\s+(?:true|correct|accurate|right|valid)\??$/i.test((q.questionText || "").trim())) {
    return { ok: false, gate: "stem-vague-no-topic",
      reason: 'stem has no specific subject ("Which is true?") — generator lazy' };
  }
  // Stem missing question mark when it's a question shape (Which/What/How/Why)
  if (/^(?:which|what|how|why|when|where|who|in\s+which|under\s+what)\b/i.test((q.questionText || "").trim())
      && !/[?]\s*$/.test((q.questionText || "").trim())) {
    return { ok: false, gate: "stem-missing-question-mark",
      reason: 'question-shape stem ("Which/What/How/…") missing terminal "?"' };
  }

  // 2026-05-25 ext — Options distractor-pedagogy supports.
  // Lazy negation distractors: ALL options start with same comparative word.
  // Narrowed 2026-05-25 — over-aggressive original version unapproved 2785 Qs
  // in lit/comp courses where "The author...", "A method...", "In the passage..."
  // are legitimate stems. Only flag CLOSED-VOCAB comparative words.
  const LAZY_PREFIX_WORDS = /^(increased|decreased|increasing|decreasing|positive|negative|higher|lower|greater|lesser|more|less|larger|smaller)$/i;
  const firstWords = opts
    .map((o) => o.replace(/^[A-E]\)\s*/, "").split(/\s+/)[0]?.toLowerCase() ?? "")
    .filter((w) => w.length > 2);
  const wordCounts = {};
  for (const w of firstWords) wordCounts[w] = (wordCounts[w] || 0) + 1;
  for (const [w, n] of Object.entries(wordCounts)) {
    // Only fire if ALL options share the comparative word, AND it's from the
    // closed-vocab list — generic "The"/"A"/"In" are valid in lit/comp Qs.
    if (n === opts.length && opts.length >= 4 && LAZY_PREFIX_WORDS.test(w)) {
      return { ok: false, gate: "options-lazy-shared-prefix-word",
        reason: `all ${n} options start with comparative "${w}" — lazy distractor pattern` };
    }
  }
  // Yes/No-style trap: any option is exactly "Yes" / "No" / "True" / "False" / "Maybe" — CB never uses
  for (const o of opts) {
    const body = o.replace(/^[A-E]\)\s*/, "").trim().toLowerCase();
    if (/^(yes|no|true|false|maybe|sometimes|always|never)\.?$/.test(body)) {
      return { ok: false, gate: "options-bare-yesno",
        reason: `option is bare "${body}" — CB style requires substantive distractors` };
    }
  }

  // 2026-05-25 — Render hazard: nested $ inside \frac{} (Lucas Q5 bug).
  // Pattern that mangles KaTeX: "\frac{$x^{2}$ + 1}{$y^{2}$ + 1}" — outer
  // math closes at first inner $, leaving the rest as raw text.
  const fracIdx = (q.questionText || "").indexOf("\\frac{");
  if (fracIdx >= 0) {
    let depth = 0, i = fracIdx + 6, inFrac = true;
    while (i < q.questionText.length && inFrac) {
      const ch = q.questionText[i];
      if (ch === "{") depth++;
      else if (ch === "}") { if (depth === 0) inFrac = false; else depth--; }
      else if (ch === "$") {
        return { ok: false, gate: "render-hazard-nested-frac",
          reason: 'nested "$" inside \\frac{} — closes outer math early; strip inner $ delimiters' };
      }
      i++;
    }
  }

  // 2026-05-24 — Tier-1 Explanation-Solution Independence Gate (ChatGPT v2 #5).
  // "X is correct because it simplifies correctly" — no pedagogy, just
  // restates the answer. Reject if the explanation is mostly just the
  // answer value + a tautology.
  // Heuristic: explanation body (after first sentence) must contain at
  // least one non-tautological reasoning marker.
  const REASONING_MARKERS = /\b(because|since|by|using|apply|applied|when|if|therefore|then|so that|substitute|substituting|let|where|note|recall|first|next|after|formula|theorem|property|rule|definition|identity|setting|solving|isolating|combining|distributing|factoring|expanding|multiplying|dividing|adding|subtracting|squaring|integrating|differentiating|evaluating|equation|expression|step)\b/i;
  const explAfterLead = expl.replace(/^[^.]+\./, "").trim();
  if (expl.length >= 40 && explAfterLead.length >= 15 && !REASONING_MARKERS.test(expl)) {
    return { ok: false, gate: "explanation-no-reasoning",
      reason: `explanation lacks reasoning markers (because/since/by/using/apply/etc.) — likely just restates the answer` };
  }

  // 2026-05-24 — Sprint A / UARP §3.3 — Negation gate.
  // When stem contains NOT/EXCEPT/LEAST/FALSE/INCORRECT, the correct answer is
  // the ONE that violates the assertion. The explanation must acknowledge the
  // negation (mention "not", "except", "false", "incorrect", "violates", "only one",
  // "exception", "does not", or restate the inverted logic). Otherwise the
  // generator likely justified the answer as if it were a positive question.
  const NEGATION_STEM_REGEX = /\b(?:which\s+(?:is|are|of\s+the\s+following|statement)\s+(?:is\s+|are\s+)?(?:not|false|incorrect)\b|except\b|least\s+likely\b|not\s+(?:true|correct|accurate|incorrect|false|wrong|associated|considered|an\s+example|a\s+characteristic|a\s+feature|typically|usually|generally)\b|\bNOT\b(?=\s+(?:true|correct|incorrect|false|considered|associated|typically|usually|a|an|the)))/i;
  const stem = q.questionText;
  const stemHasNegation = NEGATION_STEM_REGEX.test(stem);
  if (stemHasNegation) {
    // Double-negation in stem: "Which is NOT incorrect" — ambiguous, reject.
    const doubleNeg = /\bnot\b[^.?]{0,40}\b(?:not|never|incorrect|false|wrong|untrue|fails?\s+to)\b/i;
    if (doubleNeg.test(stem)) {
      return { ok: false, gate: "stem-double-negation",
        reason: `stem has double negation ("not ... not/incorrect/false") — ambiguous logic` };
    }
    // Explanation must acknowledge the inverted logic.
    const NEGATION_ACK = /\b(not|except|false|incorrect|exception|violates?|does\s+not|is\s+the\s+only|only\s+one|opposite|contradicts?|does\s+not\s+(?:apply|fit|match|belong|hold)|fails?\s+to|unlike|whereas\s+the\s+others)\b/i;
    if (!NEGATION_ACK.test(expl)) {
      return { ok: false, gate: "explanation-ignores-negation",
        reason: `stem has negation cue (NOT/EXCEPT/LEAST) but explanation never acknowledges the inversion — generator likely treated as positive question` };
    }
  }

  // 2026-05-24 — Sprint A / UARP §3.1 — Semantic-contract gate (numeric extremum).
  // When stem asks for smallest/largest/greatest/least/highest/lowest/max/min
  // AND every option parses to a single number, verify the stored correctAnswer
  // really IS the extremum. Catches "What is the largest? A) 5  B) 12  C) 3"
  // where generator picks A by mistake.
  const EXTREMUM_REGEX = /\b(smallest|largest|greatest|least|highest|lowest|maximum|minimum|biggest|max\b|min\b)\b/i;
  const extremumMatch = stem.match(EXTREMUM_REGEX);
  if (extremumMatch) {
    const word = extremumMatch[1].toLowerCase();
    const wantsMax = /^(largest|greatest|highest|maximum|biggest|max)/.test(word);
    // Parse each option's numeric content (strip the "A) " prefix and any leading $ or %)
    const optNums = opts.map((o) => {
      const stripped = o.replace(/^[A-E]\)\s*/, "").replace(/[\$%,\s]/g, "");
      const m = stripped.match(/^-?\d+(?:\.\d+)?$/);
      return m ? Number(stripped) : NaN;
    });
    const allNumeric = optNums.every((n) => Number.isFinite(n));
    if (allNumeric && new Set(optNums).size === optNums.length) {
      const correctIdx = q.correctAnswer.charCodeAt(0) - 65;
      const correctVal = optNums[correctIdx];
      const extremumVal = wantsMax ? Math.max(...optNums) : Math.min(...optNums);
      if (correctVal !== extremumVal) {
        return { ok: false, gate: "stem-extremum-mismatch",
          reason: `stem asks for "${word}" but correctAnswer (${correctVal}) is not the ${wantsMax ? "max" : "min"} of options [${optNums.join(", ")}] — should be ${extremumVal}` };
      }
    }
  }

  // 2026-05-24 — Sprint A / UARP §3.1 — Semantic-contract gate (trend direction).
  // When stem asks about "increase/decrease/rise/fall/grow/shrink", the explanation
  // must reference the direction (otherwise generator may have picked opposite).
  const TREND_STEM = /\b(increase|decrease|rise|fall|grow|shrink|expand|contract|gain|lose|appreciate|depreciate)s?\b/i;
  const trendMatch = stem.match(TREND_STEM);
  if (trendMatch) {
    // Explanation must contain SOME trend word (same or related)
    const TREND_ACK = /\b(increase|decrease|rise|ros[ei]|fall|fell|grow|grew|shrink|shrank|shrunk|expand|contract|gain|lost?|appreciat|depreciat|higher|lower|more|less|greater|smaller|up|down|positive|negative|inverse|direct|proportional)/i;
    if (!TREND_ACK.test(expl)) {
      return { ok: false, gate: "explanation-ignores-trend",
        reason: `stem asks about "${trendMatch[1]}" (trend/direction) but explanation never references direction words — likely answers wrong-direction` };
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
