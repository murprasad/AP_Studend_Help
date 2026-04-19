// Probe column-aware text extraction.
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");
pdfjs.GlobalWorkerOptions.workerSrc = "pdfjs-dist/legacy/build/pdf.worker.js";

const [, , pdfPath, pageStr] = process.argv;
const pageNum = parseInt(pageStr || "4", 10);

const data = new Uint8Array(fs.readFileSync(pdfPath));
const doc = await pdfjs.getDocument({ data, disableWorker: true }).promise;
const page = await doc.getPage(pageNum);
const viewport = page.getViewport({ scale: 1 });
const midX = viewport.width / 2;
const content = await page.getTextContent();

function extractColumn(items, xMin, xMax) {
  const linesByY = new Map();
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue;
    const x = it.transform[4];
    if (x < xMin || x >= xMax) continue;
    const y = Math.round(it.transform[5]);
    if (!linesByY.has(y)) linesByY.set(y, []);
    linesByY.get(y).push({ x, s: it.str });
  }
  const sortedYs = Array.from(linesByY.keys()).sort((a, b) => b - a);
  return sortedYs
    .map((y) => {
      const line = linesByY
        .get(y)
        .sort((a, b) => a.x - b.x)
        .map((it) => it.s)
        .join("")
        .replace(/\s+/g, " ")
        .trim();
      return line;
    })
    .filter((l) => l.length > 0)
    .join("\n");
}

const left = extractColumn(content.items, 0, midX);
const right = extractColumn(content.items, midX, viewport.width + 10);
console.log(`=== LEFT COLUMN (page ${pageNum}) ===`);
console.log(left);
console.log(`\n=== RIGHT COLUMN (page ${pageNum}) ===`);
console.log(right);
