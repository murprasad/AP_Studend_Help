# StudentNest E2E Master Test Plan

**Locked:** 2026-04-24
**Owner:** Engineering (all contributors)
**Supersedes partially:** `docs/testing-strategy-2026-04-23.md` (strategy) and `docs/path-coverage-matrix.md` (contract)
**Scope:** every page, every CTA, every API route, every feature, every plan transition, every role, every race condition, every error state.
**Non-negotiable premise:** truth-mode review confirmed quality is poor. Real customers surfaced bugs; real user money ($19.98) discovered more. Untested paths in production are bugs waiting to surface. This plan closes the gap.

---

## 0. How to use this document

1. Section 9 is the **feature inventory** — the exhaustive list of routes, sidebar items, API routes, and features.
2. Section 10 is the **path-coverage matrix** — every row must map to a passing spec. Status legend: ✅ passing · 🟡 partial · ❌ missing · 🔵 not yet shipped.
3. Section 13 is the **phased rollout** — ship tests in this order. No shortcuts.
4. Section 12 is the **cadence** — when each layer runs.
5. All new code must update Section 10 (add a row + spec) before merge.

---

## 1. Executive summary

StudentNest ships to production in a single-workflow deploy (`npm run pages:deploy`). The existing suite is 14 Playwright specs + 3 Vitest files. The codebase has **44 page routes**, **86 API routes**, **10 sidebar features**, **4 registration tracks**, **22 courses**, **3 tiers × 4 modules = 12 plan states**, and a payment surface touching Stripe webhooks + reconcile cron + customer portal + per-module subscriptions. Current coverage by the path matrix: **~5.7%**. Target: **36% in 1 week, 71% in 1 month, 93% in 3 months**.

This plan structures every missing spec into 17 numbered matrices under Section 10, each with explicit 4-dimension assertions (functional, copy, visual, state). It also wires observability (Sentry, Better Stack, Stripe canary) so bugs that slip the net are caught in < 1 hour, not discovered by paying customers.

---

## 2. Why this plan exists (a short, honest history)

In the 48 hours before this plan was written:

1. **Webhook 500s** — Stripe API version 2025-09-30+ moved `current_period_end` to `items.data[]`. Our code crashed with `new Date(undefined * 1000)`. A real customer (Srinidhi) paid and emailed support to discover this.
2. **Webhook silent skip** — Missing `client_reference_id` from Stripe Payment Links → webhook returned 200 without updating DB. No test.
3. **UI lied** — `/billing` showed "Welcome to Premium!" when DB tier was FREE. No test.
4. **Infinite render loop** — `/billing?success=1` polling re-engaged on `session.update()`, flickering until tab close. No test.
5. **Onboarding bounce loop** — middleware redirect used stale JWT, users bounced back to `/onboarding` after completing it. No test.
6. **Flashcards course flash** — async localStorage read caused AP Chemistry users to briefly see AP World History flashcards. No test.

Each bug has a class. Every class is now represented in a matrix row below. If we had this plan on 2026-04-22, every bug on that list would have been caught before deploy.

---

## 3. Guiding principles (non-negotiable)

### 3.1 The 4-dimension assertion contract

Every path test **must** verify all four dimensions. A spec that asserts only #1 is a fake spec.

| # | Dimension | Example assertion |
|---|-----------|-------------------|
| 1 | **Functional success** | route navigated, DB row changed, API returned 200, webhook event logged |
| 2 | **Message correctness** | copy on screen matches intent — "Welcome to Premium!" ONLY appears when DB tier is actually PREMIUM |
| 3 | **Visual correctness** | success=green, warning=amber, error=red; banner above fold; modal centered; button text legible in both themes |
| 4 | **State consistency** | every surface (sidebar badge, dashboard card, billing UI, paywall visibility) reflects the same server-truth within 1s |

### 3.2 Fixture discipline

The "first-time user" fixture **must** have `onboardingCompletedAt: null`. Any fixture that lies about user state will ship bugs — that's exactly how the onboarding bounce loop reached production. Every fixture carries a one-line comment stating what it represents.

### 3.3 Path coverage is a contract, not a suggestion

Every navigable path in Section 10 = one row. Every row → exactly one spec. `scripts/audit-path-coverage.mjs` runs in `pre-release-check.js` and reports matrix rows with no corresponding test. Target is **zero ❌** in categories 1, 2, 3, 5, 6, 9 before a feature merge touching those areas.

### 3.4 Tests run against deployed URL by default

Playwright's `baseURL` is `https://studentnest.ai`. Preview URL support via `E2E_BASE_URL`. Tests target the actual Cloudflare Workers runtime, not Node.js dev — this is how we catch CF Workers-specific regressions (banned imports, Prisma WASM failures, edge timing).

### 3.5 No solo merges on payment / auth / billing code

Code review by a second human OR rigorous AI checklist review. No exceptions. Every previous billing bug shipped solo.

---

## 4. Scope

### In scope
- All 44 page routes (marketing, auth, dashboard, admin)
- All 86 API routes (auth, billing, AI, cron, admin, community, flashcards, frq, practice, sage-coach, diagnostic)
- All sidebar features (10 items)
- All marketing CTAs and entry points
- All Stripe flows: checkout (monthly/annual), Payment Links, customer portal, webhooks, reconcile cron
- All plan transitions (Free ↔ Premium × AP/SAT/ACT/CLEP modules)
- Every `FREE_LIMITS` row in `src/lib/tier-limits.ts`
- All role paths: anonymous, STUDENT, ADMIN
- Race conditions on every page that polls or has a timer
- Mobile + tablet viewports for public + high-traffic authed pages
- Accessibility (WCAG 2.1 AA) on every public page and every authed top-level page
- Visual regression for every public page + critical authed pages
- Performance budgets for LCP, TBT, bundle size

### Out of scope (this plan)
- Load / stress testing (separate infra plan)
- Security pen testing (separate engagement)
- Content correctness of AI-generated questions (handled by `ap-audit` and `ap-review` scripts)
- Internationalization (product is English-only today)

---

## 5. Quality SLOs

| SLO | Target | Measurement |
|-----|--------|-------------|
| Conversion bug detection time | < 1 hour | Stripe canary + Sentry alert → PagerDuty equivalent |
| Deployment failure rate | < 5% | `pages:deploy` exit code over rolling 20 deploys |
| Customer-reported bugs | < 1 / week | Contact email + Sentry tag "customer-reported" |
| Webhook success rate | > 99% | Stripe dashboard delivery metric |
| Mean time to recovery (billing) | < 30 min | First-seen → restored |
| Path-matrix coverage | 36% (w1) → 71% (m1) → 93% (m3) | `scripts/audit-path-coverage.mjs` |
| Test flake rate | < 2% | failures-per-run across retries |

---

## 5.5 Persona-driven exploration (the spec authoring lens)

Every matrix row maps to one of three personas. If we can't say which persona hits a row, the row is probably an implementation-internal test and doesn't belong in E2E.

### Persona A — First-time signup (Nawal, Srinidhi)

**Mental model:** "What is this? Show me. Don't make me commit yet."

**Journey:** Google search → lands on `/` → reads hero → clicks "Start AP Prep — Free" → `/register?track=ap` → fills form (or uses Google OAuth) → `/verify-email` (or bypass in dev) → `/onboarding` 4 steps → picks Free → `/dashboard` → clicks every sidebar item out of curiosity → tries a practice question → maybe tries Sage → maybe clicks "Upgrade" out of interest → backs out.

**Specific bugs this persona has already found (real):**
- Middleware bounce loop after onboarding (mid-journey abandonment)
- Flashcards showing wrong course on first load
- `/billing?success=1` infinite flicker after upgrade
- `/onboarding` steps not saving state on refresh

**Tests in this class:**
- `persona-a-full-journey.spec.ts` — single linear spec that walks the whole path, 4-dim assert at every step
- `persona-a-landing-cta-branches.spec.ts` — one spec per CTA branch on `/` (Section 10.1.1)
- `persona-a-oauth-google-new-user.spec.ts`
- `persona-a-register-with-track-param.spec.ts` — 4 tracks
- `persona-a-onboarding-abandon-resume.spec.ts`
- `persona-a-first-question-completion.spec.ts` — from dashboard → practice → answer Q1 → see result

**Fixture:** `first-time-student`. Every spec resets it first.

### Persona B — Returning user (daily habit)

**Mental model:** "I have 20 minutes. Get me to my streak."

**Journey:** Direct nav to `/login` → credentials or OAuth → lands on `/dashboard` → sees streak + daily goal → clicks "Practice" → does 5 questions → checks `/analytics` → checks `/study-plan` → logs out.

Free-tier version hits limits mid-day (practice cap 20, tutor cap 3). Premium version does not.

**Specific bugs this persona has found:**
- Webhook silent skip — user paid, app says FREE
- `/billing` saying "Welcome to Premium!" while API reports FREE
- Stale tier after manual admin flip

**Tests:**
- `persona-b-free-daily-loop.spec.ts`
- `persona-b-premium-daily-loop.spec.ts`
- `persona-b-free-hits-practice-cap.spec.ts`
- `persona-b-free-hits-tutor-cap.spec.ts`
- `persona-b-premium-cancel-then-reactivate.spec.ts`
- `persona-b-cross-device-session.spec.ts` — login on one context, see same state on another

**Fixtures:** `returning-free`, `returning-premium-ap`, `premium-canceling`.

### Persona C — Feature explorer ("clicks everything visible")

**Mental model:** "I'm poking at this app. What does every button do?"

This is the persona that breaks production. They're not following a script — they're DFS'ing the clickable DOM.

**Approach:** auto-generate a crawler spec that enumerates every `<a>`, `<button>`, `[role=link]`, `[role=button]`, `[role=tab]`, `[onclick]` on every reachable page, then clicks it and asserts: (a) destination renders 200, (b) no console errors, (c) no unhandled promise rejections, (d) a11y scan clean, (e) back-navigation restores prior state.

**Implementation:** `tests/e2e/persona-c-crawler.spec.ts` + `tests/e2e/helpers/crawler.ts`.

