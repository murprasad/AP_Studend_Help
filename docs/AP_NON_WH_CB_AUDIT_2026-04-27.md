# AP (non-World History) — CB-Fidelity Audit: 13 Courses vs College Board 2025 Released Exams

**Date:** 2026-04-27. **Methodology:** Mirrors `docs/AP_WH_GAP_ANALYSIS_2026-04-27.md`. For each course: extracted text from CB 2025 FRQ booklets via `pdf-parse` (skipping scoring-statistics + Chief Reader reports), sampled 5 random approved MCQs from prod DB, plus aggregate stats over the entire bank. **Inputs:** `data/cb-frqs/<COURSE>-2025/*.pdf` + older years at `data/cb-frqs/<COURSE>/*.pdf`. Per-course extracted JSONs cached at `data/cb-frqs/_audit-2026-04-27/<COURSE>.json`. Pre-existing structural-metrics report at `docs/cb-grounded-all-AP-2026-04-27.md`. **AP_WORLD_HISTORY excluded** — already audited.

---

## 1. Aggregate Stats (approved MCQs, 13 courses, 6,399 total)

| Course | n MCQ | Avg stim | Avg expl | Empty expl | One-sent expl | No stim | FRQ types |
|---|---:|---:|---:|---:|---:|---:|---|
| AP_US_HISTORY | 499 | 224 | 179 | **154 (31%)** | 18 | 267 | LEQ:5, SAQ:6, DBQ:5 |
| AP_US_GOVERNMENT | 479 | **0** | 128 | **195 (41%)** | 5 | **479 (100%)** | LEQ:25, FRQ:75, SAQ:15 |
| AP_HUMAN_GEOGRAPHY | 500 | **0** | **72** | **354 (71%)** | 0 | **500 (100%)** | FRQ:73, SAQ:15 |
| AP_PSYCHOLOGY | 499 | 182 | 460 | 3 | 0 | 220 | FRQ:58 |
| AP_ENVIRONMENTAL_SCIENCE | 485 | **0** | 112 | **231 (48%)** | 1 | **483 (99.6%)** | FRQ:90 |
| AP_BIOLOGY | 484 | 230 | 400 | 19 | 6 | 78 | FRQ:137 |
| AP_CHEMISTRY | 500 | 153 | 498 | 8 | 2 | 29 | FRQ:43 |
| AP_PHYSICS_1 | 502 | 258 | 435 | 0 | 0 | 28 | FRQ:75 |
| AP_STATISTICS | 490 | 194 | 399 | 4 | 1 | 4 | FRQ:105 |
| AP_CALCULUS_AB | 499 | 174 | 359 | 7 | **48 (10%)** | 57 | FRQ:43 |
| AP_CALCULUS_BC | 495 | 159 | 292 | 2 | **29 (6%)** | 94 | FRQ:35 |
| AP_PRECALCULUS | 467 | **42** | 277 | 6 | 0 | 107 | FRQ:74 |
| AP_COMPUTER_SCIENCE_PRINCIPLES | 500 | 286 | 333 | **40 (8%)** | 15 | 48 | CODING:6, FRQ:15 |

**Universal facts:** 0/6,399 MCQs have `stimulusImageUrl` populated. CB-strict source format (`Source: Author, role, work, year`) appears only in ~30% of APUSH stimuli; 0 in the other 12 courses.

---

## 2. Per-Course Analysis

### 2.1 AP_US_HISTORY (n=499 MCQ, 16 FRQ-family)

**CB 2025 Set 1 DBQ Q1:** paired primary-source excerpts (Sean Wilentz, *Rise of American Democracy*, 2005 + counter-historian) → "Evaluate the extent to which the development of democracy in the United States changed 1800–1848." Set 2 SAQ 1: Walter LaFeber excerpt on post-WWII Soviet-American economic tensions, A/B/C identify-describe-explain.

