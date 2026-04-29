# QA Walkthrough — Post-Session Next-Step Direction

**Requirement (from user, 2026-04-29):**

> Every time user completes a session, dashboard should clearly direct to next step and should have clear next steps for user to follow.

**Method:** Trace each user click against the actual code paths in `src/`. Read every text the user sees. Identify intent gaps (where user is left wondering "what now?").

**Status: GAPS FOUND — see Findings + Fix Plan at bottom.**

---

## Persona A — New user, just finished first 5-Q quickstart session

### Pre-conditions
- Just signed up (Google OAuth or credentials)
- Picked AP Biology in `/practice/quickstart`
- Answered 5 EASY MCQs, mixed score (e.g. 3/5 = 60%)
- `User.onboardingCompletedAt` was just set on session complete

### Step-by-step (actual code path traced)

| # | User location | What user sees | Intent | Gap? |
|---|---|---|---|---|
| 1 | `/practice` (mode=summary) | Trophy icon + "Session Complete!" headline | Acknowledge finish | None |
| 2 | Same screen | "Great first session! Keep practicing to track your improvement" (text from line 902) | Encourage repeat | None |
| 3 | Same screen | TotalPointsEarned + accuracy + XP + correct/total + time tiles | Show stats | None |
| 4 | Same screen | `<NextSessionNudge>` component (line 847) | **Surface specific next step** | **🔴 RENDERS NULL** for first-time user — component returns null when `weakestUnit` is null, and `weakestUnit` comes from `/api/coach-plan` which needs ≥10-20 responses to compute mastery. After 5 Qs, mastery data is too thin → no nudge → blank space |
| 5 | Same screen | Quick feedback (👍 / 👎 buttons) | Capture signal | None |
| 6 | Same screen | Per-question result list | Show what they got right/wrong | None |
| 7 | Bottom of screen | Two buttons: **"Practice Again"** (resetSession) and **"View Analytics"** (links to /analytics) | Direct to next step | **🟡 PASSIVE.** "Practice Again" repeats same quickstart bank. "View Analytics" sends them to a stats page, not a NEW session. Neither suggests WHICH unit to practice or WHY. |
| 8 | If user clicks "Practice Again" | New /practice session in same course, generic settings | Practice continuation | **🟡 NO PROGRESSION.** Doesn't tell them which unit, doesn't explain why "Unit 3 is weakest, here are 5 more" |
| 9 | If user clicks "View Analytics" | Generic analytics page with all-units overview | Self-discover where to focus | **🔴 SELF-SERVICE.** User has to interpret stats and decide what to practice. Most students give up here. |
| 10 | If user navigates to `/dashboard` | `<PrimaryActionStrip>` shows main CTA — but… | Directing to next action | **🟡 DEPENDS ON COACH-PLAN MATURITY.** With only 5 responses, coach-plan returns "Building Foundation" tier with `nextAction.label = "Start a practice session"`. Generic. No specific unit recommendation. |

### Gaps identified

🔴 **Gap A1 — NextSessionNudge silent for new users.** First-time user with <20 responses sees no specific next-unit nudge after first session. The card is conditionally hidden when `weakestUnit` is null, leaving blank space where the most important "what next" guidance should live.

🟡 **Gap A2 — Bottom CTAs don't progress.** "Practice Again" and "View Analytics" don't suggest a specific next action. A motivated user wants to keep going but doesn't know **what** to keep going at.

🔴 **Gap A3 — Dashboard for new user is generic.** Coach-plan needs ≥20 responses to recommend a weak unit. Until then, dashboard shows "Building Foundation" with "Start a practice session" — same as before they did anything. No sense of progress earned.

---

## Persona B — New user, finished 2-3 sessions (15 MCQs)

### Pre-conditions
- Has done 3 sessions, ~15 MCQs total
- ~60% accuracy
- One clear weak topic (e.g. AP Biology Unit 5: Heredity)

### Step-by-step

