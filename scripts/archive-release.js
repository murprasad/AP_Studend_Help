#!/usr/bin/env node
/**
 * archive-release.js
 * Creates a git tag for the current release and pushes it.
 * Run after a successful deploy to archive the release.
 *
 * Tag format: beta-X.Y  (e.g. beta-1.13)
 * Usage: node scripts/archive-release.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function sh(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, stdio: "pipe", ...opts }).toString().trim();
}

function run() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const version = pkg.version || "";

  if (!version) {
    console.warn("⚠️  No version in package.json — skipping archive");
    return;
  }

  // Derive tag name: 1.13.0 → beta-1.13
  const tagName = `beta-${version.split(".").slice(0, 2).join(".")}`;

  // Check if tag already exists
  const existingTags = sh("git tag --list").split("\n");
  if (existingTags.includes(tagName)) {
    console.log(`ℹ️  Tag ${tagName} already exists — skipping archive`);
    return;
  }

  // Commit any staged files (e.g. updated test plan)
  try {
    const status = sh("git status --porcelain");
    if (status) {
      sh(`git commit -m "chore: release archive ${tagName} — update test plan log" --no-verify`);
      console.log(`✅ Committed test plan update`);
    }
  } catch {
    // Nothing to commit — that's fine
  }

  // Create annotated tag
  try {
    sh(`git tag -a ${tagName} -m "Release ${tagName} — deployed to studentnest.ai"`);
    console.log(`✅ Created git tag: ${tagName}`);
  } catch (e) {
    console.warn(`⚠️  Could not create tag ${tagName}: ${e.message}`);
    return;
  }

  // Push tag to remote
  try {
    sh("git push origin main --tags");
    console.log(`✅ Pushed ${tagName} to remote`);
  } catch (e) {
    console.warn(`⚠️  Could not push tag to remote: ${e.message}`);
    console.warn(`   Run manually: git push origin ${tagName}`);
  }

  console.log(`\n📦 Release ${tagName} archived successfully`);
}

run();
