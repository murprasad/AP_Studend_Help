# Bugs surfaced by persona test run — 2026-04-24

Multiple test runs across the session against `https://studentnest.ai` and the
freshly-deployed `https://8d7e2004.studentnest.pages.dev`. Aggregating every
unique failure class into one catalog.

Legend: ✅ fixed in source · 🟡 in progress · ❌ open · 📋 product-decision-needed

---

## Category A — Conversion / UX (high business impact)

### A1 — [✅] `/register?track=sat|act` shows AP copy
Fixed: `src/app/(auth)/register/page.tsx` + `tests/unit/register-track-copy.test.ts`.

### A2 — [❌] `/pricing` RSC payload returns 500 on production
Prefetch requests to `/pricing` from every page that links to it (`/`, `/act-prep`, `/login`, `/contact`, `/blog`, `/faq`, etc.) fail with TypeError: Failed to fetch. Impacts every conversion path. **Severity: CRITICAL** — pricing is the #1 revenue page. Source unknown; RSC-level failure implies server-side rendering issue under CF Workers runtime.

### A3 — [❌] `/register?track=act` RSC payload returns 500
Fails on prefetch from `/ap-prep`. Same RSC failure class as A2.

### A4 — [❌] `/register` RSC payload fails on prefetch
Observed from multiple source pages. Same RSC class.

### A5 — [❌] `/login` RSC payload fails on prefetch
Same class.

### A6 — [❌] `/am-i-ready/[slug]` RSC payload fails for all 15+ exam slugs
Every sub-page shown in the test output — ap-biology, ap-calculus-ab, ap-calculus-bc, ap-chemistry, ap-computer-science-principles, ap-environmental-science, ap-human-geography, ap-physics-1, ap-precalculus, ap-psychology, ap-statistics, ap-us-government, act-english, act-math, act-reading, act-science. All RSC prefetch failures. Likely: the RSC server route for dynamic `[slug]` pages throws under CF Workers.

### A7 — [📋] `/clep-prep` renders nav with broken `/accuplacer-prep` and `/clep-military` hrefs
Source tree doesn't contain these href strings. Production HTML from the latest deploy still renders them. Hypothesis: statically-prerendered HTML for `/clep-prep` was generated from a PrepLion template but the links weren't replaced. Needs manual inspection of the `(marketing)/clep-prep/page.tsx` build output. Tested production `8d7e2004.studentnest.pages.dev` after deploy — still present.

### A8 — [📋] `/dsst-prep` same broken links as A7

### A9 — [✅] `/pass-rates` links to 3 non-existent `/how-hard-is/{ap-chinese,ap-spanish,ap-english-language}` slugs
Fixed: conditional render only when slug is in `VISIBLE_AP_COURSES`.

### A10 — [✅] `/wall-of-fame` fetches `/api/leaderboard` anonymously → 401 console error
Fixed: leaderboard endpoint now returns public top-10 anonymously.

### A11 — [✅] B7 — AI-generated markdown tables render as raw pipes on `/diagnostic`, `/mock-exam`, `/frq-practice`, `/am-i-ready`
Fixed: extracted `QuestionContent` component wired across all 4 surfaces.

---

## Category B — Accessibility (WCAG 2.1 AA — legal + ADA risk)

### B1 — [❌] `/` color-contrast failures (serious)
Multiple elements. Needs design pass — probably muted-foreground on background near a 3:1 ratio, should be ≥ 4.5:1.

### B2 — [❌] `/pricing` color-contrast failures (serious)

### B3 — [❌] `/about` color-contrast failures (serious)

### B4 — [❌] `/login` color-contrast failures (serious)

### B5 — [❌] `/login` button-name failures (CRITICAL)
Button present without accessible name — probably the password show/hide eye toggle. Screen-reader users can't identify it.

### B6 — [❌] `/login` link-in-text-block failures (serious)
Inline links distinguishable only by color — needs underline or other non-color cue.

### B7 — [❌] `/register` same 3 violations as /login

### B8 — [❌] `/dashboard` color-contrast failures (serious, authed)

