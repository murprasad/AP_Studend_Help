# StudentNest — Session Work Log

Living plan + status doc. **Write the plan BEFORE starting work. Mark complete with commit SHA AFTER.** Crash-recovery reference — read on resume.

Conventions:
- `[ ]` planned
- `[~]` in progress
- `[x]` complete (include commit SHA or evidence)
- `[!]` blocked — requires user action

---

## Session 2026-04-21 — AP catalog expansion (Task #13)

**Context:** User flagged Reddit-user negative feedback on existing question quality (2026-04-21). Expansion pipeline must hit a HIGHER bar than the current bank. Every new question must be grounded in real CB material, pass the 5-criterion SME validator (factual, single answer, distractor quality, cognitive level, exam alignment), and mirror AP CED unit weights.

**Scope:** 5 new AP courses — `AP_ENGLISH_LANGUAGE`, `AP_HUMAN_GEOGRAPHY`, `AP_US_GOVERNMENT`, `AP_PRECALCULUS`, `AP_ENVIRONMENTAL_SCIENCE`.

### Unit structures (from https://apstudents.collegeboard.org/courses)

| Course | Units × weights | FRQ types |
|---|---|---|
| AP English Language | 9 units (writing/rhetoric skill bands, no formal weights listed — CED has rubric weights) | Synthesis Essay, Rhetorical Analysis, Argument |
| AP Human Geography | Unit 1 8–10%, U2–7 each 12–17% (7 units total) | Q1 no stimulus · Q2 one stimulus · Q3 two stimuli |
| AP US Government | U1 15–22%, U2 25–36%, U3 13–18%, U4 10–15%, U5 20–27% (5 units) | SCOTUS comparison · Argument essay · Concept application · Quantitative analysis |
| AP Precalculus | U1 30–40%, U2 27–40%, U3 30–35%, U4 not assessed on exam (4 units, 3 tested) | Function-based Q, modeling Q |
| AP Environmental Science | U1 6–8%, U2 6–8%, U3–6 each 10–15%, U7 7–10%, U8 7–10%, U9 15–20% (9 units) | Design investigation, Analyze environmental issue, Solve (quantitative) |

### Quality plan (addresses Reddit feedback)

- **Only grounded generation.** Phase C `regen-grounded.mjs` requires ≥3 OfficialSample rows/course to run. No hallucinated Qs.
- **Haiku 4.5 sweep** (Phase D) on every new row before exposure to users.
- **Unit-weight ratio check.** Count of generated Qs per unit must fall within the CED weight band, ±3pp. Add a post-gen audit step.
- **Distractor-quality 5-criterion validator** (existing in `src/lib/ai.ts`): factual / single answer / distractor quality / cognitive level / exam alignment. Keep existing threshold.
- **Reddit defense already live**: auto-quarantine at 3 user reports (commit `a2700c4`).

### Per-course recipe

1. Fetch CED + past FRQ PDFs from `https://apcentral.collegeboard.org/media/pdf/` (pattern: `ap{YY}-frq-<slug>.pdf` or `-set-1`/`-set-2` for courses with two forms).
2. Schema: add `ApCourse` enum value + per-course `ApUnit` enum values. `npx prisma db push` (user-run).
3. `src/lib/courses.ts`: add `CourseConfig` block with unit meta + weights.
4. `scripts/ingest/ingest-ap-<slug>.mjs`: downloads PDFs, parses FRQs, upserts into `OfficialSample`.
5. Phase C: `node scripts/regen-grounded.mjs --course=AP_<X> --mode=fill-to-target --target=500`.
6. Phase D: `node scripts/sweep-validate.mjs --course=AP_<X>`.
7. Phase E: `ap-audit-questions.js --fix` + `ap-ai-review-questions.js --fix`.
8. Verify unit-weight distribution against CED before flipping on landing page.

### Pilot — AP Human Geography (first course to ship)

