# NovAP (AP SmartPrep) — Architecture Document

**Document ID:** ARCH-001
**Version:** 1.4
**Last Updated:** 2026-03-15
**Status:** Active

---

## 1. Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js | 14.2.18 | App Router, TypeScript, Server + Client components |
| Runtime | Cloudflare Workers | — | Via OpenNext CF adapter; nodejs_compat_v2 |
| Database | PostgreSQL (Neon) | — | Serverless, HTTP transport (no TCP) |
| ORM | Prisma | 6.1.0 | WASM client + PrismaNeonHTTP adapter |
| Auth | NextAuth | 4.x | JWT strategy; Credentials provider |
| AI (primary) | Groq | — | llama-3.3-70b-versatile; plain fetch |
| AI (fallback) | Pollinations-Free | — | No key; GPT-4o-mini quality |
| AI (optional) | Google Gemini, Together.ai, OpenRouter, HuggingFace, Cohere, Ollama, Anthropic | — | Configured via env vars |
| Styling | Tailwind CSS | 3.x | Dark theme; utility-first |
| UI Components | Radix UI + shadcn/ui | — | Accessible, headless |
| Charts | Recharts | — | Bar chart, line chart |
| Markdown | react-markdown + remark-gfm | — | Renders AI responses + docs |
| Diagrams | Mermaid.js | — | In AI tutor responses and docs |
| Payments | Stripe | — | Subscriptions + webhooks |
| Deployment | Cloudflare Pages | — | Global CDN; custom domain novaprep.ai |
| Build | OpenNext CF | 1.17.1 | Converts Next.js build for CF Pages |
| Package Manager | npm | — | `--legacy-peer-deps` required |

---

## 2. Infrastructure Diagram

```
         ┌─────────────────────────────────────────────────────┐
         │                  CLOUDFLARE NETWORK                  │
         │                                                       │
         │   ┌─────────────────────────────────────────────┐    │
         │   │         Cloudflare Pages                     │    │
         │   │                                               │    │
         │   │  Static assets (CSS, JS, images, public/)    │    │
         │   │  ┌─────────────────────────────────────┐    │    │
         │   │  │    Cloudflare Worker (server)        │    │    │
         │   │  │    OpenNext handler                  │    │    │
         │   │  │    Next.js App Router routes         │    │    │
         │   │  │    Prisma WASM + Neon HTTP client     │    │    │
         │   │  └─────────────────┬───────────────────┘    │    │
         │   └────────────────────┼────────────────────────┘    │
         │                        │                              │
         └────────────────────────┼──────────────────────────────┘
                                  │
              ┌───────────────────┼─────────────────────┐
              │                   │                      │
              ▼                   ▼                      ▼
      ┌──────────────┐   ┌──────────────────┐   ┌──────────────┐
      │  Neon Postgres│  │   AI Provider    │   │   Stripe     │
      │  (serverless) │  │   Cascade        │   │   (billing)  │
      │  HTTP adapter │  │   Groq (primary) │   │              │
      │  camelCase    │  │   Pollinations   │   │  Webhooks    │
      │  column names │  │   (fallback)     │   │  → Worker    │
      └──────────────┘   └──────────────────┘   └──────────────┘
```

---

## 3. Repository Structure

