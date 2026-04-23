# Comprehensive Practice Session Test Plan
**Version:** Beta 2.0 | **Date:** 2026-03-20

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
| 22 | CLEP_COLLEGE_ALGEBRA | ALL | ALL | MCQ | ✅ Session starts (clep_enabled=true) |
| 23 | CLEP_COLLEGE_COMPOSITION | ALL | ALL | MCQ | ✅ Session starts |
| 24 | CLEP_INTRO_PSYCHOLOGY | ALL | ALL | MCQ | ✅ Session starts |
| 25 | CLEP_PRINCIPLES_OF_MARKETING | ALL | ALL | MCQ | ✅ Session starts |
| 26 | CLEP_PRINCIPLES_OF_MANAGEMENT | ALL | ALL | MCQ | ✅ Session starts |
| 27 | CLEP_INTRODUCTORY_SOCIOLOGY | ALL | ALL | MCQ | ✅ Session starts |
| 28 | CLEP_AMERICAN_GOVERNMENT | ALL | ALL | MCQ | ✅ Session starts |
| 29 | CLEP_MACROECONOMICS | ALL | ALL | MCQ | ✅ Session starts |
| 30 | CLEP_MICROECONOMICS | ALL | ALL | MCQ | ✅ Session starts |
| 31 | CLEP_BIOLOGY | ALL | ALL | MCQ | ✅ Session starts |
| 32 | CLEP_US_HISTORY_1 | ALL | ALL | MCQ | ✅ Session starts |
| 33 | CLEP_US_HISTORY_2 | ALL | ALL | MCQ | ✅ Session starts |
| 34 | CLEP_HUMAN_GROWTH_DEV | ALL | ALL | MCQ | ✅ Session starts |
| 35 | CLEP_CALCULUS | ALL | ALL | MCQ | ✅ Session starts |
| 36 | CLEP_CHEMISTRY | ALL | ALL | MCQ | ✅ Session starts |
| 37 | CLEP_FINANCIAL_ACCOUNTING | ALL | ALL | MCQ | ✅ Session starts |
| 38 | CLEP_AMERICAN_LITERATURE | ALL | ALL | MCQ | ✅ Session starts |
| 39 | CLEP_ANALYZING_INTERPRETING_LIT | ALL | ALL | MCQ | ✅ Session starts |
| 40 | CLEP_COLLEGE_COMP_MODULAR | ALL | ALL | MCQ | ✅ Session starts |
| 41 | CLEP_ENGLISH_LITERATURE | ALL | ALL | MCQ | ✅ Session starts |
| 42 | CLEP_HUMANITIES | ALL | ALL | MCQ | ✅ Session starts |
| 43 | CLEP_EDUCATIONAL_PSYCHOLOGY | ALL | ALL | MCQ | ✅ Session starts |
| 44 | CLEP_SOCIAL_SCIENCES_HISTORY | ALL | ALL | MCQ | ✅ Session starts |
| 45 | CLEP_WESTERN_CIV_1 | ALL | ALL | MCQ | ✅ Session starts |
| 46 | CLEP_WESTERN_CIV_2 | ALL | ALL | MCQ | ✅ Session starts |
| 47 | CLEP_COLLEGE_MATH | ALL | ALL | MCQ | ✅ Session starts |
| 48 | CLEP_NATURAL_SCIENCES | ALL | ALL | MCQ | ✅ Session starts |
| 49 | CLEP_PRECALCULUS | ALL | ALL | MCQ | ✅ Session starts |
| 50 | CLEP_INFORMATION_SYSTEMS | ALL | ALL | MCQ | ✅ Session starts |
| 51 | CLEP_BUSINESS_LAW | ALL | ALL | MCQ | ✅ Session starts |
| 52 | CLEP_FRENCH | ALL | ALL | MCQ | ✅ Session starts |
| 53 | CLEP_GERMAN | ALL | ALL | MCQ | ✅ Session starts |
| 54 | CLEP_SPANISH | ALL | ALL | MCQ | ✅ Session starts |
| 55 | CLEP_SPANISH_WRITING | ALL | ALL | MCQ | ✅ Session starts |
| 56 | DSST_PRINCIPLES_OF_SUPERVISION | ALL | ALL | MCQ | ✅ Session starts |
| 57 | DSST_HUMAN_RESOURCE_MANAGEMENT | ALL | ALL | MCQ | ✅ Session starts |
| 58 | DSST_ORGANIZATIONAL_BEHAVIOR | ALL | ALL | MCQ | ✅ Session starts |
| 59 | DSST_PERSONAL_FINANCE | ALL | ALL | MCQ | ✅ Session starts |
| 60 | DSST_LIFESPAN_DEV_PSYCHOLOGY | ALL | ALL | MCQ | ✅ Session starts |
| 61 | DSST_INTRO_TO_BUSINESS | ALL | ALL | MCQ | ✅ Session starts |
| 62 | DSST_HUMAN_DEVELOPMENT | ALL | ALL | MCQ | ✅ Session starts |
| 63 | DSST_ETHICS_IN_AMERICA | ALL | ALL | MCQ | ✅ Session starts |
| 64 | DSST_ENVIRONMENTAL_SCIENCE | ALL | ALL | MCQ | ✅ Session starts |
| 65 | DSST_TECHNICAL_WRITING | ALL | ALL | MCQ | ✅ Session starts |
| 66 | DSST_PRINCIPLES_OF_FINANCE | ALL | ALL | MCQ | ✅ Session starts |
| 67 | DSST_MANAGEMENT_INFO_SYSTEMS | ALL | ALL | MCQ | ✅ Session starts |
| 68 | DSST_MONEY_AND_BANKING | ALL | ALL | MCQ | ✅ Session starts |
| 69 | DSST_SUBSTANCE_ABUSE | ALL | ALL | MCQ | ✅ Session starts |
| 70 | DSST_CRIMINAL_JUSTICE | ALL | ALL | MCQ | ✅ Session starts |
| 71 | DSST_FUNDAMENTALS_OF_COUNSELING | ALL | ALL | MCQ | ✅ Session starts |
| 72 | DSST_GENERAL_ANTHROPOLOGY | ALL | ALL | MCQ | ✅ Session starts |
| 73 | DSST_WORLD_RELIGIONS | ALL | ALL | MCQ | ✅ Session starts |
| 74 | DSST_ART_WESTERN_WORLD | ALL | ALL | MCQ | ✅ Session starts |
| 75 | DSST_ASTRONOMY | ALL | ALL | MCQ | ✅ Session starts |
| 76 | DSST_COMPUTING_AND_IT | ALL | ALL | MCQ | ✅ Session starts |
| 77 | DSST_CIVIL_WAR | ALL | ALL | MCQ | ✅ Session starts |

> **Note for CLEP tests:** Requires admin toggle `clep_enabled = "true"` at `/admin/manage?tab=config`. CLEP courses are MCQ-only (no FRQ/SAQ/DBQ).

> **Note for DSST tests:** Requires admin toggle `dsst_enabled = "true"` at `/admin/manage?tab=config`. DSST courses are MCQ-only.

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
| CLEP_COLLEGE_ALGEBRA *(clep_enabled=true)* | |
| CLEP_COLLEGE_COMPOSITION | |
| CLEP_INTRO_PSYCHOLOGY | |
| CLEP_PRINCIPLES_OF_MARKETING | |
| CLEP_PRINCIPLES_OF_MANAGEMENT | |
| CLEP_INTRODUCTORY_SOCIOLOGY | |
| CLEP_AMERICAN_GOVERNMENT | |
| CLEP_MACROECONOMICS | |
| CLEP_MICROECONOMICS | |
| CLEP_BIOLOGY | |
| CLEP_US_HISTORY_1 | |
| CLEP_US_HISTORY_2 | |
| CLEP_HUMAN_GROWTH_DEV | |
| CLEP_CALCULUS | |
| CLEP_CHEMISTRY | |
| CLEP_FINANCIAL_ACCOUNTING | |
| CLEP_AMERICAN_LITERATURE | |
| CLEP_ANALYZING_INTERPRETING_LIT | |
| CLEP_COLLEGE_COMP_MODULAR | |
| CLEP_ENGLISH_LITERATURE | |
| CLEP_HUMANITIES | |
| CLEP_EDUCATIONAL_PSYCHOLOGY | |
| CLEP_SOCIAL_SCIENCES_HISTORY | |
| CLEP_WESTERN_CIV_1 | |
| CLEP_WESTERN_CIV_2 | |
| CLEP_COLLEGE_MATH | |
| CLEP_NATURAL_SCIENCES | |
| CLEP_PRECALCULUS | |
| CLEP_INFORMATION_SYSTEMS | |
| CLEP_BUSINESS_LAW | |
| CLEP_FRENCH | |
| CLEP_GERMAN | |
| CLEP_SPANISH | |
| CLEP_SPANISH_WRITING | |

---

## SECTION 8B — CLEP-Specific Tests (Beta 1.15)

> **Prerequisite:** Set `clep_enabled = "true"` in Admin → `/admin/manage?tab=config` before running these tests.

### TC-CLEP-01: Feature Flag Toggle — CLEP Sidebar Group
1. Log in → go to `/dashboard`
2. Set `clep_enabled = "false"` (admin config)
3. Reload sidebar
**Expected:** "CLEP Prep" tab/group is NOT visible in the sidebar

4. Set `clep_enabled = "true"` (admin config)
5. Reload sidebar
**Expected:** "CLEP Prep" tab/group IS visible with 34 CLEP courses in emerald accent color

### TC-CLEP-02: Landing Page CLEP Section
1. Visit `/` (landing page) while NOT logged in
**Expected:**
- CLEP section visible below AP/SAT/ACT curriculum section
- Emerald/teal color scheme (distinct from indigo AP section)
- 34 CLEP exam cards displayed with savings callout (e.g. "Saves ~$1,200")
- CLEP® trademark disclaimer visible at bottom of section
- "Start CLEP Prep Free" CTA links to `/register?track=clep` (Beta 2.0: has track param)
- "Start AP/SAT/ACT Prep" hero CTA links to `/register?track=ap` (Beta 2.0: has track param)
- Course count badge shows "50 courses" (16 AP/SAT/ACT + 34 CLEP)

### TC-CLEP-03: CLEP College Algebra — Full Practice Flow
1. Enable `clep_enabled = "true"`
2. Go to sidebar → select "CLEP Prep" group → select "CLEP College Algebra"
3. Go to `/practice` → All Units, All Difficulty, MCQ, 5 questions
4. Start session
**Expected:**
- Session starts within 30s
- Questions are algebra-focused (functions, equations, inequalities)
- MCQ with 4 options (A/B/C/D)
- Correct answer → green feedback + Sage prompt available
- Wrong answer → red feedback + knowledge check mini-quiz appears
- Session completes → summary screen

### TC-CLEP-04: CLEP College Composition — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_COLLEGE_COMPOSITION.
**Expected:** Questions focus on grammar, rhetoric, essay structure — writing skills.

### TC-CLEP-05: CLEP Intro Psychology — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_INTRO_PSYCHOLOGY.
**Expected:** Questions cover biological bases of behavior, learning, memory, social psychology.

### TC-CLEP-06: CLEP Principles of Marketing — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_PRINCIPLES_OF_MARKETING.
**Expected:** Questions cover marketing fundamentals, consumer behavior, market research.

### TC-CLEP-07: CLEP Principles of Management — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_PRINCIPLES_OF_MANAGEMENT.
**Expected:** Questions cover planning, organizing, leading, controlling (POLC framework).

### TC-CLEP-08: CLEP Introductory Sociology — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_INTRODUCTORY_SOCIOLOGY.
**Expected:** Questions cover sociological perspective, culture, social stratification.

### TC-CLEP-08a: CLEP American Government — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_AMERICAN_GOVERNMENT.
**Expected:** Questions cover institutions, political parties, civil liberties, public policy.

### TC-CLEP-08b: CLEP Macroeconomics — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_MACROECONOMICS.
**Expected:** Questions cover GDP, inflation, unemployment, fiscal/monetary policy, international trade.

### TC-CLEP-08c: CLEP Microeconomics — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_MICROECONOMICS.
**Expected:** Questions cover supply/demand, elasticity, market structures, factor markets.

### TC-CLEP-08d: CLEP Biology — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_BIOLOGY.
**Expected:** Questions cover molecular/cellular biology, genetics, evolution, ecology, organismal biology.

### TC-CLEP-08e: CLEP US History I — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_US_HISTORY_1.
**Expected:** Questions cover colonization through Reconstruction (pre-1877).

### TC-CLEP-08f: CLEP US History II — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_US_HISTORY_2.
**Expected:** Questions cover Reconstruction through present (post-1877).

### TC-CLEP-08g: CLEP Human Growth and Development — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_HUMAN_GROWTH_DEV.
**Expected:** Questions cover lifespan development, cognitive development, social/personality development.

### TC-CLEP-08h: CLEP Calculus — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_CALCULUS.
**Expected:** Questions cover limits, derivatives, integrals, fundamental theorem of calculus.

### TC-CLEP-08i: CLEP Chemistry — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_CHEMISTRY.
**Expected:** Questions cover atomic structure, bonding, stoichiometry, thermodynamics, equilibrium.

### TC-CLEP-08j: CLEP Financial Accounting — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_FINANCIAL_ACCOUNTING.
**Expected:** Questions cover financial statements, journal entries, assets, liabilities, equity.

### TC-CLEP-08k: CLEP American Literature — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_AMERICAN_LITERATURE.
**Expected:** Questions cover colonial to contemporary American literary works, authors, movements.

### TC-CLEP-08l: CLEP Analyzing and Interpreting Literature — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_ANALYZING_INTERPRETING_LIT.
**Expected:** Questions cover literary analysis, poetry, prose, drama interpretation.

### TC-CLEP-08m: CLEP College Composition Modular — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_COLLEGE_COMP_MODULAR.
**Expected:** Questions cover rhetorical analysis, argumentation, research skills, conventions of writing.

### TC-CLEP-08n: CLEP English Literature — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_ENGLISH_LITERATURE.
**Expected:** Questions cover British literary works from medieval to contemporary periods.

### TC-CLEP-08o: CLEP Humanities — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_HUMANITIES.
**Expected:** Questions cover literature, art, music, philosophy, performing arts across cultures.

### TC-CLEP-08p: CLEP Educational Psychology — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_EDUCATIONAL_PSYCHOLOGY.
**Expected:** Questions cover learning theories, cognitive development, motivation, assessment, classroom management.

### TC-CLEP-08q: CLEP Social Sciences and History — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_SOCIAL_SCIENCES_HISTORY.
**Expected:** Questions cover history, political science, economics, sociology, anthropology, geography.

### TC-CLEP-08r: CLEP Western Civilization I — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_WESTERN_CIV_1.
**Expected:** Questions cover ancient Near East through 1648 (Renaissance, Reformation).

### TC-CLEP-08s: CLEP Western Civilization II — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_WESTERN_CIV_2.
**Expected:** Questions cover 1648 to present (Enlightenment, revolutions, modern era).

### TC-CLEP-08t: CLEP College Mathematics — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_COLLEGE_MATH.
**Expected:** Questions cover sets, logic, real number system, functions, probability, statistics.

### TC-CLEP-08u: CLEP Natural Sciences — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_NATURAL_SCIENCES.
**Expected:** Questions cover biological and physical sciences (biology, chemistry, physics, earth science).

### TC-CLEP-08v: CLEP Precalculus — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_PRECALCULUS.
**Expected:** Questions cover algebraic expressions, trigonometry, analytic geometry, functions.

### TC-CLEP-08w: CLEP Information Systems — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_INFORMATION_SYSTEMS.
**Expected:** Questions cover information systems concepts, hardware, software, databases, networking.

### TC-CLEP-08x: CLEP Business Law — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_BUSINESS_LAW.
**Expected:** Questions cover contracts, torts, agency, business organizations, legal environment.

### TC-CLEP-08y: CLEP French — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_FRENCH.
**Expected:** Questions cover French reading comprehension, grammar, vocabulary.

### TC-CLEP-08z: CLEP German — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_GERMAN.
**Expected:** Questions cover German reading comprehension, grammar, vocabulary.

### TC-CLEP-08aa: CLEP Spanish — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_SPANISH.
**Expected:** Questions cover Spanish reading comprehension, grammar, vocabulary.

### TC-CLEP-08ab: CLEP Spanish with Writing — Full Practice Flow
Same as TC-CLEP-03 but for CLEP_SPANISH_WRITING.
**Expected:** Questions cover Spanish reading, grammar, vocabulary, and writing skills.

### TC-CLEP-09: CLEP AI Generation (Empty Bank)
1. With `clep_enabled = "true"` and `ai_generation_enabled = "true"`
2. Start a CLEP session for any CLEP course (DB may be empty for CLEP)
**Expected:**
- AI generates CLEP-specific questions (not AP questions)
- Toast shows: "X AI question(s) generated and saved"
- Questions are relevant to CLEP content (not AP/SAT style)
- No 500 errors even if AI gen is slow

### TC-CLEP-10: CLEP Sage AI Tutor Context
1. Start CLEP College Algebra session → answer a question wrong
2. Click "Ask Sage" from the answer feedback
**Expected:**
- Sage's response uses CLEP-appropriate context (mentions "CLEP exam", "college credit")
- Explanation does not confuse CLEP with AP scoring
- Follow-up chips are relevant to algebra topics
- "Continue Practice" banner appears to return to session

### TC-CLEP-11: CLEP Sidebar Emerald Accent
1. Select any CLEP course from the sidebar
**Expected:**
- CLEP Prep tab in sidebar has emerald color highlight (not indigo like AP courses)
- Visual distinction clearly separates CLEP from AP/SAT/ACT courses

### TC-CLEP-12: CLEP Flag Off — Courses Not Accessible
1. Set `clep_enabled = "false"`
2. Try to manually navigate to `/practice` and select a CLEP course
**Expected:**
- CLEP courses not visible in sidebar course selector
- If course somehow selected via URL manipulation, practice engine still handles it (course exists in DB)
- No white screen or 500 error

### TC-CLEP-13: Pricing Page — Premium Includes CLEP
1. Visit `/pricing`
**Expected:**
- Premium tier feature list includes "All 34 CLEP exam courses (earn college credit)"
- Free tier shows "All 16 AP/SAT/ACT courses" (no CLEP on free tier)
- Billing toggle (Monthly/Annual) works — CLEP mention visible in both states

### TC-CLEP-14: About Page — CLEP Courses Listed
1. Visit `/about`
**Expected:**
- "What We Cover" section shows 50 courses total (16 AP/SAT/ACT + 34 CLEP)
- "CLEP (College Credit)" category visible with emerald text color
- All 34 CLEP exams listed in the grid
- CLEP® trademark disclaimer visible in footer section
- Version badge shows "Beta 2.0" (updated from 1.15)

### TC-CLEP-15: Exam Countdown Save — No False Error (Bug Fix Beta 1.15)
1. Log in → go to `/dashboard`
2. Click exam date setter → set any future date → click Save
**Expected:**
- "Saved ✓" checkmark appears and is visible for ~2 seconds
- Panel collapses after 2 seconds
- No error message shown even if Neon/Prisma is slow on first call
- After page refresh, the set date is correctly displayed

---

## SECTION 8C — Track-Based Segmentation Tests (Beta 2.0)

> **Feature:** `?track=ap` / `?track=clep` URL param → `localStorage["ap_track"]` → filters onboarding, sidebar, and course defaults.

### TC-TRACK-01: CLEP Track — Landing Page → Register
1. Visit `/` (logged out)
2. Click "Start CLEP Prep" hero button
**Expected:**
- Navigates to `/register?track=clep` (verify URL)
- `localStorage["ap_track"]` is set to `"clep"` on register page load
- CardDescription shows "Start earning college credit with CLEP — free" (not "AP exam journey")

### TC-TRACK-02: AP Track — Landing Page → Register
1. Visit `/`
2. Click "Start AP/SAT/ACT Prep" hero button
**Expected:**
- Navigates to `/register?track=ap`
- `localStorage["ap_track"]` is set to `"ap"`
- CardDescription shows "Start your AP exam journey today — free"

### TC-TRACK-03: CLEP Track — Onboarding Course List
**Prereq:** `clep_enabled = "true"` in admin config; `localStorage["ap_track"] = "clep"`
1. Register as new user with `?track=clep`
2. Complete registration → land on `/onboarding`
**Expected:**
- Step 1 shows **only 34 CLEP courses** (no AP/SAT/ACT courses visible)
- Course buttons use emerald accent (border-emerald-500) when selected
- Continue button is emerald-colored
- "Preparing for AP/SAT/ACT? Switch to AP/SAT/ACT prep →" link visible below grid
- Default selected course is CLEP College Algebra (first in CLEP list)

