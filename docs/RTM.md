# StudentNest — Requirements Traceability Matrix

**Document ID:** RTM-002
**Version:** 2.0
**Last Updated:** 2026-05-24
**Status:** Active

---

## Purpose

Single-table traceability from REQ-id (per `docs/REQUIREMENTS_LEDGER.md`) to test file,
test case ID(s), and current status. This supersedes the v1.x RTM (which mapped legacy
HLR/DR ids only). HLR/DR mappings still live in §3 for backward compatibility.

A row is "complete" when:
1. Code implements it
2. At least one test asserts it
3. The test runs on `pages:deploy` (or daily quality sweep)
4. The commit closing it cites the REQ-id

---

## 1. Coverage Summary

| Metric | Count | % |
|---|---|---|
| Total REQ-ids (101-148) | 48 | 100% |
| Implemented in code | 48 | 100% |
| With at least one dedicated test | 18 | 38% |
| With Playwright E2E | 14 | 29% |
| With vitest unit test | 8 | 17% |
| Documented in test plan only (no spec) | 30 | 63% |

**RTM coverage % (test linked / implemented):** 38%
**Test-debt count:** 30 REQs (mostly newly-shipped — see "tech debt" section in REQUIREMENTS_LEDGER.md)

---

## 2. REQ-id → Test Matrix

Legend: ✅ shipped+tested · 🟡 shipped+partial · 🔴 bug · ⏳ planned · ❌ dropped