**Our prod:** `cmo3sp1pj` (Period 6, MEDIUM) is at CB-fidelity — proper `Source: Jacob Riis, Danish-American journalist, newspaper editorial, 1892` + immigration statistics + Labor Advocate excerpt. `cmo3s1pcs` (Reagan/Brandenburg) similarly grounded. **But:** `cmo82gecp` ("Thomas Paine's Common Sense contributed to which outcome…") is HARD-tagged, empty explanation, misfiled under `APUSH_1_PERIOD_1491_1607` (Paine = 1776). `cmo82uog9` and `cmo82edw7` are duplicate Kansas-Nebraska stems.

**Top gaps:** (1) **Unit misclassification at scale** — 5/5 sampled non-DBQ items file under Period 1491-1607 regardless of actual period. (2) **Near-clone duplicates.** (3) **31% empty explanations.**

**Recs:** Regen empty explanations; reclassify period via regex date→unit; dedupe near-clones (cosine ≥ 0.85).

### 2.2 AP_US_GOVERNMENT (n=479 MCQ, 115 FRQ-family)

**CB 2025 Set 1:** Q1 Concept Application (Senate filibuster scenario, A/B/C); Q2 Quantitative Analysis (Gallup line graph "Percentage of Americans Who Believed Climate Change Would Pose a Serious Threat, 1997–2015", 4 sub-parts); Q3 SCOTUS Comparison (full *Wickard v. Filburn* 1942 case summary); Q4 Argument Essay.

**Our prod (5/5 had stim=NULL):** Bare recall stems only — "According to the system of checks and balances…" (`cmo9k3zo9`, empty expl), "Which best describes the impact of the 17th Amendment…" (`cmob07a8i`), "A senator who is a member of the majority party votes against a bill supported by the majority leader…" (`cmob0rgok`). 100% of 479 MCQs have stim=NULL; 41% empty explanations.

**Top gaps:** (1) **Zero stimulus material** vs. CB's table/graph/scenario-grounded format. (2) **No SCOTUS-comparison MCQ subtype.** (3) **41% empty explanations** — highest empty rate in the bank.

**Recs:** Build Quantitative-Analysis MCQ generator (real Pew/Gallup-style 2-col tables); add founding-document excerpt path (Federalist 10/51, Brutus I, MLK letters — required CB texts).

### 2.3 AP_HUMAN_GEOGRAPHY (n=500 MCQ, 88 FRQ-family)

