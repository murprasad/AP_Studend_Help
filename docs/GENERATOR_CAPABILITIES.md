# Generator Capabilities — what each pipeline CAN and CANNOT produce

This doc exists because pipelines silently failed to produce image stimuli for SAT_MATH for ~6 months and nobody flagged the gap to PO. Going forward, every generation pipeline must declare its capabilities and limits HERE. PO reads this before scoping content sprints.

> Rule: when a pipeline is built or updated, the developer MUST update this file in the same PR. Reviewer rejects merges where capabilities are added/removed without a doc change.

---

## Pipeline catalog

### `auto-populate` (Groq → JSON, `src/lib/ai.ts` → `generateQuestion`)

| Capability | Status |
|---|---|
| Stem (questionText) | ✅ produces |
| 4-option MCQ | ✅ produces |
| 5-option MCQ (ACT_MATH legacy) | ✅ produces |
| NUMERICAL / SPR (digital SAT grid-in) | ⚠️ partial — produces only when explicitly prompted; default is MCQ |
| Stimulus passage (RW courses) | ⚠️ partial — produces short prose; not at CB's 150-200 word passage length |
| Stimulus image (graphs, charts, diagrams) | ❌ NOT PRODUCED — generator is text-only |
| Stimulus image URL (`stimulusImageUrl`) | ❌ NEVER POPULATED |
| Linked stimulus across multi-Q sets | ❌ not supported |
| Explanation | ✅ produces single-paragraph key explanation |
| Distractor explanations (per-option) | ❌ NOT PRODUCED — single explanation only |

**Implication for bank composition:** any course where CB expects ≥15% image-stimulus questions will have a structural gap until the image pipeline ships. Currently affects: SAT_MATH (target 35%), PSAT_MATH (30%), ACT_MATH (28%), ACT_SCIENCE (80%). See `scripts/_audit-course-composition.mjs` output.

### `cb-spec-driven generation` (planned, not built)
Status: design only. Would feed cb_spec.json composition targets into the generator so the pipeline tries to match expected ratios per course.

### `image-stimulus pipeline` (planned, not built)
Status: design only. Options under evaluation:
- SVG-from-spec (deterministic — for geometry, coordinate planes, simple bar/line charts)
- DALL-E / Replicate for complex visualizations
- Curated SVG library + parameterized variants

### `FRQ pipeline` (`src/lib/ai.ts` FRQ branch)
| Capability | Status |
|---|---|
| Free-response prompt | ✅ |
| Sample rubric | ✅ |
| Sample-answer grading | ✅ |
| Image stimulus | ❌ |

### `Sage tutor` (`src/lib/ai.ts` → `askTutor`)
| Capability | Status |
|---|---|
| Concept tutor in 5-section format | ✅ |
| Wrong-answer-specific contrastive explanation | ❌ — template forces concept-tutor regardless of context (see feedback_sage_quality task #19) |

---

## Upward-flow channel — when to flag PO

The DEV role must surface to PO when:
1. A new pipeline is shipped (add capability row above + tag PO in the PR)
2. A capability the pipeline LACKS is going to be felt by users (e.g., "generating 1000 SAT_MATH Qs will be all image-free")
3. The composition gate fails for a course in a way that's structurally unsolvable with current pipelines

The composition gate in `scripts/pre-release-check.js` section 10b surfaces shortfalls at deploy time. The admin dashboard composition card (planned) surfaces them continuously.

---

## Wiring this in

- `scripts/pre-release-check.js` section 10b: composition vs CB-spec gate (soft-warn, flip `ENFORCE_COMPOSITION_GATE=1` once gaps fill)
- `scripts/_audit-course-composition.mjs`: standalone audit (run anytime)
- Weekly cron (`.github/workflows/audit-composition.yml`, planned): emails contact@ with the per-course shortfall report so PO sees it on a cadence even if no deploy happens that week
- Admin dashboard composition card (planned)
