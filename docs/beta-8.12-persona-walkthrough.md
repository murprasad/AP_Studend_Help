# Beta 8.12 — Persona Walkthrough (pre-deploy QA)

User explicit ask 2026-04-29: "Funnel fix should be tested thoroughly. Assume you are new student, walk through process. Also assume returning student, do the same thing. See if there is no confusion."

This document walks both personas step-by-step through the new auto-start flow, calling out exactly what happens at each click and where the user might still be confused so we can patch before the next deploy.

---

## Persona A — NEW student (Sarah, 11th grader, taking AP Bio)

### Pre-conditions
- `User.onboardingCompletedAt = NULL` (never finished a session)
- No localStorage state on her device

### Walkthrough

| Step | Action | What happens | Confusion risk |
|---|---|---|---|
| 1 | Hits `studentnest.ai/ap-prep` | Landing page renders. Sees AP cards including AP Biology. | None — landing matches CB. |
| 2 | Clicks "Start AP Prep — Free" | Routes to `/register?track=ap` | None |
| 3 | Fills email/password OR clicks Google OAuth | POST `/api/auth/register` succeeds OR Google redirect with `callbackUrl=/dashboard?track=ap` | None |
| 4 | (Credentials path) Email verifies → clicks "Go to Login" → enters creds → routes to `/dashboard` | Auth cookie set, lands on dashboard route | Brief flash of dashboard before redirect (acceptable, ~100ms) |
| 5 | Dashboard layout `useEffect` fires | Detects `onboardingCompletedAt === null` → `router.replace("/practice/quickstart")` | None — instant redirect |
| 6 | `/practice/quickstart` loads | Tiny banner: "Your first AP question is loading… Five quick questions. No setup. Let's see where you stand." | **⚠ BANNER VISIBLE FOR ~600ms WHILE API CALL HAPPENS.** Per spec we should pre-render Q1; v1 shows minimal banner instead. Acceptable if Groq stays fast. |
| 7 | POST `/api/practice/quickstart` returns `sessionId` | Page redirects to `/practice/[sessionId]?quickstart=1` | None |
| 8 | Practice page renders Q1 | Standard 5-Q session UI. Header says course (e.g. "AP World History"). | **⚠ CONFUSION RISK 1:** Sarah expected AP Biology (her track + her interest); we default to AP_WORLD_HISTORY. We didn't ask which course. |
| 9 | Sarah answers Q1 correctly | Inline feedback "Correct" with explanation popover (existing UI, modal-ish) | **⚠ CONFUSION RISK 2:** Per Beta 8.12 spec we wanted INLINE reinforcement, not a modal. Existing UI may render a modal-ish answer card. Need to verify in deploy. |
| 10 | Q2-Q5 answered | Standard practice flow | None |
| 11 | Q5 submitted → session completes via PATCH `/api/practice/[sessionId]` | `onboardingCompletedAt` set to NOW. Session score shown. | None |
| 12 | Sarah clicks "Continue" → `/dashboard` | This time `onboardingCompletedAt` is set → no redirect → standard dashboard | None |

### Confusion fixes needed (before "many users today")

**🔴 BLOCKER — Course mismatch (Step 8):** Sarah picked "AP Prep" (track), but we don't know she wants AP Biology. We dump her into AP World History without asking. Fix options:
   - **Quick fix:** Add ONE step before Q1 — "Which AP exam? [10 buttons]". Click → quickstart with that course. Adds 1 click + 5-10s decision but eliminates "wrong course" frustration.
   - **Slow fix:** Capture exam during signup (extend register form). Better long-term but more work.
   - **My recommendation:** quick fix in this deploy.

**🟡 SECONDARY — Inline vs modal feedback (Step 9):** Existing answer-explanation UI is a card (not full modal) that appears below the question. Verify in deploy that it doesn't break momentum. If it does, swap to a tiny one-line "Nice ✓" pill below the answer for the `?quickstart=1` path only.

**🟢 NICE-TO-HAVE:** Header during Q1-Q5 should clearly say "Question N of 5 — Starter Session" so Sarah knows it's a 5-Q intro, not a full hour.

---

## Persona B — RETURNING student (Mike, used StudentNest 3 weeks)

### Pre-conditions
- `User.onboardingCompletedAt = '2026-04-08'` (set when his first session completed)
- Has cookie/session
- Has practiced AP US History 12 times, AP Calc AB 4 times

### Walkthrough

| Step | Action | What happens | Confusion risk |
|---|---|---|---|
| 1 | Hits `studentnest.ai` | Landing page (logged-in users still see landing — could be improved later) | None |
| 2 | Clicks "Continue practicing" or navigates to `/dashboard` | Auth cookie → routes to `/dashboard` | None |
| 3 | Dashboard layout `useEffect` fires | Detects `onboardingCompletedAt !== null` → no redirect | None — works as before |
| 4 | Sees normal dashboard with course cards, recent sessions, stats | Standard returning-user view | None |
| 5 | Picks a course, starts a session normally | Goes through the existing /practice flow | None |

### Confusion fixes needed
None for returning users — they keep their existing experience.

### What we explicitly avoided breaking
- Returning user does NOT get auto-redirected to a 5-Q starter
- Mike's course preference, recent sessions, mastery stats — all intact
- Existing legacy `/onboarding` route still works if anyone deep-links to it

---

## Persona C (edge) — User who BOUNCED before, comes back

### Pre-conditions
- `User.onboardingCompletedAt = NULL` (never finished any session)
- Was a Stage 1 or Stage 2 dropoff in the prior 7 days

### Walkthrough
- Sign-in succeeds
- Dashboard layout sees `onboardingCompletedAt === null` → redirects to `/practice/quickstart` (NEW)
- Same as Persona A from there

### Why this is a feature, not a bug
Pre-Beta 8.12, returning bounced users would see the same dashboard that turned them away the first time. Now they get the auto-start flow on second visit too, which gives them another shot at first-question momentum. If they still bounce, we know it's content not flow.

---

## Pre-deploy verification checklist

**Tested manually before promote:**
- [ ] Persona A end-to-end on staging URL (sign up fresh email, walk Q1-Q5, verify onboardingCompletedAt set)
- [ ] Persona B end-to-end on staging URL (use existing test account, verify NO redirect to quickstart)
- [ ] Persona C — manually null `onboardingCompletedAt` on existing account, sign in, verify quickstart fires
- [ ] AP World History bank has ≥5 EASY MCQs (otherwise quickstart errors)
- [ ] /practice/quickstart shows banner, never blank screen
- [ ] /onboarding still loads (legacy users)

**Known limitations of v1 (deferred to Beta 8.13):**
- No course-pick step before Q1 (Sarah's confusion above) — quick-fix candidate for Beta 8.12.1
- Inline reinforcement is the existing answer card, not the spec's "Nice ✓" pill
- No "Q1 of 5" prominent header (relies on existing progress UI)
- No first-question pool curation (uses any EASY-difficulty Q in the bank)
- No Q1 difficulty engineering (just random EASY)
