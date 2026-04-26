import { describe, expect, it } from "vitest";
import { sanitizeFlashcardExplanation } from "./markdown-helpers";

describe("sanitizeFlashcardExplanation — Beta 8.1.1 strengthened patterns", () => {
  it("returns empty string for null/undefined/empty", () => {
    expect(sanitizeFlashcardExplanation(null)).toBe("");
    expect(sanitizeFlashcardExplanation(undefined)).toBe("");
    expect(sanitizeFlashcardExplanation("")).toBe("");
  });

  it("strips 'Why A is correct' prefix (USER-REPORTED 2026-04-26)", () => {
    const input = "Why A is correct. Photosynthesis occurs in chloroplasts where chlorophyll absorbs light energy.";
    const out = sanitizeFlashcardExplanation(input);
    expect(out).not.toMatch(/Why A is correct/i);
    expect(out).toContain("chloroplasts");
  });

  it("strips 'Why B is wrong' inline", () => {
    const input = "Photosynthesis converts light into chemical energy. Why B is wrong: it confuses respiration with photosynthesis.";
    const out = sanitizeFlashcardExplanation(input);
    expect(out).not.toMatch(/Why B is wrong/i);
    expect(out).toContain("Photosynthesis converts light");
  });

  it("strips markdown headers like '**Why A is correct:**'", () => {
    const input = "**Why A is correct:**\nMitochondria produce ATP through oxidative phosphorylation.";
    const out = sanitizeFlashcardExplanation(input);
    expect(out).not.toMatch(/Why A is correct/i);
    expect(out).not.toMatch(/\*\*/);
    expect(out).toContain("Mitochondria");
  });

  it("strips '## Why A is correct' h2 markdown", () => {
    const input = "## Why A is correct\nThe nucleus contains genetic material.";
    const out = sanitizeFlashcardExplanation(input);
    expect(out).not.toMatch(/Why A is correct/i);
    expect(out).toContain("nucleus");
  });

  it("strips 'The correct answer is A' / 'Correct answer: A'", () => {
    const input1 = "The correct answer is A. Newton's second law states F=ma.";
    const out1 = sanitizeFlashcardExplanation(input1);
    expect(out1).not.toMatch(/correct answer/i);
    expect(out1).toContain("Newton");

    const input2 = "Correct answer: B.\nThe principle of conservation of energy holds.";
    const out2 = sanitizeFlashcardExplanation(input2);
    expect(out2).not.toMatch(/correct answer/i);
    expect(out2).toContain("conservation");
  });

  it("strips 'Answer: A.' prefix", () => {
    const input = "Answer: C. The mitochondrion produces ATP.";
    const out = sanitizeFlashcardExplanation(input);
    expect(out).not.toMatch(/Answer: C/i);
    expect(out).toContain("mitochondrion");
  });

  it("strips 'Option B states ...' MCQ scaffolding", () => {
    const input = "Cellular respiration uses oxygen to break down glucose. Option B states cells use sunlight directly.";
    const out = sanitizeFlashcardExplanation(input);
    expect(out).not.toMatch(/Option B/i);
    expect(out).toContain("Cellular respiration");
  });

  it("strips '(A) is correct' parenthesized form", () => {
    const input = "(A) is correct. The Krebs cycle occurs in the mitochondrial matrix.";
    const out = sanitizeFlashcardExplanation(input);
    expect(out).not.toMatch(/\(A\)\s+is\s+correct/i);
    expect(out).toContain("Krebs cycle");
  });

  it("strips trap/distractor parentheticals", () => {
    const input = "Glucose breakdown releases energy (trap: don't confuse with anabolism).";
    const out = sanitizeFlashcardExplanation(input);
    expect(out).not.toMatch(/\(trap:/i);
    expect(out).toContain("Glucose breakdown");
  });

  it("is idempotent (safe to apply twice)", () => {
    const input = "Why A is correct. Mitochondria are the powerhouse of the cell.";
    const once = sanitizeFlashcardExplanation(input);
    const twice = sanitizeFlashcardExplanation(once);
    expect(twice).toBe(once);
  });

  it("preserves clean explanations unchanged", () => {
    const input = "Mitochondria are the powerhouse of the cell. They produce ATP through oxidative phosphorylation.";
    expect(sanitizeFlashcardExplanation(input)).toBe(input);
  });

  it("collapses extra whitespace and blank lines after stripping", () => {
    const input = "Why A is correct.\n\n\n\nMitochondria produce ATP.\n\n\nWhy B is wrong here.\n\nThe Krebs cycle is key.";
    const out = sanitizeFlashcardExplanation(input);
    expect(out).not.toMatch(/\n{3,}/);
    expect(out).toContain("Mitochondria");
    expect(out).toContain("Krebs");
  });
});
