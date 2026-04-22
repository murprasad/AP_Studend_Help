# QA Test Plan — Beta 6.0 Release

**Release tag:** `beta-6.0` (local, unpushed)
**Commits:** `45dacd0` → `178a165` (22 commits)
**Deploy state:** commits `2a4dcfd` (version bump) and `178a165` (bottom nav) not yet live.

---

## 1. Scope — features landing in Beta 6.0

| # | Feature | Files touched | Test impact |
|---|---|---|---|
| F1 | Coach-funnel race fix | `dashboard-view.tsx`, `primary-action-strip.tsx`, `analytics/dashboard-event/route.ts` | Integration + funnel instrumentation |
| F2 | Diagnostic paywall (LockedInsightOverlay) | `locked-insight-overlay.tsx`, `diagnostic/page.tsx` | E2E — free-user vs premium path |
| F3 | DiagnosticNudgeModal at 5/10 responses | `diagnostic-nudge-modal.tsx`, `practice/page.tsx`, `user/conversion-signal/route.ts` | Integration — threshold timing |
| F4 | FunnelEvent raw log | `schema.prisma`, `dashboard-event/route.ts` | Integration — prod table writes |
| F5 | Readiness anti-demoralization wiring | `coach-plan/route.ts`, `outcome-progress-strip.tsx` | E2E — zero-signal user hides % |
| F6 | Diagnostic → focused-practice bridge | `diagnostic-helpers.ts`, `diagnostic/page.tsx`, `practice/page.tsx` | E2E — click-through |
| F7 | Trial days-remaining banner | `trial-banner.tsx`, `(dashboard)/layout.tsx`, `api/user/route.ts` | Visual + severity escalation |
| F8 | 5 new AP courses — schema + CourseConfig + ingest | `schema.prisma`, `courses.ts`, `generate-questions.ts`, `scripts/ingest/ingest-ap-*.mjs` | Unit — hidden flag + visibility |
| F9 | Anti-ambiguity guardrail | `ai.ts`, `ai-providers.ts` | Integration — generator output quality |
| F10 | Mobile haptics | `haptics.ts`, `practice/page.tsx` | Manual mobile |
| F11 | Mobile bottom nav | `bottom-nav.tsx`, `(dashboard)/layout.tsx` | Manual mobile |
| F12 | Flashcard schema + SM-2 | `schema.prisma`, `spaced-repetition.ts` | Unit — SM-2 correctness |
| F13 | SEO pages: `/how-hard-is`, `/pass-rates`, `/wall-of-fame` | `(marketing)/how-hard-is/...`, `.../pass-rates`, `.../wall-of-fame` | E2E — static params, JSON-LD |
| F14 | Hidden-flag filter for new courses | `courses.ts` (`VISIBLE_AP_COURSES`), marketing routes | Unit — admin vs non-admin |
| F15 | CLEP/DSST soft-retire | `cleanup-clep-junk.mjs`, DB state | Integration — no CLEP visible |

---

## 2. Unit-level tests (3:1 negative-to-positive ratio)

### 2.1 SM-2 spaced-repetition (`spaced-repetition.ts`)

**P1** (positive): `calculateNextReview({ rating: 3, responseTimeMs: 5000, current: DEFAULT_SM2 })` on first-ever review → `repetitions=1`, `interval=1`, `easeFactor > 2.5`, `nextReviewAt` is 1 day from now.

**Negatives (3 per P):**
- **N1**: `rating=0` (Forgot) with `repetitions=5, interval=30` — reset: `repetitions=0`, `interval=1`, easeFactor drops but clamped ≥ 1.3.
- **N2**: `rating=3` (Easy) with `responseTimeMs=20000` (slow) — correct but slow: easeFactor gets -0.1 penalty, clamped ≥ 1.3.
- **N3**: Subsequent "Good" reviews with `repetitions=50, interval=365` — interval capped at 365, doesn't grow unbounded.

### 2.2 Hidden-flag filter (`VISIBLE_AP_COURSES`, `coursesForRole()`)

**P1**: `VISIBLE_AP_COURSES` excludes all 5 new AP courses (AP_HUMAN_GEOGRAPHY, AP_US_GOVERNMENT, AP_ENVIRONMENTAL_SCIENCE, AP_PRECALCULUS, AP_ENGLISH_LANGUAGE).

