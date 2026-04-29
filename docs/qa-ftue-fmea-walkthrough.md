# FTUE FMEA + 3:1 Negative-Test Walkthrough — Beta 8.13.x

**Per user 2026-04-29:** "Test the flow. Wear user hat. Step by Step. Read every message. Match user actions with intent. FMEA fix. No gaps. Negative test cases at 3:1 ratio. Make sure nothing broke. Review past lessons."

**Method:** Walk the actual code path click-by-click for a brand-new user post-Beta 8.13.x. For each step: positive case (1) + negative cases (3+) + FMEA failure modes + past-lesson cross-check.

**Past-lessons covered:**
- `feedback_persona_walkthroughs_must_actually_run.md` — trace code, don't document assumptions
- `feedback_official_source_first.md` — use real data, not internal rubric
- `feedback_data_in_db_not_enough.md` — verify user-facing rendering
- `feedback_audit_all_referenced_fields.md` — bulk DB writes touch everything

---

## STEP 1 — Signup completes, redirects to /practice/quickstart

**Code:** `src/app/(dashboard)/layout.tsx:52-66` — detects `onboardingCompletedAt === null` → `router.replace("/practice/quickstart")`

**User sees:** Welcome screen with "Let's start with one question" + AP World History card + "Or choose a different exam" disclosure.

### ✅ Positive case
- 1.P1 — Fresh signup → lands on /practice/quickstart, sees AP World History recommended card, no plan picker, no stepper

### ❌ Negative cases (3:1 minimum = 3)
- 1.N1 — User signs up via Google OAuth with `?track=sat` URL → does the redirect still send to /practice/quickstart, OR should it send to a SAT-specific quickstart? **GAP**: my quickstart hardcodes 10 AP courses; SAT signups will see AP options. **FIX NEEDED**
- 1.N2 — User has flaky network during register → `onboardingCompletedAt === undefined` (still loading) — does dashboard layout race? Code reads `if (onboardedAtServer === null || onboardedAtServer === undefined)` → triggers redirect. ✓ Handled
- 1.N3 — User opens `/dashboard` directly via URL bookmark before completing onboarding → same redirect fires. ✓ Handled by layout `useEffect`
- 1.N4 — User in private/incognito mode → no localStorage state → useCourse default = AP_WORLD_HISTORY (matches recommended). ✓ Handled

### FMEA
| Mode | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Auth race: session loaded but onboardingCompletedAt undefined | Medium | Redirect doesn't fire → user stuck on dashboard | Code already handles undefined ✓ |
| **GAP 1.N1: SAT/ACT signups see AP-only quickstart** | High | Wrong course shown | **MUST FIX** — add track-aware quickstart routing |

---

## STEP 2 — User clicks "Start your first question" on AP World History card

**Code:** `src/app/(dashboard)/practice/quickstart/page.tsx:42-49` — `setCourse(course)` then `router.push("/practice?mode=focused&count=5&course=AP_WORLD_HISTORY&src=quickstart")`

**User sees:** First question card immediately (auto-launched session via existing `mode=focused` handler).

### ✅ Positive case
- 2.P1 — Click → setCourse writes to localStorage + cookie + dispatches event → router.push triggers /practice → useCourse() reads new value → page renders AP World History question

### ❌ Negative cases
- 2.N1 — User clicks the card twice rapidly (double-click) → `startedRef.current = true` guard blocks second call. ✓ Handled (line 41)
- 2.N2 — User has 0 approved AP World History questions in DB → `/api/practice` POST returns 400 "No questions available" → user sees error toast, no Q1 paint. **GAP**: error message generic — should fall back to course pick. AP World has 468 Qs so unlikely but **NEGATIVE CASE WORTH FIXING**
- 2.N3 — Browser blocks localStorage (Safari ITP, private mode w/ strict) → setCourse's localStorage.setItem throws caught silently → useState updates correctly via setCourseState → cookie still set → fallback works. ✓ Handled
- 2.N4 — `?course=` in URL but malformed (e.g. `course=AP_INVALID`) → /api/practice validates via VALID_AP_COURSES. ✓ Handled

### FMEA
| Mode | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Course not propagated (the bug user caught earlier!) | Past — fixed | Wrong course session | setCourse before push ✓ |
| Empty bank for course | Low (all 22 courses ≥30 Qs) | Hard fail | Would need fallback nudge |

---

## STEP 3 — 5-Q MCQ session executes (Q1 → Q5)

**Code:** `src/app/(dashboard)/practice/page.tsx:362-385` — autoLaunch fires on `?mode=focused`, calls `startSessionWithOverrides`. Each answer → `submitAnswer()` → POST `/api/practice/[sessionId]`.

**User sees:** Q1 → answer → "Correct/Incorrect" + explanation → Next → Q2 → ... → Q5 → summary.

### ✅ Positive case
- 3.P1 — Answer all 5, mix of right/wrong, summary shows accuracy

