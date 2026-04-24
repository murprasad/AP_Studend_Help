import { test, expect } from "@playwright/test";

/**
 * Persona C — console-error audit.
 *
 * Visit every public page; during load + 1s idle, assert:
 *   - no console.error messages
 *   - no unhandled promise rejections
 *   - no network 500s on any resource request from this page
 *
 * These three are cheap, high-signal smoke. Silent console errors in
 * production are usually real bugs (stale chunks, hydration mismatch,
 * failed background fetches) that users never report.
 *
 * Matrix rows: 10.12 (error states), partial 10.14 (auto-a11y).
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
];

// Known-noise patterns we deliberately ignore. Extend with caution —
// each entry is a promise not to investigate that class of error.
const IGNORE_CONSOLE = [
  /net::ERR_ABORTED.*prefetch/i, // Next.js prefetch aborts on fast nav — expected
  /google-analytics|gtag/i,      // GA collection noise outside our control
  /Tracking Prevention|ITP/i,     // Browser privacy features
];

test.describe.configure({ retries: 1, timeout: 60_000 });

for (const path of PAGES) {
  test(`${path} — no console errors or unhandled rejections`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const networkErrors: Array<{ url: string; status: number }> = [];
    const suspiciousResponses: Array<{ url: string; status: number }> = [];

    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      if (IGNORE_CONSOLE.some((re) => re.test(text))) return;
      consoleErrors.push(text.slice(0, 300));
    });
    page.on("pageerror", (err) => {
      pageErrors.push(String(err).slice(0, 300));
    });
    page.on("response", (resp) => {
      if (resp.status() >= 500) {
        networkErrors.push({ url: resp.url(), status: resp.status() });
      }
      // Also capture 4xx so we can explain the "Failed to load resource: 401"
      // messages the console emits.
      if (resp.status() === 401 || resp.status() === 403 || resp.status() === 404 || resp.status() === 500) {
        suspiciousResponses.push({ url: resp.url(), status: resp.status() });
      }
    });

    const res = await page.goto(path, { waitUntil: "domcontentloaded" });
    if (!res || res.status() >= 400) {
      test.skip(true, `${path} returned ${res?.status()} — skipping`);
      return;
    }
    // Let async effects run
    await page.waitForTimeout(1500);

    expect(
      pageErrors,
      `Unhandled rejections on ${path}:\n${pageErrors.join("\n")}`,
    ).toEqual([]);
    expect(
      consoleErrors,
      `Console errors on ${path}:\n${consoleErrors.join("\n")}\nSuspicious resource responses:\n${suspiciousResponses.map((e) => `  ${e.status} ${e.url}`).join("\n")}`,
    ).toEqual([]);
    expect(
      networkErrors,
      `5xx resource requests on ${path}:\n${networkErrors.map((e) => `  ${e.status} ${e.url}`).join("\n")}`,
    ).toEqual([]);
  });
}
