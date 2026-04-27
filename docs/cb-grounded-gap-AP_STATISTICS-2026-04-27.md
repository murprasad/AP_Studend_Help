# AP_STATISTICS — CB-grounded gap audit (2026-04-27)

Compares 30 random approved MCQs from prod DB vs 36 actual College Board released PDFs (locally extracted).

## CB content reference (what the real exam looks like)

| Metric | Value | Per 1k words |
|---|---:|---:|
| Total words across CB sources | 188,989 | — |
| Multi-part stems (A/B/C) | 4 | 0.02 |
| CB-strict source citations | 0 | 0.00 |
| Visual references (map/chart/cartoon/etc.) | 129 | 0.68 |
| Italicized primary-source quotes | 2 | — |
| Avg multi-part stem length (chars) | 260 | — |

## Our prod content (sampled 30 MCQs)

| Metric | Our value | Gap vs CB |
|---|---:|---|
| Avg stimulus length (chars) | 228 | CB stems avg 260 |
| Avg stem length (chars) | 215 | — |
| Avg explanation length (chars) | 396 | — |
| Multi-part stems | 0/30 | CB has 4 multi-part across 36 files. ❌ Our MCQs are single-part only — CB FRQs are multi-part |
| CB-strict source citations | 0/30 | CB has 0 citations. ✅ |
| Visual references | 1/30 | CB has 129. ⚠ We reference visuals but have no images |
| Real images (stimulusImageUrl) | 0/30 | ❌ Zero images platform-wide |
| Visual-content stimuli (table/KaTeX/code/etc.) | 10/30 | — |
| Phantom-visual references (refs visual w/o image) | 1/30 | ⚠ confusing for student |
| Stale-letter explanation leak | 0/30 | ✅ |
| Unanchored hedging in stem | 1/30 | ⚠ best/most without anchor |

## CB content excerpt (first 1k chars from largest file)

From `data/cb-frqs/AP_STATISTICS/ap23-cr-report-statistics.pdf`:

```
© 2023 College Board.
Visit College Board on the web: collegeboard.org.
Chief Reader Report on Student Responses:
2023 AP ® Statistics Free-Response Questions
• Number of Students Scored 	242,929
• Number of Readers 	1,385
• Score Distribution 	Exam Score 	N 	%At
5 	36,661 	15.09
4 	53,909 	22.19
3 	55,196 	22.72
2 	39,248 	16.16
1 	57,915 	23.84
• Global Mean 	2.89
The following comments on the 2023 free-response questions for AP ® Statistics were written by the
Chief Reader, Dr. Barb Barnet, Ph.D. They give an overview of each free-response question and of
how students performed on the question, including typical student errors. General comments
regarding the skills and content that students frequently have the most problems with are included.
Some suggestions for improving student preparation in these areas are also provided. Teachers are
encouraged to attend a College Board workshop to learn strategies for improving student performance
in specific areas.
-- 1 of 23 --
© 2023 Coll
```

## Our content samples (3 random MCQs in full)

### Sample 1 — cmo3s7wzv0 [HARD | STATS_2_MODELING_DATA]

**Stimulus:** Residual Plot Description: The x-axis represents Net Force (N) ranging from 1 N to 10 N. The y-axis represents Residuals (m/s²) ranging from -0.8 to +0.8. Data points follow a distinct U-shaped (parabolic) curve: points near 1–2 N have residuals around -0.6, points near 5–6 N have residuals around +0.7, and points near 9–10 N have residuals around -0.5. The points are NOT randomly scattered around

**Question:** A physics student investigates the relationship between net force and acceleration. The residual plot from a linear regression shows a curved pattern. What conclusion should the student draw?

**Correct:** D · **Explanation:** Curved residuals indicate a nonlinear relationship, meaning a linear model is not the best fit. A systematic curved pattern in the residual plot signals that the linear model is missing a nonlinear trend in the data.

---

### Sample 2 — cmo4eo2330 [MEDIUM | STATS_9_INFERENCE_SLOPES]

**Stimulus:** I = 5.12V + a, SE = 1.28, df = 48, 95% confidence level

**Question:** A physics lab uses a linear regression model to relate voltage to current. Given a slope of 5.12, SE of 1.28, and 48 degrees of freedom, what conclusion can be drawn about the slope at a 95% confidence level?

**Correct:** B · **Explanation:** The t-statistic is 5.12 / 1.28 = 4.0. With df = 48, the critical t for a 95% two‑sided test is about 2.01, so the null hypothesis (slope = 0) is rejected at the 5% level. The 95% CI is \(5.12 \pm 2.01(1.28)\), which is about (2.55, 7.69); zero is not

---

### Sample 3 — cmmzbpfxb0 [EASY | STATS_9_INFERENCE_SLOPES]

**Stimulus:** Computer output from a simple linear regression model: 
Predictor      Coef    SE Coef    
Constant       65.3     3.2    
Hours Studied   4.2      1.5    
R-squared = 0.64


**Question:** A researcher studies the relationship between hours studied and exam score for a sample of 25 students. The computer output shows a slope estimate of 4.2 with a standard error of 1.5. Which of the following is the correct null hypothesis for testing whether there is a linear relationship between hou

**Correct:** B · **Explanation:** The correct null hypothesis for testing whether there is a linear relationship between two variables in simple linear regression is H₀: β₁ = 0, where β₁ is the population slope parameter. This tests whether the slope is significantly different from z

---
