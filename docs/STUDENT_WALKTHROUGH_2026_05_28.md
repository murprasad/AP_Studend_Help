# StudentNest — Real-Student Walkthrough (2026-05-28)

> Reviewer profile: 11th-grade CB-veteran (CLEP × few, AP Calc BC/Bio/Lang/Chem/CSA, SAT 1480, ACT 33). Walked every page as if signing up cold. No mercy for marketing fluff; no marks deducted for honest "we're not there yet."

---

## Executive headline

- **Overall coherence: 6.5/10.** The product knows what it wants to be — a diagnostic-first, "we'll tell you what you don't know" study tool — and the journey rail (steps 0→5) actually delivers that promise *if you complete it*. But after Step 5, the product fragments into a buffet of cards, and the AP-vs-SAT/ACT story is wildly uneven.
- **Biggest "would bounce" moment:** The dashboard after first session. Counted **6+ competing cards** firing simultaneously (Greeting, JourneyHero, AutoLaunchNudge, MasteryTierUp, Resume, PrimaryActionStrip, SingleQuestionEntry, ExamDatePromptCard, CramMode, DailyStudyOS, DiagnosticPrompt, OutcomeProgressStrip, then "Show more" hiding 5 more). The "ONE primary action" claim in the comment block is contradicted by what actually renders. As a real student I'd close the tab.
- **Honest credibility score:** Marketing 7/10 (the "we got it wrong before" honesty block is gold; the manufactured testimonials at lines 97-120 of `src/app/page.tsx` undercut it). Product 5/10. The bones are good but the seams show.

---

## 1. Landing page — `src/app/page.tsx`

**Works:**
- "Find out exactly what's missing — before exam day." That's a real student pain. Pain-first hero (line 271-281) is the strongest copy on the site.
- `InteractiveDemo` next to hero (line 301) — actually shows the product loop instead of a generic dashboard mockup. Good.
- The "We got it wrong before" honesty section (lines 1028-1054) is the single most credible thing on the site. Most ed-tech sites hide their failures.
- Module cards filter via `getVisibleCourses()` allowlist (line 132-143) — so a course doesn't appear if the bank can't back it. That's honest infrastructure.

**Broken / Incoherent:**
- **Fake testimonials at lines 97-120.** "Sofia R." and "Marcus T." with metric specifics ("D → B in one marking period"). Site itself says elsewhere "we don't manufacture testimonials" — these read manufactured.
- **"4-minute diagnostic" claim** in three places (hero line 276, line 348-354, page CTA line 1107). The actual diagnostic page (`src/app/(dashboard)/diagnostic/page.tsx:138-141`) says "15-min MCQ check." That's a 3× gap between marketing and product.
- **"500+ released College Board FRQs from past exams"** (feature copy, line 44). For SAT/ACT this is dishonest — they don't *have* FRQs (the code knows this: `step-2-frq.tsx:43-48` auto-skips for non-FRQ exams; `sage-coach-promo-card.tsx:73-75` hides for SAT/ACT). The hero copy doesn't disclaim.
- **Stat in social-proof bar (line 421):** "8 engagement features" — what student cares? This is internal-team language leaking onto a marketing page.
- **"Less than a single hour of tutoring"** (line 965) is good. But the parent section (line 1062) says "$50/hr × 24 hours = $1,200 vs our $20." Where does $20 come from? Pricing says $9.99/mo or $79.99/yr. Confusion = "are they hiding the real price?"

**Would bounce:** No. The hero, honesty block, and "We catch overconfidence early" tension section (line 687-735) carry it. But I would hover and squint at the fake testimonials.

---

## 2. Pricing — `src/app/(marketing)/pricing/page.tsx` + `pricing-client.tsx`

**Works:**
- `$9.99/mo or $79.99/yr — save 33%` is clear. Toggle works. Tier per module shown side-by-side.
- "One subscription unlocks every exam" headline (line 151) is the correct value framing — students cross-prep AP + SAT.
- 7-day refund mentioned. Cancel anytime mentioned.

**Broken / Incoherent:**
- **Free tier copy contradicts itself across surfaces.** Pricing-client says "30 practice questions per day" + "3 Sage chats per day" + "1 free FRQ per type per course" (line 101-113). Landing page agrees. But pricing/landing also say "5-question mock exam preview" — yet the mock-exam page enforces this only via a `FREE_LIMITS.mockExamQuestions` partial-lock at Q5 (mock-exam/page.tsx:344-347). What does a "5-Q mock" actually feel like? Cliff at Q5 with paywall? Need clarity.
- **Per-module tabs (AP/SAT/ACT) suggest separate subscriptions.** But the headline says "one subscription unlocks every exam." Pick one. The tabs are misleading because they swap feature text per "module" — looks like 5 different SKUs.
- **No annual savings actually appears** when you toggle to annual on a specific module — toggle is global, but each tab still shows monthly price front-and-center. Confusing.

**Would bounce:** No, but I'd email support to ask "do I need one sub per exam or not?"

---

## 3. Sign-up — `src/app/(auth)/register/page.tsx`

**Works:**
- Google sign-in if available, with explicit "No password, no email verification" sub-copy (line 282) — kills friction.
- Auto-sign-in after register (line 162-175) — no "check your email then come back" wall. Good.
- Persistent error banner with "go log in" / "reset password" recovery links (line 243-267) — that's UX literacy.
- Track param survives query (`?track=ap|sat|act`) and CLEP redirects to PrepLion (line 73-78) — clean.

**Broken / Incoherent:**
- Grade-level required but only offers 10/11/12 (line 351-353). A 9th grader prepping for AP Human Geography, or an adult re-prepping for SAT, has no slot. **Will bounce.**
- "Start your AP exam journey today — free" copy is fine but no mention of "no credit card" inline; that's only in the SocialProofBadge banner.
- No SSO except Google. A real high-schooler often signs in with school Microsoft/Apple — fine for v1 but absent.

**Would bounce:** Only if I'm a 9th grader / non-traditional. Otherwise smooth.

---

## 4. Onboarding / Journey — `src/app/(dashboard)/onboarding/page.tsx` + `src/app/(journey)/journey/page.tsx`

**Works:**
- `/onboarding` is deprecated and `redirect()`s to `/practice/quickstart` (server-side, not client) — clean (onboarding/page.tsx:18-22).
- Journey rail step orchestration (`journey/page.tsx:37-127`) is well-designed:
  - Step 0 — course pick (prefilled if `?course=` came from marketing funnel)
  - Step 1 — 3 MCQs (warm-up)
  - Step 2 — 1 real CB FRQ + rubric reveal (with "Ask Sage to improve" CTA right at the moment of need — `step-2-frq.tsx:124-150`)
  - Step 3 — 5-10 Q diagnostic + projected score
  - Step 3a — flashcard micro-step (per memory `Beta 9.6`)
  - Step 4 — 5 targeted MCQs in weakest unit
  - Step 5 — done
- Track-aware default course (`journey/page.tsx:87`) — SAT user gets SAT_MATH default, not AP_WORLD_HISTORY (good).
- `mustPickCourse` flag (`journey/page.tsx:95`) forces explicit pick for new users so they don't auto-tap into AP_CHEMISTRY.
- SAT/ACT path correctly auto-skips Step 2 (FRQ) because `examHasFrq=false` (step-2-frq.tsx:46-48). The product knows SAT has no FRQ.

**Broken / Incoherent:**
- **The transition cards (`trans12`, `trans23`, `trans34`) are full-page interstitials with just an "eyebrow + title + body + Continue" pattern.** As a real student I'd want to *just keep moving*. Every Continue tap = "Is there something more I'm missing?" feeling. They feel padded — 5 steps becomes effectively 8 screens.
- **"Step 2 · Real AP question" copy stays "AP" even when track is SAT/ACT** (step-2-frq.tsx:101) — but on those tracks the step auto-skips, so I'd never see it. Minor — but if a future SAT FRQ ever lands, this will look wrong.
- **Predicted score math is crude.** Diagnostic page line 268-270: `meanPct>=80 ? 5 : meanPct>=65 ? 4 : meanPct>=50 ? 3 : meanPct>=35 ? 2 : 1`. A real AP score is a percentile-band cutoff that varies by year. Calling this a "projected AP score" with 7xl font is more confidence than the data supports. The "MCQ-only estimate" caveat (line 297-299) helps but is small.
- **Step 1 (3 MCQs) uses `difficulty: "ALL"` for first-ever questions** (step-1-mcq.tsx:69). But the auto-launch path on `/practice` explicitly biases EASY for first session (practice/page.tsx:425-426) to avoid Q1 demoralizing. The journey path doesn't honor that bias.

**Would bounce:** No. The journey is the *strongest* thing in the product.

---

## 5. Step5Done handoff — `src/components/journey/step-5-done.tsx`

**Works:**
- "You're set up" / Trophy / 3 checkmark summary (line 32-58) — feels like a real "you did the thing" moment.
- Three co-equal tiles: Continue free / Tools / Upgrade $9.99 (line 60-82) — gives the student a *choice* instead of a forced funnel.
- Upgrade tile shows the actual $9.99 price front-and-center (line 110-117) — not buried in marketing copy.

**Broken / Incoherent:**
- After 5 steps + 3 transitions, the closure card itself adds a 4th "Ask Sage" link at the bottom (line 86-93). So 4 options on the "what to do next" screen. The screen above (trans34) already showed projected score + weakest unit. So my brain has: score → weakest unit → set-up screen → 3 tiles + 1 link. Decision overhead.
- "You completed your first AP session" (line 38) — hardcoded "AP". SAT/ACT users see "AP session" after their SAT diagnostic. Bug.
- No "view your diagnostic results in detail" link. The journey computed weakest unit + score; the user can't go back and *see* what they got wrong, only forward to more practice.

**Would bounce:** No. This is one of the better closure screens in the app.

---

## 6. Dashboard — `src/app/(dashboard)/dashboard/page.tsx` → `src/components/dashboard/dashboard-view.tsx`

**Works:**
- `useJourneyForcing` gate (line 144) — when a new user lands, it forces ONE next-step card instead of the buffet (line 222-235 hide PrimaryActionStrip + SingleQuestionEntry during forcing). Concept is right.
- `DashboardSecondaryCards` collapse (line 280-313) — secondary cards hidden behind "Show more tools" toggle. Right instinct.
- Server-side session check + redirect to /login (page.tsx:7-10) — clean.

**Broken / Incoherent:**
- **As a mature user, this dashboard renders (potentially): PassGuaranteeBadge, GreetingCard, JourneyHeroCard, AutoLaunchNudge, MasteryTierUpCard, ResumeCard, PrimaryActionStrip, SingleQuestionEntry, ExamDatePromptCard, CramModeCard, DailyStudyOSCard, DiagnosticPromptCard, OutcomeProgressStrip, plus 5 hidden behind "Show more."** Each card has its own conditional render logic. Dashboard-view.tsx is 314 lines of card orchestration. **I cannot tell in 10 seconds what to do next.** The "ONE CTA" claim in the file comment doesn't match the markup.
- `DashboardSecondaryCards.tsx` shows `WeaknessFocusCard`, `SageCoachPromoCard`, `FlashcardsDueCard`, `DailyGoalCard`, `LockedValueCard` (line 300-305). That's 5 more cards. So "Show more" reveals five things, not one. **A real student doesn't click "Show more" — they want fewer cards, not more.**
- Greeting card on every visit ("Hey Ayaan, here's your dashboard") — fluff after visit #2. Adds zero info.
- Multiple cards each fire their own `/api/user`, `/api/user/limits`, `/api/frq?course=X&limit=1` etc. Probably 10+ network requests on dashboard mount. (Cached via `fetchCached`, but still visible in DevTools.)

**Would bounce:** Yes, after 3 visits. "I don't know what to do" is the worst feeling in an exam-prep app.

---

## 7. Practice — `src/app/(dashboard)/practice/page.tsx`

**Works:**
- Stale-response guard for race conditions (line 314-315, 627-633) — prevents "I clicked Next but the previous question's response just landed and froze the new question." Actual hard-won bug fix, well-commented.
- Crash recovery: if user closes tab mid-session, sessionStorage snapshot is restored next visit (line 186-227) — this is genuinely good.
- Knowledge-check after wrong MCQ (admin-toggleable, default OFF — line 160). Right instinct to keep it off; mid-session interruptions kill flow.
- Fail-downshift on 2-in-a-row wrong (line 687-705) — reorders queue to a different unit to rebuild momentum. Smart.
- First-time user gets EASY 10-Q auto-launch (line 410-433) — avoids Q1 demoralization. Smart.
- "Ask Sage" prefill that snapshots the wrong question into the tutor (line 511-527) and restores session on return (line 274-302) — this is *exactly* what a real student wants when stuck.
- ReportQuestionModal on every question (line 1137) — students can flag bad questions. Trust signal.

