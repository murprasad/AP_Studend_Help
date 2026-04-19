// AP CSP content quality audit.
//
// Detects specific bug patterns surfaced by the Reddit feedback
// ("questions missing part" / "don't make sense") + the ChartTrend-style
// pseudocode bugs I traced in the DB earlier. Produces a structured
// report. Does NOT modify the DB — user approves the kill-list first.
//
// Usage: node scripts/audit-csp-quality.mjs
// Output: scripts/logs/csp-audit-YYYY-MM-DD.json + a human-readable
// summary to stdout.

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const REFS_CODE =
  /(the following procedure|the procedure above|the procedure below|this procedure|the code above|the code below|the following code|the following algorithm|the pseudocode|the program above|the program below|the following program|the procedure's|the algorithm above|the algorithm below|shown above|shown below|the function)/i;

const HAS_PROC = /(\bPROCEDURE\b|\bDISPLAY\b|\bINPUT\b|\bRETURN\b|REPEAT UNTIL|REPEAT\s+\d|FOR EACH|\bIF\b|\bFUNCTION\b|←|<-|\bAPPEND\b|\bLENGTH\b)/i;

const FENCE_OPEN = /```/g;

const AP_PSEUDOCODE_KEYWORDS = new Set([
  "PROCEDURE", "RETURN", "DISPLAY", "INPUT", "IF", "ELSE",
  "REPEAT", "UNTIL", "FOR", "EACH", "IN", "NOT", "AND", "OR",
  "TRUE", "FALSE", "MOD", "LENGTH", "FLOOR", "RANDOM",
  "APPEND", "INSERT", "REMOVE",
]);

const POSSIBLE_UPPER_VARS = new Set([
  "INDEX", "ITEM", "LIST", "RESULT", "COUNT", "TOTAL",
  "NUM", "I", "J", "K", "N", "X", "Y", "Z", "SUM",
  "AVG", "MAX", "MIN", "VAL", "VALUE", "DATA", "TARGET",
  "KEY", "NODE", "TEMP", "PRICE", "SCORE", "GRADE", "TREND",
]);

function detectMalformedFences(text) {
  if (!text) return null;
  const matches = text.match(FENCE_OPEN);
  if (!matches) return null;
  if (matches.length === 1) return "unmatched_opening_fence";
  if (matches.length % 2 === 1) return "odd_fence_count";
  const last = text.lastIndexOf("```");
  const trailing = text.slice(last + 3).trim();
  // Allow short closers like language label or blank. Any prose after
  // the last fence is suspicious.
  if (trailing.length > 0 && /[.,!?]/.test(trailing)) return "prose_after_last_fence";
  return null;
}

function detectMixedCaseVars(text) {
  if (!text) return null;
  // Find any upper-case word from POSSIBLE_UPPER_VARS that also appears lowercased in the same text.
  const issues = [];
  for (const upper of POSSIBLE_UPPER_VARS) {
    const upperRe = new RegExp(`\\b${upper}\\b`, "g");
    const lowerRe = new RegExp(`\\b${upper.toLowerCase()}\\b`, "g");
    const uCount = (text.match(upperRe) || []).length;
    const lCount = (text.match(lowerRe) || []).length;
    // Skip English words that legitimately appear lowercased (e.g. "item", "list", "data")
    // by requiring both forms to appear in a PROCEDURE-flavored context.
    if (uCount > 0 && lCount > 0 && /PROCEDURE|RETURN|DISPLAY|REPEAT/.test(text)) {
      // Exclude cases where the lowercase is part of a common English word
      // (unlikely but worth flagging conservatively).
      issues.push(`${upper}/${upper.toLowerCase()}`);
    }
  }
  return issues.length > 0 ? issues.join(",") : null;
}

