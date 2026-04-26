# PrepLion Bug-Hunt Sprint — 2026-04-25 (RECORD ONLY)

**Methodology:** Same 10-parallel-agent scan applied to StudentNest. Read-only — no fixes applied to PrepLion repo. User explicitly requested record-only.

**Repo:** `C:\Users\akkil\project\PrepLion` (master branch, v23.1.0)
**Architecture:** Next.js 14 + Prisma WASM + Neon HTTP + Cloudflare Pages + NextAuth JWT + Stripe + Resend (same DNA as StudentNest)
**Coverage:** CLEP (34 exams) + DSST (22 exams) + Accuplacer

## Aggregate findings

| Category | Defect count | Top severity |
|---|---|---|
| Accessibility | 19 | P1 (focus traps, icon buttons, SelectTrigger no aria-label) |
| Security | 19 | P1 (timing attacks on CRON_SECRET, IDOR risk on flashcards, public test endpoints) |
| Error handling / fail-silent | ~37 | P1 (cold-start 5xx pattern matches StudentNest's pre-7.2 state, JSON.parse without try/catch) |
| Performance | 80+ | P0 (multiple N+1 queries in cron jobs, missing indexes, findMany without select) |
| Stripe + billing | 35+ | P0 (webhook 500-on-error, no event_id idempotency, partial-update silent failures, missing invoice.payment_failed handler) |
| AI provider robustness | 64 | P0 (deprecated gemini-1.5-flash hardcoded, JSON.parse without try/catch, response shape assumptions) |
| Mobile + content | 48 | P1 (number discrepancies "57 exams" vs "34+22=56", dynamic Tailwind class names broken, table overflow, color-only states) |
| Type safety / dead code | 100+ | P2 (53 `as any` casts, 73 eslint-disable comments, 16+ files >500 lines) |
| Race conditions | 41 | P1 (double-click submit, sessionStorage cross-tab desync, upsert without P2002 catch) |
| Email + cron + admin hygiene | 60+ | P0 (test endpoints accessible in production, hardcoded test credentials, bulk delete without transaction or confirmation) |
| **TOTAL RAW** | **~500** | — |

After dedup + false-positive dismissal: estimate **~120 distinct user-impact defects** (~30% of raw, similar ratio to StudentNest).

---

## 🔴 P0 — Real users hit these today

### Stripe / Billing (revenue-impact)
| File:line | Bug |
|---|---|
| `src/app/api/webhooks/stripe/route.ts:227` | Returns 500 on handler exceptions → Stripe stops retrying → silent revenue loss (same pattern fixed in StudentNest Beta 7.3) |
| `src/app/api/webhooks/stripe/route.ts:131,168,196` | `.catch()` silently swallows DB errors during ModuleSubscription upsert — webhook returns 200 even if module sub creation fails. Payment recorded in Stripe but DB inconsistent. |
| `src/app/api/webhooks/stripe/route.ts:80,115` | Orphan creation: userId from client_reference_id only. If empty/malformed, userId becomes undefined but upsert still runs silently → ModuleSubscription with null userId |
| `src/app/api/webhooks/stripe/route.ts:211-215` | `invoice.payment_failed` is a stub — only logs. No grace period, no past-due flip, no user notification. Stripe retries 3x then auto-cancels silently. |
| `src/app/api/billing/cancel/route.ts:74-76` | Stripe.subscriptions.update succeeds, then DB update fails (network) — Stripe shows "canceling" but DB shows "active". Same pattern fixed in StudentNest Beta 7.8. |
| `src/app/api/webhooks/stripe/route.ts:73-227` | No event_id idempotency — duplicate webhook delivery (network retry) creates double-records or double-charges |

### AI provider (user-facing freeze)
| File:line | Bug |
|---|---|
| `lib/ai-providers.ts:343` | `JSON.parse(credsJson)` on env var without try-catch — crashes if env malformed |
| `lib/ai-providers.ts:512-514` | Pollinations.ai response may contain "Bad Gateway" HTML — string.includes() check is too late, content-type not validated |
| `app/api/ai/status/route.ts:13` | Hardcoded `gemini-1.5-flash` — same model removed from v1beta that broke StudentNest extraction. Will break PrepLion AI when API rotates. |
| `lib/ai.ts:1029` | `JSON.parse(followUpMatch[1])` without try-catch — malformed AI output crashes endpoint |

### Test endpoints in production (security)
| File:line | Bug |
|---|---|
| `src/app/api/test/auth/route.ts:19` | `functional-test-runner@test.preplion.ai` test user CAN be created in production if CRON_SECRET valid. No NODE_ENV guard. |
| `src/app/api/test/auth/route.ts:20` | TEST_EMAIL + TEST_PASSWORD hardcoded in source — credential leak if repo browsed |
| `src/app/api/test/practice-check/route.ts:16-22` | Accessible in production with CRON_SECRET; reveals DB schema |

### Admin destructive actions (data-loss)
| File:line | Bug |
|---|---|
| `src/app/api/admin/reset-test-users/route.ts:93-135` | Deletes 17 Prisma deleteMany operations sequentially — NO transaction. One failure mid-loop = partial data loss with no rollback. |
| `src/app/api/admin/reset-test-users/route.ts:101-116` | No confirmation prompt — admin click can delete user data permanently |
| `src/app/api/admin/questions/route.ts:92` | `DELETE` action via PATCH `reject` deletes question permanently — no soft-delete, no audit, no restore |

### Cold-start 5xx (same as StudentNest pre-7.2)
| File:line | Bug |
|---|---|
| `app/api/dashboard/route.ts:170` | `console.error` only — no Sentry; cold-start failures silently swallowed, returns null data |
| `app/api/billing/portal/route.ts:45` | `process.env.NEXTAUTH_URL` no null check; falls to "http://localhost:3000" in production if env unset |
| `app/api/readiness/save/route.ts:16` | `req.json().catch(() => null)` silently returns null body — route accepts empty POST as valid |
| `app/api/diagnostic/route.ts:17` | `await req.json()` without try-catch — malformed JSON crashes endpoint |

### Mock-exam state loss (P0 user-facing — same as StudentNest pre-7.7)
| File:line | Bug |
|---|---|
| `(dashboard)/mock-exam/page.tsx:137-145` | `hasAutosave` checks timestamp but NO storage event listener — multi-tab resume loads stale data. Browser refresh during exam may lose answers (verify) |

---

## 🟠 P1 — Conversion blockers / high-impact

### Content honesty (10 distinct number/claim discrepancies)
- `src/app/page.tsx:138` — claims "57 exams" but 34 CLEP + 22 DSST = 56 (Accuplacer makes 57 but unclear)
- `src/app/page.tsx:288` — "34 exams available" conflicts with later "34 CLEP + 22 DSST"
- `src/app/(marketing)/clep-prep/page.tsx:479` — Pricing card says "All 56 CLEP + DSST exams" but math is 34+22=56 (correct, but inconsistent with "57 total" elsewhere)
- `src/app/(marketing)/about/page.tsx:441` — "30,500+ AI-Reviewed Questions" conflicts with `src/app/page.tsx:145` "28,000+ practice questions"
- `src/components/landing/faq.tsx` — claims "Unlimited MCQ" in Free tier but pricing page says "practice locked" (same pattern as StudentNest's "Unlimited" vs "3 sessions/day" before fix)
- `src/app/(marketing)/clep-prep/page.tsx:332` — "Sage explains every answer using free resources — OpenStax, Khan Academy, LibreTexts" but doesn't explain HOW Sage accesses these
- `src/app/(marketing)/pricing/page.tsx:35` — "Essay and free-response scoring" claimed for Pass Plan but **CLEP exams are 100% multiple-choice per CEEB specs** — factually wrong claim

### Mobile/responsive (Tailwind dynamic class issue critical)
- `src/components/landing/interactive-demo.tsx:92` — `text-${accentColor}-500` dynamic Tailwind class — **Tailwind purge eats these** → colors don't render on production. Same exact pattern flagged in StudentNest.
- `src/app/page.tsx:238` — "Why PrepLion?" table has no `overflow-x-auto` on mobile → cut-off columns
- `src/app/(dashboard)/dashboard/page.tsx:173` — Mobile header hidden in exam mode but no replacement nav → users can't navigate back

### Race conditions (data integrity)
- `src/app/(dashboard)/onboarding/page.tsx:103-119` — `chooseAccuplacerPath()` doesn't disable button during async → fast double-click creates 2 checkout requests
- `src/app/(dashboard)/diagnostic/page.tsx:143-191` — `startDiagnostic()` doesn't check in-flight → fast double-click creates 2 diagnostic sessions
- `src/app/api/webhooks/stripe/route.ts:125-132` — Loop updates clep + dsst ModuleSubscription; if clep succeeds and dsst fails, user has half-access, no reconcile path
- `src/app/api/practice/route.ts:701-704` — MCQ correctAnswer update is fire-and-forget; if next question fetched before update completes, stale answer used → WRONG ANSWER MARKED CORRECT (or vice versa)

### Performance (cost + latency)
- `src/lib/auto-populate.ts:265` — `prisma.question.count()` per-question inside loop → N+1 (likely 200+ queries per run)
- `src/app/api/diagnostic/route.ts:88-95` — `prisma.question.findMany()` per unit instead of single batch → N+1 across 5 units = 5 round-trips
- `src/app/api/cron/trial-reengagement/route.ts:170` — `prisma.trialReengagement.findMany()` per user inside loop → N+1
- Missing indexes on `Question(course, unit)`, `AiUsage(provider)`, `ContentSource(source)`, `User(onboardingCompletedAt)`, etc.

### A11y (legal + UX)
- `lib/email.ts:10` — Unsubscribe link uses `mailto:contact@preplion.ai` instead of one-click HTTP → CAN-SPAM compliance gap (same as StudentNest pre-7.4)
- `src/app/api/cron/daily-quiz/route.ts:111` — "Turn off daily emails" link → /billing, not dedicated unsubscribe → CAN-SPAM gap
- 7 modal components without focus trap (`welcome-modal.tsx`, `dialog.tsx`, `report-question-modal.tsx`, etc.)
- Multiple `<Progress>` components without aria-label (same as StudentNest pre-7.5)
- Multiple `<SelectTrigger>` without aria-label (same as StudentNest pre-7.8)

---

## ⚪ P2/P3 — Tech debt + polish

### Type safety (similar to StudentNest)
- 53 `as any` / `as unknown as` casts across codebase
- 27 `: any` type annotations
- 73 `eslint-disable` comments (mostly react-hooks/exhaustive-deps)
- Files >500 lines needing refactor:
  - `src/lib/courses.ts` — 4176 lines (StudentNest equivalent: 6201 lines)
  - `src/app/(dashboard)/practice/page.tsx` — 2097 lines
  - `src/app/(dashboard)/mock-exam/page.tsx` — 1335 lines
  - `src/app/(dashboard)/diagnostic/page.tsx` — 1111 lines
  - `src/lib/ai.ts` — 1097 lines
  - `src/lib/exam-blueprints.ts` — 947 lines

### Magic numbers
- 13 hardcoded timeout values (1000ms, 2000ms, 8000ms, 10000ms, 25000ms, etc.)
- AI budget caps hardcoded in `cron/ai-budget-alert/route.ts`
- Date math `1000 * 60 * 60 * 24` repeated 5+ times instead of `MS_PER_DAY` constant

### Email hygiene
- 4 instances of `firstName` without null fallback → renders "Welcome, null!"
- All emails missing List-Unsubscribe header (RFC 8058)
- Email open tracking missing on all bulk sends (no metric on CTR/open rate)

---

## Methodology notes

**False positive rate (estimated):** Same as StudentNest scan — agents flag ~30-40% false positives, especially on:
- "SQL injection" claims (parameterized queries already safe)
- "XSS" claims (React text-node auto-escape)
- "IDOR" claims (sessionId/userId already gated upstream)
- "Race condition" claims where button-disable is in a parent component

Real defect count after dismissal: **~120 distinct user-impact items** (vs. ~500 raw findings).

---

## Same-pattern matching with StudentNest

Many of these are direct copies of bugs StudentNest already fixed. Applying the StudentNest fix pattern (commits in studentnest repo) would close most:

| StudentNest fix → applies to PrepLion as |
|---|
| Beta 7.2 cold-start safe-fallback → `app/api/dashboard/route.ts`, `billing/portal/route.ts`, `readiness/save/route.ts` |
| Beta 7.3 webhook 500-on-error → `app/api/webhooks/stripe/route.ts:227` |
| Beta 7.3 invoice.payment_failed → `app/api/webhooks/stripe/route.ts:211-215` |
| Beta 7.3 AI streaming timeout → `app/api/ai/tutor/stream/route.ts` |
| Beta 7.4 List-Unsubscribe header → `lib/email.ts` |
| Beta 7.5 Progress aria-label batch → all 7 Progress instances |
| Beta 7.6 Sage Coach DB executeRawUnsafe → check if PrepLion has same hang |
| Beta 7.7 Mock-exam sessionStorage → `mock-exam/page.tsx:137-145` |
| Beta 7.8 SelectTrigger aria-label + Stripe cancel error handling → multiple |
| Beta 7.8 text-blue-500 dual-mode contrast → multiple |

**If user wants:** I can produce a port-script that takes the StudentNest fixes and applies the equivalent patches to PrepLion. ~3-4 hours of agent work, would close ~60% of the defects above without re-thinking the fix logic.

---

## File on disk

This doc lives at `C:/Users/akkil/project/AP_Help/docs/bug-hunt-preplion-2026-04-25.md` (StudentNest's docs/ dir for archival). Survives crashes.

**No actions taken on PrepLion repo.** Pure record per user instruction.
