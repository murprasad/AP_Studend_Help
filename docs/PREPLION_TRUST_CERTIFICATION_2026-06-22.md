# PrepLion Trust Certification Ledger — 2026-06-22

This is the current evidence ledger for the Trust #1 goal. A product is certified only when public claims, authenticated flow, content format, answer-key fidelity, and family semantics all pass.

## Status summary

| Product | Availability | Answer-key | Format / presentation | Browser flow | Public truth | Trust status |
|---|---|---|---|---|---|---|
| CLEP | Broadly healthy | ≥95% visible courses per V2 ledger | Most families pass; College Composition fails construct/presentation sample | Core flows healthy | Marketing contains stale DSST/count/tier claims | PARTIAL |
| SAT | Healthy | Math 96.4%, R&W 98.2% | 4-option and stimulus rules pass | Dashboard + course switching + practice propagation pass | Global pass-probability copy and StudentNest handoff remain stale | PARTIAL |
| ACT | Functional serving healthy | Figure-adjudicated ≈96–100% | 4-option fixed; Science visual presentation fails; Math visual coverage unproven | Dashboard + switching + practice propagation pass (10/10 current run) | Current public semantics pass | PARTIAL |
| TEAS | Publicly marketed | Not independently certified | MCQ/MULTI_SELECT serve; other item types fail | Default ALL session and fresh journey fail | Public landing claims availability | FAIL |
| Accuplacer | Retirement incomplete | Out of scope | Backend kill-switch returns clean unavailable response | Existing-user practice still advertises and starts disabled product | Shared nav/pricing still expose Accuplacer | FAIL retirement acceptance |
| DSST | Out of scope | N/A | N/A | N/A | Must be removed from current-product claims | OUT OF SCOPE |
| PSAT | Not launched | Existing code/unit foundations only | Not certified | Not certified | Should not be marketed as available | FUTURE |
| AP | Not launched on PrepLion | Not certified in PrepLion | Not certified | Not certified | Should not be marketed as available | FUTURE |

## Confirmed P0 trust defects

1. Accuplacer existing-user practice still advertises `$39 Fast Track` and enables Start Session,
   while the retirement API correctly returns HTTP 400 unavailable.
2. Accuplacer remains exposed in shared public navigation and pricing on the live product surfaces that were browser-tested; a current source-tree grep no longer shows the SAT/ACT prep page header leak, so that specific sub-issue needs a fresh live retest before it stays on the defect list.
3. College Composition FRQ requests currently return HTTP 500.

## Confirmed P1 fidelity defects

1. College Composition remains all-EASY and stimulus-free in the latest recovered MCQ sample;
   generic isolated prompts dominate.
2. ACT Science items explicitly reference `Table 1`, but render prose serializations rather than
   exam-native tables/graphs; sampled items have no image URL.
3. ACT Math visual sample did not expose graphical items and was dominated by HTTP 500/429 responses.
4. Mobile `Choose your exam` begins around 1,435px on a 390×844 viewport.

## Confirmed passes

- SAT dashboard uses score-native framing with no pass-probability or ACT leak.
- ACT dashboard uses score-native framing with no pass-probability or SAT leak.
- SAT Math ↔ SAT Reading & Writing selection persists through reload and practice session creation.
- ACT Math ↔ ACT English selection persists through reload and practice session creation.
- All sampled ACT questions now have four options.
- ACT five-option generated rows were removed; generator and gate were corrected.
- Current ACT launch probe passes 10/10: SAT/ACT dashboard semantics, switching, practice
  propagation, four-option format, and all four sampled ACT banks.
- CLEP/SAT answer-key certifications clear the ≥95% target for visible courses.
- Billing renders and keeps the current plan as Free during pending activation; legacy assertion wording is stale.
- TEAS `/nursing` and `/teas-prep` public routes now redirect to the supported-product homepage and
  no longer market TEAS.

## Evidence commands

```text
node scripts/integration-tests.js
node scripts/_codex-preplion-handoff-qa.mjs
node scripts/_codex-act-launch-qa.mjs
node scripts/_codex-act-visual-cert.mjs
node scripts/_codex-clep-composition-live.mjs
node scripts/_codex-teas-live-audit.mjs
node scripts/_codex-accuplacer-live.mjs
node scripts/_codex-public-trust-audit.mjs
npx playwright test tests/e2e/landing-fold.spec.ts --project=chromium-public
```

## Required completion criteria

- TEAS remains fully hidden/scoped down across all public and purchase surfaces.
- Accuplacer is invisibly retired according to the owner-approved reversible retirement contract,
  including existing-user practice UI and shared navigation/pricing.
- Public marketing matches actual supported products, family semantics, entitlement limits, guarantee terms, and current counts.
- College Composition passes a passage-grounded construct/difficulty browser re-cert.
- ACT Math/Science pass a representative visual/data-display certification.
- Mobile users can choose their exam in the first viewport.
- Current high-risk authenticated contracts are included in the default test gate and no critical behavior is converted to skip.
