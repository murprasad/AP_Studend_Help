# StudentNest — High Level Requirements

**Document ID:** HLR-001
**Version:** 1.9
**Last Updated:** 2026-03-17
**Status:** Active

---

## 1. Purpose

AP SmartPrep (branded **StudentNest**, deployed as **StudentNest** at studentnest.ai) is a full-stack,
AI-powered AP exam preparation platform for high school students. It provides adaptive
practice questions, timed mock exams, AI tutoring, mastery-based analytics, and personalized
study planning for ten AP courses, plus SAT and ACT preparation (16 courses total).

---

## 2. Stakeholders

| Stakeholder | Role |
|-------------|------|
| Students (STUDENT role) | Primary end users — practice, track progress, earn XP |
| Administrators (ADMIN role) | Manage questions, feature flags, and platform settings |
| Platform Owner | Business decisions, billing configuration, course additions |

---

## 3. High Level Functional Requirements

### HLR-F-01 · User Authentication
The platform shall support secure user registration, login, session management, and
self-service password reset using JWT-based authentication. Email verification shall be
required in production. The platform shall support role-based access (STUDENT, ADMIN).

### HLR-F-02 · Multi-Course Support (AP, SAT, ACT)
The platform shall support at minimum 16 courses simultaneously: 10 AP courses, 2 SAT courses,
and 4 ACT courses. Each course shall have its own set of units, question types, resource links,
exam timing, and AI guidance. ACT Math shall use a unique 5-choice (A–E) MCQ format. ACT English,
Science, and Reading shall require stimulus/passage content in all questions. Adding a new course
shall require changes only to the course registry and database schema — no other code changes
shall be needed.

### HLR-F-03 · Adaptive MCQ Practice
The platform shall provide unlimited multiple-choice practice sessions. Questions shall be
drawn from a curated database and supplemented by AI-generated questions when the bank is
insufficient. The system shall prioritize unseen and previously-incorrect questions to maximize
learning efficiency.

### HLR-F-04 · Free Response Question (FRQ) Practice
The platform shall provide AI-scored free response practice for all supported FRQ types
(SAQ, LEQ, DBQ, FRQ, CODING, DATA_ANALYSIS). The AI shall score responses against an
official-style rubric and provide detailed, formative feedback including a model answer.

### HLR-F-05 · Timed Mock AP Exams
The platform shall provide timed mock exam simulations that match the official AP exam
pacing for each course. Results shall include an estimated AP score (1–5).

### HLR-F-06 · AI Tutor
The platform shall provide a conversational AI tutor capable of answering AP content
questions for the selected course. The tutor shall provide structured responses covering
the core concept, visual breakdown, AP exam framing, common traps, and a memory hook.
Streaming responses shall be available to Premium users.

### HLR-F-07 · Mastery-Based Analytics
The platform shall track per-unit mastery scores, overall accuracy, question streak,
XP, level, and an estimated AP score. Analytics shall be filterable by course.

### HLR-F-08 · AI Study Plan
The platform shall generate a personalized weekly study plan based on the student's
weakest units, mastery scores, and recent performance. Students with fewer than 20
answered questions shall receive a high-quality static template instead.

### HLR-F-09 · Curated Learning Resources
The platform shall provide curated free resources (video channels, textbooks, practice
sites, primary sources) for each AP course and unit.

### HLR-F-10 · Subscription Billing
The platform shall support a Freemium model with a paid Premium tier available at
**$9.99/month** or **$79.99/year** (save 33%) via Stripe. The billing page shall present
a monthly/annual toggle so students can choose their plan before checkout. Subscription
status shall be enforced in real time via webhook events.

### HLR-F-11 · Gamification
The platform shall award XP for correct answers, maintain daily practice streaks, assign
levels, and award achievement badges to motivate continued engagement.

### HLR-F-12 · Admin Dashboard
Administrators shall have access to a dedicated dashboard to manage question quality,
monitor platform usage, configure feature flags, and trigger bulk AI question generation.

