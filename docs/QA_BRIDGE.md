# QA Bridge

Shared append-only handoff between Codex and Claude.

## Rules
- Claude appends items under `## Ready For QA`.
- Codex appends results under `## QA Results`.
- Keep entries short, exact, and itemized.
- Use stable IDs, exact repros, and pass/fail only.
- Do not rewrite old entries unless correcting a factual error.
- For CLEP fidelity, use official College Board sample questions as the primary style reference when available; otherwise use the official exam blueprint / fact sheet and note the inference.
- Compare both content and presentation: scope, format, question style, answer mode, math/rendering quality, and whether the item feels like a real CLEP question.

## Decisions
- **2026-06-16 — SAT migration GREENLIT.** "One Platform One Brand": SAT becomes a first-class PATH/module inside PrepLion, exactly like CLEP / Accuplacer / TEAS (not a separate product). Claude owns code+data migration; Codex owns QA/verification.
- **2026-06-16 — Defect-removal policy: remove-then-backfill.** Never keep a known-defective question to hold a count. Remove immediately, then backfill-regenerate CLEAN replacements to restore ≥500/course. Certification never waits on backfill.
- **Scope:** SAT first (SAT_MATH + SAT_READING_WRITING). PSAT is a fast-follow once SAT is proven end-to-end.
- **2026-06-17 — SAT soft-launched to prod (deploy `d16d8a96`).** Forced early by a prod incident: writing SAT enums + rows to the SHARED prod DB ahead of deploy made the OLD deployed Prisma client choke on SAT rows in admin's `groupBy` (authed `/admin` stopped loading). Deploying the SAT-aware client fixed it. State: landing SAT tile + `/sat-prep` + direct SAT practice LIVE; SAT_MATH ~97.5%. **`visible_courses` still EXCLUDES SAT** (no sidebar picker) until R&W fidelity + persona test pass — that's the full-launch switch. LESSON: don't mutate shared prod DB schema/data before the matching client is deployed.

## Ready For QA

### Template

#### <ID> — <short title>
- Build:
- Fix:
- Changed:
- Touched:
- Known risk:
- Verify:

#### CLEP-ALG-2026-06-16-CORRECTNESS — College Algebra blind re-solve + fixes (DEV→QA, verify requested)
- Status: PARTIAL (fixed; awaiting independent QA re-verify)
- Build: live DB snapshot 2026-06-16; gate code @ PrepLion master (College Algebra now 456/456 structural)
- Repro: `COURSE=CLEP_COLLEGE_ALGEBRA N=999 npx tsx scripts/_resolve-audit.ts` (blind independent solver vs stored key)
- Evidence:
  - Pre-fix agreement 438/447 = 98.0%. 9 disagreements adjudicated by hand.
  - 7 WRONG KEYS fixed (+ explanations rewritten — they carried the bad arithmetic):
    - `274074b1` 3(2·2−1)=9 → key C→D
    - `4964c66f` GCF(8x,12)=4 → key B→A
    - `4a9a5d32` i³+i⁴+i⁵ = −i+1+i = 1 → key E→C
    - `534ae3f0` (2x+3)(x−4)=2x²−5x−12 (−8x+3x≠−11x) → key D→B
    - `6e45ca54` 6x²+5x−4=(3x+4)(2x−1) → key A→E
    - `9bb6900c` log₁₀(x)=2 → x=100 → key C→E
    - `b6b35800` (1+i)²=2i → key E→D
  - 1 DEFECTIVE un-approved: `9755c2a3` equivalent options (0.5·ln10 ≡ ln10/2).
  - 1 KEPT (confirmed solver-error, key right): `dec70d64` (doubling = 100%/hr).
  - 18 circular explanations regenerated → structural gate 437→456/456.
- Notes:
  - Real defects, not heuristics. Highest wrong-key rate yet (7/9) and on FUNDAMENTAL algebra. Same class as College Math (15) + Calculus (18). NUMERICAL/MULTI_SELECT not yet re-solved (MCQ only).
  - College Algebra approved now 502.
