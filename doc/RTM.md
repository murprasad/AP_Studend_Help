# NovAP (AP SmartPrep) — Requirements Traceability Matrix

**Document ID:** RTM-001
**Version:** 1.4
**Last Updated:** 2026-03-15
**Status:** Active

---

## Purpose

This matrix maps every High Level Requirement (HLR) and Detailed Requirement (DR) to the
source code that implements it and the test cases that verify it. It provides end-to-end
traceability from stakeholder needs through implementation to test evidence.

---

## Coverage Summary

| Metric | Count | Percentage |
|--------|-------|-----------|
| Total Requirements | 55 | 100% |
| Implemented | 55 | 100% |
| Tested | 50 | 91% |
| Blocked (needs live credentials) | 5 | 9% |

---

## 1. High Level Requirements Traceability

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
| HLR-NF-01 | API responses < 5s; AI streaming < 3s | `src/lib/ai-providers.ts` (AbortSignal.timeout), streaming endpoint | TC-TUTOR-02 | Implemented / Tested |
| HLR-NF-02 | 99.9% uptime; graceful AI degradation | `src/lib/ai-providers.ts` (10-provider cascade), Cloudflare edge | TC-TUTOR-01 | Implemented / Tested |
| HLR-NF-03 | Auth on all routes; bcrypt passwords; JWT secrets | `src/lib/auth.ts`, all API route auth checks | TC-AUTH-02, TC-AUTH-05 | Implemented / Tested |
| HLR-NF-04 | Serverless horizontal scale | Cloudflare Workers + Neon serverless Postgres | — | Implemented |
| HLR-NF-05 | Single CourseConfig block per course | `src/lib/courses.ts` (COURSE_REGISTRY) | TC-PRAC-01, TC-MOCK-01 | Implemented / Tested |
| HLR-NF-06 | Node.js + CF Workers compat; plain fetch | `src/lib/ai-providers.ts`, `src/lib/prisma.ts` (WASM) | TC-TUTOR-01 | Implemented / Tested |

---

## 2. Detailed Requirements Traceability

### Authentication

| Req ID | Requirement Summary | Implementation File(s) | Test Case(s) | Status |
|--------|--------------------|-----------------------|-------------|--------|
| DR-AUTH-01 | User registration with bcrypt, unique email, flag gate | `src/app/api/auth/register/route.ts` | TC-AUTH-01 | Implemented / Tested |
| DR-AUTH-02 | Email verification via 24h token | `src/app/api/auth/verify-email/route.ts`, `src/lib/email.ts` | TC-AUTH-03 | Implemented / Blocked (SMTP) |
| DR-AUTH-03 | Login: credentials → JWT with id/email/role/tier | `src/lib/auth.ts` (CredentialsProvider) | TC-AUTH-02 | Implemented / Tested |
| DR-AUTH-04 | JWT-based sessions; no DB session table | `src/lib/auth.ts` (jwt/session callbacks) | TC-AUTH-05 | Implemented / Tested |
| DR-AUTH-05 | STUDENT/ADMIN role-based access | `src/app/(dashboard)/admin/`, API route auth checks | TC-ADMIN-01 | Implemented / Tested |
| DR-AUTH-06 | Forgot password: token creation, email send | `src/app/api/auth/forgot-password/route.ts`, `src/lib/email.ts` | TC-AUTH-06, TC-PWRESET-01–02 | Implemented / Partial (SMTP) |
| DR-AUTH-07 | Reset password: token validation, bcrypt hash, update | `src/app/api/auth/reset-password/route.ts` | TC-AUTH-07, TC-PWRESET-03–05 | Implemented / Tested |

### Course System

| Req ID | Requirement Summary | Implementation File(s) | Test Case(s) | Status |
|--------|--------------------|-----------------------|-------------|--------|
| DR-COURSE-01 | COURSE_REGISTRY as single source of truth | `src/lib/courses.ts` | TC-PRAC-01 | Implemented / Tested |
| DR-COURSE-02 | Course stored in localStorage + cookie | `src/hooks/use-course.ts` | TC-PRAC-01 | Implemented / Tested |
| DR-COURSE-03 | Inline course selector on all major pages | `src/components/CourseSelectorInline.tsx` | TC-PRAC-01 | Implemented / Tested |

