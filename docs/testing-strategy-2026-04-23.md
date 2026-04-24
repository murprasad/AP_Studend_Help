# StudentNest Testing Strategy — Comprehensive Overhaul (2026-04-23)

## Why we're rewriting this

In a single afternoon we shipped four bugs that should have been caught by tests:

1. **Webhook 500s** — Stripe API version 2025-09-30+ moved `current_period_end` to `items.data[]`. Our code crashed with `new Date(undefined * 1000)`.
2. **Webhook silent skip** — Missing `client_reference_id` from Payment Links → webhook returned 200 without updating DB.
3. **UI lied** — `/billing` showed "Welcome to Premium!" when DB tier was FREE.
4. **Infinite render loop** — `/billing?success=1` polling re-engaged on session.update(), flickering until tab close.
5. **Stripe Payment Link config** — Missing "After payment" redirect URL on 6 of 6 active payment links.

A real customer (Srinidhi) **paid and emailed support** to discover #1.
The user paid **$19.98 of personal money** to discover #2, #3, #4.
That is not a test gap — it's a test **architecture** gap.

## Current state of testing (honest)

| Layer | What exists | What's missing |
|---|---|---|
| Type-checking | ✅ `tsc --noEmit` in pre-deploy | catches type errors only |
| Lint | ✅ ESLint + react-hooks | catches code style only |
| Unit tests | ❌ none | no business-logic coverage |
| Integration tests | ⚠️ 2 scripts (`integration-tests.js`, `practice-check`) — DB-only | no payment, no auth, no webhook |
| E2E (Playwright) | ⚠️ 80 specs, mostly UI rendering | doesn't exercise payment, webhook, real $$ |
| API contract tests | ❌ none | API responses can drift from clients |
| Visual regression | ❌ none | UI changes go undetected |
| Performance | ❌ none | bundle size, page load unmeasured |
| Accessibility | ❌ none | a11y regressions ship |
| Webhook delivery | ❌ none | the source of today's pain |
| Synthetic monitoring | ❌ none | issues found by users, not us |
| Error tracking | ❌ none | client crashes invisible |

## Strategy: 7 layers, defense in depth

### Layer 1 — Static analysis (already have, improve)

**Already in place:**
- `tsc --noEmit` (strict mode TS)
- ESLint (next/core-web-vitals)
- `scripts/check-cf-compat.js` (banned imports)
- `scripts/pre-release-check.js` (pricing/version/copy invariants)

**Add:**
- **`@typescript-eslint/no-floating-promises`** — would catch unhandled async like `update()` triggering re-render storms
- **`eslint-plugin-react-hooks` strict** — already enabled, audit for `// eslint-disable react-hooks/exhaustive-deps` (each one is a flicker waiting to happen)
- **`knip`** — find dead code + unused exports (smaller surface = fewer bugs)
- **`madge --circular`** — detect circular imports

**Cost:** ~30 min, $0
**Catches:** floating promises, dependency loops, dead exports

---

### Layer 2 — Unit tests (NEW — currently 0 coverage)

**Tool:** Vitest (faster than Jest, ESM-native, no transform config)

**What to test:**
- `src/lib/tiers.ts` — `isAnyPremium`, `tierLabel`, `modulePremiumName` for every enum value
- `src/lib/courses.ts` — `getCourseConfig`, `getCourseUnits` for every registered course
- `src/lib/tier-limits.ts` — every limit value, every lock-copy string
- `src/app/api/webhooks/stripe/route.ts` — extracted `handleStripeEvent(event)` function, mocked Prisma
- All pure utility functions

**Target:** 60% line coverage of `src/lib/`, 100% on tier/payment-critical functions

**Cost:** ~3 hours initial, then ~10 min per new feature
**Catches:** logic bugs in helpers; lets us refactor with confidence

---

### Layer 3 — Stripe payment flow tests (THE missing one — top priority)