```
AP_Help/
├── doc/                    ← Living documentation (source of truth)
│   ├── HLR.md              ← High Level Requirements
│   ├── DR.md               ← Detailed Requirements
│   ├── HLD.md              ← High Level Design
│   └── ARCH.md             ← Architecture Document (this file)
│
├── prisma/
│   ├── schema.prisma       ← Database schema (enums, models, relations)
│   └── seed.ts             ← 24 sample questions + 12 achievements
│
├── public/
│   └── docs/               ← Static copies of /doc/ (served for download)
│       ├── HLR.md
│       ├── DR.md
│       ├── HLD.md
│       └── ARCH.md
│
├── scripts/
│   ├── patch-prisma-wasm.js   ← Patches Prisma for dual Node/CF compat
│   └── prepare-cf-deploy.js   ← Assembles .cf-deploy/ for wrangler
│
├── src/
│   ├── app/
│   │   ├── (auth)/           ← /login, /register, /verify-email
│   │   ├── (dashboard)/      ← Protected pages (sidebar layout)
│   │   │   ├── practice/
│   │   │   ├── mock-exam/
│   │   │   ├── analytics/
│   │   │   ├── ai-tutor/
│   │   │   ├── study-plan/
│   │   │   ├── resources/
│   │   │   ├── billing/
│   │   │   ├── docs/         ← NEW: living documentation browser
│   │   │   ├── admin/
│   │   │   └── dashboard/
│   │   ├── api/              ← All API routes
│   │   └── page.tsx          ← Landing page
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   └── course-selector-inline.tsx
│   │   ├── tutor/
│   │   └── ui/               ← shadcn/ui primitives
│   │
│   ├── hooks/
│   │   ├── use-course.ts     ← Course selection (localStorage + CustomEvent)
│   │   └── use-toast.ts      ← Toast notifications
│   │
│   └── lib/
│       ├── courses.ts        ← COURSE_REGISTRY (single source of truth)
│       ├── ai.ts             ← generateQuestion, askTutor, generateStudyPlan
│       ├── ai-providers.ts   ← Multi-provider cascade
│       ├── auth.ts           ← NextAuth config
│       ├── prisma.ts         ← WASM Prisma singleton
│       ├── settings.ts       ← Feature flags (30s cache)
│       ├── feature-flag-defs.ts ← Pure constants (no server imports)
│       ├── email.ts          ← Email sending (verification)
│       ├── edu-apis.ts       ← Wikipedia, StackExchange, etc.
│       └── utils.ts          ← COURSE_UNITS, AP_COURSES, formatTime, etc.
│
├── CLAUDE.md               ← AI assistant project guide
├── wrangler.toml           ← Cloudflare Pages + Workers config
└── package.json
```

---

## 4. Database Architecture

### 4.1 Schema Overview

```sql
-- Core user entity
User (id, email, passwordHash, role, subscriptionTier, totalXp, level,
      streakDays, lastActiveDate, stripeSubscriptionId, ...)

-- Questions and sessions
Question    (id, course, unit, topic, difficulty, questionType, questionText,
             stimulus, options JSON, correctAnswer, explanation, isApproved, ...)
PracticeSession  (id, userId, course, sessionType, status, totalQuestions, ...)
SessionQuestion  (id, sessionId, questionId, order)  -- junction table
StudentResponse  (id, userId, questionId, sessionId, studentAnswer, isCorrect, ...)

-- Progress tracking
MasteryScore    (userId, course, unit, masteryScore, accuracy, totalAttempts)
StudyPlan       (id, userId, course, planData JSON, isActive)
TutorConversation (id, userId, course, messages JSON)

-- Gamification
Achievement     (id, name, description, iconName, xpReward, condition JSON)
UserAchievement (userId, achievementId, earnedAt)

-- Administration
SiteSetting     (key PK, value, updatedBy, updatedAt)
```

### 4.2 Enum Types

```
ApCourse: AP_WORLD_HISTORY | AP_COMPUTER_SCIENCE_PRINCIPLES | AP_PHYSICS_1 |
          AP_CALCULUS_AB | AP_CALCULUS_BC | AP_STATISTICS | AP_CHEMISTRY |
          AP_BIOLOGY | AP_US_HISTORY | AP_PSYCHOLOGY

QuestionType: MCQ | FRQ | SAQ | DBQ | LEQ | NUMERICAL | CODING | DATA_ANALYSIS

SessionType: QUICK_PRACTICE | FOCUSED_STUDY | MOCK_EXAM

Difficulty: EASY | MEDIUM | HARD

Role: STUDENT | ADMIN

SubTier: FREE | PREMIUM
```

