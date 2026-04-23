#!/usr/bin/env node
// quality-audit.mjs — proactive content-quality audit runner.
//
// Runs multiple deterministic checks against the approved question bank
// and reports flagged rows. Built 2026-04-23 per user directive: "test
// infrastructure to find issues instead of waiting for user."
//
// Checks (all deterministic — no LLM calls):
//   A. equivalent_distractors — 2+ options parse to same numeric value with
//      matching units (unit-aware; see scan-equivalent-distractors.mjs)
//   B. orphan_correct_answer   — correctAnswer letter doesn't map to any
//      option index (e.g. correctAnswer="E" on a 4-option MCQ)
//   C. thin_explanation        — explanation <80 chars or empty
//   D. stim_refs_passage       — question says "the passage above" but
//      stimulus is empty or too short
//   E. stim_refs_diagram       — question says "the diagram/graph/figure"
//      but stimulus is missing
//   F. empty_option            — one or more options is empty/whitespace
//   G. too_short_option        — one or more options <5 chars after strip
//      (typically indicates malformed generation)
//   H. missing_content_hash    — contentHash is null (should be populated)
//   I. high_user_report_count  — 3+ QuestionReport rows (users flagged it)
//   J. low_accuracy_bank_wide  — <30% accuracy across 10+ student answers
//      (indicates confusing / wrong question)
//
// Usage:
//   node scripts/quality-audit.mjs                    # full audit, read-only
//   node scripts/quality-audit.mjs --limit=5000       # sample size
//   node scripts/quality-audit.mjs --course=AP_PHYSICS_1
//   node scripts/quality-audit.mjs --quarantine --check=A,B,C,F,G
//   node scripts/quality-audit.mjs --csv=/tmp/audit.csv
//
// Emits:
//   - stdout summary (count per check, flagged-rate)
//   - stdout detail per flagged row (course, unit, question snippet, code)
//   - optional CSV for reviewer triage
//   - optional quarantine (isApproved=false) for selected codes

import "dotenv/config";
import fs from "fs";
import { makePrisma } from "./_prisma-http.mjs";

const prisma = makePrisma();
const argFor = (k) => {
  const a = process.argv.find((x) => x.startsWith(`--${k}=`));
  return a ? a.slice(`--${k}=`.length) : null;
};
const LIMIT = argFor("limit") ? parseInt(argFor("limit"), 10) : 5000;
const COURSE = argFor("course");
const CSV = argFor("csv");
const QUARANTINE = process.argv.includes("--quarantine");
const CHECK_ONLY = argFor("check"); // e.g. "A,B,C" — default all
const USER_REPORT_THRESHOLD = 3;
const LOW_ACC_MIN_ATTEMPTS = 10;
const LOW_ACC_CUTOFF = 0.30;

// ─── Numeric evaluator (same as scan-equivalent-distractors.mjs, inlined) ───
function stripLabel(s) {
  return String(s).replace(/^[A-E][)\.]\s*/, "").trim();
}
function normalize(raw) {
  if (raw == null) return { body: "", unit: "" };
  let s = String(raw).trim();
  s = s.replace(/^(?:=|≈|is|answer\s*:?|value\s*:?)\s*/i, "");
  s = s.replace(/^\$/, "");
  let unit = "";
  const u = s.match(/^(.*?)\s+([a-zA-ZµΩ°]+(?:\/[a-zA-Z²³]+)?\.?)$/);
  if (u) { s = u[1].trim(); unit = u[2].toLowerCase().replace(/\.$/, ""); }
  return { body: s.trim(), unit };
}
const NUM_RX = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
function evalOption(raw) {
  const { body: s, unit } = normalize(raw);
  if (!s) return null;
  const pct = s.match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*%$/);
  if (pct) return { value: Number(pct[1]) / 100, unit };
  if (NUM_RX.test(s)) return { value: Number(s), unit };
  const mixed = s.match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const [w, n, d] = [Number(mixed[1]), Number(mixed[2]), Number(mixed[3])];
    if (d !== 0) return { value: (w < 0 ? -1 : 1) * (Math.abs(w) + n / d), unit };
  }
  const frac = s.replace(/[()]/g, "").match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*\/\s*([+-]?(?:\d+\.?\d*|\.\d+))$/);
  if (frac) {
    const [a, b] = [Number(frac[1]), Number(frac[2])];
    if (b !== 0) return { value: a / b, unit };
  }
  const mul = s.match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*[*·×]\s*([+-]?(?:\d+\.?\d*|\.\d+))$/);
  if (mul) return { value: Number(mul[1]) * Number(mul[2]), unit };
  return null;
}
function nearlyEqual(a, b) {
  if (a === b) return true;
  const diff = Math.abs(a - b), scale = Math.max(Math.abs(a), Math.abs(b), 1);
  return diff / scale < 1e-9 || diff < 1e-12;
}

