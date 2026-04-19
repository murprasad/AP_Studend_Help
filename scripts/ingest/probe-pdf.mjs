// Quick probe: dump first/sample pages of a PDF to understand format.
import { extractPdfText } from "./pdf-utils.mjs";

const [, , pdfPath, startStr, countStr] = process.argv;
const start = parseInt(startStr || "1", 10);
const count = parseInt(countStr || "3", 10);

const { pages, numPages } = await extractPdfText(pdfPath);
console.log(`PDF: ${pdfPath}`);
console.log(`Total pages: ${numPages}`);
console.log();
for (let i = start - 1; i < Math.min(start - 1 + count, pages.length); i++) {
  console.log(`\n========== PAGE ${i + 1} ==========`);
  console.log(pages[i]);
}
