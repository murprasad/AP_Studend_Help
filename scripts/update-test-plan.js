#!/usr/bin/env node
/**
 * update-test-plan.js
 * Appends a release log entry to qa_test_plan_practice_comprehensive.md.
 * Captures: version, date, git commits since last tag, smoke test results.
 *
 * Run automatically as part of pages:deploy (after smoke tests).
 * Usage: node scripts/update-test-plan.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = path.resolve(__dirname, "..");
const TEST_PLAN = path.join(ROOT, "qa_test_plan_practice_comprehensive.md");

function sh(cmd, fallback = "") {
  try {
    return execSync(cmd, { cwd: ROOT, stdio: "pipe" }).toString().trim();
  } catch {
    return fallback;
  }
}

function run() {
  // ── Get release metadata ──────────────────────────────────────────────────
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const version = pkg.version || "unknown";
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toUTCString();

  // ── Get commits since last tag ────────────────────────────────────────────
  const lastTag = sh("git describe --tags --abbrev=0 2>/dev/null", "");
  const commitRange = lastTag ? `${lastTag}..HEAD` : "HEAD~10..HEAD";
  const rawLog = sh(`git log ${commitRange} --pretty=format:"- %s" --no-merges`);
  const commits = rawLog || "- (no commits since last tag)";

  // ── Read smoke test results ───────────────────────────────────────────────
  let smokeSection = "Smoke tests: not run (run `node scripts/smoke-tests.js` separately)";
  try {
    const smokeFile = path.join(os.tmpdir(), "studentnest_smoke_results.json");
    if (fs.existsSync(smokeFile)) {
      const r = JSON.parse(fs.readFileSync(smokeFile, "utf8"));
      const lines = (r.results || []).map((t) => {
        const icon = t.status === "pass" ? "✅" : t.status === "warn" ? "⚠️" : "❌";
        return `  ${icon} ${t.label}${t.detail ? " — " + t.detail : ""}`;
      });
      smokeSection = `Smoke tests: ${r.passed} passed, ${r.warned} warnings, ${r.failed} failed\n${lines.join("\n")}`;
      // Clean up temp file
      fs.unlinkSync(smokeFile);
    }
  } catch {
    // Smoke results unavailable — continue
  }

  // ── Build the new log entry ───────────────────────────────────────────────
  const entry = `
---

## Release Log — v${version} (${dateStr})

**Deployed:** ${timeStr}
**Version:** ${version}

### Changes in this release
${commits}

### Automated smoke tests
\`\`\`
${smokeSection}
\`\`\`

### Manual P0 checklist (fill in before marking release complete)
- [ ] AP_WORLD_HISTORY MCQ session starts (ALL units, ALL difficulty)
- [ ] SAT_MATH MCQ session starts
- [ ] ACT_MATH MCQ session starts — verify 5 answer choices
- [ ] AP_PHYSICS_1 FRQ session starts within 30s
- [ ] Wrong MCQ answer → knowledge-check mini-quiz appears (1 question)
- [ ] Correct MCQ answer → "Go deeper with Sage →" button visible
- [ ] Ask Sage from practice → "Continue Practice" banner visible on Sage page
- [ ] "Continue Practice" → resumes exact question position
- [ ] Session completes → summary screen with accuracy + XP

`;

  // ── Append to test plan ───────────────────────────────────────────────────
  if (!fs.existsSync(TEST_PLAN)) {
    console.warn(`⚠️  Test plan not found at ${TEST_PLAN} — skipping update`);
    return;
  }

  fs.appendFileSync(TEST_PLAN, entry, "utf8");
  console.log(`✅ Test plan updated — appended release log for v${version}`);

  // ── Stage the updated test plan ───────────────────────────────────────────
  try {
    execSync(`git add "${TEST_PLAN}"`, { cwd: ROOT, stdio: "pipe" });
    console.log(`✅ Test plan staged for commit`);
  } catch {
    // Non-fatal — test plan is updated on disk even if staging fails
  }
}

run();