### TC-TRACK-04: AP Track — Onboarding Course List
**Prereq:** `localStorage["ap_track"] = "ap"` (or unset)
1. Register as new user with `?track=ap`
2. Complete registration → land on `/onboarding`
**Expected:**
- Step 1 shows **16 AP/SAT/ACT courses** in 3 groups: AP Courses, SAT Prep, ACT Prep
- No CLEP courses visible
- "Earning college credit? Switch to CLEP prep →" link visible (only if `clep_enabled=true`)
- Default selected course is AP World History

### TC-TRACK-05: Onboarding — Switch Track Link
**Prereq:** `clep_enabled = "true"`, currently on CLEP onboarding (track=clep)
1. Click "Switch to AP/SAT/ACT prep →" link in onboarding Step 1
**Expected:**
- Course grid immediately updates to show 16 AP/SAT/ACT courses
- `localStorage["ap_track"]` updated to `"ap"`
- Switch link now shows "Earning college credit? Switch to CLEP prep →"

### TC-TRACK-06: Sidebar — CLEP Track Shows Only CLEP Group
**Prereq:** `clep_enabled = "true"`, `localStorage["ap_track"] = "clep"`
1. Log in (existing CLEP-track user)
2. Open sidebar course switcher dropdown
**Expected:**
- Dropdown tabs show only "CLEP" (no AP, SAT, ACT tabs)
- 34 CLEP courses listed in the dropdown
- "Switch to AP/SAT/ACT prep →" text link visible below dropdown
- Emerald accent on active CLEP tab

### TC-TRACK-07: Sidebar — AP Track Shows Only AP/SAT/ACT Groups
**Prereq:** `localStorage["ap_track"] = "ap"` (or unset)
1. Open sidebar course switcher
**Expected:**
- Dropdown tabs: AP, SAT, ACT (no CLEP tab shown even if `clep_enabled=true`)
- AP courses visible by default
- "Switch to CLEP prep →" link visible (only if `clep_enabled=true`)

### TC-TRACK-08: Sidebar — Switch Track Link Works
1. On AP-track sidebar, click "Switch to CLEP prep →"
**Expected:**
- Dropdown immediately shows only CLEP tab and 34 CLEP courses
- Link changes to "Switch to AP/SAT/ACT prep →"
- `localStorage["ap_track"]` updated to `"clep"`

### TC-TRACK-09: Existing User — No Track Set (Backward Compatibility)
1. Log in with account that has no `ap_track` in localStorage (clear localStorage first)
2. Open sidebar
**Expected:**
- Sidebar shows AP/SAT/ACT groups (default behavior — unchanged from pre-Beta 2.0)
- No CLEP tab unless `clep_enabled=true` AND track was set to "clep"
- Zero visible change vs pre-2.0 behavior

### TC-TRACK-10: Default Course for CLEP Track (No Stored Course)
**Prereq:** Clear `localStorage["ap_selected_course"]`, set `localStorage["ap_track"] = "clep"`, reload
**Expected:**
- `useCourse()` hook defaults to `CLEP_COLLEGE_ALGEBRA` (not AP_WORLD_HISTORY)
- Practice page shows CLEP College Algebra as active course

### TC-TRACK-11: Default Course for AP Track (No Stored Course)
**Prereq:** Clear `localStorage["ap_selected_course"]`, set `localStorage["ap_track"] = "ap"`, reload
**Expected:**
- `useCourse()` hook defaults to `AP_WORLD_HISTORY`

### TC-TRACK-12: CLEP Flag Off — Track=clep Falls Back to AP View
**Prereq:** `clep_enabled = "false"` in admin config; `localStorage["ap_track"] = "clep"`
1. Log in and open sidebar
**Expected:**
- Sidebar shows AP/SAT/ACT groups (CLEP flag off overrides track)
- Onboarding shows AP/SAT/ACT courses (CLEP unavailable)
- No broken states or empty dropdowns

### TC-TRACK-13: Audience Split Cards — Correct Track Params
1. Visit `/` landing page
2. Inspect HTML for "Audience Split Cards" section
**Expected:**
- "Start AP/SAT/ACT prep" link href = `/register?track=ap`
- "Start CLEP prep" link href = `/register?track=clep`
- Curriculum Coverage section "Start Learning Free" href = `/register?track=ap`
- Final CTA AP button href = `/register?track=ap`
- Final CTA CLEP button href = `/register?track=clep`

### TC-TRACK-14: Sidebar Dropdown — No Empty State After Track Switch
1. User is on AP track; dropdown shows AP tab active
2. Click "Switch to CLEP prep →" in sidebar
**Expected:**
- Dropdown immediately shows CLEP tab active with 34 CLEP courses
- NO state where dropdown is open but empty (previously: activeGroup="AP Courses" but COURSE_GROUPS=[CLEP_GROUP] → no courses shown)
- This is the Bug Fix from Beta 2.0 gap analysis

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
- TC-CLEP-01 (feature flag toggle)
- TC-CLEP-02 (landing page CLEP section + correct `?track=` params — Beta 2.0)
- TC-CLEP-15 (exam countdown save bug fix)
- TC-TRACK-01, TC-TRACK-02 (landing page → register with track params — Beta 2.0)
- TC-TRACK-03, TC-TRACK-04 (onboarding filtered by track — Beta 2.0)
- TC-TRACK-06, TC-TRACK-07 (sidebar filtered by track — Beta 2.0)
- TC-TRACK-09 (existing users — zero regression — Beta 2.0)
- TC-TRACK-14 (no empty dropdown on track switch — Bug Fix Beta 2.0)

**P1 (should pass):**
- All Section 1 smoke tests (including CLEP rows 22-27 with clep_enabled=true)
- TC-PERF-01, TC-PERF-02, TC-PERF-03
- TC-ERROR-01 through TC-ERROR-03
- TC-REG-01 through TC-REG-04
- TC-CLEP-03 through TC-CLEP-11 (CLEP practice flows + AI context)
- TC-CLEP-13, TC-CLEP-14 (pricing + about page — verify Beta 2.0 badge)
- TC-TRACK-05, TC-TRACK-08 (switch track in onboarding + sidebar)
- TC-TRACK-10, TC-TRACK-11 (default course by track)
- TC-TRACK-13 (all track param hrefs on landing page)

**P2 (nice to have):**
- Full Section 3 (FRQ flows)
- Full Section 7 (premium restriction flows)
- Full Section 8 per-course matrix (including 34 CLEP courses)
- TC-CLEP-12 (flag-off course access guard)
- TC-TRACK-12 (CLEP flag off + CLEP track fallback)

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


---

## Release Log — v1.14.0 (2026-03-20)

**Deployed:** Fri, 20 Mar 2026 19:17:31 GMT
**Version:** 1.14.0

### Changes in this release
- fix: update AI provider models — Gemini 2.0, OpenRouter free tier, Together key name
- chore: release archive beta-1.14 — update test plan log
- feat: Beta 1.14 — version bump, About page update, targeted seeding scripts
- fix: replace 112 parallel count queries with single groupBy in practice-check endpoint
- fix: auto-load .env in integration tests + add CRON_SECRET to .env.example
- feat: comprehensive release pipeline — integration tests, PWA checks, beta version gate
- fix: replace AbortSignal.timeout with unref'd timer to prevent Windows libuv crash on pipeline exit
- chore: full release pipeline — smoke tests, auto test-plan update, archive
- feat: Sage practice integration — session restore + return banner + richer context
- perf: quickMode for on-demand AI gen + count=1 knowledge check + comprehensive test plan

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

**Deployed:** Fri, 20 Mar 2026 19:41:22 GMT
**Version:** 1.14.0

### Changes in this release
- fix: update AI provider models — Gemini 2.0, OpenRouter free tier, Together key name
- chore: release archive beta-1.14 — update test plan log
- feat: Beta 1.14 — version bump, About page update, targeted seeding scripts
- fix: replace 112 parallel count queries with single groupBy in practice-check endpoint
- fix: auto-load .env in integration tests + add CRON_SECRET to .env.example
- feat: comprehensive release pipeline — integration tests, PWA checks, beta version gate
- fix: replace AbortSignal.timeout with unref'd timer to prevent Windows libuv crash on pipeline exit
- chore: full release pipeline — smoke tests, auto test-plan update, archive
- feat: Sage practice integration — session restore + return banner + richer context
- perf: quickMode for on-demand AI gen + count=1 knowledge check + comprehensive test plan

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
  Total questions: 446 | Courses: 12 green, 0 yellow, 4 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 64 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 51 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 14 MCQ questions
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

**Deployed:** Fri, 20 Mar 2026 19:50:20 GMT
**Version:** 1.14.0

### Changes in this release
- fix: update HuggingFace to new Inference Providers API
- fix: update AI provider models — Gemini 2.0, OpenRouter free tier, Together key name
- chore: release archive beta-1.14 — update test plan log
- feat: Beta 1.14 — version bump, About page update, targeted seeding scripts
- fix: replace 112 parallel count queries with single groupBy in practice-check endpoint
- fix: auto-load .env in integration tests + add CRON_SECRET to .env.example
- feat: comprehensive release pipeline — integration tests, PWA checks, beta version gate
- fix: replace AbortSignal.timeout with unref'd timer to prevent Windows libuv crash on pipeline exit
- chore: full release pipeline — smoke tests, auto test-plan update, archive
- feat: Sage practice integration — session restore + return banner + richer context

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
Integration tests: 18 passed, 9 warnings, 0 failed
  Total questions: 455 | Courses: 13 green, 0 yellow, 3 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 64 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 51 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 6 MCQ questions
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

**Deployed:** Fri, 20 Mar 2026 19:58:14 GMT
**Version:** 1.14.0

### Changes in this release
- fix: HuggingFace correct endpoint — featherless-ai provider
- fix: update HuggingFace to new Inference Providers API
- fix: update AI provider models — Gemini 2.0, OpenRouter free tier, Together key name
- chore: release archive beta-1.14 — update test plan log
- feat: Beta 1.14 — version bump, About page update, targeted seeding scripts
- fix: replace 112 parallel count queries with single groupBy in practice-check endpoint
- fix: auto-load .env in integration tests + add CRON_SECRET to .env.example
- feat: comprehensive release pipeline — integration tests, PWA checks, beta version gate
- fix: replace AbortSignal.timeout with unref'd timer to prevent Windows libuv crash on pipeline exit
- chore: full release pipeline — smoke tests, auto test-plan update, archive

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
Integration tests: 18 passed, 9 warnings, 0 failed
  Total questions: 466 | Courses: 13 green, 0 yellow, 3 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 64 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 51 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 17 MCQ questions
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

## Release Log — v1.15.0 (2026-03-21)

**Deployed:** Sat, 21 Mar 2026 02:41:29 GMT
**Version:** 1.15.0

### Changes in this release
- feat: Beta 1.15 — CLEP course support, exam countdown fix, phase 2 backlog
- fix: HuggingFace correct endpoint — featherless-ai provider
- fix: update HuggingFace to new Inference Providers API
- fix: update AI provider models — Gemini 2.0, OpenRouter free tier, Together key name
- chore: release archive beta-1.14 — update test plan log
- feat: Beta 1.14 — version bump, About page update, targeted seeding scripts
- fix: replace 112 parallel count queries with single groupBy in practice-check endpoint
- fix: auto-load .env in integration tests + add CRON_SECRET to .env.example
- feat: comprehensive release pipeline — integration tests, PWA checks, beta version gate
- fix: replace AbortSignal.timeout with unref'd timer to prevent Windows libuv crash on pipeline exit

