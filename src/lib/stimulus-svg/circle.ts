// CB/Bluebook-style circle figure. A circle with a labeled radius (or
// diameter) line, optional center dot and a marked central-angle sector.
// Covers the SAT geometry circle items (area, circumference, arc length,
// sector area, central angle) that need a figure to be answerable.
import { CB_SVG_THEME as T, svgWrap, escapeXml } from "./theme";

export interface CircleSpec {
  width?: number;
  height?: number;
  /** Label on the radius line, e.g. "r", "5", "x". */
  radiusLabel?: string;
  /** When true, draw a full diameter instead of a radius and use diameterLabel. */
  showDiameter?: boolean;
  diameterLabel?: string;
  /** Optional central-angle sector in degrees, shaded, with a label. */
  sectorAngle?: number;
  sectorLabel?: string; // e.g. "120°"
  /** Show the center point dot + label (e.g. "O"). */
  centerLabel?: string;
  title?: string;
}

export function circle(spec: CircleSpec): string {
  const W = spec.width ?? 340;
  const H = spec.height ?? 300;
  const cx = W / 2;
  const cy = H / 2;
  const r = Math.min(W, H) / 2 - 56;

  const parts: string[] = [];

  // Optional shaded sector (central angle) drawn first so the outline sits on top.
  if (typeof spec.sectorAngle === "number" && spec.sectorAngle > 0) {
    const a = (Math.min(spec.sectorAngle, 359.9) * Math.PI) / 180;
    // Sector starts at the positive x-axis (3 o'clock) going counter-clockwise (screen: up).
    const x1 = cx + r;
    const y1 = cy;
    const x2 = cx + r * Math.cos(a);
    const y2 = cy - r * Math.sin(a);
    const largeArc = spec.sectorAngle > 180 ? 1 : 0;
    parts.push(
      `<path d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${largeArc} 0 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${T.color.figureFillSubtle}" stroke="none" />`,
    );
    if (spec.sectorLabel) {
      const mid = a / 2;
      const lx = cx + r * 0.5 * Math.cos(mid);
      const ly = cy - r * 0.5 * Math.sin(mid);
      parts.push(label(lx, ly, spec.sectorLabel));
    }
  }

  // The circle outline.
  parts.push(
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${T.color.figureStroke}" stroke-width="${T.stroke.figure}" />`,
  );

  // Center dot + label.
  parts.push(`<circle cx="${cx}" cy="${cy}" r="2.5" fill="${T.color.figureStroke}" />`);
  if (spec.centerLabel) parts.push(label(cx - 12, cy + 16, spec.centerLabel));

  if (spec.showDiameter) {
    // Horizontal diameter.
    parts.push(
      `<line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${T.color.figureStroke}" stroke-width="${T.stroke.figure}" />`,
    );
    if (spec.diameterLabel) parts.push(label(cx, cy - 10, spec.diameterLabel));
  } else {
    // Radius to the right.
    parts.push(
      `<line x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${T.color.figureStroke}" stroke-width="${T.stroke.figure}" />`,
    );
    if (spec.radiusLabel) parts.push(label(cx + r / 2, cy - 10, spec.radiusLabel));
  }

  return svgWrap(W, H, parts.join(""), spec.title || "circle (not to scale)");
}

function label(x: number, y: number, t: string, anchor = "middle"): string {
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="${T.font.family}" font-size="${T.font.sizeLabel}" fill="${T.color.text}" text-anchor="${anchor}">${escapeXml(t)}</text>`;
}
