# AP_PHYSICS_1 — CB-grounded gap audit (2026-04-27)

Compares 30 random approved MCQs from prod DB vs 32 actual College Board released PDFs (locally extracted).

## CB content reference (what the real exam looks like)

| Metric | Value | Per 1k words |
|---|---:|---:|
| Total words across CB sources | 83,672 | — |
| Multi-part stems (A/B/C) | 2 | 0.02 |
| CB-strict source citations | 0 | 0.00 |
| Visual references (map/chart/cartoon/etc.) | 122 | 1.46 |
| Italicized primary-source quotes | 0 | — |
| Avg multi-part stem length (chars) | 196 | — |

## Our prod content (sampled 30 MCQs)

| Metric | Our value | Gap vs CB |
|---|---:|---|
| Avg stimulus length (chars) | 290 | CB stems avg 196 |
| Avg stem length (chars) | 168 | — |
| Avg explanation length (chars) | 472 | — |
| Multi-part stems | 0/30 | CB has 2 multi-part across 32 files. ❌ Our MCQs are single-part only — CB FRQs are multi-part |
| CB-strict source citations | 0/30 | CB has 0 citations. ✅ |
| Visual references | 0/30 | CB has 122.  |
| Real images (stimulusImageUrl) | 0/30 | ❌ Zero images platform-wide |
| Visual-content stimuli (table/KaTeX/code/etc.) | 22/30 | — |
| Phantom-visual references (refs visual w/o image) | 0/30 | ✅ |
| Stale-letter explanation leak | 0/30 | ✅ |
| Unanchored hedging in stem | 1/30 | ⚠ best/most without anchor |

## CB content excerpt (first 1k chars from largest file)

From `data/cb-frqs/AP_PHYSICS_1/ap23-cr-report-physics-1.pdf`:

```
© 2023 College Board.
Visit College Board on the web: collegeboard.org.
Chief Reader Report on Student Responses:
2023 AP ® Physics 1: Algebra-Based Free-Response Questions
• Number of Students Scored 	159,582
• Number of Readers 	624 (for all
Physics exams)
• Score Distribution 	Exam Score 	N 	%At
5 	14,012 	8.78
4 	29,244 	18.33
3 	29,500 	18.49
2 	44,620 	27.96
1 	42,206 	26.45
• Global Mean 	2.55
The following comments on the 2023 free-response questions for AP ® Physics 1: Algebra-Based were
written by the Chief Reader, Brian Utter, teaching professor and associate dean of general education
at the University of California, Merced. They give an overview of each free-response question and of
how students performed on the question, including typical student errors. General comments
regarding the skills and content that students frequently have the most problems with are included.
Some suggestions for improving student preparation in these areas are also provided. Teachers are
encoura
```

## Our content samples (3 random MCQs in full)

### Sample 1 — cmo3u0qdk0 [MEDIUM | PHY1_10_WAVES_AND_SOUND]

**Stimulus:** Diagram description: A horizontal road is shown with a fire truck moving to the right at 30 m/s toward a stationary observer (shown as a person standing to the right of the truck). Sound waves are depicted as compressed wavefronts in front of the truck and stretched wavefronts behind it. The siren frequency is labeled as f₀ = 800 Hz, v_sound = 340 m/s, and v_truck = 30 m/s.

**Question:** A fire truck with a siren at 800 Hz moves toward a stationary observer at 30 m/s. What frequency does the observer hear as the truck approaches and recedes?

**Correct:** C · **Explanation:** The Doppler effect formula for a moving source and stationary observer is f_obs = f₀ × (v_sound) / (v_sound ∓ v_source). When the source moves TOWARD the observer, the denominator decreases (v_sound − v_source = 340 − 30 = 310), giving f_obs = 800 × 

---

### Sample 2 — cmo3tkith0 [EASY | PHY1_9_DC_CIRCUITS]

**Stimulus:** Circuit description: A 12 V battery is connected in a closed loop to a single resistor labeled R = 4 Ω. The positive terminal of the battery is connected to one end of the resistor, and the negative terminal is connected to the other end, forming a complete circuit.

**Question:** A simple circuit consists of a 12 V battery connected to a single resistor of 4 Ω. What is the current flowing through the resistor?

**Correct:** D · **Explanation:** Substituting the given values: I = 12 V / 4 Ω = 3 A. This is the correct application of Ohm's Law.This misapplies Ohm's Law by confusing the relationship between variables.33 A. This represents an inverted application of Ohm's Law.This reflects a fun

---

### Sample 3 — cmo3t6r5m0 [MEDIUM | PHY1_8_ELECTRIC_CHARGE_AND_FORCE]

**Stimulus:** Diagram description: A negatively charged rubber rod is held to the left of a neutral metal sphere. The sphere sits on a insulating stand and is not in contact with any other conductors or the ground. The rod does not touch the sphere.

**Question:** A negatively charged rubber rod is held near a neutral metal sphere on an insulator. What happens to the charge distribution on the sphere?

**Correct:** D · **Explanation:** The negatively charged rod repels free electrons in the sphere away from the near side toward the far side. This leaves a deficit of electrons (net positive charge) on the near side and a surplus of electrons (net negative charge) on the far side. Th

---
