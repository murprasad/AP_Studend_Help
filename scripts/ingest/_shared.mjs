// Shared helpers for AP FRQ ingestion scripts.
//
// - tryDownload: iterate candidate URLs, return first that returns a PDF
// - cleanPrompt: strip CB boilerplate (copyright lines, page numbers, GO-ON markers)
// - genericFrqParse: parse "1. ... 2. ..." style Section II FRQs (science/math/stats)
// - upsertSample: avoids duplicate rows when re-run
// - summarizeCourse: end-of-run report per course

import { downloadPdf } from "./pdf-utils.mjs";

export const LICENSE =
  "\u00a9 College Board \u2014 used as AI training/grounding reference under " +
  "fair use. Not redistributed verbatim to students. Stored for RAG " +
  "retrieval during question generation only.";

export async function tryDownload(candidates, destDir) {
  for (const url of candidates) {
    const filename = url.split("/").pop();
    const pdfPath = `${destDir}/${filename}`;
    try {
      await downloadPdf(url, pdfPath);
      return { url, pdfPath };
    } catch (e) {
      const msg = (e && e.message ? e.message : String(e)).slice(0, 80);
      console.log(`    miss ${filename}: ${msg}`);
    }
  }
  return null;
}

/**
 * Scrub common CB boilerplate from an extracted question prompt.
 * Keeps the substantive prompt intact; removes page numbers, copyright
 * footers, "GO ON TO THE NEXT PAGE" markers, and "Write your response..."
 * instructions that follow every prompt.
 */
