import { describe, it, expect } from "vitest";
import {
  computeSatSectionScore,
  familyForCourse,
  isSatLikeCourse,
  inferModule2Tier,
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

describe("Module-2 tier ceiling — F8 (#100) adaptive equating", () => {
  it("no module2Tier → no cap, full curve applies", () => {
    const r = computeSatSectionScore({ accuracyPercent: 100, totalAnswered: 44, family: "SAT" });
    expect(r?.scaledScore).toBe(800);
  });

  it("HARD M2 → full 200-800 ceiling unlocked", () => {
    const r = computeSatSectionScore({ accuracyPercent: 100, totalAnswered: 44, family: "SAT", module2Tier: "HARD" });
    expect(r?.scaledScore).toBe(800);
  });

  it("EASY M2 + 100% accuracy still caps at ~590 (CB equating)", () => {
    const r = computeSatSectionScore({ accuracyPercent: 100, totalAnswered: 44, family: "SAT", module2Tier: "EASY" });
    expect(r?.scaledScore).toBe(590);
  });

  it("MEDIUM M2 + 100% accuracy caps at ~650", () => {
    const r = computeSatSectionScore({ accuracyPercent: 100, totalAnswered: 44, family: "SAT", module2Tier: "MEDIUM" });
    expect(r?.scaledScore).toBe(650);
  });

  it("EASY M2 + 50% accuracy still gives the raw curve number (curve already below cap)", () => {
    // 50% interpolates to ~500 which is under the EASY cap of 590
    const r = computeSatSectionScore({ accuracyPercent: 50, totalAnswered: 44, family: "SAT", module2Tier: "EASY" });
    expect(r?.scaledScore).toBe(500);
  });

  it("PSAT EASY M2 + 100% accuracy caps at 560", () => {
    const r = computeSatSectionScore({ accuracyPercent: 100, totalAnswered: 44, family: "PSAT", module2Tier: "EASY" });
    expect(r?.scaledScore).toBe(560);
  });

  it("PSAT MEDIUM M2 + 100% accuracy caps at 620", () => {
    const r = computeSatSectionScore({ accuracyPercent: 100, totalAnswered: 44, family: "PSAT", module2Tier: "MEDIUM" });
    expect(r?.scaledScore).toBe(620);
  });

  it("PSAT HARD M2 unlocks full 760 ceiling", () => {
    const r = computeSatSectionScore({ accuracyPercent: 100, totalAnswered: 44, family: "PSAT", module2Tier: "HARD" });
    expect(r?.scaledScore).toBe(760);
  });
});

describe("inferModule2Tier — F8 CB-routing retroactive helper", () => {
  function mk(corrects: boolean[]) {
    return corrects.map((c) => ({ isCorrect: c }));
  }

  it("returns null when sample too small (<10)", () => {
    expect(inferModule2Tier(mk([true, true, true, true]))).toBeNull();
  });

  it("M1 ≥ 75% → HARD tier", () => {
    // 44 Qs, M1 = first 22, 18 correct (~82%) → HARD
    const seq = [...Array(18).fill(true), ...Array(4).fill(false), ...Array(22).fill(false)];
    expect(inferModule2Tier(mk(seq))).toBe("HARD");
  });

  it("M1 50–74% → MEDIUM tier", () => {
    // 44 Qs, M1 first 22, 13 correct (~59%) → MEDIUM
    const seq = [...Array(13).fill(true), ...Array(9).fill(false), ...Array(22).fill(false)];
    expect(inferModule2Tier(mk(seq))).toBe("MEDIUM");
  });

  it("M1 < 50% → EASY tier", () => {
    // 44 Qs, M1 first 22, 8 correct (~36%) → EASY
    const seq = [...Array(8).fill(true), ...Array(14).fill(false), ...Array(22).fill(false)];
    expect(inferModule2Tier(mk(seq))).toBe("EASY");
  });

  it("M2 performance does not affect tier (tier is decided by M1 only)", () => {
    // M1 = 8/22 (EASY routing), then M2 = 22/22 perfect doesn't promote.
    const seq = [...Array(8).fill(true), ...Array(14).fill(false), ...Array(22).fill(true)];
    expect(inferModule2Tier(mk(seq))).toBe("EASY");
  });

  it("exact 50% on M1 → MEDIUM (boundary)", () => {
    const seq = [...Array(11).fill(true), ...Array(11).fill(false), ...Array(22).fill(true)];
    expect(inferModule2Tier(mk(seq))).toBe("MEDIUM");
  });

  it("exact 75% on M1 → HARD (boundary)", () => {
    const seq = [
      ...Array(15).fill(true),
      ...Array(5).fill(false),
      ...Array(20).fill(false),
    ]; // 15/20 = 75%, total 40 to keep even split
    expect(inferModule2Tier(mk(seq))).toBe("HARD");
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
