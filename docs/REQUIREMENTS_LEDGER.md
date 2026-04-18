# StudentNest Requirements Ledger (living doc)

**Purpose:** every user-facing requirement lives here, numbered and traceable. Every fix cites a REQ-id in its commit message. Every E2E spec declares which REQ-ids it verifies. Orphan requirements (no test) are tech debt; orphan tests (no requirement) are either testing the wrong thing or a missing requirement — both get resolved, not left ambiguous.

**Sister product:** PrepLion (`preplion.ai`) — CLEP/DSST/Accuplacer prep. Same company, separate codebase. PrepLion's REQUIREMENTS_LEDGER.md is the model for this one. When a pattern is proven on PrepLion, this doc tracks its port to StudentNest.

**Sunset:** CLEP + DSST were moved from StudentNest to PrepLion on 2026-04-14. Requirements marked SUNSET below are deprecated; any CLEP/DSST reference in this file is historical context only.

**Process rule:** a requirement is not "done" until (a) code implements it, (b) at least one E2E or unit test asserts it, (c) the test runs as part of `pages:deploy`, and (d) the commit that closed it cites the REQ-id.

---

## Status legend

- ✅ Shipped + tested
- 🟡 Shipped + partial test
- 🔴 Bug reported against shipped feature
- ⏳ Planned, not yet shipped
- ❌ Dropped / superseded / sunset

---

## Requirements

