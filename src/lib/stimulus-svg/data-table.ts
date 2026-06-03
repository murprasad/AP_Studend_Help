import { CB_SVG_THEME as T, svgWrap, escapeXml } from "./theme";

export interface DataTableSpec {
  title?: string;
  headers: string[];
  rows: (string | number)[][];
  /** width hint per column (auto-distributes if omitted). */
  colWidths?: number[];
  rowHeight?: number;
  padding?: number;
}

export function dataTable(spec: DataTableSpec): string {
  const padding = spec.padding ?? 10;
  const rowH = spec.rowHeight ?? 26;
  const nCols = spec.headers.length;
  const colW = spec.colWidths ?? Array(nCols).fill(120);
  const totalW = colW.reduce((a, b) => a + b, 0) + padding * 2;
  const totalH = rowH * (spec.rows.length + 1) + padding * 2 + (spec.title ? 26 : 0);
  const titleH = spec.title ? 22 : 0;

  const parts: string[] = [];

  if (spec.title) {
    parts.push(`<text x="${totalW / 2}" y="18" font-family="${T.font.family}" font-size="${T.font.sizeTitle}" font-weight="600" fill="${T.color.text}" text-anchor="middle">${escapeXml(spec.title)}</text>`);
  }

  // Header row
  let xCursor = padding;
  const headerY = padding + titleH;
  parts.push(`<rect x="${padding}" y="${headerY}" width="${totalW - padding * 2}" height="${rowH}" fill="${T.color.figureFillSubtle}" />`);
  for (let i = 0; i < nCols; i++) {
    parts.push(`<text x="${xCursor + colW[i] / 2}" y="${headerY + rowH / 2 + 5}" font-family="${T.font.family}" font-size="${T.font.sizeLabel}" font-weight="600" fill="${T.color.text}" text-anchor="middle">${escapeXml(spec.headers[i])}</text>`);
    xCursor += colW[i];
  }

  // Data rows
  for (let r = 0; r < spec.rows.length; r++) {
    const row = spec.rows[r];
    xCursor = padding;
    const yRow = headerY + rowH * (r + 1);
    if (r % 2 === 1) {
      parts.push(`<rect x="${padding}" y="${yRow}" width="${totalW - padding * 2}" height="${rowH}" fill="#f7f9fc" />`);
    }
    for (let c = 0; c < nCols; c++) {
      const val = row[c] ?? "";
      parts.push(`<text x="${xCursor + colW[c] / 2}" y="${yRow + rowH / 2 + 5}" font-family="${T.font.family}" font-size="${T.font.sizeValue}" fill="${T.color.text}" text-anchor="middle">${escapeXml(String(val))}</text>`);
      xCursor += colW[c];
    }
  }

  // Outer border
  parts.push(`<rect x="${padding}" y="${headerY}" width="${totalW - padding * 2}" height="${rowH * (spec.rows.length + 1)}" fill="none" stroke="${T.color.figureStroke}" stroke-width="${T.stroke.figure}" />`);
  // Header divider
  parts.push(`<line x1="${padding}" y1="${headerY + rowH}" x2="${totalW - padding}" y2="${headerY + rowH}" stroke="${T.color.figureStroke}" stroke-width="${T.stroke.figure}" />`);

  return svgWrap(totalW, totalH, parts.join(""), spec.title || "data table");
}
