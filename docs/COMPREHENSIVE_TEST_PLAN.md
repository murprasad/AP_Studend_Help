# StudentNest Comprehensive Test Plan

**Created:** 2026-04-17
**Platform:** https://studentnest.ai
**Scope:** AP / SAT / ACT exam preparation (CLEP and DSST were sunset 2026-04-14 and are explicitly out of scope).
**Goal:** Simulate a real student end-to-end, exercise every major feature, catch failure modes, and gate launch readiness.
**Test account:** `murprasad+std@gmail.com` / `TestStd@329` (track=ap)

---

## How To Use This Document

- **Section A** — The "Real Student Journey" script. One long scenario a human can walk through in ~45-60 minutes to validate the whole platform click-by-click.
- **Section B** — Feature-by-feature test matrix with positive, negative (3x ratio per policy), edge, and FMEA scoring.
- **Section C** — Cross-cutting concerns (auth, track switching, tier gates, responsive, browser, a11y).
- **Section D** — Marketing pages audit checklist.
- **Section E** — API-level tests (auth enforcement, rate limits, validation, error handling).
- **Section F** — Test execution log — empty table to fill in while running.

**Severity guide:** P0 = blocks launch, P1 = fix this week, P2 = fix this sprint, P3 = backlog.
**Test type tags:** `[auto]` = should become Playwright/Vitest, `[manual]` = human judgment required.

---

## A. REAL STUDENT JOURNEY (The "gold" UAT script)

**Persona:** "Priya" — 17-year-old high-school junior taking AP Calculus AB this May. Got a 2 on a practice test. Needs a 4 to earn college credit. Tech comfort: high. Patience: low. Tests from her Chromebook after school.

**Test account to use:** `murprasad+std@gmail.com` / `TestStd@329` (track=ap, primary course should be AP Calculus AB).

### Act 1 — Landing & Signup (10 min)

| ID | Step | Expected | Severity |
|---|---|---|---|
| A1 | Go to https://studentnest.ai, read the hero above the fold | Value prop clear in ≤ 5s. No jargon. Primary CTA visible without scrolling. | P1 UX |
| A2 | Click primary CTA (e.g. "Start Free") | Lands on `/register`. Password rules visible up-front. | P0 |
| A3 | Submit registration form with empty fields | Inline validation on each required field. No generic "Error". | P1 UX |
| A4 | Sign up with Google OAuth | Single click, lands on `/onboarding` (no email verification prompt for OAuth). | P0 |
| A5 | Alt path: register with weak password `12345` | Rejected with human-readable rule ("Need 1 uppercase and 1 number"). | P0 Security |
| A6 | Register with valid email + password | Receives verification email. Can click link → `/verify-email` succeeds. | P0 |
| A7 | Unverified user attempts to access `/dashboard` | Redirected to `/verify-email` or shown a gate. | P0 Security |
| A8 | Terms checkbox + link to `/terms` open in new tab | Link works, page renders. | P1 Legal |

### Act 2 — Onboarding (5 min)

| ID | Step | Expected | Severity |
|---|---|---|---|
| A9 | Land on onboarding Step 1 "Choose Track" | Three tracks visible: AP / SAT / ACT. AP pre-selected if track=ap. | P0 |
| A10 | Click "Continue" without changing selection | Advances to Step 2 (no dead-click). | P0 |
| A11 | Back, switch to SAT, forward, back, switch to AP | State preserved correctly across back-nav. | P1 |
| A12 | Step 2: pick AP Calculus AB as primary course | Course highlighted. Continue enables. | P0 |
| A13 | Step 3: set exam date (e.g. May 2026) | Date picker valid; reject dates in the past. | P1 |
| A14 | Step 4: plan selection (Free / Premium / upsell) | All tiers visible, pricing correct, money-back guarantee displayed. | P0 |
| A15 | Choose Free plan | Welcome modal / confirmation. "Get Started" CTA present. | P0 |
| A16 | Click "Get Started" | Redirect to diagnostic intro or `/dashboard` (confirm intended flow). | P0 |

### Act 3 — Diagnostic (10 min)

| ID | Step | Expected | Severity |
|---|---|---|---|
| A17 | Arrive at `/diagnostic` | Intro card explains length (~10-15 Qs), time estimate, purpose. | P0 |
| A18 | Click "Start diagnostic" | Spinner resolves < 10s, Q1 renders with progress "1 of N". | P0 |
| A19 | Spinner > 20s | Falls back to error state with retry button. | P0 |
| A20 | Answer Q1 (radio MCQ) | Selection registers. Next button enables. | P0 |
| A21 | Skip Q2 | "You have unanswered questions" blocks submit. | P1 UX |
| A22 | Answer all 10-15 Qs with mix of 40% correct | Scoring engine handles any distribution. | P0 |
| A23 | Submit diagnostic | Results screen: per-unit mastery %, predicted AP score (1-5), focus areas. | P0 |
| A24 | Predicted score for weak baseline shows a 1 or 2 | Copy is motivating, not demoralizing ("Here's your starting line"). | P0 Content |
| A25 | Recommended focus areas list specific AP units (e.g. "Limits & Continuity") | Not generic "study more". | P1 Content |
| A26 | Navigate to `/dashboard` | `hasDiagnostic=true` state drives new CTAs. | P0 |

### Act 4 — Dashboard After Diagnostic (5 min)

| ID | Step | Expected | Severity |
|---|---|---|---|
| A27 | Land on `/dashboard` | Greeting with name. Predicted score ring/card. Weakest-unit "Focus Now" card. | P0 |
| A28 | Primary CTA specifies "Start Practice (5 Qs · 3 min)" | Concrete commitment, not vague "Start". | P1 |
| A29 | Path-to-passing checklist | Diagnostic ✓. Practice step next. Mock exam locked until X practice sessions or predicted score threshold. | P0 |
| A30 | Click `/mock-exam` directly without meeting gate | Blocked with "Complete diagnostic + N practice sessions first". | P0 |
| A31 | Sage (AI tutor) bubble visible | Opens, greets by name, ready to take a question. | P0 |
| A32 | Ask Sage "Explain L'Hopital's rule" | Coherent markdown response ≥ 100 chars, no broken SSE fragments. | P0 |

