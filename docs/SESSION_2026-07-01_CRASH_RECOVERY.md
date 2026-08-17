# Session crash-recovery — 2026-06-30 → 2026-07-01 (PrepLion + Codex)

**Read first when resuming.** Full state: what shipped, what's pending, the pipelines,
and the Claude⇄Codex plan. Companion docs: `TEAS_HOTSPOT_SHIPPED_2026-06-30.md`,
`ONBOARDING_REDESIGN_2026-07-01.md`, `QA_BRIDGE.md`.

Current prod = **A30.89** (funnel-integrity fix + Codex's keyed dedup). Pre-release
gate 22/22 green. All items below are LIVE on preplion.ai unless marked.

---
## ✅ COMPLETED THIS SESSION (all live)

### TEAS HOTSPOT (click-a-diagram question type) — full build
- **Primitive (A30.83→.85):** pure hit-test lib `src/lib/hotspot-grade.ts` (15 tests) +
  `HOTSPOT` QuestionType (Neon enum pushed) + renderer
  `src/components/practice/hotspot-question.tsx` + practice-page render branch + serve-path
  inclusion + deterministic-gate branch (9 tests). An independent REV + a prod pin E2E caught
  the CRITICAL bug: the THREE `runDeterministicGates` call sites array-stripped `options` +
  omitted `stimulusImageUrl`, so the serve path would auto-UNAPPROVE every HOTSPOT. Fixed
  (`QuestionCandidate.options` → `unknown`; all sites pass raw fields). Server grading unchanged
  (else-branch label match; correctAnswer = region label).
- **P1 content (76 approved Qs, 15 body systems):** neuron, heart, respiratory, digestive,
  skeletal, brain, endocrine, cell, urinary, muscular, female-repro, eye, ear, skin, male-repro.
  **Self-authored SVG** (regions coord-derived from the same pixels = exact by construction),
  embedded base64-SVG data-URIs, functional/ID prompts. Content-only (NO deploy — served by
  live code). Generators: `scripts/_populate-teas-hotspot-b{1..4}.mjs`.

### Onboarding redesign (A30.87 + A30.88) — user's flow simplification
Target: **register (captures exam) → ONE Focus/Regular choice (Focus default) → dashboard.**
- SAT/ACT/TEAS skip the course pick (single-primary-course → track default); CLEP picks at
  registration (carried `?course=`, never asked twice). Warm-up/diagnostic removed from onboarding.
- New `src/components/journey/step-mode-choice.tsx`. Journey rewired (modeChoice mode,
  handleStart→modeChoice→handleModeChosen, auto-skip for SINGLE_COURSE_TRACKS, TEAS(nursing)
  now uses the unified journey not `/onboarding`). Register routes to `/journey` for BOTH
  credentials (`?course=`) and **Google** (`?track=X&course=Y`, journey persists track via
  `PATCH /api/user` + JWT refresh). Removed the redundant per-session practice "Flexible/Focused"
  selector. useSearchParams wrapped in `<Suspense>`. Independent REV caught the signup-bypass
  + dual-TEAS-onboarding + stuck-button — all fixed.

### Admin + in-product (A30.86)
- **Test-user controls** at `/admin/manage?tab=test-users`: per-account track selector
  (CLEP/SAT/ACT/TEAS) + New/Returning toggle. API: `/api/admin/reset-test-users` PATCH extended.
  Reusable `scripts/reset-test-user.mjs`. Re-login required (JWT) after change.
- **Sidebar cheat-sheet link** (course-aware, shows when the course has a cheat sheet).
- Miss Deck card moved up on dashboard (A30.82).

### Value-dashboard audit + funnel fix (A30.89)
- Independently verified `/admin?tab=value`: **top-line ACCURATE** (cohort 75, activated 50/67%
  matched raw DB). **First-Question Funnel had a real bug** (submitted 9 > viewed 8 — impossible):
  `first_question_rendered` fired on a narrower `mode==="practicing"` gate than the submit events.
  Fixed (aligned to `logOpeningQuestionEvent` gate). Codex then added keyed
  `eventName:sessionId:questionId` dedup on all 5 events + non-MCQ fallback (`62af20c`).
  **Only post-2026-07-01 funnel_events rows are valid** (old rows contaminated); needs ~1 week
  of real traffic to be meaningful.

### Research + intel (saved to docs/memory)
- **TEAS gap analysis** (vs ATI official + Mometrix/NurseHub/etc.) and **ACT gap analysis**
  (vs ACT.org + 2025 Enhanced ACT). See "PENDING" for the actionable gaps.
- Reddit signals recorded: Macro CLEP "is it math-heavy" + readiness (Peterson's scores);
  Justin's Social Sciences pass report.

### Codex-side (his lanes, live)
- **Cheat-sheet discoverability** (resolved the "not visible" issue): `/clep-study-guide` hub +
  homepage/header/footer links + `/clep-prep/[slug]/cheat-sheet` 307 redirect. Macro cheat-sheet built.
- **First-question funnel instrumentation**: durable `funnel_events` table + `/api/events` persist +
  **First-Question Funnel panel** in `/admin?tab=value`.
- **Value dashboard** (`/admin?tab=value`, Prep Value Loop).
- **Release-green process**: `scripts/pre-release-check.js` (22 checks, uses APP_VERSION, narrow
  StudentNest-banner allowlist), A30.89 QA-walk + manifest + D48 defect ledger.

---
## ⬜ PENDING / FOLLOW-UPS

**User-blocked (only the user can do):**
- **Walk the onboarding flow** with a test login (Prisma-WASM blocks authed walk locally — this is
  the real verification). Test matrix: credentials `pass2`(SAT)/`fast2`(ACT)/`free`(CLEP); Google
  from `/register?track=sat`; TEAS via admin control. Re-login after any track/state change.
- **Watch `/admin?tab=value`** first-question funnel after ~1 week of clean post-fix traffic.

**TEAS fidelity (from the gap analysis) — biggest gaps:**
- **CRITICAL: fill-in-the-blank / numeric-entry** item type = 0 today (a core TEAS-7 alternate type,
  primary in Math). Build the primitive (like HOTSPOT).
- **HIGH: multiple-select (SATA)** = only 1 today; needed across all sections.
- Math-vs-Science rebalance (bank over-indexes Science 37% vs real 29%; Math thin 18% vs 22%).
- Verify A&P per-body-system balance; Biology must-haves (Mendel, macromolecules); Chem acids/bases.

**ACT fidelity (from the gap analysis):**
- Re-profile ACT_SCIENCE (2,066) for passage-density (was 8% passage vs real ~100%); English
  "NO CHANGE" in-passage format; Math missing logarithms + thin conics; rebalance toward
  composite drivers (English/Math/Reading) since Enhanced-ACT Science is optional.

**Backlog / other:**
- Lifecycle emails: confirm they fire for 0-answer + 1-answer bounces (Rifah/Sophie pattern).
- Macro cheat-sheet (Codex's lane — flagged, building).
- Value dashboard definitional cleanup (Codex's lane): "More Ready" tier includes D1-return
  (overlap) and is driven by "70% on some practice" (engagement ≠ readiness) — relabel/raise bar.
- TEAS HOTSPOT optional systems: nephron detail, lymphatic/immune, blood-flow, heart valves.
- If APP_VERSION bumps again, Codex refreshes the release manifest (his lane).

---
## 🔧 PIPELINES (repeatable processes)

**Deploy (CF Pages):** STOP dev server first (Windows/OpenNext ENOENT `500.html` race) →
`npm run pages:build` → `npx wrangler pages deploy .cf-deploy --project-name=preplion
--branch=master --commit-dirty=true` → smoke test (`curl -o /dev/null -w %{http_code}`). Version
in `src/lib/version.ts` (Edit tool, not PowerShell — em-dash mangling).

**HOTSPOT content:** author SVG + pixel regions (derive normalized regions from same coords) →
seed `isApproved=false` → overlay-raster visual check (`sharp`, box-on-structure) → independent
anatomy REV (subagent) → fix → flip `isApproved=true` → **prod-pin verify** via
`POST /api/test/practice-session` (CRON_SECRET). No deploy (content-only).

**Release-green:** `node scripts/pre-release-check.js` (22 checks). Needs fresh QA-walk + manifest
+ independent-agent transcript postdating src (Codex's process).

**Funnel:** `funnel_events` table; `/api/events` persists (keyed dedup); panel `/admin?tab=value`.
Only post-fix rows valid.

**Neon queries:** `neon()` from `@neondatabase/serverless`, `node --env-file=.env`. NO
transactions (single create/update or `$executeRawUnsafe`). `sql.unsafe`/`sql.query` NOT available
— use tagged templates; avoid complex Postgres regex (use `NOT ILIKE`). Tables: `users`,
`practice_sessions` (startedAt/status/completedAt), `student_responses` (userId/isCorrect/answeredAt),
`questions`, `session_questions`, `funnel_events`. Users cols: track, freeTrialCourse,
subscriptionTier, onboardingCompletedAt (null=not onboarded), createdAt. NO `name`/`onboardingCompleted`.

---
## 🤝 CLAUDE ⇄ CODEX PLAN (lanes + coordination)

- **Codex lane:** public/SEO pages + marketing nav (`/clep-study-guide`, `/clep-prep`, homepage,
  header/footer, cheat-sheet system) + the value dashboard + the release process (pre-release-check,
  manifest, QA-walk).
- **Claude lane:** in-product behavior (onboarding/journey, practice page, sidebar, admin controls,
  TEAS HOTSPOT, question gates).
- **Shared working tree** (same repo/branch). Coordinate via `docs/QA_BRIDGE.md`. Commit narrowly
  (only your files) to avoid pulling each other's dirty WIP. Whoever deploys builds the full tree
  (superset) — HEAD is authoritative; sequential commits from both are fine (git interleaves).
- **BIQ discipline:** independent REV (adversarial agent) + verification before "done"; the
  pre-release-check now accepts Codex-subagent transcripts in the independent-review gate.

---
## KEY GOTCHAS
- **Prisma-WASM dev runtime is broken locally** → every DB route 500s in `npm run dev`; cannot walk
  authed flows locally. Verify on prod (CF Workers loads WASM fine).
- Test accounts: `murprasad+free@`(clep) / `+pass2@`(sat) / `+fast2@`(act); passwords `Test{Slot}@329`.
  **Re-login required** after a DB track/onboarding change (JWT carries it).
- `--commit-dirty=true` on deploy; the tree usually has Codex's other-lane dirty files (leave them).
