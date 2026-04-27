# AP_CALCULUS_AB — CB-grounded gap audit (2026-04-27)

Compares 30 random approved MCQs from prod DB vs 37 actual College Board released PDFs (locally extracted).

## CB content reference (what the real exam looks like)

| Metric | Value | Per 1k words |
|---|---:|---:|
| Total words across CB sources | 163,869 | — |
| Multi-part stems (A/B/C) | 0 | 0.00 |
| CB-strict source citations | 0 | 0.00 |
| Visual references (map/chart/cartoon/etc.) | 226 | 1.38 |
| Italicized primary-source quotes | 10 | — |
| Avg multi-part stem length (chars) | 143 | — |

## Our prod content (sampled 30 MCQs)

| Metric | Our value | Gap vs CB |
|---|---:|---|
| Avg stimulus length (chars) | 150 | CB stems avg 143 |
| Avg stem length (chars) | 164 | — |
| Avg explanation length (chars) | 352 | — |
| Multi-part stems | 0/30 | CB has 0 multi-part across 37 files. ❌ Our MCQs are single-part only — CB FRQs are multi-part |
| CB-strict source citations | 0/30 | CB has 0 citations. ✅ |
| Visual references | 3/30 | CB has 226. ⚠ We reference visuals but have no images |
| Real images (stimulusImageUrl) | 0/30 | ❌ Zero images platform-wide |
| Visual-content stimuli (table/KaTeX/code/etc.) | 18/30 | — |
| Phantom-visual references (refs visual w/o image) | 3/30 | ⚠ confusing for student |
| Stale-letter explanation leak | 0/30 | ✅ |
| Unanchored hedging in stem | 0/30 | ✅ |

## CB content excerpt (first 1k chars from largest file)

From `data/cb-frqs/AP_CALCULUS_AB/ap24-cr-report-calculus.pdf`:

```
Chief Reader Report on Student Responses:
2024 AP ® Calculus AB/BC Free-Response Questions
Number of Readers (Calculus AB/Calculus BC): 	1,572
Calculus AB
• Number of Students Scored 	278,657
• Score Distribution 	Exam Score 	N 	%At
5 	59,569 	21.4
4 	77,458 	27.8
3 	42,533 	15.3
2 	63,178 	22.7
1 	35,919 	12.9
• Global Mean 	3.22
Calculus BC
• Number of Students Scored 	148,191
• Score Distribution 	Exam Score 	N 	%At
5 	70,723 	47.7
4 	31,217 	21.1
3 	17,880 	12.1
2 	20,668 	13.9
1 	7,703 	5.2
• Global Mean 	3.92
Calculus BC Calculus AB Subscore
• Number of Students Scored 	148,191
• Score Distribution 	Exam Score 	N 	%At
5 	74,262 	50.1
4 	43,966 	29.7
3 	12,508 	8.4
2 	13,598 	9.2
1 	3,857 	2.6
• Global Mean 	4.16
* The number of students with Calculus AB subscores may differ slightly from the number of students who took the AP Calculus BC Exam due to exam administration
incidents.
The following comments on the 2024 free-response questions for AP ® Calculus AB and Calculus BC were

```

## Our content samples (3 random MCQs in full)

### Sample 1 — cmo3t171q0 [EASY | CALC_AB_4_CONTEXTUAL_APPLICATIONS]

**Stimulus:** Position function: x(t) = 3t² − 6t + 2 (x in meters, t in seconds)

**Question:** A student pushes a toy car along a straight track. The position of the car as a function of time is given by the equation x(t) = 3t² − 6t + 2, where x is in meters and t is in seconds. What is the velocity of the car at t = 3 seconds?

**Correct:** B · **Explanation:** The correct answer's reasoning is based on the velocity function v(t) = x'(t) = 6t - 6. At t = 3 seconds, v(3) = 6(3) - 6 = 12 m/s, which is the velocity of the car.

---

### Sample 2 — cmo7zbmce0 [MEDIUM | CALC_AB_1_LIMITS]

**Question:** If a function f is defined by f(x) = 3x^2 sin(x), what is the derivative of f at x = π/2, using the product rule?

**Correct:** A · **Explanation:** This yields f'(x) = 3x^2 cos(x) + 6x sin(x). Evaluating this at x = π/2 gives f'(π/2) = 3(π/2)^2 cos(π/2) + 6(π/2) sin(π/2). Since cos(π/2) = 0 and sin(π/2) = 1, we have f'(π/2) = 0 + 6(π/2) = 3π.

---

### Sample 3 — cmo3tipa40 [EASY | CALC_AB_5_ANALYTICAL_APPLICATIONS]

**Stimulus:** Graph description: The graph of f'(x) is a continuous curve on the interval [-3, 3]. The graph of f'(x) crosses the x-axis (changes sign) at x = -2, x = 0, and x = 2. At x = -2, f'(x) changes from positive to negative. At x = 0, f'(x) changes from negative to positive. At x = 2, f'(x) changes from positive to negative. Between these zeros, f'(x) is below the x-axis for (-2, 0) and above the x-axis

**Question:** The graph of f'(x) is shown below. At which x-value does f(x) have a relative minimum?

**Correct:** A · **Explanation:** At x = 0, f'(x) goes from negative (on the interval (-2, 0)) to positive (on the interval (0, 2)), which means f(x) was decreasing and then starts increasing — the definition of a relative minimum.The minimum of the derivative and the minimum of the 

---
