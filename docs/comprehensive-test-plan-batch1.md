# Comprehensive Test Plan — NurseHub Batch 1 + Recent Fixes (2026-05-14)

**Scope:** Verify everything we shipped between 2026-05-13 morning and 2026-05-14 across both products. User-step-by-step, not just code review. Categories: Unit · E2E · Regression · Functional · Performance · Accessibility · Mobile · Cross-product.

**Targets:**
- StudentNest: https://studentnest.ai (prod) + https://staging.studentnest.pages.dev (preview)
- PrepLion: https://preplion.ai (prod) + staging preview URL

**Pass criteria:** Every test in §1–§7 must pass before promoting either product. §8 regression checklist verifies no prior functionality broken.

---

## §1. Unit-level (component + utility)

| # | Component / function | Test |
|---|---|---|
| U-01 | `<PassGuaranteeBadge variant="card">` | Renders heading "Pass your {examLabel} exam or your money back" |
| U-02 | `<PassGuaranteeBadge variant="card">` | Renders all 3 criteria from `CRITERIA_COPY` |
| U-03 | `<PassGuaranteeBadge variant="card">` | "Read the full terms" link → `href="/pass-guarantee"` |
| U-04 | `<PassGuaranteeBadge variant="inline">` | Renders compact pill with shield icon + aria-label |
| U-05 | `<PassGuaranteeBadge variant="banner">` | Renders with `role="status"` for screen readers |
| U-06 | `<PassGuaranteeBadge examLabel="CLEP">` | Substitutes "CLEP" into heading on PL |
| U-07 | `<PassGuaranteeBadge examLabel="AP/SAT/ACT">` | Substitutes "AP/SAT/ACT" on SN |
| U-08 | `expansion-pipeline-config.getExpansionConfig("TEAS_SCIENCE_1_HUMAN_ANATOMY")` | Returns `minPassQuorum=3, requirePaidJudgeInQuorum=true` |
| U-09 | `expansion-pipeline-config.getExpansionConfig("PSAT_MATH")` | Returns `difficultyCap="MEDIUM"` |
| U-10 | `expansion-pipeline-config.getExpansionConfig("AP_BIOLOGY")` | Returns DEFAULT_CONFIG (no overrides) |
| U-11 | `ensembleJudgeMcq` with `courseId: "TEAS_SCIENCE"` | When only 2 free judges PASS + no paid judge → returns `ok: false` reason="paid-judge co-sign required" |
| U-12 | `ensembleJudgeMcq` without `courseId` | Defaults to ≥2 PASS quorum, paid-judge not required (backwards-compat) |
| U-13 | `lighthouse-budget-check.js` parser | Extracts LCP from Lighthouse JSON correctly |
| U-14 | `parseVote` in ensemble-judge.ts | Accepts string OR pre-parsed object (CF Workers AI fix) |

**Execution:** `npm run test` (Vitest) on both repos. Currently SN has Vitest configured; PL has it too. Add new specs to `tests/unit/` directories.

---

## §2. E2E (Playwright user journey)

### §2a — Pass Guarantee surface

| # | Surface | Steps | Expected |
|---|---|---|---|
| E-01 | SN `/pricing` | Land → scroll past hero | Pass Guarantee card visible above FAQ |
| E-02 | SN `/pricing` | Tap "Read the full terms →" | Navigates to `/pass-guarantee` (404 currently — see §5 backlog) |
| E-03 | PL `/pricing` | Land → scroll past hero | Pass Guarantee card visible above FAQ |
| E-04 | PL `/pricing` | Card heading | Reads "Pass your CLEP exam or your money back" |
| E-05 | SN `/pricing` mobile (iPhone 12) | Vertical scroll | Card not horizontally clipped, criteria all visible |
| E-06 | PL `/pricing` mobile | Same as E-05 | Same as E-05 |
| E-07 | Both | Tap inline `<PassGuaranteeBadge>` pill | Navigates to `/pass-guarantee` |

### §2b — Saranya fresh-user funnel (regression — shipped 2026-05-13)

