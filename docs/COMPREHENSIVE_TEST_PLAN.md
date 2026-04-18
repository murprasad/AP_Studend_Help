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

---

## G. POST-670e43a REGRESSION MATRIX

**Scope:** every feature shipped since the Beta-3.0 tag (`670e43a`). Each REQ gets a positive block, a 3x negative/edge block (per project testing policy — negatives > positives), and an FMEA row. RPN ≥ 200 is flagged `[HIGH RISK]` and must be monitored post-deploy.

**FMEA formula:** `RPN = Severity (1-10) × Likelihood (1-10) × Detection difficulty (1-10)`. Severity = harm to student if it fails. Detection = how hard for ops to notice before the student does.

### G-REQ-115. Score predictor engine (`/api/readiness`, `src/lib/score-predictors/`)

**Positive**
| ID | Case | Expected |
|---|---|---|
| G115-P1 | AP user w/ full diagnostic + 3 practice sessions, all ≥70% accuracy, hits `GET /api/readiness` | 200; body `{track:"ap", predicted:4 or 5, scale:"1-5", confidence:"high", inputs:{…}}` |
| G115-P2 | SAT user w/ mixed mastery (Math 80%, Reading 40%) calls `/api/readiness` | 200; `predicted` in 1000-1200; `scale:"400-1600"` |
| G115-P3 | ACT user at 60% across all sections | `predicted` in 22-26; `scale:"1-36"` |

