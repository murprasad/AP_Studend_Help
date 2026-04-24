# StudentNest Path Coverage Matrix

**Locked 2026-04-24.** Every navigable user path must have a passing
Playwright spec. This doc is the contract; `scripts/audit-path-coverage.mjs`
audits actual coverage against this matrix.

Status legend: ✅ passing spec exists · 🟡 partial · ❌ missing · 🔵 not yet shipped

---

## 1. Public entry-point matrix

### 1.1 Landing page (/)

| CTA / link | Expected destination | Test status |
|---|---|---|
| Top nav: "Sign in" | /login | ❌ |
| Top nav: "Get started" | /register | ❌ |
| Top nav: "Pricing" | /pricing | ❌ |
| Top nav: "Courses" | /#courses anchor | ❌ |
| Hero: "Start AP Prep — Free" | /register?track=ap | ❌ |
| Hero: "Start CLEP Prep — Free" | /register?track=clep | ❌ |
| AP audience card CTA | /register?track=ap | ❌ |
| CLEP audience card CTA | /register?track=clep | ❌ |
| SAT card CTA | /register?track=sat | ❌ |
| ACT card CTA | /register?track=act | ❌ |
| "How it works" CTA | /register | ❌ |
| Curriculum section CTA | /register | ❌ |
| Final CTA: "Start free" | /register | ❌ |
| Footer: About | /about | ❌ |
| Footer: Pricing | /pricing | ❌ |
| Footer: Contact | mailto: link | ❌ |
| Footer: Terms | /terms | ❌ |
| Footer: Privacy | /privacy | ❌ |

### 1.2 /pricing

| CTA | Expected | Test |
|---|---|---|
| "Get started free" | /register | ❌ |
| "Buy Premium monthly" | /api/checkout?plan=monthly | ❌ |
| "Buy Premium annual" | /api/checkout?plan=annual | ❌ |
| FAQ: refund policy expand | revealed text | ❌ |
| Toggle: monthly ↔ annual | price changes 9.99 ↔ 79.99 | ❌ |

### 1.3 /about

| CTA | Expected | Test |
|---|---|---|
| "Try Now" CTA | /register | ❌ |
| Pricing link | /pricing | ❌ |

### 1.4 /ap-prep, /sat-prep, /act-prep, /clep-prep (per-track marketing pages)

| Per page | Expected | Test |
|---|---|---|
| Hero CTA | /register?track={track} | ❌ |
| Course list CTAs | /register | ❌ |
| FAQ accordions expand | text revealed | ❌ |

### 1.5 Other marketing pages

| Page | CTAs | Test |
|---|---|---|
| /how-hard-is/[slug] | "Try free" → /register | ❌ |
| /am-i-ready | quiz → /register | ❌ |
| /pass-rates | "Start prep" → /register | ❌ |
| /wall-of-fame | testimonial CTAs → /register | ❌ |
| /resources (public) | resource links | ❌ |
| /sage-coach (public) | "Try Sage" → /register | ❌ |
| /warmup | "Sign up" → /register | ❌ |
| /terms | (no CTAs, just legal text) | ❌ |
| /privacy | (no CTAs) | ❌ |

---

## 2. Auth entry-point matrix

| Path | Test status |
|---|---|
| Email/password login (valid creds) → dashboard or /onboarding | 🟡 (auth.setup) |
| Email/password login (wrong password) → error | ❌ |
| Email/password login (unverified email) → error message | ❌ |
| Google OAuth login (existing user) → dashboard | ❌ |
| Google OAuth login (new user) → /onboarding | ❌ |
| Email/password register → verify-email screen (or auto-bypass in dev) | ❌ |
| Register?track=ap → AP track preselected | ❌ |
| Register?track=sat → SAT track preselected | ❌ |
| Register?track=act → ACT track preselected | ❌ |
| Register?track=clep → CLEP track preselected | ❌ |
| Reset-password flow (request → email → reset) | ❌ |
| Verify-email flow | ❌ |
| Logout button → / (signed out) | ❌ |

---

## 3. First-time user flow matrix (FRESH FIXTURE — `onboardingCompletedAt: null`)

