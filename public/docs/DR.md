# NovAP (AP SmartPrep) — Detailed Requirements

**Document ID:** DR-001
**Version:** 1.4
**Last Updated:** 2026-03-15
**Status:** Active

---

## 1. Authentication & User Management

### DR-AUTH-01 — User Registration
- System shall accept: email, password, firstName, lastName, gradeLevel (optional), school (optional)
- Password shall be hashed with bcrypt before storage
- Email addresses shall be unique in the database
- Registration shall be blocked when `registration_enabled` flag is `false`
- In production (EMAIL_SERVER_USER set): send verification email with 24-hour token
- In development (EMAIL_SERVER_USER unset): auto-verify account immediately

### DR-AUTH-02 — Email Verification
- Verification tokens shall expire in 24 hours
- Token shall be stored in `VerificationToken` table
- Login shall be blocked until emailVerified is non-null
- Clicking the email link calls `POST /api/auth/verify-email` with the token

### DR-AUTH-03 — Login
- Credentials provider: email + password match
- On success: JWT issued containing { id, email, role, subscriptionTier }
- JWT stored in secure HTTP-only cookie via NextAuth v4
- Failed login returns 401 with "Invalid credentials" message

### DR-AUTH-04 — Session Management
- Sessions are JWT-based (no database session table)
- JWT refreshed on each request via NextAuth callbacks
- subscriptionTier in JWT is updated live on webhook events

### DR-AUTH-05 — Role-Based Access
- STUDENT: access all dashboard pages
- ADMIN: all STUDENT access + `/admin` dashboard
- Admin check enforced at route level (redirect to /dashboard if not ADMIN)

### DR-AUTH-06 — Forgot Password Request
- `POST /api/auth/forgot-password` accepts `{ email: string }`
- System shall look up user by email (case-insensitive)
- If no user found, return success message regardless (never reveal account existence)
- Delete any existing `PasswordResetToken` records for the user before creating a new one
- Create `PasswordResetToken`: token = `crypto.randomUUID()`, expires = now + 1 hour
- Call `sendPasswordResetEmail(email, user.firstName, token)` — SMTP failures shall be logged but not surfaced to the client
- Always return `{ message: "If that email is registered, a reset link was sent." }`
- Route is public (no auth required)

### DR-AUTH-07 — Reset Password
- `POST /api/auth/reset-password` accepts `{ token: string, password: string }`
- Look up `PasswordResetToken` by token value
- If not found or `expires < now`, return 400 `{ error: "Invalid or expired token." }`
- Validate password: minimum 8 characters; return 400 if too short
- Hash new password with bcrypt (12 rounds)
- Update `User.passwordHash` for the matching user
- Delete the used `PasswordResetToken` record
- Return 200 `{ message: "Password updated. You can now sign in." }`
- Route is public (no auth required)

---

## 2. Course System

### DR-COURSE-01 — Course Registry
- `src/lib/courses.ts` exports `COURSE_REGISTRY` as the single source of truth
- Each `CourseConfig` entry contains:
  - name, shortName, examSecsPerQuestion
  - units[]: { name, timePeriod?, keyThemes[], resourceUrls{} }
  - questionTypeFormats{}: per-type prompt templates and response formats
  - curriculumContext, tutorResources, examAlignment, stimulusGuidance
  - difficultyRubric, distractorTaxonomy, apSkills[]
  - suggestedTutorQuestions[]

### DR-COURSE-02 — Course Selection (Client)
- Selected course stored in localStorage key `ap_selected_course`
- Also stored in cookie `ap_selected_course` for server component reads
- `useCourse()` hook dispatches `CustomEvent("ap-course-change")` on update
- All `useCourse()` instances on the same page sync instantly via the event
- Default course: `AP_WORLD_HISTORY`
- Validated against `VALID_AP_COURSES` (derived from registry)

### DR-COURSE-03 — Inline Course Selector
- `CourseSelectorInline` component renders on Practice, Mock Exam, Analytics,
  Study Plan, Resources pages and AI Tutor headers
- Shows current course name with chevron; opens Radix DropdownMenu on click
- Calls `setCourse()` + `router.refresh()` on selection

---

## 3. Practice Engine

### DR-PRAC-01 — Session Creation (`POST /api/practice`)
- Required: sessionType (QUICK_PRACTICE | FOCUSED_STUDY | MOCK_EXAM)
- Optional: unit (ApUnit | "ALL"), difficulty (EASY | MEDIUM | HARD | "ALL"),
  questionCount (default 10), course (default AP_WORLD_HISTORY), questionType
