# PrepLion Exam Standards QA Matrix

Authoritative acceptance contract for independent production QA. A route,
sample, or generated-bank score cannot certify an exam by itself. Certification
requires every applicable row below to have production evidence.

## Digital SAT

Primary authority:

- College Board Digital SAT structure and assessment framework.
- Local captured specification: `data/official/SAT/sat-spec.json`.

Required structure:

| Area | Official standard | Certification evidence |
|---|---|---|
| Reading and Writing | 54 questions, 64 minutes, two 27-question adaptive modules | Full mock configuration and browser run |
| Math | 44 questions, 70 minutes, two 22-question adaptive modules | Full mock configuration and browser run |
| R&W domains | Craft and Structure 28%; Information and Ideas 26%; Standard English Conventions 26%; Expression of Ideas 20% | Approved-bank and served-session distribution report |
| Math domains | Algebra 35%; Advanced Math 35%; Problem-Solving/Data Analysis 15%; Geometry/Trigonometry 15% | Approved-bank and served-session distribution report |
| Math formats | About 75% four-choice MCQ and 25% student-produced response | Bank, mock, rendering, submission, and scoring checks |
| R&W format | One short passage or passage pair per question; four choices | Full-bank structural gate and style audit |
| Adaptivity | Module 2 difficulty branches from Module 1 performance | Deterministic E2E branch tests |
| Presentation | SAT-native score scale and restrained exam shell; no pass-probability language | Desktop/mobile browser matrix |

Content certification additionally requires answer-key correctness,
distractor plausibility, figure-aware review, numeric-tolerance review,
duplicate/template analysis, and a College Board-style realism review.

## CLEP

Primary authority:

- Current College Board page and sample-question page for each individual
  CLEP exam.

CLEP is not one format. Every course needs its own versioned contract covering:

- current question count and time;
- current calculator policy;
- official content-domain weights;
- current response formats shown by College Board samples;
- passage, image, audio, or other stimulus requirements;
- credit recommendation and score information, with no unsupported promises.

### College Mathematics

Authority checked June 21, 2026:

- `https://clep.collegeboard.org/clep-exams/college-mathematics`
- `https://clep.collegeboard.org/prepare-for-an-exam/practice-questions-study-guides/sample-questions-college-mathematics`

| Area | Current official standard |
|---|---|
| Length | Approximately 60 questions in 90 minutes |
| Calculator | Integrated TI-30XS MultiView scientific calculator throughout |
| Algebra and Functions | 20% |
| Counting and Probability | 10% |
| Data Analysis and Statistics | 15% |
| Financial Mathematics | 20% |
| Geometry | 10% |
| Logic and Sets | 15% |
| Numbers | 10% |
| Cognitive mix | About 50% routine and 50% nonroutine |
| Formats demonstrated in official samples | Four-choice MCQ, true/false matrix, numeric entry, and category matrix |
| ACE recommendation shown by College Board | Score 50; 3 semester hours |

Important correction: four options are valid for current College Mathematics
MCQs. A blanket five-option CLEP gate is invalid. Certification must instead
verify the per-exam formats demonstrated by current College Board materials.

### College Algebra

Authority checked June 21, 2026:

- `https://clep.collegeboard.org/clep-exams/college-algebra`
- `https://clep.collegeboard.org/prepare-for-an-exam/practice-questions-study-guides/sample-questions-college-algebra`

| Area | Current official standard |
|---|---|
| Length | Approximately 60 questions in 90 minutes |
| Calculator | Integrated TI-30XS MultiView scientific calculator throughout |
| Algebraic operations | 25% |
| Equations and inequalities | 25% |
| Functions and their properties | 30% |
| Number systems and operations | 20% |
| Cognitive mix | About 50% routine and 50% nonroutine |
| Formats demonstrated in official samples | Five-choice MCQ, multiple select ("indicate all"), and numeric entry |
| ACE recommendation shown by College Board | Score 50; 3 semester hours |

The credit-granting score of 50 is a scaled score, not “about 50 questions
correct.” Product copy must not translate it into a raw-count claim.

### Precalculus

Authority checked June 21, 2026:

- `https://clep.collegeboard.org/clep-exams/precalculus`
- `https://clep.collegeboard.org/prepare-for-an-exam/practice-questions-study-guides/sample-questions-precalculus`

