/**
 * scripts/oer/chunk-gutenberg.mjs
 *
 * Phase 2 of Gutenberg ingest. Splits full-text.txt into ~300-word
 * exam-passage chunks (target: AP Lit short-prose passage length).
 *
 * Strategy:
 *   1. Strip Gutenberg boilerplate (everything before "*** START OF" and
 *      after "*** END OF").
 *   2. Split body on paragraph breaks (blank lines).
 *   3. Greedily merge adjacent paragraphs until chunk is ~250-400 words.
 *   4. Skip chunks that are too short or look like chapter headers.
 *   5. Annotate chunk index and approximate line range for traceability.
 *
 * Output: data/oer/gutenberg/<id>/passages.json
 *
 * Usage:
 *   node scripts/oer/chunk-gutenberg.mjs --id=1342
 *   node scripts/oer/chunk-gutenberg.mjs              # all downloaded
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const ONLY = args.id ?? null;
const TARGET_MIN = 220;
const TARGET_MAX = 420;

function stripBoilerplate(txt) {
  const startRx = /\*\*\*\s*START OF (?:THE|THIS)? ?PROJECT GUTENBERG.*?\*\*\*/i;
  const endRx = /\*\*\*\s*END OF (?:THE|THIS)? ?PROJECT GUTENBERG.*?\*\*\*/i;
  let body = txt;
  const sm = body.match(startRx);
  if (sm) body = body.slice(sm.index + sm[0].length);
  const em = body.match(endRx);
  if (em) body = body.slice(0, em.index);
  return body.trim();
}

function isHeaderLike(s) {
  // Chapter X / VOLUME I / single-line ALL CAPS / dashes
  if (s.length < 80 && /^(CHAPTER|VOLUME|BOOK|PART|ACT|SCENE)\b/i.test(s.trim())) return true;
  if (s.length < 50 && s.trim() === s.trim().toUpperCase() && /[A-Z]/.test(s)) return true;
  return false;
}

function wordCount(s) {
  return s.split(/\s+/).filter(Boolean).length;
}

function chunkText(body) {
  // Split on 2+ newlines (paragraph boundaries)
  const paras = body.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  const chunks = [];
  let buf = "";
  let bufStartPara = 0;
  for (let i = 0; i < paras.length; i++) {
    const p = paras[i];
    if (isHeaderLike(p)) continue;
    const combined = buf ? `${buf}\n\n${p}` : p;
    if (wordCount(combined) >= TARGET_MIN) {
      chunks.push({ text: combined, startPara: bufStartPara, endPara: i, wordCount: wordCount(combined) });
      buf = "";
      bufStartPara = i + 1;
    } else if (wordCount(combined) > TARGET_MAX) {
      // Single para exceeded — push as is
      chunks.push({ text: p, startPara: i, endPara: i, wordCount: wordCount(p) });
      buf = "";
      bufStartPara = i + 1;
    } else {
      buf = combined;
    }
  }
  if (buf && wordCount(buf) >= TARGET_MIN * 0.7) {
    chunks.push({ text: buf, startPara: bufStartPara, endPara: paras.length - 1, wordCount: wordCount(buf) });
  }
  return chunks;
}

const baseDir = join(process.cwd(), "data", "oer", "gutenberg");
let bookDirs = readdirSync(baseDir).filter((d) => statSync(join(baseDir, d)).isDirectory());
if (ONLY) bookDirs = bookDirs.filter((d) => d === String(ONLY));

console.log(`Chunking ${bookDirs.length} book(s) [target ${TARGET_MIN}-${TARGET_MAX} words/chunk]`);

let totalChunks = 0;
for (const id of bookDirs) {
  const txtPath = join(baseDir, id, "full-text.txt");
  const metaPath = join(baseDir, id, "metadata.json");
  if (!existsSync(txtPath)) {
    console.log(`  - ${id}: no full-text.txt, skip`);
    continue;
  }
  const txt = readFileSync(txtPath, "utf-8");
  const body = stripBoilerplate(txt);
  const chunks = chunkText(body);
  const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, "utf-8")) : {};
  writeFileSync(join(baseDir, id, "passages.json"), JSON.stringify({
    bookId: id,
    title: meta.title ?? `Gutenberg ${id}`,
    author: meta.author ?? "Unknown",
    courses: meta.courses ?? [],
    sourceUrl: meta.sourceUrl ?? `https://www.gutenberg.org/ebooks/${id}`,
    sourceLicense: "Public Domain (US)",
    chunkedAt: new Date().toISOString(),
    chunkCount: chunks.length,
    passages: chunks.map((c, i) => ({ index: i, ...c })),
  }, null, 2));
  console.log(`  ✓ ${id} ${meta.title ?? ""} → ${chunks.length} chunks (avg ${chunks.length ? Math.round(chunks.reduce((s, c) => s + c.wordCount, 0) / chunks.length) : 0} words)`);
  totalChunks += chunks.length;
}

console.log(`\nDone. ${totalChunks} passages ready for grounded question generation.`);
console.log(`Next: scripts/oer/generate-from-passages.mjs --book=<id> [--limit=N]`);
