# StudentNest — Failure Mode & Effects Analysis (FMEA)

**Locked:** 2026-04-24
**Owner:** Engineering (all contributors)
**Review cadence:** weekly (Monday retro); row status must be ✅ or a linked ticket.

## Purpose

FMEA is the list of "how can this hurt a student, a parent, or the business?" Every
row names the failure, rates it, and points at the guarding test. Every deploy that
touches a guarded area re-runs the test. A row with impact 🔴 and status ❌ is a
sleeping incident.

## Rating legend

| Impact | Meaning |
|--------|---------|
| 🔴 Critical | Blocks a core student journey, loses money, or violates law/contract (data loss, lockout, payment bug, legal exposure) |
| 🟠 High | Silently degrades the product — wrong answers, broken UX on high-traffic pages, conversion drop-offs |
| 🟡 Medium | Annoying but recoverable — banner flicker, slow page, non-critical feature broken |
| 🟢 Low | Cosmetic, edge-case only |

| Status | Meaning |
|--------|---------|
| ✅ | At least one spec guards this row today |
| 🟡 | Partial guard (unit test exists but no E2E, or vice versa) |
| ❌ | No guard yet — row is a sleeping incident |
| 🔵 | Not yet shipped (feature planned) |

---

## 1. Billing / payment failures