**Tools to install:**
1. `stripe` (already have)
2. **Stripe CLI** (`brew install stripe/stripe-cli/stripe` or scoop on Windows) — generates real signed test webhooks

**Setup:**
1. Create **Stripe test-mode** account (separate dashboard, separate keys)
2. Add CF Pages env vars: `STRIPE_TEST_SECRET_KEY`, `STRIPE_TEST_WEBHOOK_SECRET`, `STRIPE_TEST_PRICE_IDS`
3. Add `?testMode=1` to `/api/checkout` (admin-only — gated by user.role)
4. Wire test-mode webhook endpoint at `/api/webhooks/stripe` (existing handler, branches on event source)

**Tests:**
- `tests/payment/checkout-flow.spec.ts` — signs in as fixture user, hits `/api/checkout?testMode=1`, asserts Stripe URL returned with correct `client_reference_id`
- `tests/payment/webhook-synthetic.spec.ts` — fires properly-signed events at production endpoint with TEST secret, asserts DB updates (we have a draft already — needs production webhook secret access, OR a CRON_SECRET-gated bypass endpoint)
- `tests/payment/full-checkout-e2e.spec.ts` — Playwright drives full flow: sign-in → click Buy → `4242 4242 4242 4242` on Stripe → return → assert PREMIUM in DB

**Cost:** ~4 hours initial setup (test-mode config, env vars, code branch), ~30 min per new payment-flow test
**Catches:** every payment bug we've shipped this month + future ones

---

### Layer 4 — UI consistency tests (Playwright — extend existing)

**Already in place:** 80 Playwright specs covering UI rendering, sidebar, paywall display

**Critical additions:**
- `billing-page-consistency.spec.ts` — billing UI must NEVER claim PREMIUM when API says FREE *(written this PM)*
- `billing-flicker.spec.ts` — DOM mutation count + distinct banner backgrounds during polling window *(written this PM)*
- `paywall-accuracy.spec.ts` — paywall visibility must match `/api/billing/status` *(written this PM)*
- `cross-page-state-sync.spec.ts` — flip user PREMIUM → assert `/dashboard`, `/practice`, `/billing`, `/frq-practice` all reflect within 1s
- `polling-leak.spec.ts` — visit any page that polls; navigate away; assert no orphan setInterval handles (catches the flicker bug class)
- **`add-axe-core/playwright`** — accessibility scan on every spec (`new AxeBuilder({ page }).analyze()`)

**Cost:** ~2 hours to add 5 new specs + axe wiring
**Catches:** UI/state inconsistencies, infinite loops, a11y regressions

---

### Layer 5 — Visual regression (NEW)

**Tool:** Playwright's built-in `expect(page).toHaveScreenshot()` (free) OR Chromatic ($170/mo for higher volume)

**Recommendation:** Start with Playwright built-in — zero additional cost.

**Coverage:**
- Every public marketing page (10 pages × desktop+mobile = 20 baselines)
- Dashboard for FREE user
- Dashboard for PREMIUM user
- Billing page (FREE state, PREMIUM state, post-checkout polling state)
- Onboarding wizard (4 steps × 2 tracks = 8 baselines)
- Critical components in Storybook (see Layer 6)

**Workflow:**
- First run: `playwright test --update-snapshots` baselines
- CI: snapshot diff on every PR
- Review changes → accept new baseline OR fix regression

**Cost:** ~3 hours initial baselining + auto going forward
**Catches:** unintended UI changes (broken layouts, missing copy, color regressions)

---

### Layer 6 — Component testing (Storybook + Vitest, NEW)

**Tools:** `storybook@8`, `@storybook/test`, `@storybook/test-runner`

**Why:** Component-level tests are 10x faster than full E2E. Catches issues like the flicker bug at the component level before they reach the page.

**Setup:**
- Stories for: `BillingPage` (mocked session), `OnboardingWizard`, `PracticeSession`, `AutoLaunchNudge`, `Sidebar`, `PaywallGate`
- Each story = a state (FREE, PREMIUM, polling, error, loading)
- Visual diff via Chromatic or Playwright snapshot

