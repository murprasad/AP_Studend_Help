# StudentNest Release Checklist — Comprehensive Test Matrix

**Goal: BEST QUALITY. No compromise. No site-down incident reaches users.**

Source of truth for what must hold before every `npm run pages:deploy`.
When a regression teaches us a new lesson, add a numbered item below so
it can't catch us again.

---

## Part A — Pre-deploy gates (blocks ship if any fails)

### A.1 Code health

1. **Clean bundle.** `npm run pages:build` starts with `pages:clean` —
   wipes `.open-next/`, `.cf-deploy/`, `.next/`. Never comment out.
   (Incident 2026-04-18 at bottom.)
2. **`npx tsc --noEmit`** passes. Must exit 0. No `any`-creep on new code.
3. **No uncommitted `.env*` files** staged to git. `git diff --cached | grep -E '^\+.*=.*'` returns empty after `grep -v '#'`.
4. **Lint clean** — `npm run lint` passes or all warnings acknowledged.
5. **No `console.log` leftovers** in new code (`grep -n "console\.log" src/ --include '*.ts*' | wc -l` should match baseline).

### A.2 Database + infrastructure

6. **Schema migrations applied.** If `prisma/schema.prisma` changed,
   run `npx prisma db push` BEFORE deploying — else deploy reads a
   column that doesn't exist and throws at request time
   (incident 2026-04-18: `users.dailyQuizOptIn does not exist`).
   Verify with: `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script` → should produce no diff.
7. **Env vars exist** on Cloudflare Pages: `DATABASE_URL`,
   `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GROQ_API_KEY`,
   `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`,
   `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Missing any = auth or
   AI will silently 500.
8. **Prisma generate uses the engine (no `--no-engine`)** on prod.
   That flag only works with Prisma Accelerate (`prisma://` URLs);
   our prod uses direct Neon HTTP → server components throw.
9. **Cloudflare Pages project has `_routes.json`** that excludes
   `public/` statics from the worker: `/sw.js`, `/manifest.webmanifest`,
   `/favicon.ico`, `/robots.txt`, `/sitemap.xml`, `/og-image.svg`,
   `/icons/*`, `/fonts/*`, `/images/*`.
10. **Service worker strategy reviewed.** `public/sw.js` must be
    network-only or network-first with TTL < 5 min. If you switch to
    cache-first, bump `CACHE_NAME` so existing clients purge.

### A.3 Tests

11. **Unit tests pass** — `npm test` or `vitest run` exits 0.
12. **Negative:positive ≥ 3:1** on any new feature (project policy).
13. **E2E smoke scripts pass** — if `tests/*.spec.ts` exists, run at least
    the Real Student Journey in `tests/real-user-journey-full.spec.ts`.
14. **Prisma client regenerated for local scripts** — run `npx prisma generate`
    after any schema change so `scripts/*.mjs` dev-time tools still work.

### A.4 Docs alignment

15. **REQUIREMENTS_LEDGER.md** — every new REQ-### has a row with
    status, code ref, test ref, commit.
16. **COMPREHENSIVE_TEST_PLAN.md** — appended for the new feature.
17. **Copy sweep** — AP/SAT/ACT course counts correct post-sunset
    (16 total courses: 10 AP + 2 SAT + 4 ACT). No stale "CLEP" or
    "DSST" mentions on AP/SAT/ACT-only surfaces (Sage tagline,
    landing, pricing, FAQ, methodology).

---

## Part B — Post-deploy smoke (the Big Five + supporting checks)

### B.1 The Big Five user-facing flows (**BLOCKING — ALL must pass**)

**Every deploy: walk the 5 flows below in order before you announce the
release.** Any failure → rollback + diagnose. Don't skip any.

#### 1. Sign-up
- Visit `/register`
- Enter a throwaway email + password + required profile fields
- Submit → expect a 200 and account creation
- Expected next: redirect to `/login?registered=1` or email-verify page
- Verify in DB: `SELECT email, emailVerified, onboardingCompletedAt FROM users WHERE email='<throwaway>'`
- **Failure modes to watch for:** Prisma schema drift (missing column), duplicate email handling, Zod validation missing, NextAuth misconfig.

