// Probe X coordinates of text items on a specific page to understand column layout.
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
const content = await page.getTextContent();

const xs = [];
for (const it of content.items) {
  if (!it.str || !it.str.trim()) continue;
  xs.push({ x: Math.round(it.transform[4]), y: Math.round(it.transform[5]), s: it.str });
}

// Distribution of X values
const xBuckets = {};
for (const { x } of xs) {
  const b = Math.floor(x / 20) * 20;
  xBuckets[b] = (xBuckets[b] || 0) + 1;
}
console.log("X-coordinate buckets (bucket=count):");
const sortedBuckets = Object.keys(xBuckets).map(Number).sort((a, b) => a - b);
for (const b of sortedBuckets) console.log(`  x=${b.toString().padStart(4)}: ${xBuckets[b]}`);

// Page bounding box
console.log(`\nPage viewport width: ${page.getViewport({ scale: 1 }).width}`);
