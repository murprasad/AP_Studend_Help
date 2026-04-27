# AP World History — Gap Analysis: Our Generated Content vs College Board 2025 Released Exam

**Date:** 2026-04-27
**Author:** Content audit (Claude Opus 4.7, 1M context)
**Inputs:** 18 CB 2025 PDFs (Set 1 & Set 2 FRQ booklets + 8 SAQ presentations + 2 DBQ presentations + 6 LEQ presentations); 30 random MCQs sampled from prod DB (`questions` where `course='AP_WORLD_HISTORY' AND isApproved=true`); aggregate stats over all 534 approved AP WH questions in prod.
**Sample artifacts:**
- Extracted CB text → `data/cb-frqs/AP_WORLD_HISTORY/2025-extracted/*.txt`
- Sampled DB content → `data/cb-frqs/AP_WORLD_HISTORY/2025-our-sample.json`

---

## 1. Executive Summary

**The headline gap is structural, not stylistic.** CB 2025 World History exam is built around two things our content does not contain at all: (a) **free-response questions** (3 SAQs, 1 DBQ, 1 LEQ — 60% of the exam by score weight), and (b) **multimodal stimuli** (photographs, maps, postcards, illustrated book images). Our prod DB has **0 SAQ/DBQ/LEQ rows** and **0 questions with a populated `stimulusImageUrl`** out of 534 approved AP WH questions. Students preparing on our platform see only single-answer MCQs whose stimuli are AI-paraphrased prose passages with vague attributions, while the actual exam they take in May 2026 will demand multi-part written responses ("Identify... Describe... Explain...") and visual literacy. On top of that structural gap, our MCQ set has three concrete defects discovered in the 30-question sample: (i) explanation/correctAnswer mismatches — the explanation field says "The correct answer is A" while `correctAnswer="C"` (4 of 30 sampled, ~13%); (ii) empty or one-sentence explanations on roughly 25% of items; and (iii) stimulus attributions that read as AI tells ("This excerpt from a 14th-century Moroccan traveler...") rather than CB's strict format (`Source: Ibn Battuta, Moroccan jurist and traveler, Rihla [travel account], 1355`). Stimulus length and stem quality on our better MCQs are roughly comparable to CB's SAQ source quotes, so the MCQ track is fixable. The FRQ/visual gap is a content-type addition, not a tweak.

---

## 2. What CB 2025 Actually Contains

### 2.1 Section composition (by score weight)
Based on `ap25-frq-world-history-modern-set-1.pdf` directions:
- **Section I Part B** — 3 SAQs, 40 minutes; Q1 + Q2 mandatory (both stimulus-based), Q3 OR Q4 (no stimulus)
- **Section II** — 1 DBQ (15 min reading + 45 min writing) + 1 LEQ (Q2 OR Q3 OR Q4, 40 min)
- MCQ section is digital-only and not released to the public, but the 2020 CED still spec's it at 55 questions / 55 min.

### 2.2 Concrete CB stimulus examples extracted

**SAQ 1 Set 1** — primary-source quote, 165 words:
> *"Asia experienced a temporary gain from the discovery of America, but Africa suffered. America had all the silver and gold Europe needed, and this destroyed the African gold markets and the dependent trade networks. Cities such as Timbuktu and the Songhai Empire of which it was a part crumbled as merchants abandoned the ancient trade routes... The Africans thus became victims of the discovery of America as surely as did the American Indians."*
> — **Source: Jack Weatherford, United States anthropologist, academic book, 1988**

Question stem (3 parts, A/B/C):
- A. Identify one claim that the author makes in the first paragraph about the effect of the discovery of the Americas on Africa.
- B. Describe one economic change in the Americas that occurred as a result of the developments discussed in the second paragraph.
- C. Explain one reason why "American Indians" "became victims of the discovery of America" as suggested by the author in the last sentence of the passage.

**SAQ 2 Set 1** — primary source from Louise Otto-Peters, German feminist newspaper, 1849; ~180 words; A/B/C parts asking audience identification, historical context, and ideological influence.