**Negative / edge (9 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G115-N1 | Unauthenticated GET `/api/readiness` | 401 |
| G115-N2 | User with 0 sessions (pure fresh account) | 200 `{confidence:"none", predicted:null}` — client MUST hide the score |
| G115-N3 | User with 1 diagnostic Q answered (below min-signal) | 200 `{confidence:"low", predicted:null}` — client hides |
| G115-N4 | User with mastery map containing `NaN` (data corruption) | Engine clamps to 0, logs warning, returns `confidence:"low"` — MUST NOT return `NaN` in JSON |
| G115-N5 | User track = `"ap"` but only SAT_MATH sessions exist | Engine returns `predicted:null` (track/course mismatch) |
| G115-N6 | Unit weights undefined for a course | Falls back to equal weighting; result flagged `confidence:"low"` |
| G115-N7 | All mastery values = 0 | Predicted = floor of scale (AP=1, SAT=400, ACT=1); never divide-by-zero |
| G115-N8 | All mastery values = 1.0 and recency decay not applied | Predicted = top of scale, but audit flags "100% suspicious" in logs |
| G115-N9 | Redis/DB fetch fails inside `getScoreEngineInputs()` | Endpoint 503 + `Retry-After`, does NOT return a fake prediction |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Predictor returns NaN/Infinity (div-by-zero or schema mismatch) | Dashboard shows "NaN" | 9 | 4 | 6 | **216 [HIGH RISK]** | Unit tests in Section K; runtime `Number.isFinite()` guard in `/api/readiness` before `return Response.json` |
| Wrong scale applied (SAT user shown AP 1-5) | Student trusts wrong number, misallocates study time | 10 | 3 | 8 | **240 [HIGH RISK]** | Scale is derived from `user.track` + validated by Zod; cross-check in E2E |
| Confidence tier misses hide-at-low-signal gate | Fresh user sees "Predicted: 1" — demotivating | 8 | 4 | 7 | **224 [HIGH RISK]** | Min-signal threshold tested in K; ReadinessCard hides at `confidence==='low' OR 'none'` |
| Recency decay inverted (newer sessions down-weighted) | Predicted score stale | 6 | 3 | 7 | 126 | Unit test on decay fn; property-based fuzz |

### G-REQ-116. ReadinessCard on dashboard + SidebarReadiness pill

**Positive**
| ID | Case | Expected |
|---|---|---|
| G116-P1 | User w/ `confidence:"high"` loads `/dashboard` | `<ReadinessCard>` renders with predicted score, scale, "Improve" CTA |
| G116-P2 | User on any `(dashboard)` page | Sidebar pill shows same predicted value |

**Negative / edge (6 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G116-N1 | `/api/readiness` returns 503 | Card shows "Couldn't load prediction — retry" button; does NOT crash dashboard |
| G116-N2 | API returns `{predicted:null}` | Card shows "Take diagnostic to see your score"; no number rendered |
| G116-N3 | API returns predicted=0 for AP track | Card treats 0 as invalid (AP scale starts at 1), falls back to low-signal copy |
| G116-N4 | Sidebar pill overflow with 5-digit number (data corruption) | CSS truncates to ≤12 chars; no layout shift |
| G116-N5 | Slow response (> 3s) | Skeleton placeholder; no duplicate requests |
| G116-N6 | `predicted` changes between dashboard + sidebar fetch (race) | Both re-sync on next interval (tolerated within 1 refresh) |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Card renders "null" or "undefined" text | Trust loss | 6 | 3 | 5 | 90 | React key guards + fallback copy |
| Sidebar pill flashes wrong value then corrects | Confusing | 4 | 4 | 4 | 64 | Single source via SWR |

### G-REQ-117. Am I Ready — pre-signup quiz (`/am-i-ready`, `/api/am-i-ready-quiz`)

**Positive**
| ID | Case | Expected |
|---|---|---|
| G117-P1 | Anon visits `/am-i-ready`, picks AP Calc AB, completes 10 Qs | Result screen shows predicted 1-5 + "Start free at StudentNest" CTA to `/register?source=am-i-ready&course=AP_CALCULUS_AB` |
| G117-P2 | SAT slug e.g. `/am-i-ready/sat-math` loads | 10 SAT Math Qs render |
| G117-P3 | Completing quiz posts to `/api/am-i-ready-quiz`, response mirrors logged-in predictor math | Delta ≤ 5% from logged-in predictor given same answer distribution |

**Negative / edge (9 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G117-N1 | Visit `/am-i-ready/UNKNOWN_COURSE` | 404 or redirect to `/am-i-ready` index |
| G117-N2 | POST `/api/am-i-ready-quiz` with no answers | 400 "answers required" |
| G117-N3 | POST with 0 correct answers | Predicted = floor of scale, no crash |
| G117-N4 | POST with tampered `courseId` | 400 |
| G117-N5 | Abandon mid-quiz, close tab, come back | No local-storage resume required (it's pre-signup; state loss is acceptable) but also no stale session that polluted the signup flow |
| G117-N6 | Rate limit: 10 quiz submissions from same IP in 5 min | 429 |
| G117-N7 | Anon submits quiz with 50k-char payload | 413 |
| G117-N8 | Script injection in free-text fields (if any) | Sanitized before any render |
| G117-N9 | CTA URL tampered to include `source=am-i-ready&course=CLEP_X` | Signup rejects `course=CLEP_*` (sunset) with 400 |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Quiz predictor differs from logged-in predictor by > 1 scale point | User signs up, sees different number, trust broken | 8 | 4 | 7 | **224 [HIGH RISK]** | Both must call the same `predictScore()` lib fn; parity test in K |
| Stale `/am-i-ready/[slug]` cached across deploys | Wrong questions shown | 5 | 3 | 5 | 75 | Cache-Control: no-store on dynamic; sw.js v5 pass-through |

### G-REQ-118. HeroReadinessPicker on landing

**Positive**
| ID | Case | Expected |
|---|---|---|
| G118-P1 | Load `/` on desktop | Picker is primary CTA above fold; track buttons AP/SAT/ACT visible |
| G118-P2 | Click AP → Course dropdown populates with AP courses only | No SAT/ACT leak |

**Negative / edge (6 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G118-N1 | Click "Check my readiness" with no course selected | Button disabled OR inline validation "pick a course" |
| G118-N2 | Course dropdown shows CLEP_* items (sunset leak) | FAIL — must filter to AP/SAT/ACT only |
| G118-N3 | Mobile 375px width: tap-targets < 44px | FAIL — project a11y minimum |
| G118-N4 | Keyboard-only: can't reach dropdown via Tab | FAIL |
| G118-N5 | Select course, then switch track: previous course stays selected | Must clear course when track switches |
| G118-N6 | Submit while slow 3G → user double-clicks | Button disables on first click; only one navigation |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| CLEP course shown in dropdown post-sunset | Broken flow after signup | 6 | 3 | 4 | 72 | Feature flag `isClepEnabled()` gates list |
| Picker fails to load → no CTA above fold | Lost conversions | 8 | 2 | 5 | 80 | Static fallback CTA if JS fails |

### G-REQ-119. /methodology page

**Positive**
| ID | Case | Expected |
|---|---|---|
| G119-P1 | Visit `/methodology` | 4 sections render: inputs / model / Pass Confident Guarantee / honesty pledge |
| G119-P2 | Canonical `<link>` = `studentnest.ai/methodology` | Confirmed via view-source |

**Negative / edge (6 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G119-N1 | Link from `/dashboard` confidence banner → `/methodology` | Works; no 404 |
| G119-N2 | Dead link `/am-i-ready` previously present | Replaced with `/register` (fixed in `3ff330d`); don't regress |
| G119-N3 | Meta title missing | FAIL — SEO regression |
| G119-N4 | Copy references CLEP (sunset) | FAIL — project policy |
| G119-N5 | LCP > 2.5s on mobile | P1 perf |
| G119-N6 | Method page 500 on cold Neon start | 503 fallback page |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Methodology formula drifts from actual engine | Trust broken when students compare page to real score | 7 | 3 | 8 | 168 | Require `/methodology` copy update in same PR as score-engine change |

### G-REQ-120. Admin Test Users tab + `/api/admin/reset-test-users`

**Positive**
| ID | Case | Expected |
|---|---|---|
| G120-P1 | ADMIN loads `/admin?tab=test-users` | Table lists murprasad+std@gmail.com + any other seeded users; each row shows track/sub/trial/onboarding state |
| G120-P2 | Click "Reset" on a row | Confirmation modal → POST `/api/admin/reset-test-users`; on 200 the row refreshes with all state cleared |

**Negative / edge (9 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G120-N1 | STUDENT user hits `/admin?tab=test-users` | 403 |
| G120-N2 | STUDENT calls `POST /api/admin/reset-test-users` directly | 403 |
| G120-N3 | ADMIN passes `userId` of a NON-test user (real customer) | 400 — endpoint must whitelist seeded test accounts only (`email LIKE 'murprasad+%'`) |
| G120-N4 | Reset run twice in rapid succession | Idempotent; second call is a no-op 200 |
| G120-N5 | Reset while user has IN_PROGRESS session | Session cancelled cleanly; no orphaned session rows |
| G120-N6 | Reset does not clear `onboardingCompletedAt` | FAIL — REQ-121 requires nullify so user re-walks onboarding |
| G120-N7 | Reset leaves stale session cookie on user's browser | User sees cached onboarding-complete state on next login; mitigated by server-side check of DB field on every render |
| G120-N8 | Reset while user subscribed in Stripe | DB SubTier cleared locally, but Stripe sub still active — admin warned via confirm modal |
| G120-N9 | SQL-injection in `userId` param (`'; DROP TABLE User; --`) | Prisma parameterization blocks; test the literal payload |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Reset endpoint accepts non-test user | Real customer's progress wiped | 10 | 2 | 8 | 160 | Email-pattern allowlist `murprasad+%` or DB flag `isTestUser` |
| Reset clears DB but session cache stale on user's device | Test user still sees "completed onboarding" on next login | 6 | 5 | 7 | **210 [HIGH RISK]** | Server-side authority: onboarding check queries DB on every render; do not trust JWT claims |
| Reset leaves orphan `PracticeSession.status=IN_PROGRESS` | Stats skewed | 3 | 4 | 4 | 48 | Cascade cleanup in endpoint |

### G-REQ-121. onboardingCompletedAt DB field

**Positive**
| ID | Case | Expected |
|---|---|---|
| G121-P1 | User reaches Step 4 complete | `POST /api/onboarding/complete` sets `onboardingCompletedAt=now()` |
| G121-P2 | User logs in next day | Redirects to `/dashboard`, NOT `/onboarding` (DB check respects the field) |

**Negative / edge (6 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G121-N1 | User without `onboardingCompletedAt` hits `/dashboard` | Redirected to `/onboarding` |
| G121-N2 | After admin reset, `onboardingCompletedAt = null`, user logs in | Redirected to `/onboarding` (round-trip works) |
| G121-N3 | User somehow gets `onboardingCompletedAt` set in future (clock drift) | Treated as completed; no special-case negative time check needed but server uses server NOW() not client |
| G121-N4 | JWT has stale claim saying onboarding completed but DB says null | DB wins — user re-walks onboarding |
| G121-N5 | Onboarding POST fails (Neon 503) mid-save | Field remains null; user re-walks Step 4, not mid-state; log alert |
| G121-N6 | Onboarding POST doesn't set field on legacy users (pre-REQ-121) | Migration backfill script must run for all existing completed users |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Backfill missed legacy users → they're sent back to onboarding | Frustrating re-walk for real customers | 7 | 5 | 6 | **210 [HIGH RISK]** | Run one-time SQL update: `UPDATE "User" SET "onboardingCompletedAt"=NOW() WHERE diagnostic exists` before deploy |
| Onboarding post succeeds but returns 500 | User stuck in step 4 retry | 4 | 3 | 3 | 36 | Server returns 200 if field already set (idempotent) |

### G-REQ-122. Trial re-engagement cron (`/api/cron/trial-reengagement`)

**Positive**
| ID | Case | Expected |
|---|---|---|
| G122-P1 | Cron fires at 24h dormancy for a trial-active user | Email sends via Resend; `TrialReengagement` row inserted |
| G122-P2 | `?dry=1` | Same logic runs, no Resend call, response JSON shows planned recipients |
| G122-P3 | `CRON_TRIAL_REENGAGEMENT_ENABLED=false` | Returns 204 immediately; no DB hits |

**Negative / edge (9 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G122-N1 | Request missing `Authorization: Bearer CRON_SECRET` | 401 |
| G122-N2 | Wrong secret | 401 |
| G122-N3 | User with `trialEmailsSent=3` | Skipped (hit cap) |
| G122-N4 | Two cron fires within 36 min of each other for same user | Second is skipped (min-interval gate) |
| G122-N5 | User with `freeTrialExpiresAt` in past | Skipped (not active) |
| G122-N6 | Resend API returns 500 | Row NOT inserted; retry on next cron tick |
| G122-N7 | `TrialReengagement` insert fails but email already sent | Alert + log; risk is double-send on next tick — mitigated by email-idempotency key (userId + day bucket) |
| G122-N8 | User deleted between cron list build and send | Graceful skip |
| G122-N9 | 10,000 eligible users at once | Cron batches (≤ 50/run) + returns `nextCursor` so cron-job.org re-invokes |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Cron sends > 3 emails to same user | Spam complaint, domain reputation hit | 8 | 3 | 6 | 144 | `trialEmailsSent` cap enforced inside `decideEmail()`; kill-switch env flag |
| Cron sends wrong weakest-unit (stale cache) | Email feels generic/wrong | 5 | 4 | 7 | 140 | Weakest unit recomputed at send time |
| cron-job.org downtime | No emails for hours | 4 | 3 | 3 | 36 | Alert via Resend delivery dashboard gap |
| CRON_SECRET leaked to GitHub | Attacker spams users | 9 | 2 | 5 | 90 | Env var only, secret-scan pre-commit |

### G-REQ-123. SageFAQ model

**Positive**
| ID | Case | Expected |
|---|---|---|
| G123-P1 | Seed script inserts 20 FAQs from Reddit aggregator output | Rows exist with category/priority/tags |
| G123-P2 | Sage fallback-matcher queries SageFAQ when all AI providers down | Returns top match by (category, priority) |

**Negative / edge (6 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G123-N1 | SageFAQ query with no match | Sage returns generic fallback, not a bad match |
| G123-N2 | Seed script run twice | Upsert; no duplicates |
| G123-N3 | Stale `corroborationCount` — FAQ no longer valid | Admin UI shows "last verified" date |
| G123-N4 | FAQ answer contains `<script>` | Sanitized on render (ReactMarkdown escapes by default) |
| G123-N5 | FAQ referenced by Sage but deleted mid-session | Sage returns generic fallback |
| G123-N6 | Tag filter returns 0 rows on legitimate query | Falls back to category-only match |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Sage serves outdated FAQ answer | Wrong advice | 7 | 4 | 6 | 168 | Last-verified timestamp; monthly admin review |

### G-REQ-124. Full-screen exam mode (`use-exam-mode.ts`)

Full coverage in Section H. Summary:

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| User enters full-screen but can't exit (no close button, Esc broken) | Trapped | 9 | 3 | 7 | 189 | `useExamMode()` wires Esc handler + beforePopState; visible "Exit" affordance on all three pages |
| Full-screen leaks to non-exam page after navigation | Sidebar/header invisible everywhere | 6 | 4 | 6 | 144 | Route-change cleanup in `useEffect` return |
| Full-screen mode on mobile hides URL bar unpredictably, content clipped | Question partially off-screen | 5 | 5 | 6 | 150 | Use `dvh` units; test 375px viewport |

### G-REQ-125. ConfidenceRepairScreen

**Positive**
| ID | Case | Expected |
|---|---|---|
| G125-P1 | User completes diagnostic with `passPercent=45` | Repair screen renders BEFORE results flow |
| G125-P2 | Shows 2 weakest units + 7-day projection + 14-day projection + Pass Confident Guarantee copy | All four present |

**Negative / edge (6 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G125-N1 | `passPercent=61` | Repair screen NOT shown |
| G125-N2 | User already saw repair screen this session (sessionStorage guard) | Not shown again |
| G125-N3 | Fewer than 2 units have mastery data | Show 1 or "add more practice to see weakest unit" |
| G125-N4 | `projectImprovement` returns NaN | Fallback to "on track in 7-14 days" copy, no NaN visible |
| G125-N5 | SessionStorage disabled (private mode) | Repair screen may show twice; acceptable, log warning |
| G125-N6 | Component not wired into diagnostic flow (current state) | Documented known gap; E2E skipped until wired (REQ-108 in ledger) |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Repair screen demotivates user (shows 1/5 projection without guarantee) | Drops conversion | 7 | 4 | 8 | **224 [HIGH RISK]** | Copy enforces "here's your starting line" framing; Pass Confident Guarantee prominent |

### G-REQ-126. early-win.ts (lib only)

**Positive**
| ID | Case | Expected |
|---|---|---|
| G126-P1 | `shouldBoost(avgDiag=0.35)` | Returns true |
| G126-P2 | `applyEarlyWinBoost(qs, weakUnits, 2)` returns array starting with 2 EASY non-weak-unit Qs | Asserted |

**Negative / edge (6 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G126-N1 | `shouldBoost(0.6)` | Returns false |
| G126-N2 | No EASY non-weak-unit Qs available | Returns original array unchanged; does not pad with weak-unit Qs |
| G126-N3 | `count=0` | Returns original array |
| G126-N4 | weakUnits = all units | Returns original array (no non-weak Qs exist) |
| G126-N5 | Called from practice route (not yet) | Known gap; ledger marks `⏳` |
| G126-N6 | Questions array is empty | Returns empty array |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Once wired, boost picks Qs already seen in diagnostic | Early win feels recycled | 4 | 4 | 5 | 80 | De-dup against session history before boost |

### G-REQ-127. PREMIUM_COURSES Sonnet override

**Positive**
| ID | Case | Expected |
|---|---|---|
| G127-P1 | `PREMIUM_COURSES=AP_US_HISTORY,AP_STATISTICS`, bulk-gen on USH | Routes to `callSonnet()` |
| G127-P2 | Sonnet returns valid JSON | Question saved to DB |

**Negative / edge (6 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G127-N1 | `PREMIUM_COURSES` env unset | Defaults to Groq cascade (no breakage) |
| G127-N2 | Sonnet throws 429 | Falls back to Groq cascade |
| G127-N3 | Sonnet returns malformed JSON | Falls back to Groq cascade |
| G127-N4 | `PREMIUM_COURSES` has typo `AP_USHISTORY` | Route treats as regex miss → Groq cascade |
| G127-N5 | ANTHROPIC_API_KEY missing | Skipped with warning, Groq cascade |
| G127-N6 | Cost runaway (Sonnet called 1000x in a loop) | Bulk-gen has per-run concurrency cap |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| All courses accidentally in PREMIUM_COURSES | Cost spike, Anthropic rate-limit hit | 6 | 2 | 4 | 48 | Env is explicit allowlist; production PR review |

### G-REQ-128. Sage rate limit + error-leak sanitization

**Positive**
| ID | Case | Expected |
|---|---|---|
| G128-P1 | 20 requests/min from one IP to `/api/chat/sage` (auth or anon) | All 200 |
| G128-P2 | `/api/ai/tutor` throws internally | Response body = "Sorry, I'm having trouble right now" — no stack, no path |

**Negative / edge (9 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G128-N1 | 21st request in same minute | 429 with `Retry-After` |
| G128-N2 | IP spoofed via `X-Forwarded-For` | Rate limit keyed off CF-Connecting-IP (trusted), not client header |
| G128-N3 | 20 authed + 20 anon from same IP | Both share the bucket (bucket is per-IP, not per-user) |
| G128-N4 | Error response contains `C:\Users\akkil` | FAIL — must be stripped |
| G128-N5 | Error response contains stack trace | FAIL — must be stripped |
| G128-N6 | Error response contains DB error (`syntax error at or near…`) | FAIL — must be generic |
| G128-N7 | Auth token invalid | 401, not 500 |
| G128-N8 | Distributed DDoS (1000 IPs) | Rate limit degrades gracefully; CF WAF layer kicks in |
| G128-N9 | Rate limit storage unavailable | Fail-open (200 allowed, logged as warning) OR fail-closed — spec the choice; current impl: fail-open + alert |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Path leak to client (Windows `C:\Users\akkil`) | Internal info disclosure | 6 | 3 | 5 | 90 | Generic catch at API boundary; ESLint rule to flag `.message` pass-through |
| Rate limit bucket bypassed | Cost spike | 7 | 3 | 5 | 105 | Monitor per-IP RPM; CF WAF |

### G-REQ-129. Billing polling — flip refreshing off before update()

**Positive**
| ID | Case | Expected |
|---|---|---|
| G129-P1 | User returns from Stripe, `/billing` polls `/api/billing/status` | Within 10s, status flips, `setRefreshing(false)` called, then `update()` awaited |
| G129-P2 | `update()` resolves successfully | UI shows new tier |

**Negative / edge (6 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G129-N1 | `update()` rejects | UI still shows new status (refreshing flag already off); no infinite spinner |
| G129-N2 | Webhook delayed 30s | Polling continues up to max (30 tries); then shows "still processing" banner |
| G129-N3 | User navigates away during polling | Polling aborts (AbortController) |
| G129-N4 | Duplicate checkout → duplicate status change | Final state consistent, no double-render loop |
| G129-N5 | `/api/billing/status` 500s repeatedly | Polling backs off exponentially; stops after 30s with error banner |
| G129-N6 | User returns without completing Stripe (tab closed) | `/billing` shows old tier, no forever spinner |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Infinite polling loop when `update()` rejects | Dashboard unusable, battery drain | 8 | 4 | 7 | **224 [HIGH RISK]** | Fixed in `6f9a236` — refreshing=false BEFORE update(); test guards regression |
| Polling persists after unmount | Memory leak, stale state | 5 | 4 | 6 | 120 | AbortController + useEffect cleanup |

### G-REQ-130. Mock-exam paywall fail-closed

**Positive**
| ID | Case | Expected |
|---|---|---|
| G130-P1 | PREMIUM user visits `/mock-exam` | Mock loads |
| G130-P2 | FREE user on course-that-requires-premium | Paywall modal |

**Negative / edge (6 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G130-N1 | Premium-check fn throws → `userIsPremium=undefined` | Defaults to false; paywall shown (fail-closed) |
| G130-N2 | DB query for sub returns null | `userIsPremium=false` |
| G130-N3 | SubTier `PREMIUM` (legacy) on AP course | Granted (legacy parity) |
| G130-N4 | SubTier `SAT_PREMIUM` on AP course | Denied (cross-track) |
| G130-N5 | Webhook lag: paid user not yet flipped | Paywall temporarily; `/billing` polling (REQ-129) resolves within 30s |
| G130-N6 | User manually calls `/api/mock-exam/start` with spoofed tier | Server-side re-check blocks |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Silent fail → `undefined` grants access | Revenue leak | 10 | 2 | 9 | 180 | Fail-closed default; server-side validation on every request |

### G-REQ-131. Tailwind dynamic-class fix on clep-prep/dsst-prep

**Positive**
| ID | Case | Expected |
|---|---|---|
| G131-P1 | `/clep-prep` (if flag on) renders persona cards | Each card has correct background + text color |

**Negative / edge (6 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G131-N1 | Template string `text-${p.color}-400` in source | FAIL linter (Tailwind can't statically extract) |
| G131-N2 | Color value at runtime = `'red'` but not in safelist | Card unstyled |
| G131-N3 | `isClepEnabled()` false | Page 404 or redirect — no crash from unstyled persona card |
| G131-N4 | SSR output contains dynamic-class string | Client hydration mismatch → warning |
| G131-N5 | Color name typo in config | Falls back to default style |
| G131-N6 | Tailwind JIT build doesn't include runtime class | Confirmed in `.cf-deploy/static/**` CSS dump |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Unstyled persona cards on sunset page look broken | Trust drop if flag ever flipped on | 5 | 6 | 5 | 150 | Safelist static map; CI test that `bg-red-400 text-red-400 …` all appear in build output |

### G-REQ-132. Course count + subtest count copy fixes

**Positive**
| ID | Case | Expected |
|---|---|---|
| G132-P1 | Grep `16 courses` on StudentNest landing | Match |
| G132-P2 | Grep `6 subtests` on Accuplacer copy | Match |

**Negative / edge (6 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G132-N1 | Grep `56 courses` on StudentNest | No match (stale) |
| G132-N2 | Grep `57 courses` cross-product | No match (StudentNest is 16 now; cross-product is 73) |
| G132-N3 | Grep `5 subtests` on Accuplacer | No match |
| G132-N4 | New course added without updating copy | CI grep enforces via `docs/course-count-source-of-truth.md` |
| G132-N5 | CLEP course accidentally re-counted | Feature flag filter must exclude CLEP from StudentNest count |
| G132-N6 | Copy uses "72 courses" (cross-product pre-addition) | FAIL |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Wrong count erodes trust | Small, cumulative | 3 | 5 | 6 | 90 | CI grep + grep in Section D |

### G-REQ-133. Logo routes to landing

**Positive**
| ID | Case | Expected |
|---|---|---|
| G133-P1 | Authed user on `/dashboard` clicks logo | Navigates to `/` |
| G133-P2 | Authed user on `/analytics` clicks logo | Navigates to `/` |

**Negative / edge (6 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G133-N1 | Logo hardcoded to `/dashboard` | FAIL (regression) |
| G133-N2 | Middleware redirects `/` back to `/dashboard` for authed user | Expected (that's fine); the REQ is the link itself, not the landing view |
| G133-N3 | Logo link has no `href` | A11y fail |
| G133-N4 | Right-click → "Open in new tab" works | Yes |
| G133-N5 | Logo on public pages still goes to `/` | Yes |
| G133-N6 | Logo on `/admin` as ADMIN | Goes to `/`, admin can click back (no special case) |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Logo deep-links to wrong route | Confusion only | 2 | 2 | 2 | 8 | Visual smoke test Section A |

### G-REQ-134. Premium Feature Restriction banner cleanup

**Positive**
| ID | Case | Expected |
|---|---|---|
| G134-P1 | FREE user sees restriction banner on a premium feature | Banner says what's locked, does NOT mention FRQ as free |

**Negative / edge (6 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G134-N1 | Grep for "FRQ" in banner copy | No match |
| G134-N2 | Banner A/B variant still claims free FRQ | Must be deleted from all variants |
| G134-N3 | PREMIUM user sees banner | Banner hidden |
| G134-N4 | Copy mentions `CLEP` | FAIL |
| G134-N5 | Banner link goes to `/billing` | Yes |
| G134-N6 | Banner dismissible; re-renders next session | Yes (nonblocking) |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Stale FRQ-free copy leads to refund request | Legal / trust | 6 | 3 | 6 | 108 | Grep in CI; Section D marketing audit |

### G-REQ-135. Reddit mining pipeline

**Positive**
| ID | Case | Expected |
|---|---|---|
| G135-P1 | `node scripts/crawl-reddit-exam-subs.mjs` | Writes `scripts/data/reddit-signals.json` |
| G135-P2 | Extractor + aggregator produce `themes.json` with corroboration counts | File valid |

**Negative / edge (6 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G135-N1 | Reddit API 429 | Script retries with backoff, does not crash |
| G135-N2 | Zero signals found | Writes empty JSON, logs warning, exits 0 |
| G135-N3 | Theme with corroboration=1 | Flagged, NOT promoted to SageFAQ |
| G135-N4 | Theme contains slur or harmful advice | Blocklist filter strips before promotion |
| G135-N5 | Aggregator de-dups near-identical themes | Levenshtein ≥ 0.85 merged |
| G135-N6 | Pipeline runs in CI but `REDDIT_CLIENT_ID` missing | Skipped with explicit message, no throw |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Harmful / racist advice promoted to SageFAQ | Brand damage | 10 | 2 | 7 | 140 | Blocklist + manual approval gate before insert |

### G-REQ-136. Daily Quiz Email cron

Full smoke plan in Section I. Summary FMEA:

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Same question sent 2 days in a row (dedup broken) | User loses trust | 6 | 4 | 7 | 168 | 30-day dedup enforced in `pickDailyQuestion()`; test asserts window |
| Email sent to opted-out user | Legal (CAN-SPAM) + brand | 9 | 3 | 8 | **216 [HIGH RISK]** | `dailyQuizOptIn=true` gate at SELECT level, not at SEND level |
| Email renders broken on mobile Gmail | Low perceived quality | 4 | 5 | 6 | 120 | Email template smoke on real inboxes |
| Cron fires, sends identical Q to 10k users (stale cache) | All see same Q, embarrassment | 5 | 2 | 6 | 60 | Q picked per-user, not globally cached |

### G-REQ-137. _routes.json excludes static public files

**Positive**
| ID | Case | Expected |
|---|---|---|
| G137-P1 | `curl https://studentnest.ai/sw.js` | 200, content-type application/javascript, bytes match `public/sw.js` |
| G137-P2 | `curl /favicon.ico`, `/manifest.webmanifest`, `/icons/icon-192.png` | All 200 |

**Negative / edge (6 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G137-N1 | `_routes.json` missing `/sw.js` | Worker intercepts, returns 404 or 500 — FAIL |
| G137-N2 | New image added to `public/` without update | Served via worker, likely 404 — caught by test checklist |
| G137-N3 | Wildcard `/icons/*` captures only depth 1 | Confirmed to capture nested if present |
| G137-N4 | `prepare-cf-deploy.js` not run before deploy | `_routes.json` stale; CI gate runs script |
| G137-N5 | Browser caches old 404 for `/sw.js` | SW v5 activate clears cache on next load; users recover on next visit |
| G137-N6 | Worker handler regressed to catch-all `/*` | Excludes ignored — static files break |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| `/sw.js` 404 after deploy | Users stuck on broken bundle (no SW update) | 9 | 3 | 5 | 135 | Rule #9 post-deploy smoke; curl check |
| `/icons/*` 404 | PWA install icon missing | 4 | 3 | 4 | 48 | Post-deploy smoke checklist |

### G-REQ-138. pages:clean prepended to pages:build

**Positive**
| ID | Case | Expected |
|---|---|---|
| G138-P1 | Run `npm run pages:build` | First command is `rm -rf .open-next .cf-deploy .next` |
| G138-P2 | Subsequent OpenNext build starts from empty `.cf-deploy/` | No mixed artifacts |

**Negative / edge (6 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G138-N1 | pages:clean removed from script | Release checklist rule #1 catches in PR review |
| G138-N2 | Clean script fails (Windows EPERM on locked .dll) | Documented fallback: rename + retry |
| G138-N3 | `.cf-deploy/_worker.js` from previous build slips in | FAIL — Beta-3.0 incident root cause |
| G138-N4 | User runs `pages:deploy` without `pages:build` | `wrangler pages deploy` runs against existing `.cf-deploy/`; documented as unsafe |
| G138-N5 | Parallel bulk-gen holds `query_engine-windows.dll.node` | `prisma generate` fails; release checklist rule #7 documents rename workaround |
| G138-N6 | CI skips pages:clean to save time | Explicitly banned; RFC required |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Stale `_worker.js` deployed → NextAuth 400s → ERR_FAILED | Full site outage | 10 | 4 | 7 | **280 [HIGH RISK]** | pages:clean ALWAYS runs first; rule #8 smoke detects within 30s |

### G-REQ-139. SW pass-through v5

**Positive**
| ID | Case | Expected |
|---|---|---|
| G139-P1 | `public/sw.js` has `CACHE_NAME = 'studentnest-sw-v5'` | Confirmed |
| G139-P2 | `fetch` handler returns `fetch(event.request)` unmodified | No cache lookup, no match-first |
| G139-P3 | `activate` handler clears all caches | All `caches.keys()` deleted |

**Negative / edge (6 = 3×)**
| ID | Case | Expected |
|---|---|---|
| G139-N1 | Old SW v3/v4 still cached on user's device | v5 activate clears them; next page load is fresh |
| G139-N2 | Network offline during fetch | Browser shows native offline page (SW doesn't cache fallback) |
| G139-N3 | Strategy reverted to cache-first without bumping CACHE_NAME | Users stuck on stale cache — banned; release checklist rule #5 |
| G139-N4 | `self.addEventListener('install', …)` calls `skipWaiting()` | Yes, so new SW activates immediately |
| G139-N5 | Another `fetch` handler registered that caches | FAIL — only one handler |
| G139-N6 | SW registration fails (HTTPS required) | App still works via network; log warning |

**FMEA**
| Failure mode | Effect on student | Sev | Lik | Det | RPN | Mitigation |
|---|---|---|---|---|---|---|
| SW caches broken deploy, user stuck indefinitely | Users see old broken bundle even after fix deploy | 10 | 3 | 7 | **210 [HIGH RISK]** | v5 is network-only; future strategy changes MUST bump CACHE_NAME; release checklist rule #5 |

---

## H. FULL-SCREEN EXAM MODE TEST MATRIX (REQ-124)

`useExamMode()` controls whether the page chrome (sidebar + header + Sage floating bubble) is visible. Invoked on `/diagnostic`, `/mock-exam`, and `/ai-tutor` (when `?fullscreen=1`).

### H1. Entry

| ID | Step | Expected |
|---|---|---|
| H1-1 | Navigate to `/diagnostic` | `data-exam-mode="true"` on `<body>`; sidebar + header + Sage bubble hidden |
| H1-2 | Navigate to `/mock-exam` | Same |
| H1-3 | Navigate to `/ai-tutor?fullscreen=1` | Same |
| H1-4 | Navigate to `/ai-tutor` (no flag) | `data-exam-mode` NOT set; normal chrome visible |
| H1-5 | Route change `/dashboard → /diagnostic` | Chrome disappears; no flash of unstyled content |

### H2. Exit

| ID | Step | Expected |
|---|---|---|
| H2-1 | On `/diagnostic`, click visible "Exit" button | Mode clears, chrome re-appears |
| H2-2 | Press Esc during `/mock-exam` | Confirmation modal (don't lose exam progress); on confirm, exits |
| H2-3 | Browser back button during `/diagnostic` | Auto-exit; chrome re-appears |
| H2-4 | Close tab during `/mock-exam` | Server-side exam state preserves; on reopen user sees resume banner; client-side mode state is gone (fresh page) |
| H2-5 | Navigate via link click to `/dashboard` | Auto-exit; Next router's `useEffect` cleanup runs |
| H2-6 | Exit handler fails (throw) | Mode still clears via `finally` block |

### H3. Negative / edge

| ID | Step | Expected |
|---|---|---|
| H3-1 | User opens DevTools and removes `data-exam-mode` attribute manually | Chrome shows but exam still active; no crash |
| H3-2 | User has `prefers-reduced-motion` — no animation on transitions | Honored |
| H3-3 | Mobile Safari hides URL bar; content below fold clipped | Use `100dvh`; fits viewport exactly |
| H3-4 | Landscape phone — exam renders correctly | Sidebar MUST stay hidden |
| H3-5 | Accessibility: tab focus should NOT enter hidden chrome | Use `inert` attribute on hidden nodes |
| H3-6 | Sage bubble invoked via keyboard shortcut during exam | Blocked; banner "Sage unavailable during exam" |
| H3-7 | Multiple exam routes open in 2 tabs | Each tab has own local state; no cross-tab leak |
| H3-8 | Exam mode ON during session timeout → NextAuth kicks to login | Mode clears; user goes to `/login` |
| H3-9 | Hot-reload during dev (`npm run dev`) with exam mode on | Cleanup runs; mode resets on module re-eval |

### H4. FMEA (summary — full rows under G-REQ-124)

- RPN 189: Can't exit (trapped user)
- RPN 150: Mobile viewport clipping
- RPN 144: Leak to non-exam page

---

## I. DAILY QUIZ EMAIL SMOKE PLAN (REQ-136)

`/api/cron/daily-quiz` is triggered by cron-job.org daily at 14:00 UTC (8am Central target). Sends one Q to each opted-in user's weakest unit.

### I1. Dry-run inspection

| ID | Step | Expected |
|---|---|---|
| I1-1 | `curl -H "Authorization: Bearer $CRON_SECRET" https://studentnest.ai/api/cron/daily-quiz?dry=1` | 200 JSON: `{eligibleCount, planned:[{userId, courseId, questionId, weakestUnit}], skipped:[{userId, reason}]}` |
| I1-2 | Response contains only opted-in users | `dailyQuizOptIn=true` gate working |
| I1-3 | No Resend API call made | Inspect Resend dashboard — zero deltas for this run |
| I1-4 | Selected question is EASY or MEDIUM from weakest unit | Confirmed per row |

### I2. Opt-in gating

| ID | Case | Expected |
|---|---|---|
| I2-1 | User `dailyQuizOptIn=true` | Included |
| I2-2 | User `dailyQuizOptIn=false` | Skipped, reason `"not_opted_in"` |
| I2-3 | User `dailyQuizOptIn=null` (legacy) | Skipped (treat null as false) |
| I2-4 | User unsubscribed via one-click (List-Unsubscribe header) | `dailyQuizOptIn` flipped to false server-side; next cron skips them |
| I2-5 | User deleted between cron runs | Skipped gracefully |
| I2-6 | User has no track set | Skipped, reason `"no_track"` |

### I3. 30-day dedup

| ID | Case | Expected |
|---|---|---|
| I3-1 | User received Q-123 yesterday | Today picks a different Q |
| I3-2 | User has received every Q in their weakest unit in last 30 days | Picks from second-weakest unit OR sends no-email with reason `"bank_exhausted"` |
| I3-3 | `DailyQuizSend` has no rows for user (fresh opt-in) | Any Q allowed |
| I3-4 | `DailyQuizSend` row from 31 days ago for Q-123 | Q-123 eligible again |
| I3-5 | Dedup query uses `sentAt >= NOW() - interval '30 days'` | Confirmed via explain-analyze |
| I3-6 | Same user opted in, opted out, opted back in | Dedup history preserved; cron respects 30-day gap from earlier sends |

### I4. Email rendering

| ID | Case | Expected |
|---|---|---|
| I4-1 | Preview email in Gmail / Apple Mail / Outlook | Renders cleanly; question + 4 options visible; "Answer in app" CTA works |
| I4-2 | Email has `List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click` | Confirmed |
| I4-3 | Subject line includes course name | e.g. "AP Calc AB — today's practice question" |
| I4-4 | Body contains question stem + option list (NOT the answer) | Answer only revealed after click-through |
| I4-5 | Answer link has signed token with expiry | Expires in 48h; prevents email-forwarding exploits |
| I4-6 | Email sends in < 10s per user (Resend latency + render) | Monitored via Resend delivery dashboard |

### I5. FMEA

(See G-REQ-136 for full table. Flagged RPN ≥ 200: opt-out leak sent emails = 216.)

---

## J. RELEASE-CHECKLIST COMPLIANCE

Maps each of the 13 rules in `docs/RELEASE_CHECKLIST.md` to a checker + a cadence.

### J1. Before every deploy

| Rule | What | Checker | Cadence | How to verify |
|---|---|---|---|---|
| #1 | pages:clean prepended to pages:build | Dev running deploy | Every deploy | `cat package.json | grep '"pages:build"'` — must start with `npm run pages:clean &&` |
| #2 | `npx tsc --noEmit` exit 0 | Dev + CI | Every deploy | Run it; reject if non-zero |
| #3 | Schema migration applied before deploy | Dev running deploy | Every deploy (if schema changed) | `git diff HEAD..last_deploy_tag prisma/schema.prisma`; if diff ≠ empty, confirm `npx prisma db push` against prod ran |
| #4 | Env vars exist on CF Pages | Dev + DevOps | Every deploy | `npx wrangler pages secret list --project-name=studentnest` — cross-check against rule #4 list |
| #5 | SW strategy reviewed; CACHE_NAME bumped on changes | Dev making SW change | Whenever `public/sw.js` changes | `git diff public/sw.js` — if CACHE_NAME not bumped, PR reject |
| #6 | `_routes.json` covers all public/ files | Dev adding public asset | On public/ change | `ls public/` ∩ `_routes.json exclude[]` — every file must be listed or served by worker without 404 |
| #7 | Prisma generate uses engine (no `--no-engine`) | Dev | Every deploy | `cat package.json | grep "prisma generate"` — must NOT contain `--no-engine` |
| #8 | Post-deploy smoke | Dev running deploy | Every deploy | `curl -I /`, `/login`, `/dashboard`, `/api/auth/csrf` — all 200 or 307 redirect |
| #9 | Post-deploy SW check | Dev running deploy | Every deploy | `curl /sw.js` byte-for-byte match `public/sw.js` |

### J2. Before every release (tag cut)

| Rule | What | Checker | Cadence | How to verify |
|---|---|---|---|---|
| #10 | REQUIREMENTS_LEDGER updated | Tag author | Every release tag | Every new REQ-### has an entry (this doc enforces) |
| #11 | Test plan Section A rerun on reset test user | QA lead | Every release | Admin `/admin?tab=test-users` reset, then walk Priya journey end-to-end; log in Section F |
| #12 | Negative/positive test ratio ≥ 3:1 | Reviewer | PR review | Grep new feature's test file — count `N` vs `P` IDs; reject if ratio < 3:1 |
| #13 | Git tag at a deployable commit | Tag author | Every release tag | Tag commit must be the HEAD of a successful `pages:deploy`; confirm via `git log --decorate` and CF deploy dashboard |

### J3. Compliance-gate outcomes

- **Pass all 13** → deploy/tag proceeds
- **Fail any of #1-#7** → blocking; fix + redeploy
- **Fail #8 or #9** → emergency recovery from RELEASE_CHECKLIST.md → "Emergency recovery"
- **Fail #10-#13** → tag is un-cut (move the tag, don't deploy a pseudo-release)

---

## K. SCORE PREDICTOR BOUNDARY TESTS (REQ-115)

Every cutoff must have a positive "just above" and negative "just below" test. Hide-at-low-signal must trigger cleanly.

### K1. AP scale (1-5)

| ID | Input | Expected predicted |
|---|---|---|
| K1-1 | Aggregate mastery = 0.85, ≥ 40 Qs answered | 5 |
| K1-2 | Aggregate = 0.75 | 4 |
| K1-3 | Aggregate = 0.60 | 3 |
| K1-4 | Aggregate = 0.45 | 2 |
| K1-5 | Aggregate = 0.25 | 1 |
| K1-6 | Aggregate = 0.849 (just below cutoff for 5) | 4 — boundary verified |
| K1-7 | Aggregate = 0.850 (exactly at cutoff) | 5 (inclusive spec) |
| K1-8 | Aggregate = 0.0 | 1 (never 0) |
| K1-9 | Aggregate = 1.0 | 5 (never 6 or overflow) |

### K2. SAT scale (400-1600)

| ID | Input | Expected predicted (± 20 band) |
|---|---|---|
| K2-1 | Math 100% + RW 100% | 1600 |
| K2-2 | Math 0% + RW 0% | 400 |
| K2-3 | Math 50% + RW 50% | ~ 1000 |
| K2-4 | Math 80% + RW 20% | ~ 1100 (Math carries more weight only if model says so; verify weighting spec) |
| K2-5 | Only Math data (no RW sessions) | predicted = Math-only scale × 2, OR confidence drops to "low" |
| K2-6 | Just below 1600 top cap | 1580 ≤ result ≤ 1600 |
| K2-7 | Just above 400 floor | 410 ≤ result ≤ 430 |
| K2-8 | Predicted = 1605 | CLAMP to 1600 |
| K2-9 | Predicted = 395 | CLAMP to 400 |

### K3. ACT scale (1-36)

| ID | Input | Expected predicted (± 1 composite) |
|---|---|---|
| K3-1 | All 4 sections at 100% | 36 |
| K3-2 | All at 0% | 1 |
| K3-3 | All at 50% | ~ 20 |
| K3-4 | English 100% + others 50% | 23-24 |
| K3-5 | 3 sections complete, 1 absent | Composite on 3 sections OR confidence=low; spec the choice |
| K3-6 | Percentile rollover: section score 25 → composite factors in | No off-by-one in percentile lookup |
| K3-7 | CLAMP at 36 top, 1 bottom | Both enforced |
| K3-8 | All 4 at 99% | 35 (not 36; rounding) |
| K3-9 | Single section at 100%, others null | confidence=low, predicted hidden |

### K4. Confidence tier flips

| ID | Q count | Diag completeness | Expected confidence | Client behavior |
|---|---|---|---|---|
| K4-1 | 0 | none | `"none"` | Hide number; show "Take diagnostic first" |
| K4-2 | 5 | partial | `"low"` | Hide number; show "Keep practicing" |
| K4-3 | 30 | diag + 20 practice | `"medium"` | Show number with "± 1 band" disclaimer |
| K4-4 | 100 | full + mock | `"high"` | Show number, no disclaimer |
| K4-5 | 29 (boundary below medium threshold 30) | full | `"low"` | Hide |
| K4-6 | 30 (exactly at threshold, inclusive) | full | `"medium"` | Show |
| K4-7 | Data present but all stale (> 60 days) | — | downgrade one tier | e.g. medium → low |
| K4-8 | All data from 1 course, user asks for another course | N/A per course | low on the untested course | Show track-average + disclaimer |

### K5. Hide-score-at-low-signal

| ID | Case | Expected |
|---|---|---|
| K5-1 | confidence = `"low"` | `<ReadinessCard>` hides the numeric prediction; shows "Not enough data yet" |
| K5-2 | confidence = `"none"` | Same |
| K5-3 | confidence = `"medium"` | Numeric prediction shown with "± 1 band" text |
| K5-4 | confidence = `"high"` | Numeric prediction shown without disclaimer |
| K5-5 | confidence field missing from API response (legacy) | Treat as `"low"`, hide |
| K5-6 | confidence = `"invalid_string"` | Treat as `"low"`, hide, log warning |

### K6. FMEA (summary; full rows under G-REQ-115)

RPN ≥ 200 flagged:
- 240: Wrong scale applied (SAT user shown AP 1-5)
- 224: Confidence tier misses hide-at-low-signal gate
- 216: NaN/Infinity returned from predictor

All three require unit-test coverage before deploy.

---

## Post-670e43a: summary of HIGH-RISK (RPN ≥ 200) items

| REQ | Failure mode | RPN | Must-fix before deploy? |
|---|---|---|---|
| REQ-115 | Wrong scale applied | 240 | Yes |
| REQ-115 | Confidence tier misses hide gate | 224 | Yes |
| REQ-115 | Predictor returns NaN/Infinity | 216 | Yes |
| REQ-117 | Am I Ready vs logged-in predictor drift > 1 point | 224 | Yes — parity test required |
| REQ-120 | Reset endpoint session cache stale → test user sees stale state | 210 | Yes — server-authority check |
| REQ-121 | Backfill missed legacy users → sent back to onboarding | 210 | Yes — run SQL backfill before deploy |
| REQ-125 | Confidence Repair demotivates user | 224 | Required copy review |
| REQ-129 | Infinite polling loop on update() reject | 224 | Fixed in `6f9a236`; regression test required |
| REQ-136 | Email sent to opted-out user | 216 | Yes — SELECT-level gate |
| REQ-138 | Stale `_worker.js` deployed → site down | 280 | Rule #1 + rule #8 enforce |
| REQ-139 | SW caches broken deploy → users stuck | 210 | Network-only v5 enforces; RFC required to change |

Count of HIGH-RISK rows: **11** (all require pre-deploy mitigation confirmation).

---
