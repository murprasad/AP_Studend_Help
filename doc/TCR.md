# NovAP (AP SmartPrep) — Test Cases & Results

**Document ID:** TCR-001
**Version:** 1.4
**Last Updated:** 2026-03-15
**Status:** Active

---

## Status Summary

| Metric | Count |
|--------|-------|
| Total Test Cases | 43 |
| PASS | 38 |
| FAIL | 0 |
| BLOCKED | 5 |

*BLOCKED = requires live SMTP/Stripe credentials not available in dev environment.*

---

## 1. Authentication (TC-AUTH)

| ID | Description | Steps | Expected Result | Status | Notes |
|----|-------------|-------|-----------------|--------|-------|
| TC-AUTH-01 | User registration — happy path | POST `/api/auth/register` with valid email, password, firstName, lastName | 201 response; user created; verification email queued | PASS | Auto-verified in dev |
| TC-AUTH-02 | Login with valid credentials | POST `/api/auth/callback/credentials` with registered email + password | JWT cookie set; redirect to /dashboard | PASS | |
| TC-AUTH-03 | Email verification | Click verification link from email | Account emailVerified set; login allowed | BLOCKED | Requires SMTP |
| TC-AUTH-04 | Logout | Click logout in sidebar | JWT cookie cleared; redirect to /login | PASS | |
| TC-AUTH-05 | JWT contains required fields | Inspect NextAuth JWT callback | Token contains { id, email, role, subscriptionTier } | PASS | Verified via session endpoint |
| TC-AUTH-06 | Forgot password — registered email | POST `/api/auth/forgot-password` with known email | 200 `{ message: "If that email is registered, a reset link was sent." }` | BLOCKED | Requires SMTP |
| TC-AUTH-07 | Reset password — valid token | POST `/api/auth/reset-password` with valid non-expired token and new password ≥ 8 chars | 200 `{ message: "Password updated. You can now sign in." }`; login with new password succeeds | PASS | DB operations verified |

---

## 2. Practice Engine (TC-PRAC)

| ID | Description | Steps | Expected Result | Status | Notes |
|----|-------------|-------|-----------------|--------|-------|
| TC-PRAC-01 | Create MCQ practice session | POST `/api/practice` with `{ sessionType: "QUICK_PRACTICE", course: "AP_WORLD_HISTORY" }` | 201; session with 10 questions returned | PASS | |
| TC-PRAC-02 | Submit correct MCQ answer | POST `/api/practice/:id` with correct answerId | `{ correct: true, explanation: "..." }` returned; XP awarded | PASS | |
| TC-PRAC-03 | Submit FRQ answer | POST `/api/practice/:id` with `{ freeResponse: "essay text" }` | AI scoring response returned with score and feedback | PASS | |
| TC-PRAC-04 | Complete session | PATCH `/api/practice/:id` with `{ completed: true }` | Session marked complete; mastery updated | PASS | |
| TC-PRAC-05 | AI question generation | Request session when question bank is empty | AI-generated questions returned; session created | PASS | Requires GROQ_API_KEY |
| TC-PRAC-06 | FRQ blocked for FREE tier when restriction on | POST `/api/practice` with FRQ type, FREE tier, restriction flag ON | 403 `{ error, limitExceeded: true, upgradeUrl: "/pricing" }` | PASS | |

---

## 3. Mock Exam (TC-MOCK)

| ID | Description | Steps | Expected Result | Status | Notes |
|----|-------------|-------|-----------------|--------|-------|
| TC-MOCK-01 | Create mock exam session | POST `/api/practice` with `{ sessionType: "MOCK_EXAM", course: "AP_CALCULUS_AB" }` | Session with full exam question count; exam timing applied | PASS | |
| TC-MOCK-02 | Timer enforced in UI | Start mock exam; observe countdown timer | Timer decrements from course-specific duration; auto-submits on expiry | PASS | Client-side timer |
| TC-MOCK-03 | Submit mock exam | Complete all questions; PATCH complete | Estimated AP score (1–5) returned; session analytics updated | PASS | |

---

## 4. Analytics (TC-ANAL)

| ID | Description | Steps | Expected Result | Status | Notes |
|----|-------------|-------|-----------------|--------|-------|
| TC-ANAL-01 | Mastery chart per unit | GET `/api/analytics`; view /analytics page | Bar chart shows mastery % per unit for selected course | PASS | |
| TC-ANAL-02 | Overall accuracy | View analytics page | Accuracy % = correct answers / total answers across sessions | PASS | |
| TC-ANAL-03 | Session history list | View analytics page | Recent sessions listed with date, score, course, question count | PASS | |

---

## 5. AI Tutor (TC-TUTOR)

| ID | Description | Steps | Expected Result | Status | Notes |
|----|-------------|-------|-----------------|--------|-------|
| TC-TUTOR-01 | Chat response | POST `/api/ai/tutor` with question about AP content | Structured answer returned: concept, visual breakdown, exam framing, traps, memory hook | PASS | |
| TC-TUTOR-02 | Streaming (Premium) | POST `/api/ai/tutor/stream` from Premium account | SSE tokens stream progressively; full response assembled on client | PASS | Requires GROQ_API_KEY |
| TC-TUTOR-03 | Follow-up suggestions | View AI tutor after response | 3 follow-up question chips rendered below assistant message | PASS | |
| TC-TUTOR-04 | Conversation history | Return to /ai-tutor after prior session | Previous messages loaded from DB for selected course | PASS | |

---

