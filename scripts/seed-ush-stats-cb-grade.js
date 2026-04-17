#!/usr/bin/env node
/**
 * Seed hand-authored CB-grade AP US History + AP Statistics questions.
 *
 * Part C of the A+C combo (A22.13-era). These are original MCQs modeled
 * after College Board released-exam format — primary-source stimulus,
 * period-specific content, 4-choice with trap distractors.
 *
 * NOT copied from CB exams (copyright); written to match their style
 * and rigor so Sonnet mass gen has a style anchor in the corpus.
 *
 * Idempotent: SHA-256 contentHash on questionText.
 *
 * Usage: node scripts/seed-ush-stats-cb-grade.js
 */

require("dotenv").config({ path: ".env" });
try { require("dotenv").config({ path: ".env.local", override: true }); } catch {}

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

const USH_QUESTIONS = [
  {
    course: "AP_US_HISTORY",
    unit: "APUSH_2_PERIOD_1607_1754",
    topic: "Colonial labor systems",
    difficulty: "MEDIUM",
    stimulus: "\"An Act for the better ordering and governing of Negroes and slaves... all Negroes, Mulattos, and Indians, which at any time heretofore have been sold, or now are held, or hereafter shall be bought and sold for slaves, are hereby declared slaves.\" — South Carolina Slave Code, 1696",
    questionText: "The 1696 South Carolina Slave Code most directly reflected which broader trend in late-17th-century British North America?",
    options: [
      "A) The replacement of African slavery by indentured European servitude in the Chesapeake",
      "B) A legal shift from transitory servitude toward permanent, race-based, hereditary slavery",
      "C) The emergence of Puritan-influenced reform movements seeking to abolish bound labor",
      "D) The imposition of imperial reforms that restricted colonial legislatures' power over labor",
    ],
    correctAnswer: "B",
    explanation: "B is correct: the late 1600s saw colonies codify slavery as a permanent, hereditary, race-based status — a shift from earlier mixed-servitude systems. A reverses the actual trend (slavery was replacing servitude, not the other way around). C conflates later abolitionism (early 1800s) with this period. D misidentifies the code as imperial — it was a colonial assembly act.",
  },
  {
    course: "AP_US_HISTORY",
    unit: "APUSH_3_PERIOD_1754_1800",
    topic: "Revolutionary ideology",
    difficulty: "MEDIUM",
    stimulus: "\"No taxation without representation.\" — Pamphlet slogan, 1764-1776",
    questionText: "The slogan above most directly rejected which British policy?",
    options: [
      "A) The Proclamation of 1763 restricting westward settlement",
      "B) Parliamentary acts imposing duties on colonists who elected no MPs",
      "C) The quartering of British troops in colonial homes",
      "D) The Navigation Acts regulating colonial trade with foreign powers",
    ],
    correctAnswer: "B",
    explanation: "B is correct: the slogan attacked parliamentary taxation (Stamp Act, Townshend, Tea) of colonies unrepresented in Parliament. A concerns land policy, not taxation. C concerns quartering, a separate grievance. D pre-dated the taxation disputes and was tolerated under 'salutary neglect.'",
  },
  {
    course: "AP_US_HISTORY",
    unit: "APUSH_3_PERIOD_1754_1800",
    topic: "Constitutional debates",
    difficulty: "HARD",
    stimulus: "\"The accumulation of all powers, legislative, executive, and judiciary, in the same hands... may justly be pronounced the very definition of tyranny.\" — Federalist No. 47, 1788",
    questionText: "Madison's argument in the passage was most directly intended to defend which feature of the proposed Constitution?",
    options: [
      "A) The Bill of Rights protecting individual liberties",
      "B) The separation of powers among three branches of government",
      "C) The system of federalism dividing authority between state and national governments",
      "D) The electoral college's indirect selection of the president",
    ],
    correctAnswer: "B",
    explanation: "B is correct: Federalist 47 directly defends separation of powers. A is wrong — the Bill of Rights wasn't in the original Constitution and came later. C conflates separation of powers (horizontal) with federalism (vertical). D is a narrower institutional issue not addressed in this passage.",
  },
  {
    course: "AP_US_HISTORY",
    unit: "APUSH_4_PERIOD_1800_1848",
    topic: "Market Revolution",
    difficulty: "MEDIUM",
    stimulus: "A canal-boat operator's diary, 1835: \"We now carry a ton of wheat from Buffalo to New York for what it cost to carry a barrel twenty years ago.\"",
    questionText: "The change described most directly resulted from which development?",
    options: [
      "A) Completion of the transcontinental railroad",
      "B) Construction of the Erie Canal in 1825",
      "C) The introduction of the cotton gin in 1793",
      "D) Steamboat navigation on the Mississippi River",
    ],
    correctAnswer: "B",
    explanation: "B is correct: the Erie Canal (1825) connected the Great Lakes to the Hudson/NYC, dropping freight costs ~90% on that exact Buffalo-to-NYC route. A is post-1869, far later. C is Southern and concerns cotton, not wheat. D moves goods on the Mississippi, not to NYC.",
  },
  {
    course: "AP_US_HISTORY",
    unit: "APUSH_5_PERIOD_1844_1877",
    topic: "Causes of the Civil War",
    difficulty: "MEDIUM",
    stimulus: "\"A house divided against itself cannot stand. I believe this government cannot endure, permanently half slave and half free.\" — Abraham Lincoln, 1858",
    questionText: "Lincoln's statement most directly reflected the political consequences of which event?",
    options: [
      "A) The Missouri Compromise of 1820",
      "B) Passage of the Kansas-Nebraska Act of 1854",
      "C) Ratification of the Thirteenth Amendment",
      "D) The Emancipation Proclamation",
    ],
    correctAnswer: "B",
    explanation: "B is correct: the 1854 Kansas-Nebraska Act reopened slavery in territories north of 36°30′, making the Missouri Compromise dead letter. This directly triggered Lincoln's 'house divided' framing in 1858. A occurred 38 years earlier and had held slavery in balance. C (1865) and D (1863) come after the speech.",
  },
  {
    course: "AP_US_HISTORY",
    unit: "APUSH_5_PERIOD_1844_1877",
    topic: "Reconstruction",
    difficulty: "HARD",
    stimulus: "\"Congress is to appoint a committee to ascertain when said States are entitled to representation.\" — Reconstruction Act, 1867",
    questionText: "The passage above best illustrates which congressional strategy during Reconstruction?",
    options: [
      "A) Restoring state sovereignty by returning political authority to former Confederate legislatures",
      "B) Using federal power to enforce new political orders on the defeated South",
      "C) Delegating Reconstruction policy to the executive branch led by President Johnson",
      "D) Allowing readmission without any conditions once states ratified the 13th Amendment",
    ],
    correctAnswer: "B",
    explanation: "B is correct: the Reconstruction Acts reflect Radical Republican strategy to use federal authority — including military districts — to dictate terms of readmission. A inverts the policy (states had authority stripped, not restored). C describes Presidential Reconstruction (1865-66), which Congress rejected. D describes the 13th Amendment's narrower conditions, not the broader 1867 Acts.",
  },
  {
    course: "AP_US_HISTORY",
    unit: "APUSH_6_PERIOD_1865_1898",
    topic: "Gilded Age industry",
    difficulty: "MEDIUM",
    stimulus: "A worker testimony, 1886: \"We receive thirteen cents a day, work twelve hours, and if you refuse anything they tell you to go to the office and get your money — meaning you are fired.\"",
    questionText: "The conditions described most directly prompted which Gilded Age response?",
    options: [
      "A) Formation of trade unions such as the Knights of Labor and the AFL",
      "B) Settlement of the frontier under the Homestead Act",
      "C) The rise of Populist Party demands for bimetallism",
      "D) Passage of the Sherman Antitrust Act",
    ],
    correctAnswer: "A",
    explanation: "A is correct: such abusive industrial conditions drove worker organization into unions in the 1870s-80s. B concerns agrarian settlement, not industrial labor. C involves farmers' monetary grievances, not factory workers directly. D regulated business combinations, not individual-worker conditions.",
  },
  {
    course: "AP_US_HISTORY",
    unit: "APUSH_6_PERIOD_1865_1898",
    topic: "Populism",
    difficulty: "MEDIUM",
    topic_raw: "Populist movement",
    stimulus: "\"We demand the free and unlimited coinage of silver and gold at the present legal ratio of 16 to 1.\" — Omaha Platform, 1892",
    questionText: "This demand was advanced primarily to benefit which constituency?",
    options: [
      "A) Eastern industrialists seeking capital investment",
      "B) Urban wage laborers seeking higher factory wages",
      "C) Indebted farmers seeking relief via mild inflation",
      "D) Western railroad owners seeking lower transportation costs",
    ],
    correctAnswer: "C",
    explanation: "C is correct: bimetallism would have expanded money supply and mildly inflated prices, letting debt-burdened farmers repay fixed-dollar mortgages with cheaper dollars. A is wrong — industrialists wanted sound (gold) money. B concerns urban labor, not Populism's farmer base. D inverts the coalition — railroads were a Populist target, not beneficiary.",
  },
  {
    course: "AP_US_HISTORY",
    unit: "APUSH_7_PERIOD_1890_1945",
    topic: "Progressive Era",
    difficulty: "MEDIUM",
    stimulus: "\"Muckraking\" journalism example: Upton Sinclair's The Jungle (1906) detailed unsanitary conditions in Chicago meatpacking.",
    questionText: "Sinclair's exposé most directly prompted passage of which legislation?",
    options: [
      "A) The Sherman Antitrust Act",
      "B) The Pure Food and Drug Act and the Meat Inspection Act of 1906",
      "C) The 16th Amendment establishing a federal income tax",
      "D) The Federal Reserve Act of 1913",
    ],
    correctAnswer: "B",
    explanation: "B is correct: The Jungle (1906) directly triggered the Pure Food and Drug Act and Meat Inspection Act, both passed in 1906. A predates the book by 16 years. C and D concern banking/taxation, unrelated to the meatpacking exposé.",
  },
  {
    course: "AP_US_HISTORY",
    unit: "APUSH_7_PERIOD_1890_1945",
    topic: "New Deal",
    difficulty: "HARD",
    stimulus: "\"The Court, in striking down the NRA, has held that Congress cannot delegate legislative power to the executive.\" — Editorial, 1935 (Schechter v. United States)",
    questionText: "The Schechter decision most directly undermined which element of Roosevelt's First New Deal?",
    options: [
      "A) The Social Security Act's old-age insurance program",
      "B) The National Industrial Recovery Act's industrial code system",
      "C) The Tennessee Valley Authority's public-power mandate",
      "D) The Banking Act's creation of the FDIC",
    ],
    correctAnswer: "B",
    explanation: "B is correct: Schechter (1935) struck down NRA codes as an unconstitutional delegation of legislative power to the executive. A (1935) was passed after Schechter and targeted social insurance, not industrial codes. C and D were New Deal programs unaffected by the NRA ruling.",
  },
  {
    course: "AP_US_HISTORY",
    unit: "APUSH_8_PERIOD_1945_1980",
    topic: "Cold War",
    difficulty: "MEDIUM",
    stimulus: "\"It must be the policy of the United States to support free peoples who are resisting attempted subjugation by armed minorities or by outside pressures.\" — Truman Doctrine, 1947",
    questionText: "The Truman Doctrine most directly set the stage for which subsequent American policy?",
    options: [
      "A) The strategic bombing campaign against Japan in 1945",
      "B) Containment, including the Marshall Plan and military aid to anti-communist regimes",
      "C) The policy of détente pursued by Nixon and Kissinger",
      "D) The unilateral abandonment of overseas commitments under Eisenhower",
    ],
    correctAnswer: "B",
    explanation: "B is correct: the Truman Doctrine is the foundational statement of containment, directly leading to the Marshall Plan (1948), NATO (1949), and military aid worldwide. A predates Truman's policy framework. C (1970s) is a later and different strategy. D mischaracterizes Eisenhower, whose 'New Look' actually expanded commitments via alliances.",
  },
  {
    course: "AP_US_HISTORY",
    unit: "APUSH_8_PERIOD_1945_1980",
    topic: "Civil Rights Movement",
    difficulty: "MEDIUM",
    stimulus: "\"I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character.\" — MLK, 1963",
    questionText: "This speech was delivered at an event that most directly helped secure passage of which legislation?",
    options: [
      "A) The Voting Rights Act of 1965",
      "B) The Civil Rights Act of 1964",
      "C) The Fair Housing Act of 1968",
      "D) The Immigration and Nationality Act of 1965",
    ],
    correctAnswer: "B",
    explanation: "B is correct: the 1963 March on Washington built pressure that crystallized in the 1964 Civil Rights Act (public accommodations, employment). A (1965) came later, focused on voting. C and D are 1968 and 1965 respectively, not the immediate legislative consequence.",
  },
  {
    course: "AP_US_HISTORY",
    unit: "APUSH_8_PERIOD_1945_1980",
    topic: "Vietnam War",
    difficulty: "HARD",
    stimulus: "Pentagon Papers, leaked 1971: documented systematic government deception about Vietnam policy from Truman through Johnson.",
    questionText: "The publication of the Pentagon Papers most directly contributed to which longer-term political development?",
    options: [
      "A) Passage of the Civil Rights Act of 1964",
      "B) A sustained decline in public trust of the federal government",
      "C) The rise of the conservative movement under Goldwater",
      "D) Enactment of the Voting Rights Act",
    ],
    correctAnswer: "B",
    explanation: "B is correct: the Pentagon Papers (1971), together with Watergate (1972-74), produced a durable drop in public trust in government — a central theme of 1970s political culture. A, C, D all predate the 1971 publication and concern different policy domains.",
  },
  {
    course: "AP_US_HISTORY",
    unit: "APUSH_9_PERIOD_1980_PRESENT",
    topic: "Reagan era",
    difficulty: "MEDIUM",
    stimulus: "\"Government is not the solution to our problem; government IS the problem.\" — Ronald Reagan, inaugural address, 1981",
    questionText: "Reagan's statement most directly framed which policy agenda?",
    options: [
      "A) Expansion of the Great Society's welfare programs",
      "B) Supply-side tax cuts, deregulation, and reduced domestic spending",
      "C) Restoration of the Bretton Woods fixed-exchange-rate system",
      "D) Aggressive use of antitrust law against large corporations",
    ],
    correctAnswer: "B",
    explanation: "B is correct: Reagan's anti-government framing led to the 1981 tax cuts (ERTA), sweeping deregulation, and domestic spending cuts — the hallmarks of 'Reaganomics.' A is the opposite trajectory (LBJ era). C was abandoned in 1971. D mischaracterizes Reagan — antitrust enforcement declined under his DOJ.",
  },
  {
    course: "AP_US_HISTORY",
    unit: "APUSH_9_PERIOD_1980_PRESENT",
    topic: "End of Cold War",
    difficulty: "MEDIUM",
    stimulus: "\"Mr. Gorbachev, tear down this wall!\" — Reagan at the Berlin Wall, 1987",
    questionText: "The collapse of the Soviet Union in 1991 most directly resulted from which combination?",
    options: [
      "A) Direct U.S. military intervention in Eastern Europe",
      "B) Internal economic stagnation plus Gorbachev's glasnost/perestroika reforms",
      "C) The Strategic Defense Initiative rendering Soviet missiles obsolete overnight",
      "D) U.S. Senate ratification of the SALT II treaty",
    ],
    correctAnswer: "B",
    explanation: "B is correct: historians attribute Soviet collapse primarily to internal economic stagnation combined with Gorbachev's liberalizing reforms (glasnost 1986, perestroika 1987) that the Soviet system could not absorb. A never happened. C is a contested Reagan-era claim but did not 'obsolete missiles overnight.' D — SALT II was never ratified by the Senate.",
  },
];

