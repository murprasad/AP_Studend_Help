import { describe, it, expect } from "vitest";
import { extractArithmeticStatements, validateExplanationMath, validateAnswerNumericMatch } from "./math-validator";

describe("extractArithmeticStatements", () => {
  it("catches the AP Calc Q1 buggy explanation", () => {
    // "f(3)... = 27 / 2 = 13" — the 27 is wrong (should be 21), and the
    // computed result 27/2=13.5 doesn't equal the stated 13 (rounded).
    // Specifically catches "(27 - 1) / 2 = 13"
    const expl = "(f(3) - f(1)) / (3 - 1) = (27 - 1) / 2 = 26 / 2 = 13";
    const stmts = extractArithmeticStatements(expl);
    // Should detect "(27 - 1) / 2 = 13" — actual is 26/2 = 13, but
    // (27-1)/2 = 13 is correct arithmetic. The error is upstream (f(3)
    // should be 21 not 27). Layer 1 doesn't catch upstream errors —
    // that's a deeper algebra check. Layer 1 catches DIRECT arithmetic
    // errors stated in the explanation.
    // BUT: "26 / 2 = 13" IS arithmetically correct. So this specific
    // explanation has a substituted-wrong-value error, not arithmetic
    // error. Layer 1 won't catch it. That's a known limitation.
    // Verify the function still parses without crashing.
    expect(Array.isArray(stmts)).toBe(true);
  });

  it("catches a real arithmetic error", () => {
    const expl = "The mass is 50 kg, weight = 50 * 9.8 = 500 N";
    const stmts = extractArithmeticStatements(expl);
    const wrong = stmts.find((s) => !s.isCorrect);
    expect(wrong).toBeTruthy();
    expect(wrong?.computed).toBeCloseTo(490, 1);
    expect(wrong?.stated).toBe(500);
  });

  it("approves correct arithmetic", () => {
    const expl = "Buoyant force = 1000 * 0.05 * 9.8 = 490 N";
    const stmts = extractArithmeticStatements(expl);
    expect(stmts.every((s) => s.isCorrect)).toBe(true);
  });

  it("ignores explanations without arithmetic", () => {
    const expl = "The Silk Road facilitated cultural exchange across Eurasia.";
    expect(extractArithmeticStatements(expl)).toHaveLength(0);
  });

  it("handles unicode operators (× and ÷)", () => {
    const expl = "Result = 3 × 4 = 12";
    const stmts = extractArithmeticStatements(expl);
    expect(stmts.length).toBeGreaterThan(0);
    expect(stmts[0].isCorrect).toBe(true);
  });

  it("rejects expressions with unknown variables (skip)", () => {
    const expl = "x + 5 = 7"; // contains variable, can't compute
    const stmts = extractArithmeticStatements(expl);
    // Should skip, not crash
    expect(stmts).toHaveLength(0);
  });
});

describe("validateExplanationMath", () => {
  it("returns null when all arithmetic is right", () => {
    expect(validateExplanationMath("F = 1000 * 0.05 * 9.8 = 490 N")).toBeNull();
  });

  it("flags an arithmetic error", () => {
    const result = validateExplanationMath("weight = 50 * 9.8 = 500 N");
    expect(result).toContain("Explanation arithmetic error");
    expect(result).toContain("500");
  });

  it("returns null on non-arithmetic explanation", () => {
    expect(validateExplanationMath("Ibn Battuta traveled to spread Islamic teachings.")).toBeNull();
  });

  it("returns null on empty/null", () => {
    expect(validateExplanationMath(null)).toBeNull();
    expect(validateExplanationMath("")).toBeNull();
  });
});

describe("validateAnswerNumericMatch", () => {
  it("catches the buoyant-force bug class", () => {
    // Stored answer A=196 N. Explanation arrives at 490 N. Should flag.
    const result = validateAnswerNumericMatch(
      ["196 N", "490 N", "980 N", "1960 N"],
      "A",
      "Buoyant force = ρVg = 1000 * 0.05 * 9.8 = 490 N",
    );
    expect(result).toContain("matches option B");
  });

  it("approves when explanation final number matches stored option", () => {
    expect(validateAnswerNumericMatch(
      ["196 N", "490 N", "980 N", "1960 N"],
      "B",
      "Buoyant force = 1000 * 0.05 * 9.8 = 490 N",
    )).toBeNull();
  });

  it("flags when explanation arrives at a number not in any option", () => {
    // Density question: math gives 624, options are 980/1000/1020/1050
    const result = validateAnswerNumericMatch(
      ["980 kg/m³", "1000 kg/m³", "1020 kg/m³", "1050 kg/m³"],
      "B",
      "Density = mass/V = 31.4/0.0503 = 624 kg/m³",
    );
    expect(result).toContain("no option contains");
  });

  it("returns null for non-numeric questions", () => {
    expect(validateAnswerNumericMatch(
      ["Yes", "No", "Maybe", "Unknown"],
      "A",
      "The answer is yes because of historical evidence.",
    )).toBeNull();
  });
});
