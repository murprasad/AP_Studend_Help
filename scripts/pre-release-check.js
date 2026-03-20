#!/usr/bin/env node
/**
 * pre-release-check.js
 * Automated gate for every StudentNest release.
 * Run: node scripts/pre-release-check.js
 * Or:  npm run release:check
 *
 * Checks:
 *  1. TypeScript — npx tsc --noEmit
 *  2. CF Workers compat — no banned SDK imports
 *  3. Pricing consistency — $9.99 and annual option present in key files
 *  4. Logo consistency — Sparkles + gradient-text in all 5 layout files
 *  5. Terms link — present in marketing footer
 *  6. package.json version — matches About page beta badge
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

let passed = 0;
let failed = 0;

function ok(msg)   { console.log(`  ✅ ${msg}`); passed++; }
function fail(msg) { console.error(`  ❌ ${msg}`); failed++; }
function section(title) { console.log(`\n── ${title} ──`); }

// ─── helper: read file content (returns "" on missing) ───────────────────────
function read(relPath) {
  const abs = path.join(ROOT, relPath);
  try { return fs.readFileSync(abs, "utf8"); } catch { return ""; }
}

// ─── 1. TypeScript ────────────────────────────────────────────────────────────
section("1. TypeScript");
try {
  execSync("npx tsc --noEmit", { cwd: ROOT, stdio: "pipe" });
  ok("No TypeScript errors");
} catch (e) {
  const output = (e.stdout?.toString() || "") + (e.stderr?.toString() || "");
  fail(`TypeScript errors found:\n${output.slice(0, 800)}`);
}

// ─── 2. CF Workers compat ────────────────────────────────────────────────────
section("2. Cloudflare Workers compat");
try {
  execSync("node scripts/check-cf-compat.js", { cwd: ROOT, stdio: "pipe" });
  ok("No banned SDK imports");
} catch (e) {
  const output = (e.stdout?.toString() || "") + (e.stderr?.toString() || "");
  fail(`Banned imports detected:\n${output.slice(0, 400)}`);
}

// ─── 3. Pricing consistency ───────────────────────────────────────────────────
section("3. Pricing consistency");
const PRICING_FILES = {
  "src/app/page.tsx":                           ["9.99", "79.99"],
  "src/app/(marketing)/pricing/page.tsx":        ["9.99", "79.99", "33%"],
  "src/app/(marketing)/terms/page.tsx":          ["9.99", "79.99"],
  "src/app/(marketing)/about/page.tsx":          ["79.99"],
  "src/app/(dashboard)/billing/page.tsx":        ["9.99", "79.99"],
};
for (const [file, terms] of Object.entries(PRICING_FILES)) {
  const content = read(file);
  if (!content) { fail(`File missing: ${file}`); continue; }
  for (const term of terms) {
    if (content.includes(term)) {
      ok(`${file} contains "${term}"`);
    } else {
      fail(`${file} is MISSING "${term}"`);
    }
  }
}

// Refund policy present in both pricing page and terms
section("  3b. Refund policy");
const refundFiles = [
  "src/app/(marketing)/pricing/page.tsx",
  "src/app/(marketing)/terms/page.tsx",
];
for (const f of refundFiles) {
  const c = read(f);
  if (c.includes("7-day") || c.includes("money-back")) {
    ok(`${f} has refund policy`);
  } else {
    fail(`${f} is MISSING refund policy (7-day / money-back)`);
  }
}

// ─── 4. Logo consistency ─────────────────────────────────────────────────────
section("4. Logo consistency");
const LOGO_FILES = [
  "src/app/(marketing)/layout.tsx",
  "src/app/(auth)/layout.tsx",
  "src/app/(dashboard)/layout.tsx",
  "src/components/layout/sidebar.tsx",
  "src/app/page.tsx",
];
for (const f of LOGO_FILES) {
  const c = read(f);
  if (!c) { fail(`Logo file missing: ${f}`); continue; }
  const hasSparkles    = c.includes("Sparkles");
  const hasGradient    = c.includes("gradient-text");
  const hasNest        = c.includes("Nest");
  if (hasSparkles && hasGradient && hasNest) {
    ok(`${f} — logo consistent`);
  } else {
    const issues = [
      !hasSparkles && "missing Sparkles icon",
      !hasGradient && "missing gradient-text",
      !hasNest     && "missing 'Nest' text",
    ].filter(Boolean).join(", ");
    fail(`${f} — logo inconsistent: ${issues}`);
  }
}

// ─── 5. Terms link in marketing footer ───────────────────────────────────────
section("5. Terms link");
const layoutContent = read("src/app/(marketing)/layout.tsx");
if (layoutContent.includes('href="/terms"') || layoutContent.includes("href='/terms'")) {
  ok("Marketing footer has /terms link");
} else {
  fail("Marketing footer is MISSING /terms link");
}

// ─── 6. Version bump reminder ─────────────────────────────────────────────────
section("6. Version consistency");
const pkgJson = JSON.parse(read("package.json") || "{}");
const aboutContent = read("src/app/(marketing)/about/page.tsx");
const pkgVersion = pkgJson.version || "?";
// Extract Beta x.y from about page badge
const betaMatch = aboutContent.match(/Beta ([\d.]+)/);
const aboutBeta = betaMatch ? betaMatch[1] : "?";
// Just report — don't fail (versions use different formats: 1.9.0 vs Beta 1.10)
console.log(`  ℹ️  package.json version: ${pkgVersion}  |  About page badge: Beta ${aboutBeta}`);
console.log(`     (Manual check: bump package.json version to match About page badge)`);

// ─── 7. Practice test plan coverage ──────────────────────────────────────────
section("7. Practice test plan");
const REQUIRED_COURSES = [
  "AP_WORLD_HISTORY", "AP_US_HISTORY", "AP_COMPUTER_SCIENCE_PRINCIPLES",
  "AP_PHYSICS_1", "AP_CALCULUS_AB", "AP_CALCULUS_BC", "AP_STATISTICS",
  "AP_CHEMISTRY", "AP_BIOLOGY", "AP_PSYCHOLOGY",
  "SAT_MATH", "SAT_READING_WRITING",
  "ACT_MATH", "ACT_ENGLISH", "ACT_SCIENCE", "ACT_READING",
];
const testPlanPath = "qa_test_plan_practice_comprehensive.md";
const testPlanContent = read(testPlanPath);
if (!testPlanContent) {
  fail(`Test plan missing: ${testPlanPath} — run qa_test_plan_practice_comprehensive.md test suite before deploying`);
} else {
  ok("Practice test plan file exists");
  const missingCourses = REQUIRED_COURSES.filter((c) => !testPlanContent.includes(c));
  if (missingCourses.length > 0) {
    fail(`Test plan is missing coverage for: ${missingCourses.join(", ")}`);
  } else {
    ok(`Test plan covers all ${REQUIRED_COURSES.length} courses`);
  }
}
// Print manual testing checklist (informational — does not affect pass/fail count)
console.log(`\n  📋 Manual P0 checks before deploying:`);
console.log(`     [ ] AP_WORLD_HISTORY MCQ session starts (ALL units, ALL difficulty)`);
console.log(`     [ ] SAT_MATH MCQ session starts`);
console.log(`     [ ] ACT_MATH MCQ session starts (verify 5 choices)`);
console.log(`     [ ] AP_PHYSICS_1 FRQ session starts`);
console.log(`     [ ] Wrong MCQ answer → knowledge-check appears (1 question, not 3)`);
console.log(`     [ ] Session completes → summary screen shows accuracy + XP`);
console.log(`     [ ] No 500 errors in CF Pages logs after starting sessions`);

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
if (failed === 0) {
  console.log(`✅ All ${passed} checks passed — safe to deploy.`);
  process.exit(0);
} else {
  console.log(`❌ ${failed} check(s) failed, ${passed} passed. Fix before deploying.`);
  process.exit(1);
}
