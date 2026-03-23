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
  let smokeSection = "Smoke tests: not run";
  try {
    const smokeFile = path.join(os.tmpdir(), "studentnest_smoke_results.json");
    if (fs.existsSync(smokeFile)) {
      const r = JSON.parse(fs.readFileSync(smokeFile, "utf8"));
      const lines = (r.results || []).map((t) => {
        const icon = t.status === "pass" ? "✅" : t.status === "warn" ? "⚠️" : "❌";
        return `  ${icon} ${t.label}${t.detail ? " — " + t.detail : ""}`;
      });
      smokeSection = `Smoke tests: ${r.passed} passed, ${r.warned} warnings, ${r.failed} failed\n${lines.join("\n")}`;
      fs.unlinkSync(smokeFile);
    }
  } catch { /* unavailable */ }

  // ── Read integration test results ─────────────────────────────────────────
  let integrationSection = "Integration tests: not run (CRON_SECRET not set or tests skipped)";
  try {
    const intFile = path.join(os.tmpdir(), "studentnest_integration_results.json");
    if (fs.existsSync(intFile)) {
      const r = JSON.parse(fs.readFileSync(intFile, "utf8"));
      if (r.skipped) {
        integrationSection = "Integration tests: skipped (CRON_SECRET not configured)";
      } else {
        const summary = r.summary
          ? `Total questions: ${r.summary.totalApprovedQuestions} | Courses: ${r.summary.courses?.green} green, ${r.summary.courses?.yellow} yellow, ${r.summary.courses?.red} red`
          : "";
        const lines = (r.results || []).map((t) => {
          const icon = t.status === "pass" ? "✅" : t.status === "warn" ? "⚠️" : "❌";
          return `  ${icon} ${t.label}${t.detail ? " — " + t.detail : ""}`;
        });
        integrationSection = `Integration tests: ${r.passed} passed, ${r.warned} warnings, ${r.failed} failed\n${summary ? "  " + summary + "\n" : ""}${lines.join("\n")}`;
      }
      fs.unlinkSync(intFile);
    }
  } catch { /* unavailable */ }

  // ── Read functional test results ──────────────────────────────────────────
  let functionalSection = "Functional tests: not run (CRON_SECRET not set or tests skipped)";
  try {
    const funcFile = path.join(os.tmpdir(), "studentnest_functional_results.json");
    if (fs.existsSync(funcFile)) {
      const r = JSON.parse(fs.readFileSync(funcFile, "utf8"));
      if (r.skipped) {
        functionalSection = "Functional tests: skipped (CRON_SECRET not configured)";
      } else {
        const lines = (r.results || []).map((t) => {
          const icon = t.status === "pass" ? "\u2705" : t.status === "warn" ? "\u26A0\uFE0F" : "\u274C";
          return `  ${icon} ${t.label}${t.detail ? " \u2014 " + t.detail : ""}`;
        });
        functionalSection = `Functional tests: ${r.passed} passed, ${r.warned} warnings, ${r.failed} failed (${r.elapsed || "?"}s)\n${lines.join("\n")}`;
      }
      fs.unlinkSync(funcFile);
    }
  } catch { /* unavailable */ }

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

### Functional tests (authenticated regression suite)
\`\`\`
${functionalSection}
\`\`\`

### Integration tests (practice coverage — all 50 courses)
\`\`\`
${integrationSection}
\`\`\`

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
- [ ] AP_WORLD_HISTORY MCQ — ALL units, ALL difficulty → session starts, questions load
- [ ] AP_US_HISTORY MCQ — session starts
- [ ] AP_COMPUTER_SCIENCE_PRINCIPLES MCQ — session starts
- [ ] AP_PHYSICS_1 MCQ + FRQ — both session types start within 30s
- [ ] AP_CALCULUS_AB MCQ — session starts
- [ ] AP_STATISTICS MCQ — session starts
- [ ] AP_CHEMISTRY MCQ — session starts
- [ ] AP_BIOLOGY MCQ — session starts
- [ ] AP_PSYCHOLOGY MCQ — session starts
- [ ] SAT_MATH MCQ — session starts
- [ ] SAT_READING_WRITING MCQ — session starts
- [ ] ACT_MATH MCQ — session starts, verify 5 answer choices (A-E not A-D)
- [ ] ACT_ENGLISH MCQ — session starts
- [ ] ACT_SCIENCE MCQ — session starts
- [ ] ACT_READING MCQ — session starts

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at \`/register?track=clep\` → DB \`User.track = "clep"\`
- [ ] Register at \`/register?track=ap\` → DB \`User.track = "ap"\`
- [ ] Register (no param) → DB \`User.track = "ap"\` (default)
- [ ] AP user: POST \`/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }\` → 403
- [ ] AP user: POST \`/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }\` → 403
- [ ] CLEP user: POST \`/api/practice { course: "AP_WORLD_HISTORY" }\` → 403
- [ ] CLEP user: POST \`/api/diagnostic { course: "AP_US_HISTORY" }\` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] \`/api/user\` response includes \`user.track\` field
- [ ] Session JWT includes \`track\` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

**Student experience:**
- [ ] Wrong MCQ answer → knowledge-check mini-quiz appears (count=1, within 15s)
- [ ] Correct MCQ answer → "Go deeper with Sage →" teal pill visible
- [ ] Ask Sage from practice → "Continue Practice" banner visible on Sage page
- [ ] "Continue Practice" → returns to exact question position (no progress lost)
- [ ] Session completes → summary screen with accuracy %, XP earned, AP score estimate
- [ ] No 500 errors or blank screens during any flow above

**PWA:**
- [ ] On mobile Chrome: "Add to Home Screen" prompt appears (or menu option works)
- [ ] Installed PWA launches in standalone mode (no browser chrome)
- [ ] App loads from home screen without internet (cached shell)

**AI & Sage:**
- [ ] Sage answers a question within 15s
- [ ] Sage response includes 5 sections (Core Concept, Visual Breakdown, How AP Asks, Common Traps, Memory Hook)
- [ ] Follow-up chips appear and clicking one pre-fills the input

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