```ts
// helpers/crawler.ts — sketch
export async function crawl(page: Page, start: string, visited: Set<string>) {
  if (visited.has(start)) return;
  visited.add(start);
  await page.goto(start);

  // Collect every clickable element
  const targets = await page.$$eval(
    'a[href], button, [role="link"], [role="button"], [role="tab"]',
    (els) => els.map((el) => ({
      tag: el.tagName,
      href: (el as HTMLAnchorElement).href ?? null,
      text: (el.textContent ?? "").trim().slice(0, 80),
      dataTestid: (el as HTMLElement).dataset.testid ?? null,
    }))
  );

  for (const t of targets) {
    // Skip external, mailto, tel, anchor-only
    if (!shouldFollow(t, start)) continue;
    // Click, assert, recurse depth-limited
  }
}
```

**Coverage target:** every internal link reachable within 4 clicks of `/` (anonymous) and `/dashboard` (each fixture). Run nightly, not per-PR (long-running). Maintains a "known-paths.json" snapshot; failure = new unreviewed surface appeared (or an old one broke).

**This is the test that catches the bugs we can't predict.**

### Persona matrix — how it maps to Section 10

| Persona | Categories primarily covered |
|---------|-------------------------------|
| A — First-time | 10.1, 10.2, 10.3, 10.13 mobile, 10.14 a11y |
| B — Returning | 10.4, 10.5, 10.6, 10.7, 10.8 |
| C — Explorer | 10.1 (breadth), 10.12 error states, 10.17 security, continuous discovery |

---

## 6. Test pyramid & tooling per layer

```
                    ┌──────────────────────────┐
                    │  Synthetic canaries      │  — Stripe canary cron, uptime pings
                    │  Observability           │  — Sentry, Better Stack, Stripe alerts
                    ├──────────────────────────┤
                    │  E2E (Playwright)        │  — 14 → ~300 specs, path matrix
                    ├──────────────────────────┤
                    │  Visual regression       │  — Playwright toHaveScreenshot
                    ├──────────────────────────┤
                    │  Accessibility           │  — @axe-core/playwright on every spec
                    ├──────────────────────────┤
                    │  Integration             │  — scripts/integration-tests.js + /api/test/practice-check
                    ├──────────────────────────┤
                    │  Unit (Vitest)           │  — 45 → 200+ tests, src/lib coverage ≥ 80%
                    ├──────────────────────────┤
                    │  Static analysis         │  — tsc, eslint, knip, madge, check-cf-compat, pre-release-check
                    └──────────────────────────┘
```

### Tooling — already installed

| Tool | Version | Where | Purpose |
|------|---------|-------|---------|
| Playwright | ^1.59.1 | `@playwright/test` | E2E browser automation |
| @axe-core/playwright | ^4.11.2 | devDeps | WCAG accessibility scans |
| Vitest | ^4.1.5 | devDeps | Unit tests |
| @vitest/coverage-v8 | ^4.1.5 | devDeps | Coverage reports |
| knip | ^6.6.2 | devDeps | Dead code detection |
| @sentry/nextjs | ^10.50.0 | deps | Client + server error tracking |
| Stripe SDK | ^16.12.0 | deps | Webhook signature verification |
| wrangler | ^4.72.0 | deps | CF Pages deploys, dev runtime |

### Tooling — must install

| Tool | Purpose | Setup time |
|------|---------|------------|
| Stripe CLI | Signed webhook replay locally | 15 min |
| madge | Circular import detection | 10 min |
| lighthouse-ci | Performance budgets | 1 h |
| @typescript-eslint/no-floating-promises | Catch unhandled async | 10 min |

### Tooling — external services

| Service | Cost | Purpose | Status |
|---------|------|---------|--------|
| Sentry (team plan free tier 5K events/mo) | $0 | Client error tracking | DSN live in CF Pages env, needs verification |
| Better Stack starter | $0 | Uptime monitoring | Not set up |
| Stripe test mode | $0 | End-to-end payment canary | Not set up |
| Stripe webhook delivery alerts | $0 | Alert when delivery rate < 95% | Native Stripe feature, not configured |

---

## 6.1 Industry-standard tooling survey (evaluation + decisions)

The previous strategy under-tooled the stack. Below is a layer-by-layer survey of the category leaders, the decision for StudentNest, and why. Goal: match or exceed what a mature SaaS shop would run.

### 6.1.1 E2E browser automation

| Tool | Pros | Cons | Decision |
|------|------|------|----------|
| **Playwright** | Multi-browser, auto-wait, traces, fastest CI runs, Microsoft-backed, first-class CF Workers compat | Newer community | ✅ **Chosen** (already installed) |
| Cypress | Great DX, time-travel debugger, huge community | Chromium-family only until v13, slower CI, iframe/multi-origin pain | Rejected |
| Selenium / WebdriverIO | Language-agnostic, max browser coverage | Slower, flakier, more boilerplate | Rejected |
| Puppeteer | Low-level, fast | No built-in test runner, no multi-browser | Rejected |
| TestCafe | No WebDriver dep, multi-browser | Smaller ecosystem | Rejected |

### 6.1.2 Unit / integration

| Tool | Pros | Cons | Decision |
|------|------|------|----------|
| **Vitest** | ESM-native, 10× faster than Jest, Vite-based, compatible with Jest API | Younger | ✅ **Chosen** (installed) |
| Jest | De-facto standard | Slow, CJS-first, config-heavy | Rejected |
| Node's built-in `node:test` | Zero deps | Limited assertion/mock API | Rejected |
| **fast-check** (property-based) | Finds edge cases humans miss | Learning curve | ✅ **Add** for tier-limits, pricing calc, URL parser code |
| **Stryker** (mutation testing) | Measures test quality, not just coverage | Slow | 🟡 **Add post-Phase 6** — only on `src/lib/` critical modules |

### 6.1.3 API / contract testing

| Tool | Pros | Cons | Decision |
|------|------|------|----------|
| **Supertest + Vitest** | Lightweight, inline with unit tests | Same-process only | ✅ **Add** for Next.js route handlers |
| **Schemathesis** (OpenAPI fuzzer) | Generates thousands of edge-case requests from schema | Requires OpenAPI spec | 🟡 **Add** once we ship `zod-to-openapi` on API routes |
| **Pact** (consumer-driven contracts) | Catches breaking changes between UI ↔ API | Overkill for monolith | Deferred — revisit if mobile app ships |
| Postman / Newman | Nice UI for manual API poking | Runner is less CI-friendly than code | Dev-tool only, not CI |
| **Bruno** | Postman-alternative, git-friendly | Younger | Dev-tool alternative |

### 6.1.4 Visual regression

| Tool | Pros | Cons | Decision |
|------|------|------|----------|
| **Playwright `toHaveScreenshot()`** | Free, built-in, git-native baselines | Manual baseline review UI | ✅ **Chosen** for Phase 6 |
| Chromatic | Best-in-class review UI, Storybook-native | $149+/mo once scaled | Revisit at scale |
| Percy (BrowserStack) | Mature, good review UI | $149+/mo | Revisit at scale |
| Applitools Eyes | AI-diffing (ignores dynamic regions automatically) | $500+/mo | Too expensive for current stage |

### 6.1.5 Accessibility

| Tool | Pros | Cons | Decision |
|------|------|------|----------|
| **@axe-core/playwright** | Deque axe-core engine, WCAG 2.1 AA, zero config | Only finds ~40% of a11y issues (the automatable ones) | ✅ **Chosen** (installed) |
| Pa11y | CLI-friendly, CI-ready | Weaker rules engine than axe | Redundant with axe |
| Lighthouse (a11y audit) | Part of perf workflow anyway | Subset of axe | ✅ **Add** via Lighthouse CI (Phase 7) |
| Storybook a11y addon | Component-level a11y | Needs Storybook | Future — pair with component tests |
| Manual NVDA / VoiceOver | Finds the 60% axe misses | Can't automate | 🟡 **Add** as monthly manual checklist |

### 6.1.6 Performance

| Tool | Pros | Cons | Decision |
|------|------|------|----------|
| **Lighthouse CI** | Per-PR perf budgets, Google-backed | Single-machine variance | ✅ **Chosen** for Phase 7 |
| WebPageTest | Real browser, real network, waterfall UI | Slower, manual | 🟡 Monthly spot-check |
| SpeedCurve / Calibre | Continuous monitoring | $100+/mo | Defer until scaled |
| **k6** (load / stress) | Go-based, great DX, Grafana-native | Newer than JMeter | ✅ **Add** in Phase 7+ for `/api/practice`, `/api/ai/tutor` |
| Artillery | Node-based, YAML configs | Less mature dashboards | k6 wins |
| JMeter | Battle-tested | Heavy GUI, XML configs | Rejected |

### 6.1.7 Security

| Tool | Pros | Cons | Decision |
|------|------|------|----------|
| **Semgrep** | SAST with excellent rule sets for Next.js, OWASP, secrets | Some FPs | ✅ **Add** in Phase 7 |
| Snyk | Great vuln DB, auto-PRs for deps | Paid tier for advanced | ✅ **Free tier** for dep-scanning |
| **OWASP ZAP** | Full DAST scanner (SQLi, XSS, etc.) | Slow, baseline run only for CI | ✅ **Add** as nightly job in Phase 7 |
| GitGuardian | Leaked-secret detection in history | Paid above free tier | ✅ **Free tier** via GitHub App |
| `npm audit` | Built-in | Noisy, high FP rate | Already have; unblock only on critical |
| Burp Suite Community | Manual pen testing | Manual | Monthly spot-check |

### 6.1.8 Observability (errors, tracing, analytics)

| Tool | Pros | Cons | Decision |
|------|------|------|----------|
| **Sentry** | Best-in-class JS errors, source maps, perf, session replay | Free tier 5K events/mo | ✅ **Chosen** (DSN live) |
| Datadog RUM | Best if already on Datadog | $$$ | Revisit at scale |
| Bugsnag / Honeybadger | Solid alternatives | Comparable, no added value over Sentry | Rejected |
| **PostHog** | Product analytics + funnels + feature flags + session replay, OSS | Self-host for max savings | ✅ **Add** Phase 5 |
| Mixpanel / Amplitude | Strong funnels | Expensive | Rejected |
| **Better Stack** (uptime) | Free starter, status pages, heartbeats | — | ✅ **Chosen** Phase 5 |
| Pingdom / UptimeRobot | Alternatives | Comparable free tiers | Rejected in favor of BS |
| **Checkly** | Playwright-based synthetic monitoring in prod | Paid beyond 10K runs | ✅ **Add** Phase 5 — runs our actual specs against prod |

### 6.1.9 Mocking / API interception

