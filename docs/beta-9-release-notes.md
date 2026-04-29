# Beta 9 Release Notes — FTUE Redesign Milestone

**Date:** 2026-04-29
**Tag:** `beta-9` (commits 2442828 → 6f3c023)
**Theme:** First-Time-User-Experience overhaul — convert signup → first learning action in <60s.

---

## Why Beta 9

7-day signup-funnel data (54 free users):

```
Stage 1: 37%  ████████   Signed up → never started a session
Stage 2: 11%  ██         Opened session → never answered
Stage 3: 15%  ███        Answered → didn't finish
Stage 4:  4%  ▌          Finished 1 session → didn't return
Stage 5: 33%  ███████    Engaged (multiple sessions)
```

Stage 1 (37% never-started) was the single biggest leak. Root cause: the dashboard showed multiple cards + a 4-step "Pick your plan" onboarding wizard before users had answered a single question. Decision paralysis + premature monetization. Beta 9 collapses onboarding into 1 screen → 1 click → first question.

Plus a strategic pivot on FRQ:
- Pre-Beta 9: hard paywall on FRQ practice → free users couldn't evaluate DBQ/LEQ quality before paying → no conversion
- Beta 9: taste-first model — 1 free attempt of each FRQ type per course, depth (detailed coaching) is the premium lever

---

## Requirements (locked)

### R1 — FTUE flow
- New user signs up → lands on `/practice/quickstart` (NO 4-step wizard, NO Pick-Plan, NO "How It Works" page)
- Single screen: "Most students start here — AP World History" big card + "Or choose a different exam" disclosure
- Track-aware: SAT signups see SAT_MATH recommended, ACT signups see ACT_MATH
- Click → 5-Q EASY MCQ session in chosen course
- Q5 → session summary always shows clear "next step" CTA (not blank space)
- After first session: `User.onboardingCompletedAt` set; subsequent logins go to /dashboard normally

### R2 — FRQ taste-first model (`FREE_LIMITS.{dbq,leq,saq,frq}FreeAttemptsPerCourse = 1`)
- Free user can browse the full FRQ list per course (no page-level paywall)
- Free user can submit 1 DBQ + 1 LEQ + 1 SAQ + 1 generic FRQ per course (lifetime)
- Each free attempt: full prompt + documents + rubric + basic AI scoring
- Hitting per-type cap: 403 with upgrade message, NOT a hard wall on the page
- Premium: unlimited attempts + detailed line-by-line coaching ("on line 3 you said X, the rubric expects Y because…")
- Min-100-char client-side validation (prevents demoralizing 0/6 from a 1-sentence answer)

### R3 — Always-on next-step nudge
- Session-summary screen renders `<NextSessionNudge>` for every user
- New user (no weakest unit yet): "Keep momentum — 5 more questions in {course}"
- Returning user (mastery data exists): "Close the gap on {weakestUnit}"
- Never returns null / never blank space

### R4 — FRQ taste insertion (post-Q5 MCQ)
- New `<FrqTasteNudge>` renders on session-summary for users with 0 prior FRQ submissions in the course
- "Now try one real AP-style FRQ — graded by the official CB rubric (free)"
- Click → /frq-practice?course=X&first_taste=1 → page shows blue confidence banner

### R5 — CB-aligned content (carryover from Beta 8.11)
- All 14 marketed-tier AP courses match current CB CED (Course and Exam Description)
- AP Physics 1: 8 units including new Unit 8 Fluids (CB 2024-25 redesign reflected)
- AP Chemistry: Unit 9 named "Thermodynamics and Electrochemistry" (CB CED official)
- 147 off-syllabus questions retired (Charge/Circuits/Waves moved to AP Physics 2)
- 7 new AP courses unhidden (Eng Lit, Euro, Macro, Micro, Phys 2, Phys C E&M, CS A)
- AP Phys C Mechanics still hidden (only 30 Qs — needs population)

