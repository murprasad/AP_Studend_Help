import { describe, it, expect } from "vitest";
import { hasRenderableFigure, isFauxFigure, validateFigure } from "./figure-validator";

describe("hasRenderableFigure", () => {
  it("recognizes a Mermaid block", () => {
    const s = "```mermaid\ngraph LR\nA-->B\n```";
    expect(hasRenderableFigure(s)).toBe(true);
  });

  it("recognizes a Vega-Lite block", () => {
    const s = '```vega-lite\n{"mark":"bar","data":{"values":[1,2,3]}}\n```';
    expect(hasRenderableFigure(s)).toBe(true);
  });

  it("recognizes a markdown image", () => {
    expect(hasRenderableFigure("![velocity-graph](https://example.com/img.png)")).toBe(true);
  });

  it("recognizes a markdown table", () => {
    const s = "| t | v |\n|---|---|\n| 0 | 0 |\n| 1 | 5 |";
    expect(hasRenderableFigure(s)).toBe(true);
  });

  it("recognizes an HTML <svg>", () => {
    expect(hasRenderableFigure('<svg width="100" height="100"><rect/></svg>')).toBe(true);
  });

  it("recognizes an image URL", () => {
    expect(hasRenderableFigure("Refer to https://example.com/diagram.png for the setup.")).toBe(true);
  });

  it("rejects a plain text description", () => {
    expect(hasRenderableFigure("[Graph: y = sin(x) from 0 to 2π]")).toBe(false);
  });

  it("rejects empty stimulus", () => {
    expect(hasRenderableFigure("")).toBe(false);
  });
});

describe("isFauxFigure", () => {
  it("flags '[Graph: ...]' description", () => {
    expect(isFauxFigure("[Graph: position vs time, parabola opening up]")).toBe(true);
  });

  it("flags 'The graph shows...' description", () => {
    expect(isFauxFigure("The graph shows a sinusoidal curve with amplitude 3.")).toBe(true);
  });

  it("flags 'Imagine a diagram...'", () => {
    expect(isFauxFigure("Imagine a diagram of a free-body with two arrows.")).toBe(true);
  });

  it("flags '(graph not shown)'", () => {
    expect(isFauxFigure("(Graph not shown) Determine the slope.")).toBe(true);
  });

  it("does NOT flag a real Mermaid block", () => {
    expect(isFauxFigure("```mermaid\ngraph LR\nA-->B\n```")).toBe(false);
  });

  it("does NOT flag a real markdown image", () => {
    expect(isFauxFigure("![diagram](https://example.com/d.png)")).toBe(false);
  });
});

describe("validateFigure", () => {
  it("approves question with stimulusImageUrl set (bypass check)", () => {
    expect(validateFigure(null, "graph", "https://wiki.com/img.png")).toBeNull();
    expect(validateFigure("[Graph: ...]", "graph", "https://wiki.com/img.png")).toBeNull();
  });

  it("approves graph stimulusType with real Mermaid stimulus", () => {
    const s = "```mermaid\ngraph LR\nA-->B\n```";
    expect(validateFigure(s, "graph")).toBeNull();
  });

  it("approves table stimulusType with markdown table", () => {
    const s = "| year | pop |\n|---|---|\n| 2000 | 100 |";
    expect(validateFigure(s, "table")).toBeNull();
  });

  it("flags graph required but stimulus is plain description", () => {
    const result = validateFigure("[Graph: y vs t, line through origin]", "graph");
    expect(result).toContain("textual description");
  });

  it("flags graph required but stimulus is empty", () => {
    expect(validateFigure("", "graph")).toContain("empty");
  });

  it("flags diagram required but stimulus has no figure markup", () => {
    const result = validateFigure(
      "A 5kg block sits on a frictionless surface. Forces act on it.",
      "diagram",
    );
    expect(result).toContain("does not contain a renderable");
  });

  it("approves when stimulusType is primarySource (figure-validator skips)", () => {
    // Primary-source stimuli are checked by stimulus-validator and
    // source-attribution-validator; figure-validator is a no-op for them.
    expect(validateFigure('"All men are equal" — Jefferson, 1776', "primarySource")).toBeNull();
  });

  it("approves when stimulusType is null/undefined (no figure required)", () => {
    expect(validateFigure("Some stimulus text", null)).toBeNull();
    expect(validateFigure("Some stimulus text", undefined)).toBeNull();
  });
});
