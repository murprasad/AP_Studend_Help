import { describe, it, expect } from "vitest";
import { sanitizeFlashcardExplanation } from "../../src/lib/markdown-helpers";

/**
 * Regression guard for B8 (2026-04-24).
 *
 * Real bug: a flashcard for AP Physics 1 wave superposition showed:
 *   Why: "A is correct. The principle of superposition states...
 *         B is wrong (trap: students may add the absolute values...).
 *         C is wrong because...
 *         D is wrong (trap: ...)."
 *
 * Flashcards have front/back only — no A/B/C/D options — so the letter
 * references are nonsensical. `sanitizeFlashcardExplanation` strips them
 * while preserving the teaching prose.
 */

describe("sanitizeFlashcardExplanation", () => {
  it("strips leading 'A is correct.' marker", () => {
    const input = "A is correct. The principle of superposition states that...";
    const out = sanitizeFlashcardExplanation(input);
    expect(out).toBe("The principle of superposition states that...");
  });

  it("strips 'B is wrong (...)' inline sentences", () => {
    const input =
      "A is correct. Adding +6 and −4 gives +2 cm. B is wrong (trap: absolute values). The waves have opposite signs.";
    const out = sanitizeFlashcardExplanation(input);
    expect(out).not.toContain("B is wrong");
    expect(out).toContain("Adding +6 and −4 gives +2 cm.");
    expect(out).toContain("The waves have opposite signs.");
  });

  it("strips all four A/B/C/D sentences — the real 2026-04-24 case", () => {
    const input =
      "A is correct. The principle of superposition states that when two waves overlap, the resultant displacement at any point is the algebraic sum of the individual displacements. Adding the two amplitudes: (+6 cm) + (−4 cm) = +2 cm. B is wrong (trap: students may add the absolute values, 6 + 4 = 10). C is wrong because the student may have subtracted in the wrong order. D is wrong (trap: students may incorrectly assume any combination produces complete cancellation).";
    const out = sanitizeFlashcardExplanation(input);
    expect(out).not.toMatch(/^[A-D]\s+is\s+correct/i);
    expect(out).not.toMatch(/\b[A-D]\s+is\s+wrong/i);
    expect(out).not.toMatch(/\b[A-D]\s+is\s+incorrect/i);
    // Core teaching survives
    expect(out).toContain("principle of superposition");
    expect(out).toContain("(+6 cm) + (−4 cm) = +2 cm");
  });

  it("handles 'E is wrong' (ACT Math 5-choice questions)", () => {
    const input = "A is correct. Details. E is wrong (trap: sign error).";
    const out = sanitizeFlashcardExplanation(input);
    expect(out).not.toContain("E is wrong");
    expect(out).toContain("Details.");
  });

  it("is idempotent — double-sanitize matches single", () => {
    const input = "A is correct. Real content. B is wrong (trap).";
    expect(sanitizeFlashcardExplanation(sanitizeFlashcardExplanation(input)))
      .toBe(sanitizeFlashcardExplanation(input));
  });

  it("passes through non-MCQ explanations unchanged", () => {
    const input = "When two waves overlap, displacement = sum of amplitudes.";
    expect(sanitizeFlashcardExplanation(input)).toBe(input);
  });

  it("handles null / undefined / empty", () => {
    expect(sanitizeFlashcardExplanation(null)).toBe("");
    expect(sanitizeFlashcardExplanation(undefined)).toBe("");
    expect(sanitizeFlashcardExplanation("")).toBe("");
  });

  it("doesn't over-strip — 'A is' in ordinary prose survives", () => {
    const input =
      "A is the right letter. The student must compute the algebraic sum.";
    const out = sanitizeFlashcardExplanation(input);
    // "A is the right letter" doesn't match "A is correct/wrong/incorrect" so it stays.
    expect(out).toContain("A is the right letter.");
  });

  it("handles 'C is incorrect' variant", () => {
    const input = "Details. C is incorrect because of sign error. More details.";
    const out = sanitizeFlashcardExplanation(input);
    expect(out).not.toContain("C is incorrect");
    expect(out).toContain("Details.");
    expect(out).toContain("More details.");
  });

  it("collapses double spaces left after stripping", () => {
    const input = "Start. B is wrong. End.";
    const out = sanitizeFlashcardExplanation(input);
    // Should not have "  " in the middle
    expect(out).not.toMatch(/\s{2,}/);
    expect(out).toBe("Start. End.");
  });
});