- Validates course against VALID_AP_COURSES
- **FRQ Gate**: If `premium_feature_restriction=true` AND questionType ≠ MCQ AND
  tier ≠ PREMIUM → 403 `{ error, limitExceeded: true, upgradeUrl: "/pricing" }`
- **Daily Limit Gate**: If `premium_feature_restriction=true` AND
  sessionType ∈ {PRACTICE, QUICK_PRACTICE, FOCUSED_STUDY} AND tier ≠ PREMIUM:
  - Count sessions today where status ≠ ABANDONED
  - If count ≥ 3 → 429 `{ error, limitExceeded: true, upgradeUrl: "/pricing" }`
- **AI Auto-Generation**: If available Qs < questionCount AND `ai_generation_enabled=true`:
  - Generate min(needed, 5) questions in parallel
  - Weak topic targeting: use units where masteryScore < 70
  - Save generated questions as isApproved=true, isAiGenerated=true
  - Returns `aiGenerationWarning` message in response
- **Adaptive Ordering**:
  - Unseen questions: +3 priority
  - Previously wrong: +2 priority
  - Previously correct: +1 priority
  - Random baseline
- Creates PracticeSession (IN_PROGRESS), inserts SessionQuestions via raw SQL

### DR-PRAC-02 — Answer Submission (`POST /api/practice/[sessionId]`)
- Required: questionId, answer, timeSpentSecs
- MCQ scoring: case-insensitive string comparison
- FRQ/SAQ/LEQ/DBQ/CODING scoring: AI rubric via `callAIWithCascade`
  - Returns: pointsEarned, totalPoints, feedback, modelAnswer
  - isCorrect = pointsEarned ≥ totalPoints / 2
- Updates Question.timesAnswered, timesCorrect
- Updates/upserts MasteryScore for the unit
  - Formula: 0.4 × overallAccuracy + 0.6 × recentAccuracy (last 10 attempts)

### DR-PRAC-03 — Session Completion (`PATCH /api/practice/[sessionId]`)
- Calculates: accuracy%, timeSpentSecs, xpEarned, apScoreEstimate
- XP formula: correctCount × 10 + (accuracy ≥ 80% ? 50 : 0)
- AP score estimate: Math.round(1 + (accuracy / 100) × 4), clamped to 1–5
- Updates User: totalXp, level, streakDays, lastActiveDate
- Level formula: Math.floor(Math.sqrt(totalXp / 100)) + 1
- Streak: +1 if lastActiveDate was yesterday; reset to 1 if gap > 1 day

### DR-PRAC-04 — Session Limits
- Mock Exams (sessionType = MOCK_EXAM) are **exempt** from the daily 3-session limit
- "Abandoned" sessions (status = ABANDONED) are **not counted** toward daily limits

---

## 4. AI Tutor

### DR-TUTOR-01 — Non-Streaming Tutor (`POST /api/ai/tutor`)
- Input: { message, conversationId?, history[], course, skipAI?, savedResponse? }
- Daily limit (if `ai_limit_enabled=true` and tier = FREE):
  - Count conversations created today for this user
  - If count ≥ 10 → 429 `{ limitReached: true }`
- Educational enrichment: parallel fetch Wikipedia + StackExchange + edu APIs
  - 2.5 second hard timeout via Promise.race
  - Result injected into system prompt as "Live Context" (max 200 chars)
- System prompt structure:
  1. Core tutor identity + AP course context
  2. Unit list (compressed)
  3. Live context (if any)
  4. Response format: 5 sections (Core Concept, Visual Breakdown, How AP Asks This,
     Common Traps, Memory Hook)
  5. Follow-up format: `FOLLOW_UPS: [...]` JSON array at end
- History truncated to last 8 messages (4 turns)
- `skipAI=true` + `savedResponse`: bypasses AI, saves pre-computed response to DB
  (used by streaming flow: stream first, save after)

### DR-TUTOR-02 — Streaming Tutor (`POST /api/ai/tutor/stream`)
- SSE stream proxied directly from Groq API
- Returns `Content-Type: text/event-stream`
- Used only for Premium users
- After stream completes: client calls POST /api/ai/tutor with skipAI=true to save

### DR-TUTOR-03 — Conversation History (`GET /api/ai/tutor`)
- Returns up to 20 conversations for the current user
- Optionally filtered by course (`?course=AP_WORLD_HISTORY`)
- Sorted by updatedAt descending

---

