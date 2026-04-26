#!/usr/bin/env node
/**
 * Promote a staging-tested build to production.
 *
 * Re-builds from current HEAD and uploads to the production branch
 * (main → studentnest.ai). Only runs the smoke suite against prod
 * after — the heavy E2E suite already passed in staging gate, no need
 * to re-run it (would just verify CF Pages routing, which smoke covers).
 *
 * Caller is expected to have run npm run pages:deploy:staging FIRST
 * and seen "STAGING GATE PASSED". This script does NOT verify that —
 * it trusts the caller. (We could enforce by tagging the staging
 * deploy with a marker, but adds complexity for marginal benefit.)
 *
 * Usage:
 *   npm run pages:promote
 */

import { spawn } from "node:child_process";

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "inherit", shell: true, ...opts });
    proc.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`)));
  });
}

(async () => {
  console.log(`\n🚀 Promote to production (studentnest.ai)\n`);

  // Re-run pre-release-check + unit tests as the final guard before
  // touching prod. Cheap, catches "I edited a file after the staging
  // build" scenarios.
  await run("node", ["scripts/pre-release-check.js"]);
  await run("npx", ["vitest", "run"]);

  // Build fresh (don't reuse staging .cf-deploy in case it had env-vary
  // staging-only artifacts).
  await run("npm", ["run", "pages:build"]);

  // Upload to production branch.
  await run(
    "npx",
    ["wrangler", "pages", "deploy", ".cf-deploy",
     "--project-name=studentnest",
     "--branch=main",
     "--commit-dirty=true"],
  );

  // Quick smoke against prod — catches CF Pages global propagation
  // hiccups + cold-start specifics.
  console.log(`\n🔍 Post-promote smoke against studentnest.ai…\n`);
  await run("node", ["scripts/smoke-tests.js"]);

  // Authed Playwright suite against prod. Staging gate skipped these
  // because CF Pages Preview env doesn't have a matching NEXTAUTH_URL.
  // Production has the real env, so authed tests run cleanly here.
  // Public tests already passed in the staging gate.
  console.log(`\n🎭 Authed Playwright (chromium-authed) against prod…\n`);
  await run("npx", ["playwright", "test", "--project=chromium-authed", "--reporter=list"]);

  console.log(`\n────────────────────────────────────────────────────────────`);
  console.log(`✅ PROMOTED TO PRODUCTION.`);
  console.log(`   Live: https://studentnest.ai`);
  console.log(`────────────────────────────────────────────────────────────\n`);

  // Notify success.
  await run("node", ["scripts/send-deploy-email.js", "--status=success"]);
})().catch(async (e) => {
  console.error(`\n❌ Promote FAILED: ${e.message}\n`);
  await run("node", ["scripts/send-deploy-email.js", "--status=failed"]).catch(() => {});
  process.exit(1);
});