### Act 5 — First Practice Session (15 min)

| ID | Step | Expected | Severity |
|---|---|---|---|
| A33 | Click "Start Practice" | Session begins with 5 Qs. `Question 1 of 5` visible. | P0 |
| A34 | Answer Q1 correctly | Green check, explanation appears, "Next" enables. | P0 |
| A35 | Read explanation | Teaches WHY, not just "B is correct". ≤ 150 words. | P1 Content |
| A36 | Answer Q2 incorrectly | Red X, correct answer highlighted, explanation explains the misconception. | P0 |
| A37 | Flag Q3 for review | Flag modal opens, submit feedback, toast confirms. | P2 |
| A38 | Navigate away mid-session (browser back) | Session stays IN_PROGRESS. Dashboard shows resume banner. | P0 |
| A39 | Click resume banner | Returns to session at current question (not Q1). | P0 |
| A40 | Finish 5 Qs | Summary screen: accuracy %, XP, next recommended unit. | P0 |
| A41 | Take 2 more quick practice sessions | Mastery updates. Streak increments. | P0 |

### Act 6 — Targeted Unit Practice (10 min)

| ID | Step | Expected | Severity |
|---|---|---|---|
| A42 | From dashboard, click "Continue [Weak Unit]" | Unit-specific practice loads only that unit's questions. | P0 |
| A43 | Answer 10 Qs in that unit at 80%+ accuracy | Unit mastery climbs from baseline to 50%+. | P0 |
| A44 | Change course (settings → course = AP US History) | `/practice` pulls AP US History Qs, not Calc. | P1 |
| A45 | Revert to AP Calc AB | Mastery state preserved per course. | P0 |

### Act 7 — Mock Exam (30-60 min) [manual, slow test]

| ID | Step | Expected | Severity |
|---|---|---|---|
| A46 | After unlocking mock gate, click `/mock-exam` | Intro card: # of Qs, duration, AP-specific rules. | P0 |
| A47 | Start mock | Countdown timer starts. Can flag + skip. Progress bar visible. | P0 |
| A48 | Let timer run to 5 min remaining | Warning banner appears. | P1 UX |
| A49 | Submit before time runs out | Full AP-scaled result: raw score, predicted 1-5, pass probability for target score. | P0 |
| A50 | Review mock exam | Can see per-question review with explanations. | P1 |
| A51 | Dashboard updates after mock | Predicted AP score refreshes. Study plan auto-rebalances. | P0 |

### Act 8 — Study Plan (10 min)

| ID | Step | Expected | Severity |
|---|---|---|---|
| A52 | Visit `/study-plan` | Plan exists post-diagnostic. Units ranked by priority. | P0 |
| A53 | Generate 7-day plan via CTA | AI returns day-by-day plan, no 500. | P0 |
| A54 | Day 1 action links to specific practice set | Clicking opens correct unit practice. | P1 |
| A55 | Mark Day 1 complete | Persists across refresh and across sessions. | P1 |
| A56 | Regenerate plan | Returns different plan, no duplicate spam. | P2 |

### Act 9 — Analytics & Progression (5 min)

| ID | Step | Expected | Severity |
|---|---|---|---|
| A57 | Visit `/analytics` | Mastery chart, accuracy trend, streak, achievements. | P0 |
| A58 | Verify streak = 1 after first day | Tomorrow's return increments to 2. `lastActiveDate` updates. | P0 |
| A59 | GA4 real-time shows events | `signup`, `diagnostic_started`, `diagnostic_completed`, `practice_started`, `practice_completed`, `mock_started`, `mock_completed` all fire. | P0 |
| A60 | Achievements unlock (e.g. "First 10 correct") | Toast + achievement appears in list. | P1 |

### Act 10 — Upgrade Flow (5 min)

| ID | Step | Expected | Severity |
|---|---|---|---|
| A61 | Hit free tier cap (e.g. daily Q limit or locked mock on another course) | Paywall modal, not silent failure. | P0 |
| A62 | Click "Upgrade" | Routes to `/billing` (or `/pricing`) with current tier highlighted. | P0 |
| A63 | Start Stripe checkout for AP_PREMIUM | Stripe test-mode flow completes end-to-end. | P0 |
| A64 | Return from Stripe with success | `SubTier` flips in DB. Locked features unlock. | P0 |
| A65 | Visit `/billing` | Shows active sub, next renewal date, cancel CTA. | P0 |
| A66 | Cancel subscription | Goes to Stripe customer portal OR in-app confirm. Sub flips to canceled at period end. | P0 |

### Act 11 — Failure Recovery (5 min)

| ID | Step | Expected | Severity |
|---|---|---|---|
| A67 | Kill WiFi mid-question, click answer | Error toast, no crash. Reconnect → can continue. | P1 |
| A68 | Close browser during practice, reopen next day | Resume banner appears, picks up at correct Q. | P0 |
| A69 | Browser back from mock results | No corrupted state. Can navigate forward again. | P1 |
| A70 | Let session sit idle 30 min, return | Re-authenticates or preserves state — doesn't silently 500. | P1 |
| A71 | Log out mid-session → log back in | Session resume banner still appears. | P0 |
| A72 | Delete browser cookies, hit `/dashboard` | Redirects to `/login` cleanly. | P0 |
| A73 | Sign in on second device with same account | Both devices see same state (eventual consistency OK within 1 refresh). | P1 |

