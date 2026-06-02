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

import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 2026-06-02 — ES module __dirname shim. Quality Process v1 gate added
// path.join(__dirname, ...) which doesn't exist in ES module scope. The
// staging gate caught this before touching prod (as designed).
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "inherit", shell: true, ...opts });
    proc.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`)));
  });
}

(async () => {
  console.log(`\n🚀 Promote to production (studentnest.ai)\n`);

  // 2026-06-02 — Quality Process v1 G5 gate. The promote script refuses
  // to ship if the most recent Release Manifest has any unchecked gate
  // (g1_po, g2_dev, g3_rev, g4_qa, g5_rm still 'pending'). Soft-warn
  // until ENFORCE_QUALITY_GATES=1. See docs/QUALITY_PROCESS.md.
  {
    const enforce = process.env.ENFORCE_QUALITY_GATES === "1";
    const manifestsDir = path.join(__dirname, "..", "data", "release-manifests");
    let recentManifest = null;
    try {
      const files = fs.readdirSync(manifestsDir).filter((f) => f.endsWith(".md") && !f.startsWith("."));
      if (files.length > 0) {
        const stats = files.map((f) => ({ f, mtime: fs.statSync(path.join(manifestsDir, f)).mtimeMs }));
        stats.sort((a, b) => b.mtime - a.mtime);
        recentManifest = stats[0];
      }
    } catch { /* dir may not exist */ }

    if (!recentManifest) {
      const msg = `⚠ G5 Quality Process: no release manifest in data/release-manifests/. Create from docs/RELEASE_MANIFEST_TEMPLATE.md before promote.`;
      if (enforce) { console.error(`❌ ${msg}`); process.exit(1); }
      else { console.log(msg); }
    } else {
      const ageH = (Date.now() - recentManifest.mtime) / (1000 * 60 * 60);
      const content = fs.readFileSync(path.join(manifestsDir, recentManifest.f), "utf8");
      const pendingGates = [];
      for (const g of ["g1_po", "g2_dev", "g3_rev", "g4_qa", "g5_rm"]) {
        const re = new RegExp(`^${g}:\\s*pending`, "m");
        if (re.test(content)) pendingGates.push(g);
      }
      if (ageH > 12) {
        const msg = `⚠ G5 Quality Process: most recent manifest (${recentManifest.f}) is ${ageH.toFixed(1)}h old; expected a fresh one for this promote.`;
        if (enforce) { console.error(`❌ ${msg}`); process.exit(1); }
        else { console.log(msg); }
      }
      if (pendingGates.length > 0) {
        const msg = `⚠ G5 Quality Process: manifest ${recentManifest.f} still has pending gate(s): ${pendingGates.join(", ")}.`;
        if (enforce) { console.error(`❌ ${msg}`); process.exit(1); }
        else { console.log(msg); }
      } else {
        console.log(`  ✅ G5 Quality Process: manifest ${recentManifest.f} has all gates approved.`);
      }
    }
  }

  // Re-run pre-release-check + unit tests as the final guard before
  // touching prod. Cheap, catches "I edited a file after the staging
  // build" scenarios.
  await run("node", ["scripts/pre-release-check.js"]);
  await run("npx", ["vitest", "run"]);

  // Beta 9 (2026-04-29) — speed fix: reuse staging artifact when commit
  // is unchanged + workdir is clean. Saves 5-7 min of redundant build.
  // Safety: rebuild if marker missing OR commit mismatch OR workdir
  // dirty (so any post-staging edits trigger fresh build).
  const markerPath = path.join(".cf-deploy", ".staging-marker.json");
  let reuseArtifact = false;
  // Beta 9.6 (Task #49) — only block reuse when BUILD-INPUT files
  // are dirty. The original `git status --porcelain` check counted
  // ANY file (data fixtures, deploy logs, scratch scripts) and made
  // the optimization useless in practice. Real build inputs are:
  // src/, prisma/, package*.json, next.config.mjs, public/, and the
  // two build-time patch scripts. Anything else doesn't affect the
  // .cf-deploy/ artifact.
  const BUILD_PATHS = [
    "src",
    "prisma",
    "package.json",
    "package-lock.json",
    "next.config.mjs",
    "public",
    "scripts/patch-prisma-wasm.js",
    "scripts/prepare-cf-deploy.js",
  ];
  function buildInputsDirty() {
    try {
      const diff = execSync(`git diff HEAD -- ${BUILD_PATHS.join(" ")}`, { encoding: "utf8" }).trim();
      if (diff) return true;
      const untracked = execSync(
        `git ls-files --others --exclude-standard -- ${BUILD_PATHS.join(" ")}`,
        { encoding: "utf8" },
      ).trim();
      return !!untracked;
    } catch {
      // If git fails for any reason, fail-safe: treat as dirty (rebuild).
      return true;
    }
  }
  try {
    if (fs.existsSync(markerPath)) {
      const marker = JSON.parse(fs.readFileSync(markerPath, "utf8"));
      const headCommit = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
      const buildDirty = buildInputsDirty();
      if (marker.commit === headCommit && !buildDirty) {
        reuseArtifact = true;
        console.log(`⚡ Reusing staging-validated artifact (commit ${headCommit.slice(0, 8)}) — skipping rebuild.`);
      } else {
        console.log(`🔄 Rebuilding (marker=${marker.commit?.slice(0, 8)}, head=${headCommit.slice(0, 8)}, buildInputsDirty=${buildDirty}).`);
      }
    }
  } catch (e) {
    console.log(`🔄 Rebuilding (marker check failed: ${e.message}).`);
  }

  if (!reuseArtifact) {
    await run("npm", ["run", "pages:build"]);
  }

  // Upload to production branch.
  // Beta 9.6 — explicit ASCII --commit-message override to bypass CF's
  // UTF-8 commit-message validator (chokes on en-dashes). No spaces —
  // shell with shell:true splits even `--flag=value` at spaces.
  const promoteMsg = `prod-promote-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}`;
  await run(
    "npx",
    ["wrangler", "pages", "deploy", ".cf-deploy",
     "--project-name=studentnest",
     "--branch=main",
     "--commit-dirty=true",
     `--commit-message=${promoteMsg}`],
  );

  // Quick smoke against prod — catches CF Pages global propagation
  // hiccups + cold-start specifics. Full Playwright already passed in
  // the staging gate (CF Preview env now configured to match prod), so
  // we don't re-run the heavy suite here — that would just verify CF
  // Pages routing, which smoke covers.
  console.log(`\n🔍 Post-promote smoke against studentnest.ai…\n`);
  await run("node", ["scripts/smoke-tests.js"]);

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
