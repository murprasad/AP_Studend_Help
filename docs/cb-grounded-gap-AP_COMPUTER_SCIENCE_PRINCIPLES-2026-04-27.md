# AP_COMPUTER_SCIENCE_PRINCIPLES — CB-grounded gap audit (2026-04-27)

Compares 30 random approved MCQs from prod DB vs 29 actual College Board released PDFs (locally extracted).

## CB content reference (what the real exam looks like)

| Metric | Value | Per 1k words |
|---|---:|---:|
| Total words across CB sources | 70,080 | — |
| Multi-part stems (A/B/C) | 0 | 0.00 |
| CB-strict source citations | 0 | 0.00 |
| Visual references (map/chart/cartoon/etc.) | 7 | 0.10 |
| Italicized primary-source quotes | 106 | — |
| Avg multi-part stem length (chars) | 316 | — |

## Our prod content (sampled 30 MCQs)

| Metric | Our value | Gap vs CB |
|---|---:|---|
| Avg stimulus length (chars) | 254 | CB stems avg 316 |
| Avg stem length (chars) | 142 | — |
| Avg explanation length (chars) | 328 | — |
| Multi-part stems | 0/30 | CB has 0 multi-part across 29 files. ❌ Our MCQs are single-part only — CB FRQs are multi-part |
| CB-strict source citations | 0/30 | CB has 0 citations. ✅ |
| Visual references | 0/30 | CB has 7.  |
| Real images (stimulusImageUrl) | 0/30 | ❌ Zero images platform-wide |
| Visual-content stimuli (table/KaTeX/code/etc.) | 9/30 | — |
| Phantom-visual references (refs visual w/o image) | 0/30 | ✅ |
| Stale-letter explanation leak | 0/30 | ✅ |
| Unanchored hedging in stem | 10/30 | ⚠ best/most without anchor |

## CB content excerpt (first 1k chars from largest file)

From `data/cb-frqs/AP_COMPUTER_SCIENCE_PRINCIPLES/ap23-apc-computer-science-principles-create.pdf`:

```
2023
AP
®
Computer Science
Principles
Sample Student Responses
and Scoring Commentary
© 2023 College Board. College Board, Advanced Placement, AP, AP Central, and the acorn logo are registered
trademarks of College Board. Visit College Board on the web: collegeboard.org.
AP Central is the official online home for the AP Program: apcentral.collegeboard.org.
Inside:
Performance Task—Create
5	5 	Scoring Guidelines
5	5 	Scoring Commentary
Student Samples provided separately
-- 1 of 37 --
AP® Computer Science Principles 2023 Scoring Guidelines
© 2023 College Board
Create Performance Task 	6 points
General Scoring Notes
• 	Responses should be evaluated solely on the rationale provided.
• 	Responses must demonstrate all criteria, including those within bulleted lists, in each row to earn the point for that row.
• 	Terms and phrases defined in the terminology list are italicized when they first appear in the scoring criteria.
Reporting
Category Scoring Criteria 	Decision Rules
Row 1
Program 
```

## Our content samples (3 random MCQs in full)

### Sample 1 — cmo3t2jgn0 [EASY | CSP_3_ALGORITHMS_AND_PROGRAMMING]

**Stimulus:** x ← 4
result ← x + 2
result ← result * 3
result ← result - 5

**Question:** What is the value of result after the following pseudocode is executed?

**Correct:** B · **Explanation:** First, x is assigned 4. Then result = 4 + 2 = 6. Then result = 6 * 3 = 18. Finally, result = 18 - 5 = 13. B) 18 is wrong . C) 7 is wrong . D) 11 is wrong .

---

### Sample 2 — cmo1i217z0 [HARD | CSP_1_CREATIVE_DEVELOPMENT]

**Stimulus:** ```
PROCEDURE FindValue(list)
  result <- 0
  index <- 1
  REPEAT UNTIL index > LENGTH(list)
    IF list[index] > result
      result <- list[index]
    index <- index + 1
  RETURN result
```

**Question:** A student traces this procedure with input list [10, 5, 8, 3, 9]. What value is returned?

**Correct:** B · **Explanation:** Tracing the procedure: index starts at 1 (AP pseudocode uses 1-based indexing). Iteration 1: list[1]=10 > 0, result=10. Iteration 2: list[2]=5 not > 10. Iteration 3: list[3]=8 not > 10. Iteration 4: list[4]=3 not > 10. Iteration 5: list[5]=9 not > 10

---

### Sample 3 — cmo2wllkd0 [HARD | CSP_1_CREATIVE_DEVELOPMENT]

**Stimulus:** Two programmers are assigned to build a student grade-tracking system. Programmer A develops a PROCEDURE CalculateAverage(scores) that returns the mean of a list. Programmer B develops a PROCEDURE DisplayGrade(average) that outputs letter grades based on numerical averages. Both procedures must work together in the final program. The team must decide how to coordinate their work to ensure Calculat

**Question:** A team designs a program with multiple procedures. What practice prevents integration errors when team members work on separate procedures?

**Correct:** B · **Explanation:** This is a foundational collaborative practice in modular program design.The AP CSP curriculum emphasizes that clear documentation and shared specifications are essential for collaborative development, particularly when abstraction and modularity are 

---
