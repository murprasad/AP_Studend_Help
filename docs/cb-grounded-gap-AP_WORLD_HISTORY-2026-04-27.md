# AP_WORLD_HISTORY — CB-grounded gap audit (2026-04-27)

Compares 30 random approved MCQs from prod DB vs 96 actual College Board released PDFs (locally extracted).

## CB content reference (what the real exam looks like)

| Metric | Value | Per 1k words |
|---|---:|---:|
| Total words across CB sources | 512,282 | — |
| Multi-part stems (A/B/C) | 32 | 0.06 |
| CB-strict source citations | 21 | 0.04 |
| Visual references (map/chart/cartoon/etc.) | 167 | 0.33 |
| Italicized primary-source quotes | 40 | — |
| Avg multi-part stem length (chars) | 251 | — |

## Our prod content (sampled 30 MCQs)

| Metric | Our value | Gap vs CB |
|---|---:|---|
| Avg stimulus length (chars) | 376 | CB stems avg 251 |
| Avg stem length (chars) | 123 | — |
| Avg explanation length (chars) | 351 | — |
| Multi-part stems | 0/30 | CB has 32 multi-part across 96 files. ❌ Our MCQs are single-part only — CB FRQs are multi-part |
| CB-strict source citations | 0/30 | CB has 21 citations. ❌ We don't use CB source format |
| Visual references | 0/30 | CB has 167.  |
| Real images (stimulusImageUrl) | 0/30 | ❌ Zero images platform-wide |
| Visual-content stimuli (table/KaTeX/code/etc.) | 5/30 | — |
| Phantom-visual references (refs visual w/o image) | 0/30 | ✅ |
| Stale-letter explanation leak | 0/30 | ✅ |
| Unanchored hedging in stem | 8/30 | ⚠ best/most without anchor |

## CB content excerpt (first 1k chars from largest file)

From `data/cb-frqs/AP_WORLD_HISTORY/2019-sg.pdf`:

```
2019
AP
®
World History
Scoring Guidelines
© 2019 The College Board. College Board, Advanced Placement, AP, AP Central, and the acorn logo are
registered trademarks of the College Board. Visit the College Board on the web: collegeboard.org.
AP Central is the official online home for the AP Program: apcentral.collegeboard.org.
-- 1 of 44 --
AP® WORLD HISTORY
2019 SCORING GUIDELINES
Short Answer Question 1
Use the passage below to answer all parts of the question that follows.
“Inner [and Central] Asia have long been seen as a zone of contact and transmission, a lengthy conveyor belt
on which commercial and cultural wares traveled between the major civilizations of Eurasia. The nomads had
an essential but largely unacknowledged role in this cultural traffic. While nomadic empires had as their
primary objective the control and exploitation of sedentary subjects, their secondary effect was the creation of
numerous opportunities for cross-cultural contact, comparison, and exchange.
Indeed
```

## Our content samples (3 random MCQs in full)

### Sample 1 — cmo1m66s50 [MEDIUM | UNIT_7_GLOBAL_CONFLICT]

**Stimulus:** 'The number of Jews in the Warsaw Ghetto has been reduced from approximately 450,000 to 40,000... The ghetto has been sealed off, and its inhabitants are suffering from starvation and disease.' - Report from the Jewish Council in Warsaw, 1942

**Question:** What was a primary cause of the conditions in the Warsaw Ghetto, as described in this 1942 report?

**Correct:** B · **Explanation:** The Nazi's deliberate policy of ghettoization, driven by their racial ideology, directly led to the starvation, disease, and significant reduction in population described in the report.

---

### Sample 2 — cmmu1vxmf0 [MEDIUM | UNIT_5_REVOLUTIONS]

**Question:** Latin American independence movements of the early 19th century were led primarily by creoles rather than indigenous peoples because creoles

**Correct:** B · **Explanation:** Creoles (American-born people of Spanish descent) were wealthy and educated but legally excluded from top colonial offices, which were reserved for peninsulares (Spain-born Spaniards). This exclusion, combined with Enlightenment ideas, motivated thei

---

### Sample 3 — cmo0qsksc0 [MEDIUM | UNIT_3_LAND_BASED_EMPIRES]

**Stimulus:** A 1526 account by a Mughal court official describes the Battle of Panipat: 'The thunder of cannons and muskets shattered the enemy's formations before their cavalry could advance. Our artillery positioned on the ridge commanded the field, and the opposing forces, lacking such weapons, could neither withstand our bombardment nor effectively counter our horsemen.' The victory established Mughal domi

**Question:** Which factor explains why gunpowder empires expanded territorial control during the sixteenth century?

**Correct:** C · **Explanation:** 

---
