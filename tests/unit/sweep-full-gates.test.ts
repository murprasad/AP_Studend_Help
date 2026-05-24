/**
 * REQ-140 — Strict-mode full-gates sweep behavior contract.
 *
 * The sweep script is a top-level executable .mjs (runs DB writes on import),
 * so we don't import it directly. Instead we assert the contract via file
 * content (the rules that must be present) + simulate the strict-mode
 * decision logic in-process.
 *
 * Reference: docs/COMPREHENSIVE_TEST_PLAN.md §L1
 *            scripts/_sweep-full-gates.mjs
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SWEEP_PATH = resolve(__dirname, "..", "..", "scripts", "_sweep-full-gates.mjs");

describe("REQ-140 — strict-mode sweep contract", () => {
  it("L1-P1: STRICT_ALL defaults to true (NOT high-precision-only)", () => {
    const src = readFileSync(SWEEP_PATH, "utf-8");
    // The strict-mode default is defined as !args["high-precision-only"].
    // Assert the canonical line is present so a refactor can't silently
    // flip the default back to high-precision-only.
    expect(src).toMatch(/const\s+STRICT_ALL\s*=\s*!args\[\s*["']high-precision-only["']\s*\]/);
  });

  it("L1-P2: --high-precision-only flag is recognized as the opt-out", () => {
    const src = readFileSync(SWEEP_PATH, "utf-8");
    expect(src).toMatch(/high-precision-only/);
  });

  it("L1-P3: dry-run (no --apply) does not call UPDATE", () => {
    const src = readFileSync(SWEEP_PATH, "utf-8");
    // The early-exit guard must be present before the UPDATE block.
    expect(src).toMatch(/if\s*\(\s*!APPLY\s*\)\s*\{/);
    const dryRunIdx = src.indexOf("if (!APPLY)");
    const updateIdx = src.indexOf("UPDATE questions SET");
    expect(dryRunIdx).toBeGreaterThan(-1);
    expect(updateIdx).toBeGreaterThan(-1);
    expect(dryRunIdx, "dry-run guard must precede the UPDATE call").toBeLessThan(updateIdx);
  });

  it("HIGH_PRECISION_GATES set is non-empty and contains the canonical entries", () => {
    const src = readFileSync(SWEEP_PATH, "utf-8");
    const m = src.match(/const\s+HIGH_PRECISION_GATES\s*=\s*new\s+Set\(\s*\[([\s\S]*?)\]\s*\)/);
    expect(m, "HIGH_PRECISION_GATES set must be defined").not.toBeNull();
    const block = m![1];
    // A handful of canonical gates that must remain in the high-precision tier.
    for (const gate of [
      "options-duplicate",
      "options-count",
      "correctAnswer-index",
      "explanation-letter-mismatch",
      "confession-phrase",
    ]) {
      expect(block, `gate "${gate}" must be in HIGH_PRECISION_GATES`).toContain(gate);
    }
  });

  it("simulates strict-mode decision: STRICT_ALL=true unapproves every failure", () => {
    // Mirror the decision logic: `STRICT_ALL || HIGH_PRECISION_GATES.has(gate)`
    const HIGH_PRECISION_GATES = new Set([
      "options-duplicate",
      "options-count",
      "correctAnswer-index",
      "confession-phrase",
    ]);
    const fixtures = [
      { gate: "options-duplicate" },
      { gate: "stem-truncated-math" },
      { gate: "distractor-magnitude-absurd" },
      { gate: "hint-in-option" },
    ];
    const STRICT_ALL = true;
    const decisions = fixtures.map((f) => (STRICT_ALL || HIGH_PRECISION_GATES.has(f.gate)));
    expect(decisions.every((d) => d === true)).toBe(true);
  });

  it("simulates --high-precision-only: only canonical gates unapproved", () => {
    const HIGH_PRECISION_GATES = new Set([
      "options-duplicate",
      "options-count",
      "correctAnswer-index",
      "confession-phrase",
    ]);
    const fixtures = [
      { gate: "options-duplicate", expected: true },
      { gate: "stem-truncated-math", expected: false },
      { gate: "distractor-magnitude-absurd", expected: false },
      { gate: "confession-phrase", expected: true },
    ];
    const STRICT_ALL = false;
    for (const f of fixtures) {
      const shouldUnapprove = STRICT_ALL || HIGH_PRECISION_GATES.has(f.gate);
      expect(shouldUnapprove, `gate=${f.gate}`).toBe(f.expected);
    }
  });
});
