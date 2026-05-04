import { test, expect } from "@playwright/test";

/**
 * Sidebar — multi-track unlock (2026-05-03).
 *
 * Bug report 2026-05-03: test user (track=ap) only saw AP courses in the
 * sidebar; SAT and ACT groups hidden. Fix: TRACK_TO_GROUP now points all
 * three tracks at the full BASE_COURSE_GROUPS (AP + SAT + ACT). Track is a
 * default-selected tab, not a hard lock. CLEP/DSST already removed.
 *
 * This spec runs against the authed shared test user (provisioned by
 * auth.setup.ts). Verifies the dropdown renders ALL three tab pills.
 */

test.describe.configure({ retries: 2, timeout: 30_000 });

test.describe("Sidebar course picker — multi-track unlock", () => {
  test("dropdown shows AP + SAT + ACT tabs (not just user's signup track)", async ({ page }) => {
    await page.goto("/dashboard");
    // Open the "Current Course" dropdown.
    const trigger = page.getByRole("button", { name: /current course|select course/i }).first()
      .or(page.locator('button[aria-haspopup="menu"]').filter({ hasText: /AP|SAT|ACT/i }).first());
    await trigger.click({ trial: false }).catch(async () => {
      // Fallback: any button inside the sidebar containing course-shortname-style text
      await page.locator('aside button').filter({ hasText: /AP|SAT|ACT/ }).first().click();
    });

    // Tabs are 10px-font buttons inside the popover. Look for short labels.
    const popover = page.locator('[role="menu"], [data-radix-menu-content]').first();
    await expect(popover).toBeVisible({ timeout: 3000 });

    // Each tab is a button with shortLabel "AP" / "SAT" / "ACT".
    for (const label of ["AP", "SAT", "ACT"]) {
      const tab = popover.getByRole("button", { name: new RegExp(`^${label}$`, "i") });
      await expect(tab.first(), `Expected "${label}" tab in course picker`).toBeVisible();
    }
  });

  test("clicking SAT tab reveals SAT_MATH option", async ({ page }) => {
    await page.goto("/dashboard");
    // Open dropdown
    await page.locator('aside button').filter({ hasText: /AP|SAT|ACT/ }).first().click();
    const popover = page.locator('[role="menu"], [data-radix-menu-content]').first();
    await expect(popover).toBeVisible({ timeout: 3000 });

    // Click SAT tab
    await popover.getByRole("button", { name: /^SAT$/i }).first().click();
    // Now the SAT_MATH course option should be in the dropdown
    await expect(popover.getByText(/SAT Math/i)).toBeVisible({ timeout: 3000 });
  });

  test("clicking ACT tab reveals ACT_MATH and ACT_ENGLISH options", async ({ page }) => {
    await page.goto("/dashboard");
    await page.locator('aside button').filter({ hasText: /AP|SAT|ACT/ }).first().click();
    const popover = page.locator('[role="menu"], [data-radix-menu-content]').first();
    await expect(popover).toBeVisible({ timeout: 3000 });

    await popover.getByRole("button", { name: /^ACT$/i }).first().click();
    await expect(popover.getByText(/ACT Math/i)).toBeVisible({ timeout: 3000 });
    await expect(popover.getByText(/ACT English/i)).toBeVisible({ timeout: 3000 });
  });
});
