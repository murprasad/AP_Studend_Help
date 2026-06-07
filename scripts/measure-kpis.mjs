/**
 * KPI measurement harness — produces the baseline scorecard for the KPI
 * framework (docs/KPI_FRAMEWORK_2026-06-07.md). Deterministic / DB KPIs only;
 * the Fidelity Agent (A1) and outcome-based D1 are separate.
 *
 *   node scripts/measure-kpis.mjs
 * Output: data/kpi-scorecards/kpi-<YYYY-MM-DD>.{json,md}. Read-only. Cron-able.
 *
 * Product-agnostic: run in either SN or PL repo (reads that repo's DB via .env).
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
if (!process.env.DATABASE_URL) {
  for (const f of [".env.local", ".env"]) {
    const p = join(root, f);
    if (existsSync(p)) for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const stamp = new Date().toISOString().slice(0, 10);
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const bigWords = (s) => norm(s).split(" ").filter((w) => w.length > 3);
const showsMathWork = (e) => /=|\d\s*[+\-×x*/÷^]\s*\d|\bordered\b|\bsolv|\bsubstitut|\bfactor|√|\bslope\b|\bmedian\b|\bmean\b/i.test(e);
function answerText(options, correctAnswer) {
  let opts = options;
  if (typeof opts === "string") { try { opts = JSON.parse(opts); } catch { opts = [opts]; } }
  if (!Array.isArray(opts)) return String(correctAnswer || "");
  const stripped = opts.map((o) => String(typeof o === "string" ? o : (o?.text ?? "")).replace(/^[A-E][).:\s-]+/i, "").trim());
  const letter = String(correctAnswer || "").trim().toUpperCase();
  if (/^[A-E]$/.test(letter)) { const i = letter.charCodeAt(0) - 65; if (stripped[i]) return stripped[i]; }
  return stripped.find((s) => norm(s) === norm(correctAnswer)) || String(correctAnswer || "");
}
function isCircular(expl, ansText) {
  const e = (expl || "").trim(); const work = showsMathWork(e);
  if (e.length < 100 && !work) return true;
  const m = e.match(/^(.*?)\bis correct because\b(.*)$/is);
  if (m) { const b = new Set(bigWords(m[1])); const a = bigWords(m[2]); if (a.length && a.filter((w) => b.has(w)).length / a.length > 0.5) return true; }
  if (ansText && e.length < 170 && norm(e).includes(norm(ansText)) && !work) return true;
  return false;
}
const pct = (n, d) => (d ? Math.round((1000 * n) / d) / 10 : 0);

