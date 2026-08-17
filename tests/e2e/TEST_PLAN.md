# StudentNest E2E Test Plan

Comprehensive Playwright coverage map. Each row maps a feature → spec
file → test name(s). Status:

  - ✅ implemented and passing
  - ⏳ implemented but flaky / disabled
  - ❌ NOT YET implemented (gap)

Last updated: 2026-04-23 (after Dashboard v2 + Option B + Flashcards ship).

## Public marketing surface (no auth)

| Feature | Spec | Status |
|---|---|---|
| `/` landing renders with hero CTA | `public-paths.spec.ts` → "landing loads" | ✅ |
| `/pricing` shows both plans + 7-day refund | "pricing shows both plans" | ✅ |
| `/about` shows current Beta badge | "about shows current Beta badge" | ✅ |
| `/terms` has 7-day refund text | "terms has 7-day refund text" | ✅ |
| `/methodology` reachable | "no 'pass probability' visible" path scan | ✅ |
| `/wall-of-fame` reachable | path scan | ✅ |
| `/pass-rates` reachable | path scan | ✅ |
| `/am-i-ready` shows AP+SAT+ACT, hides 3 still-hidden APs | "am-i-ready picker" | ✅ |
| `/warmup` doesn't 404 (regression guard) | "warmup resolves" | ✅ |
| No "pass probability" leaks (7 paths) | scan describe | ✅ |
| No "PrepLion" leaks (8 paths) | scan describe | ✅ |
| `/login`, `/register`, `/forgot-password` reachable | NEW | ❌ |
| `/sat-prep`, `/dsst-prep`, `/how-hard-is/<slug>` reachable | NEW | ❌ |
| Marketing footer has all expected links | NEW | ❌ |

## Authentication

| Feature | Spec | Status |
|---|---|---|
| Test user provisioning via `/api/test/auth` | `auth.setup.ts` | ✅ implemented |
| Login → redirect to dashboard (credentials) | NEW | ❌ |
| Logout clears session | NEW | ❌ |
| Unauthed dashboard → redirect to login | NEW | ❌ |
| Google OAuth button visible on /login | NEW | ❌ |

## Dashboard v2 (the 5-block layout — central conversion surface)

| Feature | Spec | Status |
|---|---|---|
| `/dashboard` loads as authed user | `authed-flows.spec.ts` → "dashboard loads" | ✅ |
| Block 2: predicted score renders in native scale (e.g. "/5", "/1600", "/36") | "predicted score format" | ✅ |
| Block 5: LockedValueCard renders for FREE user with $9.99 anchor | "locked value visible to free user" | ✅ |
| Block 5: NOT visible to PREMIUM user | NEW | ❌ |
| Block 1: Resume card surfaces in-progress session | NEW | ❌ |
| Block 3: WeaknessFocusCard shows "Fix this unit" CTA | NEW | ❌ |
| Block 3: Free user sees locked "See exactly what to fix" line | NEW | ❌ |
| Block 4: DailyGoalCard renders | NEW | ❌ |
| Sidebar has Flashcards nav item | "sidebar shows flashcards" | ✅ |
| Sidebar nav: each link returns 200 (not 404) | NEW | ❌ |
| Mobile bottom nav renders on small viewport | NEW | ❌ |

## Practice flow

| Feature | Spec | Status |
|---|---|---|
| Start a quick MCQ session | NEW | ❌ |
| Submit a correct answer → see feedback | NEW | ❌ |
| Submit a wrong answer → knowledge-check appears | NEW | ❌ |
| Complete session → summary + SessionDeltaCard | NEW | ❌ |
| First-session: confetti fires + sessionStorage flag set | NEW | ❌ |
| FRQ practice blocked for FREE user with LOCK_COPY.frqLocked | NEW | ❌ |
| Daily 20-Q cap → SessionLimitHitCard with time-to-pass | NEW | ❌ |

## Mock exam

| Feature | Spec | Status |
|---|---|---|
| Start mock exam (Quick Mock) | NEW | ❌ |
| Free user hits Q5 paywall with "$9.99/mo" CTA | NEW | ❌ |
| Paywall shows projected score + time-to-pass comparison | NEW | ❌ |

## Diagnostic

| Feature | Spec | Status |
|---|---|---|
| `/diagnostic` loads | NEW | ❌ |
| Complete diagnostic → results page renders predicted score | NEW | ❌ |
| Free user sees blurred unit breakdown overlay | NEW | ❌ |

## Sage tutor

| Feature | Spec | Status |
|---|---|---|
| `/ai-tutor` loads | NEW | ❌ |
| Send a message → response renders | NEW | ❌ |
| Hit 3-chats/day cap → LOCK_COPY.tutorCap shown | NEW | ❌ |

## Flashcards (NEW feature shipped 2026-04-22)

