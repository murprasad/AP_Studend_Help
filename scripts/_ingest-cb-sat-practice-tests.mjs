// Ingest official CB Digital SAT practice tests into structured JSON corpus.
//
// Input:  data/raw/sat/sat-practice-test-{N}-digital.pdf (already extracted to
//         data/official/SAT/sat-practice-test-{N}-digital.txt via pdftotext)
//         + answer key:
//         data/official/SAT/sat-practice-test-{N}-answers-digital.txt
//
// Output: data/cb-corpus/sat-practice-test-{N}.json with shape:
// {
//   "test": "Practice Test 10 (Digital SAT, paper format)",
//   "source_pdf": "data/raw/sat/sat-practice-test-10-digital.pdf",
//   "modules": [
//     {
//       "section": "READING_WRITING",
//       "module": 1,
//       "questions": [
//         {
//           "n": 1,
//           "stem": "The general store was essential...",
//           "stimulus": "...passage text...",
//           "options": { "A": "source", "B": "rival", "C": "condition", "D": "waste" },
//           "correctAnswer": "A",
//           "officialExplanation": "...from answer key..."
//         }
//       ]
//     }
//   ]
// }
//
// This corpus feeds:
// - Distractor catalog mining (each wrong CB option → mistake category)
// - Few-shot examples in generator prompts
// - Difficulty calibration reference
// - Stimulus parity comparison
//
// Run: node scripts/_ingest-cb-sat-practice-tests.mjs --test=10
//      node scripts/_ingest-cb-sat-practice-tests.mjs --all

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");

const FLAGS = process.argv.slice(2);
const TEST_FLAG = FLAGS.find((f) => f.startsWith("--test="))?.split("=")[1];
const ALL = FLAGS.includes("--all");

const AVAILABLE = [4, 5, 6, 7, 8, 9, 10];
const tests = ALL ? AVAILABLE : (TEST_FLAG ? [parseInt(TEST_FLAG, 10)] : [10]);

const CORPUS_DIR = path.join(REPO, "data", "cb-corpus");
mkdirSync(CORPUS_DIR, { recursive: true });

for (const n of tests) {
  // Prefer -noLayout extraction (cleaner column handling); fall back to -layout
  const noLayoutTxt = path.join(REPO, "data", "official", "SAT", `sat-practice-test-${n}-digital-noLayout.txt`);
  const noLayoutAns = path.join(REPO, "data", "official", "SAT", `sat-practice-test-${n}-answers-digital-noLayout.txt`);
  const testTxt = existsSync(noLayoutTxt) ? noLayoutTxt : path.join(REPO, "data", "official", "SAT", `sat-practice-test-${n}-digital.txt`);
  const ansTxt = existsSync(noLayoutAns) ? noLayoutAns : path.join(REPO, "data", "official", "SAT", `sat-practice-test-${n}-answers-digital.txt`);
  if (!existsSync(testTxt)) {
    console.log(`Test ${n}: text extract not found at ${testTxt}, skipping`);
    continue;
  }

  const raw = readFileSync(testTxt, "utf8");
  const ans = existsSync(ansTxt) ? readFileSync(ansTxt, "utf8") : "";

  console.log(`\nParsing Test ${n} (${raw.length} bytes)...`);

  // ── Stage A: find module markers ────────────────────────────────────────
  // pdftotext output has "Module 1" / "Module 2" markers and section markers
  // ("Reading and Writing", "Math"). Use these to segment.
  const modules = segmentByModules(raw);
  console.log(`  Found ${modules.length} modules.`);

  // ── Stage B: parse questions inside each module ─────────────────────────
  for (const m of modules) {
    m.questions = parseQuestions(m.text, m.section);
    console.log(`  Module ${m.section}/${m.module}: ${m.questions.length} questions`);
  }

  // ── Stage C: align with answer key ──────────────────────────────────────
  if (ans) {
    const answersByN = parseAnswerKey(ans);
    let attached = 0;
    for (const m of modules) {
      for (const q of m.questions) {
        const key = `${m.section}-${m.module}-${q.n}`;
        if (answersByN[key]) {
          q.correctAnswer = answersByN[key].letter;
          q.officialExplanation = answersByN[key].explanation;
          attached++;
        }
      }
    }
    console.log(`  Attached ${attached} official explanations from answer key.`);
  }

  // ── Stage D: write corpus JSON ──────────────────────────────────────────
  const outPath = path.join(CORPUS_DIR, `sat-practice-test-${n}.json`);
  const totalQs = modules.reduce((s, m) => s + (m.questions?.length || 0), 0);
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        test: `SAT Practice Test #${n} (Digital, paper format)`,
        source_pdf: `data/raw/sat/sat-practice-test-${n}-digital.pdf`,
        source_url: `https://satsuite.collegeboard.org/media/pdf/sat-practice-test-${n}-digital.pdf`,
        license: "CB practice tests are made available for student preparation use",
        accessed: "2026-06-02",
        total_questions_parsed: totalQs,
        modules: modules.map((m) => ({
          section: m.section,
          module: m.module,
          question_count: m.questions?.length || 0,
          questions: m.questions || [],
        })),
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`  → wrote ${path.relative(REPO, outPath)} (${totalQs} questions parsed).`);
}