const STATS_QUESTIONS = [
  {
    course: "AP_STATISTICS",
    unit: "STATS_1_EXPLORING_DATA",
    topic: "Measures of center",
    difficulty: "EASY",
    stimulus: "Data set of seven values: 2, 4, 4, 4, 5, 7, 9.",
    questionText: "Which of the following statements about the data set is TRUE?",
    options: [
      "A) The mean is greater than the median.",
      "B) The mean equals the median.",
      "C) The mean is less than the median.",
      "D) The mode is greater than the mean.",
    ],
    correctAnswer: "A",
    explanation: "Mean = (2+4+4+4+5+7+9)/7 = 35/7 = 5. Median = middle (4th) value = 4. Mean (5) > median (4), so A is correct. The right tail skews the mean upward. Mode (4) is less than mean (5), ruling out D.",
  },
  {
    course: "AP_STATISTICS",
    unit: "STATS_2_MODELING_DATA",
    topic: "Normal distribution",
    difficulty: "MEDIUM",
    stimulus: "Heights of adult women are approximately normally distributed with mean μ = 64 inches and standard deviation σ = 2.5 inches.",
    questionText: "Approximately what percentage of adult women are taller than 66.5 inches?",
    options: [
      "A) 2.5%",
      "B) 16%",
      "C) 34%",
      "D) 68%",
    ],
    correctAnswer: "B",
    explanation: "66.5 = μ + 1σ. By the 68-95-99.7 rule, ~68% lie within ±1σ, so ~16% lie above +1σ. A (2.5%) is the tail beyond +2σ. C (34%) is the slice between μ and +1σ. D (68%) is the middle, not the upper tail.",
  },
  {
    course: "AP_STATISTICS",
    unit: "STATS_3_COLLECTING_DATA",
    topic: "Experimental design",
    difficulty: "MEDIUM",
    stimulus: "A researcher wants to test whether a new fertilizer increases tomato yield. She applies the new fertilizer to all plants in the greenhouse and compares this year's yield to last year's yield under the old fertilizer.",
    questionText: "What is the most serious flaw in this design?",
    options: [
      "A) The sample size is too small to detect differences.",
      "B) There is no randomization of subjects to treatment groups.",
      "C) There is no control group receiving the old fertilizer this year — confounding with weather, seed batch, etc.",
      "D) The researcher's expectations introduce response bias.",
    ],
    correctAnswer: "C",
    explanation: "C is correct: without a simultaneous control group, any change in yield could be caused by weather, seed quality, or other year-to-year differences confounded with the fertilizer. This is the textbook case for requiring a control group. A, B, and D are secondary issues — the primary flaw is the missing control.",
  },
  {
    course: "AP_STATISTICS",
    unit: "STATS_4_PROBABILITY",
    topic: "Conditional probability",
    difficulty: "MEDIUM",
    stimulus: "At a certain school, 60% of students play sports and 40% play an instrument; 20% do both.",
    questionText: "Given that a randomly selected student plays sports, what is the probability she also plays an instrument?",
    options: [
      "A) 0.20",
      "B) 0.33",
      "C) 0.40",
      "D) 0.50",
    ],
    correctAnswer: "B",
    explanation: "P(Instrument | Sports) = P(both) / P(Sports) = 0.20 / 0.60 ≈ 0.333. B is correct. A (0.20) ignores conditioning. C (0.40) is the marginal P(Instrument), not the conditional. D (0.50) confuses denominators.",
  },
  {
    course: "AP_STATISTICS",
    unit: "STATS_5_SAMPLING_DISTRIBUTIONS",
    topic: "Central Limit Theorem",
    difficulty: "MEDIUM",
    stimulus: "A population has mean μ = 100 and standard deviation σ = 15. A random sample of size n = 25 is taken.",
    questionText: "What is the standard deviation of the sampling distribution of the sample mean?",
    options: [
      "A) 15",
      "B) 3",
      "C) 0.6",
      "D) 0.15",
    ],
    correctAnswer: "B",
    explanation: "Standard error of the mean = σ/√n = 15/√25 = 15/5 = 3. B is correct. A is the population σ (doesn't account for sample size). C and D reflect division errors.",
  },
  {
    course: "AP_STATISTICS",
    unit: "STATS_6_INFERENCE_PROPORTIONS",
    topic: "Confidence intervals",
    difficulty: "MEDIUM",
    stimulus: "A poll of 400 voters finds 220 support a ballot measure. The 95% confidence interval for the true proportion is calculated.",
    questionText: "Which of the following is the BEST interpretation of the 95% confidence interval?",
    options: [
      "A) There is a 95% probability that the true proportion lies within the interval.",
      "B) 95% of all voters support the measure.",
      "C) If we repeated the poll many times, about 95% of the intervals would contain the true proportion.",
      "D) 95% of the 400 polled voters fall within the interval.",
    ],
    correctAnswer: "C",
    explanation: "C is the correct frequentist interpretation — 'the procedure captures the true value 95% of the time over many repeats.' A is the common misinterpretation treating the true proportion as random. B and D misread what a confidence interval describes.",
  },
  {
    course: "AP_STATISTICS",
    unit: "STATS_7_INFERENCE_MEANS",
    topic: "Hypothesis testing",
    difficulty: "HARD",
    stimulus: "A null hypothesis H₀: μ = 50 is tested against Hₐ: μ ≠ 50 at α = 0.05 using a two-sided t-test. The resulting p-value is 0.03.",
    questionText: "Which conclusion is appropriate?",
    options: [
      "A) Reject H₀; there is significant evidence that μ ≠ 50.",
      "B) Accept H₀; the data support μ = 50.",
      "C) Reject H₀; the data prove μ is exactly 50.05.",
      "D) Fail to reject H₀; the p-value exceeds α.",
    ],
    correctAnswer: "A",
    explanation: "A is correct: p = 0.03 < α = 0.05, so reject H₀. B is wrong — we never 'accept' H₀, only 'fail to reject.' C overstates: rejection doesn't pinpoint a value. D reverses the p-value comparison (0.03 < 0.05, not >).",
  },
  {
    course: "AP_STATISTICS",
    unit: "STATS_9_INFERENCE_SLOPES",
    topic: "Linear regression",
    difficulty: "MEDIUM",
    stimulus: "A least-squares regression of weight (y, in pounds) on height (x, in inches) for 50 adults yields ŷ = −100 + 4x with r = 0.8.",
    questionText: "Which interpretation of the slope is correct?",
    options: [
      "A) For each additional inch of height, weight is predicted to increase by 4 pounds.",
      "B) An adult of height 0 inches is predicted to weigh −100 pounds.",
      "C) 80% of the variation in weight is explained by height.",
      "D) Weight and height have a correlation of 4 pounds per inch.",
    ],
    correctAnswer: "A",
    explanation: "A correctly reads the slope: +4 lbs per additional inch. B is the intercept reading (mathematically correct but extrapolates meaninglessly). C confuses r² (= 0.64, not 0.80) with r. D incorrectly conflates correlation with slope units.",
  },
];

