# SAT + ACT Question Generation — Deep-Gap Analysis & Action Plan

**Date:** 2026-06-03
**Status:** Foundational (compositioning gate + capabilities doc) shipped today. Phases 2–8 below are the substantive content + pipeline work to close the gaps.

This doc grew out of three RCAs in one session: (a) the 0%-image-stimulus SAT_MATH bank, (b) the 0%-numeric PSAT_MATH bank, and (c) ACT_ENGLISH conventions weighted 4% vs CB's 40.5%. All three are symptoms of the same root: our generator was built for ONE shape of question (text+options+single explanation) and the gates only validated per-question correctness, never aggregate composition or capability disclosure.

Below is the full gap landscape across SAT and ACT, what closes each gap, what free resources we can use without IP issues, and a phased action plan with effort estimates.

---

## Part 1 — Generation gap landscape

For each gap: what's missing, what it affects, what closes it, the effort.

### Gap A — Image / figure stimuli (CRITICAL — affects 5 courses)

**Affects:** SAT_MATH (gap = -35%), PSAT_MATH (-30%), ACT_MATH (-28%), ACT_SCIENCE (-80%), to a lesser extent SAT_R&W (some Qs have informational graphics).

**Root cause:** the auto-populate generator (Groq → JSON via plain fetch) emits only `questionText` + `options` + `explanation`. There is no code path that produces a graph, chart, geometric figure, data table, or scatter plot. `stimulusImageUrl` is therefore never populated.

**Why CB rigor depends on it:** digital SAT Math has function graphs, coordinate planes, geometric figures, statistical displays, scatter plots, line/bar charts. ACT Science is data-display-driven (charts/graphs/diagrams in ~80% of Qs). Without image stimuli we can never approximate real-exam rigor for these courses.

**Closure paths (cheapest first):**

1. **Algorithmic SVG library** (deterministic, free, fully under our control). Build `src/lib/stimulus-svg/` with parameterized SVG generators for:
   - Line chart, bar chart, scatter plot, histogram, box plot
   - Coordinate plane with axes/grid/labels and function plot overlays
   - Geometric primitives (triangle, circle with sector, polygon, parallel lines + transversal)
   - Data tables rendered as SVG (consistent fonts/spacing with CB)
   - Each generator takes structured data + returns an SVG string (data: URI ready for stimulusImageUrl)
   - Tests: render each to disk, side-by-side against CB samples for visual parity

2. **Curated SVG templates** for harder visuals (PhET-style simulations, complex diagrams). Hand-authored once; parameterized in code.

3. **External image gen** (Imagen / DALL-E / Replicate) for one-off realistic visuals. Higher cost; reserve for content where geometric SVG can't capture (e.g., photos of physical setups). Note: SAT digital does not use photographic stimuli — algorithmic SVG covers ~95% of needs.

**Estimated effort to close gap A for SAT_MATH alone:** 2–3 weeks. Library: ~5 days. Generator wiring: ~3 days. Retroactive: generate ~625 new image-stimulus Qs across Algebra/Advanced Math/PSDA/Geometry to bring SAT_MATH from 0% → 35%, ~5 days at automated cadence.

---

### Gap B — Per-option distractor explanations (CRITICAL — affects every MCQ course)

**Affects:** every MCQ course on the platform. CB and ACT both publish a specific explanation for each wrong option. We publish only one combined explanation.

**Root cause:** generator prompt asks for "explanation"; database stores `explanation` as a single string. There's no `distractorExplanations` field, no prompt enforcement, no UI to surface per-option detail.

**User mandate:** "detailed response provided when student answers incorrectly rather than taking them to Sage." This IS the closure for this gap.

**Closure path:**

1. Schema: `Question.distractorExplanations Json?` — keyed by option letter (`{"A": "…", "B": "…", "D": "…"}`). Done (committed; needs `prisma db push`).
2. Generator: extend prompt to require distractor explanations as JSON keys; reject outputs missing them via deterministic gate.
3. Retroactive backfill: batched LLM call over existing 1792 approved SAT_MATH Qs to generate distractor explanations. Approximate cost on Groq: $5–15.
4. UI: practice page's `feedback` panel shows the matching distractor explanation INLINE on wrong answer. Sage CTA demoted to "Want more help? Ask Sage" secondary button.