**Broken / Incoherent:**
- **The practice config screen has too many knobs for a new user.** Unit selector + difficulty + question count + question type (MCQ/FRQ/SAQ/LEQ/DBQ/CODING) + session type. On first visit the auto-launch dodges this — fine. But on 2nd+ visit, students see 5 config dropdowns. Khan Academy / UWorld bury config.
- **Mid-session FRQ interrupt at Q3** (line 745-763) — pops a modal asking "want to try an FRQ instead?" mid-flow. This is the opposite of letting the student finish their thing. As a student I'd find it annoying — I picked MCQ.
- **Explanation truncation at 280 chars** (line 112-146) is a band-aid for "the AI explanations are too long." Comment admits: "real fix is regenerating with tighter prompts." A real CB explanation is 100-200 words. AI-generated explanations being 800-1600 chars is a *quality* problem, not a UI problem.
- **Stimulus rendering**: passes a markdown `MarkdownContent` with `useMermaid={true}` (line 1127). For a real CB document-based question, markdown is wrong format — the doc is an image/excerpt with attribution. Unclear if the bank actually has primary-source documents or whether stimuli are AI-generated prose.
- **No timed-MCQ option visible in the standard practice flow.** Mock-exam is timed; practice is not. A student practicing for time pressure has only one timed tool.

**Quality of questions (visible from code paths):**
- The `aiGenerationWarning` toast (line 458) fires when the bank ran dry and questions were AI-generated on-demand. As a student seeing this would tell me "I'm getting fresh AI Qs not vetted CB-style content." Trust hit.
- `lowBankWarning` (line 558) is the better signal.
- CLEP courses get a `CB-Aligned` badge (line 1070-1075). AP courses don't — so there's no visible quality signal that AP questions are vetted.

**Would bounce:** Eventually yes. After 2-3 sessions where I encounter an awkwardly-worded AI Q or a 1200-char explanation that buries the point.

---

## 8. Mock Exam — `src/app/(dashboard)/mock-exam/page.tsx`

**Works:**
- 12-hour sessionStorage TTL for crash recovery on a 3.5-hour AP mock (line 145) — real student-respecting decision.
- Resume prompt with answers-given count + time-left (line 388-412) — clean UX.
- Full-mode pulls from `/api/mock-exam` which uses CB-fidelity proportions (MCQ + SAQ + DBQ + LEQ); Quick-mode pulls from `/api/practice` with MCQ-only (line 239-254).
- Honest amber card (line 421-430) that says "the timed Start runs the MCQ section only. SAQ/DBQ/LEQ practice is at /frq-practice. Full multi-section timed simulation is in development." That honesty is correct.
- Family-aware copy via `getExamCopy()` (line 121-122) — AP score 1-5, SAT 400-1600, ACT 1-36. Code at least knows the difference.
- Real per-Q pacing derived from `mockExam.mcqTimeMinutes / mcqCount` (courses.ts:6459-6475) — at least the timer matches CB pacing.

**Broken / Incoherent — and this is the big one for SAT/ACT students:**
- **No Digital SAT format.** The real Digital SAT (2024+) is adaptive (Module 1 → Module 2 difficulty branches based on M1 performance) and shows passage-question-passage-question with the Bluebook tools (highlight/annotate/calculator). This page renders a flat linear MCQ list with a global timer. **It is not a Digital SAT mock.** It's an SAT-flavored quiz with a timer.
- **No section pacing for ACT.** Real ACT is English 45min / Math 60min / Reading 35min / Science 35min — *strict per-section timer*. This page does one section at a time (just `phase: "section1"`) but the section break + composite logic isn't here.
- Free user partial-lock at Q5 (line 344-347) — for a "5-question mock exam preview," after 5 Qs you hit `setShowPartialPaywall(true)`. As a free user testing the mock product, I get 5 Qs then a paywall, then I close the tab. The conversion logic is right; the *experience* of a 5-Q "mock" is a joke.
- "Estimated AP Score" rendered as `Math.round(sessionSummary.apScoreEstimate * 16)/80` for CLEP (line 959) — but CLEP is hidden on StudentNest now. Dead code path.
- The completion screen says "Excellent! You're exam ready!" for a 5 (line 547) — but the student took 60 MCQs untimed-ish (the timer is real but the bank may have been ≤60 Qs). Real AP exam = MCQ + FRQ. Calling a student "exam ready" off MCQ alone is irresponsible. The amber card upstream acknowledges this; the completion message contradicts it.

**Would bounce:** Yes, as an SAT student. The Digital SAT moved off paper >2 years ago. If this is the "mock SAT" experience, I'm using Khan Academy's Bluebook practice instead.

---

## 9. Sage Coach — `src/app/(dashboard)/sage-coach/page.tsx`

**Works:**
- Concept-based prompt + 60s mic recording + Haiku 4.5 eval across 5 dimensions (accuracy/coverage/structure/clarity/confidence) — novel approach. "Explain to pass" framing is differentiated.
- Browser-specific mic-permission errors with actual instructions ("click the lock icon → Microphone → Allow → refresh") (line 156-167) — that's real UX.
- 25s hard timeout on eval + 23s fetch abort + redundant interval watchdog (line 209-218, 283-299) — built defensively because prior versions hung.
- Course-unsupported state (line 383-411) honest: "we haven't seeded prompts for this course yet."
- Free tier 1 session/day with daily-limit upgrade screen (line 354-381).

**Broken / Incoherent:**
- **Massive positioning conflict.** Dashboard's `SageCoachPromoCard` says "Sage Coach — FRQ Grader. Submit your free-response answer → instant AI feedback against the official College Board rubric" (sage-coach-promo-card.tsx:89-95). The actual /sage-coach page is **voice-based oral-response training**, NOT FRQ grading. A premium user clicks the promo expecting FRQ feedback, gets asked to *talk to their laptop* about a concept. That's a bait-and-switch. **One of the two surfaces is lying.**
- Voice-only (per memory) is gimmicky for the AP/SAT student context. Real prep is timed written work. Saying "explain limits out loud" is fine as a *retention drill* but isn't what the dashboard promises.
- Speech recognition requires Chrome/Edge — the unsupported-browser fallback is fine, but on iPhone Safari (which most high-schoolers use) the feature is dead. No mention of mobile limitations in marketing.
- 5-dim rubric (accuracy/coverage/structure/clarity/confidence) — *confidence* is graded on speech tone? As a student that feels like I'm being judged on voice timbre rather than knowledge. Subjective.

**Would bounce:** As an AP student looking for FRQ grading, yes — because what's promoted isn't what's delivered. As a curious student who tries it once, maybe useful, but I wouldn't return daily.

---

## 10. AI Tutor (Sage) — `src/app/(dashboard)/ai-tutor/page.tsx`

**Works:**
- Sage prefill from the practice page (line 119-135) — paste a wrong AP question and Sage gets it pre-loaded. This is the exact moment of need.
- Split-panel: chat left, structured content (knowledge check, sections, wiki image) right (line 97-100). Better than plain chat for studying.
- First-visit greeting (line 138-154) suggests the right opening move: "paste a question you got wrong and ask 'why is X the answer?'"
- Streaming with rollback by stable turn id (line 47-54) — fixed positional-slice bug that previously deleted wrong messages.
- Full-screen exam mode hides sidebar (line 80-81) so the chat gets focus.
- Free tier rate-limited via 429 with `limitReached` state (line 178); upgrade CTA shown inline.

**Broken / Incoherent:**
- Streaming + non-streaming code paths both present — non-streaming for free, streaming for premium per pricing copy. Inconsistency: the *same* asked question can render fundamentally differently across tiers.
- "First-visit greeting" uses `name?.split(" ")[0]` — fine, but the greeting only fires if `data.conversations.length === 0`. If the user ever started but bailed mid-conversation, no greeting on visit #2 — the page just shows the empty input. Cold.
- Sage's prompted output goes into `parseSections()` for the right panel. For free-form questions, the right panel may not parse and stays empty. The split-panel UX collapses to "chat on the left, void on the right."
- Knowledge-check follow-ups (mentioned in landing-page marketing) need MCQ-style options. If the wrong-question prefill is, say, an AP USH stimulus passage, the knowledge check might generate generic recall Qs instead of stimulus-anchored ones.
- No way to see prior conversation list from inside the chat — they're at `/api/ai/tutor` but no UI list. So if I asked Sage about derivatives last week, I can't find that conversation today.

**Would bounce:** No. Sage prefill from practice is the strongest cross-surface flow in the app. But the absence of conversation history is annoying.

---

## 11. Diagnostic — `src/app/(dashboard)/diagnostic/page.tsx`

**Works:**
- "Quick Score Estimate · 15-min MCQ check — we'll cover FRQs/essays in your next-step plan." (line 138-141) — honest scope.
- One question per unit (line 159-160) — gives an even coverage signal.
- Score reveal + FRQ bridge ("FRQs are 40-60% of your real AP score") (line 308-328) — accurate framing that bridges into deeper practice.
- "Fix your weakest unit in 2 min" CTA (line 333-362) before the paywall — gives the free user *something actionable* before asking for money.
- Family-aware passing threshold passed to overlay (line 376-382) — AP=3, SAT=1200, ACT=24. Correct.

**Broken / Incoherent:**
- **Predicted score: 7xl-font headline, "MCQ-only estimate" tiny disclaimer.** As a real student I'd take the 7xl number to heart and ignore the small print. If "you're a 4" but I'm not, I bring the wrong confidence to exam day. Need bigger caveat.
- **Predicted score formula is too crude.** 80%=5, 65%=4, 50%=3, 35%=2 → on a CB exam, 50% MCQ correct ≠ score 3 in most subjects. This is *not* the CB conversion curve.
- Diagnostic locked-detail overlay → upgrade. The diagnostic *gives* you the predicted score + weakest unit (free), then *locks* the per-unit breakdown chart behind premium. As a student that's a fair trade — but the locked overlay also covers Sage's recommendation text + strengths + all-units chart. So free user gets: 1 score number + 1 weak unit name. That's pretty thin payoff for 15 minutes.

**Would bounce:** No, because the headline score reveal is sticky. But I'd be annoyed at how much is paywalled.

---

## 12. FRQ Practice — `src/app/(dashboard)/frq-practice/page.tsx`

**Works:**
- Per-type tabs (SAQ/DBQ/LEQ) (line 56-58) — CB-correct taxonomy.
- 1-free-attempt-per-type-per-course (line 67) — student gets to taste DBQ + LEQ + SAQ before paying.
- `?first_taste=1` auto-picks ONE recommended FRQ (line 115-129) — kills choice paralysis for guided users.
- 100-char minimum on submit (frq-practice-card.tsx:170-178) — blocks a 1-sentence submit getting 0/6 from the AI and demoralizing the user.
- "From 2018 College Board released exam · Q3" provenance badge (line 109-115 of step-2-frq.tsx) — real provenance, not "AI-generated AP-style."
- Per-FRQ-type components (SaqInput/Reveal, DbqInput/Reveal, etc.) (frq-practice-card.tsx:43-56) — proper rubric structure per CB exam type.

**Broken / Incoherent:**
- **`isFreeTaste=true` banner says "no card, no upgrade" — but `freeAttemptsUsed >= 1` then hard-paywalls.** That's two different free-FRQ models. A student who reads "no card, no upgrade" and tries 2 FRQs hits a wall and feels lied to.
- **The submit endpoint is `/api/frq/[id]/submit` and returns rubric for self-grade** (`frq-practice-card.tsx:182-196`). So free users get the rubric — but do they get *AI grading against the rubric*? Pricing says "FRQ scored against the official College Board rubric" is premium. The free flow seems to be "you write, you self-grade vs reveal." The premium flow has Sage *grade* you. Is this clear to the free user? Not from the UI — they just see the rubric reveal and might think "that's all I get from the paid version too."
- **`MIN_CHARS=100` is too low for an AP DBQ/LEQ.** Real DBQ needs ~5-7 paragraphs (the practice page itself says so — line 1151 of practice/page.tsx). 100 chars is one sentence. So a student writes 150 chars and the system happily grades them — they'll get 1/6 and bounce.

**Would bounce:** As an AP USH student trying to practice DBQs, yes — after 1-2 paid attempts where the AI grading feels generic, I'd go back to my teacher.

---

## 13. Flashcards — `src/app/(dashboard)/flashcards/page.tsx`

**Works:**
- SM-2 spaced repetition (line 50) — proper algorithm, not vibes.
- Free for all tiers (line 14-17 comment) — correct strategy; flashcards are retention loop, not a paywall feature.
- Course banner so user always knows which course's deck they're seeing (line 87-90) — defensive against stale localStorage course-selection.
- Full-screen mode (line 73-77) — gives one card the whole viewport.
- Forgot/Hard/Good/Easy buttons (no swipe in v1, accessibility comment line 11-13) — keyboard-friendly first.

**Broken / Incoherent (from what I can see in 100 lines):**
- Front/back/explanation — but no source-of-truth on whether the flashcard *content* is hand-curated, AI-generated, or auto-derived from practice questions. As a student I want "this is a real CB AP vocab term from the unit X CED" not "this is something Sage made up about cell biology."