### 4.3 Prisma WASM Configuration

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client/wasm";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const adapter = new PrismaNeonHTTP(sql);
export const prisma = new PrismaClient({ adapter });
```

**Why WASM?** Cloudflare Workers do not support Node.js native bindings. Prisma's WASM
client runs in any JavaScript environment including the V8 isolate used by CF Workers.

**Why HTTP adapter?** Neon's HTTP adapter uses `fetch()` for DB queries — fully compatible
with CF Workers. The TCP-based connection pool (`@neondatabase/serverless` ws mode) does
not work on CF Workers.

**No transactions:** The HTTP adapter executes one query per round trip and cannot hold
a connection open for a transaction. All multi-row operations use `$executeRawUnsafe`.

---

## 5. AI Architecture

### 5.1 Provider Abstraction

```typescript
type AIProvider = {
  name: string;
  isConfigured: () => boolean;
  call: (prompt: string, systemPrompt?: string, history?: Message[]) => Promise<string>;
};

// Each provider uses plain fetch:
const response = await fetch(providerUrl, {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({ model, messages, max_tokens, temperature }),
  signal: AbortSignal.timeout(25000),
});
```

### 5.2 Why Plain `fetch`?

Cloudflare Workers run in a V8 isolate, not a full Node.js environment. Libraries that use
Node.js-specific APIs (`net`, `tls`, `http`, native modules) fail at runtime. Plain `fetch`
is a Web Standard API available in all runtimes. This is why:
- `groq-sdk` npm package is NOT used (uses Node.js internals)
- `@anthropic-ai/sdk` is NOT used as the primary path
- All providers in `ai-providers.ts` use `fetch()` with `AbortSignal.timeout(25000)`

### 5.3 Enrichment Architecture

```
askTutor() called
       │
       ├── AI call prepared (async)
       │
       └── Promise.race([
               enrichmentFetches(topic),    ─── Wikipedia, StackExchange, etc.
               setTimeout(2500)             ─── Hard cap: never wait > 2.5s
           ])
               │
               ▼ (whichever resolves first)
           context injected into system prompt
           (truncated to 200 chars if present)
                       │
                       ▼
                   AI call executes
```

### 5.4 Streaming Architecture

```
Client (Premium)
    │ EventSource / fetch(stream: true)
    │
    ▼
POST /api/ai/tutor/stream
    │ fetch Groq API with stream: true
    │ pipe response.body → return as SSE
    ▼
Groq API (SSE)
    │ token by token back to client
    │
After stream completes:
Client → POST /api/ai/tutor (skipAI=true, savedResponse=fullText)
    │ Saves to TutorConversation DB
    │ Returns { followUps }
```

---

## 6. Deployment Architecture

### 6.1 Build Pipeline

```
npm run pages:deploy
    │
    ├── npx prisma generate              (1) Regenerate WASM Prisma client
    ├── node scripts/patch-prisma-wasm.js (2) Patch for dual Node/CF compat
    ├── opennextjs-cloudflare build      (3) OpenNext CF build
    │       └── next build (Next.js production build)
    │       └── Bundle into .open-next/worker.js
    ├── node scripts/prepare-cf-deploy.js (4) Assemble .cf-deploy/ directory
    └── wrangler pages deploy .cf-deploy  (5) Upload to Cloudflare Pages
```

### 6.2 Environment Variables

| Variable | Where Set | Required | Description |
|----------|-----------|----------|-------------|
| DATABASE_URL | CF Pages secret | ✅ | Neon pooled connection string |
| NEXTAUTH_SECRET | CF Pages secret | ✅ | JWT signing key |
| NEXTAUTH_URL | CF Pages env | ✅ | https://novaprep.ai (prod) |
| GROQ_API_KEY | CF Pages secret | ✅ | Primary AI provider |
| GOOGLE_AI_API_KEY | CF Pages secret | Optional | Gemini (faster on cold start) |
| STRIPE_SECRET_KEY | CF Pages secret | Optional | Subscription billing |
| STRIPE_WEBHOOK_SECRET | CF Pages secret | Optional | Webhook verification |
| STRIPE_PREMIUM_PRICE_ID | CF Pages secret | Optional | Monthly price ID |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | CF Pages env | Optional | Client-side Stripe |
| EMAIL_SERVER_* | CF Pages secret | Optional | SMTP (auto-bypassed in dev) |
| ANTHROPIC_API_KEY | CF Pages secret | Optional | Last-resort AI fallback |

### 6.3 Cloudflare Configuration

```toml
# wrangler.toml
name = "novaprep"
compatibility_flags = ["nodejs_compat_v2"]
pages_build_output_dir = ".open-next"