- [x] Schema: `AP_HUMAN_GEOGRAPHY` + 7 `HUGEO_*` enum values → applied to prod via `scripts/apply-hugeo-enum-values.mjs`
- [x] `courses.ts` CourseConfig (unit names + keyThemes + weights + curriculumContext + tutorResources + examAlignmentNotes + stimulusRequirement + questionTypeFormats MCQ/FRQ)
- [x] `scripts/ingest/ingest-ap-human-geography.mjs` — Q1/Q2/Q3 FRQ parser, 2023–2025 Set 1/Set 2 URLs confirmed from CB past-exam index
- [x] Ingest run: **6/6 FRQ PDFs downloaded, 18 OfficialSample rows (all FRQ) written**
- [ ] Kick off Phase C: `node scripts/regen-grounded.mjs --course=AP_HUMAN_GEOGRAPHY --mode=fill-to-target --target=500`
- [ ] Phase D sweep-validate: `node scripts/sweep-validate.mjs --course=AP_HUMAN_GEOGRAPHY`
- [ ] Verify unit distribution matches CED weights ±3pp
- [ ] Expose in sidebar via COURSE_REGISTRY (already auto-wires)
- [ ] Deploy

**Sample count benchmark** (from count-qs-all.mjs 2026-04-21):
| Course | Samples | Approved Qs |
|---|---|---|
| AP_BIOLOGY | 926 | 500 |
| AP_PSYCHOLOGY | 440 | 500 |
| AP_CALCULUS_BC | 224 | 497 |
| AP_STATISTICS | 193 | 500 |
| AP_WORLD_HISTORY | 110 | ~500 |
| AP_PHYSICS_1 | 35 | ~500 |
| AP_CSP | 22 | ~500 |
| **AP_HUMAN_GEOGRAPHY** | **18** | **0 (ready for gen)** |

HuGeo has fewer samples than CSP; still above regen-grounded's min (3). If quality is thin, add CED-sample ingest as a follow-up.

### Other 4 courses — replicate once HuGeo is green

