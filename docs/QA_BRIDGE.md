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
