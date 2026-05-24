import { test, expect } from "@playwright/test";

/**
 * REQ-144 — CLEP register redirect.
 *
 * Origin: Saanvi Reddy bounce, 2026-05-23. A visitor lands on
 * studentnest.ai/register?module=clep (likely from a stale CLEP CTA elsewhere
 * on the internet), realizes SN doesn't offer CLEP, and abandons. The fix
 * lives in src/app/(auth)/register/page.tsx — a client-side useEffect that
 * top-level-navigates to preplion.ai/register if module === "clep".
 *
 * Reference: docs/COMPREHENSIVE_TEST_PLAN.md §L5
 *            docs/REQUIREMENTS_LEDGER.md REQ-144
 *
 * NOTE: redirect is client-side (window.location.href in useEffect), so
 * a direct GET that returns 200 with HTML containing the redirect script
 * is the expected wire-level result. We assert page navigates to preplion.ai
 * after JS executes.
 */

const BASE = process.env.E2E_BASE_URL || "https://studentnest.ai";

test.describe.configure({ retries: 1, timeout: 30_000 });

test.describe("REQ-144 — /register?module=clep redirects to preplion.ai", () => {
  test("L5-N1: module=clep navigates to preplion.ai/register", async ({ page }) => {
    await page.goto(`${BASE}/register?module=clep`, { waitUntil: "domcontentloaded" });
    // useEffect fires after mount; give it a beat to trigger window.location.href.
    await page.waitForURL(/preplion\.ai\/register/i, { timeout: 10_000 });
    const url = new URL(page.url());
    expect(url.hostname).toMatch(/preplion\.ai$/);
    expect(url.pathname).toMatch(/^\/register/);
  });

  test("L5-N2: module=clep + course preserves ?course= in the redirect URL", async ({ page }) => {
    await page.goto(`${BASE}/register?module=clep&course=CLEP_BIOLOGY`, { waitUntil: "domcontentloaded" });
    await page.waitForURL(/preplion\.ai\/register/i, { timeout: 10_000 });
    const url = new URL(page.url());
    expect(url.hostname).toMatch(/preplion\.ai$/);
    expect(url.search).toMatch(/course=CLEP_BIOLOGY/);
  });

  test("L5-P1: module=ap stays on studentnest.ai/register", async ({ page }) => {
    await page.goto(`${BASE}/register?module=ap`, { waitUntil: "domcontentloaded" });
    // Wait briefly for any spurious client-side nav; assert we stayed.
    await page.waitForTimeout(1200);
    const url = new URL(page.url());
    expect(url.hostname).not.toMatch(/preplion\.ai$/);
    expect(url.pathname).toBe("/register");
  });

  test("L5-P2: module=sat stays on studentnest.ai/register", async ({ page }) => {
    await page.goto(`${BASE}/register?module=sat`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const url = new URL(page.url());
    expect(url.hostname).not.toMatch(/preplion\.ai$/);
    expect(url.pathname).toBe("/register");
  });

  test("L5-P3: module=act stays on studentnest.ai/register", async ({ page }) => {
    await page.goto(`${BASE}/register?module=act`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const url = new URL(page.url());
    expect(url.hostname).not.toMatch(/preplion\.ai$/);
    expect(url.pathname).toBe("/register");
  });

  // L5-N3: uppercase "?module=CLEP" — current impl is case-sensitive (`module === "clep"`).
  // TODO(REQ-144): decide whether to lowercase the comparison. Until then, marking as fixme.
  test.fixme("L5-N3: module=CLEP (uppercase) — case-insensitive redirect (NOT YET IMPLEMENTED)", async ({ page }) => {
    await page.goto(`${BASE}/register?module=CLEP`, { waitUntil: "domcontentloaded" });
    await page.waitForURL(/preplion\.ai\/register/i, { timeout: 10_000 });
    expect(new URL(page.url()).hostname).toMatch(/preplion\.ai$/);
  });

  test("L5-N7: no module query stays on studentnest.ai/register", async ({ page }) => {
    await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const url = new URL(page.url());
    expect(url.hostname).not.toMatch(/preplion\.ai$/);
    expect(url.pathname).toBe("/register");
  });
});
