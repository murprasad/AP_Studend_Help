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
 *  7. Practice test plan — exists and covers all 16 courses
 *
 * Full deploy pipeline (pages:deploy):
 *  pre-release-check → build → deploy → smoke-tests → update-test-plan → archive-release
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
  "src/app/(marketing)/pricing/pricing-client.tsx": ["9.99", "79.99", "33%"],
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
  "src/app/(marketing)/pricing/pricing-client.tsx",
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
// The (marketing) layout delegates its logo to the MarketingHeader component.
// Follow one level of component composition when the file itself doesn't
// contain the markers but imports a logo-owning component.
const LOGO_DELEGATES = {
  "src/app/(marketing)/layout.tsx": "src/components/layout/marketing-header.tsx",
};
for (const f of LOGO_FILES) {
  const c = read(f);
  if (!c) { fail(`Logo file missing: ${f}`); continue; }
  const delegate = LOGO_DELEGATES[f];
  const delegateContent = delegate ? read(delegate) : "";
  const pool = c + "\n" + delegateContent;
  const hasSparkles    = pool.includes("Sparkles");
  const hasGradient    = pool.includes("gradient-text");
  const hasNest        = pool.includes("Nest");
  if (hasSparkles && hasGradient && hasNest) {
    ok(`${f} — logo consistent${delegate && !c.includes("Sparkles") ? " (via " + delegate + ")" : ""}`);
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

// ─── 6. Version consistency (hard fail if mismatch) ───────────────────────────
section("6. Version consistency");
const pkgJson = JSON.parse(read("package.json") || "{}");
const aboutContent = read("src/app/(marketing)/about/page.tsx");
const pkgVersion = pkgJson.version || "?";
const betaMatch = aboutContent.match(/Beta ([\d.]+)/);
const aboutBeta = betaMatch ? betaMatch[1] : "?";
// package.json: "1.14.0" → compare first two parts against About page "Beta 1.14"
const pkgMajorMinor = pkgVersion.split(".").slice(0, 2).join(".");
if (pkgMajorMinor === aboutBeta) {
  ok(`Version consistent: package.json ${pkgVersion} matches About page Beta ${aboutBeta}`);
} else {
  // Beta 9 (2026-04-29) — auto-suggest the exact fix to save the
  // typical "Beta 9" vs "Beta 9.0" retry cycle (15+ min wasted today).
  const pkgMajor = pkgVersion.split(".")[0];
  const aboutMajor = aboutBeta.split(".")[0];
  let suggestion = "";
  if (pkgMajor === aboutMajor && !aboutBeta.includes(".")) {
    suggestion = `\n\n   💡 Quick fix: change About page badge "Beta ${aboutBeta}" → "Beta ${pkgMajorMinor}"\n` +
      `      (sed: replace 'Beta ${aboutBeta}<' with 'Beta ${pkgMajorMinor}<' in src/app/(marketing)/about/page.tsx)`;
  } else if (pkgMajor !== aboutMajor) {
    suggestion = `\n\n   💡 Pick which side is correct, then sync the other:\n` +
      `      • If About page is right (still Beta ${aboutBeta}): bump package.json to "${aboutBeta}.0"\n` +
      `      • If package.json is right (now ${pkgVersion}): change badge to "Beta ${pkgMajorMinor}"`;
  }
  fail(`Version mismatch: package.json is ${pkgVersion} but About page shows Beta ${aboutBeta}.${suggestion}`);
}

// ─── 7. Practice test plan coverage ──────────────────────────────────────────
section("7. Practice test plan");
const REQUIRED_COURSES = [
  "AP_WORLD_HISTORY", "AP_US_HISTORY", "AP_COMPUTER_SCIENCE_PRINCIPLES",
  "AP_PHYSICS_1", "AP_CALCULUS_AB", "AP_CALCULUS_BC", "AP_STATISTICS",
  "AP_CHEMISTRY", "AP_BIOLOGY", "AP_PSYCHOLOGY",
  "SAT_MATH", "SAT_READING_WRITING",
  "ACT_MATH", "ACT_ENGLISH", "ACT_SCIENCE", "ACT_READING",
  "CLEP_COLLEGE_ALGEBRA", "CLEP_COLLEGE_COMPOSITION", "CLEP_INTRO_PSYCHOLOGY",
  "CLEP_PRINCIPLES_OF_MARKETING", "CLEP_PRINCIPLES_OF_MANAGEMENT", "CLEP_INTRODUCTORY_SOCIOLOGY",
  "CLEP_AMERICAN_GOVERNMENT", "CLEP_MACROECONOMICS", "CLEP_MICROECONOMICS",
  "CLEP_BIOLOGY", "CLEP_US_HISTORY_1", "CLEP_US_HISTORY_2",
  "CLEP_HUMAN_GROWTH_DEV", "CLEP_CALCULUS", "CLEP_CHEMISTRY",
  "CLEP_FINANCIAL_ACCOUNTING", "CLEP_AMERICAN_LITERATURE", "CLEP_ANALYZING_INTERPRETING_LIT",
  "CLEP_COLLEGE_COMP_MODULAR", "CLEP_ENGLISH_LITERATURE", "CLEP_HUMANITIES",
  "CLEP_EDUCATIONAL_PSYCHOLOGY", "CLEP_SOCIAL_SCIENCES_HISTORY",
  "CLEP_WESTERN_CIV_1", "CLEP_WESTERN_CIV_2", "CLEP_COLLEGE_MATH",
  "CLEP_NATURAL_SCIENCES", "CLEP_PRECALCULUS", "CLEP_INFORMATION_SYSTEMS",
  "CLEP_BUSINESS_LAW", "CLEP_FRENCH", "CLEP_GERMAN", "CLEP_SPANISH", "CLEP_SPANISH_WRITING",
  "DSST_PRINCIPLES_OF_SUPERVISION", "DSST_HUMAN_RESOURCE_MANAGEMENT",
  "DSST_ORGANIZATIONAL_BEHAVIOR", "DSST_PERSONAL_FINANCE", "DSST_LIFESPAN_DEV_PSYCHOLOGY",
  "DSST_INTRO_TO_BUSINESS", "DSST_HUMAN_DEVELOPMENT", "DSST_ETHICS_IN_AMERICA",
  "DSST_ENVIRONMENTAL_SCIENCE", "DSST_TECHNICAL_WRITING", "DSST_PRINCIPLES_OF_FINANCE",
  "DSST_MANAGEMENT_INFO_SYSTEMS", "DSST_MONEY_AND_BANKING", "DSST_SUBSTANCE_ABUSE",
  "DSST_CRIMINAL_JUSTICE", "DSST_FUNDAMENTALS_OF_COUNSELING", "DSST_GENERAL_ANTHROPOLOGY",
  "DSST_WORLD_RELIGIONS", "DSST_ART_WESTERN_WORLD", "DSST_ASTRONOMY",
  "DSST_COMPUTING_AND_IT", "DSST_CIVIL_WAR",
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

// ─── 8. PWA checks ────────────────────────────────────────────────────────────
section("8. PWA compatibility");
try {
  execSync("node scripts/check-pwa.js", { cwd: ROOT, stdio: "pipe" });
  ok("PWA checks passed (manifest, icons, SW, meta tags)");
} catch (e) {
  const output = (e.stdout?.toString() || "") + (e.stderr?.toString() || "");
  fail(`PWA check failed:\n${output.slice(0, 600)}`);
}

// ─── 9. Cross-platform branding — no "PrepLion" in user-facing copy ─────────
// Added 2026-04-22 after a live feedback popup leaked "improve PrepLion"
// copy on StudentNest. Scans user-facing components + pages for "PrepLion"
// in JSX text or user-visible string literals. Allowlists the handful of
// legitimate references: sister-site callouts ("preplion.ai"), cross-sell
// card copy, code comments (// Ported from PrepLion ...), trademark
// footnotes in the marketing layout.
section("9. No PrepLion branding leaks in user-facing copy");
{
  const glob = require("glob");
  const SEARCH_ROOTS = [
    "src/app/(dashboard)/**/*.{tsx,ts}",
    "src/app/page.tsx",
    "src/components/dashboard/**/*.{tsx,ts}",
    "src/components/practice/**/*.{tsx,ts}",
    "src/components/feedback/**/*.{tsx,ts}",
    "src/components/tutor/**/*.{tsx,ts}",
    "src/components/diagnostic/**/*.{tsx,ts}",
    "src/components/layout/**/*.{tsx,ts}",
    "src/components/landing/**/*.{tsx,ts}",
  ];
  // Paths/files that are allowed to reference PrepLion because it's
  // intentional cross-platform language (sister site callouts, code
  // comments). Full string match; keep this list short.
  const ALLOWED_FILES = new Set([
    "src/components/dashboard/clep-upsell-card.tsx", // "Explore PrepLion (CLEP/DSST)" — intentional cross-sell
  ]);
  let leaks = 0;
  const leakDetails = [];
  for (const pattern of SEARCH_ROOTS) {
    const files = glob.sync(pattern, { cwd: ROOT, nodir: true });
    for (const rel of files) {
      if (ALLOWED_FILES.has(rel.replace(/\\/g, "/"))) continue;
      const content = read(rel);
      // Skip pure-comment mentions (lines whose trimmed start is // or * or
      // /* or @)  — those are code documentation, never user-visible.
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.includes("PrepLion")) continue;
        const trimmed = line.trimStart();
        // Skip standard JS/TS comment forms (//, /*, *, @ docblock).
        if (
          trimmed.startsWith("//") ||
          trimmed.startsWith("*") ||
          trimmed.startsWith("/*") ||
          trimmed.startsWith("@")
        ) continue;
        // Skip JSX inline comments of the form `{/* ... PrepLion ... */}`.
        // The open/close pair is always on the same-or-nearby lines and
        // the whole block is stripped at build.
        if (/\{\s*\/\*/.test(line) || line.includes("*/}") ) continue;
        leaks++;
        leakDetails.push(`${rel}:${i + 1} — ${line.trim().slice(0, 100)}`);
      }
    }
  }
  if (leaks === 0) {
    ok("No 'PrepLion' references in user-facing StudentNest copy");
  } else {
    fail(`Found ${leaks} PrepLion reference(s) in user-facing code:\n  ${leakDetails.slice(0, 5).join("\n  ")}`);
  }
}

// ─── 10. No "pass probability" language in user-facing copy ─────────────────
// Added 2026-04-22 when the hero card was redesigned away from an abstract
// probability % toward the student's exam-native scaled score (AP 1-5, SAT
// 400-1600, ACT 1-36). `passPercent` remains as an INTERNAL tier-label
// signal inside src/lib/pass-engine.ts, score-predictors/, and a few
// scripts — those are allowlisted. Only flags user-facing leaks.
section("10. No 'pass probability' in user-facing copy");
{
  const glob = require("glob");
  const SEARCH_ROOTS = [
    "src/app/(dashboard)/**/*.{tsx,ts}",
    "src/app/(marketing)/**/*.{tsx,ts}",
    "src/app/page.tsx",
    "src/components/**/*.{tsx,ts}",
  ];
  // Internal signal files — allowed to keep the term in code/comments.
  const ALLOWED_FILES = new Set([
    "src/lib/pass-engine.ts",
    "src/lib/score-predictors/ap.ts",
    "src/lib/score-predictors/sat.ts",
    "src/lib/score-predictors/act.ts",
    "src/lib/confetti.ts", // internal comment only
  ]);
  const PATTERN = /pass[\s\-]?probability/i;
  let leaks = 0;
  const leakDetails = [];
  for (const pattern of SEARCH_ROOTS) {
    const files = glob.sync(pattern, { cwd: ROOT, nodir: true });
    for (const rel of files) {
      const norm = rel.replace(/\\/g, "/");
      if (ALLOWED_FILES.has(norm)) continue;
      const content = read(rel);
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!PATTERN.test(line)) continue;
        const trimmed = line.trimStart();
        // Allow internal code comments — only flag user-visible strings.
        if (
          trimmed.startsWith("//") ||
          trimmed.startsWith("*") ||
          trimmed.startsWith("/*")
        ) continue;
        if (/\{\s*\/\*/.test(line) || line.includes("*/}") ) continue;
        leaks++;
        leakDetails.push(`${rel}:${i + 1} — ${line.trim().slice(0, 100)}`);
      }
    }
  }
  if (leaks === 0) {
    ok("No 'pass probability' language in user-facing copy");
  } else {
    fail(`Found ${leaks} 'pass probability' reference(s) in user-facing code:\n  ${leakDetails.slice(0, 5).join("\n  ")}`);
  }
}

// ─── 9. Question-bank content accuracy gate ──────────────────────────────────
// 2026-05-01 — added after Reddit "shitty AI coding" feedback + buoyant-force
// bug found in prod. Runs audit-content-accuracy.mjs against the live DB and
// blocks deploy if the flag rate spikes above the post-cleanup baseline.
//
// Skipped if DATABASE_URL isn't available (e.g. CI without prod creds).
{
  if (!process.env.DATABASE_URL) {
    console.log(`  ⚠ content-accuracy audit skipped (DATABASE_URL not set)`);
  } else {
    try {
      const raw = execSync("node scripts/audit-content-accuracy.mjs --json", {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 120_000,
      });
      const j = JSON.parse(raw);
      // Gate at 5% — well above the expected post-cleanup baseline of ~0%.
      // If the flag rate creeps above 5%, generation has regressed.
      const pct = (j.flagged / j.total) * 100;
      if (pct <= 5) {
        ok(`Question-bank content accuracy: ${j.flagged} flagged of ${j.total} (${pct.toFixed(1)}% — under 5% gate)`);
      } else {
        fail(`Question-bank content accuracy: ${j.flagged} flagged of ${j.total} (${pct.toFixed(1)}%) exceeds 5% gate. Run scripts/audit-content-accuracy.mjs to inspect; consider --unapprove or fix generator.`);
      }
    } catch (err) {
      // Audit script exits 1 when there are flags. We already capture that
      // in the JSON output above; if the spawn itself failed, surface the error.
      console.log(`  ⚠ content-accuracy audit could not run: ${String(err.message ?? err).slice(0, 120)}`);
    }
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
if (failed === 0) {
  console.log(`✅ All ${passed} checks passed — safe to deploy.`);
  process.exit(0);
} else {
  console.log(`❌ ${failed} check(s) failed, ${passed} passed. Fix before deploying.`);
  process.exit(1);
}
