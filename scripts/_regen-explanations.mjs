/**
 * Explanation-regen engine — fixes the systemic "X is correct because X" /
 * non-teaching explanation defect (BIQ 2026-06-07, found via Darryl Winfrey's
 * CLEP Sociology session). See docs/BIQ_CIRCULAR_EXPLANATIONS_2026-06-07.md.
 *
 * Pipeline per question:
 *   1. DETECT (deterministic) circular / too-short explanations.
 *   2. REGEN via Groq grounded in the question + its FIXED correct answer
 *      (we never change the answer — only rewrite the rationale).
 *   3. VALIDATE (deterministic): not circular, teaches "why", references the
 *      answer concept, sane length. Fail → keep the old explanation (fail safe).
 *   4. WRITE BACK only validated regens. isApproved is untouched.
 *
 *   node scripts/_regen-explanations.mjs                         # detect-only, all CLEP, counts
 *   COURSE=CLEP_INTRODUCTORY_SOCIOLOGY node ...                  # detect-only, one course
 *   REGEN=1 LIMIT=5 COURSE=... node ...                          # regen+validate, DRY (no write)
 *   APPLY=1 REGEN=1 LIMIT=200 COURSE=... node ...               # write validated regens
 */
import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
if (!process.env.DATABASE_URL || !process.env.GROQ_API_KEY) {
  for (const f of [".env.local", ".env"]) {
    const p = join(root, f);
    if (existsSync(p)) for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const COURSE = process.env.COURSE || null;
const REGEN = process.env.REGEN === "1";
const APPLY = process.env.APPLY === "1";
const LIMIT = Number(process.env.LIMIT || 5);
const GROQ_KEY = process.env.GROQ_API_KEY;

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const bigWords = (s) => norm(s).split(" ").filter((w) => w.length > 3);

// Resolve the correct-answer option text from a letter + options array.
function answerText(options, correctAnswer) {
  let opts = options;
  if (typeof opts === "string") { try { opts = JSON.parse(opts); } catch { opts = [opts]; } }
  if (!Array.isArray(opts)) return String(correctAnswer || "");
  const strs = opts.map((o) => (typeof o === "string" ? o : (o?.text ?? o?.label ?? JSON.stringify(o))));
  const stripped = strs.map((s) => String(s).replace(/^[A-E][).:\s-]+/i, "").trim());
  const letter = String(correctAnswer || "").trim().toUpperCase();
  if (/^[A-E]$/.test(letter)) {
    const idx = letter.charCodeAt(0) - 65;
    if (stripped[idx]) return stripped[idx];
  }
  // HIGH-2 fix: when correctAnswer is the full text (not a letter), prefer an
  // EXACT normalized match before any substring match — else a superstring
  // option ("Geographic community boundaries") wins over the real answer
  // ("Geographic community") and the regen grounds on the wrong option.
  const target = norm(String(correctAnswer || ""));
  const exact = stripped.find((s) => norm(s) === target);
  if (exact) return exact;
  const inc = stripped.find((s) => target.length > 2 && norm(s).includes(target));
  return inc || String(correctAnswer || "");
}

// Word-overlap fraction of `t`'s significant words present in explanation set.
function overlapFrac(t, explWordSet) {
  const w = bigWords(t);
  return w.length ? w.filter((x) => explWordSet.has(x)).length / w.length : 0;
}

// All option strings (letter-prefix stripped) for distractor-dominance checks.
function optionTextsOf(options) {
  let o = options;
  if (typeof o === "string") { try { o = JSON.parse(o); } catch { o = [o]; } }
  if (!Array.isArray(o)) return [];
  return o.map((x) => (typeof x === "string" ? x : (x?.text ?? x?.label ?? ""))).map((s) => String(s).replace(/^[A-E][).:\s-]+/i, "").trim());
}

// Math explanations that SHOW WORK (an equation, a computation, ordering a set,
// an explicit solve/substitute step) teach even when short and even when they
// contain the answer value — they must NOT be flagged as circular/low-value.
function showsMathWork(e) {
  return /=|\d\s*[+\-×x*/÷^]\s*\d|\bordered\b|\bsolv|\bsubstitut|\bfactor|\bderivativ|\bintegral|√|\bslope\b|\bmedian\b|\bmean\b/i.test(e);
}

