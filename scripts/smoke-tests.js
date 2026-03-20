#!/usr/bin/env node
/**
 * smoke-tests.js
 * Automated smoke tests against the live production site.
 * Run after deploy to verify key public endpoints are healthy.
 *
 * Usage: node scripts/smoke-tests.js [--base-url https://studentnest.ai]
 * Exits 0 on pass (or partial pass with warnings), 1 on critical failure.
 *
 * Tests:
 *  1. Marketing pages (/, /pricing, /about, /login) → 200
 *  2. API: /api/ai/status → { status: "ok" }
 *  3. API: /api/feature-flags → 200 + has premiumRestrictionEnabled field
 *  4. API: /api/ai/tutor/knowledge-check (no auth) → 401 (not 500)
 *  5. API: /api/practice (no auth) → 401 (not 500)
 */

const BASE_URL = (() => {
  const idx = process.argv.indexOf("--base-url");
  return idx !== -1 ? process.argv[idx + 1] : "https://studentnest.ai";
})();

const TIMEOUT_MS = 15000;

let passed = 0;
let warned = 0;
let failed = 0;
const results = [];

function ok(label, detail = "")   { console.log(`  ✅ ${label}${detail ? " — " + detail : ""}`); passed++; results.push({ label, status: "pass" }); }
function warn(label, detail = "") { console.warn(`  ⚠️  ${label}${detail ? " — " + detail : ""}`); warned++; results.push({ label, status: "warn", detail }); }
function fail(label, detail = "") { console.error(`  ❌ ${label}${detail ? " — " + detail : ""}`); failed++; results.push({ label, status: "fail", detail }); }
function section(title)           { console.log(`\n── ${title} ──`); }

async function get(path, opts = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: "follow",
    ...opts,
  });
  return res;
}

async function run() {
  console.log(`\n🔍 Smoke tests against ${BASE_URL}\n`);

  // ── 1. Marketing pages ──────────────────────────────────────────────────────
  section("1. Marketing pages");
  for (const page of ["/", "/pricing", "/about", "/login", "/register"]) {
    try {
      const res = await get(page);
      if (res.ok) {
        ok(`GET ${page}`, `HTTP ${res.status}`);
      } else {
        fail(`GET ${page}`, `HTTP ${res.status}`);
      }
    } catch (e) {
      fail(`GET ${page}`, e.message);
    }
  }

  // ── 2. AI status ─────────────────────────────────────────────────────────────
  section("2. AI provider status");
  try {
    const res = await get("/api/ai/status");
    if (!res.ok) {
      warn("GET /api/ai/status", `HTTP ${res.status}`);
    } else {
      const data = await res.json();
      if (data.status === "ok") {
        ok("GET /api/ai/status", `provider: ${data.activeProvider || data.provider || "unknown"}`);
      } else {
        warn("GET /api/ai/status", `status=${data.status} — AI may be degraded`);
      }
    }
  } catch (e) {
    fail("GET /api/ai/status", e.message);
  }

  // ── 3. Feature flags ─────────────────────────────────────────────────────────
  section("3. Feature flags API");
  try {
    const res = await get("/api/feature-flags");
    if (!res.ok) {
      fail("GET /api/feature-flags", `HTTP ${res.status}`);
    } else {
      const data = await res.json();
      if (typeof data.premiumRestrictionEnabled === "boolean") {
        ok("GET /api/feature-flags", `premiumRestriction=${data.premiumRestrictionEnabled}`);
      } else {
        warn("GET /api/feature-flags", "response missing premiumRestrictionEnabled field");
      }
    }
  } catch (e) {
    fail("GET /api/feature-flags", e.message);
  }

  // ── 4. Auth-guarded API routes return 401 not 500 ────────────────────────────
  section("4. Auth guards (should return 401, not 500)");
  const authGuardedRoutes = [
    ["POST", "/api/practice"],
    ["POST", "/api/ai/tutor/knowledge-check"],
    ["GET",  "/api/analytics"],
    ["GET",  "/api/user"],
  ];
  for (const [method, path] of authGuardedRoutes) {
    try {
      const res = await get(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "POST" ? JSON.stringify({ course: "AP_WORLD_HISTORY" }) : undefined,
      });
      if (res.status === 401) {
        ok(`${method} ${path}`, "401 Unauthorized (auth guard working)");
      } else if (res.status >= 500) {
        fail(`${method} ${path}`, `HTTP ${res.status} — server error on unauthenticated request`);
      } else {
        warn(`${method} ${path}`, `HTTP ${res.status} (expected 401)`);
      }
    } catch (e) {
      fail(`${method} ${path}`, e.message);
    }
  }

  // ── 5. Knowledge-check with bad input returns 4xx not 500 ────────────────────
  section("5. Input validation (bad input → 4xx, not 500)");
  try {
    const res = await get("/api/ai/tutor/knowledge-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course: "INVALID_COURSE", tutorResponse: "x" }),
    });
    if (res.status >= 500) {
      fail("POST /api/ai/tutor/knowledge-check (bad input)", `HTTP ${res.status} — should be 4xx`);
    } else {
      ok("POST /api/ai/tutor/knowledge-check (bad input)", `HTTP ${res.status} (correct 4xx)`);
    }
  } catch (e) {
    fail("POST /api/ai/tutor/knowledge-check (bad input)", e.message);
  }

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Smoke tests: ${passed} passed, ${warned} warnings, ${failed} failed`);

  if (failed > 0) {
    console.error(`\n❌ ${failed} smoke test(s) FAILED — review above before treating deploy as successful.`);
    process.exitCode = 1;
  } else if (warned > 0) {
    console.log(`\n⚠️  All critical tests passed with ${warned} warning(s).`);
  } else {
    console.log(`\n✅ All smoke tests passed.`);
  }

  // Export results for update-test-plan.js
  process.env.SMOKE_RESULTS = JSON.stringify(results);
  return { passed, warned, failed, results };
}

// Allow importing as module or running directly
if (require.main === module) {
  run().then((r) => {
    // Write results to a temp file so other scripts can read them
    const fs = require("fs");
    const os = require("os");
    const outFile = require("path").join(os.tmpdir(), "studentnest_smoke_results.json");
    fs.writeFileSync(outFile, JSON.stringify(r));
  }).catch((e) => {
    console.error("Smoke test runner crashed:", e.message);
    process.exit(1);
  });
}

module.exports = { run };
