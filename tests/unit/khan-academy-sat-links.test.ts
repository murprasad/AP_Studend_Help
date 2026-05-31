/**
 * 2026-05-31 — F12 KA-link helper coverage (#100 SAT=CB parity).
 *
 * The helper is referenced by the practice-page wrong-answer remediation
 * card. We test:
 *   - Every SAT_MATH + SAT_R&W unit resolves to a specific hub.
 *   - PSAT units route through the shared SAT KA map.
 *   - Non-SAT courses return null (no link rendered).
 *   - Missing unit falls back to the course-level KA hub.
 */
import { describe, it, expect } from "vitest";
import {
  khanAcademyLinkFor,
  hasKhanAcademyLinks,
} from "@/lib/khan-academy-sat-links";

describe("khanAcademyLinkFor — SAT/PSAT KA partnership links", () => {
  it("SAT_MATH Algebra unit → hub URL contains 'algebra'", () => {
    const r = khanAcademyLinkFor("SAT_MATH", "SAT_MATH_1_ALGEBRA");
    expect(r).not.toBeNull();
    expect(r!.url).toMatch(/algebra/);
    expect(r!.label.toLowerCase()).toMatch(/algebra/);
  });

  it("SAT_MATH Advanced Math unit → hub URL contains 'advanced-math'", () => {
    const r = khanAcademyLinkFor("SAT_MATH", "SAT_MATH_2_ADVANCED_MATH");
    expect(r!.url).toMatch(/advanced-math/);
  });

  it("SAT_MATH Problem-Solving unit → hub URL contains 'problem-solving'", () => {
    const r = khanAcademyLinkFor("SAT_MATH", "SAT_MATH_3_PROBLEM_SOLVING");
    expect(r!.url).toMatch(/problem-solving/);
  });

  it("SAT_MATH Geometry unit → hub URL contains 'geometry'", () => {
    const r = khanAcademyLinkFor("SAT_MATH", "SAT_MATH_4_GEOMETRY_TRIG");
    expect(r!.url).toMatch(/geometry/);
  });

  it("SAT_READING_WRITING — every unit resolves", () => {
    for (const unit of [
      "SAT_RW_1_CRAFT_STRUCTURE",
      "SAT_RW_2_INFO_IDEAS",
      "SAT_RW_3_STANDARD_ENGLISH",
      "SAT_RW_4_EXPRESSION_IDEAS",
    ]) {
      const r = khanAcademyLinkFor("SAT_READING_WRITING", unit);
      expect(r, `unit ${unit} should resolve`).not.toBeNull();
      expect(r!.url.startsWith("https://www.khanacademy.org/sat")).toBe(true);
    }
  });

  it("PSAT_MATH Algebra unit routes to the SAT KA Algebra hub", () => {
    const sat = khanAcademyLinkFor("SAT_MATH", "SAT_MATH_1_ALGEBRA");
    const psat = khanAcademyLinkFor("PSAT_MATH", "PSAT_MATH_1_ALGEBRA");
    expect(psat).not.toBeNull();
    expect(psat!.url).toBe(sat!.url);
  });

  it("PSAT_READING_WRITING — every unit routes via the shared map", () => {
    for (const unit of [
      "PSAT_RW_1_CRAFT_STRUCTURE",
      "PSAT_RW_2_INFO_IDEAS",
      "PSAT_RW_3_STANDARD_ENGLISH",
      "PSAT_RW_4_EXPRESSION_IDEAS",
    ]) {
      const r = khanAcademyLinkFor("PSAT_READING_WRITING", unit);
      expect(r, `psat unit ${unit} should resolve via shared map`).not.toBeNull();
    }
  });

  it("AP / ACT / CLEP courses return null (no KA SAT link applies)", () => {
    expect(khanAcademyLinkFor("AP_CALCULUS_AB", "AP_CALC_AB_1")).toBeNull();
    expect(khanAcademyLinkFor("ACT_MATH", "ACT_MATH_ALGEBRA")).toBeNull();
    expect(khanAcademyLinkFor("CLEP_COLLEGE_ALGEBRA", "CLEP_ALGEBRA_1_FOUNDATIONS")).toBeNull();
  });

  it("Missing/unknown unit on SAT_MATH falls back to course-level hub", () => {
    const r = khanAcademyLinkFor("SAT_MATH", null);
    expect(r).not.toBeNull();
    expect(r!.url).toMatch(/khanacademy\.org\/sat/);
  });

  it("Unknown unit string on a SAT course also falls back gracefully", () => {
    const r = khanAcademyLinkFor("SAT_MATH", "GARBAGE_UNIT_KEY");
    expect(r).not.toBeNull();
    expect(r!.url).toMatch(/khanacademy\.org\/sat/);
  });
});

describe("hasKhanAcademyLinks — flag for the UI", () => {
  it("true for SAT + PSAT courses", () => {
    expect(hasKhanAcademyLinks("SAT_MATH")).toBe(true);
    expect(hasKhanAcademyLinks("SAT_READING_WRITING")).toBe(true);
    expect(hasKhanAcademyLinks("PSAT_MATH")).toBe(true);
    expect(hasKhanAcademyLinks("PSAT_READING_WRITING")).toBe(true);
  });

  it("false for everything else", () => {
    expect(hasKhanAcademyLinks("AP_CALCULUS_AB")).toBe(false);
    expect(hasKhanAcademyLinks("ACT_MATH")).toBe(false);
    expect(hasKhanAcademyLinks("CLEP_COLLEGE_ALGEBRA")).toBe(false);
    expect(hasKhanAcademyLinks(null)).toBe(false);
    expect(hasKhanAcademyLinks(undefined)).toBe(false);
  });
});
