// Dry-run SAT parse on one downloaded test, report counts + sample.
import { extractPdfTextColumns } from "./pdf-utils.mjs";

// Duplicate the parser logic from ingest-sat.mjs — this is probe-only.
function parseAnswersPdf(pagesText) {
  const sections = { rw1: new Map(), rw2: new Map(), math1: new Map(), math2: new Map() };
  let currentSection = null;
  for (const pageText of pagesText) {
    if (/READING AND WRITING:?\s*MODULE 1/i.test(pageText)) currentSection = "rw1";
    else if (/READING AND WRITING:?\s*MODULE 2/i.test(pageText)) currentSection = "rw2";
    else if (/MATH:?\s*MODULE 1/i.test(pageText)) currentSection = "math1";
    else if (/MATH:?\s*MODULE 2/i.test(pageText)) currentSection = "math2";
    if (!currentSection) continue;
    const blockRegex = /QUESTION\s+(\d+)([\s\S]*?)(?=QUESTION\s+\d+|$)/g;
    let m;
    while ((m = blockRegex.exec(pageText)) !== null) {
      const qNum = parseInt(m[1], 10);
      const block = m[2];
      const choiceMatch = block.match(
        /Choice\s+([A-D])\s*is\s+(?:the\s+best\s+answer|correct)/i
      );
      if (!choiceMatch) continue;
      const letter = choiceMatch[1].toUpperCase();
      sections[currentSection].set(qNum, { letter });
    }
  }
  return sections;
}

function parseTestPdf(pages) {
  const columnBlocks = [];
  let currentSection = null;
  for (const p of pages) {
    const full = p.full;
    if (/Reading\s+and\s+Writing\s*\n?\s*33\s*QUESTIONS/i.test(full)) {
      currentSection = currentSection === "rw1" ? "rw2" : "rw1";
    } else if (/\bMath\b\s*\n?\s*27\s*QUESTIONS/i.test(full)) {
      currentSection = currentSection === "math1" ? "math2" : "math1";
    }
    columnBlocks.push({ col: p.left, section: currentSection });
    columnBlocks.push({ col: p.right, section: currentSection });
  }

  const results = [];
  for (const { col, section } of columnBlocks) {
    if (!section || !col) continue;
    const lines = col.split("\n");
    const maxQ = section.startsWith("rw") ? 33 : 27;
    let current = null;
    const blocks = [];
    const numRegex = /^\s*(\d{1,2})\s*$/;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      if (/^Unauthorized copying/i.test(line)) continue;
      if (/CO\s*NTI\s*N\s*U\s*E/i.test(line)) continue;
      if (/^Module$/i.test(line)) continue;
      if (/^DIRECTIONS$/i.test(line)) continue;
      if (/^NOTES$/i.test(line)) continue;
      const m = numRegex.exec(line);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n >= 1 && n <= maxQ) {
          if (current) blocks.push(current);
          current = { qNum: n, lines: [] };
          continue;
        }
      }
      if (current) current.lines.push(line);
    }
    if (current) blocks.push(current);
    for (const b of blocks) {
      const raw = b.lines.join(" ").replace(/\s+/g, " ").trim();
      const optMatch = raw.match(
        /^(.*?)\bA\)\s*(.+?)\s*B\)\s*(.+?)\s*C\)\s*(.+?)\s*D\)\s*(.+?)$/
      );
      if (!optMatch) continue;
      const [, stemRaw, A, B, C, D] = optMatch;
      const stem = stemRaw.replace(/\s+/g, " ").trim();
      if (stem.length < 15) continue;
      results.push({ section, qNum: b.qNum, stem, options: { A, B, C, D } });
    }
  }
  return results;
}

const pdfPath = process.argv[2] || "data/raw/sat/sat-practice-test-4-digital.pdf";
const ansPath = pdfPath.replace("-digital.pdf", "-answers-digital.pdf");

console.log(`Parsing ${pdfPath}`);
const { pages: tp } = await extractPdfTextColumns(pdfPath);
const { pages: ap } = await extractPdfTextColumns(ansPath);
const questions = parseTestPdf(tp);
const answers = parseAnswersPdf(ap.map((p) => p.full));
const bySection = {};
for (const q of questions) {
  bySection[q.section] = (bySection[q.section] || 0) + 1;
}
console.log(`Parsed questions by section:`, bySection);
console.log(
  `Answers: rw1=${answers.rw1.size} rw2=${answers.rw2.size} math1=${answers.math1.size} math2=${answers.math2.size}`
);
let matched = 0;
for (const q of questions) {
  if (answers[q.section]?.get(q.qNum)) matched++;
}
console.log(`Matched q + ans: ${matched}/${questions.length}`);

// Print 2 samples per section
for (const sec of ["rw1", "rw2", "math1", "math2"]) {
  console.log(`\n--- Sample ${sec} ---`);
  const samples = questions.filter((q) => q.section === sec).slice(0, 2);
  for (const s of samples) {
    const ans = answers[sec]?.get(s.qNum)?.letter || "?";
    console.log(`Q${s.qNum} [ans=${ans}]: ${s.stem.slice(0, 120)}...`);
    console.log(`  A) ${s.options.A.slice(0, 80)}`);
    console.log(`  B) ${s.options.B.slice(0, 80)}`);
    console.log(`  C) ${s.options.C.slice(0, 80)}`);
    console.log(`  D) ${s.options.D.slice(0, 80)}`);
  }
}