console.log("\nDone.\n");

// ─────────────────────────────────────────────────────────────────────────
// Parsers
// ─────────────────────────────────────────────────────────────────────────

function segmentByModules(raw) {
  // Heuristic: each PDF has 4 sections — RW module 1, RW module 2, Math module 1, Math module 2.
  // Markers appear as "Reading and Writing" then "Module 1" then "33 QUESTIONS" etc.
  // We split on the "Module N" header lines after we see the section header.

  // Simpler approach: take advantage of the document structure printed by
  // pdftotext -layout: section + module + question-count lines tend to cluster.

  const sections = [];
  // Document order is: "Module\n<digit>\n\n<Section name>" — Module comes BEFORE section.
  const sectionRegex = /\bModule\b\s+(\d+)[\s\S]{0,200}?\b(Reading and Writing|Math)\b/gi;
  let m;
  const cuts = [];
  while ((m = sectionRegex.exec(raw)) !== null) {
    const module = parseInt(m[1], 10);
    const section = /Math/i.test(m[2]) ? "MATH" : "READING_WRITING";
    cuts.push({ section, module, start: m.index });
  }
  // Dedup consecutive same section+module (the regex can fire twice)
  const dedup = [];
  for (const c of cuts) {
    const last = dedup[dedup.length - 1];
    if (!last || last.section !== c.section || last.module !== c.module) {
      dedup.push(c);
    }
  }
  // Slice text by cut boundaries
  for (let i = 0; i < dedup.length; i++) {
    const a = dedup[i];
    const b = dedup[i + 1];
    a.text = raw.slice(a.start, b ? b.start : raw.length);
    sections.push(a);
  }
  return sections;
}

function parseQuestions(text, section) {
  // pdftotext -layout interleaves multi-column pages into a wide grid.
  // We look for question markers like "1 ----" or just lone numbers followed
  // by passage/prompt, then options A) B) C) D).
  //
  // Heuristic: each Q has a stem (lines of free text) and 4 option lines that
  // start with "A)" "B)" "C)" "D)" (case-insensitive).
  //
  // For robustness, we extract Q blocks by their "Which choice..." or
  // "What is..." prompt + 4 nearby options, and number them sequentially.

  const questions = [];
  const lines = text.split("\n").map((l) => l.replace(/\s+$/, ""));
  let i = 0;
  let qIdx = 0;
  while (i < lines.length) {
    // Find a line that starts a 4-option block: A) ... within next 20 lines
    const optStart = findOptionsBlock(lines, i);
    if (optStart === -1) break;
    // Walk backwards from optStart to find the question prompt / stem
    const stemStart = findStemStart(lines, optStart);
    const stem = lines.slice(stemStart, optStart).join("\n").trim();
    const opts = readOptions(lines, optStart);
    const optsEnd = optStart + opts.endOffset;
    if (stem.length > 10 && Object.keys(opts.map).length === 4) {
      qIdx++;
      questions.push({
        n: qIdx,
        section,
        stem: cleanStem(stem),
        options: opts.map,
      });
    }
    i = optsEnd + 1;
  }
  return questions;
}

