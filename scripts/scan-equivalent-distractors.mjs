// scan-equivalent-distractors.mjs
// Read-only audit: find approved Questions whose MCQ options evaluate
// to the SAME numeric value (e.g. "4/2", "8/4", "6/3", "2/1" all = 2).
//
// We intentionally use a tiny hand-rolled safe evaluator — no `eval`,
// no `Function()`. Only the shapes we can confidently parse are scored;
// everything else is skipped (counted as "unparseable", never flagged).
//
// Usage: node scripts/scan-equivalent-distractors.mjs [--limit=500]
// Output: stdout summary + flagged rows.

import "dotenv/config";
import { PrismaClient } from "@prisma/client/wasm";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { neon, neonConfig, types } from "@neondatabase/serverless";

neonConfig.poolQueryViaFetch = true;
types.setTypeParser(types.builtins.DATE, (v) => v);
types.setTypeParser(types.builtins.TIMESTAMP, (v) => v);
types.setTypeParser(types.builtins.TIMESTAMPTZ, (v) => v);

const sql = neon(process.env.DATABASE_URL);
const adapter = new PrismaNeonHTTP(sql);
const prisma = new PrismaClient({ adapter });

const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.slice("--limit=".length), 10) : 500;
// --quarantine flag: also soft-quarantine flagged rows (isApproved=false)
// instead of read-only reporting. The regen-grounded pipeline will pick
// them up next time it sweeps.
const QUARANTINE = process.argv.includes("--quarantine");

// ── Tiny safe numeric evaluator ────────────────────────────────────────────
// Supports:
//   integer:            "42", "-3", "+7"
//   decimal:            "3.14", "-0.5", ".25"
//   fraction:           "a/b"              (integers or decimals)
//   mixed fraction:     "a b/c"            (e.g., "1 1/2")
//   multiplication:     "a*b", "a·b", "a×b"
//   implicit mult:      "2(3)", "(2)(3)"   (parens adjacency only)
//   percent:            "50%"              → 0.5
//   scientific:         "1.5e3"
//   surrounding noise:  "= 2", "2 m/s", "≈ 1.41", "$2.50"
// NOT SUPPORTED (skipped — won't flag):
//   +, - operators between numbers, variables, functions, sqrt, π, powers,
//   units that change meaning, ratios like "3:2", "√2", etc.
const NUM = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

function stripLabel(s) {
  return String(s).replace(/^[A-E][)\.]\s*/, "").trim();
}

// Strip common noise around a numeric expression so we can focus on the number.
// We deliberately keep this conservative: if the residue isn't a shape we
// explicitly recognize, we return null and the row is "unparseable".
function normalize(raw) {
  if (raw == null) return "";
  let s = String(raw).trim();
  // Strip leading "= " / "≈ " / "is " / "answer: "
  s = s.replace(/^(?:=|≈|is|answer\s*:?|value\s*:?)\s*/i, "");
  // Strip surrounding $ and trailing units like "m/s", "kg", "kPa", "%".
  // Keep "%" since we handle it explicitly below.
  s = s.replace(/^\$/, "");
  // Trim trailing non-numeric words (crude; only for 1-word trailing units).
  s = s.replace(/\s+[a-zA-ZµΩ°]+(?:\/[a-zA-Z²³]+)?\.?$/, "");
  return s.trim();
}

