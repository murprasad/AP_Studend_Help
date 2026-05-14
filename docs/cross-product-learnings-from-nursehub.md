# Cross-product learnings from NurseHub deep-dive (2026-05-13)

Source: `docs/competitor-analysis-nursehub-2026-05-13.md`.
Applies to: **StudentNest (AP/SAT/ACT)** and **PrepLion (CLEP, and future TEAS/GRE)**.

NurseHub's competitive footprint isn't TEAS-only — most of their patterns
apply to test-prep generally. This doc maps each learning to specific
artifacts in our codebase / plan that change as a result. Items marked
**[wire now]** get implementation work; **[memo]** stays on paper until
relevant; **[do not adopt]** is recorded explicitly so we don't drift.

---

## 1. Pass Guarantee — match it, with tighter completion definition **[wire now for SN+PL]**

NurseHub: complete the course → fail the exam → 100% refund + $130 retake.
That's the strongest trust moat in the category.

**Decision:** match across **all** our paid tiers, with a tighter definition that
caps our liability:

- Complete ≥80% of generated study plan items (we already track this)
- Take ≥3 full-length mock exams with ≥75 average score
- Submit failure proof (score screenshot + exam date confirmation)
- → 100% refund + we cover the official exam retake fee

**Cost model:** at <1% failure rate among engaged users (well under industry
4-6%), ~$2/converted user reserve. Cheaper than equivalent paid acquisition.

**Schema changes needed:**
- `User.passGuaranteeEligible Boolean @default(false)` (auto-flipped when criteria met)
- `User.passGuaranteeRedeemedAt DateTime?`
- `User.passGuaranteeRefundAmount Int?` (in cents)

