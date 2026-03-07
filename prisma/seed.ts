import { PrismaClient, ApUnit, Difficulty, QuestionType } from "@prisma/client";

const prisma = new PrismaClient();

const sampleQuestions = [
  // Unit 1 - Global Tapestry
  {
    unit: ApUnit.UNIT_1_GLOBAL_TAPESTRY,
    topic: "Song Dynasty China",
    subtopic: "Economic and Social Changes",
    difficulty: Difficulty.MEDIUM,
    questionType: QuestionType.MCQ,
    stimulus: `"During the Song Dynasty, China experienced a dramatic increase in agricultural productivity due to the introduction of new rice strains from Vietnam. This surplus supported rapid urbanization, with cities like Hangzhou growing to over one million residents."`,
    questionText: "Which of the following best explains how the Song Dynasty's agricultural revolution contributed to broader social changes?",
    options: JSON.stringify([
      "A) It led to the decline of Confucian values as merchants gained power",
      "B) It enabled urban growth and the expansion of a merchant middle class",
      "C) It caused widespread peasant revolts due to land redistribution",
      "D) It strengthened the feudal system by tying peasants to the land"
    ]),
    correctAnswer: "B",
    explanation: "The agricultural surplus during the Song Dynasty enabled urbanization and the rise of a merchant middle class. Cities grew dramatically as people moved from rural areas. This economic growth led to the expansion of commerce and the development of a prosperous urban merchant class, though Confucian ideology still ranked merchants below scholars and farmers.",
    isAiGenerated: false,
    isApproved: true,
  },
  {
    unit: ApUnit.UNIT_1_GLOBAL_TAPESTRY,
    topic: "Islamic Caliphates",
    subtopic: "Political Structures",
    difficulty: Difficulty.EASY,
    questionType: QuestionType.MCQ,
    questionText: "The Abbasid Caliphate differed from the Umayyad Caliphate primarily in that the Abbasids",
    options: JSON.stringify([
      "A) Expanded the empire to include Spain and North Africa",
      "B) Emphasized Arab ethnic identity in governance",
      "C) Promoted a more inclusive Islamic identity beyond Arab ethnicity",
      "D) Rejected the use of non-Muslim scholars and administrators"
    ]),
    correctAnswer: "C",
    explanation: "The Abbasid Caliphate (750-1258 CE) distinguished itself from the Umayyad Caliphate by moving away from Arab ethnic exclusivity. The Abbasids welcomed Persian, Turkish, and other Muslim converts into positions of power, creating a more cosmopolitan Islamic empire centered in Baghdad. This inclusivity helped legitimize Abbasid rule among non-Arab Muslims.",
    isAiGenerated: false,
    isApproved: true,
  },
  // Unit 2 - Networks of Exchange
  {
    unit: ApUnit.UNIT_2_NETWORKS_OF_EXCHANGE,
    topic: "Silk Roads",
    subtopic: "Trade and Cultural Exchange",
    difficulty: Difficulty.MEDIUM,
    questionType: QuestionType.MCQ,
    stimulus: `"The Silk Roads were not a single road but a network of overland and maritime routes connecting East Asia, South Asia, Central Asia, the Middle East, East Africa, and Europe. Merchants rarely traveled the entire route; instead, goods changed hands multiple times at oases and port cities."`,
    questionText: "Based on the passage, which of the following best describes the primary function of oasis cities along the Silk Roads?",
    options: JSON.stringify([
      "A) They served as military outposts to protect merchants from nomadic raids",
      "B) They acted as intermediaries where goods were exchanged between different trading groups",
      "C) They were centers of silk production that supplied goods to merchants",
      "D) They served exclusively as religious pilgrimage sites for Buddhist travelers"
    ]),
    correctAnswer: "B",
    explanation: "Oasis cities like Samarkand and Dunhuang functioned as crucial intermediary points along the Silk Roads. Since merchants rarely traveled the entire route, these cities served as hubs where goods changed hands between merchants from different regions. They also became centers of cultural, religious, and commercial exchange, where different civilizations interacted.",
    isAiGenerated: false,
    isApproved: true,
  },
  {
    unit: ApUnit.UNIT_2_NETWORKS_OF_EXCHANGE,
    topic: "Mongol Empire",
    subtopic: "Pax Mongolica",
    difficulty: Difficulty.HARD,
    questionType: QuestionType.MCQ,
    questionText: "The Pax Mongolica of the 13th and 14th centuries most significantly contributed to which of the following developments?",
    options: JSON.stringify([
      "A) The permanent political unification of Eurasia under Mongol rule",
      "B) The acceleration of cross-cultural exchange and long-distance trade",
      "C) The decline of pastoral nomadism as Mongols adopted sedentary lifestyles",
      "D) The spread of Christianity throughout Asia as Mongols converted"
    ]),
    correctAnswer: "B",
    explanation: "The Pax Mongolica (Mongol Peace) created safe conditions for travel and trade across the vast Mongol Empire. This stability allowed merchants like Marco Polo to travel safely, facilitated the exchange of goods, ideas, technologies, and diseases across Eurasia. The period saw remarkable cross-cultural contact, though it also contributed to the spread of the Black Death along trade routes.",
    isAiGenerated: false,
    isApproved: true,
  },
  // Unit 3 - Land-Based Empires
  {
    unit: ApUnit.UNIT_3_LAND_BASED_EMPIRES,
    topic: "Ottoman Empire",
    subtopic: "Gunpowder and Military",
    difficulty: Difficulty.MEDIUM,
    questionType: QuestionType.MCQ,
    questionText: "Which of the following best explains why the Ottoman, Safavid, and Mughal empires are often called 'Gunpowder Empires'?",
    options: JSON.stringify([
      "A) They all invented gunpowder technology independently in the 15th century",
      "B) Their military dominance relied heavily on the use of firearms and artillery",
      "C) They all refused to share gunpowder technology with neighboring states",
      "D) They derived their wealth primarily from the sale of gunpowder to European powers"
    ]),
    correctAnswer: "B",
    explanation: "The Ottoman, Safavid, and Mughal empires are called 'Gunpowder Empires' because their military power and territorial expansion depended significantly on the effective use of firearms and artillery. The Ottoman conquest of Constantinople in 1453 using massive cannons exemplifies this. These empires mastered the use of gunpowder weapons, giving them military advantages over opponents who had not yet adopted these technologies.",
    isAiGenerated: false,
    isApproved: true,
  },
  // Unit 4 - Transoceanic Interconnections
  {
    unit: ApUnit.UNIT_4_TRANSOCEANIC_INTERCONNECTIONS,
    topic: "Columbian Exchange",
    subtopic: "Biological and Cultural Exchange",
    difficulty: Difficulty.EASY,
    questionType: QuestionType.MCQ,
    questionText: "Which of the following was the most significant demographic consequence of the Columbian Exchange for indigenous peoples of the Americas?",
    options: JSON.stringify([
      "A) Rapid population growth due to new food crops from Europe",
      "B) Mass migration to Europe in search of better economic opportunities",
      "C) Catastrophic population decline due to exposure to Old World diseases",
      "D) Political unification as indigenous groups allied against European settlers"
    ]),
    correctAnswer: "C",
    explanation: "The most devastating consequence of the Columbian Exchange for indigenous Americans was the introduction of Old World diseases like smallpox, measles, and influenza. Having no prior exposure and therefore no immunity, indigenous populations suffered catastrophic mortality rates, with some regions losing 50-90% of their population within a century of contact. This demographic collapse fundamentally altered the balance of power and enabled European colonization.",
    isAiGenerated: false,
    isApproved: true,
  },
  // Unit 5 - Revolutions
  {
    unit: ApUnit.UNIT_5_REVOLUTIONS,
    topic: "French Revolution",
    subtopic: "Causes and Effects",
    difficulty: Difficulty.MEDIUM,
    questionType: QuestionType.MCQ,
    stimulus: `"The Estates-General met in May 1789 for the first time since 1614. The Third Estate, representing 97% of the French population, demanded that votes be counted by head rather than by estate. When this was refused, they formed the National Assembly and swore the Tennis Court Oath."`,
    questionText: "The events described in the passage best illustrate which of the following factors contributing to the French Revolution?",
    options: JSON.stringify([
      "A) Religious conflict between Catholics and Protestants in France",
      "B) Political exclusion of the common people and demands for representative government",
      "C) Economic competition between France and Britain for colonial territories",
      "D) Military defeats that undermined the legitimacy of the monarchy"
    ]),
    correctAnswer: "B",
    explanation: "The passage illustrates the political grievances that drove the French Revolution. The Third Estate (commoners, bourgeoisie, and peasants) represented 97% of the population but had only one vote equal to each of the other two estates (clergy and nobility). Their demand for proportional voting and subsequent formation of the National Assembly reflects the Enlightenment-inspired desire for representative government and popular sovereignty that was central to the Revolution.",
    isAiGenerated: false,
    isApproved: true,
  },
  // Unit 6 - Industrialization
  {
    unit: ApUnit.UNIT_6_INDUSTRIALIZATION,
    topic: "Industrial Revolution",
    subtopic: "Origins in Britain",
    difficulty: Difficulty.MEDIUM,
    questionType: QuestionType.MCQ,
    questionText: "Which combination of factors best explains why the Industrial Revolution began in Britain rather than in other European nations?",
    options: JSON.stringify([
      "A) Superior British scientific knowledge and a larger population than competitors",
      "B) Access to coal and iron, colonial markets, and a stable banking system",
      "C) British isolation from European wars that allowed peaceful economic development",
      "D) Government-mandated industrialization policies and state-controlled factories"
    ]),
    correctAnswer: "B",
    explanation: "Britain's Industrial Revolution was enabled by a combination of factors: abundant coal and iron deposits provided energy and raw materials; colonial markets in India, North America, and elsewhere provided both raw materials and consumers for manufactured goods; and a sophisticated banking and credit system provided capital for industrial investment. Britain's parliamentary system also provided relatively stable property rights that encouraged entrepreneurship.",
    isAiGenerated: false,
    isApproved: true,
  },
  // Unit 7 - Global Conflict
  {
    unit: ApUnit.UNIT_7_GLOBAL_CONFLICT,
    topic: "World War I",
    subtopic: "Causes",
    difficulty: Difficulty.EASY,
    questionType: QuestionType.MCQ,
    questionText: "Which of the following best describes the role of alliances in the outbreak of World War I?",
    options: JSON.stringify([
      "A) Alliances prevented the war by deterring aggression through collective defense",
      "B) Alliances transformed a regional conflict into a global war through mutual defense obligations",
      "C) Alliances were irrelevant because nations declared war based solely on economic interests",
      "D) Alliances created the war by requiring member nations to attack rivals preemptively"
    ]),
    correctAnswer: "B",
    explanation: "The alliance system in Europe transformed what began as a regional Austro-Hungarian conflict with Serbia into a world war. The Triple Alliance (Germany, Austria-Hungary, Italy) and Triple Entente (France, Russia, Britain) meant that when Austria-Hungary declared war on Serbia after Archduke Franz Ferdinand's assassination, Russia mobilized to defend Serbia, Germany declared war on Russia and France, and Britain entered when Germany invaded Belgium. The chain of mutual obligations escalated the conflict dramatically.",
    isAiGenerated: false,
    isApproved: true,
  },
  // Unit 8 - Cold War
  {
    unit: ApUnit.UNIT_8_COLD_WAR,
    topic: "Cold War Origins",
    subtopic: "Containment Policy",
    difficulty: Difficulty.MEDIUM,
    questionType: QuestionType.MCQ,
    questionText: "The Truman Doctrine of 1947 represented a significant shift in American foreign policy because it",
    options: JSON.stringify([
      "A) Committed the United States to joining the United Nations as a founding member",
      "B) Pledged American support for free peoples resisting communist subjugation globally",
      "C) Established the Marshall Plan to rebuild European economies after World War II",
      "D) Created the NATO alliance as a collective defense against Soviet expansion"
    ]),
    correctAnswer: "B",
    explanation: "The Truman Doctrine marked a fundamental shift from American isolationism to global engagement in the Cold War. Announced in response to communist pressure on Greece and Turkey, it committed the United States to 'support free peoples who are resisting attempted subjugation by armed minorities or by outside pressures.' This essentially committed America to containing communism wherever it threatened to expand, becoming the foundation of Cold War containment policy.",
    isAiGenerated: false,
    isApproved: true,
  },
  // Unit 9 - Globalization
  {
    unit: ApUnit.UNIT_9_GLOBALIZATION,
    topic: "Economic Globalization",
    subtopic: "International Trade Organizations",
    difficulty: Difficulty.HARD,
    questionType: QuestionType.MCQ,
    questionText: "Critics of globalization in the late 20th century most commonly argued that international trade organizations like the WTO",
    options: JSON.stringify([
      "A) Promoted democracy by requiring member nations to adopt democratic governments",
      "B) Primarily benefited wealthy nations and multinational corporations at the expense of developing countries",
      "C) Successfully reduced income inequality within all member nations",
      "D) Effectively prevented environmental degradation through international agreements"
    ]),
    correctAnswer: "B",
    explanation: "Critics of globalization and institutions like the WTO argued that the system was structured to benefit wealthy industrialized nations and multinational corporations. They pointed to trade agreements that opened developing countries' markets to foreign competition while wealthy countries maintained agricultural subsidies that undercut developing world farmers. The 'race to the bottom' in labor and environmental standards as companies sought cheap labor was also cited. Protests like those at the 1999 WTO Seattle meeting reflected these concerns.",
    isAiGenerated: false,
    isApproved: true,
  },
];

