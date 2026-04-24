/**
 * Strip MCQ-answer-letter leaks from flashcard explanations.
 *
 * Bug B8 (2026-04-24): The flashcard `explanation` field is populated from
 * the source MCQ question's explanation prose, which references "A is
 * correct", "B is wrong (trap: ...)", etc. Flashcards have no A-D options,
 * so those sentences are nonsensical. This function removes them before
 * render.
 *
 * Conservative — only strips the specific sentence patterns:
 *   - "A is correct." (at start)
 *   - "B is wrong (...)" / "B is wrong because..." / "B is wrong;"
 * Leaves the surrounding teaching content intact.
 *
 * Idempotent — safe to apply twice. Passes non-MCQ explanations through unchanged.
 */
export function sanitizeFlashcardExplanation(input: string | null | undefined): string {
  if (!input) return "";
  let out = input;
  // Leading "A is correct." or "A is correct.<newline>" sentence.
  out = out.replace(/^\s*[A-E]\s+is\s+correct\.?\s*/i, "");
  // Inline "X is wrong ..." sentences — matches through sentence-ending '.'
  // that isn't inside a parenthetical. Non-greedy; requires a following
  // whitespace / end-of-string to avoid eating adjacent prose.
  out = out.replace(
    /\s*[A-E]\s+is\s+wrong\s*(?:\([^)]*\))?[^.]*\.(\s|$)/gi,
    " ",
  );
  // Also handle "X is incorrect ..." for symmetry.
  out = out.replace(
    /\s*[A-E]\s+is\s+incorrect\s*(?:\([^)]*\))?[^.]*\.(\s|$)/gi,
    " ",
  );
  // Collapse double spaces + trim.
  return out.replace(/\s{2,}/g, " ").trim();
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
