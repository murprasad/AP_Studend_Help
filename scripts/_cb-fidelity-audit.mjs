/**
 * CB-fidelity audit — automated structural diff per course.
 *
 * Inputs:
 *   - data/cb-spec/<COURSE>.json — manually-encoded CB spec (option count,
 *     question types, audio required, unit weights, etc.)
 *   - DB: approved questions per course
 *
 * Outputs:
 *   - data/cb-fidelity-report.json: per-course gap report
 *   - Console: human-readable summary
 *
 * Per-course checks:
 *   1. Option-count distribution vs spec
 *   2. Stem language (English vs native) for language exams
 *   3. Audio/listening Qs vs CB-required %
 *   4. Distinctive formats: Roman-numeral combos, linked Q-sets, cloze
 *   5. Unit/topic ratio vs CB weights
 *
 * Per-course severity:
 *   - CRITICAL: cannot be fixed with text-only MCQs (e.g. language courses)
 *   - HIGH: structural gaps that mislead students (wrong option count, missing types)
 *   - MEDIUM: content gaps (under-weighted topic areas, missing CB-named concepts)
 *   - LOW: style/cosmetic gaps
 *
 * Run:
 *   node scripts/_cb-fidelity-audit.mjs                  # audit all courses with cb_spec
 *   node scripts/_cb-fidelity-audit.mjs --course=CLEP_BIOLOGY
 *   node scripts/_cb-fidelity-audit.mjs --json           # JSON output
 */
import "dotenv/config";
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const COURSE = args.course ?? null;
const JSON_OUT = !!args.json;

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { PrismaClient } = await import("@prisma/client");
const p = new PrismaClient();

const SPEC_DIR = "data/cb-spec";
if (!existsSync(SPEC_DIR)) {
  console.error(`Spec dir ${SPEC_DIR} doesn't exist yet. Encode cb_spec.json files first.`);
  process.exit(1);
}

const specFiles = readdirSync(SPEC_DIR).filter((f) => f.endsWith(".json"));
console.log(`Loaded ${specFiles.length} cb_spec.json files.`);

const reports = [];