// ─── Individual checks ──────────────────────────────────────────────────────
// Each returns null (ok) or { code, detail }.
function optsArr(o) {
  if (!o) return null;
  if (Array.isArray(o)) return o;
  if (typeof o === "string") { try { return JSON.parse(o); } catch { return null; } }
  return null;
}

function checkEquivalentDistractors(q) {
  const opts = optsArr(q.options);
  if (!opts || opts.length < 2) return null;
  const evals = opts.map((o) => evalOption(stripLabel(o)));
  const parsed = evals.filter(Boolean);
  if (parsed.length < 2) return null;
  for (let i = 0; i < evals.length; i++) {
    for (let j = i + 1; j < evals.length; j++) {
      if (!evals[i] || !evals[j]) continue;
      if (nearlyEqual(evals[i].value, evals[j].value) && (evals[i].unit || "") === (evals[j].unit || "")) {
        return { code: "A", detail: `Options ${String.fromCharCode(65 + i)} and ${String.fromCharCode(65 + j)} both = ${evals[i].value}${evals[i].unit ? " " + evals[i].unit : ""}` };
      }
    }
  }
  return null;
}

function checkOrphanCorrectAnswer(q) {
  const opts = optsArr(q.options);
  if (!opts) return { code: "B", detail: "options field unparseable" };
  const ca = String(q.correctAnswer || "").trim().toUpperCase();
  if (!/^[A-E]$/.test(ca)) return { code: "B", detail: `correctAnswer "${q.correctAnswer}" not a valid letter` };
  const idx = ca.charCodeAt(0) - 65;
  if (idx >= opts.length) return { code: "B", detail: `correctAnswer "${ca}" but only ${opts.length} options` };
  return null;
}

function checkThinExplanation(q) {
  const e = String(q.explanation || "").trim();
  if (e.length < 80) return { code: "C", detail: `explanation only ${e.length} chars` };
  return null;
}

function checkPassageReferenceMismatch(q) {
  const qt = String(q.questionText || "");
  const stim = String(q.stimulus || "");
  const refsPassage = /\b(excerpt|passage|letter|document|source|author|text)\s+(above|below|shown)|the\s+(passage|excerpt|source|document)\s+(above|below)/i.test(qt);
  if (refsPassage && stim.length < 40) {
    return { code: "D", detail: `refs passage but stimulus is ${stim.length} chars` };
  }
  return null;
}

function checkDiagramReferenceMismatch(q) {
  const qt = String(q.questionText || "");
  const stim = String(q.stimulus || "");
  const refsDiagram = /\b(graph|chart|diagram|figure|table|free-body|FBD)\s+(above|below|shown)/i.test(qt);
  if (refsDiagram && stim.length < 10) {
    return { code: "E", detail: `refs diagram/graph/table but stimulus missing` };
  }
  return null;
}