| Feature | Spec | Status |
|---|---|---|
| `/flashcards` loads as authed user | `authed-flows.spec.ts` → "flashcards page loads" | ✅ |
| Initial card renders with front + Show answer button | "flashcards: show answer reveals back" | ✅ |
| Tap "Show answer" → back + explanation visible | "flashcards: show answer reveals back" | ✅ |
| Tap "Good" rating → next card slides in OR new batch loads | "flashcards: rate advances" | ✅ |
| Empty deck → empty state CTA renders | NEW | ❌ |

## Analytics

| Feature | Spec | Status |
|---|---|---|
| `/analytics` loads | NEW | ❌ |
| Free user sees lock on prescription detail | NEW | ❌ |

## Study plan + Sage Coach + Resources + Community

| Feature | Spec | Status |
|---|---|---|
| `/study-plan` loads | NEW | ❌ |
| `/sage-coach` loads | NEW | ❌ |
| `/resources` loads | NEW | ❌ |
| `/community` loads | NEW | ❌ |

## Billing

| Feature | Spec | Status |
|---|---|---|
| `/billing` loads | NEW | ❌ |
| Annual/monthly toggle changes price | NEW | ❌ |
| Upgrade button reachable (no actual payment) | NEW | ❌ |

## Admin (skip for now — needs ADMIN role test user)

| Feature | Spec | Status |
|---|---|---|
| `/admin` 403 for non-admin | NEW | ❌ |
| `/admin` loads for admin | NEW | ❌ |

## API contracts (light black-box checks)

| Feature | Spec | Status |
|---|---|---|
| `/api/user/limits` 401 unauthed | NEW | ❌ |
| `/api/user/limits` returns FREE_LIMITS for free user | NEW | ❌ |
| `/api/flashcards` 401 unauthed | NEW | ❌ |
| `/api/coach-plan?course=X` returns 200 for authed | NEW | ❌ |

## Cross-cutting regression guards

| Feature | Spec | Status |
|---|---|---|
| No "pass probability" in any user-visible copy | scan describe | ✅ |
| No "PrepLion" in user-visible copy (1 sister-site link allowed) | scan describe | ✅ |
| All sidebar links return 200 | NEW | ❌ |
| No console errors on dashboard load | NEW | ❌ |
| No 4xx/5xx on critical paths | NEW | ❌ |

## UAT / Student Persona

| Area | Persona goal | Acceptance bar | Test status |
|---|---|---|---|
| Public discovery | A new student can tell what PrepLion is in under 5 seconds | SAT and CLEP are first-class on the homepage and in top nav; `/sat-prep` and `/clep-prep` are easy to reach | ❌ |
| Authenticated entry | A logged-in student lands on the correct family without wrong defaults | No CLEP/DSST leakage into SAT; no redirect loops; dashboard renders on `preplion.ai` | ❌ |
| SAT dashboard | SAT uses score-native framing | Show projected `/1600`, Math `/800`, R&W `/800`, target gap, weak domains, next action; no `pass probability` | ❌ |
| SAT question flow | Student should not think the question is AI-generated | Bluebook-like density, restrained shell, proper stimulus and option treatment, no non-test chrome | ❌ |
| CLEP dashboard | CLEP uses exam-native framing | Keep CLEP score/readiness language, but no SAT Bluebook clone and no generic tutoring tone | ❌ |
| CLEP question flow | Student should feel CLEP format fidelity | Correct option count / NUMERICAL / MULTI_SELECT mix, concise stems, real test-prep explanations | ❌ |
| Security | App should not expose obvious attack surfaces | HSTS, nosniff, frame defense, open-redirect guard, XSS path safety, SQL-shaped query safety | ✅ |
| Performance | App should not feel slow or heavy | Landing and prep pages stay within Lighthouse budgets; no obvious dashboard jank | ❌ |
| SEO / reach | Product must be indexable and correctly described | Clean titles/descriptions/H1s/canonicals; public pages surfaced by sitemap; SAT not hidden behind CLEP | ❌ |

### UAT execution rules

- Use a real persona path, not just route existence.
- Treat samples as triage only; certify with full-bank re-solves.
- Record every mismatch in `docs/QA_BRIDGE.md` with exact repro and exact live state.
- SAT and CLEP are separate acceptance bars.
- Any surface that reads as AI-generated practice is still failing UAT.

## Coverage summary

- **Implemented**: 26 tests across `public-paths.spec.ts` + `authed-flows.spec.ts`
- **Gaps**: ~50 still ❌ — mostly authenticated flows requiring deeper UI fixtures

## Run

```bash
# All tests against live prod
npx playwright test

# Targeted
npx playwright test tests/e2e/authed-flows.spec.ts

# Against a preview URL
E2E_BASE_URL=https://preview.studentnest.pages.dev npx playwright test
```

## Setup notes

- **Auth fixture** (`tests/e2e/auth.setup.ts`): hits `/api/test/auth` with
  `CRON_SECRET`, gets a forged JWT, writes `tests/e2e/.auth/user.json`
  storage state. Requires `CRON_SECRET` env var (in `.env`).
- **Cleanup**: a separate teardown test or manual `curl` POST
  `{"action":"cleanup"}` deletes the test user. Currently only
  `scripts/functional-tests.js` cleans up — `auth.setup.ts` does not.