function hash(s) {
  return crypto.createHash("sha256").update(s.toLowerCase().trim()).digest("hex");
}

async function seed() {
  let created = 0;
  let skipped = 0;

  for (const q of [...USH_QUESTIONS, ...STATS_QUESTIONS]) {
    const contentHash = hash(q.questionText);
    const existing = await prisma.question.findUnique({ where: { contentHash } });
    if (existing) { skipped++; continue; }
    try {
      await prisma.question.create({
        data: {
          course: q.course,
          unit: q.unit,
          topic: q.topic,
          difficulty: q.difficulty,
          questionType: "MCQ",
          questionText: q.questionText,
          stimulus: q.stimulus,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          isApproved: true,
          contentHash,
        },
      });
      created++;
      console.log(`  [${q.course}] ${q.unit}: ${q.topic}`);
    } catch (e) {
      console.log(`  [ERR] ${q.course}/${q.unit}: ${e.message.slice(0, 140)}`);
    }
  }

  console.log(`\nCreated: ${created}`);
  console.log(`Skipped (already present): ${skipped}`);
  console.log(`Total authored: ${USH_QUESTIONS.length + STATS_QUESTIONS.length} (${USH_QUESTIONS.length} USH + ${STATS_QUESTIONS.length} STATS)`);
  await prisma.$disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
