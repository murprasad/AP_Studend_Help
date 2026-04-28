# SAT CB-fidelity audit — 2026-04-27
Source: satsuite.collegeboard.org/media/pdf/digital-sat-test-spec-overview.pdf + assessment-framework-for-digital-sat-suite.pdf
Retrieved: 2026-04-27

## SAT_READING_WRITING — official: 54 Qs / 64 min
Bank: 498 approved (498 MCQ)
With stimulus (>50 chars): 37 (7.4%)
**CRITICAL:** Every R&W question requires a passage. Coverage: 7.4% — gap = 92.6%

### Content domain coverage (per CB: 4 domains)
Units in DB:
  SAT_RW_1_CRAFT_STRUCTURE: 471
  SAT_RW_4_EXPRESSION_IDEAS: 10
  SAT_RW_2_INFO_IDEAS: 9
  SAT_RW_3_STANDARD_ENGLISH: 8

Official CB R&W content domains:
  Craft and Structure (28%, 13-15 Qs/exam): Words in Context, Text Structure and Purpose, Cross-Text Connections
  Information and Ideas (26%, 12-14 Qs/exam): Central Ideas and Details, Command of Evidence (Textual), Command of Evidence (Quantitative), Inferences
  Standard English Conventions (26%, 11-15 Qs/exam): Boundaries, Form, Structure, and Sense
  Expression of Ideas (20%, 8-12 Qs/exam): Rhetorical Synthesis, Transitions

### Question types in our DB:
  MCQ: 498
Official: 100% MCQ (4-option) — matches our DB shape if all MCQ.

## SAT_MATH — official: 44 Qs / 70 min
Bank: 503 approved (493 MCQ)
With stimulus: 437 (88.6%)
Note: Math stimulus optional (in-context word problems vs pure equation).

### Content domain coverage (per CB: 4 domains)
Units in DB:
  SAT_MATH_1_ALGEBRA: 470
  SAT_MATH_2_ADVANCED_MATH: 13
  SAT_MATH_3_PROBLEM_SOLVING: 10
  SAT_MATH_4_GEOMETRY_TRIG: 10

Official CB Math content domains:
  Algebra (35%, 13-15 Qs/exam): Linear equations in one variable, Linear equations in two variables, Linear functions, Systems of two linear equations in two variables, Linear inequalities in one or two variables
  Advanced Math (35%, 13-15 Qs/exam): Equivalent expressions, Nonlinear equations in one variable and systems of equations in two variables, Nonlinear functions
  Problem-Solving and Data Analysis (15%, 5-7 Qs/exam): Ratios, rates, proportional relationships, and units, Percentages, One-variable data: distributions and measures of center and spread, Two-variable data: models and scatterplots, Probability and conditional probability, Inference from sample statistics and margin of error, Evaluating statistical claims: observational studies and experiments
  Geometry and Trigonometry (15%, 5-7 Qs/exam): Area and volume, Lines, angles, and triangles, Right triangles and trigonometry, Circles

### Question types in our DB:
  MCQ: 493
  FRQ: 10
SPR (Student-Produced Response) coverage: 2.0% — official requires 25%.
**GAP:** if SPR < 20%, we don't faithfully simulate the real test.

## Summary — blockers before SAT can claim CB fidelity:
❌ 2 blockers:
   - SAT_R&W stimulus coverage: 7.4% (need ~100% — every R&W Q needs a passage)
   - SAT_MATH SPR coverage: 2.0% (need ~25% — student-produced response is 11/44 Qs on real exam)
