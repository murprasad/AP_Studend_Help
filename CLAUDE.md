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

### 5. NextAuth JWT Sessions

JWT strategy — sessions are stored in cookies, not the database.
`session.user.id` comes from `token.id` set in the `jwt` callback.
The `Session` table in Prisma is unused (JWT doesn't write to it).

Email verification is **auto-bypassed** in development when `EMAIL_SERVER_USER` is unset.

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
npm run pages:deploy         # Build + deploy to novaprep Cloudflare Pages project
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
5. `wrangler pages deploy .cf-deploy --project-name=novaprep` — uploads to CF

Cloudflare Pages project: `novaprep`
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
