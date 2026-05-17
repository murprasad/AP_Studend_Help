/**
 * src/lib/render-hazard-validator.ts — deterministic gates that catch
 * render-time bugs before any LLM judge is called.
 *
 * Two bug classes that have shipped to real students this week:
 *
 * 1. Unescaped $ for currency (caught 2026-05-12 — user's screenshot):
 *    Question text with multiple bare "$" (e.g., "$75 ... $60 ... $50")
 *    is interpreted by remark-math as inline LaTeX math, rendering as
 *    italic Computer Modern with whitespace collapsed. Currency MUST be
 *    written as "\\$75" (escaped) or "75 dollars".
 *
 * 2. Phantom stimulus (caught 2026-05-12 — Klexevork's Q2):
 *    Stem references "the figure shown", "the graph below", "the energy
 *    profile" etc, BUT the stimulus field is empty/null. Student sees a
 *    reference to something that doesn't exist.
 *
 * Both checks are deterministic (regex), <1ms per question, fail-closed
 * with explicit reasons. Wired BEFORE the LLM ensemble in the gen
 * pipeline (saves ~25s of cascade time and Pollinations rate-limit
 * pressure for the obvious-bad class).
 */

const PHANTOM_STIMULUS_PATTERNS = [
  /\b(?:the|a|an)\s+(?:above|following|below|attached)\s+(?:figure|graph|chart|table|diagram|image|profile|passage|map|cartoon|plot)\b/i,
  /\b(?:as|is|are)\s+shown\s+(?:in\s+the\s+)?(?:figure|graph|chart|table|diagram|image|above|below)\b/i,
  /\b(?:figure|graph|chart|table|diagram|image|passage|map)\s+(?:above|below|shown|attached)\b/i,
  /\benergy\s+(?:profile|diagram)\s+(?:is\s+shown|for\s+this|below|above)\b/i,
  /\bLewis\s+structure\s+(?:shown|below|above|for)\b/i,
  /\b(?:reaction|free.body)\s+diagram\s+(?:shown|below|above)\b/i,
  /\brefer\s+to\s+the\s+(?:figure|graph|chart|table|diagram|image|passage)\b/i,
];

/**
 * Returns null if question text is safe to render; error string if a bug
 * would mangle the display.
 *
 * Optional `stimulus` lets us pass the phantom-stimulus check when the
 * stem references a figure AND a non-empty stimulus exists.
 */
export function validateRenderHazards(
  questionText: string | null | undefined,
  stimulus?: string | null,
): string | null {
  if (!questionText) return null;

  // Bug 1: unescaped currency $ that will be misread as LaTeX math.
  // Distinguish currency (`$5`, `$1,000`) from legit inline math (`$x^2$`).
  // ≥2 currency-style $ AND no math markers → flag. Otherwise skip
  // because mixed-content stems are ambiguous to a regex parser.
  const allUnescaped = questionText.match(/(?<!\\)\$/g) ?? [];
  if (allUnescaped.length >= 2) {
    const currencyDollars = questionText.match(/(?<!\\)\$\d/g) ?? [];
    const hasMathMarkers = /(?<!\\)\$[A-Za-z\\{]/.test(questionText) ||
      /\\(?:frac|sqrt|sum|int|lim|cdot|times|div|leq|geq|neq|alpha|beta|gamma|theta|pi|infty)/.test(questionText);
    if (currencyDollars.length >= 2 && !hasMathMarkers) {
      return `Render hazard: ${currencyDollars.length} unescaped currency $ — markdown will render as LaTeX math. Escape each as \\$ or write "dollars".`;
    }
  }

  // Bug 2: phantom-stimulus references. If the stem mentions a figure,
  // require the stimulus field to be non-empty.
  for (const re of PHANTOM_STIMULUS_PATTERNS) {
    if (re.test(questionText)) {
      const stimTrimmed = (stimulus ?? "").trim();
      if (stimTrimmed.length < 20) {
        return `Phantom stimulus: stem references a figure/graph/diagram via "${questionText.match(re)?.[0]}" but stimulus field is empty/missing.`;
      }
    }
  }

  return null;
}
