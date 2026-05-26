/**
 * Math recompute validator — 2026-05-18.
 *
 * Deterministic recompute using mathjs. For CLEP College Algebra and similar
 * math-heavy courses, parses the stem for a mathematical statement, computes
 * the correct answer, compares to the stored option's text. PASS / FAIL /
 * SKIP (when the Q isn't recomputable — application/conceptual problems).
 *
 * Catches the bug class LLM-judges miss: stored letter pointing to an option
 * whose value disagrees with the math (sign-flipped roots, swapped numerator/
 * denominator, off-by-one).
 *
 * SCOPE (Phase 1 — Gregory's CLEP_COLLEGE_ALGEBRA):
 *  - Quadratic equations: "Solve ax² + bx + c = 0" → roots
 *  - Linear equations: "Solve ax + b = c" → single root
 *  - Function evaluation: "If f(x) = ..., find f(N)" → numerical value
 *  - Polynomial factoring: "Factor x² + bx + c" → root set
 *
 * Returns SKIP for anything we can't parse (~70% of Qs). Phase 2 adds more
 * patterns.
 */

import { evaluate, parse, simplify } from "mathjs";

export interface MathRecomputeResult {
  ok: boolean;
  status: "pass" | "fail" | "skip";
  reason?: string;
  computed?: number | number[] | string;
  storedClaim?: string;
}

/**
 * Extract a list of x-values from option text like "x = 3, x = -8" or
 * "x = 1/2, x = 2" or just "5, -3" or "{-8, 3}". Returns null if not parseable.
 */
function parseRootList(text: string): number[] | null {
  const cleaned = text
    .replace(/^[A-E][\)\.]\s*/, "")  // strip letter prefix
    .replace(/\bx\s*=\s*/gi, "")     // strip "x = "
    .replace(/[{}\\]/g, "")
    .trim();
  // Split on comma or "or" or " and "
  const parts = cleaned.split(/\s*(?:,|\bor\b|\band\b)\s*/i).map(p => p.trim()).filter(Boolean);
  if (parts.length === 0 || parts.length > 5) return null;
  const roots: number[] = [];
  for (const p of parts) {
    // Handle fractions like "1/2" or "-1/2"
    const fracMatch = p.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
    if (fracMatch) {
      const num = parseFloat(fracMatch[1]);
      const den = parseFloat(fracMatch[2]);
      if (den === 0) return null;
      roots.push(num / den);
      continue;
    }
    const n = parseFloat(p);
    if (Number.isFinite(n)) {
      roots.push(n);
      continue;
    }
    return null; // unparseable
  }
  return roots;
}

/**
 * Extract quadratic coefficients from "ax² + bx + c = 0" or "ax^2 + bx + c = 0".
 * Returns null if not parseable.
 */
function extractQuadratic(stem: string): { a: number; b: number; c: number } | null {
  // Normalize x² → x^2, remove extra whitespace
  const s = stem.replace(/²/g, "^2").replace(/\s+/g, " ");
  // Match "a*x^2 + b*x + c = 0" with various forms
  const m = s.match(/(-?\d*)\s*x\s*\^\s*2\s*([-+]\s*\d*)\s*x\s*([-+]\s*\d+)\s*=\s*0/i);
  if (!m) return null;
  const aStr = m[1].trim();
  const a = aStr === "" || aStr === "+" ? 1 : aStr === "-" ? -1 : parseFloat(aStr);
  const bStr = m[2].replace(/\s+/g, "");
  const b = bStr === "+" ? 1 : bStr === "-" ? -1 : parseFloat(bStr);
  const c = parseFloat(m[3].replace(/\s+/g, ""));
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) return null;
  return { a, b, c };
}

/**
 * Solve ax² + bx + c = 0 using quadratic formula. Returns roots sorted ascending.
 */
function solveQuadratic(a: number, b: number, c: number): number[] | null {
  const disc = b * b - 4 * a * c;
  if (disc < 0) return []; // no real roots
  const sqrtD = Math.sqrt(disc);
  const r1 = (-b + sqrtD) / (2 * a);
  const r2 = (-b - sqrtD) / (2 * a);
  return [r1, r2].sort((x, y) => x - y);
}

/**
 * Approximate-equals helper for floats. Tolerates 1e-6 difference.
 */
function approxEq(a: number, b: number, tol = 1e-6): boolean {
  return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
}

/**
 * Same-set check for two number arrays (order-independent).
 */
function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const aSorted = [...a].sort((x, y) => x - y);
  const bSorted = [...b].sort((x, y) => x - y);
  for (let i = 0; i < aSorted.length; i++) {
    if (!approxEq(aSorted[i], bSorted[i])) return false;
  }
  return true;
}

