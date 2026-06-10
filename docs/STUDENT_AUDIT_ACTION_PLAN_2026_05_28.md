# Student Audit — Unified Action Plan

**Date:** 2026-05-28
**Source:** Two audit passes (quick walkthrough + deep screen-by-screen) across both products.
**Total issues:** ~485 (PL ~272 + SN ~213).
**Severity split:** ~50 P0 · ~180 P1 · ~200 P2 · ~55 P3/nit.

Full per-page findings live in:
- `C:\Users\akkil\project\PrepLion\docs\STUDENT_WALKTHROUGH_2026_05_28.md`
- `C:\Users\akkil\project\AP_Help\docs\STUDENT_WALKTHROUGH_2026_05_28.md`

---

## Cross-cutting themes (the bug patterns that recurred across BOTH products)

These show up in 3+ audits, so they're structural, not one-off:

| # | Pattern | Why it matters |
|---|---|---|
| 1 | **Single-source-of-truth violations** — pricing, limits, vocab, exam metadata all split across surfaces and disagree | Free Sage cap is "3/day" on 2 pages and "5/day" on 4 others. Fast Track is $49 in code but $39 in FAQ. Mock-exam is 5 Qs in code but "12 questions" in billing copy. Lawsuits get built around exactly this. |
| 2 | **No /settings route in either repo** | Sidebar has 14-17 nav items, none of them Settings. No place to change email/name/exam-date/track in-product. Cancel buried as text link on /billing. CCPA/GDPR exposure plus chargeback risk. |
| 3 | **Wrong exam format on key surfaces** | PL: landing demo question is 4 options not 5 (CLEP-defining fact). FRQ in CLEP journey. DSST passing hardcoded to 50 (DSST is 200-500). SN: AP-score-1-5 copy hardcoded on the SAT/ACT score-reveal screen. Pricing tabs imply per-module SKUs while hero says "one subscription." |
| 4 | **Diagnostic over-claims** — predicting scaled scores off 5-Q samples | PL: "projected CLEP score 30 (passing 50)" off 5 questions, with median-50 fallback when API fails. SN: same shape. "82% pass probability on average" unsourced. This pattern is the kind of thing that gets prep companies sued AND torpedoes Reddit credibility. |
| 5 | **Onboarding fragmentation** — multiple paths to the same destination | PL: register → /journey (canonical) OR /onboarding (Accuplacer + legacy) + 3+ modals (Welcome, Interstitial, ConfidenceRepair, PostCompletion) firing in some surfaces and not others. SN: similar. |
| 6 | **Dashboard buffet** — 13-17 cards/CTAs competing for attention | Both products' own code comments say "ONE CTA" but markup shows 13+ conditional cards. Student can't tell what to do next. |
| 7 | **Sage suite incoherence** | Daily caps invisible until you hit them. SN: dashboard pitches Sage Coach as "FRQ Grader" but the page is voice-only — bait-and-switch for premium users. PL: 10 free/day buried in pricing FAQ. |
| 8 | **Patch-on-patch fixes never holding** | PL practice page has SIX stacked fix-layers for the Q2/Q3 auto-select bug, each comment confessing the prior didn't hold. Sage FAQ has gotten 3 different mitigations for substring-matcher misfires. |
| 9 | **Marketing/code drift on counts** | PL counts 57 exams (it's 56). Question count quoted as 28k / 29,523 / 30,500+ / 19,330 across pages. Version badges: A23.4 + Alpha 26 + Alpha 15.0 all visible on the same About page. |
| 10 | **Legal/compliance landmines** | Two different Pass Guarantees (PL + SN) with conflicting eligibility on different pages. PL `am-i-ready` one-click "Copy + Open Reddit" buttons (astroturfing — instant subreddit ban). Mock-exam scaled-score prediction off 5 Qs (consumer-protection risk). |

---

## Top 15 P0 ship-blockers (ranked by `student-bounce-risk × volume-of-affected-users`)

### Both products

| # | Repo | Issue | File:line |
|---|---|---|---|
| 1 | PL | CLEP demo question on landing is 4 options (A-D), not 5 (A-E) | `interactive-demo.tsx:8-23` |
| 2 | PL | FRQ in CLEP journey — CLEP is 100% MCQ | `step-2-frq.tsx:165-169`, `journey/page.tsx:391` |
| 3 | PL | DSST passing hardcoded to 50 — DSST is 200-500 (passing 400) | `step-5-done.tsx:40` |
| 4 | PL | 5-Q diagnostic mapped to 20-80 CLEP scaled score with median-50 API-fail fallback | `step-3-diagnostic.tsx:73,115` |
| 5 | PL | Mock exam predicts "scaled 45-55/80" off 5 questions, paywall mid-test | `mock-exam/page.tsx:441-458,866-868` |
| 6 | PL | "5-step journey" is now a 2-step (Step 0→1→3→5); progress jumps 0→20→60→100%; marketing copy still says 5-step | `journey/page.tsx:268-272`, `step-0-course-pick.tsx:143,170` |
| 7 | PL | Two complete onboarding paths (/onboarding + /journey) with different diagnostic engines that disagree | `dashboard/layout.tsx:90-92` |
| 8 | PL | Practice page has 6 stacked fix-layers for the Q2/Q3 auto-select bug, each confessing prior didn't hold | `practice/page.tsx:161,295,309,549,729,757` |
| 9 | **Both** | No /settings route exists. Cancel buried as text link. No delete-account. CCPA/GDPR. | PL & SN both |
| 10 | **Both** | Dashboard has 13-17 cards but own code comment says "ONE CTA" | PL & SN both |
| 11 | SN | AP-score-1-5 hardcoded on score-reveal for SAT/ACT students | `journey/page.tsx:341-355`, `step-3-diagnostic.tsx:148-149`, `step-5-done.tsx:38,47,49` |
| 12 | SN | FRQ promised then silently auto-skipped for SAT/ACT — looks broken | `step-0-course-pick.tsx:115-117`, `journey/page.tsx:287-295`, `step-2-frq.tsx:46-48` |
| 13 | SN | Step 0 picker labeled "AP course" but lists SAT/ACT/PSAT | `step-0-course-pick.tsx:46-50` |
| 14 | SN | Sage Coach dashboard promo says "FRQ Grader" but page is voice-only oral coaching | `sage-coach-promo-card.tsx:89-95` vs `sage-coach/page.tsx` |
| 15 | SN | Mock Exam is single-section linear list still called "Mock Exam" — students think they did a full mock | `mock-exam/page.tsx:37` |

---

## Sprint plan

### Sprint A — Truth-in-product week (5 working days, both repos in parallel)

**Goal:** kill every place the UI says something the product doesn't deliver.

- A1. Fix the CLEP demo question to 5 options (PL `interactive-demo.tsx`).
- A2. Gate the Journey Step 2 FRQ on `track !== "clep" && getExamCopy(course).hasFreeResponse === true` (PL + SN — exam-copy lib already exists in SN, never imported).
- A3. Drop the diagnostic scaled-score reveal for samples <15 Qs. Show "X/5 correct — take the full diagnostic to see your projected scaled score." (PL + SN)
- A4. Pull mock-exam paywall + scaled-score-prediction off any session <30 Qs (PL + SN). Rename the paywalled view "Practice Set" until you can ship the real mock.
- A5. Replace all SAT/ACT score-reveal copy in SN journey with `getExamCopy(course)` outputs.
- A6. Audit + flatten the "5-step" progress bar — either restore the deleted steps or change every "5-step" string to "3-step."
- A7. Pick ONE onboarding path per repo. Delete the other or redirect.
- A8. Unify all pricing/limit/version numbers into one constants file imported by every surface.

**Risk:** low (mostly copy + small gates + delete dead surfaces). **Test:** click through every flow on staging with a fresh account.

---

### Sprint B — Information architecture week (5 days)

**Goal:** student should know what to do next within 10 seconds of landing on the dashboard.

- B1. Build `/settings` route in BOTH repos (email, name, password, exam date, course/track, notifications, sub status, delete-account). Move cancel link there from /billing.
- B2. Collapse dashboard to ONE primary prescription card ("Drill Unit 4 (41%) → 5 Qs, 3 min"). Move everything else to `/tools`. Both repos.
- B3. Add a Sage daily-cap counter on the Sage page header (not buried in pricing FAQ).
- B4. Resolve Sage Coach contradiction: either rename dashboard promo to "Oral Coaching" OR build the FRQ Grader the promo advertises.
- B5. Sidebar reorder + collapse: cap visible items at 7. Move admin/dev items behind a toggle.

**Risk:** medium (touches multiple surfaces but each change is contained).

---

### Sprint C — Legal + trust week (5 days)

**Goal:** remove every consumer-protection landmine.

- C1. Unify the two Pass Guarantees into one canonical /pass-guarantee page; redirect /methodology's "Pass Confident Guarantee" claim to it.
- C2. Remove the one-click Reddit-post-draft + "Open Reddit" buttons from `am-i-ready/[slug]/readiness-assessment.tsx` — astroturfing risk.
- C3. Fix Wall of Fame: exclude "Example" + "Early tester" rows from the hero's "Real students. Real savings" total, OR remove the legend OR add a separate "Beta data" footer.
- C4. Ship a 404 page (`src/app/not-found.tsx`) on PL.
- C5. Mirror reset-password Zod schema to register's stricter rules (SN).
- C6. Drop the grade-11/12 register lock; open to 9-12 + adult (SN).
- C7. Stripe webhook idempotency upgrade: write StripeEvent log row first, then reconciler projects entitlements.

**Risk:** low-medium per item, high impact.

---

### Sprint D — Architectural refactors (multi-sprint, parallel with above)

- D1. **Practice page state-machine refactor (PL P0 #1 from design audit)** — replace 15+ useState slots + 6 stacked fix-layers with a single keyed `Record<questionId, cell>` + reducer. 1-2 weeks. Needs proper e2e harness first.
- D2. **Sage Coach FSM rewrite (SN P0 #4)** — single state machine, chunked transcript persistence to sessionStorage every 5s, collapse the dual-timer-plus-ticker. 1 week.
- D3. **Session summary 3-denominator unify (PL P0 #2)** — server returns canonical, client deletes all fallback math. 2-3 days.
- D4. **Mock Exam → real Digital SAT adaptive format** (SN). Bluebook is 2-module adaptive since March 2024. This is the gating issue for SN credibility on r/SAT. 2 weeks.

---

## Suggested execution order

| Week | Sprint | Why |
|---|---|---|
| 1 | A (truth-in-product) | Stop saying things that aren't true. Cheap to ship, biggest credibility lift. |
| 2 | C (legal+trust) | Pull the litigation pins. Mostly small changes. |
| 3 | B (IA week) | Now that copy matches code, fix the navigation. |
| 4-5 | D1, D3 (PL refactors) | Architectural bugs in the core loop. |
| 6-7 | D2, D4 (SN refactors) | Flagship features rebuilt right. |

After Sprint A + C, the products should jump from 5.0/10 → 7.5/10 on the student rating. Sprint B closes to 8.5/10. Sprint D pushes to 9+/10.

---

## What NOT to do

- Don't ship more features until Sprint A is done. Every new feature inherits the same single-source-of-truth pattern.
- Don't try to do Sprint D1 (practice page refactor) without an e2e test suite. The 6 stacked fix-layers exist because the previous fixes broke other things. A bare refactor will re-break them.
- Don't roll Sage Coach FSM and FRQ Grader into the same sprint — Sage Coach is a rewrite, FRQ Grader is greenfield. Different teams ideally.
- Don't fix any single issue in isolation. Use this doc to batch — most surfaces have 5-15 small issues that should ship together.