function detectUndeclaredVars(text) {
  if (!text) return null;
  // Find lowercase identifiers used as array indices or loop vars that never
  // appear on the left-hand side of an assignment. Very conservative — only
  // flags the specific pattern we saw in ChartTrend.
  // Pattern 1: `REPEAT UNTIL <var> > ...` where <var> is never assigned before.
  // Pattern 2: `data[<var>]` where <var> is never assigned before.
  const issues = [];
  const untilMatch = text.match(/REPEAT\s+UNTIL\s+(\w+)\s*[><=]/i);
  if (untilMatch) {
    const v = untilMatch[1];
    // Check if <v> appears as LHS of an assignment BEFORE the REPEAT UNTIL.
    const beforeUntil = text.slice(0, text.indexOf(untilMatch[0]));
    const assignRe = new RegExp(`\\b${v}\\b\\s*(←|<-|=)`, "g");
    if (!assignRe.test(beforeUntil) && !/PROCEDURE[^{]*\(.*\b${v}\b/i.test(beforeUntil)) {
      issues.push(`loop_var_undeclared:${v}`);
    }
  }
  return issues.length > 0 ? issues.join(",") : null;
}

function optionsAsArray(opts) {
  if (!opts) return null;
  if (Array.isArray(opts)) return opts;
  if (typeof opts === "string") {
    try { return JSON.parse(opts); } catch { return null; }
  }
  return null;
}

function detectOptionIssues(q) {
  const opts = optionsAsArray(q.options);
  if (!opts) return "options_not_array";
  if (opts.length < 4) return `too_few_options:${opts.length}`;
  const letters = ["A", "B", "C", "D", "E"];
  if (!letters.includes((q.correctAnswer || "").trim())) return `invalid_correct_answer:${q.correctAnswer}`;
  // Correct-answer letter must correspond to an actual option.
  const idx = letters.indexOf(q.correctAnswer.trim());
  if (idx >= opts.length) return `correct_answer_out_of_range:${q.correctAnswer}`;
  // Duplicate options (after stripping "A) " prefix)
  const stripped = opts.map((o) => String(o).replace(/^[A-E]\)\s*/, "").trim().toLowerCase());
  const uniq = new Set(stripped);
  if (uniq.size !== stripped.length) return "duplicate_options";
  // Very short option text. Exempts single-token numeric answers (e.g. "5",
  // "-3", "0.5", "[1,2,3]") which are legitimate in AP CSP pseudocode-trace
  // questions. Only flags when the option is truly empty or a single letter.
  for (let i = 0; i < opts.length; i++) {
    const core = String(opts[i]).replace(/^[A-E]\)\s*/, "").trim();
    if (core.length === 0) return `option_${letters[i]}_empty`;
    // Single character that's a letter (not digit) is suspicious.
    if (core.length === 1 && /[a-zA-Z]/.test(core)) return `option_${letters[i]}_single_letter`;
  }
  return null;
}

function detectThinExplanation(q) {
  if (!q.explanation) return "no_explanation";
  if (q.explanation.length < 80) return `thin_explanation:${q.explanation.length}`;
  return null;
}

function detectAnswerLetterInExplanation(q) {
  // If the explanation says "C is correct" but correctAnswer is "A", that's a major inconsistency.
  if (!q.explanation || !q.correctAnswer) return null;
  const correct = q.correctAnswer.trim();
  // Look for an explicit "X is correct" / "answer is X" claim early in the explanation.
  const m = q.explanation.slice(0, 160).match(/\b([A-E])\s+is\s+(the\s+)?correct\b|\banswer\s+is\s+([A-E])\b/i);
  if (m) {
    const claimed = (m[1] || m[3] || "").toUpperCase();
    if (claimed && claimed !== correct) return `explanation_claims_${claimed}_vs_correct_${correct}`;
  }
  return null;
}

