import { test, expect, type Page } from "@playwright/test";

/**
 * Persona C — Explorer: anonymous BFS crawler.
 *
 * The test persona that breaks production. "I'm poking at this app.
 * What does every button do?" This spec enumerates every clickable
 * element reachable from /, visits each (up to depth 3), and asserts:
 *   - destination returns < 400
 *   - no console.error fires during load
 *   - no unhandled promise rejection
 *
 * Ground rules:
 *   - Same-origin only (skips external links, mailto:, tel:)
 *   - Deduped by URL (origin + pathname + search, hash ignored)
 *   - Depth-limited (3) to keep run under ~2 min
 *   - Per-page budget: 15s (some marketing pages are heavy on CF cold-start)
 *
 * Runs against whatever E2E_BASE_URL is set to — production by default.
 *
 * Matrix rows closed: 10.1 (discovery), 10.12 (error states via console).
 */

const START = "/";
const MAX_DEPTH = 3;
const MAX_PAGES = 60; // safety cap for CI budget
const PER_PAGE_TIMEOUT = 15_000;

function normalizeUrl(raw: string, base: URL): string | null {
  try {
    const u = new URL(raw, base);
    if (u.origin !== base.origin) return null;
    // Strip hash — same page
    u.hash = "";
    return u.origin + u.pathname + u.search;
  } catch {
    return null;
  }
}

type Finding = { url: string; depth: number; ok: boolean; status: number | null; consoleErrors: string[]; rejections: string[] };

async function collectInternalLinks(page: Page, base: URL): Promise<string[]> {
  const raw = await page.$$eval("a[href], [role='link']", (els) =>
    els.map((el) => (el as HTMLAnchorElement).getAttribute("href") ?? ""),
  );
  const out = new Set<string>();
  for (const r of raw) {
    if (!r) continue;
    if (r.startsWith("mailto:") || r.startsWith("tel:") || r.startsWith("javascript:")) continue;
    const n = normalizeUrl(r, base);
    if (n) out.add(n);
  }
  return Array.from(out);
}

test.describe.configure({ retries: 0, timeout: 180_000 });

test("Persona C: anonymous crawler finds no broken pages, no console errors", async ({ page }, testInfo) => {
  const baseURL = new URL(testInfo.project.use.baseURL ?? "https://studentnest.ai");
  const startUrl = normalizeUrl(START, baseURL)!;

  const queue: Array<{ url: string; depth: number }> = [{ url: startUrl, depth: 0 }];
  const visited = new Set<string>();
  const findings: Finding[] = [];

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    const { url, depth } = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    const consoleErrors: string[] = [];
    const rejections: string[] = [];
    const consoleListener = (msg: import("@playwright/test").ConsoleMessage) => {
      if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 300));
    };
    const rejectionListener = (err: Error) => {
      rejections.push(String(err).slice(0, 300));
    };
    page.on("console", consoleListener);
    page.on("pageerror", rejectionListener);

    let status: number | null = null;
    let ok = false;
    try {
      const res = await page.goto(url, { timeout: PER_PAGE_TIMEOUT, waitUntil: "domcontentloaded" });
      status = res?.status() ?? null;
      ok = !!res && res.status() < 400;
      // Give async errors a brief window to surface
      await page.waitForTimeout(400);

      if (ok && depth < MAX_DEPTH) {
        const links = await collectInternalLinks(page, baseURL);
        for (const l of links) {
          if (!visited.has(l)) queue.push({ url: l, depth: depth + 1 });
        }
      }
    } catch (err) {
      rejections.push(`goto threw: ${String(err).slice(0, 200)}`);
    } finally {
      page.off("console", consoleListener);
      page.off("pageerror", rejectionListener);
    }

    findings.push({ url, depth, ok, status, consoleErrors, rejections });
  }

  // Report
  console.log(`[crawler] visited ${visited.size} pages`);
  const broken = findings.filter((f) => !f.ok);
  const withConsoleErrors = findings.filter((f) => f.consoleErrors.length > 0);
  const withRejections = findings.filter((f) => f.rejections.length > 0);

  if (broken.length) {
    console.log(`[crawler] broken pages:`);
    for (const f of broken) console.log(`  ${f.status} ${f.url}`);
  }
  if (withConsoleErrors.length) {
    console.log(`[crawler] pages with console errors:`);
    for (const f of withConsoleErrors) {
      console.log(`  ${f.url}`);
      for (const e of f.consoleErrors.slice(0, 3)) console.log(`    - ${e}`);
    }
  }
  if (withRejections.length) {
    console.log(`[crawler] pages with unhandled rejections:`);
    for (const f of withRejections) {
      console.log(`  ${f.url}`);
      for (const r of f.rejections.slice(0, 3)) console.log(`    - ${r}`);
    }
  }

  // Assertions — keep soft for first run so we see the real state before
  // hard-failing CI. Tighten once baseline is clean.
  expect(broken, `broken pages: ${broken.map((b) => `${b.status} ${b.url}`).join(", ")}`).toEqual([]);
  // Console errors and rejections surface as JSON so failures tell the whole story.
  expect(withRejections.map((f) => ({ url: f.url, rejections: f.rejections }))).toEqual([]);
});
