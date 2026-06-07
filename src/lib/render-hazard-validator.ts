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
 * 2026-06-07 — PRECISE figure/passage-requirement detector (Validation-Engine
 * Agent, tri-agent quality protocol). The PHANTOM_STIMULUS_PATTERNS above are
 * too NARROW: they miss "Based on Figure 4", numbered tables ("Table 2"),
 * "refer to the chart", etc. A naive broad regex over-fires though — these are
 * the documented FALSE POSITIVES the detector must NOT flag:
 *
 *   - "What is the image height if object height is 5cm and magnification 2?"
 *     ("image" is the optics term — NO figure needed). Must PASS.
 *   - "80 g of sodium ... to form table salt" ("table salt" is a compound,
 *     not a data table). Must PASS.
 *   - "A convex lens with focal length 10cm placed 20cm from an object, find
 *     the image distance." (self-contained physics). Must PASS.
 *
 * True violations (with empty stimulus + no image):
 *   - "Based on Figure 4, Experiment 7..." / "Based on Table 2..."  → FAIL
 *   - reading: "The passage suggests..." / "In the passage..."      → FAIL
 *
 * The patterns require an explicit anchoring word ("figure", "graph", "table",
 * etc.) tied to a number or a directional/"based on"/"refer to"/"shown in"
 * construction. "image" and "table salt" never match because "image" is never
 * an anchoring word here and "table" only anchors when it is a NUMBERED table
 * ("table 2") or an explicit "data table" / directional table reference — never
 * the bare noun "table" in "table salt".
 */
const FIGURE_REQUIRED_PATTERNS: RegExp[] = [
  // Numbered visual reference: "Figure 4", "Fig. 2", "Table 2", "Graph 1",
  // "Exhibit 3". "table salt" never matches (no digit after "table").
  /\b(?:figure|fig\.?|table|graph|diagram|chart|exhibit)\s*\d+\b/i,
  // "Based on the figure / graph / table / diagram / chart / data in / data shown"
  /\bbased on (?:the )?(?:figure|graph|table|diagram|chart|data (?:in|shown))/i,
  // "Refer to the figure / graph / table / diagram / chart"
  /\brefer to the (?:figure|graph|table|diagram|chart)/i,
  // "shown / depicted / illustrated in the figure / graph / diagram / chart / table"
  /\b(?:shown|depicted|illustrated) in the (?:figure|graph|diagram|chart|table)/i,
  // "the following / above / below / adjacent figure / graph / diagram / chart / data table"
  /\bthe (?:following|above|below|adjacent) (?:figure|graph|diagram|chart|data table)/i,
  // "the figure / graph / diagram above / below / shown"
  /\bthe (?:figure|graph|diagram) (?:above|below|shown)/i,
];

/**
 * Reading-passage requirement. A stem that talks about "the passage" / "this
 * passage" / "in the passage" / "passage suggests|states|author|implies" needs
 * an actual passage stimulus to be answerable.
 */
const PASSAGE_REQUIRED_PATTERN =
  /\b(?:the|this) passage\b|\bin the passage\b|\bpassage (?:suggests|states|author|implies)\b/i;

/**
 * Precise figure/passage-requirement detector.
 *
 * Returns a non-null reason string ONLY when the stem clearly references a
 * figure/table/graph/diagram (or, for any course, a reading passage) AND the
 * question carries no usable stimulus — neither a `stimulus` text field nor a
 * `stimulusImageUrl`. Fail-closed (a match with no stimulus → reason), but
 * conservative (precise anchored patterns → no false positives on optics
 * "image", "table salt", or self-contained lens word problems).
 *
 * @param questionText      the rendered stem
 * @param stimulus          stimulus text field (passage/table/figure caption)
 * @param stimulusImageUrl  attached image URL (any non-empty string counts as
 *                          a present figure for this presence-level check)
 * @returns error string if the figure/passage is required but absent; else null
 */
