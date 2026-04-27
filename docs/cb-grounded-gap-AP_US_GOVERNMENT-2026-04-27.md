# AP_US_GOVERNMENT — CB-grounded gap audit (2026-04-27)

Compares 30 random approved MCQs from prod DB vs 46 actual College Board released PDFs (locally extracted).

## CB content reference (what the real exam looks like)

| Metric | Value | Per 1k words |
|---|---:|---:|
| Total words across CB sources | 111,208 | — |
| Multi-part stems (A/B/C) | 48 | 0.43 |
| CB-strict source citations | 0 | 0.00 |
| Visual references (map/chart/cartoon/etc.) | 79 | 0.71 |
| Italicized primary-source quotes | 16 | — |
| Avg multi-part stem length (chars) | 0 | — |

## Our prod content (sampled 30 MCQs)

| Metric | Our value | Gap vs CB |
|---|---:|---|
| Avg stimulus length (chars) | 0 | n/a |
| Avg stem length (chars) | 137 | — |
| Avg explanation length (chars) | 94 | — |
| Multi-part stems | 0/30 | CB has 48 multi-part across 46 files. ❌ Our MCQs are single-part only — CB FRQs are multi-part |
| CB-strict source citations | 0/30 | CB has 0 citations. ✅ |
| Visual references | 0/30 | CB has 79.  |
| Real images (stimulusImageUrl) | 0/30 | ❌ Zero images platform-wide |
| Visual-content stimuli (table/KaTeX/code/etc.) | 0/30 | — |
| Phantom-visual references (refs visual w/o image) | 0/30 | ✅ |
| Stale-letter explanation leak | 0/30 | ✅ |
| Unanchored hedging in stem | 6/30 | ⚠ best/most without anchor |

## CB content excerpt (first 1k chars from largest file)

From `data/cb-frqs/AP_US_GOVERNMENT/ap25-cr-report-us-gopo-set-1.pdf`:

```
Chief Reader Report on Student Responses:
2025 AP ® United States Government and Politics Free-Response Questions
Set 1
• Number of Students Scored 	388,804
• Number of Readers 	1574
• Score Distribution 	Exam Score 	N 	%At
5 	92,022 	23.7
4 	96,493 	24.8
3 	90,277 	23.2
2 	71,529 	18.4
1 	38,483 	9.9
• Global Mean 	3.34
The following comments on the 2025 free-response questions for AP ® United States Government and
Politics were written by the Chief Reader, Stella Rouse, Professor, Arizona State University, with
assistance from AP Reading leadership. They give an overview of each free-response question and of
how students performed on the question, including typical student errors. General comments
regarding the skills and content that students frequently have the most problems with are included.
Some suggestions for improving student preparation in these areas are also provided. Teachers are
encouraged to attend a College Board workshop to learn strategies for improving student
perfo
```

## Our content samples (3 random MCQs in full)

### Sample 1 — cmob1bh550 [MEDIUM | USGOV_1_FOUNDATIONS]

**Question:** Which action by Congress checks the executive branch's foreign policy authority?

**Correct:** A · **Explanation:** 

---

### Sample 2 — cmob0zj2i0 [MEDIUM | USGOV_1_FOUNDATIONS]

**Question:** Which of the following best describes the primary role of the Senate in the lawmaking process, according to the Constitution?

**Correct:** B · **Explanation:** 

---

### Sample 3 — cmob16sj10 [MEDIUM | USGOV_1_FOUNDATIONS]

**Question:** What Senate role in lawmaking is outlined in the US Constitution?

**Correct:** D · **Explanation:** 

---
