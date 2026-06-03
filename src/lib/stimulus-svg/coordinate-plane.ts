import { CB_SVG_THEME as T, svgWrap, escapeXml } from "./theme";

export interface CoordinatePlaneSpec {
  width?: number;
  height?: number;
  xRange: [number, number];
  yRange: [number, number];
  xStep?: number;
  yStep?: number;
  showGrid?: boolean;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  points?: { x: number; y: number; label?: string; color?: string }[];
  lines?: { from: [number, number]; to: [number, number]; color?: string; dashed?: boolean }[];
  /** sampled function: returns y given x; rendered between xRange */
  functions?: { fn: (x: number) => number; color?: string; samples?: number }[];
}

export function coordinatePlane(spec: CoordinatePlaneSpec): string {
  const W = spec.width ?? 420;
  const H = spec.height ?? 360;
  const pad = T.spacing.paddingX;
  const plotW = W - pad * 2;
  const plotH = H - pad * 2;
  const [xMin, xMax] = spec.xRange;
  const [yMin, yMax] = spec.yRange;
  const xStep = spec.xStep ?? niceStep(xMin, xMax);
  const yStep = spec.yStep ?? niceStep(yMin, yMax);
  const showGrid = spec.showGrid ?? true;
  const sx = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => pad + plotH - ((y - yMin) / (yMax - yMin)) * plotH;
  const parts: string[] = [];

  // Grid
  if (showGrid) {
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      const px = sx(x);
      parts.push(`<line x1="${px}" y1="${pad}" x2="${px}" y2="${pad + plotH}" stroke="${T.color.grid}" stroke-width="${T.stroke.grid}" />`);
    }
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      const py = sy(y);
      parts.push(`<line x1="${pad}" y1="${py}" x2="${pad + plotW}" y2="${py}" stroke="${T.color.grid}" stroke-width="${T.stroke.grid}" />`);
    }
  }

  // Axes (drawn at zero if visible, else along edges)
  const axisX = yMin <= 0 && yMax >= 0 ? sy(0) : pad + plotH;
  const axisY = xMin <= 0 && xMax >= 0 ? sx(0) : pad;
  parts.push(`<line x1="${pad}" y1="${axisX}" x2="${pad + plotW}" y2="${axisX}" stroke="${T.color.axis}" stroke-width="${T.stroke.axis}" />`);
  parts.push(`<line x1="${axisY}" y1="${pad}" x2="${axisY}" y2="${pad + plotH}" stroke="${T.color.axis}" stroke-width="${T.stroke.axis}" />`);

  // Tick labels (x)
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
    if (Math.abs(x) < 1e-9) continue;
    const px = sx(x);
    parts.push(`<line x1="${px}" y1="${axisX}" x2="${px}" y2="${axisX + T.spacing.tickLength}" stroke="${T.color.axis}" stroke-width="${T.stroke.axis}" />`);
    parts.push(`<text x="${px}" y="${axisX + T.spacing.tickLength + 14}" font-family="${T.font.family}" font-size="${T.font.sizeAxis}" fill="${T.color.text}" text-anchor="middle">${fmt(x)}</text>`);
  }
  // Tick labels (y)
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
    if (Math.abs(y) < 1e-9) continue;
    const py = sy(y);
    parts.push(`<line x1="${axisY - T.spacing.tickLength}" y1="${py}" x2="${axisY}" y2="${py}" stroke="${T.color.axis}" stroke-width="${T.stroke.axis}" />`);
    parts.push(`<text x="${axisY - T.spacing.tickLength - 4}" y="${py + 4}" font-family="${T.font.family}" font-size="${T.font.sizeAxis}" fill="${T.color.text}" text-anchor="end">${fmt(y)}</text>`);
  }

  // Lines (segments)
  for (const ln of spec.lines ?? []) {
    const col = ln.color ?? T.color.series[0];
    const dash = ln.dashed ? ` stroke-dasharray="6,4"` : "";
    parts.push(`<line x1="${sx(ln.from[0])}" y1="${sy(ln.from[1])}" x2="${sx(ln.to[0])}" y2="${sy(ln.to[1])}" stroke="${col}" stroke-width="${T.stroke.series}"${dash} />`);
  }

  // Functions (sampled)
  for (let i = 0; i < (spec.functions ?? []).length; i++) {
    const fnSpec = spec.functions![i];
    const col = fnSpec.color ?? T.color.series[i % T.color.series.length];
    const N = fnSpec.samples ?? 200;
    const pts: string[] = [];
    for (let k = 0; k <= N; k++) {
      const x = xMin + ((xMax - xMin) * k) / N;
      const y = fnSpec.fn(x);
      if (!isFinite(y) || y < yMin - 5 || y > yMax + 5) continue;
      pts.push(`${sx(x).toFixed(1)},${sy(y).toFixed(1)}`);
    }
    parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${col}" stroke-width="${T.stroke.series}" />`);
  }

  // Points
  for (const pt of spec.points ?? []) {
    const col = pt.color ?? T.color.series[0];
    parts.push(`<circle cx="${sx(pt.x)}" cy="${sy(pt.y)}" r="4" fill="${col}" />`);
    if (pt.label) {
      parts.push(`<text x="${sx(pt.x) + 6}" y="${sy(pt.y) - 6}" font-family="${T.font.family}" font-size="${T.font.sizeLabel}" fill="${T.color.text}">${escapeXml(pt.label)}</text>`);
    }
  }

  // Axis labels
  if (spec.xLabel) {
    parts.push(`<text x="${pad + plotW / 2}" y="${H - 8}" font-family="${T.font.family}" font-size="${T.font.sizeLabel}" fill="${T.color.text}" text-anchor="middle">${escapeXml(spec.xLabel)}</text>`);
  }
  if (spec.yLabel) {
    parts.push(`<text x="14" y="${pad + plotH / 2}" font-family="${T.font.family}" font-size="${T.font.sizeLabel}" fill="${T.color.text}" text-anchor="middle" transform="rotate(-90, 14, ${pad + plotH / 2})">${escapeXml(spec.yLabel)}</text>`);
  }
  if (spec.title) {
    parts.push(`<text x="${W / 2}" y="22" font-family="${T.font.family}" font-size="${T.font.sizeTitle}" font-weight="600" fill="${T.color.text}" text-anchor="middle">${escapeXml(spec.title)}</text>`);
  }

  return svgWrap(W, H, parts.join(""), spec.title || "coordinate plane");
}

function niceStep(min: number, max: number): number {
  const range = max - min;
  if (range <= 0) return 1;
  const rough = range / 8;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  let step = 1;
  if (norm < 1.5) step = 1;
  else if (norm < 3) step = 2;
  else if (norm < 7) step = 5;
  else step = 10;
  return step * mag;
}

function fmt(n: number): string {
  if (Math.abs(n) < 1e-9) return "0";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(Math.abs(n) < 10 ? 1 : 0);
}
