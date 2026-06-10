# Master Action Pipeline — 2026-05-13

Single source of truth for every backlog item across StudentNest + PrepLion.
Read this first when resuming work. Each item has owner, status,
estimated effort, dependencies, and the file paths that change.

Updated whenever items move status. Source docs referenced inline.

---

## Currently in flight (background, do not interrupt)

| Job ID | Product | Description | ETA |
|---|---|---|---|
| `bzdgm1wh0` | PrepLion | CLEP second-pass — drive 25 sub-95%-silver CLEP courses to ≥95% via serial concurrency=2 sweeps. Worst-gap-first ordering. | ~3 hrs from start (started ~21:00 UTC 2026-05-13) |
| `b6jhs71km` | StudentNest | SAT/ACT third pass — drive remaining 5 SAT/ACT courses to ≥95% silver via serial concurrency=1 sweeps. | ~30 min from start |

Question generation across both products is **parallel** — independent
processes, independent DBs, independent judge pools. No conflict.

---

## Batch 1 — Top-3 high-impact NurseHub-derived changes

User chose option A on 2026-05-13 evening: focus on the top 3 highest-leverage
items first. Each is independent and shippable as a separate commit.

### B1.1 — Pass Guarantee (revenue lever, #1 impact)

**Why #1:** NurseHub's strongest moat — financial commitment to outcome
converts paid signups at materially higher rates than any other trust signal.
Direct revenue lever.

| Slice | Files | Status | Estimate |
|---|---|---|---|
| `<PassGuaranteeBadge>` component | `src/components/marketing/pass-guarantee-badge.tsx` (new) | This commit | 1 hr |
| Wire badge into `/pricing` | `src/app/(marketing)/pricing/page.tsx` | This commit | 30 min |
| Wire badge into course landing pages | `src/app/(marketing)/{ap,sat,act}-prep/page.tsx` (StudentNest), `(marketing)/clep-prep/page.tsx` (PrepLion) | This commit | 30 min |
| Playwright spec — badge visibility + click | `tests/e2e/pass-guarantee-badge.spec.ts` (new) | This commit | 30 min |
| Schema fields: `User.passGuaranteeEligible Boolean`, `passGuaranteeRedeemedAt DateTime?`, `passGuaranteeRefundCents Int?` | `prisma/schema.prisma`, migration | **Batch 2** | 2 hrs |
| Eligibility cron — auto-flip `passGuaranteeEligible` when criteria met (80% study plan + 3 mock exams + 75 avg) | `src/app/api/cron/pass-guarantee-eligibility/route.ts` (new) | **Batch 2** | 4 hrs |
| Refund-claim flow page | `src/app/(dashboard)/billing/pass-guarantee/page.tsx` (new) | **Batch 2** | 4 hrs |
| Dashboard banner when eligible | `src/components/dashboard/pass-guarantee-banner.tsx` (new) | **Batch 2** | 2 hrs |
| Stripe refund logic + ATI/exam-fee reimbursement | `src/app/api/billing/pass-guarantee-claim/route.ts` (new) | **Batch 3** | 1 day |
| Policy page — terms of pass guarantee | `src/app/(marketing)/pass-guarantee/page.tsx` (new) | **Batch 2** | 2 hrs |

### B1.2 — <1s LCP staging gate (structural performance moat, #3 impact)

**Why #3:** Locks in our structural performance advantage over WordPress
competitors (NurseHub ships 2-3s LCP; we ship sub-1s). Makes any future
"let's import this big lib" PR fail at staging instead of silently
eroding the moat.

| Slice | Files | Status | Estimate |
|---|---|---|---|
| `scripts/lighthouse-budget-check.js` — runs Lighthouse against staging preview URL with budget JSON | `scripts/lighthouse-budget-check.js` (new) | This commit | 3 hrs |
| Wire into `pages:deploy:staging` after Playwright | `scripts/deploy-staging.js` | This commit | 30 min |
| Budget config: LCP ≤ 1000ms marketing, ≤ 1500ms authed | `.lighthouserc.json` (new) | This commit | 30 min |
| First baseline measurement + bug-fix any current regressions | `data/lighthouse-baseline-2026-05-13.json` | This commit | 1 hr |
| Mirror to PrepLion | same paths in PL repo | This commit | 30 min |

### B1.3 — Mobile PWA + offline practice cache (UX moat, #2 impact)

**Why #2:** No competitor (NurseHub, Mometrix, Smart Edition) has native
or offline. Owning mobile-offline is a structural wedge.

| Slice | Files | Status | Estimate |
|---|---|---|---|
| Extend `/sw.js` to cache last 50 answered Qs + Sage explanations | `public/sw.js` | **Batch 2 — committed separately** | 1 day |
| `use-offline-practice` hook — read from IndexedDB when offline | `src/hooks/use-offline-practice.ts` (new) | **Batch 2** | 4 hrs |
| `manifest.json` audit + iOS install prompt + Android A2HS hint | `public/manifest.json`, `src/components/app/install-prompt.tsx` (new) | **Batch 2** | 4 hrs |
| Playwright PWA-offline regression test | `tests/e2e/pwa-offline-practice.spec.ts` (new) | **Batch 2** | 2 hrs |
| Mirror to PrepLion | same paths in PL repo | **Batch 2** | 4 hrs |