### Automated smoke tests
```
Smoke tests: 11 passed, 0 warnings, 1 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ❌ GET /api/ai/status — This operation was aborted
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


**Beta 2.0 — Track Segmentation (P0):**
- [ ] Landing page "Start AP/SAT/ACT Prep" → `/register?track=ap` (verify URL)
- [ ] Landing page "Start CLEP Prep" → `/register?track=clep` (verify URL)
- [ ] Register page: arrive via `?track=clep` → CardDescription shows CLEP text
- [ ] Register page: arrive via `?track=ap` → CardDescription shows AP text
- [ ] Onboarding with `track=clep` + `clep_enabled=true` → only 34 CLEP courses shown
- [ ] Onboarding with `track=ap` → 16 AP/SAT/ACT courses, no CLEP
- [ ] Sidebar with `track=clep` → only CLEP tab; sidebar with `track=ap` → only AP/SAT/ACT tabs
- [x] Sidebar "Change track" button REMOVED (Beta 2.1 — track is DB-enforced, no client toggle)
- [ ] Existing user (track="ap" in DB by default) → identical experience to pre-2.0 release

---

## Release Log — v2.0.0 (2026-03-20)

**Version:** 2.0.0

### Changes in this release
- feat: Beta 2.0 — Phase 1.1 track-based segmentation (AP/SAT/ACT vs CLEP)
- feat: all landing page register CTAs carry `?track=ap` or `?track=clep`
- feat: register page reads `?track`, persists to localStorage, shows track-aware description
- feat: onboarding filters course list by track; auto-selects first; switch-track link
- feat: sidebar course groups filtered by track; switch-track escape hatch link
- feat: use-course.ts defaults to CLEP_COLLEGE_ALGEBRA for CLEP-track new users
- fix: sidebar localStorage in useState initializer (SSR-safe fix -> moved to useEffect)
- fix: sidebar activeGroup stale after track switch caused empty dropdown

### Gaps identified & fixed in Beta 2.0 cycle
| ID | Severity | Component | Description | Fix |
|----|----------|-----------|-------------|-----|
| B2-01 | High | sidebar.tsx | localStorage in useState initializer throws on SSR | Moved to useEffect |
| B2-02 | High | sidebar.tsx | activeGroup not reset on track switch -> empty dropdown | Added useEffect resetting on effectiveTrack change |
| B2-03 | Low | register/page.tsx | CardDescription always said "AP exam journey" regardless of track | Dynamic description via isClepTrack state |

---

## SECTION 9 — Track Enforcement (DB-backed, Beta 2.1)

Track is now stored in the `User.track` column (default `"ap"`). Server-side 403 guards
prevent cross-track API calls. The client-side "Change track" button is removed.

### TC-TRACK-01: Track persisted to DB on credential registration

**Setup:** Navigate to `/register?track=clep`
**Steps:**
1. Complete registration form and submit
2. After account creation, query DB: `SELECT track FROM "users" WHERE email='...'`

**Expected:**
- `track = "clep"` in DB row
- No `localStorage["ap_track"]` write by register page (dev tools application tab)

---

### TC-TRACK-02: Track persisted to DB on registration with `?track=ap`

**Setup:** Navigate to `/register?track=ap`
**Steps:**
1. Complete registration and submit
2. Query DB for track value

**Expected:** `track = "ap"` in DB row

---

### TC-TRACK-03: Default track for users with no `?track` param

**Setup:** Navigate to `/register` (no query param)
**Steps:**
1. Complete and submit registration
2. Query DB

**Expected:** `track = "ap"` (safe default)

---

### TC-TRACK-04: AP user blocked from CLEP course in `/api/practice`

**Setup:** Logged-in AP-track user (track="ap" in DB)
**Steps:**
1. Open DevTools → Network
2. POST `/api/practice` with body `{ "sessionType":"QUICK_PRACTICE", "course":"CLEP_COLLEGE_ALGEBRA", "questionCount":5 }`

**Expected:**
- HTTP `403 Forbidden`
- Body: `{ "error": "This course is not available on your current track." }`
- No practice session created in DB

---

### TC-TRACK-05: AP user blocked from CLEP course in `/api/diagnostic`

**Setup:** Logged-in AP-track user
**Steps:**
1. POST `/api/diagnostic` with body `{ "course":"CLEP_INTRO_PSYCHOLOGY" }`

**Expected:**
- HTTP `403 Forbidden`
- Body: `{ "error": "This course is not available on your current track." }`

---

### TC-TRACK-06: CLEP user blocked from AP course in `/api/practice`

**Setup:** Logged-in CLEP-track user (track="clep" in DB, clep_enabled=true)
**Steps:**
1. POST `/api/practice` with body `{ "sessionType":"QUICK_PRACTICE", "course":"AP_WORLD_HISTORY", "questionCount":5 }`

**Expected:**
- HTTP `403 Forbidden`
- Body: `{ "error": "This course is not available on your current track." }`

---

### TC-TRACK-07: CLEP user blocked from AP course in `/api/diagnostic`

**Setup:** Logged-in CLEP-track user
**Steps:**
1. POST `/api/diagnostic` with body `{ "course":"AP_US_HISTORY" }`

**Expected:** `403` with track mismatch error

---

### TC-TRACK-08: AP user can still use AP courses normally after enforcement added

**Setup:** Existing AP-track user
**Steps:**
1. POST `/api/practice` with `"course":"AP_WORLD_HISTORY"` (valid for ap track)

**Expected:**
- Session created normally (200 or 201)
- No 403 error

---

### TC-TRACK-09: CLEP user can use CLEP courses normally

**Setup:** CLEP-track user, `clep_enabled=true`
**Steps:**
1. POST `/api/practice` with `"course":"CLEP_COLLEGE_ALGEBRA"`

**Expected:**
- Session created normally
- No 403 error

---

### TC-TRACK-10: Sidebar reads track from DB — no "Change track" button

**Setup:** CLEP-track user logs in
**Steps:**
1. Open `/practice` (sidebar visible)
2. Inspect sidebar footer area

**Expected:**
- Sidebar shows only CLEP courses in course switcher
- "CLEP Prep track" badge visible under switcher
- **No "Change track" button** present anywhere in sidebar
- Theme toggle and Sign Out buttons are the only footer controls

---

### TC-TRACK-11: Sidebar reads track from DB — AP user after previous localStorage CLEP entry

**Setup:** User has `localStorage["ap_track"] = "clep"` in browser but DB `track = "ap"`
**Steps:**
1. Log in as AP-track user
2. Open sidebar

**Expected:**
- Sidebar shows AP/SAT/ACT course groups (DB wins over stale localStorage)
- No CLEP courses visible

---

### TC-TRACK-12: Onboarding reads track from DB

**Setup:** Fresh CLEP-track user (track="clep" in DB, clep_enabled=true), localStorage cleared
**Steps:**
1. Log in and reach onboarding step 1

**Expected:**
- Course list shows only 34 CLEP courses
- No AP/SAT/ACT courses in step 1 list
- No localStorage dependency for track (DevTools → Application → Local Storage — no `ap_track` key)

---

### TC-TRACK-13: JWT contains track field

**Setup:** Any user login
**Steps:**
1. Log in, decode session JWT (or check `/api/user` response)

**Expected:**
- Session JWT `track` field matches DB `User.track` value
- `/api/user` response includes `user.track`

---

### TC-TRACK-14: Existing users (pre-Beta 2.1) unaffected

**Setup:** Any account created before Beta 2.1 (no `track` column value set explicitly)
**Steps:**
1. Log in, verify sidebar
2. Try practice with an AP course

**Expected:**
- DB `track = "ap"` (default migration value)
- Full AP/SAT/ACT course access unchanged
- No 403 errors on any previously-working course


---

## Release Log — v2.0.0 (2026-03-21)

**Deployed:** Sat, 21 Mar 2026 04:26:33 GMT
**Version:** 2.0.0

### Changes in this release
- fix: Beta 2.0 post-release — track segmentation UX fixes
- feat: Beta 2.0 — track-based segmentation (AP/SAT/ACT vs CLEP)
- chore: release archive beta-1.15 — update test plan log
- feat: Beta 1.15 — CLEP course support, exam countdown fix, phase 2 backlog
- fix: HuggingFace correct endpoint — featherless-ai provider
- fix: update HuggingFace to new Inference Providers API
- fix: update AI provider models — Gemini 2.0, OpenRouter free tier, Together key name
- chore: release archive beta-1.14 — update test plan log
- feat: Beta 1.14 — version bump, About page update, targeted seeding scripts
- fix: replace 112 parallel count queries with single groupBy in practice-check endpoint

### Automated smoke tests
```
Smoke tests: 11 passed, 0 warnings, 1 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ❌ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Integration tests (practice coverage — all 16 courses)
```
Integration tests: 21 passed, 12 warnings, 0 failed
  Total questions: 509 | Courses: 15 green, 0 yellow, 7 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 64 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 23 MCQ questions
  ⚠️ AP_US_HISTORY — 0 questions — AI will generate on first session
  ⚠️ AP_PSYCHOLOGY — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 24 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 8 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ⚠️ AP Biology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP US History FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.0.0 (2026-03-21)

**Deployed:** Sat, 21 Mar 2026 04:41:07 GMT
**Version:** 2.0.0

### Changes in this release
- feat: Beta 2.1 — track enforcement: DB-backed track, server-side 403 guards, remove client toggle
- fix: Beta 2.0 post-release — track segmentation UX fixes
- feat: Beta 2.0 — track-based segmentation (AP/SAT/ACT vs CLEP)
- chore: release archive beta-1.15 — update test plan log
- feat: Beta 1.15 — CLEP course support, exam countdown fix, phase 2 backlog
- fix: HuggingFace correct endpoint — featherless-ai provider
- fix: update HuggingFace to new Inference Providers API
- fix: update AI provider models — Gemini 2.0, OpenRouter free tier, Together key name
- chore: release archive beta-1.14 — update test plan log
- feat: Beta 1.14 — version bump, About page update, targeted seeding scripts

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
Integration tests: 21 passed, 12 warnings, 0 failed
  Total questions: 509 | Courses: 15 green, 0 yellow, 7 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 64 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 23 MCQ questions
  ⚠️ AP_US_HISTORY — 0 questions — AI will generate on first session
  ⚠️ AP_PSYCHOLOGY — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 24 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 8 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ⚠️ AP Biology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP US History FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.0.0 (2026-03-21)

**Deployed:** Sat, 21 Mar 2026 04:51:19 GMT
**Version:** 2.0.0

### Changes in this release
- fix: track display bugs — CLEP users see AP courses, AP users see CLEP default
- feat: Beta 2.1 — track enforcement: DB-backed track, server-side 403 guards, remove client toggle
- fix: Beta 2.0 post-release — track segmentation UX fixes
- feat: Beta 2.0 — track-based segmentation (AP/SAT/ACT vs CLEP)
- chore: release archive beta-1.15 — update test plan log
- feat: Beta 1.15 — CLEP course support, exam countdown fix, phase 2 backlog
- fix: HuggingFace correct endpoint — featherless-ai provider
- fix: update HuggingFace to new Inference Providers API
- fix: update AI provider models — Gemini 2.0, OpenRouter free tier, Together key name
- chore: release archive beta-1.14 — update test plan log

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
Integration tests: 21 passed, 12 warnings, 0 failed
  Total questions: 509 | Courses: 15 green, 0 yellow, 7 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 64 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 23 MCQ questions
  ⚠️ AP_US_HISTORY — 0 questions — AI will generate on first session
  ⚠️ AP_PSYCHOLOGY — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 24 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 8 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ⚠️ AP Biology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP US History FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## SECTION 10 -- Track-Based Course Visibility (Beta 2.1)

These tests cover the full user journey from landing page to course selection across all UI surfaces.

### Entry Path A: AP/SAT/ACT user

#### TC-VIS-01: All AP landing page CTAs use ?track=ap
Check: Hero, navbar, audience card, curriculum section, and footer "Sign Up Free" link to /register?track=ap.
Result: [ ] Pass / [ ] Fail

#### TC-VIS-02: Register shows AP wording with ?track=ap
Expected: CardDescription reads the AP journey copy.
Result: [ ] Pass / [ ] Fail

#### TC-VIS-03: AP user track stored in DB
GET /api/user after ?track=ap registration. Expected: user.track = ap.
Result: [ ] Pass / [ ] Fail

#### TC-VIS-04: Onboarding - AP sees only AP/SAT/ACT course groups
Expected: 3 groups (AP 10, SAT 2, ACT 4). No CLEP group or courses visible.
Result: [ ] Pass / [ ] Fail

#### TC-VIS-05 through TC-VIS-10: Sidebar + all CourseSelectorInline pages (AP user)
For each: Sidebar, /practice, /mock-exam, /analytics, /study-plan, /resources
Expected: Only AP/SAT/ACT courses (16 total). No CLEP_* courses. Indigo accent.
Result: [ ] Pass / [ ] Fail (each page)

#### TC-VIS-11: AP practice with AP course - succeeds (200 OK)
Result: [ ] Pass / [ ] Fail

#### TC-VIS-12: AP practice with CLEP course - blocked (403)
POST /api/practice { course: CLEP_COLLEGE_ALGEBRA }. Expected: HTTP 403.
Result: [ ] Pass / [ ] Fail

#### TC-VIS-13: AP user default course is AP_WORLD_HISTORY
Fresh login, clear localStorage. Expected: AP_WORLD_HISTORY as default, never CLEP_*.
Result: [ ] Pass / [ ] Fail

---

### Entry Path B: CLEP user

#### TC-VIS-14: All CLEP landing page CTAs use ?track=clep
Check: Hero, CLEP section CTA, and final CTA all link to /register?track=clep.
Result: [ ] Pass / [ ] Fail

#### TC-VIS-15: Register shows CLEP wording with ?track=clep
Expected: CardDescription reads the CLEP college credit copy.
Result: [ ] Pass / [ ] Fail

#### TC-VIS-16: CLEP user track stored in DB
GET /api/user after ?track=clep registration. Expected: user.track = clep.
Result: [ ] Pass / [ ] Fail

#### TC-VIS-17: Onboarding - CLEP sees only 34 CLEP courses
Expected: Only CLEP Prep group with 6 courses. No AP/SAT/ACT groups or courses.
Result: [ ] Pass / [ ] Fail

#### TC-VIS-18: Sidebar - CLEP courses visible immediately (no AP flash)
Expected: CLEP courses from JWT, no AP flash. CLEP Prep track badge visible.
Result: [ ] Pass / [ ] Fail

#### TC-VIS-19 through TC-VIS-24: Sidebar + all CourseSelectorInline pages (CLEP user)
For each: Sidebar, /practice, /mock-exam, /analytics, /study-plan, /resources
Expected: Only CLEP courses (6 total). No AP_*, SAT_*, ACT_* courses. Emerald accent.
Result: [ ] Pass / [ ] Fail (each page)

#### TC-VIS-25: CLEP practice with CLEP course - succeeds (200 OK)
Result: [ ] Pass / [ ] Fail

#### TC-VIS-26: CLEP practice with AP course - blocked (403)
POST /api/practice { course: AP_WORLD_HISTORY }. Expected: HTTP 403.
Result: [ ] Pass / [ ] Fail

#### TC-VIS-27: CLEP user default course is CLEP_COLLEGE_ALGEBRA
Fresh login, clear localStorage. Expected: CLEP_COLLEGE_ALGEBRA as default, never AP/SAT/ACT.
Result: [ ] Pass / [ ] Fail

#### TC-VIS-28: Stale AP course in localStorage resets for CLEP user
Set localStorage[ap_selected_course] = AP_WORLD_HISTORY. Reload as CLEP user.
Expected: Course resets to CLEP_COLLEGE_ALGEBRA. No AP course shown.
Result: [ ] Pass / [ ] Fail

---

### Entry Path C: Persistence

#### TC-VIS-29: AP track persists across logout/login
Expected: Track = ap after re-login.
Result: [ ] Pass / [ ] Fail

#### TC-VIS-30: CLEP track persists across logout/login
Expected: Track = clep after re-login. CLEP badge visible.
Result: [ ] Pass / [ ] Fail

#### TC-VIS-31: JWT contains correct track - sidebar initializes without /api/user wait
Inspect /api/auth/session as CLEP user. Expected: session.user.track = clep.
Result: [ ] Pass / [ ] Fail

#### TC-VIS-32: Two simultaneous users - no cross-contamination
Browser A: AP user. Browser B: CLEP user. Expected: no cross-contamination.
Result: [ ] Pass / [ ] Fail

---

### Entry Path D: Google OAuth

#### TC-VIS-33: Google OAuth defaults to AP track
Expected: user.track = ap. Sidebar shows AP/SAT/ACT courses.
Result: [ ] Pass / [ ] Fail

---

### Regression

#### TC-VIS-34: AP user sees ZERO CLEP courses on any page
Visit all pages. Expected: No CLEP_* in any dropdown anywhere.
Result: [ ] Pass / [ ] Fail

#### TC-VIS-35: CLEP user sees ZERO AP/SAT/ACT courses on any page
Visit all pages. Expected: No AP_*, SAT_*, ACT_* in any dropdown anywhere.
Result: [ ] Pass / [ ] Fail

---

**Section 10 Summary:** 35 test cases (TC-VIS-01 to TC-VIS-35)
Coverage: Landing CTAs, Registration, Onboarding, Sidebar, Practice, Mock Exam, Analytics, Study Plan, Resources, API enforcement, Persistence, Google OAuth, Cross-track regression

---

## Release Log — v2.0.0 (2026-03-21)

**Deployed:** Sat, 21 Mar 2026 05:09:14 GMT
**Version:** 2.0.0

### Changes in this release
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately
- fix: track display bugs — CLEP users see AP courses, AP users see CLEP default
- feat: Beta 2.1 — track enforcement: DB-backed track, server-side 403 guards, remove client toggle
- fix: Beta 2.0 post-release — track segmentation UX fixes
- feat: Beta 2.0 — track-based segmentation (AP/SAT/ACT vs CLEP)
- chore: release archive beta-1.15 — update test plan log
- feat: Beta 1.15 — CLEP course support, exam countdown fix, phase 2 backlog
- fix: HuggingFace correct endpoint — featherless-ai provider
- fix: update HuggingFace to new Inference Providers API
- fix: update AI provider models — Gemini 2.0, OpenRouter free tier, Together key name

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
Integration tests: 21 passed, 12 warnings, 0 failed
  Total questions: 511 | Courses: 15 green, 0 yellow, 7 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 64 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 23 MCQ questions
  ⚠️ AP_US_HISTORY — 0 questions — AI will generate on first session
  ⚠️ AP_PSYCHOLOGY — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 8 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ⚠️ AP Biology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP US History FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.0.0 (2026-03-21)

**Deployed:** Sat, 21 Mar 2026 15:18:57 GMT
**Version:** 2.0.0

### Changes in this release
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately
- fix: track display bugs — CLEP users see AP courses, AP users see CLEP default
- feat: Beta 2.1 — track enforcement: DB-backed track, server-side 403 guards, remove client toggle
- fix: Beta 2.0 post-release — track segmentation UX fixes
- feat: Beta 2.0 — track-based segmentation (AP/SAT/ACT vs CLEP)
- chore: release archive beta-1.15 — update test plan log
- feat: Beta 1.15 — CLEP course support, exam countdown fix, phase 2 backlog
- fix: HuggingFace correct endpoint — featherless-ai provider
- fix: update HuggingFace to new Inference Providers API
- fix: update AI provider models — Gemini 2.0, OpenRouter free tier, Together key name

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
Integration tests: 24 passed, 9 warnings, 0 failed
  Total questions: 535 | Courses: 16 green, 0 yellow, 6 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 64 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 34 MCQ questions
  ✅ AP_US_HISTORY — 9 MCQ questions
  ⚠️ AP_PSYCHOLOGY — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 8 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 2 questions
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.0.0 (2026-03-21)

**Deployed:** Sat, 21 Mar 2026 15:25:05 GMT
**Version:** 2.0.0

### Changes in this release
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately
- fix: track display bugs — CLEP users see AP courses, AP users see CLEP default
- feat: Beta 2.1 — track enforcement: DB-backed track, server-side 403 guards, remove client toggle
- fix: Beta 2.0 post-release — track segmentation UX fixes
- feat: Beta 2.0 — track-based segmentation (AP/SAT/ACT vs CLEP)
- chore: release archive beta-1.15 — update test plan log
- feat: Beta 1.15 — CLEP course support, exam countdown fix, phase 2 backlog
- fix: HuggingFace correct endpoint — featherless-ai provider
- fix: update HuggingFace to new Inference Providers API
- fix: update AI provider models — Gemini 2.0, OpenRouter free tier, Together key name

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
Integration tests: 24 passed, 9 warnings, 0 failed
  Total questions: 535 | Courses: 16 green, 0 yellow, 6 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 64 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 34 MCQ questions
  ✅ AP_US_HISTORY — 9 MCQ questions
  ⚠️ AP_PSYCHOLOGY — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 8 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 2 questions
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.0.0 (2026-03-21)

**Deployed:** Sat, 21 Mar 2026 16:05:58 GMT
**Version:** 2.0.0

### Changes in this release
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately
- fix: track display bugs — CLEP users see AP courses, AP users see CLEP default
- feat: Beta 2.1 — track enforcement: DB-backed track, server-side 403 guards, remove client toggle
- fix: Beta 2.0 post-release — track segmentation UX fixes
- feat: Beta 2.0 — track-based segmentation (AP/SAT/ACT vs CLEP)
- chore: release archive beta-1.15 — update test plan log
- feat: Beta 1.15 — CLEP course support, exam countdown fix, phase 2 backlog
- fix: HuggingFace correct endpoint — featherless-ai provider
- fix: update HuggingFace to new Inference Providers API
- fix: update AI provider models — Gemini 2.0, OpenRouter free tier, Together key name

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
Integration tests: 24 passed, 9 warnings, 0 failed
  Total questions: 536 | Courses: 16 green, 0 yellow, 6 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 64 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 34 MCQ questions
  ✅ AP_US_HISTORY — 9 MCQ questions
  ⚠️ AP_PSYCHOLOGY — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 2 questions
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.0.0 (2026-03-21)

**Deployed:** Sat, 21 Mar 2026 18:33:47 GMT
**Version:** 2.0.0

### Changes in this release
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately
- fix: track display bugs — CLEP users see AP courses, AP users see CLEP default
- feat: Beta 2.1 — track enforcement: DB-backed track, server-side 403 guards, remove client toggle
- fix: Beta 2.0 post-release — track segmentation UX fixes
- feat: Beta 2.0 — track-based segmentation (AP/SAT/ACT vs CLEP)
- chore: release archive beta-1.15 — update test plan log
- feat: Beta 1.15 — CLEP course support, exam countdown fix, phase 2 backlog
- fix: HuggingFace correct endpoint — featherless-ai provider
- fix: update HuggingFace to new Inference Providers API
- fix: update AI provider models — Gemini 2.0, OpenRouter free tier, Together key name

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
Integration tests: 24 passed, 9 warnings, 0 failed
  Total questions: 538 | Courses: 16 green, 0 yellow, 6 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 64 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 9 MCQ questions
  ⚠️ AP_PSYCHOLOGY — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 2 questions
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.0.0 (2026-03-21)

**Deployed:** Sat, 21 Mar 2026 21:58:27 GMT
**Version:** 2.0.0

### Changes in this release
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately
- fix: track display bugs — CLEP users see AP courses, AP users see CLEP default
- feat: Beta 2.1 — track enforcement: DB-backed track, server-side 403 guards, remove client toggle
- fix: Beta 2.0 post-release — track segmentation UX fixes
- feat: Beta 2.0 — track-based segmentation (AP/SAT/ACT vs CLEP)
- chore: release archive beta-1.15 — update test plan log
- feat: Beta 1.15 — CLEP course support, exam countdown fix, phase 2 backlog
- fix: HuggingFace correct endpoint — featherless-ai provider
- fix: update HuggingFace to new Inference Providers API
- fix: update AI provider models — Gemini 2.0, OpenRouter free tier, Together key name

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
Integration tests: 24 passed, 9 warnings, 0 failed
  Total questions: 545 | Courses: 16 green, 0 yellow, 6 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 64 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 15 MCQ questions
  ⚠️ AP_PSYCHOLOGY — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 3 questions
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.2.0 (2026-03-22)

**Deployed:** Sun, 22 Mar 2026 00:46:49 GMT
**Version:** 2.2.0

### Changes in this release
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files
- feat: Beta 2.1 — per-module Stripe subscriptions, SEO overhaul, content optimization, module-locked sidebar
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately
- fix: track display bugs — CLEP users see AP courses, AP users see CLEP default
- feat: Beta 2.1 — track enforcement: DB-backed track, server-side 403 guards, remove client toggle

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
Integration tests: 24 passed, 9 warnings, 0 failed
  Total questions: 548 | Courses: 16 green, 0 yellow, 6 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 15 MCQ questions
  ⚠️ AP_PSYCHOLOGY — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 3 questions
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.2.0 (2026-03-22)

**Deployed:** Sun, 22 Mar 2026 00:52:11 GMT
**Version:** 2.2.0

### Changes in this release
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files
- feat: Beta 2.1 — per-module Stripe subscriptions, SEO overhaul, content optimization, module-locked sidebar
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately
- fix: track display bugs — CLEP users see AP courses, AP users see CLEP default

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
Integration tests: 24 passed, 9 warnings, 0 failed
  Total questions: 548 | Courses: 16 green, 0 yellow, 6 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 15 MCQ questions
  ⚠️ AP_PSYCHOLOGY — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 3 questions
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.2.0 (2026-03-22)

**Deployed:** Sun, 22 Mar 2026 12:22:58 GMT
**Version:** 2.2.0

### Changes in this release
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files
- feat: Beta 2.1 — per-module Stripe subscriptions, SEO overhaul, content optimization, module-locked sidebar
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately

### Automated smoke tests
```
Smoke tests: 11 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Integration tests (practice coverage — all 16 courses)
```
Integration tests: 26 passed, 7 warnings, 0 failed
  Total questions: 577 | Courses: 17 green, 0 yellow, 5 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 10 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 3 questions
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.2.0 (2026-03-22)

**Deployed:** Sun, 22 Mar 2026 12:40:07 GMT
**Version:** 2.2.0

### Changes in this release
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files
- feat: Beta 2.1 — per-module Stripe subscriptions, SEO overhaul, content optimization, module-locked sidebar
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately

### Automated smoke tests
```
Smoke tests: 11 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Integration tests (practice coverage — all 16 courses)
```
Integration tests: 26 passed, 7 warnings, 0 failed
  Total questions: 577 | Courses: 17 green, 0 yellow, 5 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 10 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 3 questions
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.2.0 (2026-03-22)

**Deployed:** Sun, 22 Mar 2026 12:44:31 GMT
**Version:** 2.2.0

### Changes in this release
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files
- feat: Beta 2.1 — per-module Stripe subscriptions, SEO overhaul, content optimization, module-locked sidebar
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Integration tests (practice coverage — all 16 courses)
```
Integration tests: 28 passed, 7 warnings, 0 failed
  Total questions: 577 | Courses: 17 green, 0 yellow, 5 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 10 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 3 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.2.0 (2026-03-22)

**Deployed:** Sun, 22 Mar 2026 12:56:21 GMT
**Version:** 2.2.0

### Changes in this release
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files
- feat: Beta 2.1 — per-module Stripe subscriptions, SEO overhaul, content optimization, module-locked sidebar
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (8.3s)
  ✅ Test user created — userId=cmn1rg3j...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn1rg4c... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=212ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 28 passed, 7 warnings, 0 failed
  Total questions: 581 | Courses: 17 green, 0 yellow, 5 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 14 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 3 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.2.0 (2026-03-22)

**Deployed:** Sun, 22 Mar 2026 13:03:50 GMT
**Version:** 2.2.0

### Changes in this release
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files
- feat: Beta 2.1 — per-module Stripe subscriptions, SEO overhaul, content optimization, module-locked sidebar
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (5.9s)
  ✅ Test user created — userId=cmn1rps2...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn1rpsn... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=742ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 28 passed, 7 warnings, 0 failed
  Total questions: 596 | Courses: 17 green, 0 yellow, 5 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 26 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 6 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.2.0 (2026-03-22)

**Deployed:** Sun, 22 Mar 2026 13:22:24 GMT
**Version:** 2.2.0

### Changes in this release
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files
- feat: Beta 2.1 — per-module Stripe subscriptions, SEO overhaul, content optimization, module-locked sidebar
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.7s)
  ✅ Test user created — userId=cmn1sdm9...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn1sdn3... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=530ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 26 passed, 11 warnings, 0 failed
  Total questions: 596 | Courses: 17 green, 0 yellow, 5 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 26 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based study-plan — HTTP 500 — server error
  ⚠️ AP Calculus AB analytics — HTTP 500 — server error
  ⚠️ Analytics API — 1/22 courses returned 500 — CF Workers timeout risk
  ⚠️ Study Plan API — 1/22 courses returned 500 — CF Workers timeout risk
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.2.0 (2026-03-22)

**Deployed:** Sun, 22 Mar 2026 13:33:49 GMT
**Version:** 2.2.0

### Changes in this release
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files
- feat: Beta 2.1 — per-module Stripe subscriptions, SEO overhaul, content optimization, module-locked sidebar
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.0s)
  ✅ Test user created — userId=cmn1ssbm...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn1ssci... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=633ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 28 passed, 7 warnings, 0 failed
  Total questions: 596 | Courses: 17 green, 0 yellow, 5 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 26 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 6 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.2.0 (2026-03-22)

**Deployed:** Sun, 22 Mar 2026 13:43:54 GMT
**Version:** 2.2.0

### Changes in this release
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files
- feat: Beta 2.1 — per-module Stripe subscriptions, SEO overhaul, content optimization, module-locked sidebar
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.5s)
  ✅ Test user created — userId=cmn1t5aa...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn1t5b0... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=262ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200, 1 retried
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 28 passed, 7 warnings, 0 failed
  Total questions: 596 | Courses: 17 green, 0 yellow, 5 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 26 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 6 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.2.0 (2026-03-22)

**Deployed:** Sun, 22 Mar 2026 13:58:10 GMT
**Version:** 2.2.0

### Changes in this release
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files
- feat: Beta 2.1 — per-module Stripe subscriptions, SEO overhaul, content optimization, module-locked sidebar
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (4.8s)
  ✅ Test user created — userId=cmn1tnok...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn1tnp7... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=229ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 28 passed, 7 warnings, 0 failed
  Total questions: 596 | Courses: 17 green, 0 yellow, 5 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 26 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 6 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.2.0 (2026-03-22)

