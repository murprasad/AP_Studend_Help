/**
 * Fidelity Agent — KPI A1. Measures how closely our bank matches real CB/ACT,
 * decomposed into dimensions (deterministic-first, per docs/KPI_FRAMEWORK).
 * Per course: each dimension 0-100, weighted into a composite Fidelity Score.
 *
 *   node scripts/measure-fidelity.mjs                # all courses
 *   COURSE=SAT_MATH node scripts/measure-fidelity.mjs
 * Output: data/fidelity-scorecards/fidelity-<date>.{json,md}. Read-only.
 *
 * Deterministic dims now: optionCountConsistency, figureIntegrity, noHintsInOptions,
 * answerPositionBalance, renderHealth, explanationQuality. Judge dims (cognitive
 * level, distractor plausibility, CB feel) are sampled-LLM — separate follow-up.
 * Product-agnostic (run in SN or PL).
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
if (!process.env.DATABASE_URL) {
  for (const f of [".env.local", ".env"]) {
    const p = join(root, f);
    if (existsSync(p)) for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
const COURSE = process.env.COURSE || null;
const stamp = new Date().toISOString().slice(0, 10);
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const bigWords = (s) => norm(s).split(" ").filter((w) => w.length > 3);
const showsMathWork = (e) => /=|\d\s*[+\-×x*/÷^]\s*\d|\bordered\b|\bsolv|\bsubstitut|\bfactor|√|\bslope\b|\bmedian\b|\bmean\b/i.test(e);

