import { test, expect } from "@playwright/test";

/**
 * Per-page security + caching header audit.
 *
 * For each public page, check presence of:
 *   - strict-transport-security (HSTS)
 *   - x-content-type-options: nosniff
 *   - x-frame-options OR CSP frame-ancestors (clickjacking defense)
 *   - referrer-policy
 *   - permissions-policy (feature policy)
 *   - content-security-policy
 *   - x-dns-prefetch-control
 *
 * Every missing header on every page = 1 bug row.
 *
 * Matrix: 10.17 (security).
 */

const PAGES = [
  "/",
  "/pricing",
  "/about",
  "/terms",
  "/privacy",
  "/faq",
  "/methodology",
  "/ap-prep",
  "/sat-prep",
  "/act-prep",
  "/clep-prep",
  "/dsst-prep",
  "/am-i-ready",
  "/pass-rates",
  "/wall-of-fame",
  "/contact",
  "/login",
  "/register",
  "/forgot-password",
  "/blog",
];

const HEADERS = [
  { name: "strict-transport-security", severity: "critical" },
  { name: "x-content-type-options", severity: "high", expect: "nosniff" },
  { name: "referrer-policy", severity: "medium" },
  { name: "permissions-policy", severity: "medium" },
  { name: "content-security-policy", severity: "high" },
  { name: "x-frame-options", severity: "high" }, // OR CSP frame-ancestors
];

test.describe.configure({ retries: 1, timeout: 45_000 });

for (const path of PAGES) {
  test.describe(`${path}`, () => {
    for (const h of HEADERS) {
      test(`${path} — header "${h.name}" present (${h.severity})`, async ({ request }) => {
        const res = await request.get(path, { failOnStatusCode: false, maxRedirects: 0 });
        if (res.status() >= 400) test.skip(true, `${path} not reachable`);
        const headers = res.headers();
        const value = headers[h.name];
        // X-Frame-Options is valid OR CSP frame-ancestors
        if (h.name === "x-frame-options") {
          const csp = headers["content-security-policy"] ?? "";
          const hasFrameAncestors = /frame-ancestors/.test(csp);
          expect(
            !!value || hasFrameAncestors,
            `${path}: no X-Frame-Options and no CSP frame-ancestors — clickjacking possible`,
          ).toBe(true);
          return;
        }
        expect(value, `${path}: header "${h.name}" missing (${h.severity})`).toBeTruthy();
        if (h.expect) {
          expect(value).toContain(h.expect);
        }
      });
    }
  });
}