for (const specFile of specFiles) {
  const spec = JSON.parse(readFileSync(path.join(SPEC_DIR, specFile), "utf8"));
  const course = spec.course;
  if (COURSE && course !== COURSE) continue;

  const qs = await p.question.findMany({
    where: { course, isApproved: true },
    select: { id: true, unit: true, topic: true, questionText: true, options: true, correctAnswer: true },
  });

  const findings = [];

  // ── Check 1: option-count distribution
  const optDist = {};
  qs.forEach((q) => {
    const n = Array.isArray(q.options) ? q.options.length : 0;
    optDist[n] = (optDist[n] || 0) + 1;
  });
  const expectedOpts = spec.exam.num_options;
  const wrongOpts = qs.filter((q) => Array.isArray(q.options) && q.options.length !== expectedOpts).length;
  if (wrongOpts > 0) {
    findings.push({
      severity: "HIGH",
      check: "option_count",
      detail: `${wrongOpts}/${qs.length} (${((wrongOpts / qs.length) * 100).toFixed(1)}%) have wrong option count (expected ${expectedOpts}, dist: ${JSON.stringify(optDist)})`,
      fixable: "5th-option augment script for non-exception courses",
    });
  }

  // ── Check 2: stem language (for language exams)
  if (spec.exam.audio_required || spec.exam.native_language_stems) {
    const nativeStemRe = spec.exam.native_language_regex
      ? new RegExp(spec.exam.native_language_regex)
      : null;
    const englishStems = qs.filter((q) => /^(What|Which|How|Why|The author|In the passage|According to)/.test(q.questionText)).length;
    const englishPct = (englishStems / Math.max(qs.length, 1)) * 100;
    if (englishPct > 30) {
      findings.push({
        severity: "CRITICAL",
        check: "stem_language",
        detail: `${englishPct.toFixed(1)}% of stems are in English; CB requires native-language proficiency`,
        fixable: "regenerate bank in native language + add audio (out of scope at $0)",
      });
    }
  }

  // ── Check 3: audio requirement
  if (spec.exam.audio_required) {
    findings.push({
      severity: "CRITICAL",
      check: "audio_missing",
      detail: `CB requires ${(spec.exam.audio_pct || 40)}% listening; bank has 0 audio Qs`,
      fixable: "build audio infrastructure (out of scope at $0)",
    });
  }

  // ── Check 4: distinctive formats
  if (spec.exam.distinctive_formats?.includes("roman_numeral_combo")) {
    const roman = qs.filter((q) => /^\s*I\.|\s+I\.\s+/m.test(q.questionText) && /\bII\./.test(q.questionText)).length;
    if (roman === 0) {
      findings.push({
        severity: "MEDIUM",
        check: "missing_roman_numeral_format",
        detail: `CB Q1-style multi-combo (I, II, III) absent (0 Qs). CB sample uses this format.`,
        fixable: "add to generator prompt + retroactively gen ~10% of bank in this style",
      });
    } else if (roman / qs.length < 0.05) {
      findings.push({
        severity: "MEDIUM",
        check: "low_roman_numeral_share",
        detail: `Roman-numeral multi-combo at ${((roman / qs.length) * 100).toFixed(1)}% of bank; CB has it as a distinctive Bio/Sci format.`,
        fixable: "boost share",
      });
    }
  }
  if (spec.exam.distinctive_formats?.includes("linked_stimulus")) {
    const linked = qs.filter((q) => /Questions?\s+\d+[-–]\d+/.test(q.questionText) || /Use\s+the\s+(table|figure|graph)\s+below/i.test(q.questionText)).length;
    if (linked === 0) {
      findings.push({
        severity: "MEDIUM",
        check: "missing_linked_stimulus",
        detail: `Linked Q-sets with shared stimulus absent (0 Qs). CB samples use this format.`,
        fixable: "add to generator + retroactively gen ~10% of bank as linked sets",
      });
    }
  }
  if (spec.exam.distinctive_formats?.includes("cloze")) {
    const cloze = qs.filter((q) => /_{3,}/.test(q.questionText) || /\(\d+\)/.test(q.questionText)).length;
    if (cloze === 0) {
      findings.push({
        severity: "HIGH",
        check: "missing_cloze",
        detail: `Short-cloze paragraph format absent. CB requires this (20% of reading section).`,
        fixable: "add cloze generator",
      });
    }
  }
  if (spec.exam.distinctive_formats?.includes("numeric_input")) {
    findings.push({
      severity: "HIGH",
      check: "missing_numeric_input_type",
      detail: `CB uses numeric-input Qs (no options, just type a number); schema doesn't support this question type yet.`,
      fixable: "add NUMERIC_INPUT to schema + generator + UI (task #88)",
    });
  }
  if (spec.exam.distinctive_formats?.includes("multi_select")) {
    findings.push({
      severity: "HIGH",
      check: "missing_multi_select_type",
      detail: `CB uses multi-select 'Indicate all such statements'; schema doesn't support this yet.`,
      fixable: "add MULTI_SELECT to schema + generator + UI (task #88)",
    });
  }

  // ── Check 5: off-scope content
  if (spec.exam.off_scope_keywords) {
    const offScope = qs.filter((q) => spec.exam.off_scope_keywords.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(q.questionText))).length;
    if (offScope > 0) {
      findings.push({
        severity: "MEDIUM",
        check: "off_scope_content",
        detail: `${offScope} Qs contain off-CB-scope keywords (${spec.exam.off_scope_keywords.join(", ")})`,
        fixable: "unapprove or rewrite to use CB-named concepts",
      });
    }
  }

  // ── Check 6: unit ratio vs CB weights
  if (spec.topic_weights) {
    const byUnit = {};
    qs.forEach((q) => { byUnit[q.unit] = (byUnit[q.unit] || 0) + 1; });
    const unitsMap = spec.unit_to_topic_weight_key || {};
    for (const [unit, count] of Object.entries(byUnit)) {
      const weightKey = unitsMap[unit];
      if (weightKey && spec.topic_weights[weightKey]) {
        const expectedShare = spec.topic_weights[weightKey];
        const actualShare = count / qs.length;
        const delta = Math.abs(actualShare - expectedShare);
        if (delta > 0.10) {
          findings.push({
            severity: "MEDIUM",
            check: "unit_ratio_off",
            detail: `${unit}: actual ${(actualShare * 100).toFixed(1)}% vs CB ${(expectedShare * 100).toFixed(1)}% (delta ${(delta * 100).toFixed(1)}pp)`,
            fixable: "generate more Qs for under-represented unit, hide some for over-represented",
          });
        }
      }
    }
  }

  // Determine overall severity (highest of findings)
  const sevRank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const overall = findings.length === 0
    ? "PASS"
    : findings.map((f) => f.severity).sort((a, b) => sevRank[b] - sevRank[a])[0];

  reports.push({
    course,
    approved: qs.length,
    overall,
    findings,
  });
}

await p.$disconnect();

// Sort by severity
const sevRank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, PASS: 0 };
reports.sort((a, b) => sevRank[b.overall] - sevRank[a.overall] || (b.findings?.length || 0) - (a.findings?.length || 0));

if (JSON_OUT) {
  console.log(JSON.stringify(reports, null, 2));
} else {
  console.log("\n══ CB-fidelity audit report ══");
  reports.forEach((r) => {
    console.log(`\n${r.course} (${r.approved} approved) — ${r.overall}`);
    r.findings.forEach((f) => {
      console.log(`  [${f.severity}] ${f.check}: ${f.detail}`);
      console.log(`     fix: ${f.fixable}`);
    });
  });
  const tally = {};
  reports.forEach((r) => { tally[r.overall] = (tally[r.overall] || 0) + 1; });
  console.log("\nOverall tally:", tally);
}

if (!existsSync("data/cb-fidelity-reports")) mkdirSync("data/cb-fidelity-reports", { recursive: true });
const ts = new Date().toISOString().substring(0, 10);
writeFileSync(`data/cb-fidelity-reports/${ts}.json`, JSON.stringify(reports, null, 2));
console.log(`\nWrote report to data/cb-fidelity-reports/${ts}.json`);
