// CB Bluebook-aligned visual tokens for SVG stimuli.
// Extracted from screenshots of the official Digital SAT practice tests.

export const CB_SVG_THEME = {
  font: {
    family: '"Helvetica Neue", "TT Commons Pro", Helvetica, Arial, sans-serif',
    sizeAxis: 13,
    sizeLabel: 14,
    sizeTitle: 15,
    sizeValue: 12,
  },
  color: {
    axis: "#1f2933",
    grid: "#d8dee5",
    text: "#1f2933",
    series: ["#0b62a4", "#d97706", "#15803d", "#b91c1c", "#7c3aed"],
    figureStroke: "#1f2933",
    figureFillSubtle: "#eef2f7",
  },
  stroke: {
    axis: 1.5,
    grid: 1,
    series: 2,
    figure: 1.6,
  },
  spacing: {
    paddingX: 48,
    paddingY: 36,
    tickLength: 5,
  },
} as const;

export function svgWrap(width: number, height: number, inner: string, title = ""): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(title || "figure")}">${inner}</svg>`;
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function svgToDataUri(svg: string): string {
  const encoded = svg.replace(/#/g, "%23").replace(/\n/g, " ").replace(/\s+/g, " ");
  return `data:image/svg+xml;utf8,${encoded}`;
}