| Tool | Pros | Cons | Decision |
|------|------|------|----------|
| **MSW (Mock Service Worker)** | Same mocks usable in unit + E2E + dev | — | ✅ **Add** Phase 2 — mocks Stripe, Groq, Google OAuth for deterministic tests |
| nock | Node-only, mature | Unit-test-only reach | Rejected (MSW wider) |
| Playwright `page.route()` | Per-test interception | No cross-test reuse | Use alongside MSW for spec-local overrides |

### 6.1.10 Code quality / dead code

| Tool | Pros | Cons | Decision |
|------|------|------|----------|
| **tsc --noEmit** | Type correctness | — | ✅ Chosen (installed) |
| **ESLint + next/core-web-vitals** | Lint + hooks rules | — | ✅ Chosen |
| **@typescript-eslint/no-floating-promises** | Catches unhandled async | — | ✅ **Add** Phase 1 |
| **knip** | Dead export / file detection | FPs on dynamic imports | ✅ Chosen (installed) |
| **madge --circular** | Detects circular deps | — | ✅ **Add** Phase 1 |
| **ts-prune** | Alternative to knip | knip is superior | Rejected |

### 6.1.11 Flake management

| Tool | Purpose | Decision |
|------|---------|----------|
| Playwright retries + trace on failure | Already have | ✅ Chosen |
| **Currents.dev** | Parallelization + flake analytics for Playwright | Paid; revisit at scale |
| **allure-report** | Rich HTML reports with trend | ✅ **Add** Phase 8 for flake trend visibility |

### 6.1.12 AI-assisted testing (newer category, worth piloting)

| Tool | Purpose | Decision |
|------|---------|----------|
| **CodiumAI / Qodo** | Auto-generate unit tests from code | 🔬 Pilot on `src/lib/` |
| **Keploy** | Record-replay API tests from real traffic | 🔬 Pilot — captures real prod traffic to seed specs |
| **Mabl / testRigor** | AI-driven E2E (flaky, but low-code) | Rejected — Playwright + deterministic fixtures is better |

### Summary — full chosen stack

| Layer | Tool | Status |
|-------|------|--------|
| E2E | Playwright | ✅ installed |
| Unit | Vitest | ✅ installed |
| Property-based | fast-check | ➕ add Phase 2 |
| Mutation | Stryker | ➕ add Phase 6+ on lib/ |
| API handler tests | Supertest + Vitest | ➕ add Phase 1 |
| Contract (fuzz) | Schemathesis | ➕ add post-OpenAPI |
| Visual | Playwright screenshots | ➕ baselines Phase 6 |
| A11y auto | @axe-core/playwright | ✅ installed |
| A11y manual | NVDA / VoiceOver monthly | ➕ operational |
| Perf | Lighthouse CI | ➕ add Phase 7 |
| Load | k6 | ➕ add Phase 7 |
| SAST | Semgrep | ➕ add Phase 7 |
| Dep vuln | Snyk free | ➕ add Phase 7 |
| DAST | OWASP ZAP nightly | ➕ add Phase 7 |
| Secrets | GitGuardian free | ➕ Phase 7 |
| Errors | Sentry | 🟡 DSN live, verify |
| Analytics | PostHog | ➕ add Phase 5 |
| Uptime | Better Stack | ➕ add Phase 5 |
| Synthetic | Checkly | ➕ add Phase 5 |
| Mocking | MSW | ➕ add Phase 2 |
| Lint | ESLint + plugins | ✅ installed |
| Dead code | knip + madge | ✅/➕ Phase 1 |
| Reports | allure-report | ➕ Phase 8 |
| Ongoing a11y pilot | manual SR testing | ongoing |

---

## 7. Test environments & data

| Environment | URL | Purpose | Reset cadence |
|-------------|-----|---------|----------------|
| **Production** | https://studentnest.ai | Real users. Smoke + canary only. | Never |
| **Preview (CF Pages)** | https://studentnest.pages.dev | Every PR/commit deploy. Primary E2E target for pre-merge. | Per deploy |
| **Stripe test mode** | studentnest.ai (same host, test keys) | Full checkout canary. Isolated via `?testMode=1` query param gated by user role. | Daily cleanup cron |
| **Local dev** | http://localhost:3000 | Unit tests, fast iteration. | Per developer |

Data strategy:
- **Test user pool:** `murprasad+e2e-test1..10@gmail.com`, password `TestE2E-2026!`. Pool provisioned idempotently by `/api/test/auth` (CRON_SECRET-gated).
- **Test user reset:** `/api/admin/reset-test-users` wipes progress + flips tier back to FREE + clears `onboardingCompletedAt`. Runs before the authed suite in `pages:deploy`.
- **Fresh-fixture spec:** `first-time-user-real.spec.ts` uses a dedicated user with `onboardingCompletedAt: null`, provisioned fresh per-run.

---

## 8. Fixtures (the most important section)

Each fixture below carries a fixed seed of user state. If a spec needs a different state, it creates a **new fixture** — it does not mutate a shared one.

| Fixture name | `subscriptionTier` | `onboardingCompletedAt` | ModuleSubscription | Practice/tutor counts | Use in |
|--------------|---------------------|--------------------------|---------------------|------------------------|--------|
| **anonymous** | N/A | N/A | N/A | N/A | public-paths specs |
| **first-time-student** | FREE | `null` | none | 0 | onboarding flow, bounce-loop, registration |
| **returning-free** | FREE | `<ISO>` | none | 5 today | sidebar nav, paywall visibility, analytics diagnosis |
| **free-at-practice-cap** | FREE | `<ISO>` | none | 20 today | limit-hit paywall (practice) |
| **free-at-tutor-cap** | FREE | `<ISO>` | none | 3 tutor today | limit-hit paywall (tutor) |
| **free-at-frq-attempt** | FREE | `<ISO>` | none | 1 lifetime FRQ | FRQ 2nd-attempt block |
| **returning-premium-ap** | AP_PREMIUM | `<ISO>` | ap=active | any | premium sidebar, unlimited practice, full analytics |
| **returning-premium-annual** | AP_PREMIUM | `<ISO>` | ap=active (annual) | any | cancel, annual→monthly switch |
| **premium-canceling** | AP_PREMIUM | `<ISO>` | ap=canceling | any | reactivate flow, canceling-state banner |
| **premium-multi-module** | AP+SAT_PREMIUM | `<ISO>` | ap+sat=active | any | multi-module sidebar, per-module cancel |
| **admin** | any | `<ISO>`, role=ADMIN | any | any | admin dashboard, admin API, permission matrix |
| **diagnostic-cooldown** | FREE | `<ISO>` | none | diagnostic done 2d ago | cooldown paywall (14-day gate) |

Fixture provisioning lives in `/api/test/auth` (action=`create|reset|set-state`) and new actions are added as new fixtures come online.

---

## 9. Complete feature inventory

### 9.1 Public / marketing pages (19 routes)

| Route | Purpose | CTA count |
|-------|---------|-----------|
| `/` | Landing | 18 |
| `/pricing` | Pricing + FAQ | 5 |
| `/about` | About + release history | 2 |
| `/terms` | Legal (static) | 0 |
| `/privacy` | Legal (static) | 0 |
| `/contact` | Contact form | 1 |
| `/blog` | Blog index | 1 |
| `/faq` | FAQ | 0 |
| `/methodology` | Science behind Sage | 1 |
| `/ap-prep` | AP track landing | 5 |
| `/ap-prep/[slug]` | Per-AP-course marketing | 3 |
| `/sat-prep` | SAT track landing | 4 |
| `/act-prep` | ACT track landing | 4 |
| `/clep-prep` | CLEP track landing | 4 |
| `/clep-prep/[slug]` | Per-CLEP-course marketing | 3 |
| `/dsst-prep` | DSST track landing | 4 |
| `/dsst-prep/[slug]` | Per-DSST-course marketing | 3 |
| `/how-hard-is/[slug]` | SEO exam-difficulty page | 2 |
| `/am-i-ready` / `/am-i-ready/[slug]` | Readiness quiz | 2 + quiz-complete |
| `/pass-rates` | Pass rate SEO | 2 |
| `/wall-of-fame` | Testimonials | 2 |

### 9.2 Auth pages (4 routes)

| Route | Flow |
|-------|------|
| `/login` | Email/password + Google OAuth |
| `/register` | Email/password + Google OAuth; accepts `?track=ap\|sat\|act\|clep` |
| `/verify-email` | Token-based confirm |
| `/forgot-password`, `/reset-password` | Reset flow |

### 9.3 Dashboard / student features (17 routes)

| Route | Feature | Tier gating |
|-------|---------|-------------|
| `/onboarding` | 4-step wizard | Required pre-dashboard |
| `/dashboard` | Landing (cards, streak, daily goal) | All tiers |
| `/practice` | MCQ practice engine | 20/day free cap |
| `/flashcards` | Spaced repetition | SM-2 premium-only |
| `/diagnostic` | Gap finder | 14-day cooldown free |
| `/mock-exam` | Timed full-length simulation | 5 q/exam free |
| `/frq-practice` | Free-response AI scoring | 1 attempt lifetime free |
| `/ai-tutor` | Chat (Sage) | 3/day free |
| `/sage-coach` | AI coaching plan | Deep plan premium-only |
| `/community` | Discussion threads | All tiers |
| `/analytics` | Charts + mastery heatmap | Prescription premium-only |
| `/study-plan` | Personalized plan | Premium-only personalization |
| `/resources` | Content hub | All tiers |
| `/warmup` | Daily warm-up quiz | All tiers |
| `/billing` | Plan mgmt + Stripe portal | All tiers |

### 9.4 Admin (2 routes)

| Route | Subpages |
|-------|----------|
| `/admin` | Monitor tabs (overview, users) |
| `/admin/manage` | Manage tabs (question bank, coverage, config) |

### 9.5 API surface (86 routes, grouped)

