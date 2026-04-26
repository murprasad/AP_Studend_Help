/**
 * Strip MCQ-answer-letter leaks from flashcard explanations.
 *
 * Bug B8 (2026-04-24, expanded 2026-04-26): The flashcard `explanation`
 * field is populated from the source MCQ question's explanation prose,
 * which references "A is correct", "Why A is correct", "Option B (trap:
 * ...)", etc. Flashcards have no A-D options, so those sentences are
 * nonsensical. This function removes them before render.
 *
 * Beta 7.5 sanitizer caught only "X is correct/wrong/incorrect" — the
 * user re-reported "Why A is correct" still leaking through. This pass
 * adds: "Why X is/was correct/wrong", markdown headers, "Option X",
 * "Choice X", "(X)", "The correct answer is X", and bare "Answer: X".
 *
 * Idempotent — safe to apply twice. Passes non-MCQ explanations unchanged.
 */
export function sanitizeFlashcardExplanation(input: string | null | undefined): string {
  if (!input) return "";
  let out = input;

  // Strip markdown headers (## / ### / **) that contain MCQ scaffolding —
  // common pattern: "**Why A is correct:**" or "### Why B is wrong".
  // REQUIRES an explicit markdown marker (# or **). Pure-prose patterns
  // like "Why A is correct. ..." are handled by the inline regexes below
  // — trying to catch them here as headers over-matches into surrounding
  // text containing colons (e.g. "(trap: ...)").
  out = out.replace(
    /^[ \t]*(?:#{1,6}\s+|\*{2,3})\s*(?:Why\s+)?(?:Option\s+|Choice\s+|Answer\s+)?[\(\[]?[A-E][\)\]]?\s+(?:is|was)\s+(?:correct|wrong|incorrect|right)[^\n]*\n?/gim,
    "",
  );
  // Bold-wrapped colon headers: "**Why A is correct:**" — must have ** on
  // both sides so we know it's truly a heading, not prose.
  out = out.replace(
    /\*{2,3}\s*(?:Why\s+)?(?:Option\s+|Choice\s+|Answer\s+)?[\(\[]?[A-E][\)\]]?\s+(?:is|was)\s+(?:correct|wrong|incorrect|right)[^*\n]*\*{2,3}[ \t]*\n?/gim,
    "",
  );

  // "The correct answer is A." / "Correct answer: A." (note: \s* not \s+
  // to handle "answer:" with no space). Also "Answer: A. ..." prefix.
  out = out.replace(
    /^[ \t]*(?:The\s+)?correct\s+answer\s*(?:is|:)\s*[A-E]\.?\s*/gim,
    "",
  );
  out = out.replace(
    /^[ \t]*Answer:\s*[A-E][\.,;]\s*/gim,
    "",
  );

  // "Why X is correct/wrong" inline + "Why X is correct: ..." block.
  out = out.replace(
    /\bWhy\s+[\(\[]?[A-E][\)\]]?\s+(?:is|was)\s+(?:correct|wrong|incorrect|right)[^.]*\.(\s|$)/gi,
    " ",
  );
  // Block form ending in colon — strip the heading sentence + trailing colon.
  out = out.replace(
    /^[ \t]*Why\s+[\(\[]?[A-E][\)\]]?\s+(?:is|was)\s+(?:correct|wrong|incorrect|right)[^:\n]*:[ \t]*\n?/gim,
    "",
  );

  // Leading "A is correct." or "(A) is correct." (already shipped, kept).
  out = out.replace(/^\s*[\(\[]?[A-E][\)\]]?\s+(?:is|was)\s+correct\.?\s*/i, "");

  // Inline "X is wrong/incorrect ..." sentences.
  out = out.replace(
    /\s*[\(\[]?[A-E][\)\]]?\s+(?:is|was)\s+(?:wrong|incorrect)\s*(?:\([^)]*\))?[^.]*\.(\s|$)/gi,
    " ",
  );

  // "Option A states ..." / "Choice B says ..." / "(C) describes ..."
  out = out.replace(
    /\b(?:Option|Choice)\s+[\(\[]?[A-E][\)\]]?\s+[^.]*\.(\s|$)/gi,
    " ",
  );

  // Trap call-outs: "(trap:", "(distractor:" — leftover after strips.
  out = out.replace(/\((?:trap|distractor)[^)]*\)/gi, "");

  // Collapse extra blank lines + double spaces + trim.
  return out
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * markdown-helpers.ts — pure string helpers for AI-generated markdown.
 *
 * Extracted from `src/components/tutor/section-cards.tsx` so unit tests
 * can import it without pulling in JSX / client-only deps.
 */

/**
 * Splits a single-line pipe table into multi-line form so `remark-gfm`
 * can parse it.
 *
 * AI providers sometimes emit tables on one line:
 *   "| Given | Value | |-------|------| | Mass | 4.0 kg | | Force | 12 N |"
 *
 * `remark-gfm` needs multi-line form to recognize a table. This function
 * detects lines that contain an inline separator row (|---|---|) followed
 * by ≥ 1 data row, and splits them into the canonical form:
 *   | Given | Value |
 *   | ----- | ----- |
 *   | Mass  | 4.0 kg |
 *   | Force | 12 N   |
 *
 * Non-table lines pass through unchanged.
 *
 * Regression guard: B7 (docs/bugs-found-2026-04-24.md).
 */
export function normalizeMarkdownTables(md: string): string {
  return md
    .split("\n")
    .map((line) => {
      if (!line.includes("|") || !line.includes("---")) return line;
      const sepMatches = line.match(/\|\s*-+\s*/g);
      if (!sepMatches || sepMatches.length < 2) return line;

      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      const sepStart = cells.findIndex((c) => /^-+$/.test(c));
      if (sepStart === -1) return line;
      let sepEnd = sepStart;
      while (sepEnd < cells.length && /^-+$/.test(cells[sepEnd])) sepEnd++;

      const numCols = sepEnd - sepStart;
      const headerCells = cells.slice(sepStart - numCols, sepStart);
      if (headerCells.length !== numCols) return line;

      const rows: string[] = [
        "| " + headerCells.join(" | ") + " |",
        "| " + cells.slice(sepStart, sepEnd).join(" | ") + " |",
      ];
      const dataCells = cells.slice(sepEnd);
      for (let i = 0; i < dataCells.length; i += numCols) {
        const row = dataCells.slice(i, i + numCols);
        if (row.length > 0) rows.push("| " + row.join(" | ") + " |");
      }
      return rows.join("\n");
    })
    .join("\n");
}
