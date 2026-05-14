# PSAT Build Plan

**Target:** StudentNest (extends existing SAT bank).
**Pricing tier:** $9.99/mo (matches StudentNest — same FREE/PREMIUM split as AP/SAT/ACT).
**Wall clock:** 1 week.
**Hard cost:** ~$30 (Gemini gen for the recalibration pass).
**Sequence:** **First expansion after current AP/SAT/ACT/CLEP sweeps land.** Easiest of the four expansions by a wide margin because the SAT bank we just gold-standardized today is reusable for ~90% of PSAT content.

---

## Why PSAT (and why first)

1. **National Merit scholarship hook.** PSAT/NMSQT (the junior-year version) is the qualifier for ~$30K full-tuition National Merit scholarships. Selection index cutoffs are state-specific (≈218–225). A prep tool with a real ROI calculator that compares the user's predicted index against their state's cutoff is the conversion hook competitors don't have.
2. **Lowest infrastructure cost of any expansion.** No new pipeline stages, no new RAG corpus, no new validators. Bank reuse + difficulty filter + scoring scale change + marketing pages.
3. **Existing engineering muscles.** Same pattern as SAT — every gate, every validator, every UI surface generalizes directly.
4. **Two products from one bank.** PSAT 10 (sophomore) + PSAT/NMSQT (junior) share ~95% content. Schema-wise it's one course family; marketing-wise we sell to two distinct cohorts.

---

## Source map

| Section | Source | Notes |
|---|---|---|
| PSAT_MATH | Re-use of `SAT_MATH` bank, capped at MEDIUM difficulty | Wired via `expansion-pipeline-config.ts: difficultyCap: "MEDIUM"` |
| PSAT_READING_WRITING | Re-use of `SAT_READING_WRITING` bank, passage-length-filtered | Same gate, additional filter |
| Style fingerprint reference | College Board's 2 free released PSAT/NMSQT forms (`collegeboard.org/psat/practice`) | Verify against difficulty-filtered SAT subset |