## 6. Study Plan (TC-PLAN)

| ID | Description | Steps | Expected Result | Status | Notes |
|----|-------------|-------|-----------------|--------|-------|
| TC-PLAN-01 | Static template (< 20 questions) | Visit /study-plan with fewer than 20 answered questions | High-quality static weekly study template shown; no AI call made | PASS | |
| TC-PLAN-02 | AI-generated plan (≥ 20 questions) | Visit /study-plan with 20+ answered questions | Personalized plan generated by AI based on weak units and mastery scores | PASS | |

---

## 7. Billing (TC-BILL)

| ID | Description | Steps | Expected Result | Status | Notes |
|----|-------------|-------|-----------------|--------|-------|
| TC-BILL-01 | Stripe checkout | Click "Upgrade" on /pricing; complete Stripe checkout | Stripe session created; redirect to checkout.stripe.com | BLOCKED | Requires live Stripe keys |
| TC-BILL-02 | Customer portal | Visit /billing; click "Manage subscription" | Stripe customer portal session created; redirect to portal | BLOCKED | Requires live Stripe keys |
| TC-BILL-03 | Webhook tier update | Stripe sends `customer.subscription.created` event | User subscriptionTier updated to PREMIUM in DB | BLOCKED | Requires Stripe webhook |
| TC-BILL-04 | Cancel subscription | Cancel in Stripe portal | Stripe sends `customer.subscription.deleted`; tier downgraded to FREE | BLOCKED | Requires Stripe webhook |

---

## 8. Gamification (TC-GAME)

| ID | Description | Steps | Expected Result | Status | Notes |
|----|-------------|-------|-----------------|--------|-------|
| TC-GAME-01 | XP awarded on correct answer | Answer MCQ correctly | User XP incremented; displayed on dashboard | PASS | |
| TC-GAME-02 | Streak tracking | Practice on consecutive days | Streak counter incremented; displayed on dashboard | PASS | |
| TC-GAME-03 | Achievement badge unlock | Meet achievement condition (e.g. 10 correct answers) | Achievement badge displayed on dashboard | PASS | |

---

## 9. Feature Flags (TC-FLAG)

| ID | Description | Steps | Expected Result | Status | Notes |
|----|-------------|-------|-----------------|--------|-------|
| TC-FLAG-01 | Premium restriction flag | Set `premium_feature_restriction = true` in SiteSetting; attempt FRQ as FREE user | 403 response; upgrade prompt shown | PASS | |
| TC-FLAG-02 | AI generation flag | Set `ai_generation_enabled = false`; trigger session that needs AI questions | Practice session returns available bank questions only; no AI call | PASS | |
| TC-FLAG-03 | Free tier behavior when flag OFF | Set `premium_feature_restriction = false`; attempt FRQ as FREE user | FRQ session created successfully; no restriction applied | PASS | |

---

## 10. Admin Dashboard (TC-ADMIN)

| ID | Description | Steps | Expected Result | Status | Notes |
|----|-------------|-------|-----------------|--------|-------|
| TC-ADMIN-01 | Approve / reject question | Admin visits /admin; click approve/reject on pending question | Question status updated; removed from pending queue | PASS | |
| TC-ADMIN-02 | Bulk AI question generation | Admin clicks "Generate Questions" with course + unit selected | Background generation job started; questions appear in pending queue | PASS | |
| TC-ADMIN-03 | Toggle feature flag | Admin toggles `premium_feature_restriction` in /admin | SiteSetting updated in DB; flag read on next request | PASS | |
| TC-ADMIN-04 | View user list | Admin visits /admin user management | User list rendered with email, role, subscriptionTier, XP | PASS | |

---

## 11. Documentation (TC-DOCS)

| ID | Description | Steps | Expected Result | Status | Notes |
|----|-------------|-------|-----------------|--------|-------|
| TC-DOCS-01 | View docs page | Navigate to /docs | 6 document cards rendered (HLR, DR, HLD, ARCH, TCR, RTM) | PASS | |
| TC-DOCS-02 | Download document | Click ".md" download button on any doc card | Browser downloads the corresponding .md file | PASS | |
| TC-DOCS-03 | Print / Save PDF | Open a document; click "Print / Save PDF" | Browser print dialog opens with print-optimized styles applied | PASS | |

---

## 12. Password Reset UI (TC-PWRESET)

| ID | Description | Steps | Expected Result | Status | Notes |
|----|-------------|-------|-----------------|--------|-------|
| TC-PWRESET-01 | Forgot password link on login | Visit /login; click "Forgot password?" | /forgot-password page loads (no 404) | PASS | |
| TC-PWRESET-02 | Forgot password form — email submission | Enter any email on /forgot-password; submit | Success state shown: "Check your email for a reset link." | PASS | API always returns success |
| TC-PWRESET-03 | Reset password — valid token | Navigate to /reset-password?token=VALID_TOKEN; enter matching passwords ≥ 8 chars | "Password updated!" shown; login with new password works | PASS | |
| TC-PWRESET-04 | Reset password — expired/invalid token | Navigate to /reset-password?token=BAD_TOKEN; submit | "Invalid or expired token." error shown inline | PASS | |
| TC-PWRESET-05 | Reset password — password mismatch | Enter mismatched passwords on /reset-password | "Passwords do not match." client-side error before API call | PASS | |

---

## Document Change Log

| Version | Date | Change Summary |
|---------|------|---------------|
| 1.4 | 2026-03-15 | Initial TCR document — 43 test cases across 12 feature areas |