**Would bounce:** No. Flashcards is a quiet win.

---

## 14. Study Plan / Settings / Billing / Analytics

### Study Plan — `src/app/(dashboard)/study-plan/page.tsx`
- Has both AI-generated "weekly plan" and a CLEP-specific 7-day mode (line 80-81). CLEP is removed from StudentNest per memory but the CLEP plan code is still here (line 83 `isCLEP` check). Dead branch — but with `course.startsWith("CLEP_")` it should never trigger on this product. Fine.
- "Tasks" with checkboxes saved to localStorage (line 81, 87-89). Progress isn't synced server-side — switch device, lose check state. Annoying.

### Billing — `src/app/(dashboard)/billing/page.tsx`
- Stripe redirect → poll DB after `?success=1` (line 94+). Bounded to 5 polls (line 99) with the "infinite re-poll loop" guard (line 88-93). Defensive.
- Module-subs displayed alongside legacy subscription tier — `moduleSubs` array supports per-module premium. Good infra but UX is confusing if I have AP_PREMIUM but visit SAT — does my AP sub cover SAT mocks?

### Analytics — `src/app/(dashboard)/analytics/page.tsx`
- Full-screen mode, per-unit mastery chart, accuracy timeline, knowledge-check stats, goal-setting modal — proper analytics surface.
- Early-readiness fallback for users with no mock yet (line 95-100) — so the "see your predicted score" CTA on the practice page actually delivers a score, not a blank page.

**Would bounce:** No on these. Functional, slightly dense.

---

## 15. Pages a student might explore