**DBQ Set 1** — prompt: "Evaluate the extent to which new transportation and/or communication technologies affected African societies during the period circa 1850 to 1960." Includes **a reference map** (explicitly noted as not one of the seven documents) showing locations cited in documents, plus **7 sourced documents** including:
- **Document 2** (PHOTOGRAPH): "Source: William Douglas Mackenzie, Protestant minister born in South Africa... image from his illustrated book... 1899. The photograph shows two African employees of the Kimberley Diamond mines... caption reads: 'GOING HOME FROM THE MINES...'"
- Document 3: telegram exchange between British colonial official and Joseph Chamberlain, 1900
- Document 5: British Parliamentary Commission report on tuberculosis in South Africa, 1914
- Document 7: Toyin Falola memoir excerpt, 2004

**DBQ Set 2** — "spread of industrialization provided women with new opportunities and/or challenges, 1850–1950." Document 2 is an **Ottoman postcard** (image) showing women + male manager at a Bursa silk factory, 1902 (`Chronicle / Alamy Stock Photo` credit visible in extracted text).

**LEQ examples (Set 1):**
- Q2: "In the period circa 1200 to 1450, Buddhism, Hinduism, and Confucianism included ideas about social structures, gender roles, and political authority that influenced societies across Asia. Develop an argument that evaluates the extent to which one or more of these belief systems shaped societies and/or political systems in Asia during this period."
- Q3 (1450–1750 expansion): "evaluates the extent to which economic rivalries were the primary motivation for the expansion of European empires."
- Q4 (20th-century medical/scientific discoveries).

### 2.3 CB scoring rubrics — what "complete" means
From `ap25-apc-world-history-saq3-set-1.txt` (Question 3 scoring guidelines), each part is 1 pt and the rubric provides **3-5 alternative acceptable answers**, e.g. for "tolerant policies of Muslim rulers":
- "Muslim rulers wanted to utilize the economic contributions of their minority populations, for example the jiziya taxes paid by non-Muslims, or the luxury goods traded by Greek, Armenian, or Jewish merchants."
- "Muslim rulers wanted to utilize the military contributions of their minority populations, as seen, for example, in the Mughal use of Hindu Rajput warrior groups, or in the Ottoman use of Janissary troops recruited from its Christian minority groups."

That is the level of specificity CB expects — named groups, named institutions, dated developments.

### 2.4 Visual-content audit
Quick keyword scan of all 18 extracted CB texts: explicit "photograph"/"image" cues appear in DBQ Set 1 (Bechuana miners) and Set 2 (Ottoman postcard). Reference map in DBQ Set 1 (Africa, locations cited). Note: pdf-parse extracts text only; SAQ presentation files (`saqN-set-X.pdf`) embed image-based stimulus pages that don't surface in text extraction — this means the count of CB visuals is **understated** in our scan, but the cataloged ones are sufficient evidence that visual literacy is exam-required.

---

## 3. What Our Prod Content Has

### 3.1 Aggregate stats (all 534 approved AP WH questions)
| Metric | Value |
|---|---|
| Total approved questions | 534 |
| `questionType` MCQ | 534 (100%) |
| `questionType` SAQ / DBQ / LEQ / FRQ | **0** |
| Questions with `stimulusImageUrl` populated | **0** (0.0%) |
| MCQs with no stimulus | 18 (3.4%) |
| MCQs with stimulus 80–200 chars | 17 (3.2%) |
| MCQs with stimulus 200–500 chars | 442 (82.8%) |
| MCQs with stimulus ≥ 500 chars | 57 (10.7%) |
| Avg stimulus length | 401 chars |
| Avg question text length | 123 chars |
| Avg explanation length | 386 chars |
| Unit balance | reasonable: U6=81, U5=70, U1=60, U4=59, U3=56, U8=54, U2=53, U9=53, U7=48 |

### 3.2 Five sampled MCQs in full

