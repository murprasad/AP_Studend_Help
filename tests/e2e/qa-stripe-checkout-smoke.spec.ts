/**
 * QA — Stripe checkout smoke (SN)
 *
 * Same coverage as PL's qa-stripe-checkout-smoke.spec.ts:
 *   1. /pricing renders with CTA
 *   2. /api/checkout returns non-5xx
 *   3. /api/webhooks/stripe rejects unsigned requests
 *
 * Run: E2E_BASE_URL=https://studentnest.ai npx playwright test tests/e2e/qa-stripe-checkout-smoke.spec.ts --reporter=list
 */
import { test, expect } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL || "https://studentnest.ai";

test("/pricing renders with at least one checkout CTA", async ({ page }) => {
  test.setTimeout(30_000);
  const resp = await page.goto(`${BASE}/pricing`, { waitUntil: "domcontentloaded" });
  expect(resp?.status()).toBeLessThan(400);

  const html = await page.content();
  const hasCta =
    /Start.*free|Get started|Subscribe|Pass Plan|Predicted|7-day trial|Fast Track|Premium/i.test(html);
  expect(hasCta, "Pricing page has no recognizable conversion CTA").toBe(true);
});

test("/api/checkout responds without 5xx", async ({ request }) => {
  test.setTimeout(30_000);
  const resp = await request.post(`${BASE}/api/checkout`, {
    data: { priceId: "smoke-test-placeholder", course: "AP_WORLD_HISTORY" },
    failOnStatusCode: false,
  });
  expect(resp.status()).toBeLessThan(500);
});

test("/api/webhooks/stripe rejects unsigned requests", async ({ request }) => {
  test.setTimeout(30_000);
  const resp = await request.post(`${BASE}/api/webhooks/stripe`, {
    data: { type: "test.event" },
    failOnStatusCode: false,
  });
  expect(resp.status()).not.toBe(200);
  expect(resp.status()).toBeLessThan(500);
});
