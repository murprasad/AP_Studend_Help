# StudentNest Fidelity Architecture (CB SAT / ACT Parity)

**Status:** Active — supersedes parts of `docs/SAT_ACT_GENERATION_GAPS_AND_PLAN.md` (those become P2 tactics; this doc is the architecture frame).
**Date:** 2026-06-02
**Owner mandate (verbatim):** "Indistinguishable cognitive + visual + interaction fidelity to official SAT/ACT."

---

## Root cause of drift

The pipeline was built for question VOLUME (coverage, throughput, approval %). The goal is CB FIDELITY (cognitive + visual + timing parity). These optimize for different things, so optimizing for volume produced a bank that approves at high rates but fails fidelity on every dimension.

Current pipeline shape:

```
Prompt → LLM → JSON question → Approval
```

Required pipeline shape:

```
Blueprint → Cognitive target → Visual stimulus → UI constraints
  → Difficulty calibration → Distractor psychology → Timing pressure
  → Accessibility → Review → Psychometric validation
```

Until the pipeline shape changes, more LLM calls = more non-fidelity questions.

---

## The fidelity dimensions (what we measure parity on)

| Dimension | What CB does | What we do today | Gap |
|---|---|---|---|
| **Visual** | Bluebook-style typography, spacing, answer-button geometry, graph density, white-space pacing | Tailwind defaults | Large |
| **Stimulus-first** | ~35% Math + ~80% Science + 100% R&W start with a stimulus | Text-first; image rarely added | Large |
| **Cognitive pattern** | Hidden operation, translation required, irrelevant info, multi-step compression | Direct knowledge probe | Large |
| **Distractor psychology** | Each wrong answer maps to a specific student mistake category | Random/numerically-adjacent | Large |
| **Psychometric** | p-value, discrimination, timing per Q drive adaptive routing | Static enum (EASY/MEDIUM/HARD) | Total |
| **Timing pressure** | 95 sec / SAT_MATH Q on practice test 4; 60 sec / SAT_RW Q | Unmeasured | Total |
| **Blueprint balance** | Domains weighted (Algebra 35%, Adv Math 35%, PSDA 15%, Geo 15%) | Topic-weighted only loosely | Medium |
| **Wrong-answer feedback** | Per-option explanation + worked solution | Single explanation + redirect to Sage | Large |
| **Reference sheet** | Persistent formula reference panel | Not surfaced consistently | Medium |

---

## Phases (correct order; P1 MUST land before P2)

### P1 — Fidelity Layer (FOUNDATION; no question generation work happens in P1)

P1 ships the validation infrastructure. Until it exists, "is this question CB-like?" is subjective.

**P1.1 — Typography & spacing parity tokens** (`src/styles/fidelity-tokens.css`)
- Audit CB Bluebook screenshots (we have practice test 4 PDF in `data/official/SAT/`)
- Extract: question-stem font size + line-height, option button height + padding, answer-letter circle geometry, passage-pane width, calculator panel position
- Produce CSS variables; apply to `/practice` and `/diagnostic`
- Validator: visual diff against captured Bluebook screenshots

**P1.2 — SVG stimulus library** (`src/lib/stimulus-svg/`)
- Deterministic SVG generators (no LLM in render path):
  - `coordinatePlane({ xRange, yRange, points, lines, functions })`
  - `lineChart({ data, xLabel, yLabel, title })`
  - `barChart({ categories, values })`
  - `scatterPlot({ points, trendline })`
  - `triangle({ vertices, labels, angleArcs })`
  - `circle({ center, radius, sectors, labels })`
  - `polygon({ vertices, labels })`
  - `dataTable({ headers, rows })`
- Each accepts structured input, returns SVG string + data URI ready for `stimulusImageUrl`
- Tests: render each to disk, snapshot-compare against CB style guide

**P1.3 — Screenshot-diff parity gate**
- Capture: SN practice page, CB Bluebook reference (from PDF screenshots), at 1440px + 768px + 375px
- Diff: pixelmatch with tolerance + ODiff
- Gate: pre-release-check fails if visual similarity drops below threshold

**P1.4 — Stimulus-first composition gate** (extends `_audit-course-composition.mjs`)
- Already shipped. Stays soft-warn until P2 fills the gaps.

### P2 — Multi-stage generation pipeline (replaces single-prompt generator)

**P2.1 — Stage refactor** (`src/lib/generation/`)
- `stage1-blueprint.ts` — picks domain/skill/difficulty per cb_spec weights, target stimulus type
- `stage2-stimulus.ts` — calls SVG library OR picks public-domain text passage from corpus
- `stage3-question.ts` — Claude Sonnet 4.5 or GPT-4o writes the stem grounded on the stimulus
- `stage4-distractors.ts` — picks 3 distractors from `data/distractor-patterns/{skill}.json` catalog (not random LLM emission)
- `stage5-explanations.ts` — per-option explanations (one per wrong distractor) + worked correct solution
- `stage6-verify.ts` — deterministic math recompute (mathjs), figure rerender check, timing estimate

**P2.2 — Distractor psychology catalog** (`data/distractor-patterns/`)
- One JSON per skill (e.g., `sat-math-linear-eq-1var.json`)
- Each lists named mistake categories: `sign-flip`, `coefficient-swap`, `unit-omission`, etc.
- Generator forced to draw 3 distractors from 3 different categories

**P2.3 — Stimulus-first mode toggle**
- For topics that REQUIRE a figure (geometry, function graph interpretation, scatter plot analysis), pipeline starts with stimulus and writes the question to fit
- Inverts the current text-first default

