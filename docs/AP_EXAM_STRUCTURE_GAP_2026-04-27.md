# AP Exam Structure Gap Analysis — 2026-04-27

CB official exam structures pulled from `apcentral.collegeboard.org/courses/<course>/exam` for all 14 supported AP courses. Below: real exam composition vs our DB state, plus generation plan to close gaps.

## Cross-course matrix

| Course | CB exam structure | Total FRQs | We have (MCQ / FRQs) | Gap |
|---|---|---:|---|---|
| AP_WORLD_HISTORY | 55 MCQ + 3 SAQ + 1 DBQ + 1 LEQ | 5 | 534 / 5 SAQ + 5 DBQ + 5 LEQ | ✅ all 4 types covered |
| AP_US_HISTORY | 55 MCQ + 3 SAQ + 1 DBQ + 1 LEQ | 5 | 499 / 6 SAQ + 5 DBQ + 5 LEQ | ✅ all 4 types covered |
| AP_US_GOVERNMENT | 55 MCQ + 4 distinct FRQs | 4 | 479 / 15 generic SAQ | ❌ Missing: Concept App, Quantitative Analysis, SCOTUS Comparison, Argument Essay |
| AP_HUMAN_GEOGRAPHY | 60 MCQ + 3 FRQs (no-stim, 1-stim, 2-stim) | 3 | 500 / 15 generic SAQ | ❌ Need Q1/Q2/Q3 subtypes |
| AP_PSYCHOLOGY | 75 MCQ + 2 FRQs (AAQ + EBQ) | 2 | 500 / 8 generic FRQ | ❌ Missing AAQ + EBQ formats |
| AP_ENVIRONMENTAL_SCIENCE | 80 MCQ + 3 FRQs (Design, Analyze+Solution, Calc) | 3 | 485 / 15 generic FRQ | ❌ Need 3 subtypes |
| AP_BIOLOGY | 60 MCQ + 2 Long FRQ (9pt) + 4 Short FRQ (4pt) | 6 | 509 / 2 generic FRQ | ❌ Need long vs short, 4 subtypes |
| AP_CHEMISTRY | 60 MCQ + 3 Long FRQ (10pt) + 4 Short FRQ (4pt) | 7 | 500 / 1 generic FRQ | ❌ Need long vs short |
| AP_PHYSICS_1 | 40 MCQ + 4 FRQs (Math, Translation, Lab, Qual/Quant) | 4 | 502 / 15 generic FRQ | ❌ Need 4 subtypes |
| AP_STATISTICS | 40 MCQ + 5 multipart FRQ + 1 Investigative Task | 6 | 500 / 15 generic FRQ | ❌ Need 5 multipart subtypes + Investigative Task |
| AP_CALCULUS_AB | 45 MCQ + 6 FRQs (2 calc + 4 no-calc) | 6 | 500 / 9 FRQ | ⚠ Need calc vs no-calc split |
| AP_CALCULUS_BC | 45 MCQ + 6 FRQs (2 calc + 4 no-calc) | 6 | 495 / 1 FRQ | ❌ Need both subtypes + more questions |
| AP_PRECALCULUS | 40 MCQ + 4 FRQs (FunctionConcepts, NonPeriodic, Periodic, SymbolicManip) | 4 | 467 / 15 generic FRQ | ❌ Need 4 distinct subtypes |
| AP_COMPUTER_SCIENCE_PRINCIPLES | 70 MCQ + 2 written responses (Program Design, Algorithm/Errors/Data) | 2 | 500 / 6 CODING | ❌ Need 2 written response types (separate from CODING) |

## Strategy

1. **Use `subtopic` field** to differentiate FRQ subtypes within the same course (e.g. `AAQ` vs `EBQ` for Psych).
2. **Generate 5 per subtype per course** — enough variety for practice without burning Groq.
3. **Tag with CB official names** so users see "AAQ Practice", "Argument Essay Practice", etc.
4. **Mark `isApproved=true`** so questions land in FRQ Practice immediately.
5. **Use existing CB 2025 PDFs** as style references — already locally extracted.

Total seed budget: ~14 courses × ~3 subtypes × 5 questions = **~210 generations**, ~3.5 hours of Groq at 2.5s pacing per call.

## Already done in this session

- AP_WORLD_HISTORY: 5 SAQ + 5 DBQ + 5 LEQ generated
- AP_US_HISTORY: 6 SAQ + 5 DBQ + 5 LEQ generated

## Pending (this directive)

11 courses × specific FRQ subtypes. Plan in next commit.