**Estimated effort:** 4–6 days end-to-end including retroactive backfill for SAT_MATH.

---

### Gap C — Multi-question linked stimulus (CRITICAL for SAT_R&W, ACT_Reading, ACT_Science, ACT_English)

**Affects:**

| Course | Target stimulus % | Actual |
|---|---|---|
| SAT_R&W | 95% | 39% |
| PSAT_R&W | 95% | 46% |
| ACT_READING | 100% | 27% |
| ACT_SCIENCE | 100% | 12% |

**Root cause:** generator produces one Q at a time. Real CB/ACT R&W and Reading sections present a 50–150 word passage and 5–10 Qs that share it; ACT Science presents a data display + a research-context paragraph + 6–10 Qs that share it. We have no pipeline that produces "stimulus + N linked Qs" as a single unit.

**Closure path:**

1. New pipeline: `generateLinkedStimulusSet({ course, unit, passageType, n })` that returns `{ stimulus, questions: [...] }`.
2. Schema: `Passage` table; `Question.passageId String?` FK; `Question.passageOrder Int?`.
3. Practice route: serves linked Qs from the same passage as a contiguous block.
4. UI: passage panel + question panel side-by-side (CB style); passage scrollable, persistent across Qs.
5. Retroactive: cannot retrofit existing standalone Qs into linked sets — must generate fresh.

**Estimated effort:** 3 weeks. Schema + pipeline: ~5 days. UI redesign: ~5 days. Initial passage generation across SAT_R&W (~300 passages × 6 Qs = ~1800 linked Qs): ~5 days at automated cadence. Same again for ACT.

---

### Gap D — SPR / numeric grid-in (PSAT_MATH 0% vs 25% target)

**Affects:** PSAT_MATH (gap = -25%), SAT_MATH partial (currently 25%, on target).

**Root cause:** generator defaults to MCQ. Numeric mode (`questionType: NUMERICAL`) was added to schema in May but the prompt rarely produces it for PSAT.

**Closure:** prompt enforcement + ratio check in pre-release-check (already part of composition gate).

**Estimated effort:** 2 days.

---

### Gap E — Topic / domain weighting per cb_spec

**Affects:** every course. CB SAT Math expects ~35% Algebra, ~35% Advanced Math, ~15% PSDA, ~15% Geometry & Trig. Our bank may be skewed; we don't enforce.

**Closure:** generator picks topic stratified by cb_spec target weights; composition gate adds per-domain check (extension of audit script).

**Estimated effort:** 3 days for SAT/ACT.

---

### Gap F — CB rigor calibration

**Affects:** every course. Our generator can produce questions that are individually correct but at the wrong difficulty bend for CB (too easy, too rote, or too contrived).

**Closure:** sample N real CB Qs per topic, score difficulty via LLM judge, target match. Difficulty distribution per cb_spec.

**Estimated effort:** 1 week. Per `feedback_cb_rigor_required` rule.

---

### Gap G — Reference context + word problem realism

**Affects:** SAT_MATH word problems often look contrived (raspberries+blackberries at store A vs B). Real CB problems use authentic contexts (data from BLS, scientific scenarios from real papers).

**Closure:** corpus of public-domain data sources for prompt seeding (see Free Resources below).

**Estimated effort:** ongoing; bootstrap in 3 days.

---

### Gap H — Sage AI quality (separate but related)

Per task #19: Sage's prompt template forces a 5-section concept tutor regardless of context. When a student clicks Sage after missing a question, Sage doesn't address the specific wrong answer.

**Closure:** branch the prompt by context: contrastive explanation when wrong-answer context is supplied; concept tutor when generic.

**Estimated effort:** 2 days.

---

## Part 2 — Free internet resources (no IP issues)

For each: what it covers, license, how we use it.

### Math content sources