// DETERMINISTIC circular / low-value detector.
function isCircular(expl, ansText) {
  const e = (expl || "").trim();
  const work = showsMathWork(e);
  if (e.length < 100 && !work) return true;              // too short to teach (unless it shows work)
  // LOW-1 fix: /s so "is correct because" on a 2nd line is still caught.
  const m = e.match(/^(.*?)\bis correct because\b(.*)$/is);
  if (m) {
    const before = new Set(bigWords(m[1]));
    const after = bigWords(m[2]);
    if (after.length && after.filter((w) => before.has(w)).length / after.length > 0.5) return true;
  }
  // "just restates the answer" — but NOT if it shows mathematical work (a math
  // explanation legitimately contains the answer value).
  if (ansText && e.length < 170 && norm(e).includes(norm(ansText)) && !work) return true;
  return false;
}

// DETERMINISTIC validation of a regen. `optionTexts` = all option strings
// (stripped) so we can reject a regen that grounds a DISTRACTOR (HIGH-1).
function validateRegen(newExpl, ansText, optionTexts = []) {
  const e = (newExpl || "").trim();
  if (e.length < 120 || e.length > 700) return { ok: false, why: `length ${e.length}` };

  // HIGH-1 — answer-agreement gate. The regen MUST reference the correct
  // answer's concept, and reference it at least as strongly as any distractor.
  // Catches fluent-but-wrong-answer explanations the structural checks miss.
  const explWords = new Set(bigWords(e));
  const aw = bigWords(ansText);
  let ansScore;
  if (aw.length >= 1) {
    ansScore = aw.filter((w) => explWords.has(w)).length / aw.length;
  } else {
    // Numeric/symbolic answer ("42", "x = 3", "35 ≤ d ≤ 62"): word-overlap can't
    // apply — require the answer's literal tokens (digits/symbols) to appear.
    const toks = norm(ansText).split(" ").filter(Boolean);
    const en = norm(e);
    ansScore = toks.length ? toks.filter((t) => en.includes(t)).length / toks.length : 1;
  }
  if (ansScore < 0.5) return { ok: false, why: `answer-agreement ${Math.round(ansScore * 100)}%` };
  const distractors = optionTexts.filter((o) => norm(o) !== norm(ansText));
  const bestDistractor = distractors.length ? Math.max(...distractors.map((d) => overlapFrac(d, explWords))) : 0;
  if (ansScore < bestDistractor) return { ok: false, why: "distractor-dominant" };

  // HIGH-3 — length-INDEPENDENT restate check. A long explanation can still
  // open by restating the answer; isCircular's <170 gate would miss it, so
  // test the first sentence directly here.
  const firstSentence = e.split(/(?<=[.!?])\s/)[0] || e;
  const m = firstSentence.match(/^(.*?)\bis correct because\b(.*)$/is);
  if (m) {
    const before = new Set(bigWords(m[1]));
    const after = bigWords(m[2]);
    if (after.length && after.filter((w) => before.has(w)).length / after.length > 0.5)
      return { ok: false, why: "restates (first sentence)" };
  }
  if (isCircular(e, ansText)) return { ok: false, why: "still circular" };

  // Must contain explanatory/definitional tissue (teaches "why" or "what").
  // Broadened to include definitional verbs — "X is defined as / occurs when /
  // is characterized by / proposes that" teaches even without "because".
  if (!/(because|since|whereas|while|unlike|due to|this means|in contrast|the reason|distinguish|differ|refers? to|results? from|leads? to|defined? as|occurs? when|characteri[sz]ed by|involves?|proposes?|describes?|represents?|is a (type|form|process|concept)|is the (process|term|concept|study))/i.test(e))
    return { ok: false, why: "no reasoning connective" };
  return { ok: true };
}

