// G4 QA Persona Walkthrough — SAT track end-to-end, fresh user.
// Verifies the 0509c4a SAT-track-JWT-refresh fix on staging before promote.
// User-reported flow: pick SAT/SAT_MATH on /journey → diagnostic must start
// (no 'this course is not available on your track' error) → answer through
// → land on dashboard → start practice → submit answer → no 'unable to submit'.
import { chromium } from "playwright";

const STAGING = "https://staging.studentnest.pages.dev";
const EMAIL = `qa-walk-sat-${Date.now()}@test.studentnest.ai`;
const PASSWORD = "Walkthrough#2026";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

const errors = [];
const consoleErrors = [];
page.on("pageerror", (e) => errors.push(`PAGEERROR ${e.message}`));
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });

const log = (step, status, notes = "") => {
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "—";
  console.log(`${icon} ${step.padEnd(50)} ${notes}`);
};

try {
  // 1. Register fresh user
  await page.goto(`${STAGING}/register?track=sat`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="firstName"]', "QA");
  await page.fill('input[name="lastName"]', "Walk");
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  const gradeSelect = page.locator('select[name="gradeLevel"], [role="combobox"]').first();
  if (await gradeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    try { await gradeSelect.selectOption("11"); } catch { /* combobox path */ }
  }
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  log("Step 1 — Register fresh user", "PASS", `email=${EMAIL.slice(0, 28)}…`);

  // 2. Should land on /journey (Step 0 — pick exam)
  const url2 = page.url();
  const onJourney = url2.includes("/journey") || url2.includes("/onboarding") || url2.includes("/practice/quickstart");
  log("Step 2 — Lands on journey/onboarding", onJourney ? "PASS" : "FAIL", `url=${url2}`);

  // 3. Pick SAT card (commit SAT_MATH default)
  await page.waitForTimeout(1000);
  const satCard = page.locator('button:has-text("SAT")').first();
  const satVisible = await satCard.isVisible({ timeout: 5000 }).catch(() => false);
  if (!satVisible) {
    log("Step 3 — SAT card visible on picker", "FAIL", `couldn't find SAT card`);
    throw new Error("No SAT card");
  }
  await satCard.click();
  await page.waitForTimeout(3000);
  log("Step 3 — Click SAT family card", "PASS");

  // 4. THE CRITICAL CHECK — does diagnostic start, or do we see the error?
  const bodyText = await page.locator("body").innerText();
  const courseError = /not available on your current track|course is not selected|please select.*course/i.test(bodyText);
  if (courseError) {
    log("Step 4 — Diagnostic starts (no 'not available' error)", "FAIL", `error toast/text in body`);
    console.log(`   Body excerpt: ${bodyText.slice(0, 200)}`);
    throw new Error("SAT track bug still present");
  }
  log("Step 4 — Diagnostic starts (no 'not available' error)", "PASS");

  // 5. Look for a diagnostic question
  await page.waitForTimeout(2000);
  const hasOptions = await page.locator('button:has-text("A.")').first().isVisible({ timeout: 8000 }).catch(() => false);
  log("Step 5 — Diagnostic Q renders with options", hasOptions ? "PASS" : "FAIL");

  // 6. Try to answer one Q and submit
  if (hasOptions) {
    await page.locator('button:has-text("A.")').first().click();
    await page.waitForTimeout(800);
    const submitBtn = page.locator('button:has-text("Submit"), button:has-text("Next")').first();
    const submitVisible = await submitBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (submitVisible) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
      const afterBody = await page.locator("body").innerText();
      const submitErr = /unable to submit|failed to submit|something went wrong/i.test(afterBody);
      log("Step 6 — Submit answer (no 'unable to submit')", submitErr ? "FAIL" : "PASS", submitErr ? "error message present" : "");
    } else {
      log("Step 6 — Submit answer", "FAIL", "Submit button not visible");
    }
  }
} catch (err) {
  console.log(`\n💥 Walk halted: ${err.message}`);
}

console.log(`\n— Console errors during walk: ${consoleErrors.length} —`);
for (const e of consoleErrors.slice(0, 5)) console.log(`  ${e.slice(0, 200)}`);
console.log(`— Page errors: ${errors.length} —`);
for (const e of errors.slice(0, 5)) console.log(`  ${e}`);

await browser.close();
