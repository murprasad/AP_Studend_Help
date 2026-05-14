import { test, expect } from "@playwright/test";

/**
 * Per-plan register URLs — NurseHub-derived (Batch 3).
 * Verifies the 3 known slug routes redirect to /register with the right
 * module + utm_source, and that an unknown slug falls through to /register
 * (not a 404 that would break marketing typos).
 */

test.describe.configure({ retries: 1, timeout: 30_000 });

const KNOWN_PLANS = [
  { slug: "ap", expectedModule: "ap" },
  { slug: "sat", expectedModule: "sat" },
  { slug: "act", expectedModule: "act" },
];

for (const p of KNOWN_PLANS) {
  test(`/register/${p.slug} → /register?module=${p.expectedModule} with UTM`, async ({ request }) => {
    const res = await request.get(`/register/${p.slug}`, { maxRedirects: 0 });
    expect([301, 308]).toContain(res.status());
    const location = res.headers().location ?? "";
    expect(location, `${p.slug} should redirect to /register with module + utm`).toContain(`/register?module=${p.expectedModule}`);
    expect(location, `${p.slug} should include utm_source`).toContain(`utm_source=register-plan-${p.slug}`);
  });
}

test("/register/unknownplan → falls through to /register (not 404)", async ({ request }) => {
  const res = await request.get("/register/totally-made-up-plan", { maxRedirects: 0 });
  // Permanent redirect to /register (no module param)
  expect([301, 308]).toContain(res.status());
  expect(res.headers().location ?? "").toMatch(/^\/register(\?|$)/);
});

test("/register (no plan) — still works as before", async ({ page }) => {
  await page.goto("/register", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Create your account/i })).toBeVisible({ timeout: 10_000 });
});
