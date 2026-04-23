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
// Returns { body, unit } — `unit` is the trailing unit token (or "" if none).
// Fix 2026-04-23: previous version discarded the unit, causing two options
// with the SAME value but DIFFERENT units (e.g. "1.23 kPa" vs "1.23 atm")
// to false-positive as equivalent. They're pedagogically valid
// unit-discrimination distractors — the student must know kPa ≠ atm.
// Now we capture the unit and the caller will skip pairs whose units differ.
function normalize(raw) {
  if (raw == null) return { body: "", unit: "" };
  let s = String(raw).trim();
  s = s.replace(/^(?:=|≈|is|answer\s*:?|value\s*:?)\s*/i, "");
  s = s.replace(/^\$/, "");
  // Capture trailing unit token if present (preserves the raw unit so
  // downstream can compare kg vs g, J vs N, kPa vs atm).
  let unit = "";
  const unitMatch = s.match(/^(.*?)\s+([a-zA-ZµΩ°]+(?:\/[a-zA-Z²³]+)?\.?)$/);
  if (unitMatch) {
    s = unitMatch[1].trim();
    unit = unitMatch[2].toLowerCase().replace(/\.$/, "");
  }
  return { body: s.trim(), unit };
}

function parseNumber(str) {
  const s = str.trim();
  if (!NUM.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Evaluate a single raw option to a number (or null if unparseable in our
// conservative subset). Returns { value, form, unit } where form describes
// what we matched and unit is the trailing unit token (or "" if none).
// Unit is preserved so the caller can skip unit-discrimination pairs.
function evalOption(raw) {
  const { body: s, unit } = normalize(raw);
  if (!s) return null;

  // Percent: "50%" → 0.5
  const pct = s.match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*%$/);
  if (pct) {
    const n = Number(pct[1]);
    if (Number.isFinite(n)) return { value: n / 100, form: "percent", unit };
  }

  // Plain number
  const asNum = parseNumber(s);
  if (asNum != null) return { value: asNum, form: "int_or_decimal", unit };

  // Mixed fraction: "a b/c"
  const mixed = s.match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const num = Number(mixed[2]);
    const den = Number(mixed[3]);
    if (den !== 0 && Number.isFinite(whole) && Number.isFinite(num) && Number.isFinite(den)) {
      const sign = whole < 0 || String(mixed[1]).startsWith("-") ? -1 : 1;
      return { value: sign * (Math.abs(whole) + num / den), form: "mixed_fraction", unit };
    }
  }

  // Simple fraction: "a/b" with numeric a, b (optionally parenthesized)
  const frac = s.replace(/[()]/g, "").match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*\/\s*([+-]?(?:\d+\.?\d*|\.\d+))$/);
  if (frac) {
    const a = Number(frac[1]);
    const b = Number(frac[2]);
    if (b !== 0 && Number.isFinite(a) && Number.isFinite(b)) {
      return { value: a / b, form: "fraction", unit };
    }
  }

  // Multiplication: "a*b" | "a·b" | "a×b" | "a x b" (explicit operators only)
  const mul = s.match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*[*·×]\s*([+-]?(?:\d+\.?\d*|\.\d+))$/);
  if (mul) {
    const a = Number(mul[1]);
    const b = Number(mul[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) return { value: a * b, form: "multiplication", unit };
  }

  // Parenthesized implicit multiplication: "(a)(b)" or "a(b)"
  const paren = s.match(/^\(?\s*([+-]?(?:\d+\.?\d*|\.\d+))\s*\)?\s*\(\s*([+-]?(?:\d+\.?\d*|\.\d+))\s*\)$/);
  if (paren) {
    const a = Number(paren[1]);
    const b = Number(paren[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) return { value: a * b, form: "paren_multiplication", unit };
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

    // Group by (near-equal numeric value) AND matching unit. Fix
    // 2026-04-23: options with the same value but DIFFERENT units are
    // pedagogically valid (unit-discrimination distractors — the student
    // must know kPa ≠ atm, J ≠ N). Grouping by (value, unit) skips those.
    const groups = [];
    for (const e of evals) {
      if (!e.ev) continue;
      const g = groups.find((g) => nearlyEqual(g.value, e.ev.value) && g.unit === (e.ev.unit || ""));
      if (g) g.members.push(e);
      else groups.push({ value: e.ev.value, unit: e.ev.unit || "", members: [e] });
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
