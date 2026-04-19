// Cross-course content quality audit for StudentNest.
// Runs the same detection patterns on EVERY approved question across
// every ApCourse value, producing per-course rollups + a kill-list.
//
// Patterns (intentionally conservative — no false positives beat false
// negatives at this scope; we add specific detectors as they're validated):
//   A. Malformed markdown fences (opening without close; prose after last close)
//   B. Explanation asserts a different letter than correctAnswer
//   C. Ultra-short question text with no stimulus AND no image
//   D. Options duplicate / empty / single-letter
//   E. Pseudocode bugs (only run on CS/Math courses where pseudocode expected)
//
// Usage: node scripts/audit-all-quality.mjs [--course AP_X]
// Output: scripts/logs/quality-audit-all-YYYY-MM-DD.json + stdout summary.

import { PrismaClient, ApCourse } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const arg = process.argv.find((a) => a.startsWith("--course="));
const onlyCourse = arg ? arg.slice("--course=".length) : null;

const FENCE = /```/g;

// Pseudocode-aware courses (broader detection applies here)
const PSEUDOCODE_COURSES = new Set([
  "AP_COMPUTER_SCIENCE_PRINCIPLES",
  "AP_COMPUTER_SCIENCE_A",
  "AP_CALCULUS_AB", "AP_CALCULUS_BC",
  "AP_STATISTICS",
]);

function optsAsArray(opts) {
  if (!opts) return null;
  if (Array.isArray(opts)) return opts;
  if (typeof opts === "string") { try { return JSON.parse(opts); } catch { return null; } }
  return null;
}

function detectMalformedFences(text) {
  if (!text) return null;
  const m = text.match(FENCE);
  if (!m) return null;
  if (m.length === 1) return "unmatched_opening_fence";
  if (m.length % 2 === 1) return "odd_fence_count";
  const last = text.lastIndexOf("```");
  const trailing = text.slice(last + 3).trim();
  if (trailing.length > 10 && /[.,!?]/.test(trailing)) return "prose_after_last_fence";
  return null;
}

function detectExplanationMismatch(q) {
  if (!q.explanation || !q.correctAnswer) return null;
  const correct = q.correctAnswer.trim().toUpperCase();
  const m = q.explanation.slice(0, 200).match(/\b([A-E])\s+is\s+(the\s+)?correct\b|\banswer\s+is\s+([A-E])\b|\bchoice\s+([A-E])\s+is\b/i);
  if (m) {
    const claimed = (m[1] || m[3] || m[4] || "").toUpperCase();
    if (claimed && correct && /^[A-E]$/.test(correct) && claimed !== correct) {
      return `explanation_claims_${claimed}_vs_correct_${correct}`;
    }
  }
  return null;
}

function detectOptionIssues(q) {
  const opts = optsAsArray(q.options);
  if (!opts) return "options_not_array";
  if (opts.length < 4) return `too_few_options:${opts.length}`;
  const letters = ["A", "B", "C", "D", "E"];
  const correct = (q.correctAnswer || "").trim().toUpperCase();
  if (!letters.includes(correct)) return `invalid_correct_answer:${q.correctAnswer}`;
  if (letters.indexOf(correct) >= opts.length) return `correct_answer_out_of_range:${correct}`;
  // Duplicate option bodies (letter prefix stripped)
  const stripped = opts.map((o) => String(o).replace(/^[A-E]\)\s*/, "").trim().toLowerCase());
  const uniq = new Set(stripped);
  if (uniq.size !== stripped.length) return "duplicate_options";
  for (let i = 0; i < opts.length; i++) {
    const core = String(opts[i]).replace(/^[A-E]\)\s*/, "").trim();
    if (core.length === 0) return `option_${letters[i]}_empty`;
    if (core.length === 1 && /[a-zA-Z]/.test(core)) return `option_${letters[i]}_single_letter`;
  }
  return null;
}

function detectUltraShort(q) {
  const textLen = (q.questionText || "").length;
  const stimLen = (q.stimulus || "").length;
  if (textLen < 40 && stimLen === 0 && !q.stimulusImageUrl) return `ultra_short_no_stimulus:${textLen}`;
  return null;
}