**Deferred to Batch 2** because PWA work requires a focused 2-day commit with
its own test pass; mixing it into Batch 1 risks the cleaner deliverables
shipping behind it. Spec'd here so nothing is lost.

---

## Batch 2 — Pass Guarantee schema + cron + PWA

Triggered by Batch 1 promote landing clean. Builds the actual eligibility
tracking + refund flow on top of the badge UI that ships in Batch 1.
See B1.1 and B1.3 slices marked **Batch 2** above.

Estimated wall-clock: 3 dev-days across both products.

---

## Batch 3 — Marketing surfaces + bundle pricing

| Slice | Files | Trigger | Estimate |
|---|---|---|---|
| `<TestimonialCard>` with required `school` + `score` + `photo` props | `src/components/marketing/testimonial-card.tsx` (refactor or new) | After 5 named-school testimonials collected post-AP-exam | 1 day |
| Testimonial-collection email cron post-AP-exam (with $5 GC offer) | `src/app/api/cron/testimonial-request/route.ts` (new) | Pre-cycle for next AP season (Sep 2026) | 4 hrs |
| Per-plan register URLs `/register/[plan]/page.tsx` for UTM attribution | `src/app/(auth)/register/[plan]/page.tsx` (new) | This batch | 4 hrs |
| Bundle SKUs in Stripe + `User.subscriptionBundleType` schema field | `prisma/schema.prisma`, env vars, `src/lib/pricing.ts` (new) | After business decision on bundle pricing | 1 day |
| `<CrossCourseStreak>` widget on dashboard | `src/components/dashboard/cross-course-streak.tsx` (new) | This batch | 4 hrs |
| `<SocialProofRow>` linking external social handles | `src/components/marketing/social-proof-row.tsx` (new) | After social presence established | 2 hrs |
| Public `/team/` page on both products | `src/app/(marketing)/team/page.tsx` (new), `data/team.json` | This batch | 4 hrs |
| Free-diagnostic CTA in hero across all marketing pages | edit `src/app/page.tsx`, all `(marketing)/*` | This batch | 4 hrs |

Estimated wall-clock: ~3 dev-days across both products.

---

## Batch 4 — TEAS-specific (gated on PSAT shipping + ATI manual purchase)

See `docs/TEAS-build-plan.md` for the full plan. Key items wired today:

| Slice | Status | Trigger |
|---|---|---|
| `MULTI_SELECT` + `FILL_IN_BLANK` `QuestionType` enums + render components | Spec saved | TEAS month |
| BiomedLM specialist judge for `TEAS_SCIENCE` | Config saved in `expansion-pipeline-config.ts` | TEAS month |
| Canonical A&P fact-table validator | Spec saved | TEAS month |
| `HOT_SPOT` + `ORDERED_RESPONSE` question types | Deferred to v2 | After v1 TEAS launches |
| Permanent nursing-educator retainer ($500/mo) | Budget noted | TEAS launch |

---

## Batch 5 — PSAT (gated on current sweeps finishing)

See `docs/PSAT-build-plan.md`. ~1 week / ~$30 total. Derives from
gold-standard SAT bank with `difficultyCap=MEDIUM` filter; NMSQT
Selection Index calculator is the conversion hook.

| Slice | Status |
|---|---|
| `PSAT_MATH`, `PSAT_READING_WRITING` enums | Spec saved |
| `scripts/derive-psat-from-sat.ts` | Spec saved |
| NMSQT Selection Index calculator UI | Spec saved |
| `/psat-prep` + `/psat-nmsqt` marketing pages | Spec saved |

---

## Batch 6 — Memo only / out of scope this quarter

| Item | Trigger to revisit |
|---|---|
| University Partnerships B2B channel | Q3 2026, when ≥10K active free users in any product |
| 50%-under-category-leader pricing invariant codification | Codify in `docs/pricing-strategy.md` when bundle SKUs land |
| Pass-rate claims with disclosed methodology | After 6 months of TEAS data; otherwise no claim |
| Server-side analytics framework | After Batch 3 ships, when we have user-event volume to instrument |
| A/B test framework (`feature_assignments` table) | Same trigger as analytics |

---

## DO NOT adopt (hard rules)

- **"Real Exam Questions"** claim → ATI IP infringement risk (NurseHub's
  sibling `nursehub.shop` makes this claim; we never do)
- **DSST** courses in PrepLion → user-excluded per
  `feedback_preplion_no_dsst_focus.md`
- **ACCUPLACER** as expansion priority → out of scope this sprint
- **Ship-MVP-first** for new exam verticals → first 200 Qs must match
  style fingerprint per `feedback_understand_before_design.md`
- **Skip-hooks** on git commits / **bypass-signing** → per CLAUDE.md
  unless explicitly authorized

---

## Source docs

| Topic | Path |
|---|---|
| NurseHub deep-dive | `docs/competitor-analysis-nursehub-2026-05-13.md` |
| 15-pattern cross-product learnings | `docs/cross-product-learnings-from-nursehub.md` |
| TEAS build plan | `docs/TEAS-build-plan.md` |
| PSAT build plan | `docs/PSAT-build-plan.md` |
| Expansion pipeline architecture | `docs/expansion-pipeline.md` (referenced in TEAS plan) |
| Comprehensive Batch 1 test plan | `docs/comprehensive-test-plan-batch1.md` |
| This pipeline | `docs/action-plan-pipeline-2026-05-13.md` |