## 5. Mock Exam

### DR-EXAM-01 — Exam Session
- Uses same `POST /api/practice` with sessionType=MOCK_EXAM, questionCount=10
- Timer: COURSE_REGISTRY[course].examSecsPerQuestion × questionCount seconds
- Timer visible in header; turns red and pulses when < 2 minutes remaining
- Auto-submits session when timer reaches 0

### DR-EXAM-02 — Exam Results
- Shows estimated AP score (1–5) prominently
- Breakdown: accuracy%, correct/total, time spent, XP earned
- Score color coding: 5=emerald, 4=blue, 3=yellow, 2=orange, 1=red

---

## 6. Analytics

### DR-ANALYTICS-01 — Data Returned (`GET /api/analytics`)
- masteryData[]: { unit, unitName, masteryScore (0–100), accuracy%, totalAttempts }
- accuracyTimeline[]: { date, accuracy%, questions } — last 14 days
- stats: { totalAnswered, totalCorrect, overallAccuracy, avgTimeSecs, totalSessions,
  streakDays, totalXp, level, estimatedApScore }

### DR-ANALYTICS-02 — Mastery Score Formula
- overallAccuracy = correct/total across all responses for the unit (last 50)
- recentAccuracy = correct/total of last 10 responses for the unit
- masteryScore = 0.4 × overallAccuracy + 0.6 × recentAccuracy

---

## 7. Study Plan

### DR-PLAN-01 — Plan Generation (`POST /api/study-plan`)
- If totalAnswered < 20: return static template (skip AI to save tokens)
- Else: call `generateStudyPlan()` with mastery scores + recent performance
- AI output shape: { weeklyGoal, dailyMinutes, focusAreas[], strengths[], tips[],
  dailySchedule{} }
- focusArea: { unit, priority (high|medium|low), reason, mcqCount, saqCount,
  estimatedMinutes, resources[] }
- Deactivates previous active plan, creates new plan record

### DR-PLAN-02 — Plan Fetch (`GET /api/study-plan`)
- Returns most recent active plan for selected course
- Returns null if no plan exists yet

---

## 8. Resources

### DR-RES-01 — Resource Categories
- Global resources (all courses): video channels, practice platforms, official resources
- Course-specific resources: textbooks, unit videos, unit Fiveable guides
- Exam skills: strategy videos from Heimler's History, AP-specific technique guides

### DR-RES-02 — Resource Sources
- Fiveable (study guides per unit)
- Heimler's History (YouTube — AP World History, AP US History)
- Khan Academy (content playlists)
- OER Project, Digital Inquiry Group (Stanford), MIT OCW
- OpenStax, Smithsonian Collections, Library of Congress

---

## 9. Billing & Subscription

### DR-BILL-01 — Checkout (`POST /api/checkout`)
- Creates Stripe Checkout Session (subscription mode)
- Requires authentication; uses user email for Stripe customer
- allow_promotion_codes=true (discount support)
- On success → redirect to /billing?success=true

### DR-BILL-02 — Webhook (`POST /api/webhooks/stripe`)
- Verified with Stripe webhook signature
- `checkout.session.completed`: set tier=PREMIUM, store stripeSubscriptionId,
  stripeCurrentPeriodEnd, stripeSubscriptionStatus="active"
- `customer.subscription.updated`: update currentPeriodEnd, subscriptionStatus
- `customer.subscription.deleted`: set tier=FREE, clear stripeSubscriptionId

### DR-BILL-03 — Cancellation (`POST /api/billing/cancel`)
- Sets Stripe subscription cancel_at_period_end=true
- Updates DB: stripeSubscriptionStatus="canceling"
- Access continues until currentPeriodEnd

### DR-BILL-04 — Reactivation (`DELETE /api/billing/cancel`)
- Removes cancel_at_period_end
- Updates DB: stripeSubscriptionStatus="active"

### DR-BILL-05 — Customer Portal (`POST /api/billing/portal`)
- Creates Stripe customer portal session
- Allows: update payment method, view invoices, manage subscription

---

## 10. Gamification

### DR-GAME-01 — XP System
- +10 XP per correct answer in a session
- +50 XP bonus if session accuracy ≥ 80%
- XP accumulates to User.totalXp

### DR-GAME-02 — Leveling
- Level = Math.floor(Math.sqrt(totalXp / 100)) + 1
- Level 1: 0 XP | Level 2: 100 XP | Level 3: 400 XP | Level 5: 1600 XP