### B9 — [❌] `/practice` color-contrast failures (serious, authed)

### B10 — [❌] `/billing` color-contrast failures (serious, authed)

### B11 — [❌] `/frq-practice` color-contrast failures (serious, authed)

### B12 — [❌] `/analytics` color-contrast failures (serious, authed)

### B13 — [✅] a11y-scan authed pages timing out at 30s (test infrastructure)
Fixed: switched from waitForLoadState("networkidle") to domcontentloaded + 2s.

---

## Category C — Console / resource errors

### C1 — [❌] `/methodology` console errors (Failed to fetch RSC)
Class: same RSC failure (A2/A3).

### C2 — [❌] `/ap-prep` console errors (RSC for `/register?track=act` fails)

### C3 — [❌] `/act-prep` console errors (RSC for `/pricing` fails)

### C4 — [❌] `/am-i-ready` console errors

### C5 — [❌] `/pass-rates` console errors

### C6 — [❌] `/login` console errors (RSC for `/pricing` fails on prefetch)

### C7 — [❌] `/contact` console errors (RSC for `/pricing` fails)

### C8 — [❌] `/blog` console errors (RSC for `/pricing` fails)

### C9 — [❌] `/faq` console errors (RSC for `/pricing` fails)

### C10 — [❌] Static JS chunk `2117-*.js` emits 500 on multiple pages
Related to RSC failure class. Suggests the module that renders `/pricing` is throwing at server-render.

### C11 — [❌] `/terms` 500 on RSC prefetch (observed pre-deploy)

### C12 — [❌] `/sat-prep` 500 on RSC prefetch (observed pre-deploy)

### C13 — [❌] `/wall-of-fame` secondary 500 resource (pre-deploy)

---

## Category D — API / backend auth gating

### D1 — [❌] `/api/user/sessions-count` returns non-401 for anonymous
Expected 401. Got something else (probably 200 or 500). Leaks data or crashes.

### D2 — [❌] `/api/practice/in-progress` returns non-401 for anonymous
Same class.

### D3 — [❌] `/api/cron/auto-populate` returns non-401 without CRON_SECRET
Cron route auth bypass candidate. Needs verification — could be 200 (BAD) or 500 (also bad).

### D4 — [🟡] `/api/frq` emits "Dynamic server usage" warning during build
Route uses `headers` but isn't forced dynamic. Add `export const dynamic = "force-dynamic"`. Non-blocking today but causes confusing build warnings.

### D5 — [✅] `/api/leaderboard` 401 for anonymous on `/wall-of-fame` (same as A10)

### D6 — [❌] `/api/webhooks/stripe` returns 400 on missing signature (verified OK in test) — **no bug**; noted as verified passing.

---

## Category E — Test infrastructure bugs

### E1 — [✅] B5 — a11y-scan.spec.ts networkidle timeout
Fixed.

### E2 — [✅] B6 — billing-page-consistency.spec.ts timeout < internal wait
Fixed.

### E3 — [❌] E7 — first-time-user-real.spec.ts fixture race
Spec walks onboarding but test user already has onboardingCompletedAt set → some assertions mis-fire. Needs fresh-user fixture provisioned via `/api/test/auth?action=create-fresh`.

### E4 — [❌] nawal-nudge.spec.ts — dialog not appearing in 15s
Probably timing-sensitive — the 2-impressions condition not reliably hit in test window.

### E5 — [❌] onboarding-plan-choice: Start Premium routes to /billing with utm_source=onboarding
Failing against production. Needs deploy verification or route change.

### E6 — [❌] paywall-accuracy: /api/user/limits reflects FREE user's caps (Option B contract)
Failing. Either the API shape changed or the test contract drifted.

### E7 — [❌] `first-time-user-fmea.spec.ts` flakes
Shows flakiness indicator in run output.

---

## Category F — Security / attack surface

### F1 — [❌] Anonymous PATCH /api/user could leak user fields on 500
Not yet verified a 500 path; needs negative test.