| # | Surface | Steps | Expected |
|---|---|---|---|
| E-08 | SN `/journey` fresh signup | Land | Course picker UI first (NOT pre-filled "Your course: AP_CHEMISTRY") |
| E-09 | SN `/journey` Step 0 | Tap AP World History | Summary card appears with "Start my plan" enabled |
| E-10 | SN `/journey` Step 0 | Without tapping any course | "Start my plan" disabled |
| E-11 | SN `/journey` Step 1 | Tap "Start my plan" | Interstitial visible ("3 quick questions to see where you're at, ~90s") |
| E-12 | SN `/journey` Step 1 | On the interstitial | NO `/api/practice` POST has fired yet |
| E-13 | SN `/journey` Step 1 | Reload twice on the interstitial | Still NO orphan QUICK_PRACTICE sessions in DB |
| E-14 | SN `/journey` Step 1 interstitial | Tap "Start" | Practice session created; first question appears |
| E-15 | SN `/journey` finish | After step 5 → /dashboard | Dashboard shows the course the user picked (NOT AP_WORLD_HISTORY default) |

### §2c — CLEP/DSST removal from SN signup (regression — shipped 2026-05-13)

| # | Surface | Steps | Expected |
|---|---|---|---|
| E-16 | SN `/journey` Step 0 picker | Scroll the course list | No CLEP_* or DSST_* courses appear |
| E-17 | SN `/` landing | Body text | Contains zero "CLEP" or "DSST" course names (footer trademark notice OK) |
| E-18 | SN `/how-hard-is/clep-college-algebra` | GET | Returns 4xx (no leak via marketing slug) |
| E-19 | SN `/am-i-ready/dsst-personal-finance` | GET | Returns 4xx |

### §2d — Diagnostic complete + course persist (regression — shipped 2026-05-13)

| # | Surface | Steps | Expected |
|---|---|---|---|
| E-20 | SN `/journey` Step 3 (diagnostic) | Answer 5 questions | After the 5th, NO red toast "Couldn't save your full diagnostic" |
| E-21 | SN `/journey` Step 3 → trans34 | After complete | Predicted score is computed properly (not score=1 fallback) |
| E-22 | SN `/journey` Step 3 → trans34 | After complete | "Targeted practice next" card shows specific weak unit name (not blank) |
| E-23 | SN /dashboard after journey | Sidebar course selector | Shows the course picked in Step 0 (not AP_WORLD_HISTORY default) |
| E-24 | SN localStorage `ap_selected_course` | Read after Step 0 pick | Contains the chosen course value |
| E-25 | SN cookie `ap_selected_course` | Read after Step 0 pick | Same value as localStorage |

### §2e — PL Fast Track webhook fix (Howard's case)

| # | Surface | Steps | Expected |
|---|---|---|---|
| E-26 | PL Stripe Test Mode → checkout with `client_reference_id` empty | Send webhook event | Webhook logs "matched user by email" if user exists; creates fast_track_purchases row |
| E-27 | PL Stripe Test Mode → checkout with metadata.userId empty AND client_reference_id empty AND customer_details.email present | Send webhook | Same as E-26 — fallback resolves user by email |
| E-28 | PL Stripe Test Mode → checkout with everything missing (no email, no userId) | Send webhook | Logs loud warning "paid but NO USER FOUND" — does NOT throw, returns 200 to Stripe |
| E-29 | PL `/api/cron/stripe-fast-track-reconcile` | POST with `dryRun:true, sinceDays:30` | Returns JSON report with `scanned`, `alreadyGranted`, `granted`, `unresolved` |
| E-30 | PL `/api/cron/stripe-fast-track-reconcile` | POST without auth | Returns 401 |
| E-31 | PL `/api/cron/stripe-fast-track-reconcile` | POST with wrong bearer token | Returns 401 |

### §2f — Journey picker E2E mobile-specific (iPhone Safari, shipped 2026-05-13)

| # | Surface | Steps | Expected |
|---|---|---|---|
| E-32 | SN `/journey` on iPhone 12 viewport | Fresh signup land | Course picker renders within viewport, no horizontal scroll |
| E-33 | SN `/journey` on iPhone 12 | Tap course tile | Selected state visually distinct from unselected |
| E-34 | SN `/journey` on iPhone 12 | Reload during Step 1 interstitial | No `/api/practice` POST fires (regression for Saranya) |

**Execution:** `npm run test:e2e` (Playwright). Both products. Run against staging URL via `E2E_BASE_URL=https://staging.<host>.pages.dev npm run test:e2e`.

---

## §3. Functional (feature spec verification)

