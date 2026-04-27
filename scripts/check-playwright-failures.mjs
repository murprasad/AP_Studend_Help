#!/usr/bin/env node
/**
 * Triage Playwright failures against the known-flaky allowlist.
 *
 * Reads the JSON-reporter output from `npx playwright test --reporter=json`
 * (written to test-results.json by playwright.config.ts), then:
 *
 *   - All failures are listed in the gate output
 *   - Failures matching e2e/.known-flaky-on-staging.json are flagged as
 *     "expected" (chronic cold-start cascade) — they do NOT block the gate
 *   - Any failure NOT on the allowlist is treated as a NEW regression and
 *     fails the gate
 *
 * Why: the staging gate's value is catching NEW regressions, not chronic
 * cold-start saturation that always fails on a freshly-uploaded preview.
 * Without an allowlist the gate never goes green and prod-affecting
 * regressions go un-caught (they're noise in the pile).
 *
 * Usage:
 *   node scripts/check-playwright-failures.mjs <results.json>
 *
 * Exit codes:
 *   0 — all failures are on the allowlist (or no failures)
 *   1 — at least one failure is NOT on the allowlist (new regression)
 *   2 — couldn't parse results JSON (shouldn't happen)
 */

import { readFile } from "node:fs/promises";

const resultsPath = process.argv[2] ?? "test-results.json";
const allowlistPath = "e2e/.known-flaky-on-staging.json";

let results, allowlist;
try {
  results = JSON.parse(await readFile(resultsPath, "utf8"));
} catch (e) {
  console.error(`❌ Couldn't read ${resultsPath}: ${e.message}`);
  process.exit(2);
}
try {
  allowlist = JSON.parse(await readFile(allowlistPath, "utf8"));
} catch (e) {
  console.error(`❌ Couldn't read ${allowlistPath}: ${e.message}`);
  process.exit(2);
}

const knownFlaky = allowlist.knownFlaky ?? [];

// Walk the suite tree and collect every failed test.
const failures = [];
function walkSuite(suite) {
  for (const sub of suite.suites ?? []) walkSuite(sub);
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const status = test.status;
      const lastResult = test.results?.[test.results.length - 1];
      if (lastResult?.status === "failed" || lastResult?.status === "timedOut" || (status === "expected" && lastResult?.status !== "passed" && lastResult?.status !== "skipped")) {
        const file = (spec.file ?? "").replace(/\\/g, "/").split("/").pop();
        // Strip ".spec.ts" suffix for matching, since allowlist uses base name.
        const fileBase = (file ?? "").replace(/\.spec\.ts$/, "");
        const id = `${file}:${spec.line ?? "?"}:${spec.column ?? "?"} › ${spec.title}`;
        failures.push({ id, status: lastResult?.status ?? "failed", title: spec.title, file, fileBase });
      }
    }
  }
}
for (const top of results.suites ?? []) walkSuite(top);

if (failures.length === 0) {
  console.log(`✅ Playwright: 0 failures.`);
  process.exit(0);
}

const expected = [];
const newFailures = [];
for (const f of failures) {
  // Match policy: allowlist entry = { file, title }. Failure matches if
  // its file basename equals the entry's file AND the failure title
  // contains the entry's title substring. This survives Playwright's
  // describe-chain quirks (some specs have describe(), others have the
  // file name silently inserted as a describe — file+title is stable).
  const matched = knownFlaky.find((known) => {
    if (typeof known === "string") return f.id.includes(known); // legacy string entries
    return f.fileBase === known.file && f.title.includes(known.title);
  });
  if (matched) expected.push(f);
  else newFailures.push(f);
}

console.log(`\n📋 Playwright triage — ${failures.length} failures`);
console.log(`    ${expected.length} on known-flaky allowlist (chronic cold-start)`);
console.log(`    ${newFailures.length} NEW regressions\n`);

if (expected.length > 0) {
  console.log(`Known-flaky (allowed):`);
  for (const f of expected) console.log(`   ⚠️  ${f.id}`);
}

if (newFailures.length > 0) {
  console.log(`\n❌ NEW regressions — gate FAILS:`);
  for (const f of newFailures) console.log(`   ✘  ${f.id}`);
  console.log(`\nIf one of these is also chronic, add it to ${allowlistPath}.`);
  process.exit(1);
}

console.log(`\n✅ All failures are known-flaky. Gate passes.`);
process.exit(0);