const achievements = [
  {
    name: "First Steps",
    description: "Complete your first practice session",
    iconName: "star",
    xpReward: 50,
    condition: { type: "sessions_completed", value: 1 },
  },
  {
    name: "Historian Level 1",
    description: "Answer 50 questions correctly",
    iconName: "book",
    xpReward: 100,
    condition: { type: "correct_answers", value: 50 },
  },
  {
    name: "Streak Starter",
    description: "Maintain a 3-day practice streak",
    iconName: "flame",
    xpReward: 75,
    condition: { type: "streak_days", value: 3 },
  },
  {
    name: "Week Warrior",
    description: "Maintain a 7-day practice streak",
    iconName: "trophy",
    xpReward: 200,
    condition: { type: "streak_days", value: 7 },
  },
  {
    name: "Empire Builder",
    description: "Achieve 80% mastery in Unit 3: Land-Based Empires",
    iconName: "castle",
    xpReward: 150,
    condition: { type: "unit_mastery", unit: "UNIT_3_LAND_BASED_EMPIRES", value: 80 },
  },
  {
    name: "Revolution Expert",
    description: "Achieve 80% mastery in Unit 5: Revolutions",
    iconName: "zap",
    xpReward: 150,
    condition: { type: "unit_mastery", unit: "UNIT_5_REVOLUTIONS", value: 80 },
  },
  {
    name: "Industrial Age Master",
    description: "Achieve 80% mastery in Unit 6: Industrialization",
    iconName: "factory",
    xpReward: 150,
    condition: { type: "unit_mastery", unit: "UNIT_6_INDUSTRIALIZATION", value: 80 },
  },
  {
    name: "Mock Exam Champion",
    description: "Complete a full mock exam",
    iconName: "award",
    xpReward: 300,
    condition: { type: "mock_exam_completed", value: 1 },
  },
  {
    name: "Perfect Score",
    description: "Get 100% accuracy in a practice session (min 10 questions)",
    iconName: "check-circle",
    xpReward: 250,
    condition: { type: "perfect_session", value: 1 },
  },
  {
    name: "AP Ready",
    description: "Achieve an estimated AP score of 4 or 5 on a mock exam",
    iconName: "graduation-cap",
    xpReward: 500,
    condition: { type: "ap_score_estimate", value: 4 },
  },
];

async function main() {
  console.log("Seeding database...");

  // Seed achievements
  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: {},
      create: achievement,
    });
  }
  console.log(`Seeded ${achievements.length} achievements`);

  // Seed questions
  for (const question of sampleQuestions) {
    await prisma.question.create({ data: question });
  }
  console.log(`Seeded ${sampleQuestions.length} questions`);

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
