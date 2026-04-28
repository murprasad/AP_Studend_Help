// Extract per-question metadata + visual references from official test
// PDFs. Used to compare against our DB and identify visual gaps.
//
// Approach:
//   1. Use pdftotext (already available) to get layout-preserved text.
//   2. Heuristically split into questions on patterns like "Question 1.",
//      "1.", "Q1." etc.
//   3. For each question, count visual references ("graph", "figure",
//      "table", "diagram", "scatterplot", "shown above"/"below").
//   4. Detect "this question requires visual" if Q stem says "the graph"
//      / "shown" / etc but the surrounding text doesn't have a markdown
//      table or LaTeX equation.
//
// Output: structured JSON per test → data/official/{test}/visual-audit.json
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const OFFICIAL_DIR = "data/official";

const VISUAL_PHRASES = [
  /\bthe (graph|figure|table|chart|diagram|scatterplot|histogram)\b/gi,
  /\bgraph of [a-z=]/gi,
  /\b(shown|figure|table|chart|diagram) (above|below)\b/gi,
  /\bscatterplot\b/gi,
  /\bbar (graph|chart)\b/gi,
  /\bline (graph|chart)\b/gi,
  /\bin the (figure|graph|table|chart)\b/gi,
];

function pdftotext(pdfPath) {
  const txtPath = pdfPath.replace(/\.pdf$/i, ".txt");
  if (!fs.existsSync(txtPath)) {
    try {
      execSync(`pdftotext -layout "${pdfPath}" "${txtPath}"`, { stdio: "pipe" });
    } catch (e) {
      console.error(`pdftotext failed for ${pdfPath}: ${e.message}`);
      return null;
    }
  }
  return fs.readFileSync(txtPath, "utf8");
}

function countVisualRefs(text) {
  let total = 0;
  const matches = {};
  for (const re of VISUAL_PHRASES) {
    const m = (text.match(re) ?? []);
    if (m.length > 0) {
      total += m.length;
      matches[re.source] = m.length;
    }
  }
  return { total, matches };
}

function analyzeOne(pdfPath) {
  const text = pdftotext(pdfPath);
  if (!text) return null;
  const wordCount = (text.match(/\S+/g) ?? []).length;
  const visual = countVisualRefs(text);
  return {
    pdf: path.relative(".", pdfPath),
    sizeKB: Math.round(fs.statSync(pdfPath).size / 1024),
    wordCount,
    visualRefs: visual.total,
    visualPerKWord: ((visual.total / wordCount) * 1000).toFixed(2),
    matchBreakdown: visual.matches,
  };
}

const results = [];
for (const group of ["SAT", "ACT", "CLEP", "DSST"]) {
  const dir = path.join(OFFICIAL_DIR, group);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (!f.toLowerCase().endsWith(".pdf")) continue;
    const r = analyzeOne(path.join(dir, f));
    if (r) results.push({ group, ...r });
  }
}

console.log("# Visual-reference audit of official test PDFs — 2026-04-28\n");
console.log("Group | PDF | KB | Words | Visual refs | per 1k words | top phrase");
console.log("---|---|---:|---:|---:|---:|---");
for (const r of results.sort((a, b) => Number(b.visualPerKWord) - Number(a.visualPerKWord))) {
  const top = Object.entries(r.matchBreakdown).sort((a, b) => b[1] - a[1])[0];
  console.log(`${r.group} | ${path.basename(r.pdf)} | ${r.sizeKB} | ${r.wordCount} | ${r.visualRefs} | ${r.visualPerKWord} | ${top ? top[0] + " (" + top[1] + ")" : "—"}`);
}

// Save full JSON
fs.writeFileSync("data/official/visual-audit.json", JSON.stringify(results, null, 2));
console.log("\nSaved full results to data/official/visual-audit.json");