| Source | License | What it gives us | How we use |
|---|---|---|---|
| **OpenStax** (Algebra & Trig, College Algebra, Statistics, Intermediate Algebra, Prealgebra) | CC BY 4.0 | Worked examples, exercises, contextual problems with full attribution | Adapt exercise stems as seeds for original SAT/ACT-style Qs; copy formula reference content |
| **Khan Academy Math** (general K-12 + SAT prep) | Mixed (CC BY-NC-SA on much core content) | Problem stems, concept-tagged Qs, video transcripts | Use as topic-coverage and difficulty reference; do not copy verbatim |
| **Khan Academy SAT prep** (CB official partner) | Free + endorsed by CB | All 8 official practice tests in interactive form, skill-tagged | Difficulty reference; reverse-engineer the skill matrix |
| **Project Euler** | Free use | Math problem archive (700+ problems) | Conceptual seed for advanced problem ideas |
| **mathisfun.com** | Free (attribution requested) | Math concept reference | Rigor and visual style reference |
| **OER Commons** (Math collections) | Mostly CC BY / CC BY-SA | Open math worksheets, problem sets | Curate for adaptation |

### Reading/passage sources (for SAT_R&W, ACT_Reading)

| Source | License | What it gives us | How we use |
|---|---|---|---|
| **Project Gutenberg** | Public domain | Pre-1928 literary passages (covers SAT_R&W literary cohort) | Use as the actual passage text; choose passages well below 100-word target length |
| **Wikipedia** | CC BY-SA 4.0 | Non-literary informational passages on any topic | Trim to 50–150 word passages with attribution |
| **NASA / NOAA / USGS / BLS / Census / NCES** | Public domain (US federal works) | Real data + scientific narratives | Best source for SAT science-passage stimuli AND ACT_Science data tables — copy verbatim, attribute |
| **arXiv abstracts** (older, science papers) | Often CC BY-NC | Authentic scientific writing | Use abstracts as model for SAT_R&W science passages |
| **CommonLit** | Free for educators, CC BY-NC-SA on some | Reading passages with comprehension Qs | Reference + adapt with attribution |
| **NewsELA / NewsELA Lite (free tier)** | Educational use license | News passages by reading level | Reference only |

### Science data (for ACT_Science, SAT_R&W science cohort)

| Source | License | What it gives us | How we use |
|---|---|---|---|
| **Our World in Data** | CC BY 4.0 | Curated data + visualizations on every topic | Adapt data + chart into ACT_Science / SAT_PSDA stimulus |
| **PhET (Colorado)** | Free, may embed | Interactive simulations | Reference for science-stimulus design |
| **Carbon Brief, IEA, World Bank** | Mostly CC BY 4.0 | Climate/energy/economic data | Public-data sources for real-world stimuli |

### Competitor references (READ-ONLY; never copy)

Competitor materials are copyrighted. Use them as:
- **Format reference** — how they lay out questions, explanations, navigation
- **Rigor calibration** — sample their question pool to judge difficulty
- **Distractor pattern catalog** — common wrong-answer categories per skill
- **UX inspiration** — what they do well that we should emulate

| Competitor | Free tier | What to learn |
|---|---|---|
| **Magoosh SAT/ACT** | 1-week trial + free sample | Video explanations style; per-Q rubric format |
| **Princeton Review** | Free practice tests with account | "Process of elimination" framing for distractors |
| **Kaplan SAT/ACT** | Free diagnostic | Topic-by-topic study plan UX |
| **PrepScholar** | Free blog + sample Qs | Difficulty calibration writeups |
| **Bluebook (CB official)** | Free app download | THE primary format reference — visit weekly, mimic the digital experience |

### Public-domain real-world data for word problems

- **data.gov** — federal datasets (taxes, housing, labor, crime, education)
- **kaggle.com/datasets** (public-domain subset) — clean tabular data sets across domains
- **fred.stlouisfed.org** — economic indicators
- **CDC WONDER** — public health
- **NHTSA, FAA, NASA** — transport and space data

Use these as PROMPT SEEDS — feed real data + a topic into the generator, it produces an authentic word problem.