Each is ~1 day + ingest time. Order: Gov → EnvSci → Precalculus → EnglishLang (Lang is hardest because essays don't parse cleanly; save for last).

**Progress so far (2026-04-21):**
- [x] AP Human Geography: schema + code + 18 FRQ samples (commit `1595211`)
- [x] AP US Government: schema + code + 24 FRQ samples (commit `c63d5d0`)
- [ ] AP Environmental Science — URLs confirmed, not yet ingested
- [ ] AP Precalculus — URLs confirmed, not yet ingested
- [ ] AP English Language — URLs confirmed, not yet ingested

**Confirmed FRQ URL patterns (from CB past-exam index pages):**
| Course | Filename pattern | Sets | Years available |
|---|---|---|---|
| AP_HUMAN_GEOGRAPHY | `ap{YY}-frq-human-geography-set-{1,2}.pdf` | 1 + 2 | 2023, 2024, 2025 |
| AP_US_GOVERNMENT | `ap{YY}-frq-us-gov-pol-set-{1,2}.pdf` | 1 + 2 | 2023, 2024, 2025 |
| AP_ENVIRONMENTAL_SCIENCE | `ap{YY}-frq-environmental-science-set-{1,2}.pdf` | 1 + 2 | 2023, 2024, 2025 |
| AP_PRECALCULUS | `ap{YY}-frq-precalculus.pdf` | single per year | 2024, 2025 only (new exam) |
| AP_ENGLISH_LANGUAGE | `ap{YY}-frq-english-language-set-{1,2}.pdf` | 1 + 2 | 2023, 2024, 2025 |

**Replication recipe per course (proven on HuGeo + USGOV):**
1. Add `AP_<COURSE>` to `ApCourse` enum + N unit values to `ApUnit` enum in `prisma/schema.prisma`
2. `npx prisma generate` → `node --env-file=.env scripts/apply-<slug>-enum-values.mjs` (copy the apply-hugeo template; swap values)
3. Add `CourseConfig` block to `COURSE_REGISTRY` in `src/lib/courses.ts` (mimic HuGeo or USGOV — drop `openStaxSubject` since expansion courses aren't covered there)
4. Add `UNIT_DATA` entry in `prisma/generate-questions.ts` (mirror HuGeo or USGOV structure)
5. Copy `scripts/ingest/ingest-ap-human-geography.mjs` as template; swap COURSE const + SOURCES URLs; adjust genericFrqParse minLen/maxQ per FRQ count (3 for HuGeo, 4 for USGOV/EnvSci, 2-3 for Precalc, 3 for EngLang)
6. `node --env-file=.env scripts/ingest/ingest-ap-<slug>.mjs` to populate OfficialSample
7. Commit course-by-course with consistent message template

---

## Session 2026-04-21 — Conversion funnel + SEO landing pages

### Tranche 1 — Ship the uncommitted conversion-fix bundle + readiness wiring

- [x] Diagnose the "0 coach_requested / 67 dashboard_loads" mystery — race in `dashboard-view.tsx` already fixed in working tree, needed deploy (commit `45dacd0`)
- [x] Push `FunnelEvent` table to prod via HTTP adapter (`scripts/apply-funnel-event-table.mjs`) — TCP/5432 blocked from sandbox + user network
- [x] Run `npm run release:check` — 24/24 checks pass after fixing logo-delegate lookup + version bump to 5.1.0 / Beta 5.1
- [x] Commit + deploy Beta 5.1 (paywall + nudge + FunnelEvent) — `45dacd0` live
- [x] Wire `showScore` from snapshot → `/api/coach-plan` → `OutcomeProgressStrip` (REQ-025 anti-demoralization) — commit `2bde17b`
- [x] Port diagnostic → focused-practice funnel: `buildFocusedPracticeUrl` helper + inline CTA on results page + URL-param auto-launch on `/practice` — commit `afe17c3`
- [x] Trial days-remaining banner (≤3d threshold, severity at ≤1d) + CLEP cleanup script + per-course count script — commit `e1d9656`
- [x] Second deploy: `2bde17b` + `afe17c3` + `e1d9656` — live (smoke 15/15 pass)

### Tranche 4 — AP catalog expansion + bug fixes + mobile + flashcards foundation

- [x] Schema + CourseConfig + FRQ+CED ingest for all 5 new AP courses (commits `1595211`, `c63d5d0`, `1386ee0`, `248de9e`)
- [x] Critical bug fix: `regen-grounded.mjs` unit-bootstrap (commit `b7d9648`)
  - Before: 0/60 good on new courses (no_unit_resolvable); After: 5/6 good on USGov
- [x] Mobile hooks + haptics wired into practice + test plan (commit `b7d9648`)
- [x] OpenStax American Government 3e ingest → USGov jumped 39→230 samples
- [x] SM-2 spaced-repetition ported to `src/lib/spaced-repetition.ts` (flashcard foundation)
- [ ] **Quality concern to address before scaling Phase C**: generated Qs use "primary" / superlative framings that permit multiple defensible answers. 1/3 of sampled USGov Qs had this issue. Need to tighten generator prompt to explicitly reject superlative framings, OR add a second-pass ambiguity detector to the validator. *(Partial fix shipped `ece79e5` — 2/3 clean after guardrail; scenario-uniqueness residual.)*
- [ ] **Visual-stimulus authenticity** (user-flagged 2026-04-22, son's feedback): real AP exams have maps/graphs/diagrams; ours are text-only. 4-phase plan documented in `project_visual_stimulus_plan.md` (memory). Phase 1 = Wikipedia Commons wiring for history/geo/bio/psych courses — ~1 day, ships first.
- [ ] **Feature-spotlight popup** (user-flagged 2026-04-22, NOT priority): colorful once-per-feature modal at dashboard login. Dismissal via localStorage. Initial batch: Sage Coach, Predicted AP Score, Focused 5-Q practice, Daily streak. Foundation: `src/lib/feature-announcements.ts` + `<FeatureAnnouncementModal />` mounted in dashboard layout after TrialBanner. No DB needed. See Task #26 for spec.
- [ ] Flashcards remaining: schema (Flashcard model), API routes (generate + review), `/flashcards` page, card-renderer UI with swipe + SM-2 state persistence, flashcard-gen.ts for 6-type concept extraction
- [ ] Phase C scale-up: once prompt is tightened, run regen-grounded with `--count=50` per course, review quality, then scale to `--target=500` if clean

### Tranche 2 — SEO marketing pages (PrepLion port)

- [x] `/how-hard-is/[slug]` dynamic route — 16 pages (one per AP/SAT/ACT course) with FAQPage JSON-LD — typecheck passes, uncommitted yet
- [x] `/pass-rates` static reference page — AP 3+ rates, SAT/ACT percentile tables — typecheck passes
- [x] `/wall-of-fame` — adapted from PrepLion CLEP version for AP/SAT/ACT, reads from existing `/api/leaderboard`
- [x] Commit SEO tranche — `e896691`
- [x] Deploy SEO tranche — live at https://studentnest.ai (preview https://9110a5cc.studentnest.pages.dev), 15/15 smoke tests pass

### Pending user action (blocks completion)

- [!] Run cleanup script: `node --env-file=.env scripts/cleanup-clep-junk.mjs` — sandbox denied, user must execute. Deletes unapproved CLEP/DSST junk rows (estimated ~130k).

### Pending work after tranche 2

- [ ] `#13` — Expand AP catalog (English Lang, HuGeo, Gov, Precalc, EnvSci)
  - **Per-course recipe (user directive 2026-04-21):**
    1. Download official material from College Board AP website (sample MCQs, past FRQs, CED PDF)
    2. Add `ApCourse` + `ApUnit` enum values to `prisma/schema.prisma` (`npx prisma db push`)
    3. Add `CourseConfig` block to `COURSE_REGISTRY` in `src/lib/courses.ts`
    4. Phase A ingest — write or adapt `scripts/ingest/ingest-ap-<course>.mjs` to populate `OfficialSample`
    5. Phase B review — generate `docs/content-analysis/AP_<COURSE>.md`
    6. Phase C generate — `node scripts/regen-grounded.mjs --course=AP_<COURSE> --mode=fill-to-target --target=500`
    7. Phase D sweep-validate — `node scripts/sweep-validate.mjs --course=AP_<COURSE>` (Haiku 4.5 un-approves any that fail)
    8. Phase E audit — `node scripts/ap-audit-questions.js --fix` + `scripts/ap-ai-review-questions.js --fix`
  - **Per-question quality requirements (user directive):**
    - Matches CB MCQ or FRQ structure exactly
    - College Board–level rigor (not easier, not arbitrarily harder)
    - Correct unit-weight ratio per AP CED (e.g., AP World Unit 1 = ~8–10% of exam, so question mix should mirror that)
    - Distractor quality (plausible-but-incorrect, common-misconception-based)
    - Single unambiguous answer
  - **Reference policy (user directive 2026-04-21):** Do NOT assume quality. Go to the College Board website, download official PDFs (CED, released exams, past FRQs, sample Qs). ALSO use free/legal sources: OpenStax, Khan Academy, MIT OCW, AoPS, Modern States. Use the downloaded material as the reference corpus for Phase A ingest and Phase C generation. Every generated question must be validated against these real exemplars — no hallucination.
  - Estimated effort: ~1 day per course × 5 courses + CB-PDF fetch time
- [ ] `#15` — Mobile parity (haptics, swipe, PTR, TTS, flashcards UI)
- [ ] `#16` — Flashcards port (SM-2 + swipe UI + 6 card types)
- [ ] `#12 v2` — Middleware gating for expired trials (deferred — separate UX decision)
- [ ] Write `docs/QUESTION_GEN_RUNBOOK.md` — formalize phases A–E of grounded question generation

### Persisted memory

- `project_current_state_2026-04-21.md` — crash-recovery snapshot (already saved)
- `project_backlog_2026-04-21.md` — prioritized backlog across all remaining work
- MEMORY.md — updated index, `project_current_state_2026-04-21` listed first

---

## Grounded question-generation pipeline (Phases A–E) — reference

| Phase | What | Script / Output |
|---|---|---|
| **A — Ingest** | Parse CB / OpenStax / Khan / MIT PDFs into `OfficialSample` rows | `scripts/ingest/ingest-*.mjs` (per-course), `ingest-all-ap.mjs` (batch) |
| **B — Review** | Per-course markdown analysis of corpus | `docs/content-analysis/*.md` + `INDEX.md` |
| **C — Grounded regen** | RAG-grounded generation of new questions | `scripts/regen-grounded.mjs --course=X --mode=fill-to-target --target=500` |
| **D — Sweep-validate** | Haiku 4.5 sweep → un-approve failures | `scripts/sweep-validate.mjs --all --resume` |
| **E — AI review/audit** | Final audit + regen unapproved | `scripts/ap-ai-review-questions.js --fix`, `scripts/ap-audit-questions.js --fix` |

Run-to-completion order per course; each phase is idempotent (contentHash + `--resume`). No explicit runbook in StudentNest — `docs/QUESTION_GEN_RUNBOOK.md` TODO.
