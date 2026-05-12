/**
 * scripts/oer/download-gutenberg.mjs
 *
 * Phase 1 of Project Gutenberg ingest — fetch public-domain literary
 * works commonly tested on AP English Literature / AP English Language
 * / SAT Reading-Writing / ACT Reading.
 *
 * License: All Project Gutenberg US texts are PUBLIC DOMAIN. No
 * attribution required but we attach `sourceLicense = "Public Domain (US)"`
 * and `sourceUrl = "https://www.gutenberg.org/ebooks/<id>"` for traceability.
 *
 * Strategy: passages are NOT pre-formed questions. We download the
 * full text, then Phase 2 chunks it into ~300-word passages, then
 * Phase 3 uses the existing gen pipeline (auto-populate.ts equivalent)
 * to generate exam-style MCQs GROUNDED in the chunk. Each question
 * stores: stimulus = chunk text, sourceUrl, sourceBook = title, sourceLicense.
 *
 * Output: data/oer/gutenberg/<id>/full-text.txt
 *
 * Usage:
 *   node scripts/oer/download-gutenberg.mjs              # download all
 *   node scripts/oer/download-gutenberg.mjs --id=11      # one book (id=11 = Alice in Wonderland)
 */
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Hand-picked classics with high AP English Lit canonical-frequency.
// Each entry: id (Gutenberg ebook number), title, author, courses, era.
const BOOKS = [
  // 19th-century American — frequent on AP Lit + APUSH document analysis
  { id: 76, title: "The Adventures of Huckleberry Finn", author: "Mark Twain", courses: ["AP_ENGLISH_LITERATURE", "SAT_READING_WRITING"], era: "American Realism" },
  { id: 25344, title: "The Scarlet Letter", author: "Nathaniel Hawthorne", courses: ["AP_ENGLISH_LITERATURE"], era: "American Romanticism" },
  { id: 64317, title: "The Great Gatsby", author: "F. Scott Fitzgerald", courses: ["AP_ENGLISH_LITERATURE"], era: "Jazz Age (US, public domain 2021+)" },
  // 19th-century British — backbone of AP Lit
  { id: 1342, title: "Pride and Prejudice", author: "Jane Austen", courses: ["AP_ENGLISH_LITERATURE"], era: "Regency / Romantic" },
  { id: 161, title: "Sense and Sensibility", author: "Jane Austen", courses: ["AP_ENGLISH_LITERATURE"], era: "Regency / Romantic" },
  { id: 1400, title: "Great Expectations", author: "Charles Dickens", courses: ["AP_ENGLISH_LITERATURE"], era: "Victorian" },
  { id: 98, title: "A Tale of Two Cities", author: "Charles Dickens", courses: ["AP_ENGLISH_LITERATURE"], era: "Victorian" },
  { id: 1260, title: "Jane Eyre", author: "Charlotte Brontë", courses: ["AP_ENGLISH_LITERATURE"], era: "Victorian" },
  { id: 768, title: "Wuthering Heights", author: "Emily Brontë", courses: ["AP_ENGLISH_LITERATURE"], era: "Victorian" },
  { id: 11, title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", courses: ["AP_ENGLISH_LITERATURE"], era: "Victorian fantasy" },
  // Early-20th-c — appears on both AP Lang and AP Lit
  { id: 2814, title: "Dubliners", author: "James Joyce", courses: ["AP_ENGLISH_LITERATURE"], era: "Modernism" },
  { id: 219, title: "Heart of Darkness", author: "Joseph Conrad", courses: ["AP_ENGLISH_LITERATURE"], era: "Modernism" },
  { id: 6593, title: "The History of Tom Jones, a Foundling", author: "Henry Fielding", courses: ["AP_ENGLISH_LITERATURE"], era: "18th-c British novel" },
  // Shakespeare — perennial AP Lit
  { id: 1524, title: "Hamlet", author: "William Shakespeare", courses: ["AP_ENGLISH_LITERATURE"], era: "Renaissance drama" },
  { id: 1112, title: "Romeo and Juliet", author: "William Shakespeare", courses: ["AP_ENGLISH_LITERATURE"], era: "Renaissance drama" },
  { id: 1533, title: "Macbeth", author: "William Shakespeare", courses: ["AP_ENGLISH_LITERATURE"], era: "Renaissance drama" },
  // AP Language non-fiction — historical/political essays
  { id: 147, title: "The Federalist Papers", author: "Hamilton, Madison, Jay", courses: ["AP_ENGLISH_LANGUAGE", "AP_US_HISTORY", "AP_US_GOVERNMENT"], era: "Founding documents" },
  { id: 16328, title: "Common Sense", author: "Thomas Paine", courses: ["AP_ENGLISH_LANGUAGE", "AP_US_HISTORY"], era: "Revolutionary rhetoric" },
  { id: 5827, title: "Walden", author: "Henry David Thoreau", courses: ["AP_ENGLISH_LANGUAGE", "AP_ENGLISH_LITERATURE"], era: "Transcendentalism" },
  { id: 200, title: "Tao Te Ching", author: "Lao Tzu (trans. James Legge)", courses: ["AP_ENGLISH_LITERATURE"], era: "Ancient Chinese" },
  // Frequently anthologized short works
  { id: 84, title: "Frankenstein", author: "Mary Shelley", courses: ["AP_ENGLISH_LITERATURE"], era: "Gothic / Romantic" },
  { id: 174, title: "The Picture of Dorian Gray", author: "Oscar Wilde", courses: ["AP_ENGLISH_LITERATURE"], era: "Late Victorian" },
  { id: 1232, title: "The Prince", author: "Niccolò Machiavelli", courses: ["AP_ENGLISH_LANGUAGE", "AP_EUROPEAN_HISTORY"], era: "Renaissance political" },
];

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const ONLY = args.id ?? null;
const DRY = !!args.dry;

const queue = ONLY ? BOOKS.filter((b) => String(b.id) === String(ONLY)) : BOOKS;
if (queue.length === 0) {
  console.error("No books match --id filter");
  process.exit(1);
}

const baseDir = join(process.cwd(), "data", "oer", "gutenberg");
mkdirSync(baseDir, { recursive: true });

console.log(`Project Gutenberg download — ${queue.length} book(s) ${DRY ? "(DRY)" : ""}`);
let downloaded = 0;
let skipped = 0;
let failed = 0;

for (const book of queue) {
  const dir = join(baseDir, String(book.id));
  mkdirSync(dir, { recursive: true });
  const outPath = join(dir, "full-text.txt");

  if (existsSync(outPath)) {
    const size = statSync(outPath).size;
    if (size > 10_000) {
      console.log(`  ✓ ${book.id} ${book.title} already downloaded (${(size / 1024).toFixed(0)} KB)`);
      skipped++;
      continue;
    }
  }
  if (DRY) {
    console.log(`  [DRY] would fetch id=${book.id} ${book.title}`);
    continue;
  }

  // Gutenberg "Plain Text UTF-8" canonical URL pattern: /files/<id>/<id>-0.txt
  // Fallbacks: /files/<id>/<id>.txt
  const urls = [
    `https://www.gutenberg.org/files/${book.id}/${book.id}-0.txt`,
    `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.txt`,
    `https://www.gutenberg.org/files/${book.id}/${book.id}.txt`,
  ];
  let ok = false;
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30000) });
      if (!res.ok) continue;
      const txt = await res.text();
      if (txt.length < 10_000) continue;
      writeFileSync(outPath, txt);
      // Write metadata sidecar
      const meta = {
        id: book.id,
        title: book.title,
        author: book.author,
        courses: book.courses,
        era: book.era,
        sourceUrl: `https://www.gutenberg.org/ebooks/${book.id}`,
        sourceLicense: "Public Domain (US)",
        downloadedAt: new Date().toISOString(),
        sizeBytes: txt.length,
      };
      writeFileSync(join(dir, "metadata.json"), JSON.stringify(meta, null, 2));
      console.log(`  ✓ ${book.id} ${book.title} (${(txt.length / 1024).toFixed(0)} KB)`);
      downloaded++;
      ok = true;
      break;
    } catch (e) {
      // try next url
    }
  }
  if (!ok) {
    console.error(`  ✗ ${book.id} ${book.title} — all URLs failed`);
    failed++;
  }
  // Throttle: Gutenberg recommends ≤1 req/sec
  await new Promise((r) => setTimeout(r, 1500));
}

console.log(`\nDone. downloaded=${downloaded} skipped=${skipped} failed=${failed}`);
