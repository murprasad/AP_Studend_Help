# AP_CHEMISTRY — CB-grounded gap audit (2026-04-27)

Compares 30 random approved MCQs from prod DB vs 39 actual College Board released PDFs (locally extracted).

## CB content reference (what the real exam looks like)

| Metric | Value | Per 1k words |
|---|---:|---:|
| Total words across CB sources | 108,305 | — |
| Multi-part stems (A/B/C) | 4 | 0.04 |
| CB-strict source citations | 0 | 0.00 |
| Visual references (map/chart/cartoon/etc.) | 136 | 1.26 |
| Italicized primary-source quotes | 7 | — |
| Avg multi-part stem length (chars) | 133 | — |

## Our prod content (sampled 30 MCQs)

| Metric | Our value | Gap vs CB |
|---|---:|---|
| Avg stimulus length (chars) | 133 | CB stems avg 133 |
| Avg stem length (chars) | 178 | — |
| Avg explanation length (chars) | 359 | — |
| Multi-part stems | 0/30 | CB has 4 multi-part across 39 files. ❌ Our MCQs are single-part only — CB FRQs are multi-part |
| CB-strict source citations | 0/30 | CB has 0 citations. ✅ |
| Visual references | 0/30 | CB has 136.  |
| Real images (stimulusImageUrl) | 0/30 | ❌ Zero images platform-wide |
| Visual-content stimuli (table/KaTeX/code/etc.) | 18/30 | — |
| Phantom-visual references (refs visual w/o image) | 0/30 | ✅ |
| Stale-letter explanation leak | 0/30 | ✅ |
| Unanchored hedging in stem | 2/30 | ⚠ best/most without anchor |

## CB content excerpt (first 1k chars from largest file)

From `data/cb-frqs/AP_CHEMISTRY/ap25-cr-report-chemistry.pdf`:

```
Chief Reader Report on Student Responses:
2025 AP ® Chemistry Free-Response Questions
• Number of Students Scored 	170,283
• Number of Readers 	713
• Score Distribution 	Exam Score 	N 	%At
5 	30,277 	17.8
4 	48,732 	28.6
3 	53,601 	31.5
2 	27,116 	15.9
1 	10,557 	6.2
• Global Mean 	3.36
The following comments on the 2025 free-response questions for AP® Chemistry were written by the
Chief Reader, Kyle A. Beran, Angelo State University. They give an overview of each free-response
question and of how students performed on the question, including typical student errors. General
comments regarding the skills and content that students frequently have the most problems with are
included. Some suggestions for improving student preparation in these areas are also provided.
Teachers are encouraged to attend a College Board workshop to learn strategies for improving
student performance in specific areas.
© 2025 College Board.
Visit College Board on the web: collegeboard.org.
-- 1 of 44 --
© 202
```

## Our content samples (3 random MCQs in full)

### Sample 1 — cmmzbx2ci0 [EASY | CHEM_3_INTERMOLECULAR_FORCES]

**Stimulus:** Consider the molecules CH₃F, CH₃CH₃, CH₃OH, and CH₃OCH₃. Which exhibits hydrogen bonding as its strongest intermolecular force?

**Question:** Which molecule exhibits hydrogen bonding as its strongest intermolecular force?

**Correct:** C · **Explanation:** Methanol (CH3OH) contains an O-H bond where hydrogen is directly bonded to highly electronegative oxygen, enabling hydrogen bonding. This is the strongest intermolecular force present. Propane (CH3CH3) only has London dispersion forces since it lacks

---

### Sample 2 — cmo7zi2uo0 [EASY | CHEM_1_ATOMIC_STRUCTURE]

**Stimulus:** A sample of H₂(g) is collected over H₂O(l) at 25°C and 760 mmHg. What is the partial pressure of H₂?

**Question:** A sample of hydrogen gas is collected over water at a temperature of 25°C and a pressure of 760 mmHg. Which of the following is the partial pressure of the hydrogen gas in the sample?

**Correct:** A · **Explanation:** 

---

### Sample 3 — cmo4fh7qx0 [EASY | CHEM_8_ACIDS_BASES]

**Stimulus:** Use the Henderson–Hasselbalch equation or the acetate Ka table.

**Question:** A 0.10 M acetic acid (pKa = 4.76) solution is mixed with an equal volume of a 0.10 M sodium acetate solution to make a 0.10 M buffer. What is the approximate pH of this buffer?

**Correct:** B · **Explanation:** Using the Henderson–Hasselbalch equation, pH = pKa + log([A⁻]/[HA]). The ratio of acetate to acetic acid is 1, so log 1 = 0, making pH = 4.76.

---