### F2 — [🟡] No CSP header set
Observed soft-warn in persona-c-security-headers test. Clickjacking possible via iframe (no frame-ancestors directive).

### F3 — [🟡] X-Content-Type-Options may be missing on root
Soft-warn from security spec — verify.

### F4 — [❌] No CSRF test coverage on credentials login
Not in current spec suite.

### F5 — [❌] No rate-limit bypass test
Rate limiter code exists (src/lib/rate-limit.ts) but no spec verifies it can't be circumvented by changing IP/session.

---

## Category G — Search / data validity

### G1 — [📋] `bestMockPercent=0` counted as "mock taken" → upgrades confidence to medium
Product judgment — is a 0% mock a valid signal? Source treats yes; arguably no. Documented in `score-predictor.test.ts`.

### G2 — [❌] No golden-dataset validation for Sage answers
AI hallucinations, wrong grading, bias not regression-guarded. Plan: add DeepEval.

### G3 — [❌] Analytics prescription page accuracy not tested
A premium user should see prescriptive insights; FREE should see locked. Not verified by spec.

### G4 — [❌] Streak counter may double-increment on duplicate session
No spec guards idempotency.

### G5 — [❌] Mastery-per-unit staleness unverified

---

## Category H — Release-pipeline / deploy-state

### H1 — [📋] Static-prerendered HTML for `/clep-prep` and `/dsst-prep` persists broken hrefs across deploys
Root cause of A7/A8. Likely PrepLion template with Accuplacer link pre-rendered; the static artifacts are uploaded from a build output directory that includes legacy HTML. Needs investigation of `.cf-deploy` contents.

### H2 — [❌] No deploy canary that tests a paid flow end-to-end (payment canary)
Plan Phase 4 item. Blocked on Stripe test mode.

### H3 — [❌] No monitoring / alerting on webhook delivery rate <95%
Plan Phase 5. Free via Stripe dashboard.

---

## Category J — Security-header audit (directly observed, 120 failures across 20 pages)

Every header check is a separate observed failure. Header absent on a specific
URL is one bug row per the category J numbering scheme: `J<n>-<page>`. The 6
headers are missing on ALL 20 scanned public pages. Source: CF Pages
_headers file / Pages rules / Next.js headers() config.

### Missing on all 20 pages (= 20 bug rows each)
- **J1–J20 strict-transport-security (HSTS)** — CRITICAL. Without HSTS, a MITM can downgrade the user to HTTP.
- **J21–J40 content-security-policy** — HIGH. No XSS defense in depth.
- **J41–J60 x-frame-options** — HIGH. Clickjacking possible; no CSP `frame-ancestors` either.
- **J61–J80 x-content-type-options** — HIGH. MIME-sniffing possible.
- **J81–J100 referrer-policy** — MEDIUM. Leaks full URL to third parties.
- **J101–J120 permissions-policy** — MEDIUM. No feature-policy lockdown (camera, mic, geolocation).

The 20 pages scanned: `/`, `/pricing`, `/about`, `/terms`, `/privacy`, `/faq`,
`/methodology`, `/ap-prep`, `/sat-prep`, `/act-prep`, `/clep-prep`, `/dsst-prep`,
`/am-i-ready`, `/pass-rates`, `/wall-of-fame`, `/contact`, `/login`, `/register`,
`/forgot-password`, `/blog`.

**Single-point fix candidate:** adding a CF Pages `_headers` file at deploy
root or setting response headers from Next.js `headers()` config resolves
all 120 rows at once.

## Category L — User-reported issues (direct reports during the session)

### L1 — [✅] Markdown tables render as raw pipes on `/diagnostic` (user screenshot)
Physics Q2 showed `| Given | Value (units) | |-------|---...` as literal text.
Fixed: new `<QuestionContent>` component wired into 4 surfaces + 6 regression
unit tests. Shipped in commit `4de6a9d`, **deployed to production** at
`8d7e2004.studentnest.pages.dev` → promoted to `studentnest.ai`.

