import { test, expect } from "@playwright/test";

// Reproduce + measure the "billing screen flickering" the user observed
// after returning from Stripe checkout. The polling loop fetches
// /api/billing/status every 2s for up to 30s — if the page re-renders
// jarringly each poll, that's the flicker.

test.describe.configure({ retries: 1 });

test("billing page polling does not visibly flicker during success flow", async ({ page }) => {
  // Confirm we're on a FREE fixture user (so polling actually runs)
  const apiRes = await page.request.get("/api/billing/status");
  const billing = await apiRes.json();
  test.skip(billing.subscriptionTier !== "FREE", "Test fixture is already PREMIUM — polling won't engage.");

  // Track DOM mutations + visual hash over a 10s window
  await page.goto("/billing?success=1");

  // Inject a mutation observer that counts mutations to the banner area
  await page.evaluate(() => {
    (window as unknown as { __mutationCount: number }).__mutationCount = 0;
    const observer = new MutationObserver((mutations) => {
      (window as unknown as { __mutationCount: number }).__mutationCount += mutations.length;
    });
    // Watch the whole main content area
    const target = document.querySelector("main") || document.body;
    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
  });

  // Sample banner state every 500ms for 8 seconds (4 poll cycles + buffer)
  const samples: Array<{ t: number; bgClass: string; text: string }> = [];
  const banner = page.locator("[class*='border-emerald-500'], [class*='border-amber-500']").first();

  for (let i = 0; i < 16; i++) {
    await page.waitForTimeout(500);
    try {
      const el = await banner.elementHandle();
      if (!el) {
        samples.push({ t: i * 500, bgClass: "(no-banner)", text: "" });
        continue;
      }
      const cls = await el.evaluate((node) => (node as HTMLElement).className);
      const text = (await el.innerText().catch(() => "")).slice(0, 80).replace(/\s+/g, " ");
      const bgMatch = cls.match(/bg-(emerald|amber)-500\/(10|20)/);
      samples.push({ t: i * 500, bgClass: bgMatch?.[0] ?? "(none)", text });
    } catch {
      samples.push({ t: i * 500, bgClass: "(error)", text: "" });
    }
  }

  const mutationCount = await page.evaluate(
    () => (window as unknown as { __mutationCount: number }).__mutationCount,
  );

  console.log("\n── Banner samples (every 500ms) ──");
  for (const s of samples) {
    console.log(`  ${String(s.t).padStart(5)}ms  bg=${s.bgClass.padEnd(20)}  ${s.text}`);
  }
  console.log(`\nTotal DOM mutations during 8s window: ${mutationCount}`);

  // Count distinct banner backgrounds — flicker = multiple distinct values within the polling window
  const distinctBg = new Set(samples.filter((s) => s.bgClass !== "(none)" && s.bgClass !== "(no-banner)").map((s) => s.bgClass));
  console.log(`Distinct banner backgrounds observed: ${Array.from(distinctBg).join(", ")}`);

  // Soft assertion: banner background should NOT change rapidly within the polling window.
  // Acceptable: 1 distinct bg value (stable green spinner), or 2 (green spinner → green party-popper).
  // Flicker: 3+ distinct values OR back-and-forth oscillation.
  expect(distinctBg.size).toBeLessThanOrEqual(2);

  // Mutations every 2s for 8s ≈ 4 polls. Each poll causes some re-render but should be < 50 mutations.
  // If mutations > 200, we're causing noticeable thrash.
  expect(mutationCount).toBeLessThan(200);
});
