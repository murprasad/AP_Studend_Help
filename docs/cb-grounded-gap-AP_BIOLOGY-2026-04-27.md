# AP_BIOLOGY — CB-grounded gap audit (2026-04-27)

Compares 30 random approved MCQs from prod DB vs 37 actual College Board released PDFs (locally extracted).

## CB content reference (what the real exam looks like)

| Metric | Value | Per 1k words |
|---|---:|---:|
| Total words across CB sources | 90,094 | — |
| Multi-part stems (A/B/C) | 8 | 0.09 |
| CB-strict source citations | 0 | 0.00 |
| Visual references (map/chart/cartoon/etc.) | 32 | 0.36 |
| Italicized primary-source quotes | 0 | — |
| Avg multi-part stem length (chars) | 144 | — |

## Our prod content (sampled 30 MCQs)

| Metric | Our value | Gap vs CB |
|---|---:|---|
| Avg stimulus length (chars) | 169 | CB stems avg 144 |
| Avg stem length (chars) | 165 | — |
| Avg explanation length (chars) | 498 | — |
| Multi-part stems | 0/30 | CB has 8 multi-part across 37 files. ❌ Our MCQs are single-part only — CB FRQs are multi-part |
| CB-strict source citations | 0/30 | CB has 0 citations. ✅ |
| Visual references | 1/30 | CB has 32. ⚠ We reference visuals but have no images |
| Real images (stimulusImageUrl) | 0/30 | ❌ Zero images platform-wide |
| Visual-content stimuli (table/KaTeX/code/etc.) | 10/30 | — |
| Phantom-visual references (refs visual w/o image) | 1/30 | ⚠ confusing for student |
| Stale-letter explanation leak | 0/30 | ✅ |
| Unanchored hedging in stem | 11/30 | ⚠ best/most without anchor |

## CB content excerpt (first 1k chars from largest file)

From `data/cb-frqs/AP_BIOLOGY/ap25-cr-report-biology.pdf`:

```
Chief Reader Report on Student Responses:
2025 AP® Biology Free-Response Questions
• Number of Students Scored 	288,132
• Number of Readers 	1,424
• Score Distribution 	Exam Score 	N 	%At
5 	54,306 	18.8
4 	69,446 	24.1
3 	78,923 	27.4
2 	60,673 	21.1
1 	24,784 	8.6
• Global Mean 	3.24
The following comments on the 2025 free-response questions for AP® Biology were written by the
Chief Reader, Jay Mager, Ohio Northern University, Ada, Ohio; with substantial assistance from the
Operational Exam Leader, Amy Doling, Simpson College, Indianola, Iowa; and Question Leaders,
Cyndie Beale, West Valley High School, Fairbanks, Alaska; Rob Benedetto, Central Catholic High
School, Lawrence, Massachusetts; Monika Biro, Aurora High School, Aurora, Ohio; Deborah Jones,
Oxford High School, Oxford, Mississippi; Jeff Regier, Thompson Valley High School, Loveland,
Colorado; and Michelle Solensky, University of Jamestown, Jamestown, North Dakota. The
comments provide an overview of each free-response quest
```

## Our content samples (3 random MCQs in full)

### Sample 1 — bbc0e385-6 [MEDIUM | BIO_2_CELL_STRUCTURE_FUNCTION]

**Question:** A patient's thyroid gland is surgically removed. Which hormonal change would you expect immediately after surgery, and why?

**Correct:** C · **Explanation:** Without thyroid hormone production, negative feedback inhibition on the anterior pituitary is removed, causing TSH levels to rise as the pituitary attempts to stimulate a non-functional gland.

---

### Sample 2 — cmo1wagdo0 [HARD | BIO_3_CELLULAR_ENERGETICS]

**Stimulus:** Glycolysis Step Summary (per glucose):
| Step | Reaction | ATP Change |
|------|----------|------------|
| 1 | Glucose → G6P | −1 ATP |
| 3 | F6P → F1,6BP | −1 ATP |
| 7 | 1,3-BPG → 3-PG (×2) | +2 ATP |
| 10 | PEP → Pyruvate (×2) | +2 ATP |
Net ATP = −2 (investment) + 4 (payoff) = +2 ATP
PGK catalyzes Step 7: 1,3-bisphosphoglycerate → 3-phosphoglycerate

**Question:** A researcher inhibits phosphoglycerate kinase in yeast cells. What is the net change in ATP and accumulation of intermediates?

**Correct:** C · **Explanation:** Without step 7 proceeding, 1,3-BPG cannot be converted to 3-PG, so 1,3-BPG accumulates upstream. The cell still consumed 2 ATP in the investment phase (steps 1 and 3), but gains 0 ATP from step 7, yielding a net of −2 ATP per glucose. Step 10 also ca

---

### Sample 3 — 32feccef-b [EASY | BIO_7_NATURAL_SELECTION]

**Question:** Vestigial structures in organisms, such as human tailbones and whale hip bones, provide evidence for evolution primarily by demonstrating what?

**Correct:** B · **Explanation:** Vestigial structures are reduced, non-functional remnants of structures that were useful in ancestral species, indicating shared evolutionary history. This supports common descent—a core principle of evolution.

---