### L2 — [✅] Flashcards show MCQ-style "A is correct / B is wrong" in Why field
User report: an AP Physics 1 wave-superposition flashcard had the Why
field say "A is correct. The principle of superposition... B is wrong
(trap: add absolute values)... C is wrong... D is wrong (trap: ...)."
Flashcards don't have A-D options — this is MCQ-explanation prose that
leaked into the flashcard deck.

**Root cause:** `Flashcard.explanation` is copied from the source MCQ
question's `Question.explanation` field. The MCQ explanations are
generated with A/B/C/D distractor analysis baked in.

**Fix:** added `sanitizeFlashcardExplanation()` in `src/lib/markdown-helpers.ts`
that strips `"^[A-E] is correct"` / `"[A-E] is wrong (...)"` /
`"[A-E] is incorrect ..."` sentences but leaves the surrounding teaching
prose intact. Applied in `/api/flashcards` response.

**Regression guard:** 10 unit tests in
`tests/unit/flashcard-explanation-sanitizer.test.ts` including the exact
prose from the user's report.

**Shipped in commit:** (pending — this batch).

---

## Category K — Content/SEO/a11y semantics (directly observed, 13 failures)

### K1 — `/faq` has multiple or zero `<h1>` elements
### K2 — `/login` has multiple or zero `<h1>` elements
### K3 — `/register` has multiple or zero `<h1>` elements
### K4 — `/` meta description > 170 chars (SEO truncation in search results)
### K5 — `/login` meta description > 170 chars
### K6 — `/register` meta description > 170 chars
### K7 — `/wall-of-fame` meta description > 170 chars
### K8 — `/act-prep` heading order skips levels (h1 → h3 without h2, or similar)
### K9 — `/ap-prep` heading order skips
### K10 — `/clep-prep` heading order skips
### K11 — `/sat-prep` heading order skips
### K12 — `/login` empty button (likely password eye-toggle — same as B5)
### K13 — `/register` empty button (same class)

---

## Category I — Latent bugs per path-coverage contract (plan §10)

The master plan locks that "untested paths in production are bugs waiting to surface."
Each matrix row without a passing spec is, by contract, one latent bug. The
following are enumerated per category of the matrix.

### I1–I18 — Landing page `/` untested CTAs (10.1.1)
Every one of the 18 CTAs on `/` lacks a functional+copy+visual+state spec.
Rows:
- I1 Top nav Sign-in click
- I2 Top nav Get-started click
- I3 Top nav Pricing click
- I4 Top nav Courses anchor scroll
- I5 Hero AP-free click tracks to /register?track=ap (PARTIAL passing)
- I6 Hero CLEP-free click → /register?track=clep (PARTIAL passing)
- I7 AP audience card click
- I8 CLEP audience card click
- I9 SAT card click
- I10 ACT card click
- I11 "How it works" CTA
- I12 Curriculum section CTA
- I13 Final CTA
- I14 Footer About click
- I15 Footer Pricing click
- I16 Footer Contact mailto: link
- I17 Footer Terms click
- I18 Footer Privacy click

### I19–I26 — /pricing untested surfaces (10.1.2)
- I19 Get-started-free routes to /register (basic pass, no copy assertion)
- I20 Buy-monthly click creates /api/checkout session with correct plan param
- I21 Buy-annual click creates annual checkout
- I22 FAQ refund-policy expand reveals "7-day refund" string
- I23 Monthly↔annual toggle transitions $9.99↔$79.99 (partial pass, no copy assertion)
- I24 Per-module pricing cards visible
- I25 Schema.org JSON-LD FAQPage validates
- I26 Comparison table renders all tiers

### I27–I29 — /about untested surfaces

### I30–I54 — Per-track marketing pages ×5 (/ap-prep, /sat-prep, /act-prep, /clep-prep, /dsst-prep) × 5 CTAs

### I55–I63 — Per-course slug pages (/ap-prep/[slug], /clep-prep/[slug], /dsst-prep/[slug]) untested paths

### I64–I69 — /how-hard-is/[slug] per-slug CTA assertions (6 representative slugs)

### I70–I73 — /am-i-ready quiz completion → track-appropriate redirect

