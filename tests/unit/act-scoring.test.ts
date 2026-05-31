/**
 * 2026-05-31 — ACT scoring module tests (#103 A4 / SN=ACT parity).
 */
import { describe, it, expect } from "vitest";
import {
  computeActSectionScore,
  computeActComposite,
  sectionForCourse,
  isActCourse,
} from "@/lib/act-scoring";

describe("computeActSectionScore — 1-36 per section", () => {
  it("returns null when sample size is too small (<10)", () => {
    expect(
      computeActSectionScore({ accuracyPercent: 100, totalAnswered: 5, section: "MATH" }),
    ).toBeNull();
  });

  it("0% English → ~1 (the floor)", () => {
    const r = computeActSectionScore({ accuracyPercent: 0, totalAnswered: 50, section: "ENGLISH" });
    expect(r?.scaledScore).toBe(1);
    expect(r?.scaleMin).toBe(1);
    expect(r?.scaleMax).toBe(36);
  });

  it("100% English → 36 (the ceiling)", () => {
    const r = computeActSectionScore({ accuracyPercent: 100, totalAnswered: 50, section: "ENGLISH" });
    expect(r?.scaledScore).toBe(36);
  });

  it("50% Math → ~22 (the central anchor)", () => {
    const r = computeActSectionScore({ accuracyPercent: 50, totalAnswered: 45, section: "MATH" });
    expect(r?.scaledScore).toBe(22);
  });

  it("70% Reading → ~27", () => {
    const r = computeActSectionScore({ accuracyPercent: 70, totalAnswered: 36, section: "READING" });
    expect(r?.scaledScore).toBe(27);
  });

  it("85% Science → ~30", () => {
    const r = computeActSectionScore({ accuracyPercent: 85, totalAnswered: 40, section: "SCIENCE" });
    expect(r?.scaledScore).toBe(30);
  });

  it("clamps out-of-range accuracy", () => {
    const high = computeActSectionScore({ accuracyPercent: 150, totalAnswered: 45, section: "MATH" });
    expect(high?.scaledScore).toBe(36);
    const low = computeActSectionScore({ accuracyPercent: -20, totalAnswered: 45, section: "MATH" });
    expect(low?.scaledScore).toBe(1);
  });

  it("monotonically non-decreasing across the curve for every section", () => {
    for (const section of ["ENGLISH", "MATH", "READING", "SCIENCE"] as const) {
      let prev = -1;
      for (let acc = 0; acc <= 100; acc += 5) {
        const r = computeActSectionScore({ accuracyPercent: acc, totalAnswered: 50, section });
        expect(r?.scaledScore).toBeGreaterThanOrEqual(prev);
        prev = r!.scaledScore;
      }
    }
  });
});

describe("computeActComposite — Enhanced ACT 2025 rules", () => {
  it("Composite = round(avg(Eng, Math, Read)); Science excluded", () => {
    const r = computeActComposite({ english: 28, math: 26, reading: 30, science: null });
    expect(r.composite).toBe(28); // (28+26+30)/3 = 28
    expect(r.stem).toBeNull();
    expect(r.includesScience).toBe(false);
  });

  it("STEM = round(avg(Math, Science)) only when both present", () => {
    const r = computeActComposite({ english: 24, math: 30, reading: 25, science: 28 });
    expect(r.composite).toBe(26); // (24+30+25)/3 = 26.33 → 26
    expect(r.stem).toBe(29);      // (30+28)/2 = 29
    expect(r.includesScience).toBe(true);
  });

  it("returns null composite when any Core section is missing", () => {
    const noEng = computeActComposite({ english: null, math: 24, reading: 26, science: 30 });
    expect(noEng.composite).toBeNull();
    expect(noEng.stem).toBe(27); // STEM only needs Math + Science
  });

  it("rounds .5 up (away from zero) per ACT scoring spec", () => {
    // 23 + 24 + 24 = 71 / 3 = 23.666 → 24
    const a = computeActComposite({ english: 23, math: 24, reading: 24, science: null });
    expect(a.composite).toBe(24);
    // 24 + 25 = 49 / 2 = 24.5 → 25 (JS Math.round rounds .5 up for positives)
    const b = computeActComposite({ english: null, math: 24, reading: null, science: 25 });
    expect(b.stem).toBe(25);
  });

  it("includesScience reflects whether Science was taken", () => {
    expect(computeActComposite({ english: 20, math: 20, reading: 20, science: null }).includesScience).toBe(false);
    expect(computeActComposite({ english: 20, math: 20, reading: 20, science: 20 }).includesScience).toBe(true);
  });
});

describe("sectionForCourse + isActCourse", () => {
  it("maps each ACT course to its section", () => {
    expect(sectionForCourse("ACT_ENGLISH")).toBe("ENGLISH");
    expect(sectionForCourse("ACT_MATH")).toBe("MATH");
    expect(sectionForCourse("ACT_READING")).toBe("READING");
    expect(sectionForCourse("ACT_SCIENCE")).toBe("SCIENCE");
  });

  it("returns null for non-ACT courses", () => {
    expect(sectionForCourse("AP_CALCULUS_AB")).toBeNull();
    expect(sectionForCourse("SAT_MATH")).toBeNull();
    expect(sectionForCourse("CLEP_COLLEGE_ALGEBRA")).toBeNull();
  });

  it("isActCourse flags ACT_ courses only", () => {
    expect(isActCourse("ACT_MATH")).toBe(true);
    expect(isActCourse("ACT_ENGLISH")).toBe(true);
    expect(isActCourse("SAT_MATH")).toBe(false);
    expect(isActCourse("AP_CALCULUS_AB")).toBe(false);
    expect(isActCourse(null)).toBe(false);
    expect(isActCourse(undefined)).toBe(false);
  });
});
