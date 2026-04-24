import { describe, it, expect } from "vitest";
import { normalizeMarkdownTables } from "../../src/lib/markdown-helpers";

/**
 * Regression guard for B7 (2026-04-24).
 *
 * AI-generated questions sometimes emit markdown tables on a single line —
 *   "| Given | Value | |-------|------| | Mass | 4.0 kg | | Force | 12 N |"
 * remark-gfm can't parse that, so it rendered as literal pipes + dashes in
 * the UI. `normalizeMarkdownTables` splits these into proper multi-line
 * markdown, which remark-gfm then renders as a real HTML table.
 *
 * This test locks the behavior so the render chain can't silently regress.
 */

describe("normalizeMarkdownTables", () => {
  it("passes through regular multi-line tables unchanged", () => {
    const input = `| col1 | col2 |\n|------|------|\n| a | b |`;
    expect(normalizeMarkdownTables(input)).toBe(input);
  });

  it("splits single-line LLM-collapsed tables into multi-line form", () => {
    const input = `| Given | Value (units) | |-------|---------------| | Mass of box | 4.0 kg | | Displacement | 6.0 m | | Applied force | 12 N | | Surface | Frictionless |`;
    const out = normalizeMarkdownTables(input);
    expect(out.split("\n").length).toBeGreaterThan(3);
    // Separator row preserved
    expect(out).toMatch(/\|\s*-+\s*\|\s*-+\s*\|/);
    // Original data cells present
    expect(out).toContain("Mass of box");
    expect(out).toContain("4.0 kg");
    expect(out).toContain("Frictionless");
  });

  it("leaves non-table content alone", () => {
    const input = "A 4.0 kg box is pushed 6.0 m across a horizontal frictionless surface.";
    expect(normalizeMarkdownTables(input)).toBe(input);
  });

  it("handles mixed content (paragraph + collapsed table)", () => {
    const input =
      "Given the data below, answer:\n| Col A | Col B | |------|------| | 1 | 2 |";
    const out = normalizeMarkdownTables(input);
    expect(out).toContain("Given the data below");
    expect(out.split("\n").length).toBeGreaterThan(1);
  });

  it("doesn't crash on empty string", () => {
    expect(normalizeMarkdownTables("")).toBe("");
  });

  it("doesn't crash on table-like text without separator", () => {
    const input = "| Just | pipes | without | dashes |";
    // Without a separator row, this isn't a table — pass through unchanged
    expect(normalizeMarkdownTables(input)).toBe(input);
  });
});
