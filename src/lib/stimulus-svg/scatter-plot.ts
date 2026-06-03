import { CB_SVG_THEME as T, svgWrap, escapeXml } from "./theme";

export interface ScatterPlotSpec {
  width?: number;
  height?: number;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  xRange: [number, number];
  yRange: [number, number];
  xStep?: number;
  yStep?: number;
  showGrid?: boolean;
  points: { x: number; y: number; color?: string }[];
  /** Line of best fit endpoints (in data coords). When provided, drawn over scatter. */
  trendline?: { from: [number, number]; to: [number, number]; color?: string };
}

export function scatterPlot(spec: ScatterPlotSpec): string {
  const W = spec.width ?? 440;
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

  if (showGrid) {
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      parts.push(`<line x1="${sx(x)}" y1="${pad}" x2="${sx(x)}" y2="${pad + plotH}" stroke="${T.color.grid}" stroke-width="${T.stroke.grid}" />`);
    }
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      parts.push(`<line x1="${pad}" y1="${sy(y)}" x2="${pad + plotW}" y2="${sy(y)}" stroke="${T.color.grid}" stroke-width="${T.stroke.grid}" />`);
    }
  }

  // Axes (always at bottom/left of plot area for scatter)
  parts.push(`<line x1="${pad}" y1="${pad + plotH}" x2="${pad + plotW}" y2="${pad + plotH}" stroke="${T.color.axis}" stroke-width="${T.stroke.axis}" />`);
  parts.push(`<line x1="${pad}" y1="${pad}" x2="${pad}" y2="${pad + plotH}" stroke="${T.color.axis}" stroke-width="${T.stroke.axis}" />`);

  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
    parts.push(`<text x="${sx(x)}" y="${pad + plotH + 18}" font-family="${T.font.family}" font-size="${T.font.sizeAxis}" fill="${T.color.text}" text-anchor="middle">${fmt(x)}</text>`);
  }
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
    parts.push(`<text x="${pad - 6}" y="${sy(y) + 4}" font-family="${T.font.family}" font-size="${T.font.sizeAxis}" fill="${T.color.text}" text-anchor="end">${fmt(y)}</text>`);
  }

  if (spec.trendline) {
    const col = spec.trendline.color ?? T.color.series[0];
    parts.push(`<line x1="${sx(spec.trendline.from[0])}" y1="${sy(spec.trendline.from[1])}" x2="${sx(spec.trendline.to[0])}" y2="${sy(spec.trendline.to[1])}" stroke="${col}" stroke-width="${T.stroke.series}" />`);
  }

  for (const p of spec.points) {
    const col = p.color ?? T.color.series[0];
    parts.push(`<circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="4" fill="${col}" stroke="white" stroke-width="0.8" />`);
  }

  if (spec.title) {
    parts.push(`<text x="${W / 2}" y="22" font-family="${T.font.family}" font-size="${T.font.sizeTitle}" font-weight="600" fill="${T.color.text}" text-anchor="middle">${escapeXml(spec.title)}</text>`);
  }
  if (spec.xLabel) {
    parts.push(`<text x="${pad + plotW / 2}" y="${H - 6}" font-family="${T.font.family}" font-size="${T.font.sizeLabel}" fill="${T.color.text}" text-anchor="middle">${escapeXml(spec.xLabel)}</text>`);
  }
  if (spec.yLabel) {
    parts.push(`<text x="14" y="${pad + plotH / 2}" font-family="${T.font.family}" font-size="${T.font.sizeLabel}" fill="${T.color.text}" text-anchor="middle" transform="rotate(-90, 14, ${pad + plotH / 2})">${escapeXml(spec.yLabel)}</text>`);
  }

  return svgWrap(W, H, parts.join(""), spec.title || "scatter plot");
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