#### 2. Login
- Visit `/login`
- Enter `murprasad+std@gmail.com` / `TestStd@329`
- Submit → expect redirect to `/dashboard` + `next-auth.session-token` cookie set
- **Known failure modes:** missing `users.<new-column>` after schema drift, `--no-engine` Prisma flag, stale bundle, wrong `NEXTAUTH_URL`/`NEXTAUTH_SECRET`.
- Curl check:
  ```bash
  CSRF=$(curl -s -c /tmp/jar https://studentnest.ai/api/auth/csrf | sed 's/.*"csrfToken":"\([^"]*\)".*/\1/')
  curl -s -b /tmp/jar -c /tmp/jar -X POST https://studentnest.ai/api/auth/callback/credentials \
    -d "email=murprasad%2Bstd%40gmail.com&password=TestStd%40329&csrfToken=$CSRF&redirect=false&json=true"
  ```
  Expect `{"url":"https://studentnest.ai/..."}` — success. If URL contains `/api/auth/error?error=...` login failed.

#### 3. Sign-out
- From dashboard: open user menu → **Sign out**
- Expect redirect to `/` + session cookie cleared (`document.cookie` no longer contains `next-auth.session-token`)
- Revisit `/dashboard` → must redirect to `/login`
- **Failure modes:** session cookie not cleared, redirect loop, CSRF mismatch on signout.

#### 4. Dashboard
- Fresh logged-in session → visit `/dashboard`
- Must render **all** of:
  - Welcome header with first name
  - **ReadinessCard** (projected AP/SAT/ACT score + confidence badge + disclaimer)
  - Streak/Level/Accuracy stat cards (3)
  - XP progress bar
  - Focus Areas (weak units list) or "All units at 70%+" empty state
  - Recent Sessions list or "Ready to start your first session?" empty state
  - Sidebar (desktop) or hamburger menu (mobile)
- `/api/readiness?course=<current>` must return 200 with `{ scaledScore, label, confidence, disclaimer }`.
- **Failure modes:** null user from deleted row, schema column missing, prisma query N+1 timeout, score predictor throws on empty masteryData.

#### 5. Practice (critical — this is where students live)
- Dashboard → **Start Practice** (Quick Practice, AP World History)
- Session starts → a question renders with 4-5 options + stimulus (if present)
- Answer Q1 → feedback card renders with correct answer + explanation
- Click **Next** → Q2 renders
- Answer through all questions → session summary shows accuracy, XP, time
- **Failure modes:** `/api/practice` 401/403/500, `options` is null/empty array, `AbortSignal.timeout` fires early, FRQ rubric scoring hangs.

### B.2 Supporting infrastructure smoke

Run these curl checks after every deploy:

| Check | Command | Expected |
|---|---|---|
| Landing | `curl -I https://studentnest.ai/` | 200 |
| Login page | `curl -I https://studentnest.ai/login` | 200 |
| Dashboard (unauth) | `curl -I https://studentnest.ai/dashboard` | 307 → `/api/auth/signin?callbackUrl=%2Fdashboard` |
| NextAuth CSRF | `curl -I https://studentnest.ai/api/auth/csrf` | 200 |
| NextAuth providers | `curl -I https://studentnest.ai/api/auth/providers` | 200 |
| NextAuth session (unauth) | `curl -I https://studentnest.ai/api/auth/session` | 200 (empty body `{}`) |
| Am I Ready | `curl -I https://studentnest.ai/am-i-ready` | 200 |
| Am I Ready slug | `curl -I https://studentnest.ai/am-i-ready/ap-psychology` | 200 |
| Methodology | `curl -I https://studentnest.ai/methodology` | 200 |
| Pricing | `curl -I https://studentnest.ai/pricing` | 200 |
| About | `curl -I https://studentnest.ai/about` | 200 |
| FAQ | `curl -I https://studentnest.ai/faq` | 200 |
| sw.js | `curl https://studentnest.ai/sw.js` | matches `public/sw.js` byte-for-byte |
| Manifest | `curl -I https://studentnest.ai/manifest.webmanifest` | 200, Content-Type `application/manifest+json` or `application/json` |
| /api/feature-flags | `curl -I https://studentnest.ai/api/feature-flags` | 200 |
| /api/am-i-ready-quiz | `curl 'https://studentnest.ai/api/am-i-ready-quiz?course=AP_PSYCHOLOGY'` | 200 + `{ questions: [5] }` |
| /api/user (unauth) | `curl -I https://studentnest.ai/api/user` | 401 |
| /api/readiness (unauth) | `curl -I https://studentnest.ai/api/readiness?course=AP_PSYCHOLOGY` | 401 |
| /api/admin/reset-test-users (unauth) | `curl -I https://studentnest.ai/api/admin/reset-test-users` | 401 |
| /api/cron/trial-reengagement (no auth) | `curl -I https://studentnest.ai/api/cron/trial-reengagement` | 401 |
| /api/cron/daily-quiz (no auth) | `curl -I https://studentnest.ai/api/cron/daily-quiz` | 401 |