---

## B. FEATURE-BY-FEATURE TEST MATRIX

Each feature block includes: Positive (happy path), Negative (3x more than positive per testing policy), Edge cases, and FMEA scoring.

**FMEA formula:** `RPN = Severity (1-10) × Likelihood (1-10) × Detection difficulty (1-10)`. Higher = riskier. Anything ≥ 200 gets a dedicated watch.

### B1. MCQ Practice (`/practice`)

**Positive**
| ID | Case | Expected |
|---|---|---|
| B1-P1 | Start 5-Q quick practice on AP Calc AB | Renders Q1 with 4-5 options, progress indicator. |
| B1-P2 | Answer correctly, advance | Green feedback, explanation, "Next" active. |
| B1-P3 | Complete session | Summary screen with accuracy, XP, recommended next unit. |

**Negative (3x)**
| ID | Case | Expected |
|---|---|---|
| B1-N1 | POST `/api/practice` with no auth | 401. |
| B1-N2 | POST with `courseId` user doesn't own (SAT Math while track=ap) | 403 or redirect to onboarding. |
| B1-N3 | POST with invalid `sessionType` value | 400 with validation error. |
| B1-N4 | Submit answer for Q not in session | 400 "question not in this session". |
| B1-N5 | Double-submit same question (rapid click) | Idempotent — only one attempt recorded. |
| B1-N6 | Answer after session marked COMPLETE | 409 "session already complete". |
| B1-N7 | Submit malformed JSON body | 400. |
| B1-N8 | Request practice when `approvedQuestions` for course = 0 | Friendly "No questions available for this unit yet" state, not a 500. |
| B1-N9 | User with canceled sub on premium-only course | Paywall instead of Q. |

**Edge**
| ID | Case | Expected |
|---|---|---|
| B1-E1 | Course has only 3 approved Qs, request 5 | Session of 3 Qs, clear messaging about shortfall. |
| B1-E2 | Question explanation field is empty | UI renders without crash; graceful "No explanation available". |
| B1-E3 | Long explanation (2000+ words) | Scrollable, no layout break. |
| B1-E4 | LaTeX/math rendering (`$\lim_{x\to 0} \frac{\sin x}{x}$`) | Renders via KaTeX/MathJax, no raw dollar signs. |
| B1-E5 | Slow 3G network | Skeleton state, no UI jank. |

**FMEA**
| Failure mode | Sev | Lik | Det | RPN |
|---|---|---|---|---|
| Practice endpoint 500s during peak hours | 9 | 4 | 3 | 108 |
| Correct-answer marking flips (off-by-one) | 10 | 2 | 9 | 180 |
| Session state not persisting across refresh | 8 | 3 | 4 | 96 |
| Question duplicates within same session | 5 | 5 | 6 | 150 |

### B2. Mock Exam (`/mock-exam`)

**Positive**
| ID | Case | Expected |
|---|---|---|
| B2-P1 | Start AP Calc AB mock after gate unlock | Intro → 45-Q exam with 90-min timer. |
| B2-P2 | Submit before timer | Predicted AP score 1-5 shown. |
| B2-P3 | Review per-question explanations | All Qs visible with correct + chosen answer. |

**Negative (3x)**
| ID | Case | Expected |
|---|---|---|
| B2-N1 | Access mock without completing diagnostic | 403 `needsDiagnostic`. |
| B2-N2 | Access mock on a course not unlocked for tier | Paywall, not crash. |
| B2-N3 | Submit with 0 answers | Graceful score = 0, not divide-by-zero. |
| B2-N4 | Let timer hit 0 | Auto-submit, user cannot extend. |
| B2-N5 | Try to change answer after submit | Disabled / 409. |
| B2-N6 | Refresh page mid-exam | Timer persists server-side, no extra time granted. |
| B2-N7 | Open mock in 2 tabs | Second tab resumes same session, no duplicate creation. |
| B2-N8 | Back button during exam | Exit confirm modal; doesn't abandon silently. |
| B2-N9 | Question bank has < exam count of Qs | Blocks start with "Not enough Qs in bank" (or pads with repeats — spec the choice). |

**Edge**
| ID | Case | Expected |
|---|---|---|
| B2-E1 | User has multiple IN_PROGRESS mock sessions | Latest wins or system prevents creating a second. |
| B2-E2 | Network drop on submit | Retry logic, don't lose answers. |
| B2-E3 | Timer drift over 90 min | Server-side truth; client shows same elapsed within 2s. |

**FMEA**
| Failure mode | Sev | Lik | Det | RPN |
|---|---|---|---|---|
| Timer loses state on refresh | 9 | 5 | 4 | 180 |
| Scoring formula wrong for AP 1-5 conversion | 10 | 3 | 8 | 240 ⚠ |
| Mock unlocks for user who didn't meet gate | 7 | 3 | 6 | 126 |

### B3. Tutor Chat / Sage (`/ai-tutor`, `/api/chat/sage`, `/api/ai/tutor`)

**Positive**
| ID | Case | Expected |
|---|---|---|
| B3-P1 | Open Sage, ask "Explain derivatives" | Streaming markdown response ≥ 150 chars. |
| B3-P2 | Follow-up question uses context | Reply references previous turn. |
| B3-P3 | Render code / math in response | KaTeX / fenced code blocks render. |

**Negative (3x)**
| ID | Case | Expected |
|---|---|---|
| B3-N1 | Unauthenticated POST to `/api/ai/tutor` | 401. |
| B3-N2 | Send empty message | 400 "message required". |
| B3-N3 | Send 50k-char prompt | 413 or truncation with warning, not crash. |
| B3-N4 | Inject `<script>alert(1)</script>` | ReactMarkdown escapes; no XSS. |
| B3-N5 | Primary AI provider (Groq) returns 500 | Cascade falls back to next provider. |
| B3-N6 | All providers down | Clean 503, user sees retry option. |
| B3-N7 | Stream times out mid-response | "Sage is thinking..." clears, retry CTA. |
| B3-N8 | Ask about unsupported subject (CLEP) | Polite refusal ("I help with AP/SAT/ACT only"). |
| B3-N9 | Rate-limit: 21 requests in 60s from same user | 429. |