function parseNumber(str) {
  const s = str.trim();
  if (!NUM.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Evaluate a single raw option to a number (or null if unparseable in our
// conservative subset). Returns { value, form } where form describes what
// we matched — used to report back to the reviewer for debugging.
function evalOption(raw) {
  let s = normalize(raw);
  if (!s) return null;

  // Percent: "50%" → 0.5
  const pct = s.match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*%$/);
  if (pct) {
    const n = Number(pct[1]);
    if (Number.isFinite(n)) return { value: n / 100, form: "percent" };
  }

  // Plain number
  const asNum = parseNumber(s);
  if (asNum != null) return { value: asNum, form: "int_or_decimal" };

  // Mixed fraction: "a b/c"
  const mixed = s.match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const num = Number(mixed[2]);
    const den = Number(mixed[3]);
    if (den !== 0 && Number.isFinite(whole) && Number.isFinite(num) && Number.isFinite(den)) {
      const sign = whole < 0 || String(mixed[1]).startsWith("-") ? -1 : 1;
      return { value: sign * (Math.abs(whole) + num / den), form: "mixed_fraction" };
    }
  }

  // Simple fraction: "a/b" with numeric a, b (optionally parenthesized)
  const frac = s.replace(/[()]/g, "").match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*\/\s*([+-]?(?:\d+\.?\d*|\.\d+))$/);
  if (frac) {
    const a = Number(frac[1]);
    const b = Number(frac[2]);
    if (b !== 0 && Number.isFinite(a) && Number.isFinite(b)) {
      return { value: a / b, form: "fraction" };
    }
  }

  // Multiplication: "a*b" | "a·b" | "a×b" | "a x b" (explicit operators only)
  const mul = s.match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*[*·×]\s*([+-]?(?:\d+\.?\d*|\.\d+))$/);
  if (mul) {
    const a = Number(mul[1]);
    const b = Number(mul[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) return { value: a * b, form: "multiplication" };
  }

  // Parenthesized implicit multiplication: "(a)(b)" or "a(b)"
  const paren = s.match(/^\(?\s*([+-]?(?:\d+\.?\d*|\.\d+))\s*\)?\s*\(\s*([+-]?(?:\d+\.?\d*|\.\d+))\s*\)$/);
  if (paren) {
    const a = Number(paren[1]);
    const b = Number(paren[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) return { value: a * b, form: "paren_multiplication" };
  }

  return null; // unparseable in our conservative subset
}

function optsAsArray(opts) {
  if (!opts) return null;
  if (Array.isArray(opts)) return opts;
  if (typeof opts === "string") {
    try { return JSON.parse(opts); } catch { return null; }
  }
  return null;
}

// Two evaluated values are "equivalent" if within a small tolerance.
// Use relative tolerance for large magnitudes, absolute for small.
function nearlyEqual(a, b) {
  if (a === b) return true;
  const diff = Math.abs(a - b);
  const scale = Math.max(Math.abs(a), Math.abs(b), 1);
  return diff / scale < 1e-9 || diff < 1e-12;
}

async function main() {
  const rows = await prisma.question.findMany({
    where: { isApproved: true, questionType: "MCQ" },
    select: {
      id: true, course: true, unit: true, topic: true,
      questionText: true, options: true, correctAnswer: true,
    },
    take: LIMIT,
    orderBy: { createdAt: "desc" },
  });

  console.log(`Scanning ${rows.length} approved MCQ questions (limit=${LIMIT})…\n`);

  let scanned = 0;
  let numericCandidates = 0; // rows where 2+ options parsed as numbers
  let flagged = 0;
  const flaggedRows = [];

  for (const q of rows) {
    scanned++;
    const opts = optsAsArray(q.options);
    if (!opts || opts.length < 2) continue;

    const evals = opts.map((o) => {
      const raw = stripLabel(o);
      return { raw, ev: evalOption(raw) };
    });
    const parsedCount = evals.filter((e) => e.ev != null).length;
    if (parsedCount < 2) continue;
    numericCandidates++;

    // Group by near-equal numeric value
    const groups = [];
    for (const e of evals) {
      if (!e.ev) continue;
      const g = groups.find((g) => nearlyEqual(g.value, e.ev.value));
      if (g) g.members.push(e);
      else groups.push({ value: e.ev.value, members: [e] });
    }
    const dupGroups = groups.filter((g) => g.members.length >= 2);
    if (dupGroups.length === 0) continue;

    flagged++;
    flaggedRows.push({
      id: q.id,
      course: q.course,
      unit: q.unit,
      topic: q.topic,
      correctAnswer: q.correctAnswer,
      questionText: (q.questionText || "").slice(0, 80),
      equivalentGroups: dupGroups.map((g) => ({
        value: g.value,
        options: g.members.map((m) => `${m.raw} (${m.ev.form})`),
      })),
    });
  }

  // Print report
  console.log(`Scanned:                 ${scanned}`);
  console.log(`Rows with 2+ numeric opts: ${numericCandidates}`);
  console.log(`FLAGGED (equivalent):     ${flagged}`);
  console.log(`Flagged rate of numeric:  ${numericCandidates ? ((flagged / numericCandidates) * 100).toFixed(1) : 0}%\n`);

  if (flagged > 0) {
    console.log("── FLAGGED ROWS ───────────────────────────────────────────────");
    for (const r of flaggedRows) {
      console.log(`\n[${r.course} / ${r.unit}] ${r.id}`);
      console.log(`  topic:         ${r.topic}`);
      console.log(`  correctAnswer: ${r.correctAnswer}`);
      console.log(`  question:      ${r.questionText}`);
      for (const g of r.equivalentGroups) {
        console.log(`  equivalent (= ${g.value}): ${g.options.join("  |  ")}`);
      }
    }
  }

  if (QUARANTINE && flagged > 0) {
    console.log("\n── QUARANTINE ─────────────────────────────────────────────────");
    console.log(`Soft-quarantining ${flagged} flagged rows (isApproved=false)…`);
    let quarantined = 0;
    for (const r of flaggedRows) {
      try {
        await prisma.question.update({
          where: { id: r.id },
          data: { isApproved: false },
        });
        quarantined++;
      } catch (e) {
        console.error(`Failed to quarantine ${r.id}: ${e.message}`);
      }
    }
    console.log(`Quarantined ${quarantined}/${flagged} rows.`);
  } else if (flagged > 0) {
    console.log(`\n(Read-only mode. Re-run with --quarantine to soft-retire ${flagged} flagged rows.)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
