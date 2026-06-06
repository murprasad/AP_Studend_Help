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
  // Base64 encoding. The previous `;utf8,` scheme left raw `<`, `>`, `"`
  // unescaped, which Chrome/Safari reject in `<img src>` — the figure
  // silently failed to load and the img alt text showed in its place.
  // Base64 is universally supported and immune to every unescaped character.
  const cleaned = svg.replace(/\s+/g, " ").trim();
  const base64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(cleaned, "utf8").toString("base64")
      : btoa(unescape(encodeURIComponent(cleaned)));
  return `data:image/svg+xml;base64,${base64}`;
}
