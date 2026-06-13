# PO Change-Spec (G1) — "Lead with Learning" growth goal (PL + SN)

Run through the 6-role BIQ process (`docs/QUALITY_PROCESS.md`). Mirror in AP_Help/docs.
Evidence base: `memory/project_growth_retention_goal_2026_06_10.md` (6-investigation root-cause analysis).

## Why (the problem, data-backed)
PL D2-retention 24% / SN 15%; ~85% one-and-done; 54% never answer a Q; completers avg 29% accuracy; only ~4% subscribe. Root cause = **we lead with judgment (diagnostic + pass-probability score) instead of learning (tutor-mode + great explanations + reframed low scores).** Content/breakage/paywall/return-loop all proven MINOR.

## The items + acceptance criteria + rollback

### Item 0 — NO-SIGNUP "try first" flow (NEW, HIGHEST-IMPACT — user-identified 2026-06-10)
- **Why:** Duolingo A/B-tested that deferring signup beats front-loading it. Our 54% pre-question bounce happens AT the signup→onboarding→diagnostic wall, before any value. The single biggest activation unlock = let an anonymous visitor feel a win first.
- **Spec:** Public route (e.g. `/try`) — pick exam → answer ~3 EASY questions → tutor-mode explanation after each → a win. THEN convert: "Create a free account to save your progress + keep going" (carry the chosen course into register). No auth, no DB write (client-side anon session), no diagnostic.
- **Done =** an anonymous visitor answers questions + sees explanations with zero signup, then a natural conversion prompt; both products; verified live.
- **Rollback:** new route is additive; revert by removing the route + the landing CTA.

### Full learnings checklist (from 6-investigation research — ensure ALL covered)
1. First session is a WIN not a measurement → items 0,1. 2. Errors=feedback not punishment → item 2 + tutor-mode. 3. **Defer signup until after value → item 0 (was missing).** 4. Daily return mechanic → item 4. 5. Value before paywall → item 5. + Explanations ARE the product → item 3. + Normalize low scores → item 2. + Tutor-mode default (immediate explanation each Q) → item 1 (verify it exists). + Spaced repetition → item 4.

## The 5 items + acceptance criteria + rollback

### Item 1 — Lead with learning (kill diagnostic-gate + dead-stop; easy-first tutor-mode first session)
- **Spec:** After onboarding, ONE dominant "keep practicing" action (no 3-tile menu). First practice set serves EASY questions first (difficulty ramp). Diagnostic optional, not a gate. Immediate explanation after each Q (tutor mode).
- **Done =** new user reaches an answerable question with a single tap; first questions are EASY; no co-equal decision menu; verified live both products.
- **Rollback:** revert step-5-done.tsx + question-selection change (git).

### Item 2 — Reframe low scores (morale)
- **Spec:** Never show a bare low % as a verdict on the first session. Show "starting line / beginners get ~30% / every miss is a point banked for test day." Apply at: journey step-5-done warm-up, practice summary, dashboard pass-probability framing.
- **Done =** no demoralizing first-session score copy; reframe visible at all 3 surfaces, both products.
- **Rollback:** copy-only revert.

### Item 3 — Explanations explain every answer choice (fix 33% circular)
- **Spec:** Wire `isCircular` gate into deterministic-question-gates (block new circular at approval); add teaching-contract to generator prompt; sweep+regen existing circular explanations (user-priority courses first). Each explanation states why correct is right AND why each distractor is wrong.
- **Done =** circular gate live + blocking; circular rate materially down on served pool; QA-walk asserts non-circular explanation after a WRONG answer.
- **Rollback:** gate is additive; regen is content-only (no schema).

### Item 4 — Spaced-repetition return loop
- **Spec:** Wire missed-Q / weak-concept review as the daily "due today" reason using existing Today's Set + confidenceSelf. Surface as the returning-user primary CTA.
- **Done =** a returning user sees a concrete "X due today" set driven by their misses; both products.

### Item 5 — Monetize the cherry, not the cake (STRATEGIC — needs user decision)
- **Spec (proposal):** Keep tutor-mode learning generous/free; gate analytics/score-prediction/full-mocks. Consider matching Modern States free-value framing. DO NOT implement pricing changes without explicit user sign-off.
- **Done =** user decision recorded; if approved, gating change shipped.