### P3 — Psychometric layer

**P3.1 — Schema:** `Question.pValue Float?`, `Question.discrimination Float?`, `Question.medianTimeSecs Int?`

**P3.2 — Nightly job:** compute from `StudentResponse` rows; flag drift

**P3.3 — Adaptive routing:** Module 2 picks Qs by pValue band (not static difficulty enum)

**P3.4 — Generator feedback loop:** Qs with pValue < 0.10 or > 0.90 → flag for human review

### P4 — Wrong-answer inline explanation

Already partially done (schema field added; needs `prisma db push`). Completion:

**P4.1 — Generator extension** — distractor explanations required by deterministic gate

**P4.2 — Backfill** — batched LLM call over 1792 SAT_MATH approved Qs

**P4.3 — UI redesign** — practice page shows matching distractor explanation INLINE on wrong answer; Sage demoted

### P5 — Free-resource ingestion (feeds P2)

See `docs/FREE_RESOURCES_MANIFEST.md` (this PR).

---

## LLM allocation per stage

Per user's framing: do NOT use one LLM for everything. Pick the right LLM per layer.

| Stage | Best model | Why | Cost target |
|---|---|---|---|
| Blueprint sampling | Deterministic (no LLM) | Just weighted random | Free |
| SVG figure generation | Deterministic (no LLM in render path); **Claude Sonnet 4.5** offline to generate the SVG templates we then parameterize | Sonnet excels at SVG; once templates exist, render is free | One-time per template |
| Passage selection (R&W) | Deterministic (corpus lookup) | Free; Project Gutenberg / Wikipedia / NASA / OWiD already filtered | Free |
| Question stem writing | **Claude Sonnet 4.5** or **GPT-4o** | Long-form coherence + grounded on stimulus | $0.01/Q |
| Distractor selection | Deterministic (pull from catalog) + **GPT-4o-mini** to phrase | Catalog enforces psychology; mini is cheap to phrase | $0.001/Q |
| Per-option explanation | **GPT-4o-mini** or **Claude Haiku 4.5** | Cheap; JSON-mode reliable | $0.005/Q |
| Math verification | **mathjs / Wolfram-Alpha API / SymPy via worker** | Deterministic; LLMs make arithmetic errors | Free or near-free |
| Difficulty estimation | **Claude Opus 4.7** as initial-guess judge; later replaced by telemetry pValue | Opus has the best CB-rigor judgment | $0.05/Q (transitional) |
| Figure verify (does the SVG match the question?) | **Claude vision (Sonnet 4.5)** spot-check on a sample | Visual reasoning | $0.02/Q sampled |
| Final approval | **Deterministic gates + composition gate + telemetry** | LLMs cannot self-judge fidelity | Free |

**Why not one LLM for all of this?** Single-prompt generators share blind spots (per `feedback_validator_must_be_deterministic` memory). Mixing models + deterministic checks catches what any one model misses.

---

## Process gates (G1–G6 from Quality Process v1, applied here)

| Gate | Owner | Pass condition |
|---|---|---|
| **G1 PO** | Murali | Each generated batch declares: domain, stimulus type, target pValue band. No batch without declaration. |
| **G2 DEV** | Implementation | All 6 pipeline stages run; deterministic gates pass; figure renders. |
| **G3 REV** | Code review | New stages don't bypass existing gates; capability manifest stays current. |
| **G4 QA** | Persona walk | Sample 5 Qs/batch, walk as student — fail closed on "doesn't feel CB-like". |
| **G5 RM** | Release manager | Composition gate + screenshot-diff gate within tolerance for every visible course. |
| **G6 SRE** | Post-deploy | Telemetry: median time/Q within ±15% of CB target; abandonment rate stable. |

---

## What ships in week 1 (concrete deliverables)

1. ✅ Composition gate (shipped)
2. ✅ Generator capability manifest (shipped)
3. ✅ Distractor explanation schema field (committed, needs `prisma db push`)
4. **TODO this week:** Free-resources manifest (`docs/FREE_RESOURCES_MANIFEST.md`) — this PR
5. **TODO this week:** SVG library skeleton with 2 working generators (`src/lib/stimulus-svg/`) — this PR
6. **TODO this week:** CB visual audit (capture Bluebook screenshots from PDF; note typography/spacing deltas)
7. **TODO this week:** Distractor pattern catalog skeleton (`data/distractor-patterns/sat-math-linear-eq-1var.json`)
8. **TODO this week:** First fidelity-pipeline proof — generate ONE SAT_MATH question end-to-end through the new 6-stage pipeline; render it in `/practice`; record observations

Week 1 closes when the proof question renders and passes all 6 gates.

---

## Hard policy (per user mandate)

> "No SAT/ACT question enters production unless it passes fidelity validation."

Translated to code:

```ts
// In every save-question path:
await assertFidelityGatesPass(question, course);  // throws on fail
```

Gates:
- Visual: figure renders without overflow / clipping; matches CB style guide
- Blueprint: domain/skill matches the batch declaration
- Stimulus: passage length within tolerance OR figure present per blueprint
- Distractor: each distractor traceable to a named mistake category
- Explanation: per-option explanations present
- Timing: estimated time within ±20% of CB target for the topic

Composition gate stays as the AGGREGATE check on top of per-question gates.

---

## Tracking

This document is the source of truth for fidelity architecture. Updated per ship. Tied to tasks #22–#30.
