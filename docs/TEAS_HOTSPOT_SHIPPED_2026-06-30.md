# TEAS HOTSPOT primitive — SHIPPED + prod-verified (A30.83 → A30.85, 2026-06-30)

Crash-recovery snapshot. The TEAS A&P "click-a-structure-on-a-diagram" question
type (HOTSPOT) is built, deployed to preplion.ai, and prod-verified.

## What it is
A HOTSPOT question = a diagram image (`Question.stimulusImageUrl`) + a
`HotspotSpec` ({regions[], correctLabel}) stored in `Question.options` (jsonb).
The student clicks a point; we hit-test it (normalized [0,1] coords) against the
correct region. `correctAnswer` stores the correct region's LABEL, and the server
grades by label match — so no server-grading change was needed.

## Files (all live)
- `src/lib/hotspot-grade.ts` — pure hit-test lib. `gradeHotspot`, `isHotspotSpec`,
  types. 15 unit tests (`tests/unit/hotspot-grade.test.ts`).
- `prisma/schema.prisma` — `HOTSPOT` added to `enum QuestionType`. **Pushed to Neon.**
- `src/components/practice/hotspot-question.tsx` — client renderer (click→normalize
  →gradeHotspot→reveal). Submits a label consistent with the geometric grade.
- `src/app/(dashboard)/practice/page.tsx` — HOTSPOT render branch + inline-stimulus
  de-dup; `onAnswer` → `submitAnswer(a.correct ? spec.correctLabel : clickedLabel)`.
- `src/app/api/practice/route.ts` — HOTSPOT added to the TEAS default serve mix;
  Layer-8 gate-filter now passes raw options + stimulusImageUrl.
- `src/lib/deterministic-question-gates.ts` — HOTSPOT structural gate branch +
  `options` widened to `unknown` + `parseOptions(unknown)` + `filterByLayer8Gate`
  fixed. 9 gate tests (`tests/unit/hotspot-gate.test.ts`).
- `src/app/api/test/practice-session/route.ts` — pin hook passes raw options to the
  gate AND in the response (mirrors /api/practice).

## Two bugs the REV + prod E2E caught (both fixed)
1. **CRITICAL** — the gate branch was correct, but the THREE `runDeterministicGates`
   call sites array-stripped `options→undefined` and omitted `stimulusImageUrl`. The
   gate then failed (`isHotspotSpec(undefined)`), and the serve-path fires a
   fire-and-forget UNAPPROVE on gate failure → a single real TEAS serve would have
   permanently unapproved every HOTSPOT. Fixed by passing raw fields at all sites +
   widening the `options` type to `unknown`.
2. The pin test-hook response array-stripped non-array options to `null`, hiding the
   spec from the client. Hook-only (the real serve at route.ts ~1288 already passes
   raw options); fixed for QA fidelity.

