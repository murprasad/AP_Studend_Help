import { test, expect } from "@playwright/test";

/**
 * Quality-audit cron endpoint coverage.
 *
 * /api/cron/quality-audit is Bearer-authed with CRON_SECRET and runs
 * the same 8 deterministic checks the local script runs. Verifies:
 *   1. Unauthenticated request returns 401
 *   2. Wrong secret returns 401
 *   3. Correct secret returns a summary payload with expected shape
 */

const CRON_SECRET = process.env.CRON_SECRET;

test.describe("Quality audit cron", () => {
  test("no auth → 401", async ({ request }) => {
    const r = await request.get("/api/cron/quality-audit");
    expect(r.status()).toBe(401);
  });

  test("wrong secret → 401", async ({ request }) => {
    const r = await request.get("/api/cron/quality-audit", {
      headers: { Authorization: "Bearer not-the-real-secret" },
    });
    expect(r.status()).toBe(401);
  });

  test("correct secret → summary", async ({ request }) => {
    if (!CRON_SECRET) test.skip();
    const r = await request.get("/api/cron/quality-audit", {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      timeout: 45000,
    });
    expect(r.ok()).toBe(true);
    const d = await r.json();
    expect(typeof d.scanned).toBe("number");
    expect(d.scanned).toBeGreaterThan(0);
    expect(typeof d.totalFindings).toBe("number");
    expect(typeof d.countByCode).toBe("object");
    expect(typeof d.durationMs).toBe("number");
    expect(d.quarantineEnabled).toBe(false); // default read-only
    expect(d.quarantined).toBe(0);
  });
});
