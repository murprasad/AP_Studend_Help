# CLAUDE.md — StudentNest Project Guide

This file is the single source of truth for AI-assisted development on this codebase.
Read it before making any changes.

---

## Project Overview

**StudentNest** is a full-stack AP exam preparation platform.
Students practice MCQs, take timed mock exams, track mastery by unit, get AI tutoring,
and receive personalized study plans.

- **Production URL**: https://studentnest.ai (Cloudflare Pages)
- **Dev URL**: http://localhost:3000

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | PostgreSQL via Neon serverless (HTTP transport) |
| ORM | Prisma 6 (WASM client + Neon HTTP adapter) |
| Auth | NextAuth v4 — JWT strategy (no DB sessions) |
| AI | Groq (llama-3.3-70b-versatile) — primary; Pollinations free fallback |
| Styling | Tailwind CSS (dark theme) + Radix UI + shadcn/ui |
| Charts | Recharts |
| Markdown | react-markdown + remark-gfm |
| Deployment | Cloudflare Pages + Workers (via OpenNext) |

---

## Repository Layout

```
src/
  app/
    (auth)/           # login, register, verify-email
    (dashboard)/      # all protected pages (layout has sidebar)
      practice/       # MCQ practice engine
      mock-exam/      # Timed full-length mock exam
      analytics/      # Progress charts and mastery heatmap
      ai-tutor/       # Chat interface — Groq-powered
      study-plan/     # AI-generated weekly study plan
      admin/          # Admin dashboard (ADMIN role only)
    api/
      auth/           # NextAuth + register + verify-email
      practice/       # POST=create session, GET=list sessions
      practice/[id]/  # POST=submit answer, PATCH=complete session
      ai/tutor/       # POST=chat, GET=conversation history
      ai/bulk-generate/ # Admin: batch question generation
      analytics/      # GET all analytics for current user
      study-plan/     # GET/POST study plan
      user/           # GET current user profile
  lib/
    prisma.ts         # WASM Prisma singleton (Neon HTTP adapter)
    auth.ts           # NextAuth config (JWT, credentials provider)
    ai.ts             # askTutor, generateQuestion, generateStudyPlan
    ai-providers.ts   # Multi-provider cascade (Groq → Pollinations)
    courses.ts        # COURSE_REGISTRY — single source of truth for all courses
    utils.ts          # Derived helpers (COURSE_UNITS, AP_COURSES, etc.)
    edu-apis.ts       # Free edu API wrappers (Wikipedia, LoC, Stack Exchange)
  hooks/
    use-course.ts     # Course selection (localStorage + cookie)
    use-toast.ts      # Toast notifications
  components/ui/      # shadcn/ui components
prisma/
  schema.prisma       # Database schema
  seed.ts             # 24 sample questions + 12 achievements
scripts/
  patch-prisma-wasm.js   # Patches Prisma for CF Workers + Node.js dual compat
  prepare-cf-deploy.js   # Assembles .cf-deploy/ for wrangler upload
```

---

## Architecture Decisions

### 1. Single Source of Truth: `src/lib/courses.ts`

`COURSE_REGISTRY` is the one place to add a course. Every consumer
(sidebar, API validators, AI prompts, mock-exam timing, unit lookups) derives from it.

**To add a course:**
1. Add enum values to `ApCourse` and `ApUnit` in `prisma/schema.prisma`
2. Run `npx prisma migrate dev`
3. Add one `CourseConfig` block in `COURSE_REGISTRY` in `src/lib/courses.ts`
4. Optionally add seed questions to `prisma/seed.ts`
5. Nothing else — sidebar, API, AI all update automatically

### 2. Prisma WASM + Neon HTTP Adapter

The app uses `@prisma/client/wasm` with `PrismaNeonHTTP` to work on both
Node.js (local dev) and Cloudflare Workers (production).