**Deployed:** Sun, 22 Mar 2026 15:15:03 GMT
**Version:** 2.2.0

### Changes in this release
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files
- feat: Beta 2.1 — per-module Stripe subscriptions, SEO overhaul, content optimization, module-locked sidebar
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.3s)
  ✅ Test user created — userId=cmn1wehq...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn1weir... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=692ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 28 passed, 7 warnings, 0 failed
  Total questions: 596 | Courses: 17 green, 0 yellow, 5 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 26 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 6 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.2.0 (2026-03-22)

**Deployed:** Sun, 22 Mar 2026 16:04:08 GMT
**Version:** 2.2.0

### Changes in this release
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files
- feat: Beta 2.1 — per-module Stripe subscriptions, SEO overhaul, content optimization, module-locked sidebar
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (8.1s)
  ✅ Test user created — userId=cmn1y5lk...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn1y5mf... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=153ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 28 passed, 7 warnings, 0 failed
  Total questions: 596 | Courses: 17 green, 0 yellow, 5 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 26 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 6 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.2.0 (2026-03-22)

**Deployed:** Sun, 22 Mar 2026 16:19:47 GMT
**Version:** 2.2.0

### Changes in this release
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files
- feat: Beta 2.1 — per-module Stripe subscriptions, SEO overhaul, content optimization, module-locked sidebar
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.0s)
  ✅ Test user created — userId=cmn1ypqy...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn1yprp... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=762ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 28 passed, 7 warnings, 0 failed
  Total questions: 596 | Courses: 17 green, 0 yellow, 5 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 26 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 6 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.2.0 (2026-03-22)

**Deployed:** Sun, 22 Mar 2026 16:43:36 GMT
**Version:** 2.2.0

### Changes in this release
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files
- feat: Beta 2.1 — per-module Stripe subscriptions, SEO overhaul, content optimization, module-locked sidebar
- fix: pass userTrack from session to Sidebar — CLEP users see correct courses immediately

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (5.7s)
  ✅ Test user created — userId=cmn1zkdv...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn1zkeh... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=243ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 28 passed, 7 warnings, 0 failed
  Total questions: 596 | Courses: 17 green, 0 yellow, 5 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 26 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 6 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.3.0 (2026-03-22)

**Deployed:** Sun, 22 Mar 2026 23:22:32 GMT
**Version:** 2.3.0

### Changes in this release
- feat: Beta 2.3 — per-module Stripe subscriptions, SEO overhaul, content optimization, daily goals
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files
- feat: Beta 2.1 — per-module Stripe subscriptions, SEO overhaul, content optimization, module-locked sidebar

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (5.5s)
  ✅ Test user created — userId=cmn2dtg4...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn2dtgz... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=138ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 29 passed, 6 warnings, 0 failed
  Total questions: 612 | Courses: 18 green, 0 yellow, 4 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 6 MCQ questions
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.3.0 (2026-03-22)

**Deployed:** Sun, 22 Mar 2026 23:33:40 GMT
**Version:** 2.3.0

### Changes in this release
- feat: Beta 2.3 — per-module Stripe subscriptions, SEO overhaul, content optimization, daily goals
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files
- feat: Beta 2.1 — per-module Stripe subscriptions, SEO overhaul, content optimization, module-locked sidebar

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.1s)
  ✅ Test user created — userId=cmn2e7qu...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn2e7rv... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=656ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 29 passed, 6 warnings, 0 failed
  Total questions: 612 | Courses: 18 green, 0 yellow, 4 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 6 MCQ questions
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.3.0 (2026-03-22)

**Deployed:** Sun, 22 Mar 2026 23:42:22 GMT
**Version:** 2.3.0

### Changes in this release
- feat: Beta 2.3 — per-module Stripe subscriptions, SEO overhaul, content optimization, daily goals
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files
- feat: Beta 2.1 — per-module Stripe subscriptions, SEO overhaul, content optimization, module-locked sidebar

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (5.6s)
  ✅ Test user created — userId=cmn2eix3...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn2eixx... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=222ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 29 passed, 6 warnings, 0 failed
  Total questions: 612 | Courses: 18 green, 0 yellow, 4 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 6 MCQ questions
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.3.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 00:11:12 GMT
**Version:** 2.3.0

### Changes in this release
- feat: Beta 2.3 — per-module Stripe subscriptions, SEO overhaul, content optimization, daily goals
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files
- feat: Beta 2.1 — per-module Stripe subscriptions, SEO overhaul, content optimization, module-locked sidebar

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.6s)
  ✅ Test user created — userId=cmn2fjy8...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn2fjza... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=240ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 29 passed, 6 warnings, 0 failed
  Total questions: 612 | Courses: 18 green, 0 yellow, 4 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 6 MCQ questions
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.3.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 00:51:01 GMT
**Version:** 2.3.0

### Changes in this release
- feat: landing page mockups, FAQ, rich footer, fade-in animations, testimonial avatars
- feat: Beta 2.3 — per-module Stripe subscriptions, SEO overhaul, content optimization, daily goals
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (5.9s)
  ✅ Test user created — userId=cmn2gz7c...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn2gz84... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=138ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 29 passed, 6 warnings, 0 failed
  Total questions: 612 | Courses: 18 green, 0 yellow, 4 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 6 MCQ questions
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.3.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 00:55:39 GMT
**Version:** 2.3.0

### Changes in this release
- feat: landing page mockups, FAQ, rich footer, fade-in animations, testimonial avatars
- feat: Beta 2.3 — per-module Stripe subscriptions, SEO overhaul, content optimization, daily goals
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.4s)
  ✅ Test user created — userId=cmn2h56h...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn2h57c... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=726ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 29 passed, 6 warnings, 0 failed
  Total questions: 612 | Courses: 18 green, 0 yellow, 4 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 6 MCQ questions
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.3.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 01:05:31 GMT
**Version:** 2.3.0

### Changes in this release
- feat: landing page mockups, FAQ, rich footer, fade-in animations, testimonial avatars
- feat: Beta 2.3 — per-module Stripe subscriptions, SEO overhaul, content optimization, daily goals
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.0s)
  ✅ Test user created — userId=cmn2hhvk...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn2hhw8... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=245ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 29 passed, 6 warnings, 0 failed
  Total questions: 612 | Courses: 18 green, 0 yellow, 4 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 6 MCQ questions
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.3.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 01:38:00 GMT
**Version:** 2.3.0

### Changes in this release
- feat: landing page mockups, FAQ, rich footer, fade-in animations, testimonial avatars
- feat: Beta 2.3 — per-module Stripe subscriptions, SEO overhaul, content optimization, daily goals
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.9s)
  ✅ Test user created — userId=cmn2inng...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn2inoa... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=809ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 29 passed, 6 warnings, 0 failed
  Total questions: 612 | Courses: 18 green, 0 yellow, 4 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 6 MCQ questions
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.3.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 01:49:50 GMT
**Version:** 2.3.0

### Changes in this release
- feat: landing page mockups, FAQ, rich footer, fade-in animations, testimonial avatars
- feat: Beta 2.3 — per-module Stripe subscriptions, SEO overhaul, content optimization, daily goals
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline
- fix: add AI suffix to StudentNest logo across all 5 layout files

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.1s)
  ✅ Test user created — userId=cmn2j2vq...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn2j2wi... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=212ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 29 passed, 6 warnings, 0 failed
  Total questions: 612 | Courses: 18 green, 0 yellow, 4 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 6 MCQ questions
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 02:08:21 GMT
**Version:** 2.4.0

### Changes in this release
- feat: Beta 2.4 — context-aware Sage chatbot, dashboard UX polish, Contact/Blog/FAQ pages
- feat: landing page mockups, FAQ, rich footer, fade-in animations, testimonial avatars
- feat: Beta 2.3 — per-module Stripe subscriptions, SEO overhaul, content optimization, daily goals
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.2s)
  ✅ Test user created — userId=cmn2jqnv...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn2jqor... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=171ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 29 passed, 6 warnings, 0 failed
  Total questions: 612 | Courses: 18 green, 0 yellow, 4 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 6 MCQ questions
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 02:45:22 GMT
**Version:** 2.4.0

### Changes in this release
- feat: Beta 2.4 — context-aware Sage chatbot, dashboard UX polish, Contact/Blog/FAQ pages
- feat: landing page mockups, FAQ, rich footer, fade-in animations, testimonial avatars
- feat: Beta 2.3 — per-module Stripe subscriptions, SEO overhaul, content optimization, daily goals
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.2s)
  ✅ Test user created — userId=cmn2l2a0...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn2l2ar... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=762ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 22 courses)