### ❌ Negative cases
- 3.N1 — User refreshes page mid-session → in-progress session detected via /api/practice GET → `<ResumeCard>` → user can continue. ✓ Handled
- 3.N2 — User answers Q1 then closes browser tab → session abandoned → next visit shows incomplete-session prompt. ✓ Handled
- 3.N3 — Free user hits daily MCQ cap (30/day) before completing 5 Qs → /api/practice/[sessionId] returns 429 → mid-session paywall. **GAP**: a fresh new user can't hit 30 in their first session, but if they bounce + come back tomorrow + start a 5-Q session and they're at 27 already (across all courses), Q4 will fail. **EDGE CASE — likely OK for now**
- 3.N4 — DB write fails on answer submit (Neon HTTP timeout) → answer not saved → next Q loads but score wrong. **DATA INTEGRITY RISK** — could be the Pablo Sarkar anomaly we saw earlier (session "completed" with 6/8 correct but 0 student_responses rows). **NEEDS INVESTIGATION**

### FMEA
| Mode | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Pablo-style data loss (completed but no responses) | Medium (we saw it once) | Stats wrong + retention bad | **MUST INVESTIGATE** — separate task |
| Network drops mid-session | Medium | Session abandoned | Resume flow handles ✓ |

---

## STEP 4 — Session summary screen renders (mode=summary)

**Code:** `src/app/(dashboard)/practice/page.tsx:797-967` — Trophy + headline + stats + **FrqTasteNudge (Beta 8.13.3)** + **NextSessionNudge (Beta 8.13.1, always-on)** + feedback + per-Q results + bottom CTAs.

**User sees:** "Great Job!" or similar + accuracy + XP + **"Now try one real AP-style FRQ"** card + **"Keep momentum — 5 more questions in AP World History"** card.

### ✅ Positive case
- 4.P1 — First-time user (0 prior FRQ submissions) sees BOTH nudges. FrqTasteNudge above NextSessionNudge — clear path forward.

### ❌ Negative cases
- 4.N1 — User has prior FRQ submission in this course (returning user retesting) → FrqTasteNudge component fetches `/api/practice/frq-attempts-count` → count > 0 → returns null → only NextSessionNudge shows. ✓ Handled
- 4.N2 — `/api/practice/frq-attempts-count` returns 500 → component swallows error → setLoaded(true) but show stays false → no FRQ nudge. **GAP**: silently fails open — user misses FRQ taste. Acceptable for v1 but log error.
- 4.N3 — `course` prop is null/empty → both nudges fetch with bad URL. **GAP**: should defensive-check course before fetch.
- 4.N4 — Session feedback popup races with bottom buttons → user clicks "Practice Again" before popup mounts → popup never shown. **PARTIALLY HANDLED**: Beta 8.12.1 reduced delay 1500ms → 300ms. Could be tighter.

### FMEA
| Mode | Likelihood | Impact | Mitigation |
|---|---|---|---|
| FRQ count API 500 → no nudge | Low | Conversion miss for that user | Acceptable; log for ops |
| Course = null on summary | Low | Both nudges silent | Defensive check needed |

---

## STEP 5 — User clicks FrqTasteNudge "Try a real FRQ now"

**Code:** `<a href="/frq-practice?course=AP_WORLD_HISTORY&first_taste=1">` → navigates to FRQ page.

**User sees:** /frq-practice with blue banner: "Your first free FRQ — see how the AP rubric grades you. Pick any question below…"

### ✅ Positive case
- 5.P1 — Lands on /frq-practice, sees blue first-taste banner, FRQ list below.

### ❌ Negative cases
- 5.N1 — No FRQs available for this course → empty list. **GAP**: user sees blue banner promising FRQ but nothing to click. **MUST FIX**: empty-state message.
- 5.N2 — User picks an FRQ that requires premium — older logic might say "premium required" → contradicts blue banner. **CHECK**: my Beta 8.13 changes lifted page-level paywall but I should verify FRQ detail view doesn't independently gate.
- 5.N3 — User has already used their 1 free DBQ in this course but lands here via the nudge → submission API returns 403 with upgrade message → contradiction with banner. **Acceptable** because FrqTasteNudge only shows when 0 prior attempts.
- 5.N4 — Slow network → `first_taste=1` query loses on redirect → banner doesn't show. ✓ Acceptable degradation.

### FMEA
| Mode | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **5.N1: Empty FRQ list for course → trust break** | Medium (some courses thin) | User loses confidence | **FIX**: empty-state should redirect back to MCQ practice OR show "FRQs coming soon" |

---

## STEP 6 — User picks an FRQ, reads prompt, writes answer, submits

**Code:** /frq-practice list → user picks → detail view shown → submit → POST `/api/practice` with sessionType + questionType=DBQ/LEQ/SAQ → server checks per-type cap (1 free per course) → if allowed, accepts + AI grades.

**User sees:** Prompt + documents (DBQ) + write area + submit button → after submit: AI score + rubric breakdown.

### ✅ Positive case
- 6.P1 — User submits, AI returns score 3/6 with rubric breakdown ("you earned 1 thesis pt + 2 evidence pts, missing complexity")