---

## Part C — Full feature test matrix

Every feature below must have **Positive tests** + **≥3× Negative/Edge tests**.

### C.1 Authentication & session

| Test | Type | Scenario | Expected |
|---|---|---|---|
| Sign-up with valid email/password | + | Submit form | 200, DB row created, email verification sent |
| Sign-up with duplicate email | − | Reuse existing email | 409 or friendly error, no DB dup |
| Sign-up with password < 8 chars | − | Short password | Validation error, no DB row |
| Sign-up with malformed email | − | Missing `@` | Validation error |
| Sign-up with SQL in name field | − | First name `'; DROP TABLE users;--` | Sanitized; row created with literal string |
| Sign-up with 10MB body | − | Oversize JSON | 413 or rejected quickly |
| Login with valid creds | + | Test user | Redirect to /dashboard |
| Login with wrong password | − | Right email, wrong pw | "Invalid email or password" |
| Login with unverified email | − | Account not yet verified | "Please verify your email" |
| Login with Google-only account via password | − | User registered via Google | "This account uses Google login" |
| Login with deleted account | − | User row deleted between sessions | Error, no 500 |
| Login rate-limit | − | 20 attempts/min | 429 after threshold |
| Sign-out | + | Click signout | Redirect to /, cookie cleared |
| Sign-out after session expired | − | Expired JWT | Graceful redirect to /login |
| CSRF token fetch | + | GET /api/auth/csrf | 200 + token |
| Invalid CSRF on signin | − | POST with wrong csrfToken | NextAuth rejects |

### C.2 Onboarding flow

| Test | Type | Expected |
|---|---|---|
| First-time user redirected to /onboarding | + | Layout redirect |
| User completes onboarding | + | DB `onboardingCompletedAt` set |
| Onboarding step 2 trial CTA works | + | `/api/user` PATCH, JWT update |
| User clicks "Continue free" | + | Lands on /dashboard |
| Admin reset-test-users nulls `onboardingCompletedAt` | + | Test user re-walks onboarding on next login |
| User with DB `onboardingCompletedAt` set but no localStorage flag | − | Auto-sync localStorage, no redirect |
| User with localStorage flag but null DB | − | Force redirect to /onboarding, clear localStorage |
| Network failure during onboarding completion | − | Toast error, stay on onboarding |
| Refresh mid-onboarding | − | Resume at same step |

### C.3 Diagnostic & Score Predictor

| Test | Type | Expected |
|---|---|---|
| Take diagnostic → score predictor returns 1-5 AP | + | UI renders "Projected AP Score: 4" |
| Score predictor with empty mastery | − | `showScore=false`, label "Take diagnostic to start" |
| Score predictor with all-zero scores | − | scaledScore=1, confidence=low |
| Score predictor with NaN in mastery | − | Falls back to 0, no throw |
| SAT predictor returns 400-1600 composite | + | Math + R&W section scores |
| SAT predictor with no Math section data | − | Math shows 200 floor |
| ACT predictor returns 1-36 composite | + | 4 section scores |
| ACT composite averaging rounds correctly | + | 32 + 28 + 24 + 20 = 104/4 = 26 |
| Predictor with 10k+ total answered (overflow?) | − | Still returns valid 1-5 |
| Diagnostic full-screen mode active during testing | + | Sidebar + header hidden |
| Exit exam mode button works | + | Returns to /dashboard |
| Diagnostic exits exam mode on auto-navigate-away | + | Sidebar re-renders |
| ConfidenceRepairScreen shows for pp<60 | + | Renders before results |
| ConfidenceRepairScreen hides for pp≥60 | + | Skipped |
| Diagnostic abandoned mid-flight | − | IN_PROGRESS session, no score recorded |

### C.4 Practice

