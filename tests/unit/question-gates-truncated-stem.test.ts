/**
 * REQ-143 — TRUNCATED-STEM gate.
 *
 * Catches stems like "Factor the expression." (no math object) which are
 * the signature of a generation defect where the LaTeX payload was dropped.
 *
 * Reference: docs/COMPREHENSIVE_TEST_PLAN.md §L4
 *            scripts/lib/_question-gates.mjs:396-415
 */

import { describe, it, expect } from "vitest";

// Note: scripts/lib/_question-gates.mjs is plain ESM. We import dynamically
// because the file is outside src/. If vitest's path resolver complains,
// switch to absolute file URL import in a beforeAll hook.
let runDeterministicGates: (q: unknown) => { ok: boolean; gate?: string; reason?: string };

const loadGates = async () => {
  if (!runDeterministicGates) {
    const mod = await import("../../scripts/lib/_question-gates.mjs");
    runDeterministicGates = mod.runDeterministicGates;
  }
};

// Note: explanation must be ≥ 40 chars to clear the structure gate.
const baseQ = (overrides: Record<string, unknown> = {}) => ({
  course: "AP_CALCULUS_AB",
  questionText: "What is the integral of 2x from 0 to 3?",
  stimulus: null,
  options: ["A) 6", "B) 9", "C) 12", "D) 15"],
  correctAnswer: "B",
  explanation:
    "The integral of 2x from 0 to 3 equals x squared evaluated from 0 to 3, which gives 9 minus 0, so the answer is 9.",
  isApproved: true,
  ...overrides,
});

describe("REQ-143 — stem-truncated-math gate", () => {
  it("L4-P1: accepts stem with math object — 'Factor x^2 - 4.'", async () => {
    await loadGates();
    const r = runDeterministicGates(baseQ({ questionText: "Factor x^2 - 4." }));
    expect(r.gate, JSON.stringify(r)).not.toBe("stem-truncated-math");
  });

  it("L4-P2: accepts 'Solve for x in 2x + 3 = 11.'", async () => {
    await loadGates();
    const r = runDeterministicGates(baseQ({ questionText: "Solve for x in 2x + 3 = 11." }));
    expect(r.gate).not.toBe("stem-truncated-math");
  });

  it("L4-P3: accepts integral notation stem", async () => {
    await loadGates();
    const r = runDeterministicGates(baseQ({ questionText: "Evaluate the integral from 0 to 1 of x^2 dx." }));
    expect(r.gate).not.toBe("stem-truncated-math");
  });

  // Negative cases — these MUST fire the gate.
  const truncatedSamples: Array<[string, string]> = [
    ["L4-N1", "Factor the expression."],
    ["L4-N2", "Solve the equation."],
    ["L4-N3", "Simplify the expression."],
    ["L4-N4", "Evaluate the function."],
    ["L4-N5", "Compute the value."],
    ["L4-N6", "Differentiate the function."],
    ["L4-N7", "Integrate the expression."],
    ["L4-N8", "Expand the polynomial."],
  ];

  for (const [id, stem] of truncatedSamples) {
    it(`${id}: rejects truncated stem — "${stem}"`, async () => {
      await loadGates();
      const r = runDeterministicGates(baseQ({ questionText: stem }));
      expect(r.ok, JSON.stringify(r)).toBe(false);
      expect(r.gate).toBe("stem-truncated-math");
    });
  }

  it("L4-N9: rejects single-word 'Factor.' stem", async () => {
    await loadGates();
    const r = runDeterministicGates(baseQ({ questionText: "Factor." }));
    // Single-word factor may be caught either by stem-truncated-math or a
    // generic shape gate. Either way, it must not pass.
    expect(r.ok).toBe(false);
  });
});
