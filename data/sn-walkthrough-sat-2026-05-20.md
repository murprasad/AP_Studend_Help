# SN SAT Student Walkthrough — 2026-05-20

Persona: student took CB official digital SAT practice test #4 (free, on disk), then logged into StudentNest to drill against the SAT bank.
Method: bank pull from prod DB + sample comparison + cb_spec blueprint cross-reference.


---

## SAT_MATH (266 approved)

**Format:** {"0":10,"4":256} option dist | Stem avg 38w, median 36w

**Unit distribution:** SAT_MATH_1_ALGEBRA:149 | SAT_MATH_2_ADVANCED_MATH:98 | SAT_MATH_4_GEOMETRY_TRIG:13 | SAT_MATH_3_PROBLEM_SOLVING:6

**CB skill blueprint weights:**
- ALGEBRA: 35%
- ADVANCED_MATH: 35%
- PROBLEM_SOLVING_DATA_ANALYSIS: 15%
- GEOMETRY_AND_TRIGONOMETRY: 15%

**Findings:**
- [HIGH] wrong_opt_count: 10 Qs with non-4-opt format (dist {"0":10,"4":256})
- [HIGH] unit_imbalance: SAT_MATH_1_ALGEBRA: actual 56.0% vs CB 35.0% (delta 21.0pp)
- [HIGH] spr_short: Student-Produced Response (numeric-input) Qs: 0/266 (0.0%). CB digital SAT requires ~25% per module.
- [INFO] stim_share: Qs with stimulus: 86/266 (32.3%). CB expects ~15% with graph/table.

**CB vocab cue presence in bank stems (literal phrase match):**
- "What is the value of…" — 37 Qs (13.9%)
- "What is a solution to the given equation…" — 0 Qs (0.0%)
- "Which equation represents this situation…" — 2 Qs (0.8%)
- "Which equation defines f(x)…" — 0 Qs (0.0%)
- "What is the best interpretation of X in this context…" — 0 Qs (0.0%)
- "For what value of x does f(x) reach its minimum…" — 0 Qs (0.0%)
- "Which of the following correctly compares the medians and th…" — 0 Qs (0.0%)
- "It is plausible that the proportion is…" — 0 Qs (0.0%)
- "Note: Figure not drawn to scale / Figures provided are drawn…" — 0 Qs (0.0%)

**Sample 6 Qs:**
1. `[SAT_MATH_1_ALGEBRA | Algebra]` 4-opt, type=MCQ, correct=A
   "The function f(t) = 2t^2 + 5t - 3 represents the cost, in dollars, of producing t units of a product. What is the best interpretation of the constant term -3 in this context?..."
2. `[SAT_MATH_1_ALGEBRA | Geometry]` 4-opt, type=MCQ, correct=D, HAS_STIM
   "In a certain right triangle, the length of the hypotenuse is 10 inches and the length of one leg is 6 inches. What is the length, in inches, of the other leg?..."
3. `[SAT_MATH_2_ADVANCED_MATH | Polynomials]` 4-opt, type=MCQ, correct=A
   "If a polynomial function p has a zero at x = 2 + 3i, which of the following must also be a zero of p?..."
4. `[SAT_MATH_2_ADVANCED_MATH | Modeling]` 4-opt, type=MCQ, correct=A
   "A water tank is being filled at a rate that can be modeled by the function V(t) = 2t^2 + 5t, where V is the volume of water in cubic meters and t is the time in minutes. What is th..."
5. `[SAT_MATH_2_ADVANCED_MATH | Trigonometry]` 4-opt, type=MCQ, correct=B
   "A Ferris wheel makes one complete rotation every 10 minutes. If the height of a rider above the ground is a periodic function of time, what is the period of this function?..."
6. `[SAT_MATH_4_GEOMETRY_TRIG | Trigonometry]` 4-opt, type=MCQ, correct=A
   "A Ferris wheel with a diameter of 40 meters completes one full rotation every 5 minutes. If a rider starts at the bottom of the wheel, what is the vertical shift of the sinusoidal ..."

---

## SAT_READING_WRITING (745 approved)

**Format:** {"4":745} option dist | Stem avg 17w, median 15w

**Unit distribution:** SAT_RW_1_CRAFT_STRUCTURE:486 | SAT_RW_2_INFO_IDEAS:215 | SAT_RW_4_EXPRESSION_IDEAS:26 | SAT_RW_3_STANDARD_ENGLISH:18

**CB skill blueprint weights:**
- INFORMATION_AND_IDEAS: 26%
- CRAFT_AND_STRUCTURE: 28%
- EXPRESSION_OF_IDEAS: 20%
- STANDARD_ENGLISH_CONVENTIONS: 26%

**Findings:**
- [INFO] stim_share: Qs with stimulus: 745/745 (100.0%). CB expects ~15% with graph/table.

**CB vocab cue presence in bank stems (literal phrase match):**
- "Which choice completes the text with the most logical and pr…" — 0 Qs (0.0%)
- "Which choice best states the main idea of the text?…" — 0 Qs (0.0%)
- "Which choice best describes the overall structure of the tex…" — 0 Qs (0.0%)
- "Which choice best describes the function of the underlined s…" — 0 Qs (0.0%)
- "Which choice most logically completes the text?…" — 0 Qs (0.0%)
- "Which choice most effectively uses data from the graph/table…" — 0 Qs (0.0%)
- "Which finding, if true, would most directly support/weaken X…" — 0 Qs (0.0%)
- "Which quotation from X most effectively illustrates the clai…" — 0 Qs (0.0%)
- "Which choice completes the text with the most logical transi…" — 0 Qs (0.0%)
- "Which choice completes the text so that it conforms to the c…" — 0 Qs (0.0%)
- "While researching a topic, a student has taken the following…" — 0 Qs (0.0%)

**Sample 6 Qs:**
1. `[SAT_RW_4_EXPRESSION_IDEAS | transitions]` 4-opt, type=MCQ, correct=A, HAS_STIM
   "If the phrase "For instance" were removed from the beginning of the sentence in line 16 and not replaced, what would be the most significant effect on the relationship between the ..."
2. `[SAT_RW_4_EXPRESSION_IDEAS | logical organization]` 4-opt, type=MCQ, correct=C, HAS_STIM
   "Given the information in the passage about the impact of digital media on traditional forms of storytelling, if the trend towards immersive digital experiences continues, what woul..."
3. `[SAT_RW_1_CRAFT_STRUCTURE | Tone]` 4-opt, type=MCQ, correct=C, HAS_STIM
   "The narrator's attitude towards leaving home, as revealed in the passage, can best be described as..."
4. `[SAT_RW_3_STANDARD_ENGLISH | parallelism]` 4-opt, type=MCQ, correct=A, HAS_STIM
   "Which of the following revisions of the underlined sentence best maintains the parallelism of the original sentence?..."
5. `[SAT_RW_1_CRAFT_STRUCTURE | Characterization]` 4-opt, type=MCQ, correct=A, HAS_STIM
   "The narrator's portrayal of Mangan's sister in the passage suggests that he..."
6. `[SAT_RW_1_CRAFT_STRUCTURE | Tone]` 4-opt, type=MCQ, correct=C, HAS_STIM
   "The narrator's attitude towards Heathcliff can be inferred as..."