| Test | Type | Expected |
|---|---|---|
| Quick Practice MCQ answer correct | + | Feedback card, +XP |
| Quick Practice wrong answer | + | Feedback with explanation |
| Free user hits 3-session/day cap | − | 429 with upgrade prompt |
| FRQ practice as FREE user | − | 403 "Premium only" |
| FRQ practice as PREMIUM | + | AI rubric scoring renders |
| Question with `options: null` | − | Recovery UI (error state), not blank buttons |
| Question with malformed JSON options | − | try/catch prevents crash, empty options |
| Answer submitted for deleted question | − | Graceful 404, not 500 |
| Back button mid-session | − | Resume or "Save & exit" prompt |
| Numeric entry with tolerance | + | `0.01` tolerance or `×0.005` |
| Numeric entry with non-numeric input | − | Fall back to string compare |
| Multi-select order-independent | + | "A,C" matches "C,A" |
| Timer auto-advance timeout | + | Blank answer recorded, next Q |
| Early-win boost applies to low-diagnostic users | + | First 2 Qs are EASY non-weak-unit |

### C.5 Mock Exam

| Test | Type | Expected |
|---|---|---|
| Mock exam start as FREE user | − | Paywall: "Upgrade to take mock" |
| Mock exam start as PREMIUM | + | Timer starts, exam mode active |
| Time up → auto-submit | + | Summary renders |
| Submit partially-answered | + | Scored on what's answered |
| Paywall fail-closed on /api/user slow response | + | Doesn't flash premium content |
| Exam mode: sidebar hidden during section1 | + | Full-screen |
| Exit exam mode button visible | + | Desktop only, not mobile |
| Refresh mid-exam | − | Resume with timer state |

### C.6 Sage AI Tutor

| Test | Type | Expected |
|---|---|---|
| Logged-in user sends message | + | Response streams |
| Anonymous user on public page | + | Allowed, rate-limited by IP |
| Rate limit hit (anon 10/min) | − | 429 after 10 |
| Rate limit hit (auth 30/min) | − | 429 after 30 |
| Groq + Anthropic both down | − | Pollinations fallback kicks in |
| All providers down | − | Friendly error, not 500 |
| Cached response from SageFAQ match | + | Served from FAQ |
| Course context leaks in system prompt | − | Only active course mentioned, no CLEP/DSST for AP user |
| AI Tutor full-screen mode | + | Sidebar hidden on /ai-tutor |

### C.7 Billing

| Test | Type | Expected |
|---|---|---|
| FREE user upgrades to AP_PREMIUM | + | Stripe checkout, webhook → subscription active |
| Webhook signature invalid | − | 400, no subscription record |
| Webhook with missing metadata.module | − | Graceful default, logged |
| Premium user cancels | + | `stripeSubscriptionStatus: canceling`, access until period end |
| Refund within 7 days | + | Full refund, subscription revoked |
| Billing polling: update() rejects | − | `setRefreshing(false)` called anyway |
| Accuplacer Fast Track checkout (not applicable on StudentNest) | skip | — |

### C.8 Analytics

| Test | Type | Expected |
|---|---|---|
| User with 0 sessions | + | Empty states, no 500 |
| User with 100+ sessions | + | Timeline chart renders |
| Malformed goalData | − | Renders without goals, no crash |
| Timeout on /api/analytics | − | Stale data banner, not blank page |
| Service disabled flag | − | 503 → "Under maintenance" UI |
| Responses with null correctAnswers | − | Treated as 0 |

### C.9 Admin

| Test | Type | Expected |
|---|---|---|
| Admin logs in | + | `/admin` renders |
| STUDENT visits /admin | − | Redirect to /dashboard |
| Admin Test Users tab | + | 4 test slots render |
| Reset test user | + | All activity wiped, `onboardingCompletedAt=null` |
| Reset non-test-user email | − | 400 "Not a test account" |
| Set tier PREMIUM | + | `subscriptionTier` updated |
| Admin AI Usage card loads | + | Shows 24h stats |

### C.10 Marketing pages

| Test | Type | Expected |
|---|---|---|
| Landing hero picker | + | Select AP → /am-i-ready/ap-* |
| Am I Ready quiz 5 questions | + | Score predictor outputs AP 1-5 |
| Am I Ready quiz unauth rate limit | − | 5 req/min/IP, then 429 |
| /methodology renders | + | 4 sections + disclaimer |
| /pricing renders current copy | + | $9.99/mo, no CLEP/DSST |
| /faq course count accurate | + | "16 courses" post-sunset |
| /about page course list | + | 10 AP + 2 SAT + 4 ACT |
| Post-sunset CLEP pages | ❌ SUNSET | Return 404 or redirect to preplion.ai |
| Logo click from any page | + | Routes to / |
| Mobile nav hamburger | + | Opens sidebar |

### C.11 Cron endpoints

