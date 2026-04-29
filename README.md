# StudentNest — AI-Powered AP, SAT & ACT Prep

> **Beta 9.0** · Live at [studentnest.ai](https://studentnest.ai)

StudentNest is a full-stack exam preparation platform for high school students. It combines AI-generated practice questions, a 24/7 AI tutor (Sage), per-unit mastery tracking, mock exams, FRQ practice graded against the official CB rubric, and personalized study plans — all free to start.

**What's new in Beta 9 (FTUE redesign milestone):**
- **Auto-start onboarding** — fresh signup → 1-click course pick → first question in 30 seconds. No 4-step wizard, no premature pricing, no setup mode.
- **FRQ taste-first model** — 1 free DBQ + 1 free LEQ + 1 free SAQ + 1 free generic FRQ per course (lifetime). Free users see the full prompt + documents + rubric + AI scoring on their first attempt. Premium unlocks unlimited + detailed line-by-line coaching.
- **Always-on next-step direction** — every session ends with a clear "what to do next" CTA. No blank-state dead-ends.
- **Track-aware quickstart** — AP / SAT / ACT signups each see their relevant courses; no AP-only catalog for SAT students.
- **CB-aligned content** — 22 AP courses, 7,186+ approved questions. Every course unit list matches the latest College Board CED. AP Physics 1 redesign (Charge/Circuits → Physics 2; new Unit 8 Fluids) reflected. AP Psychology 9→5 unit migration in flight (Beta 9.1).

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 14.2.18 |
| Language | TypeScript | ^5.6.3 |
| Database | PostgreSQL via [Neon](https://neon.tech) serverless | HTTP transport |
| ORM | Prisma + WASM client + Neon HTTP adapter | ^6.1.0 |
| Auth | NextAuth.js — JWT strategy | ^4.24.10 |
| AI (primary) | Groq — `llama-3.3-70b-versatile` | via plain fetch |
| AI (premium) | Gemini 1.5 Flash, OpenRouter/GPT-4o, Anthropic Claude | via plain fetch |
| AI (fallback) | Pollinations.ai — free, no key required | via plain fetch |
| Styling | Tailwind CSS (dark theme) + Radix UI + shadcn/ui | ^3.4.14 |
| Charts | Recharts | ^2.13.3 |
| Markdown | react-markdown + remark-gfm | ^10.1.0 / ^4.0.1 |
| Payments | Stripe | ^16.12.0 |
| Deployment | Cloudflare Pages via OpenNext | wrangler ^4.72.0 |
| Build tool | OpenNext Cloudflare | ^1.17.1 |
| Node runtime | Node.js | ≥ 20.x |
| Package manager | npm | use `--legacy-peer-deps` |

---

## Prerequisites

- **Node.js** ≥ 20.x
- **npm** (comes with Node.js)
- **Neon account** — free PostgreSQL database at [neon.tech](https://neon.tech)
- **Groq API key** — free at [console.groq.com](https://console.groq.com) (primary AI provider)
- **Cloudflare account** — for production deployment (free tier)
- **Wrangler CLI** — installed as a dev dependency (`npx wrangler`)

---

## Quick Start (Local Development)

### 1. Clone the repository

```bash
git clone https://github.com/murprasad/AP_Studend_Help.git
cd AP_Studend_Help
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

> ⚠️ The `--legacy-peer-deps` flag is required — some dependencies have peer version conflicts.

### 3. Set up environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# ── Required ─────────────────────────────────────────────────────────────────
# Neon PostgreSQL (get from neon.tech dashboard → Connection string → Pooled)
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

# NextAuth — generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Groq — free at console.groq.com (primary AI provider)
GROQ_API_KEY="gsk_..."

# ── Optional — AI providers ───────────────────────────────────────────────────
ANTHROPIC_API_KEY=""        # Claude fallback (has billing — use Groq instead)
GOOGLE_AI_API_KEY=""        # Gemini free tier — faster cold starts than Groq

# ── Optional — Google OAuth ───────────────────────────────────────────────────
# Get from Google Cloud Console → APIs & Services → Credentials
# Authorized redirect URI must include: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# ── Optional — Email verification ────────────────────────────────────────────
# Auto-bypassed in dev when EMAIL_SERVER_USER is empty
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
EMAIL_FROM="StudentNest <noreply@studentnest.ai>"

# ── Optional — Stripe payments ────────────────────────────────────────────────
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PREMIUM_PRICE_ID=""
STRIPE_ANNUAL_PRICE_ID=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""

# ── Optional ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to your Neon database (creates all tables)
npx prisma db push

# Seed with 24 sample questions + 12 achievements
npx prisma db seed
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Commands

```bash
npx prisma generate          # Regenerate Prisma client after schema changes
npx prisma migrate dev       # Create and run a migration (interactive)
npx prisma db push           # Push schema without a migration file (dev only)
npx prisma db seed           # Seed sample questions + achievements
npx prisma studio            # Open Prisma Studio GUI at localhost:5555
```

> **Important constraint**: This app uses the Neon HTTP adapter which **does not support transactions**.
> Never use `prisma.$transaction([...])` or nested Prisma writes. Use `$executeRawUnsafe` for bulk inserts.

---

## Project Structure

```
src/
  app/
    (auth)/           # login, register, verify-email, forgot-password
    (dashboard)/      # all protected pages (sidebar layout)
      practice/       # MCQ/FRQ/SAQ practice engine
      mock-exam/      # Timed full-length mock exam
      analytics/      # Progress charts + mastery heatmap
      ai-tutor/       # Chat interface — Sage (Groq-powered)
      study-plan/     # AI-generated weekly study plan
      billing/        # Stripe subscription management
      admin/          # Admin dashboard (ADMIN role only)
      about/          # Platform info, courses, AI transparency
    api/
      auth/           # NextAuth + register + verify-email
      practice/       # Session management + answer submission
      ai/tutor/       # Chat + streaming proxy
      checkout/       # Stripe checkout session
      webhooks/       # Stripe webhook handler
      analytics/      # User progress data
  lib/
    prisma.ts         # WASM Prisma singleton (Neon HTTP adapter)
    auth.ts           # NextAuth config (JWT + Google OAuth)
    ai.ts             # askTutor, generateQuestion, generateStudyPlan
    ai-providers.ts   # Multi-provider cascade (Groq → Pollinations)
    courses.ts        # COURSE_REGISTRY — single source of truth
    settings.ts       # SiteSettings DB helpers
  hooks/
    use-course.ts     # Course selection (localStorage + cookie)
  components/
    ui/               # shadcn/ui components
    layout/           # Sidebar, sage-chat, header
prisma/
  schema.prisma       # Database schema
  seed.ts             # Sample questions + achievements
scripts/
  patch-prisma-wasm.js      # Patches Prisma for CF Workers + Node.js dual compat
  check-cf-compat.js        # Pre-deploy gate: blocks banned Node.js imports
  post-deploy-verify.js     # Post-deploy health check
```

---

## Cloudflare Pages Deployment

### One-command deploy

```bash
npm run pages:deploy
```

This runs automatically:
1. `node scripts/check-cf-compat.js` — verifies no banned Node.js SDK imports
2. `npx prisma generate` — regenerates WASM Prisma client
3. `node scripts/patch-prisma-wasm.js` — patches loader for CF Workers + Node.js compat
4. `opennextjs-cloudflare build` — OpenNext CF build
5. `node scripts/prepare-cf-deploy.js` — assembles `.cf-deploy/` output
6. `wrangler pages deploy .cf-deploy --project-name=studentnest` — uploads to Cloudflare
7. `node scripts/post-deploy-verify.js` — runs post-deploy health check

### First-time Cloudflare setup

```bash
# Authenticate wrangler
npx wrangler login

# Set required secrets (run once per environment)
echo "postgresql://..." | npx wrangler pages secret put DATABASE_URL --project-name=studentnest
echo "your-secret"     | npx wrangler pages secret put NEXTAUTH_SECRET --project-name=studentnest
echo "https://studentnest.ai" | npx wrangler pages secret put NEXTAUTH_URL --project-name=studentnest
echo "gsk_..."         | npx wrangler pages secret put GROQ_API_KEY --project-name=studentnest

# Optional secrets
echo "sk_live_..."     | npx wrangler pages secret put STRIPE_SECRET_KEY --project-name=studentnest
echo "whsec_..."       | npx wrangler pages secret put STRIPE_WEBHOOK_SECRET --project-name=studentnest
echo "your-id"         | npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name=studentnest
echo "your-secret"     | npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name=studentnest
```

### After schema changes in production

```bash
# Run migrations against production Neon DB (set DATABASE_URL to prod URL first)
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

---

## Adding a New Course

1. Add enum values to `prisma/schema.prisma` (`ApCourse` + `ApUnit`)
2. Run `npx prisma db push` (or `migrate dev`)
3. Add one `CourseConfig` block to `COURSE_REGISTRY` in `src/lib/courses.ts`
4. Done — sidebar, API validators, AI prompts, and mock-exam timing all update automatically

---

## CF Workers Constraints

The following packages are **banned** in `src/` — they use Node.js HTTP clients incompatible with Cloudflare Workers:

| Banned | Reason |
|--------|--------|
| `groq-sdk` | Internal HTTP uses Node net APIs |
| `@anthropic-ai/sdk` | Same |
| `@huggingface/inference` | Same |
| `cohere-ai` | Same |

**Always use plain `fetch` with `AbortSignal.timeout()`** for AI provider calls.
Run `node scripts/check-cf-compat.js` to verify before deploying.

---

## Key Environment Variables (Production)

| Variable | Required | Where to get |
|----------|----------|--------------|
| `DATABASE_URL` | ✅ | [neon.tech](https://neon.tech) → Connection string (pooled) |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | `https://studentnest.ai` in prod |
| `GROQ_API_KEY` | ✅ | [console.groq.com](https://console.groq.com) — free |
| `GOOGLE_CLIENT_ID` | Optional | Google Cloud Console → OAuth 2.0 credentials |
| `GOOGLE_CLIENT_SECRET` | Optional | Google Cloud Console → OAuth 2.0 credentials |
| `STRIPE_SECRET_KEY` | Optional | [dashboard.stripe.com](https://dashboard.stripe.com) |
| `STRIPE_WEBHOOK_SECRET` | Optional | Stripe → Webhooks → signing secret |
| `GOOGLE_AI_API_KEY` | Optional | [aistudio.google.com](https://aistudio.google.com) — free |
| `ANTHROPIC_API_KEY` | Optional | [console.anthropic.com](https://console.anthropic.com) — paid |

---

## Release History

| Version | Date | Highlights |
|---------|------|-----------|
| **Beta 1.3** | 2026-03-18 | Landing page streamlined (12→7 sections), Google OAuth plain-fetch fix, nav About link, pricing teaser |
| Beta 1.22 | 2026-03-18 | Google OAuth (CF Workers compatible), FRQ speed fix, Sage loading bubble, landing page overhaul |
| Beta 1.21 | 2026-03-17 | Practice hang fixes, premium badge, AI SDK → plain fetch migration |
| Beta 1.2 | 2026-03-16 | Content-hash dedup, 5-criterion validator, apSkill tagging, topic saturation guard, longestStreak |
| Beta 1.1 | 2026-03-15 | Community features, light/dark mode, onboarding wizard, post-diagnostic upgrade CTA |
| Beta 1.0 | 2026-03-14 | Initial public beta — 16 courses, Sage AI tutor, mock exam, Stripe payments |

---

## License

Independent educational project. Not affiliated with College Board, AP®, SAT®, or ACT®.
AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site.
