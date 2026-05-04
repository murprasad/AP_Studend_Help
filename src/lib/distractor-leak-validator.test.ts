import { describe, it, expect } from "vitest";
import {
  findLeakPhrase,
  validateNoDistractorLeaks,
  validateOptionLengthVariance,
  validateDistractorIntegrity,
} from "./distractor-leak-validator";

describe("findLeakPhrase", () => {
  it("catches the audit's exact Maslow leak", () => {
    expect(findLeakPhrase("Esteem needs, confusing priority of basic needs")).toBeTruthy();
  });

  it("catches 'mistakenly assuming'", () => {
    expect(findLeakPhrase("Self-actualization needs, mistakenly assuming personal growth is the immediate priority")).toBeTruthy();
  });

  it("catches 'does not apply'", () => {
    expect(findLeakPhrase("MVT does not apply")).toBeTruthy();
  });

  it("catches parenthetical critique", () => {
    expect(findLeakPhrase("400 N (Wrong: forgot buoyancy direction)")).toBeTruthy();
  });

  it("catches 'incorrectly because'", () => {
    expect(findLeakPhrase("3 mol/L because pH is incorrectly applied to weak acid")).toBeTruthy();
  });

  it("approves a clean confident distractor", () => {
    expect(findLeakPhrase("245 N")).toBeNull();
    expect(findLeakPhrase("Esteem needs")).toBeNull();
    expect(findLeakPhrase("The Mean Value Theorem guarantees a c in (a, b) where f'(c) equals the average rate of change.")).toBeNull();
  });

  it("approves a CB-style stem with mention of misconception in non-leak context", () => {
    // CB sometimes USES the word "incorrect" in a question stem describing
    // a student's error — but only in the QUESTION, never in an option.
    // Our gate only runs on options, so this isn't tested here. Verify
    // a plain reference doesn't trip the gate inside an option:
    expect(findLeakPhrase("The student concluded the experiment had ended.")).toBeNull();
  });
});

describe("validateNoDistractorLeaks", () => {
  it("flags the AP Psych Maslow set from the audit", () => {
    const options = [
      "Physiological needs",
      "Safety needs",
      "Esteem needs, confusing priority of basic needs",
      "Self-actualization needs, mistakenly assuming personal growth is the immediate priority",
    ];
    const result = validateNoDistractorLeaks(options);
    expect(result).toContain("Option C");
  });

  it("flags the Calc MVT set from the audit", () => {
    const options = [
      "By the Mean Value Theorem, there exists c in (1, 4) where f'(c) = 7",
      "MVT does not apply because f is not differentiable on [1, 4]",
      "The avg rate of change is 7 but MVT guarantees only the midpoint",
      "f'(c) = 7 only at c = 2.5 (incorrect because MVT is not constructive)",
    ];
    const result = validateNoDistractorLeaks(options);
    expect(result).toContain("Option B");
  });

  it("approves a clean CB-style MCQ", () => {
    const options = [
      "245 N",
      "490 N",
      "980 N",
      "1960 N",
    ];
    expect(validateNoDistractorLeaks(options)).toBeNull();
  });

  it("approves a clean conceptual MCQ", () => {
    const options = [
      "Physiological needs",
      "Safety needs",
      "Esteem needs",
      "Self-actualization",
    ];
    expect(validateNoDistractorLeaks(options)).toBeNull();
  });
});

describe("validateOptionLengthVariance", () => {
  it("flags when correct option is conspicuously longer", () => {
    const options = [
      "Yes",                              // 3 chars
      "No",                               // 2 chars
      "Maybe",                            // 5 chars
      "Yes, because the experimental design controlled for confounding variables and the sample size was statistically significant.", // ~120 chars
    ];
    const result = validateOptionLengthVariance(options, "D");
    expect(result).toContain("Length-variance tell");
  });

  it("approves when options are similar length", () => {
    const options = [
      "The temperature increased by 5 degrees.",
      "The temperature decreased by 3 degrees.",
      "The temperature stayed the same throughout.",
      "The temperature fluctuated randomly across the trial.",
    ];
    expect(validateOptionLengthVariance(options, "A")).toBeNull();
  });

  it("approves short numeric options even with high relative spread", () => {
    // "5 m/s", "10 m/s", "15.625 m/s" — physics units make uniform length impossible
    const options = ["5 m/s", "10 m/s", "15.625 m/s", "20 m/s"];
    expect(validateOptionLengthVariance(options, "C")).toBeNull(); // mean is small, exempt
  });

  it("does NOT flag if longest option is wrong (then the tell hurts students)", () => {
    const options = [
      "5 N",
      "Some long distractor that's way longer than the correct answer just to confuse test-takers without merit",
      "10 N",
      "15 N",
    ];
    // Correct is A=5 — the longest is the wrong B. So no length-tell concern.
    expect(validateOptionLengthVariance(options, "A")).toBeNull();
  });
});

describe("validateDistractorIntegrity (combined)", () => {
  it("returns the leak error first when both fire", () => {
    const options = [
      "A short answer",
      "B short",
      "C short",
      "D long answer with mistakenly long content here that makes it both the longest AND a leaker",
    ];
    const result = validateDistractorIntegrity(options, "D");
    expect(result).toContain("distractor-leak phrase");
  });

  it("returns null on a clean question", () => {
    const options = [
      "245 N",
      "490 N",
      "980 N",
      "1960 N",
    ];
    expect(validateDistractorIntegrity(options, "B")).toBeNull();
  });
});