async function groqRegen(q, ansText) {
  let opts = q.options;
  if (typeof opts === "string") { try { opts = JSON.parse(opts); } catch { opts = [opts]; } }
  const optStr = Array.isArray(opts)
    ? opts.map((o) => (typeof o === "string" ? o : (o?.text ?? JSON.stringify(o)))).join("\n")
    : String(opts);
  const prompt = `You are an expert tutor writing the answer explanation for an AP/SAT/ACT multiple-choice question.

QUESTION: ${q.questionText}
OPTIONS:
${optStr}
CORRECT ANSWER: ${q.correctAnswer} (${ansText})

Write a concise 2-4 sentence explanation (under 600 characters) that TEACHES. Requirements:
- You MUST use the exact term "${ansText}" in your explanation and define/explain the concept behind it.
- Explain WHY "${ansText}" is correct using the underlying concept/definition — do NOT just restate the answer.
- Briefly say why ONE plausible wrong option is wrong (contrast), but keep the focus on "${ansText}".
- Never write "${ansText} is correct because ${ansText}". No circular restatement.
- Plain, exam-prep tone. Output ONLY the explanation text, no preamble, no labels.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4, max_tokens: 260,
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`groq ${res.status}`);
  const j = await res.json();
  return (j.choices?.[0]?.message?.content || "").trim().replace(/^["']|["']$/g, "");
}

const prisma = new PrismaClient();
try {
  const where = { isApproved: true, ...(COURSE ? { course: COURSE } : {}) };
  const rawAll = await prisma.question.findMany({
    where, select: { id: true, course: true, questionText: true, explanation: true, options: true, correctAnswer: true },
  });
  // SN bank is AP/SAT/ACT (no CLEP). Detect across ALL approved when no COURSE.
  const all = rawAll;

  // FORCE_IDS_FILE — re-process an explicit ID list regardless of detection.
  // Used to re-run rows written by an earlier (buggy-validator) pass: those are
  // no longer circular so the detector won't re-flag them, but they must be
  // re-validated by the fixed validateRegen (answer-agreement gate).
  let forceIds = null;
  if (process.env.FORCE_IDS_FILE && existsSync(process.env.FORCE_IDS_FILE)) {
    forceIds = new Set(readFileSync(process.env.FORCE_IDS_FILE, "utf8").split(/\s+/).map((s) => s.trim()).filter(Boolean));
    console.log(`FORCE mode: re-processing ${forceIds.size} explicit IDs (detection bypassed).`);
  }

  const flagged = [];
  const byCourse = {};
  for (const q of all) {
    const at = answerText(q.options, q.correctAnswer);
    const include = forceIds ? forceIds.has(q.id) : isCircular(q.explanation, at);
    if (include) {
      flagged.push({ q, at });
      byCourse[q.course] = (byCourse[q.course] ?? 0) + 1;
    }
  }
  console.log(`Scope${COURSE ? ` [${COURSE}]` : " [all CLEP]"}: ${flagged.length} circular/low-value of ${all.length} approved`);
  for (const [c, n] of Object.entries(byCourse).sort((a, b) => b[1] - a[1])) console.log(`  ${c}: ${n}`);

  if (!REGEN) {
    console.log(`\nDetect-only. Add REGEN=1 LIMIT=n [COURSE=x] to regenerate (APPLY=1 to write).`);
  } else {
    const batch = flagged.slice(0, LIMIT);
    console.log(`\n${APPLY ? "APPLY" : "DRY"} regen of ${batch.length} (limit ${LIMIT})…\n`);
    let written = 0, failed = 0;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    for (const { q, at } of batch) {
      try {
        await sleep(1500); // throttle for Groq rate limits (~30-40 req/min)
        const newExpl = await groqRegen(q, at);
        const v = validateRegen(newExpl, at, optionTextsOf(q.options));
        if (!v.ok) { failed++; console.log(`  ✗ ${q.id} reject(${v.why}): ${newExpl.slice(0, 80)}`); continue; }
        console.log(`  ✓ ${q.id}\n    OLD: ${(q.explanation || "").replace(/\s+/g, " ").slice(0, 90)}\n    NEW: ${newExpl.replace(/\s+/g, " ").slice(0, 140)}`);
        if (APPLY) { await prisma.question.update({ where: { id: q.id }, data: { explanation: newExpl } }); written++; }
      } catch (e) { failed++; console.log(`  ✗ ${q.id} error: ${e.message}`); }
    }
    console.log(`\n${APPLY ? `✅ Wrote ${written}` : `DRY (validated ${batch.length - failed})`} · rejected/errored ${failed}.`);
  }
} catch (e) {
  console.error("Regen failed:", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