### Practice Engine

| Req ID | Requirement Summary | Implementation File(s) | Test Case(s) | Status |
|--------|--------------------|-----------------------|-------------|--------|
| DR-PRAC-01 | Session creation: type, unit, difficulty, course, AI gate | `src/app/api/practice/route.ts` | TC-PRAC-01, TC-PRAC-06 | Implemented / Tested |
| DR-PRAC-02 | MCQ answer submission with feedback | `src/app/api/practice/[id]/route.ts` | TC-PRAC-02 | Implemented / Tested |
| DR-PRAC-03 | FRQ submission with AI scoring | `src/app/api/practice/[id]/route.ts`, `src/lib/ai.ts` | TC-PRAC-03 | Implemented / Tested |
| DR-PRAC-04 | Session completion + mastery update | `src/app/api/practice/[id]/route.ts` (PATCH) | TC-PRAC-04 | Implemented / Tested |
| DR-PRAC-05 | Adaptive question selection (unseen/incorrect priority) | `src/app/api/practice/route.ts` (question ordering) | TC-PRAC-01 | Implemented / Tested |
| DR-PRAC-06 | AI question generation when bank insufficient | `src/lib/ai.ts` (generateQuestion), `src/app/api/practice/route.ts` | TC-PRAC-05 | Implemented / Tested |

### Mock Exam

| Req ID | Requirement Summary | Implementation File(s) | Test Case(s) | Status |
|--------|--------------------|-----------------------|-------------|--------|
| DR-MOCK-01 | Mock exam session with course-specific timing | `src/app/(dashboard)/mock-exam/`, `src/app/api/practice/route.ts` | TC-MOCK-01–03 | Implemented / Tested |

### Analytics

| Req ID | Requirement Summary | Implementation File(s) | Test Case(s) | Status |
|--------|--------------------|-----------------------|-------------|--------|
| DR-ANAL-01 | Per-unit mastery scores | `src/app/api/analytics/route.ts` | TC-ANAL-01 | Implemented / Tested |
| DR-ANAL-02 | Overall accuracy, XP, level, streak | `src/app/api/analytics/route.ts` | TC-ANAL-02 | Implemented / Tested |
| DR-ANAL-03 | Session history | `src/app/api/analytics/route.ts` | TC-ANAL-03 | Implemented / Tested |

### AI Tutor

| Req ID | Requirement Summary | Implementation File(s) | Test Case(s) | Status |
|--------|--------------------|-----------------------|-------------|--------|
| DR-TUTOR-01 | Chat with structured AP response | `src/app/api/ai/tutor/route.ts`, `src/lib/ai.ts` | TC-TUTOR-01 | Implemented / Tested |
| DR-TUTOR-02 | Streaming for Premium users | `src/app/api/ai/tutor/stream/route.ts` | TC-TUTOR-02 | Implemented / Tested |
| DR-TUTOR-03 | Follow-up question chips | `src/lib/ai.ts` (FOLLOW_UPS parser), `src/app/(dashboard)/ai-tutor/` | TC-TUTOR-03 | Implemented / Tested |
| DR-TUTOR-04 | Conversation history per course | `src/app/api/ai/tutor/route.ts` (GET), `prisma/schema.prisma` (TutorConversation) | TC-TUTOR-04 | Implemented / Tested |
| DR-TUTOR-05 | Daily conversation limit for FREE tier | `src/app/api/ai/tutor/route.ts` (limit check) | TC-TUTOR-01 | Implemented / Tested |

### Study Plan

| Req ID | Requirement Summary | Implementation File(s) | Test Case(s) | Status |
|--------|--------------------|-----------------------|-------------|--------|
| DR-PLAN-01 | Static template when < 20 questions answered | `src/app/api/study-plan/route.ts`, `src/lib/ai.ts` | TC-PLAN-01 | Implemented / Tested |
| DR-PLAN-02 | AI-personalized plan when ≥ 20 questions answered | `src/app/api/study-plan/route.ts`, `src/lib/ai.ts` (generateStudyPlan) | TC-PLAN-02 | Implemented / Tested |