**Edge**
| ID | Case | Expected |
|---|---|---|
| B3-E1 | User asks in non-English | Sage responds in English (or signals language support). |
| B3-E2 | User pastes image (if supported) | Image upload works or is blocked cleanly. |
| B3-E3 | Streaming chunks arrive out-of-order | UI buffers correctly (per-line assembly). |
| B3-E4 | User closes tab mid-stream | Server stream aborts cleanly (no orphan cost). |

**FMEA**
| Failure mode | Sev | Lik | Det | RPN |
|---|---|---|---|---|
| Provider cascade misconfigured (hangs 25s+) | 8 | 4 | 5 | 160 |
| SSE buffering bug drops tokens | 7 | 3 | 7 | 147 |
| AI returns CLEP advice (wrong vertical) | 6 | 4 | 6 | 144 |
| Cost spike (no rate limit) | 9 | 3 | 4 | 108 |

### B4. Predicted AP Score / Pass Probability Engine (`src/lib/pass-engine.ts`)

**Positive**
| ID | Case | Expected |
|---|---|---|
| B4-P1 | Fresh user with 0 sessions | Score = "Not enough data yet". |
| B4-P2 | User at 80% mastery across all units | Predicted AP ≥ 4. |
| B4-P3 | User at 30% mastery | Predicted AP = 1 or 2. |

**Negative (3x)**
| ID | Case | Expected |
|---|---|---|
| B4-N1 | Null/undefined mastery map | Default to conservative "1". |
| B4-N2 | All units at 0%, one at 100% | Engine weights by unit importance, not arithmetic avg. |
| B4-N3 | Mastery > 100% (data corruption) | Clamped to 100. |
| B4-N4 | Negative session count | Ignore, don't crash. |
| B4-N5 | Course has no `unitWeights` defined | Falls back to equal weighting; warns in logs. |
| B4-N6 | User track mismatched with course (e.g. track=ap, course=SAT_MATH) | Engine returns N/A or uses SAT scale. |

**Edge**
| ID | Case | Expected |
|---|---|---|
| B4-E1 | User has 1000+ sessions | No perf regression. |
| B4-E2 | Prediction changes < 5% between reasonable sessions | Smooth, not jittery. |

**FMEA**
| Failure mode | Sev | Lik | Det | RPN |
|---|---|---|---|---|
| Wrong unit weights applied | 10 | 3 | 8 | 240 ⚠ |
| Prediction jumps 1→5 after a single session | 7 | 3 | 4 | 84 |

### B5. Study Plan (`/study-plan`, `/api/study-plan`)

**Positive**
| ID | Case | Expected |
|---|---|---|
| B5-P1 | Generate 7-day plan post-diagnostic | Returns valid JSON plan with day/unit/tasks. |
| B5-P2 | Mark Day 2 complete | Persists; progress bar updates. |
| B5-P3 | Regenerate plan | New plan with different unit ordering if mastery changed. |

**Negative (3x)**
| ID | Case | Expected |
|---|---|---|
| B5-N1 | GET plan with no auth | 401. |
| B5-N2 | Generate plan without completing diagnostic | 400 "take diagnostic first". |
| B5-N3 | Generate plan for unsupported track | 400. |
| B5-N4 | AI returns malformed JSON | Retry + fallback template, not crash. |
| B5-N5 | Mark invalid day (Day 999) complete | 400. |
| B5-N6 | User with exam < 3 days away | Plan compresses, no "7 days" assumption. |

**Edge**
| ID | Case | Expected |
|---|---|---|
| B5-E1 | User exam date in past | Plan shows "Test has passed" notice. |
| B5-E2 | User on Free plan requests daily regen | Rate-limited to 1/day; premium unlimited. |

**FMEA**
| Failure mode | Sev | Lik | Det | RPN |
|---|---|---|---|---|
| Plan recommends locked content | 6 | 4 | 5 | 120 |
| AI hallucinates unit names | 5 | 5 | 6 | 150 |

### B6. Billing / Subscriptions (`/billing`, `/api/billing/*`, `/api/checkout`, `/api/webhooks/stripe`)

**Positive**
| ID | Case | Expected |
|---|---|---|
| B6-P1 | Upgrade FREE → AP_PREMIUM via Stripe test | Checkout → webhook → DB flip → unlock. |
| B6-P2 | View `/billing` as premium user | Shows active plan, renewal date, cancel CTA. |
| B6-P3 | Cancel sub | Stripe portal or in-app; flip to cancel-at-period-end. |

**Negative (3x)**
| ID | Case | Expected |
|---|---|---|
| B6-N1 | Webhook request missing signature | 400. |
| B6-N2 | Webhook with invalid signature | 400, no DB mutation. |
| B6-N3 | Replay same webhook event twice | Idempotent, no double-grant. |
| B6-N4 | Stripe decline (4000 0000 0000 0002) | User sees decline message, no tier change. |
| B6-N5 | Canceled card at renewal | Sub expires gracefully, user downgraded. |
| B6-N6 | User tries to access premium feature after cancel period ends | 403, upgrade prompt. |
| B6-N7 | Race: checkout + cancel within 5s | Final state consistent. |
| B6-N8 | Checkout with `priceId` from a different course tier | Rejected by server-side validation. |
| B6-N9 | User changes email in Stripe but not DB | Webhook still maps to correct user (by customerId). |