| # | Feature | Verification |
|---|---|---|
| F-01 | Pass Guarantee badge appears on /pricing | Manual screenshot diff after deploy on both products |
| F-02 | Pass Guarantee criteria match `CRITERIA_COPY` | Read DOM via `document.querySelectorAll('li')` → 3 entries |
| F-03 | `/pass-guarantee` policy page | 404 currently — track as TODO for Batch 2 |
| F-04 | Lighthouse budget gate present in deploy pipeline | `grep -c "lighthouse-budget-check" scripts/deploy-staging.js` → 1 |
| F-05 | Lighthouse gate runs but doesn't block (warn-only) | First staging deploy logs "⚠️ Lighthouse budget gate FAILED but ENFORCE_LIGHTHOUSE_BUDGET≠1" OR "✅ Lighthouse budget gate PASSED" |
| F-06 | `ENFORCE_LIGHTHOUSE_BUDGET=1` flips to blocking | Set env var → deploy fails on budget regression |
| F-07 | Pass Guarantee badge does NOT affect existing pricing UI | Pricing tier cards still render; Stripe checkout buttons still work |
| F-08 | Reconciliation cron writes idempotently | Run twice in dryRun=false → second run reports 0 granted (all alreadyGranted) |
| F-09 | Reconciliation cron honors sinceDays cap | Pass `sinceDays: 1000` → clamped to 90 |
| F-10 | PrepLion webhook email-fallback resolves user | Test event with email=existing-user → DB write succeeds |

---

## §4. Performance (Lighthouse + LCP)

| # | Route | Target LCP (mobile, slow-4G) | Notes |
|---|---|---|---|
| P-01 | SN `/` | ≤ 1000ms | Marketing hero with `<HeroReadinessPicker>` |
| P-02 | SN `/pricing` | ≤ 1000ms | New `<PassGuaranteeBadge>` must not push past budget |
| P-03 | SN `/ap-prep`, `/sat-prep`, `/act-prep` | ≤ 1200ms | Heavier marketing pages |
| P-04 | PL `/` | ≤ 1000ms | |
| P-05 | PL `/pricing` | ≤ 1000ms | New `<PassGuaranteeBadge>` |
| P-06 | CLS | ≤ 0.1 | No layout shift from badge mount |
| P-07 | Total Blocking Time | ≤ 200ms | |
| P-08 | First Input Delay (CrUX) | ≤ 100ms | Real-user metric from CF |

**Execution:** `node scripts/lighthouse-budget-check.js https://staging.studentnest.pages.dev` after each deploy.

---

## §5. Accessibility (axe + manual)

| # | Surface | Test |
|---|---|---|
| A-01 | `<PassGuaranteeBadge variant="card">` | Heading hierarchy correct (`<h2>` with `id="pass-guarantee-heading"`) |
| A-02 | `<PassGuaranteeBadge variant="card">` | Section has `aria-labelledby="pass-guarantee-heading"` |
| A-03 | `<PassGuaranteeBadge variant="inline">` | Has descriptive `aria-label` |
| A-04 | `<PassGuaranteeBadge variant="banner">` | Has `role="status"` |
| A-05 | Color contrast — emerald-700 on emerald-500/10 | WCAG AA ≥ 4.5:1 |
| A-06 | Color contrast — dark mode variant | Same WCAG AA threshold |
| A-07 | Check icon SVG | Has `aria-hidden` so screen readers skip decorative |
| A-08 | `<PassGuaranteeBadge>` works without JS | Server-rendered, no client-side hydration required |

**Execution:** Playwright `@axe-core/playwright` integration on /pricing pages.

---

## §6. Mobile / responsive

| # | Viewport | Test |
|---|---|---|
| M-01 | iPhone 12 (390×844) | Pass Guarantee card renders within viewport, no horizontal scroll |
| M-02 | iPhone SE (375×667) | Same |
| M-03 | iPad Mini (768×1024) | Card uses full width without breaking layout |
| M-04 | Desktop 1280×720 | Card max-w-3xl centered |
| M-05 | Desktop 1920×1080 | No layout regression |
| M-06 | Touch targets on `<PassGuaranteeBadge>` link | ≥ 44px tap target (iOS HIG) |
| M-07 | Mobile journey Step 0 picker | Tap-through course selection works first try (no accidental scrolling) |

**Execution:** Playwright with `devices['iPhone 12']`, `devices['iPad Mini']`, etc.

---

## §7. Cross-product parity

