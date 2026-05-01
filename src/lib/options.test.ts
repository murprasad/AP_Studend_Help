import { describe, expect, it } from "vitest";
import { optionLetter, cleanOptionText, parseOptions, lettersEqual, validateMcqStructure } from "./options";

describe("optionLetter — derives canonical letter from index", () => {
  it("returns A/B/C/D/E for indices 0-4", () => {
    expect(optionLetter(0)).toBe("A");
    expect(optionLetter(1)).toBe("B");
    expect(optionLetter(2)).toBe("C");
    expect(optionLetter(3)).toBe("D");
    expect(optionLetter(4)).toBe("E");
  });
  it("falls back to numeric for index 5+", () => {
    expect(optionLetter(5)).toBe("6");
    expect(optionLetter(99)).toBe("100");
  });
});

describe("cleanOptionText — strips leading letter prefix", () => {
  it('strips "A) "', () => expect(cleanOptionText("A) Synthesis of Hindu and Buddhist")).toBe("Synthesis of Hindu and Buddhist"));
  it('strips "B. "', () => expect(cleanOptionText("B. The Mughal empire")).toBe("The Mughal empire"));
  it('strips "(C) "', () => expect(cleanOptionText("(C) Trade routes")).toBe("Trade routes"));
  it('strips "D: "', () => expect(cleanOptionText("D: Maritime")).toBe("Maritime"));
  it("leaves unprefixed text unchanged (the 8.6% case)", () => {
    expect(cleanOptionText("Approximately 785 N")).toBe("Approximately 785 N");
    expect(cleanOptionText("0.015")).toBe("0.015");
  });
  it("does not strip the actual letter from words like 'A famous king'", () => {
    // "A famous king" — the "A " here has space but no punctuation, so
    // the regex shouldn't strip. (Regex requires "(.):" or "(.)." or
    // "(.))" or "((.))". Plain "A " followed by word doesn't match.)
    expect(cleanOptionText("A famous king")).toBe("A famous king");
  });
  it("handles non-string input defensively", () => {
    expect(cleanOptionText(null as unknown as string)).toBe("");
    expect(cleanOptionText(undefined as unknown as string)).toBe("");
  });
});

describe("parseOptions — array normalization", () => {
  it("strips prefixes from all entries", () => {
    expect(parseOptions(["A) X", "B) Y", "C) Z", "D) W"])).toEqual(["X", "Y", "Z", "W"]);
  });
  it("leaves unprefixed entries untouched", () => {
    expect(parseOptions(["X", "Y", "Z", "W"])).toEqual(["X", "Y", "Z", "W"]);
  });
  it("handles mixed format (the catastrophic case)", () => {
    expect(parseOptions(["A) X", "Y", "(C) Z", "W"])).toEqual(["X", "Y", "Z", "W"]);
  });
  it("returns [] for non-array", () => {
    expect(parseOptions(null)).toEqual([]);
    expect(parseOptions(undefined)).toEqual([]);
  });
});

describe("lettersEqual — strict letter comparison", () => {
  it("matches when both are same single letter", () => {
    expect(lettersEqual("A", "A")).toBe(true);
    expect(lettersEqual("a", "A")).toBe(true);
    expect(lettersEqual("  B  ", "b")).toBe(true);
  });
  it("returns false on mismatch", () => {
    expect(lettersEqual("A", "B")).toBe(false);
  });
  it("rejects malformed input (full option text)", () => {
    expect(lettersEqual("Approximately 785 N", "B")).toBe(false);
    expect(lettersEqual("A) The synthesis...", "A")).toBe(false);
  });
  it("rejects out-of-range letters", () => {
    expect(lettersEqual("F", "F")).toBe(false);
    expect(lettersEqual("Z", "A")).toBe(false);
  });
  it("rejects empty/null", () => {
    expect(lettersEqual("", "A")).toBe(false);
    expect(lettersEqual("A", "")).toBe(false);
  });
});

describe("validateMcqStructure — write-time integrity check", () => {
  it("accepts a valid MCQ", () => {
    expect(validateMcqStructure(["X", "Y", "Z", "W"], "B")).toBeNull();
    expect(validateMcqStructure(["A) X", "B) Y", "C) Z", "D) W"], "C")).toBeNull();
  });
  it("rejects too few options", () => {
    expect(validateMcqStructure(["X"], "A")).toContain("options must have ≥2");
  });
  it("rejects too many options", () => {
    expect(validateMcqStructure(["X", "Y", "Z", "W", "V", "U"], "A")).toContain("options must have ≤5");
  });
  it("rejects empty option", () => {
    expect(validateMcqStructure(["X", "", "Z", "W"], "B")).toContain("empty");
  });
  it("rejects out-of-range correctAnswer (the 7 prod questions)", () => {
    expect(validateMcqStructure(["X", "Y", "Z", "W"], "E")).toContain("out of bounds");
  });
  it("rejects bad correctAnswer format", () => {
    expect(validateMcqStructure(["X", "Y", "Z", "W"], "Option B")).toContain("single letter");
    expect(validateMcqStructure(["X", "Y", "Z", "W"], "")).toContain("single letter");
  });
});