```
Integration tests: 29 passed, 6 warnings, 0 failed
  Total questions: 622 | Courses: 18 green, 0 yellow, 4 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 9 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 22/22 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 22/22 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 12:35:17 GMT
**Version:** 2.4.0

### Changes in this release
- feat: Beta 2.4 — context-aware Sage chatbot, dashboard UX polish, Contact/Blog/FAQ pages
- feat: landing page mockups, FAQ, rich footer, fade-in animations, testimonial avatars
- feat: Beta 2.3 — per-module Stripe subscriptions, SEO overhaul, content optimization, daily goals
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.6s)
  ✅ Test user created — userId=cmn364w7...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn364x2... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=754ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 30 passed, 33 warnings, 0 failed
  Total questions: 629 | Courses: 19 green, 0 yellow, 31 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 11 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 5 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 50/50 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 50/50 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 13:28:44 GMT
**Version:** 2.4.0

### Changes in this release
- feat: Beta 2.4 — context-aware Sage chatbot, dashboard UX polish, Contact/Blog/FAQ pages
- feat: landing page mockups, FAQ, rich footer, fade-in animations, testimonial avatars
- feat: Beta 2.3 — per-module Stripe subscriptions, SEO overhaul, content optimization, daily goals
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (5.6s)
  ✅ Test user created — userId=cmn381n6...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn381nu... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=211ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 30 passed, 33 warnings, 0 failed
  Total questions: 648 | Courses: 19 green, 2 yellow, 29 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 11 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — only 3 questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 50/50 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 50/50 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 13:34:45 GMT
**Version:** 2.4.0

### Changes in this release
- feat: Beta 2.4 — context-aware Sage chatbot, dashboard UX polish, Contact/Blog/FAQ pages
- feat: landing page mockups, FAQ, rich footer, fade-in animations, testimonial avatars
- feat: Beta 2.3 — per-module Stripe subscriptions, SEO overhaul, content optimization, daily goals
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.7s)
  ✅ Test user created — userId=cmn389dk...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn389eb... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=195ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 30 passed, 33 warnings, 0 failed
  Total questions: 648 | Courses: 19 green, 2 yellow, 29 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 11 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — only 3 questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 50/50 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 50/50 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 13:39:20 GMT
**Version:** 2.4.0

### Changes in this release
- feat: Beta 2.4 — context-aware Sage chatbot, dashboard UX polish, Contact/Blog/FAQ pages
- feat: landing page mockups, FAQ, rich footer, fade-in animations, testimonial avatars
- feat: Beta 2.3 — per-module Stripe subscriptions, SEO overhaul, content optimization, daily goals
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (5.1s)
  ✅ Test user created — userId=cmn38fae...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn38fb1... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=633ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 30 passed, 33 warnings, 0 failed
  Total questions: 648 | Courses: 19 green, 2 yellow, 29 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 11 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — only 3 questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 50/50 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 50/50 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 13:48:49 GMT
**Version:** 2.4.0

### Changes in this release
- feat: Beta 2.4 — context-aware Sage chatbot, dashboard UX polish, Contact/Blog/FAQ pages
- feat: landing page mockups, FAQ, rich footer, fade-in animations, testimonial avatars
- feat: Beta 2.3 — per-module Stripe subscriptions, SEO overhaul, content optimization, daily goals
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding
- feat: add automatic deployment notification email to pages:deploy pipeline

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.3s)
  ✅ Test user created — userId=cmn38rh7...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn38rhx... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=571ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 30 passed, 33 warnings, 0 failed
  Total questions: 648 | Courses: 19 green, 2 yellow, 29 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 11 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — only 3 questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 50/50 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 50/50 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 14:05:56 GMT
**Version:** 2.4.0

### Changes in this release
- feat: Beta 2.5 — full CLEP catalog (34 exams), 7-day pass plan, exam readiness, automated seeding
- feat: Beta 2.4 — context-aware Sage chatbot, dashboard UX polish, Contact/Blog/FAQ pages
- feat: landing page mockups, FAQ, rich footer, fade-in animations, testimonial avatars
- feat: Beta 2.3 — per-module Stripe subscriptions, SEO overhaul, content optimization, daily goals
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan
- feat: add weekly study schedules, score targets, How It Works nav link
- fix: deploy email script loads .env automatically when RESEND_API_KEY not in environment
- chore: bump to Beta 2.2 — deploy email pipeline, StudentNest AI branding

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (5.6s)
  ✅ Test user created — userId=cmn39dhl...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn39di7... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=243ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 30 passed, 33 warnings, 0 failed
  Total questions: 649 | Courses: 19 green, 3 yellow, 28 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 11 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — only 3 questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — only 1 questions
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 50/50 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 50/50 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 15:22:17 GMT
**Version:** 2.4.0

### Changes in this release
- fix: update CLEP test center URL to correct collegeboard.org/clep-search
- feat: CLEP instant onboarding — 7-day plan on first login, Day 1 on dashboard
- fix: diagnostic shows selected course name, resources page shows course-specific resources
- feat: Beta 2.5 — full CLEP catalog (34 exams), 7-day pass plan, exam readiness, automated seeding
- feat: Beta 2.4 — context-aware Sage chatbot, dashboard UX polish, Contact/Blog/FAQ pages
- feat: landing page mockups, FAQ, rich footer, fade-in animations, testimonial avatars
- feat: Beta 2.3 — per-module Stripe subscriptions, SEO overhaul, content optimization, daily goals
- fix: parallelize study plan queries + add 20s AI timeout to prevent CF Workers failure
- fix: reduce analytics to 5 queries (was 12) — fetch all sessions once, derive rest in-memory
- fix: parallelize analytics queries to prevent CF Workers timeout, add force-dynamic to study-plan

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.1s)
  ✅ Test user created — userId=cmn3c3ol...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn3c3pg... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=134ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 31 passed, 32 warnings, 0 failed
  Total questions: 654 | Courses: 20 green, 3 yellow, 27 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 11 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — only 3 questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — only 1 questions
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ✅ CLEP_COLLEGE_MATH — 5 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 50/50 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 50/50 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 17:19:37 GMT
**Version:** 2.4.0

### Changes in this release
- feat: expand CLEP calibration examples — 38 new stems across top 15 courses
- feat: CLEP Phase 3 — empirical difficulty audit + dual calibration injection
- feat: CLEP Phase 2 — topic weight-aware generation + OpenStax content grounding
- feat: CLEP question quality — College Board-level generation pipeline
- feat: Khan Academy-style redesign — light theme default, blue primary, clean look
- fix: update CLEP test center URL to correct collegeboard.org/clep-search
- feat: CLEP instant onboarding — 7-day plan on first login, Day 1 on dashboard
- fix: diagnostic shows selected course name, resources page shows course-specific resources
- feat: Beta 2.5 — full CLEP catalog (34 exams), 7-day pass plan, exam readiness, automated seeding
- feat: Beta 2.4 — context-aware Sage chatbot, dashboard UX polish, Contact/Blog/FAQ pages

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.0s)
  ✅ Test user created — userId=cmn3gakc...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn3gal7... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=227ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 32 passed, 31 warnings, 0 failed
  Total questions: 662 | Courses: 21 green, 2 yellow, 27 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 11 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 11 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — only 1 questions
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ✅ CLEP_COLLEGE_MATH — 5 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 50/50 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 50/50 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 17:38:01 GMT
**Version:** 2.4.0

### Changes in this release
- feat: CLEP Phase 4 — all 34 courses get topicWeights + 13 courses get recommended textbooks
- feat: wire difficulty audit into auto-populate cron endpoint
- feat: expand CLEP calibration examples — 38 new stems across top 15 courses
- feat: CLEP Phase 3 — empirical difficulty audit + dual calibration injection
- feat: CLEP Phase 2 — topic weight-aware generation + OpenStax content grounding
- feat: CLEP question quality — College Board-level generation pipeline
- feat: Khan Academy-style redesign — light theme default, blue primary, clean look
- fix: update CLEP test center URL to correct collegeboard.org/clep-search
- feat: CLEP instant onboarding — 7-day plan on first login, Day 1 on dashboard
- fix: diagnostic shows selected course name, resources page shows course-specific resources

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (7.0s)
  ✅ Test user created — userId=cmn3gy75...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn3gy7v... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=227ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 32 passed, 31 warnings, 0 failed
  Total questions: 662 | Courses: 21 green, 2 yellow, 27 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 11 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 11 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — only 1 questions
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ✅ CLEP_COLLEGE_MATH — 5 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 50/50 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 50/50 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 18:08:11 GMT
**Version:** 2.4.0

### Changes in this release
- feat: CLEP landing page — visual quality section with confidence indicators
- feat: admin quality dashboard tab with full metrics visualization
- feat: visual quality indicators on CLEP practice questions
- feat: add College Board-aligned quality section to About page
- feat: CLEP quality proof — metrics API, bloomLevel tracking, quality grading
- feat: CLEP Phase 4 — all 34 courses get topicWeights + 13 courses get recommended textbooks
- feat: wire difficulty audit into auto-populate cron endpoint
- feat: expand CLEP calibration examples — 38 new stems across top 15 courses
- feat: CLEP Phase 3 — empirical difficulty audit + dual calibration injection
- feat: CLEP Phase 2 — topic weight-aware generation + OpenStax content grounding

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.4s)
  ✅ Test user created — userId=cmn3i10y...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn3i11v... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=159ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 32 passed, 31 warnings, 0 failed
  Total questions: 663 | Courses: 21 green, 2 yellow, 27 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 12 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 11 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — only 1 questions
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ✅ CLEP_COLLEGE_MATH — 5 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 50/50 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 50/50 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 18:18:01 GMT
**Version:** 2.4.0

### Changes in this release
- fix: admin users can access all courses regardless of track
- feat: CLEP landing page — visual quality section with confidence indicators
- feat: admin quality dashboard tab with full metrics visualization
- feat: visual quality indicators on CLEP practice questions
- feat: add College Board-aligned quality section to About page
- feat: CLEP quality proof — metrics API, bloomLevel tracking, quality grading
- feat: CLEP Phase 4 — all 34 courses get topicWeights + 13 courses get recommended textbooks
- feat: wire difficulty audit into auto-populate cron endpoint
- feat: expand CLEP calibration examples — 38 new stems across top 15 courses
- feat: CLEP Phase 3 — empirical difficulty audit + dual calibration injection

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (7.3s)
  ✅ Test user created — userId=cmn3idmu...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn3idnt... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=181ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 32 passed, 31 warnings, 0 failed
  Total questions: 664 | Courses: 21 green, 2 yellow, 27 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 13 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 11 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — only 1 questions
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ✅ CLEP_COLLEGE_MATH — 5 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 50/50 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 50/50 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 18:27:57 GMT
**Version:** 2.4.0

### Changes in this release
- fix: prevent 500 error when CLEP course has 0 questions and AI gen fails
- fix: admin users can access all courses regardless of track
- feat: CLEP landing page — visual quality section with confidence indicators
- feat: admin quality dashboard tab with full metrics visualization
- feat: visual quality indicators on CLEP practice questions
- feat: add College Board-aligned quality section to About page
- feat: CLEP quality proof — metrics API, bloomLevel tracking, quality grading
- feat: CLEP Phase 4 — all 34 courses get topicWeights + 13 courses get recommended textbooks
- feat: wire difficulty audit into auto-populate cron endpoint
- feat: expand CLEP calibration examples — 38 new stems across top 15 courses

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.0s)
  ✅ Test user created — userId=cmn3iqeb...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn3iqf5... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=210ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 32 passed, 31 warnings, 0 failed
  Total questions: 664 | Courses: 21 green, 2 yellow, 27 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 13 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 11 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — only 1 questions
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ✅ CLEP_COLLEGE_MATH — 5 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 50/50 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 50/50 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 18:30:20 GMT
**Version:** 2.4.0

### Changes in this release
- fix: prevent 500 error when CLEP course has 0 questions and AI gen fails
- fix: admin users can access all courses regardless of track
- feat: CLEP landing page — visual quality section with confidence indicators
- feat: admin quality dashboard tab with full metrics visualization
- feat: visual quality indicators on CLEP practice questions
- feat: add College Board-aligned quality section to About page
- feat: CLEP quality proof — metrics API, bloomLevel tracking, quality grading
- feat: CLEP Phase 4 — all 34 courses get topicWeights + 13 courses get recommended textbooks
- feat: wire difficulty audit into auto-populate cron endpoint
- feat: expand CLEP calibration examples — 38 new stems across top 15 courses

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.7s)
  ✅ Test user created — userId=cmn3itgt...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn3ithj... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=227ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200, 1 retried
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 32 passed, 31 warnings, 0 failed
  Total questions: 664 | Courses: 21 green, 2 yellow, 27 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 13 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 11 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — only 1 questions
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ✅ CLEP_COLLEGE_MATH — 5 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 50/50 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 50/50 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 18:36:12 GMT
**Version:** 2.4.0

### Changes in this release
- fix: retry AI generation when bank is empty — prevent student interruption
- fix: increase seeding frequency and throughput for empty CLEP courses
- fix: prevent 500 error when CLEP course has 0 questions and AI gen fails
- fix: admin users can access all courses regardless of track
- feat: CLEP landing page — visual quality section with confidence indicators
- feat: admin quality dashboard tab with full metrics visualization
- feat: visual quality indicators on CLEP practice questions
- feat: add College Board-aligned quality section to About page
- feat: CLEP quality proof — metrics API, bloomLevel tracking, quality grading
- feat: CLEP Phase 4 — all 34 courses get topicWeights + 13 courses get recommended textbooks

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (8.4s)
  ✅ Test user created — userId=cmn3j10u...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn3j11i... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=167ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 32 passed, 31 warnings, 0 failed
  Total questions: 664 | Courses: 21 green, 2 yellow, 27 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 13 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 11 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — only 1 questions
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ✅ CLEP_COLLEGE_MATH — 5 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 50/50 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 50/50 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 18:49:43 GMT
**Version:** 2.4.0

### Changes in this release
- feat: MVP — uninterrupted CLEP questions with zero intervention
- fix: retry AI generation when bank is empty — prevent student interruption
- fix: increase seeding frequency and throughput for empty CLEP courses
- fix: prevent 500 error when CLEP course has 0 questions and AI gen fails
- fix: admin users can access all courses regardless of track
- feat: CLEP landing page — visual quality section with confidence indicators
- feat: admin quality dashboard tab with full metrics visualization
- feat: visual quality indicators on CLEP practice questions
- feat: add College Board-aligned quality section to About page
- feat: CLEP quality proof — metrics API, bloomLevel tracking, quality grading

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (5.6s)
  ✅ Test user created — userId=cmn3jidh...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn3jie8... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=152ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 32 passed, 31 warnings, 0 failed
  Total questions: 664 | Courses: 21 green, 2 yellow, 27 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 13 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 11 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — only 1 questions
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ✅ CLEP_COLLEGE_MATH — 5 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 50/50 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 50/50 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 19:03:17 GMT
**Version:** 2.4.0

### Changes in this release
- fix: prevent CF Workers timeout on CLEP question generation
- feat: MVP — uninterrupted CLEP questions with zero intervention
- fix: retry AI generation when bank is empty — prevent student interruption
- fix: increase seeding frequency and throughput for empty CLEP courses
- fix: prevent 500 error when CLEP course has 0 questions and AI gen fails
- fix: admin users can access all courses regardless of track
- feat: CLEP landing page — visual quality section with confidence indicators
- feat: admin quality dashboard tab with full metrics visualization
- feat: visual quality indicators on CLEP practice questions
- feat: add College Board-aligned quality section to About page

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.2s)
  ✅ Test user created — userId=cmn3jzve...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn3jzvz... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=571ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200, 1 retried
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 33 passed, 30 warnings, 0 failed
  Total questions: 677 | Courses: 22 green, 1 yellow, 27 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 11 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ✅ CLEP_COLLEGE_MATH — 5 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 50/50 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 50/50 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 20:04:03 GMT
**Version:** 2.4.0

### Changes in this release
- feat: circuit breaker + reliability improvements for AI providers
- fix: prevent CF Workers timeout on CLEP question generation
- feat: MVP — uninterrupted CLEP questions with zero intervention
- fix: retry AI generation when bank is empty — prevent student interruption
- fix: increase seeding frequency and throughput for empty CLEP courses
- fix: prevent 500 error when CLEP course has 0 questions and AI gen fails
- fix: admin users can access all courses regardless of track
- feat: CLEP landing page — visual quality section with confidence indicators
- feat: admin quality dashboard tab with full metrics visualization
- feat: visual quality indicators on CLEP practice questions

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (5.8s)
  ✅ Test user created — userId=cmn3m600...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn3m60s... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=201ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 33 passed, 30 warnings, 0 failed
  Total questions: 678 | Courses: 22 green, 1 yellow, 27 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 12 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ✅ CLEP_COLLEGE_MATH — 5 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 50/50 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 50/50 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 20:51:26 GMT
**Version:** 2.4.0

### Changes in this release
- feat: admin Subscribers tab — premium user details + revenue dashboard
- feat: circuit breaker + reliability improvements for AI providers
- fix: prevent CF Workers timeout on CLEP question generation
- feat: MVP — uninterrupted CLEP questions with zero intervention
- fix: retry AI generation when bank is empty — prevent student interruption
- fix: increase seeding frequency and throughput for empty CLEP courses
- fix: prevent 500 error when CLEP course has 0 questions and AI gen fails
- fix: admin users can access all courses regardless of track
- feat: CLEP landing page — visual quality section with confidence indicators
- feat: admin quality dashboard tab with full metrics visualization

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (5.0s)
  ✅ Test user created — userId=cmn3nuvs...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn3nuwg... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=110ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 33 passed, 30 warnings, 0 failed
  Total questions: 686 | Courses: 22 green, 4 yellow, 24 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 17 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 13 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — only 1 questions
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — only 3 questions
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — only 3 questions
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ✅ CLEP_COLLEGE_MATH — 5 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 50/50 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 50/50 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-23)

**Deployed:** Mon, 23 Mar 2026 23:15:03 GMT
**Version:** 2.4.0

### Changes in this release
- feat: admin Subscribers tab — premium user details + revenue dashboard
- feat: circuit breaker + reliability improvements for AI providers
- fix: prevent CF Workers timeout on CLEP question generation
- feat: MVP — uninterrupted CLEP questions with zero intervention
- fix: retry AI generation when bank is empty — prevent student interruption
- fix: increase seeding frequency and throughput for empty CLEP courses
- fix: prevent 500 error when CLEP course has 0 questions and AI gen fails
- fix: admin users can access all courses regardless of track
- feat: CLEP landing page — visual quality section with confidence indicators
- feat: admin quality dashboard tab with full metrics visualization

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.4s)
  ✅ Test user created — userId=cmn3szm6...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn3szn4... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=195ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 34 passed, 34 warnings, 0 failed
  Total questions: 694 | Courses: 23 green, 4 yellow, 28 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 18 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 13 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — only 3 questions
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — only 3 questions
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ✅ CLEP_MICROECONOMICS — 5 MCQ questions
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — only 3 questions
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ✅ CLEP_COLLEGE_MATH — 5 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_SUPERVISION — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_RESOURCE_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 55/55 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 55/55 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-24)

**Deployed:** Tue, 24 Mar 2026 02:17:10 GMT
**Version:** 2.4.0

### Changes in this release
- feat: admin Subscribers tab — premium user details + revenue dashboard
- feat: circuit breaker + reliability improvements for AI providers
- fix: prevent CF Workers timeout on CLEP question generation
- feat: MVP — uninterrupted CLEP questions with zero intervention
- fix: retry AI generation when bank is empty — prevent student interruption
- fix: increase seeding frequency and throughput for empty CLEP courses
- fix: prevent 500 error when CLEP course has 0 questions and AI gen fails
- fix: admin users can access all courses regardless of track
- feat: CLEP landing page — visual quality section with confidence indicators
- feat: admin quality dashboard tab with full metrics visualization

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (7.1s)
  ✅ Test user created — userId=cmn3zhto...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn3zhuq... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=735ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 35 passed, 33 warnings, 0 failed
  Total questions: 706 | Courses: 24 green, 5 yellow, 26 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 18 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 13 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — only 4 questions
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — only 3 questions
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ✅ CLEP_MICROECONOMICS — 5 MCQ questions
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — only 3 questions
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ✅ CLEP_COLLEGE_MATH — 5 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ DSST_PRINCIPLES_OF_SUPERVISION — 8 MCQ questions
  ⚠️ DSST_HUMAN_RESOURCE_MANAGEMENT — only 3 questions
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 55/55 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 55/55 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-24)

**Deployed:** Tue, 24 Mar 2026 02:29:33 GMT
**Version:** 2.4.0

### Changes in this release
- feat: admin Subscribers tab — premium user details + revenue dashboard
- feat: circuit breaker + reliability improvements for AI providers
- fix: prevent CF Workers timeout on CLEP question generation
- feat: MVP — uninterrupted CLEP questions with zero intervention
- fix: retry AI generation when bank is empty — prevent student interruption
- fix: increase seeding frequency and throughput for empty CLEP courses
- fix: prevent 500 error when CLEP course has 0 questions and AI gen fails
- fix: admin users can access all courses regardless of track
- feat: CLEP landing page — visual quality section with confidence indicators
- feat: admin quality dashboard tab with full metrics visualization

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.4s)
  ✅ Test user created — userId=cmn3zxqv...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn3zxrk... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=232ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 35 passed, 33 warnings, 0 failed
  Total questions: 706 | Courses: 24 green, 5 yellow, 26 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 18 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 13 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — only 4 questions
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — only 3 questions
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ✅ CLEP_MICROECONOMICS — 5 MCQ questions
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — only 3 questions
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ✅ CLEP_COLLEGE_MATH — 5 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ DSST_PRINCIPLES_OF_SUPERVISION — 8 MCQ questions
  ⚠️ DSST_HUMAN_RESOURCE_MANAGEMENT — only 3 questions
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 55/55 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 55/55 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.4.0 (2026-03-24)

**Deployed:** Tue, 24 Mar 2026 02:37:47 GMT
**Version:** 2.4.0

### Changes in this release
- feat: admin Subscribers tab — premium user details + revenue dashboard
- feat: circuit breaker + reliability improvements for AI providers
- fix: prevent CF Workers timeout on CLEP question generation
- feat: MVP — uninterrupted CLEP questions with zero intervention
- fix: retry AI generation when bank is empty — prevent student interruption
- fix: increase seeding frequency and throughput for empty CLEP courses
- fix: prevent 500 error when CLEP course has 0 questions and AI gen fails
- fix: admin users can access all courses regardless of track
- feat: CLEP landing page — visual quality section with confidence indicators
- feat: admin quality dashboard tab with full metrics visualization

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (7.4s)
  ✅ Test user created — userId=cmn408bl...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn408cq... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=252ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 35 passed, 33 warnings, 0 failed
  Total questions: 706 | Courses: 24 green, 5 yellow, 26 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 18 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 13 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — only 4 questions
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — only 3 questions
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ✅ CLEP_MICROECONOMICS — 5 MCQ questions
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — only 3 questions
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ✅ CLEP_COLLEGE_MATH — 5 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ DSST_PRINCIPLES_OF_SUPERVISION — 8 MCQ questions
  ⚠️ DSST_HUMAN_RESOURCE_MANAGEMENT — only 3 questions
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 55/55 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 55/55 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.5.0 (2026-03-24)

**Deployed:** Tue, 24 Mar 2026 03:51:34 GMT
**Version:** 2.5.0

### Changes in this release
- feat: Beta 2.5 — DSST exam support, admin users dashboard, Stripe integration
- feat: admin Subscribers tab — premium user details + revenue dashboard
- feat: circuit breaker + reliability improvements for AI providers
- fix: prevent CF Workers timeout on CLEP question generation
- feat: MVP — uninterrupted CLEP questions with zero intervention
- fix: retry AI generation when bank is empty — prevent student interruption
- fix: increase seeding frequency and throughput for empty CLEP courses
- fix: prevent 500 error when CLEP course has 0 questions and AI gen fails
- fix: admin users can access all courses regardless of track
- feat: CLEP landing page — visual quality section with confidence indicators

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (5.5s)
  ✅ Test user created — userId=cmn42v90...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn42v9q... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=692ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 35 passed, 50 warnings, 0 failed
  Total questions: 706 | Courses: 24 green, 5 yellow, 43 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 18 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 13 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — only 4 questions
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — only 3 questions
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ✅ CLEP_MICROECONOMICS — 5 MCQ questions
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — only 3 questions
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ✅ CLEP_COLLEGE_MATH — 5 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ DSST_PRINCIPLES_OF_SUPERVISION — 8 MCQ questions
  ⚠️ DSST_HUMAN_RESOURCE_MANAGEMENT — only 3 questions
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 72/72 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 72/72 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.5.0 (2026-03-24)

**Deployed:** Tue, 24 Mar 2026 03:55:50 GMT
**Version:** 2.5.0

### Changes in this release
- feat: Beta 2.5 — DSST exam support, admin users dashboard, Stripe integration
- feat: admin Subscribers tab — premium user details + revenue dashboard
- feat: circuit breaker + reliability improvements for AI providers
- fix: prevent CF Workers timeout on CLEP question generation
- feat: MVP — uninterrupted CLEP questions with zero intervention
- fix: retry AI generation when bank is empty — prevent student interruption
- fix: increase seeding frequency and throughput for empty CLEP courses
- fix: prevent 500 error when CLEP course has 0 questions and AI gen fails
- fix: admin users can access all courses regardless of track
- feat: CLEP landing page — visual quality section with confidence indicators

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — This operation was aborted
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (5.1s)
  ✅ Test user created — userId=cmn430r3...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmn430rs... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=210ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 35 passed, 50 warnings, 0 failed
  Total questions: 706 | Courses: 24 green, 5 yellow, 43 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 35 MCQ questions
  ✅ AP_PHYSICS_1 — 55 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 18 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 45 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 24 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 13 MCQ questions
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — only 4 questions
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — only 3 questions
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ✅ CLEP_MICROECONOMICS — 5 MCQ questions
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — only 1 questions
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — only 3 questions
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ✅ CLEP_COLLEGE_MATH — 5 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ DSST_PRINCIPLES_OF_SUPERVISION — 8 MCQ questions
  ⚠️ DSST_HUMAN_RESOURCE_MANAGEMENT — only 3 questions
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 72/72 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 72/72 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.5.0 (2026-04-15)

**Deployed:** Wed, 15 Apr 2026 02:40:32 GMT
**Version:** 2.5.0

### Changes in this release
- feat: Beta 2.5 — DSST exam support, admin users dashboard, Stripe integration
- feat: admin Subscribers tab — premium user details + revenue dashboard
- feat: circuit breaker + reliability improvements for AI providers
- fix: prevent CF Workers timeout on CLEP question generation
- feat: MVP — uninterrupted CLEP questions with zero intervention
- fix: retry AI generation when bank is empty — prevent student interruption
- fix: increase seeding frequency and throughput for empty CLEP courses
- fix: prevent 500 error when CLEP course has 0 questions and AI gen fails
- fix: admin users can access all courses regardless of track
- feat: CLEP landing page — visual quality section with confidence indicators

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 11 passed, 2 warnings, 0 failed (47.9s)
  ✅ Test user created — userId=cmnzfzqh...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmnzfzrb... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=201ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — This operation was aborted
  ⚠️ B2. Knowledge Check gen — HTTP 503
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 49 passed, 36 warnings, 0 failed
  Total questions: 825 | Courses: 38 green, 1 yellow, 33 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 36 MCQ questions
  ✅ AP_PHYSICS_1 — 60 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 18 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 49 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 26 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 32 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MANAGEMENT — 7 MCQ questions
  ✅ CLEP_INTRODUCTORY_SOCIOLOGY — 7 MCQ questions
  ✅ CLEP_AMERICAN_GOVERNMENT — 5 MCQ questions
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ✅ CLEP_MICROECONOMICS — 5 MCQ questions
  ✅ CLEP_BIOLOGY — 13 MCQ questions
  ✅ CLEP_US_HISTORY_1 — 5 MCQ questions
  ✅ CLEP_US_HISTORY_2 — 5 MCQ questions
  ✅ CLEP_HUMAN_GROWTH_DEV — 5 MCQ questions
  ✅ CLEP_CALCULUS — 10 MCQ questions
  ✅ CLEP_CHEMISTRY — 5 MCQ questions
  ✅ CLEP_FINANCIAL_ACCOUNTING — 6 MCQ questions
  ✅ CLEP_AMERICAN_LITERATURE — 5 MCQ questions
  ✅ CLEP_ANALYZING_INTERPRETING_LIT — 5 MCQ questions
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — only 3 questions
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ✅ CLEP_WESTERN_CIV_2 — 8 MCQ questions
  ✅ CLEP_COLLEGE_MATH — 8 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ DSST_PRINCIPLES_OF_SUPERVISION — 10 MCQ questions
  ✅ DSST_HUMAN_RESOURCE_MANAGEMENT — 8 MCQ questions
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 72/72 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 72/72 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.5.0 (2026-04-15)

**Deployed:** Wed, 15 Apr 2026 03:40:00 GMT
**Version:** 2.5.0

### Changes in this release
- feat: Beta 2.5 — DSST exam support, admin users dashboard, Stripe integration
- feat: admin Subscribers tab — premium user details + revenue dashboard
- feat: circuit breaker + reliability improvements for AI providers
- fix: prevent CF Workers timeout on CLEP question generation
- feat: MVP — uninterrupted CLEP questions with zero intervention
- fix: retry AI generation when bank is empty — prevent student interruption
- fix: increase seeding frequency and throughput for empty CLEP courses
- fix: prevent 500 error when CLEP course has 0 questions and AI gen fails
- fix: admin users can access all courses regardless of track
- feat: CLEP landing page — visual quality section with confidence indicators

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 11 passed, 2 warnings, 0 failed (46.9s)
  ✅ Test user created — userId=cmnzi47r...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmnzi48l... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=195ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — This operation was aborted
  ⚠️ B2. Knowledge Check gen — HTTP 503
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 49 passed, 36 warnings, 0 failed
  Total questions: 825 | Courses: 38 green, 1 yellow, 33 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 36 MCQ questions
  ✅ AP_PHYSICS_1 — 60 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 18 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 49 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 26 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 32 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MANAGEMENT — 7 MCQ questions
  ✅ CLEP_INTRODUCTORY_SOCIOLOGY — 7 MCQ questions
  ✅ CLEP_AMERICAN_GOVERNMENT — 5 MCQ questions
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ✅ CLEP_MICROECONOMICS — 5 MCQ questions
  ✅ CLEP_BIOLOGY — 13 MCQ questions
  ✅ CLEP_US_HISTORY_1 — 5 MCQ questions
  ✅ CLEP_US_HISTORY_2 — 5 MCQ questions
  ✅ CLEP_HUMAN_GROWTH_DEV — 5 MCQ questions
  ✅ CLEP_CALCULUS — 10 MCQ questions
  ✅ CLEP_CHEMISTRY — 5 MCQ questions
  ✅ CLEP_FINANCIAL_ACCOUNTING — 6 MCQ questions
  ✅ CLEP_AMERICAN_LITERATURE — 5 MCQ questions
  ✅ CLEP_ANALYZING_INTERPRETING_LIT — 5 MCQ questions
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — only 3 questions
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ✅ CLEP_WESTERN_CIV_2 — 8 MCQ questions
  ✅ CLEP_COLLEGE_MATH — 8 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ DSST_PRINCIPLES_OF_SUPERVISION — 10 MCQ questions
  ✅ DSST_HUMAN_RESOURCE_MANAGEMENT — 8 MCQ questions
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 72/72 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 72/72 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.5.0 (2026-04-15)

**Deployed:** Wed, 15 Apr 2026 03:42:42 GMT
**Version:** 2.5.0

### Changes in this release
- feat: Beta 2.5 — DSST exam support, admin users dashboard, Stripe integration
- feat: admin Subscribers tab — premium user details + revenue dashboard
- feat: circuit breaker + reliability improvements for AI providers
- fix: prevent CF Workers timeout on CLEP question generation
- feat: MVP — uninterrupted CLEP questions with zero intervention
- fix: retry AI generation when bank is empty — prevent student interruption
- fix: increase seeding frequency and throughput for empty CLEP courses
- fix: prevent 500 error when CLEP course has 0 questions and AI gen fails
- fix: admin users can access all courses regardless of track
- feat: CLEP landing page — visual quality section with confidence indicators

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 11 passed, 2 warnings, 0 failed (6.5s)
  ✅ Test user created — userId=cmnzi8lw...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmnzi8ml... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=159ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ⚠️ B2. Knowledge Check gen — HTTP 503
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 49 passed, 36 warnings, 0 failed
  Total questions: 825 | Courses: 38 green, 1 yellow, 33 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 36 MCQ questions
  ✅ AP_PHYSICS_1 — 60 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 18 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 49 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 26 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 32 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MANAGEMENT — 7 MCQ questions
  ✅ CLEP_INTRODUCTORY_SOCIOLOGY — 7 MCQ questions
  ✅ CLEP_AMERICAN_GOVERNMENT — 5 MCQ questions
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ✅ CLEP_MICROECONOMICS — 5 MCQ questions
  ✅ CLEP_BIOLOGY — 13 MCQ questions
  ✅ CLEP_US_HISTORY_1 — 5 MCQ questions
  ✅ CLEP_US_HISTORY_2 — 5 MCQ questions
  ✅ CLEP_HUMAN_GROWTH_DEV — 5 MCQ questions
  ✅ CLEP_CALCULUS — 10 MCQ questions
  ✅ CLEP_CHEMISTRY — 5 MCQ questions
  ✅ CLEP_FINANCIAL_ACCOUNTING — 6 MCQ questions
  ✅ CLEP_AMERICAN_LITERATURE — 5 MCQ questions
  ✅ CLEP_ANALYZING_INTERPRETING_LIT — 5 MCQ questions
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — only 3 questions
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ✅ CLEP_WESTERN_CIV_2 — 8 MCQ questions
  ✅ CLEP_COLLEGE_MATH — 8 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ DSST_PRINCIPLES_OF_SUPERVISION — 10 MCQ questions
  ✅ DSST_HUMAN_RESOURCE_MANAGEMENT — 8 MCQ questions
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 72/72 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 72/72 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.5.0 (2026-04-15)

**Deployed:** Wed, 15 Apr 2026 03:52:49 GMT
**Version:** 2.5.0

### Changes in this release
- feat: Beta 2.5 — DSST exam support, admin users dashboard, Stripe integration
- feat: admin Subscribers tab — premium user details + revenue dashboard
- feat: circuit breaker + reliability improvements for AI providers
- fix: prevent CF Workers timeout on CLEP question generation
- feat: MVP — uninterrupted CLEP questions with zero intervention
- fix: retry AI generation when bank is empty — prevent student interruption
- fix: increase seeding frequency and throughput for empty CLEP courses
- fix: prevent 500 error when CLEP course has 0 questions and AI gen fails
- fix: admin users can access all courses regardless of track
- feat: CLEP landing page — visual quality section with confidence indicators

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (15.8s)
  ✅ Test user created — userId=cmnzilda...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmnzildt... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=227ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 49 passed, 36 warnings, 0 failed
  Total questions: 825 | Courses: 38 green, 1 yellow, 33 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 67 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 36 MCQ questions
  ✅ AP_PHYSICS_1 — 60 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 18 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 49 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 26 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 32 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MANAGEMENT — 7 MCQ questions
  ✅ CLEP_INTRODUCTORY_SOCIOLOGY — 7 MCQ questions
  ✅ CLEP_AMERICAN_GOVERNMENT — 5 MCQ questions
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ✅ CLEP_MICROECONOMICS — 5 MCQ questions
  ✅ CLEP_BIOLOGY — 13 MCQ questions
  ✅ CLEP_US_HISTORY_1 — 5 MCQ questions
  ✅ CLEP_US_HISTORY_2 — 5 MCQ questions
  ✅ CLEP_HUMAN_GROWTH_DEV — 5 MCQ questions
  ✅ CLEP_CALCULUS — 10 MCQ questions
  ✅ CLEP_CHEMISTRY — 5 MCQ questions
  ✅ CLEP_FINANCIAL_ACCOUNTING — 6 MCQ questions
  ✅ CLEP_AMERICAN_LITERATURE — 5 MCQ questions
  ✅ CLEP_ANALYZING_INTERPRETING_LIT — 5 MCQ questions
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — only 3 questions
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ✅ CLEP_WESTERN_CIV_2 — 8 MCQ questions
  ✅ CLEP_COLLEGE_MATH — 8 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ DSST_PRINCIPLES_OF_SUPERVISION — 10 MCQ questions
  ✅ DSST_HUMAN_RESOURCE_MANAGEMENT — 8 MCQ questions
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 72/72 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 72/72 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.5.0 (2026-04-15)

**Deployed:** Wed, 15 Apr 2026 17:43:13 GMT
**Version:** 2.5.0

### Changes in this release
- feat: Beta 2.5 — DSST exam support, admin users dashboard, Stripe integration
- feat: admin Subscribers tab — premium user details + revenue dashboard
- feat: circuit breaker + reliability improvements for AI providers
- fix: prevent CF Workers timeout on CLEP question generation
- feat: MVP — uninterrupted CLEP questions with zero intervention
- fix: retry AI generation when bank is empty — prevent student interruption
- fix: increase seeding frequency and throughput for empty CLEP courses
- fix: prevent 500 error when CLEP course has 0 questions and AI gen fails
- fix: admin users can access all courses regardless of track
- feat: CLEP landing page — visual quality section with confidence indicators

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (7.1s)
  ✅ Test user created — userId=cmo0c9fy...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmo0c9gy... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=1216ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 49 passed, 36 warnings, 0 failed
  Total questions: 848 | Courses: 38 green, 2 yellow, 32 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 84 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 43 MCQ questions
  ✅ AP_PHYSICS_1 — 57 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 18 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 49 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 26 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 32 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MANAGEMENT — 7 MCQ questions
  ✅ CLEP_INTRODUCTORY_SOCIOLOGY — 7 MCQ questions
  ✅ CLEP_AMERICAN_GOVERNMENT — 5 MCQ questions
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ✅ CLEP_MICROECONOMICS — 5 MCQ questions
  ✅ CLEP_BIOLOGY — 13 MCQ questions
  ✅ CLEP_US_HISTORY_1 — 5 MCQ questions
  ✅ CLEP_US_HISTORY_2 — 5 MCQ questions
  ✅ CLEP_HUMAN_GROWTH_DEV — 5 MCQ questions
  ✅ CLEP_CALCULUS — 10 MCQ questions
  ✅ CLEP_CHEMISTRY — 5 MCQ questions
  ✅ CLEP_FINANCIAL_ACCOUNTING — 6 MCQ questions
  ✅ CLEP_AMERICAN_LITERATURE — 5 MCQ questions
  ✅ CLEP_ANALYZING_INTERPRETING_LIT — 5 MCQ questions
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — only 2 questions
  ⚠️ CLEP_ENGLISH_LITERATURE — only 3 questions
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ✅ CLEP_WESTERN_CIV_2 — 8 MCQ questions
  ✅ CLEP_COLLEGE_MATH — 8 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ DSST_PRINCIPLES_OF_SUPERVISION — 10 MCQ questions
  ✅ DSST_HUMAN_RESOURCE_MANAGEMENT — 8 MCQ questions
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 72/72 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 72/72 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.5.0 (2026-04-15)

**Deployed:** Wed, 15 Apr 2026 18:14:13 GMT
**Version:** 2.5.0

### Changes in this release
- feat: Beta 2.5 — DSST exam support, admin users dashboard, Stripe integration
- feat: admin Subscribers tab — premium user details + revenue dashboard
- feat: circuit breaker + reliability improvements for AI providers
- fix: prevent CF Workers timeout on CLEP question generation
- feat: MVP — uninterrupted CLEP questions with zero intervention
- fix: retry AI generation when bank is empty — prevent student interruption
- fix: increase seeding frequency and throughput for empty CLEP courses
- fix: prevent 500 error when CLEP course has 0 questions and AI gen fails
- fix: admin users can access all courses regardless of track
- feat: CLEP landing page — visual quality section with confidence indicators

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (5.9s)
  ✅ Test user created — userId=cmo0dda2...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmo0ddat... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=678ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 49 passed, 36 warnings, 0 failed
  Total questions: 848 | Courses: 38 green, 2 yellow, 32 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 84 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 43 MCQ questions
  ✅ AP_PHYSICS_1 — 57 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 18 MCQ questions
  ✅ AP_STATISTICS — 22 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 36 MCQ questions
  ✅ AP_US_HISTORY — 28 MCQ questions
  ✅ AP_PSYCHOLOGY — 34 MCQ questions
  ✅ SAT_MATH — 49 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 26 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 32 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MANAGEMENT — 7 MCQ questions
  ✅ CLEP_INTRODUCTORY_SOCIOLOGY — 7 MCQ questions
  ✅ CLEP_AMERICAN_GOVERNMENT — 5 MCQ questions
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ✅ CLEP_MICROECONOMICS — 5 MCQ questions
  ✅ CLEP_BIOLOGY — 13 MCQ questions
  ✅ CLEP_US_HISTORY_1 — 5 MCQ questions
  ✅ CLEP_US_HISTORY_2 — 5 MCQ questions
  ✅ CLEP_HUMAN_GROWTH_DEV — 5 MCQ questions
  ✅ CLEP_CALCULUS — 10 MCQ questions
  ✅ CLEP_CHEMISTRY — 5 MCQ questions
  ✅ CLEP_FINANCIAL_ACCOUNTING — 6 MCQ questions
  ✅ CLEP_AMERICAN_LITERATURE — 5 MCQ questions
  ✅ CLEP_ANALYZING_INTERPRETING_LIT — 5 MCQ questions
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — only 2 questions
  ⚠️ CLEP_ENGLISH_LITERATURE — only 3 questions
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ✅ CLEP_WESTERN_CIV_2 — 8 MCQ questions
  ✅ CLEP_COLLEGE_MATH — 8 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ DSST_PRINCIPLES_OF_SUPERVISION — 10 MCQ questions
  ✅ DSST_HUMAN_RESOURCE_MANAGEMENT — 8 MCQ questions
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ✅ AP World History: Modern FRQ — 5 questions
  ✅ AP Computer Science Principles FRQ — 6 questions
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 72/72 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 72/72 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.5.0 (2026-04-17)

**Deployed:** Fri, 17 Apr 2026 17:49:10 GMT
**Version:** 2.5.0

### Changes in this release
- Port A22.4 + A22.5 + A22.6 + retry-with-backoff + USH/STATS gen
- feat: AP US History + AP Statistics generation support
- feat: Beta 2.5 — DSST exam support, admin users dashboard, Stripe integration
- feat: admin Subscribers tab — premium user details + revenue dashboard
- feat: circuit breaker + reliability improvements for AI providers
- fix: prevent CF Workers timeout on CLEP question generation
- feat: MVP — uninterrupted CLEP questions with zero intervention
- fix: retry AI generation when bank is empty — prevent student interruption
- fix: increase seeding frequency and throughput for empty CLEP courses
- fix: prevent 500 error when CLEP course has 0 questions and AI gen fails

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (9.6s)
  ✅ Test user created — userId=cmo37cpm...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmo37cqk... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=210ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 49 passed, 36 warnings, 0 failed
  Total questions: 2578 | Courses: 40 green, 1 yellow, 31 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 535 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 271 MCQ questions
  ✅ AP_PHYSICS_1 — 285 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 18 MCQ questions
  ✅ AP_STATISTICS — 28 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 376 MCQ questions
  ✅ AP_US_HISTORY — 34 MCQ questions
  ✅ AP_PSYCHOLOGY — 508 MCQ questions
  ✅ SAT_MATH — 49 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 26 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 32 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MANAGEMENT — 7 MCQ questions
  ✅ CLEP_INTRODUCTORY_SOCIOLOGY — 7 MCQ questions
  ✅ CLEP_AMERICAN_GOVERNMENT — 5 MCQ questions
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ✅ CLEP_MICROECONOMICS — 5 MCQ questions
  ✅ CLEP_BIOLOGY — 13 MCQ questions
  ✅ CLEP_US_HISTORY_1 — 5 MCQ questions
  ✅ CLEP_US_HISTORY_2 — 5 MCQ questions
  ✅ CLEP_HUMAN_GROWTH_DEV — 5 MCQ questions
  ✅ CLEP_CALCULUS — 10 MCQ questions
  ✅ CLEP_CHEMISTRY — 5 MCQ questions
  ✅ CLEP_FINANCIAL_ACCOUNTING — 6 MCQ questions
  ✅ CLEP_AMERICAN_LITERATURE — 5 MCQ questions
  ✅ CLEP_ANALYZING_INTERPRETING_LIT — 5 MCQ questions
  ✅ CLEP_COLLEGE_COMP_MODULAR — 6 MCQ questions
  ✅ CLEP_ENGLISH_LITERATURE — 5 MCQ questions
  ⚠️ CLEP_HUMANITIES — only 2 questions
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ✅ CLEP_WESTERN_CIV_2 — 8 MCQ questions
  ✅ CLEP_COLLEGE_MATH — 8 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ DSST_PRINCIPLES_OF_SUPERVISION — 10 MCQ questions
  ✅ DSST_HUMAN_RESOURCE_MANAGEMENT — 8 MCQ questions
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ⚠️ AP World History: Modern FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Computer Science Principles FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 72/72 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 72/72 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.5.0 (2026-04-17)

**Deployed:** Fri, 17 Apr 2026 22:18:02 GMT
**Version:** 2.5.0

### Changes in this release
- fix: Sage system prompt — stale CLEP/DSST refs post-sunset
- feat: seed 15 USH + 8 STATS CB-grade hand-authored questions
- feat: per-course model override — route AP_US_HISTORY + AP_STATISTICS to Sonnet
- fix: add missing files for Scope B — exam-label.ts + ap-prep/[slug]/page.tsx
- feat: exam-module feature flags for landing, marketing, pricing, sidebar
- feat: CB content alignment — topicWeights + Sonnet bulk gen + apSkill/bloomLevel taxonomy
- Port A22.4 + A22.5 + A22.6 + retry-with-backoff + USH/STATS gen
- feat: AP US History + AP Statistics generation support
- feat: Beta 2.5 — DSST exam support, admin users dashboard, Stripe integration
- feat: admin Subscribers tab — premium user details + revenue dashboard

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.4s)
  ✅ Test user created — userId=cmo3gylo...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmo3gymp... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=1053ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 49 passed, 36 warnings, 0 failed
  Total questions: 2610 | Courses: 40 green, 1 yellow, 31 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 535 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 271 MCQ questions
  ✅ AP_PHYSICS_1 — 285 MCQ questions
  ✅ AP_CALCULUS_AB — 42 MCQ questions
  ✅ AP_CALCULUS_BC — 18 MCQ questions
  ✅ AP_STATISTICS — 41 MCQ questions
  ✅ AP_CHEMISTRY — 16 MCQ questions
  ✅ AP_BIOLOGY — 376 MCQ questions
  ✅ AP_US_HISTORY — 52 MCQ questions
  ✅ AP_PSYCHOLOGY — 508 MCQ questions
  ✅ SAT_MATH — 49 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 26 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 32 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MANAGEMENT — 7 MCQ questions
  ✅ CLEP_INTRODUCTORY_SOCIOLOGY — 7 MCQ questions
  ✅ CLEP_AMERICAN_GOVERNMENT — 5 MCQ questions
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ✅ CLEP_MICROECONOMICS — 5 MCQ questions
  ✅ CLEP_BIOLOGY — 13 MCQ questions
  ✅ CLEP_US_HISTORY_1 — 5 MCQ questions
  ✅ CLEP_US_HISTORY_2 — 5 MCQ questions
  ✅ CLEP_HUMAN_GROWTH_DEV — 5 MCQ questions
  ✅ CLEP_CALCULUS — 10 MCQ questions
  ✅ CLEP_CHEMISTRY — 5 MCQ questions
  ✅ CLEP_FINANCIAL_ACCOUNTING — 6 MCQ questions
  ✅ CLEP_AMERICAN_LITERATURE — 5 MCQ questions
  ✅ CLEP_ANALYZING_INTERPRETING_LIT — 5 MCQ questions
  ✅ CLEP_COLLEGE_COMP_MODULAR — 6 MCQ questions
  ✅ CLEP_ENGLISH_LITERATURE — 5 MCQ questions
  ⚠️ CLEP_HUMANITIES — only 3 questions
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ✅ CLEP_WESTERN_CIV_2 — 8 MCQ questions
  ✅ CLEP_COLLEGE_MATH — 8 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ DSST_PRINCIPLES_OF_SUPERVISION — 10 MCQ questions
  ✅ DSST_HUMAN_RESOURCE_MANAGEMENT — 8 MCQ questions
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ⚠️ AP World History: Modern FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Computer Science Principles FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 72/72 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 72/72 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.5.0 (2026-04-18)

**Deployed:** Sat, 18 Apr 2026 14:19:35 GMT
**Version:** 2.5.0

### Changes in this release
- feat: Am I Ready surfaced on StudentNest landing + nav
- revert: pages:build back to 'prisma generate' (remove --no-engine)
- fix: pages:build use prisma generate --no-engine (avoid DLL lock)
- feat: Am I Ready — free pre-signup readiness quiz for AP/SAT/ACT
- feat: Score Probability on dashboard + sidebar (Batch 3)
- feat: /api/readiness + score-engine-inputs loader (Batch 2)
- feat: AP/SAT/ACT score predictor (Batch 1 — engine + disclaimers)
- port: admin test-users tab from PrepLion + clean up misleading FRQ banner
- fix: StudentNest error leak — generic messages on 500s
- fix: billing polling — flip refreshing off before update() (StudentNest)

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — status=error — AI may be degraded
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.0s)
  ✅ Test user created — userId=cmo4fb6b...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmo4fb7d... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=868ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 49 passed, 36 warnings, 0 failed
  Total questions: 5007 | Courses: 40 green, 1 yellow, 31 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 535 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 500 MCQ questions
  ✅ AP_PHYSICS_1 — 545 MCQ questions
  ✅ AP_CALCULUS_AB — 455 MCQ questions
  ✅ AP_CALCULUS_BC — 498 MCQ questions
  ✅ AP_STATISTICS — 429 MCQ questions
  ✅ AP_CHEMISTRY — 342 MCQ questions
  ✅ AP_BIOLOGY — 483 MCQ questions
  ✅ AP_US_HISTORY — 246 MCQ questions
  ✅ AP_PSYCHOLOGY — 508 MCQ questions
  ✅ SAT_MATH — 49 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 26 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 32 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MANAGEMENT — 7 MCQ questions
  ✅ CLEP_INTRODUCTORY_SOCIOLOGY — 7 MCQ questions
  ✅ CLEP_AMERICAN_GOVERNMENT — 5 MCQ questions
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ✅ CLEP_MICROECONOMICS — 5 MCQ questions
  ✅ CLEP_BIOLOGY — 13 MCQ questions
  ✅ CLEP_US_HISTORY_1 — 5 MCQ questions
  ✅ CLEP_US_HISTORY_2 — 5 MCQ questions
  ✅ CLEP_HUMAN_GROWTH_DEV — 5 MCQ questions
  ✅ CLEP_CALCULUS — 10 MCQ questions
  ✅ CLEP_CHEMISTRY — 5 MCQ questions
  ✅ CLEP_FINANCIAL_ACCOUNTING — 6 MCQ questions
  ✅ CLEP_AMERICAN_LITERATURE — 5 MCQ questions
  ✅ CLEP_ANALYZING_INTERPRETING_LIT — 5 MCQ questions
  ✅ CLEP_COLLEGE_COMP_MODULAR — 6 MCQ questions
  ✅ CLEP_ENGLISH_LITERATURE — 5 MCQ questions
  ⚠️ CLEP_HUMANITIES — only 3 questions
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ✅ CLEP_WESTERN_CIV_2 — 8 MCQ questions
  ✅ CLEP_COLLEGE_MATH — 8 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ DSST_PRINCIPLES_OF_SUPERVISION — 10 MCQ questions
  ✅ DSST_HUMAN_RESOURCE_MANAGEMENT — 8 MCQ questions
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ⚠️ AP World History: Modern FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Computer Science Principles FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 72/72 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 72/72 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.5.0 (2026-04-18)

**Deployed:** Sat, 18 Apr 2026 15:09:46 GMT
**Version:** 2.5.0

### Changes in this release
- fix: logo on dashboard/sidebar routes to landing page
- feat: Am I Ready surfaced on StudentNest landing + nav
- revert: pages:build back to 'prisma generate' (remove --no-engine)
- fix: pages:build use prisma generate --no-engine (avoid DLL lock)
- feat: Am I Ready — free pre-signup readiness quiz for AP/SAT/ACT
- feat: Score Probability on dashboard + sidebar (Batch 3)
- feat: /api/readiness + score-engine-inputs loader (Batch 2)
- feat: AP/SAT/ACT score predictor (Batch 1 — engine + disclaimers)
- port: admin test-users tab from PrepLion + clean up misleading FRQ banner
- fix: StudentNest error leak — generic messages on 500s

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.6s)
  ✅ Test user created — userId=cmo4h3oa...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmo4h3pc... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=938ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 49 passed, 36 warnings, 0 failed
  Total questions: 5027 | Courses: 40 green, 1 yellow, 31 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 535 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 500 MCQ questions
  ✅ AP_PHYSICS_1 — 545 MCQ questions
  ✅ AP_CALCULUS_AB — 455 MCQ questions
  ✅ AP_CALCULUS_BC — 498 MCQ questions
  ✅ AP_STATISTICS — 429 MCQ questions
  ✅ AP_CHEMISTRY — 362 MCQ questions
  ✅ AP_BIOLOGY — 483 MCQ questions
  ✅ AP_US_HISTORY — 246 MCQ questions
  ✅ AP_PSYCHOLOGY — 508 MCQ questions
  ✅ SAT_MATH — 49 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 26 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 32 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MANAGEMENT — 7 MCQ questions
  ✅ CLEP_INTRODUCTORY_SOCIOLOGY — 7 MCQ questions
  ✅ CLEP_AMERICAN_GOVERNMENT — 5 MCQ questions
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ✅ CLEP_MICROECONOMICS — 5 MCQ questions
  ✅ CLEP_BIOLOGY — 13 MCQ questions
  ✅ CLEP_US_HISTORY_1 — 5 MCQ questions
  ✅ CLEP_US_HISTORY_2 — 5 MCQ questions
  ✅ CLEP_HUMAN_GROWTH_DEV — 5 MCQ questions
  ✅ CLEP_CALCULUS — 10 MCQ questions
  ✅ CLEP_CHEMISTRY — 5 MCQ questions
  ✅ CLEP_FINANCIAL_ACCOUNTING — 6 MCQ questions
  ✅ CLEP_AMERICAN_LITERATURE — 5 MCQ questions
  ✅ CLEP_ANALYZING_INTERPRETING_LIT — 5 MCQ questions
  ✅ CLEP_COLLEGE_COMP_MODULAR — 6 MCQ questions
  ✅ CLEP_ENGLISH_LITERATURE — 5 MCQ questions
  ⚠️ CLEP_HUMANITIES — only 3 questions
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ✅ CLEP_WESTERN_CIV_2 — 8 MCQ questions
  ✅ CLEP_COLLEGE_MATH — 8 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ DSST_PRINCIPLES_OF_SUPERVISION — 10 MCQ questions
  ✅ DSST_HUMAN_RESOURCE_MANAGEMENT — 8 MCQ questions
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ⚠️ AP World History: Modern FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Computer Science Principles FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 72/72 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 72/72 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.5.0 (2026-04-18)

**Deployed:** Sat, 18 Apr 2026 15:19:35 GMT
**Version:** 2.5.0

### Changes in this release
- fix: reset-test-users fully clears onboarding so QA can re-walk flow
- fix: bump SW cache version v3→v4 to purge broken-Prisma cached responses
- fix: logo on dashboard/sidebar routes to landing page
- feat: Am I Ready surfaced on StudentNest landing + nav
- revert: pages:build back to 'prisma generate' (remove --no-engine)
- fix: pages:build use prisma generate --no-engine (avoid DLL lock)
- feat: Am I Ready — free pre-signup readiness quiz for AP/SAT/ACT
- feat: Score Probability on dashboard + sidebar (Batch 3)
- feat: /api/readiness + score-engine-inputs loader (Batch 2)
- feat: AP/SAT/ACT score predictor (Batch 1 — engine + disclaimers)

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (5.7s)
  ✅ Test user created — userId=cmo4hgc0...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmo4hgcq... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=1098ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 49 passed, 36 warnings, 0 failed
  Total questions: 5027 | Courses: 40 green, 1 yellow, 31 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 535 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 500 MCQ questions
  ✅ AP_PHYSICS_1 — 545 MCQ questions
  ✅ AP_CALCULUS_AB — 455 MCQ questions
  ✅ AP_CALCULUS_BC — 498 MCQ questions
  ✅ AP_STATISTICS — 429 MCQ questions
  ✅ AP_CHEMISTRY — 362 MCQ questions
  ✅ AP_BIOLOGY — 483 MCQ questions
  ✅ AP_US_HISTORY — 246 MCQ questions
  ✅ AP_PSYCHOLOGY — 508 MCQ questions
  ✅ SAT_MATH — 49 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 26 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 32 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MANAGEMENT — 7 MCQ questions
  ✅ CLEP_INTRODUCTORY_SOCIOLOGY — 7 MCQ questions
  ✅ CLEP_AMERICAN_GOVERNMENT — 5 MCQ questions
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ✅ CLEP_MICROECONOMICS — 5 MCQ questions
  ✅ CLEP_BIOLOGY — 13 MCQ questions
  ✅ CLEP_US_HISTORY_1 — 5 MCQ questions
  ✅ CLEP_US_HISTORY_2 — 5 MCQ questions
  ✅ CLEP_HUMAN_GROWTH_DEV — 5 MCQ questions
  ✅ CLEP_CALCULUS — 10 MCQ questions
  ✅ CLEP_CHEMISTRY — 5 MCQ questions
  ✅ CLEP_FINANCIAL_ACCOUNTING — 6 MCQ questions
  ✅ CLEP_AMERICAN_LITERATURE — 5 MCQ questions
  ✅ CLEP_ANALYZING_INTERPRETING_LIT — 5 MCQ questions
  ✅ CLEP_COLLEGE_COMP_MODULAR — 6 MCQ questions
  ✅ CLEP_ENGLISH_LITERATURE — 5 MCQ questions
  ⚠️ CLEP_HUMANITIES — only 3 questions
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ✅ CLEP_WESTERN_CIV_2 — 8 MCQ questions
  ✅ CLEP_COLLEGE_MATH — 8 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ DSST_PRINCIPLES_OF_SUPERVISION — 10 MCQ questions
  ✅ DSST_HUMAN_RESOURCE_MANAGEMENT — 8 MCQ questions
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ⚠️ AP World History: Modern FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Computer Science Principles FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 72/72 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 72/72 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v2.5.0 (2026-04-18)

**Deployed:** Sat, 18 Apr 2026 16:20:23 GMT
**Version:** 2.5.0

### Changes in this release
- feat: full-screen exam mode for Diagnostic / Mock Exam / Sage (PrepLion parity)
- fix: _routes.json excludes static public files from worker
- fix: reset-test-users fully clears onboarding so QA can re-walk flow
- fix: bump SW cache version v3→v4 to purge broken-Prisma cached responses
- fix: logo on dashboard/sidebar routes to landing page
- feat: Am I Ready surfaced on StudentNest landing + nav
- revert: pages:build back to 'prisma generate' (remove --no-engine)
- fix: pages:build use prisma generate --no-engine (avoid DLL lock)
- feat: Am I Ready — free pre-signup readiness quiz for AP/SAT/ACT
- feat: Score Probability on dashboard + sidebar (Batch 3)

### Automated smoke tests
```
Smoke tests: 14 passed, 1 warnings, 0 failed
  ✅ GET /
  ✅ GET /pricing
  ✅ GET /about
  ✅ GET /login
  ✅ GET /register
  ⚠️ GET /api/ai/status — status=error — AI may be degraded
  ✅ GET /api/feature-flags
  ✅ POST /api/practice
  ✅ POST /api/ai/tutor/knowledge-check
  ✅ GET /api/analytics
  ✅ GET /api/user
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.6s)
  ✅ Test user created — userId=cmo4jmg1...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmo4jmh3... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=251ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200, 1 retried
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 49 passed, 36 warnings, 0 failed
  Total questions: 5070 | Courses: 40 green, 1 yellow, 31 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 535 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 500 MCQ questions
  ✅ AP_PHYSICS_1 — 545 MCQ questions
  ✅ AP_CALCULUS_AB — 455 MCQ questions
  ✅ AP_CALCULUS_BC — 498 MCQ questions
  ✅ AP_STATISTICS — 429 MCQ questions
  ✅ AP_CHEMISTRY — 405 MCQ questions
  ✅ AP_BIOLOGY — 483 MCQ questions
  ✅ AP_US_HISTORY — 246 MCQ questions
  ✅ AP_PSYCHOLOGY — 508 MCQ questions
  ✅ SAT_MATH — 49 MCQ questions
  ✅ SAT_READING_WRITING — 40 MCQ questions
  ✅ ACT_MATH — 40 MCQ questions
  ✅ ACT_ENGLISH — 26 MCQ questions
  ✅ ACT_SCIENCE — 26 MCQ questions
  ✅ ACT_READING — 32 MCQ questions
  ✅ CLEP_COLLEGE_ALGEBRA — 17 MCQ questions
  ✅ CLEP_COLLEGE_COMPOSITION — 16 MCQ questions
  ✅ CLEP_INTRO_PSYCHOLOGY — 20 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MARKETING — 32 MCQ questions
  ✅ CLEP_PRINCIPLES_OF_MANAGEMENT — 7 MCQ questions
  ✅ CLEP_INTRODUCTORY_SOCIOLOGY — 7 MCQ questions
  ✅ CLEP_AMERICAN_GOVERNMENT — 5 MCQ questions
  ✅ CLEP_MACROECONOMICS — 10 MCQ questions
  ✅ CLEP_MICROECONOMICS — 5 MCQ questions
  ✅ CLEP_BIOLOGY — 13 MCQ questions
  ✅ CLEP_US_HISTORY_1 — 5 MCQ questions
  ✅ CLEP_US_HISTORY_2 — 5 MCQ questions
  ✅ CLEP_HUMAN_GROWTH_DEV — 5 MCQ questions
  ✅ CLEP_CALCULUS — 10 MCQ questions
  ✅ CLEP_CHEMISTRY — 5 MCQ questions
  ✅ CLEP_FINANCIAL_ACCOUNTING — 6 MCQ questions
  ✅ CLEP_AMERICAN_LITERATURE — 5 MCQ questions
  ✅ CLEP_ANALYZING_INTERPRETING_LIT — 5 MCQ questions
  ✅ CLEP_COLLEGE_COMP_MODULAR — 6 MCQ questions
  ✅ CLEP_ENGLISH_LITERATURE — 5 MCQ questions
  ⚠️ CLEP_HUMANITIES — only 3 questions
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ✅ CLEP_WESTERN_CIV_2 — 8 MCQ questions
  ✅ CLEP_COLLEGE_MATH — 8 MCQ questions
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ✅ DSST_PRINCIPLES_OF_SUPERVISION — 10 MCQ questions
  ✅ DSST_HUMAN_RESOURCE_MANAGEMENT — 8 MCQ questions
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ⚠️ AP World History: Modern FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Computer Science Principles FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Calculus AB FRQ — 9 questions
  ✅ AP Calculus BC FRQ — 1 questions
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ✅ AP Chemistry FRQ — 1 questions
  ✅ AP Biology FRQ — 2 questions
  ✅ AP US History FRQ — 6 questions
  ✅ AP Psychology FRQ — 8 questions
  ✅ Analytics API — 72/72 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 72/72 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v6.0.0 (2026-04-22)