**Negatives:**
- **N1**: `coursesForRole("STUDENT")` returns `VISIBLE_AP_COURSES` length (16), not 21.
- **N2**: `coursesForRole("ADMIN")` returns all 21 `VALID_AP_COURSES`.
- **N3**: `coursesForRole(null | undefined)` returns `VISIBLE_AP_COURSES` (no crash on missing role).

### 2.3 Haptics (`haptics.ts`)

**P1**: `hapticSuccess()` on Chrome Android calls `navigator.vibrate([15, 50, 15])`.

**Negatives:**
- **N1**: Desktop Chrome — `navigator.vibrate` returns false; our call succeeds silently.
- **N2**: iOS Safari pre-18 — `navigator.vibrate === undefined`; optional-chain short-circuits; no error.
- **N3**: SSR render — no `navigator`; optional-chain prevents ReferenceError.

### 2.4 Ambiguity guardrail on validator prompt (`ai-providers.ts:766`)

**P1**: A question with stem "Which of the following was signed in 1787?" and one factually-correct option → validator returns `{approved: true}`.

**Negatives:**
- **N1**: Stem "primary responsibility of the Senate" with 3 defensible options → validator returns `{approved: false, reason: "Single unambiguous: superlative stem"}`.
- **N2**: Stem "best example of federalism" where 2 options are valid federalism examples → validator fails criterion 2.
- **N3**: Stem with no superlative but 2 correct answers due to poor distractor design → still fails criterion 2 (distractor quality).

---

## 3. Integration tests

### 3.1 Coach-funnel events end-to-end

**P1**: Auth user loads `/dashboard` → `POST /api/analytics/dashboard-event` with `event=loaded` fires → returns `{impressionId}`. Then `PrimaryActionStrip` fires `event=coach_requested` with that impressionId → DB has a `dashboard_impressions` row with `coachPlanRequestedAt` set. CTA click fires `event=coach_clicked` → same row updated.

**Negatives:**
- **N1**: Unauth request → 401 (already covered in smoke tests).
- **N2**: `event=coach_requested` with impressionId that doesn't exist → `updateMany` returns `count: 0` silently. No crash.
- **N3**: Synthetic `client_*` impressionId from race-fallback path → funnel_events row written, dashboard_impressions not updated. Both tables stay consistent.

### 3.2 Diagnostic → focused-practice bridge

**P1**: After diagnostic completes, user clicks "Start 5 Questions" on the amber card → `/practice?mode=focused&unit=AP_WORLD_UNIT_5&count=5` auto-launches a session with 5 questions from the specified unit.

**Negatives:**
- **N1**: URL without `unit` param → `startSessionWithOverrides({ unit: "ALL", count: 5 })` runs — a 5-Q session from any unit.
- **N2**: `count=999` (excessive) → clamped to 20 (per the Math.min cap).
- **N3**: User is trial-expired / subscription-restricted → practice route returns `limitExceeded: true`, sets `sessionLimitReached` state, no session starts.

### 3.3 DiagnosticNudgeModal timing

**P1**: User at 5th lifetime response → `conversion-signal` returns `responseCount=5, hasDiagnostic=false` → modal opens once.

**Negatives:**
- **N1**: Already has diagnostic → `hasDiagnostic=true` → modal never opens.
- **N2**: `responseCount=6` (past threshold, next is 10) → modal doesn't re-open at 6.
- **N3**: User dismissed modal today → localStorage `diagnostic_nudge_last_shown === today` → no re-open on 10th response same day.

### 3.4 Trial banner severity

**P1**: User with `freeTrialExpiresAt = now + 2 days`, `subscriptionTier = FREE` → banner renders in amber with "2 days left" copy.

**Negatives:**
- **N1**: `freeTrialExpiresAt = now + 1 day` → banner renders in **red** with "Last day" critical copy.
- **N2**: `freeTrialExpiresAt = now + 10 days` → banner does NOT render (>3 day threshold).
- **N3**: `subscriptionTier = PREMIUM` (already subscribed) → banner does NOT render regardless of expiry.

### 3.5 CLEP courses hidden from non-admin

**P1**: Admin navigates `/practice` → can select any of 21 courses including new 5 and (retired) CLEP.
(Note: CLEP courses have 0 approved Qs now due to soft-retire; admin sees "no questions available" gracefully.)

**Negatives:**
- **N1**: Non-admin user hits `/am-i-ready` → dropdown lists exactly 16 courses (10 AP + 2 SAT + 4 ACT). No CLEP, no new hidden APs.
- **N2**: Non-admin hits `/how-hard-is/ap-human-geography` direct URL → 404 (slugToCourse uses VISIBLE_AP_COURSES).
- **N3**: Non-admin hits `/practice?course=AP_HUMAN_GEOGRAPHY` direct URL → route validator (still VALID_AP_COURSES for schema) accepts, but the session start returns 400 "no questions" at current state. (Acceptable — user was trying an undocumented path.)