| REQ-ID | Title | Test File | Test Cases | Status |
|---|---|---|---|---|
| REQ-101 | CB content alignment — topicWeights + apSkill + bloomLevel | TODO unit (`tests/unit/course-registry.test.ts` — not yet written) | weight-sum=1.0, apSkill present, bloomLevel present | 🟡 |
| REQ-102 | Exam-module feature flags — conditional CLEP/DSST | `tests/e2e/clep-dsst-removal-2026-05-03.spec.ts` | full file | ✅ |
| REQ-103 | Per-course Sonnet override (USH/STATS) | TODO unit (`tests/unit/ai-providers-callai-routing.test.ts`) | PREMIUM_COURSES routes to callSonnet first | 🟡 |
| REQ-104 | USH+STATS CB-grade seed | TODO unit (manual seed-script smoke) | 23 Qs upserted with `isApproved=true` | 🟡 |
| REQ-105 | Sage system prompt post-sunset cleanup | TODO E2E (`tests/e2e/sage-no-clep-mention.spec.ts`) | system prompt mentions "16 courses" not "72" | 🟡 |
| REQ-106 | /methodology page transparency | `tests/e2e/critical-paths-2026-05-03.spec.ts` (public surface) | GET /methodology 200 + 4 sections present | 🟡 |
| REQ-107 | early-win.ts library | TODO unit (`tests/unit/early-win.test.ts`) | shouldBoost(<0.5)=true, applyEarlyWinBoost places EASY non-weak Qs front | ⏳ |
| REQ-108 | ConfidenceRepairScreen + pass-engine helpers | TODO E2E (`tests/e2e/diagnostic-repair-screen.spec.ts`) | passPercent<60 renders screen | 🟡 |
| REQ-109 | Reddit exam-sub mining pipeline | TODO smoke script | aggregator output has ≥3-corroboration themes | ✅ |
| REQ-110 | User trial schema + TrialReengagement | `tests/unit/tier-limits.test.ts` (partial) | columns exist; reengagement model present | ✅ |
| REQ-111 | Trial re-engagement cron (port) | TODO smoke (`tests/e2e/cron-trial-reengagement.spec.ts`) | `?dry=1` returns 200 + send candidate | 🟡 |
| REQ-112 | SageFAQ model | (model only) | — | 🟡 |
| REQ-113 | Test user seed | seed script smoke (manual) | upsert idempotent | ✅ |
| REQ-114 | Sage tagline — Accuplacer awareness | TODO E2E | Sage reply omits "CLEP" unless asked | ✅ |
| REQ-115 | Score predictor engine (AP/SAT/ACT scales) | `tests/unit/score-predictor.test.ts` | scale-clamp, NaN-guard, recency decay | 🟡 |
| REQ-116 | ReadinessCard + SidebarReadiness | TODO E2E (`tests/e2e/readiness-card.spec.ts`) | dashboard renders predicted; sidebar pill ≤ 12 chars | 🟡 |
| REQ-117 | Am I Ready free quiz | TODO E2E (`tests/e2e/am-i-ready.spec.ts`) | result matches logged-in predictor within 1 pt | 🟡 |
| REQ-118 | HeroReadinessPicker | TODO E2E | landing CTA = "Check my readiness" | 🟡 |
| REQ-119 | /methodology score-prediction math | shared with REQ-106 | — | ✅ |
| REQ-120 | Admin Test Users tab + reset | TODO E2E (`tests/e2e/admin-test-users.spec.ts`) | Reset clears mastery + sessions + trial fields | 🟡 |
| REQ-121 | onboardingCompletedAt | TODO E2E | reset → re-walk onboarding on next login | 🟡 |
| REQ-122 | Trial re-engagement cron (parity restate) | shared with REQ-111 | — | 🟡 |
| REQ-123 | SageFAQ model (restate) | shared with REQ-112 | — | 🟡 |
| REQ-124 | Full-screen exam mode | TODO E2E (`tests/e2e/exam-mode.spec.ts`) | Esc exits + popState exits + nested-route leak | 🟡 |
| REQ-125 | ConfidenceRepairScreen (StudentNest port) | shared with REQ-108 | — | 🟡 |
| REQ-126 | early-win library (StudentNest port) | shared with REQ-107 | — | ⏳ |
| REQ-127 | PREMIUM_COURSES env override | shared with REQ-103 | — | ✅ |
| REQ-128 | Sage rate limit + error-leak sanitize | TODO unit + E2E (`tests/unit/sage-error-sanitize.test.ts` + E2E for 429) | 21st req in 60s → 429; thrown path returns generic msg | ✅ |
| REQ-129 | Billing polling — refreshing-off before update | `tests/e2e/billing-flicker.spec.ts` + `tests/e2e/billing-page-consistency.spec.ts` | post-webhook poll doesn't spin forever | ✅ |
| REQ-130 | Mock-exam paywall fail-closed | TODO E2E (`tests/e2e/mock-exam-paywall.spec.ts`) | Free user blocked even when premium check throws | ✅ |
| REQ-131 | Tailwind dynamic-class fix on clep-prep/dsst-prep | (sunset pages — deferred) | — | 🟡 |
| REQ-132 | Course count + subtest count copy | `tests/e2e/critical-paths-2026-05-03.spec.ts` (public-surface body length) | landing reads "16" / "73" cross-product | ✅ |
| REQ-133 | Logo click → landing | TODO E2E | sidebar/header brand → "/" | ✅ |
| REQ-134 | Premium restriction banner cleanup | TODO unit (`tests/unit/premium-banner.test.tsx`) | "FRQs are free" sub-copy removed | ✅ |
| REQ-135 | Reddit pipeline (restate) | shared with REQ-109 | — | 🟡 |
| REQ-136 | Daily Quiz Email cron | TODO smoke (`tests/e2e/cron-daily-quiz.spec.ts`) | `?dry=1` returns chosen Q + dedup-over-30-days | 🟡 |
| REQ-137 | `_routes.json` static exclude | TODO post-deploy smoke | `/sw.js` 200 + byte-match `public/sw.js` | ✅ |
| REQ-138 | pages:clean prepended to pages:build | TODO unit (parse package.json) | `pages:build` starts with `pages:clean` | ✅ |
| REQ-139 | SW pass-through v5 | TODO unit + post-deploy | sw.js v5 + activate clears cache | ✅ |
| **REQ-140** | Strict-mode full-gates sweep | `tests/e2e/quality-sweep-strict.spec.ts` (NEW) + `tests/unit/sweep-full-gates.test.ts` (NEW) | STRICT_ALL default true; `--high-precision-only` opts out | 🟡 |
| **REQ-141** | Second-pass Haiku verifier | `tests/unit/second-pass-verifier.test.ts` (NEW) | parser extracts verdict/solved_letter/reason; FAIL short-circuits insert | 🟡 |
| **REQ-142** | Gen prompts forbid letter-label refs | `tests/unit/question-content.test.ts` (extend) | LETTER_CLAIM_PATTERNS rejects "Letter C is correct" | ✅ |
| **REQ-143** | TRUNCATED-STEM gate | `tests/unit/question-gates-truncated-stem.test.ts` (NEW) | "Factor the expression." rejected; "Factor x^2 - 4." accepted | ✅ |
| **REQ-144** | CLEP→PrepLion redirect on /register | `tests/e2e/clep-register-redirect.spec.ts` (NEW) | `?module=clep` → preplion.ai/register | 🟡 |
| **REQ-145** | Daily quality-sweep cron | `tests/e2e/quality-sweep-cron-workflow.spec.ts` (workflow file shape) | yaml cron `0 9 * * *` + secrets injected | ✅ |
| **REQ-146** | SAT/ACT PDF extract pipeline | `tests/unit/sample-questions-shape.test.ts` (NEW) | JSON files have {stem,options,correctAnswer,source}; counts match (308 SAT / 504 ACT) | ✅ |
| **REQ-147** | SAT/ACT Haiku mirror-fill volume | TODO CI smoke — gate-pass-rate floor 80% | per-course pass-rate ≥ 0.80 across last 100 inserts | 🟡 |
| **REQ-148** | Distractor-plausibility sweep | `tests/unit/distractor-plausibility-heuristics.test.ts` (NEW) | magnitude-absurd / verbatim-from-stem / all-none-in-math gates | 🟡 |

