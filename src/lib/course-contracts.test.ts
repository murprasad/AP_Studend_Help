import { describe, it, expect } from "vitest";
import { getContract, getStimulusRequirement } from "./course-contracts";
import type { ApUnit } from "@prisma/client";

// Test fixture unit names — cast to ApUnit since these are illustrative
// (the contract logic doesn't read the enum value, only string-matches
// on topic + course family).
function unit(s: string): ApUnit { return s as ApUnit; }

describe("getContract — course-family defaults", () => {
  it("AP US History requires primary-source stimulus", () => {
    const c = getContract("AP_US_HISTORY", unit("AP_USH_UNIT_1"), "Colonial Foundations");
    expect(c?.requiresStimulus).toBe(true);
    expect(c?.requiredStimulusType).toBe("primarySource");
    expect(c?.expectedOptionCount).toBe(4);
  });

  it("AP World History requires primary-source stimulus", () => {
    const c = getContract("AP_WORLD_HISTORY", unit("UNIT_1_GLOBAL_TAPESTRY"), "Silk Road");
    expect(c?.requiresStimulus).toBe(true);
    expect(c?.requiredStimulusType).toBe("primarySource");
  });

  it("AP Statistics uses 5 options (not 4)", () => {
    const c = getContract("AP_STATISTICS", unit("AP_STATS_UNIT_1"), "Exploring Data");
    expect(c?.expectedOptionCount).toBe(5);
  });

  it("ACT Math uses 5 options", () => {
    const c = getContract("ACT_MATH", null, null);
    expect(c?.expectedOptionCount).toBe(5);
  });

  it("AP Physics 1 default does not require stimulus (permissive)", () => {
    const c = getContract("AP_PHYSICS_1", null, "general theory");
    // The default is permissive; topic-level rules promote it (next test)
    expect(c?.expectedOptionCount).toBe(4);
  });
});

describe("getContract — STEM visual topic patterns auto-promote", () => {
  it("AP Physics 1 + 'kinematics' topic requires diagram", () => {
    const c = getContract("AP_PHYSICS_1", unit("AP_PHYS1_UNIT_1"), "Kinematics in 1D");
    expect(c?.requiresStimulus).toBe(true);
    expect(c?.requiredStimulusType).toBe("diagram");
  });

  it("AP Calc AB + 'graph' topic requires graph", () => {
    const c = getContract("AP_CALCULUS_AB", unit("AP_CALC_AB_UNIT_2"), "Function graphs and limits");
    expect(c?.requiresStimulus).toBe(true);
    expect(c?.requiredStimulusType).toBe("graph");
  });

  it("AP Chemistry + 'titration' topic requires graph", () => {
    const c = getContract("AP_CHEMISTRY", unit("AP_CHEM_UNIT_8"), "Titration curves");
    expect(c?.requiresStimulus).toBe(true);
    expect(c?.requiredStimulusType).toBe("graph");
  });

  it("AP Biology + 'pedigree' topic requires diagram", () => {
    const c = getContract("AP_BIOLOGY", unit("AP_BIO_UNIT_5"), "Pedigree analysis");
    expect(c?.requiresStimulus).toBe(true);
    expect(c?.requiredStimulusType).toBe("diagram");
  });
});

describe("getContract — explicit topic overrides", () => {
  it("AP CSP + 'algorithm' topic requires diagram (pseudocode trace)", () => {
    const c = getContract("AP_COMPUTER_SCIENCE_PRINCIPLES", unit("AP_CSP_UNIT_3"), "Algorithms and pseudocode");
    expect(c?.requiresStimulus).toBe(true);
    expect(c?.requiredStimulusType).toBe("diagram");
  });

  it("AP Macroeconomics + 'supply' topic requires graph", () => {
    const c = getContract("AP_MACROECONOMICS", null, "Aggregate supply curve");
    expect(c?.requiresStimulus).toBe(true);
    expect(c?.requiredStimulusType).toBe("graph");
  });

  it("AP US Gov + 'constitution' topic requires primary source", () => {
    const c = getContract("AP_US_GOVERNMENT", null, "Constitutional foundations");
    expect(c?.requiresStimulus).toBe(true);
    expect(c?.requiredStimulusType).toBe("primarySource");
  });
});

describe("getContract — fallback behavior", () => {
  it("returns null for unregistered course (config error)", () => {
    // @ts-expect-error — purposely passing a value not in the enum
    const c = getContract("NOT_A_REAL_COURSE", null, null);
    expect(c).toBeNull();
  });

  it("returns valid contract when topic is null (uses default)", () => {
    const c = getContract("AP_PHYSICS_1", unit("AP_PHYS1_UNIT_1"), null);
    expect(c).toBeTruthy();
    expect(c?.expectedOptionCount).toBe(4);
  });
});

describe("getStimulusRequirement convenience", () => {
  it("history → required + primary source", () => {
    const r = getStimulusRequirement("AP_US_HISTORY", null, "any topic");
    expect(r.required).toBe(true);
    expect(r.type).toBe("primarySource");
  });

  it("permissive STEM topic → not required", () => {
    const r = getStimulusRequirement("AP_PHYSICS_1", null, "general theory");
    expect(r.required).toBe(false);
  });

  it("STEM kinematics → required + diagram (auto-promoted)", () => {
    const r = getStimulusRequirement("AP_PHYSICS_1", null, "Kinematics 1D motion");
    expect(r.required).toBe(true);
    expect(r.type).toBe("diagram");
  });
});