| Area | Current official standard |
|---|---|
| Length | Approximately 48 questions in 90 minutes |
| Section 1 | Approximately 25 questions in 50 minutes; integrated TI-84 Plus CE available |
| Section 2 | Approximately 23 questions in 40 minutes; no calculator |
| Algebraic expressions, equations, and inequalities | 20% |
| Functions: concept, properties, and operations | 15% |
| Representations of functions | 30% |
| Analytic geometry | 10% |
| Trigonometry and its applications | 15% |
| Functions as models | 10% |
| Additional scope note | Trigonometric knowledge is required by approximately 30%–40% of questions across domains |
| Formats demonstrated in official samples | Five-choice MCQ and numeric entry in both calculator-policy sections |
| ACE recommendation shown by College Board | Score 50; 3 semester hours |

Certification must separately prove section order, timer allocation, calculator
availability, item-format rendering/scoring, and official-domain composition.

### Calculus

Authority checked June 21, 2026:

- `https://clep.collegeboard.org/clep-exams/calculus`
- `https://clep.collegeboard.org/prepare-for-an-exam/practice-questions-study-guides/sample-questions-calculus`

| Area | Current official standard |
|---|---|
| Length | 44 questions in approximately 90 minutes |
| Section 1 | Approximately 27 questions in 50 minutes; no calculator |
| Section 2 | Approximately 17 questions in 40 minutes; integrated TI-84 Plus CE available |
| Limits | 10% |
| Differential calculus | 50% |
| Integral calculus | 40% |
| Cognitive mix | About 50% routine and 50% nonroutine |
| Formats demonstrated in official samples | Five-choice MCQ and numeric entry in both calculator-policy sections |
| ACE recommendation shown by College Board | Score 50; 4 semester hours |

The current published outline includes elementary differential-equation
applications within integral calculus but does not list Taylor/Maclaurin
series or convergence tests. Those topics cannot consume blueprint weight
without stronger current College Board authority.

### Biology

Authority checked June 21, 2026:

- `https://clep.collegeboard.org/clep-exams/biology`
- `https://clep.collegeboard.org/prepare-for-an-exam/practice-questions-study-guides/sample-questions-biology`

| Area | Current official standard |
|---|---|
| Length | Approximately 115 questions in 90 minutes, including some unscored pretest questions |
| Molecular and cellular biology | 33% |
| Organismal biology | 34% |
| Population biology | 33% |
| Skills | Biological knowledge plus collection/interpretation of information, hypothesis formation, conclusions, and predictions |
| Formats demonstrated in official samples | Five-choice MCQ, including Roman-numeral reasoning and shared experimental table/data stimuli |
| ACE recommendation shown by College Board | Score 50; 6 semester hours |

Certification requires more than three aggregate counts. Every production
subskill must map to exactly one of the three official reporting domains, and
served mocks must include experimental/data-interpretation work—not only
isolated factual recall.

### Chemistry

Authority checked June 21, 2026:

- `https://clep.collegeboard.org/clep-exams/chemistry`
- `https://clep.collegeboard.org/prepare-for-an-exam/practice-questions-study-guides/sample-questions-chemistry`

| Area | Current official standard |
|---|---|
| Length | Approximately 75 questions in 90 minutes, including some unscored pretest questions |
| Calculator/resources | Integrated TI-30XS MultiView throughout and an exam periodic table |
| Structure of matter | 20% |
| States of matter | 19% |
| Reaction types | 12% |
| Equations and stoichiometry | 10% |
| Equilibrium | 7% |
| Kinetics | 4% |
| Thermodynamics | 5% |
| Descriptive chemistry | 14% |
| Experimental chemistry | 9% |
| Skills | Recall, application to unfamiliar/practical situations, mathematical problem solving, and interpretation/inference from data |
| Formats demonstrated in official samples | Five-choice MCQ, including shared chemical data/table stimuli |
| ACE recommendation shown by College Board | Score 50; 6 semester hours |

The current percentages total 100%. Older 6% thermodynamics / 8%
experimental figures are obsolete. Certification must model all nine domains,
calculator and periodic-table availability, quantitative work, and
experimental/data interpretation explicitly.

### Introductory Psychology

Authority checked June 21, 2026:

- `https://clep.collegeboard.org/clep-exams/introductory-psychology`
- `https://clep.collegeboard.org/prepare-for-an-exam/practice-questions-study-guides/sample-questions-introductory-psychology`

