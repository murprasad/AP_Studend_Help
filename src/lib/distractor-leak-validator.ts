/**
 * src/lib/distractor-leak-validator.ts — deterministic gates that catch
 * the two distractor-leak failure modes from the 2026-05-01 CB-equivalence
 * audit (3/8 of audited questions exhibited at least one of these).
 *
 * MODE 1 — self-labeling text inside an option
 *   The generator wrote the *critique* of a wrong answer into the option
 *   itself, so a student who can't solve the question can pick by reading
 *   the distractor. Examples seen in the audit:
 *     - "Esteem needs, confusing priority of basic needs"
 *     - "Self-actualization needs, mistakenly assuming personal growth
 *        is the immediate priority"
 *     - "MVT does not apply" (telling the student the answer)
 *     - "avg accel incorrect"
 *   College Board MCQ distractors are written as if each were a confident
 *   answer — never with phrases like "incorrect because" or "mistakenly".
 *
 * MODE 2 — length-variance tell ("longest option = right answer")
 *   When the correct option is materially longer than the distractors,
 *   test-takers learn to pick the longest. CB writes options of similar
 *   length on purpose; this is documented in the SAT/ACT test-taking
 *   literature as the #1 LSAT/SAT tell to avoid.
 *   We flag if (max length − min length) / mean length > 0.5 AND the
 *   correct option is the longest.
 *
 * Both gates are pure functions; <1ms per question; no LLM call. They
 * run in stage 4 (RECOMPUTE) of the pipeline per the design doc.
 */

const LEAK_PHRASES = [
  // explicit critique language — never used in real CB distractors
  /\bmistakenly\s+\w+/i,
  /\bincorrect(ly)?\s+because\b/i,
  /\bwrong(ly)?\s+because\b/i,
  /\bconfusing\s+\w+\s+(with|and|of)\b/i,
  /\bdoes\s+not\s+apply\b/i,
  /\bnot\s+correct\s+because\b/i,
  /\bfailing\s+to\s+(account|consider|recognize)\b/i,
  /\b(misinterpret|misunderstand|misapply|miscalculat)\w*/i,
  /\b(this\s+is\s+)?wrong\s*(answer|because)\b/i,
  /\bcommon\s+(mistake|error|misconception)\b/i,
  // adverbs that critique a method — CB never writes these in a distractor
  /\bincorrectly\b/i,
  /\bwrongly\b/i,
  // hedging language — CB MCQs commit, distractors don't hedge in their text
  /\bmight\s+seem\s+(right|correct|true)\s+but\b/i,
  /\bappears?\s+(correct|right)\s+but\b/i,
];

const LEAK_FRAGMENT_PATTERNS = [
  // partial-sentence fragments that critique rather than answer.
  // Examples from the audit:
  //   "Esteem needs, confusing priority of basic needs" ← second clause
  //   "(Misapplied integration of velocity)"
  //   "(Wrong: forgot to convert units)"
  /\(\s*(wrong|incorrect|misapplied|misread|misinterpret)/i,
  /,\s+(confusing|mistakenly|incorrectly|wrongly|failing to)\b/i,
];

/**
 * Check a single option for self-labeling leak phrases.
 * Returns the matching phrase string if leak found, null otherwise.
 */
export function findLeakPhrase(optionText: string): string | null {
  if (!optionText) return null;
  for (const re of LEAK_PHRASES) {
    const m = optionText.match(re);
    if (m) return m[0];
  }
  for (const re of LEAK_FRAGMENT_PATTERNS) {
    const m = optionText.match(re);
    if (m) return m[0];
  }
  return null;
}

/**
 * Top-level validator. Checks every option for leak phrases. Returns
 * null if all options are leak-free, error string describing the first
 * offending option otherwise.
 */
export function validateNoDistractorLeaks(options: string[]): string | null {
  if (!Array.isArray(options) || options.length === 0) return null;
  for (let i = 0; i < options.length; i++) {
    const phrase = findLeakPhrase(options[i] ?? "");
    if (phrase) {
      const letter = String.fromCharCode(65 + i);
      return `Option ${letter} contains distractor-leak phrase "${phrase}" — distractors must read as confident answers, never critique themselves`;
    }
  }
  return null;
}

/**
 * Strip any leading letter prefix ("A) ", "(B) ", "C. ") so length
 * comparison reflects content, not labeling artifacts. Mirrors
 * cleanOptionText in src/lib/options.ts but inlined to avoid circular
 * import overhead in the hot path.
 */
function contentLength(opt: string): number {
  if (!opt) return 0;
  return opt.replace(/^\s*\(?[A-E]\)?[.\s]+/i, "").trim().length;
}

/**
 * Length-variance check. Flags if the spread between longest and
 * shortest option is large AND the correct option is the longest.
 * Returns null if the question passes; error string if it fails.
 *
 * Threshold tuned per CB style guides + audit data:
 *   relativeSpread = (max − min) / mean
 *   FAIL if relativeSpread > 0.5 AND correct option is the longest
 *   AND mean length > 20 chars (very short options like "5 m/s" are
 *   exempt — physics units make uniform length impossible).
 */
export function validateOptionLengthVariance(
  options: string[],
  correctAnswer: string,
): string | null {
  if (!Array.isArray(options) || options.length < 2) return null;
  const ca = String(correctAnswer ?? "").trim().toUpperCase();
  if (!/^[A-E]$/.test(ca)) return null;
  const correctIdx = ca.charCodeAt(0) - 65;
  if (correctIdx < 0 || correctIdx >= options.length) return null;

  const lengths = options.map(contentLength);
  const max = Math.max(...lengths);
  const min = Math.min(...lengths);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  if (mean < 20) return null; // short numeric/single-word options exempt

  const relativeSpread = (max - min) / mean;
  if (relativeSpread <= 0.5) return null; // within tolerance

  const longestIdx = lengths.indexOf(max);
  if (longestIdx !== correctIdx) return null; // long option exists but isn't correct — fine

  return `Length-variance tell: correct option ${ca} is ${max} chars, distractors avg ${Math.round(
    (lengths.reduce((a, b) => a + b, 0) - max) / (lengths.length - 1),
  )} chars (relative spread ${relativeSpread.toFixed(2)}). CB MCQs keep distractor lengths within ~30% of correct.`;
}

/**
 * Combined entry point — run both leak gates. Returns null on pass,
 * error string on first failure.
 */
export function validateDistractorIntegrity(
  options: string[],
  correctAnswer: string,
): string | null {
  return (
    validateNoDistractorLeaks(options) ??
    validateOptionLengthVariance(options, correctAnswer)
  );
}
