# Comprehensive Practice Session Test Plan
**Version:** Beta 1.13 | **Date:** 2026-03-20

This plan tests every meaningful combination of course × unit × difficulty × question type.
Each test is written from a student's perspective — start at `/practice`, make selections, start session, answer questions.

---

## Prerequisites

- Logged in as a test user (FREE tier unless noted)
- `premium_feature_restriction` setting = **"false"** (default — all features open to all users)
- AI generation enabled (`ai_generation_enabled = "true"`)
- At minimum 1 question in DB per course (or AI generation will bootstrap)

---

## SECTION 1 — Session Creation (All Courses × Basic Combos)

### Smoke Test Matrix
For each course, verify a Quick Practice session starts and loads questions without error.
**Expected:** Session loads within 30s; at least 1 question displayed; no 500 error; no "Starting..." hang.

| # | Course | Unit | Difficulty | Q-Type | Expected Result |
|---|--------|------|-----------|--------|-----------------|
| 1 | AP_WORLD_HISTORY | ALL | ALL | MCQ | ✅ Session starts, questions load |
| 2 | AP_WORLD_HISTORY | UNIT_1_GLOBAL_TAPESTRY | EASY | MCQ | ✅ Session starts |
| 3 | AP_WORLD_HISTORY | UNIT_5_REVOLUTIONS | MEDIUM | MCQ | ✅ Session starts |
| 4 | AP_WORLD_HISTORY | UNIT_9_GLOBALIZATION | HARD | MCQ | ✅ Session starts |
| 5 | AP_US_HISTORY | ALL | ALL | MCQ | ✅ Session starts |
| 6 | AP_COMPUTER_SCIENCE_PRINCIPLES | ALL | ALL | MCQ | ✅ Session starts |
| 7 | AP_COMPUTER_SCIENCE_PRINCIPLES | CSP_3_ALGORITHMS_AND_PROGRAMMING | MEDIUM | MCQ | ✅ Session starts |
| 8 | AP_PHYSICS_1 | ALL | ALL | MCQ | ✅ Session starts |
| 9 | AP_CALCULUS_AB | ALL | ALL | MCQ | ✅ Session starts |
| 10 | AP_CALCULUS_BC | ALL | HARD | MCQ | ✅ Session starts |
| 11 | AP_STATISTICS | ALL | ALL | MCQ | ✅ Session starts |
| 12 | AP_CHEMISTRY | ALL | MEDIUM | MCQ | ✅ Session starts |
| 13 | AP_BIOLOGY | ALL | ALL | MCQ | ✅ Session starts |
| 14 | AP_PSYCHOLOGY | ALL | ALL | MCQ | ✅ Session starts |
| 15 | SAT_MATH | ALL | ALL | MCQ | ✅ Session starts |
| 16 | SAT_MATH | ALL | EASY | MCQ | ✅ Session starts |
| 17 | SAT_READING_WRITING | ALL | ALL | MCQ | ✅ Session starts |
| 18 | ACT_MATH | ALL | ALL | MCQ | ✅ Session starts |
| 19 | ACT_ENGLISH | ALL | ALL | MCQ | ✅ Session starts |
| 20 | ACT_SCIENCE | ALL | ALL | MCQ | ✅ Session starts |
| 21 | ACT_READING | ALL | ALL | MCQ | ✅ Session starts |

**Debug path if failing:**
- `500` → check server logs; AI generation likely threw — verify GROQ_API_KEY is set
- `"No questions available"` → DB is empty AND AI generation failed → check AI provider cascade
- Hangs on "Starting..." → session created but question count=0 → check `allQuestions` query filters

---

## SECTION 2 — MCQ Answer Flow

### TC-MCQ-01: Correct Answer Path
1. Start any MCQ session (AP_WORLD_HISTORY, ALL units, EASY)
2. Select the correct answer (labeled A/B/C/D)
3. Click Submit
**Expected:**
- Green highlight on selected answer
- Correct answer + explanation shown
- XP/streak increments
- "Next Question" button appears
- NO knowledge-check mini-quiz appears (only appears on wrong answers)

### TC-MCQ-02: Wrong Answer Path — Knowledge Check Appears
1. Start AP_WORLD_HISTORY MCQ session
2. Deliberately select a wrong answer
3. Click Submit
**Expected:**
- Red highlight on wrong answer, green on correct
- Explanation shown
- "Quick Check" mini-quiz appears within 15s (1 MCQ question, not 3)
- Mini-quiz question is relevant to the topic just answered
- Selecting correct answer in mini-quiz shows green feedback
- Selecting wrong answer in mini-quiz shows red + correct answer

