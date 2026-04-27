# Cross-course gap audit — 2026-04-27

Methodology mirrors `docs/AP_WH_GAP_ANALYSIS_2026-04-27.md` but applied across every approved course in the bank. Same defects, surfaced as counts.

**Dimensions:**
- **Total** — approved questions in the course bank
- **MCQ** vs **FRQ** — CB exams are typically 50/50 by score weight; we are MCQ-heavy
- **Image** — questions with `stimulusImageUrl` populated (visual literacy questions)
- **Empty expl** — questions with no/blank explanation
- **Stale letter** — explanation references "A is correct" or similar but DB `correctAnswer` may differ (Beta 8.2 shuffle damage; should be 0 after Beta 8.5.1 strip)
- **Thin stim** — quantitative-course MCQs with stimulus shorter than 30 chars
- **Phantom visual** — stimulus references "the map/image/graph/cartoon" but no `stimulusImageUrl` — student is asked to read a visual that doesn't exist
- **CB-source** — stimuli matching the strict CB `Source: <Author>, <descriptor>, <type>, <year>` format

## Results

| Course | Total | MCQ | FRQ | Image | Empty Expl | Stale Letter | Thin Stim | Phantom Visual | CB-Source |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| AP_WORLD_HISTORY | 539 | 534 | 5 | 0 | 55 | 0 | 0 | 3 | 0 |
| AP_BIOLOGY | 511 | 509 | 2 | 0 | 28 | 0 | 82 | 18 | 0 |
| AP_CALCULUS_AB | 509 | 500 | 9 | 0 | 10 | 1 | 87 | 63 | 0 |
| AP_PSYCHOLOGY | 508 | 500 | 8 | 0 | 3 | 0 | 0 | 2 | 0 |
| AP_COMPUTER_SCIENCE_PRINCIPLES | 506 | 500 | 6 | 0 | 44 | 0 | 0 | 1 | 0 |
| AP_US_HISTORY | 505 | 499 | 6 | 0 | 182 | 0 | 0 | 6 | 0 |
| AP_PHYSICS_1 | 502 | 502 | 0 | 0 | 0 | 0 | 29 | 8 | 0 |
| AP_CHEMISTRY | 501 | 500 | 1 | 0 | 13 | 1 | 33 | 12 | 0 |
| AP_HUMAN_GEOGRAPHY | 500 | 500 | 0 | 0 | 418 | 0 | 0 | 0 | 0 |
| AP_STATISTICS | 500 | 500 | 0 | 0 | 21 | 0 | 14 | 7 | 0 |
| AP_CALCULUS_BC | 496 | 495 | 1 | 0 | 3 | 0 | 110 | 135 | 0 |
| AP_ENVIRONMENTAL_SCIENCE | 485 | 485 | 0 | 0 | 265 | 0 | 0 | 0 | 0 |
| AP_US_GOVERNMENT | 479 | 479 | 0 | 0 | 228 | 0 | 0 | 0 | 0 |
| AP_PRECALCULUS | 467 | 467 | 0 | 0 | 9 | 0 | 197 | 4 | 0 |
| SAT_READING_WRITING | 498 | 498 | 0 | 0 | 188 | 0 | 0 | 0 | 0 |
| SAT_MATH | 497 | 497 | 0 | 0 | 0 | 0 | 487 | 1 | 0 |
| ACT_SCIENCE | 499 | 499 | 0 | 0 | 15 | 0 | 476 | 0 | 0 |
| ACT_READING | 499 | 499 | 0 | 0 | 260 | 0 | 0 | 1 | 0 |
| ACT_ENGLISH | 497 | 497 | 0 | 0 | 280 | 0 | 0 | 0 | 0 |
| ACT_MATH | 493 | 493 | 0 | 0 | 0 | 0 | 481 | 0 | 0 |
| **TOTAL** | **9991** | **9953** | **38** | **0** | **2022** | **2** | **1996** | **261** | **0** |

## Headline gaps

- **38 of 9991 (0.4%)** are FRQ. CB exams are ~30–60% FRQ by score weight. **Massive practice-shape mismatch.**
- **0 of 9991 (0.00%)** have a real image. CB has document-stimulus / map / cartoon / chart in 25–60% of items. **Visual fidelity gap.**
- **261 of 9991 (2.6%)** stimuli reference a visual ("the map", "shown above") but `stimulusImageUrl` is null. **Student is asked to read an image that doesn't exist.**
- **2 of 9991 (0.02%)** explanations still leak a letter reference after Beta 8.5.1 strip. Should be ~0.
- **0 of 9991** stimuli use the CB strict source format. Adoption: 0.0%. **Source-attribution gap.**

## Worst-3 per dimension

### Fewest FRQs (by ratio)
- AP_PHYSICS_1: 0 of 502 (0.0%)
- AP_HUMAN_GEOGRAPHY: 0 of 500 (0.0%)
- AP_STATISTICS: 0 of 500 (0.0%)

### Fewest images
- AP_WORLD_HISTORY: 0 of 539 (0.0%)
- AP_BIOLOGY: 0 of 511 (0.0%)
- AP_CALCULUS_AB: 0 of 509 (0.0%)

### Most phantom-visual references
- AP_CALCULUS_BC: 135 of 496 (27.2%)
- AP_CALCULUS_AB: 63 of 509 (12.4%)
- AP_BIOLOGY: 18 of 511 (3.5%)

### Most leftover stale letter leaks
- AP_CHEMISTRY: 1 of 501 (0.2%)
- AP_CALCULUS_AB: 1 of 509 (0.2%)
- AP_WORLD_HISTORY: 0 of 539 (0.0%)

### Most empty explanations
- AP_HUMAN_GEOGRAPHY: 418 of 500 (83.6%)
- ACT_ENGLISH: 280 of 497 (56.3%)
- AP_ENVIRONMENTAL_SCIENCE: 265 of 485 (54.6%)

### Lowest CB-source-format adoption
- AP_WORLD_HISTORY: 0 of 539 (0.0%)
- AP_BIOLOGY: 0 of 511 (0.0%)
- AP_CALCULUS_AB: 0 of 509 (0.0%)