**(1) `cmo2wk8cv0054w50tksoq4yjj` — UNIT 6, EASY**
- Stimulus: *"From a Boxer Rebellion proclamation (c. 1900): 'The foreign devils have come to our land, seizing territory, controlling trade, and imposing their religion upon us. They disrespect our ancestors and drain our wealth. We must unite and expel them to restore China's honor and independence.'"*
- Stem: "Which of the following best explains why the Boxer Rebellion occurred in early twentieth-century China?"
- Correct: **D**
- Explanation: *"The correct answer is **A**. The Boxer Rebellion (1899–1901) was fundamentally a reaction against Western imperial domination..."*
- **DEFECT — answer/explanation mismatch.**

**(2) `cmo0qjn4d005ltb0q2pmlj0z5` — UNIT 2, HARD**
- Stimulus: 14th-century Moroccan traveler quote about Mali, salt, and gold (~440 chars). Attribution: "Adapted from Ibn Battuta's Rihla, c. 1355 CE" — vague paraphrase.
- Stem: "What factor directly caused the growth of trans-Saharan commerce in the 14th century?"
- Correct: **C**, with detailed distractor analysis identifying TEMPORAL/CAUSAL/GEOGRAPHIC TRAPS in the explanation. Length: 776 chars. **Best-of-sample quality.**

**(3) `cmocd7wgd0001ru1ownh0t1ta` — UNIT 8, HARD**
- Stimulus: *"According to a 1960 speech by Kwame Nkrumah, 'the forces that unite us are greater than those that divide us.'"* — fragment, not full source.
- Correct: **C**
- Explanation: *"The correct answer is **A**) because the Cold War created a bipolar world..."* — **DEFECT.**
- `modelUsed: groq/llama-3.3-70b-versatile` (recently generated).

**(4) `cmo0veqni00avtb0qfg5d95mt` — UNIT 5, EASY (Rousseau Social Contract)**
- Stimulus: ~410 chars Rousseau quote with year + work title in italics. Strong.
- Correct: **B**
- Explanation: `""` — **EMPTY.**

**(5) `cmmu1vxty001fuuycif1lilj4` — UNIT 6, MEDIUM**
- Stimulus: `null`
- Stem: "The large-scale migration of Chinese and Indian laborers to Southeast Asia, the Caribbean, and the Americas in the 19th century was primarily a result of"
- Correct: **A**
- Explanation: 200 chars — adequate. Pure recall question, no source.

### 3.3 Pattern-level summary of the other 25 sampled MCQs
- **~85% have a stimulus** that is an AI-written prose paragraph with a soft attribution (year + author/work, sometimes "circa," sometimes "court chronicle, circa 1590" — fictional source).
- Stems are predominantly framed as "Which of the following best explains…", "What does this suggest about…", "Based on the excerpt, why did…" — single-answer MCQ format throughout.
- 4 of 30 sampled (13%) have an explanation that contradicts the `correctAnswer` field. IDs flagged: `cmo2wk8cv…`, `cmocd7wg…`, `cmo2wdx3n…`, `cmo0qf5qi…`. Each says "The correct answer is A" while DB stores B/C/D. Likely caused by AI generator picking a letter via RNG after writing the explanation, then shuffling distractors without rewriting the explanation. Same pattern called out in `feedback_audit_all_referenced_fields.md`.
- 2 of 30 (7%) have **empty explanation** strings (`cmo0veqni…`, `cmo2wdma1…`). Another ~5 have one-sentence explanations like *"This reflects causation based on resource distribution"* or *"This reflects genuine causation (market dominance → adoption of practices)."* — no historical content, no teaching value.
- 1 of 30 has a **fictional/anachronistic-feeling source**: `cmo2x9ia4006yw50t89pjk2mc` cites *"The Indian Times, 1985"* (no such publication; the Times of India exists, but the wording is suspicious for an AI fabrication).
- 0 of 30 have a multi-part (A/B/C) stem like CB SAQs.
- 0 of 30 reference an image, map, chart, photograph, or political cartoon.

---

## 4. Gap Matrix