### TC-MCQ-03: Wrong Answer — Knowledge Check Timeout Resilience
1. Submit a wrong answer when GROQ is slow/unavailable
**Expected:**
- Answer feedback still shows immediately
- Knowledge check loading indicator shows
- If knowledge check fails to load within 25s, it silently disappears (no error toast)
- Student can still click "Next Question"

### TC-MCQ-04: ACT_MATH — 5 Choices
1. Start ACT_MATH session, ALL units, ALL difficulty, MCQ
2. Look at question options
**Expected:**
- MCQ questions show 5 options (A, B, C, D, E) — not 4
- Selecting any of the 5 and submitting works correctly

---

## SECTION 3 — FRQ/Essay Answer Flow (Premium-style types)

> Note: These tests assume `premium_feature_restriction = "false"` (default).
> If restriction is enabled, these will require a PREMIUM account.

### TC-FRQ-01: AP Physics FRQ
1. Select course: AP_PHYSICS_1
2. Select question type: FRQ
3. Start session (10 questions)
**Expected:**
- Session starts (may show Sage loading bubble for ~10-20s during AI generation)
- Questions have open text area, not A/B/C/D options
- Can type a response and submit
- AI scoring returns pointsEarned / totalPoints + feedback
- If AI scoring times out: graceful fallback ("AI scoring unavailable — answer recorded")

### TC-FRQ-02: AP World History SAQ
1. Select course: AP_WORLD_HISTORY
2. Select question type: SAQ
3. Start session
**Expected:** Session starts, open-ended questions, AI scoring works

### TC-FRQ-03: AP World History LEQ
1. Select course: AP_WORLD_HISTORY
2. Select question type: LEQ
3. Start session
**Expected:** Session starts, long-essay question, AI scores essay

### TC-FRQ-04: AP World History DBQ
1. Select course: AP_WORLD_HISTORY
2. Select question type: DBQ
3. Start session
**Expected:** Session starts, document-based question shown, AI scores response

### TC-FRQ-05: AP US History — SAQ/LEQ/DBQ
Same as above, for AP_US_HISTORY course.

### TC-FRQ-06: AP CS Principles — CODING
1. Select course: AP_COMPUTER_SCIENCE_PRINCIPLES
2. Select question type: CODING
3. Start session
**Expected:** Session starts, coding-style questions displayed, AI scores

---

## SECTION 4 — AI Generation Speed (Performance)

### TC-PERF-01: Session Start Latency (MCQ)
1. Select any course with questions already in DB
**Expected:** Session starts within 5s (no AI generation needed — DB has questions)

### TC-PERF-02: Session Start with AI Generation
1. Select a thin/new course with <questionCount questions in DB
2. Start session
**Expected:**
- Session starts within 30s
- Toast appears: "X AI question(s) generated and saved for future sessions too"
- Questions from both DB and AI generation are included
- No 500 error even if some AI generation attempts fail

### TC-PERF-03: Wrong-Answer Knowledge Check Latency
1. Submit a wrong MCQ answer
**Expected:**
- Answer feedback shown immediately (<1s)
- Knowledge check mini-quiz appears within 10-15s (count=1, faster than 3-question check)

---

## SECTION 5 — Session Completion

### TC-COMPLETE-01: Complete Full Session
1. Start 10-question MCQ session
2. Answer all 10 questions
3. Session auto-completes on last question
**Expected:**
- Summary screen shows: total questions, correct answers, accuracy %, time spent, XP earned, AP score estimate
- Score breakdown visible
- "Start New Session" or "Back to Practice" button available

### TC-COMPLETE-02: Complete Partial Session (Abandon)
1. Start session, answer 3 questions, navigate away
2. Return to practice page
**Expected:**
- Old session is abandoned (not shown as active)
- Can start a new session without issue

---

## SECTION 6 — Error Handling & Edge Cases

### TC-ERROR-01: No Questions + AI Disabled
1. Set `ai_generation_enabled = "false"` in admin config
2. Start session for a course with 0 questions
**Expected:**
- Error toast: "No questions available and AI generation failed. Please try again later."
- NOT a raw 500 error page
- Can retry or switch course