| Group | Routes |
|-------|--------|
| Auth | `/api/auth/[...nextauth]`, `/api/auth/register`, `/api/auth/verify-email`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/check-verified` |
| Billing | `/api/billing/status`, `/api/billing/portal`, `/api/billing/cancel`, `/api/checkout`, `/api/webhooks/stripe` |
| User | `/api/user`, `/api/user/exam-date`, `/api/user/limits`, `/api/user/sessions-count`, `/api/user/conversion-signal` |
| Practice / FRQ | `/api/practice`, `/api/practice/[id]`, `/api/practice/in-progress`, `/api/practice/feedback`, `/api/frq`, `/api/frq/[id]`, `/api/frq/[id]/submit` |
| AI | `/api/ai/tutor`, `/api/ai/tutor/stream`, `/api/ai/tutor/image`, `/api/ai/tutor/knowledge-check`, `/api/ai/hint`, `/api/ai/generate`, `/api/ai/bulk-generate`, `/api/ai/status` |
| Sage coach | `/api/sage-coach/question`, `/api/sage-coach/probe`, `/api/sage-coach/evaluate`, `/api/sage-coach/health`, `/api/chat/sage`, `/api/coach-plan` |
| Diagnostic / readiness | `/api/diagnostic`, `/api/diagnostic/complete`, `/api/readiness`, `/api/am-i-ready-quiz`, `/api/am-i-ready-save` |
| Flashcards | `/api/flashcards`, `/api/flashcards/review`, `/api/flashcards/due-count` |
| Community | `/api/community/threads`, `/api/community/threads/[id]/replies`, `/api/community/ai-tutor` |
| Analytics | `/api/analytics`, `/api/analytics/dashboard-event`, `/api/leaderboard`, `/api/mastery-goal`, `/api/mastery-tier-ups`, `/api/daily-goal`, `/api/daily-quiz-track` |
| Resources | `/api/resources/search`, `/api/resources/content`, `/api/review`, `/api/questions`, `/api/questions/[id]/report` |
| Cron | `/api/cron/auto-populate`, `/api/cron/daily-quiz`, `/api/cron/onboarding-bounce`, `/api/cron/registration-stall`, `/api/cron/recalibrate-difficulty`, `/api/cron/stripe-reconcile`, `/api/cron/quality-audit`, `/api/cron/trial-reengagement`, `/api/cron/weekly-progress-digest` |
| Admin | `/api/admin/analytics`, `/api/admin/users`, `/api/admin/settings`, `/api/admin/feedback`, `/api/admin/quality-metrics`, `/api/admin/subscribers`, `/api/admin/payment-config`, `/api/admin/backup`, `/api/admin/populate-questions`, `/api/admin/mega-populate`, `/api/admin/reset-test-users` |
| Test | `/api/test/auth`, `/api/test/practice-check` |
| Misc | `/api/auto-launch-check`, `/api/feature-flags`, `/api/parent-invite`, `/api/study-plan` |

---

## 10. Path-coverage matrix (comprehensive)

The matrix below **supersedes** `docs/path-coverage-matrix.md` after being migrated in. Categories 1–9 expand existing sections; 10–17 are new and close holes that shipped bugs this week.

### 10.1 Public entry-point matrix

For every public page, every CTA is one row. Assert: (1) anchor `href` matches expected destination, (2) click routes there, (3) query params preserved, (4) 200 on destination load, (5) destination page's own heading is correct (guards against silent redirects).

#### 10.1.1 Landing page (`/`) — 18 rows

| # | CTA | Destination | Status |
|---|-----|-------------|--------|
| 1 | Top nav "Sign in" | `/login` | ❌ |
| 2 | Top nav "Get started" | `/register` | ❌ |
| 3 | Top nav "Pricing" | `/pricing` | ❌ |
| 4 | Top nav "Courses" anchor | `/#courses` | ❌ |
| 5 | Hero "Start AP Prep — Free" | `/register?track=ap` | ❌ |
| 6 | Hero "Start CLEP Prep — Free" | `/register?track=clep` | ❌ |
| 7 | AP audience card CTA | `/register?track=ap` | ❌ |
| 8 | CLEP audience card CTA | `/register?track=clep` | ❌ |
| 9 | SAT card CTA | `/register?track=sat` | ❌ |
| 10 | ACT card CTA | `/register?track=act` | ❌ |
| 11 | "How it works" CTA | `/register` | ❌ |
| 12 | Curriculum section CTA | `/register` | ❌ |
| 13 | Final CTA "Start free" | `/register` | ❌ |
| 14 | Footer → About | `/about` | ❌ |
| 15 | Footer → Pricing | `/pricing` | ❌ |
| 16 | Footer → Contact | `mailto:contact@studentnest.ai` | ❌ |
| 17 | Footer → Terms | `/terms` | ❌ |
| 18 | Footer → Privacy | `/privacy` | ❌ |

#### 10.1.2 `/pricing` — 8 rows

| # | CTA / element | Expected | Status |
|---|----|----|----|
| 1 | "Get started free" | `/register` | ❌ |
| 2 | "Buy Premium monthly" | `/api/checkout?plan=monthly` (session object returned) | ❌ |
| 3 | "Buy Premium annual" | `/api/checkout?plan=annual` | ❌ |
| 4 | FAQ: refund policy expand | Text reveals "7-day refund" | ❌ |
| 5 | Toggle monthly ↔ annual | Prices change 9.99 ↔ 79.99 | ❌ |
| 6 | Per-module pricing visible | 4 modules listed | ❌ |
| 7 | Schema.org JSON-LD valid | FAQPage schema parses | ❌ |
| 8 | Comparison table renders all tiers | Free + Premium + modules | ❌ |

#### 10.1.3 `/about` — 3 rows
#### 10.1.4 `/ap-prep`, `/sat-prep`, `/act-prep`, `/clep-prep`, `/dsst-prep` — 5 CTAs × 5 pages = 25 rows
#### 10.1.5 `/ap-prep/[slug]`, `/clep-prep/[slug]`, `/dsst-prep/[slug]` — 3 CTAs per representative slug × 3 = 9 rows
#### 10.1.6 `/how-hard-is/[slug]` — 2 rows × 3 representative slugs = 6 rows
#### 10.1.7 `/am-i-ready` — quiz complete → `/register?track=X` — 4 rows (one per track outcome)
#### 10.1.8 `/pass-rates`, `/wall-of-fame`, `/resources` (public), `/sage-coach` (public), `/warmup` (public), `/blog`, `/methodology`, `/contact`, `/faq` — 2–3 CTAs each = ~20 rows

**Category 10.1 total: ~90 rows. Current: 0 passing.**

### 10.2 Auth entry-point matrix

| # | Path | Assertion | Status |
|---|------|-----------|--------|
| 1 | Email/password login (valid) → `/dashboard` or `/onboarding` | routed, session cookie set | 🟡 auth.setup |
| 2 | Email/password login (wrong password) | inline error "Invalid credentials" | ❌ |
| 3 | Email/password login (unverified email, prod only) | "Please verify your email" | ❌ |
| 4 | Google OAuth login (existing user) → dashboard | cookie set, token has id | ❌ |
| 5 | Google OAuth login (new user) → `/onboarding` | new User row, onboardingCompletedAt null | ❌ |
| 6 | Google OAuth cancel at consent | returned to `/login` without error toast storm | ❌ |
| 7 | Register email/password | verify-email page (dev bypass visible) | ❌ |
| 8 | `/register?track=ap` | Track=AP preselected, CardDescription = "AP exam journey" | ❌ |
| 9 | `/register?track=sat` | Track=SAT preselected | ❌ |
| 10 | `/register?track=act` | Track=ACT preselected | ❌ |
| 11 | `/register?track=clep` | Track=CLEP preselected, "CLEP — free" | ❌ |
| 12 | Register with existing email | inline error, no 500 | ❌ |
| 13 | Password strength enforcement | < 8 chars rejected | ❌ |
| 14 | Reset-password request | email sent (or logged in dev) | ❌ |
| 15 | Reset-password token consume | new password works | ❌ |
| 16 | Reset-password with expired token | user-friendly error | ❌ |
| 17 | Verify-email with valid token | emailVerified set, redirect `/dashboard` | ❌ |
| 18 | Verify-email with expired token | "resend" CTA visible | ❌ |
| 19 | Logout button | cookie cleared, redirect `/` | ❌ |
| 20 | Accessing dashboard while logged out | 302 → `/login?callbackUrl=...` | ❌ |
| 21 | Accessing `/onboarding` while logged out | 302 → `/login` | ❌ |
| 22 | CSRF on credential login | bad csrfToken rejected | ❌ |

**Category 10.2 total: 22 rows. Current: 1 partial.**

### 10.3 First-time user flow matrix (fresh fixture — `onboardingCompletedAt: null`)

| # | Step | Assertion (4-dim) | Status |
|---|------|-------------------|--------|
| 1 | Sign up → next request | Middleware redirects to `/onboarding`. DOM never shows `/dashboard` cards. | 🔵 needs fresh fixture spec |
| 2 | `/onboarding` step 1 course picker | Only track-appropriate courses visible. Selection persists. | ❌ |
| 3 | Step 1 "Continue" | Step 2 content visible; URL may advance with ?step=2. | ❌ |
| 4 | Step 2 "How it works" → next | Step 3 content visible. | ❌ |
| 5 | Step 3 recommended action | Copy matches selected course + track. | ❌ |
| 6 | Step 4 plan picker | Free + Premium cards, $9.99/mo, $79.99/yr. | ❌ |
| 7 | Click "Start Free" | Redirects `/dashboard`. No bounce. DB: `onboardingCompletedAt` set. JWT updated. | 🟡 onboarding-plan-choice |
| 8 | Click "Start Premium monthly" | Redirects to Stripe with valid `client_reference_id`. | ❌ |
| 9 | Click "Start Premium annual" | As above with annual price. | ❌ |
| 10 | After Free completion: navigate `/analytics` | Page loads. No bounce to `/onboarding`. | 🔵 (the bug we shipped tonight) |
| 11 | Navigate `/resources`, `/billing`, `/community`, `/practice`, `/frq-practice`, `/ai-tutor`, `/sage-coach`, `/flashcards`, `/study-plan`, `/warmup`, `/diagnostic`, `/mock-exam` | Each loads without bounce. | ❌ |
| 12 | `onboarding_completed` cookie bridge | Cookie present for ≤ 5 min, middleware honors it. | ❌ |
| 13 | Re-login after onboarding | JWT has `onboardingCompletedAt` non-null; no bounce. | ❌ |
| 14 | Onboarding abandonment + return | Re-entering picks up at last step. | ❌ |

**Category 10.3 total: ~20 rows (11 expands to 12 routes). Current: 0–1 partial.**

### 10.4 Returning user × tier matrix

For each of the 15 dashboard routes × 2 primary tiers (FREE / PREMIUM) × possibly per-track, assert functional load + tier-appropriate UI state.