**Edge**
| ID | Case | Expected |
|---|---|---|
| B6-E1 | User has 2 active subs (race) | Only latest honored; log + alert. |
| B6-E2 | Trial user at day 7 | Auto-converts or paywall shows. |
| B6-E3 | Refund processed in Stripe | DB `SubTier` rolls back on webhook. |

**FMEA**
| Failure mode | Sev | Lik | Det | RPN |
|---|---|---|---|---|
| Webhook silently fails; user paid but not unlocked | 10 | 4 | 7 | 280 ⚠ |
| Signature validation disabled in prod | 10 | 2 | 6 | 120 |
| Double charge from duplicate checkout | 9 | 2 | 7 | 126 |

### B7. Admin Panel (`/admin`, `/admin/manage`, `/api/admin/*`)

**Positive**
| ID | Case | Expected |
|---|---|---|
| B7-P1 | Admin user loads `/admin` | Dashboard with user count, question count, revenue metrics. |
| B7-P2 | Admin approves a flagged question | Question moves to APPROVED. |
| B7-P3 | Admin runs bulk populate | Job kicks off, progress visible. |

**Negative (3x)**
| ID | Case | Expected |
|---|---|---|
| B7-N1 | Student user hits `/admin` | 403 / redirect. |
| B7-N2 | Student calls `POST /api/admin/populate-questions` | 403. |
| B7-N3 | Admin with expired session hits admin API | 401. |
| B7-N4 | SQL injection via question-edit textarea | Prisma parameterization prevents; test `'; DROP TABLE Question; --`. |
| B7-N5 | Admin deletes themselves | Blocked ("can't delete own account"). |
| B7-N6 | Admin promotes own student account to ADMIN via API manipulation | Server-side role check prevents. |

**Edge**
| ID | Case | Expected |
|---|---|---|
| B7-E1 | 100k users in list | Paginated, no timeout. |
| B7-E2 | Quality metrics with 0 approved Qs | Shows "No data" not crash. |

**FMEA**
| Failure mode | Sev | Lik | Det | RPN |
|---|---|---|---|---|
| Admin endpoint missing `role` check | 10 | 3 | 9 | 270 ⚠ |
| Bulk job crashes mid-run, no recovery | 6 | 4 | 5 | 120 |

### B8. Feedback Popup (`/api/review` / feedback modal)

**Positive**
| ID | Case | Expected |
|---|---|---|
| B8-P1 | Thumbs-down on an explanation → modal | Text field + tag picker appears. |
| B8-P2 | Submit feedback | Toast confirm, stored to `/api/admin/feedback`. |
| B8-P3 | Abandon onboarding → feedback prompt | Asks "What stopped you?" text field. |

**Negative (3x)**
| ID | Case | Expected |
|---|---|---|
| B8-N1 | Submit empty feedback text | Allowed as thumbs signal only, or rejected w/ inline err — spec the policy. |
| B8-N2 | Submit 10k-char feedback | Truncated or rejected with "keep under X chars". |
| B8-N3 | Script injection in feedback | Sanitized before storage. |
| B8-N4 | Anonymous user submits feedback (if allowed) | Tagged anon, not crashed. |
| B8-N5 | Rate limit: 10 feedbacks in 10s | 429. |
| B8-N6 | Submit while offline | Queued or clean error, not silent drop. |

**Edge**
| ID | Case | Expected |
|---|---|---|
| B8-E1 | User dismisses popup 3x | Stops prompting for session. |

**FMEA**
| Failure mode | Sev | Lik | Det | RPN |
|---|---|---|---|---|
| Feedback lost due to silent API failure | 5 | 4 | 7 | 140 |

### B9. Confidence Layer / Repair Screen / Methodology (`/methodology`, repair banner)

**Positive**
| ID | Case | Expected |
|---|---|---|
| B9-P1 | User with < 30% mastery sees confidence banner | Banner explains plan, not shame. |
| B9-P2 | Click `/methodology` link | Page explains scoring + honesty policy. |
| B9-P3 | Repair screen after 5 wrong in a row | Offers easier Qs + Sage help. |

**Negative (3x)**
| ID | Case | Expected |
|---|---|---|
| B9-N1 | Repair screen triggers for user with no sessions | Does NOT trigger (needs data). |
| B9-N2 | Banner persists after user improves | Dismisses automatically. |
| B9-N3 | Methodology page 404 / slow load | Graceful fallback. |

**Edge**
| ID | Case | Expected |
|---|---|---|
| B9-E1 | A/B flag disabled → banner hidden entirely | Feature flag respected. |

**FMEA**
| Failure mode | Sev | Lik | Det | RPN |
|---|---|---|---|---|
| Banner wording demotivates user (loss) | 7 | 4 | 8 | 224 ⚠ |

---

## C. CROSS-CUTTING CONCERNS

### C1. Auth Flow

| ID | Test | Expected | Severity |
|---|---|---|---|
| C1-1 | Email/password login with valid creds | Session issued, lands on `/dashboard`. | P0 |
| C1-2 | Email/password login with wrong password | Generic "invalid credentials" (no user-enum). | P0 Security |
| C1-3 | Google OAuth login | Works, maps to same user if email matches. | P0 |
| C1-4 | Logout | Session cleared, redirect to `/` or `/login`. | P0 |
| C1-5 | `/api/auth/forgot-password` with valid email | 200 + email sent (or 200 regardless to prevent enum). | P0 |
| C1-6 | `/api/auth/forgot-password` with non-existent email | Same 200 response (no user-enum leak). | P0 Security |
| C1-7 | Reset password with valid token | Success; old sessions invalidated. | P0 |
| C1-8 | Reset password with expired token | 400 "link expired". | P0 |
| C1-9 | Reset password with already-used token | 400. | P0 Security |
| C1-10 | Verify email with valid token | `user.emailVerified` set. | P0 |
| C1-11 | Verify email with tampered token | 400. | P0 Security |
| C1-12 | Session expires (JWT exp) | User redirected to login gracefully. | P1 |
| C1-13 | Concurrent logins on 2 devices | Both valid; logout on device A leaves B active (JWT). | P1 |