---

## 4. E2E tests (new-user conversion funnel)

### 4.1 Golden path — free to paid

1. Unauth user lands on `/` → sees hero CTA "Start AP Prep" + /pricing clearly in nav.
2. Clicks CTA → `/register?track=ap`.
3. Signs up → Google OAuth or email/password.
4. Lands on `/onboarding` → picks `AP_WORLD_HISTORY`.
5. Dashboard shows 7 cards (MasteryTierUp, Resume, PrimaryActionStrip, OutcomeProgressStrip, DailyGoalCard, MicroWinCard, WeaknessFocusCard, PathProgression).
6. PrimaryActionStrip CTA = "Try It — 60 Sec" (zero-signal warmup).
7. Clicks → `/warmup` → 3 questions.
8. Answers one correctly → haptic vibration on mobile, feedback renders.
9. Returns to dashboard → tier_label now `below_passing` (or similar).
10. Clicks PrimaryActionStrip → focused practice on weakest unit.
11. After 5 answers → `DiagnosticNudgeModal` opens "Want to see your predicted AP score?"
12. Clicks "See My Score" → `/diagnostic`.
13. Completes 10-question diagnostic → results page shows predicted score + locked detail overlay (for FREE tier) + focused-practice CTA.
14. Clicks "Start 5 Questions" on weakest unit → practice launches on that unit.
15. At day 6 of trial → red TrialBanner appears "Last day of your free trial".
16. Clicks "Upgrade" → `/billing?utm_source=trial_banner`.
17. Completes Stripe checkout → webhook updates User.subscriptionTier = PREMIUM.
18. Redirected back → banner disappears, LockedInsightOverlay now unlocks detail.

**Critical path checkpoints:** 2, 5, 8, 11, 13, 15, 18.

### 4.2 Mobile path

Same golden path but on mobile viewport → additionally verify:
- BottomNav visible with 4 tabs (Home / Practice / Mock / Progress)
- BottomNav hides in exam mode (step 8)
- Haptics fire on answer submit (step 8)
- TrialBanner readable on narrow viewport (step 15)

---

## 5. FMEA — Failure Mode and Effects Analysis

| Failure mode | Effect | S (1-5) | L (1-5) | D (1-5) | RPN | Mitigation |
|---|---|---|---|---|---|---|
| Coach-funnel race re-emerges | 0/X coach_requested metrics again | 3 | 2 | 3 | 18 | 120ms debounce + per-course guard set ✅ |
| FunnelEvent table missing in prod | Raw log silently fails | 1 | 1 | 5 | 5 | try/catch swallow ✅; table verified live |
| Hidden-flag filter leaks | Empty courses surface to users, 400 errors | 4 | 2 | 2 | 16 | VISIBLE_AP_COURSES applied to all 4 consumers; unit test 2.2 ✅ |
| Anti-ambiguity validator false-positive | Reject all generated Qs | 5 | 2 | 1 | 10 | Post-fix USGov pilot: 10/10 approved ✅ |
| Anti-ambiguity validator false-negative | Ambiguous Qs still land in prod | 3 | 3 | 3 | 27 | Spot-check after each 50-Q batch; 2/3 clean rate currently; follow-up prompt iteration TODO |
| Phase C crashes mid-run | Partial population, no progress lost | 1 | 4 | 1 | 4 | Idempotent contentHash dedup + --resume ✅ |
| DiagnosticNudgeModal opens repeatedly | User annoyance | 2 | 2 | 2 | 8 | localStorage `diagnostic_nudge_last_shown` daily cap ✅ |
| Trial banner shows for paid user | Confusion | 2 | 1 | 1 | 2 | `subscriptionTier !== 'FREE'` early return ✅ |
| Mobile haptic crashes desktop | Broken UI | 5 | 1 | 2 | 10 | Optional-chain + try/catch ✅ |
| Bottom nav overlaps modal/content | Layout break | 2 | 3 | 1 | 6 | `md:hidden` + safe-area-inset ✅ |
| User sees hidden course via direct `/practice?course=AP_HUMAN_GEOGRAPHY` | 400 error | 2 | 2 | 2 | 8 | Acceptable — obscure path; follow-up: add friendly "coming soon" page |
| New course has <500 Qs and user hits `mode=fill-to-target` | Missing questions, frustration | 4 | 3 | 2 | 24 | Hidden flag prevents exposure until Phase C completes ✅ |
| Deploy blocks on Prisma file lock | Can't ship fixes | 4 | 3 | 2 | 24 | Kill node processes + delete tmp files (documented in session) |