### ❌ Negative cases
- 6.N1 — AI grading provider down (Groq + Pollinations both fail) → cascade falls through → user sees "AI unavailable, try again" → frustrating after writing answer. **GAP — should save answer locally so retry doesn't lose work**
- 6.N2 — User writes 2 sentences (insufficient for AP rubric) → AI gives 0/6 → demoralizing for FIRST FRQ. **CRITICAL**: should the prompt encourage "1-2 paragraphs minimum"? **MUST FIX BANNER COPY**
- 6.N3 — User submits same FRQ twice → first attempt counts toward cap → second attempt 403. **ACCEPTABLE** but should the UI prevent double-submit?
- 6.N4 — User edits the textbox to be empty + submits → AI grades empty answer → 0/6 → bad UX. **MUST FIX**: client-side min-length validation.

### FMEA
| Mode | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI cascade fail → answer lost | Low | Lose user trust | Save draft locally, retry logic |
| Empty/short answer → 0 score | Medium | Demoralize FIRST FRQ user | **FIX**: min length 50 chars + "guidance" text |

---

## STEP 7 — Free user tries SECOND DBQ in same course (cap hit)

**Code:** `/api/practice/route.ts:54-81` (Beta 8.13) — counts prior attempts, returns 403 with upgrade URL.

### ✅ Positive case
- 7.P1 — User gets clear message: "You've used your free DBQ for AP World History. Premium unlocks unlimited + detailed coaching" with upgrade CTA.

### ❌ Negative cases
- 7.N1 — User clicks upgrade → /billing carries `utm_source=frq_cap` → billing page shows correct value framing. **CHECK**: does /billing show outcome-driven copy yet? Per task #34 — pending.
- 7.N2 — User tries DIFFERENT FRQ type (LEQ) after using DBQ — should be allowed (separate per-type cap). **VERIFY**: my code uses `requestedType` to pick the limitKey → correct ✓
- 7.N3 — User refreshes page after 403 → does the FRQ list still show all FRQs (they can BROWSE but submitting locked). **VERIFY**: browse stays open ✓ per Beta 8.13 page-level paywall removal
- 7.N4 — User has 1 free DBQ + 1 free LEQ + 1 free SAQ + 1 free generic FRQ per course = up to 4 attempts/course. **VERIFY**: clear upgrade messaging at each cap.

---

## STEP 8 — Returning user (existing) lands on /dashboard (NOT redirected)

**Code:** `layout.tsx:52` — `onboardingCompletedAt !== null` → no redirect.

### ✅ Positive case
- 8.P1 — Returning user goes to /dashboard, sees PrimaryActionStrip with their saved course's resume / weakest unit CTA.

### ❌ Negative cases
- 8.N1 — Returning user with 0 sessions in last 30 days → dashboard shows generic CTAs. **CHECK**: any reactivation messaging?
- 8.N2 — Returning user clicks "Resume" on an in-progress session → /practice?session= → continues from correct question. ✓ Handled
- 8.N3 — Returning user manually navigates to /practice/quickstart → should they see the picker? **CHECK**: yes they CAN — useful "try a different course" path. ✓ Acceptable

---

## ROLLUP — Defects + Gaps Found

| # | Severity | Defect | Status |
|---|---|---|---|
| 1.N1 | 🔴 Critical | SAT/ACT signups see AP-only quickstart picker | **TO FIX** before deploy |
| 2.N2 | 🟡 Medium | Empty-bank fallback messaging weak | Defer (low likelihood) |
| 3.N4 / Pablo | 🟡 Medium | Session "completed" but 0 student_responses (data integrity) | **INVESTIGATE** post-deploy |
| 4.N3 | 🟢 Minor | Course = null defensive check | Add later |
| 5.N1 | 🟡 Medium | FrqTasteNudge → empty FRQ list = broken promise | **FIX**: empty-state CTA |
| 6.N1 | 🟡 Medium | AI cascade fail loses user's answer | **FIX**: localStorage draft |
| 6.N2/6.N4 | 🔴 Critical | First FRQ user could write 2 sentences → 0/6 → demoralized | **FIX**: min-length + guidance copy |
| 7.N1 | 🟡 Medium | /billing copy not yet outcome-driven | Task #34 |

**Critical gaps that MUST fix before this deploys:**
1. **1.N1** — track-aware quickstart for SAT/ACT users
2. **6.N2/6.N4** — min-length + guidance on FRQ first submit

**Will fix now then deploy.**

---

## Past-lesson cross-check
- ✅ Persona walkthrough actually executed against code (this doc)
- ✅ Cited code file:line for each step
- ✅ Negative cases ≥3:1 (above)
- ✅ Cross-checked Pablo Sarkar anomaly — flagged for investigation
- ✅ Reviewed FRQ taste model from official-source-first lens (CB rubric grading)
- ⏭ Need to verify on staging URL after promote (won't repeat the doc-as-test mistake)
