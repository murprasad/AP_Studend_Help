#!/usr/bin/env node
/**
 * functional-tests.js
 * Authenticated functional tests + regression suite against the live production site.
 * Creates a test user via /api/test/auth, runs authenticated API tests, then cleans up.
 *
 * Usage: node scripts/functional-tests.js [--base-url https://studentnest.ai]
 * Requires: CRON_SECRET env var (same value as CF Pages secret)
 *
 * Test suites:
 *  A. Core Regression (always runs): user profile, practice lifecycle, analytics, study plan
 *  B. AI-Dependent (tolerates timeouts): AI tutor, knowledge check
 *  C. Data Validation: multi-course analytics, invalid input handling
 */

// Auto-load .env
(function loadDotEnv() {
  if (process.env.CRON_SECRET) return;
  try {
    const fs = require("fs"), path = require("path");
    const envPath = path.join(__dirname, "..", ".env");
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*["']?(.*?)["']?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch { /* ignore */ }
})();

const BASE_URL = (() => {
  const idx = process.argv.indexOf("--base-url");
  return idx !== -1 ? process.argv[idx + 1] : "https://studentnest.ai";
})();

const CRON_SECRET = process.env.CRON_SECRET;
const TIMEOUT_MS = 25000;

let passed = 0;
let warned = 0;
let failed = 0;
const results = [];

function ok(label, detail = "")   { console.log(`  \u2705 ${label}${detail ? " \u2014 " + detail : ""}`); passed++; results.push({ label, status: "pass", detail }); }
function warn(label, detail = "") { console.warn(`  \u26A0\uFE0F  ${label}${detail ? " \u2014 " + detail : ""}`); warned++; results.push({ label, status: "warn", detail }); }
function fail(label, detail = "") { console.error(`  \u274C ${label}${detail ? " \u2014 " + detail : ""}`); failed++; results.push({ label, status: "fail", detail }); }
function section(title)           { console.log(`\n\u2500\u2500 ${title} \u2500\u2500`); }

function fetchWithTimeout(url, ms, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  if (timer.unref) timer.unref();
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

function authFetch(path, token, cookieName, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    Cookie: `${cookieName}=${token}`,
    ...(opts.headers || {}),
  };
  return fetchWithTimeout(`${BASE_URL}${path}`, TIMEOUT_MS, { ...opts, headers });
}

async function run() {
  const startTime = Date.now();
  console.log(`\n\uD83E\uDDEA Functional tests against ${BASE_URL}\n`);

  // ── 0. Prerequisites ────────────────────────────────────────────────────────
  if (!CRON_SECRET) {
    console.warn("\u26A0\uFE0F  CRON_SECRET not set \u2014 skipping functional tests.");
    return { passed: 0, warned: 1, failed: 0, results: [], skipped: true };
  }

  // ── 1. Setup: Create test user + get session token ──────────────────────────
  section("Setup: Test user authentication");
  let token, cookieName, userId;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/api/test/auth`, TIMEOUT_MS, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${CRON_SECRET}` },
        body: JSON.stringify({ action: "create" }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        if (attempt === 1) {
          console.log(`  Attempt 1 failed (HTTP ${res.status}), retrying after cold start...`);
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }
        warn("Test auth setup", `HTTP ${res.status}: ${body.slice(0, 100)}`);
        return { passed, warned, failed, results, skipped: true };
      }
      const data = await res.json();
      token = data.sessionToken;
      cookieName = data.cookieName;
      userId = data.userId;
      ok("Test user created", `userId=${userId?.slice(0, 8)}...`);
      break;
    } catch (e) {
      if (attempt === 1) {
        console.log(`  Attempt 1 error (${e.message}), retrying...`);
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }
      warn("Test auth setup", e.message);
      return { passed, warned, failed, results, skipped: true };
    }
  }

  try {
    // ══════════════════════════════════════════════════════════════════════════
    // Suite A: Core Regression Tests
    // ══════════════════════════════════════════════════════════════════════════
    section("A. Core Regression Tests");

    // A1. User Profile
    try {
      const res = await authFetch("/api/user", token, cookieName);
      if (!res.ok) { fail("A1. User profile", `HTTP ${res.status}`); }
      else {
        const data = await res.json();
        const u = data.user;
        if (!u || !u.id || !u.email) { fail("A1. User profile", "missing user.id or user.email"); }
        else if (!u.track) { fail("A1. User profile", "missing user.track"); }
        else { ok("A1. User profile", `track=${u.track}`); }
      }
    } catch (e) { fail("A1. User profile", e.message); }

    // A2. Practice Session Lifecycle
    let sessionId = null;
    let firstQuestion = null;
    try {
      // Step 1: Create session
      const createRes = await authFetch("/api/practice", token, cookieName, {
        method: "POST",
        body: JSON.stringify({ sessionType: "QUICK_PRACTICE", course: "AP_WORLD_HISTORY", questionCount: 3, difficulty: "ALL", unit: "ALL", questionType: "MCQ" }),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        fail("A2a. Create practice session", `HTTP ${createRes.status}: ${err.error || ""}`);
      } else {
        const data = await createRes.json();
        sessionId = data.sessionId;
        const questions = data.questions || [];
        firstQuestion = questions[0];
        if (!sessionId) { fail("A2a. Create practice session", "missing sessionId"); }
        else if (questions.length < 1) { fail("A2a. Create practice session", "no questions returned"); }
        else {
          const q = firstQuestion;
          if (!q.id || !q.questionText || !q.options || q.options.length < 4) {
            fail("A2a. Create practice session", "question missing id/text/options");
          } else {
            ok("A2a. Create practice session", `sessionId=${sessionId.slice(0, 8)}... ${questions.length} questions`);
          }
        }
      }

      // Step 2: Submit answer
      if (sessionId && firstQuestion) {
        const answerRes = await authFetch(`/api/practice/${sessionId}`, token, cookieName, {
          method: "POST",
          body: JSON.stringify({ questionId: firstQuestion.id, answer: firstQuestion.options[0], timeSpentSecs: 5 }),
        });
        if (!answerRes.ok) {
          fail("A2b. Submit answer", `HTTP ${answerRes.status}`);
        } else {
          const data = await answerRes.json();
          if (typeof data.isCorrect !== "boolean" || !data.correctAnswer) {
            fail("A2b. Submit answer", "missing isCorrect or correctAnswer");
          } else {
            ok("A2b. Submit answer", `isCorrect=${data.isCorrect}, explanation=${(data.explanation || "").length}ch`);
          }
        }
      }

      // Step 3: Complete session
      if (sessionId) {
        const completeRes = await authFetch(`/api/practice/${sessionId}`, token, cookieName, {
          method: "PATCH",
          body: JSON.stringify({}),
        });
        if (!completeRes.ok) {
          fail("A2c. Complete session", `HTTP ${completeRes.status}`);
        } else {
          const data = await completeRes.json();
          const s = data.summary || data.session;
          if (!s) { fail("A2c. Complete session", "missing summary"); }
          else { ok("A2c. Complete session", `accuracy=${s.accuracy ?? "n/a"}%, xp=${s.xpEarned ?? "n/a"}`); }
        }
      }
    } catch (e) { fail("A2. Practice lifecycle", e.message); }

    // A3. Analytics
    try {
      const res = await authFetch("/api/analytics?course=AP_WORLD_HISTORY", token, cookieName);
      if (!res.ok) { fail("A3. Analytics", `HTTP ${res.status}`); }
      else {
        const data = await res.json();
        const keys = ["masteryData", "accuracyTimeline", "stats", "predictedScore", "knowledgeCheckStats"];
        const missing = keys.filter(k => !(k in data));
        if (missing.length > 0) { fail("A3. Analytics", `missing keys: ${missing.join(", ")}`); }
        else if (!data.stats || typeof data.stats.totalAnswered !== "number") { fail("A3. Analytics", "stats.totalAnswered not a number"); }
        else { ok("A3. Analytics", `totalAnswered=${data.stats.totalAnswered}, mastery units=${data.masteryData?.length}`); }
      }
    } catch (e) { fail("A3. Analytics", e.message); }

    // A4. Study Plan
    try {
      const res = await authFetch("/api/study-plan?course=AP_WORLD_HISTORY", token, cookieName);
      if (!res.ok) { fail("A4. Study Plan GET", `HTTP ${res.status}`); }
      else {
        const data = await res.json();
        if (!("plan" in data)) { fail("A4. Study Plan GET", "missing 'plan' key"); }
        else { ok("A4. Study Plan GET", data.plan ? "plan exists" : "plan=null (expected for new user)"); }
      }
    } catch (e) { fail("A4. Study Plan GET", e.message); }

    // A5. Auth guard integrity (unauthenticated)
    try {
      const res1 = await fetchWithTimeout(`${BASE_URL}/api/analytics?course=AP_WORLD_HISTORY`, TIMEOUT_MS);
      const res2 = await fetchWithTimeout(`${BASE_URL}/api/practice`, TIMEOUT_MS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course: "AP_WORLD_HISTORY" }),
      });
      if (res1.status === 401 && res2.status === 401) {
        ok("A5. Auth guards", "unauthenticated requests correctly blocked");
      } else {
        fail("A5. Auth guards", `analytics=${res1.status}, practice=${res2.status} (expected 401)`);
      }
    } catch (e) { fail("A5. Auth guards", e.message); }

    // ══════════════════════════════════════════════════════════════════════════
    // Suite B: AI-Dependent Tests (warnings only on AI failures)
    // ══════════════════════════════════════════════════════════════════════════
    section("B. AI-Dependent Tests (AI failure = warning, not error)");

    // B1. AI Tutor
    try {
      const res = await authFetch("/api/ai/tutor", token, cookieName, {
        method: "POST",
        body: JSON.stringify({ message: "What was the Silk Road and why was it important?", course: "AP_WORLD_HISTORY" }),
      });
      if (res.status >= 500 || !res.ok) {
        warn("B1. AI Tutor", `HTTP ${res.status} (AI provider may be down)`);
      } else {
        const data = await res.json();
        if (!data.answer || data.answer.length < 30) { warn("B1. AI Tutor", "answer too short or missing"); }
        else { ok("B1. AI Tutor", `answer=${data.answer.length}ch, followUps=${(data.followUps || []).length}`); }
      }
    } catch (e) { warn("B1. AI Tutor", e.message); }

    // B2. Knowledge Check Generation
    let kcQuestions = null;
    try {
      const res = await authFetch("/api/ai/tutor/knowledge-check", token, cookieName, {
        method: "POST",
        body: JSON.stringify({
          course: "AP_WORLD_HISTORY",
          tutorResponse: "The Silk Road was a network of trade routes connecting China to the Mediterranean. It facilitated the exchange of goods like silk, spices, and precious metals. It also enabled cultural and religious diffusion, spreading Buddhism, Islam, and Christianity across Asia. The routes declined after the fall of the Mongol Empire and the rise of maritime trade in the 15th century.",
          topic: "Silk Road",
          count: 1,
        }),
      });
      if (!res.ok) { warn("B2. Knowledge Check gen", `HTTP ${res.status}`); }
      else {
        const data = await res.json();
        kcQuestions = data.questions;
        if (!Array.isArray(kcQuestions) || kcQuestions.length < 1) {
          warn("B2. Knowledge Check gen", "no questions generated");
          kcQuestions = null;
        } else {
          const q = kcQuestions[0];
          if (!q.question || !q.options || q.options.length < 4 || typeof q.correctIndex !== "number") {
            warn("B2. Knowledge Check gen", "question shape invalid");
            kcQuestions = null;
          } else {
            ok("B2. Knowledge Check gen", `${kcQuestions.length} question(s) generated`);
          }
        }
      }
    } catch (e) { warn("B2. Knowledge Check gen", e.message); }

    // B3. Knowledge Check Submission
    if (kcQuestions) {
      try {
        const res = await authFetch("/api/ai/tutor/knowledge-check?action=submit", token, cookieName, {
          method: "POST",
          body: JSON.stringify({
            action: "submit",
            course: "AP_WORLD_HISTORY",
            conversationId: null,
            topic: "Silk Road",
            questions: kcQuestions,
            answers: kcQuestions.map(q => q.correctIndex),
          }),
        });
        if (!res.ok) { warn("B3. Knowledge Check submit", `HTTP ${res.status}`); }
        else {
          const data = await res.json();
          if (typeof data.score !== "number" || typeof data.total !== "number") {
            warn("B3. Knowledge Check submit", "missing score or total");
          } else {
            ok("B3. Knowledge Check submit", `score=${data.score}/${data.total}`);
          }
        }
      } catch (e) { warn("B3. Knowledge Check submit", e.message); }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Suite C: Data Validation (multi-course + error handling)
    // ══════════════════════════════════════════════════════════════════════════
    section("C. Data Validation");

    // C1. Multi-Course Analytics Probe (with retry for transient CF Workers cold-starts)
    const probeCourses = ["AP_WORLD_HISTORY", "SAT_MATH", "AP_CALCULUS_AB", "AP_BIOLOGY", "ACT_MATH"];
    try {
      const probeResults = await Promise.allSettled(
        probeCourses.map(c =>
          authFetch(`/api/analytics?course=${c}`, token, cookieName)
            .then(r => ({ course: c, status: r.status, ok: r.ok }))
        )
      );
      // Retry any failures once (cold-start tolerance)
      let retried = 0;
      const finalResults = [];
      for (const r of probeResults) {
        if (r.status === "rejected" || (r.status === "fulfilled" && r.value.status >= 500)) {
          const course = r.status === "fulfilled" ? r.value.course : "unknown";
          retried++;
          try {
            const retry = await authFetch(`/api/analytics?course=${course}`, token, cookieName);
            finalResults.push({ course, status: retry.status, ok: retry.ok });
          } catch { finalResults.push({ course, status: 500, ok: false }); }
        } else {
          finalResults.push(r.value);
        }
      }
      const okCount = finalResults.filter(r => r.ok || r.status === 200).length;
      const failCount = finalResults.filter(r => r.status >= 500).length;
      const retryNote = retried > 0 ? `, ${retried} retried` : "";
      if (failCount > 0) {
        const failedCourses = finalResults.filter(r => r.status >= 500).map(r => r.course);
        fail("C1. Multi-course analytics", `${failCount}/${probeCourses.length} failed after retry: ${failedCourses.join(", ")}`);
      } else {
        ok("C1. Multi-course analytics", `${okCount}/${probeCourses.length} courses returned 200${retryNote}`);
      }
    } catch (e) { fail("C1. Multi-course analytics", e.message); }

    // C2. Multi-Course Study Plan Probe (with retry)
    const spCourses = ["AP_WORLD_HISTORY", "SAT_MATH", "CLEP_COLLEGE_ALGEBRA", "ACT_ENGLISH"];
    try {
      const spResults = await Promise.allSettled(
        spCourses.map(c =>
          authFetch(`/api/study-plan?course=${c}`, token, cookieName)
            .then(r => ({ course: c, status: r.status, ok: r.ok }))
        )
      );
      const finalResults = [];
      for (const r of spResults) {
        if (r.status === "rejected" || (r.status === "fulfilled" && r.value.status >= 500)) {
          const course = r.status === "fulfilled" ? r.value.course : "unknown";
          try {
            const retry = await authFetch(`/api/study-plan?course=${course}`, token, cookieName);
            finalResults.push({ course, status: retry.status, ok: retry.ok });
          } catch { finalResults.push({ course, status: 500, ok: false }); }
        } else {
          finalResults.push(r.value);
        }
      }
      const okCount = finalResults.filter(r => r.ok || r.status === 200).length;
      const failCount = finalResults.filter(r => r.status >= 500).length;
      if (failCount > 0) {
        const failedCourses = finalResults.filter(r => r.status >= 500).map(r => r.course);
        fail("C2. Multi-course study plan", `${failCount}/${spCourses.length} failed after retry: ${failedCourses.join(", ")}`);
      } else {
        ok("C2. Multi-course study plan", `${okCount}/${spCourses.length} courses returned 200`);
      }
    } catch (e) { fail("C2. Multi-course study plan", e.message); }

    // C3. Invalid course handling
    try {
      const res = await authFetch("/api/analytics?course=INVALID_FAKE", token, cookieName);
      if (res.status === 400) { ok("C3. Invalid course rejected", "analytics returned 400"); }
      else { fail("C3. Invalid course rejected", `expected 400, got ${res.status}`); }
    } catch (e) { fail("C3. Invalid course rejected", e.message); }

  } finally {
    // ── Cleanup: Delete test user + all data ──────────────────────────────────
    section("Cleanup");
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/api/test/auth`, TIMEOUT_MS, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${CRON_SECRET}` },
        body: JSON.stringify({ action: "cleanup" }),
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`  \uD83E\uDDF9 Test user cleaned up (userId=${(data.userId || "").slice(0, 8)}...)`);
      } else {
        console.warn(`  \u26A0\uFE0F  Cleanup returned HTTP ${res.status}`);
      }
    } catch (e) {
      console.warn(`  \u26A0\uFE0F  Cleanup failed: ${e.message}`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Functional tests: ${passed} passed, ${warned} warnings, ${failed} failed (${elapsed}s)`);

  if (failed > 0) {
    console.error(`\n\u274C ${failed} functional test(s) FAILED \u2014 core features may be broken.`);
    process.exitCode = 1;
  } else if (warned > 0) {
    console.log(`\n\u26A0\uFE0F  All core tests passed with ${warned} AI-related warning(s).`);
  } else {
    console.log(`\n\u2705 All functional tests passed.`);
  }

  // Export results for update-test-plan.js
  const fs = require("fs");
  const os = require("os");
  const outFile = require("path").join(os.tmpdir(), "studentnest_functional_results.json");
  fs.writeFileSync(outFile, JSON.stringify({ passed, warned, failed, results, elapsed }));

  return { passed, warned, failed, results };
}

if (require.main === module) {
  run().catch((e) => {
    console.error("Functional test runner crashed:", e.message);
    process.exit(1);
  });
}

module.exports = { run };
