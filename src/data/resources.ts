import { ApUnit } from "@prisma/client";

export interface Resource {
  id: string;
  name: string;
  description: string;
  url: string;
  type: "video_channel" | "practice" | "reading" | "primary_source" | "curriculum";
  icon: string;
  color: string;
  free: boolean;
}

export interface VideoResource {
  title: string;
  channelName: string;
  youtubeId: string; // video ID or playlist ID
  isPlaylist: boolean;
  unit: ApUnit;
  description: string;
}

export interface UnitResource {
  unit: ApUnit;
  unitName: string;
  timePeriod: string;
  keyThemes: string[];
  heimlerVideoId: string; // Heimler's History YouTube video ID
  khanPlaylistId: string; // Khan Academy playlist
  oerUrl: string;
  fiveableUrl: string;
  zinnUrl: string;
  worldHistoryUrl: string;
  practiceQuizUrl: string;
}

// ── Global resource directory ──────────────────────────────────────────────
export const GLOBAL_RESOURCES: Resource[] = [
  {
    id: "college-board",
    name: "College Board AP Central",
    description: "Official AP World History course framework, exam descriptions, sample questions, and scoring guidelines directly from the exam makers.",
    url: "https://apcentral.collegeboard.org/courses/ap-world-history",
    type: "curriculum",
    icon: "GraduationCap",
    color: "text-blue-400",
    free: true,
  },
  {
    id: "oer-project",
    name: "OER Project – World History",
    description: "Fully open-licensed AP World History course with readings, primary sources, and activities aligned to AP curriculum.",
    url: "https://www.oerproject.com/AP-World-History",
    type: "reading",
    icon: "BookOpen",
    color: "text-emerald-400",
    free: true,
  },
  {
    id: "practice-quiz",
    name: "PracticeQuiz AP World History",
    description: "Large bank of AP-style multiple choice questions with instant feedback, organized by topic and difficulty.",
    url: "https://www.practicequiz.com/ap-world-history-practice-test",
    type: "practice",
    icon: "ClipboardCheck",
    color: "text-purple-400",
    free: true,
  },
  {
    id: "fiveable",
    name: "Fiveable AP World History",
    description: "Guided practice, study guides, key concepts, and live review sessions for every AP World History unit.",
    url: "https://library.fiveable.me/ap-world",
    type: "reading",
    icon: "Zap",
    color: "text-yellow-400",
    free: true,
  },
  {
    id: "world-history-for-all",
    name: "World History For Us All",
    description: "SDSU open curriculum with world history units, primary sources, and teaching materials covering all eras.",
    url: "https://worldhistoryforusall.sdsu.edu",
    type: "reading",
    icon: "Globe",
    color: "text-cyan-400",
    free: true,
  },
  {
    id: "zinn-education",
    name: "Zinn Education Project",
    description: "Teaching resources, primary sources, and lesson plans emphasizing people's history and multiple perspectives.",
    url: "https://www.zinnedproject.org",
    type: "primary_source",
    icon: "FileText",
    color: "text-orange-400",
    free: true,
  },
  {
    id: "heimlers-history",
    name: "Heimler's History",
    description: "YouTube channel with comprehensive AP World History video reviews for every unit, exam skills, and DBQ practice.",
    url: "https://www.youtube.com/@heimlershistory",
    type: "video_channel",
    icon: "Youtube",
    color: "text-red-400",
    free: true,
  },
  {
    id: "khan-academy",
    name: "Khan Academy AP World History",
    description: "Free video lessons, articles, and practice exercises covering all AP World History units with in-depth explanations.",
    url: "https://www.khanacademy.org/humanities/ap-world-history",
    type: "video_channel",
    icon: "Play",
    color: "text-green-400",
    free: true,
  },
];

