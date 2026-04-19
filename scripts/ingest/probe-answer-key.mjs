// Probe answer-key page: dump items by (y, x) position.
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");
pdfjs.GlobalWorkerOptions.workerSrc = "pdfjs-dist/legacy/build/pdf.worker.js";

const [, , pdfPath, pageStr] = process.argv;
const pageNum = parseInt(pageStr || "73", 10);

const data = new Uint8Array(fs.readFileSync(pdfPath));
const doc = await pdfjs.getDocument({ data, disableWorker: true }).promise;
const page = await doc.getPage(pageNum);
const content = await page.getTextContent();

const items = [];
for (const it of content.items) {
  if (!it.str || !it.str.trim()) continue;
  items.push({
    x: Math.round(it.transform[4]),
    y: Math.round(it.transform[5]),
    s: it.str,
  });
}
// Sort by y desc, then x asc
items.sort((a, b) => (b.y - a.y) || (a.x - b.x));
for (const it of items) {
  console.log(`  y=${it.y.toString().padStart(4)}  x=${it.x.toString().padStart(4)}  "${it.s}"`);
}
