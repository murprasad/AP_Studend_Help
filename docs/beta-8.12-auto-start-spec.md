# Beta 8.12 — Auto-start + Q1 Momentum Spec

**Driver:** 7-day funnel showed 37% of new free signups never start a session
(Stage 1 leak). Content quality only matters for Stage 2-3 (combined 26%).
First fix: eliminate decision points between signup and Q1.

**User-confirmed requirements (2026-04-29):**

> "The first 30 seconds must feel like progress without effort."

## Hard rules (do not violate)

1. **No "loading session…" screen.** Pre-render Q1 server-side (or have it in
   the bundle before the user even clicks). The click → first question must
   be one paint, no spinner.
2. **No predicted score before Q1.** No "your estimated AP score is…"
   before the user has earned it.
3. **No premium upsell on the practice screen until first session is
   completed.** Even a small "upgrade" pill triggers "this costs money" mode.
4. **No empty states, skeleton loaders, "preparing your session…" text.**
   Anywhere in the first 30s.

## Q1 engineering rules

1. **Q1 is NOT random.** Pick from a curated "first-question pool" per course.
   Pool criteria: difficulty=EASY, has been answered correctly by ≥80% of
   prior students who saw it, no stimulus required, ≤15 words in question
   stem, ≤8 words per option.
2. **Goal is momentum, not assessment.** First question's job is to give the
   user a "yes I can do this" moment, not to calibrate skill.
3. **Q2-Q5 step up gradually.** Q1 EASY → Q2 EASY → Q3 MEDIUM → Q4 MEDIUM →
   Q5 standard. (Build confidence before challenge.)

## Flow

```
Signup (email or Google OAuth)
  ↓
[track set?] — Y → skip course pick
              N → ONE screen: "Pick your exam: AP / SAT / ACT" → most-popular course in that exam
  ↓
Q1 already painted on screen — no loading
  ↓
User clicks answer
  ↓
Inline reinforcement: "Nice — let's lock this in." (10pt text below the option, 600ms fade)
  ↓
Q2 already in DOM (preloaded)
  ↓
... up to Q5
  ↓
"You got X of 5 — here's where you stand" (FIRST score signal, after momentum)
  ↓
[CTA] "Continue to your full study plan" + "Try a different course"
```

## UI affordances

- Header: "Question 1 of 5" — finite progress visible from second 1
- No "Skip" button on Q1-Q3 (forces engagement)
- Answer options: 48px min tap target; large hover area; tap → instant submit (no "Confirm" button)
- Inline reinforcement copy bank (rotate randomly):
  - "Nice — that's exactly right."
  - "Good start — let's keep going."
  - "Locked in. Q2 ready."
  - For wrong answers (gentle): "Close — the answer was {X}. Q2 is up next."
- No emoji. No celebration animations. Subtle and confident, not childish.

## Implementation surface

- `src/app/(auth)/register/page.tsx` — after successful signup, redirect to
  `/practice/start?track={track}` instead of `/onboarding`
- New route `src/app/practice/start/page.tsx` — server component, queries
  the first-question pool for the user's track + course, returns Q1 SSR
- New table column or query path: `Question.firstQuestionPool: boolean` —
  add as a marker on curated EASY questions
- `src/components/practice/answer-feedback.tsx` — inline reinforcement
  component (replace existing modal-style explanation popover for Q1)
- `src/app/onboarding/page.tsx` — keep but only show if user manually
  navigates there (legacy / "I want to change course"); not in primary flow

## Risks to watch

1. **First-question-pool too small per course.** Need ≥10 EASY+high-success
   Qs per course or rotation feels stale. Mitigation: backfill curated EASY
   questions for every course with the gap-filler.
2. **SSR + auth race.** Server component needs the just-created user's
   session. Mitigation: pass `userId` via signed cookie or use
   `getServerSession` in server component.
3. **Track-not-set fallback.** Single-screen course pick must still feel
   like 1 click — use big visual cards (AP / SAT / ACT) and auto-pick the
   most popular course in the exam.
4. **Tracking.** Need analytics events: `practice_first_q_shown`,
   `practice_first_q_answered`, `practice_first_session_completed` so we
   can measure Stage 1→Stage 5 conversion improvement.

## Done criteria

- Stage 1 drop (signup → no session) drops from 37% to <15% in next 7 days
- Stage 2 drop (session → no answer) drops from 11% to <5%
- Stage 5 engagement rate climbs from 33% toward 50%