### C2. Track Switching (ap ↔ sat ↔ act)

| ID | Test | Expected | Severity |
|---|---|---|---|
| C2-1 | User on track=ap switches to track=sat in settings | `User.track` updates; courses filter to SAT_*. | P0 |
| C2-2 | After switch, sidebar shows SAT courses only | No AP courses visible. | P1 |
| C2-3 | Diagnostic taken on AP Calc is preserved (data stays) | History shows AP data + new SAT data. | P1 |
| C2-4 | Switching to ACT, then taking diagnostic | ACT-specific units load correctly. | P0 |
| C2-5 | Back to AP, mastery on AP Calc intact | Data retained, no corruption. | P0 |
| C2-6 | Attempt to switch to `track=clep` via API hack | 400 (CLEP sunset). | P0 |

### C3. Subscription Tier Gates

| ID | Test | Free | Premium (AP/SAT/ACT) |
|---|---|---|---|
| C3-1 | Qs per day | Cap (e.g. 20) | Unlimited |
| C3-2 | Mock exam access | Locked or limited | Unlocked |
| C3-3 | Sage / tutor messages per day | Cap (e.g. 10) | Higher/unlimited |
| C3-4 | Study plan regeneration | 1/day | Unlimited |
| C3-5 | Cross-track content | Locked to one | Unlocked (or tier-specific) |
| C3-6 | Analytics depth | Basic | Full |
| C3-7 | Downgrade from premium → free | Gates re-apply at period end | N/A |

Every row above should have both a `P` (positive: access works at tier X) and `N` (negative: blocked at tier Y) test.

### C4. Responsive Design

| Breakpoint | Width | Key checks |
|---|---|---|
| Mobile | 375px | Hero readable, CTA thumb-reachable, sidebar collapses, Sage bubble doesn't cover bottom nav |
| Mobile large | 414px | Same as above |
| Tablet | 768px | Sidebar toggle works, mock exam layout fits |
| Desktop | 1280px | Sidebar always visible, max-width containers centered |
| Desktop XL | 1920px | No stretched/ugly whitespace, images don't pixelate |

Tap-target minimum = 44×44 px. iOS textarea font-size ≥ 16px (no zoom on focus).

### C5. Browser Compatibility

| Browser | Desktop | Mobile | Tablet | Notes |
|---|---|---|---|---|
| Chrome 120+ | Primary | Primary | Primary | Must pass 100% |
| Safari 17+ | Must test | Must test | Must test | SSE streaming, date pickers historically flaky |
| Firefox 120+ | Should pass | Should pass | N/A | |
| Edge (Chromium) | Should pass | Should pass | N/A | Parity with Chrome |

### C6. Accessibility

| ID | Test | Expected | Severity |
|---|---|---|---|
| C6-1 | Tab through landing page | All focusable elements reachable, visible focus ring. | P1 a11y |
| C6-2 | Screen reader (NVDA / VoiceOver) reads hero | Headings in order, alt text on images. | P1 a11y |
| C6-3 | Dashboard color contrast | WCAG AA (4.5:1 body, 3:1 large). | P1 |
| C6-4 | Practice page keyboard-only | Select answer with arrow keys, submit with Enter. | P1 |
| C6-5 | Sage chat keyboard-only | Open with shortcut, type, send with Enter. | P2 |
| C6-6 | Modal focus trap | Focus stays in modal, Esc closes. | P1 |
| C6-7 | Form validation errors announced | `aria-live` / `role=alert`. | P2 |
| C6-8 | No auto-playing video/audio | Respect prefers-reduced-motion. | P2 |
| C6-9 | Image alt text present everywhere | No decorative images with meaningful alt. | P2 |

---

## D. MARKETING PAGES AUDIT CHECKLIST

For each page: load time, above-fold CTA, no broken links, correct SEO meta, mobile layout OK.

### D1. `/` (Landing)
- [ ] Hero headline clear in 5s
- [ ] Primary CTA visible without scroll
- [ ] Hero image/video loads < 2s
- [ ] "How it works" 3-step section visible
- [ ] Testimonials / social proof
- [ ] Pricing teaser with "see plans" CTA
- [ ] Footer has Terms, Privacy, Contact
- [ ] No CLEP / DSST references (sunset)
- [ ] Meta title + description + OG tags
- [ ] Lighthouse LCP < 2.5s mobile
- [ ] GA4 page_view fires

### D2. `/about`
- [ ] Story / mission paragraph
- [ ] Team section (if applicable)
- [ ] No broken internal links
- [ ] Meta tags correct

### D3. `/pricing`
- [ ] Free / AP Premium / SAT Premium / ACT Premium tiers visible
- [ ] Prices match Stripe config
- [ ] Feature comparison table
- [ ] FAQ accordion works
- [ ] "Start free" → `/register`
- [ ] "Upgrade" → checkout (if logged in) or login
- [ ] Money-back / cancel-anytime language
- [ ] No CLEP / DSST tiers mentioned

### D4. `/ap-prep` and `/ap-prep/[slug]`
- [ ] `/ap-prep` lists all 9 AP courses (AP World, AP CS Principles, AP Calc AB, AP Calc BC, AP Stats, AP Chem, AP Bio, AP US History, AP Psychology)
- [ ] Each course card has: name, # of Qs, CTA to diagnostic
- [ ] `/ap-prep/ap-calculus-ab` (or equivalent slug) renders full course landing
- [ ] Course-specific meta title (e.g. "AP Calculus AB Prep | StudentNest")
- [ ] FAQ section specific to course
- [ ] No 404 on any course slug

