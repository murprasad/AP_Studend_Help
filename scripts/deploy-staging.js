#!/usr/bin/env node
/**
 * Staging deploy + test gate.
 *
 * Uploads the current build to a CF Pages preview URL (NOT production)
 * and runs the full Playwright suite against it. Production is never
 * touched. If tests pass, prints the promote command.
 *
 * Why: until 2026-04-26 our pages:deploy uploaded straight to
 * studentnest.ai before tests ran — broken commits were briefly live to
 * real students. The staging gate catches them on a preview URL first.
 *
 * The CF Pages preview URL is hash-based (e.g. 8cb7111b.studentnest.pages.dev),
 * captured from wrangler stdout and exported as E2E_BASE_URL so
 * Playwright targets the staged copy not prod.
 *
 * Usage:
 *   npm run pages:deploy:staging          # deploy + run all tests
 *   STAGING_BRANCH=phase-b npm run pages:deploy:staging   # custom alias
 */

import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: opts.captureStdout ? ["inherit", "pipe", "inherit"] : "inherit", shell: true, ...opts });
    let captured = "";
    if (opts.captureStdout) {
      proc.stdout.on("data", (chunk) => {
        const text = chunk.toString();
        process.stdout.write(text);
        captured += text;
      });
    }
    proc.on("exit", (code) => {
      if (code === 0) resolve(captured);
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
  });
}

const STAGING_BRANCH = process.env.STAGING_BRANCH || "staging";

(async () => {
  console.log(`\n🧪 Staging deploy gate — branch alias: "${STAGING_BRANCH}"\n`);

  // 1. Pre-release check + unit tests (same as prod deploy).
  await run("node", ["scripts/pre-release-check.js"]);
  await run("npx", ["vitest", "run"]);

  // 2. Build.
  await run("npm", ["run", "pages:build"]);

  // 3. Upload to staging branch alias (NOT production).
  // CF Pages: --branch=<not-prod> creates a preview URL.
  //
  // Beta 9.6 (2026-04-30): pass an explicit ASCII --commit-message.
  // Without this, wrangler reads `git log -1` for the message, and
  // recent commits with en-dashes (—) fail CF's UTF-8 validation
  // ("Invalid commit message" code 8000111). The override sidesteps
  // git-log entirely. NO SPACES — shell with shell:true splits at
  // spaces even on `--flag=value` form. Use only ASCII + hyphens.
  const stagingMsg = `staging-deploy-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}`;
  const wranglerOut = await run(
    "npx",
    ["wrangler", "pages", "deploy", ".cf-deploy",
     "--project-name=studentnest",
     `--branch=${STAGING_BRANCH}`,
     "--commit-dirty=true",
     `--commit-message=${stagingMsg}`],
    { captureStdout: true },
  );

  // 4. Use the stable branch alias URL (https://staging.studentnest.pages.dev)
  // rather than the per-commit hash URL. Reason: NEXTAUTH_URL in CF Pages
  // Preview env is set to the stable alias, so NextAuth callbacks
  // (login, oauth) resolve correctly. The per-commit URL would cause
  // NextAuth to redirect to the alias mid-flow, breaking auth.setup.
  // The per-commit URL still works for direct page hits (no auth involved)
  // but the alias is the test target.
  const stagingUrl = `https://${STAGING_BRANCH}.studentnest.pages.dev`;

  // Verify wrangler upload at least succeeded.
  if (!wranglerOut.includes("Deployment complete")) {
    console.error("❌ Wrangler upload didn't report 'Deployment complete'. Aborting.");
    process.exit(1);
  }
  console.log(`\n✓ Staged at: ${stagingUrl} (branch alias, NEXTAUTH-stable)\n`);

  // CF Pages global propagation takes ~5-15s for new deploys to be live
  // at the branch alias. Brief wait so smoke tests don't hit stale cache.
  console.log(`  ⏳ Waiting 15s for CF Pages global propagation…`);
  await new Promise((r) => setTimeout(r, 15_000));

  // 5. Run smoke + functional + Playwright against the staging URL.
  // Each subprocess gets E2E_BASE_URL pointing at the preview, so prod
  // is never hit during the gate.
  const env = { ...process.env, E2E_BASE_URL: stagingUrl };

  console.log(`\n🔍 Smoke tests against staging…\n`);
  await run("node", ["scripts/smoke-tests.js", "--base-url", stagingUrl], { env });

  console.log(`\n⚙️  Functional tests against staging…\n`);
  await run("node", ["scripts/functional-tests.js"], { env });

  console.log(`\n🔗 Integration tests against staging…\n`);
  await run("node", ["scripts/integration-tests.js"], { env });

  // Full Playwright suite against staging (re-enabled 2026-04-26 after
  // CF Pages Preview env configured to match prod — NEXTAUTH_URL,
  // NEXTAUTH_SECRET, DATABASE_URL, CRON_SECRET, etc. all set in Preview).
  // This is the gate's main value: regressions caught BEFORE prod.
  //
  // We use BOTH list AND json reporters so humans can read live output and
  // the triage script can parse structured results. New regressions block
  // the gate; chronic cold-start failures (allowlisted in
  // e2e/.known-flaky-on-staging.json) are reported but do NOT block.
  // Without the allowlist the gate never went green and real regressions
  // hid in the noise (5+ deploys in a row failed on the same chronic 21).
  console.log(`\n🎭 Playwright E2E (full suite) against staging…\n`);
  let playwrightExitCode = 0;
  try {
    // playwright.config.ts always writes test-results.json + list reporter.
    await run("npx", ["playwright", "test"], { env });
  } catch (e) {
    // Capture but don't throw — triage script decides if failures are
    // allowlisted or new. Throw only if triage finds NEW regressions.
    playwrightExitCode = 1;
  }
  console.log(`\n🔬 Triaging Playwright failures vs allowlist…\n`);
  await run("node", ["scripts/check-playwright-failures.mjs", "test-results.json"]);
  if (playwrightExitCode !== 0) {
    console.log(`(Playwright reported failures but all were on the chronic-flaky allowlist; gate continues.)\n`);
  }

  // 6. Green light. Print promote command but do NOT auto-promote.
  // Beta 9 (2026-04-29) — write a marker so promote can skip rebuild
  // when commit + workdir state match. Saves 5-7 min per release.
  try {
    const headCommit = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
    const isClean = execSync("git status --porcelain", { encoding: "utf8" }).trim() === "";
    fs.writeFileSync(
      path.join(".cf-deploy", ".staging-marker.json"),
      JSON.stringify({
        commit: headCommit,
        gitClean: isClean,
        stagedAt: new Date().toISOString(),
        stagingUrl,
      }, null, 2),
    );
    console.log(`📌 Staging marker written (.cf-deploy/.staging-marker.json) — promote can skip rebuild.`);
  } catch (e) {
    console.warn(`⚠️  Could not write staging marker: ${e.message} (promote will rebuild — non-fatal)`);
  }

  console.log(`\n────────────────────────────────────────────────────────────`);
  console.log(`✅ STAGING GATE PASSED.`);
  console.log(`   Preview URL: ${stagingUrl}`);
  console.log(``);
  console.log(`To promote to production (studentnest.ai):`);
  console.log(`   npm run pages:promote`);
  console.log(`────────────────────────────────────────────────────────────\n`);
})().catch((e) => {
  console.error(`\n❌ Staging gate FAILED: ${e.message}`);
  console.error(`   Production was NOT updated. Fix and re-run.\n`);
  process.exit(1);
});