- **`/parent`** — does not exist (PrepLion has a `parent` CTA in memory, but StudentNest doesn't ship one). Marketing page mentions parents (line 1058-1066) but there's no dedicated landing page for parents to actually convert from.
- **`/how-to-use`** — does not exist. There's `/methodology` and `/about` instead.
- **`/am-i-ready`** — present, family-grouped picker (am-i-ready/page.tsx). Per-course `/am-i-ready/[slug]` for the actual readiness check. Solid funnel surface.
- **`/pass-rates`**, **`/pass-guarantee`**, **`/methodology`**, **`/wall-of-fame`** — all present. The "Pass Guarantee" framing is interesting but I haven't deep-read it; it ties to the `passGuaranteeEligible` flag in session.
- **`/blog`**, **`/contact`**, **`/faq`**, **`/about`**, **`/terms`**, **`/privacy`** — present, standard.
- **`/ap-prep/[slug]`**, **`/how-hard-is/[slug]`**, **`/am-i-ready/[slug]`** — per-course SEO pages. Smart.
- **`/community`** — present dashboard page. Didn't deep-read; risky if low engagement (empty feed = bad signal).
- **`/resources`** — links to external prep resources (CB sites, Khan, etc.). Honest.

---

## Cross-cutting issues

### Question-quality signal is invisible on AP/SAT/ACT
- CLEP courses get a `CB-Aligned` badge during practice (practice/page.tsx:1070-1075). AP/SAT/ACT don't. So as an AP Calc student I have no in-product trust signal that my questions are vetted. Especially after the toast "✨ Practice questions generated" (line 458) which silently tells me I'm getting on-demand AI Qs.

### Predicted-score is overstated everywhere
- Journey transition34 (line 346-349): "You're at a 4 · projected AP score · out of 5"
- Diagnostic results (page.tsx:294): "Your Predicted AP Score" — 7xl font
- Mock-exam completion (line 567): same 7xl font
- Each of these is computed from a small sample (3-15 MCQs) with a crude bucketing formula. The marketing also calls this "5-minute diagnostic shows you the units you'd fail" — confidence overstatement.

### Naming inconsistency
- "Sage Coach" = oral-response feature (`/sage-coach`)
- "Sage Coach Promo Card" on dashboard = FRQ grader pitch
- "AI Tutor" = the chat at `/ai-tutor`
- "Sage" = the brand for all of the above
- "Sage Live Tutor" appears in older copy (landing page line 548, register page line 233 area)
- A real student gives up tracking what "Sage" means after 3 surfaces.

### Marketing copy vs product reality gaps
- "5-min diagnostic" (landing) vs "15-min MCQ check" (product)
- "FRQ scored against official rubric" (pricing) vs free-tier reveal-only with no AI grading visible
- "Section-by-section composite tracking" (SAT/ACT premium) — I couldn't find this implemented; mock-exam is single-section
- "Real exam pressure" mock — for SAT, real exam = Digital SAT adaptive Bluebook, not a linear timed MCQ list

---

## Top-5 fixes a real student would demand before recommending this to a friend

1. **Fix the dashboard. Pick ONE primary action.** The 13+ card buffet (counting hidden cards) reads as "we built everything; you figure out what matters." For a new user post-Step5, the only thing on the screen should be: (a) Resume if in-progress, else (b) "Drill your weakest unit (Unit 4, 41%) → 5 Qs, ~3 min." That's it. Stash everything else behind a "Tools" sidebar or page. The current dashboard is the product's biggest credibility liability.

2. **Fix the Sage Coach contradiction.** Either rename the dashboard promo card to "Sage FRQ Grader" (and link it to FRQ practice with AI grading turned on), or rename the `/sage-coach` voice feature to "Sage Speak Drill" / "Explain-to-Pass" and treat the FRQ grader as a separate surface. Right now a paying user clicks "FRQ grader" and gets asked to talk to their laptop. That's the worst kind of premium-feature surprise.

3. **Ship a real Digital SAT mock or stop calling SAT/ACT "mock exam".** The SAT moved to adaptive Bluebook format in March 2024. A timed linear MCQ list is not a Digital SAT mock — it's a quiz. Either build the 2-module adaptive flow (M1 fixed, M2 difficulty-branched) with section pacing and a domain breakdown, OR rename the SAT/ACT version to "Timed Practice Set" and stop charging premium for "Full Section" of a format that doesn't exist anymore. ACT pacing per-section (English 45m, Math 60m, Reading 35m, Science 35m) is also missing.

4. **Add visible question-provenance badges to AP/SAT/ACT, not just CLEP.** Show me at the question level: "Vetted CB-style · Audit Score 9.2/10" vs "AI-generated this session." After "we got it wrong before" honesty marketing, the product needs in-flow trust signals. A toast that says "✨ AI generated for you" is the *opposite* of what the marketing promises.

5. **Replace the 7xl-font "Projected AP Score: 4" with a confidence interval or kill it.** Right now a 5-MCQ Step-1 warmup → diagnostic → "you're a 4" is the dominant takeaway message. Real students walk into the exam with that number in their head and get blindsided when MCQ ≠ FRQ ≠ score scaling. Show it as "MCQ band: likely 3-4 (need 12 more questions for tighter estimate)" — and don't show it at all until the diagnostic is complete. Currently the predicted score is shown after 3 warmup MCQs in the journey, which is statistical malpractice.

---

## StudentNest vs College Board Question Bank — honest take

| Dimension | StudentNest today | CB Question Bank | Verdict |
|---|---|---|---|
| **Question source authority** | AI-generated + curated subset; "CB-aligned" badge only on CLEP | Official released items + Bluebook adaptive bank | CB wins on trust. StudentNest needs visible per-question provenance. |
| **FRQ access** | 220+ official CB FRQs (per `SageCoachPromoCard` comment) + per-type tabs | Every released FRQ with official scoring guidelines | CB wins. StudentNest has *some* officials but the gap is wide. |
| **AI grading on FRQ** | Yes, premium, against rubric (per pricing) | None — manual self-grade with sample responses | StudentNest wins *if* the AI grading is calibrated. Big "if." |
| **Adaptive Digital SAT mock** | Not implemented (linear MCQ list w/ timer) | Bluebook 2-module adaptive | CB wins, decisively. |
| **ACT section pacing** | Single-section timer, no real section breakdown | Real ACT-format timing | CB/ACT wins. |
| **Explanations** | AI-generated, 800-1600 chars (per comment in practice/page.tsx:108) | Hand-written, ~200-400 chars | CB wins on tightness; StudentNest's explanation depth could be a feature *if* not bloated. |
| **Personalized study plan** | Yes — diagnostic-driven, weekly | Generic "review weak areas" only | **StudentNest wins.** Real differentiation. |
| **Tutor on demand** | Yes — Sage prefill from practice | None | **StudentNest wins.** The Sage prefill from a wrong Q is the best UX in the product. |
| **Spaced-repetition flashcards** | Yes — SM-2 | None | **StudentNest wins.** Quiet feature. |
| **Price** | $9.99/mo or $79.99/yr | Free (most), Bluebook free | CB wins on cost — but free CB has zero personalization. |

**Honest summary:** StudentNest is competitive *only* on the personalized-AI-tutoring axis. On exam-format fidelity (especially SAT/ACT), CB's free Bluebook destroys this product. The pitch "we tell you what's missing before exam day" is real — but to deserve $9.99/mo, the AP-FRQ grading has to be good and the SAT mock has to be Digital-SAT-format. Neither is true today.

A real student strategy: use Bluebook for SAT mocks, StudentNest for AI tutoring + spaced flashcards, CB FRQ archives for actual FRQ practice, and pay StudentNest only if the Sage tutor saves you more time than asking your teacher.

---

## File-reference quick-index

- Landing: `src/app/page.tsx` (fake testimonials line 97-120; 4-min vs 15-min mismatch line 276 vs `diagnostic/page.tsx:138-141`)
- Journey orchestrator: `src/app/(journey)/journey/page.tsx`
- Step 5 done: `src/components/journey/step-5-done.tsx` (hardcoded "AP" line 38)
- Quickstart auto-launch: `src/app/(dashboard)/practice/quickstart/page.tsx`
- Dashboard buffet: `src/components/dashboard/dashboard-view.tsx`
- Practice (1683 lines, the big one): `src/app/(dashboard)/practice/page.tsx`
- Mock exam: `src/app/(dashboard)/mock-exam/page.tsx` (no Digital SAT format anywhere)
- Sage Coach (voice): `src/app/(dashboard)/sage-coach/page.tsx`
- Sage Coach Promo (says "FRQ Grader" — contradicts above): `src/components/dashboard/sage-coach-promo-card.tsx:89-95`
- AI tutor chat: `src/app/(dashboard)/ai-tutor/page.tsx`
- Diagnostic: `src/app/(dashboard)/diagnostic/page.tsx` (crude score formula line 268-270)
- FRQ practice: `src/app/(dashboard)/frq-practice/page.tsx` + `src/components/practice/frq-practice-card.tsx`
- Flashcards: `src/app/(dashboard)/flashcards/page.tsx`
- Mock-exam config formula: `src/lib/courses.ts:6459-6475`

---

## DEEP AUDIT PASS #2 — Dashboard + Tools + Sage Coach + Settings

Walkthrough by an AP student (Calc BC, Bio, Lang, Chem, CS A; SAT 1480, ACT 33).
Deep read pass — every line of JSX/copy in `(dashboard)/*`, `components/layout/*`, `components/dashboard/*`.

Severity key: **P0** = blocks daily use / breaks trust. **P1** = active friction or contradiction. **P2** = polish / inconsistency.

---

### A. Architecture-wide / route map

1. **[P0]** *No `/settings` route exists.* `glob (dashboard)/settings` returns nothing. No way to change email, name, password, exam date (after onboarding), notification preferences, or delete account from inside the app. CCPA/GDPR exposure. Sidebar `src/components/layout/sidebar.tsx:55-73` has no Settings link at all.
2. **[P0]** *No `/account/delete` or `accountDelete` API anywhere.* `grep -ri "deleteAccount"` zero hits in `(dashboard)`. A paying customer who wants out has no in-product self-serve.
3. **[P0]** *No `/how-to-use` route.* Sidebar onboarding messaging in `JourneyHeroCard` implies a guided rail, but post-journey there is zero help/FAQ surface. No keyboard-shortcuts page, no "what does each tier give me" page from /billing other than the upgrade card.
4. **[P1]** *Sidebar order is illogical* (`sidebar.tsx:55-73`): Dashboard, Practice, FRQ Practice, Mock Exam, Diagnostic, Flashcards, Analytics, Study Plan, Resources, Sage Live Tutor, Sage Coach, Community, Billing, About. **Diagnostic should be 2nd** (it's the entry point); **Analytics & Study Plan are tucked between Flashcards and Resources** — most-used outputs are buried. Two "Sage" entries (Live Tutor + Coach) sit non-adjacent to the Sage chat floater.
5. **[P1]** *Sidebar has 14 visible items + theme toggle + sign-out. On a 768-px tall laptop, the nav scrolls.* `sidebar.tsx:381-417` uses `overflow-y-auto` so the bottom items vanish below the fold for any short laptop.
6. **[P1]** *BottomNav has only 4 tabs — no Sage button, no Diagnostic, no Flashcards.* `bottom-nav.tsx:19-24`. The `onSageClick` prop at line 28 isn't even wired by `(dashboard)/layout.tsx:312` (no `onSageClick={…}` passed). Mobile users can't reach Sage from the bottom nav even though the component supports it.
7. **[P1]** *Exam-mode escape* hides sidebar but exposes only a "← Dashboard" pill at the top (`layout.tsx:242-252`). No "save & quit", no "pause" — a mid-mock student loses session state if they click Dashboard. (See M5 below — mock-exam DOES have crash-recovery, but the top-bar button doesn't advertise it.)
8. **[P1]** *`EXAM_MODE_PAGES` whitelist in `(dashboard)/layout.tsx:19`* includes `/practice`, `/flashcards`, `/ai-tutor` — meaning Sage Live Tutor hides sidebar permanently (you can never see your nav while tutoring). That's a 200-line page with no in-page nav back to anywhere except via the `← Dashboard` top-bar pill.

---

### B. Dashboard buffet — `components/dashboard/dashboard-view.tsx`

9. **[P0]** *Still buffet despite the "v2 collapse" claim in the file header.* Counting rendered components in `dashboard-view.tsx:188-276` (post-journey, standard view): **PassGuaranteeBadge, GreetingCard, JourneyHeroCard, AutoLaunchNudge, MasteryTierUpCard, ResumeCard, PrimaryActionStrip, SingleQuestionEntry, ExamDatePromptCard, CramModeCard, DailyStudyOSCard, DiagnosticPromptCard, OutcomeProgressStrip, DashboardSecondaryCards** = **14 cards** above the fold (each can render-null but the comments admit they often don't). The "5 blocks" claim in the file's top comment is aspirational, not actual.
10. **[P0]** *"What should I do today" is unanswerable in 10 sec.* For a fresh-but-onboarded user, JourneyHeroCard, PrimaryActionStrip, SingleQuestionEntry, DiagnosticPromptCard, CramModeCard, and DailyStudyOSCard can ALL render simultaneously, each with its own "Start" / "Try" / "Take" button. No primary visual hierarchy. The mitigation flag `forcing && !journeyLoading` (line 223, 234) only suppresses 2 of them.
11. **[P1]** *"Show more tools" hides Weakness, Sage Coach, Flashcards, Daily Goal, and the LockedValueCard paywall* (`dashboard-view.tsx:280-313`). The PAYWALL is hidden behind a Show More — which intentionally suppresses conversion CTAs from a default-collapsed user. Either show paywall or don't, but auto-hiding the upgrade card while leaving 5 secondary cards visible above is contradictory.
12. **[P1]** *PassGuaranteeBadge renders at the top* (`dashboard-view.tsx:193`) for users who pass eligibility, before Greeting + JourneyHero. That's correct for converters but misplaced visually — it competes for the same eye-line as the user's name.
13. **[P2]** *Two competing Resume/Start cards possible* — `ResumeCard` returns null when none in-progress; `PrimaryActionStrip` returns null when ResumeCard would render. Both exist as separate components on the tree (`dashboard-view.tsx:217, 225`), risking a flash-of-both on slow API.
14. **[P2]** *`OutcomeProgressStrip` is wrapped in `data-focus-target="analytics"`* but no in-page anchor link, so the focus target is never used. Dead instrumentation.
15. **[P2]** *Engine-flag fetch on dashboard mount is unbounded* — `dashboard-view.tsx:160-169` `fetch("/api/user")` every render without revalidation guard; on slow connections JourneyHero flickers between forcing/non-forcing states.

---

### C. Sidebar — `components/layout/sidebar.tsx`

16. **[P0]** *Sidebar shows AP, SAT, AND ACT course groups for every user* (lines 142-156). A pure SAT student onboarded as `track:"sat"` sees all 14 AP courses + 2 SAT + 4 ACT in the course switcher. There's no way to hide AP unless admin removes from `visibleCourses` server-side.
17. **[P1]** *Course-switcher dropdown is `max-h-[60vh]`* (line 329). On a 600-px laptop in landscape, only 4 courses fit before scroll. No search/filter.
18. **[P1]** *FRQ Practice link is hidden for any non-AP selected course* (lines 394-396) — but the user can be browsing SAT MATH while still wanting to deep-link to an AP FRQ; with the link gone, they can't.
19. **[P1]** *"streakFreezes" 🧊 emoji and 🔥 streak emoji* in header (lines 281-294) — never explained anywhere. New user sees `🔥3` with no tooltip or onboarding.
20. **[P1]** *`flagsLoaded` race* — non-admin users see EMPTY sidebar (no course groups, `COURSE_GROUPS = []` line 167) during the `/api/feature-flags` round trip. On a cold load that's ~400 ms of "where did my courses go".
21. **[P2]** *Sign-out callbackUrl is `/`* (line 450) — drops the user to the marketing page, not /login. Disorienting.
22. **[P2]** *Dark/Light Mode is the ONLY user preference* exposed in the entire app. Email frequency, study reminders, exam date — all only settable through other surfaces (or not at all).

---

### D. Practice — `(dashboard)/practice/page.tsx` (1683 lines)

23. **[P0]** *FREE tier "1 free FRQ per type per course" cap is invisible in the picker.* The FRQ tile (lines 1502-1560) shows `"FRQ Practice — Sage-scored rubric feedback"` and a "Limited Time Access" amber badge (line 1538) — NO mention that you only get 1 SAQ + 1 DBQ + 1 LEQ + 1 FRQ EVER per course. Student clicks, gets a 403 mid-flow.
24. **[P0]** *Course-aware "5 vs 4" option count is NOT enforced here.* PracticePage parses `parsedOptions = JSON.parse(currentQuestion.options)` (lines 487-492) — if a CLEP question has 5 options the UI renders 5 buttons (A–E). For an AP/SAT/ACT course it renders 4 (A–D). The Practice page never validates the count against `getCourseConfig(course).questionTypeFormats.MCQ.optionsCount`. A bad question with 5 options on an AP course will show A–E.
25. **[P0]** *The auto-start "first session" path forces `selectedDifficulty: "EASY"` and `questionCount: 10`* (lines 422-429). A real Calc BC student lands and gets EASY questions with no way to opt out before they start — there's no "skip" button on quickstart. Insulting and slow.
26. **[P1]** *`"I don't know"` button* (lines 1245-1255) is rendered as a small text link AFTER the A/B/C/D buttons. Comment says "intentionally subtle so it's a fallback not default" — but A) it sits OUTSIDE the answer-button group with no visual anchor, B) on mobile thumb-zone it's at the very bottom of card #1, easy to mis-tap as "next question". The sentinel `__IDK__` is also a string-literal hack — no enum, no UX badge in feedback.
27. **[P1]** *Streak chips: "✓ 3 in a row"* (lines 1082-1093) display ONLY at correct-streak ≥ 2. Three-correct-in-a-row of EASY questions is meaningless; no difficulty weighting.
28. **[P1]** *Fail-downshift on 2nd wrong* (lines 686-705) reorders questions client-side via dynamic import `@/lib/fail-downshift`. Network hiccup → import fails → no downshift, student spirals through 5 wrong in a row. No fallback.
29. **[P1]** *Embedded knowledge check after wrong MCQ* (lines 707-731) — admin-gated by `knowledgeCheckEnabled`, default OFF per line 159-160. Dead code path 99% of the time, but renders an "amber Quick Check before you move on" section when on.
30. **[P1]** *"Continue Practice" snapshot* (lines 496-510) uses sessionStorage — survives reload, doesn't survive tab close. The "abandon detection" path (lines 186-227) saves on `beforeunload` but only triggers SessionFeedbackPopup the NEXT time the user lands on /practice; survey will fire weeks later.
31. **[P1]** *FRQ mid-session interrupt* (lines 740-762) fires after Q3, modal pauses the flow. User can dismiss with "Continue MCQs". The interrupt is fired off `/api/practice/frq-attempts-count` — another network call mid-session. No graceful failure: if endpoint times out, modal silently never shows, journey state never advances.
32. **[P1]** *Explanation truncation* (`ExplanationDisplay` lines 112-146) cuts at 280 chars. AP rubric explanations need 400-600 for full reasoning. User taps "Show full explanation" but the comment admits it's a render-side bandaid for prompt issues.
33. **[P2]** *"Go deeper with Sage →"* link (lines 1344-1358) uses sessionStorage prefill — no AI tutor message-cap awareness. A free-tier user with 5/5 chats used clicks this and lands on the cap banner. No pre-check.
34. **[P2]** *Coding pseudocode placeholder text in the textarea* (lines 1172-1177) is 90 chars of formatted multiline `PROCEDURE findMax(nums)\n  max ← nums[1]...`. Most browsers don't render `\n` in placeholder cleanly; it appears as one wrapped line on iOS Safari.
35. **[P2]** *Toast: "✨ Practice questions generated"* (line 557) — same toast title as both AI-generation and low-bank warnings, only the description differs. Confusing.

---

### E. Mock Exam — `(dashboard)/mock-exam/page.tsx`

36. **[P0]** *Still not Digital SAT adaptive.* Confirmed by the linear `phase: "intro" | "section1" | "complete"` state machine (line 37). For SAT_MATH the user gets a flat MCQ list, no two-module adaptive routing. The "Real exam length" claim on the Full Section button (line 484) is structurally false for SAT.
37. **[P0]** *"Heads up" card admits the MCQ-section-only truth* (lines 421-430). But the headline above it (`Mock {trackLabel} Exam`, line 372) doesn't qualify; the user reads "Mock AP Exam", clicks Start, takes only MCQs, walks away thinking they finished a mock. CB-fidelity path (`usesCBFidelity = mode === "full"`, line 239) tries to pull SAQ+DBQ+LEQ in proportion but uses the same single-section `phase: "section1"` UI with no break.
38. **[P0]** *No pause.* Timer ticks down via `setInterval(()=>setTimeLeft(t=>t-1),1000)` (lines 125-130). If the student needs a bathroom break, their only option is `acceptResume` after refresh — but the 1-line resume hint doesn't tell them refreshing actually preserves state.
39. **[P0]** *FREE user paywall pops at Q5* (lines 343-347, 614-678). A student in the middle of a 75-Q AP mock has done 5 questions and gets `"Finish Full Exam — Upgrade $9.99/mo"`. This is good conversion design but bad TRUST — the original intro card never warned "you'll be stopped at Q5 unless premium".
40. **[P1]** *Section timing is `secsPerQuestion * count`* — single bucket, not real CB pacing. AP USH has 80 MCQ in 55 min = 41.25 s/Q, but CB allows you to flag and return; this UI is per-question linear, no flagging, no review-before-submit.
41. **[P1]** *Result screen "Estimated AP Score"* (lines 562-577) shows ONE number 1-5 derived from `apScoreEstimate`. For a free user who took 5 questions and got paywalled, the result page still renders a 1-5 — wildly off because n=5.
42. **[P1]** *"Update Study Plan"* CTA on results (line 600-603) silently sends user to study-plan but doesn't refresh it; they hit /study-plan and see the OLD plan unless they click Regenerate manually.
43. **[P1]** *Crash recovery TTL = 12h* (line 145). A weekend student who starts Friday night and resumes Sunday morning loses all answers.
44. **[P2]** *`scoreColors[result.apScoreEstimate]` with hardcoded 1-5 keys* (lines 542-545). For CLEP `apScoreEstimate` can be 0-80; the lookup defaults to `text-foreground` — no color coding for CLEP results.

---

### F. Sage Live Tutor — `(dashboard)/ai-tutor/page.tsx` (895 lines)

45. **[P0]** *Daily 5-chat cap is INVISIBLE until you hit it.* The limit banner (lines 470-499) only renders when `limitReached === true`. There's no badge "2/5 used today" in the header. User sends their 5th message, gets the upgrade wall, has no warning.
46. **[P0]** *Mojibake all over.* Lines 464, 503, 520, 713: `"ðŸŽ™ voice input"`, `"â”€â”€ DESKTOP two-panel layout"`. The file is shipped with UTF-8 decoding bugs in comments AND in user-visible strings. Line 464 user sees `"Enter to send · Shift+Enter for new line · ðŸŽ™ voice input supported"`.
47. **[P1]** *Sage greets with "Hey there, future 5-scorer!"* (sage-chat.tsx:22) — assumes AP context. A CLEP/SAT user sees this on every page load.
48. **[P1]** *Practice → Sage prefill auto-sends* (`ai-tutor.tsx:122-131`) without user confirmation, burning a chat-quota slot the moment the user clicks "Ask Sage to explain this →" from practice. If they wanted to read the auto-question first, too late.
49. **[P1]** *Right-panel section parser* (`parseSections(fullText)`) (line 287, 316) is invoked on every streaming chunk. If the model emits malformed section markers, parser exceptions silently break the panel — caught by the try/catch at line 289 but the panel just shows stale content.
50. **[P1]** *Knowledge check renders inside `overflow-y-auto max-h-80`* (line 670, 880) — long checks scroll inside a scroll inside a flex column. Triple-nested scrollbars on the chat surface.
51. **[P2]** *Voice input* uses `webkitSpeechRecognition` (lines 396-428). No Firefox detection, no fallback message — Firefox user clicks Mic, nothing happens, toast says "Voice not supported" only after click.

---

### G. Sage Coach (oral) — `(dashboard)/sage-coach/page.tsx` (663 lines)

52. **[P0]** *5-dim rubric (accuracy, coverage, structure, clarity, confidence) is INVISIBLE before recording.* Intro screen (lines 442-477) only says "speak your answer and get specific feedback". The student has no idea they're being scored on Confidence (a vocal quality) until AFTER they record + see the grid (lines 602-608). For a kid who stutters, that's a trap.
53. **[P0]** *60-second hard stop with NO mid-recording warning.* Lines 74, 535-537 — the timer turns red at ≤10 s, but mobile users in landscape may not see it. No haptic, no vibration. Voice cuts off mid-sentence.
54. **[P0]** *FREE user cap = 1/day* but the cap UI fires AFTER `/api/sage-coach/evaluate` returns 429 (lines 235-239). Student records a 60-sec answer, waits 5+ sec for processing, THEN sees "you've done today's Sage Coach". Worst possible flow — make them work, then deny.
55. **[P0]** *Sage Coach Promo Card on dashboard* says **"Sage Coach — FRQ Grader"** and pitches "Submit your free-response answer ← instant AI feedback against the official College Board rubric" (`sage-coach-promo-card.tsx:89-95`). But Sage Coach is **voice-only**, NOT a written FRQ grader. Total product-message mismatch.
56. **[P1]** *Mic permission UX*: error path is hard-coded text "Click the 🔒 lock icon to the left of the URL → set Microphone to Allow → refresh" (line 160). Not all browsers show that exact icon. On iPhone Safari this guidance is wrong (uses Settings → Safari → Camera & Microphone, not a lock icon).
57. **[P1]** *Connection-loss handling absent.* The 23s/25s timeout (lines 209-218) just shows an error and a retry. If the network drops at second 30 of a 60s recording, the SpeechRecognition `onerror` "network" event (line 165) fires and dumps the user to error state — losing the answer.
58. **[P1]** *Course-unsupported screen* (lines 383-411) says "switch courses in the sidebar" — but Sage Coach is full-screen, sidebar hidden. User must back-arrow to dashboard first.
59. **[P1]** *Processing screen with elapsed counter* (lines 570-583) — counter ticks 15+ s and we show "Taking longer than usual". Friendly but doesn't tell user they CAN'T cancel without losing the answer.
60. **[P2]** *Concept difficulty is shown lowercase tiny* (line 506) "EASY" or "HARD" — no explanation of what difficulty band the recording is being graded against.
61. **[P2]** *"Try again"* button on feedback (line 638) replays the SAME concept. No way to skip to a different concept without burning another evaluation.

---

### H. FRQ Practice — `(dashboard)/frq-practice/page.tsx`

62. **[P0]** *Free "1 attempt per type per course" cap is enforced by 403* but `freeAttemptsUsed` (lines 67-82) only counts ALL FRQ types together (`/api/practice/frq-attempts-count`). Per-type counters live server-side and aren't exposed; user can't tell whether they've used their SAQ slot or their DBQ slot.
63. **[P1]** *`isFirstTaste` banner* (lines 178-185) and `showFrqCapCard` (line 165) can BOTH render — the cap card hides the taste banner via `!showFrqCapCard`, but the cap card is the WRONG thing to show to a user who literally just arrived for their first FRQ (they've used 0 of 1).
64. **[P1]** *Subtype tabs only render when `types.length > 1`* (line 209). For a course with only SAQs in the bank, no tab — but `selectedType` defaults to `"ALL"` so filtering line 304 still applies, all good. But: when tabs DO render, no indicator that DBQ/LEQ are paywalled-after-1.

---

### I. Flashcards — `(dashboard)/flashcards/page.tsx`

65. **[P0]** *SM-2 is invisible.* `card.sm2.{easeFactor, interval, repetitions}` is parsed from the API (line 50) and NEVER displayed to the user. They have no idea why a "Hard" tap means seeing the card tomorrow vs in 5 days. The footer line 313-315 says "Hard cards return sooner" — no specifics, no schedule preview on the rating buttons.
66. **[P0]** *Exam-date adjustments are not surfaced.* `project_haiku_verification_setup.md` and the user's "Phase 1: Trust-weighted Q selection + exam-date SM-2 compression" memory says exam-date should compress SM-2 intervals as exam approaches. Flashcard UI shows no badge ("compressed to fit your exam in 14 days"), no countdown integration here.
67. **[P1]** *4 rating buttons stack 2×2 on mobile* (line 277). The "Forgot" and "Hard" buttons end up side-by-side at thumb-zone; user means Hard, taps Forgot — SM-2 reset to interval 0.
68. **[P1]** *"Ask Sage why this is the answer"* link (lines 254-260) opens `/ai-tutor?prompt=…` — but the AI tutor page reads `sessionStorage.getItem("sage_prefill")` (`ai-tutor.tsx:121`), NOT the `?prompt=` URL param. The flashcard link is broken; clicking it lands on tutor with empty input.

---

### J. Study Plan — `(dashboard)/study-plan/page.tsx`

69. **[P0]** *Plan does not auto-refresh after diagnostic or mock-exam.* The "Update Study Plan" button on mock-exam summary (`mock-exam/page.tsx:600`) just navigates to /study-plan; the plan state is loaded fresh from `/api/study-plan?course=…` (line 113) but the API returns the cached plan unless POST is called. User has to manually click "Regenerate" (line 216).
70. **[P0]** *No `dailyMinutes` adjustment.* The plan returns `dailyMinutes` (line 387) but no input to change it — student who has 30 min/day vs 2 h/day gets the same plan structure.
71. **[P1]** *"Generate My Plan"* button (line 366) on empty state — for a brand-new user with zero practice history, the plan generates a generic priority list based on… nothing. No warning "needs N practice sessions for a meaningful plan".
72. **[P1]** *7-Day Pass Plan is CLEP-only* (line 248) but the user's account is now AP/SAT/ACT — dead code path for 99% of dashboard users, yet still in the toggle bar for non-CLEP users? Actually `isCLEP` gates the toggle (line 227) so it's not visible — OK. But "Day 8: Schedule Your Exam" hard-codes CLEP URL (line 327) and $93 price — inflexible.
73. **[P2]** *Plan tips and strengths can be empty arrays* — `plan.tips.length > 0` guard at line 493 OK, but `plan.strengths` empty leaves a hole where no card renders, instead of a "complete your diagnostic to find strengths" stub.

---

### K. Billing — `(dashboard)/billing/page.tsx`

74. **[P0]** *Cancel button is plain text styled as a hyperlink* (line 487 `"Cancel subscription"`) at bottom of Premium features card. Hidden in muted-foreground. Users will assume cancel happens through Stripe portal only. Once clicked, a destructive button "Yes, cancel subscription" appears (line 507). No second-factor confirmation.
75. **[P0]** *"Cancel anytime"* copy (line 365) on Free tier description is misleading — Free has nothing to cancel.
76. **[P0]** *Module cancel uses `confirm()` alert* (line 580) — system browser confirm dialog with no styling, no module-specific copy. Confusing on a polished UI.
77. **[P1]** *Trial expiry never visible.* No countdown anywhere on /billing or anywhere else (the `Option B` comment in `(dashboard)/layout.tsx:298-300` admits the trial banner was removed). A converting user who upgrades has `daysLeft` shown for renewal (line 422); a trial user has nothing.
78. **[P1]** *Module subscriptions UI* (lines 545-619) has 4 modules. Each card embeds a `<form action="/api/checkout" method="POST">` — clicking "Upgrade" submits a form (full page redirect), losing Sage Live Tutor draft chats etc.
79. **[P1]** *"Welcome to Premium!"* banner (lines 289-294) — JWT-vs-DB sync logic in lines 78-155 has FIVE safeguards (snapshot ref, strip param, finish callback, polling cap, timeout) because the previous version flickered infinitely. Code complexity is a smell that the fundamental architecture (poll DB instead of webhook callback) is wrong.
80. **[P2]** *`subscriptionTier !== "PREMIUM" && !== "AP_PREMIUM" && !== "CLEP_PREMIUM"`* check at line 739 misses SAT_PREMIUM / ACT_PREMIUM / module-based premium. Analytics upsell shows for paying SAT/ACT users.

---

### L. Analytics — `(dashboard)/analytics/page.tsx`

81. **[P1]** *Full-screen exam mode for analytics* (line 77 `enterExamMode()`). Charts get more width but the user loses sidebar nav — has to use the explicit `← Back to Dashboard` link (line 279). On mobile this means bottom nav also disappears.
82. **[P1]** *Goal modal uses native `<input type="date">`* (line 327) — date-picker UX varies wildly by browser; iOS Safari opens a wheel, Chrome desktop a calendar, Firefox a tiny input. No min-date guard (user could set goal date in the past).
83. **[P1]** *"Estimated AP Score"* card (lines 536-553) checks `getExamCopy(course).family === "AP"` to hide for SAT/ACT — but the EARLY-stage card just above (lines 503-531) DOES show for SAT/ACT with scaled scores, creating two parallel "predicted score" cards with different math for the same user.
84. **[P1]** *Hardcoded chart colors* (lines 565, 576, 615) `#1865F2`, `#10b981` — don't update with theme. Light-mode dark blue vs dark-mode same dark blue.
85. **[P2]** *Mojibake* line 386 `"Find a test center ←’"`, line 660 `"←’ {Math.round(goal.targetScore)}%"`. The "→" arrows are corrupted in source.

---

### M. Diagnostic — `(dashboard)/diagnostic/page.tsx`

86. **[P1]** *"15-min MCQ check"* (line 140) but the intro card says "10-15 Questions" (line 161). User can't predict the actual length until starting.
87. **[P1]** *Crude 1-5 score formula* (lines 268-270): `meanPct >= 80 ? 5 : >= 65 ? 4 ...`. Cutoffs hardcoded, AP-only — fed back as "Predicted AP Score" (line 292) even for SAT/ACT (passes through `LockedInsightOverlay` with `examFamily` lookup but the headline `Your Predicted AP Score` always says AP).
88. **[P1]** *No "skip question" option in diagnostic.* Student stuck on a question they truly don't know has to guess; the 15-min MCQ check (line 211 Progress) doesn't allow blank.
89. **[P1]** *FRQ bridge card after diagnostic* (lines 308-328) says "Try 1 FRQ now (~2 min)" — but the FRQ-practice flow is read-then-write-then-self-grade which takes 8-15 min minimum. The 2-min promise undersells the actual time investment.
90. **[P2]** *Result page renders 3 separate stacked panels for free users* (predicted score card + FRQ bridge + weakest-unit card + Sage's recommendation locked + Sage's premium upsell). Same buffet problem as the dashboard.

---

### N. Cross-cutting

91. **[P1]** *SageChat (floating widget) and Sage Live Tutor (full page) and Sage Coach (full page voice) are three different "Sages" with three different model contexts.* No persistent conversation memory across them. SageChat uses `/api/chat/sage` (`sage-chat.tsx:184`) with `history.slice(-8)`. AI Tutor uses `/api/ai/tutor/stream`. Sage Coach uses `/api/sage-coach/evaluate`. A student who chats with SageChat about "I'm confused about momentum" and then opens AI Tutor sees zero context carryover.
92. **[P1]** *No global error boundary visible.* If `/api/user` 500s, Practice (line 246-254) defaults `setSubscriptionTier("FREE")` — silently degrades a Premium user to Free UX without warning.
93. **[P2]** *Bottom-nav active-state regex (`pathname.startsWith(href)`)* highlights "Practice" tab when at /practice/quickstart — fine — but also highlights "Mock" at /mock-exam/anything, no path under mock-exam exists so it's vestigial.

---

### Total: 93 issues. Top P0s by likelihood-of-broken-trust:

- **P0 #1, #2, #74**: No settings page, no delete-account, cancel is a buried text link. CCPA exposure + bad cancellation UX = chargebacks.
- **P0 #45, #54, #55**: Sage suite is incoherent — 5-chat cap invisible until hit; Sage Coach evaluates BEFORE checking daily cap; promo card calls voice tool a "FRQ Grader".
- **P0 #9, #10**: Dashboard still buffet despite "v2 collapse" — 14 possible cards, no clear answer to "what should I do today".
- **P0 #36, #37, #38, #39**: Mock Exam isn't a real mock — no Digital SAT adaptive, no pause, free Q5 paywall not pre-warned, single-section labeled as full exam.
- **P0 #65, #66**: Flashcards' SM-2 transparency and exam-date compression are completely hidden — the differentiator vs Quizlet/Anki is invisible.

Resume hook for next pass: look at `/journey`, `/community`, `/resources`, `/warmup`, `/onboarding`, and the post-FRQ-submit `frq-practice-card.tsx` rubric reveal UX (paywall vs free attempt visibility).

---

## DEEP AUDIT PASS #2 — Onboarding + Journey
*Reviewer: AP Calc BC (5), Bio (5), Lang (4), Chem (4), SAT 1480, ACT 33. Read every JSX/copy line in the onboarding + journey graph. No skim. Severity: **P0** = bounces real users / breaks core promise; **P1** = wrong-format/wrong-frame, will surface as ticket; **P2** = polish/copy.*

### Scope reviewed
- `src/app/(dashboard)/onboarding/page.tsx` (legacy redirect-only — 22 LOC)
- `src/app/(dashboard)/practice/quickstart/page.tsx` (200 LOC — the *real* onboarding)
- `src/app/(journey)/layout.tsx` (16 LOC)
- `src/app/(journey)/journey/page.tsx` (410 LOC orchestrator)
- `src/components/journey/journey-shell.tsx`
- `src/components/journey/step-0-course-pick.tsx`
- `src/components/journey/step-1-mcq.tsx`
- `src/components/journey/step-2-frq.tsx`
- `src/components/journey/step-3-diagnostic.tsx`
- `src/components/journey/step-3a-flashcards.tsx`
- `src/components/journey/step-5-done.tsx`
- `src/components/journey/transition-card.tsx`
- `src/components/journey/exit-intent-modal.tsx`
- `src/components/dashboard/auto-launch-nudge.tsx`
- `src/lib/exam-copy.ts` (the family-aware copy helper that fixes most of this — but isn't wired into the journey)

**Note:** `welcome-modal.tsx`, `hs-clep-interstitial.tsx`, `confidence-repair-screen.tsx` requested by the spec do **not exist in AP_Help** (StudentNest). Those live in PrepLion. SN has no welcome modal at all — confirmed by exhaustive listing of `src/components/dashboard/`. The HsCLEPInterstitial is by design absent (SN dropped CLEP). The only nudge that fires for new users is `AutoLaunchNudge`, and only after 2+ no-practice dashboard loads.

---

### P0 — Will bounce real users / breaks the journey promise

**1. [P0] Step 0 promises "projected AP score" to SAT and ACT students.** `step-0-course-pick.tsx:117` hard-codes "See your projected AP score at the end." If `userTrack === "sat"`, the journey-page default is `SAT_MATH` (`journey/page.tsx:87`) and Step 0 renders this AP-only sentence under the SAT_MATH card. ACT students get the same line under ACT_MATH. `getExamCopy(course).projectedScoreLabel` is the existing solution and is not imported here.

**2. [P0] Step 0 explainer hardcodes "1 FRQ" for SAT/ACT.** `step-0-course-pick.tsx:115-117`: "3 MCQs to 1 FRQ to quick diagnostic to 5 targeted MCQs." Step 2 auto-skips FRQ for SAT/ACT (`step-2-frq.tsx:46-48`) — but the user was just promised it. Trust gap. SAT has no FRQ; ACT has none. Should branch on `getExamCopy(course).hasFreeResponse`.

**3. [P0] Step 0 picker title + body say "AP course" but the list includes SAT/ACT/PSAT.** `step-0-course-pick.tsx:46-50`: "Pick your course" + "Choose which AP course you want to start with." `VISIBLE_AP_COURSES` (`lib/courses.ts:6385`) returns SAT_MATH, SAT_READING_WRITING, ACT_MATH/ENGLISH/SCIENCE/READING, PSAT_MATH/READING_WRITING alongside the AP set. Comment line 34 ("Only AP courses for now…") is stale by months. Real SAT student picking SAT Math from a list whose header says "AP" wonders if they're in the wrong product.

**4. [P0] Step 0 welcome heading "Welcome to StudentNest" pre-shows "Your course: AP World History" when `mustPick=false`.** `step-0-course-pick.tsx:81-103`. A returning user who exited mid-journey AND is on the AP track sees the welcome AGAIN with a pre-filled AP_WORLD_HISTORY card even if they originally exited from AP_BIOLOGY (the `currentStep===99` path forces `mustPickCourse=true` but the in-memory `course` state still holds the track default, `journey/page.tsx:106-110`). Returning AP_BIOLOGY user gets re-pitched AP_WORLD_HISTORY as "Your course" until they tap Change.

**5. [P0] trans12 transition copy is hard AP for SAT/ACT.** `journey/page.tsx:287-295`: `eyebrow="Good start" title="Now try a real AP question" body="One AP-style FRQ. … the part most students never see."`. SAT/ACT flow: Step 1 done to this transition fires to user taps Continue to Step 2 immediately auto-skips (no FRQ in family) to trans23 fires. So a SAT student sees "Now try a real AP question … One AP-style FRQ" *and then never sees an FRQ*. They will think the app broke.

**6. [P0] trans23 transition copy hardcoded AP.** `journey/page.tsx:312-322`: `eyebrow="Now estimate your AP score"`, body "We will show you a projected AP score and the unit you should fix first." For SAT_MATH the body should say "projected SAT score" + "domain" not "unit"; for ACT it should say "projected ACT score" + "section". `exam-copy.ts` has all of these; the file isn't imported in `journey/page.tsx`.

**7. [P0] Score-reveal card hardcodes "/5" and "projected AP score · out of 5" for SAT (400-1600) / ACT (1-36).** `journey/page.tsx:341-355`. The `predictedScore` from Step 3 is mapped to 1-5 in `step-3-diagnostic.tsx:148-149`. A SAT student who got 6/10 correct (60%) sees a giant "3" with "/5" suffix — meaningless. SAT score is 400-1600. ACT is 1-36. This is the *single most damaging* moment in the journey for non-AP users — it is literally the payoff screen.

**8. [P0] Step 3 diagnostic mapping is AP-only — no SAT/ACT band logic.** `step-3-diagnostic.tsx:148-149` always returns 1-5. An SAT student answering 8/10 correctly gets `predictedScore: 5` which the parent prints as "5 / 5" — SAT scoring is scaled (raw to concordance to 200-800 per section, 400-1600 composite). The plumbing returns a single integer with no family discrimination. Should be `mapToScore(family, meanPct)` returning the family's native scale.

**9. [P0] Step 5 done screen hardcodes "AP" three times.** `step-5-done.tsx:38` "You completed your first AP session.", line 47 "Got your projected AP score: {predictedScore}/5", line 49 "weakest unit {weakestUnitName}". An ACT_SCIENCE student sees: "Got your projected AP score: 3/5 · weakest unit Data interpretation." Zero of those phrases is correct for ACT.

**10. [P0] Predicted-score fallback for non-AP families lies to the student.** Step 3 retry-exhausted branch (`step-3-diagnostic.tsx:165-184`) falls back to client correctCount, maps to 1-5, passes that as `predictedScore`. For SAT_MATH user whose `/api/diagnostic/complete` hits a 5xx, they see "predicted SAT score: 3 / 5" *and* a destructive toast "Couldnt save your full diagnostic." Compounding harm.

**11. [P0] Sample size for diagnostic too small to claim a score on Digital SAT.** `step-3-diagnostic.tsx:67-68` caps at 10. Real Digital SAT is 54 Q Math + 54 Q R&W with modular Bluebook routing. 10 random Qs to 1-1600 prediction is statistically meaningless. AP diagnostic with 10 Qs at unit granularity is defensible if there are 7-9 units (AP World has 9). For ACT Science (40 Qs / 35 min — the time pressure IS the test) a 10-Q untimed diagnostic projecting 1-36 is also meaningless.

**12. [P0] Step 4 surfaces raw enum strings when `weakestUnitName` lookup fails.** `journey/page.tsx:247-252` does `unitMeta?.name ?? weakestUnit`. If SAT_MATH unitMeta lookup fails, you get raw enum strings like "SAT_MATH_3_PROBLEM_SOLVING" surfaced in trans34 title "5 questions in SAT_MATH_3_PROBLEM_SOLVING" (`journey/page.tsx:359`). Ugly + reveals internals.

**13. [P0] Step 1 MCQ interstitial fires on Step 4 too — contradicting its own code comment.** `step-1-mcq.tsx:42-44` says "Step 4 (targeted practice after the score reveal) skips the interstitial because the user already knows what they're doing — see prop default." **There is no `autoStart` prop or default that does this.** `started` defaults to `false` (line 45), so Step 4 *does* show the "Takes about 90 seconds" interstitial. Real user behavior: tap-through Start twice in 7 minutes for no reason. Comment is aspirational; code is wrong.

---

### P1 — Wrong format, wrong frame, will generate support tickets

**14. [P1] Quickstart vs Journey are two parallel onboarding paths with no connection.** `/onboarding` redirects to `/practice/quickstart` (`onboarding/page.tsx:21`). `/practice/quickstart` runs the user directly into `/practice?mode=focused&count=3&course=…` (`quickstart/page.tsx:124`). There is no link from quickstart to `/journey`. Meanwhile `/journey` is the *intended* 5-step onboarding (per its own comments). Two onboardings, neither aware of the other. A user who lands at `/practice/quickstart` will never see Steps 2-5 of the journey unless they manually navigate to `/journey`.

**15. [P1] Step 1 MCQ interstitial says "Takes about 90 seconds" for 3 Qs but Step 0 promised "~15 minutes" for whole journey.** `step-1-mcq.tsx:149` vs `step-0-course-pick.tsx:88-90`. Step 4 reuses the same interstitial (see #13). Inconsistent stakes framing.

**16. [P1] Step 2 FRQ auto-skip races the visible transition card.** `step-2-frq.tsx:46-48` calls `onComplete("")` inside a useEffect on first render. Parent sets mode to `step2` *after* trans12, so SAT/ACT users: see trans12 to tap Continue to mount Step2Frq to useEffect fires to mode becomes trans23 to renders next card. Zero FRQ content shown. For AP users with a family-correct course, fine. For SAT/ACT, broken-promise loop (see #5).

**17. [P1] Step 3a flashcards skip silently with exposed copy.** `step-3a-flashcards.tsx:67-78`: zero cards renders "No flashcards seeded for this course yet — skipping." This exposes raw infrastructure status to a student. Should silently advance without explaining why a feature is missing.

**18. [P1] Step 3a "Quick recall before practice — N of M" never explains the connection to weakest unit.** `step-3a-flashcards.tsx:97-99`. We know `weakestUnit` from Step 3; the heading should say "Memory boost for {weakestUnitName}" so the student understands why this random definition matters.

**19. [P1] Step 1 explanation panel dumps text without teaching frame.** `step-1-mcq.tsx:241-256`. After answering, you see correct/incorrect + explanation + Next. Real AP-style review ("The correct answer is C because… common trap: D") is what makes a warmup feel like teaching, not testing.

**20. [P1] Step 1 hardcodes `timeSpentSecs: 30` on every submit.** `step-1-mcq.tsx:106`. So a student who agonizes for 90 seconds and one who guesses in 3 seconds both report 30s. Breaks downstream IRT / time-adjusted difficulty modeling. Same bug in `step-3-diagnostic.tsx:91`.

**21. [P1] Step 1 has no inline progress dots inside the carousel.** Top rail says "Step 1 of 5" — that does not move during Q1 to Q2 to Q3. Inside the step you only get "Question 1 of 3" as text (`step-1-mcq.tsx:191`). Add a 3-segment dots indicator under the question.

**22. [P1] Step 2 "Ask Sage" CTA opens in new tab.** `step-2-frq.tsx:138-150` with `target="_blank"`. Comment line 128 says "Opens in a new tab so the journey state on this tab survives the diversion." On mobile, new-tab from a SPA is jarring and many users lose the original tab. Should use an in-page Sage drawer or `_self` since /ai-tutor accepts a prompt query.

**23. [P1] Step 3 diagnostic shows correct/incorrect feedback per question — defeats the diagnostic.** `step-3-diagnostic.tsx:241-273` shows green/red borders + Check/X icons after each answer. A diagnostic exists to surface what you do not know; revealing the correct answer per Q teaches during the diagnostic, polluting later Qs and inflating the predicted score. Either defer feedback to end-of-diagnostic, or rename to "5-Q quick check" not "diagnostic".

**24. [P1] Score-to-AP-level mapping is uniform across courses; real cut scores vary.** `step-3-diagnostic.tsx:148-149`: flat 80% to 5, 65% to 4, 50% to 3, 35% to 2 across all AP courses. Per-course `passThresholds` exist in `lib/courses.ts` and are not wired in. A flat threshold over-claims a 5 on hard courses (Chem needs ~75%) and under-claims on easier ones.

**25. [P1] Score reveal has no animation.** `journey/page.tsx:341-355`. The 7xl "5" appears instantly. The single most emotional moment of the journey is static. Count-up + confetti burst would 2x the share-rate.

**26. [P1] trans34 reveals weakest unit before the student knows what units are.** `journey/page.tsx:351-353` "Focus: {weakestUnitName} (weakest)". Add "(of 9 units in AP World History)" so the student understands the fraction.

**27. [P1] Step 5 buries the predicted score in a 3-✓ checklist row.** `step-5-done.tsx:42-58`. The user just answered 18-23 questions to learn one number — that number should still be hero on Step 5. "Your starting point: 3/5 — aim for 4 by May 5" with course-aware date would close the loop.

**28. [P1] Step 5 weakest-unit fallback is generic and tonal-whiplash.** `step-5-done.tsx:65-71`. If `weakestUnitName` is null (server failure), tile falls back to "Pick up your daily plan + drill weakest units" — instantly switches from personalised promise to product copy.

**29. [P1] Step 5 has 4 CTAs of equal visual weight.** `step-5-done.tsx:60-94`. "Continue free practice" + "Explore tools" + Upgrade tile + Sage link. Decision paralysis at the conversion moment. A/B candidate: 1 hero (continue), 1 ghost (upgrade), kill explore.

**30. [P1] Upgrade tile price `$9.99/mo` doesn't match the annual-savings framing on pricing page.** `step-5-done.tsx:111`. Annual is $79.99 to effective $6.67/mo. At the conversion moment, lead with the cheapest legal-true number.

**31. [P1] Exit modal: 2 of 6 preloaded reasons fit poorly.** `exit-intent-modal.tsx:27-34`. "Too long", "Didnt help", "Not what I need right now", "Too hard", "Too easy", "Other". Missing the most common real reason: "Just exploring, will come back" — maps to "Other" to free-text never written by typical mobile users.

**32. [P1] Exit submit button is "Send + exit" — friction.** `exit-intent-modal.tsx:130`. The user already decided to exit. Primary action should be "Exit"; secondary "Skip + exit". Current semantics make the modal block-the-exit rather than capture-feedback.

**33. [P1] AutoLaunchNudge headline is generic across all courses.** `auto-launch-nudge.tsx:97` "Ready to get your score moving?" — but `course` is already a prop. Could say "Your AP Bio score wont move on its own — 3 questions, 1 minute."

**34. [P1] AutoLaunchNudge dismiss persists in sessionStorage (per tab) but the API check still runs.** `auto-launch-nudge.tsx:42-56`. Each new tab re-pings `/api/auto-launch-check` even after user dismissed in another tab today. Wastes Worker invocations and risks the modal popping in the second tab. Move dismiss key to localStorage.

**35. [P1] JourneyShell progress bar maxes at 100% only on Step 5.** `journey-shell.tsx:33` `pct = (step / totalSteps) * 100`. Step 5 = 100% — but Step 5 is the *done* screen. Bar should hit 100% on Step 4 completion. As-is, the bar fills as a side-effect of reaching the completion screen rather than as a reward for completing the work.

**36. [P1] Step 3a "Reveal back first" disabled button confuses tap intent.** `step-3a-flashcards.tsx:131-145`. Some users tap the (disabled) button instead of the card. Replace with "Tap the card to reveal" caption + greyed disabled button — make the card the affordance.

**37. [P1] No "save your work" guarantee anywhere mid-step.** Refresh during Step 3 question 4 sends user back to Step 3 question 1 (the `/api/diagnostic` POSTs again on mount, `step-3-diagnostic.tsx:53`). For a 10-Q diagnostic on flaky mobile this is a real loss.

---

### P2 — Polish, copy, mobile

**38. [P2] Step 0 "Welcome to StudentNest" is product-name-first, not value-first.** `step-0-course-pick.tsx:87`. Should echo landing promise: "See whats missing on your AP Bio."

**39. [P2] Step 0 picker list has no search/filter.** `step-0-course-pick.tsx:52-66`. 30+ AP courses scroll in a 60vh box. Type-to-filter would cut decision time noticeably.

**40. [P2] Step 0 picker rows show only `name` — no chip for difficulty/duration.** Adding "5 units · 3hr exam" subtitle helps differentiate AP World from AP Euro at a glance.

**41. [P2] Step 1 "(A)" prefix renders alongside cleaned option text.** `step-1-mcq.tsx:229`. `cleanOptionText` strips DB-stored "A) " prefix (verified bulletproof) — but on first-render of un-cleaned data, briefly possible to see "(A) A) Real text". Worth a regression test.

**42. [P2] Step 1 stimulus block uses `bg-muted/30` — low contrast in light mode.** `step-1-mcq.tsx:197`. Stimulus is often a graph caption or passage excerpt; needs to feel visually distinct from the prompt. Same in `step-3-diagnostic.tsx:233`.

**43. [P2] Step 2 FRQ provenance pill uses 📋 emoji.** `step-2-frq.tsx:108-115`. Provenance is the credibility moment — use a proper Badge with shield icon, not 📋. Also gated on `frq.year || frq.sourceUrl` — if neither present, no provenance shows, undermining "real exam" framing.

**44. [P2] Step 2 "Ask Sage" only available after FRQ reveal.** `step-2-frq.tsx:123` `{revealed && (`. What if the student is stuck *before* writing? Add an "I am stuck, talk me through it" button before reveal — that is the highest-intent Sage moment.

**45. [P2] Step 3 final "See my score" button breaks the voice consistency.** `step-3-diagnostic.tsx:280`. Step 1 uses "Continue", trans cards use "Continue", Step 2 uses "See my projected score", Step 3 uses "See my score". Pick one phrasing per moment-type.

**46. [P2] Step 3 has no "I dont know" / skip-question option.** Forces a guess. Real diagnostics offer skip because guessing pollutes the signal.

**47. [P2] trans23 body promises "the unit" singular, diagnostic returns ALL unit scores.** `journey/page.tsx:316`. The product is underselling — "here are 9 unit scores ranked" is more impressive.

**48. [P2] trans34 says "5 questions in {weakestUnitName}" but API may return fewer.** `journey/page.tsx:389-395`. Step 4 passes `questionCount={5}` and `unit={weakestUnit}` to Step1Mcq; bank may have fewer than 5 in a thin unit. trans34 lies to user clicks to gets 3 Qs and wonders why. Add "up to 5".

**49. [P2] Step 5 "You completed your first AP session" — but the journey is *not* a session.** `step-5-done.tsx:39`. Session = "a single sitting". Journey = guided tour. Reframe to "You finished your starting check" or "Your baseline is set."

**50. [P2] Step 5 emerald Trophy icon implies "you won".** `step-5-done.tsx:33-35`. Overclaim — student took a temperature check, did not pass anything. Use Compass/Telescope to signal direction.

**51. [P2] Mobile: Step 0 picker overlay scroll inside a fixed-vh container double-scrolls on iOS.** `step-0-course-pick.tsx:52`. Common iOS bug. Move to a Drawer component for mobile or fix parent scroll.

**52. [P2] Mobile: Step 1 "(A)" letter span is `w-6 flex-shrink-0` — tight when option text wraps.** `step-1-mcq.tsx:229`. Consider stacking letter on top on `sm` breakpoint.

**53. [P2] Mobile: Step 3a flashcard `min-h-[260px]` does not account for iPhone notch safe-area.** `step-3a-flashcards.tsx:104`. Add `pt-safe`.

**54. [P2] Mobile: Step 5 UpgradeTile wraps at 360px.** `step-5-done.tsx:99-120`. The price "$9.99/mo" wraps to a second line, breaking visual hierarchy. Test on iPhone SE.

**55. [P2] Exit modal radio inputs use sr-only checkbox + label.** `exit-intent-modal.tsx:101-109`. Screen reader announces without role grouping. Wrap in `<fieldset><legend>`.

**56. [P2] No focus management on step transitions.** When mode changes, focus stays on the unmounted Continue button. Screen readers announce "moved to body" and user loses context. Add `useEffect` per step to focus the new heading.

**57. [P2] Back-button behavior is undefined.** Router does not push history per step (state is React state). Browser back exits the journey entirely. Acceptable for v1 but document it.

**58. [P2] Network drop mid-Step 3 conflates load-failure with user-skip.** `step-3-diagnostic.tsx:208-216`. Differentiate "Retry" (load failure) from "Skip" (user choice).

**59. [P2] Prefetch FRQ useEffect still fires when tab is hidden.** `journey/page.tsx:163-175`. Add `document.visibilityState === "hidden"` early return.

**60. [P2] `writeCourseToBrowserStorage` dispatches CustomEvent on Step 0 pick but not on boot/resume.** `journey/page.tsx:64-70` + line 119. Resume on a new tab — dashboard cards in that tab will not get the event and may show the wrong course label until reload. Fire on boot path too.

---

### Coherence-across-steps notes

- The Sage "free chat" appears in two places: Step 2 reveal panel (`step-2-frq.tsx:129-152`) and Step 5 footer link (`step-5-done.tsx:86-93`). No mention in trans cards. Acceptable. But Sage **Coach** (the voice product) is never surfaced in the journey at all. New user finishes journey having never heard "Sage Coach exists" — then the dashboard `SageCoachPromoCard` ambushes them.

- The journey rail says "5 steps" but renders 5 step screens + 3 transition cards + 1 micro-step (3a). User experiences ~9 distinct screens for a "5-step journey." Acceptable, but the "Step 4 of 5" label during the flashcard step (Step 3a) is technically misleading — user is still pre-Step-4.

- The post-journey dashboard renders 6+ competing cards (per earlier audit). The journey does not warn the user "your dashboard is about to look busy — heres how to find your daily plan." Bigger architectural problem: the journey is well-designed, the destination isnt.

### Top-3 P0 (executive)

1. **Score reveal lies to SAT/ACT students.** Every score-bearing screen shows "/5" and "AP" terminology. The `exam-copy.ts` helper exists and is unused on the journey path. (Issues #5-#9, #11)
2. **Promised FRQ never appears for SAT/ACT.** trans12 + Step 0 explainer say "1 FRQ"; Step 2 auto-skips silently for non-FRQ families. Trust-break at minute 3. (Issues #2, #5, #16)
3. **Step 0 picker says "AP" but lists SAT/ACT/PSAT.** Wrong product framing at the very first decision. (Issues #3, #4)

### Total issues filed
**60** (13 P0 / 24 P1 / 23 P2)

---

## DEEP AUDIT PASS #2 — Pre-login surface

> Third deep pass, scoped strictly to PRE-LOGIN pages (marketing + auth). Line-by-line read of every public page. Reviewer profile: CB-veteran (AP Calc BC 5, Bio 5, Lang 4, Chem 4, CSA 5; SAT 1480; ACT 33). Severity: **P0** = breaks trust / loses user / legal risk. **P1** = active friction or contradiction. **P2** = polish/copy.

### A. Honesty & copy claims

1. **[P0] Landing contradicts itself on diagnostic length.** Hero at `src/app/page.tsx:276` says "5-minute diagnostic"; eyebrow at `src/app/page.tsx:348` says "3-Minute Diagnostic"; Day-1 timeline at `src/app/page.tsx:573` says "5 minutes." `am-i-ready/page.tsx:11-12` says "3-minute" + "5 questions." Standardize on "3-minute (5 questions)."

2. **[P0] Hero badge `Free forever · {courseCount} courses · No credit card`** (`src/app/page.tsx:267`) — `courseCount` from `lib/settings` reports the full label count, not the `visible_courses` allowlist subset. Curriculum-coverage section below the badge shows fewer courses. Fix: derive from `visibleCourses.length`.

3. **[P0] Social-proof tile "8 engagement features"** (`src/app/page.tsx:422`) is internal-team jargon. Means nothing to a student. Replace or delete.

4. **[P0] Parent block math conflicts with pricing.** `src/app/page.tsx:1062`: "A private tutor at $50/hr × 24 hours runs $1,200. Our $20 covers the same period." No $20 plan exists — Premium is $9.99/mo or $79.99/yr. Bait-and-switch read for a paying parent.

5. **[P0] AP-coded social proof on every page.** `src/components/social-proof-badge.tsx:56` default: "Join {N}+ AP students preparing for May 2026." Loads on landing hero AND on SAT/ACT register page (`register/page.tsx:240`). SAT/ACT prospects see "AP students." Fix: derive from page family.

6. **[P0] Free-tier Sage chat limit contradicted in 5 surfaces.** Landing Free column says "3 Sage Live Tutor chats per day" (`src/app/page.tsx:938`); pricing-client agrees (`pricing-client.tsx:107`); but FAQ says "5 Sage Live Tutor chats per day" (`src/components/landing/faq.tsx:27`); AP/SAT/ACT Free columns also say "5 Sage Live Tutor chats/day" (`ap-prep/page.tsx:221`, `sat-prep/page.tsx:208`, `act-prep/page.tsx:196`). 3 vs 5 across five places. `lib/tier-limits.ts` is the source of truth — surface it.

7. **[P0] Pricing tabs imply per-module SKUs but they don't exist.** `pricing-client.tsx:178-196` swaps to "AP Premium / SAT Premium / ACT Premium" cards with separate checkout endpoints — but hero says "One subscription unlocks every exam" (`pricing-client.tsx:150`). FAQ #1 has to apologize for the UI. Student asks: "Do I need to buy SAT separately?" Kill the tabs; show one Premium card.

8. **[P1] FREE "5-question mock exam preview"** (`pricing-client.tsx:109`) — landing Free column omits it (`src/app/page.tsx:930-941`). What happens at Q5 — hard paywall? Silence.

9. **[P1] Landing "500+ released College Board FRQs from past exams"** (`src/app/page.tsx:44`) is a top feature, but SAT/ACT have no FRQs. AP-prep Free column never mentions the 500 number (`ap-prep/page.tsx:221`) — headline metric isn't surfaced in the AP funnel.

10. **[P1] About hard-codes `courseCount = 16`** (`src/app/(marketing)/about/page.tsx:50`) and renders all COURSES regardless of `visible_courses` allowlist. Walks into the "advertise what we can't serve" trap the rest of the site avoided.

11. **[P1] AP unit counts inconsistent.** Landing `src/app/page.tsx:72` says AP Physics 1 = 8 units; `ap-prep/page.tsx:28` says 10 units; CB CED = 7. AP Psychology shown as 5 units (landing) and 9 units (`ap-prep/page.tsx:35`). A CB-fluent student spots in 30 seconds.

12. **[P1] About page "Beta 11.2" badge** (`about/page.tsx:65`) — "Beta" framing on a marketing surface reduces trust to a paying parent.

13. **[P1] About: "120+ original calibration question stems"** (`about/page.tsx:162`) — meaningless metric. Tie to a benefit or drop.

14. **[P2] Honesty section "we got it wrong before"** (`src/app/page.tsx:1028-1054`) is the strongest credibility moment, buried 8 sections deep. Move higher.

15. **[P2] Blog has 5 articles, all "Coming soon," dated Mar 12-20, 2026** (`blog/page.tsx:14-55`) — two-month-stale placeholders. Ship or 404.

16. **[P2] Blog still includes CLEP articles** (`blog/page.tsx:24-30, 47-54`) despite CLEP sunset. Inconsistent story.

### B. Audience clarity

17. **[P1] Mixed audience on every prep page.** SAT/ACT/AP/PSAT all close with a "For parents" block inside an otherwise student-voice page (`sat-prep/page.tsx:226-231`, `act-prep/page.tsx:214-219`, `ap-prep/page.tsx:239-244`). Parent has to scroll past 8 student sections.

18. **[P1] No `/parent` route exists.** Only parent surface is anchor `#parents` on landing (`src/app/page.tsx:1058`). No dedicated parent funnel, no "send to your child" handoff, no parent-specific framing. P1 because parents are the buyers.

19. **[P2] Landing footer "Sign Up Free" + "Log In" categorized as "Product"** (`src/app/page.tsx:1168-1170`). Auth links aren't products.

### C. Pricing transparency

20. **[P1] "1 free FRQ attempt per type, per course (DBQ, LEQ, SAQ)"** (`pricing-client.tsx:108`). DBQ + LEQ are AP US-Hist / AP World-Hist specific. AP Bio prospect sees "DBQ" and bounces. Scope copy by exam family.

21. **[P1] Refund mentioned 4× on pricing** — hero (`pricing-client.tsx:151`), per-module features array, bottom trust line (`pricing-client.tsx:278`), FAQ #4. Code comment at line 271-273 acknowledges the redundancy was already flagged.

22. **[P1] No itemized "what's NOT in free."** Free card lists 7 capabilities. FRQ rubric scoring, streaming Sage, mock past Q5 — all Premium-only but never said negatively. Add a "Not in Free →" sub-section.

23. **[P1] Cancellation not explained pre-login.** Pricing says "cancel anytime · from your billing page." What happens to data after cancel? Can you re-subscribe with the same email? Silence.

24. **[P2] Comparison table mojibake.** `pricing-client.tsx:302-305` source contains `âŒ`, `â±ï¸`, `Â²` — unicode encoding corruption.

25. **[P2] Pricing page has no Schema.org Product/Offer markup.** SAT/ACT/AP/PSAT pages do (`buildJsonLd`). Pricing is highest-intent SEO surface — biggest miss.

### D. Pass Guarantee scrutiny

26. **[P0] Two different Pass Guarantees on the site.** `/pass-guarantee` (`pass-guarantee/page.tsx:50-63`): 80% study plan + 3 mocks @75% avg + score within 60 days → refund subscription + retake fee. `/methodology` (`methodology/page.tsx:59-69`): "Pass Confident Guarantee" — extend subscription 60 days + refund most-recent payment, contingent on a "high-confidence passing prediction within 14 days of exam." Different policies under different names. Careful parent/lawyer notices.

27. **[P0] Loophole #1: "best 3 mocks count."** `pass-guarantee/page.tsx:55-57`: "average of 75% or higher across 3 mocks. Only your best 3 count." Student takes 30 mocks → cherry-pick best 3 by luck on 4-choice MCQs. Require 3 *consecutive* mocks ≥75% or median of last 5.

28. **[P0] Loophole #2: criterion 1 has no time stamp.** "≥80% of study plan" has no recency requirement. Add "within the 90 days preceding your exam."

29. **[P1] "AP = score <3 (or whatever the program counts as passing for credit)"** (`pass-guarantee/page.tsx:136`) — "or whatever" is a refund loophole. Lock to "<3."

30. **[P1] Floor inconsistency.** Methodology page passing floor `AP 3+ / SAT 1200+ / ACT 24+` (`methodology/page.tsx:62`). Pass-guarantee page says SAT/ACT floor is "your stated target score, captured during onboarding" (`pass-guarantee/page.tsx:136`). Contradiction.

### E. Auth pages

31. **[P0] Register grade-level options 10/11/12 only.** `register/page.tsx:351-353`. Blocks 9th graders (AP Human Geography, AP CSP, AP World are 9th-grade staples), adult test-takers, college students. Add "9th Grade" + "Other / N/A."

32. **[P0] Password rules differ between register and reset.** Register requires min 8 + uppercase + number (`register/page.tsx:23-26`). Reset-password requires min 8 only (`reset-password/page.tsx:31`). User can reset to a weaker password than register allowed. Share the Zod schema.

33. **[P0] Register has no `psat` case in module-switch copy.** `register/[plan]/page.tsx:36-41` supports `/register/psat` and redirects with `?module=psat`. But `register/page.tsx:228-237` switch on `userModule` has no `psat` case — falls through to default "Start your AP exam journey today — free." PSAT prospects sign up under AP framing.

34. **[P1] Register schema `firstName.min(2)` / `lastName.min(2)`** (`register/page.tsx:20-21`). Real names exist with 1 char ("Xi"). Allow 1+ or unicode-aware.

35. **[P1] Verify-email failure offers "Back to Register"** (`verify-email/page.tsx:69`) — but the email already exists, so register will reject with duplicate-email. Better CTA: "Request new verification link."

36. **[P1] Auth layout has no footer.** `auth/layout.tsx` shows only the logo. No Terms/Privacy/Contact from login or register — anti-pattern for trust.

37. **[P1] Google CTA disclaimer "No password, no email verification needed"** (`register/page.tsx:283`). Privacy-conscious parent raises eyebrows. Add "we never post or read your Gmail."

38. **[P2] Reset-password lacks live password-strength indicator** while register hints rules. Easy parity fix.

39. **[P2] Login + register email placeholder `you@school.edu`** (`login/page.tsx:178`, `register/page.tsx:316`). Many high-schoolers don't have .edu addresses. Use `you@example.com`.

40. **[P2] No "Remember me" on login.** Friction on shared family devices.

41. **[P2] Forgot-password has no visible rate-limit / honeypot.** Anti-enumeration response correct (`forgot-password/page.tsx:37-55`), but no rate-limit UX.

### F. AP vs SAT vs ACT positioning

42. **[P0] Hero is AP-coded everywhere.** "aim for a 5," AP World question in InteractiveDemo, AP exam-season banner, AP-students social proof. SAT/ACT prospects landing on `/` see AP everywhere. Track-aware hero copy on `?track=sat|act` would fix.

43. **[P0] Mobile sticky CTA shows "CLEP Prep" button** (`mobile-sticky-cta.tsx:43-47`). CLEP is sunset; clicking routes to `/register?module=clep` which bounces to PrepLion (`register/page.tsx:73-78`). Mobile user taps "CLEP Prep" → leaves the site. Copy-paste survival from pre-sunset.

44. **[P1] Two different navs.** Landing nav (`src/app/page.tsx:223-247`) has AP/SAT/ACT/Pricing but no PSAT. MarketingHeader (`marketing-header.tsx:67-69`) on every other marketing page DOES have PSAT. Pick one source.

45. **[P1] Curriculum coverage section** (`src/app/page.tsx:743-771`) intermingles AP, SAT, ACT with no family grouping. Reader skimming for their exam has to read every line.

### G. Digital SAT adaptive claim

46. **[P1] Marketing sidesteps Digital SAT module-adaptive format entirely.** Grep for `Bluebook|adaptive|two-module|module-adaptive` across `(marketing)/**`: zero Bluebook, zero two-module, zero module-adaptive. "Adaptive" appears only as "adaptive practice/study plan," never "adaptive exam format." `sat-prep/page.tsx` never mentions Bluebook. **By NOT claiming module-adaptive simulation, the product avoids fraud — but a post-March-2024 SAT taker can't tell whether practice mirrors the real test's flow.** Add a single honesty line: "Our SAT practice is item-bank style, not Bluebook module-adaptive yet."

47. **[P1] "Real ACT format — including 5-choice Math"** (`act-prep/page.tsx:110-112`) ✓ correct. Lean into it.

48. **[P2] PSAT page claims "National Merit Selection Index tracking"** (`psat-prep/page.tsx:13-14`). NMSI = 2×M + 2×RW per CB. If the product doesn't compute it explicitly, overclaim. Verify.

### H. 404 / catch-all

49. **[P1] `not-found.tsx` primary CTA is "Back to your dashboard"** (`not-found.tsx:42`). Unauth visitor → middleware bounce to login → confusing detour. Detect auth state; offer `/login` to anon.

50. **[P2] 404 has no search affordance or sitemap.** A student who 404'd on `/ap-bio` (typo) gets no path to `/ap-prep/ap-biology`.

### I. Mobile / touch readiness

51. **[P1] MobileStickyCta renders from `scrollY > 600`** (`mobile-sticky-cta.tsx:15`) on EVERY page including `/login`, `/register`, `/forgot-password`. On iPhone SE / short viewports it occludes the form submit. No `pb-[env(safe-area-inset-bottom)]`. Suppress on auth routes; add safe-area inset.

52. **[P2] Hero `<select>` optgroups** in `hero-readiness-picker.tsx:57-77` — Android Chrome sometimes drops optgroup labels. Visual-only.

53. **[P2] Hero CTA sub-row** (`src/app/page.tsx:285-289`) has `hidden sm:inline` separators leaving lone `·` on <360 px Androids. Cosmetic.

54. **[P2] APSeasonBanner dismiss button** is 24 px (`ap-season-banner.tsx`) — below 44×44 mobile spec.

### J. Other (broken refs, dead routes, footer/SEO)

55. **[P1] No `/how-to-use` route** despite task scope listing it. MIA.

56. **[P1] Contact "Billing & Subscriptions" tile links to `/faq`** (`contact/page.tsx:74`). Unauth users hitting `/billing` get 401. Provide a public refund-request mailto.

57. **[P2] About page has 13+ release-note sections (Beta 6.0 → 11.2).** ~5k words of changelog gating the actual About. Move to `/changelog`.

58. **[P2] Wall-of-Fame seed rows dated "May 2026"** (`wall-of-fame/page.tsx:40-51`) all tagged "Example" with fake initials. Faked-looking placeholders on a credibility page = negative credibility.

59. **[P2] AP-season banner hard-coded `AP_EXAM_END = 2026-05-17`** (`ap-season-banner.tsx:34`). Past today → correctly hides, but dead code lingers. Plan annual rotation.

60. **[P2] Logo gradient-text classes duplicated** in `marketing-header.tsx:28-30` and `auth/layout.tsx:11-13` — `dark:text-blue-700 dark:text-blue-400` repeated on the "Prep" span suggests automated string mangling. Cosmetic but noisy.

### Top-3 P0 (pre-login executive)

1. **Free-tier limits contradicted in 5 places** (issue #6) — landing/pricing/FAQ/AP-prep/SAT-prep/ACT-prep all disagree (3 vs 5 Sage chats/day). Single-source-of-truth (`lib/tier-limits.ts`) is committed but unused everywhere except 2 surfaces.
2. **Pricing tabs lie about SKU structure** (issue #7) — three per-module Premium cards suggest separate subscriptions despite hero copy "one subscription unlocks every exam." FAQ #1 apologizes for the UI.
3. **Two different Pass Guarantees with conflicting eligibility** (issue #26) — `/pass-guarantee` and `/methodology` describe materially different programs. Legal + trust risk.

### Total in this pass
**60 issues** (15 P0 / 30 P1 / 15 P2). Pass #1 + journey-pass + pre-login-pass combined → ~213 unique issues across the codebase.

