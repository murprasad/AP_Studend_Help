# NovAP (AP SmartPrep) — High Level Design

**Document ID:** HLD-001
**Version:** 1.3
**Last Updated:** 2026-03-15
**Status:** Active

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                         │
│  Next.js 14 App Router (React)  ·  Tailwind CSS  ·  shadcn/ui  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Cloudflare Pages + Workers (Edge Runtime)          │
│  OpenNext CF adapter  ·  Middleware (auth guard)  ·  Wrangler   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Next.js API Routes                      │   │
│  │  /api/auth  /api/practice  /api/ai/*  /api/billing  ...  │   │
│  └─────────────────────┬────────────────────────────────────┘   │
└────────────────────────┼────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────────┐
         ▼               ▼                   ▼
   ┌──────────┐   ┌────────────┐   ┌──────────────────┐
   │  Neon DB │   │  AI APIs   │   │  Stripe API      │
   │ Postgres │   │ (cascade)  │   │  (billing)       │
   │ (HTTP)   │   │ Groq/Gemini│   │                  │
   └──────────┘   └────────────┘   └──────────────────┘
```

---

## 2. Frontend Component Architecture

### 2.1 Page Hierarchy

```
src/app/
├── (public)
│   ├── /                     Landing page
│   ├── /pricing              Pricing comparison
│   ├── /login                Auth
│   ├── /register             Auth
│   └── /verify-email         Auth
│
└── (dashboard)/              Protected — sidebar layout
    ├── /dashboard            Home: stats, mastery heatmap, quick actions
    ├── /practice             MCQ + FRQ practice engine (select→practice→summary)
    ├── /mock-exam            Timed mock exam (intro→section1→complete)
    ├── /analytics            Charts: mastery bar, accuracy timeline, stats cards
    ├── /study-plan           AI weekly plan with focus areas + daily schedule
    ├── /resources            Curated links: resources, textbooks, videos, exam skills
    ├── /ai-tutor             Split-panel chat: messages + 5-section response cards
    ├── /billing              Subscription management
    ├── /docs                 Living documentation browser (all 4 documents)
    ├── /about                Platform info
    └── /admin                Admin-only: questions, users, flags, bulk gen
```

### 2.2 Shared Components

```
src/components/
├── layout/
│   ├── sidebar.tsx           Navigation, course switcher dropdown, Nova link
│   └── course-selector-inline.tsx  Reusable course dropdown card for all pages
├── ui/                       shadcn/ui primitives (Button, Card, Badge, etc.)
└── tutor/
    ├── section-cards.tsx     Renders the 5-section AI tutor response
    ├── section-parser.ts     Parses structured AI response into sections
    └── markdown-content.tsx  react-markdown + mermaid diagram renderer
```

### 2.3 State Management

No global state manager. State is kept at component level + shared via:

| Mechanism | What It Carries |
|-----------|----------------|
| `useCourse()` hook + localStorage | Selected AP course (synced via CustomEvent) |
| NextAuth `useSession()` | User identity, role, subscriptionTier |
| Cookie `ap_selected_course` | Course for server components |
| URL search params | Filters (unit, difficulty) on practice page |
| React `useState` | Per-page ephemeral state |

---

## 3. Backend / API Design

### 3.1 API Route Map

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| /api/auth/register | POST | None | Create account |
| /api/auth/verify-email | POST | None | Verify email token |
| /api/auth/[...nextauth] | * | — | NextAuth handler |
| /api/user | GET | User | Current user profile |
| /api/practice | POST | User | Create practice session |
| /api/practice | GET | User | List sessions |
| /api/practice/[id] | POST | User | Submit answer |
| /api/practice/[id] | PATCH | User | Complete session |
| /api/ai/tutor | POST | User | Non-streaming AI chat |
| /api/ai/tutor | GET | User | List conversations |
| /api/ai/tutor/stream | POST | User | SSE streaming chat |
| /api/ai/tutor/image | POST | User | Fetch Wikipedia image |
| /api/analytics | GET | User | Progress analytics |
| /api/study-plan | GET | User | Fetch study plan |
| /api/study-plan | POST | User | Generate study plan |
| /api/feature-flags | GET | None | Public feature flag state |
| /api/checkout | POST | User | Create Stripe checkout |
| /api/billing/status | GET | User | Subscription status |
| /api/billing/cancel | POST | User | Cancel subscription |
| /api/billing/cancel | DELETE | User | Reactivate subscription |
| /api/billing/portal | POST | User | Stripe portal session |
| /api/webhooks/stripe | POST | Stripe sig | Stripe events |
| /api/admin/settings | GET/POST | Admin | Feature flags + config |
| /api/admin/populate-questions | GET/POST | Admin | Question coverage + generation |
| /api/admin/mega-populate | POST | Admin | Bulk question fill |
| /api/chat/nova | POST | User | Nova sidebar chat |

### 3.2 Authentication Flow

```
Browser                   NextAuth                   Database
   │                          │                          │
   │  POST /api/auth/signin   │                          │
   │─────────────────────────►│                          │
   │                          │  findUnique(email)       │
   │                          │─────────────────────────►│
   │                          │◄─────────────────────────│
   │                          │  bcrypt.compare()        │
   │                          │  jwt() callback:         │
   │                          │    token.id = user.id    │
   │                          │    token.role            │
   │                          │    token.subscriptionTier│
   │  Set-Cookie: jwt         │                          │
   │◄─────────────────────────│                          │
```

### 3.3 Practice Session Flow

```
Client                    /api/practice               AI Provider
   │                          │                          │
   │  POST (course, type, N)  │                          │
   │─────────────────────────►│                          │
   │                          │  Check feature flags     │
   │                          │  Check FRQ gate          │
   │                          │  Check daily limit       │
   │                          │  Query questions (DB)    │
   │                          │  If insufficient:        │
   │                          │    generateQuestion()──►│
   │                          │◄────────────────────────│
   │                          │  Adaptive sort           │
   │                          │  Create PracticeSession  │
   │                          │  INSERT SessionQuestions │
   │  { sessionId, questions }│                          │
   │◄─────────────────────────│                          │
```

### 3.4 AI Tutor Flow (Streaming — Premium)

```
Client           /api/ai/tutor/stream         Groq SSE          /api/ai/tutor
   │                     │                       │                    │
   │  POST (message)     │                       │                    │
   │────────────────────►│                       │                    │
   │                     │  POST (stream=true)   │                    │
   │                     │──────────────────────►│                    │
   │  token token token  │◄──────────────────────│                    │
   │◄────────────────────│                       │                    │
   │  [stream ends]      │                       │                    │
   │                     │                       │                    │
   │  POST (skipAI=true, savedResponse=...)                           │
   │─────────────────────────────────────────────────────────────────►│
   │                                                                   │  save to DB
   │◄──────────────────────────────────────────────────────────────── │
```

---

## 4. Database Design

### 4.1 Entity Relationship Diagram

```
User ──────────────────────────────────────────────────────────────────┐
 │                                                                       │
 ├──< PracticeSession >────< SessionQuestion >────< Question >──────────┤
 │                │                                                      │
 ├──< StudentResponse >──────────────────────────────────────────────── │
 │                                                                       │
 ├──< MasteryScore (per unit)                                            │
 ├──< StudyPlan                                                          │
 ├──< TutorConversation                                                  │
 └──< UserAchievement >──< Achievement
```

### 4.2 Key Relationships

- **User ↔ PracticeSession**: one-to-many (a user has many sessions)
- **PracticeSession ↔ Question**: many-to-many via SessionQuestion (with order)
- **User ↔ MasteryScore**: one-to-many, unique on (userId, unit)
- **User ↔ TutorConversation**: one-to-many
- **User ↔ UserAchievement ↔ Achievement**: many-to-many with earnedAt

### 4.3 Critical Constraint — No Transactions

Neon HTTP adapter does **not** support transactions. All multi-row inserts use:
```sql
INSERT INTO session_questions (id, "sessionId", "questionId", "order")
VALUES ($1, $2, $3, $4), ($5, $6, $7, $8), ...
```
via `prisma.$executeRawUnsafe()`. Postgres column names are camelCase and must be quoted.

---

## 5. AI System Design

### 5.1 Provider Cascade Logic

```typescript
for (provider of PROVIDERS) {
  if (!provider.isConfigured()) continue;
  try {
    const result = await provider.call(prompt);
    if (result.trim()) return result;
  } catch (err) {
    if (isAuthError(err)) continue;   // skip, try next
    if (retries < maxRetries) retry;  // transient error
    else continue;                    // exhausted, try next
  }
}
return Pollinations.call(prompt); // guaranteed fallback
```

### 5.2 AI Tutor Response Structure

Every tutor response is structured into exactly 5 sections:

| Section | Content |
|---------|---------|
| 🧠 Core Concept | What this topic actually means |
| 📊 Visual Breakdown | Diagram, timeline, or table (Mermaid or markdown) |
| 📝 How AP Asks This | Question patterns, skill tags (Causation, CCOT, etc.) |
| ⚠️ Common Traps | Most frequent student mistakes |
| 🔁 Memory Hook | Mnemonic, analogy, or pattern for retention |

Plus a trailing `FOLLOW_UPS: [...]` JSON block with 3 suggested next questions.

### 5.3 Question Generation Pipeline

```
Request ──► buildQuestionPrompt(course, unit, difficulty, type)
              │
              ├── Unit metadata from COURSE_REGISTRY
              ├── Difficulty rubric
              ├── AP skill codes
              ├── Distractor taxonomy
              └── Type-specific format template
                  │
                  ▼
            callAIWithCascade(prompt)
                  │
                  ▼
            Parse JSON response
                  │
              (World History MCQ only)
            Fetch Wikipedia image (3s timeout)
                  │
                  ▼
            Store in Question table (isApproved=true)
```

---

## 6. Feature Flag System Design

```
Admin UI ──► POST /api/admin/settings ──► setSetting(key, value)
                                              │
                                         DB upsert + cache invalidate
                                              │
Any API route ──► getSetting(key)  ──►  30s in-process cache
                                              │
                                         Read from DB if cache miss
```

- Cache TTL: 30 seconds (in-process Map, resets on cold start)
- All flags default to safe values (restriction defaults OFF = open access)

---

## 7. Course Switching Design

```
User clicks course dropdown (sidebar or CourseSelectorInline)
       │
       ▼
setCourse(newCourse) ──► localStorage.setItem(...)
                    ──► document.cookie = ...
                    ──► window.dispatchEvent(CustomEvent("ap-course-change"))
                              │
                    All useCourse() instances listen for this event
                              │
                    Each instance: setCourseState(newCourse)
                              │
                    Page re-renders with new course data
       │
       ▼
router.refresh() ──► Server components re-render with new cookie value
```

---

## 8. Subscription Gating Design

```
Feature Access Request
       │
       ├── Read premiumRestricted from /api/feature-flags (client)
       │         or isPremiumRestrictionEnabled() (server)
       │
       ├── If premiumRestricted = false ──► Allow (open access mode)
       │
       └── If premiumRestricted = true:
               │
               ├── Check user.subscriptionTier
               │
               ├── PREMIUM ──► Allow
               │
               └── FREE:
                     ├── FRQ request ──► 403 (upgrade required)
                     └── >3 sessions/day ──► 429 (daily limit)
```

---

## 9. Docs Page Design

```
/docs page
   │
   ├── Tab bar: [HLR] [DR] [HLD] [ARCH]
   │
   ├── Document viewer: client-side fetch of /docs/{slug}.md
   │         └── Rendered with react-markdown + remark-gfm
   │
   ├── "Print / Save as PDF" button ──► window.print()
   │         └── @media print CSS: clean black-on-white layout
   │
   └── "Download .md" link ──► direct link to /docs/{slug}.md
```

---

## 10. Document Change Log

| Version | Date | Change Summary |
|---------|------|---------------|
| 1.0 | 2026-01-10 | Initial HLD |
| 1.1 | 2026-02-14 | Added Stripe flow, new courses, admin dashboard |
| 1.2 | 2026-03-01 | FRQ scoring flow, streaming tutor flow, premium gating |
| 1.3 | 2026-03-15 | Course switching design, docs page design, feature flag flow |
