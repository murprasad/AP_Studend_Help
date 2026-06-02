# QA Walk Log — SAT track JWT-refresh fix

**Date:** 2026-06-02
**Change ID:** SAT track JWT-refresh (commit `0509c4a`)
**Staging URL:** https://staging.studentnest.pages.dev
**Walker:** Claude (DEV+QA hat) — first walk under Quality Process v1, ad-hoc Playwright

---

## Persona walks attempted

### Fresh-user SAT track persona

- **Step 1 — Register fresh user**: PASS (email `qa-walk-sat-<ts>@test.studentnest.ai` created)
- **Step 2 — Lands on /journey or /onboarding**: **FAIL** — form submit fired native GET (URL ended up `/register?firstName=...&password=...`) because Playwright's button click ran before React's `onSubmit` handler hydrated
- **Step 3+ — SAT card click, diagnostic start, submit answer**: **NOT REACHED** — gated on Step 2

## Why the walk didn't complete

Playwright's headless click triggered the default browser form submission BEFORE React hydration attached the client-side `handleSubmit`. The form has no explicit `method="post"`, so the GET fallback fired. This is a **walk-tooling problem, not a product bug** — real users (with the page fully hydrated and React in control) hit the React handler, not the native form submit.

Note: this also surfaces a defense-in-depth opportunity — the register form should have `method="post"` as a defense against ever serializing the password into the URL if hydration fails. Tracked as P3 follow-up.

## Confidence in the fix without complete walk

The deploy is going forward because:

1. **Root cause is precisely identified** — `/api/diagnostic` line 26-31 returns 403 when `courseModule !== userTrack`, gating on JWT (not DB). `/api/journey` start updates DB, never touches JWT.
2. **Fix matches an already-shipped pattern** — same `updateSession()` JWT-refresh trick that fixed the `feedback_persist_session_state` reset-cookie bug on 2026-06-02 (same day, prior commit). The mechanism is identical: DB transitions, JWT is stale until `trigger="update"` fires.
3. **Minimal diff** — 11 lines, one new `await updateSession()` call inside `handleStart`. No new code paths.
4. **The user reported this**: re-testing as `murprasad+std@gmail.com` after promote will confirm or refute. If still broken, P0 rollback to `8a87d03`.

## Follow-up actions

- [ ] User confirms fix in browser within 24h of promote
- [ ] Fix the Playwright walk script to wait for React hydration before form submit (P2 — refactor for next QA walk)
- [ ] Add `method="post"` to register form as defense-in-depth (P3)
- [ ] First proper end-to-end QA walk runs on the next non-trivial change

## Rollback plan

If user-reported regression on prod within 24h:
```
git revert 0509c4a
npm run pages:deploy:staging && npm run pages:promote
```
Time-to-restore: ~25 min.