[vars]
NEXT_PUBLIC_APP_URL = "https://novaprep.ai"
```

- **nodejs_compat_v2**: Enables Node.js-compatible globals (Buffer, process, crypto)
  in the CF Workers runtime. Required for bcrypt and other crypto operations.
- **Custom domain**: novaprep.ai via Cloudflare DNS (CNAME to Pages deployment)
- **Wrangler version**: 4.x (auto-updated on deploy)

---

## 7. Security Architecture

### 7.1 Authentication

- Passwords: bcrypt hashed (never stored in plaintext)
- Sessions: HTTP-only JWT cookie (inaccessible to JavaScript)
- JWT payload: { id, email, role, subscriptionTier } — no sensitive data
- Email verification: 24-hour expiring token (UUID v4)
- NEXTAUTH_SECRET: 32+ character random string stored as CF Pages secret

### 7.2 Authorization

- All `/api/*` routes check `getServerSession(authOptions)` first
- Admin routes additionally check `session.user.role === "ADMIN"`
- Stripe webhooks verified with `stripe.webhooks.constructEvent()`
- No client-supplied data trusted for authorization decisions

### 7.3 Input Handling

- All DB queries use Prisma ORM (parameterized — no SQL injection)
- Raw SQL (`$executeRawUnsafe`) uses positional parameters only (`$1, $2, ...`)
- AI-generated content stored as-is (not executed, treated as display text)
- No file uploads (all user input is text)

### 7.4 Secrets Management

- All secrets stored as Cloudflare Pages environment secrets (encrypted at rest)
- `.env.local` is `.gitignore`d — never committed to repo
- Stripe config can also be stored in `SiteSetting` DB table (admin UI override)

---

## 8. Performance Architecture

### 8.1 Edge-First Design

All server rendering happens at Cloudflare's edge (300+ PoPs globally):
- First request: ~50ms TTFB from CF edge to origin DB (Neon serverless)
- Static assets: cached at CF CDN, served in <10ms
- AI responses: ~1–3s (Groq), begin streaming within 1s (Premium)

### 8.2 Caching Strategy

| Data | Cache Layer | TTL |
|------|------------|-----|
| Static assets (JS, CSS, images) | CF CDN | immutable (content-hashed) |
| Feature flags | In-process Map | 30 seconds |
| Question bank | None (DB read each request) | — |
| AI responses | None (fresh per query) | — |

### 8.3 Timeout Strategy

All external calls have explicit timeouts:
- AI API calls: `AbortSignal.timeout(25000)` (25 seconds)
- Educational enrichment: 2.5 second race timeout
- Stripe API: relies on Stripe SDK's built-in timeout

---

## 9. Known Limitations

| Limitation | Impact | Mitigation |
|------------|--------|-----------|
| No DB transactions (Neon HTTP) | Can't atomically create session + questions | Use raw SQL bulk insert in single statement |
| CF Workers memory limit (128 MB) | Large question batches may OOM | Cap parallel AI generation at 5 per request |
| OpenNext Windows warning | Build may behave unexpectedly | Use WSL for production builds if hitting failures |
| JWT subscriptionTier stale until re-login | Tier change visible after next login | Stripe webhook updates DB; UI reads from DB via /api/user |

---

## 10. Document Change Log

| Version | Date | Change Summary |
|---------|------|---------------|
| 1.0 | 2026-01-10 | Initial architecture |
| 1.1 | 2026-02-14 | Stripe, 7 new courses, WASM constraint details |
| 1.2 | 2026-03-01 | Streaming architecture, FRQ scoring, plain fetch requirement |
| 1.3 | 2026-03-15 | Docs page in structure, Nova fix (SDK→fetch), course event bus |
| 1.4 | 2026-03-15 | Password reset flow implemented (DR-AUTH-06/07); TCR + RTM added to docs |