### R6 — Telemetry / feedback
- Pablo Sarkar fix: feedback popup delay 1500ms → 300ms (was: tab-close before popup mounted)
- Mandatory Good/Bad with reason capture on Bad (Beta 8.7 carryover)
- New `/api/practice/frq-attempts-count` endpoint for FrqTasteNudge gating

---

## Architecture changes

### New routes / components
| Path | Purpose |
|---|---|
| `src/app/(dashboard)/practice/quickstart/page.tsx` | Single-screen smart-default course picker (track-aware) |
| `src/components/practice/frq-taste-nudge.tsx` | Post-Q5 FRQ taste CTA |
| `src/app/api/practice/frq-attempts-count/route.ts` | Counts FRQ submissions per (user, course) |

### Modified
| Path | Change |
|---|---|
| `src/app/(dashboard)/onboarding/page.tsx` | 540-line wizard → 4-line server `redirect()` to /practice/quickstart |
| `src/app/(dashboard)/layout.tsx` | First-time-user redirect target: /onboarding → /practice/quickstart |
| `src/components/practice/next-session-nudge.tsx` | Always-on with new-user fallback (no more silent null return) |
| `src/components/practice/frq-practice-card.tsx` | Min-100-char client-side validation with growth-mindset copy |
| `src/lib/tier-limits.ts` | Per-type FRQ caps (`{dbq,leq,saq,frq}FreeAttemptsPerCourse: 1`) |
| `src/app/api/practice/route.ts` | Per-type cap enforcement on FRQ submit |
| `src/app/(dashboard)/frq-practice/page.tsx` | Page-level paywall removed; first_taste banner added; a11y color-contrast fix |
| `src/components/feedback/session-feedback-popup.tsx` | Delay 1500 → 300ms (Pablo Sarkar fix) |

### Schema
- No DB-schema changes in Beta 9 (additions deferred to 9.1: `StudentResponse.wasUnknown` for IDK button)
- Tier-limits config is in code (`tier-limits.ts`), not DB

---

## FTUE flow diagram (sequence)

```
SIGNUP (email or Google OAuth)
  ↓
[email verified, redirect to /login OR auto-redirect via NextAuth]
  ↓
LOGIN → /dashboard
  ↓
DashboardLayout useEffect: onboardingCompletedAt === null?
  ├─ yes → router.replace("/practice/quickstart")
  └─ no  → render dashboard (returning user)
  ↓
/practice/quickstart
  ├─ Track-aware course catalog (ap/sat/act)
  ├─ Big card: "Most students start here — {RECOMMENDED_COURSE}"
  └─ "Or choose a different exam" → reveals other 9 courses
  ↓
[user clicks Start]
  ↓
setCourse(course) → localStorage + cookie + event
router.push("/practice?mode=focused&count=5&course=X&src=quickstart")
  ↓
/practice page
  ├─ useCourse() reads new course from localStorage
  ├─ autoLaunch useEffect detects mode=focused
  └─ POST /api/practice → creates session
  ↓
Q1 → answer → inline feedback → Q2 → ... → Q5
  ↓
Session complete → PATCH /api/practice/[sessionId]
  ├─ Sets onboardingCompletedAt = NOW (first-time)
  └─ Updates XP, streak, mastery
  ↓
mode=summary
  ├─ Stats card (accuracy, XP, time, AP score estimate)
  ├─ <FrqTasteNudge> (renders if 0 prior FRQ submissions)
  ├─ <NextSessionNudge> (always renders, new-user fallback if no weakest unit)
  └─ Quick feedback (👍/👎 inline)
  ↓
[user clicks FrqTasteNudge "Try a real FRQ now"]
  ↓
/frq-practice?course=X&first_taste=1
  ├─ Blue banner: "Your first free FRQ — see how the AP rubric grades you"
  └─ FRQ list (free user can browse + submit any one)
  ↓
[user picks FRQ + writes answer]
  ↓
handleSubmit (frq-practice-card.tsx)
  ├─ Length < 100 chars? → Toast: "Write a bit more before submitting"
  ├─ POST /api/frq/[id]/submit
  │   ├─ Checks per-type cap (DBQ/LEQ/SAQ/FRQ free attempts per course)
  │   ├─ Cap reached → 403 with upgrade message
  │   └─ Cap not reached → AI grading via cascade
  └─ Reveal rubric breakdown + sample answer
```

