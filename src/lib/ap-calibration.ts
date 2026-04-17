/**
 * AP Calibration Examples — paraphrased exam-style stems used as 2-shot
 * style/difficulty anchors for AI question generation.
 *
 * Mirrors the pattern in clep-calibration.ts. Examples are inspired by the
 * structure, stem patterns, and stimulus types of publicly released College
 * Board AP exams — never copied verbatim. Names, numbers, dates, and
 * scenarios are swapped so generated questions remain original content.
 *
 * Coverage:
 *   AP_WORLD_HISTORY                — stimulus-based MCQ + SAQ/LEQ stems
 *   AP_COMPUTER_SCIENCE_PRINCIPLES  — pseudocode trace + concept MCQ
 *   AP_PHYSICS_1                    — conceptual + experimental MCQ
 *   AP_US_HISTORY                   — stimulus-based MCQ, reasoning-process tagged (added 2026-04-17)
 *   AP_STATISTICS                   — data-grounded MCQ, skill-tagged (added 2026-04-17)
 *
 * Sourcing: Inspired by patterns in CB Course and Exam Description PDFs and
 * "Past Exam Questions" pages on AP Central. All content is original.
 */

export const AP_CALIBRATION: Record<string, string[]> = {

  // ── AP World History: Modern ────────────────────────────────────────────
  // Real CB MCQs are stimulus-based: short primary-source excerpt or map
  // description, then a question testing Causation / Comparison / CCOT /
  // Contextualization. Stems lean on "best supports", "most directly caused",
  // "most clearly demonstrates", etc. — never bare recall.
  AP_WORLD_HISTORY: [
    "A 1672 Ottoman traveler's account describes Mughal court administrators using Persian as the language of record. The excerpt most directly supports which of the following continuities across the early modern Islamic empires?",
    "A 1455 Ming dynasty edict restricts overseas voyages and orders the dismantling of the treasure fleet. This policy is best explained as a response to which of the following?",
    "A map shows the spread of the Black Death from the Crimean coast to Western Europe between 1347 and 1351. The pattern shown most directly resulted from which of the following developments?",
    "An 1804 Haitian newspaper editorial proclaims independence and the abolition of slavery. The argument made in the excerpt most clearly draws on which of the following Atlantic World developments?",
    "A 1905 photograph depicts British colonial officials seated above Indian Civil Service clerks in a Calcutta office. This image best illustrates which of the following continuities in late 19th-century imperialism?",
    "An 1849 letter from a German factory worker complains about 14-hour shifts and child labor in textile mills. Which of the following responses to industrialization is most consistent with the conditions described?",
    "A 1923 Soviet poster contrasts a peasant farmer with a tractor-driving collective laborer. The poster most directly reflects which of the following changes in Soviet economic policy?",
    "A 1955 declaration from the Bandung Conference rejects alignment with either Cold War superpower. The declaration most clearly reflects which of the following developments in the post-1945 world?",
    "An 1893 chart shows opium imports into China rising sharply between 1840 and 1880. The trend shown is best explained by which of the following political developments?",
    "A 1789 pamphlet by a French member of the Third Estate demands equal representation in the Estates-General. The argument reflects which of the following Enlightenment principles?",
    // SAQ-style three-part stems
    "Using the 1839 letter from Commissioner Lin Zexu to Queen Victoria, (A) identify ONE argument the author makes about the opium trade, (B) explain ONE historical context that led to the letter being written, (C) explain ONE way the British response demonstrates a difference in 19th-century power dynamics.",
    "(A) Identify ONE economic effect of the Columbian Exchange on the Americas before 1700. (B) Explain ONE political consequence in West Africa during the same period. (C) Explain ONE way historians might disagree about the long-term significance of the Exchange.",
    // LEQ-style argumentation prompt
    "Evaluate the extent to which the development of land-based empires (Ottoman, Safavid, Mughal, Ming/Qing) between 1450 and 1750 transformed governance practices in their respective regions. Support your argument with specific evidence.",
  ],

  // ── AP Computer Science Principles ──────────────────────────────────────
  // Real CB MCQs alternate between pseudocode tracing, algorithmic
  // analysis, data representation (binary/compression), networks, and
  // social/ethical impact. Single-select only since 2024 redesign.
  AP_COMPUTER_SCIENCE_PRINCIPLES: [
    "Consider the procedure below in AP pseudocode:\n```\nPROCEDURE Mystery(list)\n  count <- 0\n  FOR EACH item IN list\n    IF item > 5\n      count <- count + 1\n  RETURN count\n```\nWhat does Mystery([3, 7, 2, 9, 5, 8, 1]) return?",
    "A program represents a grayscale pixel using 8 bits, allowing 256 shades. To allow 1024 distinct shades while keeping the same encoding scheme, how many bits per pixel are required?",
    "A streaming service compresses video by removing frames that are nearly identical to neighboring frames. Which of the following best classifies this compression technique?",
    "A REPEAT 4 TIMES block contains a REPEAT 3 TIMES block, which contains a single DISPLAY statement. How many times does DISPLAY execute when the outer block runs once?",
    "A new public dataset contains anonymized medical records. A researcher cross-references the dataset with publicly available voter rolls and successfully identifies several patients. This scenario most directly raises which of the following ethical concerns?",
    "An algorithm searches an unsorted list of n items for a specific value. In the worst case, how many comparisons must the algorithm perform?",
    "A team is developing a mobile app using an iterative process. After each two-week sprint, they release a new version to a small group of beta testers and incorporate feedback. Which of the following best describes the primary benefit of this approach?",
    "Two computers communicate over the Internet using TCP/IP. If one packet is lost in transit, what is the most likely outcome for the receiving computer?",
    "A procedure SumDigits(n) returns the sum of the digits of a positive integer n. Which of the following best describes a use of abstraction in writing this procedure?",
    "A school district considers adopting an AI grading system that flags student essays for plagiarism. Which of the following is a potential bias concern that should be evaluated before deployment?",
    "Consider:\n```\nx <- 3\ny <- x * 2\nx <- x + y\nDISPLAY(x)\n```\nWhat is displayed?",
    "A binary number system represents the decimal value 13 as which of the following?",
  ],

  // ── AP Physics 1: Algebra-Based ─────────────────────────────────────────
  // Real CB MCQs (post-2024 redesign): single-select only, conceptual or
  // calculation-based, often paired with a graph, free-body diagram, or
  // experimental setup. Stems test the 7 Science Practices: representing
  // data, deriving relationships, analyzing experimental design.
  AP_PHYSICS_1: [
    "A 2.0 kg cart moves to the right at 3.0 m/s and collides with a stationary 1.0 kg cart. The two carts stick together after the collision. What is the speed of the combined carts immediately after the collision?",
    "A student records the position of a ball rolling down a ramp every 0.1 s and finds the position increases as t². Which of the following is the best conclusion about the ball's motion?",
    "Two blocks of equal mass are connected by a string over a frictionless pulley. Block A hangs vertically; block B sits on a horizontal frictionless surface. When released, the magnitude of the acceleration of block B is closest to which of the following?",
    "A pendulum of length L has period T on Earth. If the pendulum is moved to a planet where the gravitational acceleration is 4g, the new period is most nearly equal to which of the following?",
    "A sealed container of gas is heated at constant volume. Which of the following best explains the resulting increase in pressure using a microscopic model?",
    "A student designs an experiment to determine the spring constant of an unknown spring. Which of the following procedures would yield the most reliable value for k?",
    "A 5.0 kg object is pushed across a horizontal surface by a 20 N applied force. The object accelerates at 2.0 m/s². The magnitude of the friction force on the object is closest to which of the following?",
    "A graph shows velocity vs. time for an object moving along a straight line. The slope is constant and positive. Which of the following best describes the object's motion?",
    "A satellite orbits Earth in a circular orbit at altitude h. If the satellite's altitude is increased to 4h, the orbital period is most nearly equal to which of the following multiples of the original period?",
    "A 0.5 kg ball is dropped from a height of 1.8 m above the floor and rebounds to 1.2 m. Which of the following best explains the energy of the ball–floor system between release and the highest rebound?",
    "Two identical pucks slide toward each other on a frictionless surface and collide elastically. Which quantities are conserved in the collision?",
    "A submerged object of density ρ_obj is in a fluid of density ρ_fluid where ρ_fluid > ρ_obj. The buoyant force on the object compared to its weight is best described as which of the following?",
    // FRQ-style experimental design prompt
    "A student is given a spring, several known masses, a meterstick, and a stopwatch. (A) Describe an experimental procedure the student could use to determine the spring constant. (B) Identify the measurements the student must record. (C) Explain how the data should be analyzed (graphically or otherwise) to determine the spring constant, including which quantity should be on each axis if a linear graph is desired.",
  ],

  // ── AP US History ───────────────────────────────────────────────────────
  // Real CB MCQs are STIMULUS-BASED in sets of 3-4: a short primary-source
  // excerpt, secondary-source historian quote, political cartoon description,
  // map, or data table. Each Q in the set tests a different reasoning
  // process: comparison, causation, or continuity-and-change. 4 choices A-D
  // (NOT 5 like CLEP). Stems lean on "most directly resulted from", "best
  // supports", "most clearly demonstrates continuity with" — never bare
  // recall of dates or names.
  AP_US_HISTORY: [
    'An 1857 editorial in a Charleston, South Carolina newspaper argues: "The Supreme Court has at last settled forever the question of negro rights. The decision of the Dred Scott case has confirmed the constitutional right of the slaveholder." The author\'s argument most directly reflects which of the following developments in the 1850s?',
    'A 1774 pamphlet published in Philadelphia states: "The British Parliament has no more right to legislate for us than for the Kingdom of Naples." The excerpt most clearly illustrates which of the following reasoning processes in late-colonial political thought?',
    'A map of 1830 federal land surveys in the Ohio Valley shows rectangular township grids. The pattern shown is most directly a result of which of the following earlier federal policies?',
    'A 1912 photograph depicts a textile worker picketing outside a Lawrence, Massachusetts mill with a sign reading "We want bread and roses too." The image most clearly supports which of the following characterizations of the Progressive Era?',
    'An 1877 cartoon depicts a federal soldier departing the South with a bayonet pointed at an African American family. The cartoon most directly comments on which of the following?',
    'A 1942 telegram from a Japanese American internee to President Roosevelt pleads for due process. The author\'s argument relies on a continuity with which of the following earlier American political traditions?',
    'An 1896 party platform demands free coinage of silver at 16:1 ratio with gold. The position most directly reflects the economic concerns of which of the following groups?',
    'A 1919 speech by W.E.B. Du Bois asks returning Black soldiers: "Why should they fight in a war for democracy abroad only to be denied it at home?" Du Bois\'s argument best illustrates which of the following continuities in African American political thought between Reconstruction and the civil rights era?',
    'A 1780s letter from a Virginia planter complains about "impossible" debt repayment terms imposed by British creditors. The complaint most directly reveals a cause of which of the following political developments?',
    'A 1963 photograph shows Birmingham police using fire hoses on civil rights demonstrators. The image most clearly contributed to which of the following short-term political outcomes?',
    'An 1832 address by President Andrew Jackson vetoes the re-charter of the Second Bank of the United States, arguing the bank serves "the rich and the powerful." The veto message most directly draws on which of the following earlier American political traditions?',
    'A 1971 Gallup poll shows 60% of Americans support immediate withdrawal from Vietnam. This shift in public opinion most directly reflects which of the following?',
    'A 1920 editorial in The Crisis magazine celebrates the 19th Amendment but notes it leaves many women disenfranchised. The editorial most clearly anticipates which of the following mid-20th-century developments?',
    // SAQ-style three-part stems
    '(A) Briefly describe ONE specific way the Columbian Exchange transformed Native American societies before 1700. (B) Briefly describe ONE specific way the Columbian Exchange transformed West African societies in the same period. (C) Briefly explain ONE reason historians might disagree about which transformation was more consequential over the long term.',
    'Using the 1776 Declaration of Independence, (A) identify ONE specific grievance the authors make against the British Crown, (B) explain ONE historical context in the 1760s-1770s that helps account for that grievance, (C) explain ONE way the grievance was addressed by the Articles of Confederation or the 1787 Constitution.',
  ],

  // ── AP Statistics ───────────────────────────────────────────────────────
  // Real CB MCQs are DATA-GROUNDED: every Q references specific numbers,
  // a scenario (baseball, polling, medical trial), a graph/table, or a
  // study design. 4 choices A-D (NOT 5). Calculator permitted throughout,
  // so numbers should be calculator-friendly not arithmetic-heavy.
  // Distractors should hit canonical misconceptions: reversing H0/H1,
  // confusing correlation with causation, using σ when s is appropriate,
  // misinterpreting p-value as "probability null is true."
  AP_STATISTICS: [
    "A researcher takes a simple random sample of 200 high school seniors from a large school district to estimate the proportion who plan to attend a 4-year college. 128 of the sampled students say they plan to attend. Which of the following is the standard error of the sample proportion?",
    "A distribution of annual incomes in a city is strongly right-skewed, with a median of $45,000 and a mean of $62,000. Which of the following best explains the difference between the mean and median?",
    "The scatterplot of shoe size (x) vs. height (y) for 50 adults yields a least-squares regression line ŷ = 54 + 1.8x. Which of the following is the best interpretation of the slope?",
    "A medical researcher conducts a completely randomized experiment with 60 patients comparing a new drug to a placebo. After 8 weeks, the new-drug group shows a 15-point-lower mean blood pressure than the placebo group, and a two-sample t-test yields p = 0.008. Which of the following is the most appropriate conclusion at the α = 0.05 level?",
    "The sampling distribution of the mean GPA from samples of size 36 students has standard deviation 0.05. If the sample size is increased to 144, the standard deviation of the sampling distribution will be closest to which of the following?",
    "A coin is tossed 200 times and lands heads 118 times. To test whether the coin is fair, a z-test yields a test statistic of approximately 2.55. Which of the following is the closest approximation of the p-value for a two-sided test?",
    "A company surveys 800 customers by emailing registered members; 240 respond. Which of the following is the most serious concern about the validity of the resulting estimate?",
    "A normal distribution has mean 72 and standard deviation 8. The proportion of values between 64 and 80 is closest to which of the following?",
    "A researcher performs a chi-square test for independence on a 3x4 contingency table with 1,000 total observations. The chi-square statistic is 22.4. Using df = 6, which of the following best describes the result?",
    "A 95% confidence interval for the mean number of hours of sleep per night among US college students is (6.8, 7.4). Which of the following is the correct interpretation?",
    "A least-squares regression model fit to 30 data points yields r = -0.81. Which of the following is the value of r² and the correct interpretation?",
    "A bag contains 4 red, 3 blue, and 2 green marbles. Two marbles are drawn without replacement. What is the probability that both are red?",
    "A survey of 500 voters finds 280 support a ballot measure. The 95% confidence interval for the true proportion of supporters is closest to which of the following?",
    "A randomized experiment compares three teaching methods on final exam scores. One-way ANOVA yields F = 4.82 with p = 0.011. Which of the following is the most appropriate conclusion at α = 0.05?",
    // FRQ-style investigative task stem
    "A company tests two versions of a checkout page (A and B) on 2,000 randomly assigned users. Version A yields 120 purchases out of 1,000 visitors; Version B yields 156 purchases out of 1,000 visitors. (a) Construct a 95% confidence interval for the difference in purchase proportions. (b) Based on your interval, what can the company conclude about which checkout page leads to more purchases? (c) Describe ONE source of bias that could threaten the validity of these results and ONE way the company could mitigate it.",
  ],
};