| Area | Current official standard |
|---|---|
| Length | Approximately 95 questions in 90 minutes, including some unscored pretest questions |
| History, approaches, and methods | 11–12% |
| Biological bases of behavior | 8–9% |
| Sensation and perception | 7–8% |
| States of consciousness | 5–6% |
| Learning | 8–9% |
| Cognition | 8–9% |
| Motivation and emotion | 5–6% |
| Development across the lifespan | 8–9% |
| Personality | 7–8% |
| Psychological disorders and health | 8–9% |
| Treatment of psychological disorders | 6–7% |
| Social psychology | 9–10% |
| Statistics, tests, and measurement | 3–4% |
| Clinical terminology | DSM-5 terminology, criteria, and classifications |
| Formats demonstrated in official samples | Five-choice MCQ with substantial concept application and scenario interpretation |
| ACE recommendation shown by College Board | Score 50; 3 semester hours |

Five learning-navigation units may aggregate these domains for instruction,
but certification and analytics must retain all 13 official domain labels and
weights underneath them.

### Introductory Sociology

Authority checked June 21, 2026:

- `https://clep.collegeboard.org/clep-exams/introductory-sociology`
- `https://clep.collegeboard.org/prepare-for-an-exam/practice-questions-study-guides/sample-questions-introductory-sociology`

| Area | Current official standard |
|---|---|
| Length | Approximately 100 questions in 90 minutes, including some unscored pretest questions |
| Institutions | 20% |
| Social patterns | 10% |
| Social processes | 25% |
| Social stratification | 25% |
| Sociological perspective | 20% |
| Skills | Facts/concepts, concept relationships, methods, application to hypothetical situations, and table/chart interpretation |
| Formats | Five-choice MCQ |
| ACE recommendation shown by College Board | Score 50; 3 semester hours |

Certification must report the exact 20/10/25/25/20 composition and include
valid—not placeholder—hypothetical and quantitative/table/chart stimuli.

### College Composition

Authority checked June 21, 2026:

- `https://clep.collegeboard.org/clep-exams/college-composition`
- `https://clep.collegeboard.org/prepare-for-an-exam/practice-questions-study-guides/sample-questions-college-composition`

| Area | Current official standard |
|---|---|
| Total time | 125 minutes |
| Multiple-choice section | 50 questions in 55 minutes |
| Essay section | Two mandatory typed essays in 70 minutes |
| Essay 1 | 30-minute position/argument essay using reading, experience, or observation |
| Essay 2 | 40-minute synthesis argument incorporating and citing two provided sources |
| MCQ: Conventions of Standard Written English | 10% |
| MCQ: Revision Skills | 40% |
| MCQ: Ability to Use Source Materials | 25% |
| MCQ: Rhetorical Analysis | 25% |
| Scoring | MCQ and combined essay sections weighted equally; essays independently read by at least two college English faculty readers |
| Score timing | Normally available one to two weeks after the test date, not immediately |
| ACE recommendation shown by College Board | Score 50; 6 semester hours |

Certification requires passage/set-based MCQs, a real two-task essay
simulation with separate timers and source citation, a transparent practice
rubric aligned to College Board's 0–6 guide, and honest language that
PrepLion feedback is practice feedback—not official College Board scoring.

### Analyzing and Interpreting Literature

Authority checked June 21, 2026:

- `https://clep.collegeboard.org/clep-exams/analyzing-interpreting-literature`
- `https://clep.collegeboard.org/prepare-for-an-exam/practice-questions-study-guides/sample-questions-analyzing-interpreting-literature`

| Area | Current official standard |
|---|---|
| Length | Approximately 80 MCQs in 98 minutes, including some unscored pretest questions |
| Passage rule | Questions are based on supplied, previously unseen literary passages |
| Genre | Poetry 35–45%; prose 35–45%; drama 15–30% |
| National tradition | British/Postcolonial 40–50%; American 40–50%; translation 3–10% |
| Period | Classical/pre-Renaissance 3–7%; Renaissance/17th century 20–30%; 18th/19th 30–40%; 20th/21st 30–40% |
| ACE recommendation shown by College Board | Score 50; 3 semester hours |

Every served item must belong to a passage set. Author/title recall without a
supplied passage cannot substitute for the official close-reading construct.

### American Literature

Authority checked June 21, 2026:

- `https://clep.collegeboard.org/clep-exams/american-literature`
- `https://clep.collegeboard.org/prepare-for-an-exam/practice-questions-study-guides/sample-questions-american-literature`

| Area | Current official standard |
|---|---|
| Length | Approximately 100 questions in 90 minutes, including some unscored pretest questions |
| Interpretation of supplied poems/prose | Approximately 35–40% |
| Works/authors/characters/plots/settings/style/themes | Approximately 25–30% |
| Critical terms, verse forms, devices | Approximately 15–20% |
| Historical/social settings and traditions | Approximately 15–20% |
| Periods | Beginnings–1800 15%; 1800–1865 20%; 1865–1910 20%; 1910–1945 20%; 1945–present 25% |
| ACE recommendation shown by College Board | Score 50; 3 semester hours |

