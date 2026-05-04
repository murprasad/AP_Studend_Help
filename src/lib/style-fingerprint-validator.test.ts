import { describe, it, expect } from "vitest";
import {
  validateStyleFidelity,
  issuesToRegenPrompt,
  type Question,
  type StyleFingerprint,
} from "./style-fingerprint-validator";

const baselineFingerprint: StyleFingerprint = {
  stem: { wordCount: { mean: 35, sd: 12 } },
  distractor: { wordCount: { mean: 8, sd: 4 }, maxCoefficientOfVariation: 0.3 },
  formatQuirks: { optionCount: 4, requiresStimulus: false },
};

describe("validateStyleFidelity", () => {
  it("passes a clean baseline question", () => {
    const q: Question = {
      // 35-word stem to land at the fingerprint mean
      questionText: "A student carefully observes a chemical reaction in a closed container and notes that the temperature of the surrounding water bath increases steadily over the next ten minutes. Which of the following best explains the student's observation?",
      options: ["Reaction is exothermic", "Reaction is endothermic", "Reaction is at equilibrium", "Reaction is reversible"],
      correctAnswer: "A",
      questionType: "MCQ",
    };
    const result = validateStyleFidelity(q, baselineFingerprint);
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("hard-fails on wrong option count", () => {
    const q: Question = {
      questionText: "Which of these is true? " + "word ".repeat(30),
      options: ["A", "B", "C"], // only 3
      correctAnswer: "A",
      questionType: "MCQ",
    };
    const result = validateStyleFidelity(q, baselineFingerprint);
    expect(result.ok).toBe(false);
    expect(result.issues.some(i => i.metric === "option_count")).toBe(true);
  });

  it("flags stem too verbose (outside +1σ)", () => {
    const q: Question = {
      questionText: "word ".repeat(80), // 80 words, target 35±12 → fails
      options: ["a a a a a a a a", "b b b b b b b b", "c c c c c c c c", "d d d d d d d d"],
      correctAnswer: "A",
      questionType: "MCQ",
    };
    const result = validateStyleFidelity(q, baselineFingerprint);
    expect(result.ok).toBe(false);
    expect(result.issues.some(i => i.metric === "stem_word_count")).toBe(true);
  });

  it("flags distractor length tell (high CV)", () => {
    const q: Question = {
      questionText: "Which is correct? " + "word ".repeat(30),
      options: ["Yes", "Yes", "Yes", "Yes, because the answer is technically supported by all four points listed in the original passage from the textbook"],
      correctAnswer: "D",
      questionType: "MCQ",
    };
    const result = validateStyleFidelity(q, baselineFingerprint);
    expect(result.ok).toBe(false);
    expect(result.issues.some(i => i.metric === "distractor_length_variance")).toBe(true);
  });

  it("hard-fails when stimulus required but missing", () => {
    const q: Question = {
      questionText: "Based on the passage above, which conclusion is correct? word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word",
      options: ["A.", "B.", "C.", "D."],
      correctAnswer: "A",
      questionType: "MCQ",
      stimulus: undefined,
    };
    const fp = { ...baselineFingerprint, formatQuirks: { ...baselineFingerprint.formatQuirks, requiresStimulus: true } };
    const result = validateStyleFidelity(q, fp);
    expect(result.ok).toBe(false);
    expect(result.issues.some(i => i.metric === "stimulus_required")).toBe(true);
  });

  it("issuesToRegenPrompt produces actionable text", () => {
    const issues = [
      { metric: "stem_word_count", expected: "35 ± 12 words", actual: "80 words", fix: "Tighten." },
    ];
    const prompt = issuesToRegenPrompt(issues);
    expect(prompt).toContain("STYLE FIDELITY ISSUES");
    expect(prompt).toContain("stem_word_count");
    expect(prompt).toContain("Tighten.");
  });

  it("returns empty regen prompt when no issues", () => {
    expect(issuesToRegenPrompt([])).toBe("");
  });

  it("handles non-string stimulus defensively (Flash bug class)", () => {
    const q: Question = {
      questionText: "What does the chart show? word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word",
      options: ["A.", "B.", "C.", "D."],
      correctAnswer: "A",
      questionType: "MCQ",
      stimulus: {} as unknown as string, // simulating Flash returning an object
    };
    expect(() => validateStyleFidelity(q, baselineFingerprint)).not.toThrow();
  });
});