## Prod verification (preplion.ai, A30.85) — via /api/test/practice-session pin hook
- Pin TEAS HOTSPOT → **HTTP 200** (gate passes on CF Workers — the dead-feature path
  is fixed on the real runtime; dev couldn't run this: Windows Prisma-WASM dev flake).
- Client receives full **HotspotSpec: 4 regions + correctLabel** + diagram URL.
- Rows stay **isApproved=true** (no auto-unapprove).
- **MCQ regression clean** (existing type still serves, 4 options).
- NOT HTTP-exercised: the literal click→grade round-trip (needs session-owner auth).
  Grading is the shared else-branch label-match, unit-tested; the client submits
  `spec.correctLabel` on a correct click. A real Playwright click-walk is the
  belt-and-suspenders follow-up.

## Seeds → P1 batch 1 (2026-06-30) — 14 vetted Qs, content-only (NO deploy)
The 2 original rough cardio seeds (Wikimedia LABELED heart diagram, trivial
identification + external hotlink) are RETIRED (unapproved, not deleted — FK from
earlier prod-pin sessions). Replaced by **14 self-authored HOTSPOT questions** across
3 diagrams, all `unit=TEAS_SCI_ANATOMY_PHYSIOLOGY`, `sourceBook='PrepLion A&P
schematic (self-authored)'`:
- **Neuron** (5): dendrites, cell body, axon, myelin sheath, axon terminals.
- **Heart** (5): functional prompts (LV=systemic pump, RA=body return, RV=lung pump,
  LA=lung return, aorta) — anatomical position (patient-right = viewer-left).
- **Respiratory** (4): trachea, diaphragm, right lung, right primary bronchus.

**Why self-authored SVG (not scraped OpenStax):** regions are derived from the SAME
pixel coords the structures are drawn at → box↔structure alignment is exact BY
CONSTRUCTION (no estimating off a scraped image); no answer-label leak (functional
prompts); embedded as base64 SVG data-URIs (no hosting/licensing). Generator (the
editable source of truth for the diagrams + regions):
`scripts/_populate-teas-hotspot.mjs`.

**Verification (triple, no deploy needed — runs on live A30.85 code):**
1. Geometry — rasterized each diagram WITH its spec regions overlaid (sharp) and
   eyeballed every box sits on its structure. ✓
2. Content — independent anatomy-fact REV agent: 12/14 clean; 2 fixed (neuron
   cell-body prompt cued the nested nucleus → reworded; respiratory bronchus said
   "a primary bronchus" but only Right scored → specified the right bronchus). ✓
3. Structural — independent live gate via prod pin (neuron+heart+resp) → HTTP 200,
   specs (5/5/6 regions) + data-URI diagrams reach the client. ✓

## P1 batch 2 (2026-06-30) — +19 Qs, 4 diagrams, content-only (NO deploy)
Digestive (5), Skeletal (5: skull/sternum/humerus/femur/pelvis), Brain (4:
cerebrum/cerebellum/brainstem/spinal cord), Endocrine (5: pituitary/thyroid/thymus/
adrenal/pancreas — hardest system per r/teas). Generator:
`scripts/_populate-teas-hotspot-b2.mjs`. Same triple-verify: overlay-raster eyeball
(digestive large-intestine fixed — removed an ambiguous ring, clean inverted-U +
transverse-colon region), independent anatomy REV (19/19 clean — disambiguation hints
for small-vs-large intestine and brainstem-vs-spinal-cord held), prod pin → 200.
**Total approved TEAS HOTSPOT now: 33** across 7 systems (cardio 5, neuron 5, resp 4,
digestive 5, skeletal 5, brain 4, endocrine 5).

## P1 batch 3 (2026-06-30) — +21 Qs, 4 diagrams, content-only (NO deploy)
Cell structure (6: membrane/nucleus/nucleolus/mito/Golgi/rough-ER), Urinary (5:
kidneys/ureter/bladder/urethra), Muscular (5: deltoid/pec/biceps/rectus-abdominis/
quads — paired muscles orientation-specified), Female reproductive (5: uterus/
fallopian/ovary/cervix/vagina). Generator: `scripts/_populate-teas-hotspot-b3.mjs`.
Triple-verify: overlay-raster eyeball, independent anatomy REV (18/21 OK; nucleolus &
cervix nesting handled by unit-tested smallest-region-wins; ureter fixed — widened
region to span both tubes + dropped the side requirement), prod pin → 200.
**Total approved TEAS HOTSPOT now: 54 across 11 systems.**

BILATERAL RULE (reusable): paired structures either (a) one region spanning both when
adjacent (adrenals, pectoralis, ureter), or (b) orientation-specify "patient's right =
your left" when far apart (kidneys, deltoid, biceps, quads, ovary). Each prompt → one
region; the smallest-region-wins grader handles all nesting/overlap.

## P1 batch 4 (FINAL, 2026-06-30) — +22 Qs, 4 diagrams, content-only (NO deploy)
Eye (6: cornea/iris/pupil/lens/retina/optic nerve), Ear (5: pinna/canal/eardrum/
ossicles/cochlea), Skin/integumentary (5: epidermis/dermis/hypodermis/hair follicle/
sweat gland), Male reproductive (6: penis/testis/epididymis/vas deferens/prostate/
scrotum). Generator: `scripts/_populate-teas-hotspot-b4.mjs`. Triple-verify: overlay-
raster, independent REV (22/22 clean), prod pin → 200.

## P1 COMPLETE — 76 approved TEAS HOTSPOT Qs across 15 body systems
neuron, heart, respiratory, digestive, skeletal, brain, endocrine, cell, urinary,
muscular, female-repro, eye, ear, skin, male-repro. All self-authored SVG (regions
coord-derived = exact by construction), triple-verified (overlay-raster + independent
anatomy REV + prod pin), content-only (served by live A30.85 code, no deploy).
Generators: `scripts/_populate-teas-hotspot-b{1..4}.mjs` (b1 inline in first commit).
Optional future: nephron detail, lymphatic/immune, blood-flow path, heart-valve
close-up (diagrammatically awkward — do only if TEAS emphasizes them).
Same pipeline each time. Self-authored SVG (regions coord-derived = exact by
construction) is the standing method. Plan: `docs/TEAS_AP_SCIENCE_ENGINE_PLAN_2026-06-30.md`.

## Deploy freeze — LIFTED 2026-06-30
Codex's Value Dashboard v1 (/admin?tab=value) is now complete + tsc-green (was the
freeze reason). HOTSPOT content needs no deploy regardless, but the next code deploy
is now safe to include it.

## Deploy facts
Branch `sat-bluebook-fidelity`. Commits: `0305009` (A30.83), `0962e24` (Codex
cheat-sheets), `9040900` (A30.84 call-site fix), `fe52795` (A30.85 hook fidelity).
`npm run pages:build` → `npx wrangler pages deploy .cf-deploy --project-name=preplion
--branch=master --commit-dirty=true`. MUST stop the dev server before pages:build.

## Known unrelated red test
`tests/unit/exam-fidelity-layout.test.ts` asserts a `focusPrefs.energyCheckIn`
source string no longer in practice/page.tsx — a stale brittle source-snapshot from
PRIOR focus-mode work, NOT touched by HOTSPOT. 726/728 otherwise green.