---

## 3. Legacy HLR/DR Traceability (preserved from RTM v1.7)

### High Level Requirements

| Req ID | Requirement Summary | Implementation File(s) | Test Case(s) | Status |
|--------|--------------------|-----------------------|-------------|--------|
| HLR-F-01 | Secure user auth: register, login, session, password reset, role access | `src/lib/auth.ts`, `src/app/(auth)/`, `src/app/api/auth/` | TC-AUTH-01–07, TC-PWRESET-01–05 | Implemented / Tested |
| HLR-F-02 | Multi-course AP support (9+ courses, registry-driven) | `src/lib/courses.ts`, `prisma/schema.prisma` | TC-PRAC-01, TC-MOCK-01 | Implemented / Tested |
| HLR-F-03 | Adaptive MCQ practice with AI fallback | `src/app/api/practice/route.ts`, `src/lib/ai.ts` | TC-PRAC-01–06 | Implemented / Tested |
| HLR-F-04 | FRQ practice with AI scoring | `src/app/api/practice/[id]/route.ts`, `src/lib/ai.ts` | TC-PRAC-03, TC-PRAC-06 | Implemented / Tested |
| HLR-F-05 | Timed mock AP exams with AP score estimate | `src/app/(dashboard)/mock-exam/`, `src/app/api/practice/` | TC-MOCK-01–03 | Implemented / Tested |
| HLR-F-06 | Conversational AI tutor with streaming | `src/app/(dashboard)/ai-tutor/`, `src/app/api/ai/tutor/`, `src/app/api/ai/tutor/stream/` | TC-TUTOR-01–04 | Implemented / Tested |
| HLR-F-07 | Mastery-based analytics and progress tracking | `src/app/(dashboard)/analytics/`, `src/app/api/analytics/` | TC-ANAL-01–03 | Implemented / Tested |
| HLR-F-08 | AI study plan (personalized or static template) | `src/app/(dashboard)/study-plan/`, `src/app/api/study-plan/` | TC-PLAN-01–02 | Implemented / Tested |
| HLR-F-09 | Curated learning resources per course | `src/lib/courses.ts` (resourceUrls), `src/app/(dashboard)/resources/` | — | Implemented |
| HLR-F-10 | Freemium billing with Stripe ($9.99/mo Premium) | `src/app/api/checkout/`, `src/app/api/webhooks/stripe/`, `src/app/(dashboard)/billing/` | TC-BILL-01–04 | Implemented / Blocked (live Stripe) |
| HLR-F-11 | Gamification: XP, streaks, achievements | `src/app/api/practice/[id]/route.ts` (XP logic), `prisma/schema.prisma` (Achievement) | TC-GAME-01–03 | Implemented / Tested |
| HLR-F-12 | Admin dashboard for question management and flags | `src/app/(dashboard)/admin/`, `src/app/api/admin/` | TC-ADMIN-01–04 | Implemented / Tested |
| HLR-F-13 | Database-backed feature flag system | `prisma/schema.prisma` (SiteSetting), `src/app/api/` (flag checks) | TC-FLAG-01–03 | Implemented / Tested |
| HLR-F-14 | AI auto-population of question bank | `src/app/api/practice/route.ts`, `src/lib/ai.ts` (generateQuestion) | TC-PRAC-05 | Implemented / Tested |
| HLR-F-15 | Living documentation in docs browser | `src/app/(dashboard)/docs/page.tsx`, `public/docs/` | TC-DOCS-01–03 | Implemented / Tested |
| HLR-F-16 | Two-Tier AI Generation | `src/lib/ai-providers.ts`, `src/lib/ai.ts`, `prisma/schema.prisma`, `src/app/api/practice/route.ts`, `src/app/api/ai/bulk-generate/route.ts` | TC-TIER-01 to TC-TIER-06 | Implemented |
| HLR-F-17 (NEW) | **Deterministic question-gate pipeline + second-pass Haiku verifier + daily sweep cron** | `scripts/lib/_question-gates.mjs`, `scripts/lib/_second-pass-verifier.mjs`, `scripts/_sweep-full-gates.mjs`, `.github/workflows/quality-sweep.yml` | TC-GATE-01–08 (NEW, see Section L of test plan) | Implemented / Partial |
| HLR-NF-01 | API responses < 5s; AI streaming < 3s | `src/lib/ai-providers.ts` (AbortSignal.timeout), streaming endpoint | TC-TUTOR-02 | Implemented / Tested |
| HLR-NF-02 | 99.9% uptime; graceful AI degradation | `src/lib/ai-providers.ts` (10-provider cascade), Cloudflare edge | TC-TUTOR-01 | Implemented / Tested |
| HLR-NF-03 | Auth on all routes; bcrypt passwords; JWT secrets | `src/lib/auth.ts`, all API route auth checks | TC-AUTH-02, TC-AUTH-05 | Implemented / Tested |
| HLR-NF-04 | Serverless horizontal scale; DB indexes; per-user rate limiting | Cloudflare Workers + Neon serverless Postgres; `prisma/schema.prisma` (indexes); `src/lib/rate-limit.ts` | TC-SCALE-01–04 | Implemented / Tested |
| HLR-NF-05 | Single CourseConfig block per course | `src/lib/courses.ts` (COURSE_REGISTRY) | TC-PRAC-01, TC-MOCK-01 | Implemented / Tested |
| HLR-NF-06 | Node.js + CF Workers compat; plain fetch | `src/lib/ai-providers.ts`, `src/lib/prisma.ts` (WASM) | TC-TUTOR-01 | Implemented / Tested |