**CB 2025 Set 1 Q2:** Japan Population Pyramid (US Census 2021), 7 sub-parts including "Explain the degree to which a country's population growth rate may be affected by a pronatalist policy. (Response must indicate the degree [low, moderate, high]…)". Q3: two FAO maps (Cow's Milk Production 2018 + Pork Production 2018), compare spatial patterns in Asia.

**Our prod (5/5 stim=NULL, 5/5 empty expl):** "Which is a characteristic of a primate city, a concept developed by geographer Mark Jefferson?" (`cmo9jz6la`), "According to the von Thünen model…" (`cmo9zzw9p`), "Which is a characteristic of a *prorupted city*…" (`cmo9zjzdc`) — note "prorupted **city**" mis-uses the term: *prorupted* describes a state shape, not a city. Aggregate: **354/500 (71%) empty explanations** — worst of any AP course.

**Top gaps:** (1) **71% empty explanation** — students get zero learning feedback. (2) **Zero map/pyramid stimuli** despite CB using 271 visual references in HuGeo FRQ corpus (highest of any course). (3) **AI term confusion** ("prorupted city").

**Recs:** **P0 — regenerate the 354 empty explanations immediately.** Build pop-pyramid + choropleth-map stimulus path (most visual-dependent humanities course we ship).

### 2.4 AP_PSYCHOLOGY (n=499 MCQ, 58 FRQ)

**CB 2025 Set 1 Q1 (Article Analysis):** 3-page mock psychology study — 127 students, mock-crime video, 3 misinformation conditions (low/medium/high) — IV identification, control justification, "Explain how findings support or refute the misinformation effect." Set 2 Q1: dog/owner stimulus-discrimination study, similar structure.

**Our prod:** Strongest non-science course. `cmo2xtwzz` (Big-Five conscientiousness scenario, Emily); `cmo2wlzbc` (Maslow's hierarchy with full Maria backstory); `cmo1j8h0v` (research-ethics deception). 460-char avg explanations, 0 empty. **But:** `12b69c59-b20` (foot-in-the-door) has metadata-only explanation: *"This tests understanding of how incremental commitment increases compliance through psychological consistency principles."* — no actual content.

**Top gaps:** (1) **No multi-section research-design FRQ** matching CB's headline Article Analysis format. (2) **No Evidence-Based Question (EBQ)** with real cross-condition graphs. (3) Some metadata-only explanations leak through.

**Recs:** Generate "research scenario" FRQs (200–400 word study + 6–8 sub-parts: IV/DV/control/confound/operationalization/external validity).

### 2.5 AP_ENVIRONMENTAL_SCIENCE (n=485 MCQ, 90 FRQ)

**CB 2025 Set 1 Q1:** Chickadees as K-selected species; Figure 1 (% nonnative plants vs spider/insect counts), Figure 2 (chickadee growth rate); 8 sub-parts (A–H) including a mid-question pivot to ant biodiversity (urban park vs unmowed grassland) with a species-presence table requiring Simpson-index-style reasoning.

**Our prod (5/5 stim=NULL):** "A community is concerned about water quality in a nearby lake due to runoff…" (`cmo9zjc6c`, EASY, empty expl); "A researcher studies polar bears to isolate climate change effects. What comparison would be appropriate?" (`cmo9k41vi`, MEDIUM, empty expl) — vague stem, multiple valid answers without anchor. Aggregate: 99.6% no-stimulus, 48% empty explanation.

**Top gaps:** (1) **Total absence of data tables/figures** despite APES being fundamentally a data-interpretation course. (2) **Vague stems** ("what comparison would be appropriate"). (3) **48% empty explanations.**

**Recs:** Markdown-table stimulus generator with `stimulusType=DATA_TABLE` flag; require quantified anchor ("based on Figure 1") in every stem.

### 2.6 AP_BIOLOGY (n=484 MCQ, 137 FRQ)

**CB 2025 Q1:** SR/Sec62 ER-protein-transport experiment — siRNA knockdown, Figure 1 (relative protein levels with ±SEx error bars), Figure 2 (3 different proteins), 6 sub-parts including IV identification, control justification, statistical-significance reasoning. ~600-word stimulus.

**Our prod:** Among the strongest in the bank. `cmo3sp7pt` (meiosis 2n=4, Y/y + R/r alleles); `cmo3s9zm5` (Hardy-Weinberg p=0.6/q=0.4 with selection); `cmo3slr15` (HARD, full GPCR signaling pathway: ligand→Gα→AC→cAMP→PKA shown in stimulus). `90e4a502-89f` strong on poly(A) tail. **Defect:** `6fe25f09-22a` stimulus is fragment-only ("Beetle population: 50 generations stable, then 5 generations with migrant population…") — barely informative.

**Top gaps:** (1) **No multi-figure experimental-design questions** matching CB Q1's 600-word scientific-paper format. (2) **No analog for bar charts with error bars** that CB Bio FRQs lean on. (3) Otherwise top-tier alongside Phys 1.

**Recs:** Experimental-design FRQ generator with markdown `| Treatment | Mean ± SE |` tables; fail-validate any "Figure 1" reference without an analog.

### 2.7 AP_CHEMISTRY (n=500 MCQ, 43 FRQ)

**CB 2025 Q1:** Magnesium isotopes — 6 sub-parts: complete mass spectrum (79% Mg-24, equal Mg-25/Mg-26); describe atomic-structure differences; calculate pH of 2.80×10⁻⁴ M NaOH; combine 35.00 mL of 1.85×10⁻³ M Mg(NO₃)₂ with 50.00 mL NaOH, find [Mg²⁺] before reaction; write Ksp expression; calculate Q; predict precipitation. Multi-step across stoichiometry/solubility/acid-base.

**Our prod:** Solid. `cmo3t2256` (HARD halogen polarizability F₂/Cl₂/Br₂/I₂ MW + bp table → dispersion forces); `cmo3u15mt` (HARD, Arrhenius slope = −9600 K → Ea = 79.8 kJ/mol); `cmo7zeno2` (calorimetry full Q=mcΔT chain). All explanations >400 chars.

**Top gaps:** (1) **No PES/mass-spectrum drawing questions** (require visual production). (2) **No Particulate-Diagram MCQs** — CB uses these heavily for IMF/reaction visualization. (3) **FRQ count (43) low** — students see same FRQ ~7× per season.

**Recs:** Particulate-diagram stimuli via SVG/unicode (e.g. `Mg²⁺ ⋯ H₂O` ion-dipole arrows); regenerate FRQ pool to 80+.

### 2.8 AP_PHYSICS_1 (n=502 MCQ, 75 FRQ)

**CB 2025 Q1 Version J:** cart of mass m_c collides with sticky block (mass m_c/5); 4 sub-parts: sketch p_x(t), **derive v_f symbolically** in terms of m_c, v_c, physical constants; derive ΔK_T; compare a friction-during-collision case. Begins: "*Begin your derivation by writing a fundamental physics principle or an equation from the reference information.*" — symbolic, not numerical.

**Our prod:** Excellent depth. `cmo2whkwp` (4.0 kg block on 30° incline, normal force, MEDIUM); `cmo3tq1gx` (Doppler ratio: f_approach=878 Hz, f_recede=735 Hz, ratio=1.09 — full algebra). **Defect:** `cmo3tu645` (transverse wave, EASY) explanation field has corrupted concatenation: *"5 m. Using the wave speed equation v = fλ, we get v = (4 Hz)(0.5 m) = 2 m/s.5 = 8 m/s, confusing the relationship..."* — distractor explanations have merged into the correct-answer explanation. Several MCQs reference "the diagram shown" with no image.

**Top gaps:** (1) **No symbolic-derivation FRQ track** matching CB's "derive in terms of m_c, v_c, physical constants". (2) **Phantom diagrams.** (3) **Distractor-explanation merging defect.**

**Recs:** Symbolic-FRQ generator with rubric-pattern matching; audit explanations for `\d+\s*\w+\.\d+` leak pattern.

### 2.9 AP_STATISTICS (n=490 MCQ, 105 FRQ)

**CB 2025 Q1:** boxplot comparison, gas mileage Country A vs B (n=100 each), 4 sub-parts including "what is the range of the combined data set" + "what is a possible value of the median, justify by referencing the boxplots". Q2: cabbage-field sampling design (25 regions in 5×5 grid, river south, 3 sampling methods to evaluate).

**Our prod:** Strong. `cmo36fu8l` (two-sample z-test conditions); `cmo3slv0d` (gym-table voluntary-response bias); `cmo3sjh09` (regression slope interpretation, ŷ = 1.2 + 0.85x for cart mass→travel time, with physics sanity check); `cmo3x1d31` (t = 5.12/1.28 = 4.0, df = 48, full inference).

**Top gaps:** (1) **No multi-part Investigative Task** (CB's Q6, 25% of FRQ score). (2) **No actual boxplots/scatterplots/dotplots** — CB's signature stimulus type, replaced in our content with markdown text descriptions. (3) Strongest math AP overall.

**Recs:** Investigative-Task multi-part FRQ generator; backfill graphical stimuli via Vega-Lite (or ASCII boxplots if no image rendering).

### 2.10 AP_CALCULUS_AB (n=499 MCQ, 43 FRQ)

**CB 2025 Q1:** invasive species C(t) = 7.6·arctan(0.2t) acres, given C′(t) = 38/(25+t²), 4 sub-parts (avg via integration; MVT instance; lim_{t→∞} C′(t); find max of A(t) = ∫₄ᵗ C(τ)·0.1·ln(τ)dτ on [4,36]).

**Our prod:** `cmo3t4wr6` (HARD, graph of f′ on [-3,5], identify concavity intervals + inflection point) is well-constructed though phantom-visual. **Defect:** `cmo7z7oiy` (MEDIUM): "f(x) = 3x²−5x+2; for what value of x is the function increasing at the fastest rate?" — for a parabola f′ is monotone, "fastest rate of increase" on unbounded domain has no answer. Question is **mathematically ill-posed**; explanation trails off mid-sentence. `cmo3si1mk` (chain rule x(t)=sin(3t)→v=3cos(3t)) is clean.

**Top gaps:** (1) **48/499 (10%) one-sentence explanations** — highest one-sent rate in any course. (2) **Phantom-graph references** (per structural audit, 11/30 in Calc BC sample, 3/30 here). (3) **Mathematically ill-posed items.**

**Recs:** Render KaTeX/Vega graphs; well-posed validator (for "fastest rate"/"min"/"max" questions, ensure bounded domain + unique answer).

### 2.11 AP_CALCULUS_BC (n=495 MCQ, 35 FRQ)

**CB 2025 Q1:** identical to Calc AB invasive species. Q2: polar curve r = 2sin²(2θ) on [0,π], inner-loop area + arc length — pure BC content (parametric/polar/series).

**Our prod:** `cmo3uhonz` (HARD, logistic dP/dt = 0.4P(1−P/500), P(0)=50, find C and Euler P(1) with Δt=1) is rich. `cmo3ttx9k` (∫₀^(π/2) sin·cos³ dx = 1/4 via u-sub) clean. **Defect:** `cmo3z4lyi` (EASY, removable hole at (2,4)) one-sentence explanation just restates the rule. `cmo3s020n` (IVT) has *meta-explanation* — "Correct answer's reasoning is based on the IVT's requirements, which are satisfied when f is continuous and f(-3) and f(0) have opposite signs…" — without actually invoking the stimulus values 4 and -2.

**Top gaps:** (1) **29/495 (6%) one-sentence shallow explanations.** (2) **Series/Taylor likely under-served** — only 35 FRQs for BC-specific topics. (3) **Phantom graphs** — 11/30 (37%) in Calc BC sample reference non-existent graph.

**Recs:** Audit `unit='CALC_BC_10_INFINITE_SERIES'` count + backfill; min explanation length 120 chars.

### 2.12 AP_PRECALCULUS (n=467 MCQ, 74 FRQ)

**CB 2025 Q1:** decreasing function f given by table {(-2,14),(-1,7),(0,3.5),(1,1.75),(2,0.875)}; g(x) = 0.167x² + 1.8343x − 2; sub-parts: compute h(1) = g∘f, find f⁻¹(3.5), roots of g, end behavior of g, identify f as linear/quadratic/exponential/logarithmic with ratio-of-changes reasoning.

**Our prod (avg stim 42 chars — second-shortest):** `cmob067ze` stimulus literally reads `"P(t) = P_0 * (2^{t/4}) models a bacteria population… Find the model after x days."` — that's the question, leaking into the stimulus field. **Defect (mathematical):** `cmo9jzavb` (HARD, simplification of (x²−4x+3)/(x−2)): explanation reads *"f(x) = (x−3)(x−1) / (x−2), which can be further simplified to f(x) = x − 2 by cancelling out the (x−2) terms"* — but x²−4x+3 = (x−1)(x−3); there is **no (x−2) factor in the numerator**. Question + explanation are both arithmetically wrong. 5/5 sampled in Unit 1 (POLYNOMIAL_RATIONAL) suggesting bank imbalance.

**Top gaps:** (1) **Stimulus-as-pseudo-stem leakage.** (2) **Mathematical errors** propagated through explanations. (3) **No table-modeling questions** matching CB's signature "linear/quadratic/exponential/log given this table" pattern. (4) **Unit imbalance** (5/5 in Unit 1).

**Recs:** Math-correctness LLM-judge sweep (regex `cancelling`/`simplifies to` → verify symbolically); backfill weak units (Trig, Polar/Parametric).

### 2.13 AP_COMPUTER_SCIENCE_PRINCIPLES (n=500 MCQ, 21 FRQ-family inc. CODING)

**CB 2025 Set 1 (Personalized Project Reference Written Response):** students bring their own Create Performance Task and answer 3 sub-parts about *their own* code's procedure, list, and iterative refinement. Last prompt: "*Suppose another programmer adds several new elements to the end of the list. Explain how the code segment in part (ii) of the List section would need to be modified…*" — uniquely **bring-your-own-artifact** format.

**Our prod:** `cmo3si3nr` (HARD, mood-playlist iterative-refinement w/ real PROCEDURE getMoodPlaylist + classifyMood pseudocode) is CB-aligned. `cmo0kyqiv` (RESULT trace through two Increment(val) calls). **Defects:** `cmo3sz8dw` (mystery(7,14)) explanation begins *"e., 7 MOD 2 = 1, which is NOT 0..."* — the truncated `"e., "` betrays the AI began with `"i.e.,"` and the prefix got chopped. `cmo2wbze1` (multiplayer game centralized-vs-distributed) has metadata-only explanation: *"This HARD question requires analyzing competing stakeholder concerns…"*

**Top gaps:** (1) **40/500 (8%) empty + 15 one-sent explanations.** (2) **Truncated explanation prefixes** (`"e.,"` pattern, ~10–30 affected). (3) **No PPR-style FRQ engine** (genuinely hard without student-uploaded code).

**Recs:** Audit explanations starting with `"e.,"`/`"i.e.,"`/`"."` and regenerate; replace metadata-only with content explanations.

---

## 3. Aggregate Cross-Course Patterns

**3.1 Universal defects (all 13 courses):**

1. **Zero real images.** 0/6,399 MCQs have `stimulusImageUrl`. CB uses 32 (Bio), 39 (Psych), 79 (Gov), 122 (Phys), 219 (Calc BC), 271 (HuGeo) visual references per course-set. We're systematically weakest at the most visual-dependent courses (HuGeo, Gov, sciences).
2. **Stimulus-less stems dominate the humanities.** USGov 100%, HuGeo 100%, APES 99.6%. CB exam in those three courses uses tables/graphs/case-study scenarios in 100% of FRQ items.
3. **Empty-explanation epidemic in 5 courses.** HuGeo 71%, APES 48%, USGov 41%, APUSH 31%, CSP 8%. Total: **974 questions** where students get a stem, pick an answer, get nothing.
4. **One-sentence shallow explanations in math courses.** Calc AB 48, Calc BC 29, CSP 15 — math explanations skip multi-step computation.

**3.2 Format gaps:**

5. **No multi-part stems.** All 13 courses ship 100% single-question MCQ; CB FRQ corpus has 0–48 multi-part stems per form. Our SAQ-style A/B/C tracks: APUSH 16 total, USGov 115 total — sparse, untested.
6. **No symbolic-derivation FRQs in physics/calculus.** CB Phys 1 explicitly demands derivations from "a fundamental principle"; our 75 Phys 1 FRQs are mostly numerical plug-and-chug.
7. **No "research-design / article-analysis" FRQs in psych/bio/APES.** All three CB exams now lead with a 3-page mock-study Q1; we have nothing of that shape.

**3.3 Content quality patterns:**

8. **Mathematical/factual errors propagate through explanations.** Precalc `cmo9jzavb` (broken cancellation), Calc AB `cmo7z7oiy` (ill-posed "fastest rate"), APUSH `cmo82gecp` (Paine misfiled to wrong period). Confidently-wrong AI hallucinations, not typos.
9. **Distractor-explanation merging.** Phys 1 `cmo3tu645` and CSP `cmo3sz8dw` show evidence of distractor explanations concatenated into the correct-answer explanation — generator-pipeline bug.
10. **Phantom visuals.** Calc BC 11/30 (37%) and Calc AB 3/30 (10%) MCQs reference "the graph shown" with no `stimulusImageUrl`.

---

## 4. Top 5 Ranked Recommended Fixes Across the 13 Courses

**Fix 1 (P0) — Backfill 974 empty MCQ explanations in 5 courses.** `UPDATE questions SET explanation = <regenerated> WHERE explanation = '' OR explanation IS NULL`. Affected: HuGeo 354, APES 231, USGov 195, APUSH 154, CSP 40. **Highest ROI** because it directly affects the learning loop on 16% of our humanities/social-science MCQ bank. Cost: ~30 min Groq time. Validator gate: `LENGTH(explanation) >= 120 AND NOT LIKE 'This % question%' AND NOT LIKE '.%'`.

**Fix 2 (P0) — Add stimulus material to USGov / HuGeo / APES (1,462 MCQs).** These three courses are 100% naked-recall stems while their CB exams are 100% data-grounded. One-shot transform pass to add a stimulus (table, line graph in markdown, founding-doc excerpt, case study) for each existing MCQ. Validator gate: `LENGTH(stimulus) >= 80 AND stimulus IS NOT NULL` for new generations. Sub-tier: USGov needs SCOTUS-comparison + Quantitative-Analysis MCQ subtypes; HuGeo needs population-pyramids + choropleth maps; APES needs data tables.

**Fix 3 (P1) — Math/factual error sweep on 5 courses.** LLM-judge run on Precalc, Calc AB, Calc BC, Chem, Phys 1: validator prompt "Verify the math/physics. Is the stem well-posed? Is the explanation arithmetically correct? Does it reference the stimulus?" Re-flag if NO. Expected hit rate 5–10%. Highest-risk identified items: `cmo7z7oiy` (Calc AB), `cmo9jzavb` (Precalc), `cmo3tu645` (Phys 1).

**Fix 4 (P1) — Eliminate phantom visuals + render real ones.** (a) Strip phantom-visual references — for the Calc BC and other math/science MCQs that reference "the graph above" with no image, regenerate stem to be stimulus-text-only OR drop the reference; (b) ship KaTeX + Vega-Lite rendering so math + simple data plots display natively. Beta 8.7 visual-fidelity work targets this — finish that pass before adding new content.

**Fix 5 (P2) — Lift FRQ counts + add CB-format FRQ subtypes.** Below threshold (target ≥80 FRQ-family rows): APUSH 16, Psych 58, Calc AB 43, Calc BC 35, Chem 43, CSP 21, Precalc 74. **APUSH-DBQ at 5 rows is critically thin** (CB exam = 25% DBQ). USGov should tag FRQ subtypes (Concept App / Quant Analysis / SCOTUS Comparison / Argument Essay) — currently undifferentiated `FRQ:75`.

---

## 5. Caveats

- `pdf-parse` extracts text only — visual stimuli (population pyramids, mass spectra, polar graphs) are images embedded in PDFs that don't surface. **Visual gap is understated, not overstated.**
- 5-MCQ samples per course = wide CIs on defect rates; the 974-empty-explanation count is from full-table queries (precise).
- 2025 = 1 form/course (2 for History/Gov/HuGeo/Psych/APES/CSP). Stylistic patterns generalize; content coverage doesn't (e.g. polar curves on some BC forms only).
- **AP_WORLD_HISTORY excluded** — already audited at `docs/AP_WH_GAP_ANALYSIS_2026-04-27.md`. Patterns 1, 3, 5, 7 from that report apply equally here.

---

**Artifacts produced:** `data/cb-frqs/_audit-2026-04-27/<COURSE>.json` (13 files, ~150 KB total) — CB FRQ excerpts + 5-MCQ samples + aggregate stats, machine-readable for downstream regen scripts.