| # | Test | Why |
|---|---|---|
| X-01 | `<PassGuaranteeBadge>` API identical between SN + PL | One spec change shouldn't require two coordinated rewrites |
| X-02 | `getExpansionConfig` identical between SN + PL | Same TEAS_SCIENCE rules apply on either platform |
| X-03 | Webhook email-fallback behavior identical | Both products handle missing client_reference_id the same way |
| X-04 | Reconciliation cron API identical (when ported to SN) | Forward-compat: when SN gets reconcile cron, same `sinceDays` + `dryRun` shape |
| X-05 | `parseVote` in ensemble-judge.ts identical | CF AI judge object-response fix applied uniformly |

**Execution:** Manual diff of relevant files between repos. Script: `diff <(cat AP_Help/src/components/marketing/pass-guarantee-badge.tsx) <(cat PrepLion/src/components/marketing/pass-guarantee-badge.tsx)` should differ only on the `examLabel` default ("AP" vs "CLEP").

---

## §8. Regression checklist (recent shipped fixes)

Run these BEFORE promoting any new batch to prod. Each is a quick smoke check.

| # | Recent fix | Smoke check |
|---|---|---|
| R-01 | Saranya picker-first (4c4db9f) | Fresh-signup E2E (E-08, E-11, E-12) passes |
| R-02 | CLEP/DSST course leak (e06c638) | E-16, E-17, E-18 pass |
| R-03 | Diagnostic-complete 400 + course persist (1769e53) | E-20, E-21, E-23 pass |
| R-04 | CF Workers AI judge fix (eede20b) | Run a single sweep against a known course; verify no `text.match is not a function` errors |
| R-05 | PL Fast Track webhook email fallback (22f84c4) | E-26, E-27, E-28 pass |
| R-06 | PL reconciliation cron (a858db2) | E-29, E-30, E-31 pass |
| R-07 | Pre-release-check cross-platform (75f38b8) | `node scripts/pre-release-check.js` on Windows + Linux both succeed |
| R-08 | Expansion pipeline config wiring (7afb2cd) | U-08, U-09, U-10, U-11, U-12 pass |
| R-09 | NurseHub Batch 1 — Pass Guarantee + Lighthouse (830cc65) | E-01 through E-07, F-04, F-05, P-01–P-07 |
| R-10 | PL Pass Guarantee badge (8d9d037, 0926068) | E-03, E-04, P-04, P-05 |

---

## §9. Test execution order (recommended)

1. Run §1 unit tests locally before pushing any commit (`npm run test`)
2. CI / staging gate runs §2 E2E Playwright, §4 Lighthouse, §5 accessibility automatically
3. Manual §6 mobile checks via real-device or BrowserStack pre-promote
4. §7 cross-product parity is a check-in-review step (PR author confirms)
5. §8 regression checklist is the final sweep before clicking promote

---

## §10. Failure-mode handling

| Failure | Action |
|---|---|
| Single E2E test fails on staging (chronic flake list known) | Compare against `tests/e2e/.known-flaky-on-staging.json` allowlist; if listed, gate continues with warning. If not listed, fail. |
| Lighthouse budget gate fails | Warn-only currently — staging continues. After baseline stabilizes (3 consecutive green), set `ENFORCE_LIGHTHOUSE_BUDGET=1` to make it blocking. |
| Pre-release-check fails | Stop. Don't deploy. Fix the failing check OR add a documented bypass with reason. |
| Smoke test post-promote fails | Roll back via `wrangler pages deployment list` → promote previous deployment. |

---

## §11. Items NOT in this test plan (deferred to Batch 2)

- Pass Guarantee schema fields (`User.passGuaranteeEligible` etc) — not yet in schema
- Pass Guarantee eligibility cron — not built
- Refund-claim flow (`/billing/pass-guarantee`) — not built
- `/pass-guarantee` policy page — 404 currently (linked from badge but page doesn't exist yet)
- Dashboard banner when user qualifies — not built
- PWA + offline practice cache (NurseHub Batch 1 third item) — deferred to focused commit
- New question types (MULTI_SELECT, FILL_IN_BLANK) — TEAS month

When those land, this test plan gets extended with their cases.

---

## §12. Sign-off

When all §1–§8 pass on staging for a given commit, the commit is cleared to promote.

```
[ ] §1 Unit (Vitest both repos)
[ ] §2 E2E (Playwright both repos, against staging URL)
[ ] §3 Functional spot-checks
[ ] §4 Lighthouse budget gate (warn-only — note results, no block)
[ ] §5 Accessibility (axe)
[ ] §6 Mobile / responsive (iPhone 12 + iPad Mini at minimum)
[ ] §7 Cross-product parity (file diff)
[ ] §8 Regression checklist (run all R-01 through R-10)
```

Promote when all checked.
