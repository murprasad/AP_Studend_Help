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

import { spawn } from "node:child_process";

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
  const wranglerOut = await run(
    "npx",
    ["wrangler", "pages", "deploy", ".cf-deploy",
     "--project-name=studentnest",
     `--branch=${STAGING_BRANCH}`,
     "--commit-dirty=true"],
    { captureStdout: true },
  );

  // 4. Extract the preview URL from wrangler output.
  // wrangler prints: "✨ Deployment complete! Take a peek over at https://<hash>.studentnest.pages.dev"
  // We use the per-commit hash URL (immutable + always points at THIS deploy).
  const urlMatch = wranglerOut.match(/https:\/\/[a-f0-9]+\.studentnest\.pages\.dev/);
  if (!urlMatch) {
    console.error("❌ Could not parse preview URL from wrangler output. Aborting.");
    process.exit(1);
  }
  const stagingUrl = urlMatch[0];
  console.log(`\n✓ Staged at: ${stagingUrl}\n`);

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

  console.log(`\n🎭 Playwright E2E against staging (full suite)…\n`);
  await run("npx", ["playwright", "test", "--reporter=list"], { env });

  // 6. Green light. Print promote command but do NOT auto-promote.
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