| # | User location | What user sees | Gap? |
|---|---|---|---|
| 1 | `/practice` (summary after 3rd session) | Same flow as Persona A | NextSessionNudge MAY now render IF mastery has computed a weakest unit. Race condition. |
| 2 | Bottom | Same "Practice Again" / "View Analytics" | Same gaps as A |
| 3 | `/dashboard` | PrimaryActionStrip should now show "Start 5 Qs in Heredity" or similar | Need to verify coach-plan returns specific unit at 15 responses |

### Gaps identified
🟡 **Gap B1 — Threshold unclear.** When does the system transition from "generic CTA" to "specific weak-unit CTA"? Need explicit threshold (e.g. 15 responses) AND user-visible signal that they're earning the personalization.

---

## Persona C — Returning user (50+ MCQs done)

### Pre-conditions
- Has 50+ responses, established mastery profile
- Returning after 2 days

### Step-by-step

| # | User location | What user sees | Gap? |
|---|---|---|---|
| 1 | `/dashboard` | PrimaryActionStrip with "Resume" or specific weak unit | Should work — verify |
| 2 | If finishes session | NextSessionNudge with weakest unit + streak | Should work — verify |

### Gaps identified
None expected — main flow is well-built once data has accumulated.

---

## Findings — root cause

**The "no clear path" complaint is concentrated at Persona A (new user, 1-5 sessions).**

Three compounding causes:
1. **NextSessionNudge silent** when mastery data is thin (≤10-15 responses)
2. **Bottom CTAs are generic** ("Practice Again", "View Analytics") with no progression signal
3. **Dashboard CTA is generic** until coach-plan has enough data (~20 responses)

A new user doing 5 Qs gets:
- ❌ No "what's next" on session-summary
- ❌ No "what's next" on dashboard
- ❌ Two passive buttons that don't progress them
- ❌ "View Analytics" assumes they know how to interpret stats

That's the path-less feeling.

---

## Fix plan — Beta 8.13.x

### Fix 1 — Always-on next-step strip on session summary (HIGH ROI)
Replace the bottom 2-button row (`Practice Again` / `View Analytics`) with a **deterministic next-step block** that ALWAYS shows a specific recommendation:

| User state | Bottom CTA |
|---|---|
| 0-1 sessions done | "**5 more questions in {course}** — keep momentum going" → /practice?mode=focused&count=5&course=X |
| 2+ sessions, weakestUnit known | "**5 questions in {weakestUnit}** — your weakest area" → /practice?mode=focused&unit=X&count=5 |
| Daily cap hit | "**You've hit today's free limit. Upgrade or try Sage AI tutor**" → /billing OR /ai-tutor |
| Any state | "View progress" link (secondary, not primary) |

This eliminates the "blank next-step" failure mode.

### Fix 2 — NextSessionNudge fallback for new users
When `weakestUnit` is null (insufficient mastery data), render a **fallback card** instead of returning null:
- "Just getting started — 3 more sessions and we'll surface your weakest unit"
- CTA: "Continue practicing {course}" → /practice?mode=focused&count=5&course=X

### Fix 3 — Dashboard "you just finished" banner
When user lands on /dashboard from session-summary, show a top banner:
- "Just finished a session in {course}? Here's your next move."
- Specific unit if known, course-level otherwise

### Fix 4 — Make the "next step" sticky after each session
Set a `lastSessionEndedAt` cookie/state. While that cookie is fresh (last 5 min), show a persistent "continue from where you left off" banner across all dashboard views.

### Pre-deploy verification (this time, ACTUALLY do it)
Walk Persona A end-to-end on staging URL:
- [ ] Signup → quickstart picker shows 10 courses
- [ ] Pick AP Biology → 5 EASY questions load (verify course = AP Biology, not AP World History)
- [ ] Answer Q1-Q5 → summary screen
- [ ] **Bottom of summary: SPECIFIC next action visible (not just "Practice Again")**
- [ ] Click bottom CTA → lands in correct next session
- [ ] Navigate manually to /dashboard → top banner says "just finished AP Bio session — here's next"
- [ ] PrimaryActionStrip shows specific course recommendation
