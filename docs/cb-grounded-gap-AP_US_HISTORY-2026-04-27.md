# AP_US_HISTORY — CB-grounded gap audit (2026-04-27)

Compares 30 random approved MCQs from prod DB vs 76 actual College Board released PDFs (locally extracted).

## CB content reference (what the real exam looks like)

| Metric | Value | Per 1k words |
|---|---:|---:|
| Total words across CB sources | 403,635 | — |
| Multi-part stems (A/B/C) | 0 | 0.00 |
| CB-strict source citations | 37 | 0.09 |
| Visual references (map/chart/cartoon/etc.) | 99 | 0.25 |
| Italicized primary-source quotes | 10 | — |
| Avg multi-part stem length (chars) | 216 | — |

## Our prod content (sampled 30 MCQs)

| Metric | Our value | Gap vs CB |
|---|---:|---|
| Avg stimulus length (chars) | 159 | CB stems avg 216 |
| Avg stem length (chars) | 130 | — |
| Avg explanation length (chars) | 133 | — |
| Multi-part stems | 0/30 | CB has 0 multi-part across 76 files. ❌ Our MCQs are single-part only — CB FRQs are multi-part |
| CB-strict source citations | 0/30 | CB has 37 citations. ❌ We don't use CB source format |
| Visual references | 0/30 | CB has 99.  |
| Real images (stimulusImageUrl) | 0/30 | ❌ Zero images platform-wide |
| Visual-content stimuli (table/KaTeX/code/etc.) | 2/30 | — |
| Phantom-visual references (refs visual w/o image) | 0/30 | ✅ |
| Stale-letter explanation leak | 0/30 | ✅ |
| Unanchored hedging in stem | 12/30 | ⚠ best/most without anchor |

## CB content excerpt (first 1k chars from largest file)

From `data/cb-frqs/AP_US_HISTORY/2019-sg.pdf`:

```
2019
AP
®
United States
History
Scoring Guidelines
© 2019 The College Board. College Board, Advanced Placement, AP, AP Central, and the acorn logo are
registered trademarks of the College Board. Visit the College Board on the web: collegeboard.org.
AP Central is the official online home for the AP Program: apcentral.collegeboard.org.
-- 1 of 59 --
AP® UNITED STATES HISTORY
2019 SCORING GUIDELINES
Short Answer Question 1
“The revolutionary moment was neither radical nor a watershed for American women. Those who disregard
America’s commitment to patriarchal rule and plead for a historical interpretation that favors enlightened
exceptionalism have overlooked the conditions that made large-scale change all but impossible at that time
and place.”
Elaine Forman Crane, historian, Ebb Tide in New England: Women, Seaports, and Social Change, 1630–1800,
published in 1998
“The coming of the American Revolution . . . created new opportunities for women to participate in politics.
Responding to m
```

## Our content samples (3 random MCQs in full)

### Sample 1 — cmo3ssnml0 [EASY | APUSH_7_PERIOD_1890_1945]

**Stimulus:** Excerpt from Upton Sinclair's 'The Jungle' (1906): 'There was never the least attention paid to what was cut up for sausage; there would come all the way back from Europe old sausage that had been rejected, and that was moldy and white — it would be dosed with borax and glycerine, and dumped into the hoppers, and made over again for home consumption. There would be meat that had tumbled out on the

**Question:** Based on the excerpt below, what was the PRIMARY goal of muckraking journalists during the Progressive Era?

**Correct:** C · **Explanation:** Sinclair's 'The Jungle' directly contributed to the passage of the Pure Food and Drug Act and the Meat Inspection Act of 1906.

---

### Sample 2 — cmo82t6nb0 [MEDIUM | APUSH_1_PERIOD_1491_1607]

**Question:** The concept of Manifest Destiny, as expressed by politicians and writers in the mid-19th century, most directly reflected which of the following?

**Correct:** D · **Explanation:** The concept of Manifest Destiny was rooted in the idea that the United States was destined by God to expand its territory across North America.

---

### Sample 3 — cmo3rp3lj0 [EASY | APUSH_6_PERIOD_1865_1898]

**Stimulus:** Excerpt from 1880 New York Daily Tribune: "More than 800,000 Europeans have landed in America this year; the majority come from Ireland, Italy, and Germany. Many are attracted to the booming cities around New York, Chicago, and Philadelphia, where factories offer wages double those available at home. "

**Question:** The 1880 issue of the New York Daily Tribune reports that more than 800,000 immigrants arrived in the United States, largely from Ireland, Italy, and Germany. The article notes that many of these newcomers were drawn to the rapidly expanding cities where factories offered wages roughly twice what th

**Correct:** A · **Explanation:** S. immigration policy did not provide immediate citizenship for workers, and this was not mentioned in the excerpt.

---