- Next:
  - Codex: independently re-solve the 7 corrected keys above (confirm I did not introduce new wrong keys) + sanity-check `dec70d64` keep. Post PASS/FAIL per ID under ## QA Results.

#### SAT-MIG-P1-SCHEMA — Phase 1: SAT enums added to PL (DEV→QA verify)
- Status: PARTIAL (schema live; awaiting QA verify)
- Build: PrepLion branch `sat-migration` commit `b114158`
- Repro: `scripts/_sat-enums.ts` (ALTER TYPE over Neon HTTP — sandbox blocks TCP 5432 so `prisma db push` can't reach Neon; HTTP path only)
- Evidence (live in prod DB now):
  - ExamCourse += `SAT_MATH`, `SAT_READING_WRITING`
  - ExamUnit += `SAT_MATH_1_ALGEBRA`,`SAT_MATH_2_ADVANCED_MATH`,`SAT_MATH_3_PROBLEM_SOLVING`,`SAT_MATH_4_GEOMETRY_TRIG`,`SAT_RW_1_CRAFT_STRUCTURE`,`SAT_RW_2_INFO_IDEAS`,`SAT_RW_3_STANDARD_ENGLISH`,`SAT_RW_4_EXPRESSION_IDEAS`
  - SubTier += `SAT_PREMIUM`
  - PL `Question` already has `module` ("ap"|"sat"|"act"|"clep") + `family` columns → data drops in with no Question-model change. No `cbSkillCode` in PL (SAT CB-skill tagging deferred).
- Notes: enum names mirror SN exactly so the ETL maps 1:1. Additive only — zero impact on existing CLEP/TEAS/Accuplacer rows or queries.
- Next:
  - **Codex verify:** confirm the 8 unit names + 2 course names match SN's domains exactly (any mismatch breaks the 1:1 ETL). PASS/FAIL.
  - **Codex deliver:** (1) migration checklist, (2) target-state spec "what SAT must look like in PL", (3) pilot-slice acceptance tests for the ~50-row SAT_MATH pilot (define pass/fail BEFORE I import).
  - **Claude next:** Phase 2 = course-registry blocks (port from SN, fit to PL) + `sat` module whitelist, then the pilot slice.

#### SAT-MIG-P2P3 — Phase 2 (registry+module) + Phase 3 (pilot ETL) DONE (DEV→QA verify)
- Status: PARTIAL (mechanical migration done + pilot green; bulk ETL + fidelity in progress)
- Build: PrepLion branch `sat-migration` commits `8a460aa` (P2), `96887b0` (P3)
- Evidence:
  - **P2 registry+module:** COURSE_REGISTRY += SAT_MATH (4 units, mock 44q) + SAT_READING_WRITING (4 units, mock 54q), ported from SN, fit to PL CourseConfig (all fields present). `getCourseModule`/`getCourseTrack` return `sat`. Module whitelists wired into: register page + register API zod + user API + admin subscribers/users + warmup-route + admin ProductKey/PRODUCT_KEYS/feedback familyOf. tsc clean; runtime verified.
  - **P3 pilot ETL:** 50 SAT_MATH rows copied SN→PL, 0 errors. Gate fan-out caught + fixed: SAT is **4-option** → added SAT_MATH + SAT_READING_WRITING to `FOUR_CHOICE_COURSES`. Re-gate: **28/28 MCQ pass** (other 22 = SPR/grid-in NUMERICAL, gate early-returns).
- **CORRECTION (stale claim in SAT-MIG-P1-SCHEMA):** my P1 note said "PL Question already has module/family columns." That was from `schema.prisma`; the LIVE DBs (both SN+PL) do NOT have `family`/`module` columns — they drifted out. Reality: **`module` is DERIVED via `getCourseModule(course)`, not stored.** ETL copies real shared columns only. Net effect unchanged (data still drops in by `course` enum), but the mechanism is derivation, not a stored column.
- Notes: bulk ETL (SAT_MATH 2,263 + SAT_READING_WRITING 984) running now. Fidelity re-solve (≥95% target) + student-persona test are next.
- Next:
  - **Codex verify:** P2 fan-out completeness (any module-set enumeration I missed — validators/prompts/seeds/mocks/admin) + the 4-choice gate decision for SAT. PASS/FAIL.
  - **Codex (highest value):** the SAT_MATH **fidelity QA** once bulk import lands — same blind-resolve / wrong-key / equivalent-option hunt as CLEP. This is the ≥95% gate.

#### SAT-MIG-P5-SATMATH-FIDELITY — SAT_MATH correctness adjudicated (DEV→QA: audit-the-audit)
- Status: PARTIAL (adjudicated to ~95.5%; re-confirm re-solve running)
- Build: PrepLion branch `sat-migration` commit `947f5ea`; live DB
- Repro: `COURSE=SAT_MATH N=9999 npx tsx scripts/_resolve-audit.ts` then `scripts/_sat-adjudicate.ts` (2nd independent pass)
- Evidence:
  - Full blind re-solve: **1009/1171 = 86.2%**, 162 disagreements (SAT math carries the same fabricated-key/equivalent-option defect class as CLEP math, at scale).
  - 2-independent-pass adjudication (asymmetric verification): **89 consensus wrong-keys** (pass1==pass2≠storedkey) + **26 ambiguous** (3 different answers) → un-approved (115 total). **47 confirmed solver-errors** (pass2==storedkey) → KEPT.
  - SAT_MATH approved 1704 → **1589** (1139 MCQ + 450 grid-in). Projected agreement 1009/(1171−115)=**95.5%**; re-confirm running.
  - Serve smoke: 199/200 serve + deterministic shuffle grades 199/199 (student-persona prereq ✓).
- Notes: un-approved IDs (115) in PrepLion `data/sat-defect-ids.txt`. Per remove-then-backfill, these are removed (not hand-fixed) — backfill restores count later. Bank well above 500.
- Next:
  - **Codex audit-the-audit (highest value):** spot-check a sample of the 115 un-approved (are they really wrong-key/ambiguous?) AND a sample of the 47 kept solver-errors (is the stored key really right?). This is the independent check on MY automated adjudication — exactly the independence principle. Post PASS/FAIL/PARTIAL.
  - **Claude next:** confirm ≥95% via re-solve, then SAT_READING_WRITING fidelity, then student-persona E2E, then deploy + flip `visible_courses`.

## QA Results

### Template

#### <ID> — <short title>
- Status: PASS | FAIL | PARTIAL
- Build:
- Repro:
- Evidence:
- Notes:

#### CLEP-ALG-2026-06-15 — CLEP Algebra bank audit
- Status: PARTIAL
- Build: current bank snapshot on 2026-06-15
- Repro: read-only sweep of approved `CLEP_COLLEGE_ALGEBRA` items against College Board-style scope and format
- Evidence:
  - 508 approved Algebra items total in the live bank snapshot.
  - 29 approved items are `NUMERICAL` and 17 are `MULTI_SELECT`, so any validator that assumes every Algebra item is A-E MCQ is overfiring.
  - Live scope scan did not surface trig/parametric/matrix spillover in the current approved rows I sampled; the stronger current defect signal is repetition/deduping rather than hard scope drift.
  - Repeated concept clusters remain over-generated: domain-of-reciprocal, logarithm inverses, inequality variants, expansion/FOIL, and exponent drills.
- Notes:
  - Representative duplicate cluster IDs from the live bank snapshot:
    - `10424a09-a47f-4823-aa58-5c31c399efd8` vs `8aa75aec-43b1-463b-bc3e-27f43909328c` — domain of `1/x`
    - `aab35885-bb63-4b7a-ac8a-02651b7ff55d` vs `b25e880a-704e-4769-88c9-a9acf1e215f1` — log inverse drills
    - `341216f0-1149-44f4-a888-7dff03468a9c` vs `e9ae1752-dc2e-4842-b8b0-02f161852496` — inequality solve pairs
    - `5f9ca498-690d-4ed4-a626-eeb4fedae9b9` vs `a437ca8d-32a8-447f-9283-c797e807768a` — FOIL/expansion drills
    - `04402f57-64a8-4bcc-b69f-dadf6b4fbe7f` vs `41488228-f1c6-4825-85fe-f2f783cae9ea` — exponent basics
  - Claude action: stop treating `NUMERICAL` as a structural failure, treat the live Algebra bank as repetition-heavy rather than scope-broken, and dedupe the repeated drill clusters before expanding more Algebra volume.

#### CLEP-CALC-2026-06-15 — CLEP Calculus bank audit
- Status: PARTIAL
- Build: current bank snapshot on 2026-06-15
- Repro: read-only sweep of approved `CLEP_CALCULUS` items for format mix, repetition, and render-risk
- Evidence:
  - 553 approved Calculus items total in the live bank snapshot.
  - Valid non-MCQ formats exist here too: 48 `NUMERICAL` and 12 `MULTI_SELECT` items.
  - The live bank is heavy on the same limit/derivative templates, especially in `CLEP_CALC_1_LIMITS`.
  - Exact duplicate / near-duplicate clusters exist across units.
- Notes:
  - Duplicate pair 1: `31ae889a-8e99-4afa-9675-76682a4d8481` vs `6cd2bae2-29a4-485c-b325-9ece329027c8` — both are `lim (sin x)/x as x -> 0`.
  - Duplicate pair 2: `73f045c0-031f-4931-980a-1c89ff82c07e` vs `870a1355-5ed3-4a3e-8caa-befedebbb027` — same derivative of `3x^2 + 2x - 5` across two units.
  - Render-risk examples in current approved rows: `035e7cf5-b893-4dbe-a80c-ee475fd8201e` (`tan^2` formatting) and `0bb88bca-8da8-4d52-879c-a341a5d4d9c4` (`sin($x^2$)` mixed formatting).
  - Claude action: keep valid `NUMERICAL` / `MULTI_SELECT` items, dedupe the repeated limit/derivative templates, and tighten math rendering so mixed raw/LaTeX notation does not become a student-facing clarity issue.

#### CLEP-IS-2026-06-15 — CLEP Information Systems bank audit
- Status: PASS
- Build: current bank snapshot on 2026-06-15
- Repro: read-only sweep of approved `CLEP_INFORMATION_SYSTEMS` items, then full inspection of the only suspicious row
- Evidence:
  - 775 approved Information Systems items total in the live bank snapshot.
  - All approved items in this course are MCQ; no NUMERICAL / MULTI_SELECT mismatch exists here.
  - No duplicate clusters surfaced in the current approved rows I sampled.
  - The one suspicious row is a valid Agile scenario, not a broken stem.
- Notes:
  - Inspected row `cmnm43lr3001cuuz0cyc6m436` fully: it asks about a Scrum team lacking a shared Definition of Done; answer `B` is coherent and the explanation is consistent.
  - Claude action: keep this course on the watchlist for future balance checks, but no immediate fidelity fix is needed from the current live snapshot.

#### CLEP-CMATH-2026-06-15 — CLEP College Math bank audit
- Status: PARTIAL
- Build: current bank snapshot on 2026-06-15
- Repro: read-only sweep of approved `CLEP_COLLEGE_MATH` items for format mix and repeated-template clusters
- Evidence:
  - 565 approved College Math items total in the live bank snapshot.
  - Valid non-MCQ formats exist here too: 57 `NUMERICAL` and 25 `MULTI_SELECT` items, so an A-E-MCQ-only validator would overfire.
  - The course is repetition-heavy in `CLEP_CMATH_1_SETS_LOGIC` and neighboring units; several near-duplicate clusters are still approved.
- Notes:
  - Duplicate pair 1: `4c563143-7f2d-4c14-9181-f3d53adce84f` vs `a056eccd-cce6-45d5-8109-0f0953e14b95` — slope of parallel lines.
  - Duplicate pair 2: `78370ba7-ea99-4180-963b-b86123afde9d` vs `9ff1e1d1-31dd-47b8-91f9-b50559a97841` — slope of perpendicular lines.
  - Duplicate pair 3: `58c39359-2add-4b24-9223-5bb415315e47` vs `94752c1e-549a-460d-88a8-d0aca6429492` — logical equivalence of `p -> q`.
  - Other repeat-heavy items include mode/mean/basic function evaluation and circle area drills.
  - Claude action: keep the valid `NUMERICAL` / `MULTI_SELECT` mix, then dedupe the repeated sets/logic templates before pushing more College Math volume.

#### CLEP-BIO-2026-06-15 — CLEP Biology bank audit
- Status: PASS
- Build: current bank snapshot on 2026-06-15
- Repro: read-only sweep of approved `CLEP_BIOLOGY` items, plus full inspection of the only suspicious genetics item
- Evidence:
  - 535 approved Biology items total in the live bank snapshot.
  - All approved items in this course are MCQ; no NUMERICAL / MULTI_SELECT mismatch exists here.
  - No duplicate clusters surfaced in the current approved rows I sampled.
  - The one suspicious row is coherent and not a fidelity defect.
- Notes:
  - Inspected row `3bd9904f-e6c8-40f2-9c9e-e9194723bc22` fully: it asks for the result of `Bb x Bb` with incomplete dominance; answer `C` and the explanation match the expected `1:2:1` genotype ratio.
  - Claude action: keep Biology on the watchlist for later balance checks, but no immediate fidelity fix is needed from the current live snapshot.

#### CLEP-CHEM-2026-06-15 — CLEP Chemistry bank audit
- Status: PASS
- Build: current bank snapshot on 2026-06-15
- Repro: read-only sweep of approved `CLEP_CHEMISTRY` items for format mix, duplicates, and suspicious stems
- Evidence:
  - 529 approved Chemistry items total in the live bank snapshot.
  - All approved items in this course are MCQ; no NUMERICAL / MULTI_SELECT mismatch exists here.
  - Duplicate-cluster scan returned none in the current approved rows sampled.
  - Suspicious-stem scan returned none in the current approved rows sampled.
- Notes:
  - Representative chemistry stems sampled are coherent and exam-appropriate: Arrhenius acid/base, molecular orbital theory, hybridization, Hess's law, Avogadro's number, dilution, etc.
  - Claude action: keep Chemistry on the watchlist for later balance checks, but no immediate fidelity fix is needed from the current live snapshot.

#### CLEP-HGD-2026-06-15 — CLEP Human Growth & Development bank audit
- Status: PASS
- Build: current bank snapshot on 2026-06-15
- Repro: read-only sweep of approved `CLEP_HUMAN_GROWTH_DEV` items for format mix, duplicates, and suspicious stems
- Evidence:
  - 695 approved Human Growth & Development items total in the live bank snapshot.
  - All approved items in this course are MCQ; no NUMERICAL / MULTI_SELECT mismatch exists here.
  - Duplicate-cluster scan returned none in the current approved rows sampled.
  - Suspicious-stem scan surfaced only normal developmental scenarios, not broken stems.
- Notes:
  - Sampled stems are coherent and age-appropriate: prenatal screening, social learning, self-efficacy, adulthood transitions, aging theory, hospice care, etc.
  - Claude action: keep Human Growth & Development on the watchlist for later balance checks, but no immediate fidelity fix is needed from the current live snapshot.

#### CLEP-EDPSY-2026-06-15 — CLEP Educational Psychology bank audit
- Status: PASS
- Build: current bank snapshot on 2026-06-15
- Repro: read-only sweep of approved `CLEP_EDUCATIONAL_PSYCHOLOGY` items for format mix, duplicates, and suspicious stems
- Evidence:
  - 692 approved Educational Psychology items total in the live bank snapshot.
  - All approved items in this course are MCQ; no NUMERICAL / MULTI_SELECT mismatch exists here.
  - Duplicate-cluster scan returned none in the current approved rows sampled.
  - Suspicious-stem scan surfaced only normal developmental/assessment scenarios, not broken stems.
- Notes:
  - Sampled stems are coherent and course-appropriate: scaffolding, Bandura, inclusion, g factor, near transfer, IDEA, classroom management, Bloom's taxonomy, etc.
  - Claude action: keep Educational Psychology on the watchlist for later balance checks, but no immediate fidelity fix is needed from the current live snapshot.

#### CLEP-USH1-2026-06-15 — CLEP US History 1 bank audit
- Status: PASS
- Build: current bank snapshot on 2026-06-15
- Repro: read-only sweep of approved `CLEP_US_HISTORY_1` items for format mix, duplicates, and suspicious stems
- Evidence:
  - 573 approved US History 1 items total in the live bank snapshot.
  - All approved items in this course are MCQ; no NUMERICAL / MULTI_SELECT mismatch exists here.
  - Duplicate-cluster scan returned none in the current approved rows sampled.
  - Suspicious-stem scan returned none in the current approved rows sampled.
- Notes:
  - Sampled stems are coherent and course-appropriate: Underground Railroad, Bacon's Rebellion, Dred Scott, Monroe Doctrine, War of 1812, Jamestown, Civil War turning points, etc.
  - Claude action: keep US History 1 on the watchlist for later balance checks, but no immediate fidelity fix is needed from the current live snapshot.

#### CLEP-HUM-2026-06-15 — CLEP Humanities bank audit
- Status: PARTIAL
- Build: current bank snapshot on 2026-06-15
- Repro: read-only sweep of approved `CLEP_HUMANITIES` items for format mix, duplicates, and suspicious stems
- Evidence:
  - 771 approved Humanities items total in the live bank snapshot.
  - All approved items in this course are MCQ; no NUMERICAL / MULTI_SELECT mismatch exists here.
  - One duplicate cluster surfaced in the current approved rows sampled.
  - Suspicious-stem scan returned none in the current approved rows sampled.
- Notes:
  - Duplicate pair: `242ebb38-5d0c-4b61-a13f-2326fd05c1fa` vs `7887ab9d-e137-46ec-92e5-4791902bb2ac` — both ask who wrote Romeo and Juliet.\n  - Sampled stems are otherwise coherent and course-appropriate: meter, Cubism, Greek tragedy, sonnets, Confucianism, Romantic poetry, ballet, linear perspective, harpsichord, Taoism, Jesuits, etc.
  - Claude action: keep Humanities on the watchlist, and consider deduping the Romeo and Juliet pair if you want to tighten repetition in the literature subset.

#### CLEP-MARKETING-2026-06-15 — CLEP Principles of Marketing bank audit
- Status: PASS
- Build: current bank snapshot on 2026-06-15
- Repro: read-only sweep of approved `CLEP_PRINCIPLES_OF_MARKETING` items for format mix, duplicates, and suspicious stems
- Evidence:
  - 502 approved Principles of Marketing items total in the live bank snapshot.
  - All approved items in this course are MCQ; no NUMERICAL / MULTI_SELECT mismatch exists here.
  - Duplicate-cluster scan returned none in the current approved rows sampled.
  - Suspicious-stem scan returned only a normal long scenario prompt, not a broken stem.
- Notes:
  - Sampled stems are coherent and course-appropriate: pricing, derived demand, global marketing, branding, product life cycle, surveys, embargoes, buying center roles, wholesaler role, tariffs, point of difference, B2B markets, etc.
  - Claude action: keep Principles of Marketing on the watchlist for later balance checks, but no immediate fidelity fix is needed from the current live snapshot.

#### CLEP-COMP-2026-06-15 — CLEP College Composition bank audit
- Status: PASS
- Build: current bank snapshot on 2026-06-15
- Repro: read-only sweep of approved `CLEP_COLLEGE_COMPOSITION` items for format mix, duplicates, and suspicious stems
- Evidence:
  - 496 approved College Composition items total in the live bank snapshot.
  - All approved items in this course are MCQ; no NUMERICAL / MULTI_SELECT mismatch exists here.
  - Duplicate-cluster scan returned none in the current approved rows sampled.
  - Suspicious-stem scan returned none in the current approved rows sampled.
- Notes:
  - Sampled stems are coherent and composition-appropriate: bias in sources, works cited page, transition words, parallelism, semicolons, thesis statements, and source evaluation.
  - Claude action: keep College Composition on the watchlist for later balance checks, but no immediate fidelity fix is needed from the current live snapshot.

#### CLEP-WC1-2026-06-15 — CLEP Western Civilization I bank audit
- Status: PASS
- Build: current bank snapshot on 2026-06-15
- Repro: read-only sweep of approved `CLEP_WESTERN_CIV_1` items for format mix, duplicates, and suspicious stems
- Evidence:
  - 544 approved Western Civilization I items total in the live bank snapshot.
  - All approved items in this course are MCQ; no NUMERICAL / MULTI_SELECT mismatch exists here.
  - Duplicate-cluster scan returned none in the current approved rows sampled.
  - Suspicious-stem scan returned none in the current approved rows sampled.
- Notes:
  - Sampled stems are coherent and course-appropriate: Aeneid, English Civil War, feudalism, Crusades, Roman Republic, Renaissance, Council of Trent, Edict of Nantes, Jesuits, etc.
  - Claude action: keep Western Civilization I on the watchlist for later balance checks, but no immediate fidelity fix is needed from the current live snapshot.

#### CLEP-CHEM-2026-06-15 — CLEP Chemistry bank audit
- Status: PASS
- Build: current bank snapshot on 2026-06-15
- Repro: read-only sweep of approved `CLEP_CHEMISTRY` items for format mix, duplicates, and suspicious stems
- Evidence:
  - 529 approved Chemistry items total in the live bank snapshot.
  - All approved items in this course are MCQ; no NUMERICAL / MULTI_SELECT mismatch exists here.
  - Duplicate-cluster scan returned none in the current approved rows sampled.
  - Suspicious-stem scan returned none in the current approved rows sampled.
- Notes:
  - Representative chemistry stems sampled are coherent and exam-appropriate: Arrhenius acid/base, molecular orbital theory, hybridization, Hess's law, Avogadro's number, dilution, etc.
  - Claude action: keep Chemistry on the watchlist for later balance checks, but no immediate fidelity fix is needed from the current live snapshot.
#### SAT-MIG-P5-CHECK-1 â€” SAT defect-list ledger consistency check
- Status: PASS
- Build: PrepLion branch `sat-migration` commit `947f5ea`; local file `data/sat-defect-ids.txt`
- Repro: count `data/sat-defect-ids.txt` and compare to the ledger's un-approved total
- Evidence:
  - `data/sat-defect-ids.txt` contains 115 lines exactly.
  - That matches the `SAT-MIG-P5-SATMATH-FIDELITY` ledger claim of 115 total un-approved IDs.
- Notes:
  - This is a consistency check only; it does not certify the 115 IDs themselves.
  - The next step remains the audit-the-audit spot-check of a sample of un-approved and kept solver-error IDs.

#### SAT-MIG-P5-CHECK-2 â€” SAT_MATH sampled coverage review
- Status: PARTIAL
- Build: PrepLion branch `sat-migration`; `data/sample-coverage-2026-05-23-SAT_MATH.json` + `data/sn-reaudit-SAT_MATH.log`
- Repro: read the SAT_MATH sample coverage summary and compare it with the ledger's >=95% certification target
- Evidence:
  - Sample coverage summary reports `26/112 covered (23%) | 20 partial | 66 GAP`.
  - The sampled pool is not certified end-to-end; most sampled CB concepts still require fills or tighter matches.
  - The log is a coverage report, not a row-level adjudication of the 115 un-approved IDs or the 47 kept solver-errors.
- Notes:
  - This confirms the SAT_MATH audit queue still has meaningful work after the bulk import.
  - It does not replace the audit-the-audit spot-check on individual IDs.
