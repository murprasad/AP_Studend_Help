/**
 * Quick PDF → text helper using pdf-parse v2.
 * Usage: node scripts/oer/pdf-to-text-quick.mjs <input.pdf> <output.txt>
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("usage: <input.pdf> <output.txt>");
  process.exit(1);
}
if (!existsSync(inPath)) {
  console.error(`Missing: ${inPath}`);
  process.exit(2);
}

const { PDFParse } = await import("pdf-parse");
const buf = readFileSync(inPath);
const parser = new PDFParse({ data: buf });
const result = await parser.getText();
writeFileSync(outPath, result.text);
console.log(`Wrote ${outPath} (${result.text.length} chars, ${result.numpages} pages)`);
