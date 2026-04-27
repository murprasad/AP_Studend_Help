import { describe, it, expect } from "vitest";
import { scoreQuestionStyle } from "./question-style-scorer";

describe("scoreQuestionStyle — Stage 2 quality validator", () => {
  it("scores a CB-quality AP Chem MCQ at standard (≥7)", () => {
    const r = scoreQuestionStyle({
      course: "AP_CHEMISTRY",
      questionText: "Calculate the pH of a 0.10 M solution of acetic acid (Ka = 1.8 × 10⁻⁵).",
      stimulus: "Acetic acid (CH₃COOH) is a weak acid that partially dissociates in water. Ka = 1.8 × 10⁻⁵ at 25°C.",
      options: ["A) 2.87", "B) 4.74", "C) 1.00", "D) 5.50"],
      correctAnswer: "A",
      explanation: "Using the Ka expression, [H⁺]² / (0.10 - [H⁺]) ≈ 1.8 × 10⁻⁵. Approximating [H⁺] = √(1.8 × 10⁻⁶) ≈ 1.34 × 10⁻³ M. pH = -log(1.34 × 10⁻³) ≈ 2.87.",
      difficulty: "MEDIUM",
    });
    expect(r.score).toBeGreaterThanOrEqual(7);
    expect(r.bucket).toBe("standard");
  });

  it("flags missing stimulus on quantitative course as P0 fail", () => {
    const r = scoreQuestionStyle({
      course: "AP_CHEMISTRY",
      questionText: "What is the pH of a 0.10 M HCl solution?",
      stimulus: null,
      options: ["A) 1.0", "B) 2.0", "C) 7.0", "D) 13.0"],
      explanation: "HCl is a strong acid that fully dissociates. pH = -log(0.10) = 1.0.",
      difficulty: "EASY",
    });
    expect(r.issues).toContain("missing_stimulus_quant");
    expect(r.breakdown.stimulus).toBe(0);
  });

  it("flags HARD-tagged but recall-style stem", () => {
    const r = scoreQuestionStyle({
      course: "AP_BIOLOGY",
      questionText: "Which of the following is the correct definition of a peptide bond?",
      stimulus: "Proteins are polymers of amino acids linked by peptide bonds.",
      options: ["A) Bond between sugars", "B) Bond between amino acids", "C) Bond between nucleotides", "D) Bond between lipids"],
      explanation: "A peptide bond is a covalent amide bond formed between the carboxyl group of one amino acid and the amino group of another, with loss of water.",
      difficulty: "HARD",
    });
    expect(r.issues).toContain("hard_but_recall_style");
    expect(r.breakdown.cognitive).toBe(0);
  });

  it("flags hedging language without anchor", () => {
    const r = scoreQuestionStyle({
      course: "AP_US_GOVERNMENT",
      questionText: "Which of the following is the primary responsibility of the United States Senate as a legislative body?",
      stimulus: null,
      options: ["A) Ratify treaties", "B) Impeachment trials", "C) Confirm appointments", "D) All of the above"],
      explanation: "The Senate has multiple constitutional roles including treaty ratification, confirmation of appointments, and trying impeachments. The 'primary' framing is ambiguous because all three are equally constitutional duties.",
      difficulty: "EASY",
    });
    expect(r.issues).toContain("hedging_unanchored");
  });

  it("flags letter-ref leak in explanation (shuffle damage detector)", () => {
    const r = scoreQuestionStyle({
      course: "AP_CHEMISTRY",
      questionText: "Calculate the molarity of a 250 mL solution containing 5.85 g of NaCl.",
      stimulus: "Solution preparation: 5.85 g of NaCl (M = 58.5 g/mol) dissolved in water to 250 mL total.",
      options: ["A) 0.10 M", "B) 0.40 M", "C) 0.20 M", "D) 0.05 M"],
      explanation: "B is correct because moles = 5.85/58.5 = 0.10 mol. Molarity = 0.10/0.250 = 0.40 M.",
      difficulty: "EASY",
    });
    expect(r.issues).toContain("explanation_letter_ref_leak");
  });

  it("buckets correctly: standard ≥7, salvageable 5-6, regen <5", () => {
    // Score 10 (perfect) → standard
    const perfect = scoreQuestionStyle({
      course: "AP_BIOLOGY",
      questionText: "Calculate the predicted phenotypic ratio of the F2 generation in a dihybrid cross between AaBb individuals.",
      stimulus: "A dihybrid cross involves two heterozygous individuals (AaBb × AaBb) for two unlinked genes following Mendelian inheritance.",
      options: ["A) 9:3:3:1", "B) 1:1:1:1", "C) 3:1", "D) 9:7"],
      explanation: "In a dihybrid cross of AaBb × AaBb, the predicted F2 phenotypic ratio is 9:3:3:1 because each gene segregates independently per Mendel's law.",
      difficulty: "MEDIUM",
    });
    expect(perfect.bucket).toBe("standard");

    // Multiple issues → regen
    const trash = scoreQuestionStyle({
      course: "AP_PHYSICS_1",
      questionText: "What is force?",
      stimulus: null,
      options: ["A) Push", "B) Pull", "C) Both", "D) Neither"],
      explanation: "Force is...",
      difficulty: "HARD",
    });
    expect(trash.bucket).toBe("regen");
  });
});
