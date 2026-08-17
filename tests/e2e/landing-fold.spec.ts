import { test, expect } from "@playwright/test";

/**
 * Landing-page fold check.
 *
 * Verifies the primary exam chooser is visible in the first viewport
 * on common desktop and mobile viewports. This is a trust + conversion
 * gate: if students have to scroll to choose an exam, the page is
 * making them work too hard.
 */

const VIEWPORTS = [
  { name: "desktop", width: 1365, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

for (const vp of VIEWPORTS) {
  test(`landing: Choose your exam appears above the fold on ${vp.name}`, async ({ page }) => {
    test.setTimeout(45_000);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const resp = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(resp?.status(), "landing page should render").toBeLessThan(400);

    const chooser = page.getByRole("heading", { name: /Choose your exam/i }).first();
    await expect(chooser, "Choose your exam heading should render").toBeVisible();

    const box = await chooser.boundingBox();
    expect(box, "Choose your exam heading should have a box").not.toBeNull();
    if (!box) return;

    // We allow the fold to breathe, but the chooser should still be
    // visible in the first viewport. If its top is beyond the viewport
    // height, users must scroll to find the primary routing control.
    expect(
      box.y,
      `Choose your exam is below the fold on ${vp.name} (top=${box.y}, viewportHeight=${vp.height})`,
    ).toBeLessThan(vp.height);
  });
}