function optionStrings(options) {
  let o = options;
  if (typeof o === "string") { try { o = JSON.parse(o); } catch { o = [o]; } }
  if (!Array.isArray(o)) return [];
  return o.map((x) => String(typeof x === "string" ? x : (x?.text ?? x?.label ?? "")).replace(/^[A-E][).:\s-]+/i, "").trim());
}
function answerOf(options, correctAnswer) {
  const s = optionStrings(options);
  const L = String(correctAnswer || "").trim().toUpperCase();
  if (/^[A-E]$/.test(L)) return s[L.charCodeAt(0) - 65] || "";
  return s.find((x) => norm(x) === norm(correctAnswer)) || String(correctAnswer || "");
}
// 2026-06-09 — the old heuristic over-flagged (verified by sampling): the
// length<100 rule flagged terse-but-correct explanations ("Reduced deer
// population leads to less herbivory, allowing plant populations to increase"),
// and the answer-term-restate rule flagged any explanation that mentions the
// answer word ("...the molecule is RNA, as DNA contains deoxyribose...") even
// when it gives real reasoning. Genuinely-circular = adds NO information beyond
// restating the answer. Now: only truly-too-short, pure restatements, or a
// because-clause that repeats its own subject.
function isCircular(expl, ansText) {
  const e = (expl || "").trim();
  if (e.length < 40) return true;                              // too short to explain anything
  // pure restatement: just announces the answer with no reasoning
  if (/^\s*(the\s+(correct\s+)?answer\s+is\b|option\s+[a-e]\s+is\s+correct\b|[a-e]\s+is\s+(the\s+)?correct\b)/i.test(e) && e.length < 70) return true;
  // "X is correct because Y" where Y just repeats the words of X (real circularity)
  const m = e.match(/^(.*?)\bis correct because\b(.*)$/is);
  if (m) { const b = new Set(bigWords(m[1])); const a = bigWords(m[2]); if (a.length >= 2 && a.filter((w) => b.has(w)).length / a.length > 0.7) return true; }
  return false;
}
// dimension helpers (each returns true = GOOD for that question)
// 2026-06-09 — figureIntegrity was wildly over-counting: the old regex matched
// furniture "table" ("coffee on a table"), data-structure "graph/tree" (CS), and
// generic CONCEPT mentions ("a PV diagram", "which graph is used for...") where
// the question is fully answerable from text. That dragged figure scores to 0 for
// healthy courses (artifact, not reality — manual audit: 9 of 10 flagged were
// answerable). Now uses the SAME vetted detector as the Validation-Engine
// quarantine (scripts/_quarantine-figure-missing.mjs): only questions that
// reference a SPECIFIC displayed figure/passage count as figure-requiring.
const FIGURE_REQUIRED = [
  /\b(figure|fig\.?|table|graph|diagram|chart|exhibit)\s*\d+\b/i,
  /\bbased on (the )?(figure|graph|table|diagram|chart|data (in|shown))/i,
  /\brefer to the (figure|graph|table|diagram|chart)/i,
  /\b(shown|depicted|illustrated) in the (figure|graph|diagram|chart|table)/i,
  /\bthe (following|above|below|adjacent) (figure|graph|diagram|chart|data table)/i,
  /\bthe (figure|graph|diagram) (above|below|shown)/i,
];
const PASSAGE_REQUIRED = /\b(the|this) passage\b|\bin the passage\b|\bpassage (suggests|states|author|implies)\b/i;
function figureOk(q) {
  const t = q.questionText || "";
  const requires = FIGURE_REQUIRED.some((re) => re.test(t)) || PASSAGE_REQUIRED.test(t);
  if (!requires) return null;                                  // not figure-requiring → N/A
  return Boolean((q.stimulus && q.stimulus.trim().length >= 20) || (q.stimulusImageUrl && q.stimulusImageUrl.trim()));
}
const HINT_IN_OPT = /\b(because|since|therefore|which is why|this is correct|in order to|so that|due to the fact)\b/i;
const optHasHint = (opts) => optionStrings(opts).some((o) => HINT_IN_OPT.test(o));
function renderOk(q) {
  const t = (q.questionText || "") + " " + optionStrings(q.options).join(" ") + " " + (q.explanation || "");
  if (/\[object|undefined|NaN\b/.test(t)) return false;
  if (((t.match(/\$/g) || []).length) % 2 !== 0) return false;        // unmatched $ LaTeX
  if (/\\(frac|sqrt|sum|int)(?!\s*[\{\\a-z0-9])/i.test(t)) return false; // broken LaTeX command
  if (optionStrings(q.options).some((o) => o.length === 0)) return false; // empty option
  if (!String(q.questionText || "").trim()) return false;
  return true;
}
const clamp = (n) => Math.max(0, Math.min(100, Math.round(n * 10) / 10));

const prisma = new PrismaClient();
try {
  const where = { isApproved: true, ...(COURSE ? { course: COURSE } : {}) };
  const qs = await prisma.question.findMany({
    where, select: { course: true, questionText: true, options: true, correctAnswer: true, explanation: true, stimulus: true, stimulusImageUrl: true },
  });
  const byCourse = {};
  for (const q of qs) (byCourse[q.course] ??= []).push(q);

  const rows = [];
  for (const [course, list] of Object.entries(byCourse)) {
    const n = list.length;
    // option-count consistency vs modal count
    const counts = {};
    for (const q of list) { const c = optionStrings(q.options).length; counts[c] = (counts[c] ?? 0) + 1; }
    const modal = Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 0);
    const optConsistency = modal ? (counts[modal] / n) * 100 : 0;
    // figure integrity (only over questions that make a visual claim)
    let claim = 0, claimOk = 0;
    for (const q of list) { const r = figureOk(q); if (r !== null) { claim++; if (r) claimOk++; } }
    const figureIntegrity = claim ? (claimOk / claim) * 100 : 100;
    // no hints in options
    const noHints = (list.filter((q) => !optHasHint(q.options)).length / n) * 100;
    // answer-position balance: penalize skew of correct-letter distribution
    const letters = {};
    for (const q of list) { const L = String(q.correctAnswer || "").trim().toUpperCase(); if (/^[A-E]$/.test(L)) letters[L] = (letters[L] ?? 0) + 1; }
    const letterTotal = Object.values(letters).reduce((a, b) => a + b, 0);
    const maxFreq = letterTotal ? Math.max(...Object.values(letters)) / letterTotal : 0;
    const expected = modal ? 1 / modal : 0.25;
    const posBalance = letterTotal ? clamp(100 * (1 - Math.max(0, maxFreq - expected) / (1 - expected))) : 100;
    // render health
    const renderHealth = (list.filter(renderOk).length / n) * 100;
    // explanation quality
    const explQuality = (list.filter((q) => !isCircular(q.explanation, answerOf(q.options, q.correctAnswer))).length / n) * 100;

    const dims = {
      optionCountConsistency: clamp(optConsistency),
      figureIntegrity: clamp(figureIntegrity),
      noHintsInOptions: clamp(noHints),
      answerPositionBalance: clamp(posBalance),
      renderHealth: clamp(renderHealth),
      explanationQuality: clamp(explQuality),
    };
    const W = { explanationQuality: 0.2, figureIntegrity: 0.2, renderHealth: 0.2, noHintsInOptions: 0.15, optionCountConsistency: 0.15, answerPositionBalance: 0.1 };
    const composite = clamp(Object.entries(W).reduce((s, [k, w]) => s + dims[k] * w, 0));
    rows.push({ course, n, modalOptions: modal, visualClaims: claim, composite, dims });
  }
  rows.sort((a, b) => a.composite - b.composite);

  const outDir = join(root, "data", "fidelity-scorecards");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, `fidelity-${stamp}.json`), JSON.stringify({ generatedAt: new Date().toISOString(), target: 90, rows }, null, 2));
  const md = [
    `# Fidelity Scorecard — ${stamp}  (target ≥90/course)`, ``,
    `| Course | Fidelity | Expl | Figure | Render | Hints | OptCount | PosBal | n |`,
    `|---|---|---|---|---|---|---|---|---|`,
    ...rows.map((r) => `| ${r.course} | **${r.composite}** | ${r.dims.explanationQuality} | ${r.dims.figureIntegrity} | ${r.dims.renderHealth} | ${r.dims.noHintsInOptions} | ${r.dims.optionCountConsistency} | ${r.dims.answerPositionBalance} | ${r.n} |`),
    ``,
    `_Deterministic dims. Judge dims (cognitive level, distractor plausibility, CB feel) = sampled-LLM follow-up._`,
    `_Lowest composite = act first. Each dim < target points to the specific fix._`,
  ].join("\n");
  writeFileSync(join(outDir, `fidelity-${stamp}.md`), md);
  console.log(md.split("\n").slice(0, 18).join("\n"));
  console.log(`\n✅ Wrote data/fidelity-scorecards/fidelity-${stamp}.{json,md} (${rows.length} courses)`);
} catch (e) {
  console.error("Fidelity measurement failed:", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
