# TEAS 7 Build Plan

**Target:** PrepLion (CLEP/CAA/TEAS market — adult learners / career changers).
**Pricing tier:** $14.99/mo (mid between $9.99 CLEP and $19.99 GRE).
**Wall clock:** 3–4 weeks.
**Hard cost:** ~$120 ($35 ATI Study Manual + ~$80 Gemini gen + ~$5 paid-judge co-sign for Science).
**Sequence:** After PSAT.

---

## Why TEAS

The ATI TEAS 7 nursing-school entrance exam is high-volume, year-round, and high-stakes. Competitors charge $25–$149 (ATI bundle), $26.49 (Mometrix), $45.99 (Smart Edition), or subscription (NurseHub 3,000+ Qs). Our pipeline beats all of them on adaptivity + Sage explanations + mobile + free tier. Nursing-school admissions advisors expect transparent factual sourcing; that's the layer we can win on.

**Exam structure** — 170 questions across 4 sections, ~209 minutes total:
- Reading — 45 Qs (key ideas, craft, integration)
- Math — 38 Qs (numbers, algebra, measurement, data)
- Science — 50 Qs (human A&P [~30 Qs], life science, physical science, scientific reasoning)
- English & Language Usage (ELU) — 37 Qs (conventions, knowledge of language, vocabulary)

---

## Source map

All content original. ATI material is © proprietary — used reference-only for style fingerprint, never as content scaffold.

| Section | Primary source | License |
|---|---|---|
| Reading | Project Gutenberg passages + OpenStax Concepts of Biology (informational text) | Public domain / CC BY |
| Math | OpenStax College Algebra + Khan Academy refresh | CC BY |
| Science (A&P) | **OpenStax Anatomy & Physiology 2e** | CC BY 4.0 |
| Science (Life/Physical) | OpenStax Concepts of Biology, College Physics 2e | CC BY |
| ELU | Saylor ENGL001 outline + Owl@Purdue grammar references | CC BY-NC + fair-use reference |

