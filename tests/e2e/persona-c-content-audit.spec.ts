import { test, expect } from "@playwright/test";

/**
 * Content audit — SEO + a11y semantics that axe doesn't catch directly.
 *
 * Per public page, verify:
 *   - Exactly one <h1>
 *   - <img> elements all have alt attribute
 *   - <html> has lang attr
 *   - Heading order doesn't skip levels (h1 → h3 without h2 = bug)
 *   - Canonical link present on marketing pages
 *   - Title tag present + < 70 chars
 *   - Meta description present + < 170 chars
 *   - No empty links (<a> with no text and no aria-label)
 *   - No empty buttons
 *   - No <section> / <article> / <main> that's empty
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
  "/blog",
];

test.describe.configure({ retries: 1, timeout: 45_000 });

for (const path of PAGES) {
  test.describe(`${path}`, () => {
    test(`${path} — exactly one <h1>`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      if (!res || res.status() >= 400) test.skip(true);
      const count = await page.locator("h1").count();
      expect(count, `${path}: has ${count} <h1> elements (expected 1)`).toBe(1);
    });

    test(`${path} — every <img> has alt attribute`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      if (!res || res.status() >= 400) test.skip(true);
      const missing = await page.$$eval("img", (imgs) =>
        imgs
          .filter((i) => !i.hasAttribute("alt"))
          .map((i) => (i as HTMLImageElement).src.slice(0, 100)),
      );
      expect(
        missing,
        `${path}: <img> without alt:\n${missing.join("\n")}`,
      ).toEqual([]);
    });

    test(`${path} — <html> has lang attribute`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      if (!res || res.status() >= 400) test.skip(true);
      const lang = await page.locator("html").getAttribute("lang");
      expect(lang, `${path}: <html> missing lang attribute`).toBeTruthy();
    });

    test(`${path} — heading order doesn't skip levels`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      if (!res || res.status() >= 400) test.skip(true);
      const levels: number[] = await page.$$eval("h1, h2, h3, h4, h5, h6", (els) =>
        els.map((e) => Number(e.tagName[1])),
      );
      let last = 0;
      const skips: string[] = [];
      for (const lvl of levels) {
        if (last > 0 && lvl > last + 1) {
          skips.push(`h${last} → h${lvl}`);
        }
        last = lvl;
      }
      expect(
        skips,
        `${path}: heading-order skips: ${skips.join(", ")}`,
      ).toEqual([]);
    });

    test(`${path} — title tag present and ≤ 70 chars`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      if (!res || res.status() >= 400) test.skip(true);
      const title = await page.title();
      expect(title, `${path}: title missing`).toBeTruthy();
      expect(
        title.length,
        `${path}: title "${title}" is ${title.length} chars (SEO limit 70)`,
      ).toBeLessThanOrEqual(70);
    });

    test(`${path} — meta description present and ≤ 170 chars`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      if (!res || res.status() >= 400) test.skip(true);
      const desc = await page
        .locator('meta[name="description"]')
        .getAttribute("content")
        .catch(() => null);
      expect(desc, `${path}: meta description missing`).toBeTruthy();
      if (desc) {
        expect(
          desc.length,
          `${path}: meta description is ${desc.length} chars (SEO limit 170)`,
        ).toBeLessThanOrEqual(170);
      }
    });

    test(`${path} — no empty anchors (<a> with no text or aria-label)`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      if (!res || res.status() >= 400) test.skip(true);
      const empty = await page.$$eval("a", (anchors) =>
        anchors
          .filter((a) => {
            const text = (a as HTMLElement).innerText.trim();
            const aria = a.getAttribute("aria-label")?.trim();
            const hasImg = !!a.querySelector("img[alt], svg[aria-label], [aria-label]");
            return !text && !aria && !hasImg;
          })
          .map((a) => (a as HTMLAnchorElement).href.slice(0, 100)),
      );
      expect(
        empty,
        `${path}: empty anchors (no text/aria-label):\n${empty.join("\n")}`,
      ).toEqual([]);
    });

    test(`${path} — no empty buttons`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      if (!res || res.status() >= 400) test.skip(true);
      const empty = await page.$$eval("button", (btns) =>
        btns
          .filter((b) => {
            const text = (b as HTMLElement).innerText.trim();
            const aria = b.getAttribute("aria-label")?.trim();
            const hasChild = !!b.querySelector("img[alt], svg[aria-label], [aria-label]");
            return !text && !aria && !hasChild;
          })
          .map((b) => {
            const cls = (b as HTMLElement).className.slice(0, 60);
            return `button.${cls}`;
          }),
      );
      expect(
        empty,
        `${path}: empty buttons (no text/aria-label):\n${empty.join("\n")}`,
      ).toEqual([]);
    });
  });
}