### HLR-F-13 · Feature Flag System
All premium restrictions and experimental features shall be controllable via database-backed
feature flags without code changes or redeployment.

### HLR-F-14 · AI Question Auto-Population
The system shall automatically generate AI questions when a practice session request
cannot be satisfied from the existing question bank, subject to an `ai_generation_enabled`
flag and a parallel generation cap.

### HLR-F-15 · Platform Documentation
The platform shall maintain and publish living documentation (High Level Requirements,
Detailed Requirements, High Level Design, Architecture) accessible to all users.

### HLR-F-17 · Light/Dark Mode Theme Toggle
The platform shall support light and dark display themes, selectable from the sidebar.
The selected theme shall persist across sessions via localStorage. A flash-prevention
inline script shall apply the correct class before React hydrates to eliminate the
white-flash-on-dark-reload issue.

### HLR-F-18 · Guided First-Time User Onboarding
New users shall be automatically redirected to a 3-step onboarding wizard upon first
login: (1) select their exam course, (2) learn how the platform works, (3) choose their
first action (Diagnostic or Practice). Completion is stored in localStorage. Returning
users bypass the wizard entirely.

### HLR-F-19 · Contextual Upgrade CTAs
The platform shall surface in-context upgrade prompts at the highest-intent moments for
free users: (a) after completing a Diagnostic assessment showing weak units, and (b) on
the Analytics page. CTAs shall name the specific weak unit or score gap to increase
conversion relevance.

### HLR-F-16: Two-Tier AI Question Generation

| Attribute | Value |
|-----------|-------|
| Priority | Medium |
| Status | Implemented (v1.6) |

**Description:** The system SHALL route AI question generation through provider pools
selected by the user's subscription tier:
- **FREE tier** — Groq (llama-3.3-70b), Together.ai, HuggingFace, Pollinations-Free
- **PREMIUM tier** — Gemini 1.5 Flash, OpenRouter/GPT-4o, Anthropic Claude, + FREE fallbacks

Every AI-generated question SHALL pass through a validation pipeline (up to 3 retry
attempts) before being stored. The Question record SHALL track `modelUsed` (string) and
`generatedForTier` (FREE|PREMIUM) for analytics and auditability.

---

## 4. High Level Non-Functional Requirements

### HLR-NF-01 · Performance
API responses shall complete within 5 seconds under normal load. AI responses shall
begin streaming within 3 seconds. Enrichment fetches shall not block AI responses
(hard 2.5 s timeout).

### HLR-NF-02 · Availability
The platform shall target 99.9% uptime leveraging Cloudflare Pages' global edge network.
AI features shall degrade gracefully via a multi-provider cascade (10 providers including
a no-key fallback).

### HLR-NF-03 · Security
All API routes shall require authentication except the public landing page, pricing page,
and documentation page. Passwords shall be hashed with bcrypt. JWT secrets shall be
stored as environment secrets, not in source code.

### HLR-NF-04 · Scalability
The platform shall use serverless architecture (Cloudflare Workers + Neon serverless
Postgres) to scale horizontally without configuration changes. All high-frequency database
queries shall be covered by compound indexes to prevent full-table scans under concurrent
load. Per-user API rate limiting shall be enforced on high-cost routes to protect the
database connection pool from exhaustion.

### HLR-NF-05 · Maintainability
Each AP course shall be fully described by a single `CourseConfig` entry in
`src/lib/courses.ts`. New courses shall not require changes to API routes, AI prompts,
or UI components.

### HLR-NF-06 · Portability
All server-side code shall be compatible with both Node.js (local dev) and Cloudflare
Workers (production) runtimes. No Node.js-specific SDK packages shall be used in
API routes — plain `fetch` with `AbortSignal.timeout()` is the standard pattern.

---

## 5. Supported Courses (v1.8)