| # | Route | FREE assertion | PREMIUM assertion | Status |
|---|-------|----------------|-------------------|--------|
| 1 | `/dashboard` | Cards load; streak visible; banner not misleading | Premium badge; no upsells | 🟡 |
| 2 | `/practice` | Loads; questions served; daily-count accurate | Unlimited | 🟡 |
| 3 | `/flashcards` | Correct course's cards (no flash); linear order | SM-2 ordering | 🟡 |
| 4 | `/diagnostic` | Gate if within 14d | No gate | ❌ |
| 5 | `/mock-exam` | Q1–Q5 served; paywall at Q6 with LOCK_COPY.mockExamPaywall | Unlimited | ❌ |
| 6 | `/frq-practice` | Paywall (LOCK_COPY.frqLocked) after 1 lifetime attempt | Unlocked | ✅ paywall-accuracy |
| 7 | `/ai-tutor` | Chat works; daily chat count; paywall on chat 4 with LOCK_COPY.tutorCap | Unlimited; streaming SSE | ❌ |
| 8 | `/sage-coach` | Shallow plan + LOCK_COPY.sageCoachLocked on deep sections | Deep plan rendered | ❌ |
| 9 | `/community` | Threads list; post new thread | Post visible; AI-tutor reply appears (premium-only) | ❌ |
| 10 | `/analytics` | Diagnosis card; prescription locked + LOCK_COPY.analyticsLocked | Full prescription visible | ❌ |
| 11 | `/study-plan` | Static template | Personalized plan | ❌ |
| 12 | `/resources` | Loads | Loads | ❌ |
| 13 | `/warmup` | Daily warmup served; streak increments | Same | ❌ |
| 14 | `/onboarding` (post-completion revisit) | Redirect to dashboard | Redirect to dashboard | ❌ |
| 15 | `/billing` | Free plan card; upgrade CTAs | Current plan card with next-billing date | ✅ billing-page-consistency |

**Category 10.4 total: 30 rows (15 routes × 2 tiers). Current: 2 passing, 3 partial.**

### 10.5 Plan-transition matrix

| # | Transition | Assertion (4-dim) | Status |
|---|-----|-----|----|
| 1 | Free → AP Premium monthly via checkout | Stripe checkout.session.completed → DB tier=AP_PREMIUM; `/billing` shows PREMIUM; sidebar badge updates | 🔵 needs test mode |
| 2 | Free → AP Premium annual | As above, `periodEnd ≈ now+365d` | 🔵 |
| 3 | Free → SAT Premium monthly | `subscriptionTier=SAT_PREMIUM`; ModuleSub[sat]=active | 🔵 |
| 4 | Free → ACT Premium | Module[act] | 🔵 |
| 5 | Free → CLEP Premium | Module[clep] | 🔵 |
| 6 | Premium → Cancel | `status=canceling`; periodEnd preserved; banner "Access until {date}" | ❌ |
| 7 | Canceling → Reactivate | `status=active`; banner removed | ❌ |
| 8 | Annual → switch to Monthly via Stripe portal | New periodEnd; old plan invoice refund prorated | ❌ |
| 9 | Add second module (AP + SAT) | Two ModuleSub rows, both active | ❌ |
| 10 | Remove one module | One active remains; tier reflects remaining | ❌ |
| 11 | Webhook silent skip → reconcile cron fires within 60 min | User flipped PREMIUM; email to contact@studentnest.ai | 🔵 needs canary |
| 12 | Webhook invalid signature | 400 returned; no DB change; no crash | ✅ stripe-webhook.test (unit) |
| 13 | Webhook for unknown event type | 200 acknowledged; no crash | ❌ |
| 14 | `current_period_end` at root only | `getPeriodEndDate()` reads it | ✅ unit |
| 15 | `current_period_end` at `items.data[0]` only | `getPeriodEndDate()` reads it | ✅ unit |
| 16 | `current_period_end` missing entirely | Null returned; DB write skipped cleanly | ✅ unit |
| 17 | `client_reference_id` missing on `checkout.session.completed` | Email fallback used | ✅ unit |
| 18 | Stripe Payment Link missing "After payment" redirect | User lands on `/billing`, banner amber "activation pending" | ✅ billing-page-consistency |
| 19 | Stripe redirect with `?success=1` | 3-state banner flow: spinner → confirmed → auto-dismiss | ✅ billing-flicker |
| 20 | Manual support flip (admin API) | Tier + ModuleSub rows written; logged | ❌ |

**Category 10.5 total: 20 rows. Current: 5 covered, 5 need test mode.**

### 10.6 Limit-hit matrix

One exhaust-the-limit spec per row, verifying (a) paywall appears, (b) exact `LOCK_COPY` string, (c) CTA routes to `/billing` or `/pricing`, (d) no off-by-one.

| # | Limit | Fixture | Spec | Status |
|---|-----|-----|-----|----|
| 1 | `practiceQuestionsPerDay=20` | free-at-practice-cap | Try 21st question → 429 + LOCK_COPY.practiceCap | ❌ |
| 2 | `tutorChatsPerDay=3` | free-at-tutor-cap | Start 4th chat → LOCK_COPY.tutorCap | ❌ |
| 3 | `mockExamQuestions=5` | returning-free | Answer Q1–Q5 → paywall at Q6 | ❌ |
| 4 | `frqAccess=false` | returning-free | Load `/frq-practice` → LOCK_COPY.frqLocked | ✅ |
| 5 | `frqFreeAttempts=1` | free-at-frq-attempt | 2nd attempt → blocked | ❌ |
| 6 | `fullAnalytics=false` | returning-free | `/analytics` → LOCK_COPY.analyticsLocked on prescription | ❌ |
| 7 | `sageCoachDeepPlan=false` | returning-free | `/sage-coach` → shallow plan only | ❌ |
| 8 | `flashcardSmartScheduling=false` | returning-free | Flashcards served in insertion order | ❌ |
| 9 | `diagnosticCooldownDays=14` | diagnostic-cooldown | 2nd diagnostic within 14d → cooldown msg | ❌ |

**Category 10.6 total: 9 rows. Current: 1 passing.**

### 10.7 Cross-page state-sync matrix

Flip a user from FREE → AP_PREMIUM via `/api/test/auth?action=set-state`. Within 1s of a page refresh, every surface must reflect truth.

| # | Surface | Assertion | Status |
|---|-----|-----|-----|
| 1 | `/dashboard` top badge | "Premium" | ❌ |
| 2 | `/billing` current plan card | "AP Premium" | ❌ |
| 3 | Sidebar plan indicator | "AP Premium" | ❌ |
| 4 | `/frq-practice` | No paywall | ❌ |
| 5 | `/mock-exam` | Unlimited | ❌ |
| 6 | `/analytics` prescription | Visible | ❌ |
| 7 | `/sage-coach` | Deep plan | ❌ |
| 8 | `/ai-tutor` daily-limit tag | Hidden | ❌ |
| 9 | `/api/billing/status` | `subscriptionTier=AP_PREMIUM` | ✅ verify scripts |
| 10 | `/api/user/limits` | all "unlimited" | ❌ |

Also the reverse: PREMIUM → Cancel → expiry date passes → all surfaces drop back to FREE.

**Category 10.7 total: 10 + 10 reverse = 20 rows. Current: 1 passing.**

### 10.8 Race-condition / re-render matrix

Every page that polls, has a timer, or calls `session.update()` gets a dedicated spec that asserts: (a) DOM mutation count within a bound during a known window, (b) no orphan setIntervals after unmount (`page.evaluate(() => window.__intervalsCount)` or MutationObserver), (c) no URL-param leakage between navigations.

| # | Page | Timing event | Assertion | Status |
|---|-----|-----|-----|-----|
| 1 | `/billing?success=1` | Polling window (10s, 5 attempts) | ≤ 30 mutations, 2 distinct bg colors | ✅ |
| 2 | `/practice` | Timer + answer submit | No double-submit | ❌ |
| 3 | `/mock-exam` | Countdown timer + auto-submit at 0 | DB session finalized exactly once | ❌ |
| 4 | `/diagnostic` | Question advance race | No skipped questions | ❌ |
| 5 | `/sage-coach` | SSE stream tokens | No duplicate tokens rendered | ❌ |
| 6 | `/flashcards` | Rapid swipe | No double-review credit | ❌ |
| 7 | `/ai-tutor` | Rapid double-submit | Idempotent (one conversation) | ❌ |
| 8 | `/onboarding` | Step transition double-click | No skipped step | ❌ |
| 9 | Any authed page | `session.update()` side-effects | No storm | ❌ |
| 10 | Any authed page | Navigate away during poll | No orphan setInterval | ❌ |
| 11 | `/warmup` | Streak increment race | No double-count | ❌ |
| 12 | `/community` | Optimistic thread post + server echo | No duplicate rendering | ❌ |

**Category 10.8 total: 12 rows. Current: 1 passing.**

### 10.9 Permission / role matrix

| # | Path | ADMIN | STUDENT | Anonymous | Status |
|---|-----|-----|-----|-----|-----|
| 1 | `/admin` | 200 | redirect `/dashboard` | redirect `/login` | 🟡 |
| 2 | `/admin/manage` | 200 | redirect | redirect | ❌ |
| 3 | `/api/admin/users` | 200 | 403 | 401 | ❌ |
| 4 | `/api/admin/settings` | 200 | 403 | 401 | ❌ |
| 5 | `/api/admin/backup` | 200 | 403 | 401 | ❌ |
| 6 | `/api/admin/*` all routes | 200 | 403 | 401 | ❌ |
| 7 | `/api/cron/*` (CRON_SECRET header) | n/a | 401 | 401 | 🟡 |
| 8 | `/api/cron/*` (with valid CRON_SECRET) | 200 | — | — | 🟡 |
| 9 | `/api/webhooks/stripe` (valid sig) | — | — | 200 | ✅ |
| 10 | `/api/webhooks/stripe` (invalid sig) | — | — | 400 | ✅ |
| 11 | `/api/test/auth` (no CRON_SECRET) | — | — | 401 | ❌ |
| 12 | `/api/test/auth` (valid CRON_SECRET) | — | — | 200, test user provisioned | 🟡 |

**Category 10.9 total: 12 rows. Current: 2–3 passing, rest missing.**

### 10.10 Stripe webhook event matrix (NEW)