### TC-ERROR-02: Invalid Course (API-level)
POST `/api/practice` with `course: "FAKE_COURSE"`
**Expected:** 400 `{ error: "Invalid course" }` — not 500

### TC-ERROR-03: Session Not Found (API-level)
POST `/api/practice/nonexistent-session-id` with valid answer
**Expected:** 404 `{ error: "Session not found" }` — not 500

### TC-ERROR-04: Already Completed Session (Resubmit)
PATCH `/api/practice/{sessionId}` after session is already COMPLETED
**Expected:** Returns existing summary data, 200 OK — not 500

### TC-ERROR-05: Rate Limit
Send >20 requests to `POST /api/practice` within 1 minute
**Expected:** 429 `{ error: "Rate limit exceeded. Please slow down." }`

---

## SECTION 7 — Free vs Premium Limits (when restriction enabled)

> To test: Set admin config `premium_feature_restriction = "true"` temporarily.

### TC-LIMIT-01: 3 Sessions/Day for Free Users
1. Log in as FREE user
2. Start and complete 3 practice sessions (QUICK_PRACTICE or FOCUSED_STUDY)
3. Try to start a 4th session
**Expected:** 429 error with `limitExceeded: true`, shows upgrade CTA on frontend

### TC-LIMIT-02: MOCK_EXAM Not Counted in Daily Limit
1. After hitting the 3-session daily limit above
2. Start a MOCK_EXAM session
**Expected:** MOCK_EXAM starts successfully (exempt from limit)

### TC-LIMIT-03: FRQ Blocked for Free Users
1. Log in as FREE user
2. Try to start an FRQ session
**Expected:** 403 error with `limitExceeded: true` and upgrade CTA

---

## SECTION 8 — Per-Course Deep Dive (1 Full Flow Each)

For each course, run this full flow once:
1. Select course → All Units → All Difficulty → MCQ → 5 questions
2. Start session → verify loads without error
3. Answer Q1 correctly → verify green feedback
4. Answer Q2 incorrectly → verify knowledge check mini-quiz appears (1 question)
5. Complete session → verify summary screen

| Course | Result |
|--------|--------|
| AP_WORLD_HISTORY | |
| AP_US_HISTORY | |
| AP_COMPUTER_SCIENCE_PRINCIPLES | |
| AP_PHYSICS_1 | |
| AP_CALCULUS_AB | |
| AP_CALCULUS_BC | |
| AP_STATISTICS | |
| AP_CHEMISTRY | |
| AP_BIOLOGY | |
| AP_PSYCHOLOGY | |
| SAT_MATH | |
| SAT_READING_WRITING | |
| ACT_MATH | |
| ACT_ENGLISH | |
| ACT_SCIENCE | |
| ACT_READING | |

---

## SECTION 9 — Regression Tests (Known Previous Issues)

### TC-REG-01: Session Doesn't Hang on "Starting..." (Beta 1.13 fix)
1. Start any session — including FRQ type
**Expected:** Loading bubble appears, then questions load within 30s. No indefinite "Starting..." state.

### TC-REG-02: Wrong-Answer Check is Fast (Beta 1.13 fix)
**Expected:** Count=1 (not 3) knowledge check → appears in ~10s not ~20s

### TC-REG-03: No 500 on AI Generation Failure (Beta 1.13 fix)
Simulate AI failure (temporarily remove GROQ_API_KEY in admin env)
**Expected:** Fallback to DB questions; if DB is empty, show friendly error — not raw 500 page

### TC-REG-04: Knowledge Check Count=1 in Practice (Beta 1.13 fix)
Inspect network request after wrong MCQ answer
**Expected:** POST `/api/ai/tutor/knowledge-check` body includes `"count": 1`
**Expected:** Response has `questions` array with exactly 1 question (not 3)

---

## Known Debug Strategies

