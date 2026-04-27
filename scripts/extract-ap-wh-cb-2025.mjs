#!/usr/bin/env node
/**
 * Extract text from CB AP World History 2025 PDFs and dump to stdout.
 * Usage: node scripts/extract-ap-wh-cb-2025.mjs <pdf-name>
 *        node scripts/extract-ap-wh-cb-2025.mjs --all
 */

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const PDF_DIR = "C:/Users/akkil/project/AP_Help/AP World History -2025";
const OUT_DIR = "C:/Users/akkil/project/AP_Help/data/cb-frqs/AP_WORLD_HISTORY/2025-extracted";

const arg = process.argv[2] ?? "--all";

const VISUAL_KEYWORDS = [
  /\bimage above\b/i,
  /\bmap above\b/i,
  /\bcartoon\b/i,
  /\bphotograph\b/i,
  /\billustration\b/i,
  /\bchart\b/i,
  /\bgraph\b/i,
  /\btable above\b/i,
  /\bbased on the (image|map|cartoon|chart|graph|photograph|table)/i,
  /\bvisible in the\b/i,
  /shown above/i,
  /shown below/i,
];

function detectVisuals(text) {
  const hits = [];
  for (const re of VISUAL_KEYWORDS) {
    const m = text.match(re);
    if (m) hits.push(m[0]);
  }
  return hits;
}

async function extractOne(filename) {
  const fullPath = path.join(PDF_DIR, filename);
  const buf = await readFile(fullPath);
  const result = await new PDFParse({ data: buf }).getText();
  return {
    filename,
    pageCount: result.pages?.length ?? null,
    text: result.text,
    charCount: result.text.length,
    visualCues: detectVisuals(result.text),
  };
}

(async () => {
  const all = await readdir(PDF_DIR);
  const targets = arg === "--all"
    ? all.filter(f => f.endsWith(".pdf") && !f.includes("score-distributions") && !f.includes("scoring-statistics") && !f.includes("cr-report") && !f.includes("sg-"))
    : [arg];

  // Ensure out dir exists
  try { await readdir(OUT_DIR); } catch { const fs = await import("node:fs/promises"); await fs.mkdir(OUT_DIR, { recursive: true }); }

  for (const f of targets) {
    try {
      const r = await extractOne(f);
      const outName = f.replace(/\.pdf$/, ".txt");
      await writeFile(path.join(OUT_DIR, outName), r.text, "utf8");
      console.log(`OK ${f}  pages=${r.pageCount}  chars=${r.charCount}  visualCues=${r.visualCues.length}`);
      if (r.visualCues.length) {
        console.log(`   cues: ${r.visualCues.slice(0, 8).join(" | ")}`);
      }
    } catch (e) {
      console.error(`ERR ${f}: ${e.message}`);
    }
  }
})();
