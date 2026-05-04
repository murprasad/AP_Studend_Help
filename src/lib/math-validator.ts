/**
 * src/lib/math-validator.ts — deterministic numeric verification for
 * AP/SAT/ACT/CLEP/DSST math+science MCQs.
 *
 * Two layers:
 *
 * Layer 1 — Arithmetic-statement check
 *   Scan the explanation for explicit arithmetic ("X * Y = Z", "X+Y=Z",
 *   "X/Y=Z") and verify each stated equality with mathjs.evaluate().
 *   If any stated equality is arithmetically wrong, flag.
 *   Catches: explanations with miscomputed steps (the AP Calc Q1 case
 *   where the explanation said "f(3)…=27" but actual = 21).
 *
 * Layer 2 — Final-answer-matches-option check
 *   Already handled by findFinalNumberMismatch in audit-content-accuracy.
 *   This file adds the deeper Layer 1 check that the heuristic doesn't do.
 *
 * Why mathjs: pure JS, runs on CF Workers, no Python deps. Handles
 * arithmetic, variables, units (loosely), basic calculus integration.
 *
 * Course coverage (course-agnostic by design):
 *   - AP: Calc AB/BC, Physics 1/2/C, Stats, Chem (numeric subset),
 *     Bio (rare), Macro/Micro (rare numeric)
 *   - SAT Math, ACT Math
 *   - CLEP: College Algebra, Calculus, Pre-calc, Math, Natural Sci, Chem
 *   - DSST: math/science subset
 *
 * Non-numeric questions (history, English, etc.) are skipped — Layer 1
 * doesn't trigger if explanation has no arithmetic statements.
 */

import { evaluate, all, create } from "mathjs";

// Configure mathjs in restricted mode — disable mutation surfaces that
// could be exploited if our explanations somehow contained adversarial
// math expressions (defense in depth). evaluate/parse remain enabled
// since they are the entry points we actually call; only the
// runtime-extension surfaces are stubbed.
const math = create(all, {
  number: "number",
  precision: 10,
});
math.import({
  "import": () => { throw new Error("disabled"); },
  "createUnit": () => { throw new Error("disabled"); },
}, { override: true });

/** Tolerance for floating-point comparison. 1% relative or 1e-3 absolute. */
function approxEqual(a: number, b: number): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  if (a === b) return true;
  const absDiff = Math.abs(a - b);
  if (absDiff < 1e-3) return true;
  const rel = absDiff / Math.max(Math.abs(a), Math.abs(b));
  return rel < 0.01;
}

/**
 * Try to evaluate an arithmetic expression like "3*9 - 2*3" with mathjs.
 * Returns null on any error (parse failure, unsafe expression, etc.) —
 * caller treats null as "unable to verify, skip".
 */