| Symptom | Most Likely Cause | Fix |
|---------|------------------|-----|
| `500 Internal Server Error` on session start | AI generation threw all 3 attempts (no valid provider) | Check GROQ_API_KEY in CF Pages secrets; verify cascade in ai-providers.ts |
| Session starts but 0 questions | `allQuestions.length=0` AND AI generation disabled | Enable AI generation in admin config, or seed DB |
| "Starting..." hangs forever | UI not receiving response (timeout/network) | Check CF 524 — CF Pages has ~100s timeout. If AI gen > 100s, switch to quickMode (already fixed in 1.13) |
| FRQ sessions much slower | Old code ran validateQuestion() on FRQ — fixed in 1.22. Verify quickMode=true is passed for on-demand gen | Re-check practice/route.ts line with `generateQuestion(..., true)` |
| Knowledge check always 3 questions | count param not being sent | Verify practice/page.tsx sends `count: 1` in knowledge-check fetch body |
| ACT_MATH shows 4 choices instead of 5 | AI not respecting 5-choice format in prompt | Check buildQuestionPrompt for ACT_MATH in ai.ts |

---

## Test Execution Priority

**P0 (must pass before deploy):**
- Section 1 smoke tests: #1, #6, #15, #18 (one per category: AP, SAT, ACT, CS)
- TC-MCQ-01, TC-MCQ-02 (correct + wrong answer paths)
- TC-COMPLETE-01 (session completion)

**P1 (should pass):**
- All Section 1 smoke tests
- TC-PERF-01, TC-PERF-02, TC-PERF-03
- TC-ERROR-01 through TC-ERROR-03
- TC-REG-01 through TC-REG-04

**P2 (nice to have):**
- Full Section 3 (FRQ flows)
- Full Section 7 (premium restriction flows)
- Full Section 8 per-course matrix

---

## Release Log — v1.13.0 (2026-03-20)

**Deployed:** Fri, 20 Mar 2026 17:43:39 GMT
**Version:** 1.13.0

### Changes in this release
- chore: full release pipeline — smoke tests, auto test-plan update, archive
- feat: Sage practice integration — session restore + return banner + richer context
- perf: quickMode for on-demand AI gen + count=1 knowledge check + comprehensive test plan
- feat: Beta 1.13 — premium signup notifications, seeding workflow, cron fixes
- feat: add one-time seeding workflow and ?limit= override for cron endpoint
- fix: cap auto-populate to 5 questions/call to avoid CF 524 timeout
- feat: add 3-attempt retry logic to auto-populate workflow
- fix: remove invalid secrets comparison in workflow if condition
- fix: remove @netlify/blobs dependency from backup.ts
- fix: remove Netlify dead code, harden auto-populate cron endpoint