**Deployed:** Wed, 22 Apr 2026 23:24:32 GMT
**Version:** 6.0.0

### Changes in this release
- Playwright E2E foundation + /warmup redirect shim (caught by E2E test)
- Pre-release check: block deploys with PrepLion branding in user copy
- Hotfixes from user session report 2026-04-22
- Admin-toggleable knowledge-check feature flag
- 3 conversion levers — diagnostic paywall + daily Q cap + mock partial lock
- Coach-funnel updateMany->raw SQL fix + full-screen for 3 pages + mobile exit
- Hotfix: /warmup 404 + KaTeX math rendering for all MCQ stimuli
- Visual stimulus Phase 1 — extend Wikipedia image fetch to 3 more courses
- Beta 6.0 QA — comprehensive test plan + About release notes + visual-stimulus plan
- Mobile bottom-nav tabs — port from PrepLion

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (10.5s)
  ✅ Test user created — userId=cmoaoj7e...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmoaoj8b... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=1108ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 23 passed, 72 warnings, 0 failed
  Total questions: 9264 | Courses: 20 green, 0 yellow, 57 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 526 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 500 MCQ questions
  ✅ AP_PHYSICS_1 — 502 MCQ questions
  ✅ AP_CALCULUS_AB — 500 MCQ questions
  ✅ AP_CALCULUS_BC — 497 MCQ questions
  ✅ AP_STATISTICS — 500 MCQ questions
  ✅ AP_CHEMISTRY — 500 MCQ questions
  ✅ AP_BIOLOGY — 500 MCQ questions
  ✅ AP_US_HISTORY — 499 MCQ questions
  ✅ AP_PSYCHOLOGY — 500 MCQ questions
  ✅ AP_HUMAN_GEOGRAPHY — 500 MCQ questions
  ✅ AP_US_GOVERNMENT — 129 MCQ questions
  ✅ AP_ENVIRONMENTAL_SCIENCE — 501 MCQ questions
  ✅ AP_PRECALCULUS — 117 MCQ questions
  ⚠️ AP_ENGLISH_LANGUAGE — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 500 MCQ questions
  ✅ SAT_READING_WRITING — 500 MCQ questions
  ✅ ACT_MATH — 498 MCQ questions
  ✅ ACT_ENGLISH — 497 MCQ questions
  ✅ ACT_SCIENCE — 499 MCQ questions
  ✅ ACT_READING — 499 MCQ questions
  ⚠️ CLEP_COLLEGE_ALGEBRA — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_SUPERVISION — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_RESOURCE_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ⚠️ AP World History: Modern FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Computer Science Principles FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Calculus AB FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Calculus BC FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Chemistry FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Biology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP US History FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Human Geography FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP U.S. Government and Politics FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Environmental Science FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Precalculus FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP English Language and Composition FRQ — 0 FRQ questions — AI will generate on first session
  ✅ Analytics API — 77/77 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 77/77 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v6.0.0 (2026-04-22)