**All identified risks mitigated or acceptable.** Highest residual: generator false-negatives (RPN 27) — ongoing prompt iteration.

---

## 6. Page consistency audit (2026-04-22)

| Page | Version / Count consistency | Copy sync with other pages | Status |
|---|---|---|---|
| `/` (landing) | Says "10 AP courses" (matches VISIBLE count) | ✓ matches /ap-prep, /billing | ✅ |
| `/about` | Badge: Beta 6.0; package.json 6.0.0 | Release notes section 7 = Beta 6.0 | ✅ |
| `/pricing` | $9.99/mo, $79.99/yr, 33% off, 7-day refund | ✓ matches /billing, /terms | ✅ |
| `/billing` | 10 AP courses + FRQ scoring | ✓ matches /pricing | ✅ |
| `/terms` | $9.99/$79.99, 7-day refund | ✓ consistent | ✅ |
| `/faq` | "10 AP courses" | ✓ | ✅ |
| `/ap-prep` | "10 AP courses" | ✓ | ✅ |
| `/am-i-ready` | Uses VISIBLE_AP_COURSES | Lists 16 | ✅ |
| `/how-hard-is/[slug]` | generateStaticParams filters hidden | 16 pages only | ✅ |
| Sidebar | Hardcoded 10 AP / 2 SAT / 4 ACT | ✓ | ✅ |

**Copy that would change if we flip `hidden: false` later:** landing `10 AP` → `15 AP`, billing, faq, /ap-prep, sidebar hardcoded list. Document this at the hidden-flag.

---

## 7. Conversion funnel gaps (current state assessment)

**Working:**
- Signup → onboarding → first session path is clean.
- Diagnostic → focused-practice 5-Q bridge is live.
- DiagnosticNudgeModal fires at 5 + 10 lifetime responses.
- LockedInsightOverlay reveals predicted score + blurs detail for FREE.
- TrialBanner escalates in final 3 days.
- Coach funnel instrumentation fires correctly post-fix.

**Gaps to address next session:**
1. **No middleware gating after trial expiry** — trial expires but user can still practice for free. Schema has `freeTrialExpiresAt` but nothing enforces it in `middleware.ts`. User decision pending.
2. **Trial banner references "Upgrade" but doesn't specify plan** — clicking takes to `/billing` which asks for module selection. One-click trial → premium flow isn't direct.
3. **Cron emails require user activity** — `trial-reengagement` only fires if user has lastActiveDate. First-time signups who never return get no re-engagement email until the 24h-dormant threshold.
4. **No "pass probability trend" after practice** — SessionDeltaCard shows "3.2 → 3.5" but doesn't feed into the Trial banner ("You went from 3.2 to 3.5 — upgrade to keep going"). Tied-to-progress messaging would boost conversion.
5. **Flashcards not shipped yet** — schema live, no UI. PrepLion converts 15% of trial users via flashcard daily streak; we get 0% until shipped.

---

## 8. Release checks

- [x] `npx tsc --noEmit` — clean
- [x] `npm run release:check` — 24/24 pass
- [x] CF Workers compat — no banned SDK imports
- [x] Pricing: $9.99 / $79.99 / 33% in all 5 key files
- [x] Terms 7-day refund in pricing + /terms
- [x] Logo consistency in all layout files
- [x] Version: package.json 6.0.0 matches About Beta 6.0
- [x] Practice test plan covers all 72 courses
- [x] PWA manifest + icons + SW
- [ ] Manual mobile test — **YOU need to run through golden path (§4.1-4.2) on an Android device before flipping new courses visible**

---

## Sign-off gate for Beta 6.0 deploy

1. All ✅ in release checks ✅
2. Unit/integration test plan documented ✅
3. FMEA reviewed ✅
4. Page consistency audited ✅
5. Funnel gaps documented ✅
6. Manual mobile E2E ⏳ — user to run before flipping hidden courses
7. Phase C populates USGov + Precalc to 500 ⏳ — ongoing, admin-only until then

**Safe to deploy Beta 6.0 now** — it only ships code changes + hidden-flag protection. No user-visible new courses until you explicitly flip `hidden: false`.