export function detectMissingRequiredStimulus(
  questionText: string | null | undefined,
  stimulus?: string | null,
  stimulusImageUrl?: string | null,
): string | null {
  if (!questionText) return null;

  const stimTrimmed = (stimulus ?? "").trim();
  const hasImage =
    typeof stimulusImageUrl === "string" && stimulusImageUrl.trim().length > 0;
  // A real passage/figure caption is ≥20 chars; an image URL is always enough.
  const hasStimulus = stimTrimmed.length >= 20 || hasImage;
  if (hasStimulus) return null; // a stimulus exists — nothing to flag

  // PASSAGE requirement (applies to every course — a stem that talks about
  // "the passage" cannot be answered without one).
  const passageMatch = questionText.match(PASSAGE_REQUIRED_PATTERN);
  if (passageMatch) {
    return `Missing required passage: stem references a reading passage via "${passageMatch[0]}" but no stimulus (passage text) or stimulusImageUrl is present — the question is unanswerable.`;
  }

  // FIGURE / TABLE / GRAPH / DIAGRAM requirement.
  for (const re of FIGURE_REQUIRED_PATTERNS) {
    const m = questionText.match(re);
    if (m) {
      return `Missing required figure: stem references a figure/table/graph/diagram via "${m[0]}" but no stimulus or stimulusImageUrl is present — the question is unanswerable.`;
    }
  }

  return null;
}

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
  stimulusImageUrl?: string | null,
): string | null {
  if (!questionText) return null;

  // Bug 1: unescaped currency $ that will be misread as LaTeX math.
  // Distinguish currency (`$5`, `$1,000`) from legit inline math (`$x^2$`).
  //
  // - Currency: $ immediately followed by a digit.
  // - Math delimiter: $ followed by non-digit (letter, backslash, brace).
  //
  // ≥2 unescaped currency $ in the stem with no matching math-delimiter
  // intent → the markdown renderer pairs them up as math, italicizing the
  // numbers + stripping whitespace. Real bug seen 2026-05-12.
  //
  // Skipped when the question contains legit math markers (`$x...$`,
  // `\frac`, `^`, `_{`, etc.) because mixed-content stems are
  // ambiguous and would need a parser to disambiguate cleanly.
  const allUnescaped = questionText.match(/(?<!\\)\$/g) ?? [];
  if (allUnescaped.length >= 2) {
    const currencyDollars = questionText.match(/(?<!\\)\$\d/g) ?? [];
    const hasMathMarkers = /(?<!\\)\$[A-Za-z\\{]/.test(questionText) ||
      /\\(?:frac|sqrt|sum|int|lim|cdot|times|div|leq|geq|neq|alpha|beta|gamma|theta|pi|infty)/.test(questionText);
    // Flag only when ≥2 currency-style $ AND no legit math markers present.
    if (currencyDollars.length >= 2 && !hasMathMarkers) {
      return `Render hazard: ${currencyDollars.length} unescaped currency $ — markdown will render as LaTeX math. Escape each as \\$ or write "dollars".`;
    }
  }

  // Bug 2: phantom-stimulus references. If the stem mentions a figure,
  // require the stimulus field to be non-empty.
  for (const re of PHANTOM_STIMULUS_PATTERNS) {
    if (re.test(questionText)) {
      const stimTrimmed = (stimulus ?? "").trim();
      const hasImg =
        typeof stimulusImageUrl === "string" && stimulusImageUrl.trim().length > 0;
      if (stimTrimmed.length < 20 && !hasImg) {
        return `Phantom stimulus: stem references a figure/graph/diagram via "${questionText.match(re)?.[0]}" but stimulus field is empty/missing.`;
      }
    }
  }

  // Bug 2b (2026-06-07): PRECISE figure/passage-requirement gate. Catches the
  // cases the narrow PHANTOM_STIMULUS_PATTERNS above miss — numbered references
  // ("Based on Figure 4", "Table 2"), "refer to the chart", reading "the
  // passage suggests" — while NOT false-flagging optics "image", "table salt",
  // or self-contained lens word problems. Fail-closed.
  const missingStimulus = detectMissingRequiredStimulus(
    questionText,
    stimulus,
    stimulusImageUrl,
  );
  if (missingStimulus) {
    return missingStimulus;
  }

  // Bug 3 (2026-05-25, Lucas Q5): nested `$...$` inside `\frac{...}`.
  // Pattern that mangles KaTeX rendering: "$\frac{$2x^{2}$ + 3x}{$x^{2}$ + 1}$"
  // The outer $ pair closes at the first inner $, leaving the rest as raw text.
  // Detection: any `\frac{` containing a `$` before its matching `}`.
  const fracIdx = questionText.indexOf("\\frac{");
  if (fracIdx >= 0) {
    let depth = 0;
    let i = fracIdx + 6;
    let inFrac = true;
    while (i < questionText.length && inFrac) {
      const ch = questionText[i];
      if (ch === "{") depth++;
      else if (ch === "}") { if (depth === 0) inFrac = false; else depth--; }
      else if (ch === "$") {
        return `Render hazard: nested "$" inside \\frac{} — closes outer math early. Strip the inner $ delimiters (already inside math mode).`;
      }
      i++;
    }
  }

  return null;
}