| # | Failure mode | Impact | Fix / control | Guard |
|---|--------------|--------|----------------|-------|
| 1.1 | Webhook delivery fails — user paid but stays FREE | 🔴 | Hourly reconcile cron + email alert | ✅ `tests/unit/stripe-webhook.test.ts` + `/api/cron/stripe-reconcile` |
| 1.2 | Webhook processes with wrong API version field (`current_period_end` moved) | 🔴 | `getPeriodEndDate()` reads root + `items.data[0]` | ✅ unit tests in stripe-webhook.test.ts |
| 1.3 | Stripe Payment Link missing `client_reference_id` → silent skip | 🔴 | Email fallback in webhook | ✅ unit tests |
| 1.4 | `/billing` UI claims "Welcome to Premium" while DB says FREE | 🔴 | 3-state banner, polling cap + hard timeout | ✅ `billing-page-consistency.spec.ts` (now passing w/ B6 fix) |
| 1.5 | `/billing?success=1` polling infinite flicker | 🟠 | `successOnMount` ref + stripAfter | ✅ `billing-flicker.spec.ts` |
| 1.6 | User double-charged on retry / duplicate checkout | 🔴 | Stripe idempotency key + webhook eventId dedup | 🟡 unit test for idempotent path; needs E2E (blocked on Stripe test mode) |
| 1.7 | Cancel → access revoked before periodEnd | 🔴 | `status=canceling` keeps access to periodEnd | ❌ no spec yet (plan §10.5 #6) |
| 1.8 | Refund eaten — user refunds within 7 days but tier not downgraded | 🟠 | Refund webhook handler | ❌ no spec |
| 1.9 | Price drift — `$9.99` in one page, `$10` in another | 🟡 | Pre-release-check string scan | ✅ `scripts/pre-release-check.js` |

## 2. Auth / session failures

| # | Failure mode | Impact | Fix / control | Guard |
|---|--------------|--------|----------------|-------|
| 2.1 | Onboarding bounce loop (new user trapped) | 🔴 | middleware honors `onboarding_completed` cookie | ✅ `first-time-user-real.spec.ts` |
| 2.2 | JWT stale after onboarding — user bounced mid-session | 🔴 | `updateSession()` in onboarding page | ✅ same spec |
| 2.3 | Google OAuth callback 500 on CF Workers cold-start | 🔴 | Manual OAuth provider config (no OIDC discovery) | 🟡 persona-a-register-tracks + login both check button; no cold-start spec |
| 2.4 | CSRF on login bypassed | 🔴 | next-auth csrfToken required | ❌ no spec |
| 2.5 | Admin role gate fails — student accesses `/admin/*` | 🔴 | middleware role check | 🟡 middleware covers `/admin`; API routes not fully tested |
| 2.6 | Expired JWT not redirected → user sees blank page | 🟠 | 401 handler | ❌ no spec |
| 2.7 | Password reset with expired token 500s | 🟠 | — | ✅ `persona-a-auth-misc.spec.ts` |

## 3. Practice / exam session failures

| # | Failure mode | Impact | Fix / control | Guard |
|---|--------------|--------|----------------|-------|
| 3.1 | Exam crashes mid-session → student loses answers | 🔴 | Answer submit per-question; session resumable | ❌ no "mid-session resume" spec |
| 3.2 | Mock exam auto-submit at 0:00 fails → student stuck | 🔴 | Countdown timer + auto-submit on `timer.onEnd` | ❌ no spec |
| 3.3 | Question renders as raw markdown (pipes, LaTeX) | 🟠 | `<QuestionContent>` everywhere | ✅ B7 fix + `tests/unit/question-content.test.ts` |
| 3.4 | Daily practice cap bypassed by refresh | 🟠 | Server-side usage count from DB | ❌ no "bypass attempt" spec |
| 3.5 | No questions available for course × unit × difficulty combo | 🟠 | AI on-demand generation | 🟡 `quality-audit-cron.spec.ts` soft-covers; needs direct spec |
| 3.6 | AI question generation hangs → user waits forever | 🟠 | Provider cascade + 25s timeout | ❌ no spec |
| 3.7 | FRQ scoring wrong (false positive / false negative) | 🟠 | Validator fails-open, AI-scored | ❌ no golden-dataset spec (plan: DeepEval) |
| 3.8 | Knowledge-check race — submit before Groq JSON arrives | 🟡 | snapshot guard | ✅ fixed in Beta 1.5, no explicit spec |

## 4. AI (Sage) failures

| # | Failure mode | Impact | Fix / control | Guard |
|---|--------------|--------|----------------|-------|
| 4.1 | Sage hallucinates wrong answer | 🟠 | Enrichment cap 2.5s; system-prompt guardrails; "verify with your textbook" disclaimer | ❌ no golden-dataset spec |
| 4.2 | All AI providers down — user sees generic error | 🟡 | Pollinations-Free fallback (always available) | 🟡 `ai/status` returns fallback, no explicit spec |
| 4.3 | Sage enrichment (Wikipedia, Reddit) timeout blocks chat | 🟠 | Promise.race with 2.5s cap | ✅ code contract, no explicit spec |
| 4.4 | Follow-up parser fails — renders "FOLLOW_UPS: [...]" raw | 🟡 | regex strip | ❌ no spec |
| 4.5 | Tutor chat daily cap (3) bypassed by refresh | 🟠 | Server-side count | ❌ no spec |
| 4.6 | Sage Coach plan is generic instead of personalized (Premium) | 🟠 | tier check in `/api/coach-plan` | ❌ no spec |

## 5. Data / analytics failures

| # | Failure mode | Impact | Fix / control | Guard |
|---|--------------|--------|----------------|-------|
| 5.1 | Predicted AP score wrong (scaling, weighting) | 🔴 | Pure function + cutoffs | ✅ `score-predictor.test.ts` (14 cases) |
| 5.2 | Analytics chart shows wrong accuracy % | 🟠 | — | ❌ no spec |
| 5.3 | Streak counter increments on duplicate session | 🟡 | dedup in `updateUserProgress` | ❌ no spec |
| 5.4 | Mastery per-unit calculation stale after a session | 🟡 | write-through on session complete | ❌ no spec |
| 5.5 | Leaderboard shows authed-only data to anonymous | 🟠 | session check — now returns top-10 publicly, rank/xp gated | ✅ manual fix + persona-c-api-smoke |

## 6. Infra / deploy failures

| # | Failure mode | Impact | Fix / control | Guard |
|---|--------------|--------|----------------|-------|
| 6.1 | Banned Node SDK imported — CF Workers build fails | 🔴 | `scripts/check-cf-compat.js` pre-deploy | ✅ gate in pages:deploy |
| 6.2 | Neon HTTP transaction attempt — 500 at runtime | 🔴 | `$executeRawUnsafe` pattern | ✅ code contract |
| 6.3 | Secret leaked in client bundle | 🔴 | env var naming (NEXT_PUBLIC_ only) | ✅ `persona-c-security-headers.spec.ts` |
| 6.4 | Deploy rolls back silently on smoke-test failure | 🟠 | smoke-tests exit 1 blocks | ✅ in pages:deploy |
| 6.5 | Cron runs without CRON_SECRET | 🟠 | 401 check at top of every cron | ✅ `persona-c-api-smoke.spec.ts` |
| 6.6 | Question content in DB corrupts after AI gen | 🟠 | contentHash dedup + validator | 🟡 audit cron, no direct spec |

## 7. UX / content failures

| # | Failure mode | Impact | Fix / control | Guard |
|---|--------------|--------|----------------|-------|
| 7.1 | /register?track=X shows wrong copy | 🟠 | per-track CardDescription | ✅ B1 fix + unit test |
| 7.2 | Broken internal link (404) | 🟡 | conditional render based on VISIBLE_AP_COURSES | ✅ `persona-c-broken-links.spec.ts` |
| 7.3 | Mobile horizontal scroll | 🟡 | responsive CSS | 🟡 `persona-a-mobile.spec.ts` added today |
| 7.4 | Touch targets <44px on mobile | 🟡 | min-height 48px on buttons | 🟡 same spec |
| 7.5 | Light-mode color contrast fails WCAG AA | 🟡 | axe-core scan | 🟡 a11y-scan (fixed with B5) |
| 7.6 | PrepLion branding leaked in StudentNest copy | 🟠 | pre-release-check string scan | ✅ `scripts/pre-release-check.js` |

## 8. Security failures

| # | Failure mode | Impact | Fix / control | Guard |
|---|--------------|--------|----------------|-------|
| 8.1 | Open redirect via callbackUrl | 🔴 | next-auth same-origin gate | ✅ `persona-c-security-headers.spec.ts` |
| 8.2 | XSS via community thread post | 🔴 | React escapes + 3-layer moderation | ❌ no spec yet |
| 8.3 | SQL injection in search | 🔴 | Prisma parameterized | ✅ basic probe |
| 8.4 | Mass assignment — anonymous PATCH /api/user sets role | 🔴 | explicit field list | ✅ basic probe |
| 8.5 | Rate limit bypassed by changing IP | 🟠 | Durable Object + user-id keyed | ❌ no spec |
| 8.6 | Leaked Stripe webhook secret → attacker forges events | 🔴 | signature verify on every request | ✅ unit test |

---

## Top 10 highest-ROI unblocks (sorted by impact × open gap size)

Each of these turns at least one 🔴 / 🟠 row from ❌ to ✅ with manageable effort.

1. **3.2 Mock exam auto-submit spec** — classic "student loses the exam" scenario. Authed Playwright.
2. **3.1 Mid-session resume spec** — simulate refresh mid-practice; assert answers preserved.
3. **1.6 Duplicate checkout dedup** — Stripe test mode needed; idempotency key test.
4. **4.1 Sage golden dataset** — DeepEval with 30 questions + expected answer shape.
5. **3.4 Daily cap bypass spec** — hit cap, then refresh + retry; assert 429.
6. **5.2 Analytics accuracy** — synthetic user runs a known sequence, analytics must show the exact numbers.
7. **1.7 Cancel-before-periodEnd** — cancel, advance time, verify access lingers until period end.
8. **8.2 XSS in community** — post `<script>alert(1)</script>`, assert renders as text.
9. **5.3 Streak dedup** — complete two sessions back-to-back, streak counter must not double-count.
10. **2.4 CSRF on login** — assert bad csrfToken → 401.

## Process

- Every merged PR that touches a guarded area must update the corresponding row
  (e.g., flip 🟡 → ✅ when the E2E ships).
- A PR that introduces a new component goes in the FMEA as a new row.
- Weekly Monday retro: walk the 🔴 + 🟠 rows. One row per week graduates ❌ → ✅.
- Quarterly: re-rate impact. Rows that became stale get demoted or removed.
