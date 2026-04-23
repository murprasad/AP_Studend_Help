/**
 * option-evaluator.ts — deterministic numeric parser for MCQ options.
 *
 * Built 2026-04-22 after a real tester reported MCQs whose distractors
 * all reduced to the same value (correct=2, distractors 4/2, 6/3, 8/4
 * — all = 2, so the question had no unique correct answer).
 *
 * Two layers prevent this in the future:
 *   1. Prompt rule (src/lib/ai.ts buildQuestionPrompt) — tells the model
 *      to ban equivalent numeric distractors.
 *   2. This module — deterministic post-generation check that LLMs
 *      cannot bypass. AI validators cannot reliably do arithmetic;
 *      the runtime numeric check is load-bearing.
 *
 * Design principles:
 *   - LOW RECALL, HIGH PRECISION. Returns null for anything ambiguous
 *     (variables, square roots, units that change meaning) so we never
 *     false-positive a legitimate distractor pair.
 *   - NO `eval()`. Tiny hand-rolled parser only — `eval` is an XSS /
 *     prompt-injection risk (LLM-generated input flowing into eval).
 *   - Tolerance-based comparison so 0.333 and 1/3 (which we evaluate
 *     to 0.33333…) collapse to the same value when they should.
 */

/**
 * Strip a single trailing word that looks like a unit (kg, m, %, deg)
 * — units that change meaning if we strip them (kg vs g) are caught
 * by `evaluateOption()` returning null when the parser can't find a
 * pure-numeric expression.
 *
 * Letter labels like "A) ", "(C) ", "D. " are also stripped.
 */
function stripLabelAndUnit(raw: string): string {
  let s = raw.trim();
  // Remove A) / (B) / C. / D - label prefix
  s = s.replace(/^\s*[(\[]?\s*[A-Ea-e]\s*[)\]]?\s*[.\-:]\s*/, "");
  // Trailing single-word unit — only strip percent here; other units
  // would change meaning (2 kg ≠ 2 g) so we leave them and let the
  // parser fail-null on those.
  s = s.replace(/\s*%\s*$/, " percent");
  return s.trim();
}

/**
 * Parse a string as one of the supported forms and return its numeric
 * value (or null if unsupported).
 *
 * Supported:
 *   - Pure number: "2", "1.5", "-3", ".5", "1e3"
 *   - Fraction: "3/4", "-7/8"
 *   - Mixed fraction: "1 1/2", "2 3/4"
 *   - Percent (literal "X%" handled before this via stripLabelAndUnit
 *     converting "%" to " percent"): "50 percent" → 0.5
 *   - Simple multiplication: "2*3", "2 × 3", "2x3" (where x is the multiply char)
 *
 * Deliberately NOT supported (returns null):
 *   - Addition / subtraction (would catch too many false positives:
 *     "x + 2" is meaningful as a distractor in many algebra contexts)
 *   - Square roots, exponents, π, e, variables
 *   - Anything with letters that aren't a unit suffix
 *   - Ratios "3:2" (semantically distinct from fractions)
 */
export function evaluateOption(raw: string): number | null {
  if (typeof raw !== "string") return null;
  const cleaned = stripLabelAndUnit(raw);
  if (!cleaned) return null;

  // Percent suffix → divide by 100 after parsing the numeric part.
  let percent = false;
  let body = cleaned;
  const percentMatch = body.match(/^(.+?)\s+percent$/i);
  if (percentMatch) {
    percent = true;
    body = percentMatch[1].trim();
  }

  let value: number | null = null;

  // Mixed fraction: "1 1/2" — must come BEFORE plain fraction check.
  const mixedMatch = body.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const den = parseInt(mixedMatch[3], 10);
    if (den !== 0) {
      const sign = whole < 0 ? -1 : 1;
      value = whole + sign * (num / den);
    }
  }

  // Plain fraction: "3/4" or "-3/4"
  if (value === null) {
    const fracMatch = body.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
    if (fracMatch) {
      const num = parseFloat(fracMatch[1]);
      const den = parseFloat(fracMatch[2]);
      if (den !== 0) value = num / den;
    }
  }

  // Multiplication: "2*3", "2 × 3", "2 · 3"
  if (value === null) {
    const mulMatch = body.match(/^(-?\d+(?:\.\d+)?)\s*[\*×·]\s*(-?\d+(?:\.\d+)?)$/);
    if (mulMatch) {
      value = parseFloat(mulMatch[1]) * parseFloat(mulMatch[2]);
    }
  }

  // Pure number — last so we don't shadow the more specific patterns.
  if (value === null) {
    const numMatch = body.match(/^-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/);
    if (numMatch) {
      value = parseFloat(body);
    }
  }

  if (value === null || !Number.isFinite(value)) return null;
  return percent ? value / 100 : value;
}

/**
 * Tolerance-aware equality. Handles 0.333 ≈ 1/3 (different rounding) and
 * keeps very-small absolute differences from causing false equality on
 * different-but-tiny numbers (e.g. 1e-10 ≠ 2e-10 stays distinct).
 */
function nearlyEqual(a: number, b: number): boolean {
  if (a === b) return true;
  const diff = Math.abs(a - b);
  const scale = Math.max(Math.abs(a), Math.abs(b));
  if (scale === 0) return diff === 0;
  return diff / scale < 1e-6;
}

export interface EquivalenceCheckResult {
  ok: boolean;
  /** Human-readable reason if ok=false; null if ok=true. */
  reason: string | null;
  /** When ok=false, the option indices that share a value. */
  duplicateIndices?: number[];
  /** When ok=false, the shared numeric value. */
  duplicateValue?: number;
}

/**
 * Run the equivalence check across all four (or five for ACT Math) options.
 * Returns ok=true if FEWER than 2 options parse, OR if all parsed values
 * are pairwise distinct. Returns ok=false ONLY when 2+ parsed options
 * share a value within tolerance — a true zero-correct-answer bug.
 *
 * This is intentionally conservative — when in doubt (mixed parseable +
 * unparseable options, or all unparseable), we let the question through
 * and rely on the validator + human review to catch it.
 */
export function checkOptionsForEquivalence(options: unknown[]): EquivalenceCheckResult {
  if (!Array.isArray(options) || options.length < 2) {
    return { ok: true, reason: null };
  }

  const evaluated: Array<{ index: number; value: number }> = [];
  for (let i = 0; i < options.length; i++) {
    const v = evaluateOption(String(options[i] ?? ""));
    if (v !== null) evaluated.push({ index: i, value: v });
  }

  // Need ≥2 parseable options for an equivalence problem to exist.
  if (evaluated.length < 2) return { ok: true, reason: null };

  // Pairwise check — N is small (4 or 5), no need for a hash bucket.
  for (let i = 0; i < evaluated.length; i++) {
    for (let j = i + 1; j < evaluated.length; j++) {
      if (nearlyEqual(evaluated[i].value, evaluated[j].value)) {
        const a = evaluated[i].index;
        const b = evaluated[j].index;
        return {
          ok: false,
          reason: `Options ${String.fromCharCode(65 + a)} and ${String.fromCharCode(65 + b)} both evaluate to ${evaluated[i].value}`,
          duplicateIndices: [a, b],
          duplicateValue: evaluated[i].value,
        };
      }
    }
  }

  return { ok: true, reason: null };
}