| # | Event type | Body scenario | Assertion | Status |
|---|-----|-----|-----|-----|
| 1 | `checkout.session.completed` | Normal, `client_reference_id` present | Tier flipped; ModuleSub row created | ✅ unit |
| 2 | `checkout.session.completed` | `client_reference_id` missing | Email fallback lookup | ✅ unit |
| 3 | `checkout.session.completed` | Email fallback doesn't match | Warn + log eventId, no crash | ❌ |
| 4 | `customer.subscription.updated` | `current_period_end` at root | periodEnd written | ✅ unit |
| 5 | `customer.subscription.updated` | `current_period_end` at `items.data[0]` | periodEnd written | ✅ unit |
| 6 | `customer.subscription.updated` | `current_period_end` missing | Null; DB write skipped | ✅ unit |
| 7 | `customer.subscription.updated` | `status=canceled` | Tier → FREE; ModuleSub status=canceling | ❌ |
| 8 | `customer.subscription.deleted` | Subscription removed | Tier → FREE | ❌ |
| 9 | `invoice.payment_failed` | Card declined | Email to user + admin; tier unchanged | ❌ |
| 10 | `invoice.payment_succeeded` | Renewal | periodEnd extended | ❌ |
| 11 | `customer.subscription.trial_will_end` | Stripe test event | Email sent (if configured) | 🔵 |
| 12 | Unknown event type | Any | 200 ack, logged, no crash | ❌ |
| 13 | Malformed JSON body | Bad payload | 400 | ❌ |
| 14 | Replay of same event (eventId seen) | Idempotent DB write | No duplicate ModuleSub rows | ❌ |

**Category 10.10 total: 14 rows. Current: 5 passing (unit).**

### 10.11 Cron / background-job matrix (NEW)

| # | Cron | Trigger | Assertion | Status |
|---|-----|-----|-----|-----|
| 1 | `/api/cron/stripe-reconcile` | Hourly | Finds FREE+active-sub users, flips them | 🔵 requires canary |
| 2 | `/api/cron/auto-populate` | Schedule | Generates questions within `?limit=N` bound | ❌ |
| 3 | `/api/cron/quality-audit` | Daily | Audit report file generated | 🟡 quality-audit-cron.spec |
| 4 | `/api/cron/onboarding-bounce` | Daily | Emails users stuck in onboarding ≥ 1d | ❌ |
| 5 | `/api/cron/registration-stall` | Daily | Emails users who registered but never signed in ≥ 1d | ❌ |
| 6 | `/api/cron/trial-reengagement` | Daily | Emails trial users at day 3/5/7 | ❌ |
| 7 | `/api/cron/weekly-progress-digest` | Weekly | Sends recap to active users | ❌ |
| 8 | `/api/cron/daily-quiz` | Daily | Generates daily warmup question | ❌ |
| 9 | `/api/cron/recalibrate-difficulty` | Daily | Question difficulty adjusted per perf | ❌ |
| 10 | All crons: unauthorized | No CRON_SECRET | 401 | 🟡 |
| 11 | All crons: repeated invocation | Idempotent | No duplicate side effects | ❌ |

**Category 10.11 total: 11 rows. Current: 1 partial.**

### 10.12 Error-state matrix (NEW)

| # | Scenario | Expected UX | Status |
|---|-----|-----|-----|
| 1 | Navigate to `/nonexistent` | Branded 404 page, not a stack trace | ❌ |
| 2 | API 500 on dashboard load | Graceful fallback card, Sentry captures | ❌ |
| 3 | AI provider down (all of cascade fails) | User-facing "Sage is resting" message; no crash | ❌ |
| 4 | Network offline during practice | Offline indicator; answers queued | ❌ |
| 5 | Expired JWT on API call | 401 → redirect `/login?callbackUrl=...` | ❌ |
| 6 | Neon DB read fails | Error boundary; no stack leak to user | ❌ |
| 7 | Stripe down during checkout | User-facing "Try again" | ❌ |
| 8 | Rate-limit hit on `/api/practice` (20 req/min) | 429 + Retry-After | ❌ |
| 9 | Malformed query params | Sensible default (e.g. track=ap) | ❌ |
| 10 | Giant payload to `/api/ai/tutor` (100KB prompt) | Truncated or 413 | ❌ |

**Category 10.12 total: 10 rows. Current: 0.**

### 10.13 Mobile / responsive matrix (NEW)

Viewport: iPhone 12 (390×844) and iPad (768×1024). Desktop already default.

| # | Page | Mobile assertion | Status |
|---|-----|-----|-----|
| 1 | `/` | Sticky CTA visible; nav collapses to hamburger | ❌ |
| 2 | `/pricing` | Cards stack; toggle accessible | ❌ |
| 3 | `/dashboard` | Sidebar collapsible; cards stack | ❌ |
| 4 | `/practice` | Answer buttons ≥ 48px tall | ❌ |
| 5 | `/mock-exam` | Timer stays visible on scroll | ❌ |
| 6 | `/flashcards` | Swipe-friendly; card text wraps | ❌ |
| 7 | `/ai-tutor` | Chat input above fold, not hidden by keyboard | ❌ |
| 8 | `/onboarding` | All 4 steps complete on mobile | ❌ |
| 9 | `/billing` | Stripe portal link works on mobile | ❌ |
| 10 | All public pages — no horizontal scroll | content-width ≤ viewport | ❌ |

**Category 10.13 total: 10 rows × 2 viewports = 20 rows. Current: 0.**

### 10.14 Accessibility matrix (NEW)

`new AxeBuilder({ page }).analyze()` on every spec. Zero serious/critical violations = pass.

| # | Page | Scope | Status |
|---|-----|-----|-----|
| 1 | `/` | WCAG 2.1 AA | 🟡 a11y-scan (finding real violations) |
| 2 | `/pricing` | AA | 🟡 |
| 3 | `/about`, `/terms`, `/privacy`, `/contact` | AA | ❌ |
| 4 | `/ap-prep`, `/sat-prep`, `/act-prep`, `/clep-prep`, `/dsst-prep` | AA | ❌ |
| 5 | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` | AA + form-field labels | ❌ |
| 6 | `/dashboard`, `/practice`, `/flashcards`, `/diagnostic`, `/mock-exam`, `/frq-practice`, `/ai-tutor`, `/sage-coach`, `/community`, `/analytics`, `/study-plan`, `/resources`, `/warmup`, `/billing`, `/onboarding` | AA + keyboard nav end-to-end | ❌ |
| 7 | `/admin`, `/admin/manage` | AA | ❌ |

**Category 10.14 total: ~30 rows. Current: 2 partial.**

### 10.15 Visual regression matrix (NEW)

Playwright `expect(page).toHaveScreenshot()`. Baselines per page × viewport × theme (light/dark) where applicable. Masks for volatile regions (timestamps, random question order).

| # | Page | Baselines | Status |
|---|-----|-----|-----|
| 1 | `/` | desktop+mobile × light+dark = 4 | ❌ |
| 2 | `/pricing` | 4 | ❌ |
| 3 | `/about`, `/ap-prep`, `/sat-prep`, `/act-prep`, `/clep-prep`, `/dsst-prep`, `/methodology`, `/wall-of-fame`, `/pass-rates`, `/terms`, `/privacy` | 4 each | ❌ |
| 4 | `/login`, `/register` | 4 | ❌ |
| 5 | `/dashboard` (FREE state) | 4 | ❌ |
| 6 | `/dashboard` (PREMIUM state) | 4 | ❌ |
| 7 | `/billing` (FREE, PREMIUM, canceling, post-checkout banner each state) | 16 | 🟡 1 spec |
| 8 | `/onboarding` steps 1–4 × 2 tracks | 8 | ❌ |

**Category 10.15 total: ~70 baselines. Current: 0 locked baselines.**

### 10.16 Performance matrix (NEW — Lighthouse CI)

Budgets on every public page + dashboard.

| # | Metric | Budget | Measured via | Status |
|---|-----|-----|-----|-----|
| 1 | LCP | < 2.5s | Lighthouse CI | ❌ |
| 2 | TBT | < 300ms | Lighthouse CI | ❌ |
| 3 | CLS | < 0.1 | Lighthouse CI | ❌ |
| 4 | JS bundle size | < 300KB gzipped (marketing) | Next.js build report | ❌ |
| 5 | First-paint on slow 3G | < 5s | Playwright `emulateNetwork` | ❌ |

**Category 10.16 total: 5 metrics × 5 page tiers = 25 rows. Current: 0.**

### 10.17 Security matrix (NEW)

| # | Attack surface | Assertion | Status |
|---|-----|-----|-----|
| 1 | CSRF on POST endpoints | `next-auth` csrf enforced on credentials login | ❌ |
| 2 | XSS in community post | `<script>` rendered as text, not executed | ❌ |
| 3 | SQL injection in search | `search=') OR 1=1--` returns empty, no 500 | ❌ |
| 4 | Path traversal in `/api/resources/content` | `../../.env` rejected | ❌ |
| 5 | Admin role tamper via JWT | Modified JWT rejected (signature mismatch) | ❌ |
| 6 | Mass assignment on `/api/user` PATCH | Can't set `role` or `subscriptionTier` | ❌ |
| 7 | Rate limit `/api/ai/tutor` | 20/min enforced | ❌ |
| 8 | Leaked secrets in client bundle | No `DATABASE_URL`, `STRIPE_SECRET_KEY` in `.js` | ❌ |
| 9 | Response header: `Strict-Transport-Security` | present | ❌ |
| 10 | Response header: `Content-Security-Policy` | present or planned | ❌ |
| 11 | Open redirect on `callbackUrl` | Only same-origin accepted | ❌ |

**Category 10.17 total: 11 rows. Current: 0.**

### Matrix grand total

| Category | Rows | Current ✅ | Target by Phase 4 |
|----------|------|-----------|---------------------|
| 10.1 Public entry points | ~90 | 0 | 85 |
| 10.2 Auth | 22 | 1 | 22 |
| 10.3 First-time flow | ~20 | 0–1 | 20 |
| 10.4 Returning × tier | 30 | 2 | 30 |
| 10.5 Plan transitions | 20 | 5 | 20 |
| 10.6 Limit hits | 9 | 1 | 9 |
| 10.7 Cross-page state | 20 | 1 | 20 |
| 10.8 Race conditions | 12 | 1 | 12 |
| 10.9 Permissions | 12 | 2–3 | 12 |
| 10.10 Webhook events | 14 | 5 | 14 |
| 10.11 Cron | 11 | 1 | 11 |
| 10.12 Error states | 10 | 0 | 10 |
| 10.13 Mobile | 20 | 0 | 20 |
| 10.14 A11y | ~30 | 2 | 30 |
| 10.15 Visual regression | ~70 baselines | 0 | 50 |
| 10.16 Perf | 25 | 0 | 20 |
| 10.17 Security | 11 | 0 | 11 |
| **Total** | **~426** | **~22** | **~396 (93%)** |

