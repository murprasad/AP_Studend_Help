# StudentNest Design Review — 2026-05-27

**Reviewer:** senior tech-lead audit
**Scope:** race conditions, state-management bugs, architectural design flaws
**Focus dirs:** `src/app/(dashboard)/practice/`, `mock-exam/`, `sage-coach/`, `ai-tutor/`, `src/app/api/**`, `src/lib/auth.ts`, webhooks
**Not in scope:** content quality, visual polish, micro-refactors

The codebase shares heavy lineage with PrepLion and inherits several of the same family of bugs PrepLion is already living with in production. A few StudentNest-specific issues (Sage Coach, mock-exam) are louder than anything in PrepLion. Ordering is by blast-radius / trust damage, not file location.

---

## Punch list

### 1. Mock-exam API returns `correctAnswer` + `explanation` in the question payload — P0 cheat leak
**File:** `src/app/api/mock-exam/route.ts:66-86, 133-139`
The `select` block on the question query includes `correctAnswer: true, explanation: true`, and the payload is returned verbatim as `questions: allQuestions`. Any student can open DevTools → Network and read the answer key for the entire mock before submitting a single response. This destroys the mock's value as a score predictor and contradicts every "honest score" claim in the marketing copy.
**Design fix:** server must strip answer keys from the bootstrap payload; grading lives only in `POST /api/practice/[sessionId]`. The practice route already does this correctly — mirror it.

### 2. `updateUserProgress` is an unguarded read-modify-write on User streak/XP — P0 atomicity
**File:** `src/app/api/practice/[sessionId]/route.ts:472-531`
The function `SELECT * FROM user`, computes `newStreak`, `newFreezes`, `newXp`, `newLevel` in memory, then `UPDATE user`. Two simultaneous answer-submits (mobile + desktop tab, double-tap, retry after timeout) both read the same baseline, both compute identical "new" values, and the second write overwrites the first instead of adding. Neon HTTP can't help because it doesn't support transactions; here the code doesn't even attempt one. XP gets lost, streaks double-count, freeze tokens vanish — and this is the user's #1 trust currency.
**Design fix:** convert to a single `UPDATE … SET totalXp = totalXp + $1, streakDays = CASE … END, …` written as `$executeRawUnsafe` so the increment is atomic at the DB level. Streak/freeze logic moves into the SQL or into a deterministic helper that's safe to repeat.

### 3. Stale JWT after Stripe webhook — premium users still see paywalls until JWT TTL — P0 conversion
**File:** `src/lib/auth.ts:159-234` + `src/app/api/webhooks/stripe/route.ts:48-149`
JWT only refreshes on `trigger === "update"` (which only fires when the client calls `useSession().update()`). Stripe webhook flips `subscriptionTier` and `moduleSubscription.status` in the DB, but the user's JWT keeps the stale `subscriptionTier`/`moduleSubs` for up to 30 days. Every premium-gated server route (`/api/practice` line 62, `hasAnyPremium`) reads from the JWT, so the user just paid $9.99 and is still gated. The PrepLion equivalent is the "onboarding_completed" cookie hack (PATCH route line 366-388) — same anti-pattern.
**Design fix:** server-side gates that decide money/access must consult the DB (or a short-TTL cache keyed off `userId`), not the JWT. JWT keeps role/id only.

### 4. Sage Coach: connection loss mid-recording produces silent transcript loss + stuck "processing" — P0 trust
**File:** `src/app/(dashboard)/sage-coach/page.tsx:130-272`
Three problems compound. (a) The recording timer is decremented entirely client-side; there is no server-side checkpoint of `transcript`. If the tab goes background on iOS or Chrome throttles the interval, `secondsLeft` skews from real elapsed and auto-stop fires late — the audio captured between server-perceived 60s and client-perceived 60s is lost. (b) On `stopRecording`, both `setTimeout(controller.abort, 23000)` and `setTimeout(hardTimeout, 25000)` race the `await fetch(...)`; if the network is offline mid-flight, the abort fires, `controller.abort()` triggers, then the elapsed-time ticker (line 283-299) ALSO transitions to `error` independently — two state transitions writing to `error`. (c) If user navigates away during `processing`, `recognitionRef` cleanup only runs on unmount and `transcriptRef` is never persisted — 60 seconds of student effort vanishes.
**Design fix:** stream the transcript to the server in 5-second chunks during recording so a connection loss preserves work; collapse the dual-timer-plus-ticker into one finite-state-machine; persist `transcript` to `sessionStorage` on every `onresult` callback the way mock-exam already does.