| REQ | User requirement | As-a-user statement | Given/When/Then | Code ref | Test ref | Status | Commit |
|---|---|---|---|---|---|---|---|
| REQ-101 | **CB content alignment — topicWeights + apSkill + bloomLevel taxonomy** | As an AP student, my practice questions should reflect the actual exam's unit weights (not flat distribution) and tag the College Board skill + Bloom's level so analytics can spot gaps. | Given bulk question generation runs, When a course has `topicWeights` in COURSE_REGISTRY, Then per-unit targets scale by CB weight (e.g., APUSH Period 7 gets ~15% of target). AI response JSON includes `"apSkill"` + `"bloomLevel"` fields when the generator prompt emits them. | `src/lib/courses.ts` (topicWeights per course) · `prisma/generate-questions.ts` (weight-aware) · `src/lib/auto-populate.ts` | — | ✅ | `1d175a7` |
| REQ-102 | **Exam-module feature flags — conditional CLEP/DSST post-sunset** | As a StudentNest user post-sunset, I should see AP/SAT/ACT only. CLEP/DSST must be hidden behind `isClepEnabled()`/`isDsstEnabled()` which default to false. | Given `site_settings.clep_enabled = "false"`, When landing/pricing/FAQ/sidebar render, Then CLEP cards, FAQ entries, module tabs, and sidebar entries are filtered out. Course count reads 16 (10 AP + 2 SAT + 4 ACT). | `src/lib/settings.ts` · `src/lib/feature-flag-defs.ts` · `src/app/page.tsx` · `src/app/(marketing)/pricing/pricing-client.tsx` · `src/components/layout/sidebar.tsx` · `src/lib/exam-label.ts` | — | ✅ | `d636d94`, `ff8801f` |
| REQ-103 | **Per-course model override — route USH/STATS to Sonnet** | As a content author, questions for AP_US_HISTORY + AP_STATISTICS should use Anthropic Sonnet directly (bypassing free Groq cascade) because free models underperform on SAQ/DBQ nuance + numerical reasoning. | Given `PREMIUM_COURSES` env lists a course, When `callAI(prompt, course)` is invoked, Then it routes to `callSonnet()` first; on Sonnet error falls back to the Groq cascade. Default list: `AP_US_HISTORY,AP_STATISTICS`. | `prisma/generate-questions.ts` (callSonnet + callAI router) | — | ✅ | `af40ad5` |
| REQ-104 | **USH + STATS CB-grade seed — hand-authored jump-start** | As the content bank, I should be initialized with ≥15 USH + ≥8 STATS CB-grade MCQs so Sonnet mass-gen has a style anchor + STATS hits target immediately. | Given `scripts/seed-ush-stats-cb-grade.js` runs, Then 23 hand-authored questions (period-specific stimuli for USH, inference-grade for STATS) upsert into the bank with `isApproved=true`. | `scripts/seed-ush-stats-cb-grade.js` | — | ✅ | `42507f8` |
| REQ-105 | **Sage system prompt post-sunset cleanup** | As an AP student asking Sage anything, I should not be pitched CLEP/DSST courses. Sage's system prompt should describe StudentNest as "16 courses: 10 AP, 2 SAT, 4 ACT" and point CLEP/DSST seekers to preplion.ai. | Given `/api/chat/sage` gets any request post-sunset, When the system prompt is built, Then it mentions 16 courses + preplion.ai for CLEP/DSST. /pricing context drops CLEP/DSST from per-module copy. -prep page detection defaults to AP (not CLEP). | `src/app/api/chat/sage/route.ts:24,39,42` | — | ✅ | `0e925ad` |
| REQ-106 | **/methodology page — transparent pass-probability math** | As a prospective student, I should see the honest inputs and model behind the pass-probability number before trusting it with my study time. | Given I visit /methodology, Then I see 4 sections: inputs (mastery/accuracy/mock/recent), improvement model (3 pp/day baseline + diminishing returns), Pass Confident Guarantee fine print, and transparency pledge. Canonical URL = studentnest.ai/methodology. | `src/app/(marketing)/methodology/page.tsx` | — | ✅ | `0bad6a8` |
| REQ-107 | **early-win.ts — low-diagnostic confidence protection** | As a diagnostic < 50% student, my first 1-2 practice questions should NOT be my weakest unit; I should get 1-2 guaranteed EASY wins from outside my weak set before the weakness drill starts. | Given `shouldBoost(avgDiag)` returns true, When `applyEarlyWinBoost(questions, weakUnits, count=2)` runs, Then the returned array has up to 2 EASY non-weak-unit questions at the front. | `src/lib/early-win.ts` | `src/lib/early-win.ts` shape matches PrepLion's tested helper | 🟡 | `0bad6a8` (not yet wired into practice route) |
| REQ-108 | **Confidence Repair screen — pass-probability repair UX** | As a user who just scored < 60% on the diagnostic, I should see an honest 7/14-day projection + my 2 weakest units + the Pass Confident Guarantee BEFORE being asked to convert. | Given diagnostic completes with passPercent < 60, Then `ConfidenceRepairScreen` renders above the results flow with `projectImprovement(pp, 7)` + `projectImprovement(pp, 14)` + 2 lowest-mastery units + Pass Confident Guarantee. Shown once per diagnostic session (sessionStorage). | `src/components/diagnostic/confidence-repair-screen.tsx` · `src/lib/pass-engine.ts` `projectImprovement()` | — | 🟡 | `d03447c` (not yet wired into diagnostic flow) |
| REQ-109 | **Reddit exam-sub mining pipeline** | As content ops, I should be able to surface corroborated exam-prep strategies from r/APStudents + r/SAT + r/ACT and promote themes with ≥3 corroboration to SageFAQ. | Given `scripts/crawl-reddit-exam-subs.mjs` + `extract-reddit-tips.mjs` + `aggregate-reddit-tips.mjs` run in sequence, Then JSON files in `scripts/data/` record signals → tips → themes. Themes with ≥3 corroboration are SageFAQ candidates. | `scripts/crawl-reddit-exam-subs.mjs` · `scripts/extract-reddit-tips.mjs` · `scripts/aggregate-reddit-tips.mjs` | — | ✅ | `670e43a` |
| REQ-110 | **User trial schema fields + TrialReengagement model** | As a trial user, my trial window must be tracked on User (`freeTrialExpiresAt`, `freeTrialCourse`) so flows can gate on it and the re-engagement cron can target me. | Given the User model, Then `freeTrialExpiresAt`, `freeTrialCourse`, `trialEmailsSent` columns exist (nullable or default 0). `TrialReengagement` table records email sends (one row per send, indexed on userId+sentAt). | `prisma/schema.prisma` User + TrialReengagement · Neon DB via `npx prisma db push` | — | ✅ | `9f74b8a` |
| REQ-111 | **Trial re-engagement cron (ported from PrepLion REQ-028)** | As a user with a 7-day trial who went dormant, I should get a single data-driven nudge email at 24h, 72h, and 144h of inactivity (max 3 per trial, min 36h between, last_chance terminal, kill-switched via env). | Given cron fires with Bearer CRON_SECRET, When a user is trial-active + dormant + hasn't hit cap, Then `decideEmail()` picks a cadence step, email sends via Resend with weakest-unit CTA, `TrialReengagement` row records it. `?dry=1` skips send. `CRON_TRIAL_REENGAGEMENT_ENABLED=false` disables the cron instantly. | `src/app/api/cron/trial-reengagement/route.ts` · `src/lib/trial-reengagement-logic.ts` · `src/lib/email.ts` `sendEmail` export | — | 🟡 | `0033e01` (needs cron-job.org registration + CRON_SECRET on CF Pages) |
| REQ-112 | **SageFAQ model — curated FAQ store** | As Sage, I should have a curated FAQ store that my fallback-matcher can hit when all AI providers fail, with category + priority + tags + Reddit-corroboration tracking. | Given `prisma.sageFAQ`, Then entries have category/question/answer/priority/tags + sourceUrl/corroborationCount for Reddit-promoted themes. Indexed on (category, priority). | `prisma/schema.prisma` SageFAQ model | — | 🟡 | `9f74b8a` (model exists, no seed yet) |
| REQ-113 | **Test user seed — murprasad+std@gmail.com** | As an admin QAing flows, I should have a stable test account `murprasad+std@gmail.com / TestStd@329` whose password + track can be reset by re-running a seed script. | Given `scripts/seed-test-user-std.mjs` runs, Then the user is upserted with track=ap, emailVerified set, password hash rewritten. Safe to run repeatedly. | `scripts/seed-test-user-std.mjs` · User id `cmo3u8ddx0000uui028z20c0w` | — | ✅ | `83944c7` |
| REQ-114 | **Sage tagline — Accuplacer awareness across products** | As a user whose track might be AP or SAT or ACT (post-sunset StudentNest), Sage should mirror PrepLion's A22.12 pattern: the tagline + response copy should not hard-code CLEP. | Given Sage replies to any StudentNest user, Then no response includes "CLEP" unless the user explicitly asked about it; system prompt mentions 16 courses not 72. | `src/app/api/chat/sage/route.ts` | — | ✅ | `0e925ad` |

