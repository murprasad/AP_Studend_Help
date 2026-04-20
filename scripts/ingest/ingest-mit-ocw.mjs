// Ingest MIT OpenCourseWare (OCW) problem sets and exams as grounding
// reference material for AP STEM generation.
//
// MIT OCW is licensed CC-BY-NC-SA 4.0. Problems are open-response (not
// MCQ), so we store them as `questionType = "PROBLEM_SET"` with the
// problem text in `questionText` and the solution (when available) in
// `explanation`. These rows are used as RIGOR REFERENCES during AI
// question generation, NOT served verbatim to students.
//
// Usage: node scripts/ingest/ingest-mit-ocw.mjs
//
// Budget: 45 min; target 30-100 problems per MIT course, 150-500 total.

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { extractPdfText, ensureRawDir, downloadPdf } from "./pdf-utils.mjs";
import { cleanPrompt, upsertSample } from "./_shared.mjs";

// Load .env for DATABASE_URL (scripts here assume env pre-loaded, but
// defensively load dotenv if present so this runs standalone).
try {
  const require = createRequire(import.meta.url);
  require("dotenv").config({ path: ".env" });
  try { require("dotenv").config({ path: ".env.local", override: true }); } catch {}
} catch {}

const prisma = new PrismaClient();

const LICENSE_MIT =
  "MIT OpenCourseWare CC-BY-NC-SA 4.0. Used as AI training/grounding " +
  "reference. Attribution: MIT OpenCourseWare. Fair use applies.";

const RAW_DIR_BASE = "data/raw/mit-ocw";

// ────────────────────────────────────────────────────────────────────────
// Source catalog: AP course → MIT course → list of (problem PDF, solution
// PDF?) pairs. Each entry is either:
//   { pdf: "https://..." } — direct PDF URL
//   { resource: "https://..." } — MIT OCW resource page URL; we scrape
//     the PDF href out of the HTML at ingest time.
// ────────────────────────────────────────────────────────────────────────

