# AP_PRECALCULUS — CB-grounded gap audit (2026-04-27)

Compares 30 random approved MCQs from prod DB vs 16 actual College Board released PDFs (locally extracted).

## CB content reference (what the real exam looks like)

| Metric | Value | Per 1k words |
|---|---:|---:|
| Total words across CB sources | 53,610 | — |
| Multi-part stems (A/B/C) | 0 | 0.00 |
| CB-strict source citations | 0 | 0.00 |
| Visual references (map/chart/cartoon/etc.) | 174 | 3.25 |
| Italicized primary-source quotes | 0 | — |
| Avg multi-part stem length (chars) | 52 | — |

## Our prod content (sampled 30 MCQs)

| Metric | Our value | Gap vs CB |
|---|---:|---|
| Avg stimulus length (chars) | 42 | CB stems avg 52 |
| Avg stem length (chars) | 197 | — |
| Avg explanation length (chars) | 244 | — |
| Multi-part stems | 0/30 | CB has 0 multi-part across 16 files. ❌ Our MCQs are single-part only — CB FRQs are multi-part |
| CB-strict source citations | 0/30 | CB has 0 citations. ✅ |
| Visual references | 0/30 | CB has 174.  |
| Real images (stimulusImageUrl) | 0/30 | ❌ Zero images platform-wide |
| Visual-content stimuli (table/KaTeX/code/etc.) | 24/30 | — |
| Phantom-visual references (refs visual w/o image) | 0/30 | ✅ |
| Stale-letter explanation leak | 0/30 | ✅ |
| Unanchored hedging in stem | 1/30 | ⚠ best/most without anchor |

## CB content excerpt (first 1k chars from largest file)

From `data/cb-frqs/AP_PRECALCULUS/ap25-cr-report-precalculus.pdf`:

```
Chief Reader Report on Student Responses:
2025 AP ® Precalculus Free-Response Questions
• Number of Students Scored 	254,469
• Number of Readers 	714
• Score Distribution 	Exam Score 	N 	%At
5 	71,426 	28.1%
4 	65,578 	25.8%
3 	68,335 	26.9%
2 	28,696 	11.3%
1 	20,434 	8.0%
• Global Mean 	3.55
The following comments on the 2025 free-response questions for AP ® Precalculus were written by
the Chief Reader, Michael Boardman of Pacific University. They give an overview of each free-
response question and of how students performed on the question, including typical student errors.
General comments regarding the skills and content that students frequently have the most problems
with are included. Some suggestions for improving student preparation in these areas are also
provided. Teachers are encouraged to attend a College Board workshop to learn strategies for
improving student performance in specific areas.
© 2025 College Board.
Visit College Board on the web: collegeboard.org.
-- 1 of 1
```

## Our content samples (3 random MCQs in full)

### Sample 1 — cmob0qmfs0 [MEDIUM | PRECALC_1_POLYNOMIAL_RATIONAL]

**Stimulus:** $$f(x) = 2x^3 - 5x^2 - 11x + 17$$

**Question:** The function f(x) = 2x^3 - 5x^2 - 11x + 17 is defined for all real numbers x. For what value of x does the function have a local minimum?

**Correct:** A · **Explanation:** To find the local minimum, we need to take the derivative of f(x) and set it equal to zero. The derivative of f(x) is f'(x) = 6x^2 - 10x - 11. Setting f'(x) = 0 gives 6x^2 - 10x - 11 = 0. Factoring the quadratic equation gives (3x + 1)(2x - 11) = 0, 

---

### Sample 2 — cmo9jz7bc0 [EASY | PRECALC_1_POLYNOMIAL_RATIONAL]

**Stimulus:** $$h(x) = 2\sin(x) + 3\cos(x) - 1$$

**Question:** The function f is given by f(x) = 2sin(x) + 1, and the function g is given by g(x) = 3cos(x) - 2. What is the period of the function h(x) = f(x) + g(x)?

**Correct:** D · **Explanation:** The period of f(x) = 2sin(x) + 1 is 2π, and the period of g(x) = 3cos(x) - 2 is also 2π. Since the periods of f and g are the same, the period of h(x) = f(x) + g(x) is also 2π.

---

### Sample 3 — cmob1a6wd0 [HARD | PRECALC_1_POLYNOMIAL_RATIONAL]

**Stimulus:** $$P(t) = P_0(2^{t/4})$$

**Question:** A population of bacteria grows according to the function P(t) = P0(2^(t/4)), where P0 is the initial population and t is the time in hours. Which of the following functions models the population of bacteria after d days, where P0 is the initial population at time d = 0?

**Correct:** A · **Explanation:** Since there are 24 hours in a day, the time in hours is given by t = 24d. Substituting this into the original function gives P(24d) = P0(2^(24d/4)) = P0(2^6d).

---