### Sunset / superseded

| REQ | Note |
|---|---|
| ~~CLEP/DSST marketing copy~~ | SUNSET 2026-04-14. Pages + configs still exist under feature flags (default false) for rollback safety; to be removed after 6-month audit. |

---

## Requirements with code but no dedicated test (tech debt)

- **REQ-107** early-win: ported, lib only, not wired into practice route — no integration test yet
- **REQ-108** ConfidenceRepairScreen: ported, component only, not wired into diagnostic flow — no integration test
- **REQ-111** trial cron: cron route exists, but cron-job.org not registered and no E2E covering dry-run response
- **REQ-112** SageFAQ: model exists, seed script missing, Sage fallback-matcher not yet updated to query new table

---

## Adversarial user personas (regression matrix)

Same personas as PrepLion's matrix but track=ap:

| Persona | State | Test file |
|---|---|---|
| **Maya** — fresh happy path | Fresh account, chose trial | `tests/first-user-flow-e2e.spec.ts` (to port) |
| **Jessica** — limited-free escape hatch | Fresh account, chose "Continue free" | — (to port from PrepLion) |
| **Jay** — post-completion abandon | Completed diagnostic, no next step | — (to port) |
| **Dagem** — onboarding step 0 bounce | Fresh account, Continue button state | — (to port) |
| **Anders** — mid-session abandon + return | IN_PROGRESS session, returns later | — (to port) |
| **Free-no-mock** | Tries mock without diagnostic | — |

---

## Process commitments

Identical to PrepLion's process:

1. **User gives requirement** (chat, screenshot, bug report)
2. **Record it here immediately** — before writing any code
3. **Write a failing test first** — click-by-click, screen-by-screen
4. **Implement code** until the test passes
5. **Commit cites the REQ-id**
6. **Deploy runs the test**

Unblocked items from PrepLion (worth porting):

- REQ-017 (first_answer_submitted metric)
- REQ-018 (no onboarding loop after completion)
- REQ-019 (start trial from inside the app — CourseLockOverlay)
- REQ-020 (start trial from post-diagnostic cliff)
- REQ-021 (admin test-user reset — RESET_USER_FIELDS + resetUser())
- REQ-022 (Sage cascade Anthropic fallback)
- REQ-025 (unhide pass % after diagnostic)
- REQ-026 (numeric + multi-select grading)
- REQ-027 (pass probability single source of truth)