/**
 * Main entry point. Tries each recompute pattern; SKIP if none match.
 */
export function validateMathRecompute(
  questionText: string,
  options: string[],
  correctAnswerLetter: string,
): MathRecomputeResult {
  const correctIdx = correctAnswerLetter.charCodeAt(0) - 65;
  if (correctIdx < 0 || correctIdx >= options.length) {
    return { ok: false, status: "fail", reason: "invalid-letter-index" };
  }
  const correctOptText = String(options[correctIdx]);

  // Pattern 1: Quadratic equation solve
  if (/solve.*x\s*[²^]?2|quadratic.*=\s*0|factor.*x\s*[²^]?2/i.test(questionText)) {
    const quad = extractQuadratic(questionText);
    if (quad) {
      // 2026-05-18: skip discriminant-analysis Qs (they ask about NATURE of
      // roots, not for the roots themselves — answers like "two complex roots"
      // are correct but don't match a number list). Check question text intent.
      const isDiscriminantQ = /nature\s+of\s+(the\s+)?roots|discriminant|how\s+many\s+(real\s+)?(roots|solutions)/i.test(questionText);
      if (isDiscriminantQ) {
        return { ok: true, status: "skip", reason: "discriminant-analysis-Q-not-recomputable" };
      }
      const trueRoots = solveQuadratic(quad.a, quad.b, quad.c);
      if (trueRoots !== null && trueRoots.length > 0) {
        // Find which option matches the computed roots
        let matchingIdx = -1;
        for (let i = 0; i < options.length; i++) {
          const claimed = parseRootList(options[i]);
          if (claimed && sameSet(claimed, trueRoots)) {
            matchingIdx = i;
            break;
          }
        }
        if (matchingIdx === -1) {
          return {
            ok: false,
            status: "fail",
            reason: `computed roots [${trueRoots.join(",")}] don't match ANY option`,
            computed: trueRoots,
            storedClaim: correctOptText,
          };
        }
        if (matchingIdx !== correctIdx) {
          return {
            ok: false,
            status: "fail",
            reason: `computed roots [${trueRoots.join(",")}] match option ${String.fromCharCode(65 + matchingIdx)} but stored letter is ${correctAnswerLetter}`,
            computed: trueRoots,
            storedClaim: correctOptText,
          };
        }
        return { ok: true, status: "pass", computed: trueRoots };
      }
      // Empty roots (negative discriminant) without discriminant-Q context: skip
      // (can't deterministically pick "two complex roots" / "no real solutions" etc.)
      if (trueRoots !== null && trueRoots.length === 0) {
        return { ok: true, status: "skip", reason: "negative-discriminant-no-real-roots" };
      }
    }
  }

  // Pattern 2: Linear equation solve (e.g., "Solve 3x + 5 = 14" or "3(x-4)+2x = 5x-12")
  const linearMatch = questionText.match(/solve\s+(.+?)\s+for\s+x/i) || questionText.match(/solve\s+(.+?[=]\s*[\d\-+*/()xX. ]+)/i);
  if (linearMatch && !questionText.match(/x\s*[²^]?2/)) {
    const eqText = linearMatch[1].replace(/\s+/g, "");
    // Look for the form "expr1 = expr2"
    const sides = eqText.split("=");
    if (sides.length === 2) {
      try {
        // Subtract right side from left, solve = 0
        // Use mathjs to substitute candidate option values and check
        for (let i = 0; i < options.length; i++) {
          const candidateText = parseRootList(options[i]);
          if (!candidateText || candidateText.length !== 1) continue;
          const xVal = candidateText[0];
          try {
            const lhs = evaluate(sides[0].replace(/[xX]/g, `(${xVal})`));
            const rhs = evaluate(sides[1].replace(/[xX]/g, `(${xVal})`));
            if (approxEq(Number(lhs), Number(rhs))) {
              if (i === correctIdx) return { ok: true, status: "pass", computed: xVal };
              return {
                ok: false,
                status: "fail",
                reason: `x=${xVal} satisfies the equation, matches option ${String.fromCharCode(65 + i)} but stored letter is ${correctAnswerLetter}`,
                computed: xVal,
                storedClaim: correctOptText,
              };
            }
          } catch { /* skip non-numeric candidate */ }
        }
        // None matched — could be off-pattern; skip rather than false-positive
      } catch { /* parse failed */ }
    }
  }

  // Pattern 3: Function evaluation — "If f(x) = ..., find f(N)" or "What is f(N)?"
  // Common in Units 3-5. Extract f(x) definition + substitution value, compute.
  {
    const fxDefMatch = questionText.match(/f\s*\(\s*x\s*\)\s*=\s*([^.,?!]+?)(?:[,.]|find|what|determine|evaluate|compute|\?|$)/i);
    const fxCallMatch = questionText.match(/f\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)/);
    if (fxDefMatch && fxCallMatch) {
      const fxBody = fxDefMatch[1].trim()
        .replace(/\^/g, "^")
        .replace(/²/g, "^2")
        .replace(/³/g, "^3")
        .replace(/×/g, "*")
        .replace(/÷/g, "/");
      const xVal = parseFloat(fxCallMatch[1]);
      if (Number.isFinite(xVal)) {
        try {
          const computed = Number(evaluate(fxBody.replace(/x/g, `(${xVal})`)));
          if (Number.isFinite(computed)) {
            // Find which option matches
            for (let i = 0; i < options.length; i++) {
              const claimedList = parseRootList(options[i]);
              if (claimedList && claimedList.length === 1 && approxEq(claimedList[0], computed, 1e-4)) {
                if (i === correctIdx) return { ok: true, status: "pass", computed };
                return {
                  ok: false,
                  status: "fail",
                  reason: `f(${xVal}) = ${computed} matches option ${String.fromCharCode(65 + i)} but stored letter is ${correctAnswerLetter}`,
                  computed,
                  storedClaim: correctOptText,
                };
              }
            }
            // None match — likely complex output (polynomial/expression form), skip
          }
        } catch { /* not numerically computable */ }
      }
    }
  }

  // Pattern 4: Exponential model — "P(t) = a*b^t" or "P(t) = a*e^(kt)" with "after N years/hours"
  {
    const expMatch = questionText.match(/[A-Z]\s*\(\s*t\s*\)\s*=\s*([0-9.]+)\s*[*·]?\s*\(?\s*([0-9.]+|e)\s*\)?\s*\^?\s*\(?\s*(-?[0-9.]*)\s*t\s*\)?/);
    const tValMatch = questionText.match(/after\s+(\d+)\s+(?:years|hours|seconds|minutes|days)/i);
    if (expMatch && tValMatch) {
      const a = parseFloat(expMatch[1]);
      const baseStr = expMatch[2];
      const b = baseStr === "e" ? Math.E : parseFloat(baseStr);
      const k = expMatch[3] === "" || expMatch[3] === "-" ? 1 : parseFloat(expMatch[3]);
      const t = parseFloat(tValMatch[1]);
      if (Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(t)) {
        const computed = a * Math.pow(b, k * t);
        // Find which option matches (within 5% tolerance for exponentials)
        for (let i = 0; i < options.length; i++) {
          const claimedList = parseRootList(options[i]);
          if (claimedList && claimedList.length === 1) {
            const claimed = claimedList[0];
            if (Math.abs(claimed - computed) / Math.max(1, Math.abs(computed)) < 0.05) {
              if (i === correctIdx) return { ok: true, status: "pass", computed };
              return {
                ok: false,
                status: "fail",
                reason: `exponential P(${t}) = ${computed.toFixed(2)} matches option ${String.fromCharCode(65 + i)} but stored letter is ${correctAnswerLetter}`,
                computed,
                storedClaim: correctOptText,
              };
            }
          }
        }
      }
    }
  }

  // Pattern 5: Simple arithmetic / order of operations — "Evaluate <expr>"
  {
    const evalMatch = questionText.match(/(?:evaluate|simplify|compute|calculate)\s+(?:the\s+expression\s+)?(.+?)(?:[.?!]|$)/i);
    if (evalMatch) {
      // Try mathjs evaluate on the extracted expression
      const exprText = evalMatch[1]
        .replace(/²/g, "^2").replace(/³/g, "^3")
        .replace(/×/g, "*").replace(/÷/g, "/")
        .replace(/\s+/g, "");
      try {
        const computed = Number(evaluate(exprText));
        if (Number.isFinite(computed)) {
          for (let i = 0; i < options.length; i++) {
            const claimedList = parseRootList(options[i]);
            if (claimedList && claimedList.length === 1 && approxEq(claimedList[0], computed, 1e-4)) {
              if (i === correctIdx) return { ok: true, status: "pass", computed };
              return {
                ok: false,
                status: "fail",
                reason: `evaluate(${exprText}) = ${computed} matches option ${String.fromCharCode(65 + i)} but stored letter is ${correctAnswerLetter}`,
                computed,
                storedClaim: correctOptText,
              };
            }
          }
        }
      } catch { /* not a numeric expr (involves variables) */ }
    }
  }

  return { ok: true, status: "skip", reason: "no-recompute-pattern-matched" };
}