### D5. `/sat-prep`
- [ ] SAT Math + SAT Reading/Writing sections visible
- [ ] Score ranges (400-1600) shown correctly
- [ ] CTA to diagnostic
- [ ] No AP/ACT mix-up in copy

### D6. `/act-prep`
- [ ] ACT English / Math / Reading / Science sections visible
- [ ] Score ranges (1-36) shown correctly
- [ ] CTA to diagnostic
- [ ] No AP/SAT mix-up in copy

### D7. `/faq`
- [ ] Questions grouped by category (Pricing, Tech, Exams)
- [ ] Expand/collapse works
- [ ] Anchor links (`#q-1`) scroll into view
- [ ] No CLEP/DSST FAQ items remain

### D8. `/methodology`
- [ ] Explains predicted-score formula
- [ ] Cites data sources
- [ ] No marketing fluff, pure trust copy
- [ ] Link from dashboard confidence banner works

### D9. Other marketing pages
- [ ] `/blog` renders index (or placeholder)
- [ ] `/contact` form submits successfully
- [ ] `/terms` renders legal text, last-updated date visible
- [ ] `/privacy` renders privacy policy

---

## E. API-LEVEL TESTS

Run via `curl`, Postman, or Vitest integration scripts. Every endpoint gets at least: (1) auth, (2) validation, (3) happy path, (4) rate limit (where applicable), (5) error handling.

### E1. Auth Enforcement

| ID | Endpoint | Without auth | With wrong-user auth |
|---|---|---|---|
| E1-1 | `GET /api/user` | 401 | 200 (own data only) |
| E1-2 | `GET /api/practice/[sessionId]` | 401 | 403 if not owner |
| E1-3 | `POST /api/practice` | 401 | — |
| E1-4 | `POST /api/diagnostic` | 401 | — |
| E1-5 | `POST /api/diagnostic/complete` | 401 | 403 if not owner |
| E1-6 | `GET /api/analytics` | 401 | own data only |
| E1-7 | `POST /api/chat/sage` | 401 | — |
| E1-8 | `POST /api/ai/tutor` | 401 | — |
| E1-9 | `POST /api/ai/hint` | 401 | — |
| E1-10 | `POST /api/ai/generate` | 401 + must be ADMIN | — |
| E1-11 | `GET /api/admin/*` | 401 → 403 if student | — |
| E1-12 | `POST /api/admin/*` | 401 → 403 if student | — |
| E1-13 | `POST /api/checkout` | 401 | — |
| E1-14 | `GET /api/billing/status` | 401 | own sub only |
| E1-15 | `POST /api/billing/cancel` | 401 | 403 if not owner |
| E1-16 | `GET /api/billing/portal` | 401 | own portal only |
| E1-17 | `POST /api/study-plan` | 401 | — |
| E1-18 | `GET /api/feature-flags` | Public OK | — |
| E1-19 | `POST /api/webhooks/stripe` | Signature check only | — |

### E2. Rate Limits

| ID | Endpoint | Limit | Test |
|---|---|---|---|
| E2-1 | `POST /api/auth/register` | 5/hr/IP | 6th request → 429 |
| E2-2 | `POST /api/auth/forgot-password` | 3/hr/email | 4th → 429 |
| E2-3 | `POST /api/ai/tutor` | 20/min/user | 21st → 429 |
| E2-4 | `POST /api/chat/sage` | 20/min/user | 21st → 429 |
| E2-5 | `POST /api/ai/hint` | 30/min/user | 31st → 429 |
| E2-6 | `POST /api/ai/generate` | admin-only, high cap | validate |

### E3. Input Validation

