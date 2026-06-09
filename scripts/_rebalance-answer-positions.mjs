/**
 * Answer-position rebalance (fidelity: answerPositionBalance dim).
 * AI generators cluster the correct answer at A (SAT_MATH: 59% A, 4% D). Real
 * CB/ACT exams are ~even. This SWAPS the correct option into an under-represented
 * position (a swap, not a full shuffle → exact, minimal field remap).
 *
 * SAFETY (audit-all-referenced-fields): a question is ELIGIBLE only if NO
 * letter-keyed text would be corrupted by the swap —
 *   - main `explanation` has no option-letter reference, AND
 *   - every `distractorExplanations` value (if any) has no letter reference.
 * For eligible questions the swap remaps: options (reordered + re-prefixed by
 * position), correctAnswer, and distractorExplanations (key swap — safe because
 * the VALUES carry no letter text). Questions that fail the filter are left
 * untouched. Floor-safe by construction (nothing is unapproved; only reordered).
 *
 *   node scripts/_rebalance-answer-positions.mjs              # dry (report only)
 *   APPLY=1 node scripts/_rebalance-answer-positions.mjs      # execute
 *   COURSE=SAT_MATH node scripts/_rebalance-answer-positions.mjs
 */
import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";

if (!process.env.DATABASE_URL) for (const f of [".env.local", ".env"]) {
  if (existsSync(f)) for (const l of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const APPLY = process.env.APPLY === "1";
const ONLY = process.env.COURSE || null;

// Any explicit option-letter reference in prose → NOT safe to swap.
const LETTER_REF = /\b(option|choice|answer|letter)\s*\(?[A-E]\)?\b|\(\s*[A-E]\s*\)|\b[A-E]\s+is\s+(correct|incorrect|wrong|the)\b|^\s*[A-E][).:]/im;
const hasLetterRef = (s) => LETTER_REF.test(String(s || ""));

const stripPrefix = (o) => String(o).replace(/^\s*\(?[A-Ea-e][).:]\s*/, "").trim();
const reprefix = (texts) => texts.map((t, i) => `${String.fromCharCode(65 + i)}) ${t}`);
const idx = (L) => L.charCodeAt(0) - 65;
const letter = (i) => String.fromCharCode(65 + i);

const prisma = new PrismaClient();
try {
  const where = { isApproved: true, questionType: "MCQ", ...(ONLY ? { course: ONLY } : {}) };
  const courses = ONLY ? [ONLY] : (await prisma.question.groupBy({ by: ["course"], where: { isApproved: true, questionType: "MCQ" } })).map((r) => r.course);

  let grandUpdates = 0;
  for (const course of courses.sort()) {
    const qs = await prisma.question.findMany({
      where: { ...where, course },
      select: { id: true, options: true, correctAnswer: true, explanation: true, distractorExplanations: true },
    });
    // normalize + filter to clean A-E MCQs
    const items = [];
    for (const q of qs) {
      let opts = q.options;
      if (typeof opts === "string") { try { opts = JSON.parse(opts); } catch { opts = null; } }
      if (!Array.isArray(opts) || opts.length < 3 || opts.length > 5) continue;
      const L = String(q.correctAnswer || "").trim().toUpperCase();
      if (!/^[A-E]$/.test(L) || idx(L) >= opts.length) continue;
      // eligibility: no letter refs anywhere that a swap would corrupt
      let eligible = !hasLetterRef(q.explanation);
      let d = q.distractorExplanations;
      if (eligible && d && typeof d === "object" && !Array.isArray(d)) {
        for (const v of Object.values(d)) if (hasLetterRef(v)) { eligible = false; break; }
      }
      items.push({ id: q.id, opts: opts.map(String), L, n: opts.length, d: (d && typeof d === "object" && !Array.isArray(d)) ? d : null, eligible });
    }
    if (items.length === 0) continue;

    const optCount = items[0].n; // courses are uniform; mixed handled per-item below
    const dist = {};
    for (const it of items) dist[it.L] = (dist[it.L] || 0) + 1;
    const before = { ...dist };

    // greedy: move correct from over-represented → under-represented, eligible only
    const updates = [];
    const eligibleByLetter = {};
    for (const it of items) if (it.eligible) (eligibleByLetter[it.L] = eligibleByLetter[it.L] || []).push(it);

    const target = (L, n) => Math.floor(n / optCount); // even target per letter
    const letters = Array.from({ length: optCount }, (_, i) => letter(i));
    let guard = 0;
    while (guard++ < items.length * 2) {
      // most over and under represented among valid positions
      const over = letters.filter((L) => (dist[L] || 0) > target(L, items.length) && (eligibleByLetter[L]?.length)).sort((a, b) => (dist[b] || 0) - (dist[a] || 0))[0];
      const under = letters.filter((L) => (dist[L] || 0) < target(L, items.length)).sort((a, b) => (dist[a] || 0) - (dist[b] || 0))[0];
      if (!over || !under || over === under) break;
      const it = eligibleByLetter[over].pop();
      if (!it) break;
      // swap correct option (at over) with the option at under
      const i1 = idx(over), i2 = idx(under);
      const bare = it.opts.map(stripPrefix);
      [bare[i1], bare[i2]] = [bare[i2], bare[i1]];
      const newOpts = reprefix(bare);
      let newD = it.d ? { ...it.d } : null;
      if (newD) { const t = newD[over]; newD[over] = newD[under]; newD[under] = t; for (const k of Object.keys(newD)) if (newD[k] == null) delete newD[k]; }
      updates.push({ id: it.id, newOpts, newCorrect: under, newD });
      dist[over]--; dist[under] = (dist[under] || 0) + 1;
    }

    if (updates.length === 0) continue;
    grandUpdates += updates.length;
    const fmt = (o) => letters.map((L) => `${L}:${o[L] || 0}`).join(" ");
    console.log(`\n${course}  (n=${items.length}, eligible=${items.filter((i) => i.eligible).length})`);
    console.log(`  before: ${fmt(before)}`);
    console.log(`  after:  ${fmt(dist)}   → ${updates.length} swaps`);

    if (APPLY) {
      let done = 0;
      for (const u of updates) {
        await prisma.question.update({
          where: { id: u.id },
          data: { options: u.newOpts, correctAnswer: u.newCorrect, ...(u.newD ? { distractorExplanations: u.newD } : {}) },
        });
        done++;
      }
      console.log(`  ✅ applied ${done}`);
    }
  }
  console.log(`\n${APPLY ? "APPLIED" : "DRY RUN"} — total swaps: ${grandUpdates}${APPLY ? "" : " (re-run with APPLY=1)"}`);
} catch (e) {
  console.error("Rebalance failed:", e.message, e.stack);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