// ── Per-unit curated resources ─────────────────────────────────────────────
// Heimler's History video IDs (YouTube) - AP World History unit reviews
// Khan Academy AP World History playlist IDs per unit
export const UNIT_RESOURCES: UnitResource[] = [
  {
    unit: ApUnit.UNIT_1_GLOBAL_TAPESTRY,
    unitName: "Unit 1: The Global Tapestry",
    timePeriod: "1200–1450 CE",
    keyThemes: ["Song Dynasty China", "Dar al-Islam", "South/Southeast Asia", "Americas & Africa", "Comparison of States"],
    heimlerVideoId: "6YCZFQBFNok",
    khanPlaylistId: "PLSQl0a2vh4HCLqA9FiKGSqzqHGwBFRFZu",
    oerUrl: "https://www.oerproject.com/AP-World-History/Unit-1",
    fiveableUrl: "https://library.fiveable.me/ap-world/unit-1",
    zinnUrl: "https://www.zinnedproject.org/materials/?era=medieval-renaissance-1200-1500",
    worldHistoryUrl: "https://worldhistoryforusall.sdsu.edu/eras/era5.htm",
    practiceQuizUrl: "https://www.practicequiz.com/ap-world-history-practice-test",
  },
  {
    unit: ApUnit.UNIT_2_NETWORKS_OF_EXCHANGE,
    unitName: "Unit 2: Networks of Exchange",
    timePeriod: "1200–1450 CE",
    keyThemes: ["Silk Roads", "Mongol Empire", "Indian Ocean Trade", "Trans-Saharan Trade", "Cultural Diffusion"],
    heimlerVideoId: "0rFjzHevFtc",
    khanPlaylistId: "PLSQl0a2vh4HCLqA9FiKGSqzqHGwBFRFZu",
    oerUrl: "https://www.oerproject.com/AP-World-History/Unit-2",
    fiveableUrl: "https://library.fiveable.me/ap-world/unit-2",
    zinnUrl: "https://www.zinnedproject.org/materials/?era=medieval-renaissance-1200-1500",
    worldHistoryUrl: "https://worldhistoryforusall.sdsu.edu/eras/era5.htm",
    practiceQuizUrl: "https://www.practicequiz.com/ap-world-history-practice-test",
  },
  {
    unit: ApUnit.UNIT_3_LAND_BASED_EMPIRES,
    unitName: "Unit 3: Land-Based Empires",
    timePeriod: "1450–1750 CE",
    keyThemes: ["Ottoman Empire", "Safavid Empire", "Mughal Empire", "Ming/Qing China", "Gunpowder Empires"],
    heimlerVideoId: "t_l0BIKMdvs",
    khanPlaylistId: "PLSQl0a2vh4HDnHWiAaOhwMJkSRLXxLrOK",
    oerUrl: "https://www.oerproject.com/AP-World-History/Unit-3",
    fiveableUrl: "https://library.fiveable.me/ap-world/unit-3",
    zinnUrl: "https://www.zinnedproject.org/materials/?era=1400s-1600s",
    worldHistoryUrl: "https://worldhistoryforusall.sdsu.edu/eras/era6.htm",
    practiceQuizUrl: "https://www.practicequiz.com/ap-world-history-practice-test",
  },
  {
    unit: ApUnit.UNIT_4_TRANSOCEANIC_INTERCONNECTIONS,
    unitName: "Unit 4: Transoceanic Interconnections",
    timePeriod: "1450–1750 CE",
    keyThemes: ["Columbian Exchange", "European Colonization", "Atlantic Slave Trade", "Maritime Empires", "Coercive Labor Systems"],
    heimlerVideoId: "WMCgLxVFwqc",
    khanPlaylistId: "PLSQl0a2vh4HDnHWiAaOhwMJkSRLXxLrOK",
    oerUrl: "https://www.oerproject.com/AP-World-History/Unit-4",
    fiveableUrl: "https://library.fiveable.me/ap-world/unit-4",
    zinnUrl: "https://www.zinnedproject.org/materials/?era=1400s-1600s",
    worldHistoryUrl: "https://worldhistoryforusall.sdsu.edu/eras/era6.htm",
    practiceQuizUrl: "https://www.practicequiz.com/ap-world-history-practice-test",
  },
  {
    unit: ApUnit.UNIT_5_REVOLUTIONS,
    unitName: "Unit 5: Revolutions",
    timePeriod: "1750–1900 CE",
    keyThemes: ["Enlightenment", "American Revolution", "French Revolution", "Haitian Revolution", "Latin American Independence"],
    heimlerVideoId: "GcBmkPmAFkM",
    khanPlaylistId: "PLSQl0a2vh4HA0wMGD5JpWDqTTjI7Lbj3L",
    oerUrl: "https://www.oerproject.com/AP-World-History/Unit-5",
    fiveableUrl: "https://library.fiveable.me/ap-world/unit-5",
    zinnUrl: "https://www.zinnedproject.org/materials/?era=american-revolution-civil-war-reconstruction",
    worldHistoryUrl: "https://worldhistoryforusall.sdsu.edu/eras/era7.htm",
    practiceQuizUrl: "https://www.practicequiz.com/ap-world-history-practice-test",
  },
  {
    unit: ApUnit.UNIT_6_INDUSTRIALIZATION,
    unitName: "Unit 6: Industrialization & Imperialism",
    timePeriod: "1750–1900 CE",
    keyThemes: ["Industrial Revolution", "Social Effects of Industrialization", "Imperialism", "Resistance to Imperialism", "Economic Systems"],
    heimlerVideoId: "UIF_W7g-glU",
    khanPlaylistId: "PLSQl0a2vh4HA0wMGD5JpWDqTTjI7Lbj3L",
    oerUrl: "https://www.oerproject.com/AP-World-History/Unit-6",
    fiveableUrl: "https://library.fiveable.me/ap-world/unit-6",
    zinnUrl: "https://www.zinnedproject.org/materials/?era=industrialization-imperialism",
    worldHistoryUrl: "https://worldhistoryforusall.sdsu.edu/eras/era7.htm",
    practiceQuizUrl: "https://www.practicequiz.com/ap-world-history-practice-test",
  },
  {
    unit: ApUnit.UNIT_7_GLOBAL_CONFLICT,
    unitName: "Unit 7: Global Conflict",
    timePeriod: "1900–Present",
    keyThemes: ["World War I", "World War II", "Causes of Global Conflict", "Nationalism", "Genocide & Atrocities"],
    heimlerVideoId: "Xx6pBGiRAzE",
    khanPlaylistId: "PLSQl0a2vh4HB43bYC5Ll3mKlalvC0mxEp",
    oerUrl: "https://www.oerproject.com/AP-World-History/Unit-7",
    fiveableUrl: "https://library.fiveable.me/ap-world/unit-7",
    zinnUrl: "https://www.zinnedproject.org/materials/?era=world-war-ii-postwar",
    worldHistoryUrl: "https://worldhistoryforusall.sdsu.edu/eras/era8.htm",
    practiceQuizUrl: "https://www.practicequiz.com/ap-world-history-practice-test",
  },
  {
    unit: ApUnit.UNIT_8_COLD_WAR,
    unitName: "Unit 8: Cold War & Decolonization",
    timePeriod: "1900–Present",
    keyThemes: ["Cold War", "Decolonization", "Independence Movements", "Proxy Wars", "Non-Aligned Movement"],
    heimlerVideoId: "1HOu-P5fvEY",
    khanPlaylistId: "PLSQl0a2vh4HB43bYC5Ll3mKlalvC0mxEp",
    oerUrl: "https://www.oerproject.com/AP-World-History/Unit-8",
    fiveableUrl: "https://library.fiveable.me/ap-world/unit-8",
    zinnUrl: "https://www.zinnedproject.org/materials/?era=world-war-ii-postwar",
    worldHistoryUrl: "https://worldhistoryforusall.sdsu.edu/eras/era8.htm",
    practiceQuizUrl: "https://www.practicequiz.com/ap-world-history-practice-test",
  },
  {
    unit: ApUnit.UNIT_9_GLOBALIZATION,
    unitName: "Unit 9: Globalization",
    timePeriod: "1900–Present",
    keyThemes: ["Economic Globalization", "Cultural Exchange", "Technology", "Environment", "Resistance to Globalization"],
    heimlerVideoId: "QhR3RVFc0gk",
    khanPlaylistId: "PLSQl0a2vh4HB43bYC5Ll3mKlalvC0mxEp",
    oerUrl: "https://www.oerproject.com/AP-World-History/Unit-9",
    fiveableUrl: "https://library.fiveable.me/ap-world/unit-9",
    zinnUrl: "https://www.zinnedproject.org/materials/?era=globalization",
    worldHistoryUrl: "https://worldhistoryforusall.sdsu.edu/eras/era9.htm",
    practiceQuizUrl: "https://www.practicequiz.com/ap-world-history-practice-test",
  },
];

// ── AP Exam skills & tips ──────────────────────────────────────────────────
export const EXAM_SKILLS = [
  {
    skill: "MCQ Strategy",
    description: "Process of elimination, stimulus analysis, key command words",
    heimlerVideoId: "W9RHJfpNUCM",
    url: "https://apcentral.collegeboard.org/courses/ap-world-history/exam",
  },
  {
    skill: "SAQ Writing",
    description: "Short Answer Question format, HAPP structure, examples",
    heimlerVideoId: "YGS4rKDknEU",
    url: "https://library.fiveable.me/ap-world/exam-skills/saq",
  },
  {
    skill: "DBQ Writing",
    description: "Document Based Question thesis, evidence, sourcing, complexity",
    heimlerVideoId: "f3Ot_GMHZOM",
    url: "https://library.fiveable.me/ap-world/exam-skills/dbq",
  },
  {
    skill: "LEQ Writing",
    description: "Long Essay Question structure, argument, evidence, reasoning",
    heimlerVideoId: "m_d4rSMwQ_Y",
    url: "https://library.fiveable.me/ap-world/exam-skills/leq",
  },
];