| Test | Type | Expected |
|---|---|---|
| /api/cron/trial-reengagement with Bearer | + | Processes dormant trials, returns `{ sent, skipped, errors }` |
| /api/cron/trial-reengagement no Bearer | − | 401 |
| /api/cron/trial-reengagement `?dry=1` | + | No email sent, logs only |
| /api/cron/daily-quiz with Bearer | + | Sends 3-Q email per opted-in user |
| /api/cron/daily-quiz env disabled | + | Exits immediately, no sends |
| /api/cron/daily-quiz 30-day dedup | + | Same question can't repeat in 30d |
| /api/daily-quiz-track?event=open | + | Records `openedAt`, returns 1x1 GIF |
| /api/daily-quiz-track invalid token | − | 404 silently, no 500 |

### C.12 Security surface

| Test | Type | Expected |
|---|---|---|
| Sage unauth no rate limit | − | Previously 0 rate limit — now 10/min/IP |
| Tutor error leaks `C:\Users\akkil\...` path | − | Previously did — now generic error |
| /api/questions/[id]/report double-increment | − | Previously did — now single |
| Admin analytics revenue leak | − | Returns revenue — acceptable for ADMIN only |
| Stripe webhook replay | − | Idempotency key catches |
| CSRF on POST /api/community/threads | − | Accept if same-origin, reject cross |

### C.13 PWA

| Test | Type | Expected |
|---|---|---|
| manifest.webmanifest valid JSON | + | Status 200, parses |
| sw.js fetched | + | Status 200, network-only strategy |
| Service worker v5 purges old caches on activate | + | `caches.keys()` empty after activation |
| Install to home screen on Android | + | standalone mode works |
| Install on iOS (Add to Home) | + | standalone mode works |
| Offline navigation | − | 503 "Service temporarily unavailable" (no PWA offline in v5) |

---

## Part D — Release gate procedure (who checks what, when)

1. **Engineer** runs Part A.1-A.4 locally. `npm run pages:build` succeeds.
2. **Engineer** runs `npx prisma db push` if schema changed.
3. **Engineer** runs `npm run pages:deploy`.
4. **Engineer** runs Part B.2 curl smoke (takes ~30s).
5. **Engineer** walks Part B.1 Big Five in browser (takes ~5 min).
6. **Engineer** spot-checks 3-5 Part C test rows for the feature being
   released.
7. Only then: tag the release + announce.

---

## Incident log

### 2026-04-18 — Schema drift + stale bundle chain

Multiple issues compounded:

- **Stale bundle**: `.cf-deploy/` had a mix of ancient `_worker.js` + new
  server functions → NextAuth `/api/auth/*` returned 400 → ERR_FAILED on
  /dashboard for all users including Incognito.
- **Root**: `pages:deploy` didn't rebuild cleanly when the Prisma
  `--no-engine` flag was silently failing. Pre-release-check returned
  exit 0 despite the upstream failure.
- **Secondary**: after clean rebuild, Daily Quiz Email schema addition
  (`users.dailyQuizOptIn`) wasn't applied to prod DB. Deploy shipped code
  expecting the column → login returned `column users.dailyQuizOptIn
  does not exist` for every user.

**Fixes:**
- `pages:build` prepends `pages:clean` (rule A.1 #1).
- Rule A.2 #6 explicitly requires `prisma db push` before deploy.
- Rule B.1 #2 "Login" is now a blocking post-deploy smoke.
- This doc restructured to comprehensive form per user directive
  "BEST QUALITY no compromise".

---

## Emergency recovery

Site is down (ERR_FAILED, 500s, infinite loops):

1. `curl -I https://studentnest.ai/` — if not 200, deploy is bad.
2. `curl https://studentnest.ai/api/auth/csrf` — if not 200, NextAuth
   broke. 99% of the time: stale bundle or missing schema column.
3. Clean rebuild locally:
   ```bash
   cd C:/Users/akkil/project/AP_Help
   rm -rf .open-next .cf-deploy .next
   # If AP gen jobs hold the DLL:
   mv node_modules/.prisma/client/query_engine-windows.dll.node \
      node_modules/.prisma/client/query_engine-windows.dll.node.old
   npx prisma db push  # catches schema drift
   npm run pages:build
   npx wrangler pages deploy .cf-deploy --project-name=studentnest --commit-dirty=true
   ```
4. Re-run Part B.1 Big Five smoke test.
5. If the issue is a cached broken SW on existing users' browsers,
   bump `CACHE_NAME` in `public/sw.js` and redeploy. Current SW (v5)
   is network-only so this class of bug is defanged.
