import { describe, it, expect } from "vitest";
import {
  computeSatSectionScore,
  familyForCourse,
  isSatLikeCourse,
} from "@/lib/sat-scaled-score";

describe("computeSatSectionScore — F7 SAT=CB parity (#100)", () => {
  it("returns null when sample size is too small", () => {
    expect(
      computeSatSectionScore({ accuracyPercent: 100, totalAnswered: 5, family: "SAT" }),
    ).toBeNull();
  });

  it("0% accuracy → 200 (SAT floor)", () => {
    const r = computeSatSectionScore({ accuracyPercent: 0, totalAnswered: 44, family: "SAT" });
    expect(r?.scaledScore).toBe(200);
    expect(r?.scaleMin).toBe(200);
    expect(r?.scaleMax).toBe(800);
  });

  it("100% accuracy → 800 (SAT ceiling)", () => {
    const r = computeSatSectionScore({ accuracyPercent: 100, totalAnswered: 44, family: "SAT" });
    expect(r?.scaledScore).toBe(800);
  });

  it("50% accuracy → ~500 (SAT mid)", () => {
    const r = computeSatSectionScore({ accuracyPercent: 50, totalAnswered: 44, family: "SAT" });
    expect(r?.scaledScore).toBe(500);
  });

  it("70% accuracy → ~620 (SAT upper-mid)", () => {
    const r = computeSatSectionScore({ accuracyPercent: 70, totalAnswered: 44, family: "SAT" });
    expect(r?.scaledScore).toBe(620);
  });

  it("85% accuracy → ~720 (SAT high)", () => {
    const r = computeSatSectionScore({ accuracyPercent: 85, totalAnswered: 44, family: "SAT" });
    expect(r?.scaledScore).toBe(720);
  });

  it("PSAT 0% → 160 (PSAT floor)", () => {
    const r = computeSatSectionScore({ accuracyPercent: 0, totalAnswered: 44, family: "PSAT" });
    expect(r?.scaledScore).toBe(160);
    expect(r?.scaleMax).toBe(760);
  });

  it("PSAT 100% → 760 (PSAT ceiling)", () => {
    const r = computeSatSectionScore({ accuracyPercent: 100, totalAnswered: 44, family: "PSAT" });
    expect(r?.scaledScore).toBe(760);
  });

  it("rounds to the nearest 10 (CB convention)", () => {
    // 60% accuracy interpolates between 500 and 620 → 560
    const r = computeSatSectionScore({ accuracyPercent: 60, totalAnswered: 44, family: "SAT" });
    expect(r?.scaledScore).toBe(560);
    expect(r!.scaledScore % 10).toBe(0);
  });

  it("clamps out-of-range accuracy", () => {
    const high = computeSatSectionScore({ accuracyPercent: 150, totalAnswered: 44, family: "SAT" });
    expect(high?.scaledScore).toBe(800);
    const low = computeSatSectionScore({ accuracyPercent: -20, totalAnswered: 44, family: "SAT" });
    expect(low?.scaledScore).toBe(200);
  });

  it("monotonically non-decreasing across the curve", () => {
    let prev = -1;
    for (let acc = 0; acc <= 100; acc += 5) {
      const r = computeSatSectionScore({ accuracyPercent: acc, totalAnswered: 44, family: "SAT" });
      expect(r?.scaledScore).toBeGreaterThanOrEqual(prev);
      prev = r!.scaledScore;
    }
  });
});

describe("familyForCourse + isSatLikeCourse", () => {
  it("maps SAT_MATH + SAT_READING_WRITING → SAT", () => {
    expect(familyForCourse("SAT_MATH")).toBe("SAT");
    expect(familyForCourse("SAT_READING_WRITING")).toBe("SAT");
  });

  it("maps PSAT_MATH + PSAT_READING_WRITING → PSAT", () => {
    expect(familyForCourse("PSAT_MATH")).toBe("PSAT");
    expect(familyForCourse("PSAT_READING_WRITING")).toBe("PSAT");
  });

  it("returns null for non-SAT courses", () => {
    expect(familyForCourse("AP_CALCULUS_AB")).toBeNull();
    expect(familyForCourse("ACT_MATH")).toBeNull();
    expect(familyForCourse("CLEP_COLLEGE_ALGEBRA")).toBeNull();
  });

  it("isSatLikeCourse flags SAT + PSAT only", () => {
    expect(isSatLikeCourse("SAT_MATH")).toBe(true);
    expect(isSatLikeCourse("PSAT_MATH")).toBe(true);
    expect(isSatLikeCourse("AP_CALCULUS_AB")).toBe(false);
    expect(isSatLikeCourse("ACT_MATH")).toBe(false);
  });
});
