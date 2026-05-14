import { test, expect } from "@playwright/test";

/**
 * Pass Guarantee Badge — visible + accessible on /pricing.
 *
 * Derived from NurseHub competitive analysis 2026-05-13: their highest-
 * conversion trust signal. We ship the UI in Batch 1 to collect impression
 * data; the actual refund flow + eligibility schema land in Batch 2.
 */

test.describe.configure({ retries: 1, timeout: 30_000 });

test("/pricing — Pass Guarantee card renders with all 3 criteria", async ({ page }) => {
  await page.goto("/pricing", { waitUntil: "domcontentloaded" });

  // Heading is unique to the card variant
  const heading = page.getByRole("heading", { name: /Pass your .* exam or your money back/i });
  await expect(heading).toBeVisible({ timeout: 10_000 });

  // The 3 criteria from CRITERIA_COPY in pass-guarantee-badge.tsx
  await expect(page.getByText(/Complete .80% of your generated study plan/i)).toBeVisible();
  await expect(page.getByText(/3 full-length mock exams/i)).toBeVisible();
  await expect(page.getByText(/Submit your exam score within 60 days/i)).toBeVisible();

  // CTA to full terms
  const termsLink = page.getByRole("link", { name: /Read the full terms/i });
  await expect(termsLink).toBeVisible();
  await expect(termsLink).toHaveAttribute("href", "/pass-guarantee");
});

test("/pricing — Pass Guarantee section is above the FAQ", async ({ page }) => {
  // Asserts ordering — badge should drive conversion BEFORE users scroll into
  // the FAQ section. If a future refactor moves the FAQ above the badge, this
  // catches it.
  await page.goto("/pricing", { waitUntil: "domcontentloaded" });
  const badge = page.getByRole("heading", { name: /Pass your .* exam or your money back/i });
  const faq = page.getByRole("heading", { name: /Frequently asked questions/i });
  await expect(badge).toBeVisible();
  await expect(faq).toBeVisible();
  const badgeBox = await badge.boundingBox();
  const faqBox = await faq.boundingBox();
  expect(badgeBox, "badge must have bounding box").not.toBeNull();
  expect(faqBox, "faq must have bounding box").not.toBeNull();
  expect(badgeBox!.y, "Pass Guarantee must appear above FAQ").toBeLessThan(faqBox!.y);
});
