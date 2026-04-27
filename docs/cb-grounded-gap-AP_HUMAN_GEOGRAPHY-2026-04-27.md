# AP_HUMAN_GEOGRAPHY — CB-grounded gap audit (2026-04-27)

Compares 30 random approved MCQs from prod DB vs 40 actual College Board released PDFs (locally extracted).

## CB content reference (what the real exam looks like)

| Metric | Value | Per 1k words |
|---|---:|---:|
| Total words across CB sources | 132,881 | — |
| Multi-part stems (A/B/C) | 15 | 0.11 |
| CB-strict source citations | 1 | 0.01 |
| Visual references (map/chart/cartoon/etc.) | 271 | 2.04 |
| Italicized primary-source quotes | 105 | — |
| Avg multi-part stem length (chars) | 153 | — |

## Our prod content (sampled 30 MCQs)

| Metric | Our value | Gap vs CB |
|---|---:|---|
| Avg stimulus length (chars) | 0 | CB stems avg 153 |
| Avg stem length (chars) | 133 | — |
| Avg explanation length (chars) | 5 | — |
| Multi-part stems | 0/30 | CB has 15 multi-part across 40 files. ❌ Our MCQs are single-part only — CB FRQs are multi-part |
| CB-strict source citations | 0/30 | CB has 1 citations. ❌ We don't use CB source format |
| Visual references | 0/30 | CB has 271.  |
| Real images (stimulusImageUrl) | 0/30 | ❌ Zero images platform-wide |
| Visual-content stimuli (table/KaTeX/code/etc.) | 0/30 | — |
| Phantom-visual references (refs visual w/o image) | 0/30 | ✅ |
| Stale-letter explanation leak | 0/30 | ✅ |
| Unanchored hedging in stem | 5/30 | ⚠ best/most without anchor |

## CB content excerpt (first 1k chars from largest file)

From `data/cb-frqs/AP_HUMAN_GEOGRAPHY/ap24-cr-report-human-geography-set-1.pdf`:

```
© 2024 College Board.
Visit College Board on the web: collegeboard.org.
Chief Reader Report on Student Responses:
2024 AP ® Human Geography Set 1
Free-Response Questions
• Number of Students Scored 	262,253
• Number of Readers 	1,208
• Score Distribution 	Exam Score 	N 	%At
5 	46,891 	17.9
4 	53,776 	20.5
3 	46,552 	17.8
2 	37,556 	14.3
1 	77,478 	29.5
• Global Mean 	2.83
The following comments on the 2024 free-response questions for AP ® Human Geography were
written by the Chief Reader, Dr. Lisa Benton-Short, Professor of Geography at The George
Washington University. They give an overview of each free-response question and of how students
performed on the question, including typical student errors. General comments regarding the skills
and content that students frequently have the most problems with are included. Some suggestions for
improving student preparation in these areas are also provided. Teachers are encouraged to attend a
College Board workshop to learn strategies for impro
```

## Our content samples (3 random MCQs in full)

### Sample 1 — cmo9ztvcf0 [HARD | HUGEO_1_THINKING_GEOGRAPHICALLY]

**Question:** Why do informal economic activities emerge in developing world megacities? 

**Correct:** B · **Explanation:** 

---

### Sample 2 — cmo9zrena0 [MEDIUM | HUGEO_1_THINKING_GEOGRAPHICALLY]

**Question:** The construction of large-scale irrigation systems in arid regions, such as the Imperial Valley in California, is an example of which type of human-environment interaction?

**Correct:** D · **Explanation:** 

---

### Sample 3 — cmo9k07g30 [HARD | HUGEO_1_THINKING_GEOGRAPHICALLY]

**Question:** A country with a high population density and limited arable land is likely to have which of the following types of agricultural production systems?

**Correct:** D · **Explanation:** 

---