**Style fingerprint reference:** the 60 free practice questions ATI publishes at [atitesting.com/teas](https://atitesting.com/teas). Reference-only for stem length, distractor CV, passage length, reading level. Never copy or paraphrase.

---

## 8-stage generation pipeline (TEAS-specific)

Generic pipeline lives in `docs/expansion-pipeline.md` (the master multi-LLM toolchain). TEAS-specific overrides:

| Stage | Component | TEAS override |
|---|---|---|
| 0 | RAG ingest | Embed OpenStax A&P 2e + Gutenberg passages + ATI manual (purchased, $35) → `data/rag/TEAS.json` |
| 1 | Generator (Gemini 2.5 Pro) | Anchored to RAG chunks; emits `source_page` reference |
| 2 | Deterministic gates | Per-section variants (passage required for Reading, stimulus required for Math/Science Q's that need one) |
| 3 | Validator A (GPT-4o) | Standard contract |
| 4 | Validator B (Claude Sonnet 4.6) | Standard contract |
| 5 | Disagreement flag | A vs B ≥1 letter grade diff → human queue |
| 6 | **Fidelity check (NEW)** | Per-section style fingerprint (stem length μ±σ, passage length, reading level) |
| 7 | Random auditor (Groq) | 15% sample post-approval; cluster-audit on FAIL |

Phase 4 infrastructure tasks still TODO from `project_expansion_pipeline_2026-05-03.md`:
- Style-fingerprint extractor (`scripts/extract-style-fingerprint.ts`)
- Stage 6 fidelity validator (`src/lib/style-fingerprint-validator.ts`)
- Stage 7 random auditor (`scripts/random-auditor.ts`)

Build these **before** the TEAS generator runs.

---

## A&P depth mitigation — 6-layer defense

Anatomy & Physiology is ~30 of the 50 Science questions and the highest-risk content type in TEAS. Our general-purpose LLM judges (Groq Llama-3.3, Pollinations GPT-OSS-20B, Cerebras Qwen, CF Worker Qwen-Coder) aren't biomedical specialists; without targeted mitigation, residual fact-error rate would be ~3-5% (industry baseline). Layered defense drives that to ~1%.

### Layer 1 — Page-cited RAG (free, structural)

Generator output schema **requires** `source_page: number` for every TEAS_SCIENCE question. Stage 2 deterministic gate fails any question without it. Stage 3 validator fetches the cited OpenStax A&P 2e page and verifies the correct answer is supported there. Hallucinated facts ("alpha cells secrete insulin") have no supporting page → automatic FAIL.

Wired via `expansion-pipeline-config.ts`:
```ts
{ prefix: "TEAS_SCIENCE", config: { requireSourceCitation: true, ragCorpus: "openstax-anatomy-physiology-2e" } }
```

### Layer 2 — Cross-source consistency check (free, deterministic)

For each TEAS_SCIENCE Q, retrieve parallel sections from **Khan Academy Health & Medicine** + **NIH MedlinePlus** + **OpenStax Concepts of Biology**. If the four sources disagree on the answer the question hinges on, FAIL. Catches the ~20% of A&P facts where Gemini might pick the spicier wrong answer.

Implementation: `src/lib/cross-source-consistency-validator.ts` (new). Runs in Stage 2 alongside existing deterministic gates.

### Layer 3 — Stricter ensemble quorum for Science

TEAS_SCIENCE-only override (wired in `src/lib/expansion-pipeline-config.ts`):
- General sections: ≥2 of 5 judges PASS (default)
- **Science: ≥3 of 5 judges PASS, AND at least one paid judge (Anthropic Sonnet or Gemini)**

Sonnet 4.5 + GPT-4o have substantially stronger biomedical knowledge than the free pool. Paid spend only on Science questions: ~$0.005 × 1,500 generated Qs ≈ $8 total.

Wired today via:
```ts
{ prefix: "TEAS_SCIENCE", config: { minPassQuorum: 3, requirePaidJudgeInQuorum: true } }
```

`src/lib/ensemble-judge.ts:ensembleJudgeMcq` now reads this config when `courseId` is passed — defaults to ≥2 quorum for every current course.

### Layer 4 — Domain-specialist judge (6th vote)

Add a medical-domain judge to the ensemble pool for TEAS_SCIENCE only:
- Option A: **BiomedLM** (Stanford, free via HuggingFace Inference API)
- Option B: **Apollo-MedSF-7B** via free OpenRouter
- Option C: **Qwen2-Med** via free pool

Even one specialty vote that disagrees with 4 generalist PASSes is the canary. Cost: $0. Implementation: add `callBiomedLM()` to `ensemble-judge.ts`, called only when `courseId.startsWith("TEAS_SCIENCE")`.

### Layer 5 — Deterministic canonical-fact validator

Hand-curate ~200 "A&P facts that don't change" from OpenStax A&P 2e index:
- Alpha cells → glucagon; beta cells → insulin
- P wave → atrial depolarization; QRS → ventricular depolarization
- Loop of Henle → counter-current multiplier
- Sympathetic dominant → mydriasis; parasympathetic → miosis
- Vitamin K → clotting cascade factors II, VII, IX, X
- ~200 entries total

Store as `data/teas-canonical-facts-v1.json`. Run each generated TEAS_SCIENCE Q against the table; any contradiction fails the gate before any LLM judge sees it. Curation: ~3 hours from OpenStax index. Wiring: ~2 hours.

Wired via `canonicalFactTableId: "teas-ap-facts-v1"` in expansion config.

### Layer 6 — Human reviewer (one weekend, $100)

One nursing student or A&P TA sampling 100 random TEAS_SCIENCE questions from the candidate-visible pool. Standard inter-rater agreement metric: <5% disagreement with our ensemble → bank ships visible. Higher → re-sweep until it lands. Cost: ~$100 (4 hrs × $25/hr campus rate). Recruit via campus board or r/StudentNurse.

This is the highest-confidence layer and the cheapest insurance against shared-LLM blind spots.

---

## What users see

- "Report Question" button on every TEAS Science Q (same surface as AP, shipped 2026-05-12)
- Priority routing for Science reports → hold-then-review queue (`src/app/api/admin/question-reports`)
- Course-page banner: "TEAS Science bank v1.0 — cross-checked against OpenStax A&P 2e + Khan Academy + nursing-TA audit. Report any factual concerns."
- Sage Tutor enabled across all sections; A&P explanations cite OpenStax page numbers in the response

---

## Schema additions

```prisma
enum ApCourse {
  // ... existing values ...
  TEAS_READING
  TEAS_MATH
  TEAS_SCIENCE
  TEAS_ELU
}

enum ApUnit {
  // ... existing values ...
  TEAS_READING_1_KEY_IDEAS
  TEAS_READING_2_CRAFT_STRUCTURE
  TEAS_READING_3_INTEGRATION
  TEAS_MATH_1_NUMBERS_ALGEBRA
  TEAS_MATH_2_MEASUREMENT_DATA
  TEAS_SCIENCE_1_HUMAN_ANATOMY
  TEAS_SCIENCE_2_LIFE_SCIENCE
  TEAS_SCIENCE_3_PHYSICAL_SCIENCE
  TEAS_SCIENCE_4_SCIENTIFIC_REASONING
  TEAS_ELU_1_CONVENTIONS
  TEAS_ELU_2_KNOWLEDGE_OF_LANGUAGE
  TEAS_ELU_3_VOCABULARY
}
```

Add `CourseConfig` blocks in `src/lib/courses.ts` (PrepLion mirror). DO NOT add to StudentNest registry — TEAS is a PrepLion product.

---

## Sequence

| Week | Deliverable | Status |
|---|---|---|
| 0 (now) | Build plan + wiring (this doc + `expansion-pipeline-config.ts` + `ensemble-judge.ts` hooks) | ✅ Saved |
| 1 day 1–2 | Order ATI Study Guide 7 ($35). Ingest. Build `data/rag/TEAS.json` | — |
| 1 day 3–5 | Read end-to-end. Write `data/official/TEAS/UNDERSTANDING-BRIEF.md` with per-claim source cites | — |
| 1 day 6–7 | Build style-fingerprint extractor + Stage 6 fidelity validator + Stage 7 random auditor | — |
| 2 day 1 | Schema migration (TEAS_* enums) + COURSE_REGISTRY entries in PrepLion | — |
| 2 day 2 | Build `scripts/generate-teas.ts` — 8-stage pipeline with TEAS_SCIENCE overrides active | — |
| 2 day 3 | Curate `data/teas-canonical-facts-v1.json` (~200 entries from OpenStax A&P 2e index) | — |
| 2 day 4–5 | Add BiomedLM judge for TEAS_SCIENCE only | — |
| 2 day 6–7 | Generate first 200 Qs per section (800 total). All must pass ensemble + (Science) the layered defense | — |
| 3 day 1–4 | Fill to 500+ per section. Cross-source consistency validator builds | — |
| 3 day 5 | Recruit + brief nursing-TA reviewer | — |
| 3 day 6–7 | Nursing-TA audits 100 random Science Qs over the weekend | — |
| 4 day 1–2 | UI integration in PrepLion (sidebar, picker, /teas-prep landing page) | — |
| 4 day 3–5 | Bank to ≥500 silver per section. Apply 200-floor gate. Mark visible | — |
| 4 day 6–7 | Public launch behind `teas_enabled` feature flag → flip on for new signups | — |

---

## Risks + open questions

1. **Saylor ENGL001 license** isn't standard CC BY. May need to write the grammar-question framework wholesale rather than RAG-anchor. Mitigation: 50 hand-authored grammar prompts as seed data, then generate via fingerprint.
2. **ATI manual delivery time** — bookstore vs Amazon vs ATI direct. Assume 3–5 days; start Phase 4 infrastructure work in parallel.
3. **BiomedLM cold-start** — HuggingFace Inference can have multi-second cold starts. Decide between long timeout (acceptable for sweep work, not for real-time gen) vs cached fallback.
4. **NurseHub volume comparison** — they cite 3,000+ Qs. We launch with ~2,000 (500 × 4 sections). Plan a Phase 2 fill to 3,000 in month 2 post-launch.
