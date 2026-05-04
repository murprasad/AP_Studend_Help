/**
 * src/lib/figure-validator.ts — deterministic gate that checks the
 * stimulus actually contains a renderable figure when one is required
 * (graph, diagram, table, free-body diagram, image).
 *
 * Companion to stimulus-validator.ts: stimulus-validator checks that
 * SOMETHING is in the stimulus field; figure-validator checks that
 * what's there is the RIGHT THING (rendered, not described).
 *
 * The audit found Calc AB / Physics 1 questions that said "Based on
 * the graph above" with stimulus = "[Graph showing y = sin(x) from 0
 * to 2π]" — a textual description of a graph, not a graph. CB always
 * provides the actual figure.
 *
 * Detection strategy: a real figure stimulus contains AT LEAST ONE of:
 *  - Mermaid code block (```mermaid ... ```)
 *  - Vega-Lite / Vega-embed JSON (```vega-lite ... ```)
 *  - Image URL (http(s)://... ending in image extension)
 *  - Markdown image (![alt](url))
 *  - LaTeX/KaTeX math expression with a plotted command (\plot, \draw)
 *  - HTML <svg>/<img> tag
 *  - Pre-formatted table (markdown table syntax with | and ---)
 *  - ASCII diagram (multiple lines with consistent column alignment,
 *    minimum 3 lines tall)
 *
 * If the stimulus is JUST a description like "[Graph: ...]" or "Imagine
 * a graph that ..." or "The figure shows ...", and no actual figure
 * markup is present, we reject.
 *
 * Pure function, <2ms per question, no LLM call.
 */

import type { StimulusType } from "./course-contracts";

const MERMAID_BLOCK = /```mermaid[\s\S]+?```/;
const VEGA_BLOCK = /```vega(?:-lite)?[\s\S]+?```/;
const MARKDOWN_IMAGE = /!\[[^\]]*\]\([^)]+\)/;
const HTML_SVG_OR_IMG = /<(svg|img)\b[^>]*>/i;
const IMAGE_URL = /https?:\/\/\S+\.(?:png|jpe?g|gif|svg|webp)\b/i;
const MARKDOWN_TABLE = /\|.+\|\s*\n\s*\|[-:|\s]+\|/;
const LATEX_PLOT = /\\(plot|draw|tikzpicture|graph|begin\{tikzpicture\}|begin\{axis\})/;
const ASCII_DIAGRAM_HINT =
  /(\n[\s\-=+|*<>·•]{3,}.*){3,}/m; // 3+ consecutive lines with diagram-y characters

const FAUX_FIGURE_TELLS = [
  /^\s*\[graph[:\s]/i,           // "[Graph: y = sin(x) from 0 to 2π]"
  /^\s*\[figure[:\s]/i,
  /^\s*\[diagram[:\s]/i,
  /^\s*\[chart[:\s]/i,
  /^\s*\[table[:\s].*\]\s*$/i,   // single-line "[Table: ...]"
  /^\s*the\s+(graph|figure|diagram|chart)\s+(shows|displays|depicts)/i,
  /^\s*imagine\s+(a|the)\s+(graph|figure|diagram|chart|plot)/i,
  /^\s*picture\s+(a|the)\s+(graph|figure|diagram|chart|plot)/i,
  /^\s*\(graph\s+not\s+shown\)/i, // explicit cop-out
];

/**
 * Does the stimulus contain a real (renderable) figure?
 */
export function hasRenderableFigure(stimulus: string): boolean {
  if (!stimulus) return false;
  return (
    MERMAID_BLOCK.test(stimulus) ||
    VEGA_BLOCK.test(stimulus) ||
    MARKDOWN_IMAGE.test(stimulus) ||
    HTML_SVG_OR_IMG.test(stimulus) ||
    IMAGE_URL.test(stimulus) ||
    MARKDOWN_TABLE.test(stimulus) ||
    LATEX_PLOT.test(stimulus) ||
    ASCII_DIAGRAM_HINT.test(stimulus)
  );
}

/**
 * Does the stimulus look like a faux-figure (a textual description
 * standing in for a rendered figure)?
 */
export function isFauxFigure(stimulus: string): boolean {
  if (!stimulus) return false;
  return FAUX_FIGURE_TELLS.some((re) => re.test(stimulus));
}

/**
 * Validate that the stimulus has a real figure when one is required.
 * Image stimuli (stimulusImageUrl set on the question) bypass this
 * check — the renderable figure lives in the URL, not the text field.
 *
 * Returns null on pass, error string on fail.
 */
export function validateFigure(
  stimulus: string | null | undefined,
  stimulusType: StimulusType | null | undefined,
  stimulusImageUrl?: string | null,
): string | null {
  // If the question has a stored image URL, that's the figure — pass
  // through. The render-time check (does the URL load?) lives at the
  // UI/network layer, not here.
  if (stimulusImageUrl && stimulusImageUrl.trim().length > 0) return null;

  // Only enforce for figure-required types.
  if (!stimulusType || !["graph", "diagram", "table", "image"].includes(stimulusType)) {
    return null;
  }

  // Defensive: Flash sometimes outputs non-string stimulus (object, number, bool).
  // Coerce to string before processing — same fix pattern as stimulus-validator.ts.
  const s = (typeof stimulus === "string" ? stimulus : (stimulus ? JSON.stringify(stimulus) : "")).trim();
  if (s.length === 0) {
    return `${stimulusType} stimulus is empty — required for this question type`;
  }

  if (isFauxFigure(s)) {
    return `Stimulus is a textual description of a ${stimulusType}, not a rendered figure. Provide actual Mermaid/Vega/SVG/markdown-image markup.`;
  }

  if (!hasRenderableFigure(s)) {
    return `Stimulus does not contain a renderable ${stimulusType}. Expected one of: \`\`\`mermaid block, \`\`\`vega-lite block, markdown image, HTML <svg>/<img>, image URL, markdown table, or LaTeX plot command.`;
  }

  return null;
}
