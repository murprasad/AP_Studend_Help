import { test, expect } from "@playwright/test";

/**
 * Persona C — broken-link audit.
 *
 * For a fixed list of public pages, collect every internal href and
 * HEAD-check each returns < 400. Catches stale links after rename /
 * route deletion / SEO redesign.
 *
 * Matrix row: closes several "destination 200" obligations in 10.1.
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
];

test.describe.configure({ retries: 1, timeout: 120_000 });

for (const path of PAGES) {
  test(`${path} — every internal link returns < 400`, async ({ page, request }, testInfo) => {
    const base = new URL(testInfo.project.use.baseURL ?? "https://studentnest.ai");

    const res = await page.goto(path, { waitUntil: "domcontentloaded" });
    if (!res || res.status() >= 400) {
      // Page itself is broken; reported by the crawler spec. Skip here.
      test.skip(true, `${path} returned ${res?.status()} — skipping link audit`);
      return;
    }
    // If the page redirected off-origin (e.g. /clep-prep → preplion.ai when
    // the CLEP flag is off), don't audit the destination — those links are
    // the sister site's responsibility, not ours.
    const finalUrl = new URL(res.url());
    if (finalUrl.origin !== base.origin) {
      test.skip(true, `${path} redirects off-origin to ${finalUrl.origin} — audit skipped`);
      return;
    }

    const raw: string[] = await page.$$eval("a[href]", (els) =>
      els.map((el) => (el as HTMLAnchorElement).getAttribute("href") ?? ""),
    );

    const internalLinks = new Set<string>();
    for (const href of raw) {
      if (!href) continue;
      if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
      try {
        const u = new URL(href, base);
        if (u.origin !== base.origin) continue;
        u.hash = "";
        internalLinks.add(u.origin + u.pathname + u.search);
      } catch { /* malformed href — ignore */ }
    }

    // Self-reference ok — don't refetch the page we just loaded
    internalLinks.delete(res.url().split("#")[0]);

    const broken: Array<{ href: string; status: number }> = [];
    for (const link of Array.from(internalLinks)) {
      // Use GET not HEAD — some Next.js routes don't implement HEAD and
      // return 405, which would be a false positive.
      const r = await request.get(link, { failOnStatusCode: false, maxRedirects: 5 });
      if (r.status() >= 400) broken.push({ href: link, status: r.status() });
    }

    expect(
      broken,
      `Broken internal links from ${path}:\n${broken.map((b) => `  ${b.status} ${b.href}`).join("\n")}`,
    ).toEqual([]);
  });
}
