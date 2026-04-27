# AP_PSYCHOLOGY — CB-grounded gap audit (2026-04-27)

Compares 30 random approved MCQs from prod DB vs 34 actual College Board released PDFs (locally extracted).

## CB content reference (what the real exam looks like)

| Metric | Value | Per 1k words |
|---|---:|---:|
| Total words across CB sources | 94,003 | — |
| Multi-part stems (A/B/C) | 4 | 0.04 |
| CB-strict source citations | 0 | 0.00 |
| Visual references (map/chart/cartoon/etc.) | 39 | 0.41 |
| Italicized primary-source quotes | 1 | — |
| Avg multi-part stem length (chars) | 0 | — |

## Our prod content (sampled 30 MCQs)

| Metric | Our value | Gap vs CB |
|---|---:|---|
| Avg stimulus length (chars) | 188 | n/a |
| Avg stem length (chars) | 137 | — |
| Avg explanation length (chars) | 512 | — |
| Multi-part stems | 0/30 | CB has 4 multi-part across 34 files. ❌ Our MCQs are single-part only — CB FRQs are multi-part |
| CB-strict source citations | 0/30 | CB has 0 citations. ✅ |
| Visual references | 0/30 | CB has 39.  |
| Real images (stimulusImageUrl) | 0/30 | ❌ Zero images platform-wide |
| Visual-content stimuli (table/KaTeX/code/etc.) | 2/30 | — |
| Phantom-visual references (refs visual w/o image) | 0/30 | ✅ |
| Stale-letter explanation leak | 0/30 | ✅ |
| Unanchored hedging in stem | 11/30 | ⚠ best/most without anchor |

## CB content excerpt (first 1k chars from largest file)

From `data/cb-frqs/AP_PSYCHOLOGY/ap25-cr-report-psychology-set-2.pdf`:

```
Chief Reader Report on Student Responses:
2025 AP ® Psychology Set 2 Free-Response Questions
• Number of Students Scored 	334,960
• Number of Readers 	1005
• Score Distribution 	Exam Score 	N 	%At
5 	48,145 	14.4
4 	103,524 	30.9
3 	84,498 	25.2
2 	65,882 	19.7
1 	32,911 	9.8
• Global Mean 	3.20
The following comments on the 2025 free-response questions for AP ® Psychology were written by
the Chief Reader, Elliott Hammer, Professor of Psychology at Xavier University of Louisiana. The
comments give an overview of each free-response question and of how students performed on the
question, including typical student errors. General comments regarding the skills and content that
students frequently have the most problems with are included. Some suggestions for improving
student preparation in these areas are also provided. Teachers are encouraged to attend a College
Board workshop to learn strategies for improving student performance in specific areas.
© 2025 College Board.
Visit College Boa
```

## Our content samples (3 random MCQs in full)

### Sample 1 — cmo1lxfi60 [MEDIUM | PSYCH_3_SENSATION_PERCEPTION]

**Stimulus:** Researchers presented participants with a series of images where a shape was partially occluded by other objects. Despite the absence of complete visual information, participants overwhelmingly reported perceiving the complete shape, even when up to 50% of the shape was obscured.

**Question:** Participants reported seeing complete shapes from fragmented images. Which Gestalt principle accounts for this perception?

**Correct:** C · **Explanation:** The correct answer, Closure, is a Gestalt principle that explains how our brains fill in missing visual information to perceive complete shapes or forms. This principle is directly relevant to the study's findings, where participants perceived comple

---

### Sample 2 — cmo1m39930 [HARD | PSYCH_4_LEARNING]

**Stimulus:** In a study, children were divided into two groups: one group watched an adult model behave aggressively towards a Bobo doll, while the other group did not. Afterwards, the children were given a Bobo doll and their behavior was observed. The group that watched the adult model exhibited significantly more aggressive behavior towards the doll.

**Question:** Based on the study described above, which of the following best explains the observed increase in aggressive behavior among children who watched the adult model?

**Correct:** B · **Explanation:** In this study, the children learned aggressive behavior by observing the adult model.The explanation for the distractors is clear and concise, and the correct answer is well-supported by the stimulus and the psychological theory.

---

### Sample 3 — 5a9bfa64-1 [EASY | PSYCH_9_SOCIAL]

**Question:** When James sees his coworker arrive late to a meeting, he assumes the coworker is irresponsible. However, the coworker's car had broken down that morning. Which cognitive bias best explains James's initial judgment?

**Correct:** D · **Explanation:** The fundamental attribution error (also called correspondence bias) describes the tendency to attribute others' behavior to internal, dispositional factors while underestimating situational factors. James attributed the coworker's lateness to a chara

---