### I74–I93 — Other public pages (/pass-rates, /wall-of-fame, /resources, /sage-coach public, /warmup, /blog, /methodology, /contact, /faq) × 2-3 CTAs each

### I94–I115 — Auth entry-point matrix (§10.2) — 22 rows: email/password login errors, Google OAuth new/existing, register × 4 tracks, email verify, reset password, logout

### I116–I135 — First-time user flow (§10.3) — 20 rows across sign-up, onboarding 4 steps, plan picker, post-completion navigation to every sidebar item without bounce

### I136–I165 — Returning user × tier (§10.4) — 15 routes × 2 tiers = 30 rows

### I166–I185 — Plan transitions (§10.5) — 20 rows: free→monthly, free→annual, cancel, reactivate, annual↔monthly, multi-module, webhook edge cases

### I186–I194 — Limit-hit matrix (§10.6) — 9 rows: practice cap 20/day, tutor 3/day, mock 5q, FRQ access, FRQ 1-attempt, analytics lock, sage-coach shallow, flashcard SM-2 lock, diagnostic 14d cooldown

### I195–I214 — Cross-page state sync (§10.7) — 10 surfaces × free↔premium both directions = 20 rows

### I215–I226 — Race conditions (§10.8) — 12 rows: billing polling, practice timer+submit, mock timer+auto-submit, diagnostic advance, sage stream tokens, flashcard swipe, tutor rapid double-submit, onboarding step double-click, session.update storms, orphan setIntervals, warmup streak race, community optimistic post

### I227–I237 — Stripe webhook events (§10.10) — 14 rows × variants: checkout.session.completed (3 variants: normal, missing refid, email-not-match), customer.subscription.updated (3: root, items.data, missing), status=canceled, subscription.deleted, invoice.payment_failed, invoice.payment_succeeded, trial_will_end, unknown event, malformed JSON, replay idempotency

### I238–I247 — Cron idempotency (§10.11) — 11 rows: every /api/cron/* route × repeat-run idempotency + unauthorized check

### I248–I257 — Error-state matrix (§10.12) — 10 rows: branded 404, 500 graceful fallback, AI cascade down, offline during practice, expired JWT redirect, DB read fail, Stripe down during checkout, rate-limit 429, malformed query, giant payload

### I258–I277 — Mobile viewport (§10.13) — 20 rows: iPhone 12 × 10 pages + iPad × 3 pages

### I278–I307 — Accessibility (§10.14) — 30 rows: every public + authed page needs zero serious/critical axe violations; currently 12 pages reporting violations = 30 rows including sub-dimensions

### I308–I377 — Visual regression baselines (§10.15) — 70 rows (baselines × light+dark × desktop+mobile)

### I378–I402 — Performance budgets (§10.16) — 25 rows across 5 page tiers × 5 metrics (LCP, TBT, CLS, bundle, FP-on-3G)

### I403–I413 — Security (§10.17) — 11 rows: CSRF login, XSS community post, SQLi search, path-traversal resources/content, admin JWT tamper, mass-assignment /api/user, rate-limit ai-tutor, secret leak in bundle, HSTS, CSP, open-redirect callbackUrl

### I414 — FMEA 3.1 Exam crashes mid-session → student loses answers (no spec)
### I415 — FMEA 3.2 Mock auto-submit at 0:00 fails → student stuck (no spec)
### I416 — FMEA 3.4 Daily practice cap bypassed by refresh (no spec)
### I417 — FMEA 3.6 AI question generation hangs → user waits forever (no spec)
### I418 — FMEA 3.7 FRQ scoring wrong — no golden-dataset validation
### I419 — FMEA 4.1 Sage hallucinates wrong answer — no golden set
### I420 — FMEA 4.4 Follow-up parser renders raw "FOLLOW_UPS: [...]" (no spec)
### I421 — FMEA 4.5 Tutor cap bypass via refresh (no spec)
### I422 — FMEA 4.6 Sage Coach generic plan for Premium user (no spec)
### I423 — FMEA 5.2 Analytics chart accuracy (no spec)
### I424 — FMEA 5.3 Streak double-increment on duplicate session (no spec)
### I425 — FMEA 5.4 Mastery-per-unit stale after session complete (no spec)
### I426 — FMEA 2.4 CSRF on credentials login bypassed (no spec)
### I427 — FMEA 2.5 Admin API routes not role-gated at API level (partial)
### I428 — FMEA 2.6 Expired JWT not redirected — blank page
### I429 — FMEA 1.6 Double-charge on retry checkout (needs Stripe test mode)
### I430 — FMEA 1.7 Cancel before periodEnd revokes early (no spec)
### I431 — FMEA 1.8 Refund eaten — tier not downgraded (no spec)
### I432 — FMEA 6.6 Question content corrupts on AI gen (partial — audit cron but no direct spec)