function findOptionsBlock(lines, from) {
  // Find the next line index where 4 consecutive "A)"/"B)"/"C)"/"D)" labels
  // appear within a 30-line window.
  for (let i = from; i < lines.length; i++) {
    if (/^\s*A[\)\.]\s/.test(lines[i])) {
      const window = lines.slice(i, i + 60);
      const hasB = window.some((l) => /^\s*B[\)\.]\s/.test(l));
      const hasC = window.some((l) => /^\s*C[\)\.]\s/.test(l));
      const hasD = window.some((l) => /^\s*D[\)\.]\s/.test(l));
      if (hasB && hasC && hasD) return i;
    }
  }
  return -1;
}

function findStemStart(lines, optStart) {
  // Walk backwards until we find a blank line or a "Module" / page footer line
  for (let i = optStart - 1; i >= 0; i--) {
    const l = lines[i];
    if (/^\s*$/.test(l)) continue;
    if (/^\s*Module\s*\d*\s*$/.test(l)) return i + 1;
    if (/Unauthorized copying|CONTINUE|sat\.org/.test(l)) return i + 1;
  }
  return Math.max(0, optStart - 30);
}

function readOptions(lines, start) {
  const map = {};
  let endOffset = 0;
  let currentLetter = null;
  for (let i = start; i < lines.length; i++) {
    endOffset = i - start;
    const l = lines[i];
    const m = l.match(/^\s*([A-D])[\)\.]\s+(.+?)\s*$/);
    if (m) {
      currentLetter = m[1];
      map[currentLetter] = m[2];
    } else if (currentLetter && /^\s+\S/.test(l) && Object.keys(map).length < 4) {
      // Continuation of current option (wrapped)
      map[currentLetter] = (map[currentLetter] + " " + l.trim()).trim();
    } else if (currentLetter && Object.keys(map).length === 4 && /^\s*$/.test(l)) {
      // End of options block (blank line after D)
      break;
    } else if (Object.keys(map).length === 4 && !/^\s*[A-D][\)\.]\s/.test(l) && l.trim().length > 0) {
      break;
    }
  }
  return { map, endOffset };
}

function cleanStem(s) {
  // Collapse internal whitespace runs to single spaces; strip page noise.
  let out = s
    .replace(/Unauthorized copying.*?(illegal|reuse)/gi, "")
    .replace(/CONTINUE/g, "")
    .replace(/sat\.org\/digital-practice/g, "")
    .replace(/\.{6,}/g, "") // dotted column-rules
    .replace(/^-?\d+\s*-?\s*-*\s*~?/g, "") // leading question number + dashes
    .replace(/\s+/g, " ")
    .trim();
  // Strip module preamble: "1 Reading and Writing 33 QUESTIONS The questions in this section..."
  out = out.replace(/^\d?\s*(Reading and Writing|Math)\s+(\d+)\s+QUESTIONS\s+The questions[\s\S]*?\bbest answer\.\s*/i, "");
  // Strip "Module N N -1 - - -" residue
  out = out.replace(/^Module\s*\d+\s*\d*\s*-?\d*\s*-*\s*~?\s*/i, "");
  return out.trim();
}

function parseAnswerKey(ans) {
  // Answer keys have format roughly:
  //   Question 1
  //   Choice A is the best answer.
  //   Explanation: ...
  // We extract by Q number → letter + explanation snippet.
  const byKey = {};
  // Simple heuristic — find every "Question N" block and the next
  // "Choice X" letter inside it
  const blocks = ans.split(/\bQuestion\s+(\d+)\b/);
  // After split: blocks[0] = preamble, [1] = "1", [2] = block-1-text, [3] = "2", [4] = block-2-text, ...
  // We don't know the section/module from the key alone — fall back to global Q index
  for (let i = 1; i < blocks.length; i += 2) {
    const num = parseInt(blocks[i], 10);
    const body = blocks[i + 1] || "";
    const letterM = body.match(/\bChoice\s+([A-D])\b/);
    if (letterM) {
      const explanation = body
        .slice(0, 2000)
        .replace(/\s+/g, " ")
        .trim();
      // Without section/module info, we key by global question index. The
      // downstream consumer can map by sequential numbering.
      byKey[`ANY-ANY-${num}`] = { letter: letterM[1], explanation };
    }
  }
  return byKey;
}