---

## 11. Spec authoring guidelines

### 11.1 File naming

`tests/e2e/<feature>-<scenario>.spec.ts` — kebab-case, feature first. Examples: `practice-daily-limit.spec.ts`, `sage-coach-deep-plan-gate.spec.ts`, `webhook-subscription-canceled.spec.ts`.

### 11.2 Spec shape

```ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { setFixture } from "./helpers/fixtures";

test.describe("Feature: practice daily limit (FREE)", () => {
  test.use({ storageState: ".auth/user.json" });

  test.beforeEach(async ({ request }) => {
    await setFixture(request, "free-at-practice-cap");
  });

  test("21st question of day shows paywall with exact LOCK_COPY.practiceCap", async ({ page }) => {
    // Dim 1: functional
    await page.goto("/practice");
    const res = await page.waitForResponse("/api/practice");
    expect(res.status()).toBe(429);

    // Dim 2: message correctness — exact string match against tier-limits source
    await expect(page.getByRole("heading", { name: /Daily practice limit/ })).toBeVisible();
    await expect(page.locator('[data-testid="paywall-msg"]')).toHaveText(
      "Daily practice limit reached. More practice = faster score improvement."
    );

    // Dim 3: visual — CTA color, placement
    const cta = page.getByRole("link", { name: /upgrade/i });
    await expect(cta).toHaveCSS("background-color", /rgb\(.*/); // non-empty
    await expect(cta).toBeInViewport();

    // Dim 4: state consistency — /api/user/limits matches UI
    const limits = await (await page.request.get("/api/user/limits")).json();
    expect(limits.practiceQuestionsPerDay.used).toBe(20);
    expect(limits.practiceQuestionsPerDay.remaining).toBe(0);

    // Accessibility
    const a = await new AxeBuilder({ page }).analyze();
    expect(a.violations.filter(v => v.impact === "serious" || v.impact === "critical")).toEqual([]);
  });
});
```

### 11.3 Rules

- **Every spec imports fixture state from `setFixture()`.** No ad-hoc DB mutation.
- **Every spec makes at least 4 assertions mapped to the 4 dimensions.** A one-assert spec fails code review.
- **No `await page.waitForTimeout(ms)` in real specs.** Use `waitForResponse`, `waitForURL`, `toBeVisible`. Flake kills trust.
- **Every spec includes an axe scan** unless opted out for a documented reason.
- **Data-testid for state-critical elements.** CSS selectors break on restyle.
- **Copy assertions reference source constants.** Import `LOCK_COPY` from `src/lib/tier-limits.ts` and compare — prevents source/test drift.
- **New spec = new matrix row.** PR description must reference the Section 10 row it closes.

### 11.4 Fixture helper API

```
tests/e2e/helpers/fixtures.ts
  setFixture(request, name: FixtureName): Promise<void>
  resetUser(request): Promise<void>
  flipTier(request, tier: SubTier, module: Module): Promise<void>
  seedUsage(request, key, count): Promise<void>
```

Backed by `/api/test/auth` with expanded actions (`create | reset | set-state | seed-usage`).

---

## 12. Execution cadence

| Gate | When | What runs | Blocks |
|------|------|-----------|--------|
| **Pre-commit (local, optional)** | `git commit` | `tsc --noEmit`, eslint on changed files, affected unit tests | Yes if hook installed |
| **Pre-merge (GitHub Actions)** | PR open / push | tsc, eslint, knip, madge, Vitest full, Playwright on preview URL (public + authed smoke, 20 specs) | Yes |
| **Pre-deploy** | `npm run pages:deploy` | `pre-release-check.js`, Vitest, CF Pages build, smoke-tests, functional-tests, integration-tests, Playwright full | Yes — exit 1 blocks |
| **Post-deploy canary** | Every deploy | Stripe test-mode checkout canary (end-to-end), synthetic uptime ping | Triggers rollback alert, doesn't block |
| **Nightly** | 2 AM CT cron | Full Playwright (including slow specs), visual regression, Lighthouse CI, a11y full | Alerts, doesn't block |
| **Weekly** | Monday 9 AM CT | Sentry top-errors review; Stripe webhook delivery rate; PostHog funnel; flake rate; matrix coverage % | Review meeting |
| **Monthly** | First of month | Update visual baselines; review out-of-scope items; adjust SLOs | — |

---

## 13. Phased rollout

Each phase ships as one or more PRs + a deploy. No phase starts until previous phase's exit criteria met.

### Phase 1 — Foundation (1 day, no new SaaS)

Goal: every public path + auth entry tested. Matrix categories 10.1, 10.2, 10.9 at 100%.

**Deliverables:**
- `tests/e2e/helpers/fixtures.ts` + expanded `/api/test/auth` with `set-state`, `seed-usage`
- Spec files: `landing-ctas.spec.ts`, `pricing-ctas.spec.ts`, `marketing-tracks.spec.ts`, `auth-login-errors.spec.ts`, `auth-register-tracks.spec.ts`, `auth-reset-password.spec.ts`, `verify-email.spec.ts`, `logout.spec.ts`, `permission-admin.spec.ts`, `permission-cron.spec.ts`
- `scripts/audit-path-coverage.mjs` wired to `pre-release-check.js`

**Exit:** Path matrix coverage ≥ 30%. ~120 new rows passing.

### Phase 2 — First-time user + returning tier (2 days)

Goal: Matrix 10.3, 10.4 at 100%. Fixture discipline proven.

**Deliverables:**
- Fresh-fixture spec per sidebar item (× 2 tiers)
- `onboarding-*.spec.ts` covering all 4 steps × 2 tracks
- Cross-page state-sync basics (Category 10.7 partial)

**Exit:** New users never bounce. Every sidebar item verified tier-appropriate. Coverage ≥ 50%.

### Phase 3 — Limits + state sync + race (2 days)

Goal: Matrix 10.6, 10.7, 10.8 at 100%.

**Deliverables:**
- One spec per `FREE_LIMITS` row (9 specs) with exact `LOCK_COPY` assertions
- Cross-page state-sync suite (flip user tier, assert every surface)
- Race-condition specs per timer / polling / stream feature

**Exit:** Every limit + lock-copy + race covered. Coverage ≥ 62%.

### Phase 4 — Stripe payment flow (2 days — requires test mode setup)

Goal: Matrix 10.5, 10.10 at 100%. Production canary live.

**Prereqs (user action):**
- Create Stripe test-mode account
- Add CF Pages env vars: `STRIPE_TEST_SECRET_KEY`, `STRIPE_TEST_WEBHOOK_SECRET`, `STRIPE_TEST_PRICE_IDS_*`
- Configure test webhook endpoint pointing at `/api/webhooks/stripe` with `?testMode=1`
- Install Stripe CLI locally

**Deliverables:**
- `tests/e2e/checkout-monthly.spec.ts`, `checkout-annual.spec.ts` — Playwright drives full flow with test card `4242 4242 4242 4242`
- `tests/e2e/webhook-*.spec.ts` — each event type, each edge case (14 specs)
- `scripts/production-payment-canary.mjs` — hourly cron; creates + cancels test subscription; asserts webhook fires + DB updates within 60s
- Stripe webhook delivery alerts (native Stripe dashboard)

**Exit:** The Stripe canary is the single test that would have caught all 4 payment bugs this week. Coverage ≥ 72%.

### Phase 5 — Observability (1 day — requires SaaS signups)

Goal: bugs that slip are found in < 1 hour, not by paying customers.

**Prereqs:** Sentry signup verified, Better Stack signup, PostHog optional.

**Deliverables:**
- Sentry release tracking in `pages:deploy`
- Sentry alert rules: new-error threshold, error-rate regression
- Better Stack heartbeat on `/`, `/dashboard` (anonymous 200 check)
- PostHog events on critical flow: signup → onboarding-complete → first-question → subscribe
- Daily anomaly report: `FREE users with stripeSubscriptionId !== null` (flagged, not automated-fixed)

**Exit:** Every production error visible within 5 min; funnel drop-offs dashboarded.

### Phase 6 — Visual regression + a11y full (2 days)

Goal: Matrix 10.14, 10.15 at 100%.

**Deliverables:**
- Baseline snapshots for all public + authed-top pages × desktop+mobile × light+dark
- Axe scan on every spec
- Baseline approval workflow documented

**Exit:** UI drift caught automatically. Zero serious/critical a11y violations. Coverage ≥ 82%.

### Phase 7 — Performance + security + mobile (2 days)

Goal: Matrix 10.13, 10.16, 10.17 at 100%.

**Deliverables:**
- Lighthouse CI config + budgets per page tier
- Mobile viewport suite
- Security spec suite (XSS, SQLi, path traversal, open redirect, header audit)

**Exit:** Coverage ≥ 90%. Performance budgets enforced per PR.

### Phase 8 — Error states + crons + polish (ongoing)

Goal: Matrix 10.11, 10.12 + filling remainder.

**Deliverables:**
- One spec per cron (idempotency + unauthorized check)
- Error-state specs (404, 500, offline, rate-limit, AI cascade failure)
- Flake cleanup — any spec with retry rate > 10% gets root-caused

**Exit:** Coverage ≥ 93%. Flake rate < 2%.

---

## 14. Ownership & naming

- **Code reviewer catches matrix rows.** Every PR description must name the Section 10 row it addresses. PR template updated.
- **On-call rotation for canary alerts.** Whoever broke the build owns the fix.
- **Spec ownership:** each matrix row has a single spec file; the file owner is whoever last touched it (auto-tagged via `CODEOWNERS`).

---

## 15. Risks, anti-patterns, and done-definition

### Anti-patterns to reject at review

