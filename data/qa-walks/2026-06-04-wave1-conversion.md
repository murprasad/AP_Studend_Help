# QA Persona Walkthrough — Wave 1 Conversion Fixes (SN)

- **Change:** Wave 1 conversion fixes #48/#50/#52/#54/#55/#53 (branch `wave1-conversion-fixes-sn`)
- **Staging URL:** https://staging.studentnest.pages.dev
- **Date:** 2026-06-04
- **Gate:** G4 QA (load-bearing). DEV+REV already passed (REV verdict APPROVE).
- **Status:** ⏳ PENDING — automated E2E can't force correct-answer streaks; manual walk required.

## Why manual
The conversion triggers depend on answer-sequence state (5-correct streak, ≥3-streak-then-wrong, 30%/60% progress) that a headless test can't drive without answer-key hooks. So these must be eyeballed on staging.

## Walk steps (sign in as an established FREE user on staging)

### #55 Streak-forgiveness — `practice`
1. Start a practice session.
2. Answer **3 questions correctly**, then **1 wrong**.
3. ✅ EXPECT: a non-blocking line near the feedback — "Everyone has off days — your progress is saved. Keep going." Dismissible. Does NOT block Next.
4. ✅ EXPECT: answering 1 wrong with **no** prior streak shows nothing.

### #54 Convert-on-win upsell — `practice` (FREE user)
1. In a session, answer **5 questions correctly** in a row.
2. ✅ EXPECT: a tasteful upgrade card appears once, with a CTA linking to `/pricing`. (No emoji.)
3. ✅ EXPECT: dismiss it → it does NOT reappear later in the same session.
4. ✅ EXPECT (sign in as a PREMIUM user, repeat): upsell NEVER appears.

### #50 Mid-session pulse — `practice`
1. Start a session of ≥5 questions.
2. ✅ EXPECT: a brief encouraging pulse at ~30% and again at ~60% progress. Not on every question. Dismissible.

### #48 Calibrating framing — `diagnostic`
1. Take a diagnostic; answer only a few units (low-data, <8 answered).
2. ✅ EXPECT: a "Still calibrating" badge + "early estimate" framing; the predicted number is shown but de-emphasized (not a hard verdict).
3. ✅ EXPECT: a full diagnostic (≥8 answered) shows the normal confident colored result.

### #52 AP/CLEP auto-break — `mock-exam`
1. Start an **AP** mock exam with >30 questions (use a premium/full-length path).
2. ✅ EXPECT: at ~Q30 an optional "Take a breather" break screen with a Resume button; timer pauses and resumes intact; answers preserved.
3. ✅ EXPECT (SAT/PSAT/ACT mock): the existing module break is UNCHANGED.

### #53 Post-fail recovery cron — server-only (persona walk waived)
- Default DISABLED (needs `CRON_POST_FAIL_RECOVERY_ENABLED=true` + a per-incident marker column before enabling). Verify via `?dry=1` against staging with CRON_SECRET before any enable. No user-facing surface.

## Sign-off
- [ ] All ✅ checks pass on staging → promote OK
- [ ] Any ✗ → back to DEV (blocker), do not promote

## Notes from this session
- DEV+REV complete both products; tsc clean; REV APPROVE (1 MINOR + 2 NIT all addressed).
- Pre-existing staging E2E failures (22, chronic cold-start allowlist) are unrelated to this change.
- Follow-up: add answer-key test hooks so #54/#55/#50 can get real automated click-coverage (REV-flagged gap).