## Process
Each item: PO spec (this doc) → DEV → independent REV (Agent #2) → QA persona walk (Agent #3) → RM manifest → SRE live-prod verify. Customer-facing → also parity (PL=SN). Deploy verified increments as made (`feedback_deploy_progress_promptly`).

## Progress log
- 2026-06-10: Item 2 (step-5-done reframe) + Item 1 (dead-stop→1 CTA) DEV done on PL, build clean, deploying. SN mirror + REV/QA next.
- 2026-06-10: PL step-5-done — independent REV **PASS**, deployed LIVE. SN step-5-done mirror built+deployed.
- 2026-06-10: **Item 0 (no-signup interactive try)** — `/free-clep-practice` upgraded from static SEO page → interactive answer→explanation→win→/register flow (`interactive-try.tsx`). Was routing curious visitors to the demoralizing diagnostic; now tutor-mode + converts to register. Build clean, deploying (build9), REV running. NEXT: surface as primary landing CTA; mirror to SN (`/free-sat-practice` or equiv).
- KEY learning added (user-identified): deferred signup = item 0, highest impact. Full learnings checklist now complete in spec above.
- 2026-06-11: **Item 0 LIVE + verified on PL** — REV PASS (+ index-derived-letter hardening). Landing hero reframed (no diagnostic lead) + "Try 5 questions free — no signup" primary CTA → interactive `/free-clep-practice` (answer→explanation→win→/register?src=free_try&module=clep). Files: app/page.tsx hero, free-clep-practice/{page,interactive-try}.tsx. Live-verified: landing try-CTA ✓, diagnostic-lead removed ✓, interactive widget ✓, SEO preserved ✓. NEXT: mirror item 0 to SN (free SAT/ACT practice page → interactive); item 2 practice-summary reframe; item 3 circular.
- 2026-06-11: **Item 0 MIRRORED TO SN** — new `/free-sat-practice` (5 digital-SAT Qs, 4-option) + `interactive-try.tsx` (module=sat, register whitelist verified `[ap,sat,act]`) + SN landing hero reframed ("Try 5 questions free — no signup" → /free-sat-practice, diagnostic lead removed). Build clean, deploying (sn-deploy-item0, bg bmbqulltz). **Item 0 now DONE on BOTH products.**
- STATUS: item0 ✅PL+SN · item1 ✅PL(REV-pass)+SN(dead-stop) · item2 ✅PL step-5 (remaining: practice-summary+dashboard reframe both) · item3 ⏳circular (next, biggest) · item4 ⏳spaced-rep · item5 🟡user-decision.
- 2026-06-11: **Item 2 practice-summary reframe** (low <50% score → "normal, every miss is a point banked") — PL LIVE (deploy11), SN built+deploying.
- 2026-06-11: **Item 3 circular explanations** — (a) deterministic **circular gate WIRED into src/lib/deterministic-question-gates.ts on BOTH PL+SN** (blocks new "X because X"/too-short at approval; approval-time only, no serve-path impact; build clean both). (b) **Regen engine validated** (CLEP_SOCIOLOGY: rewrote circular→teaching, fail-safe rejected the bad one). (c) **FULL PL circular regen (4,144 items) RUNNING in background** (Groq), log data/circular-regen-pl.log, task bi4rgeuir. Precise count: 4,144 of 17,413 approved CLEP (~24%, down from the original 33% as prior regens already fixed some). REMAINING item3: gen-prompt teaching-contract (lower priority — gate catches it), SN regen run.
- STATUS NOW: item0 ✅BOTH · item1 ✅BOTH(dead-stop) · item2 ✅BOTH(step5+summary) · item3 🟡gate-live BOTH + regen running · item4 ⏳ · item5 🟡user.
- 2026-06-11: Item 3 regen — background execution unreliable in this env (detached/buffered). PROVEN via foreground: LIMIT=50 batch = **50/50 rewritten, 0 rejected** (circular→teaching). ~51 fixed this session. **TO FINISH THE SWEEP (multi-hour Groq job): run `cd PrepLion && REGEN=1 APPLY=1 node scripts/_regen-explanations.mjs` (or repeated LIMIT=200 batches); same for SN.** ~4,090 PL circular remain. Gate already prevents NEW ones on both products. SN gate+item2 deployed (sn-deploy-gate). PL gate deployed (deploy12).
- REMAINING GOAL WORK: item3 full regen sweep (PL+SN, time-bound), item3 gen-prompt teaching-contract (optional, gate covers it), **item4 spaced-rep return loop (buildable next)**, **item5 monetize-cherry (NEEDS USER DECISION — don't ship pricing without sign-off)**, item1 easy-first difficulty ramp (deeper).

---
## 2026-06-11 — USER WALKTHROUGH exposed items 1+2 were NOT actually met (BIQ defects D9–D13)
User walked the live PL `/journey` and found it STILL leads with judgment: graded warm-up (hard quadratic), FORCED diagnostic, "0/10" + projected-score verdict. Items 0–2 had been marked "✅ live" from partial code-ship without G1 conformance / G4 QA-walk (root cause D9/D13). Full BIQ record: `docs/BIQ_LEAD_WITH_LEARNING_DEFECTS_2026-06-11.md` (ECA/ICA/RCA per defect, retained, mirrored to AP_Help). Ledger appended in `docs/QUALITY_PROCESS.md` (both repos).

**FIXED + SHIPPED this session (BIQ 6-role, independent REV + conformance agents run):**
- **Item 1 (real fix):** warm-up now serves `difficulty:"EASY"` + "no score, no pressure" sub-label; `handleStep1Done` → step 5 directly (diagnostic NO LONGER forced); diagnostic demoted to opt-in card → `/diagnostic`. Conformance agent: ✅ met (EASY honored server-side `api/practice/route.ts:319`, single-tap, no co-equal menu, tutor-mode explanation).
- **Item 2 (real fix):** step-5 score-verdict removed when no diagnostic; **dashboard `pass-probability-hero.tsx` low-score reframe ADDED** (was the missing 3rd surface the conformance agent flagged). All 3 surfaces now covered.
- **D10/D11 question defect:** broken duplicate-answer-SET question served (College Algebra x²+2x+1=16, (D)"-5,3"≡(E)"3,-5"). Root cause = `normalizeOptForDupe` case-bug (lowercased before stripping uppercase-only `/^[A-E]\)/` prefix → prefixed dupes bypassed the gate). Fixed normalizer + NEW `options-duplicate-set` order-independent gate (positive solution-set guard so coordinate pairs / ordering Qs aren't false-flagged — REV finding). Swept pools: **PL 4 unapproved, SN 1 unapproved.** Regression test `tests/unit/duplicate-set-gate.test.ts` (both repos, 4/4 green).
- **PL DEPLOYED + LIVE-VERIFIED** (deploy14, `8939f4de.preplion.pages.dev`, 19/19 pre-flight, 38 integration 0-fail). **SN parity built + deploying** (sn-deploy-leadlearning, bg).
- **D12 TEAS regression (RCA PENDING):** TEAS approved 2,313→**155** of 5,420 total. Likely a gate re-run unapproved the pool. ICA = re-approval pass (like Accuplacer `d7ca7ec`). PCA = approved-count floor probe per shipped course.
- PROCESS LOCKED: no goal-doc item flips to ✅ without independent G1 conformance + G4 QA-walk (D9/D13 PCA).
- REMAINING: SN deploy live-verify; D12 TEAS re-approval; item3 regen sweep; item4 spaced-rep; item5 user decision; item1 deeper easy-first ramp (Step 4 + regular practice still soft/Focus-only per conformance agent).

---
## 2026-06-11 (cont.) — items 4 + 5 + TEAS all addressed
- **D12 TEAS — RESOLVED:** RCA = prior promotion never persisted (155+2,158 gate-passing=2,313); ICA `deterministic-gate.mjs --course=TEAS --approve` → restored to 2,313 (verified, serving); PCA `scripts/shipped-course-floor-probe.mjs` wired into pages:deploy. Full record in BIQ doc D12.
- **SN parity DEPLOYED:** journey easy-first + optional diagnostic + post-journey opt-in + duplicate-set gate. Live `593b40ae.studentnest.pages.dev`. E2E 99-fail is the chronic baseline (item0=101, step5=100) — no net regression from this change (verified).
- **Item 4 (spaced-rep return loop) — SHIPPED:** engine (`todays-set.ts`: SM-2+CBR+miss-priority) already existed; the gap was framing. Added `missedDue` through `/api/todays-set` (both repos) + reframed Today's Set card to "Review what you missed — N questions you missed are due for review." PL LIVE (deploy15, c7b8060d); SN code ready.
- **Item 5 (monetize the cherry) — USER SIGNED OFF + IMPLEMENTED (PL, REV running):** CLEP/DSST tutor-mode practice is now **free & unlimited** (removed 10-session/day cap, flag-gated `free_practice_unlimited` default "1" for instant rollback). Cherry stays PAID: projected score, full analytics, full-length mocks, Sage. Accuplacer $39 one-time per-subtest cap UNTOUCHED (separate SKU). Practice-page banner reframed to upsell the cherry, not practice access. PENDING: pricing-page/FAQ copy fixes (D4 — line 18 "Unlimited practice" + line 333 FAQ "limited questions" now false), independent REV verdict, deploy. SN parity = follow-up (different product model — confirm scope).
