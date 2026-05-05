import { describe, it, expect } from "vitest";
import { getExamCopy, getExamFamily } from "./exam-copy";

describe("getExamCopy", () => {
  it("returns AP copy for AP_* courses", () => {
    const copy = getExamCopy("AP_BIOLOGY");
    expect(copy.family).toBe("AP");
    expect(copy.scoreScale).toEqual({ min: 1, max: 5, target: 4 });
    expect(copy.scoreSuffix).toBe("/5");
    expect(copy.unitTerm).toBe("units");
    expect(copy.hasFreeResponse).toBe(true);
    expect(copy.gapPhrase).toMatch(/units.*gap.*4/);
  });

  it("returns SAT copy for SAT_* courses", () => {
    const copy = getExamCopy("SAT_MATH");
    expect(copy.family).toBe("SAT");
    expect(copy.scoreScale).toEqual({ min: 400, max: 1600, target: 1400 });
    expect(copy.scoreSuffix).toBe("/1600");
    expect(copy.hasFreeResponse).toBe(false);
    expect(copy.projectedScoreLabel).toBe("projected SAT score");
  });

  it("returns ACT copy for ACT_* courses (the original bug)", () => {
    // The bug user reported: ACT student saw "projected AP score" + "gap to a 4".
    // This test locks in the correct behavior.
    const copy = getExamCopy("ACT_ENGLISH");
    expect(copy.family).toBe("ACT");
    expect(copy.scoreScale.max).toBe(36);
    expect(copy.scoreSuffix).toBe("/36");
    expect(copy.unitTerm).toBe("sections"); // ACT has sections, not units
    expect(copy.hasFreeResponse).toBe(false); // ACT has no FRQs
    expect(copy.projectedScoreLabel).toBe("projected ACT score");
    expect(copy.gapPhrase).not.toMatch(/AP|units|gap to a 4/);
    expect(copy.gapPhrase).toMatch(/30/);
  });

  it("returns CLEP copy for CLEP_* (vestigial on StudentNest, real on PrepLion)", () => {
    const copy = getExamCopy("CLEP_COLLEGE_ALGEBRA");
    expect(copy.family).toBe("CLEP");
    expect(copy.scoreScale).toEqual({ min: 20, max: 80, target: 50 });
    expect(copy.stakesCopy).toMatch(/college credit/);
  });

  it("returns DSST copy for DSST_* courses", () => {
    const copy = getExamCopy("DSST_ASTRONOMY");
    expect(copy.family).toBe("DSST");
  });

  it("falls back to AP for unknown / null / undefined / empty", () => {
    expect(getExamCopy(null).family).toBe("AP");
    expect(getExamCopy(undefined).family).toBe("AP");
    expect(getExamCopy("").family).toBe("AP");
    expect(getExamCopy("UNKNOWN_COURSE").family).toBe("AP");
  });

  it("is case-insensitive on the prefix", () => {
    expect(getExamCopy("act_english").family).toBe("ACT");
    expect(getExamCopy("sat_math").family).toBe("SAT");
  });

  it("treats PSAT as SAT family (same scoring scale)", () => {
    expect(getExamCopy("PSAT_MATH").family).toBe("SAT");
  });
});

describe("getExamFamily", () => {
  it("returns just the family code", () => {
    expect(getExamFamily("AP_BIOLOGY")).toBe("AP");
    expect(getExamFamily("ACT_MATH")).toBe("ACT");
    expect(getExamFamily(null)).toBe("AP");
  });
});