### 5. Sage Coach evaluate: cascade aborts overlap with watchdog — duplicate sessionId rows + free-tier bypass — P1
**File:** `src/app/api/sage-coach/evaluate/route.ts:142-186, 207-220, 338-360`
`watchdog()` resolves to the fallback at 22s even if the in-flight `callEvaluator` is still running. The underlying `handlePost` keeps executing and `prisma.$executeRawUnsafe(INSERT INTO sage_coach_sessions ...)` fires fire-and-forget. Meanwhile the client retries, the rate-limit check (line 207) counts the *committed* row from the abandoned request as today's session, and the user is locked to the watchdog fallback for 24h despite never receiving real feedback. Same path: the daily-cap count is read-then-decided, not enforced by a unique constraint, so two parallel requests at second-zero of day both pass the `todayCount >= 1` check.
**Design fix:** fence the work behind a single SQL `INSERT … ON CONFLICT DO NOTHING` keyed by `(userId, calendar-day)`, then run evaluation; never write a session row that the user never received.

### 6. Practice page first-time-auto-launch races feedback-flag fetch — wrong session difficulty — P1
**File:** `src/app/(dashboard)/practice/page.tsx:234-271, 402-433`
Two separate `useEffect`s call `/api/user/conversion-signal` and `/api/feature-flags` on mount. The first-time-user auto-launch decides `setSelectedDifficulty("EASY")` based on `responseCount === 0`, but `subscriptionTier === null` is the only gate. There is no guarantee that the practice-creation request that follows will see the right `course` value either — `useCourse()` reads from localStorage which can change between renders. Two students reported wrong-course questions on first session; the autoLaunch ref keyed on URL signature (line 374) is the band-aid.
**Design fix:** consolidate "do I auto-launch?" into a single async function that takes a snapshot of all dependencies and runs once; do not split decision across three effects.

### 7. AI Tutor: stream-failure rollback corrupts message list — P1
**File:** `src/app/(dashboard)/ai-tutor/page.tsx:209-348`
`sendMessage` calls `setMessages(prev => [...prev, userMessage, assistantPlaceholder])` and inside the same callback fires an async IIFE that may later call `setMessages(p => p.slice(0, -2))` followed by `setMessages(p => [...p, userMessage])`. If the user types a second message while the first is mid-stream, the second message lands at index `n-1`, then the first's failure handler slices off the last two — which now includes the second message the user just typed. Net effect: typed-while-loading messages disappear without explanation.
**Design fix:** track each turn by a stable `turnId` and mutate that specific record, not by positional slice.

### 8. Sage Coach concept loader: course param drift on browser back/forward — P1
**File:** `src/app/(dashboard)/sage-coach/page.tsx:104-127, 316-339`
`loadConcept` has `[course]` deps, but the startup useEffect at line 316 also fetches `/api/sage-coach/question` independently — the fetched concept and the `concept` state can drift if the user switches courses mid-load. On a successful response from the older course, `setConcept(data)` writes a question for the wrong course, then `loadConcept` later replaces it — student sees the wrong-course question flash for a frame, mid-recording.
**Design fix:** single owner of "load current concept" with a cancellation token; do not duplicate the fetch across mount + click handler.

### 9. Mock exam `submitAnswer` stale-closure mirror of PrepLion bug — P1
**File:** `src/app/(dashboard)/mock-exam/page.tsx:275-305`
Unlike `practice/page.tsx:597-738` (which has the stale-response guard mirrored from the PL fix), the mock-exam version does NOT capture `currentIndex` at call-time and does NOT re-check `currentIndexRef` after the await. A fast click on Next during slow grading writes `setFeedback` to the new index — same disabled-options-on-wrong-question UX bug PL is shipping.
**Design fix:** port the `submitContext` guard from `practice/page.tsx:599-633` here verbatim.

### 10. Mock-exam timer effect can over-complete + write to unmounted state — P1
**File:** `src/app/(dashboard)/mock-exam/page.tsx:120-125`
The timer effect re-creates the `setInterval` every render where `phase` or `timeLeft` changes. Each interval calls `setTimeLeft(t => t - 1)` which re-triggers the effect, which clears + re-creates the interval. While this works under React's batching, the cleanup races with `completeExam()` when `timeLeft` hits 0; `completeExam` is a stale closure capturing `sessionId` from the render before the latest update. If the user resumes from sessionStorage and the timer hits 0 in the same render the resume sets state, the PATCH posts the wrong sessionId.
**Design fix:** drive countdown from `startTime + totalSecs - Date.now()` reads of a ref, with a single mount-time interval. Don't recreate on every tick.