---

## Test plan (Beta 9)

### Automated (Playwright E2E gate)
- **FMEA-1** — quickstart shows recommended course + Start CTA, no wizard
- **FMEA-2** — no premature pricing/Pick Plan in onboarding flow
- **FMEA-3** — quickstart click → /practice with focused mode + correct course
- **FMEA-4** — FRQ Practice taste-first model (free user can browse + try, depth gated)
- **FMEA-4b** — `/frq-practice?first_taste=1` shows blue first-taste banner
- **FMEA-4c** — FRQ submit under 100 chars is blocked with guidance toast
- **FMEA-5** — Flashcards page shows current course name prominently
- **FMEA-6** — Sidebar nav items all resolve to 200 for free user
- **FMEA-7** — Dashboard has no 'pass probability' language leak
- **FMEA-8** — `/billing` exposes Premium upgrade CTA (post-value placement)
- **FMEA-9** — `/api/user/limits` returns Option B tier-limits for free user
- **FMEA-10** — `/api/auto-launch-check` returns shouldNudge:false for fresh user
- a11y-scan, paywall-accuracy, nawal-nudge, billing-flicker, persona-c-* — all preexisting; updated where stale-test mismatch existed

### Manual (user verifies on staging URL before promote)
1. Sign up fresh email → quickstart shows AP World History card
2. Click Start → 5-Q AP World History session loads (correct course, not stuck on default)
3. Answer Q1-Q5 → summary shows blue FRQ-taste card above amber next-step card
4. Click FRQ taste card → /frq-practice with blue banner
5. Pick FRQ → write 1 sentence → submit → toast guidance "Write a bit more"
6. Write 1-2 paragraphs → submit → AI rubric grade (free, no upgrade)
7. Try second DBQ in same course → 403 with upgrade message

### Edge cases (FMEA, captured in `docs/qa-ftue-fmea-walkthrough.md`)
- 1.N1 ✅ Track-aware quickstart fixed (SAT/ACT signups not stranded)
- 6.N2 ✅ Min-char validation prevents demoralizing 0/6
- 5.N1 ⚠️ Empty FRQ list edge case (8 new courses with thin coverage)
- 6.N1 ⚠️ AI cascade fail loses unsaved answer (deferred to 9.1)
- Pablo data anomaly ⚠️ session "completed" + 0 student_responses (forensic — deferred)

---

## Known issues / deferred to Beta 9.1

1. **AP Psychology 9→5 unit migration** — 366 questions on stale CB framework, needs AI-assisted retag
2. **AP Phys C Mechanics population** — only 30 Qs across 4 units; still hidden
3. **8 new AP courses unit-distribution** — most have only 1-4 units populated; AI-gen on first session for empty units
4. **SAT Reading & Writing expansion** — only 96 Qs (vs SAT Math 304); needs ~3x growth
5. **`/billing` + `/pricing` outcome-driven copy** — task #34, not yet applied
6. **"I don't know yet" button** (Mikayla Como insight) — Beta 9.1 headliner feature
7. **AI cascade failure → save draft locally** — improvement for Beta 9.1
8. **Pablo Sarkar data anomaly** — investigation pending

---

## Rollback plan

Tag `beta-9` is on commit `<HEAD>`. If anything breaks in production:
1. Identify last good prod tag (`beta-8.5` is safest pre-FTUE-redesign)
2. `git checkout beta-8.5` → `npm run pages:deploy` → manual revert
3. DB additions (FRQ taste-first markers, new questions, new schema enums) are reversible — they don't break older code paths since enum values are additive
