// Dry-run ACT parse on one downloaded test, report counts + sample.
import { extractPdfTextColumns } from "./pdf-utils.mjs";

const ODD_OPTS = ["A", "B", "C", "D"];
const EVEN_OPTS = ["F", "G", "H", "J"];

function detectSection(pageFullText) {
  if (/\bENGLISH\s+TEST\b/i.test(pageFullText)) return "english";
  if (/\bMATHEMATICS\s+TEST\b/i.test(pageFullText)) return "math";
  if (/\bREADING\s+TEST\b/i.test(pageFullText)) return "reading";
  if (/\bSCIENCE\s+TEST\b/i.test(pageFullText)) return "science";
  return null;
}

function extractActQuestions(text, { maxQ = 50 } = {}) {
  const lines = text.split("\n");
  const blocks = [];
  let current = null;
  const startRe = /^\s*(\d{1,2})\.\s*(.*)$/;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^©\s*\d{4}/i.test(line)) continue;
    if (/^Page\s+\d+\s+of/i.test(line)) continue;
    if (/GO ON TO THE NEXT PAGE/i.test(line)) continue;
    if (/END OF TEST/i.test(line)) continue;
    if (/DO YOUR FIGURING HERE/i.test(line)) continue;
    if (/^\d+\s*$/.test(line) && line.length <= 3) continue;
    const m = startRe.exec(line);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n >= 1 && n <= maxQ) {
        if (current) blocks.push(current);
        current = { qNum: n, body: m[2] || "" };
        continue;
      }
    }
    if (current) current.body += " " + line;
  }
  if (current) blocks.push(current);

  const results = [];
  for (const b of blocks) {
    const raw = b.body.replace(/\s+/g, " ").trim();
    const set = b.qNum % 2 === 1 ? ODD_OPTS : EVEN_OPTS;
    const [o1, o2, o3, o4] = set;
    const optRe = new RegExp(
      `^(.*?)\\b${o1}\\.\\s*(.+?)\\s*\\b${o2}\\.\\s*(.+?)\\s*\\b${o3}\\.\\s*(.+?)\\s*\\b${o4}\\.\\s*(.+?)$`
    );
    const m = optRe.exec(raw);
    if (!m) continue;
    const [, stemRaw, v1, v2, v3, v4] = m;
    const scrub = (s) => s.replace(/-{3,}~?/g, "").replace(/\s+/g, " ").trim();
    const stem = scrub(stemRaw);
    if (stem.length < 10) continue;
    const options = { A: scrub(v1), B: scrub(v2), C: scrub(v3), D: scrub(v4) };
    results.push({ qNum: b.qNum, stem, options });
  }
  return results;
}

function parseActTest(pages) {
  const sectionText = { english: "", math: "", reading: "", science: "" };
  let currentSection = null;
  for (const p of pages) {
    const detected = detectSection(p.full);
    if (detected) currentSection = detected;
    if (!currentSection) continue;
    let chunk;
    if (currentSection === "english") chunk = p.right;
    else if (currentSection === "math") chunk = p.left;
    else chunk = `${p.left}\n${p.right}`;
    sectionText[currentSection] += "\n" + chunk;
  }
  return {
    english: extractActQuestions(sectionText.english, { maxQ: 75 }),
    math: extractActQuestions(sectionText.math, { maxQ: 60 }),
    reading: extractActQuestions(sectionText.reading, { maxQ: 40 }),
    science: extractActQuestions(sectionText.science, { maxQ: 40 }),
  };
}

function parseAnswerKeyPage(items) {
  const rows = [];
  let currentRow = null;
  let lastY = null;
  for (const it of items) {
    if (lastY === null || Math.abs(lastY - it.y) > 4) {
      if (currentRow) rows.push(currentRow);
      currentRow = { y: it.y, cells: [] };
      lastY = it.y;
    }
    currentRow.cells.push(it);
  }
  if (currentRow) rows.push(currentRow);
  const answers = new Map();
  const numXMin = 60, numXMax = 80;
  const ansXMin = 110, ansXMax = 150;
  for (const row of rows) {
    const numCell = row.cells.find((c) => c.x >= numXMin && c.x <= numXMax);
    const ansCell = row.cells.find((c) => c.x >= ansXMin && c.x <= ansXMax);
    if (!numCell || !ansCell) continue;
    const n = parseInt(numCell.s.trim(), 10);
    if (!Number.isInteger(n) || n < 1 || n > 200) continue;
    if (!/^[A-DFGHJ]$/.test(ansCell.s.trim())) continue;
    answers.set(n, ansCell.s.trim());
  }
  return answers;
}

function parseAnswerKeys(pages) {
  const keys = { english: new Map(), math: new Map(), reading: new Map(), science: new Map() };
  for (const p of pages) {
    if (/English\s+Scoring\s+Key/i.test(p.full)) {
      for (const [n, v] of parseAnswerKeyPage(p.items).entries()) keys.english.set(n, v);
    } else if (/Mathematics\s+Scoring\s+Key/i.test(p.full)) {
      for (const [n, v] of parseAnswerKeyPage(p.items).entries()) keys.math.set(n, v);
    } else if (/Reading\s+Scoring\s+Key/i.test(p.full)) {
      for (const [n, v] of parseAnswerKeyPage(p.items).entries()) keys.reading.set(n, v);
    } else if (/Science\s+Scoring\s+Key/i.test(p.full)) {
      for (const [n, v] of parseAnswerKeyPage(p.items).entries()) keys.science.set(n, v);
    }
  }
  return keys;
}

const pdfPath = process.argv[2] || "data/raw/act/Preparing-for-the-ACT.pdf";
console.log(`Parsing ${pdfPath}`);
const { pages } = await extractPdfTextColumns(pdfPath);
const qs = parseActTest(pages);
const keys = parseAnswerKeys(pages);
console.log(`Questions:   E=${qs.english.length} M=${qs.math.length} R=${qs.reading.length} S=${qs.science.length}`);
console.log(`Answer keys: E=${keys.english.size} M=${keys.math.size} R=${keys.reading.size} S=${keys.science.size}`);
for (const sec of ["english", "math", "reading", "science"]) {
  const matched = qs[sec].filter((q) => keys[sec].get(q.qNum)).length;
  console.log(`  ${sec}: matched=${matched}/${qs[sec].length}`);
}
for (const sec of ["english", "math", "reading", "science"]) {
  const samples = qs[sec].slice(0, 2);
  console.log(`\n--- Sample ${sec} ---`);
  for (const s of samples) {
    const ans = keys[sec].get(s.qNum) || "?";
    console.log(`Q${s.qNum} [ans=${ans}]: ${s.stem.slice(0, 120)}`);
    console.log(`  A) ${s.options.A.slice(0, 80)}`);
    console.log(`  B) ${s.options.B.slice(0, 80)}`);
    console.log(`  C) ${s.options.C.slice(0, 80)}`);
    console.log(`  D) ${s.options.D.slice(0, 80)}`);
  }
}