**Deployed:** Wed, 22 Apr 2026 23:39:40 GMT
**Version:** 6.0.0

### Changes in this release
- Admin location tracking on Recent Signups + Users tab
- Playwright E2E foundation + /warmup redirect shim (caught by E2E test)
- Pre-release check: block deploys with PrepLion branding in user copy
- Hotfixes from user session report 2026-04-22
- Admin-toggleable knowledge-check feature flag
- 3 conversion levers — diagnostic paywall + daily Q cap + mock partial lock
- Coach-funnel updateMany->raw SQL fix + full-screen for 3 pages + mobile exit
- Hotfix: /warmup 404 + KaTeX math rendering for all MCQ stimuli
- Visual stimulus Phase 1 — extend Wikipedia image fetch to 3 more courses
- Beta 6.0 QA — comprehensive test plan + About release notes + visual-stimulus plan

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (5.8s)
  ✅ Test user created — userId=cmoaok5k...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmoap2w8... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=1194ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 23 passed, 72 warnings, 0 failed
  Total questions: 9264 | Courses: 20 green, 0 yellow, 57 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 526 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 500 MCQ questions
  ✅ AP_PHYSICS_1 — 502 MCQ questions
  ✅ AP_CALCULUS_AB — 500 MCQ questions
  ✅ AP_CALCULUS_BC — 497 MCQ questions
  ✅ AP_STATISTICS — 500 MCQ questions
  ✅ AP_CHEMISTRY — 500 MCQ questions
  ✅ AP_BIOLOGY — 500 MCQ questions
  ✅ AP_US_HISTORY — 499 MCQ questions
  ✅ AP_PSYCHOLOGY — 500 MCQ questions
  ✅ AP_HUMAN_GEOGRAPHY — 500 MCQ questions
  ✅ AP_US_GOVERNMENT — 129 MCQ questions
  ✅ AP_ENVIRONMENTAL_SCIENCE — 501 MCQ questions
  ✅ AP_PRECALCULUS — 117 MCQ questions
  ⚠️ AP_ENGLISH_LANGUAGE — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 500 MCQ questions
  ✅ SAT_READING_WRITING — 500 MCQ questions
  ✅ ACT_MATH — 498 MCQ questions
  ✅ ACT_ENGLISH — 497 MCQ questions
  ✅ ACT_SCIENCE — 499 MCQ questions
  ✅ ACT_READING — 499 MCQ questions
  ⚠️ CLEP_COLLEGE_ALGEBRA — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_SUPERVISION — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_RESOURCE_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ⚠️ AP World History: Modern FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Computer Science Principles FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Calculus AB FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Calculus BC FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Chemistry FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Biology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP US History FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Human Geography FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP U.S. Government and Politics FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Environmental Science FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Precalculus FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP English Language and Composition FRQ — 0 FRQ questions — AI will generate on first session
  ✅ Analytics API — 77/77 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 77/77 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v6.0.0 (2026-04-23)

**Deployed:** Thu, 23 Apr 2026 00:13:54 GMT
**Version:** 6.0.0

### Changes in this release
- Pass probability → native-scale predicted score (Phase 1+2)
- Admin location tracking on Recent Signups + Users tab
- Playwright E2E foundation + /warmup redirect shim (caught by E2E test)
- Pre-release check: block deploys with PrepLion branding in user copy
- Hotfixes from user session report 2026-04-22
- Admin-toggleable knowledge-check feature flag
- 3 conversion levers — diagnostic paywall + daily Q cap + mock partial lock
- Coach-funnel updateMany->raw SQL fix + full-screen for 3 pages + mobile exit
- Hotfix: /warmup 404 + KaTeX math rendering for all MCQ stimuli
- Visual stimulus Phase 1 — extend Wikipedia image fetch to 3 more courses

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.6s)
  ✅ Test user created — userId=cmoaqat7...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmoaqau1... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=1040ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 23 passed, 72 warnings, 0 failed
  Total questions: 9264 | Courses: 20 green, 0 yellow, 57 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 526 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 500 MCQ questions
  ✅ AP_PHYSICS_1 — 502 MCQ questions
  ✅ AP_CALCULUS_AB — 500 MCQ questions
  ✅ AP_CALCULUS_BC — 497 MCQ questions
  ✅ AP_STATISTICS — 500 MCQ questions
  ✅ AP_CHEMISTRY — 500 MCQ questions
  ✅ AP_BIOLOGY — 500 MCQ questions
  ✅ AP_US_HISTORY — 499 MCQ questions
  ✅ AP_PSYCHOLOGY — 500 MCQ questions
  ✅ AP_HUMAN_GEOGRAPHY — 500 MCQ questions
  ✅ AP_US_GOVERNMENT — 129 MCQ questions
  ✅ AP_ENVIRONMENTAL_SCIENCE — 501 MCQ questions
  ✅ AP_PRECALCULUS — 117 MCQ questions
  ⚠️ AP_ENGLISH_LANGUAGE — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 500 MCQ questions
  ✅ SAT_READING_WRITING — 500 MCQ questions
  ✅ ACT_MATH — 498 MCQ questions
  ✅ ACT_ENGLISH — 497 MCQ questions
  ✅ ACT_SCIENCE — 499 MCQ questions
  ✅ ACT_READING — 499 MCQ questions
  ⚠️ CLEP_COLLEGE_ALGEBRA — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_SUPERVISION — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_RESOURCE_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ⚠️ AP World History: Modern FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Computer Science Principles FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Calculus AB FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Calculus BC FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Chemistry FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Biology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP US History FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Human Geography FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP U.S. Government and Politics FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Environmental Science FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Precalculus FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP English Language and Composition FRQ — 0 FRQ questions — AI will generate on first session
  ✅ Analytics API — 77/77 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 77/77 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v6.0.0 (2026-04-23)

**Deployed:** Thu, 23 Apr 2026 00:31:41 GMT
**Version:** 6.0.0

### Changes in this release
- Option B tier-limits consolidation + LockedValueCard wire-up
- Dashboard v2 — collapse 9 cards to 5 blocks
- Pass probability → native-scale predicted score (Phase 1+2)
- Admin location tracking on Recent Signups + Users tab
- Playwright E2E foundation + /warmup redirect shim (caught by E2E test)
- Pre-release check: block deploys with PrepLion branding in user copy
- Hotfixes from user session report 2026-04-22
- Admin-toggleable knowledge-check feature flag
- 3 conversion levers — diagnostic paywall + daily Q cap + mock partial lock
- Coach-funnel updateMany->raw SQL fix + full-screen for 3 pages + mobile exit

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.7s)
  ✅ Test user created — userId=cmoaqxp3...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmoaqxq5... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=1285ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 23 passed, 72 warnings, 0 failed
  Total questions: 9264 | Courses: 20 green, 0 yellow, 57 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 526 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 500 MCQ questions
  ✅ AP_PHYSICS_1 — 502 MCQ questions
  ✅ AP_CALCULUS_AB — 500 MCQ questions
  ✅ AP_CALCULUS_BC — 497 MCQ questions
  ✅ AP_STATISTICS — 500 MCQ questions
  ✅ AP_CHEMISTRY — 500 MCQ questions
  ✅ AP_BIOLOGY — 500 MCQ questions
  ✅ AP_US_HISTORY — 499 MCQ questions
  ✅ AP_PSYCHOLOGY — 500 MCQ questions
  ✅ AP_HUMAN_GEOGRAPHY — 500 MCQ questions
  ✅ AP_US_GOVERNMENT — 129 MCQ questions
  ✅ AP_ENVIRONMENTAL_SCIENCE — 501 MCQ questions
  ✅ AP_PRECALCULUS — 117 MCQ questions
  ⚠️ AP_ENGLISH_LANGUAGE — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 500 MCQ questions
  ✅ SAT_READING_WRITING — 500 MCQ questions
  ✅ ACT_MATH — 498 MCQ questions
  ✅ ACT_ENGLISH — 497 MCQ questions
  ✅ ACT_SCIENCE — 499 MCQ questions
  ✅ ACT_READING — 499 MCQ questions
  ⚠️ CLEP_COLLEGE_ALGEBRA — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_SUPERVISION — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_RESOURCE_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ⚠️ AP World History: Modern FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Computer Science Principles FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Calculus AB FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Calculus BC FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Chemistry FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Biology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP US History FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Human Geography FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP U.S. Government and Politics FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Environmental Science FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Precalculus FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP English Language and Composition FRQ — 0 FRQ questions — AI will generate on first session
  ✅ Analytics API — 77/77 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 77/77 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v6.0.0 (2026-04-23)

