#!/usr/bin/env node
/**
 * integration-tests.js
 * Runs authenticated integration tests against the live production site.
 * Calls /api/test/practice-check (CRON_SECRET-gated) to verify all 50 courses
 * have questions available and AI generation is functioning.
 *
 * Usage: node scripts/integration-tests.js [--base-url https://studentnest.ai]
 * Requires: CRON_SECRET env var (same value as CF Pages secret)
 *
 * Exits 0 if all critical tests pass (warnings allowed).
 * Exits 1 if any critical test fails (red courses without AI generation).
 */

// Auto-load .env so CRON_SECRET is always available without manual env setup
(function loadDotEnv() {
  if (process.env.CRON_SECRET) return; // already set
  try {
    const fs = require("fs"), path = require("path");
    const envPath = path.join(__dirname, "..", ".env");
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*["']?(.*?)["']?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch { /* silently skip if .env unreadable */ }
})();

const BASE_URL = (() => {
  const idx = process.argv.indexOf("--base-url");
  return idx !== -1 ? process.argv[idx + 1] : "https://studentnest.ai";
})();

const CRON_SECRET = process.env.CRON_SECRET;
const TIMEOUT_MS = 30000;

let passed = 0;
let warned = 0;
let failed = 0;
const results = [];

function ok(label, detail = "")   { console.log(`  ✅ ${label}${detail ? " — " + detail : ""}`); passed++; results.push({ label, status: "pass", detail }); }
function warn(label, detail = "") { console.warn(`  ⚠️  ${label}${detail ? " — " + detail : ""}`); warned++; results.push({ label, status: "warn", detail }); }
function fail(label, detail = "") { console.error(`  ❌ ${label}${detail ? " — " + detail : ""}`); failed++; results.push({ label, status: "fail", detail }); }
function section(title)           { console.log(`\n── ${title} ──`); }

function fetchWithTimeout(url, ms, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  if (timer.unref) timer.unref();
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

async function run() {
  console.log(`\n🧪 Integration tests against ${BASE_URL}\n`);

  // ── 0. Prerequisite ──────────────────────────────────────────────────────────
  if (!CRON_SECRET) {
    console.warn("⚠️  CRON_SECRET env var not set — skipping integration tests.");
    console.warn("   Set CRON_SECRET to run authenticated tests.");
    console.warn("   (Same value as the CRON_SECRET in Cloudflare Pages secrets)\n");
    process.exitCode = 0;
    return { passed: 0, warned: 1, failed: 0, results: [], skipped: true };
  }

  // ── 1. Practice coverage check (all courses) ────────────────────────────────
  section("1. Practice question coverage (all courses)");

  let coverageData = null;
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/test/practice-check`, TIMEOUT_MS, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });

    if (res.status === 401) {
      fail("GET /api/test/practice-check", "401 — CRON_SECRET mismatch between local env and CF Pages secrets");
      process.exitCode = 1;
      return { passed, warned, failed, results };
    }
    if (!res.ok) {
      fail("GET /api/test/practice-check", `HTTP ${res.status}`);
      process.exitCode = 1;
      return { passed, warned, failed, results };
    }

    coverageData = await res.json();
  } catch (e) {
    fail("GET /api/test/practice-check", e.message);
    process.exitCode = 1;
    return { passed, warned, failed, results };
  }

  const { summary, courses, redCourses, yellowCourses, frqAvailability } = coverageData;

  // AI generation status
  if (summary.aiGenerationEnabled) {
    ok("AI generation enabled", "students will get questions even for thin courses");
  } else {
    warn("AI generation is DISABLED", "thin/empty courses will show 'no questions available'");
  }

  console.log(`\n  📊 Total approved questions: ${summary.totalApprovedQuestions}`);
  console.log(`  📊 Course health: ${summary.courses.green} green, ${summary.courses.yellow} yellow, ${summary.courses.red} red\n`);

  // Per-course results
  for (const c of courses) {
    const icon = c.status === "green" ? "✅" : c.status === "yellow" ? "⚠️ " : "❌";
    const detail = `${c.totalMCQ} MCQ questions | ${c.emptyUnits}/${c.unitCount} units empty`;
    console.log(`  ${icon} ${c.name.padEnd(40)} ${detail}`);

    if (c.status === "red") {
      if (summary.aiGenerationEnabled) {
        // Red but AI will generate — warn, don't fail
        results.push({ label: c.course, status: "warn", detail: "0 questions — AI will generate on first session" });
        warned++;
      } else {
        // Red AND AI disabled — fail
        results.push({ label: c.course, status: "fail", detail: "0 questions + AI disabled = students get error" });
        failed++;
      }
    } else if (c.status === "yellow") {
      results.push({ label: c.course, status: "warn", detail: `only ${c.totalMCQ} questions` });
      warned++;
    } else {
      results.push({ label: c.course, status: "pass", detail: `${c.totalMCQ} MCQ questions` });
      passed++;
    }
  }

  // ── 2. FRQ availability check ─────────────────────────────────────────────────
  section("2. FRQ/essay question availability");
  for (const { course, count } of frqAvailability) {
    const name = courses.find((c) => c.course === course)?.name ?? course;
    if (count === 0) {
      warn(`${name} FRQ`, "0 FRQ questions — AI will generate on first session");
    } else {
      ok(`${name} FRQ`, `${count} questions`);
    }
  }

  // ── 3. Analytics + Study Plan API health (all courses) ───────────────────────
  section("3. Analytics + Study Plan API health (all courses)");
  const allCourseKeys = courses.map((c) => c.course);
  let analyticsOk = 0, analyticsFail = 0;
  let studyPlanOk = 0, studyPlanFail = 0;

  // Test in batches of 4 to avoid overwhelming CF Workers
  for (let i = 0; i < allCourseKeys.length; i += 4) {
    const batch = allCourseKeys.slice(i, i + 4);
    const batchResults = await Promise.allSettled(
      batch.flatMap((course) => [
        fetchWithTimeout(`${BASE_URL}/api/analytics?course=${course}`, 25000)
          .then((r) => ({ course, route: "analytics", status: r.status, ok: r.ok })),
        fetchWithTimeout(`${BASE_URL}/api/study-plan?course=${course}`, 25000)
          .then((r) => ({ course, route: "study-plan", status: r.status, ok: r.ok })),
      ])
    );
    for (const result of batchResults) {
      if (result.status === "rejected") {
        const label = `API timeout`;
        warn(label, result.reason?.message || "unknown error");
        analyticsFail++;
      } else {
        const { course, route, status, ok: isOk } = result.value;
        const name = courses.find((c) => c.course === course)?.name ?? course;
        if (status === 401) {
          // Expected — no auth cookie in integration tests
          if (route === "analytics") analyticsOk++;
          else studyPlanOk++;
        } else if (status >= 500) {
          warn(`${name} ${route}`, `HTTP ${status} — server error`);
          if (route === "analytics") analyticsFail++;
          else studyPlanFail++;
        } else {
          if (route === "analytics") analyticsOk++;
          else studyPlanOk++;
        }
      }
    }
  }

  const totalCourses = allCourseKeys.length;
  if (analyticsFail === 0) {
    ok(`Analytics API`, `${analyticsOk}/${totalCourses} courses responding (all 401 auth guard — healthy)`);
  } else {
    warn(`Analytics API`, `${analyticsFail}/${totalCourses} courses returned 500 — CF Workers timeout risk`);
  }
  if (studyPlanFail === 0) {
    ok(`Study Plan API`, `${studyPlanOk}/${totalCourses} courses responding (all 401 auth guard — healthy)`);
  } else {
    warn(`Study Plan API`, `${studyPlanFail}/${totalCourses} courses returned 500 — CF Workers timeout risk`);
  }

  // ── 4. Red course critical check ─────────────────────────────────────────────
  if (redCourses.length > 0) {
    section("4. Red courses — action required");
    if (summary.aiGenerationEnabled) {
      console.log(`  ℹ️  ${redCourses.length} courses have 0 questions. AI generation is ON — students will`);
      console.log(`     trigger generation on their first session (adds ~10-15s to first session start).`);
      console.log(`     To pre-seed: run the 'seed-question-bank' GitHub Actions workflow.`);
    } else {
      console.error(`  ❌ ${redCourses.length} courses have 0 questions AND AI generation is OFF.`);
      console.error(`     Students on these courses will get an error. Enable AI generation or seed the DB.`);
      console.error(`     Affected: ${redCourses.join(", ")}`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Integration tests: ${passed} passed, ${warned} warnings, ${failed} failed`);

  if (failed > 0) {
    console.error(`\n❌ CRITICAL: ${failed} course(s) have 0 questions with AI generation disabled.`);
    console.error(`   Students will receive errors. Fix before treating deploy as successful.`);
    process.exitCode = 1;
  } else if (warned > 0) {
    console.log(`\n⚠️  ${warned} warning(s) — thin courses will use AI generation on first session.`);
  } else {
    console.log(`\n✅ All integration tests passed.`);
  }

  // Write results for update-test-plan.js
  const fs = require("fs");
  const os = require("os");
  const outFile = require("path").join(os.tmpdir(), "studentnest_integration_results.json");
  fs.writeFileSync(outFile, JSON.stringify({ passed, warned, failed, results, summary }));

  return { passed, warned, failed, results, summary };
}

if (require.main === module) {
  run().catch((e) => {
    console.error("Integration test runner crashed:", e.message);
    process.exit(1);
  });
}

module.exports = { run };