async function main() {
  const all = await prisma.question.findMany({
    where: { course: "AP_COMPUTER_SCIENCE_PRINCIPLES", isApproved: true },
    select: {
      id: true, questionText: true, stimulus: true, stimulusImageUrl: true,
      options: true, correctAnswer: true, explanation: true, unit: true,
      modelUsed: true, createdAt: true, isAiGenerated: true,
    },
  });
  console.log(`Scanning ${all.length} approved AP CSP questions...`);

  const report = {
    total: all.length,
    buckets: {
      missing_referenced_code: [],     // "the following procedure" but no code
      malformed_fences: [],
      mixed_case_vars: [],
      undeclared_vars: [],
      option_issues: [],
      thin_explanation: [],
      explanation_answer_mismatch: [],
      ultra_short_no_stimulus: [],
    },
    byUnit: {},
  };

  for (const q of all) {
    const text = q.questionText || "";
    const stim = q.stimulus || "";
    const combined = `${text}\n${stim}`;
    const hasCode = HAS_PROC.test(combined) || !!q.stimulusImageUrl;
    const refsCode = REFS_CODE.test(text);

    const flags = [];

    // 1. References code but no code anywhere
    if (refsCode && !hasCode) {
      report.buckets.missing_referenced_code.push({ id: q.id, unit: q.unit, text: text.slice(0, 140) });
      flags.push("missing_referenced_code");
    }

    // 2. Malformed fences in stimulus or questionText
    const fenceIssue = detectMalformedFences(stim) || detectMalformedFences(text);
    if (fenceIssue) {
      report.buckets.malformed_fences.push({ id: q.id, unit: q.unit, issue: fenceIssue, stim: stim.slice(0, 160) });
      flags.push(`fence:${fenceIssue}`);
    }

    // 3. Mixed-case same-name variables in pseudocode
    const mixed = detectMixedCaseVars(combined);
    if (mixed) {
      report.buckets.mixed_case_vars.push({ id: q.id, unit: q.unit, vars: mixed });
      flags.push(`mixed:${mixed}`);
    }

    // 4. Undeclared loop variables
    const undec = detectUndeclaredVars(combined);
    if (undec) {
      report.buckets.undeclared_vars.push({ id: q.id, unit: q.unit, issue: undec });
      flags.push(`undecl:${undec}`);
    }

    // 5. Option-structure issues
    const optIssue = detectOptionIssues(q);
    if (optIssue) {
      report.buckets.option_issues.push({ id: q.id, unit: q.unit, issue: optIssue });
      flags.push(`opt:${optIssue}`);
    }

    // 6. Thin explanation
    const expIssue = detectThinExplanation(q);
    if (expIssue) {
      report.buckets.thin_explanation.push({ id: q.id, unit: q.unit, issue: expIssue });
      flags.push(`expl:${expIssue}`);
    }

    // 7. Explanation-answer mismatch
    const mismatch = detectAnswerLetterInExplanation(q);
    if (mismatch) {
      report.buckets.explanation_answer_mismatch.push({ id: q.id, unit: q.unit, issue: mismatch });
      flags.push(`mismatch:${mismatch}`);
    }

    // 8. Ultra-short text with no stimulus
    if (text.length < 60 && stim.length === 0 && !q.stimulusImageUrl) {
      report.buckets.ultra_short_no_stimulus.push({ id: q.id, unit: q.unit, text });
      flags.push("ultra_short_no_stimulus");
    }

    if (flags.length > 0) {
      report.byUnit[q.unit] = report.byUnit[q.unit] || { flagged: 0, total: 0 };
      report.byUnit[q.unit].flagged += 1;
    }
    report.byUnit[q.unit] = report.byUnit[q.unit] || { flagged: 0, total: 0 };
    report.byUnit[q.unit].total += 1;
  }

  // Deduplicate: a single question can appear in multiple buckets. For the
  // kill-list, we care about distinct question IDs.
  const flaggedIds = new Set();
  for (const bucket of Object.values(report.buckets)) {
    for (const row of bucket) flaggedIds.add(row.id);
  }
  report.distinctFlagged = flaggedIds.size;

  // Print summary to stdout.
  console.log("\n================ AP CSP QUALITY AUDIT ================");
  console.log(`Approved total: ${report.total}`);
  console.log(`Distinct flagged: ${report.distinctFlagged} (${((report.distinctFlagged / report.total) * 100).toFixed(1)}%)`);
  console.log("\nBy bucket:");
  for (const [name, rows] of Object.entries(report.buckets)) {
    console.log(`  ${name.padEnd(32)} ${rows.length}`);
  }
  console.log("\nBy unit:");
  for (const [unit, stat] of Object.entries(report.byUnit)) {
    console.log(`  ${unit.padEnd(40)} ${stat.flagged} / ${stat.total} (${((stat.flagged / stat.total) * 100).toFixed(0)}%)`);
  }

  // Write full JSON report.
  const logDir = path.join(path.dirname(new URL(import.meta.url).pathname).replace(/^\//, "").replace(/^([a-z]):/i, "$1:/"), "logs");
  fs.mkdirSync(logDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const outFile = path.join(logDir, `csp-audit-${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(`\nFull report written to: ${outFile}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
