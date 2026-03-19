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
