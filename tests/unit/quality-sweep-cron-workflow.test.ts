/**
 * REQ-145 — Daily quality-sweep cron workflow file shape.
 *
 * Asserts .github/workflows/quality-sweep.yml is well-formed and locked
 * to the canonical schedule (09:00 UTC = 4 AM ET, off-peak). Lives in
 * tests/unit/ (not tests/e2e/) so it runs in vitest without needing a
 * browser or live deploy.
 *
 * Reference: docs/COMPREHENSIVE_TEST_PLAN.md §L6
 *            .github/workflows/quality-sweep.yml
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const WORKFLOW = resolve(__dirname, "..", "..", ".github", "workflows", "quality-sweep.yml");

describe("REQ-145 — quality-sweep cron workflow file", () => {
  it("L6-P1: workflow file exists", () => {
    expect(existsSync(WORKFLOW), `${WORKFLOW} should exist`).toBe(true);
  });

  it("L6-P1 / L6-N1: cron schedule is locked to '0 9 * * *' (09:00 UTC)", () => {
    const src = readFileSync(WORKFLOW, "utf-8");
    expect(src).toMatch(/cron:\s*["']0\s+9\s+\*\s+\*\s+\*["']/);
  });

  it("L6-P2: uses actions/setup-node@v4 with node-version: '20'", () => {
    const src = readFileSync(WORKFLOW, "utf-8");
    expect(src).toMatch(/actions\/setup-node@v4/);
    expect(src).toMatch(/node-version:\s*["']20["']/);
  });

  it("L6-P3: required secrets DATABASE_URL + ANTHROPIC_API_KEY + GROQ_API_KEY are injected", () => {
    const src = readFileSync(WORKFLOW, "utf-8");
    expect(src).toMatch(/DATABASE_URL:\s*\$\{\{\s*secrets\.DATABASE_URL\s*\}\}/);
    expect(src).toMatch(/ANTHROPIC_API_KEY:\s*\$\{\{\s*secrets\.ANTHROPIC_API_KEY\s*\}\}/);
    expect(src).toMatch(/GROQ_API_KEY:\s*\$\{\{\s*secrets\.GROQ_API_KEY\s*\}\}/);
  });

  it("L6-N2: timeout-minutes ≤ 30 (prevents runaway billing)", () => {
    const src = readFileSync(WORKFLOW, "utf-8");
    const m = src.match(/timeout-minutes:\s*(\d+)/);
    expect(m, "timeout-minutes must be set").not.toBeNull();
    const minutes = parseInt(m![1], 10);
    expect(minutes).toBeGreaterThan(0);
    expect(minutes).toBeLessThanOrEqual(30);
  });

  it("L6-N3: npm ci preserves --legacy-peer-deps flag", () => {
    const src = readFileSync(WORKFLOW, "utf-8");
    expect(src).toMatch(/npm\s+ci.*--legacy-peer-deps/);
  });

  it("L6-N8: workflow_dispatch manual trigger present", () => {
    const src = readFileSync(WORKFLOW, "utf-8");
    expect(src).toMatch(/workflow_dispatch/);
  });

  it("on-failure annotation step present", () => {
    const src = readFileSync(WORKFLOW, "utf-8");
    expect(src).toMatch(/if:\s*failure\(\)/);
    expect(src).toMatch(/::warning::/);
  });

  it("runs the canonical sweep entry point (`npm run quality:sweep`)", () => {
    const src = readFileSync(WORKFLOW, "utf-8");
    expect(src).toMatch(/npm\s+run\s+quality:sweep/);
  });
});