**Critical constraint**: The Neon HTTP adapter does **NOT support transactions**.
This means:
- ❌ Nested Prisma writes (e.g. `create: { questions: { create: [...] } }`)
- ❌ `prisma.$transaction([...])`
- ✅ Single `create`, `update`, `delete`, `upsert`, `findMany`, etc.
- ✅ `prisma.$executeRawUnsafe(sql, ...params)` for multi-row inserts

**Pattern for bulk inserts** (e.g. session questions):
```typescript
const placeholders = items.map((_, i) => {
  const b = i * 4;
  return `($${b+1}, $${b+2}, $${b+3}, $${b+4})`;
}).join(", ");
await prisma.$executeRawUnsafe(
  `INSERT INTO table_name (id, "colA", "colB", "colC") VALUES ${placeholders}`,
  ...items.flatMap((item, i) => [crypto.randomUUID(), item.a, item.b, i])
);
```

**Column names**: The Prisma migration used Prisma's default casing — columns are
**camelCase** in Postgres (e.g. `"sessionId"`, `"questionId"`). Always quote them in raw SQL.

### 3. AI Provider Cascade

`src/lib/ai-providers.ts` tries providers in order, skipping any without a configured key:

1. **Gemini** (GOOGLE_AI_API_KEY) — free, 1500 req/day
2. **Groq** (GROQ_API_KEY) — free, fast (~1s), llama-3.3-70b — **current primary**
3. Together.ai, OpenRouter, HuggingFace, Cohere, Vertex AI, Ollama
4. **Pollinations-Free** — always available, no key needed (GPT-4o-mini quality)
5. Anthropic (ANTHROPIC_API_KEY) — paid, last resort

**Groq uses plain `fetch`** (not the SDK) for Cloudflare Workers compatibility.
Always use `AbortSignal.timeout(25000)` on provider fetch calls.

### 4. AI Tutor Design

`askTutor()` in `src/lib/ai.ts`:
- Runs educational enrichment (Wikipedia, Stack Exchange, Reddit) with a **2.5s hard cap**
  via `Promise.race(enrichmentPromise, setTimeout(2500))`. Never blocks the AI call.
- Returns `{ answer: string, followUps: string[] }` — the AI includes 3 follow-up questions
  at the end of its response in a `FOLLOW_UPS: [...]` block which gets parsed and stripped.
- The API route (`/api/ai/tutor`) forwards `followUps` to the client.
- The UI renders the follow-ups as clickable chips below the last assistant message.

### 5. NextAuth JWT Sessions + Google OAuth