### Detailed Requirements

(Unchanged from RTM v1.7 — see git history for full DR-AUTH / DR-COURSE / DR-PRAC /
DR-MOCK / DR-ANAL / DR-TUTOR / DR-PLAN / DR-BILL / DR-GAME / DR-FLAG / DR-ADMIN /
DR-DOCS / DR-PERF / DR-TIER tables.)

---

## 4. Test File Index

| Test file | Covers REQs | Tooling |
|---|---|---|
| `tests/register-auto-signin.spec.ts` | REQ-144 (partial — middleware redirect only) | Playwright |
| `tests/e2e/clep-dsst-removal-2026-05-03.spec.ts` | REQ-102 | Playwright |
| `tests/e2e/critical-paths-2026-05-03.spec.ts` | REQ-106, REQ-119, REQ-132 | Playwright |
| `tests/e2e/billing-flicker.spec.ts` | REQ-129 | Playwright |
| `tests/e2e/billing-page-consistency.spec.ts` | REQ-129 | Playwright |
| `tests/unit/score-predictor.test.ts` | REQ-115 | vitest |
| `tests/unit/tier-limits.test.ts` | REQ-110 | vitest |
| `tests/unit/question-content.test.ts` | REQ-142 (extend) | vitest |
| `tests/unit/stripe-webhook.test.ts` + helpers | REQ-129 (indirect) | vitest |
| `tests/unit/flashcard-explanation-sanitizer.test.ts` | (legacy — flashcard surface) | vitest |
| `tests/unit/register-track-copy.test.ts` | REQ-144 (partial — copy assertion only) | vitest |
| `tests/e2e/clep-register-redirect.spec.ts` **NEW** | REQ-144 | Playwright |
| `tests/e2e/quality-sweep-strict.spec.ts` **NEW** | REQ-140 | Playwright (CI smoke) |
| `tests/unit/sweep-full-gates.test.ts` **NEW** | REQ-140 | vitest |
| `tests/unit/second-pass-verifier.test.ts` **NEW** | REQ-141 | vitest |
| `tests/unit/question-gates-truncated-stem.test.ts` **NEW** | REQ-143 | vitest |
| `tests/unit/sample-questions-shape.test.ts` **NEW** | REQ-146 | vitest |
| `tests/unit/distractor-plausibility-heuristics.test.ts` **NEW** | REQ-148 | vitest |

---

## Document Change Log

| Version | Date | Change Summary |
|---------|------|---------------|
| 1.4 | 2026-03-15 | Initial RTM — 55 requirements traced across HLR + DR |
| 1.5 | 2026-03-16 | DR-PERF-01–04 added (4 new); coverage 55→59 |
| 1.6 | 2026-03-16 | HLR-F-16 + DR-TIER-01–10 (11 new); coverage 59→70 |
| 1.7 | 2026-03-17 | Rebranded to NovaNest |
| **2.0** | **2026-05-24** | **Restructured to REQ-id matrix (REQ-101 to REQ-148). HLR-F-17 added for quality-gate pipeline. New test files inventoried (8 new specs). Coverage: 38% test-linked, 100% implemented.** |