**Deployed:** Thu, 23 Apr 2026 00:40:03 GMT
**Version:** 6.0.0

### Changes in this release
- Conversion loop polish — score delta, confetti, time-to-pass, weakness split
- Option B tier-limits consolidation + LockedValueCard wire-up
- Dashboard v2 — collapse 9 cards to 5 blocks
- Pass probability → native-scale predicted score (Phase 1+2)
- Admin location tracking on Recent Signups + Users tab
- Playwright E2E foundation + /warmup redirect shim (caught by E2E test)
- Pre-release check: block deploys with PrepLion branding in user copy
- Hotfixes from user session report 2026-04-22
- Admin-toggleable knowledge-check feature flag
- 3 conversion levers — diagnostic paywall + daily Q cap + mock partial lock

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (7.3s)
  ✅ Test user created — userId=cmoar8fz...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmoar8h9... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=927ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 23 passed, 72 warnings, 0 failed
  Total questions: 9264 | Courses: 20 green, 0 yellow, 57 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 526 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 500 MCQ questions
  ✅ AP_PHYSICS_1 — 502 MCQ questions
  ✅ AP_CALCULUS_AB — 500 MCQ questions
  ✅ AP_CALCULUS_BC — 497 MCQ questions
  ✅ AP_STATISTICS — 500 MCQ questions
  ✅ AP_CHEMISTRY — 500 MCQ questions
  ✅ AP_BIOLOGY — 500 MCQ questions
  ✅ AP_US_HISTORY — 499 MCQ questions
  ✅ AP_PSYCHOLOGY — 500 MCQ questions
  ✅ AP_HUMAN_GEOGRAPHY — 500 MCQ questions
  ✅ AP_US_GOVERNMENT — 129 MCQ questions
  ✅ AP_ENVIRONMENTAL_SCIENCE — 501 MCQ questions
  ✅ AP_PRECALCULUS — 117 MCQ questions
  ⚠️ AP_ENGLISH_LANGUAGE — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 500 MCQ questions
  ✅ SAT_READING_WRITING — 500 MCQ questions
  ✅ ACT_MATH — 498 MCQ questions
  ✅ ACT_ENGLISH — 497 MCQ questions
  ✅ ACT_SCIENCE — 499 MCQ questions
  ✅ ACT_READING — 499 MCQ questions
  ⚠️ CLEP_COLLEGE_ALGEBRA — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_SUPERVISION — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_RESOURCE_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ⚠️ AP World History: Modern FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Computer Science Principles FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Calculus AB FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Calculus BC FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Chemistry FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Biology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP US History FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Human Geography FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP U.S. Government and Politics FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Environmental Science FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Precalculus FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP English Language and Composition FRQ — 0 FRQ questions — AI will generate on first session
  ✅ Analytics API — 77/77 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 77/77 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v6.0.0 (2026-04-23)

**Deployed:** Thu, 23 Apr 2026 04:49:03 GMT
**Version:** 6.0.0

### Changes in this release
- Equivalent-distractor bug fix — 3-layer defense
- Conversion loop polish — score delta, confetti, time-to-pass, weakness split
- Option B tier-limits consolidation + LockedValueCard wire-up
- Dashboard v2 — collapse 9 cards to 5 blocks
- Pass probability → native-scale predicted score (Phase 1+2)
- Admin location tracking on Recent Signups + Users tab
- Playwright E2E foundation + /warmup redirect shim (caught by E2E test)
- Pre-release check: block deploys with PrepLion branding in user copy
- Hotfixes from user session report 2026-04-22
- Admin-toggleable knowledge-check feature flag

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.4s)
  ✅ Test user created — userId=cmob04ow...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmob04pt... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=981ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 23 passed, 72 warnings, 0 failed
  Total questions: 9260 | Courses: 20 green, 0 yellow, 57 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 530 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 500 MCQ questions
  ✅ AP_PHYSICS_1 — 501 MCQ questions
  ✅ AP_CALCULUS_AB — 500 MCQ questions
  ✅ AP_CALCULUS_BC — 497 MCQ questions
  ✅ AP_STATISTICS — 500 MCQ questions
  ✅ AP_CHEMISTRY — 500 MCQ questions
  ✅ AP_BIOLOGY — 499 MCQ questions
  ✅ AP_US_HISTORY — 499 MCQ questions
  ✅ AP_PSYCHOLOGY — 500 MCQ questions
  ✅ AP_HUMAN_GEOGRAPHY — 500 MCQ questions
  ✅ AP_US_GOVERNMENT — 129 MCQ questions
  ✅ AP_ENVIRONMENTAL_SCIENCE — 501 MCQ questions
  ✅ AP_PRECALCULUS — 117 MCQ questions
  ⚠️ AP_ENGLISH_LANGUAGE — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 497 MCQ questions
  ✅ SAT_READING_WRITING — 500 MCQ questions
  ✅ ACT_MATH — 495 MCQ questions
  ✅ ACT_ENGLISH — 497 MCQ questions
  ✅ ACT_SCIENCE — 499 MCQ questions
  ✅ ACT_READING — 499 MCQ questions
  ⚠️ CLEP_COLLEGE_ALGEBRA — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_SUPERVISION — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_RESOURCE_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ⚠️ AP World History: Modern FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Computer Science Principles FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Calculus AB FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Calculus BC FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Chemistry FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Biology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP US History FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Human Geography FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP U.S. Government and Politics FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Environmental Science FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Precalculus FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP English Language and Composition FRQ — 0 FRQ questions — AI will generate on first session
  ✅ Analytics API — 77/77 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 77/77 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v6.0.0 (2026-04-23)

**Deployed:** Thu, 23 Apr 2026 05:00:34 GMT
**Version:** 6.0.0

### Changes in this release
- Flashcards v1 — SM-2 spaced repetition + 1500 seeded cards
- Expose AP Human Geography + AP Environmental Science to students
- Equivalent-distractor bug fix — 3-layer defense
- Conversion loop polish — score delta, confetti, time-to-pass, weakness split
- Option B tier-limits consolidation + LockedValueCard wire-up
- Dashboard v2 — collapse 9 cards to 5 blocks
- Pass probability → native-scale predicted score (Phase 1+2)
- Admin location tracking on Recent Signups + Users tab
- Playwright E2E foundation + /warmup redirect shim (caught by E2E test)
- Pre-release check: block deploys with PrepLion branding in user copy

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (5.3s)
  ✅ Test user created — userId=cmob0jii...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmob0jj4... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=1048ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 23 passed, 72 warnings, 0 failed
  Total questions: 9360 | Courses: 20 green, 0 yellow, 57 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 530 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 500 MCQ questions
  ✅ AP_PHYSICS_1 — 501 MCQ questions
  ✅ AP_CALCULUS_AB — 500 MCQ questions
  ✅ AP_CALCULUS_BC — 497 MCQ questions
  ✅ AP_STATISTICS — 500 MCQ questions
  ✅ AP_CHEMISTRY — 500 MCQ questions
  ✅ AP_BIOLOGY — 499 MCQ questions
  ✅ AP_US_HISTORY — 499 MCQ questions
  ✅ AP_PSYCHOLOGY — 500 MCQ questions
  ✅ AP_HUMAN_GEOGRAPHY — 500 MCQ questions
  ✅ AP_US_GOVERNMENT — 179 MCQ questions
  ✅ AP_ENVIRONMENTAL_SCIENCE — 501 MCQ questions
  ✅ AP_PRECALCULUS — 167 MCQ questions
  ⚠️ AP_ENGLISH_LANGUAGE — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 497 MCQ questions
  ✅ SAT_READING_WRITING — 500 MCQ questions
  ✅ ACT_MATH — 495 MCQ questions
  ✅ ACT_ENGLISH — 497 MCQ questions
  ✅ ACT_SCIENCE — 499 MCQ questions
  ✅ ACT_READING — 499 MCQ questions
  ⚠️ CLEP_COLLEGE_ALGEBRA — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_SUPERVISION — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_RESOURCE_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ⚠️ AP World History: Modern FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Computer Science Principles FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Calculus AB FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Calculus BC FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Chemistry FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Biology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP US History FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Human Geography FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP U.S. Government and Politics FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Environmental Science FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Precalculus FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP English Language and Composition FRQ — 0 FRQ questions — AI will generate on first session
  ✅ Analytics API — 77/77 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 77/77 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

## Release Log — v6.0.0 (2026-04-23)

**Deployed:** Thu, 23 Apr 2026 05:30:24 GMT
**Version:** 6.0.0

### Changes in this release
- Lower visibility threshold 500 → 300+; expose USGov + Precalc
- Comprehensive E2E test suite — public + authed flows
- Add Playwright E2E as hard gate in pages:deploy
- Flashcards v1 — SM-2 spaced repetition + 1500 seeded cards
- Expose AP Human Geography + AP Environmental Science to students
- Equivalent-distractor bug fix — 3-layer defense
- Conversion loop polish — score delta, confetti, time-to-pass, weakness split
- Option B tier-limits consolidation + LockedValueCard wire-up
- Dashboard v2 — collapse 9 cards to 5 blocks
- Pass probability → native-scale predicted score (Phase 1+2)

### Automated smoke tests
```
Smoke tests: 15 passed, 0 warnings, 0 failed
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
  ✅ Feature flags latency
  ✅ Analytics latency
  ✅ Study plan latency
  ✅ POST /api/ai/tutor/knowledge-check (bad input)
```

### Functional tests (authenticated regression suite)
```
Functional tests: 13 passed, 1 warnings, 0 failed (6.4s)
  ✅ Test user created — userId=cmob0zhr...
  ✅ A1. User profile — track=ap
  ✅ A2a. Create practice session — sessionId=cmob1jhp... 3 questions
  ✅ A2b. Submit answer — isCorrect=false, explanation=1139ch
  ✅ A2c. Complete session — accuracy=0%, xp=0
  ✅ A3. Analytics — totalAnswered=1, mastery units=9
  ✅ A4. Study Plan GET — plan=null (expected for new user)
  ✅ A5. Auth guards — unauthenticated requests correctly blocked
  ⚠️ B1. AI Tutor — answer too short or missing
  ✅ B2. Knowledge Check gen — 1 question(s) generated
  ✅ B3. Knowledge Check submit — score=1/1
  ✅ C1. Multi-course analytics — 5/5 courses returned 200
  ✅ C2. Multi-course study plan — 4/4 courses returned 200
  ✅ C3. Invalid course rejected — analytics returned 400
```

### Integration tests (practice coverage — all 50 courses)
```
Integration tests: 23 passed, 72 warnings, 0 failed
  Total questions: 9960 | Courses: 20 green, 0 yellow, 57 red
  ✅ AI generation enabled — students will get questions even for thin courses
  ✅ AP_WORLD_HISTORY — 530 MCQ questions
  ✅ AP_COMPUTER_SCIENCE_PRINCIPLES — 500 MCQ questions
  ✅ AP_PHYSICS_1 — 501 MCQ questions
  ✅ AP_CALCULUS_AB — 500 MCQ questions
  ✅ AP_CALCULUS_BC — 497 MCQ questions
  ✅ AP_STATISTICS — 500 MCQ questions
  ✅ AP_CHEMISTRY — 500 MCQ questions
  ✅ AP_BIOLOGY — 499 MCQ questions
  ✅ AP_US_HISTORY — 499 MCQ questions
  ✅ AP_PSYCHOLOGY — 500 MCQ questions
  ✅ AP_HUMAN_GEOGRAPHY — 500 MCQ questions
  ✅ AP_US_GOVERNMENT — 479 MCQ questions
  ✅ AP_ENVIRONMENTAL_SCIENCE — 501 MCQ questions
  ✅ AP_PRECALCULUS — 467 MCQ questions
  ⚠️ AP_ENGLISH_LANGUAGE — 0 questions — AI will generate on first session
  ✅ SAT_MATH — 497 MCQ questions
  ✅ SAT_READING_WRITING — 500 MCQ questions
  ✅ ACT_MATH — 495 MCQ questions
  ✅ ACT_ENGLISH — 497 MCQ questions
  ✅ ACT_SCIENCE — 499 MCQ questions
  ✅ ACT_READING — 499 MCQ questions
  ⚠️ CLEP_COLLEGE_ALGEBRA — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMPOSITION — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRO_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MARKETING — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRINCIPLES_OF_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_INTRODUCTORY_SOCIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_GOVERNMENT — 0 questions — AI will generate on first session
  ⚠️ CLEP_MACROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_MICROECONOMICS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BIOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_US_HISTORY_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMAN_GROWTH_DEV — 0 questions — AI will generate on first session
  ⚠️ CLEP_CALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_CHEMISTRY — 0 questions — AI will generate on first session
  ⚠️ CLEP_FINANCIAL_ACCOUNTING — 0 questions — AI will generate on first session
  ⚠️ CLEP_AMERICAN_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_ANALYZING_INTERPRETING_LIT — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_COMP_MODULAR — 0 questions — AI will generate on first session
  ⚠️ CLEP_ENGLISH_LITERATURE — 0 questions — AI will generate on first session
  ⚠️ CLEP_HUMANITIES — 0 questions — AI will generate on first session
  ⚠️ CLEP_FRENCH — 0 questions — AI will generate on first session
  ⚠️ CLEP_GERMAN — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH — 0 questions — AI will generate on first session
  ⚠️ CLEP_SPANISH_WRITING — 0 questions — AI will generate on first session
  ⚠️ CLEP_EDUCATIONAL_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ CLEP_SOCIAL_SCIENCES_HISTORY — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_1 — 0 questions — AI will generate on first session
  ⚠️ CLEP_WESTERN_CIV_2 — 0 questions — AI will generate on first session
  ⚠️ CLEP_COLLEGE_MATH — 0 questions — AI will generate on first session
  ⚠️ CLEP_NATURAL_SCIENCES — 0 questions — AI will generate on first session
  ⚠️ CLEP_PRECALCULUS — 0 questions — AI will generate on first session
  ⚠️ CLEP_INFORMATION_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ CLEP_BUSINESS_LAW — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_SUPERVISION — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_RESOURCE_MANAGEMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ORGANIZATIONAL_BEHAVIOR — 0 questions — AI will generate on first session
  ⚠️ DSST_PERSONAL_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_LIFESPAN_DEV_PSYCHOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_INTRO_TO_BUSINESS — 0 questions — AI will generate on first session
  ⚠️ DSST_HUMAN_DEVELOPMENT — 0 questions — AI will generate on first session
  ⚠️ DSST_ETHICS_IN_AMERICA — 0 questions — AI will generate on first session
  ⚠️ DSST_ENVIRONMENTAL_SCIENCE — 0 questions — AI will generate on first session
  ⚠️ DSST_TECHNICAL_WRITING — 0 questions — AI will generate on first session
  ⚠️ DSST_PRINCIPLES_OF_FINANCE — 0 questions — AI will generate on first session
  ⚠️ DSST_MANAGEMENT_INFO_SYSTEMS — 0 questions — AI will generate on first session
  ⚠️ DSST_MONEY_AND_BANKING — 0 questions — AI will generate on first session
  ⚠️ DSST_SUBSTANCE_ABUSE — 0 questions — AI will generate on first session
  ⚠️ DSST_CRIMINAL_JUSTICE — 0 questions — AI will generate on first session
  ⚠️ DSST_FUNDAMENTALS_OF_COUNSELING — 0 questions — AI will generate on first session
  ⚠️ DSST_GENERAL_ANTHROPOLOGY — 0 questions — AI will generate on first session
  ⚠️ DSST_WORLD_RELIGIONS — 0 questions — AI will generate on first session
  ⚠️ DSST_ART_WESTERN_WORLD — 0 questions — AI will generate on first session
  ⚠️ DSST_ASTRONOMY — 0 questions — AI will generate on first session
  ⚠️ DSST_COMPUTING_AND_IT — 0 questions — AI will generate on first session
  ⚠️ DSST_CIVIL_WAR — 0 questions — AI will generate on first session
  ⚠️ AP World History: Modern FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Computer Science Principles FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Physics 1: Algebra-Based FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Calculus AB FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Calculus BC FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Statistics FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Chemistry FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Biology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP US History FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Psychology FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Human Geography FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP U.S. Government and Politics FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Environmental Science FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP Precalculus FRQ — 0 FRQ questions — AI will generate on first session
  ⚠️ AP English Language and Composition FRQ — 0 FRQ questions — AI will generate on first session
  ✅ Analytics API — 77/77 courses responding (all 401 auth guard — healthy)
  ✅ Study Plan API — 77/77 courses responding (all 401 auth guard — healthy)
```

### Manual P0 checklist (fill in before marking release complete)
**Practice — AP/SAT/ACT (16 courses, AP-track user):**
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

**Practice — CLEP (34 courses, CLEP-track user + clep_enabled=true):**
- [ ] CLEP_COLLEGE_ALGEBRA MCQ — session starts
- [ ] CLEP_COLLEGE_COMPOSITION MCQ — session starts
- [ ] CLEP_INTRO_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MARKETING MCQ — session starts
- [ ] CLEP_PRINCIPLES_OF_MANAGEMENT MCQ — session starts
- [ ] CLEP_INTRODUCTORY_SOCIOLOGY MCQ — session starts
- [ ] CLEP_AMERICAN_GOVERNMENT MCQ — session starts
- [ ] CLEP_MACROECONOMICS MCQ — session starts
- [ ] CLEP_BIOLOGY MCQ — session starts
- [ ] CLEP_CALCULUS MCQ — session starts
- [ ] CLEP_CHEMISTRY MCQ — session starts
- [ ] CLEP_FINANCIAL_ACCOUNTING MCQ — session starts
- [ ] CLEP_AMERICAN_LITERATURE MCQ — session starts
- [ ] CLEP_ENGLISH_LITERATURE MCQ — session starts
- [ ] CLEP_HUMANITIES MCQ — session starts
- [ ] CLEP_WESTERN_CIV_1 MCQ — session starts
- [ ] CLEP_COLLEGE_MATH MCQ — session starts
- [ ] CLEP_PRECALCULUS MCQ — session starts
- [ ] CLEP_BUSINESS_LAW MCQ — session starts
- [ ] CLEP_SPANISH MCQ — session starts
- [ ] CLEP_MICROECONOMICS MCQ — session starts
- [ ] CLEP_US_HISTORY_1 MCQ — session starts
- [ ] CLEP_US_HISTORY_2 MCQ — session starts
- [ ] CLEP_HUMAN_GROWTH_DEV MCQ — session starts
- [ ] CLEP_ANALYZING_INTERPRETING_LIT MCQ — session starts
- [ ] CLEP_COLLEGE_COMP_MODULAR MCQ — session starts
- [ ] CLEP_EDUCATIONAL_PSYCHOLOGY MCQ — session starts
- [ ] CLEP_SOCIAL_SCIENCES_HISTORY MCQ — session starts
- [ ] CLEP_WESTERN_CIV_2 MCQ — session starts
- [ ] CLEP_NATURAL_SCIENCES MCQ — session starts
- [ ] CLEP_INFORMATION_SYSTEMS MCQ — session starts
- [ ] CLEP_FRENCH MCQ — session starts
- [ ] CLEP_GERMAN MCQ — session starts
- [ ] CLEP_SPANISH_WRITING MCQ — session starts

**Track enforcement (DB-backed — Beta 2.1):**
- [ ] Register at `/register?track=clep` → DB `User.track = "clep"`
- [ ] Register at `/register?track=ap` → DB `User.track = "ap"`
- [ ] Register (no param) → DB `User.track = "ap"` (default)
- [ ] AP user: POST `/api/practice { course: "CLEP_COLLEGE_ALGEBRA" }` → 403
- [ ] AP user: POST `/api/diagnostic { course: "CLEP_INTRO_PSYCHOLOGY" }` → 403
- [ ] CLEP user: POST `/api/practice { course: "AP_WORLD_HISTORY" }` → 403
- [ ] CLEP user: POST `/api/diagnostic { course: "AP_US_HISTORY" }` → 403
- [ ] AP user: normal AP course practice → no 403 (200 OK)
- [ ] Sidebar: no "Change track" button visible for any user
- [ ] Sidebar: CLEP user sees only CLEP courses (reads from DB, not localStorage)
- [ ] Sidebar: AP user sees AP/SAT/ACT courses (DB wins even if localStorage says "clep")
- [ ] Onboarding: CLEP user sees only CLEP courses without localStorage dependency
- [ ] `/api/user` response includes `user.track` field
- [ ] Session JWT includes `track` field after login

**Auth — login & registration:**
- [ ] New credential registration → email verification sent (or auto-verified in dev)
- [ ] Login with correct credentials → redirected to /dashboard or /onboarding
- [ ] Login with wrong password → error toast shown, no redirect
- [ ] Google OAuth sign-in button visible (when GOOGLE_CLIENT_ID configured)
- [ ] Unverified email login → error "Please verify your email"

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