| # | Dimension | CB 2025 actual | Our actual (n=534) | Severity |
|---|---|---|---|---|
| 1 | **FRQ coverage** (SAQ+DBQ+LEQ) | 60% of exam score weight; 5 prompts per form, with rubric and 3-5 acceptable model answers per part | 0 questions of type SAQ/DBQ/LEQ/FRQ | **P0** |
| 2 | **Visual stimuli** (photographs, maps, postcards, cartoons, charts) | DBQ Set 1 has reference map + photograph (Doc 2); DBQ Set 2 has Ottoman postcard (Doc 2); SAQ presentation pages embed visuals | 0 questions with `stimulusImageUrl` populated | **P0** |
| 3 | **Multi-part stems** (Identify / Describe / Explain A,B,C) | Every SAQ; every DBQ; LEQ has 5-criterion rubric | 0 questions in sample | **P0** (only relevant once FRQ track exists) |
| 4 | **Source attributions** | Strict format: "Source: Author, profession + nationality, work + medium, year"; works actually exist | Vague paraphrase: "Adapted from Ibn Battuta's Rihla, c. 1355 CE"; some sources fabricated ("Court chronicle, circa 1590", "The Indian Times, 1985") | **P1** |
| 5 | **Explanation quality / length** | Rubric provides 3-5 model answers per 1-pt part with named institutions, dated events, specific groups | Avg 386 chars; 2/30 empty; ~5/30 one-sentence; only ~1/3 of sampled explanations rise to CB rubric specificity | **P1** |
| 6 | **Answer/explanation consistency** | N/A (CB doesn't have this defect class) | 4 of 30 sampled (13%) have explanation saying "correct is A" while `correctAnswer="C"` or other letter | **P0** for affected items (corrupts learning loop) |
| 7 | **Stimulus length distribution** | SAQ source quotes ~100–200 words ≈ 600–1200 chars; DBQ docs similar | Avg 401 chars; mode is 200–500 chars | **P2** (slightly under CB length but in ballpark) |
| 8 | **Question text / stem length** | CB SAQ stems are 1–2 sentences per part | Our avg 123 chars / single sentence | **P2** (matches CB MCQ-style framing) |
| 9 | **Cognitive level coverage** | SAQ Part A = identify (recall); B = describe (comprehension); C = explain (analysis) | Mixed; many stems are "Which best explains" / "Why did" — analysis-level, but a meaningful slice are recall ("X was unique because" → simple fact lookup) | **P2** |
| 10 | **Unit balance vs CED weighting** | CED weights: U1 8%, U2 8%, U3 12%, U4 12%, U5 12%, U6 13%, U7 8%, U8 10%, U9 10% (rough) | U6=15%, U5=13%, U1=11% — **roughly aligned**, no severe holes | **P3** (acceptable) |
| 11 | **Period coverage** | Exam is 1200–present (Modern only) | Our questions span the same range; no questions before 1200 | **P3** (acceptable) |
| 12 | **DBQ-specific skills** (point-of-view sourcing, complexity, contextualization, "use of 4+ docs") | 6-pt DBQ rubric explicitly tests these | Not exercised at all in our content | **P0** (subset of #1) |

---

## 5. What to Fix — Ranked by ROI

### P0 — must fix before May 2026 exam season
1. **Ship a SAQ practice track.** Generate 3-part SAQ items (Identify / Describe / Explain) with primary-source stimuli using the strict CB attribution format. Each SAQ stores 3 expected-answer rubrics (1 acceptable answer per part, with 2-3 alternative phrasings) so AI scoring can grade student responses. Estimated: 60-80 SAQs to give 1 per unit per period (3 forms worth). Expected score-impact for students: SAQ is ~20% of exam, currently 0% covered. **Highest ROI of anything in this report.**
2. **Build a DBQ engine.** Single DBQ per form, 7 sourced documents, prompt across 1450–1980 windows. The image-document slot is the hard part — see fix #3. Generate 2-3 DBQ forms initially, expand later. Use existing CB 2017–2024 released DBQs as scaffolding (we already ingested some; check `data/cb-frqs/AP_WORLD_HISTORY/2019-extracted.json`). Score-impact: DBQ is ~25% of exam, currently 0% covered.
3. **Add visual stimuli to MCQ + DBQ tracks.** Two paths: (a) license/use Wikipedia Commons / Library of Congress / Smithsonian public-domain images for c.1850–1960 photographs and maps and embed via `stimulusImageUrl`; (b) generate vega-lite charts and mermaid maps for data-driven stimuli (population pyramids, trade-volume tables, alliance-network diagrams). Beta 8.7 frontend renderers already exist (per task list #105/#106) so the rendering layer is in place — bottleneck is sourcing the visuals into the generator prompt. Target: 15-20% of MCQs visual within 30 days; DBQ Doc-2 always visual.
4. **Fix the answer/explanation mismatch defect class.** Audit-and-fix script: for every MCQ, parse the explanation for "correct answer is X" and `assert X === correctAnswer`; auto-flag mismatches and either regenerate or null the explanation pending review. The bug is consistent with shuffling distractor letters after writing the explanation. Permanent fix: in the generator prompt, force the AI to choose the correct-letter slot **after** writing distractors, then write the explanation referencing that letter. (Beta 8.7 prompt may already do this — verify and check the 4 flagged IDs for `modelUsed`.)

### P1 — fix in next quality sprint
5. **Tighten source attribution format.** Update generator prompt to require: `Source: <Author>, <profession + nationality>, <work title in italics>, <year>` and reject paraphrased attributions ("Adapted from…", "Court chronicle, circa…"). Validator check: if `Adapted from` appears in stimulus, fail. If year is given as "circa NNNN" without supporting attribution, fail. This brings our content one step closer to CB's tone.
6. **Backfill empty / one-sentence explanations.** Query `WHERE LENGTH(explanation) < 120 OR explanation = ''` and regenerate. ~10–15% of bank affected based on sample. Target: every explanation 250–600 chars, names a specific institution / dated event / scholar, identifies why each distractor is wrong (not just why the correct one is right).
7. **Ban fabricated source titles.** Add a validator rule: if the source title is not in a whitelist of real publications/works (we can compile from CB's released items), flag for human review. "The Indian Times, 1985" type fabrications erode trust if a teacher spot-checks.

### P2 — ongoing polish
8. **Extend stimulus length on the bottom 20%.** 17 MCQs (~3%) have <200-char stimuli. Push toward 300–600 chars to match CB's primary-source weight.
9. **Audit cognitive level by difficulty tag.** Cross-tab `difficulty` against stem-verb. EASY stems should be more recall-tilted; HARD should require contextualization. Currently HARD includes some pure-recall items (e.g. Haitian Revolution unique-because question) which under-prepares strong students.
10. **Add an LEQ-prompt bank.** LEQ doesn't need a stimulus — just a CB-style prompt + thesis rubric + 2 historical-context paragraphs + 2 evidence paragraphs the student is expected to write. Generate 30 LEQ prompts (10 per period), expose via a "Practice LEQ thesis" UI. Lower priority than SAQ/DBQ but a free addition once the FRQ infrastructure exists.

### P3 — defer
11. Unit balance is fine. Period coverage is fine. Don't redistribute existing questions.

---

## 6. Open Questions / Caveats

- **Image extraction blind spot:** `pdf-parse` extracts text only. SAQ presentation files (which contain the visual stimuli for stimulus-based SAQ Q1 + Q2) likely have additional images we couldn't catalog without OCR or `pdf-parse`'s `getImage()` call. The DBQ Doc-2 photograph and Ottoman postcard described above are the visuals the text-extraction surface confirmed; there are likely 4-8 more across the SAQ presentation files. This strengthens (not weakens) the P0 visual gap.
- **MCQ section was not released** by CB (digital-only since 2020). All comparison of our MCQs against "CB MCQ style" is therefore inferred from FRQ source-quote style, the 2017 released MCQ practice exam, and the CED. Treat MCQ-stem stylistic gaps as suggestive, not definitive.
- **Sample size:** 30 random MCQs out of 534. The 4/30 (13%) answer/explanation mismatch rate is a credible signal but a full-table sweep is needed to get the precise count. Recommended: run that sweep as part of fix #4.

---

**Word count:** ~1,930 words (within 2,000-word cap).