### English Literature

Authority checked June 21, 2026:

- `https://clep.collegeboard.org/clep-exams/english-literature`
- `https://clep.collegeboard.org/prepare-for-an-exam/practice-questions-study-guides/sample-questions-english-literature`

| Area | Current official standard |
|---|---|
| Length | Approximately 95 questions in 90 minutes |
| Knowledge | 35–40% |
| Passage analysis/meaning/tone/imagery/style/criticism | 60–65% |
| Periods | Middle Ages 10%; 16th/early 17th 15%; Restoration/18th 10%; Romantic 20%; Victorian 20%; 20th–present 25% |
| Genres | Novels 15%; short stories 10%; poetry 45%; drama 20%; nonfiction 10% |
| Formats demonstrated in official samples | Five-choice MCQ plus matching/multiple-select-style responses and passage sets |
| ACE recommendation shown by College Board | Score 50; 6 semester hours |

### Humanities

Authority checked June 21, 2026:

- `https://clep.collegeboard.org/clep-exams/humanities`
- `https://clep.collegeboard.org/prepare-for-an-exam/practice-questions-study-guides/sample-questions-humanities`

| Area | Current official standard |
|---|---|
| Length | Approximately 140 questions in 90 minutes, including some unscored pretest questions |
| Cognitive mix | Facts 50%; style/technique recognition 30%; interpretation of unfamiliar literature and art 20% |
| Literature | 50% total: drama 10%; poetry 10–15%; fiction 15–20%; nonfiction/philosophy 10% |
| Arts | 50% total: visual art 20%; architecture 5%; music 15%; film/dance/other performing arts 10% |
| Periods | Fairly even across Classical; Medieval/Renaissance; 17th/18th; 19th; 20th century |
| Other cultures | At least 5–10% African, Asian, Latin American, or other non-Western cultures |
| ACE recommendation shown by College Board | Score 50; 3 semester hours |

Certification requires a multi-axis report for discipline, subdiscipline,
period, culture, cognitive demand, and stimulus/media type. A single
instructional-unit distribution cannot prove this exam.

### CLEP Languages

Authority checked June 21, 2026:

- `https://clep.collegeboard.org/clep-exams/french-language`
- `https://clep.collegeboard.org/clep-exams/german-language`
- `https://clep.collegeboard.org/clep-exams/spanish-language`

Shared current official structure for French, German, and Spanish:

| Area | Current official standard |
|---|---|
| Length | Approximately 121 questions in 90 minutes |
| Listening | Approximately 40% of the exam |
| Listening format | 18 short audio selections and 12 longer audio selections |
| Reading | Approximately 60% of the exam |
| Reading time | 60 minutes |
| ACE recommendation shown by College Board | Score 50 = 6 semester hours |
| Higher placement credit shown by College Board | Level 2 thresholds award 9 semester hours for French 59, German 59, and Spanish 63 |

Certification requirements:

- listening must be served as an audio construct, not a reading substitute;
- reading and listening must remain separately timed and separately measured;
- response rendering must prove the listening/audio path end to end;
- the bank and analytics must not collapse listening into a generic "reading adaptation" bucket;
- public claims, routes, and mocks must match the live availability of each language course.

## ATI TEAS 7

Primary authority:

- ATI TEAS official exam and content-outline materials.

Required structure:

| Section | Questions | Time |
|---|---:|---:|
| Reading | 45 | 55 minutes |
| Mathematics | 38 | 57 minutes |
| Science | 50 | 60 minutes |
| English and Language Usage | 37 | 37 minutes |
| Total | 170 | 209 minutes |

Required response formats:

- multiple choice;
- multiple select;
- fill in the blank;
- hot spot;
- ordered response.

Certification requirements:

- each requested format is served type-purely;
- ATI selected-response formats are not routed through FRQ entitlements;
- every format renders, accepts an answer, scores correctly, explains the
  result, records analytics, and completes a session;
- section/domain distributions match the current ATI outline;
- Science, especially Anatomy and Physiology, has source-grounded factual
  verification and independent qualified-human review;
- public claims, routes, onboarding, dashboard, mocks, and pricing describe
  only capabilities that are actually live.

## Status language

- **Verified**: authoritative production evidence covers the entire stated
  requirement.
- **Partial**: some applicable paths, formats, domains, items, devices, or
  variants remain untested or unresolved.
- **Fail**: evidence contradicts the standard.
- **Inconclusive**: the test itself was invalid or lacked sufficient evidence;
  this is not a product pass or failure.
