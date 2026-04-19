// PDF ingestion utilities.
//
// Downloads a PDF from a URL, extracts text using pdfjs-dist (Mozilla's
// PDF.js), and returns structured per-page text. Used by course-specific
// ingestion scripts that scrape official sample questions from CB PDFs,
// ACT sample booklets, getcollegecredit resources, etc.
//
// pdf-parse (a popular wrapper) has ESM/Node 20+ compatibility issues,
// so we use pdfjs-dist directly via its legacy build which works with
// commonjs.

import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

// Disable PDF.js worker for Node (it's designed for browsers)
pdfjs.GlobalWorkerOptions.workerSrc = "pdfjs-dist/legacy/build/pdf.worker.js";

export async function downloadPdf(url, destPath) {
  const abs = path.resolve(destPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  if (fs.existsSync(abs)) {
    const stat = fs.statSync(abs);
    if (stat.size > 0) {
      console.log(`  [cached] ${path.basename(abs)} (${(stat.size / 1024).toFixed(0)} KB)`);
      return abs;
    }
  }
  console.log(`  downloading ${url} ...`);
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15",
      Accept: "application/pdf,*/*",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(abs, buf);
  console.log(`  saved ${path.basename(abs)} (${(buf.length / 1024).toFixed(0)} KB)`);
  return abs;
}

/**
 * Extract text from a PDF. Returns { pages: string[], fullText: string }.
 * Each page's text is joined with single spaces; PDFs often have fragmented
 * text items with position-based ordering which we normalize.
 */
export async function extractPdfText(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjs.getDocument({ data, disableWorker: true });
  const doc = await loadingTask.promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // PDF text items come as { str, transform, ... }. We group by vertical
    // position (Y) to preserve line breaks, since PDFs lack native line
    // semantics.
    const linesByY = new Map();
    for (const it of content.items) {
      if (!it.str || !it.str.trim()) continue;
      const y = Math.round(it.transform[5]); // vertical position
      if (!linesByY.has(y)) linesByY.set(y, []);
      linesByY.get(y).push({ x: it.transform[4], str: it.str });
    }
    // Sort lines top-to-bottom (higher Y = higher on page in PDF coords)
    const sortedYs = Array.from(linesByY.keys()).sort((a, b) => b - a);
    const lineStrs = sortedYs.map((y) => {
      const items = linesByY.get(y).sort((a, b) => a.x - b.x);
      return items.map((it) => it.str).join("").replace(/\s+/g, " ").trim();
    });
    pages.push(lineStrs.filter((l) => l.length > 0).join("\n"));
  }
  return { pages, fullText: pages.join("\n\n=== PAGE BREAK ===\n\n"), numPages: doc.numPages };
}

export function ensureRawDir(relPath = "data/raw") {
  const abs = path.resolve(relPath);
  fs.mkdirSync(abs, { recursive: true });
  return abs;
}

/**
 * Extract text from a PDF as per-page column-aware structures.
 * Returns { pages: { full, left, right, items }[], numPages }.
 *
 * - `full` is the whole page joined top-to-bottom (same as extractPdfText).
 * - `left` is only items with x < viewport.width/2 (sorted top-to-bottom).
 * - `right` is only items with x >= viewport.width/2.
 * - `items` is the raw [{x,y,s}] list (sorted y desc, then x asc) for custom parsing.
 *
 * SAT practice tests use a two-column question layout, so feeding the text
 * through the basic extractor interleaves left/right columns line-by-line
 * which destroys question boundaries. Column-aware extraction fixes this.
 */
export async function extractPdfTextColumns(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjs.getDocument({ data, disableWorker: true }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const midX = viewport.width / 2;
    const content = await page.getTextContent();
    const rawItems = [];
    for (const it of content.items) {
      if (!it.str || !it.str.trim()) continue;
      rawItems.push({
        x: it.transform[4],
        y: Math.round(it.transform[5]),
        s: it.str,
      });
    }

    const buildColumn = (xMin, xMax) => {
      const linesByY = new Map();
      for (const it of rawItems) {
        if (it.x < xMin || it.x >= xMax) continue;
        if (!linesByY.has(it.y)) linesByY.set(it.y, []);
        linesByY.get(it.y).push(it);
      }
      const sortedYs = Array.from(linesByY.keys()).sort((a, b) => b - a);
      return sortedYs
        .map((y) =>
          linesByY
            .get(y)
            .sort((a, b) => a.x - b.x)
            .map((it) => it.s)
            .join("")
            .replace(/\s+/g, " ")
            .trim()
        )
        .filter((l) => l.length > 0)
        .join("\n");
    };

    const full = buildColumn(0, viewport.width + 10);
    const left = buildColumn(0, midX);
    const right = buildColumn(midX, viewport.width + 10);

    pages.push({
      full,
      left,
      right,
      items: rawItems.sort((a, b) => (b.y - a.y) || (a.x - b.x)),
      width: viewport.width,
      height: viewport.height,
    });
  }
  return { pages, numPages: doc.numPages };
}
