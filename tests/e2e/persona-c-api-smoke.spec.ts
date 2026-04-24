import { test, expect } from "@playwright/test";

/**
 * Persona C — API smoke: anonymous hits on every listed API route.
 *
 * Purpose: catch 500s, routing regressions, and CORS/header issues on
 * the API surface without touching auth. Anonymous expected behaviors:
 *   - auth-gated routes      → 401 (not 500)
 *   - cron-gated routes      → 401 (not 500)
 *   - public routes          → 200 or expected 4xx with JSON shape
 *   - webhooks               → 400 on missing signature (never 500)
 *
 * Matrix rows: parts of 10.9 (permission matrix) and 10.12 (error states).
 */

type ApiCheck = {
  method: "GET" | "POST";
  path: string;
  /** Valid status set — test fails if actual status not in this set. */
  ok: number[];
  /** Body payload for POST probes — keep minimal. */
  body?: Record<string, unknown>;
  /** Optional note (surfaced in failure message). */
  note?: string;
};

// All routes should land on a status code we know we've thought about.
// 405 is explicitly accepted for GET-only routes poked with POST (and
// vice versa). 400 is valid for missing-body / missing-signature.
const CHECKS: ApiCheck[] = [
  // --- Auth-gated user routes: should 401 anonymously, not 500 ---
  { method: "GET", path: "/api/user", ok: [401], note: "anonymous must 401, not 500" },
  { method: "GET", path: "/api/user/limits", ok: [401] },
  { method: "GET", path: "/api/user/sessions-count", ok: [401] },
  { method: "GET", path: "/api/billing/status", ok: [401] },
  { method: "GET", path: "/api/analytics", ok: [401] },
  { method: "GET", path: "/api/flashcards", ok: [401] },
  { method: "GET", path: "/api/flashcards/due-count", ok: [401] },
  { method: "GET", path: "/api/practice/in-progress", ok: [401] },
  { method: "GET", path: "/api/mastery-tier-ups", ok: [401] },
  { method: "GET", path: "/api/daily-goal", ok: [401] },
  { method: "GET", path: "/api/coach-plan", ok: [401] },
  { method: "GET", path: "/api/feature-flags", ok: [200, 401], note: "public-or-authed depending on feature" },
  { method: "GET", path: "/api/sage-coach/health", ok: [200, 401] },
  { method: "GET", path: "/api/ai/status", ok: [200, 401, 403] },
  // --- Anonymous-allowed public routes ---
  { method: "GET", path: "/api/auth/providers", ok: [200], note: "providers list must be public" },
  { method: "GET", path: "/api/auth/csrf", ok: [200] },
  { method: "GET", path: "/api/leaderboard", ok: [200], note: "fixed 2026-04-24 to return public top-10 anonymously" },
  // --- Admin-gated routes (must 401 / 403 for anonymous) ---
  { method: "GET", path: "/api/admin/users", ok: [401, 403] },
  { method: "GET", path: "/api/admin/settings", ok: [401, 403] },
  { method: "GET", path: "/api/admin/analytics", ok: [401, 403] },
  { method: "GET", path: "/api/admin/subscribers", ok: [401, 403] },
  { method: "GET", path: "/api/admin/quality-metrics", ok: [401, 403] },
  { method: "GET", path: "/api/admin/feedback", ok: [401, 403] },
  { method: "GET", path: "/api/admin/payment-config", ok: [401, 403] },
  { method: "GET", path: "/api/admin/backup", ok: [401, 403] },
  // --- Cron routes: must 401 without CRON_SECRET, must not 500 ---
  { method: "GET", path: "/api/cron/stripe-reconcile", ok: [401] },
  { method: "GET", path: "/api/cron/auto-populate", ok: [401] },
  { method: "GET", path: "/api/cron/daily-quiz", ok: [401] },
  { method: "GET", path: "/api/cron/onboarding-bounce", ok: [401] },
  { method: "GET", path: "/api/cron/registration-stall", ok: [401] },
  { method: "GET", path: "/api/cron/quality-audit", ok: [401] },
  { method: "GET", path: "/api/cron/trial-reengagement", ok: [401] },
  { method: "GET", path: "/api/cron/recalibrate-difficulty", ok: [401] },
  { method: "GET", path: "/api/cron/weekly-progress-digest", ok: [401] },
  // --- Webhooks: must reject gracefully, not 500 ---
  { method: "POST", path: "/api/webhooks/stripe", body: {}, ok: [400, 401], note: "missing stripe signature = 400, not 500" },
  // --- Test endpoints: must 401 without CRON_SECRET ---
  { method: "POST", path: "/api/test/auth", body: { action: "create" }, ok: [401] },
  { method: "GET", path: "/api/test/practice-check", ok: [401] },
];

test.describe.configure({ retries: 1, timeout: 45_000 });

for (const c of CHECKS) {
  test(`${c.method} ${c.path} — status ∈ {${c.ok.join(", ")}}${c.note ? " ("+c.note+")" : ""}`, async ({ request }) => {
    const res = c.method === "GET"
      ? await request.get(c.path, { failOnStatusCode: false, maxRedirects: 0 })
      : await request.post(c.path, { data: c.body ?? {}, failOnStatusCode: false, maxRedirects: 0 });
    const status = res.status();
    let bodyPreview = "";
    try {
      const t = await res.text();
      bodyPreview = t.slice(0, 300);
    } catch { /* some responses have no body */ }

    // Hard rule: never 5xx on any surface
    expect(
      status,
      `${c.method} ${c.path}: unexpected 5xx\nbody: ${bodyPreview}`,
    ).toBeLessThan(500);

    // Must land in one of the expected statuses
    expect(
      c.ok,
      `${c.method} ${c.path}: got ${status}, expected one of ${c.ok.join(",")}${c.note ? " — "+c.note : ""}\nbody: ${bodyPreview}`,
    ).toContain(status);
  });
}
