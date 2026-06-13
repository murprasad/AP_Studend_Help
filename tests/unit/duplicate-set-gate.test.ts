/**
 * BIQ D10/D11 regression — duplicate-answer-SET gate (2026-06-11, mirrored from PL).
 *
 * D10: a solution-set question can ship options that are the SAME set in a
 *      different order ("-5, 1" ≡ "1, -5") → two correct answers.
 * D11: the duplicate-option normalizer lowercased BEFORE stripping the "A)"
 *      prefix with an uppercase-only /^[A-E]\)/, so prefixed options were never
 *      stripped and the dupe slipped through.
 *
 * Locks the catch (prefixed solution-set duplicate blocked) + the REV-found
 * false-positive guards (coordinate pairs / ordering questions must NOT flag).
 */
import { describe, it, expect } from "vitest";
import { runDeterministicGates, type QuestionCandidate } from "@/lib/deterministic-question-gates";

const EXPL =
  "Factor the quadratic as (x + 5)(x - 1) = 0, so x = -5 or x = 1. " +
  "Both roots satisfy the original equation x^2 + 4x - 5 = 0.";

function q(over: Partial<QuestionCandidate>): QuestionCandidate {
  return {
    course: "SAT_MATH",
    questionType: "MCQ",
    questionText: "Solve for x: x^2 + 4x - 5 = 0",
    options: ["A) -5, 1", "B) -1, 5", "C) 0, 4", "D) 1, -5"],
    correctAnswer: "A",
    explanation: EXPL,
    ...over,
  };
}

describe("duplicate-answer-set gate (SN)", () => {
  it("blocks a solution-set question whose options are the same set in different order (A≡D, prefixed)", () => {
    const r = runDeterministicGates(q({}));
    expect(r.ok).toBe(false);
    expect(r.gate).toBe("options-duplicate-set");
  });

  it("passes a solution-set question when every option is a distinct set", () => {
    const r = runDeterministicGates(q({
      options: ["A) -5, 1", "B) -1, 5", "C) 0, 4", "D) 2, 3"],
    }));
    expect(r.gate).not.toBe("options-duplicate-set");
  });

  it("does NOT flag a non-solution-set question with reversed numeric pairs (points (2,3)≠(3,2))", () => {
    const r = runDeterministicGates(q({
      questionText: "Which point lies on the line y = x + 1?",
      options: ["A) 2, 3", "B) 3, 2", "C) 0, 1", "D) 4, 5"],
      explanation:
        "Substitute each point into y = x + 1. For (2, 3): 3 = 2 + 1 is true, so (2, 3) lies on the line while (3, 2) does not.",
      correctAnswer: "A",
    }));
    expect(r.gate).not.toBe("options-duplicate-set");
  });

  it("does NOT flag an ordering question whose options are permutations of the same tokens", () => {
    const r = runDeterministicGates(q({
      questionText: "In what order should the steps be performed?",
      options: ["A) 1, 2, 3", "B) 3, 2, 1", "C) 2, 1, 3", "D) 1, 3, 2"],
      explanation:
        "The correct sequence is 1, 2, 3: set up the equation, isolate the variable, then verify. The order matters here.",
      correctAnswer: "A",
    }));
    expect(r.gate).not.toBe("options-duplicate-set");
  });
});