function safeEval(expr: string): number | null {
  try {
    // Strip whitespace, normalize
    const cleaned = expr
      .replace(/\s+/g, "")
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-")  // unicode minus
      .replace(/π/g, "pi");
    if (!cleaned) return null;
    // Quick sanity: must contain at least one operator or digit
    if (!/[\d\.]/.test(cleaned)) return null;
    // mathjs.evaluate is safe-ish for arithmetic; reject if expression
    // contains anything that could be a function call we don't want.
    if (/[a-zA-Z_]/.test(cleaned) && !/^pi|^e\b|^sqrt|^abs/.test(cleaned)) {
      // contains identifier characters but isn't a known constant —
      // could be a variable. Skip to be safe.
      return null;
    }
    const result = math.evaluate(cleaned);
    if (typeof result === "number" && Number.isFinite(result)) return result;
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract arithmetic equality statements from the explanation.
 * Patterns matched:
 *   - "3 * 9 = 27"
 *   - "3*9 - 2*3 = 21"
 *   - "(21 - 1) / 2 = 10"
 *   - "0.05 * 1000 * 9.8 = 490"
 * Returns array of { stated: number, computed: number, expr: string }.
 */
export function extractArithmeticStatements(explanation: string): Array<{
  expr: string;
  stated: number;
  computed: number;
  isCorrect: boolean;
}> {
  if (!explanation) return [];
  const results: Array<{ expr: string; stated: number; computed: number; isCorrect: boolean }> = [];

  // Match "expression = number" patterns. The expression must start with
  // a digit or paren-group (not a letter), contain at least one operator
  // joining numeric atoms, and the stated number must NOT be followed by
  // another operator (which would indicate a chain like A = B = C — only
  // the final equality in such a chain is checked, to avoid false flags
  // on intermediate notational rewrites).
  //
  //   atom        := digit-sequence | "(" no-paren-content ")"
  //   expression  := atom (op atom){1,10}
  //   stated      := signed-decimal NOT followed by another operator
  //
  // Bounded paren content ({0,50}) and operator-chain repetition ({1,10})
  // prevent pathological backtracking.
  const re = /(?<=^|[\s(])((?:\d+(?:\.\d+)?|\([^()]{0,50}\))(?:\s*[+\-*/×÷^]\s*(?:\d+(?:\.\d+)?|\([^()]{0,50}\))){1,10})\s*=\s*(-?\d+(?:\.\d+)?)(?!\s*[+\-*/×÷^])\b/g;

  // Array.from() instead of for..of on the iterator — works with any TS
  // target (matchAll iterator requires ES2015+ downlevelIteration).
  const matches = Array.from(explanation.matchAll(re));
  for (const match of matches) {
    const exprRaw = match[1].trim();
    const statedRaw = match[2];
    const stated = parseFloat(statedRaw);
    if (!Number.isFinite(stated)) continue;
    const computed = safeEval(exprRaw);
    if (computed === null) continue;
    results.push({
      expr: exprRaw,
      stated,
      computed,
      isCorrect: approxEqual(stated, computed),
    });
  }
  return results;
}

/**
 * Top-level validator entry. Checks an MCQ's explanation for arithmetic
 * inconsistencies. Returns null if all stated computations are correct
 * (or there are none to verify); returns an error string describing the
 * first mismatch otherwise.
 *
 * Use at write-time in validateQuestion + at audit-time in
 * audit-content-accuracy.mjs.
 */
export function validateExplanationMath(explanation: string | null | undefined): string | null {
  if (!explanation) return null;
  const stmts = extractArithmeticStatements(explanation);
  if (stmts.length === 0) return null; // not a numeric explanation, nothing to check
  const wrong = stmts.find((s) => !s.isCorrect);
  if (wrong) {
    return `Explanation arithmetic error: "${wrong.expr.slice(0, 50)} = ${wrong.stated}" but actual ${wrong.computed.toFixed(4)}`;
  }
  return null;
}

/**
 * Cross-check the explanation's final numeric answer against the option
 * indexed by `correctAnswer`. Returns null if consistent; error string
 * otherwise. Complements findFinalNumberMismatch in
 * audit-content-accuracy.mjs but reusable in TS code.
 */
export function validateAnswerNumericMatch(
  options: string[],
  correctAnswer: string,
  explanation: string | null | undefined,
): string | null {
  if (!explanation || !options?.length) return null;
  const ca = String(correctAnswer ?? "").trim().toUpperCase();
  if (!/^[A-E]$/.test(ca)) return null;
  const idx = ca.charCodeAt(0) - 65;
  if (idx >= options.length) return null;
  const correctOpt = String(options[idx] ?? "");
  const correctOptNums = correctOpt.match(/-?\d+(?:\.\d+)?/g);
  if (!correctOptNums?.length) return null;

  // Find the LAST number in the explanation. If it doesn't match the
  // correct option's number(s), check if it matches a DIFFERENT option.
  const explNums = explanation.match(/-?\d+(?:\.\d+)?/g);
  if (!explNums?.length) return null;
  const lastNum = explNums[explNums.length - 1];
  const lastNumValue = parseFloat(lastNum);
  if (!Number.isFinite(lastNumValue)) return null;

  // Match against correct option
  const correctNumValues = correctOptNums.map((n) => parseFloat(n)).filter(Number.isFinite);
  if (correctNumValues.some((v) => approxEqual(v, lastNumValue))) return null;

  // Mismatch — does it match ANOTHER option? If so, the stored
  // correctAnswer is likely wrong.
  for (let i = 0; i < options.length; i++) {
    if (i === idx) continue;
    const optNums = String(options[i] ?? "").match(/-?\d+(?:\.\d+)?/g);
    if (!optNums) continue;
    if (optNums.map((n) => parseFloat(n)).some((v) => approxEqual(v, lastNumValue))) {
      const matchLetter = String.fromCharCode(65 + i);
      return `Explanation arrives at ${lastNum}, which matches option ${matchLetter} (not stored ${ca}=${correctOptNums.join(",")})`;
    }
  }
  // Otherwise, the explanation's final number matches NO option — the
  // question is internally broken regardless of which letter is stored.
  return `Explanation arrives at ${lastNum}, but no option contains that value (options have: ${options.map((o, i) => String.fromCharCode(65 + i) + "=" + o).join(", ").slice(0, 200)})`;
}