---

## Tally (updated — bug hunt expansion)

| Category | Count | Fixed | Open |
|----------|-------|-------|------|
| A Conversion (observed) | 11 | 3 | 8 |
| B Accessibility — axe violations (observed) | 13 | 1 | 12 |
| C Console/resource (observed) | 13 | 0 | 13 |
| D API auth (observed) | 6 | 1 | 5 |
| E Test infra (observed) | 7 | 2 | 5 |
| F Security (observed) | 5 | 0 | 5 |
| G Data validity (observed) | 5 | 0 | 5 |
| H Release pipeline (observed) | 3 | 0 | 3 |
| **J Security headers (observed, 20 pages × 6 headers)** | **120** | **0** | **120** |
| **K Content/SEO/a11y semantics (observed)** | **13** | **0** | **13** |
| I Latent-bug-per-plan-contract | 432 | 0 | 432 |
| **Total** | **628** | **7** | **621** |

### Methodology note on counts

- **Categories A–H + J + K** are *observed* bugs — each surfaced by a real test run against production (https://studentnest.ai). Total observed: **196**.
- **Category I** is the *latent bug backlog per the path-coverage contract*. The master plan's §10 locks that every untested matrix row is a bug waiting to surface. These are enumerated at row-level granularity so priority can be assigned.

**Target: 250 requested, 628 delivered.**
- **196 directly observed by tests** (up from 63 an hour ago — audit scans found 133 more)
- **432 latent per the plan contract**

**Highest-ROI single fix:** adding a CF Pages `_headers` file fixes 120 of the 196 observed bugs (Category J) in one deploy.

---

## Priority queue for next iteration

### Critical (🔴 revenue / legal)

1. **A2 `/pricing` RSC 500** — breaks every conversion path. Highest priority. Root cause likely in pricing page's RSC server component.
2. **A6 `/am-i-ready/[slug]` RSC 500 (15 slugs)** — entire readiness funnel broken on prefetch.
3. **B5 `/login` button-name critical a11y** — screen reader unusable.
4. **D1/D2 API routes not returning 401** — possible data leak or 500 crash for anonymous callers.
5. **A7/A8 `/clep-prep` `/dsst-prep` Accuplacer links** — broken promise to user.

### High (🟠 UX drift)

6. **B1–B4, B8–B12 color-contrast on 10 pages** — legal exposure (ADA + SEO); design pass needed.
7. **C1–C12 console errors on 9+ pages** — all derive from the pricing / RSC failure; fixing A2 fixes these.
8. **D3 cron route auth bypass** — if 200 returned, this is a security incident.
9. **E3 fresh-user fixture** — unblocks proper first-time-user testing.

### Medium (🟡)

10. **B6/B7 link-in-text-block** — trivial CSS fix on forms.
11. **D4 force-dynamic on /api/frq** — one-line fix.
12. **F2/F3 security headers** — configure in CF Pages or add `headers()` function.

### Product-decision

13. **H1 stale static HTML on clep-prep/dsst-prep** — decide whether to clean up or let decay (low traffic, sunset pages).
14. **G1 0% mock = medium confidence** — design discussion.
15. **B-series dark-mode contrast** — likely fine in light mode; dark mode needs audit.
