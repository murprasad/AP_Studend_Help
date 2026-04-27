# AP_ENVIRONMENTAL_SCIENCE — CB-grounded gap audit (2026-04-27)

Compares 30 random approved MCQs from prod DB vs 40 actual College Board released PDFs (locally extracted).

## CB content reference (what the real exam looks like)

| Metric | Value | Per 1k words |
|---|---:|---:|
| Total words across CB sources | 97,351 | — |
| Multi-part stems (A/B/C) | 6 | 0.06 |
| CB-strict source citations | 0 | 0.00 |
| Visual references (map/chart/cartoon/etc.) | 101 | 1.04 |
| Italicized primary-source quotes | 18 | — |
| Avg multi-part stem length (chars) | 134 | — |

## Our prod content (sampled 30 MCQs)

| Metric | Our value | Gap vs CB |
|---|---:|---|
| Avg stimulus length (chars) | 0 | CB stems avg 134 |
| Avg stem length (chars) | 153 | — |
| Avg explanation length (chars) | 98 | — |
| Multi-part stems | 0/30 | CB has 6 multi-part across 40 files. ❌ Our MCQs are single-part only — CB FRQs are multi-part |
| CB-strict source citations | 0/30 | CB has 0 citations. ✅ |
| Visual references | 0/30 | CB has 101.  |
| Real images (stimulusImageUrl) | 0/30 | ❌ Zero images platform-wide |
| Visual-content stimuli (table/KaTeX/code/etc.) | 0/30 | — |
| Phantom-visual references (refs visual w/o image) | 0/30 | ✅ |
| Stale-letter explanation leak | 0/30 | ✅ |
| Unanchored hedging in stem | 9/30 | ⚠ best/most without anchor |

## CB content excerpt (first 1k chars from largest file)

From `data/cb-frqs/AP_ENVIRONMENTAL_SCIENCE/ap24-cr-report-environmental-science-set-1.pdf`:

```
© 2024 College Board.
Visit College Board on the web: collegeboard.org.
Chief Reader Report on Student Responses:
2024 AP ® Environmental Science Set 1
Free-Response Questions
• Number of Students Scored 	236,579
• Number of Readers 	835
• Score Distribution 	Exam Score 	N 	%At
5 	21,774 	9.2
4 	65,057 	27.5
3 	41,232 	17.4
2 	61,009 	25.8
1 	47,507 	20.1
• Global Mean 	2.80
The following comments on the 2024 free-response questions for AP ® Environmental Science were
written by the Chief Reader, Laura J. Hainsworth, Professor of Chemistry and Environmental Studies,
Emory & Henry University. They give an overview of each free-response question and of how
students performed on the question, including typical student errors. General comments regarding
the skills and content that students frequently have the most problems with are included. Some
suggestions for improving student preparation in these areas are also provided. Teachers are
encouraged to attend a College Board workshop to lea
```

## Our content samples (3 random MCQs in full)

### Sample 1 — cmo9zsyfe0 [MEDIUM | APES_1_ECOSYSTEMS]

**Question:** A forest ecosystem has a net primary productivity of 800 grams of biomass per square meter per year. If 60% of this biomass is consumed by herbivores, what is the approximate amount of biomass transferred to the decomposer level, assuming a 10% transfer efficiency from herbivores to carnivores?

**Correct:** B · **Explanation:** Since 40% of 800 grams per square meter per year is 320 grams per square meter per year, this is the amount of biomass transferred to the decomposer level.

---

### Sample 2 — cmo9zd43e0 [MEDIUM | APES_1_ECOSYSTEMS]

**Question:** If dissolved nutrients in a lake increase due to agricultural runoff, what will likely occur?

**Correct:** D · **Explanation:** An increase in dissolved nutrients in a lake due to runoff from agricultural activities will likely lead to an increase in phytoplankton growth, as these organisms rely on nutrients such as nitrogen and phosphorus to undergo photosynthesis.

---

### Sample 3 — cmo9zq9kv0 [HARD | APES_1_ECOSYSTEMS]

**Question:** A researcher is studying the effects of acid rain on a forest ecosystem. The data collected shows a significant decrease in the pH of the soil over the past 20 years. Which of the following would be the most likely cause of this decrease in soil pH?

**Correct:** C · **Explanation:** The decrease in soil pH is most likely caused by the increased levels of sulfur dioxide emissions from industrial sources, which combine with water and oxygen in the atmosphere to form sulfuric acid, a major component of acid rain.

---