- **Assert-one-dimension specs.** If a spec only checks a route loaded, it's a fake spec — reject.
- **`waitForTimeout(5000)`** — always indicates a race not handled. Reject.
- **Hardcoded strings duplicated from source.** Import the constant. Reject.
- **Fixture lies.** A "new user" fixture with `onboardingCompletedAt: <ISO>` is a lie. Reject.
- **Shared mutable state between specs.** Every spec provisions its own fixture. Reject parallel stomping.
- **`.skip()` or `.fixme()` merged to main without a linked issue.** Reject.
- **Silencing a11y violations.** "Mark as known" only with a linked ticket + due date. Reject.

### Risks

- **Test flake erodes trust.** Mitigation: retries=3 + nightly flake report + aggressive root-causing on any spec flaking > 10%.
- **Stripe test-mode rate limits.** Mitigation: canary runs hourly, not per-minute. Separate test account.
- **Preview URL cold-start slowness.** Mitigation: warm-up request before spec run; timeouts scaled.
- **Matrix maintenance burden.** Mitigation: matrix row is mandatory in PR template — no feature adds without a row.

### Definition of done per category

- **Category is "done"** when every row is ✅ AND last 14 nightly runs of that category had zero failures.
- **Plan is "done"** when matrix coverage ≥ 93% AND customer-reported bugs < 1/week for 4 weeks consecutively.

---

## 16. Appendix

### 16.1 Required environment variables (test)

| Var | Env | Purpose |
|-----|-----|---------|
| `CRON_SECRET` | CI + local | Auth for `/api/test/auth`, `/api/cron/*` |
| `E2E_BASE_URL` | CI | Target preview URL (default studentnest.ai) |
| `STRIPE_TEST_SECRET_KEY` | CI + prod | Phase 4 canary |
| `STRIPE_TEST_WEBHOOK_SECRET` | CI + prod | Phase 4 canary |
| `STRIPE_TEST_PRICE_IDS_AP` | CI + prod | Phase 4 canary |
| `NEXT_PUBLIC_SENTRY_DSN` | prod | Phase 5 observability |
| `BETTERSTACK_HEARTBEAT_URL` | prod | Phase 5 uptime |

### 16.2 Current spec file map (what exists today)

| File | Category | State |
|------|----------|-------|
| `tests/e2e/auth.setup.ts` | setup | ✅ working |
| `tests/e2e/public-paths.spec.ts` | 10.1 partial | 🟡 |
| `tests/e2e/public-entry-points.spec.ts` | 10.1 | 🟡 newer |
| `tests/e2e/authed-flows.spec.ts` | 10.4 | 🟡 |
| `tests/e2e/onboarding-plan-choice.spec.ts` | 10.3 | 🟡 |
| `tests/e2e/first-time-user-fmea.spec.ts` | 10.3 | 🟡 |
| `tests/e2e/first-time-user-real.spec.ts` | 10.3 | ✅ |
| `tests/e2e/billing-page-consistency.spec.ts` | 10.4 / 10.5 | ✅ |
| `tests/e2e/billing-flicker.spec.ts` | 10.8 | ✅ |
| `tests/e2e/paywall-accuracy.spec.ts` | 10.6 | ✅ |
| `tests/e2e/flashcards-due-card.spec.ts` | 10.4 | ✅ |
| `tests/e2e/nawal-nudge.spec.ts` | AutoLaunchNudge | ✅ |
| `tests/e2e/quality-audit-cron.spec.ts` | 10.11 | 🟡 |
| `tests/e2e/a11y-scan.spec.ts` | 10.14 | 🟡 (surfacing real violations) |
| `tests/unit/tier-limits.test.ts` | unit | ✅ |
| `tests/unit/stripe-webhook.test.ts` | 10.10 | ✅ |
| `tests/unit/stripe-webhook-helpers.test.ts` | 10.10 | ✅ |

### 16.3 Tooling install list (remaining)

```
# Phase 1
npm i -D madge @typescript-eslint/eslint-plugin
# Phase 4 — user installs Stripe CLI locally
scoop install stripe         # Windows
# Phase 7
npm i -D @lhci/cli
```

### 16.4 PR template addition (must land in Phase 1)

```
## Path-matrix row(s) this PR closes
- Category 10.X row N: <description>

## Dimensions asserted
- [ ] Functional
- [ ] Message / copy
- [ ] Visual
- [ ] State consistency

## Fixture used
<fresh|returning-free|free-at-practice-cap|...>
```

---

## 16.5 Persona suite — concrete spec list (Phase 2 deliverable)

Below are the exhaustive specs that satisfy "test as first-time signup, test as repeat user, test as explorer". Each maps back to Section 10 matrix rows.

### Persona A specs (first-time)

```
tests/e2e/persona-a/
  01-landing-to-register-ap.spec.ts        # /→register?track=ap, 10.1.1#5, 10.2#8
  02-landing-to-register-sat.spec.ts       # 10.2#9
  03-landing-to-register-act.spec.ts       # 10.2#10
  04-landing-to-register-clep.spec.ts      # 10.2#11
  05-google-oauth-new-user.spec.ts         # 10.2#5
  06-verify-email-flow.spec.ts             # 10.2#17
  07-onboarding-ap-free.spec.ts            # 10.3 all rows, Free branch
  08-onboarding-ap-premium.spec.ts         # 10.3, Premium branch via Stripe test mode
  09-onboarding-clep-free.spec.ts          # 10.3, CLEP track
  10-onboarding-abandon-resume.spec.ts     # returning to /onboarding mid-flow
  11-post-onboarding-clicks-every-sidebar.spec.ts  # 10.3#11, the bounce-loop repro
  12-first-practice-question.spec.ts       # first meaningful action
  13-first-sage-chat.spec.ts               # tutor cap not hit
  14-first-flashcard-session.spec.ts       # course correctness (the 2026-04-24 bug)
  15-explore-pricing-from-dashboard.spec.ts # upgrade curiosity path
  16-mobile-full-journey.spec.ts           # iPhone 12 viewport
```

### Persona B specs (returning)

```
tests/e2e/persona-b/
  01-free-daily-loop.spec.ts               # login → streak → practice 5 → analytics
  02-premium-daily-loop.spec.ts            # same but no paywalls
  03-free-hits-practice-cap.spec.ts        # 10.6#1
  04-free-hits-tutor-cap.spec.ts           # 10.6#2
  05-free-hits-mock-exam-paywall.spec.ts   # 10.6#3
  06-free-hits-frq-paywall.spec.ts         # 10.6#4
  07-free-2nd-frq-attempt-blocked.spec.ts  # 10.6#5
  08-free-analytics-prescription-locked.spec.ts  # 10.6#6
  09-free-sage-coach-shallow.spec.ts       # 10.6#7
  10-free-flashcards-linear-order.spec.ts  # 10.6#8
  11-free-diagnostic-cooldown.spec.ts      # 10.6#9
  12-upgrade-free-to-premium-monthly.spec.ts    # 10.5#1
  13-upgrade-free-to-premium-annual.spec.ts     # 10.5#2
  14-cancel-subscription.spec.ts           # 10.5#6
  15-reactivate-subscription.spec.ts       # 10.5#7
  16-switch-annual-to-monthly.spec.ts      # 10.5#8
  17-add-second-module.spec.ts             # 10.5#9
  18-remove-module.spec.ts                 # 10.5#10
  19-post-upgrade-cross-page-sync.spec.ts  # 10.7 all rows
  20-post-cancel-cross-page-sync.spec.ts   # 10.7 reverse
  21-stripe-portal-returns-to-billing.spec.ts
  22-cross-device-session-same-state.spec.ts
  23-premium-renewal-webhook.spec.ts       # 10.10#10
```

### Persona C specs (explorer)

```
tests/e2e/persona-c/
  01-crawler-anonymous.spec.ts             # BFS from / up to depth 4
  02-crawler-first-time-student.spec.ts    # BFS from /onboarding up to depth 4
  03-crawler-returning-free.spec.ts        # BFS from /dashboard
  04-crawler-returning-premium.spec.ts     # same, premium
  05-crawler-admin.spec.ts                 # /admin surface
  06-known-paths-diff.spec.ts              # compares today's enumerated clickables vs snapshot; fails on unreviewed new surface
  07-keyboard-only-navigation.spec.ts      # Tab / Enter / Esc through every public page
  08-console-errors-on-every-page.spec.ts  # visit all 44 pages, assert no console.error
  09-unhandled-rejections-on-every-page.spec.ts
  10-broken-link-audit.spec.ts             # every <a href> on every page returns 200
  11-random-feature-interaction.spec.ts    # monkey test: 100 random clicks, assert no crash
```

### Helper code to ship alongside persona suite

```
tests/e2e/helpers/
  fixtures.ts                   # setFixture, resetUser, flipTier, seedUsage
  crawler.ts                    # BFS clickable enumeration + visit
  personas.ts                   # named fixtures map
  assertions.ts                 # assertFourDimensions() wrapper
  mocks/stripe.ts               # MSW handlers for Stripe (no real $$ in specs)
  mocks/groq.ts                 # deterministic AI responses
  mocks/google-oauth.ts         # deterministic OAuth
```

---

## 17. Immediate next actions (ranked, autonomous-ready)

1. **Scaffold `tests/e2e/helpers/fixtures.ts` + `tests/e2e/helpers/crawler.ts`** and expand `/api/test/auth` with `set-state` + `seed-usage` actions — unblocks all three persona suites + Phase 1–3.
2. **Install MSW + author `tests/e2e/helpers/mocks/{stripe,groq,google-oauth}.ts`** — deterministic external deps; stops $$ leaking in test runs.
3. **Ship Persona A spec 01–07** (landing → register × 4 tracks → OAuth → verify → onboarding AP) — the highest-value journey today.
4. **Ship Persona C spec 01 (anonymous crawler)** — surfaces broken public routes immediately.
5. **Ship Persona C spec 10 (broken-link audit)** — fast, catches stale href.
6. **Write `scripts/audit-path-coverage.mjs`** — wires matrix → report; blocks deploy when coverage regresses.
7. **Add PR template clause** forcing path-matrix row + 4-dim assertion checklist.
8. **Confirm Sentry DSN is capturing events** (send a test error, verify it lands in the Sentry inbox).
9. **User action needed — Stripe test-mode signup**, Better Stack signup, install Stripe CLI. Phases 4 + 5 are blocked until these exist.
10. **Install Phase 1 static-analysis plus:** `madge`, `@typescript-eslint/no-floating-promises`. Wire into lint CI step.

Execution begins against item 1 unless user redirects.