### Automated smoke tests
```
Smoke tests: 12 passed, 0 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ✅ GET /api/ai/status
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Manual P0 checklist (fill in before marking release complete)
- [ ] AP_WORLD_HISTORY MCQ session starts (ALL units, ALL difficulty)
- [ ] SAT_MATH MCQ session starts
- [ ] ACT_MATH MCQ session starts — verify 5 answer choices
- [ ] AP_PHYSICS_1 FRQ session starts within 30s
- [ ] Wrong MCQ answer → knowledge-check mini-quiz appears (1 question)
- [ ] Correct MCQ answer → "Go deeper with Sage →" button visible
- [ ] Ask Sage from practice → "Continue Practice" banner visible on Sage page
- [ ] "Continue Practice" → resumes exact question position
- [ ] Session completes → summary screen with accuracy + XP


---

## Release Log — v1.13.0 (2026-03-20)

**Deployed:** Fri, 20 Mar 2026 17:52:00 GMT
**Version:** 1.13.0

### Changes in this release
- feat: comprehensive release pipeline — integration tests, PWA checks, beta version gate
- fix: replace AbortSignal.timeout with unref'd timer to prevent Windows libuv crash on pipeline exit
- chore: full release pipeline — smoke tests, auto test-plan update, archive
- feat: Sage practice integration — session restore + return banner + richer context
- perf: quickMode for on-demand AI gen + count=1 knowledge check + comprehensive test plan
- feat: Beta 1.13 — premium signup notifications, seeding workflow, cron fixes
- feat: add one-time seeding workflow and ?limit= override for cron endpoint
- fix: cap auto-populate to 5 questions/call to avoid CF 524 timeout
- feat: add 3-attempt retry logic to auto-populate workflow
- fix: remove invalid secrets comparison in workflow if condition

### Automated smoke tests
```
Smoke tests: 12 passed, 0 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ✅ GET /api/ai/status
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Integration tests (practice coverage — all 16 courses)
```
Integration tests: not run (CRON_SECRET not set or tests skipped)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — all 16 courses:**
- [ ] AP_WORLD_HISTORY MCQ — ALL units, ALL difficulty → session starts, questions load
- [ ] AP_US_HISTORY MCQ — session starts
- [ ] AP_COMPUTER_SCIENCE_PRINCIPLES MCQ — session starts
- [ ] AP_PHYSICS_1 MCQ + FRQ — both session types start within 30s
- [ ] AP_CALCULUS_AB MCQ — session starts
- [ ] AP_STATISTICS MCQ — session starts
- [ ] AP_CHEMISTRY MCQ — session starts
- [ ] AP_BIOLOGY MCQ — session starts
- [ ] AP_PSYCHOLOGY MCQ — session starts
- [ ] SAT_MATH MCQ — session starts
- [ ] SAT_READING_WRITING MCQ — session starts
- [ ] ACT_MATH MCQ — session starts, verify 5 answer choices (A-E not A-D)
- [ ] ACT_ENGLISH MCQ — session starts
- [ ] ACT_SCIENCE MCQ — session starts
- [ ] ACT_READING MCQ — session starts

**Student experience:**
- [ ] Wrong MCQ answer → knowledge-check mini-quiz appears (count=1, within 15s)
- [ ] Correct MCQ answer → "Go deeper with Sage →" teal pill visible
- [ ] Ask Sage from practice → "Continue Practice" banner visible on Sage page
- [ ] "Continue Practice" → returns to exact question position (no progress lost)
- [ ] Session completes → summary screen with accuracy %, XP earned, AP score estimate
- [ ] No 500 errors or blank screens during any flow above

**PWA:**
- [ ] On mobile Chrome: "Add to Home Screen" prompt appears (or menu option works)
- [ ] Installed PWA launches in standalone mode (no browser chrome)
- [ ] App loads from home screen without internet (cached shell)

**AI & Sage:**
- [ ] Sage answers a question within 15s
- [ ] Sage response includes 5 sections (Core Concept, Visual Breakdown, How AP Asks, Common Traps, Memory Hook)
- [ ] Follow-up chips appear and clicking one pre-fills the input


---

## Release Log — v1.13.0 (2026-03-20)

**Deployed:** Fri, 20 Mar 2026 18:07:28 GMT
**Version:** 1.13.0

### Changes in this release
- fix: replace 112 parallel count queries with single groupBy in practice-check endpoint
- fix: auto-load .env in integration tests + add CRON_SECRET to .env.example
- feat: comprehensive release pipeline — integration tests, PWA checks, beta version gate
- fix: replace AbortSignal.timeout with unref'd timer to prevent Windows libuv crash on pipeline exit
- chore: full release pipeline — smoke tests, auto test-plan update, archive
- feat: Sage practice integration — session restore + return banner + richer context
- perf: quickMode for on-demand AI gen + count=1 knowledge check + comprehensive test plan
- feat: Beta 1.13 — premium signup notifications, seeding workflow, cron fixes
- feat: add one-time seeding workflow and ?limit= override for cron endpoint
- fix: cap auto-populate to 5 questions/call to avoid CF 524 timeout

### Automated smoke tests
```
Smoke tests: 12 passed, 0 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ✅ GET /api/ai/status
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Integration tests (practice coverage — all 16 courses)
```
Integration tests: 15 passed, 12 warnings, 0 failed
  Total questions: 434 | Courses: 11 green, 1 yellow, 4 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 64 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 51 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ⚠️ AP_CALCULUS_BC — only 3 questions
  ⚠️ AP_STATISTICS — 0 questions — AI will generate on first session
  ⚠️ AP_CHEMISTRY — 0 questions — AI will generate on first session
  ✅ AP_BIOLOGY — 14 MCQ questions
  ⚠️ AP_US_HISTORY — 0 questions — AI will generate on first session
  ⚠️ AP_PSYCHOLOGY — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 24 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ⚠️ AP Calculus BC FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Chemistry FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Biology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP US History FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — all 16 courses:**
- [ ] AP_WORLD_HISTORY MCQ — ALL units, ALL difficulty → session starts, questions load
- [ ] AP_US_HISTORY MCQ — session starts
- [ ] AP_COMPUTER_SCIENCE_PRINCIPLES MCQ — session starts
- [ ] AP_PHYSICS_1 MCQ + FRQ — both session types start within 30s
- [ ] AP_CALCULUS_AB MCQ — session starts
- [ ] AP_STATISTICS MCQ — session starts
- [ ] AP_CHEMISTRY MCQ — session starts
- [ ] AP_BIOLOGY MCQ — session starts
- [ ] AP_PSYCHOLOGY MCQ — session starts
- [ ] SAT_MATH MCQ — session starts
- [ ] SAT_READING_WRITING MCQ — session starts
- [ ] ACT_MATH MCQ — session starts, verify 5 answer choices (A-E not A-D)
- [ ] ACT_ENGLISH MCQ — session starts
- [ ] ACT_SCIENCE MCQ — session starts
- [ ] ACT_READING MCQ — session starts

**Student experience:**
- [ ] Wrong MCQ answer → knowledge-check mini-quiz appears (count=1, within 15s)
- [ ] Correct MCQ answer → "Go deeper with Sage →" teal pill visible
- [ ] Ask Sage from practice → "Continue Practice" banner visible on Sage page
- [ ] "Continue Practice" → returns to exact question position (no progress lost)
- [ ] Session completes → summary screen with accuracy %, XP earned, AP score estimate
- [ ] No 500 errors or blank screens during any flow above

**PWA:**
- [ ] On mobile Chrome: "Add to Home Screen" prompt appears (or menu option works)
- [ ] Installed PWA launches in standalone mode (no browser chrome)
- [ ] App loads from home screen without internet (cached shell)

**AI & Sage:**
- [ ] Sage answers a question within 15s
- [ ] Sage response includes 5 sections (Core Concept, Visual Breakdown, How AP Asks, Common Traps, Memory Hook)
- [ ] Follow-up chips appear and clicking one pre-fills the input


---

## Release Log — v1.14.0 (2026-03-20)

**Deployed:** Fri, 20 Mar 2026 18:50:52 GMT
**Version:** 1.14.0

### Changes in this release
- feat: Beta 1.14 — version bump, About page update, targeted seeding scripts
- fix: replace 112 parallel count queries with single groupBy in practice-check endpoint
- fix: auto-load .env in integration tests + add CRON_SECRET to .env.example
- feat: comprehensive release pipeline — integration tests, PWA checks, beta version gate
- fix: replace AbortSignal.timeout with unref'd timer to prevent Windows libuv crash on pipeline exit
- chore: full release pipeline — smoke tests, auto test-plan update, archive
- feat: Sage practice integration — session restore + return banner + richer context
- perf: quickMode for on-demand AI gen + count=1 knowledge check + comprehensive test plan
- feat: Beta 1.13 — premium signup notifications, seeding workflow, cron fixes
- feat: add one-time seeding workflow and ?limit= override for cron endpoint

### Automated smoke tests
```
Smoke tests: 12 passed, 0 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ✅ GET /api/ai/status
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Integration tests (practice coverage — all 16 courses)
```
Integration tests: 17 passed, 10 warnings, 0 failed
  Total questions: 438 | Courses: 12 green, 0 yellow, 4 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 64 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 51 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 6 MCQ questions
  ⚠️ AP_STATISTICS — 0 questions — AI will generate on first session
  ⚠️ AP_CHEMISTRY — 0 questions — AI will generate on first session
  ✅ AP_BIOLOGY — 14 MCQ questions
  ⚠️ AP_US_HISTORY — 0 questions — AI will generate on first session
  ⚠️ AP_PSYCHOLOGY — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 24 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Chemistry FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Biology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP US History FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — all 16 courses:**
- [ ] AP_WORLD_HISTORY MCQ — ALL units, ALL difficulty → session starts, questions load
- [ ] AP_US_HISTORY MCQ — session starts
- [ ] AP_COMPUTER_SCIENCE_PRINCIPLES MCQ — session starts
- [ ] AP_PHYSICS_1 MCQ + FRQ — both session types start within 30s
- [ ] AP_CALCULUS_AB MCQ — session starts
- [ ] AP_STATISTICS MCQ — session starts
- [ ] AP_CHEMISTRY MCQ — session starts
- [ ] AP_BIOLOGY MCQ — session starts
- [ ] AP_PSYCHOLOGY MCQ — session starts
- [ ] SAT_MATH MCQ — session starts
- [ ] SAT_READING_WRITING MCQ — session starts
- [ ] ACT_MATH MCQ — session starts, verify 5 answer choices (A-E not A-D)
- [ ] ACT_ENGLISH MCQ — session starts
- [ ] ACT_SCIENCE MCQ — session starts
- [ ] ACT_READING MCQ — session starts

**Student experience:**
- [ ] Wrong MCQ answer → knowledge-check mini-quiz appears (count=1, within 15s)
- [ ] Correct MCQ answer → "Go deeper with Sage →" teal pill visible
- [ ] Ask Sage from practice → "Continue Practice" banner visible on Sage page
- [ ] "Continue Practice" → returns to exact question position (no progress lost)
- [ ] Session completes → summary screen with accuracy %, XP earned, AP score estimate
- [ ] No 500 errors or blank screens during any flow above

**PWA:**
- [ ] On mobile Chrome: "Add to Home Screen" prompt appears (or menu option works)
- [ ] Installed PWA launches in standalone mode (no browser chrome)
- [ ] App loads from home screen without internet (cached shell)

**AI & Sage:**
- [ ] Sage answers a question within 15s
- [ ] Sage response includes 5 sections (Core Concept, Visual Breakdown, How AP Asks, Common Traps, Memory Hook)
- [ ] Follow-up chips appear and clicking one pre-fills the input


---

## Release Log — v1.14.0 (2026-03-20)

**Deployed:** Fri, 20 Mar 2026 18:58:45 GMT
**Version:** 1.14.0

### Changes in this release
- chore: release archive beta-1.14 — update test plan log
- feat: Beta 1.14 — version bump, About page update, targeted seeding scripts
- fix: replace 112 parallel count queries with single groupBy in practice-check endpoint
- fix: auto-load .env in integration tests + add CRON_SECRET to .env.example
- feat: comprehensive release pipeline — integration tests, PWA checks, beta version gate
- fix: replace AbortSignal.timeout with unref'd timer to prevent Windows libuv crash on pipeline exit
- chore: full release pipeline — smoke tests, auto test-plan update, archive
- feat: Sage practice integration — session restore + return banner + richer context
- perf: quickMode for on-demand AI gen + count=1 knowledge check + comprehensive test plan
- feat: Beta 1.13 — premium signup notifications, seeding workflow, cron fixes

### Automated smoke tests
```
Smoke tests: 12 passed, 0 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ✅ GET /api/ai/status
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Integration tests (practice coverage — all 16 courses)
```
Integration tests: 17 passed, 10 warnings, 0 failed
  Total questions: 438 | Courses: 12 green, 0 yellow, 4 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 64 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 51 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 6 MCQ questions
  ⚠️ AP_STATISTICS — 0 questions — AI will generate on first session
  ⚠️ AP_CHEMISTRY — 0 questions — AI will generate on first session
  ✅ AP_BIOLOGY — 14 MCQ questions
  ⚠️ AP_US_HISTORY — 0 questions — AI will generate on first session
  ⚠️ AP_PSYCHOLOGY — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 24 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Chemistry FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Biology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP US History FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — all 16 courses:**
- [ ] AP_WORLD_HISTORY MCQ — ALL units, ALL difficulty → session starts, questions load
- [ ] AP_US_HISTORY MCQ — session starts
- [ ] AP_COMPUTER_SCIENCE_PRINCIPLES MCQ — session starts
- [ ] AP_PHYSICS_1 MCQ + FRQ — both session types start within 30s
- [ ] AP_CALCULUS_AB MCQ — session starts
- [ ] AP_STATISTICS MCQ — session starts
- [ ] AP_CHEMISTRY MCQ — session starts
- [ ] AP_BIOLOGY MCQ — session starts
- [ ] AP_PSYCHOLOGY MCQ — session starts
- [ ] SAT_MATH MCQ — session starts
- [ ] SAT_READING_WRITING MCQ — session starts
- [ ] ACT_MATH MCQ — session starts, verify 5 answer choices (A-E not A-D)
- [ ] ACT_ENGLISH MCQ — session starts
- [ ] ACT_SCIENCE MCQ — session starts
- [ ] ACT_READING MCQ — session starts

**Student experience:**
- [ ] Wrong MCQ answer → knowledge-check mini-quiz appears (count=1, within 15s)
- [ ] Correct MCQ answer → "Go deeper with Sage →" teal pill visible
- [ ] Ask Sage from practice → "Continue Practice" banner visible on Sage page
- [ ] "Continue Practice" → returns to exact question position (no progress lost)
- [ ] Session completes → summary screen with accuracy %, XP earned, AP score estimate
- [ ] No 500 errors or blank screens during any flow above

**PWA:**
- [ ] On mobile Chrome: "Add to Home Screen" prompt appears (or menu option works)
- [ ] Installed PWA launches in standalone mode (no browser chrome)
- [ ] App loads from home screen without internet (cached shell)

**AI & Sage:**
- [ ] Sage answers a question within 15s
- [ ] Sage response includes 5 sections (Core Concept, Visual Breakdown, How AP Asks, Common Traps, Memory Hook)
- [ ] Follow-up chips appear and clicking one pre-fills the input


---

## Release Log — v1.14.0 (2026-03-20)

**Deployed:** Fri, 20 Mar 2026 19:13:45 GMT
**Version:** 1.14.0

### Changes in this release
- chore: release archive beta-1.14 — update test plan log
- feat: Beta 1.14 — version bump, About page update, targeted seeding scripts
- fix: replace 112 parallel count queries with single groupBy in practice-check endpoint
- fix: auto-load .env in integration tests + add CRON_SECRET to .env.example
- feat: comprehensive release pipeline — integration tests, PWA checks, beta version gate
- fix: replace AbortSignal.timeout with unref'd timer to prevent Windows libuv crash on pipeline exit
- chore: full release pipeline — smoke tests, auto test-plan update, archive
- feat: Sage practice integration — session restore + return banner + richer context
- perf: quickMode for on-demand AI gen + count=1 knowledge check + comprehensive test plan
- feat: Beta 1.13 — premium signup notifications, seeding workflow, cron fixes

### Automated smoke tests
```
Smoke tests: 12 passed, 0 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ✅ GET /api/ai/status
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Integration tests (practice coverage — all 16 courses)
```
Integration tests: 17 passed, 10 warnings, 0 failed
  Total questions: 438 | Courses: 12 green, 0 yellow, 4 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 64 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 51 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 6 MCQ questions
  ⚠️ AP_STATISTICS — 0 questions — AI will generate on first session
  ⚠️ AP_CHEMISTRY — 0 questions — AI will generate on first session
  ✅ AP_BIOLOGY — 14 MCQ questions
  ⚠️ AP_US_HISTORY — 0 questions — AI will generate on first session
  ⚠️ AP_PSYCHOLOGY — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 24 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Chemistry FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Biology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP US History FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — all 16 courses:**
- [ ] AP_WORLD_HISTORY MCQ — ALL units, ALL difficulty → session starts, questions load
- [ ] AP_US_HISTORY MCQ — session starts
- [ ] AP_COMPUTER_SCIENCE_PRINCIPLES MCQ — session starts
- [ ] AP_PHYSICS_1 MCQ + FRQ — both session types start within 30s
- [ ] AP_CALCULUS_AB MCQ — session starts
- [ ] AP_STATISTICS MCQ — session starts
- [ ] AP_CHEMISTRY MCQ — session starts
- [ ] AP_BIOLOGY MCQ — session starts
- [ ] AP_PSYCHOLOGY MCQ — session starts
- [ ] SAT_MATH MCQ — session starts
- [ ] SAT_READING_WRITING MCQ — session starts
- [ ] ACT_MATH MCQ — session starts, verify 5 answer choices (A-E not A-D)
- [ ] ACT_ENGLISH MCQ — session starts
- [ ] ACT_SCIENCE MCQ — session starts
- [ ] ACT_READING MCQ — session starts

**Student experience:**
- [ ] Wrong MCQ answer → knowledge-check mini-quiz appears (count=1, within 15s)
- [ ] Correct MCQ answer → "Go deeper with Sage →" teal pill visible
- [ ] Ask Sage from practice → "Continue Practice" banner visible on Sage page
- [ ] "Continue Practice" → returns to exact question position (no progress lost)
- [ ] Session completes → summary screen with accuracy %, XP earned, AP score estimate
- [ ] No 500 errors or blank screens during any flow above

**PWA:**
- [ ] On mobile Chrome: "Add to Home Screen" prompt appears (or menu option works)
- [ ] Installed PWA launches in standalone mode (no browser chrome)
- [ ] App loads from home screen without internet (cached shell)

**AI & Sage:**
- [ ] Sage answers a question within 15s
- [ ] Sage response includes 5 sections (Core Concept, Visual Breakdown, How AP Asks, Common Traps, Memory Hook)
- [ ] Follow-up chips appear and clicking one pre-fills the input

