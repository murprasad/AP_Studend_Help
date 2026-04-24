# Bugs surfaced by persona test run — 2026-04-24

First run of Persona A + Persona C public suite against https://studentnest.ai.
Result: 83 passed / 9 failed / 3 skipped out of 95 tests.

## B1 — Register track copy broken for SAT / ACT / CLEP [REAL BUG]

**Severity:** High (conversion-blocker).

**Repro:** Visit `/register?track=sat` or `/register?track=act`. CardDescription
shows **"Start your AP exam journey today — free"** regardless of track.

**Expected:** Track-appropriate framing:
- sat → "SAT" language
- act → "ACT" language
- clep → "CLEP — earn college credit — free"
- ap (default) → "AP exam journey"

**Release history:** Beta 2.0 (2026-03-20) claimed B2-03 was fixed. It wasn't for non-AP tracks.

**Fixture:** anonymous (public page).
**File:** `src/app/(auth)/register/page.tsx`.
**Test guard:** `tests/e2e/persona-a-register-tracks.spec.ts`.

## B2 — Broken internal links on /clep-prep, /dsst-prep, /pass-rates [REAL BUG]

**Severity:** Medium (SEO + UX).

**Repro:**
- `/clep-prep` → link to `/accuplacer-prep` (404)
- `/dsst-prep` → links to `/accuplacer-prep` and `/clep-military` (both 404)
- `/pass-rates` → links to `/how-hard-is/ap-chinese`, `/how-hard-is/ap-spanish`, `/how-hard-is/ap-english-language` (all 404)

**Fix options:**
- Create the missing pages, OR
- Remove the links if those pages are not planned.

**Test guard:** `tests/e2e/persona-c-broken-links.spec.ts`.

## B3 — 500-status resource loads on /terms, /sat-prep, /wall-of-fame [REAL BUG]

**Severity:** Medium (silent error — users don't see failure but something is broken).

**Repro:** Load `/terms`, `/sat-prep`, or `/wall-of-fame`. Browser console shows
"Failed to load resource: the server responded with a status of 500 ()".
`/wall-of-fame` ALSO shows a 401.

**Diagnosis needed:** Which resource — asset bundle chunk? API call from RSC?
Probably same root cause across the three.

**Test guard:** `tests/e2e/persona-c-console-errors.spec.ts`.

## B4 — Landing page "Sign in" link labeled something else [TEST EXPECTATION]

**Severity:** Low. Test adjustment, not an app bug.

**Observed:** `/login` anchor is present (href correct) but text is not "Sign in" —
likely "Log in" or similar. My test regex was `^sign\s*in$` which misses alternatives.

**Fix:** Relax the test to match any anchor with `href=/login` regardless of inner text.

## B5 — a11y-scan authed pages timeout at 30s [TEST INFRA BUG]

**Severity:** Medium. Blocks every authed a11y assertion (10 tests × retries).

**Repro:** `tests/e2e/a11y-scan.spec.ts` uses `page.waitForLoadState("networkidle")`
on authed pages. Dashboard has active polling (daily goal, due cards,
session.update()) → `networkidle` never settles within 30s test budget.

**Fix:** Switch to `waitUntil: "domcontentloaded"` + `waitForTimeout(2000)`.
Axe analyses the rendered DOM; 2s post-DOM is enough.

## B6 — billing-page-consistency: waitForTimeout > test budget [TEST INFRA BUG]

**Severity:** Medium. Blocks the Premium/Free UI-honesty guard.

**Repro:** `tests/e2e/billing-page-consistency.spec.ts:19` calls
`page.waitForTimeout(35000)` inside a test with default 30s per-test timeout.
Always times out.

**Fix:** `test.setTimeout(60_000)` inside the specific test.