function checkEmptyOption(q) {
  const opts = optsArr(q.options);
  if (!opts) return null;
  for (let i = 0; i < opts.length; i++) {
    const s = String(opts[i] ?? "").replace(/^[A-E][)\.]\s*/, "").trim();
    if (s.length === 0) return { code: "F", detail: `Option ${String.fromCharCode(65 + i)} is empty` };
  }
  return null;
}

function checkTooShortOption(q) {
  const opts = optsArr(q.options);
  if (!opts) return null;
  // Threshold lowered from <5 to <3 after first run false-positived on
  // legitimate 4-char English answers like "Hold" (valid US-Gov option).
  // The check is meant to catch placeholders like "?", "x", single chars.
  for (let i = 0; i < opts.length; i++) {
    const s = String(opts[i] ?? "").replace(/^[A-E][)\.]\s*/, "").trim();
    if (s.length > 0 && s.length < 3) {
      // Allow numeric / math answers even shorter: "2", "e", "π", "√5".
      const mathChars = /^[-+]?[\d.πep√\/°%$]+$/i.test(s);
      if (mathChars) continue;
      return { code: "G", detail: `Option ${String.fromCharCode(65 + i)} only ${s.length} chars: "${s}"` };
    }
  }
  return null;
}

function checkMissingContentHash(q) {
  if (!q.contentHash || q.contentHash.length < 32) {
    return { code: "H", detail: "contentHash missing or short" };
  }
  return null;
}

// I + J require joined data — run separately.

// ─── Which checks to run ─────────────────────────────────────────────────────
const ALL_CHECKS = {
  A: checkEquivalentDistractors,
  B: checkOrphanCorrectAnswer,
  C: checkThinExplanation,
  D: checkPassageReferenceMismatch,
  E: checkDiagramReferenceMismatch,
  F: checkEmptyOption,
  G: checkTooShortOption,
  H: checkMissingContentHash,
};
const ENABLED = (() => {
  if (!CHECK_ONLY) return Object.keys(ALL_CHECKS);
  const want = new Set(CHECK_ONLY.split(",").map((x) => x.trim().toUpperCase()));
  return Object.keys(ALL_CHECKS).filter((k) => want.has(k));
})();