College Board publishes the PSAT spec and 2 full released forms for free. No proprietary content gates (unlike TEAS's ATI manual). The bank we gold-standardized today on SAT is the seed.

---

## Difficulty recalibration

PSAT is roughly "SAT minus one grade level." Math caps at quadratics + simple geometry — **no** logarithms, trig identities, advanced functions, or complex numbers. Reading uses shorter passages (typically 500–750 words vs SAT's 750–1100) + simpler vocabulary.

Recalibration logic (`scripts/derive-psat-from-sat.ts` — new):
1. Load every `isApproved AND pipelineVetted` question from `SAT_MATH` and `SAT_READING_WRITING`.
2. Apply per-course filter:
   - `PSAT_MATH`: `difficulty IN ('EASY', 'MEDIUM')` AND `unit IN (algebra/problem-solving/data/basic-geometry — NOT advanced-math)` AND no logarithmic/trigonometric/complex content
   - `PSAT_READING_WRITING`: `difficulty IN ('EASY', 'MEDIUM')` AND `passage_length_chars <= 4500`
3. Copy matching rows to new `PSAT_MATH` / `PSAT_READING_WRITING` rows in the DB with:
   - Source attribution: `derivedFromQuestionId = <SAT row id>`
   - `pipelineVetted = true` (inherited)
   - `auditPassed = original.auditPassed` (inherited)
4. Final pass through ensemble judge with `courseId: "PSAT_MATH"` — config sets `difficultyCap: "MEDIUM"` and the judge checks: "Is this question appropriate for a 10th–11th grader testing PSAT 10 / NMSQT? Y/N." Drops anything still too advanced.

Expected yield from current SAT bank:
- `SAT_MATH`: 321 approved → estimated ~180 PSAT_MATH after filter (filtered out advanced-math content)
- `SAT_READING_WRITING`: 789 approved → estimated ~550 PSAT_READING_WRITING

That's a ~730-Q starting bank with **zero generation cost**. Plus a ~$30 Gemini top-up to bring each section to ~500 explicitly-PSAT-style Qs (which the fingerprint extractor + Stage 6 fidelity validator will gate).

---

## NMSQT scholarship UI

The conversion hook. New surfaces:
1. **Predicted Selection Index calculator** on `/psat-prep` (and in dashboard for active users)
   - State picker (50 states + DC)
   - Compute selection index = `2 × (Reading + Writing) + Math` on 8–38 scale per section (so range 48–228)
   - Compare to state's NMSQT cutoff (data source: NMSC commended/semifinalist cutoffs, published annually)
   - Output: "You're at 215. New York's 2025 semifinalist cutoff was 221. ~6 points to close."
2. **Realistic improvement curve** — based on user's session history
3. **Junior-vs-sophomore framing** — PSAT 10 users see "warm up for the real one"; junior users see scholarship-focused copy

The PSAT scoring scale is **320–1520** (320–760 per section), NOT SAT's 400–1600. The score-prediction logic must branch on course family.

---

## Schema additions

```prisma
enum ApCourse {
  // ... existing AP/SAT/ACT/CLEP/DSST ...
  PSAT_MATH
  PSAT_READING_WRITING
}

enum ApUnit {
  // ... existing ...
  PSAT_MATH_1_ALGEBRA
  PSAT_MATH_2_PROBLEM_SOLVING_DATA
  PSAT_MATH_3_GEOMETRY_BASIC
  // PSAT does NOT have "Advanced Math" or "Geometry/Trig" units (those are SAT-only)
  PSAT_READING_WRITING_1_CRAFT_STRUCTURE
  PSAT_READING_WRITING_2_INFORMATION_IDEAS
  PSAT_READING_WRITING_3_STANDARD_ENGLISH
  PSAT_READING_WRITING_4_EXPRESSION_OF_IDEAS
}
```

Add `CourseConfig` entries to `src/lib/courses.ts` with:
- `examSecsPerQuestion: 64` (2h14m / 98 questions ≈ 81s but per-section caps tighter)
- `mockExam: { mcqCount: 98, mcqTimeMinutes: 134 }` (full PSAT length)
- Standard `keyThemes` map per unit
- `scoringScale: { min: 320, max: 1520, perSectionMax: 760 }` (NEW field — needed for NMSQT calculator)

---

## Wiring via expansion-pipeline-config.ts

Already added today:
```ts
{
  prefix: "PSAT_",
  config: { difficultyCap: "MEDIUM" },
  note: "PSAT — derived from SAT bank, capped at MEDIUM difficulty",
}
```

`getExpansionConfig("PSAT_MATH")` returns this config. The ensemble judge respects it; the derive-from-SAT script reads it for the filter rule. No further wiring needed when generation starts.

---

## Sequence

| Day | Deliverable |
|---|---|
| 1 | Schema migration (PSAT_MATH, PSAT_READING_WRITING + units) + Prisma generate + `COURSE_REGISTRY` entries |
| 2 | `scripts/derive-psat-from-sat.ts` — bulk-copy filtered SAT rows into PSAT rows |
| 3 | Re-run through ensemble judge with `courseId: "PSAT_MATH"` (or `"PSAT_READING_WRITING"`) — drops anything still too advanced via PSAT-aware judge prompt |
| 4 | ~$30 Gemini top-up gen to bring each section to ≥500 explicit-PSAT Qs (only if filter yield <500 per section) |
| 5 | NMSQT Selection Index calculator UI on `/psat-prep` + dashboard widget |
| 6 | Marketing pages — `/psat-prep` (sophomore framing), `/psat-nmsqt` (junior + scholarship framing) |
| 7 | E2E test suite (`tests/e2e/psat-*`) + staging gate + promote |

---

## Cost summary

| Item | Cost |
|---|---|
| Schema + Prisma generate | $0 |
| `derive-psat-from-sat.ts` (one-time bulk SQL via `$executeRawUnsafe`) | $0 |
| Ensemble re-judge against PSAT-aware prompts | ~$5 (cap free judges where possible) |
| Gemini top-up gen (only if shortfall) | ~$25 |
| Marketing pages + NMSQT calculator | $0 (dev time only) |
| **Total hard cost** | **~$30** |

---

## Risks + open questions

1. **State-specific NMSQT cutoffs** — they shift annually and aren't published as a single API. We seed from NMSC's official lists once a year. Mitigation: add a cron that flags when the cutoff data is >12 months stale.
2. **SAT bank's existing labels** — if `unit` labels in `SAT_MATH` don't cleanly separate "Advanced Math" from algebra, the filter is fuzzy. Verify: ~10% of SAT_MATH may need manual relabeling before filter is reliable. Plan: quick audit during day 2.
3. **PSAT vs PSAT 8/9** — there's also a PSAT 8/9 for middle-schoolers. Out of scope for v1 (different difficulty floor, marketing audience). Schema is forward-compatible (could add `PSAT_8_9_MATH` later).
4. **Junior-year urgency window** — NMSQT is administered in October. Marketing/SEO push should land July-September.

---

## Why this is the right first expansion

- **Fastest:** 1 week vs 3–4 weeks for the others
- **Cheapest:** $30 vs $80–120
- **Lowest risk:** Re-uses today's gold-standard SAT bank
- **Tests the expansion pipeline machinery** without committing to a fully-new vertical first
- **Validates the difficulty-cap config** that GRE Quant will also need
