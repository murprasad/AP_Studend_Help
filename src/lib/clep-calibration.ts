/**
 * CLEP Calibration Examples
 *
 * Original question stems that demonstrate College Board-level style,
 * tone, structure, and difficulty for each CLEP exam.
 *
 * Used in AI prompts as style/difficulty references so generated
 * questions match intro-college rigor.
 *
 * NOT copied from any official source -- these are 100% original examples.
 *
 * Rules followed:
 *  1. Always scenario-based (no "What is X?" or "Define Y")
 *  2. Concrete, specific scenarios (names, settings, observations)
 *  3. Ask "Which concept/principle/theory best explains..." style
 *  4. No answer options -- stem only
 *  5. Intro college-level reading (clear, minimal jargon)
 *  6. Tests APPLICATION, not recall
 */

export const CLEP_CALIBRATION: Record<string, string[]> = {
  // =========================================================================
  // TOP 15 (2-3 examples each)
  // =========================================================================

  // 1. Introductory Psychology -- highest volume
  CLEP_INTRO_PSYCHOLOGY: [
    "A psychologist observes that a child who was previously afraid of dogs now approaches them calmly after repeated positive experiences with a neighbor's puppy. Which learning principle best explains this behavioral change?",
    "A researcher finds that participants who studied vocabulary words in the same room where they were later tested recalled significantly more words than those tested in a different room. This finding best supports which theory of memory?",
    "During a therapy session, a patient describes feeling anxious in social situations and avoiding parties. The therapist suggests that the patient's avoidance behavior is maintained because it reduces anxiety. This explanation is most consistent with which theoretical perspective?",
  ],

  // 2. Introductory Sociology
  CLEP_INTRODUCTORY_SOCIOLOGY: [
    "A sociologist studying a small rural community finds that residents who attend church regularly report higher levels of trust in their neighbors than non-attendees. Which sociological concept best explains this relationship?",
    "In a factory, workers develop informal rules about how fast the assembly line should move, punishing coworkers who work too quickly. A sociologist would identify these informal rules as an example of which concept?",
    "A researcher notices that students from wealthier school districts consistently score higher on standardized tests, even after controlling for individual ability. Which sociological framework would best account for this pattern?",
  ],

  // 3. Principles of Marketing
  CLEP_PRINCIPLES_OF_MARKETING: [
    "A coffee company discovers that its customers in the Pacific Northwest prefer dark roast blends, while customers in the Southeast favor lighter roasts with flavored options. The company decides to stock different products in each region. This approach best illustrates which marketing strategy?",
    "A smartphone manufacturer initially prices its newest model at $1,199, then reduces the price by $200 six months later when a competitor releases a similar device. This pricing approach is most consistent with which strategy?",
    "A small bakery notices that 80% of its revenue comes from 20% of its customers -- those who place weekly catering orders. The owner decides to create a loyalty program exclusively for these high-volume buyers. This decision reflects which marketing principle?",
  ],

  // 4. College Algebra
  CLEP_COLLEGE_ALGEBRA: [
    "A biologist models the population of bacteria in a petri dish using the function P(t) = 500 * 2^(t/3), where t is measured in hours. After how many hours will the population first exceed 16,000? Which property of exponential functions is most relevant to solving this problem?",
    "An engineer determines that the height of a projectile is modeled by h(t) = -16t^2 + 64t + 80. She needs to find when the projectile reaches its maximum height. Which algebraic technique is most appropriate for determining this value?",
    "A financial analyst observes that a company's revenue can be modeled by a polynomial function that has exactly three real zeros and a positive leading coefficient of even degree. Based on these characteristics, which statement about the graph's end behavior must be true?",
  ],

  // 5. College Composition
  CLEP_COLLEGE_COMPOSITION: [
    "A student writes a research paper arguing that urban green spaces improve mental health outcomes. Her professor notes that she relies exclusively on studies conducted in Scandinavian cities. Which rhetorical weakness does this limitation most clearly represent?",
    "In revising a persuasive essay about renewable energy, a writer moves a paragraph containing counterarguments from the conclusion to a position immediately after the introduction. This structural change most likely serves which rhetorical purpose?",
    "A writer drafts the sentence: 'The committee made their decision, and it was decided that the policy would be implemented by the end of the fiscal year.' An editor suggests revising for conciseness and active voice. Which revision principle should the writer apply first?",
  ],

  // 6. American Government
  CLEP_AMERICAN_GOVERNMENT: [
    "A state legislature passes a law requiring all public school students to recite a nondenominational prayer each morning. A parent challenges the law in federal court. Which clause of the Constitution would most directly support the parent's legal challenge?",
    "During a presidential election year, a candidate wins the popular vote in a state by a margin of 2%, receiving all of that state's electoral votes. A political analyst argues this outcome demonstrates a structural feature of the electoral system. Which feature is the analyst most likely describing?",
    "After a controversial Supreme Court ruling, several members of Congress propose a constitutional amendment to overturn the decision. Which aspect of the American system of government does this scenario best illustrate?",
  ],

  // 7. Principles of Macroeconomics
  CLEP_MACROECONOMICS: [
    "A country's central bank lowers the reserve requirement for commercial banks from 10% to 8%. An economist predicts this will lead to an increase in the money supply. Which concept best explains the mechanism through which this policy change affects the money supply?",
    "During a recession, the government increases spending on infrastructure projects while simultaneously cutting income tax rates. An economist notes that the resulting budget deficit could lead to higher interest rates that partially offset the stimulus. This offsetting effect is best described by which concept?",
    "Country X experiences a simultaneous increase in consumer confidence and a sharp rise in oil prices imported from abroad. An economist analyzing these events would predict which combination of changes to real GDP and the price level?",
  ],

  // 8. Principles of Microeconomics
  CLEP_MICROECONOMICS: [
    "A local government imposes a price ceiling on apartment rents that is set below the market equilibrium price. After six months, housing advocates report longer waitlists for apartments and a decline in building maintenance. Which economic concept best explains both of these outcomes?",
    "A firm operating in a perfectly competitive market is currently producing at a level where marginal cost exceeds marginal revenue but total revenue still exceeds total variable cost. Based on this information, what should the firm do in the short run to maximize profit or minimize loss?",
    "Two competing gas stations on the same intersection must independently decide whether to set high or low prices each morning. Each station knows that if both set low prices they earn moderate profits, but if one sets a high price while the other sets a low price, the high-price station loses most of its customers. This situation best illustrates which concept from game theory?",
  ],

  // 9. Biology
  CLEP_BIOLOGY: [
    "A researcher observes that a population of beetles on an island has developed darker coloration over 50 generations. Genetic analysis reveals that the allele for dark coloration has increased from 15% to 78% in the population. Predation studies show that lighter beetles are more visible to bird predators on the island's volcanic rock. Which evolutionary mechanism best accounts for this change in allele frequency?",
    "A student places a red blood cell in a solution and observes through a microscope that the cell swells and eventually bursts. Based on this observation, which statement about the solution relative to the cell's interior is most accurate?",
    "In a genetics experiment, a researcher crosses two heterozygous pea plants (Rr) and observes that the offspring ratio deviates significantly from the expected 3:1 phenotypic ratio, with far fewer homozygous recessive offspring surviving to maturity. Which factor most likely explains this deviation?",
  ],

  // 10. College Mathematics
  CLEP_COLLEGE_MATH: [
    "A survey of 200 college students finds that 120 take English, 90 take History, and 40 take both English and History. A student is selected at random. Using set theory, which approach correctly determines the probability that the student takes neither English nor History?",
    "A city planner models population growth using the function P(t) = 50,000(1.03)^t. She needs to determine how long it will take for the population to double. Which mathematical concept is most directly applicable to solving this problem?",
  ],

  // 11. U.S. History I (Colonial to 1877)
  CLEP_US_HISTORY_1: [
    "In 1786, farmers in western Massachusetts, burdened by heavy taxes and debt, took up arms against state courthouses to prevent foreclosure proceedings. This event most directly influenced the delegates at the 1787 Constitutional Convention to address which concern about the existing government?",
    "A historian examining plantation records from the antebellum South discovers evidence of enslaved people maintaining cultural practices including storytelling traditions, religious ceremonies, and kinship networks distinct from those of slaveholders. This evidence best supports which historical interpretation?",
  ],

  // 12. U.S. History II (1865 to present)
  CLEP_US_HISTORY_2: [
    "In the early 1900s, journalists published detailed accounts of unsanitary conditions in meatpacking plants, child labor in textile mills, and corruption in city governments. These publications most directly contributed to which political development?",
    "During the 1950s, a federal program built thousands of miles of highways connecting major cities, while simultaneously offering government-backed mortgages for suburban homes. A historian argues that these policies had significant unintended consequences for urban communities. Which outcome is the historian most likely describing?",
  ],

  // 13. Human Growth and Development
  CLEP_HUMAN_GROWTH_DEV: [
    "A researcher shows a toy to a 6-month-old infant, then hides it behind a screen. The infant does not reach for the toy and appears to lose interest. When the same experiment is conducted with a 12-month-old, the child actively searches behind the screen. This developmental difference best illustrates which cognitive milestone?",
    "A longitudinal study follows adults from age 25 to age 70 and finds that while their ability to solve novel logic puzzles declines after age 40, their vocabulary scores and general knowledge continue to increase into their 60s. This pattern best supports which theory of cognitive aging?",
    "A preschool teacher observes that a 4-year-old child insists that a tall, narrow glass contains more juice than a short, wide glass, even after watching the juice being poured from one container to the other. This behavior is most characteristic of which stage of cognitive development?",
  ],

  // 14. Financial Accounting
  CLEP_FINANCIAL_ACCOUNTING: [
    "A company purchases equipment for $50,000 with a useful life of 10 years and an estimated salvage value of $5,000. After using the equipment for three years, the company determines that the remaining useful life is only four more years with no salvage value. An accountant must decide how to report this change. Which accounting principle most directly governs how this adjustment should be handled?",
    "At the end of the fiscal year, a retail company has received $12,000 in advance payments from customers for goods that have not yet been delivered. The bookkeeper initially recorded this amount as revenue. Which accounting principle has been violated, and how should the entry be corrected?",
    "A company reports net income of $80,000 on its income statement, but its cash flow from operations is only $55,000. An analyst examining the financial statements identifies that the difference is primarily due to a large increase in accounts receivable during the period. Which concept best explains why net income and operating cash flow differ in this scenario?",
  ],

  // 15. Analyzing and Interpreting Literature
  CLEP_ANALYZING_INTERPRETING_LIT: [
    "In a short story, the narrator describes a family dinner where every character speaks in clipped, polite sentences while the narration reveals each person's unspoken resentment toward the others. The contrast between dialogue and narration most clearly exemplifies which literary technique?",
    "A poet writes a 14-line poem in iambic pentameter with a rhyme scheme of ABAB CDCD EFEF GG. In the final couplet, the speaker reverses the argument developed in the preceding twelve lines. This structural turn is most characteristic of which poetic form, and what is the traditional term for this reversal?",
  ],

  // =========================================================================
  // REMAINING 19 (1-2 examples each)
  // =========================================================================

  // 16. American Literature
  CLEP_AMERICAN_LITERATURE: [
    "A literary scholar compares two 19th-century American novels and argues that one emphasizes the individual's spiritual connection to nature while the other portrays the destructive consequences of industrialization on rural communities. The first novel's philosophical orientation is most closely aligned with which literary movement?",
    "In a novel published during the Harlem Renaissance, the protagonist navigates between the expectations of a predominantly white institution and the cultural richness of a Black neighborhood in New York City. The author's exploration of this dual consciousness most directly engages with which thematic concern in American literature?",
  ],

  // 17. College Composition Modular
  CLEP_COLLEGE_COMP_MODULAR: [
    "A student's essay contains the sentence: 'The study concluded that students performed better; however, the sample size was too small to generalize.' A peer reviewer suggests this sentence undermines the essay's argument. The reviewer's concern most likely relates to which aspect of effective argumentation?",
  ],

  // 18. English Literature
  CLEP_ENGLISH_LITERATURE: [
    "In a 19th-century novel, the protagonist repeatedly describes the moors surrounding her home as both terrifying and liberating, using the landscape to express emotions she cannot voice in the drawing room. A literary critic would most likely interpret this use of setting as an example of which narrative technique?",
    "A Shakespearean character delivers a speech praising loyalty and honor to the assembled court while the audience knows he is secretly plotting the king's overthrow. This gap between the character's words and the audience's knowledge best exemplifies which dramatic device?",
  ],

  // 19. Humanities
  CLEP_HUMANITIES: [
    "A museum curator arranges an exhibit tracing the development of perspective in Western painting, beginning with flat, iconic Byzantine images and ending with the photorealistic trompe l'oeil technique of the 17th century. The shift from Byzantine to Renaissance painting most directly reflects which broader cultural change?",
  ],

  // 20. Educational Psychology
  CLEP_EDUCATIONAL_PSYCHOLOGY: [
    "A teacher notices that students who receive specific, immediate feedback on their math homework (e.g., 'Your approach to step 3 used the wrong formula -- try the quadratic formula instead') improve more rapidly than students who simply receive a letter grade. This observation is most consistent with which principle of learning?",
    "A middle school teacher assigns a complex project and provides students with a rubric, a timeline with checkpoints, and guided questions for self-reflection after each milestone. This instructional approach best illustrates which educational concept?",
  ],

  // 21. Social Sciences and History
  CLEP_SOCIAL_SCIENCES_HISTORY: [
    "An anthropologist studying a remote village observes that community members resolve property disputes through a council of elders rather than a formal court system. This observation best illustrates which concept in the social sciences?",
  ],

  // 22. Western Civilization I (Ancient to 1648)
  CLEP_WESTERN_CIV_1: [
    "A historian examines records from a medieval European town and discovers that guilds controlled the prices of goods, determined who could practice a craft, and provided social services to members' families. These functions of guilds most clearly illustrate which aspect of medieval economic and social organization?",
    "An archaeologist uncovers a series of clay tablets from ancient Mesopotamia containing detailed records of grain harvests, land ownership, and debt transactions. The existence of these records most directly supports which conclusion about early civilizations?",
  ],

  // 23. Western Civilization II (1648 to present)
  CLEP_WESTERN_CIV_2: [
    "In the late 18th century, a French pamphleteer argues that all citizens are born with inherent rights that no government may revoke, and that legitimate political authority derives solely from the consent of the governed. These ideas are most directly rooted in which intellectual movement?",
  ],

  // 24. Calculus
  CLEP_CALCULUS: [
    "A tank is being filled with water at a rate modeled by R(t) = 3t^2 - 12t + 15 gallons per minute, where t is measured in minutes. An engineer needs to determine the total amount of water added to the tank between t = 1 and t = 4. Which calculus concept and technique should the engineer apply to solve this problem?",
  ],

  // 25. Chemistry
  CLEP_CHEMISTRY: [
    "A student dissolves equal amounts of two different white solids in water. Solution A conducts electricity and produces a precipitate when silver nitrate is added, while Solution B does not conduct electricity. Based on these observations, which conclusion about the bonding in the original solids is most justified?",
    "An experiment measures the rate of a reaction at several different temperatures while keeping all other variables constant. The data shows that doubling the absolute temperature more than doubles the reaction rate. This observation is best explained by which chemical principle?",
  ],

  // 26. Natural Sciences
  CLEP_NATURAL_SCIENCES: [
    "A geologist examines rock layers exposed by a river canyon. She finds marine fossils in the lower strata, freshwater fossils in the middle layers, and terrestrial plant fossils in the upper layers. This sequence of fossils most directly supports which conclusion about the geological history of the region?",
  ],

  // 27. Precalculus
  CLEP_PRECALCULUS: [
    "A surveyor standing 200 meters from the base of a cliff measures the angle of elevation to the top of the cliff as 35 degrees. She then walks 50 meters closer and measures the new angle of elevation as 48 degrees. To find the height of the cliff using both measurements, which trigonometric approach is most appropriate?",
  ],

  // 28. Principles of Management
  CLEP_PRINCIPLES_OF_MANAGEMENT: [
    "A software company allows its developers to spend 20% of their work time on personal projects unrelated to their assigned tasks. Several commercially successful products have originated from this policy. This management practice most closely aligns with which motivational theory?",
    "A retail chain's regional manager notices that store performance varies dramatically between locations with similar demographics. After investigation, she finds that high-performing stores have managers who adjust their leadership approach based on the experience level and confidence of individual employees. This adaptive approach best exemplifies which leadership model?",
  ],

  // 29. Information Systems
  CLEP_INFORMATION_SYSTEMS: [
    "A hospital implements a new electronic health records system. Six months after deployment, doctors report that the system takes longer to use than paper charts, but data analysts note that medication errors have decreased by 40%. A systems analyst evaluating this tradeoff would most likely frame the discussion in terms of which information systems concept?",
  ],

  // 30. Introductory Business Law
  CLEP_BUSINESS_LAW: [
    "A homeowner hires a contractor to remodel her kitchen for $15,000, with a written agreement specifying completion within 60 days. After 45 days, the contractor has completed only 30% of the work and announces he is abandoning the project. The homeowner's best legal remedy most likely falls under which area of contract law?",
  ],

  // 31. French Language
  CLEP_FRENCH: [
    "A student reads a French newspaper article about a local festival and encounters the sentence: 'Les habitants du village se rassemblent chaque annee pour celebrer la recolte, une tradition qui remonte au XVIIe siecle.' Based on the context and structure of this sentence, which comprehension skill is most critical for determining the main idea?",
  ],

  // 32. German Language
  CLEP_GERMAN: [
    "A student listening to a German radio broadcast hears: 'Trotz des schlechten Wetters kamen Tausende von Besuchern zum Stadtfest.' The student must determine why the subject and verb are inverted. Which grammatical rule governing German sentence structure best explains this word order?",
  ],

  // 33. Spanish Language
  CLEP_SPANISH: [
    "A student reads a letter in which the author writes: 'Si hubiera sabido que el museo estaba cerrado, habria visitado la catedral en su lugar.' To correctly interpret the author's meaning, the student must recognize which grammatical construction and its communicative function?",
  ],

  // 34. Spanish with Writing
  CLEP_SPANISH_WRITING: [
    "A student is asked to write a formal email in Spanish requesting information about a university scholarship program. The student drafts: 'Oye, quiero saber sobre las becas que tienen.' A professor marks this as inappropriate for the context. Which aspect of Spanish register and conventions has the student failed to apply?",
  ],
};