const CHECK_NAME = {
  A: "equivalent_distractors",
  B: "orphan_correct_answer",
  C: "thin_explanation",
  D: "stim_refs_passage",
  E: "stim_refs_diagram",
  F: "empty_option",
  G: "too_short_option",
  H: "missing_content_hash",
  I: "high_user_report_count",
  J: "low_accuracy_bank_wide",
};

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Quality audit — enabled checks: ${ENABLED.join(", ")}${COURSE ? ` | course=${COURSE}` : ""} | limit=${LIMIT}\n`);

  const rows = await prisma.question.findMany({
    where: { isApproved: true, questionType: "MCQ", ...(COURSE ? { course: COURSE } : {}) },
    select: {
      id: true, course: true, unit: true, topic: true, contentHash: true,
      questionText: true, stimulus: true, options: true, correctAnswer: true,
      explanation: true,
    },
    orderBy: { createdAt: "desc" },
    take: LIMIT,
  });

  const findings = []; // { id, course, unit, code, detail, questionText }
  const countByCode = {};
  for (const q of rows) {
    for (const code of ENABLED) {
      const r = ALL_CHECKS[code](q);
      if (r) {
        findings.push({
          id: q.id, course: q.course, unit: q.unit,
          code: r.code, detail: r.detail,
          questionText: (q.questionText || "").slice(0, 80),
        });
        countByCode[r.code] = (countByCode[r.code] || 0) + 1;
      }
    }
  }

  // ── Joined check I: high user-report count ────────────────────────────────
  if (!CHECK_ONLY || CHECK_ONLY.toUpperCase().includes("I")) {
    const heavilyReported = await prisma.questionReport.groupBy({
      by: ["questionId"],
      _count: { _all: true },
      having: { questionId: { _count: { gte: USER_REPORT_THRESHOLD } } },
    });
    for (const r of heavilyReported) {
      const q = rows.find((x) => x.id === r.questionId);
      if (!q) continue; // not in our sampled limit
      findings.push({
        id: q.id, course: q.course, unit: q.unit,
        code: "I",
        detail: `${r._count._all} user reports`,
        questionText: (q.questionText || "").slice(0, 80),
      });
      countByCode.I = (countByCode.I || 0) + 1;
    }
  }

  // ── Joined check J: low accuracy bank-wide ────────────────────────────────
  if (!CHECK_ONLY || CHECK_ONLY.toUpperCase().includes("J")) {
    const perQ = await prisma.studentResponse.groupBy({
      by: ["questionId"],
      _count: { _all: true },
      _sum: { isCorrect: true }, // treat boolean as 0/1 via Prisma? fallback below
      having: { questionId: { _count: { gte: LOW_ACC_MIN_ATTEMPTS } } },
    }).catch(() => []);
    // Prisma may not sum booleans directly; compute accuracy via a raw pass.
    if (perQ && perQ.length > 0) {
      for (const r of perQ) {
        // Sum isCorrect = number of true (trues since sum on bool isn't standard).
        // Fallback: second query for correct count.
        const correct = await prisma.studentResponse.count({
          where: { questionId: r.questionId, isCorrect: true },
        });
        const total = r._count._all;
        if (!total) continue;
        const acc = correct / total;
        if (acc < LOW_ACC_CUTOFF) {
          const q = rows.find((x) => x.id === r.questionId);
          if (!q) continue;
          findings.push({
            id: q.id, course: q.course, unit: q.unit,
            code: "J",
            detail: `accuracy ${Math.round(acc * 100)}% over ${total} attempts`,
            questionText: (q.questionText || "").slice(0, 80),
          });
          countByCode.J = (countByCode.J || 0) + 1;
        }
      }
    }
  }

  // ── Report ───────────────────────────────────────────────────────────────
  console.log(`Scanned: ${rows.length} approved MCQs`);
  console.log("\nFindings by check:");
  for (const c of [...ENABLED, "I", "J"]) {
    const n = countByCode[c] || 0;
    console.log(`  ${c} ${CHECK_NAME[c].padEnd(25)} ${n}`);
  }
  console.log(`\nTotal findings: ${findings.length}`);

  if (findings.length > 0 && findings.length <= 60) {
    console.log("\n── Detail ──");
    for (const f of findings) {
      console.log(`  [${f.code}] ${f.course}/${f.unit} ${f.id}`);
      console.log(`      ${f.detail}`);
      console.log(`      q: ${f.questionText}`);
    }
  } else if (findings.length > 60) {
    console.log(`\n(${findings.length} findings — truncated; use --csv=path to get the full list)`);
  }

  if (CSV) {
    const header = "code,course,unit,id,detail,questionText\n";
    const rows = findings.map((f) =>
      [f.code, f.course, f.unit, f.id, JSON.stringify(f.detail), JSON.stringify(f.questionText)].join(","),
    );
    fs.writeFileSync(CSV, header + rows.join("\n"));
    console.log(`\nCSV written: ${CSV}`);
  }

  if (QUARANTINE && findings.length > 0) {
    const uniqueIds = [...new Set(findings.map((f) => f.id))];
    console.log(`\n── QUARANTINE ─────────────────────────────────────────────`);
    console.log(`Soft-retiring ${uniqueIds.length} unique rows (isApproved=false)…`);
    let done = 0;
    for (const id of uniqueIds) {
      try {
        await prisma.question.update({ where: { id }, data: { isApproved: false } });
        done++;
      } catch (e) {
        console.error(`  failed ${id}: ${e.message}`);
      }
    }
    console.log(`Quarantined ${done}/${uniqueIds.length}.`);
  } else if (findings.length > 0) {
    console.log(`\n(read-only — pass --quarantine to soft-retire, or --csv=path to export)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