export function cleanPrompt(raw) {
  let s = raw;
  s = s.replace(/GO ON TO THE NEXT PAGE\.?/gi, " ");
  s = s.replace(/END OF SECTION [IVX]+/gi, " ");
  s = s.replace(/END OF EXAM/gi, " ");
  s = s.replace(/©\s*\d{4}\s*College Board[^\n]*/gi, " ");
  s = s.replace(/Visit College Board on the web[^\n]*/gi, " ");
  s = s.replace(/AP Central is the official online home[^\n]*/gi, " ");
  s = s.replace(
    /Write your responses?[^.]*designated[^.]*\.(?:[^\n]*booklet[^.]*\.?)?/gi,
    " "
  );
  s = s.replace(
    /Begin your response to this question[^.]*(?:Free Response|designated)[^.]*\.[^\n]*/gi,
    " "
  );
  s = s.replace(/WHEN YOU FINISH WRITING[^\n]*/gi, " ");
  s = s.replace(/_{3,}/g, " ");
  s = s.replace(/\n\s*\d+\s*\n/g, "\n"); // orphan page numbers on a line
  s = s.replace(/=+ PAGE BREAK =+/g, " ");
  // Postgres rejects \u0000 in text; also strip other control chars
  // that snuck in from PDF extraction.
  // eslint-disable-next-line no-control-regex
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/**
 * Parse Section II of a science/math/stats AP FRQ PDF into individual
 * question prompts. These exams follow a simple "1. ... 2. ... 3. ..."
 * numbering where each number at the start of a line begins a question.
 *
 * Strategy:
 *   1. Drop everything before "SECTION II" (equation tables, directions).
 *   2. Find matches of "(^|\n)(N).{Uppercase start}" for N=1..10.
 *   3. Slice between consecutive markers; last slice ends at STOP/END OF EXAM.
 */
export function genericFrqParse(fullText, opts = {}) {
  const minLen = opts.minLen || 120;
  const maxQ = opts.maxQ || 10;

  // Find Section II boundary; if absent, use the first "1." in the body.
  // CB PDFs sometimes start the question body with a parenthetical or a
  // non-uppercase word (e.g. "1.(7 points, ...)"), so the marker after the
  // dot can be any printable char, not strictly [A-Z].
  let body = fullText;
  const sec2Idx = body.search(/SECTION\s+II\b/i);
  if (sec2Idx >= 0) {
    body = body.slice(sec2Idx);
    // Skip past the first "Directions:" block if present so it doesn't
    // bleed into Q1's prompt. Cut at the first line-leading "1."
    const q1Idx = body.search(/\n\s*1\s*\.\s*\S/);
    if (q1Idx > 0) body = body.slice(q1Idx);
  } else {
    const idx = body.search(/\n\s*1\s*\.\s*\S/);
    if (idx > 0) body = body.slice(idx);
  }

  // Trim tail
  body = body
    .replace(/STOP\s*END OF EXAM[\s\S]*$/i, "")
    .replace(/END OF EXAM[\s\S]*$/i, "");

  // A question marker = a line beginning with "N." followed by ANY non-space char.
  const regex = /(?:^|\n)\s*(\d{1,2})\s*\.\s*(\S[\s\S]*?)(?=\n\s*\d{1,2}\s*\.\s*\S|\n\s*STOP\b|\nEND OF EXAM|$)/g;
  const out = [];
  let m;
  while ((m = regex.exec(body)) !== null) {
    const qNum = parseInt(m[1], 10);
    if (qNum < 1 || qNum > maxQ) continue;
    const cleaned = cleanPrompt(m[2]);
    if (cleaned.length < minLen) continue;
    out.push({ qNum, prompt: cleaned });
  }
  return dedupeByQnum(out);
}

function dedupeByQnum(items) {
  // If numbers repeat (reprinted scoring section), keep the longer prompt.
  const byNum = new Map();
  for (const it of items) {
    const ex = byNum.get(it.qNum);
    if (!ex || it.prompt.length > ex.prompt.length) byNum.set(it.qNum, it);
  }
  return [...byNum.values()].sort((a, b) => a.qNum - b.qNum);
}

/**
 * Upsert an OfficialSample row without a transaction. We match on
 * (course, year, sourceUrl, questionType + first 60 chars) to be
 * idempotent across re-runs while tolerating minor re-parses.
 */
export async function upsertSample(prisma, data) {
  const existing = await prisma.officialSample.findFirst({
    where: {
      course: data.course,
      year: data.year,
      sourceUrl: data.sourceUrl,
      questionType: data.questionType,
      questionText: { startsWith: data.questionText.slice(0, 60) },
    },
    select: { id: true },
  });
  if (existing) {
    await prisma.officialSample.update({ where: { id: existing.id }, data });
    return { created: 0, updated: 1 };
  }
  await prisma.officialSample.create({ data });
  return { created: 1, updated: 0 };
}

export async function removeHandAuthored(prisma, course) {
  const r = await prisma.officialSample.deleteMany({
    where: { course, sourceName: { contains: "CB-Style Reference" } },
  });
  return r.count;
}

/**
 * Parse an AP US History or AP World History FRQ PDF. Returns a typed list:
 *   [{ qNum, questionType: "SAQ" | "DBQ" | "LEQ", prompt }]
 *
 * Structure:
 *   Section I Part B: SAQs numbered 1, 2, 3, 4 (student answers 1 & 2, then
 *     either 3 or 4). Each SAQ may be preceded by a stimulus excerpt or image
 *     caption that we include in the prompt text.
 *   Section II Question 1: DBQ (single prompt + 7 documents, we just take
 *     the prompt line).
 *   Section II Questions 2, 3, 4: LEQ (each is one prompt sentence).
 */
export function parseHistoryFrq(fullText) {
  const out = [];

  // Split into the two major sections by the SECTION II marker.
  const sec2Idx = fullText.search(/SECTION\s+II\b/i);
  const section1 = sec2Idx > 0 ? fullText.slice(0, sec2Idx) : fullText;
  const section2 = sec2Idx > 0 ? fullText.slice(sec2Idx) : "";

  // --- Section I: SAQs ---
  // Strip the directions preamble by cutting at the first line-leading "1."
  const s1Body = (() => {
    const idx = section1.search(/\n\s*1\s*\.\s*[A-Z]/);
    return idx > 0 ? section1.slice(idx) : section1;
  })().replace(/END OF SECTION [IVX]+[\s\S]*$/i, "");

  // SAQ question markers; content goes until the next SAQ marker or end.
  // We want the QUESTION TEXT + any immediately preceding stimulus excerpt
  // (quoted passage) that lives on the same page. For brevity, just capture
  // from the marker forward; the stimulus is often on a previous page in
  // the PDF so this is a best-effort extraction.
  const saqRe = /(?:^|\n)\s*(\d{1,2})\s*\.\s*(\S[\s\S]*?)(?=\n\s*\d{1,2}\s*\.\s*\S|$)/g;
  let m;
  while ((m = saqRe.exec(s1Body)) !== null) {
    const qNum = parseInt(m[1], 10);
    if (qNum < 1 || qNum > 4) continue;
    const cleaned = cleanPrompt(m[2]);
    if (cleaned.length < 80) continue;
    out.push({ qNum, questionType: "SAQ", prompt: cleaned });
  }

  // --- Section II: DBQ (Question 1) + LEQs (Questions 2-4) ---
  if (section2) {
    // DBQ: starts with "1." after the Question 1 (Document-Based Question)
    // heading; ends at "END OF DOCUMENTS" or similar.
    const dbqMatch = section2.match(
      /Question\s+1\s*\(Document-Based[\s\S]*?\n\s*1\s*\.\s*([\s\S]*?)(?=\n?\s*Document\s+1\b|END OF DOCUMENTS|$)/i
    );
    if (dbqMatch) {
      const cleaned = cleanPrompt(dbqMatch[1]);
      if (cleaned.length >= 40) {
        out.push({ qNum: 1, questionType: "DBQ", prompt: cleaned });
      }
    } else {
      // Fallback: first "1." after "SECTION II"
      const alt = section2.match(/\n\s*1\s*\.\s*(Evaluate[\s\S]*?)(?=\n\s*Document\s+1|\n\s*2\s*\.\s*Evaluate|$)/);
      if (alt) {
        const cleaned = cleanPrompt(alt[1]);
        if (cleaned.length >= 40) out.push({ qNum: 1, questionType: "DBQ", prompt: cleaned });
      }
    }

    // LEQs: after the "Long Essay" heading, parse Q2/Q3/Q4 numeric markers.
    const leqStart = section2.search(/Long Essay\)/i);
    if (leqStart > 0) {
      const leqBody = section2.slice(leqStart);
      const leqRe = /\n\s*([234])\s*\.\s*(\S[^\n]*(?:\n(?!\s*[234]\s*\.)[^\n]*)*)/g;
      let lm;
      while ((lm = leqRe.exec(leqBody)) !== null) {
        const qNum = parseInt(lm[1], 10);
        const cleaned = cleanPrompt(lm[2]);
        if (cleaned.length >= 30) {
          out.push({ qNum, questionType: "LEQ", prompt: cleaned });
        }
      }
    }
  }

  return out;
}

/**
 * Parse an AP Psychology 2024-or-earlier FRQ PDF (old format: 2 FRQs
 * "1. ..." "2. ..."). Returns typed list.
 */
export function parsePsychFrqOld(fullText) {
  const prompts = genericFrqParse(fullText, { minLen: 200, maxQ: 3 });
  return prompts.map((p) => ({ ...p, questionType: "FRQ" }));
}

/**
 * Parse an AP Psychology 2025+ FRQ PDF (new format: 1 AAQ + 1 EBQ).
 * Q1 = Article Analysis Question, Q2 = Evidence-Based Question.
 */
export function parsePsychFrqNew(fullText) {
  const prompts = genericFrqParse(fullText, { minLen: 150, maxQ: 3 });
  // The new-format exam has exactly 2 questions (AAQ then EBQ). Anything
  // beyond Q2 is almost certainly a numbered subsection (e.g. "3. Results")
  // inside the EBQ source material.
  return prompts
    .filter((p) => p.qNum === 1 || p.qNum === 2)
    .map((p) => ({
      ...p,
      questionType: p.qNum === 1 ? "AAQ" : "EBQ",
    }));
}

export async function summarizeCourse(prisma, course) {
  const total = await prisma.officialSample.count({ where: { course } });
  const byType = await prisma.officialSample.groupBy({
    by: ["questionType"],
    where: { course },
    _count: true,
  });
  return { total, byType };
}