### Billing

| Req ID | Requirement Summary | Implementation File(s) | Test Case(s) | Status |
|--------|--------------------|-----------------------|-------------|--------|
| DR-BILL-01 | Stripe checkout session | `src/app/api/checkout/route.ts` | TC-BILL-01 | Implemented / Blocked |
| DR-BILL-02 | Customer portal session | `src/app/api/billing/portal/route.ts` | TC-BILL-02 | Implemented / Blocked |
| DR-BILL-03 | Webhook: subscription created/updated/deleted | `src/app/api/webhooks/stripe/route.ts` | TC-BILL-03–04 | Implemented / Blocked |

### Gamification

| Req ID | Requirement Summary | Implementation File(s) | Test Case(s) | Status |
|--------|--------------------|-----------------------|-------------|--------|
| DR-GAME-01 | XP awarded on correct MCQ answer | `src/app/api/practice/[id]/route.ts` | TC-GAME-01 | Implemented / Tested |
| DR-GAME-02 | Daily practice streak tracking | `src/app/api/practice/[id]/route.ts` | TC-GAME-02 | Implemented / Tested |
| DR-GAME-03 | Achievement badge unlock | `src/app/api/practice/[id]/route.ts`, `prisma/schema.prisma` (Achievement) | TC-GAME-03 | Implemented / Tested |

### Feature Flags

| Req ID | Requirement Summary | Implementation File(s) | Test Case(s) | Status |
|--------|--------------------|-----------------------|-------------|--------|
| DR-FLAG-01 | `premium_feature_restriction` gates FRQ/paid features | `src/app/api/practice/route.ts`, SiteSetting DB | TC-FLAG-01 | Implemented / Tested |
| DR-FLAG-02 | `ai_generation_enabled` gates AI question creation | `src/app/api/practice/route.ts`, SiteSetting DB | TC-FLAG-02 | Implemented / Tested |
| DR-FLAG-03 | `registration_enabled` gates new registrations | `src/app/api/auth/register/route.ts`, SiteSetting DB | TC-AUTH-01 | Implemented / Tested |

### Admin

| Req ID | Requirement Summary | Implementation File(s) | Test Case(s) | Status |
|--------|--------------------|-----------------------|-------------|--------|
| DR-ADMIN-01 | Question approve/reject | `src/app/api/admin/questions/route.ts` | TC-ADMIN-01 | Implemented / Tested |
| DR-ADMIN-02 | Bulk AI question generation | `src/app/api/admin/populate-questions/route.ts` | TC-ADMIN-02 | Implemented / Tested |
| DR-ADMIN-03 | Feature flag toggle | `src/app/api/admin/flags/route.ts` | TC-ADMIN-03 | Implemented / Tested |
| DR-ADMIN-04 | User list view | `src/app/api/admin/users/route.ts`, `src/app/(dashboard)/admin/` | TC-ADMIN-04 | Implemented / Tested |

### Documentation

| Req ID | Requirement Summary | Implementation File(s) | Test Case(s) | Status |
|--------|--------------------|-----------------------|-------------|--------|
| DR-DOCS-01 | Docs browser with 6 document cards | `src/app/(dashboard)/docs/page.tsx` | TC-DOCS-01 | Implemented / Tested |
| DR-DOCS-02 | Document download as .md | `public/docs/*.md`, docs page download links | TC-DOCS-02 | Implemented / Tested |
| DR-DOCS-03 | Print / save PDF | `src/app/(dashboard)/docs/page.tsx` (print styles + button) | TC-DOCS-03 | Implemented / Tested |

---

## Document Change Log

| Version | Date | Change Summary |
|---------|------|---------------|
| 1.4 | 2026-03-15 | Initial RTM — 55 requirements traced across HLR + DR; includes DR-AUTH-06/07 (password reset) |
