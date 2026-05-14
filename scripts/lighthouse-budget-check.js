#!/usr/bin/env node
/**
 * Lighthouse-CI budget gate — locks in our structural performance advantage.
 *
 * NurseHub competitive analysis 2026-05-13 (docs/competitor-analysis-nursehub-
 * 2026-05-13.md): they're WordPress + Cloudways with ~2-3s LCP on mobile.
 * We're Next.js + Cloudflare Pages with sub-1s LCP. That's a real moat.
 * Without a gate, a future "let's just import this big component" PR
 * silently erodes it.
 *
 * This script runs Lighthouse against a list of marketing + authed URLs
 * with mobile + slow-4G emulation (default Lighthouse mobile preset) and
 * fails the deploy if any URL crosses its LCP budget.
 *
 * Wire into scripts/deploy-staging.js AFTER Playwright suite so a
 * regression that passes functionally but blows the perf budget still
 * blocks the staging gate.
 *
 * Usage:
 *   node scripts/lighthouse-budget-check.js https://staging.studentnest.pages.dev
 *
 * No npm deps required — uses `npx --yes lighthouse@latest` so we don't
 * carry the 50MB Lighthouse install as a project dep.
 */

import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE_URL = process.argv[2] ?? process.env.E2E_BASE_URL ?? "https://studentnest.ai";

// Per-route budgets. Marketing pages tighter (cold visitors), authed pages
// looser (signed-in users tolerate more, plus chrome is heavier).
const BUDGETS = [
  { path: "/",          lcpMs: 1000, label: "Landing" },
  { path: "/pricing",   lcpMs: 1000, label: "Pricing" },
  { path: "/ap-prep",   lcpMs: 1200, label: "AP Prep" },
  { path: "/sat-prep",  lcpMs: 1200, label: "SAT Prep" },
  { path: "/act-prep",  lcpMs: 1200, label: "ACT Prep" },
  // Authed routes — would need storage state to actually load past redirect.
  // Skip /dashboard for now; add when auth.setup pattern is available here.
];

// Allow a single warm-up run per URL to absorb cold-start noise (CF Pages
// cold start adds ~600ms-1s). Take the BEST of two runs as the verdict.
const RUNS_PER_URL = 2;

const OUT_DIR = join(tmpdir(), "lighthouse-budget-check");
mkdirSync(OUT_DIR, { recursive: true });

function runLighthouse(url, runIdx) {
  return new Promise((resolve, reject) => {
    const outPath = join(OUT_DIR, `lh-${runIdx}-${Date.now()}.json`);
    // Mobile preset (default) + slow-4G + headless Chrome
    const args = [
      "--yes",
      "lighthouse@latest",
      url,
      "--output=json",
      `--output-path=${outPath}`,
      "--only-categories=performance",
      "--chrome-flags=--headless=new --no-sandbox",
      "--quiet",
    ];
    const proc = spawn("npx", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (c) => (stderr += c.toString()));
    proc.on("exit", (code) => {
      if (code !== 0) return reject(new Error(`lighthouse exited ${code}: ${stderr.slice(0, 400)}`));
      if (!existsSync(outPath)) return reject(new Error(`lighthouse output missing at ${outPath}`));
      try {
        const json = JSON.parse(readFileSync(outPath, "utf8"));
        const lcp = json?.audits?.["largest-contentful-paint"]?.numericValue;
        const cls = json?.audits?.["cumulative-layout-shift"]?.numericValue;
        const tbt = json?.audits?.["total-blocking-time"]?.numericValue;
        const score = json?.categories?.performance?.score;
        resolve({ lcp, cls, tbt, score, outPath });
      } catch (e) {
        reject(e);
      }
    });
  });
}

async function audit(url, budget, label) {
  const runs = [];
  for (let i = 0; i < RUNS_PER_URL; i++) {
    try {
      const r = await runLighthouse(url, i);
      runs.push(r);
    } catch (e) {
      console.error(`  Run ${i + 1} failed: ${e.message}`);
    }
  }
  if (runs.length === 0) {
    return { url, label, ok: false, reason: "all Lighthouse runs failed" };
  }
  const best = runs.reduce((a, b) => (a.lcp <= b.lcp ? a : b));
  return {
    url,
    label,
    lcp: best.lcp,
    cls: best.cls,
    tbt: best.tbt,
    score: best.score,
    budget,
    ok: best.lcp <= budget,
  };
}

(async () => {
  console.log(`\n══ Lighthouse budget gate ══`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Routes: ${BUDGETS.length}`);
  console.log(`Runs per URL: ${RUNS_PER_URL} (best-of)\n`);

  const results = [];
  for (const b of BUDGETS) {
    const url = `${BASE_URL}${b.path}`;
    console.log(`▶ Auditing ${b.label} (${url})…`);
    const r = await audit(url, b.lcpMs, b.label);
    results.push(r);
    if (r.ok === false && r.reason) {
      console.log(`  ❌ ${r.reason}`);
    } else if (r.ok) {
      console.log(`  ✅ LCP=${Math.round(r.lcp)}ms (budget ${b.lcpMs}ms) · CLS=${r.cls?.toFixed(3)} · TBT=${Math.round(r.tbt)}ms · perf=${(r.score * 100).toFixed(0)}`);
    } else {
      console.log(`  ❌ LCP=${Math.round(r.lcp)}ms exceeds budget ${b.lcpMs}ms`);
    }
  }

  console.log(`\n══ Summary ══`);
  const failures = results.filter((r) => r.ok === false);
  for (const r of results) {
    const status = r.ok ? "✅" : "❌";
    const detail = r.ok ? `LCP=${Math.round(r.lcp)}ms` : (r.reason ?? `LCP=${Math.round(r.lcp)}ms > ${r.budget}ms`);
    console.log(`  ${status} ${r.label.padEnd(12)} ${detail}`);
  }

  // Write a JSON report alongside test-results.json so the staging gate can
  // pick it up if needed.
  const reportPath = join(process.cwd(), "lighthouse-budget-report.json");
  writeFileSync(reportPath, JSON.stringify({ baseUrl: BASE_URL, results, ranAt: new Date().toISOString() }, null, 2));
  console.log(`\nReport: ${reportPath}`);

  if (failures.length > 0) {
    console.log(`\n❌ Lighthouse budget gate FAILED — ${failures.length} route(s) over budget`);
    process.exit(1);
  } else {
    console.log(`\n✅ Lighthouse budget gate PASSED — all ${results.length} routes within budget`);
    process.exit(0);
  }
})();