function detectPseudocodeBugs(q, course) {
  if (!PSEUDOCODE_COURSES.has(course)) return null;
  const combined = `${q.questionText || ""}\n${q.stimulus || ""}`;

  // Mixed-case same-name variables in pseudocode context
  const PROC_CTX = /PROCEDURE|RETURN|DISPLAY|REPEAT|FOR EACH|IF\s*\(|←|<-/i;
  if (!PROC_CTX.test(combined)) return null;

  const POSSIBLE = ["INDEX", "ITEM", "LIST", "RESULT", "COUNT", "TOTAL", "NUM", "SUM", "VAL", "VALUE", "TREND", "TEMP"];
  for (const U of POSSIBLE) {
    const uRe = new RegExp(`\\b${U}\\b`, "g");
    const lRe = new RegExp(`\\b${U.toLowerCase()}\\b`, "g");
    if ((combined.match(uRe) || []).length > 0 && (combined.match(lRe) || []).length > 0) {
      return `mixed_case_var:${U}`;
    }
  }

  // Undeclared loop variable in REPEAT UNTIL
  const untilMatch = combined.match(/REPEAT\s+UNTIL\s+(\w+)\s*[><=]/i);
  if (untilMatch) {
    const v = untilMatch[1];
    const beforeUntil = combined.slice(0, combined.indexOf(untilMatch[0]));
    const assignRe = new RegExp(`\\b${v}\\b\\s*(←|<-|=)`, "g");
    const paramRe = new RegExp(`PROCEDURE[^{(]*\\(([^)]*)\\)`, "g");
    const params = Array.from(beforeUntil.matchAll(paramRe)).flatMap((m) =>
      (m[1] || "").split(",").map((s) => s.trim())
    );
    if (!assignRe.test(beforeUntil) && !params.includes(v) && !["i", "j", "k"].includes(v.toLowerCase())) {
      return `loop_var_undeclared:${v}`;
    }
  }

  return null;
}

async function auditCourse(course) {
  const rows = await prisma.question.findMany({
    where: { course, isApproved: true },
    select: {
      id: true, unit: true, questionText: true, stimulus: true, stimulusImageUrl: true,
      options: true, correctAnswer: true, explanation: true, modelUsed: true,
    },
  });
  if (rows.length === 0) return null;

  const buckets = {
    malformed_fences: [],
    explanation_answer_mismatch: [],
    option_issues: [],
    ultra_short: [],
    pseudocode_bugs: [],
  };
  const flaggedIds = new Set();

  for (const q of rows) {
    const fence = detectMalformedFences(q.stimulus) || detectMalformedFences(q.questionText);
    if (fence) { buckets.malformed_fences.push({ id: q.id, unit: q.unit, issue: fence }); flaggedIds.add(q.id); }

    const mismatch = detectExplanationMismatch(q);
    if (mismatch) { buckets.explanation_answer_mismatch.push({ id: q.id, unit: q.unit, issue: mismatch }); flaggedIds.add(q.id); }

    const opt = detectOptionIssues(q);
    if (opt) { buckets.option_issues.push({ id: q.id, unit: q.unit, issue: opt }); flaggedIds.add(q.id); }

    const us = detectUltraShort(q);
    if (us) { buckets.ultra_short.push({ id: q.id, unit: q.unit, issue: us, text: (q.questionText || "").slice(0, 80) }); flaggedIds.add(q.id); }

    const pc = detectPseudocodeBugs(q, course);
    if (pc) { buckets.pseudocode_bugs.push({ id: q.id, unit: q.unit, issue: pc }); flaggedIds.add(q.id); }
  }

  return {
    course,
    total: rows.length,
    flagged: flaggedIds.size,
    flaggedPct: +((flaggedIds.size / rows.length) * 100).toFixed(1),
    buckets,
  };
}

async function main() {
  const courses = onlyCourse ? [onlyCourse] : Object.values(ApCourse);
  const results = {};
  let grandTotal = 0;
  let grandFlagged = 0;

  console.log(`Auditing ${courses.length} courses...\n`);

  for (const course of courses) {
    const r = await auditCourse(course);
    if (!r) continue;
    results[course] = r;
    grandTotal += r.total;
    grandFlagged += r.flagged;
  }

  // Stdout: course table sorted by flagged count
  const sorted = Object.values(results).sort((a, b) => b.flagged - a.flagged);
  console.log("Course                                               Total  Flagged  %");
  console.log("-".repeat(78));
  for (const r of sorted) {
    console.log(`${r.course.padEnd(50)} ${String(r.total).padStart(6)}  ${String(r.flagged).padStart(6)}  ${String(r.flaggedPct).padStart(5)}%`);
  }
  console.log("-".repeat(78));
  console.log(`GRAND TOTAL                                        ${String(grandTotal).padStart(6)}  ${String(grandFlagged).padStart(6)}  ${((grandFlagged/grandTotal)*100).toFixed(1)}%`);

  // Bucket totals across everything
  const bucketTotals = {};
  for (const r of Object.values(results)) {
    for (const [b, rows] of Object.entries(r.buckets)) {
      bucketTotals[b] = (bucketTotals[b] || 0) + rows.length;
    }
  }
  console.log("\nBucket totals across all courses:");
  for (const [b, n] of Object.entries(bucketTotals).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${b.padEnd(40)} ${n}`);
  }

  // Write full JSON
  const logDir = "scripts/logs";
  fs.mkdirSync(logDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const outFile = path.join(logDir, `quality-audit-all-${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ grandTotal, grandFlagged, bucketTotals, results }, null, 2));
  console.log(`\nReport: ${outFile}`);

  await prisma.$disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