### 11. Parent-invite uses `trialReengagement` table as audit log + only IP-based abuse cap — P2
**File:** `src/app/api/parent-invite/route.ts:120-135, 197-205`
"Co-opt a reengagement row with a sentinel course name" — comment admits this is a hack. The check is "1 invite per student per 24h," but there's no validation that the `parentEmail` differs from the student's, no domain blocklist, and no check that the same parent email isn't already being spammed from multiple student accounts. A motivated bad actor (or a script) creates N student accounts and uses parent-invite to bulk-email a target.
**Design fix:** dedicated `ParentInvite` table with `(parentEmail, sentAt)` index, plus per-recipient cooldown, plus disposable-email check.

### 12. Stripe webhook returns 200 on internal error — silent revenue drift — P1
**File:** `src/app/api/webhooks/stripe/route.ts:215-236`
The 200-on-error decision is defended as "Stripe-retries-forever is worse," but the chosen mitigation is the cron job `/api/cron/stripe-reconcile` running hourly. There's no visible alerting when `handled: false` is returned (the response body says it but Stripe doesn't consume it). If reconcile cron silently dies, paid users sit FREE indefinitely with no signal. Sentry is referenced in a comment but not actually wired in this file.
**Design fix:** return 500 for transient errors (Stripe's smart-retries take ~3 days), 200 only for known-permanent errors with explicit Sentry capture before the return.

### 13. `/api/practice` answer-key leak (mirror) — P1
**File:** `src/app/api/practice/route.ts:147-155, 469-482`
`allQuestions` `select` includes `correctAnswer: true` and `explanation: true`. The returned `questions.map(...)` block at line 469-482 *does* strip those before responding — so the surface API is safe — but the in-route variable holds the keys long enough to flow into AI-generation prompts, `weakTopicMap`, and `interleaveByUnit`. Any future refactor that flattens that map into the response (likely under time pressure) reintroduces the leak. The pattern of "select everything then map to a subset" is a sustained footgun across many routes.
**Design fix:** never `SELECT correctAnswer` in any route that returns questions to the client. Have a separate `getQuestionForGrading(id)` helper for the grading path.

### 14. `parsedOptions` recomputed every render + captured in `submitAnswer` closure — P2
**File:** `src/app/(dashboard)/practice/page.tsx:486-492, 710-731`
`parsedOptions` is recomputed via IIFE every render (no `useMemo`). More worrying: `submitAnswer` (line 710) reads `parsedOptions.length > 0` to decide whether to fire `knowledge-check`, but `parsedOptions` is captured from the render before submit. If the question array was reordered by `applyDownshift` mid-await, `parsedOptions` still reflects the OLD question and the knowledge-check fires against a question the user never saw.
**Design fix:** derive `parsedOptions` inside `submitAnswer` from `currentQuestion` captured in `submitContext`, never from outer-scope.

### 15. Sage Coach `getSpeechRecognition` typed as `any`; recognition errors swallow `audio-capture` race — P2
**File:** `src/app/(dashboard)/sage-coach/page.tsx:56-72, 142-170`
The browser-specific Recognition object is escape-hatched to `any`. `onerror` reads `e?.error`; `audio-capture` and `not-allowed` are user-actionable but `network`, `service-not-allowed`, and `aborted` go to the generic branch. More importantly: there's no handler for the legitimate case where `onresult` and `onerror` fire in the same task — both writing state, last-write-wins, and the recording UI freezes with stale transcript.
**Design fix:** wrap Web Speech in a typed wrapper with explicit state machine; surface every `audio-capture` event as a retry option, never as `error`.

---

## Themes

The two structural patterns producing most of this list:

1. **JWT-as-cache-with-no-invalidation.** Every paywall, every premium gate, every onboarding redirect reads from JWT. Webhooks write to DB. There is no path that says "user paid → invalidate JWT." The 30-day max age makes this an indefinite-duration footgun.
2. **Multi-step state mutations without atomicity, defended with `.catch(() => {})`.** XP increments, streak counts, mastery scores, daily-cap counts, parent-invite logs all do read-then-write. None are transactional. The pattern of "swallow failures so the user doesn't see an error" actively hides this entire class of bug.