const SOURCES = [
  // ── AP CALCULUS AB + BC → MIT 18.01SC Single Variable Calculus ─────
  {
    apCourses: ["AP_CALCULUS_AB", "AP_CALCULUS_BC"],
    mitCourse: "18.01SC",
    mitTitle: "Single Variable Calculus",
    mitYear: 2010,
    urlBase: "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/",
    items: [
      // 4 hour exams + final, each with solution PDF (ocw.mit.edu CDN).
      { label: "Exam 1", problem: { pdf: "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/887263248c3f66128de1205f06993524_MIT18_01SCF10_exam1.pdf" }, solution: { pdf: "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/0817fc547c8edd2c29172f670a4d1d66_MIT18_01SCF10_exam1sol.pdf" } },
      { label: "Exam 2", problem: { pdf: "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/31f017f339405b5c2d7b273462522c23_MIT18_01SCF10_exam2.pdf" }, solution: { pdf: "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/8bc1745cc348551cb9b30fb6cc7f9ecf_MIT18_01SCF10_exam2sol.pdf" } },
      { label: "Exam 3", problem: { pdf: "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/a24ae17a1585cc320e5502b586fdc08d_MIT18_01SCF10_exam3.pdf" }, solution: { pdf: "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/2045fef2f2fa83e391fd95b39b083173_MIT18_01SCF10_exam3sol.pdf" } },
      { label: "Exam 4", problem: { pdf: "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/b8d6291f6109adf0a4b4cc623ef5f213_MIT18_01SCF10_exam4.pdf" }, solution: { pdf: "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/f1c8096b6d2d8021709b313e87991bd0_MIT18_01SCF10_exam4sol.pdf" } },
      { label: "Final Exam", problem: { pdf: "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/93c7107d33490a892fdf426e5033062e_MIT18_01SCF10_final.pdf" }, solution: { pdf: "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/bbbf05286af4bd705af325080bea0e23_MIT18_01SCF10_finalsol.pdf" } },
    ],
  },

  // ── AP PHYSICS 1 → MIT 8.01SC Classical Mechanics ───────────────────
  {
    apCourses: ["AP_PHYSICS_1"],
    mitCourse: "8.01SC",
    mitTitle: "Classical Mechanics",
    mitYear: 2016,
    urlBase: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/",
    items: [
      { label: "Problem Set 1 (Kinematics)", problem: { resource: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/resources/mit8_01f16_pset1_new/" } },
      { label: "Problem Set 2 (Newton's Laws)", problem: { resource: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/resources/mit8_01f16_pset2/" } },
      { label: "Problem Set 3 (Circular Motion)", problem: { resource: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/resources/mit8_01f16_pset3/" } },
      { label: "Problem Set 4 (Drag/Constraints)", problem: { resource: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/resources/mit8_01f16_pset4/" } },
      { label: "Problem Set 5 (Momentum/Impulse)", problem: { resource: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/resources/mit8_01f16_pset5/" } },
      { label: "Problem Set 6 (Continuous Mass Transfer)", problem: { resource: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/resources/mit8_01f16_pset6/" } },
      { label: "Problem Set 7 (Kinetic Energy/Work)", problem: { resource: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/resources/mit8_01f16_pset7/" } },
      { label: "Problem Set 8 (Potential Energy)", problem: { resource: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/resources/mit8_01f16_pset8/" } },
      { label: "Problem Set 9 (Collisions)", problem: { resource: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/resources/mit8_01f16_pset9/" } },
      { label: "Problem Set 10 (Rotational Motion)", problem: { resource: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/resources/mit8_01f16_pset10/" } },
      { label: "Problem Set 11 (Angular Momentum)", problem: { resource: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/resources/mit8_01f16_pset11/" } },
      { label: "Problem Set 12 (Rolling)", problem: { resource: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/resources/mit8_01f16_pset12/" } },
    ],
  },

  // ── AP CHEMISTRY → MIT 5.111SC Principles of Chemical Science ───────
  {
    apCourses: ["AP_CHEMISTRY"],
    mitCourse: "5.111SC",
    mitTitle: "Principles of Chemical Science",
    mitYear: 2014,
    urlBase: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/",
    items: [
      { label: "Practice Exam 1", problem: { resource: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/resources/mit5_111f14_practexam1/" }, solution: { resource: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/resources/mit5_111f14_practexam1sol/" } },
      { label: "Exam 1", problem: { resource: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/resources/mit5_111f14_exam1/" }, solution: { resource: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/resources/mit5_111f14_exam1sol/" } },
      { label: "Practice Exam 2", problem: { resource: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/resources/mit5_111f14_practexam2/" }, solution: { resource: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/resources/mit5_111f14_practexam2sol/" } },
      { label: "Exam 2", problem: { resource: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/resources/mit5_111f14_exam2/" }, solution: { resource: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/resources/mit5_111f14_exam2sol/" } },
      { label: "Practice Exam 3", problem: { resource: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/resources/mit5_111f14_practexam3/" }, solution: { resource: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/resources/mit5_111f14_practexam3sol/" } },
      { label: "Exam 3", problem: { resource: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/resources/mit5_111f14_exam3/" }, solution: { resource: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/resources/mit5_111f14_exam3sol/" } },
      { label: "Exam 4", problem: { resource: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/resources/mit5_111f14_exam4/" }, solution: { resource: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/resources/mit5_111f14_exam4sol/" } },
      { label: "Final Exam", problem: { resource: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/resources/mit5_111f14_finalexam/" }, solution: { resource: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/resources/mit5_111f14_finalexamsol/" } },
    ],
  },

  // ── AP BIOLOGY → MIT 7.01SC Fundamentals of Biology ─────────────────
  {
    apCourses: ["AP_BIOLOGY"],
    mitCourse: "7.01SC",
    mitTitle: "Fundamentals of Biology",
    mitYear: 2011,
    urlBase: "https://ocw.mit.edu/courses/7-01sc-fundamentals-of-biology-fall-2011/",
    items: [
      { label: "Exam 1 (Biochemistry)", problem: { resource: "https://ocw.mit.edu/courses/7-01sc-fundamentals-of-biology-fall-2011/resources/mit7_01scf11_exam1/" }, solution: { resource: "https://ocw.mit.edu/courses/7-01sc-fundamentals-of-biology-fall-2011/resources/mit7_01scf11_exam1_sol/" } },
      { label: "Exam 2 (Molecular Biology)", problem: { resource: "https://ocw.mit.edu/courses/7-01sc-fundamentals-of-biology-fall-2011/resources/mit7_01scf11_exam2/" }, solution: { resource: "https://ocw.mit.edu/courses/7-01sc-fundamentals-of-biology-fall-2011/resources/mit7_01scf11_exam2_sol/" } },
      { label: "Exam 3 (Genetics)", problem: { resource: "https://ocw.mit.edu/courses/7-01sc-fundamentals-of-biology-fall-2011/resources/mit_7_01scf11_exam3/" }, solution: { resource: "https://ocw.mit.edu/courses/7-01sc-fundamentals-of-biology-fall-2011/resources/mit_7_01scf11_exam3_sol/" } },
      { label: "Exam 4 (Recombinant DNA)", problem: { resource: "https://ocw.mit.edu/courses/7-01sc-fundamentals-of-biology-fall-2011/resources/mit7_01scf11_exam4/" }, solution: { resource: "https://ocw.mit.edu/courses/7-01sc-fundamentals-of-biology-fall-2011/resources/mit7_01scf11_exam4_sol/" } },
    ],
  },

  // ── AP STATISTICS → MIT 18.05 Intro to Probability and Statistics ───
  {
    apCourses: ["AP_STATISTICS"],
    mitCourse: "18.05",
    mitTitle: "Introduction to Probability and Statistics",
    mitYear: 2022,
    urlBase: "https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/",
    items: [
      // Problem sets (pset01..pset11)
      ...Array.from({ length: 11 }, (_, i) => {
        const n = String(i + 1).padStart(2, "0");
        return {
          label: `Problem Set ${i + 1}`,
          problem: { resource: `https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/resources/mit18_05_s22_pset${n}_pdf/` },
          solution: { resource: `https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/resources/mit18_05_s22_pset${n}_sol_pdf/` },
        };
      }),
      // Actual exams
      { label: "Exam 1", problem: { resource: "https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/resources/mit18_05_s22_exam01_pdf/" }, solution: { resource: "https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/resources/mit18_05_s22_exam01_sol_pdf/" } },
      { label: "Exam 2", problem: { resource: "https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/resources/mit18_05_s22_exam02_pdf/" }, solution: { resource: "https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/resources/mit18_05_s22_exam02_sol_pdf/" } },
      { label: "Final Exam", problem: { resource: "https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/resources/mit18_05_s22_exam_final_pdf/" }, solution: { resource: "https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/resources/mit18_05_s22_exam_final_sol_pdf/" } },
    ],
  },
];

// ────────────────────────────────────────────────────────────────────────
// URL resolution
// ────────────────────────────────────────────────────────────────────────

/**
 * Resolve a source spec to a real PDF URL.
 *   { pdf: url } → url
 *   { resource: url } → fetch HTML, find first `.pdf` href, absolutize.
 */
async function resolveToPdfUrl(spec) {
  if (!spec) return null;
  if (spec.pdf) return spec.pdf;
  if (!spec.resource) return null;

  const res = await fetch(spec.resource, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15",
    },
  });
  if (!res.ok) throw new Error(`resource page HTTP ${res.status} for ${spec.resource}`);
  const html = await res.text();
  // Match hrefs like "/courses/.../hash_FOO.pdf" or escaped forms.
  const matches = html.match(/(?:href=|content=|["'])\\?\/courses\/[^"'\\]*\.pdf/g) || [];
  for (const m of matches) {
    const cleaned = m
      .replace(/^(href=|content=)/, "")
      .replace(/^["']/, "")
      .replace(/\\\//g, "/")
      .replace(/["'].*$/, "");
    if (cleaned.endsWith(".pdf")) {
      // Absolutize against ocw.mit.edu
      return `https://ocw.mit.edu${cleaned}`;
    }
  }
  throw new Error(`no PDF link found on resource page ${spec.resource}`);
}

// ────────────────────────────────────────────────────────────────────────
// Problem splitter — open-ended MIT PDFs use "1.", "2.", "Problem 1.", etc.
// We split on numbered markers and also try "Problem N." headers.
// ────────────────────────────────────────────────────────────────────────

function splitProblems(fullText, opts = {}) {
  const minLen = opts.minLen || 80;
  const maxLen = opts.maxLen || 4000;

  let body = fullText
    .replace(/=+ PAGE BREAK =+/g, "\n")
    .replace(/\f/g, "\n");

  // Trim boilerplate headers/footers that repeat on every page.
  body = body
    .replace(/MIT OpenCourseWare[\s\S]*?ocw\.mit\.edu/gi, " ")
    .replace(/For information about citing these materials[^\n]*/gi, " ")
    .replace(/https?:\/\/ocw\.mit\.edu\/terms[^\s]*/gi, " ");

  // Try "Problem N" / "Question N" markers first (8.01 psets use
  // "Problem 1:", 7.01 exams use "Question 1").
  const problemMarkerRe = /(?:^|\n)\s*(?:Problem|Question)\s+(\d{1,2})[.:]?\s*([\s\S]*?)(?=\n\s*(?:Problem|Question)\s+\d{1,2}[.:]?\s|$)/gi;
  const byProblem = [];
  let m;
  while ((m = problemMarkerRe.exec(body)) !== null) {
    const qNum = parseInt(m[1], 10);
    if (qNum < 1 || qNum > 20) continue;
    let text = cleanPrompt(m[2]);
    if (text.length >= minLen) {
      if (text.length > maxLen) text = text.slice(0, maxLen);
      byProblem.push({ qNum, text });
    }
  }
  if (byProblem.length >= 2) return dedupeByQnum(byProblem);

  // Fallback: numeric "N." markers at line start (1. ... 2. ... 3. ...).
  const numRe = /(?:^|\n)\s*(\d{1,2})\s*\.\s*([A-Z(\[][\s\S]*?)(?=\n\s*\d{1,2}\s*\.\s*[A-Z(\[]|$)/g;
  const byNum = [];
  while ((m = numRe.exec(body)) !== null) {
    const qNum = parseInt(m[1], 10);
    if (qNum < 1 || qNum > 20) continue;
    let text = cleanPrompt(m[2]);
    if (text.length >= minLen) {
      if (text.length > maxLen) text = text.slice(0, maxLen);
      byNum.push({ qNum, text });
    }
  }
  if (byNum.length >= 1) return dedupeByQnum(byNum);

  // Last resort: if we parsed nothing, treat the whole doc as ONE problem
  // (still useful for rigor reference). Trim whitespace & cap.
  const whole = cleanPrompt(body);
  if (whole.length >= minLen) {
    return [{ qNum: 1, text: whole.slice(0, maxLen) }];
  }
  return [];
}

function dedupeByQnum(items) {
  const byNum = new Map();
  for (const it of items) {
    const ex = byNum.get(it.qNum);
    if (!ex || it.text.length > ex.text.length) byNum.set(it.qNum, it);
  }
  return [...byNum.values()].sort((a, b) => a.qNum - b.qNum);
}

// ────────────────────────────────────────────────────────────────────────
// Ingest loop
// ────────────────────────────────────────────────────────────────────────

async function ingestItem(source, item) {
  const dir = ensureRawDir(`${RAW_DIR_BASE}/${source.mitCourse.replace(/[.\s]/g, "_")}`);
  const problemUrl = await resolveToPdfUrl(item.problem);
  if (!problemUrl) return { created: 0, updated: 0, parsed: 0, failed: 1, url: null };

  const pFile = path.basename(new URL(problemUrl).pathname);
  const pPath = `${dir}/${pFile}`;
  await downloadPdf(problemUrl, pPath);

  let solutionText = null;
  let solutionUrl = null;
  if (item.solution) {
    try {
      solutionUrl = await resolveToPdfUrl(item.solution);
      if (solutionUrl) {
        const sFile = path.basename(new URL(solutionUrl).pathname);
        const sPath = `${dir}/${sFile}`;
        await downloadPdf(solutionUrl, sPath);
        const sExtract = await extractPdfText(sPath);
        solutionText = sExtract.fullText;
      }
    } catch (e) {
      console.log(`    solution fetch failed: ${(e && e.message) || e}`);
    }
  }

  const { fullText } = await extractPdfText(pPath);
  const problems = splitProblems(fullText);
  console.log(`    parsed ${problems.length} problem(s) from ${item.label}`);

  // For each parsed problem, try to find a matching solution excerpt by
  // the same qNum marker. Solutions are messy; we use best-effort.
  const solByQ = solutionText ? extractSolutionsByQ(solutionText) : new Map();

  let created = 0, updated = 0;
  for (const p of problems) {
    const explanation = solByQ.get(p.qNum) || null;
    for (const apCourse of source.apCourses) {
      const res = await upsertSample(prisma, {
        course: apCourse,
        unit: null,
        year: source.mitYear,
        sourceUrl: problemUrl,
        sourceName: `MIT OpenCourseWare \u2014 ${source.mitCourse}: ${source.mitTitle}`,
        questionText: `[${item.label} \u2014 Problem ${p.qNum}]\n${p.text}`,
        stimulus: null,
        options: null,
        correctAnswer: null,
        explanation,
        questionType: "PROBLEM_SET",
        licenseNotes: LICENSE_MIT,
      });
      created += res.created;
      updated += res.updated;
    }
  }
  return { created, updated, parsed: problems.length, failed: 0, url: problemUrl };
}

function extractSolutionsByQ(solText) {
  const out = new Map();
  let body = solText.replace(/=+ PAGE BREAK =+/g, "\n").replace(/\f/g, "\n");

  // Try "Problem N" / "Question N" style first
  const re1 = /(?:^|\n)\s*(?:Problem|Question)\s+(\d{1,2})[.:]?\s*([\s\S]*?)(?=\n\s*(?:Problem|Question)\s+\d{1,2}[.:]?\s|$)/gi;
  let m;
  while ((m = re1.exec(body)) !== null) {
    const q = parseInt(m[1], 10);
    const t = cleanPrompt(m[2]);
    if (t.length >= 40 && (!out.has(q) || out.get(q).length < t.length)) {
      out.set(q, t.slice(0, 4000));
    }
  }
  if (out.size >= 1) return out;

  const re2 = /(?:^|\n)\s*(\d{1,2})\s*\.\s*([\s\S]*?)(?=\n\s*\d{1,2}\s*\.\s*|$)/g;
  while ((m = re2.exec(body)) !== null) {
    const q = parseInt(m[1], 10);
    if (q < 1 || q > 20) continue;
    const t = cleanPrompt(m[2]);
    if (t.length >= 40 && (!out.has(q) || out.get(q).length < t.length)) {
      out.set(q, t.slice(0, 4000));
    }
  }
  return out;
}

async function main() {
  const started = Date.now();
  console.log(`\n==== Ingesting MIT OCW problem sets for AP STEM ====\n`);

  const report = {
    perMitCourse: [],
    perApCourse: new Map(),
    failedPdfs: [],
    totalCreated: 0,
    totalUpdated: 0,
    totalProblems: 0,
  };

  for (const source of SOURCES) {
    console.log(`\n\u2014 ${source.mitCourse} ${source.mitTitle} \u2014`);
    console.log(`  AP mapping: ${source.apCourses.join(", ")}`);
    let cCreated = 0, cUpdated = 0, cProblems = 0;

    for (const item of source.items) {
      console.log(`  [${item.label}]`);
      try {
        const r = await ingestItem(source, item);
        cCreated += r.created;
        cUpdated += r.updated;
        cProblems += r.parsed;
        if (r.failed || r.parsed === 0) {
          report.failedPdfs.push({
            mitCourse: source.mitCourse,
            label: item.label,
            url: r.url || (item.problem.pdf || item.problem.resource),
            reason: r.parsed === 0 ? "no problems parsed" : "download/resolve failed",
          });
        }
      } catch (e) {
        const msg = (e && e.message) || String(e);
        console.log(`    ERROR: ${msg.slice(0, 200)}`);
        report.failedPdfs.push({
          mitCourse: source.mitCourse,
          label: item.label,
          url: item.problem.pdf || item.problem.resource,
          reason: msg.slice(0, 200),
        });
      }
    }
    report.perMitCourse.push({
      mitCourse: source.mitCourse,
      mitTitle: source.mitTitle,
      apCourses: source.apCourses,
      problemsParsed: cProblems,
      rowsCreated: cCreated,
      rowsUpdated: cUpdated,
    });
    for (const ap of source.apCourses) {
      const prev = report.perApCourse.get(ap) || { created: 0, updated: 0 };
      report.perApCourse.set(ap, {
        created: prev.created + cCreated,
        updated: prev.updated + cUpdated,
      });
    }
    report.totalCreated += cCreated;
    report.totalUpdated += cUpdated;
    report.totalProblems += cProblems;
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\n==== MIT OCW INGESTION COMPLETE (${elapsed}s) ====\n`);

  console.log("Per MIT course:");
  for (const r of report.perMitCourse) {
    console.log(
      `  ${r.mitCourse} ${r.mitTitle} \u2192 ${r.apCourses.join(", ")}: ` +
      `${r.problemsParsed} problems parsed, ${r.rowsCreated} created, ${r.rowsUpdated} updated`
    );
  }
  console.log("\nPer AP course (OfficialSample rows touched):");
  for (const [ap, v] of report.perApCourse.entries()) {
    console.log(`  ${ap}: ${v.created} created + ${v.updated} updated`);
  }
  if (report.failedPdfs.length) {
    console.log(`\nFailed PDFs (${report.failedPdfs.length}):`);
    for (const f of report.failedPdfs) {
      console.log(`  [${f.mitCourse}] ${f.label} \u2014 ${f.reason}`);
      console.log(`    ${f.url}`);
    }
  }
  console.log(
    `\nTotals: ${report.totalProblems} problems parsed, ` +
    `${report.totalCreated} rows created, ${report.totalUpdated} rows updated.`
  );

  // Also count overall PROBLEM_SET rows now in the DB.
  const dbTotal = await prisma.officialSample.count({
    where: { questionType: "PROBLEM_SET" },
  });
  console.log(`DB total OfficialSample rows with questionType=PROBLEM_SET: ${dbTotal}`);

  await prisma.$disconnect();
  return report;
}

const isDirect = import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isDirect) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
export { main };