---

## Part 3 — Action Plan (phased; no shortcuts)

### Phase 1 — Foundational [SHIPPED today]

- ✅ `scripts/_audit-course-composition.mjs` — composition vs CB target gate
- ✅ `scripts/pre-release-check.js` section 10b — wire into deploy gate
- ✅ `docs/GENERATOR_CAPABILITIES.md` — pipeline capability disclosure
- ✅ `.github/workflows/audit-composition.yml` — weekly cron, archives to `data/composition-audits/`
- ✅ `Question.distractorExplanations` — schema field added (needs `prisma db push`)

### Phase 2 — Image stimulus pipeline (closes Gap A)

P2.1 Algorithmic SVG library — `src/lib/stimulus-svg/`
- `line-chart.ts`, `bar-chart.ts`, `scatter-plot.ts`, `histogram.ts`, `box-plot.ts`
- `coordinate-plane.ts` (with overlay support for function plots)
- `triangle.ts`, `circle.ts`, `polygon.ts`, `parallel-transversal.ts`
- `data-table.ts`
- Each takes structured input, returns SVG string + `stimulusImageUrl` data URI
- Test: snapshot side-by-side with CB samples (visual parity check, manual review)

P2.2 Generator wiring
- `generateQuestionWithStimulus({ course, unit, stimulusKind })` chooses an SVG generator based on the topic
- Adds `stimulusSpec` to output JSON
- Pipeline materializes spec → SVG → data URI → stores in DB

P2.3 Retroactive — fill SAT_MATH gap
- Target: 0% → 35% (~625 new image-stimulus Qs)
- Stratified across Algebra (35%), Advanced Math (35%), PSDA (15%), Geometry & Trig (15%)

P2.4 Same for PSAT_MATH, ACT_MATH, ACT_SCIENCE (the SVG library is shared)

**Effort:** ~3 weeks. **Cost:** $0–50 (generation cost only, no SVG cost).

### Phase 3 — Distractor explanations + UI (closes Gap B, addresses son's mandate)

P3.1 `prisma db push` for `distractorExplanations`

P3.2 Generator extension: prompt requires `distractorExplanations` JSON keyed by letter; deterministic gate rejects when missing for new MCQs

P3.3 Retroactive backfill — batched LLM call over 1792 SAT_MATH approved Qs

P3.4 Practice UI: on wrong answer, show matching distractor explanation inline below the option. Sage CTA becomes secondary ("Want more help? Ask Sage")

P3.5 Sample deliverable (THIS goal): one CB-format SAT_MATH question with full distractor explanations, rendered in the practice UI as proof of concept

**Effort:** 6 days. **Cost:** $10–20 (Groq backfill).

### Phase 4 — Multi-Q linked stimulus (closes Gap C)

P4.1 Schema: `Passage` table; `Question.passageId` FK
P4.2 New pipeline: `generateLinkedStimulusSet`
P4.3 UI redesign: split-pane passage + question
P4.4 SAT_R&W generation: ~300 passages × 6 Qs each
P4.5 ACT_Reading + ACT_Science same shape

**Effort:** ~3 weeks. **Cost:** $50–150 generation.

### Phase 5 — Topic / domain weighting (closes Gap E)

Composition gate extension: per-domain % per course. Generator picks topic stratified by cb_spec weights.

**Effort:** 3 days.

### Phase 6 — CB rigor calibration (closes Gap F)

Per `feedback_cb_rigor_required` rule. Sample real CB Qs, score difficulty, target match per topic.

**Effort:** 1 week.

### Phase 7 — Free-resource ingestion

P7.1 OpenStax → seed corpus for original Math Qs (CC BY 4.0)
P7.2 Project Gutenberg → SAT_R&W literary passages (public domain)
P7.3 NASA/NOAA/USGS/BLS/Census/NCES → ACT_Science data + SAT_R&W science passages (US federal public domain)
P7.4 Our World in Data → ACT_Science / SAT_PSDA stimuli (CC BY 4.0)
P7.5 Wikipedia → SAT_R&W non-literary informational passages (CC BY-SA 4.0)

