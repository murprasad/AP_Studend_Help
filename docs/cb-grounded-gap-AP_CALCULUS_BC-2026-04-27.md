# AP_CALCULUS_BC — CB-grounded gap audit (2026-04-27)

Compares 30 random approved MCQs from prod DB vs 37 actual College Board released PDFs (locally extracted).

## CB content reference (what the real exam looks like)

| Metric | Value | Per 1k words |
|---|---:|---:|
| Total words across CB sources | 164,472 | — |
| Multi-part stems (A/B/C) | 0 | 0.00 |
| CB-strict source citations | 0 | 0.00 |
| Visual references (map/chart/cartoon/etc.) | 219 | 1.33 |
| Italicized primary-source quotes | 10 | — |
| Avg multi-part stem length (chars) | 139 | — |

## Our prod content (sampled 30 MCQs)

| Metric | Our value | Gap vs CB |
|---|---:|---|
| Avg stimulus length (chars) | 225 | CB stems avg 139 |
| Avg stem length (chars) | 140 | — |
| Avg explanation length (chars) | 292 | — |
| Multi-part stems | 0/30 | CB has 0 multi-part across 37 files. ❌ Our MCQs are single-part only — CB FRQs are multi-part |
| CB-strict source citations | 0/30 | CB has 0 citations. ✅ |
| Visual references | 11/30 | CB has 219. ⚠ We reference visuals but have no images |
| Real images (stimulusImageUrl) | 0/30 | ❌ Zero images platform-wide |
| Visual-content stimuli (table/KaTeX/code/etc.) | 12/30 | — |
| Phantom-visual references (refs visual w/o image) | 11/30 | ⚠ confusing for student |
| Stale-letter explanation leak | 0/30 | ✅ |
| Unanchored hedging in stem | 0/30 | ✅ |

## CB content excerpt (first 1k chars from largest file)

From `data/cb-frqs/AP_CALCULUS_BC/ap24-cr-report-calculus.pdf`:

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

### Sample 1 — cmo3tuxb40 [HARD | CALC_BC_6_INTEGRATION]

**Stimulus:** $$\int_{0}^{\frac{\pi}{2}} \sin^{3}(x)\cos(x) dx$$

**Question:** Evaluate the definite integral: ∫₀^(π/2) sin³(x)cos(x) dx

Which of the following is the correct value of this integral?

**Correct:** A · **Explanation:** The integral transforms as follows: when x = 0, u = sin(0) = 0; when x = π/2, u = sin(π/2) = 1. The integral becomes ∫₀¹ u³ du = [u⁴/4]₀¹ = 1/4 - 0 = 1/4. The key insight is recognizing that cos(x) dx is exactly the differential of sin(x), making u-s

---

### Sample 2 — cmo3s1e2j0 [MEDIUM | CALC_BC_1_LIMITS]

**Stimulus:** Graph description: The graph of f(x) has the following features:
• At x = -2: a filled circle at (-2, 3), and the function approaches 3 from both sides — no issue here.
• At x = 1: an open circle at (1, 4) and a filled circle at (1, 1). The left-hand limit and right-hand limit both equal 4, but f(1) = 1. This is a removable discontinuity.
• At x = 3: a jump discontinuity — the left-hand limit is 2

**Question:** The graph of f(x) is shown above. At which of the following x-values is f(x) NOT continuous?

**Correct:** B · **Explanation:** f(x) is not continuous at x = 1 and x = 3 due to a removable and jump discontinuity, respectively. The limit does not exist at x = 3, violating condition (2) of continuity.

---

### Sample 3 — cmo3s13hv0 [EASY | CALC_BC_1_LIMITS]

**Stimulus:** Graph description: The graph of f(x) shows a continuous curve. As x approaches 2 from both the left and right sides, the function values approach y = 4. There is a closed point at (2, 4), confirming f(2) = 4. The curve is smooth and well-behaved near x = 2, with no breaks, holes, or asymptotes in that region.

**Question:** The graph of f(x) is shown above. Based on the graph, what is the value of lim(x→2) [3·f(x) + 1]?

**Correct:** A · **Explanation:** By the limit laws, lim(x→2) [3·f(x) + 1] = 3·lim(x→2) f(x) + lim(x→2) 1. From the graph, lim(x→2) f(x) = 4, so the expression equals 3·(4) + 1 = 12 + 1 = 13. The constant multiple law allows the 3 to be factored out, and the sum law allows the limit 

---