| Step | Assertion | Test |
|---|---|---|
| Sign up → first request lands on /onboarding (not /dashboard) | 🔵 needs fresh fixture |
| /onboarding step 1: course picker shows correct courses for track | ❌ |
| /onboarding step 1: select course → click Continue | ❌ |
| /onboarding step 2: "How it works" → click Got it next | ❌ |
| /onboarding step 3: recommended action shown | ❌ |
| /onboarding step 4: plan picker shows Free + Premium cards with $9.99 | ❌ |
| Click "Start Free" → routes to /dashboard with no bounce | 🔵 needs fresh fixture |
| Click "Start Premium" → routes to /billing?utm_source=onboarding | 🟡 |
| After completion: navigate to /analytics → no bounce to /onboarding | 🔵 (tonight's bug) |
| After completion: navigate to /resources → no bounce | 🔵 (tonight's bug) |
| After completion: navigate to /billing → no bounce | 🔵 (tonight's bug) |
| After completion: useSession reflects onboardingCompletedAt non-null | 🔵 |

---

## 4. Returning user flow matrix (per tier: FREE × PREMIUM)

| Path | FREE assertion | PREMIUM assertion | Test |
|---|---|---|---|
| Sidebar → /dashboard | loads | loads | 🟡 |
| Sidebar → /practice | loads | loads | 🟡 |
| Sidebar → /flashcards | loads, shows correct course's cards | loads | 🟡 (course bug fixed tonight) |
| Sidebar → /diagnostic | loads | loads | ❌ |
| Sidebar → /mock-exam | loads, shows 5q paywall | unlimited | ❌ |
| Sidebar → /frq-practice | shows paywall + LOCK_COPY.frqLocked | unlocked | ✅ paywall-accuracy.spec |
| Sidebar → /ai-tutor | loads, 3-msg cap | unlimited | ❌ |
| Sidebar → /sage-coach | shallow plan | deep plan | ❌ |
| Sidebar → /community | loads | loads | ❌ |
| Sidebar → /analytics | diagnosis only (no prescription) | full prescription | ❌ |
| Sidebar → /study-plan | static template | personalized | ❌ |
| Sidebar → /resources | loads | loads | ❌ |
| Sidebar → /billing | shows current plan accurately | shows current plan | ✅ billing-page-consistency |

---

## 5. Plan-transition matrix

| Transition | Assertion | Test |
|---|---|---|
| Free → Premium monthly (Stripe checkout) | tier flips, ModuleSubscription created | 🔵 needs Stripe test mode |
| Free → Premium annual (Stripe checkout) | tier flips, periodEnd ~365d | 🔵 |
| Premium → Cancel | status=canceling, periodEnd preserved | ❌ |
| Canceling → Reactivate | status=active | ❌ |
| Annual → switch to Monthly | new periodEnd | ❌ |
| Per-module subscribe (AP only) | subscriptionTier=AP_PREMIUM, ModuleSub[ap]=active | ✅ webhook-helpers unit |
| Add second module (AP + SAT) | both modules active | ❌ |
| Webhook silent skip → reconcile cron recovery | user flipped within 60min | 🔵 needs Stripe test mode |
| Manual support flip | restorative DB write works | ✅ scripts exist |
| Stripe redirect missing → user lands on amber "activation pending" banner | ✅ billing-page-consistency |

---

## 6. Limit-hit matrix (per FREE_LIMITS row in tier-limits.ts)

| Limit | Test |
|---|---|
| practiceQuestionsPerDay=20 | exhaust → paywall + LOCK_COPY.practiceCap | ❌ |
| tutorChatsPerDay=3 | exhaust → paywall + LOCK_COPY.tutorCap | ❌ |
| mockExamQuestions=5 | reach Q5 → paywall + LOCK_COPY.mockExamPaywall | ❌ |
| frqAccess=false | landing on /frq-practice → paywall | ✅ paywall-accuracy |
| frqFreeAttempts=1 | use 1 → 2nd attempt blocked | ❌ |
| fullAnalytics=false | analytics shows diagnosis card but locks prescription | ❌ |
| sageCoachDeepPlan=false | sage-coach shows shallow plan | ❌ |
| flashcardSmartScheduling=false | flashcards in linear order | ❌ |
| diagnosticCooldownDays=14 | 2nd diagnostic <14d returns cooldown error | ❌ |

---

## 7. Cross-page state-sync matrix

After flipping a user FREE → AP_PREMIUM:

| Page / element | Expected within 1s of refresh | Test |
|---|---|---|
| /dashboard top badge | shows "Premium" | ❌ |
| /billing current plan card | shows AP Premium | ❌ |
| Sidebar plan indicator | shows "AP Premium" | ❌ |
| /frq-practice | no paywall | ❌ |
| /mock-exam | unlimited | ❌ |
| /analytics | full prescription | ❌ |
| /sage-coach | deep plan | ❌ |
| /api/billing/status | returns subscriptionTier=AP_PREMIUM | ✅ verify scripts |

---

## 8. Race-condition / re-render matrix

| Page | Test |
|---|---|
| /billing?success=1 polling | ✅ billing-flicker.spec |
| /practice timer + answer submission race | ❌ |
| /mock-exam countdown timer + auto-submit | ❌ |
| /diagnostic question advance race | ❌ |
| /sage-coach streaming chat tokens | ❌ |
| /flashcards next-card swipe race | ❌ |
| /onboarding step transition (4 steps) | ❌ |
| Session.update() side-effects (any page) | ❌ |
| Polling cleanup on unmount (no orphan setIntervals) | ❌ |

---

## 9. Permission matrix

| Path | ADMIN | STUDENT | Anonymous | Test |
|---|---|---|---|---|
| /admin | 200 | redirect /dashboard | redirect /login | 🟡 (middleware) |
| /admin/users | 200 | 403 | redirect /login | ❌ |
| /api/admin/* | 200 | 401/403 | 401 | ❌ |
| /api/cron/* | 200 (with secret) | 401 | 401 | ✅ unauth check exists |

---

## Audit progression

- **2026-04-24 baseline**: ~140 paths, 8 with passing specs (~5.7% coverage)
- **Phase 2 target (1 week)**: 50 paths covered (~36%)
- **Phase 3 target (1 month)**: 100 paths covered (~71%)
- **Phase 4 target (3 months)**: 130 paths covered (~93%); rest is admin/edge cases
