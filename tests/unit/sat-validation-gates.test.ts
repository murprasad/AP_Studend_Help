/**
 * 2026-05-31 — Validation engine SAT/PSAT coverage (#100 SAT=CB parity,
 * validation-engine integration goal).
 *
 * Catches the SAT-specific gate gaps surfaced today:
 *   1. SAT/PSAT default 5-option fallthrough (real digital SAT is 4-option).
 *   2. SAT_READING_WRITING items with no stimulus (must always be paired
 *      with a 1-2 paragraph passage).
 *   3. SAT_MATH NUMERICAL (SPR/grid-in) items where correctAnswer is
 *      a numeric string, not a letter A-E.
 */
import { describe, it, expect } from "vitest";
import {
  runDeterministicGates,
  expectedOptionCount,
} from "@/lib/deterministic-question-gates";

const baseRWQuestion = {
  questionText: "Which choice best completes the underlined portion?",
  options: ["A) the inventor", "B) an inventor", "C) inventors", "D) inventor"],
  correctAnswer: "A",
  explanation:
    "Choice A is correct because it correctly uses the definite article 'the' to refer to a specific person mentioned earlier in the passage.",
  course: "SAT_READING_WRITING",
  stimulus:
    "The following text is adapted from a 2019 essay by Jane Doe. Mary Anderson invented the windshield wiper in 1903, well before automobile use became widespread. Although her patent expired before she could profit from it, her invention is now standard on every car.",
};

describe("Option count — SAT/PSAT default to 4 choices (digital SAT spec)", () => {
  it("SAT_MATH expects 4 options", () => {
    expect(expectedOptionCount("SAT_MATH")).toBe(4);
  });
  it("SAT_READING_WRITING expects 4 options", () => {
    expect(expectedOptionCount("SAT_READING_WRITING")).toBe(4);
  });
  it("PSAT_MATH expects 4 options", () => {
    expect(expectedOptionCount("PSAT_MATH")).toBe(4);
  });
  it("PSAT_READING_WRITING expects 4 options", () => {
    expect(expectedOptionCount("PSAT_READING_WRITING")).toBe(4);
  });
  it("ACT_ENGLISH expects 4 options", () => {
    expect(expectedOptionCount("ACT_ENGLISH")).toBe(4);
  });
  it("ACT_MATH still expects 5 options (only 5-choice MCQ format)", () => {
    expect(expectedOptionCount("ACT_MATH")).toBe(5);
  });
  it("AP courses still expect 5 options", () => {
    expect(expectedOptionCount("AP_CALCULUS_AB")).toBe(5);
  });
});

describe("Stimulus presence — SAT/PSAT R&W requires a passage", () => {
  it("passes when a substantial passage is present", () => {
    const r = runDeterministicGates(baseRWQuestion);
    expect(r.ok).toBe(true);
  });

  it("fails when stimulus is missing", () => {
    const r = runDeterministicGates({ ...baseRWQuestion, stimulus: null });
    expect(r.ok).toBe(false);
    expect(r.gate).toBe("stimulus-required");
  });

  it("fails when stimulus is too short to be a real passage", () => {
    const r = runDeterministicGates({ ...baseRWQuestion, stimulus: "Short." });
    expect(r.ok).toBe(false);
    expect(r.gate).toBe("stimulus-required");
  });

  it("PSAT_READING_WRITING also requires a stimulus", () => {
    const r = runDeterministicGates({
      ...baseRWQuestion,
      course: "PSAT_READING_WRITING",
      stimulus: null,
    });
    expect(r.ok).toBe(false);
    expect(r.gate).toBe("stimulus-required");
  });

  it("SAT_MATH does NOT require a stimulus (some Math Qs are pure equations)", () => {
    const mathQ = {
      questionText: "What is the value of x in the equation 3x + 7 = 22?",
      options: ["A) 3", "B) 5", "C) 7", "D) 15"],
      correctAnswer: "B",
      explanation:
        "Subtract 7 from both sides to get 3x = 15, then divide both sides by 3 to get x = 5.",
      course: "SAT_MATH",
      stimulus: null,
    };
    const r = runDeterministicGates(mathQ);
    expect(r.ok).toBe(true);
  });
});

describe("NUMERICAL (SPR/grid-in) — SAT Math gate branch", () => {
  const baseNumeric = {
    questionText:
      "In the equation 2x + 5 = 15, what is the value of x as a decimal?",
    explanation:
      "Subtract 5 from both sides: 2x = 10. Divide both sides by 2: x = 5. Written as a decimal, this is 5.0.",
    correctAnswer: "5",
    course: "SAT_MATH",
    questionType: "NUMERICAL" as const,
  };

  it("accepts a numeric-string correctAnswer", () => {
    const r = runDeterministicGates(baseNumeric);
    expect(r.ok).toBe(true);
  });

  it("accepts fractional correctAnswer for SPR", () => {
    const r = runDeterministicGates({ ...baseNumeric, correctAnswer: "5/2" });
    expect(r.ok).toBe(true);
  });

  it("rejects empty correctAnswer", () => {
    const r = runDeterministicGates({ ...baseNumeric, correctAnswer: "" });
    expect(r.ok).toBe(false);
  });

  it("skips option-count gates entirely for NUMERICAL", () => {
    // SPR question with no options should still pass — options aren't
    // a thing for grid-in items.
    const r = runDeterministicGates({ ...baseNumeric, options: undefined });
    expect(r.ok).toBe(true);
  });

  it("PSAT_MATH NUMERICAL also passes the same branch", () => {
    const r = runDeterministicGates({
      ...baseNumeric,
      course: "PSAT_MATH",
      correctAnswer: "0.5",
    });
    expect(r.ok).toBe(true);
  });
});

describe("Regression — SAT/PSAT MCQ items still validated normally", () => {
  it("SAT_MATH MCQ with 4 options + letter answer passes", () => {
    const r = runDeterministicGates({
      questionText: "What is the value of x if 3x + 7 = 22?",
      options: ["A) 3", "B) 5", "C) 7", "D) 15"],
      correctAnswer: "B",
      explanation:
        "Subtract 7 from both sides: 3x = 15. Divide both sides by 3: x = 5.",
      course: "SAT_MATH",
    });
    expect(r.ok).toBe(true);
  });

  it("SAT_MATH MCQ with 5 options now fails (digital SAT is 4-choice)", () => {
    const r = runDeterministicGates({
      questionText: "What is the value of x if 3x + 7 = 22?",
      options: ["A) 3", "B) 5", "C) 7", "D) 15", "E) 20"],
      correctAnswer: "B",
      explanation:
        "Subtract 7 from both sides: 3x = 15. Divide both sides by 3: x = 5.",
      course: "SAT_MATH",
    });
    expect(r.ok).toBe(false);
    expect(r.gate).toBe("options-count");
  });
});