**UI surface:** prominent badge on `/pricing` page; dashboard banner when
user crosses the 80% completion threshold ("You qualify for the
pass guarantee").

**Plan files affected:** `docs/TEAS-build-plan.md` (already noted),
`prisma/schema.prisma` (next product-feature commit), `src/lib/auth.ts`
(JWT now carries `passGuaranteeEligible` for SSR rendering).

---

## 2. Testimonial format with named-school + score + photo **[wire now for SN+PL marketing]**

NurseHub: quote + photo + named school + score. Schools include Chamberlain,
Cal State, Broward, Illinois Valley CC — high-trust specific institutions, not "John D., Texas."

**Decision:** mirror exactly. For SN, collect testimonials post-AP-exam with
named HS + AP-score + headshot. For PL, named college + CLEP score + headshot.

**Implementation:** update `src/components/marketing/testimonial-card.tsx` (new
or existing component) to require all four fields. Replace any "John S." or
"Texas Student" with full named testimonials at next opportunity.

**Acquisition:** offer post-exam email coupon ($5 Amazon GC) for testimonial
submission with school + score + photo. Standard pattern, ~5% conversion.

---

## 3. Bundle pricing — match it for SAT/ACT and CLEP **[wire now]**

NurseHub bundles TEAS + HESI ($29.99). Their NCLEX is separate. Cross-sell logic
is clear: pre-nursing students need both TEAS AND HESI.

**Decision:** apply same pattern:

| Bundle | Logic | Price suggestion |
|---|---|---|
| StudentNest "All Access" | AP + SAT + ACT (most students prep multiple) | $14.99/mo (vs $9.99 single) |
| PrepLion "CLEP Suite" | All 34 CLEP courses | $14.99/mo (vs $9.99 single) |
| PrepLion "Nursing Path" | TEAS + HESI when built | $19.99/mo |
| Cross-product "Career Path" | StudentNest + PrepLion | $24.99/mo |

The bundle doesn't have to be 2× single price — anchoring at 1.5× is the
right elasticity per category research. Captures the natural "I'm also
prepping for X" segment.

**Plan files affected:** `src/lib/pricing.ts` (new), Stripe price IDs in
env vars (new SKUs), pricing page redesign in next sprint.

---

## 4. Mobile-first / PWA + offline-capable **[wire now for both products]**

NurseHub has NO native app. Web-only. Day-of-exam, nursing students review on
phones at the testing center; AP students review during commutes / lunch.

**Decision:** ship PWA with offline-capable practice cache.

**Implementation:**
- `public/manifest.json` (we already serve this for SN)
- `src/app/sw.js` already present — extend to cache last 50 questions answered + Sage explanations
- Add `<link rel="manifest">` install prompt + iOS-specific home-screen-icon meta
- Test offline practice flow in `tests/e2e/pwa-offline-practice.spec.ts` (new)

**Performance budget:** <1s LCP on mobile, <100ms FID, <0.1 CLS. NurseHub
ships ~2-3s LCP on mobile per public asset audit; this is a measurable wedge.

**Plan files affected:** `next.config.js` (PWA tightening), `public/_headers`
(Service-Worker scope), `tests/e2e/pwa-offline-practice.spec.ts` (new).

---

## 5. Performance moat — codify <1s LCP as engineering invariant **[wire now]**

NurseHub: WordPress + Cloudways + heavy testimonial imagery → 2-3s LCP mobile.
We have a real, measurable wedge by virtue of stack choice (Next.js + CF Pages + edge auth).

**Decision:** make LCP <1s on every marketing page and dashboard a hard
deploy gate. Add a Lighthouse-CI check to `pages:deploy:staging` script.

**Implementation:**
- `scripts/lighthouse-budget-check.js` (new) — runs Lighthouse against
  staging preview URL with a budget JSON; fails staging gate if LCP > 1000ms
  on `/`, `/pricing`, `/ap-prep`, `/sat-prep`, `/act-prep`, `/dashboard`
- Add to `scripts/deploy-staging.js` after Playwright suite

**Implication:** any new component or import that pushes LCP above 1s is
blocked at staging gate. Forces continuous performance discipline.

---

## 6. Named team page builds B2B and B2C trust **[wire now for both products]**

NurseHub's `/team/` page lists 6 named team members with credentials. The
nursing-credentialed members (Leigh = 25y RN + 15y nursing ed; Ana = RN +
Product Designer) carry massive trust weight specifically for nursing
students.

**Decision:** publish public `/team/` pages for both products. For SN,
list any AP-teaching credentials or AP-grader experience contributors.
For PL, list any nursing-credentialed contributors when TEAS lands.

**Implementation:** `src/app/(marketing)/team/page.tsx` (both repos),
with a `data/team.json` source-of-truth file. Photos, names, roles,
credentials, links.

**ROI:** B2B (school partnership channel) almost requires a team page
before institutional sales. B2C trust signal alongside the testimonials
described in §2.

---

## 7. Domain-specialist judges — generalize the BiomedLM pattern **[wire now for ensemble-judge]**

In `docs/TEAS-build-plan.md` we proposed BiomedLM as a 6th specialist
judge for TEAS_SCIENCE A&P questions. The pattern generalizes:

| Course family | Suggested specialist judge | Why |
|---|---|---|
| TEAS_SCIENCE, CLEP_BIOLOGY | BiomedLM (Stanford, free HF) | A&P + life-sci factual depth |
| AP_PHYSICS_* | Qwen2-Math or DeepSeek-Math | Symbolic math + units |
| AP_CHEMISTRY, CLEP_CHEMISTRY | Chemma-7B (chemistry-tuned) | Reaction balancing + nomenclature |
| AP_COMPUTER_SCIENCE_* | StarCoder2-Code or DeepSeek-Coder | Code-trace accuracy |
| AP_US_HISTORY, AP_WORLD_HISTORY, CLEP_HUMANITIES | None — generalist judges are strong enough here | Verified by today's sweep success rate |

**Decision:** extend `src/lib/expansion-pipeline-config.ts` to support
`specialistJudges?: string[]` per course prefix. The ensemble code in
`src/lib/ensemble-judge.ts` already accepts `courseId` and reads config;
extending it to dynamic-load specialist judges is a small add.

**Implementation:** add `callBiomedLM()`, `callMathSpecialist()`,
`callCodeSpecialist()` to `ensemble-judge.ts`. Configured per-prefix.
HF Inference API is free for these; same `fetch + AbortSignal.timeout`
pattern as existing judges.

---

## 8. Domain-credentialed human reviewer on monthly retainer **[wire now in budget for both products]**

NurseHub's content moat is **Leigh** (25y RN). We've planned a single-weekend
nursing-TA reviewer in `docs/TEAS-build-plan.md` Layer 6. The lesson from
NurseHub is to **make this a permanent retainer**, not a one-off:

| Product / course family | Reviewer | Rate |
|---|---|---|
| PrepLion TEAS Science / A&P | Practicing nurse educator | $500/mo for 8-10 hr/week |
| PrepLion CLEP Biology / Chemistry / Calculus | Subject-specific TA | $300/mo on rotation |
| StudentNest AP STEM (Calc, Phys, Chem, Bio) | Recent AP-5 student + AP-grader contact | $200/mo |
| StudentNest AP Humanities | Recent AP-5 student | $150/mo |

**Decision:** add these as line items to product margins. ~$1,000-$1,500/mo
total ongoing. Cost is amortized across thousands of users — fractional cents
per user/month — for outsized trust signal.

**Plan files affected:** `docs/TEAS-build-plan.md` (already noted retainer),
new `docs/reviewer-retainer-program.md` (next commit).

---

## 9. University partnerships as B2B channel **[memo — pursue post-TEAS launch]**

NurseHub has a "University Partnerships" nav item. Likely a free / discounted
institutional license for the nursing school in exchange for testimonial
rights + analytics access. Both AP-prep (high schools) and CLEP/TEAS
(community colleges + nursing programs) have natural institutional
buyers.

**Decision:** **not yet.** B2B sales cycle is 6-12 months and we're a small
team. Park this until we have both:
- ≥10,000 active free users in any product (statistical authority)
- A documented user-improvement metric (e.g., "users score X% higher on
  TEAS Science after 4 weeks")

Then pursue 5 community college partnerships per quarter starting Q3 2026.

---

## 10. Pricing positioning — always 50% under category leader **[memo + wire when TEAS lands]**

NurseHub TEAS = $29.99/mo. Our planned PL TEAS = $14.99/mo. We're 50% under.
That's the right elasticity — close enough that they look expensive,
far enough that we look genuinely cheaper not just "race-to-bottom."

Apply same pattern to future verticals:
- GRE: ETS gives nothing free; Magoosh $99/mo. We launch at $19.99/mo.
- ASVAB: PocketPrep $24.99/mo. We launch at $9.99/mo.
- PSAT: SAT prep already at $9.99 — keep PSAT at $9.99 too (same StudentNest tier).

**Decision:** codify in `docs/pricing-strategy.md` (new in next commit).

---

## 11. Free diagnostic as lead magnet — we already do this, lean harder **[wire now in marketing]**

NurseHub's free diagnostic tests per section are their lead magnet — un-paywalled,
high-quality, signal of bank quality. We already have `/diagnostic` for free
users. But our landing pages don't push it as hard.

**Decision:** add prominent "Free 3-minute diagnostic" CTA on:
- StudentNest homepage hero
- All four `/ap-prep`, `/sat-prep`, `/act-prep` pages
- PrepLion homepage hero
- All CLEP course landing pages

Use existing `<HeroReadinessPicker>` component on SN. Build equivalent for PL.

**Implementation:** copy + CTA changes in `src/app/page.tsx` + `(marketing)/*`.
~half a day of work.

---

## 12. Question-type coverage as schema commitment **[wire now in TEAS plan]**

NurseHub explicitly teaches all 4 new TEAS 7 question types. Our MCQ-only
schema doesn't natively support Hot Spot or Ordered Response. **Multi-Select**
and **Fill-in-the-Blank** are within reach in v1.

**Decision (already in `docs/TEAS-build-plan.md` update):**
- v1 TEAS: MCQ + Multi-Select + Fill-in-the-Blank
- v2 TEAS: add Hot Spot + Ordered Response

**Cross-product implication:** some AP exams use grid-in (numeric Fill-in-Blank).
AP Calc + AP Stats + AP Physics have grid-in items on the real exam. Adding
Fill-in-Blank for TEAS auto-unlocks better AP coverage. Net positive.

**Schema additions** (planned for next product-feature migration):
```prisma
enum QuestionType {
  MCQ
  FRQ
  SAQ
  LEQ
  DBQ
  CODING
  MULTI_SELECT      // NEW — TEAS + some AP
  FILL_IN_BLANK     // NEW — TEAS + AP grid-ins
  HOT_SPOT          // NEW — v2 TEAS
  ORDERED_RESPONSE  // NEW — v2 TEAS
}
```

---

## 13. Pass-rate claims with disclosed methodology **[memo for marketing]**

NurseHub claims 94% / 98% pass rate (inconsistent across pages) with no methodology.
Pre-nursing forums are skeptical but tolerant — the claim still converts.

**Decision:** claim what's defensible, disclose methodology in a tooltip /
footnote.

For StudentNest AP, claim once we have data:
- "X% of users who completed ≥80% of their study plan scored ≥3 on the AP exam"
- Footnote with sample size + methodology

For PrepLion TEAS, after launch + 6 months data:
- "Y% of TEAS prep users with ≥80% completion passed first try"
- Disclose denominator

Don't ship pre-data — better to have no claim than a soft one.

---

## 14. Anti-pattern: "Real Exam Questions" claim **[do not adopt]**

NurseHub's `nursehub.shop` sibling site claims "Real 2026 Questions from
completed TEAS and HESI exams." That's the kind of brain-dump / content-leakage
claim ATI legally pursues. We **never** match this framing.

**Decision:** every TEAS marketing surface explicitly says:
> "Original questions modeled on the ATI TEAS 7 blueprint. We do not
> use questions from any actual exam."

Same hard rule for any future exam (GRE, ASVAB, etc.).

---

## 15. 24/7 human Learner Success — replace with Sage tutor **[already done]**

NurseHub's 24/7 Learner Experience Team is operationally expensive (probably
their largest non-content cost line). It's their substitute for what we
already have built: **Sage AI tutor.** Available 24/7 by definition, costs
us cents per conversation, scales to millions of users.

**Decision:** in TEAS marketing, lead with:
> "Sage Tutor available 24/7. Real explanations, not stock answers.
> Personalized to where you're stuck. (NurseHub charges $29.99/mo for
> human support that's usually a chatbot anyway.)"

**Implementation:** copy work only, no engineering.

---

## Summary — changes by category

| Category | Items | Effort |
|---|---|---|
| **Wire now (engineering)** | §1 schema, §4 PWA, §5 LCP gate, §7 specialist judges, §10 pricing-strategy doc, §11 diagnostic CTA, §12 schema enums | ~2 weeks dev across both products |
| **Wire now (content/marketing)** | §2 testimonials, §3 bundle pricing UI, §6 team page, §13 pass-rate copy, §15 Sage positioning | ~1 week marketing |
| **Wire now (ops)** | §1 pass guarantee, §8 reviewer retainers | ~$1,500/mo ongoing + setup |
| **Memo only** | §9 university partnerships, §10 future pricing | revisit Q3 2026 |
| **Do NOT adopt** | §14 "real exam questions" claim | hard rule |

---

## Sequencing relative to current state

1. **Right now / today:** save these docs, commit, memory pointer. ✅ (this work)
2. **Next sweep cycle:** wire §1 pass-guarantee schema, §11 diagnostic CTA, §12 schema enums
3. **PSAT week (next):** apply §5 LCP gate, §6 team page, §7 specialist judges
4. **TEAS month (after PSAT):** apply §2 testimonials, §3 bundle pricing, §4 PWA, §8 reviewer retainer, §13 pass-rate copy, §15 Sage positioning
5. **Post-TEAS Q3 2026:** revisit §9 university partnerships, §10 future pricing