| ID | Endpoint | Bad input | Expected |
|---|---|---|---|
| E3-1 | `POST /api/practice` | `courseId: "NOT_A_COURSE"` | 400 |
| E3-2 | `POST /api/practice` | `sessionType: "INVALID"` | 400 |
| E3-3 | `POST /api/practice` | `numQuestions: 9999` | Clamped or 400 |
| E3-4 | `POST /api/practice` | `numQuestions: -1` | 400 |
| E3-5 | `POST /api/diagnostic` | Missing `course` | 400 |
| E3-6 | `POST /api/chat/sage` | `message: ""` | 400 |
| E3-7 | `POST /api/chat/sage` | `message: "<script>"` | Sanitized, 200 |
| E3-8 | `PATCH /api/user` | `track: "clep"` | 400 (sunset) |
| E3-9 | `PATCH /api/user` | `role: "ADMIN"` | 400 (client can't escalate) |
| E3-10 | `POST /api/user/exam-date` | date in 2019 | 400 |
| E3-11 | `POST /api/checkout` | `priceId: "whatever"` | 400 if not in allowlist |
| E3-12 | `POST /api/review` | `rating: 11` (out of 1-5) | 400 |

### E4. Error Handling

| ID | Scenario | Expected |
|---|---|---|
| E4-1 | DB cold-start (Neon 5s suspend) | Retry logic; response < 10s total |
| E4-2 | DB down entirely | 503, not 500; error logged |
| E4-3 | All AI providers down | 503 from AI endpoints; user-facing message |
| E4-4 | Stripe API timeout | Checkout returns friendly error, no DB mutation |
| E4-5 | Malformed JSON body | 400 "invalid JSON" |
| E4-6 | Missing Content-Type | 415 or handled gracefully |
| E4-7 | Unhandled exception in route handler | 500 with request-id, no stack trace leaked |
| E4-8 | CORS on API routes from unapproved origin | Blocked |

### E5. Webhook Integrity

| ID | Test | Expected |
|---|---|---|
| E5-1 | `POST /api/webhooks/stripe` with valid sig + event | 200, DB updated |
| E5-2 | Same event replayed | Idempotent (check `eventId`), no double-grant |
| E5-3 | Invalid signature | 400, no mutation |
| E5-4 | Missing signature | 400 |
| E5-5 | Unknown event type | 200 ignored (don't 500) |
| E5-6 | `customer.subscription.deleted` | User downgraded at period end |
| E5-7 | `invoice.payment_failed` | Email sent to user, no immediate downgrade |
| E5-8 | `checkout.session.completed` | Correct `SubTier` set based on priceId |

---

## F. TEST EXECUTION LOG

Fill this in while running. Copy rows from Sections A-E into here, mark pass/fail, attach bug IDs.

### F1. Execution Summary

| Run Date | Tester | Section | Total | Pass | Fail | Skipped | Notes |
|---|---|---|---|---|---|---|---|
|  |  | A |  |  |  |  |  |
|  |  | B |  |  |  |  |  |
|  |  | C |  |  |  |  |  |
|  |  | D |  |  |  |  |  |
|  |  | E |  |  |  |  |  |

### F2. Detailed Log

| Date | Case ID | Tester | Env (prod/dev) | Result | Actual | Bug ID / Notes |
|---|---|---|---|---|---|---|
|  | A1 |  |  |  |  |  |
|  | A2 |  |  |  |  |  |
|  | A3 |  |  |  |  |  |
|  | … |  |  |  |  |  |
|  | B1-P1 |  |  |  |  |  |
|  | B1-N1 |  |  |  |  |  |
|  | … |  |  |  |  |  |
|  | C1-1 |  |  |  |  |  |
|  | C2-1 |  |  |  |  |  |
|  | … |  |  |  |  |  |
|  | D1-checklist |  |  |  |  |  |
|  | … |  |  |  |  |  |
|  | E1-1 |  |  |  |  |  |
|  | E2-1 |  |  |  |  |  |
|  | … |  |  |  |  |  |

### F3. Bug Register

| Bug ID | Case ID | Severity | Title | Status | Assignee | Opened | Closed |
|---|---|---|---|---|---|---|---|
| BUG-001 |  | P0 |  | Open |  |  |  |
| BUG-002 |  | P1 |  | Open |  |  |  |

### F4. Exit Criteria (for "launch-ready" stamp)

- [ ] Section A Real Student Journey completes end-to-end in one sitting with 0 P0 bugs
- [ ] All P0 items in Section B (MCQ, Mock, Sage, Billing, Admin) pass
- [ ] Section C auth + tier gate tests 100% pass
- [ ] Section D marketing pages 100% CLEP/DSST-free
- [ ] Section E API auth tests 100% pass; rate limits verified; webhook idempotent
- [ ] No P0 or P1 bugs open in F3 at time of launch
- [ ] Performance: Dashboard TTFB < 1.5s p95, mobile LCP < 2.5s
- [ ] At least 3 real beta testers (matching Priya + SAT + ACT personas) complete Acts 1-6 unassisted

---

## Appendix: Route Inventory (source of truth)

Derived from `src/app/**` on 2026-04-17.

### Marketing routes (`(marketing)`)
- `/` — landing
- `/about`
- `/pricing`
- `/ap-prep`, `/ap-prep/[slug]`
- `/sat-prep`
- `/act-prep`
- `/blog`
- `/contact`
- `/faq`
- `/methodology`
- `/privacy`
- `/terms`

### Auth routes (`(auth)`)
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify-email`

### Dashboard routes (`(dashboard)`)
- `/dashboard`
- `/onboarding`
- `/diagnostic`
- `/practice`
- `/mock-exam`
- `/study-plan`
- `/analytics`
- `/ai-tutor`
- `/resources`
- `/community`
- `/about` (logged-in variant)
- `/billing`
- `/admin`, `/admin/manage`

### API routes (high-level — see `src/app/api/` for full tree)
- `/api/auth/[...nextauth]`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/check-verified`
- `/api/user`, `/api/user/exam-date`
- `/api/diagnostic`, `/api/diagnostic/complete`
- `/api/practice`, `/api/practice/[sessionId]`, `/api/practice/feedback`
- `/api/study-plan`
- `/api/analytics`
- `/api/chat/sage`
- `/api/ai/tutor`, `/api/ai/hint`, `/api/ai/generate`, `/api/ai/bulk-generate`, `/api/ai/status`
- `/api/billing/status`, `/api/billing/cancel`, `/api/billing/portal`
- `/api/checkout`
- `/api/webhooks/stripe`
- `/api/questions`
- `/api/review`
- `/api/resources`
- `/api/community`
- `/api/leaderboard`
- `/api/mastery-goal`
- `/api/feature-flags`
- `/api/cron/*`
- `/api/admin/analytics`, `/backup`, `/feedback`, `/mega-populate`, `/payment-config`, `/populate-questions`, `/quality-metrics`, `/settings`, `/subscribers`, `/users`
- `/api/test/*` (internal)

### Supported tracks & tiers
- `User.track`: `"ap"` | `"sat"` | `"act"`  (CLEP/DSST sunset 2026-04-14, rejected by validation)
- `SubTier`: `FREE` | `PREMIUM` (legacy = AP_PREMIUM) | `AP_PREMIUM` | `SAT_PREMIUM` | `ACT_PREMIUM`
- `Role`: `STUDENT` | `ADMIN`
- `SessionType`: `QUICK_PRACTICE` | `FOCUSED_STUDY` | `MOCK_EXAM` | `DIAGNOSTIC`

### AP courses in `COURSE_REGISTRY`
AP World History, AP CS Principles, AP Calculus AB, AP Calculus BC, AP Statistics, AP Chemistry, AP Biology, AP US History, AP Psychology

### SAT courses
SAT Math, SAT Reading/Writing

### ACT courses
ACT Math, ACT English, ACT Science, ACT Reading