Each ingest writes a `source` field + attribution caption rendered with the question.

**Effort:** 4 days per source ingestion, parallelizable.

### Phase 8 — Competitor benchmarking

Sign up free trials of Magoosh / PR / Kaplan / PrepScholar. Document their format, explanation style, distractor pattern catalog. Do not copy content. Score our Qs against their rigor for self-calibration.

**Effort:** 1 week of analysis + writeup.

### Phase 9 — Admin composition health card (closes the upward-flow channel)

`/admin/composition` page showing per-course health: image %, numeric %, stimulus %, with red/yellow/green vs target. PO sees on every admin visit.

**Effort:** 2 days.

---

## Part 4 — Cross-cutting requirements

For every phase:

1. **Cite the free-resource source** in the Question row (`sourceBook`, `sourceUrl`, `sourceLicense`) — already supported in schema.
2. **Render attribution at point of use** when `sourceLicense` is set — required by CC BY 4.0 + CC BY-SA 4.0.
3. **Composition gate stays soft-warn** until gaps fill. Flip `ENFORCE_COMPOSITION_GATE=1` once each course is within tolerance.
4. **Update `docs/GENERATOR_CAPABILITIES.md`** in the same PR as any capability change. Reviewer rejects if doc drifts.
5. **Memory entry per major learning** — capture pipeline limits in `memory/` so future sessions don't re-learn.

---

## Part 5 — Order of attack (recommended priority)

Two readings of priority — by user impact and by enabler logic.

**By user impact (highest first):**

1. Phase 3 — Distractor explanations + UI (your son's specific ask, every MCQ benefits)
2. Phase 2 — Image stimulus pipeline (closes the largest single gap; SAT_MATH 0% → 35%)
3. Phase 4 — Multi-Q linked stimulus (R&W and ACT_Reading are fundamentally broken without this)
4. Phase 6 — CB rigor calibration

**By enabler logic (start here so later phases have foundations):**

1. Phase 1 ✅ (done)
2. Phase 5 — topic/domain gate (cheap; unblocks targeted gen in later phases)
3. Phase 7 — free-resource corpus ingestion (cheap; feeds Phase 2/3/4 with authentic seeds)
4. Phase 3 — distractor explanations (user-mandated)
5. Phase 2 — image stimulus
6. Phase 4 — linked stimulus
7. Phase 6 — rigor
8. Phase 8 — competitor benchmark
9. Phase 9 — admin card

**Suggested first 2 weeks:**
- Week 1: Phases 5 + 7 (topic gate + free-resource seed corpus) + start Phase 3 (distractor extension + sample deliverable for this goal)
- Week 2: Finish Phase 3 backfill; begin Phase 2 algorithmic SVG library

---

## Part 6 — Risks + how we de-risk

1. **CB IP risk** — never copy CB question content. Always create original Qs in CB FORMAT (format is convention; not copyrightable). Source corpora must be public-domain or CC-licensed.

2. **Image quality risk** — algorithmic SVG may look mechanical / un-CB. Mitigation: snapshot side-by-side reviews; iterate on typography + spacing.

3. **Generation cost risk** — Phases 2–4 require batched LLM calls. Total estimate: $200–500 across all retroactive backfills. Within budget per session memory; document burn-rate.

4. **Schema migration risk** — `distractorExplanations` and `Passage` are new fields/tables. Use `prisma db push` (Neon HTTP supports), no manual migration. Existing Qs default to null/absent.

5. **Process drift risk** — every change must update `docs/GENERATOR_CAPABILITIES.md`. Reviewer rule enforces.

---

## Part 7 — Tracking

Tasks created/created-by-this-session:

- #18 — explanation-generator circular reasoning (Phase 3 covers via prompt rewrite)
- #19 — Sage AI quality (Phase 3 covers via context-aware prompt branch)
- #22 — CB SAT format mimicry (this plan provides the roadmap)
- TODO — create per-phase tasks once user signs off on the plan

This document is the source of truth for the gap landscape. Update as work ships.
