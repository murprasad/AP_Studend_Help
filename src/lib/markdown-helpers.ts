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