### DR-GAME-03 — Streak
- Increments if user practiced yesterday (lastActiveDate = today − 1 day)
- Resets to 1 if gap > 1 day
- Updated on each session completion

### DR-GAME-04 — Achievements
- Achievement records define: name, description, iconName, xpReward, condition (JSON)
- UserAchievement records when a condition is met (unique per user+achievement)
- Achievements displayed on the Dashboard page
- Seeded achievements (from prisma/seed.ts):
  - "First Question", "Perfect Session", "Week Streak", "Speed Demon",
    "Unit Master", "Course Explorer", "Exam Ready", "AP Scholar",
    "Daily Dedication", "Question Crusher", "Comeback Kid", "All-Rounder"

---

## 11. Admin Dashboard

### DR-ADMIN-01 — Question Coverage (`GET /api/admin/populate-questions`)
- Returns per-unit question counts across all courses
- Status codes: critical (<10), low (10–19), good (≥20 with balanced distribution)

### DR-ADMIN-02 — Bulk Question Generation (`POST /api/admin/populate-questions`)
- Input: { course, minPerUnit, dryRun }
- Fills units below minPerUnit threshold using AI cascade
- dryRun=true: reports what would be generated without generating

### DR-ADMIN-03 — Feature Flag Management (`GET/POST /api/admin/settings`)
- GET: returns all SiteSetting key-value pairs
- POST: upsert one or more settings
- Flags: payments_enabled, ai_limit_enabled, registration_enabled,
  ai_generation_enabled, premium_feature_restriction

### DR-ADMIN-04 — User Stats
- Total registered users
- Total approved questions
- Total pending (unapproved) questions
- Total completed practice sessions
- Recent 10 signups with tier and grade

---

## 12. Feature Flags

| Flag | Default | Effect when OFF |
|------|---------|-----------------|
| payments_enabled | true | No Stripe gating; everyone gets full access |
| ai_limit_enabled | true | FREE users get unlimited AI conversations |
| registration_enabled | true | New registrations blocked (invite-only) |
| ai_generation_enabled | true | No AI auto-generation; only use banked questions |
| premium_feature_restriction | false | All users: unlimited sessions + FRQ + unlimited AI |

---

## 13. AI Provider Cascade

### DR-AI-01 — Provider Order
1. Google Gemini (GOOGLE_AI_API_KEY) — gemini-1.5-flash
2. Groq (GROQ_API_KEY) — llama-3.3-70b-versatile — **primary in production**
3. Together.ai (TOGETHER_AI_API_KEY)
4. OpenRouter (OPENROUTER_API_KEY)
5. HuggingFace (HUGGINGFACE_API_KEY)
6. Cohere (COHERE_API_KEY)
7. Vertex AI (VERTEX_AI_PROJECT_ID)
8. Ollama (OLLAMA_BASE_URL — self-hosted)
9. Anthropic (ANTHROPIC_API_KEY) — paid, last resort
10. Pollinations-Free — no key, always available

### DR-AI-02 — Cloudflare Workers Compatibility
- All provider calls shall use plain `fetch()` with `AbortSignal.timeout(25000)`
- No Node.js SDK packages (groq-sdk, anthropic, etc.) shall be used in API routes
- Prisma shall use `@prisma/client/wasm` + `PrismaNeonHTTP` adapter

---

## 14. Platform Documentation

### DR-DOCS-01 — Document Set
The following four documents shall be maintained and kept current:
- HLR.md — High Level Requirements (this class of document)
- DR.md — Detailed Requirements (this document)
- HLD.md — High Level Design
- ARCH.md — Architecture Document

### DR-DOCS-02 — Storage & Access
- Source files stored in `/doc/` directory (git-tracked)
- Static copies served from `/public/docs/` for direct download
- In-app docs page at `/docs` renders all four documents
- Users can print/save any document as PDF from the docs page

### DR-DOCS-03 — Update Cadence
- Documents shall be updated with every significant feature addition or change
- Version number and change log shall be maintained at the top of each document

---

## 15. Document Change Log

| Version | Date | Change Summary |
|---------|------|---------------|
| 1.0 | 2026-01-10 | Initial detailed requirements |
| 1.1 | 2026-02-14 | Stripe billing, 7 new courses, cancellation/reactivation |
| 1.2 | 2026-03-01 | FRQ all courses, premium restriction flag, streaming tutor |
| 1.3 | 2026-03-15 | Docs page (DR-DOCS), course switching (DR-COURSE-02/03), ai_generation_enabled gate, achievement display |