**Cost:** ~6 hours initial setup, ~15 min per new component
**Catches:** component-level bugs without booting the full app

---

### Layer 7 — Production observability (NEW — critical)

**Tools:**
1. **Sentry** ($26/mo team plan, free tier 5K events/mo) — JS error tracking
2. **PostHog** ($0 self-hosted, $20/mo cloud) — product analytics + funnel tracking
3. **Better Stack / Better Uptime** ($0 starter) — synthetic monitoring (ping every 1m)
4. **Stripe webhook delivery alerts** — email when delivery success rate < 95% (Stripe-native, free)

**Production-specific tests:**
- Hourly cron: `scripts/production-payment-canary.mjs` — creates a Stripe test-mode subscription, asserts webhook fires + DB updates within 60s, then cancels and cleans up. **This is the single test that would have caught all 4 today's bugs.**
- Daily report email: counts of FREE users with `stripeSubscriptionId !== null` (paid but not credited — anomaly)

**Cost:** $26-46/mo + ~3 hours setup
**Catches:** anything that breaks in production in real time

---

## Process changes

### Pre-merge gates (blocking)
1. `tsc --noEmit` passes
2. ESLint passes
3. Vitest unit tests pass
4. Playwright authed-flows pass (no flake retries)
5. **NEW:** Synthetic webhook test passes
6. **NEW:** Visual regression: 0 unapproved diffs

### Pre-deploy gates (blocking)
1. All pre-merge gates
2. **NEW:** Full Stripe payment flow test in test mode passes
3. **NEW:** Production-payment-canary passes against current main
4. Smoke tests pass against newly-deployed worker

### Post-deploy
1. **NEW:** Sentry release tracking
2. **NEW:** PostHog feature flag rollout (canary 10% → 50% → 100%)
3. Existing: deploy notification email

### Weekly hygiene
1. Review Sentry top errors
2. Review Stripe webhook delivery rate
3. Review PostHog funnel drop-offs
4. Update Playwright baselines if intentional UI changes

---

## Tooling install list (your approval)

| Tool | Cost | What it catches | Setup time |
|---|---|---|---|
| Vitest | $0 | Unit-test gap | 1h |
| Stripe CLI | $0 | Real signed webhook events locally | 15min |
| `@axe-core/playwright` | $0 | A11y regressions | 30min |
| `knip` | $0 | Dead code | 15min |
| Storybook 8 | $0 | Component-level bugs | 6h |
| Sentry (free tier 5K events) | $0 | Client crashes | 1h |
| PostHog cloud (free 1M events) | $0 | Funnel drop-offs | 1h |
| Better Stack | $0 | Uptime monitoring | 30min |
| Stripe webhook alerts | $0 | Webhook failure rate | 5min |
| `lighthouse-ci` | $0 | Perf regressions | 1h |
| **Total monthly cost: $0** | | (Sentry tier auto-bumps to $26/mo at scale) | |

---

## Phased rollout (recommend)

**Phase 1 (today, 4 hours):** Stripe CLI + test-mode webhook + production-payment-canary cron + the 3 missing UI tests we drafted today.
- **This single phase prevents recurrence of every bug shipped today.**

**Phase 2 (next 2 days, 8 hours):** Vitest + critical unit tests for `src/lib/` + `@axe-core/playwright` + `knip` cleanup.

**Phase 3 (next week, 8 hours):** Sentry + PostHog + Better Stack + visual regression baselining.

**Phase 4 (ongoing):** Storybook for new components, Lighthouse CI, weekly hygiene.

---

## Decision needed from you

1. **Approve Phase 1 work?** (zero new tools cost, ~4 hours of my time)
2. **Approve Phase 2 install list?** (zero cost, opens up unit + a11y testing)
3. **Approve Phase 3 SaaS signups?** (Sentry, PostHog, Better Stack — all free tier to start)
4. **Want full bundle now or phase-by-phase with checkpoints?**
