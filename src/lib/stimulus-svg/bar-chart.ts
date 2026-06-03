import { CB_SVG_THEME as T, svgWrap, escapeXml } from "./theme";

export interface BarChartSpec {
  width?: number;
  height?: number;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  categories: string[];
  values: number[];
  yMax?: number;
  yStep?: number;
  showValueLabels?: boolean;
  color?: string;
}

export function barChart(spec: BarChartSpec): string {
  const W = spec.width ?? 420;
  const H = spec.height ?? 320;
  const pad = T.spacing.paddingX;
  const plotW = W - pad * 2;
  const plotH = H - pad * 2;
  const n = spec.categories.length;
  if (n === 0 || spec.values.length !== n) {
    throw new Error("barChart: categories and values must be same non-zero length");
  }
  const yMax = spec.yMax ?? niceMax(Math.max(...spec.values));
  const yStep = spec.yStep ?? niceStep(0, yMax);
  const color = spec.color ?? T.color.series[0];
  const showLabels = spec.showValueLabels ?? true;

  const sy = (y: number) => pad + plotH - (y / yMax) * plotH;
  const slotW = plotW / n;
  const barW = slotW * 0.6;

  const parts: string[] = [];

  // Y grid + ticks
  for (let y = 0; y <= yMax; y += yStep) {
    const py = sy(y);
    parts.push(`<line x1="${pad}" y1="${py}" x2="${pad + plotW}" y2="${py}" stroke="${T.color.grid}" stroke-width="${T.stroke.grid}" />`);
    parts.push(`<text x="${pad - 6}" y="${py + 4}" font-family="${T.font.family}" font-size="${T.font.sizeAxis}" fill="${T.color.text}" text-anchor="end">${fmt(y)}</text>`);
  }

  // Axes
  parts.push(`<line x1="${pad}" y1="${pad}" x2="${pad}" y2="${pad + plotH}" stroke="${T.color.axis}" stroke-width="${T.stroke.axis}" />`);
  parts.push(`<line x1="${pad}" y1="${pad + plotH}" x2="${pad + plotW}" y2="${pad + plotH}" stroke="${T.color.axis}" stroke-width="${T.stroke.axis}" />`);

  // Bars
  for (let i = 0; i < n; i++) {
    const cx = pad + slotW * (i + 0.5);
    const v = spec.values[i];
    const top = sy(v);
    const x = cx - barW / 2;
    const h = pad + plotH - top;
    parts.push(`<rect x="${x}" y="${top}" width="${barW}" height="${h}" fill="${color}" />`);
    parts.push(`<text x="${cx}" y="${pad + plotH + 18}" font-family="${T.font.family}" font-size="${T.font.sizeAxis}" fill="${T.color.text}" text-anchor="middle">${escapeXml(spec.categories[i])}</text>`);
    if (showLabels) {
      parts.push(`<text x="${cx}" y="${top - 6}" font-family="${T.font.family}" font-size="${T.font.sizeValue}" fill="${T.color.text}" text-anchor="middle">${fmt(v)}</text>`);
    }
  }

  // Labels
  if (spec.title) {
    parts.push(`<text x="${W / 2}" y="22" font-family="${T.font.family}" font-size="${T.font.sizeTitle}" font-weight="600" fill="${T.color.text}" text-anchor="middle">${escapeXml(spec.title)}</text>`);
  }
  if (spec.xLabel) {
    parts.push(`<text x="${pad + plotW / 2}" y="${H - 6}" font-family="${T.font.family}" font-size="${T.font.sizeLabel}" fill="${T.color.text}" text-anchor="middle">${escapeXml(spec.xLabel)}</text>`);
  }
  if (spec.yLabel) {
    parts.push(`<text x="14" y="${pad + plotH / 2}" font-family="${T.font.family}" font-size="${T.font.sizeLabel}" fill="${T.color.text}" text-anchor="middle" transform="rotate(-90, 14, ${pad + plotH / 2})">${escapeXml(spec.yLabel)}</text>`);
  }

  return svgWrap(W, H, parts.join(""), spec.title || "bar chart");
}

function niceStep(min: number, max: number): number {
  const range = max - min;
  if (range <= 0) return 1;
  const rough = range / 6;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  let step = 1;
  if (norm < 1.5) step = 1;
  else if (norm < 3) step = 2;
  else if (norm < 7) step = 5;
  else step = 10;
  return step * mag;
}

function niceMax(v: number): number {
  if (v <= 0) return 10;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  let nice = 10;
  if (norm <= 1) nice = 1;
  else if (norm <= 2) nice = 2;
  else if (norm <= 5) nice = 5;
  return nice * mag * 1.1 < v + mag * 0.1 ? nice * mag * 2 : nice * mag * 1.2;
}

function fmt(n: number): string {
  if (Math.abs(n) < 1e-9) return "0";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}
