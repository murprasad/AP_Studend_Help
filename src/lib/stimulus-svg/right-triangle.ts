// CB/Bluebook-style right-triangle figure. Labeled legs + hypotenuse (and
// optional angle labels) — NOT drawn to scale (matches the CB convention).
// This is the figure type behind the unanswerable "angle B" defect class:
// geometry items need a labeled triangle, which this provides.
import { CB_SVG_THEME as T, svgWrap, escapeXml } from "./theme";

export interface RightTriangleSpec {
  width?: number;
  height?: number;
  legA: string; // horizontal (bottom) leg label, e.g. "6" or "a"
  legB: string; // vertical leg label, e.g. "8" or "b"
  hyp: string;  // hypotenuse label, e.g. "x" or "10"
  angleBottomRight?: string; // optional angle label at bottom-right vertex
  angleTopLeft?: string;     // optional angle label at top-left vertex
  title?: string;
}

export function rightTriangle(spec: RightTriangleSpec): string {
  const W = spec.width ?? 360;
  const H = spec.height ?? 300;
  const pad = 52;
  // Right angle at bottom-left vertex.
  const x0 = pad, y0 = H - pad;        // bottom-left (right angle)
  const x1 = W - pad, y1 = H - pad;    // bottom-right
  const x2 = pad, y2 = pad + 8;        // top-left

  const parts: string[] = [];
  parts.push(
    `<polygon points="${x0},${y0} ${x1},${y1} ${x2},${y2}" fill="${T.color.figureFillSubtle}" stroke="${T.color.figureStroke}" stroke-width="${T.stroke.figure}" />`,
  );
  // Right-angle square marker at the bottom-left vertex.
  const m = 14;
  parts.push(
    `<polyline points="${x0 + m},${y0} ${x0 + m},${y0 - m} ${x0},${y0 - m}" fill="none" stroke="${T.color.figureStroke}" stroke-width="1.2" />`,
  );
  const lab = (x: number, y: number, t: string, anchor = "middle") =>
    `<text x="${x}" y="${y}" font-family="${T.font.family}" font-size="${T.font.sizeLabel}" fill="${T.color.text}" text-anchor="${anchor}">${escapeXml(t)}</text>`;
  parts.push(lab((x0 + x1) / 2, y0 + 24, spec.legA));            // bottom leg
  parts.push(lab(x0 - 14, (y0 + y2) / 2, spec.legB, "end"));     // left leg
  parts.push(lab((x1 + x2) / 2 + 14, (y1 + y2) / 2 - 6, spec.hyp)); // hypotenuse
  if (spec.angleBottomRight) parts.push(lab(x1 - 30, y1 - 10, spec.angleBottomRight));
  if (spec.angleTopLeft) parts.push(lab(x2 + 12, y2 + 24, spec.angleTopLeft));

  return svgWrap(W, H, parts.join(""), spec.title || "right triangle (not to scale)");
}
