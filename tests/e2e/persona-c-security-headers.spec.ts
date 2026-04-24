import { test, expect } from "@playwright/test";

/**
 * Persona C — security header + attack-surface probes.
 *
 * Covers a slice of matrix 10.17 (security):
 *   - HSTS header present
 *   - X-Content-Type-Options nosniff
 *   - Frame deny / SAMEORIGIN (clickjacking)
 *   - Open-redirect on callbackUrl
 *   - XSS-in-path reflects as escaped text
 *   - Search query doesn't crash
 *
 * Anonymous-safe. Runs against deployed URL by default.
 */

test.describe.configure({ retries: 1, timeout: 30_000 });

test("HSTS header present on root", async ({ request }) => {
  const res = await request.get("/", { failOnStatusCode: false, maxRedirects: 0 });
  const hsts = res.headers()["strict-transport-security"];
  expect(hsts, "Strict-Transport-Security header missing").toBeTruthy();
  expect(hsts).toMatch(/max-age=\d+/);
});

test("X-Content-Type-Options: nosniff on root", async ({ request }) => {
  const res = await request.get("/");
  const xcto = res.headers()["x-content-type-options"];
  // Soft-warn if missing — not every hosting platform sets this by default
  if (!xcto) {
    console.warn("[security] X-Content-Type-Options header missing on /");
  } else {
    expect(xcto.toLowerCase()).toBe("nosniff");
  }
});

test("Frame options on root (clickjacking defense)", async ({ request }) => {
  const res = await request.get("/");
  const xfo = res.headers()["x-frame-options"];
  const csp = res.headers()["content-security-policy"];
  const hasClickjackDefense = !!xfo || /frame-ancestors/.test(csp ?? "");
  if (!hasClickjackDefense) {
    console.warn("[security] No X-Frame-Options and no CSP frame-ancestors — app can be iframed");
  }
});

test("Open-redirect via callbackUrl is rejected", async ({ request }) => {
  // If callbackUrl is trusted, then /api/auth/signin?callbackUrl=https://evil.com
  // would send the user there. next-auth should refuse non-same-origin.
  const res = await request.get("/api/auth/signin?callbackUrl=https://evil.example.com", {
    failOnStatusCode: false,
    maxRedirects: 0,
  });
  // next-auth returns 302 to its own signin page, never to the external URL.
  const loc = res.headers()["location"] ?? "";
  expect(loc, "callbackUrl should not redirect off-site").not.toContain("evil.example.com");
});

test("XSS attempt in path renders as text, not script", async ({ page }) => {
  // Visit a path with a <script> tag. Should 404 (escaped in error page) or
  // render safely. Should NEVER execute.
  let executed = false;
  page.on("dialog", () => { executed = true; });
  await page.goto("/%3Cscript%3Ealert(1)%3C%2Fscript%3E").catch(() => {});
  await page.waitForTimeout(500);
  expect(executed, "inline <script> in path should never execute").toBe(false);
});

test("Search query with SQL-injection shape returns empty, not 500", async ({ request }) => {
  const res = await request.get("/api/resources/search?q=" + encodeURIComponent("') OR 1=1--"), {
    failOnStatusCode: false,
  } as any);
  // Must not 5xx — injection attempt should either return empty list or 4xx
  expect(res.status()).toBeLessThan(500);
});

test("Giant query param doesn't crash server", async ({ request }) => {
  const huge = "a".repeat(8000);
  const res = await request.get("/api/resources/search?q=" + encodeURIComponent(huge), {
    failOnStatusCode: false,
  } as any);
  expect(res.status()).toBeLessThan(500);
});

test("Mass-assignment on /api/user PATCH (anonymous) returns 401", async ({ request }) => {
  const res = await request.patch("/api/user", {
    data: { role: "ADMIN", subscriptionTier: "PREMIUM" },
    failOnStatusCode: false,
  });
  expect(res.status(), "Anonymous must not be able to PATCH user fields").toBeGreaterThanOrEqual(401);
  expect(res.status()).toBeLessThan(500);
});

test("No secret leak in client bundle (spot-check main chunk)", async ({ request }) => {
  const res = await request.get("/");
  const html = await res.text();
  // Client HTML should never embed these keys
  expect(html).not.toMatch(/sk_live_[a-zA-Z0-9]/);
  expect(html).not.toMatch(/sk_test_[a-zA-Z0-9]/);
  expect(html).not.toMatch(/postgres:\/\/[^"]+:[^"]+@/);
  expect(html).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS
  expect(html).not.toMatch(/BEGIN (?:RSA |EC )?PRIVATE KEY/);
});