### 5.1 AP Courses (10)

| # | Course | Units | FRQ Types |
|---|--------|-------|-----------|
| 1 | AP World History: Modern | 9 | SAQ, LEQ, DBQ |
| 2 | AP Computer Science Principles | 5 | CODING |
| 3 | AP Physics 1: Algebra-Based | 10 | FRQ |
| 4 | AP Calculus AB | 8 | FRQ |
| 5 | AP Calculus BC | 10 | FRQ |
| 6 | AP Statistics | 9 | FRQ |
| 7 | AP Chemistry | 9 | FRQ |
| 8 | AP Biology | 8 | FRQ |
| 9 | AP United States History | 9 | SAQ, LEQ, DBQ |
| 10 | AP Psychology | 9 | FRQ |

### 5.2 SAT Prep (2)

| # | Course | Domains | Notes |
|---|--------|---------|-------|
| 11 | SAT Math | 4 | Standard 4-choice MCQ |
| 12 | SAT Reading & Writing | 4 | Passage-based; stimulus required |

### 5.3 ACT Prep (4)

| # | Course | Domains | Notes |
|---|--------|---------|-------|
| 13 | ACT Math | 5 | **5-choice MCQ (A–E)** — unique format |
| 14 | ACT English | 3 | Passage-embedded; stimulus required |
| 15 | ACT Science | 3 | Data table/experiment as stimulus |
| 16 | ACT Reading | 4 | Passage excerpt (5–8 sentences) as stimulus |

---

## 6. Subscription Tiers

| Feature | FREE | PREMIUM |
|---------|------|---------|
| Price | $0 | $9.99/mo or $79.99/yr |
| MCQ Practice sessions/day | 3 (if restriction on) | Unlimited |
| FRQ/SAQ/LEQ/DBQ Practice | Blocked (if restriction on) | Unlimited |
| AI Tutor conversations/day | **5** (if limit on) | Unlimited |
| Streaming AI responses | No | Yes |
| Personalized study plan | Static template (<20 Q) | AI-generated |
| Analytics | Full | Full + upgrade CTA removed |
| Mock Exams | Included | Included |
| Diagnostic | Included | Included + personalized CTA |
| Annual billing discount | — | 33% off ($79.99/yr) |

*Note: When `premium_feature_restriction` flag is OFF (default), all users have full
access regardless of tier — intended for testing and open-access periods.*

---

## 7. Document Change Log

| Version | Date | Author | Change Summary |
|---------|------|--------|---------------|
| 1.0 | 2026-01-10 | Initial | First draft |
| 1.1 | 2026-02-14 | System | Added 7 new AP courses, Premium billing, Stripe |
| 1.2 | 2026-03-01 | System | Added FRQ support all 9 courses, premium restriction flag |
| 1.3 | 2026-03-15 | System | Added docs page (HLR-F-15), course switching fix, Nova chat fix |
| 1.4 | 2026-03-15 | System | Password reset flow implemented (HLR-F-01 updated); TCR + RTM documents added |
| 1.5 | 2026-03-16 | System | Scalability hardening: HLR-NF-04 expanded to include DB indexes and rate limiting |
| 1.6 | 2026-03-16 | System | Two-tier AI question generation (HLR-F-16): tier-routed provider pools, validation pipeline, modelUsed/generatedForTier schema fields |
| 1.7 | 2026-03-17 | Rebranded to StudentNest — updated all document titles, headers, and references |
| 1.8 | 2026-03-17 | SAT & ACT full integration: 16 courses total; ACT_READING added; 5-choice ACT Math; passage-based formats for ACT English/Science/Reading |
| 1.9 | 2026-03-17 | Monetisation & UX v2.1: annual plan (HLR-F-10 updated); light/dark mode (HLR-F-17); onboarding wizard (HLR-F-18); contextual upgrade CTAs (HLR-F-19); AI free limit 10→5/day; subscription tier table updated |