JWT strategy — sessions are stored in cookies, not the database.
`session.user.id` comes from `token.id` set in the `jwt` callback.
The `Session` table in Prisma is unused (JWT doesn't write to it).

Email verification is **auto-bypassed** in development when `EMAIL_SERVER_USER` is unset.

**Google OAuth (added Beta 1.22):**
- Added `GoogleProvider` alongside `CredentialsProvider` — no PrismaAdapter needed.
- `signIn` callback handles Google sign-ins manually: finds or creates DB user, auto-sets `emailVerified`.
- `jwt` callback detects `account.provider === "google"` and looks up DB user by email to set `token.id`.
- `User.passwordHash` is now `String?` (nullable) — Google users have no password.
- Credentials authorize checks `if (!user.passwordHash)` and returns a helpful error.
- **Required env vars**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Google Cloud Console**: Authorized redirect URI must include `https://studentnest.ai/api/auth/callback/google`

### 6. Course State

Selected course is stored in `localStorage` and a cookie (`ap_selected_course`).
The cookie is read by server components; `localStorage` by client components.
Hook: `src/hooks/use-course.ts`.

### 7. Practice Session — Avoid-Repeats + On-Demand AI Generation

`POST /api/practice` (`src/app/api/practice/route.ts`) uses a two-stage pool system
to avoid showing students questions they have already answered correctly:

**Stage 1 — Build fresh pool:**
1. Fetch all approved questions matching the requested `course`, `unit`, `difficulty`, and `questionType`.
2. Query `StudentResponse` to get the set of `questionId`s this user has already answered **correctly** (`correctlyAnsweredIds`).
3. Split into `freshQuestions` (not yet answered correctly) and `seenCorrectQuestions`.

**Stage 2 — On-demand AI generation (when `ai_generation_enabled = true`):**
- Triggers only when `freshQuestions.length < questionCount` (not total bank size).
- Generates at most `MAX_GEN_PER_REQUEST = 5` questions in parallel per request.
- Uses `Promise.allSettled` so partial failures are tolerated — any generated questions are saved to the DB and added to `freshQuestions`.
- Uses weak-topic targeting: mastery scores < 70% → pick the weakest `keyTheme` from `COURSE_REGISTRY` for that unit to guide generation.
- Returns `aiGenerationWarning` to the client describing how many questions were generated.

**Stage 3 — Scoring + fallback:**
- `freshQuestions` get a random priority score + 3 (high priority).
- `seenCorrectQuestions` get a random priority score + 1 (fallback only — used only if `freshQuestions.length < questionCount` after generation).
- The top `questionCount` items from the sorted pool are selected.
- A `lowBankWarning` is returned if the fresh pool is less than `2 × questionCount` (after AI gen).

**Important:** If the bank is completely empty **and** AI generation fails, the route returns
`400 "No questions available"` rather than an empty session.

### 8. Two-Tier AI Question Generation (v1.6)

`generateQuestion()` in `src/lib/ai.ts` accepts a `userTier: "FREE" | "PREMIUM"` param
(default "FREE") and uses `callAIForTier()` from `src/lib/ai-providers.ts` instead of the
generic cascade.

**FREE pool:** Groq → Together.ai → HuggingFace → Pollinations-Free
**PREMIUM pool:** Gemini → OpenRouter-Premium (GPT-4o) → Anthropic → Groq → Together.ai → Pollinations-Free

Every generated question passes `validateQuestion()` (Groq, 10 s, Pollinations fallback).
If validation fails, retries up to 3 times (`MAX_GEN_ATTEMPTS = 3`). Validator fails open
(returns `approved: true`) if the validator itself errors, to prevent blocking question generation.

New Question columns: `modelUsed String?`, `generatedForTier SubTier @default(FREE)`.

**Note:** `premium_feature_restriction` feature flag defaults to `"false"` — all users
receive full platform access unless explicitly enabled by admin.

### 9. Question Quality, Dedup & Growth Strategy (Beta 1.2)

**Content-hash deduplication:**
- `generateQuestion()` computes SHA-256 of `questionText.toLowerCase().replace(/\s+/g," ").trim()`
- Hash stored in `Question.contentHash` (`@unique`)
- All three save paths (practice, populate, mega-populate) catch `P2002` (unique constraint violation) and skip silently — no 500 errors

**Topic saturation guard (`MAX_PER_TOPIC = 8`):**
- Before generating, `generateQuestion()` counts existing questions for the requested `topic`
- If count ≥ 8, rotates to the first `keyTheme` in `COURSE_REGISTRY` that doesn't match the saturated topic

**5-criterion validator (in `validateQuestion()`):**
1. Factual accuracy
2. Single unambiguous answer
3. Distractor quality
4. Cognitive level
5. Exam alignment

**apSkill tagging:**
- AI prompt includes `apSkill` in the JSON response format (e.g. "Causation", "Data Analysis")
- Stored in `Question.apSkill String?`

**longestStreak tracking:**
- `updateUserProgress()` in `practice/[sessionId]/route.ts` now sets `longestStreak = Math.max(newStreak, user.longestStreak ?? 0)`
- `User.longestStreak Int @default(0)` column added to schema

**Admin Topic Coverage panel:**
- `/admin` page runs `prisma.question.groupBy({ by: ["unit","topic"] })` sorted by count ASC
- Color coding: red < 3, yellow 3–7, green ≥ 8 questions per topic

### 10. CF Workers Banned Imports (enforced by `scripts/check-cf-compat.js`)

Never import these packages in any file under `src/` — they use Node.js HTTP clients
that are **not** supported by Cloudflare Workers (`nodejs_compat_v2`):

| Banned package | Why |
|----------------|-----|
| `groq-sdk` | Internal HTTP client uses Node net APIs |
| `@anthropic-ai/sdk` | Same issue |
| `@huggingface/inference` | Same issue |
| `cohere-ai` | Same issue |

**Always use plain `fetch` with `AbortSignal.timeout()`** for all AI provider calls.
The only edge-safe AI SDK is `@google/generative-ai` (uses fetch internally).

`scripts/check-cf-compat.js` is wired into `npm run pages:deploy` as a pre-build gate
and will block the deploy immediately if a banned import is detected.

---

## Commands

```bash
# Development
npm run dev                  # Next.js dev server on :3000

# Database
npx prisma generate          # Regenerate Prisma client after schema changes
npx prisma migrate dev       # Create and run a new migration
npx prisma db push           # Push schema without migration (dev only)
npx prisma db seed           # Seed 24 sample questions + achievements
npx prisma studio            # Open Prisma Studio GUI

# Build & deploy
npm run build                # Standard Next.js production build
npm run pages:build          # Cloudflare Pages build (OpenNext + patches)
npm run pages:deploy         # Build + deploy to studentnest Cloudflare Pages project
npm run pages:preview        # Build + run local CF Pages preview

# Install
npm install --legacy-peer-deps  # Use this flag — some deps have peer conflicts
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string (pooled) |
| `NEXTAUTH_SECRET` | ✅ | Random secret for JWT signing |
| `NEXTAUTH_URL` | ✅ | App base URL (http://localhost:3000 dev, https://studentnest.ai prod) |
| `GROQ_API_KEY` | ✅ | Primary AI provider (free at console.groq.com) |
| `ANTHROPIC_API_KEY` | Optional | Fallback AI (has billing issues — use Groq) |
| `GOOGLE_AI_API_KEY` | Optional | Gemini free tier (faster than Groq on cold start) |
| `EMAIL_SERVER_*` | Optional | SMTP for email verification (auto-bypassed in dev) |
| `NEXT_PUBLIC_APP_URL` | Optional | Used for OpenRouter referer header |

---

## Deployment (Cloudflare Pages)

```bash
npm run pages:deploy
```

This runs:
1. `npx prisma generate` — regenerate WASM client
2. `node scripts/patch-prisma-wasm.js` — patches WASM loader for dual Node/CF compat
3. `opennextjs-cloudflare build` — OpenNext CF build
4. `node scripts/prepare-cf-deploy.js` — assembles `.cf-deploy/` directory
5. `wrangler pages deploy .cf-deploy --project-name=studentnest` — uploads to CF

Cloudflare Pages project: `studentnest`
Custom domain: `https://studentnest.ai`
Wrangler config: `wrangler.toml`

**After code changes**: always run `npm run pages:deploy` to push to production.
**After schema changes**: update CF secret `DATABASE_URL` if the Neon DB was recreated,
then run `npx prisma migrate deploy` against the production DB.

---

## Known Issues & Solutions

| Issue | Cause | Fix |
|-------|-------|-----|
| "Transactions are not supported in HTTP mode" | Nested Prisma writes inside `practiceSession.create` | Use `$executeRawUnsafe` for bulk inserts (see Architecture §2) |
| AI tutor slow / "AI unavailable" | Enrichment fetches (Wikipedia etc.) block AI call on CF edge | 2.5s timeout cap in `askTutor` + Groq via plain fetch |
| Anthropic API credits | Billing issue, not code | Groq is primary — Anthropic is last resort in cascade |
| OpenNext Windows warning | OpenNext not fully tested on Windows | Use WSL for builds if hitting unexplained failures |
| SDK imports on CF Workers | groq-sdk, @anthropic-ai/sdk, etc. use Node.js HTTP clients incompatible with CF Workers | Never import AI SDKs in server code — use plain fetch. Run `scripts/check-cf-compat.js` before deploy |

---

## Release Checklist (run before EVERY deploy)

**Automated — enforced by `npm run release:check` (runs automatically inside `pages:deploy`):**
- `npx tsc --noEmit` passes
- `node scripts/check-cf-compat.js` passes (no banned SDK imports)
- All key files contain `9.99`, `79.99`, `33%` where expected
- 7-day refund policy present in `/pricing` FAQ and `/terms`
- Sparkles + `gradient-text` + "Nest" present in all 5 layout/logo files
- `/terms` link present in marketing footer

**Manual — verify before committing:**
- [ ] Pricing change? Update ALL of: `src/app/page.tsx` (hero + card + footer CTA), `/pricing`, `/billing`, `/about`, `/terms`
- [ ] New feature? Add user-facing description to About page Beta X.Y section (no file paths or internal details)
- [ ] New Beta version? Bump `package.json` version field to match
- [ ] Update `CLAUDE.md` Release History section with new Beta version
- [ ] Git tag: `git tag -a beta-X.Y -m "Beta X.Y"` then `git push origin beta-X.Y`

**Deploy command (runs all automated checks first):**
```bash
npm run release:check   # run checks only (fast, no build)
npm run pages:deploy    # checks + build + deploy to CF Pages
```

---

## Adding Features: Checklist

**New API route:**
- [ ] Auth check: `const session = await getServerSession(authOptions); if (!session) return 401`
- [ ] No nested Prisma writes (use `$executeRawUnsafe` for multi-row inserts)
- [ ] `export const dynamic = "force-dynamic"` if the route reads from DB

**New course:**
- [ ] Add enum to `prisma/schema.prisma` (ApCourse + ApUnit values)
- [ ] `npx prisma migrate dev`
- [ ] Add `CourseConfig` to `COURSE_REGISTRY` in `src/lib/courses.ts`
- [ ] Done — everything else auto-updates

**New AI feature:**
- [ ] Use `callAIWithCascade` from `src/lib/ai-providers.ts`
- [ ] Cap any external enrichment fetches at 2-3s with `Promise.race`
- [ ] Handle the "All AI providers failed" error gracefully

---

## Release History

### Beta 2.1 (2026-03-21)
- **Per-Module Stripe Subscriptions**: Independent $9.99/mo or $79.99/yr subscriptions for AP, SAT, ACT, and CLEP modules. Each module has its own Stripe price ID, payment link, checkout flow, and webhook handling. `ModuleSubscription` table tracks per-module status.
- **Module-Locked Sidebar**: Sidebar now filters courses strictly by user's module (ap/sat/act/clep). Users who sign up from `/ap-prep` see only AP courses. No "Browse all courses" escape hatch — clean, focused experience.
- **4-Value Track System**: Expanded `User.track` from 2 values (ap/clep) to 4 (ap/sat/act/clep). Register page, dashboard layout URL sync, and API all accept all 4 values. JWT refreshes track from DB on every request.
- **SEO Overhaul**: Schema.org JSON-LD on all 4 prep pages (Course ItemList) and pricing page (FAQPage). XML sitemap, robots.txt, OG image (SVG), per-page metadata exports. Privacy policy page added.
- **Content Optimization**: Outcome-driven hero copy, "How It Works" study flows on all prep pages, enriched testimonials with metrics, expanded "For Parents" sections, CLEP "What is CLEP?" explainer, comparison tables on pricing page.
- **Landing Page**: Merged duplicate feature sections, added urgency language ("in weeks, not months"), explicit ChatGPT differentiation, mobile sticky CTA, touch-friendly answer buttons (48px min), "Courses" nav anchor.
- **About Page**: Trimmed 6 old beta release notes to single summary. Added "Science Behind Sage" methodology section (active recall, spaced repetition, mastery-based progression, comprehension verification). Added "What Students Experience" outcomes grid.
- **Billing**: Per-module cancel/reactivate buttons. Cancel endpoint accepts `?module=` param. Reactivate (DELETE) endpoint accepts `?module=` param.
- **Daily Goals**: Customizable daily question target (5/10/15/20 per day, stored in localStorage).
- **Brand**: "StudentNest AI" branding consistency across all pages.
- **package.json**: Bumped to `2.1.0`.

### Beta 2.0 (2026-03-20)
- **Track-Based Segmentation**: Students now choose their learning path from the landing page — "Start AP/SAT/ACT Prep" (`?track=ap`) or "Start CLEP Prep" (`?track=clep`). Track persists via `localStorage["ap_track"]`.
- **Landing Page CTAs**: All 7 register CTAs updated with `?track=ap` or `?track=clep`. Hero, audience split cards, curriculum section, CLEP section, navbar, and final CTA all carry the correct track param.
- **Register Page**: Reads `?track` from URL on mount, persists to `localStorage["ap_track"]`. CardDescription dynamically reflects track: "Start earning college credit with CLEP — free" vs "Start your AP exam journey today — free".
- **Onboarding Segmentation**: Step 1 course list is dynamically filtered by track. CLEP-track + `clep_enabled=true` users see only 6 CLEP courses (emerald accent). AP-track users see 16 AP/SAT/ACT courses. Auto-selects first course in filtered list on track change.
- **Sidebar Segmentation**: Course switcher groups filtered by track. CLEP-track: shows only CLEP group with "CLEP Prep track" badge. AP-track: shows AP/SAT/ACT groups. Track switching is intentionally moved to the footer settings area ("Change track" button near Sign Out) — prevents accidental switching but preserves escape hatch.
- **Smart Course Default**: `use-course.ts` universal default is `AP_WORLD_HISTORY` (safe for all users regardless of track). Onboarding sets the correct CLEP course when `clep_enabled=true` + track=clep via `setCourse()`. Existing users (stored course) are unaffected.
- **Bug Fixes**: (B2-01) `localStorage` in `useState` initializer in sidebar throws on SSR → moved to `useEffect`. (B2-02) `activeGroup` not reset on track switch → empty dropdown fixed. (B2-03) Register CardDescription always showed "AP journey" regardless of track. (B2-04) Post-release: CLEP Algebra shown as default with no other CLEP courses visible — reverted track-based default; fixed by correct `effectiveTrack` gating.
- **package.json**: Bumped to `2.0.0`.

### Beta 1.15 (2026-03-20)
- **CLEP Course Support**: Added 6 CLEP (College-Level Examination Program) exams — College Algebra, College Composition, Intro Psychology, Principles of Marketing, Principles of Management, Introductory Sociology. Gated behind `clep_enabled` feature flag (default off, admin-togglable).
- **CLEP Schema**: Added 6 `ApCourse` enum values and 30 `ApUnit` enum values (5 units per course) to Prisma schema. Schema synced via `npx prisma db push`.
- **CLEP Course Registry**: Full `CourseConfig` blocks for all 6 CLEP courses in `COURSE_REGISTRY` — examSecsPerQuestion=72s, 5 units with keyThemes, OpenStax/Khan resources (all CC BY 4.0 / CC BY-SA), CLEP-specific AI prompts, ROI context ("Passing saves ~$1,200 in tuition").
- **Legal Safety**: All CLEP questions are AI-generated original content. Resources: OpenStax CC BY 4.0, Khan Academy, Wikipedia CC BY-SA. CLEP® trademark notices added to landing page, About page, and `courses.ts` comment block.
- **Landing Page — CLEP Section**: New emerald-accented section below AP/SAT/ACT area; "22 courses" badge; 6 CLEP exam cards with tuition-savings ROI; CLEP® trademark disclaimer. Hero and social proof updated.
- **Sidebar — CLEP Group**: Fourth course group "CLEP Prep" with emerald highlight, shown only when `clep_enabled=true`. `clep_enabled` flag piggybacked on existing `/api/user` response as `flags.clepEnabled`.
- **Pricing Page**: Premium tier updated to include "All 6 CLEP exam courses (earn college credit)". Free tier clarified as "All 16 AP/SAT/ACT courses".
- **About Page**: Updated to Beta 1.15 badge; 6 CLEP courses in "What We Cover" grid under new "CLEP (College Credit)" category (emerald accent); mission statement updated; legal disclaimer updated with CLEP® trademark notice.
- **Exam Countdown Bug Fix**: Resolved error shown on save due to CF Workers cold-start Prisma timeout — added fallback verification GET after non-ok PUT response; if date was actually saved, shows success rather than error. Moved `setEditing(false)` inside setTimeout so "Saved ✓" is visible before panel collapses.
- **Phase 2 Backlog**: `docs/phase-2-clep-backlog.md` — full Phase 2 multi-course dashboard spec (DB `selectedCourses`, `/api/user/courses` route, JWT update, onboarding overhaul, multi-course tab bar).
- **package.json**: Bumped to `1.15.0`.

### Beta 1.14 (2026-03-20)
- **Full Course Coverage**: Seeded all 4 previously empty courses (AP Statistics, AP Chemistry, AP US History, AP Psychology) to green status — no student will hit a 0-question course.
- **Sage for Every Answer**: Sage now appears after both correct and wrong answers. Students can ask for a deep explanation, then return to their exact practice session position via the "Continue Practice" banner.
- **count=1 Knowledge Check**: Wrong-answer inline quiz now generates 1 question (was 3) — ~10s faster, less interruption for students.
- **quickMode AI Generation**: On-demand question generation skips CB FRQ fetch and validation for the inline session path, cutting wait time from ~20s to ~5s per question.
- **Automated Release Pipeline**: `pages:deploy` now runs: pre-release-check → build → CF Pages deploy → smoke-tests → integration-tests → update-test-plan → archive-release. Fully automated, zero manual steps.
- **Integration Tests**: `/api/test/practice-check` (CRON_SECRET-gated) checks all 16 courses with a single `groupBy` query. Results written to test plan on every deploy.
- **package.json**: Bumped to `1.14.0`.

### Beta 1.13 (2026-03-20)
- **Premium Signup Notification**: `checkout.session.completed` Stripe webhook now sends an email to `contact@studentnest.ai` with the new member's name, email, and plan type (monthly/annual). Fire-and-forget — email failure never blocks the webhook response.
- **One-Time Seeding Workflow**: `.github/workflows/seed-question-bank.yml` — manual GitHub Actions workflow that loops up to 120 iterations × 8 questions to seed all ~109 units to green coverage. Stops early when all units are full.
- **Cron Timeout Fix**: Auto-populate cron capped at 5 questions per CF call (was unbounded → 524 timeout). GitHub Actions loops 6 batches per run. `?limit=N` query param allows override up to 20.
- **Dead Code Removal**: Deleted `netlify/functions/`, `netlify.toml`, and removed `@netlify/blobs`, `@netlify/functions`, `@netlify/plugin-nextjs`, `@anthropic-ai/sdk`, `@huggingface/inference`, `cohere-ai`, `groq-sdk` from `package.json`. Fixed `src/lib/backup.ts` to not import removed packages.
- **package.json**: Bumped to `1.13.0`.

### Beta 1.12 (2026-03-19)
- **Admin Stability Fix**: Wrapped `AdminMonitorTabs` and `AdminManageTabs` in `<Suspense>` boundaries — Next.js 14 requires this for any client component using `useSearchParams()` rendered by a server component page. Missing Suspense caused "Application error: a client-side exception" on `/admin` and `/admin/manage`.
- **package.json**: Bumped to `1.12.0`.

### Beta 1.11 (2026-03-19)
- **Admin Dashboard Redesign**: Split single scrolling admin page into two focused pages with URL-based tab state.
- **Monitor page** (`/admin`): Overview tab (4 stat cards + live infra metrics, auto-refresh 60s) and Users tab (recent sign-ups + session feedback). Read-only — no destructive actions.
- **Manage page** (`/admin/manage`): Question Bank tab (Auto-Populate Settings + Bulk Generate + Mega-Populate), Coverage tab (unit coverage + topic coverage grid), Config tab (Feature Flags + Payment Setup).
- **AdminPageNav**: Shared 2-button pill nav (`Monitor` / `Manage`) rendered at the top of both pages; highlights the active page.
- **URL tab state**: All tabs use `useSearchParams` + `router.push` so tabs survive refresh and are bookmarkable (e.g. `/admin?tab=users`, `/admin/manage?tab=coverage`).
- **package.json**: Bumped to `1.11.0`.

### Beta 1.5 (2026-03-18)
- **AI Knowledge Check**: Optional 3-MCQ comprehension quiz after each Sage response. Button "Check your understanding" appears below follow-up chips; never auto-triggers. Groq generates all 3 questions in one JSON call (~1s), Pollinations-Free fallback. Results saved to `TutorKnowledgeCheck` DB table (fire-and-forget submit).
- **Comprehension Analytics**: `GET /api/analytics` now returns `knowledgeCheckStats: { totalChecks, avgComprehension }`. Analytics page shows "Tutor Comprehension %" stat card once ≥1 check taken.
- **Disclaimer cleanup**: Removed 9px sidebar disclaimer (invisible in light mode, poor UX). Disclaimer now lives only on About page (full text, subtle footer style) and marketing layout footer (condensed). Legal evaluation: About + marketing footer is sufficient under US trademark law (Lanham Act).
- **Disclaimer restyling**: About page disclaimer changed from amber warning card → subtle `text-[11px] text-muted-foreground/70` footer section. Works correctly in both dark and light mode.
- **About page**: Added Beta 1.5 badge, feature overview grid, Release History section with all versions since Beta 1.3.
- **Marketing footer**: Added nav links (Contact · About · Pricing) above trademark text.
- **Bug fixes**: D1=race condition in KnowledgeCheck loading state (snapshot guard), D2=sidebar disclaimer invisible in light mode (removed), D3=About page showed wrong version badge.
- **QA test plan**: `qa_test_plan_beta15.md` — 31 test cases across Knowledge Check, Analytics, Disclaimer, and regression.

### Beta 1.3 (2026-03-18)
- **Landing page overhaul**: Reduced from 12 sections → 7 sections — removed Stats bar, Practice Modes, full inline Pricing section, About section from bottom
- **Nav update**: Replaced `Pricing → /#pricing` with `About → /about`; footer now links to `/about` and `/pricing` page
- **Pricing teaser**: Landing page final CTA now shows "Free forever · Premium at $9.99/month · See full pricing →" instead of full duplicate pricing cards
- **Google OAuth — plain fetch fix**: Replaced `openid-client` token exchange with plain `fetch` calls in `src/lib/auth.ts` to fix `OAuthCallback` error on CF Workers. Both `token.request` and `userinfo.request` use native `fetch`. `redirect_uri` sourced from `context.provider.callbackUrl`.
- **Google OAuth — discovery bypass**: Replaced `GoogleProvider()` (which fetches OIDC wellKnown on cold starts) with a manual OAuth provider config — hardcoded `authorization`, `token`, and `userinfo` URLs to eliminate CF Workers cold-start failures.
- **package.json version**: Bumped to `1.3.0`

### Beta 1.22 (2026-03-18)
- **Google OAuth**: Added GoogleProvider to NextAuth (`src/lib/auth.ts`); manual user create/lookup in `signIn` callback (no PrismaAdapter — avoids transaction issues); `passwordHash String?` now optional in schema; `checks: ["state"]` to disable PKCE on CF Workers
- **FRQ Speed Fix**: `generateQuestion()` skips `validateQuestion()` for FRQ/SAQ/DBQ/LEQ/CODING types (saves ~10s/question)
- **Sage Loading Bubble**: Practice page shows animated Sage bubble with cycling messages while FRQ session starts; disappears when questions load
- **Landing Page**: Hero rewritten for clarity; soft pricing in 3 spots; "Meet Sage" section; "How It Works" 3-step section; inline pricing cards; outcome-focused features; trust signals; stronger CTAs

### Beta 1.21 (prior)
- Practice hang fixes + premium badge flicker
- AI provider SDK calls converted to plain fetch for CF Workers compat
- Content hash dedup, 5-criterion validator, apSkill tagging, topic saturation guard, longestStreak, topic coverage admin panel