const prisma = new PrismaClient();
const kpis = {};
const note = (k, v) => { kpis[k] = v; };
try {
  // ── B1 Explanation quality (% teaching / non-circular) ──
  try {
    const qs = await prisma.question.findMany({ where: { isApproved: true }, select: { course: true, explanation: true, options: true, correctAnswer: true } });
    let circ = 0; const byCourse = {};
    for (const q of qs) {
      const bad = isCircular(q.explanation, answerText(q.options, q.correctAnswer));
      if (bad) { circ++; byCourse[q.course] = (byCourse[q.course] ?? 0) + 1; }
    }
    const worst = Object.entries(byCourse).sort((a, b) => b[1] - a[1]).slice(0, 5);
    note("B1_explanation_quality", { teachingPct: pct(qs.length - circ, qs.length), circular: circ, approved: qs.length, target: 95, worstCourses: worst });
  } catch (e) { note("B1_explanation_quality", { error: e.message }); }

  // ── C1 gold-tier % · C3 coverage ──
  try {
    const total = await prisma.question.count({ where: { isApproved: true } });
    let gold = null;
    try { gold = await prisma.question.count({ where: { isApproved: true, pipelineVetted: true, auditPassed: true } }); } catch { /* fields may not exist */ }
    const grouped = await prisma.question.groupBy({ by: ["course"], where: { isApproved: true }, _count: { _all: true } });
    const perCourse = grouped.map((g) => ({ course: g.course, approved: g._count._all })).sort((a, b) => a.approved - b.approved);
    const redUnits = perCourse.filter((c) => c.approved < 200);
    note("C1_gold_tier", gold == null ? { note: "pipelineVetted/auditPassed not in schema" } : { goldPct: pct(gold, total), gold, approved: total, target: 70 });
    note("C3_coverage", { courses: perCourse.length, below200: redUnits.length, weakest: perCourse.slice(0, 5), target: "0 courses <200" });
  } catch (e) { note("C3_coverage", { error: e.message }); }

  // ── E1/E2 completion + abandon ──
  try {
    const total = await prisma.practiceSession.count();
    const completed = await prisma.practiceSession.count({ where: { status: "COMPLETED" } });
    note("E1_completion_rate", { completionPct: pct(completed, total), completed, total, target: 80 });
    note("E2_abandon_rate", { abandonPct: pct(total - completed, total), target: "≤20" });
  } catch (e) { note("E1_completion_rate", { error: e.message }); }

  // ── F1 retention D1/D7 · F2 free→paid ──
  try {
    const sixtyAgo = new Date(Date.now() - 60 * 864e5);
    const rawCohort = await prisma.user.findMany({
      where: { createdAt: { gte: sixtyAgo } },
      select: { id: true, email: true, createdAt: true, subscriptionTier: true, practiceSessions: { select: { startedAt: true } } },
    });
    // Measurement integrity: exclude QA/test accounts (the walks register
    // throwaway users that never return → would tank retention artificially).
    const TEST = /(qa-|walk-|probe-|focus-|@test\.|\.test\.|test@|\+test|example\.com|playwright|e2e-)/i;
    const cohort = rawCohort.filter((u) => !TEST.test(u.email || ""));
    const excluded = rawCohort.length - cohort.length;
    let d1 = 0, d7 = 0;
    for (const u of cohort) {
      const t0 = u.createdAt.getTime();
      const returned = u.practiceSessions.map((s) => s.startedAt.getTime() - t0).filter((d) => d > 864e5); // >24h after signup
      if (returned.some((d) => d <= 7 * 864e5)) d7++;
      if (returned.some((d) => d <= 2 * 864e5)) d1++;
    }
    note("F1_retention", { cohortSize: cohort.length, excludedTestUsers: excluded, d1ReturnPct: pct(d1, cohort.length), d7ReturnPct: pct(d7, cohort.length), target: "D1≥40 D7≥20" });
    const premium = cohort.filter((u) => u.subscriptionTier && u.subscriptionTier !== "FREE").length;
    note("F2_conversion", { cohortSize: cohort.length, premium, conversionPct: pct(premium, cohort.length), target: "set after baseline" });
  } catch (e) { note("F1_retention", { error: e.message }); }

  // ── G1 top pain (latest discovery report, if present) ──
  try {
    const dir = join(root, "data", "discovery-reports");
    if (existsSync(dir)) {
      const files = readFileSync; // placeholder; report read is best-effort
      note("G1_top_pain", { note: "see latest data/discovery-reports/pain-points-*.json" });
    }
  } catch { /* ignore */ }

  // ── write scorecard ──
  const outDir = join(root, "data", "kpi-scorecards");
  mkdirSync(outDir, { recursive: true });
  const report = { generatedAt: new Date().toISOString(), kpis };
  writeFileSync(join(outDir, `kpi-${stamp}.json`), JSON.stringify(report, null, 2));
  const md = [
    `# KPI Scorecard — ${stamp}`, ``,
    `| KPI | Value | Target |`, `|---|---|---|`,
    `| B1 Explanation quality (% teaching) | ${kpis.B1_explanation_quality?.teachingPct ?? "—"}% (${kpis.B1_explanation_quality?.circular ?? "?"} circular) | ≥95% |`,
    `| C1 Gold-tier % | ${kpis.C1_gold_tier?.goldPct != null ? kpis.C1_gold_tier.goldPct + "%" : (kpis.C1_gold_tier?.note ?? "—")} | ≥70% |`,
    `| C3 Coverage (courses <200) | ${kpis.C3_coverage?.below200 ?? "—"} of ${kpis.C3_coverage?.courses ?? "—"} | 0 |`,
    `| E1 Session completion | ${kpis.E1_completion_rate?.completionPct ?? "—"}% | ≥80% |`,
    `| F1 Retention D1 / D7 | ${kpis.F1_retention?.d1ReturnPct ?? "—"}% / ${kpis.F1_retention?.d7ReturnPct ?? "—"}% (n=${kpis.F1_retention?.cohortSize ?? "—"}) | D1≥40 D7≥20 |`,
    `| F2 Free→Paid | ${kpis.F2_conversion?.conversionPct ?? "—"}% (n=${kpis.F2_conversion?.cohortSize ?? "—"}) | TBD |`,
    ``,
    `Worst explanation-quality courses: ${(kpis.B1_explanation_quality?.worstCourses || []).map(([c, n]) => `${c}:${n}`).join(", ") || "—"}`,
    `Weakest-coverage courses: ${(kpis.C3_coverage?.weakest || []).map((c) => `${c.course}:${c.approved}`).join(", ") || "—"}`,
    ``, `_Deterministic/DB KPIs. Fidelity (A1) + readiness-calibration (D1) tracked separately._`,
  ].join("\n");
  writeFileSync(join(outDir, `kpi-${stamp}.md`), md);
  console.log(md);
  console.log(`\n✅ Wrote data/kpi-scorecards/kpi-${stamp}.{json,md}`);
} catch (e) {
  console.error("KPI measurement failed:", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
