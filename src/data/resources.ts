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

// Per-unit resource metadata (fiveableUrl, heimlerVideoId, keyThemes, etc.) has
// moved to src/lib/courses.ts → COURSE_REGISTRY[course].units[unit].
// See UnitMeta interface in courses.ts.

// ── Global resource directory ──────────────────────────────────────────────
export const GLOBAL_RESOURCES: Resource[] = [
  {
    id: "college-board",
    name: "College Board AP Central",
    description: "Official AP course frameworks, exam descriptions, sample questions, and scoring guidelines directly from the exam makers — for all 10 AP courses.",
    url: "https://apcentral.collegeboard.org",
    type: "curriculum",
    icon: "GraduationCap",
    color: "text-blue-400",
    free: true,
  },
  {
    id: "oer-project",
    name: "OER Project – AP Courses",
    description: "Fully open-licensed AP courses including World History and US History with readings, primary sources, and activities aligned to AP curriculum.",
    url: "https://www.oerproject.com",
    type: "reading",
    icon: "BookOpen",
    color: "text-emerald-400",
    free: true,
  },
  {
    id: "practice-quiz",
    name: "PracticeQuiz — AP Courses",
    description: "Large bank of AP-style multiple choice questions with instant feedback for all AP subjects, organized by topic and difficulty.",
    url: "https://www.practicequiz.com/ap",
    type: "practice",
    icon: "ClipboardCheck",
    color: "text-purple-400",
    free: true,
  },
  {
    id: "fiveable",
    name: "Fiveable AP Courses",
    description: "Guided practice, study guides, key concepts, and live review sessions for all AP courses including Calculus, Chemistry, Biology, Statistics, US History, and Psychology.",
    url: "https://library.fiveable.me",
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
    name: "Khan Academy — All AP Courses",
    description: "Free video lessons, articles, and practice exercises covering all 10 AP courses: Calculus, Statistics, Physics, Chemistry, Biology, World History, US History, Psychology, and Computer Science.",
    url: "https://www.khanacademy.org/ap-courses",
    type: "video_channel",
    icon: "Play",
    color: "text-green-400",
    free: true,
  },
  {
    id: "library-of-congress",
    name: "Library of Congress Digital Collections",
    description: "Millions of free primary source documents, photographs, maps, newspapers, and timelines from American and world history. Used by StudentNest to enrich AI tutor answers.",
    url: "https://www.loc.gov/collections/",
    type: "primary_source",
    icon: "Library",
    color: "text-indigo-400",
    free: true,
  },
  {
    id: "wikipedia",
    name: "Wikipedia / Wikimedia Foundation",
    description: "Free encyclopedia with deep articles on every AP topic across all courses. Wikipedia summaries are automatically pulled into AI tutor context to give accurate, sourced answers.",
    url: "https://en.wikipedia.org",
    type: "reading",
    icon: "BookMarked",
    color: "text-slate-300",
    free: true,
  },
  {
    id: "wikidata",
    name: "Wikidata",
    description: "Structured historical facts database by the Wikimedia Foundation. Powers instant fact lookups (dates, people, events) in AI-generated content.",
    url: "https://www.wikidata.org",
    type: "reading",
    icon: "Database",
    color: "text-teal-400",
    free: true,
  },
  {
    id: "openstax",
    name: "OpenStax Textbooks",
    description: "Peer-reviewed, openly licensed free textbooks for all AP courses: Calculus, Biology, Chemistry, Physics, Statistics, World History, Psychology, and more. Zero cost.",
    url: "https://openstax.org/subjects",
    type: "reading",
    icon: "BookOpen",
    color: "text-amber-400",
    free: true,
  },
  {
    id: "ck12",
    name: "CK-12 Foundation",
    description: "Free, customizable open educational resources for science, math, and history. Includes Flexbooks, concept pages, and interactive exercises aligned to AP curriculum.",
    url: "https://www.ck12.org/browse/",
    type: "reading",
    icon: "Layers",
    color: "text-lime-400",
    free: true,
  },
  {
    id: "mit-ocw",
    name: "MIT OpenCourseWare",
    description: "Free MIT course materials for Physics, Calculus, Chemistry, and Biology. 8.01SC Classical Mechanics and 18.01SC Single Variable Calculus are especially useful for AP exam prep.",
    url: "https://ocw.mit.edu",
    type: "reading",
    icon: "GraduationCap",
    color: "text-blue-400",
    free: true,
  },
  {
    id: "phet",
    name: "PhET Interactive Simulations",
    description: "Free interactive simulations from the University of Colorado Boulder for Physics, Chemistry, Biology, and Math. Excellent for visualizing forces, chemical reactions, natural selection, and more.",
    url: "https://phet.colorado.edu",
    type: "reading",
    icon: "Play",
    color: "text-green-400",
    free: true,
  },
  {
    id: "dig-stanford",
    name: "Digital Inquiry Group (Stanford)",
    description: "Provides 'Reading Like a Historian' lessons and primary-source assessments for AP World History and APUSH. StudentNest fetches DIG content to craft higher-quality historical thinking questions.",
    url: "https://www.inquirygroup.org/history-lessons",
    type: "primary_source",
    icon: "FileText",
    color: "text-violet-400",
    free: true,
  },
  {
    id: "sat-prep",
    name: "College Board SAT Prep (Official)",
    description: "Official College Board SAT preparation hub — free full-length practice tests, Bluebook digital testing app, and Khan Academy partnership for personalized practice.",
    url: "https://satsuite.collegeboard.org/sat/preparation",
    type: "practice",
    icon: "GraduationCap",
    color: "text-blue-400",
    free: true,
  },
  {
    id: "act-prep",
    name: "ACT Free Test Prep (Official)",
    description: "Official ACT free preparation resources — full-length practice tests, question-of-the-day, and official ACT prep guide covering all four sections (English, Math, Reading, Science).",
    url: "https://www.act.org/content/act/en/products-and-services/the-act/test-preparation/free-act-test-prep.html",
    type: "practice",
    icon: "ClipboardCheck",
    color: "text-orange-400",
    free: true,
  },
];

// ── Recommended textbooks & study guides per course ───────────────────────

export interface CourseTextbook {
  course: "AP_WORLD_HISTORY" | "AP_COMPUTER_SCIENCE_PRINCIPLES" | "AP_PHYSICS_1" |
          "AP_CALCULUS_AB" | "AP_CALCULUS_BC" | "AP_STATISTICS" |
          "AP_CHEMISTRY" | "AP_BIOLOGY" | "AP_US_HISTORY" | "AP_PSYCHOLOGY" |
          "SAT_MATH" | "SAT_READING_WRITING" |
          "ACT_MATH" | "ACT_ENGLISH" | "ACT_SCIENCE" | "ACT_READING";
  name: string;
  authors: string;
  publisher: string;
  description: string;
  type: "textbook" | "study_guide" | "curriculum" | "practice";
  free: boolean;
  url?: string;
}

export const COURSE_TEXTBOOKS: CourseTextbook[] = [
  // ── AP World History ──
  {
    course: "AP_WORLD_HISTORY",
    name: "Ways of the World: A Global History with Sources",
    authors: "Robert W. Strayer",
    publisher: "Macmillan / Bedford",
    description: "The most widely adopted AP World History textbook. Covers all 9 units with primary sources and historical analysis prompts aligned to the CED.",
    type: "textbook",
    free: false,
  },
  {
    course: "AP_WORLD_HISTORY",
    name: "Worlds Together, Worlds Apart",
    authors: "Robert Tignor et al.",
    publisher: "W.W. Norton",
    description: "Strong global history perspective covering trade networks, empires, and revolutions aligned with AP World History curriculum.",
    type: "textbook",
    free: false,
  },
  {
    course: "AP_WORLD_HISTORY",
    name: "Traditions & Encounters: A Global Perspective on the Past",
    authors: "Jerry Bentley & Herbert Ziegler",
    publisher: "McGraw-Hill",
    description: "Emphasizes cross-cultural interactions and long-distance trade — perfect for AP World History's Networks of Exchange unit.",
    type: "textbook",
    free: false,
  },
  {
    course: "AP_WORLD_HISTORY",
    name: "The Earth and Its Peoples",
    authors: "Richard Bulliet et al.",
    publisher: "Cengage",
    description: "Global history textbook with strong coverage of environmental, economic, and social themes central to the AP exam.",
    type: "textbook",
    free: false,
  },
  {
    course: "AP_WORLD_HISTORY",
    name: "OpenStax World History (Free)",
    authors: "OpenStax Contributors",
    publisher: "Rice University / OpenStax",
    description: "Peer-reviewed, freely available world history textbook covering all AP modules. Zero-cost alternative to commercial texts.",
    type: "textbook",
    free: true,
    url: "https://openstax.org/books/world-history-volume-1/pages/1-introduction",
  },
  {
    course: "AP_WORLD_HISTORY",
    name: "Barron's AP World History: Modern",
    authors: "Barron's Editorial Team",
    publisher: "Barron's Educational Series",
    description: "Study guide with key terms, timelines, and AP-style practice questions with detailed answer explanations. Ideal for exam review.",
    type: "study_guide",
    free: false,
  },
  {
    course: "AP_WORLD_HISTORY",
    name: "Princeton Review AP World History Prep",
    authors: "The Princeton Review",
    publisher: "Princeton Review",
    description: "Full-length practice exams, exam strategies, and unit-by-unit reviews written specifically for the AP World History exam.",
    type: "study_guide",
    free: false,
  },

  // ── AP Computer Science Principles ──
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    name: "Computer Science Principles: The Foundational Concepts of Computer Science",
    authors: "Various",
    publisher: "Pearson / College Board-endorsed",
    description: "Official College Board-endorsed text covering all 5 AP CSP big ideas and computational thinking practices.",
    type: "textbook",
    free: false,
  },
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    name: "Barron's AP Computer Science Principles",
    authors: "Barron's Editorial Team",
    publisher: "Barron's Educational Series",
    description: "Comprehensive study guide with practice questions covering all CSP units: creative development, data, algorithms, networks, and impact.",
    type: "study_guide",
    free: false,
  },
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    name: "Code.org AP CSP Curriculum",
    authors: "Code.org",
    publisher: "Code.org",
    description: "Free interactive modules used in thousands of AP CSP classrooms. Covers all 5 units with built-in coding environments and lesson plans.",
    type: "curriculum",
    free: true,
    url: "https://code.org/educate/csp",
  },
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    name: "Unplugged Approaches to Computer Science",
    authors: "Tim Bell, Ian H. Witten, Mike Fellows",
    publisher: "CS Unplugged",
    description: "Activity-based approach to CS fundamentals without a computer. Great for understanding core CSP concepts like binary, algorithms, and networks.",
    type: "curriculum",
    free: true,
    url: "https://csunplugged.org",
  },

  // ── AP Physics 1 ──
  {
    course: "AP_PHYSICS_1",
    name: "College Physics",
    authors: "Raymond Serway & Chris Vuille",
    publisher: "Cengage",
    description: "Classic algebra-based physics text covering kinematics through waves — maps directly to AP Physics 1 units 1–10.",
    type: "textbook",
    free: false,
  },
  {
    course: "AP_PHYSICS_1",
    name: "Physics: Principles with Applications",
    authors: "Douglas Giancoli",
    publisher: "Pearson",
    description: "Widely adopted for AP Physics 1. Strong conceptual explanations with worked examples and free-body diagram practice.",
    type: "textbook",
    free: false,
  },
  {
    course: "AP_PHYSICS_1",
    name: "AP Physics 1 Essentials",
    authors: "Dan Fullerton",
    publisher: "Silly Beagle Productions",
    description: "Written specifically for AP Physics 1. Concise theory, solved examples, and practice problems for every AP unit.",
    type: "textbook",
    free: false,
    url: "https://www.aplusphysics.com/ap1",
  },
  {
    course: "AP_PHYSICS_1",
    name: "OpenStax College Physics 2e (Free)",
    authors: "OpenStax Contributors",
    publisher: "Rice University / OpenStax",
    description: "Peer-reviewed, freely available algebra-based physics textbook covering all AP Physics 1 units. No cost.",
    type: "textbook",
    free: true,
    url: "https://openstax.org/books/college-physics-2e/pages/1-introduction-to-science-and-the-realm-of-physics-physical-quantities-and-units",
  },
  {
    course: "AP_PHYSICS_1",
    name: "5 Steps to a 5: AP Physics 1",
    authors: "Greg Jacobs",
    publisher: "McGraw-Hill",
    description: "Top-rated exam prep guide with a 5-step plan, full practice tests, and unit-by-unit review tailored to the AP exam.",
    type: "study_guide",
    free: false,
  },
  {
    course: "AP_PHYSICS_1",
    name: "Barron's AP Physics 1: Algebra-Based",
    authors: "Barron's Editorial Team",
    publisher: "Barron's Educational Series",
    description: "Exam prep with full-length practice questions, answer explanations, and scoring strategies for AP Physics 1.",
    type: "study_guide",
    free: false,
  },

  // ── AP Calculus AB ──
  {
    course: "AP_CALCULUS_AB",
    name: "Calculus: Early Transcendentals",
    authors: "James Stewart",
    publisher: "Cengage",
    description: "The most widely used calculus textbook. Covers limits, differentiation, and integration with AP-aligned examples and exercises.",
    type: "textbook",
    free: false,
  },
  {
    course: "AP_CALCULUS_AB",
    name: "OpenStax Calculus Volume 1 (Free)",
    authors: "OpenStax Contributors",
    publisher: "Rice University / OpenStax",
    description: "Peer-reviewed, freely available calculus textbook covering limits, derivatives, and integrals — all AP Calculus AB topics.",
    type: "textbook",
    free: true,
    url: "https://openstax.org/books/calculus-volume-1/pages/1-introduction",
  },
  {
    course: "AP_CALCULUS_AB",
    name: "Barron's AP Calculus",
    authors: "David Bock, Dennis Donovan, Shirley O. Hockett",
    publisher: "Barron's Educational Series",
    description: "Comprehensive AB and BC review with practice tests, worked examples, and exam strategies. Top-rated for AP exam prep.",
    type: "study_guide",
    free: false,
  },
  {
    course: "AP_CALCULUS_AB",
    name: "5 Steps to a 5: AP Calculus AB",
    authors: "William Ma",
    publisher: "McGraw-Hill",
    description: "Full exam prep with 5-step plan, practice FRQ and MCQ, and unit-by-unit review for all AP Calculus AB topics.",
    type: "study_guide",
    free: false,
  },

  // ── AP Calculus BC ──
  {
    course: "AP_CALCULUS_BC",
    name: "Calculus: Early Transcendentals",
    authors: "James Stewart",
    publisher: "Cengage",
    description: "Complete calculus coverage including parametric equations, polar coordinates, and infinite series — all BC-exclusive topics.",
    type: "textbook",
    free: false,
  },
  {
    course: "AP_CALCULUS_BC",
    name: "OpenStax Calculus Volume 1 & 2 (Free)",
    authors: "OpenStax Contributors",
    publisher: "Rice University / OpenStax",
    description: "Free textbooks covering all BC topics: Vol 1 (AB content) + Vol 2 (series, parametric, polar, vectors).",
    type: "textbook",
    free: true,
    url: "https://openstax.org/books/calculus-volume-2/pages/1-introduction",
  },
  {
    course: "AP_CALCULUS_BC",
    name: "Barron's AP Calculus",
    authors: "David Bock, Dennis Donovan, Shirley O. Hockett",
    publisher: "Barron's Educational Series",
    description: "Both AB and BC content in one book. Excellent series section with convergence tests, Taylor polynomials, and error bounds.",
    type: "study_guide",
    free: false,
  },

  // ── AP Statistics ──
  {
    course: "AP_STATISTICS",
    name: "The Practice of Statistics",
    authors: "Starnes, Tabor, Yates, Moore",
    publisher: "W.H. Freeman",
    description: "The leading AP Statistics textbook. Every chapter aligned to AP units with technology activities and AP-style exercises.",
    type: "textbook",
    free: false,
  },
  {
    course: "AP_STATISTICS",
    name: "OpenStax Introductory Statistics (Free)",
    authors: "OpenStax Contributors",
    publisher: "Rice University / OpenStax",
    description: "Free peer-reviewed statistics textbook covering all AP Statistics topics from data exploration to inference.",
    type: "textbook",
    free: true,
    url: "https://openstax.org/books/introductory-statistics/pages/1-introduction",
  },
  {
    course: "AP_STATISTICS",
    name: "Barron's AP Statistics",
    authors: "Martin Sternstein",
    publisher: "Barron's Educational Series",
    description: "AP Statistics exam prep with full-length practice tests, hypothesis testing review, and regression analysis coverage.",
    type: "study_guide",
    free: false,
  },
  {
    course: "AP_STATISTICS",
    name: "5 Steps to a 5: AP Statistics",
    authors: "Duane Hinders",
    publisher: "McGraw-Hill",
    description: "Detailed unit reviews with practice questions for every statistical test, and a complete set of practice exams.",
    type: "study_guide",
    free: false,
  },

  // ── AP Chemistry ──
  {
    course: "AP_CHEMISTRY",
    name: "Chemistry: The Central Science",
    authors: "Brown, LeMay, Bursten, Murphy",
    publisher: "Pearson",
    description: "The most widely adopted AP Chemistry textbook. Comprehensive coverage of all 9 units with integrated AP-style questions.",
    type: "textbook",
    free: false,
  },
  {
    course: "AP_CHEMISTRY",
    name: "OpenStax Chemistry 2e (Free)",
    authors: "OpenStax Contributors",
    publisher: "Rice University / OpenStax",
    description: "Peer-reviewed free chemistry textbook covering atomic structure through electrochemistry — all AP Chemistry units.",
    type: "textbook",
    free: true,
    url: "https://openstax.org/books/chemistry-2e/pages/1-introduction",
  },
  {
    course: "AP_CHEMISTRY",
    name: "Barron's AP Chemistry",
    authors: "Neil D. Jespersen",
    publisher: "Barron's Educational Series",
    description: "In-depth AP Chemistry review with practice tests, lab experiment reviews, and full coverage of all 9 CED units.",
    type: "study_guide",
    free: false,
  },
  {
    course: "AP_CHEMISTRY",
    name: "5 Steps to a 5: AP Chemistry",
    authors: "John Moore, Richard Langley",
    publisher: "McGraw-Hill",
    description: "Exam prep with sample FRQs, unit reviews with worked examples, and a 5-step strategy for AP Chemistry success.",
    type: "study_guide",
    free: false,
  },

  // ── AP Biology ──
  {
    course: "AP_BIOLOGY",
    name: "Campbell Biology",
    authors: "Urry, Cain, Wasserman, Minorsky, Orr",
    publisher: "Pearson",
    description: "The gold standard AP Biology textbook. Comprehensive coverage of all 8 AP Biology units with science practice activities.",
    type: "textbook",
    free: false,
  },
  {
    course: "AP_BIOLOGY",
    name: "OpenStax Biology 2e (Free)",
    authors: "OpenStax Contributors",
    publisher: "Rice University / OpenStax",
    description: "Peer-reviewed free biology textbook from cell biology to ecology — covering all AP Biology units.",
    type: "textbook",
    free: true,
    url: "https://openstax.org/books/biology-2e/pages/1-introduction",
  },
  {
    course: "AP_BIOLOGY",
    name: "Barron's AP Biology",
    authors: "Laurie Ann Melanie",
    publisher: "Barron's Educational Series",
    description: "AP Biology exam prep with diagnostic test, unit reviews, and full-length practice exams covering all big ideas.",
    type: "study_guide",
    free: false,
  },
  {
    course: "AP_BIOLOGY",
    name: "5 Steps to a 5: AP Biology",
    authors: "Mark Anestis",
    publisher: "McGraw-Hill",
    description: "Unit-by-unit biology review, free-response practice, and a 5-step plan optimized for the AP Biology exam.",
    type: "study_guide",
    free: false,
  },

  // ── AP US History ──
  {
    course: "AP_US_HISTORY",
    name: "American History: Connecting with the Past",
    authors: "Alan Brinkley",
    publisher: "McGraw-Hill",
    description: "Widely adopted APUSH textbook. Covers all 9 periods with primary sources and AP-aligned analytical questions.",
    type: "textbook",
    free: false,
  },
  {
    course: "AP_US_HISTORY",
    name: "America's History",
    authors: "Edwards, Hinderaker, Self, Murray",
    publisher: "Bedford/St. Martin's",
    description: "College-level US history text aligned to AP periods. Strong primary source integration and DBQ-style analysis.",
    type: "textbook",
    free: false,
  },
  {
    course: "AP_US_HISTORY",
    name: "The American Pageant",
    authors: "Kennedy, Cohen, Bailey",
    publisher: "Cengage",
    description: "Classic APUSH textbook covering all 9 periods. Known for narrative style and comprehensive coverage of political history.",
    type: "textbook",
    free: false,
  },
  {
    course: "AP_US_HISTORY",
    name: "Barron's AP US History",
    authors: "Eugene Resnick",
    publisher: "Barron's Educational Series",
    description: "AP US History exam prep with DBQ, LEQ, and SAQ writing practice, period reviews, and full-length practice exams.",
    type: "study_guide",
    free: false,
  },
  {
    course: "AP_US_HISTORY",
    name: "5 Steps to a 5: APUSH",
    authors: "Stephen Armstrong",
    publisher: "McGraw-Hill",
    description: "Period-by-period APUSH review with document analysis practice and full exam simulations.",
    type: "study_guide",
    free: false,
  },

  // ── AP Psychology ──
  {
    course: "AP_PSYCHOLOGY",
    name: "Psychology",
    authors: "David G. Myers & C. Nathan DeWall",
    publisher: "Worth Publishers",
    description: "The most popular AP Psychology textbook. Engaging writing, real-world examples, and AP practice at the end of each module.",
    type: "textbook",
    free: false,
  },
  {
    course: "AP_PSYCHOLOGY",
    name: "OpenStax Psychology 2e (Free)",
    authors: "OpenStax Contributors",
    publisher: "Rice University / OpenStax",
    description: "Peer-reviewed free psychology textbook covering all 9 AP Psychology units from scientific foundations to social psychology.",
    type: "textbook",
    free: true,
    url: "https://openstax.org/books/psychology-2e/pages/1-introduction",
  },
  {
    course: "AP_PSYCHOLOGY",
    name: "Barron's AP Psychology",
    authors: "Robert McEntarffer & Allyson Weseley",
    publisher: "Barron's Educational Series",
    description: "AP Psychology exam prep with full-length practice tests, FRQ strategies, and term-by-term definitions for all 9 units.",
    type: "study_guide",
    free: false,
  },
  {
    course: "AP_PSYCHOLOGY",
    name: "5 Steps to a 5: AP Psychology",
    authors: "Laura Lincoln Maitland",
    publisher: "McGraw-Hill",
    description: "Unit-by-unit psychology reviews, complete practice exams, and a proven FRQ writing strategy for AP Psychology.",
    type: "study_guide",
    free: false,
  },

  // ── SAT Math ──
  {
    course: "SAT_MATH",
    name: "Khan Academy SAT Math (Official Partner)",
    authors: "Khan Academy & College Board",
    publisher: "Khan Academy",
    description: "Official College Board SAT partner — free personalized practice, video lessons, and full-length tests for all 4 SAT Math domains.",
    type: "curriculum",
    free: true,
    url: "https://www.khanacademy.org/sat",
  },
  {
    course: "SAT_MATH",
    name: "College Board Bluebook Digital SAT Practice",
    authors: "College Board",
    publisher: "College Board",
    description: "Free official SAT practice tests in the Bluebook app — the exact interface used on test day with adaptive scoring.",
    type: "practice",
    free: true,
    url: "https://bluebook.collegeboard.org",
  },

  // ── SAT Reading & Writing ──
  {
    course: "SAT_READING_WRITING",
    name: "Khan Academy SAT Reading & Writing (Official Partner)",
    authors: "Khan Academy & College Board",
    publisher: "Khan Academy",
    description: "Official College Board SAT partner — free lessons and practice for all 4 Reading & Writing domains including grammar and rhetorical analysis.",
    type: "curriculum",
    free: true,
    url: "https://www.khanacademy.org/sat",
  },
  {
    course: "SAT_READING_WRITING",
    name: "College Board Bluebook Digital SAT Practice",
    authors: "College Board",
    publisher: "College Board",
    description: "Official full-length SAT practice tests in the Bluebook app — adaptive format matches the real digital SAT.",
    type: "practice",
    free: true,
    url: "https://bluebook.collegeboard.org",
  },

  // ── ACT Math ──
  {
    course: "ACT_MATH",
    name: "ACT Official Free Practice Test",
    authors: "ACT",
    publisher: "ACT, Inc.",
    description: "Free official full-length ACT practice test with answer key and scoring guide — the best benchmark for your ACT Math readiness.",
    type: "practice",
    free: true,
    url: "https://www.act.org/content/act/en/products-and-services/the-act/test-preparation/free-act-test-prep.html",
  },
  {
    course: "ACT_MATH",
    name: "Khan Academy ACT Math Practice",
    authors: "Khan Academy",
    publisher: "Khan Academy",
    description: "Free video lessons and exercises covering all ACT Math domains: algebra, geometry, statistics, and integrated skills.",
    type: "curriculum",
    free: true,
    url: "https://www.khanacademy.org/test-prep/act-math",
  },

  // ── ACT English ──
  {
    course: "ACT_ENGLISH",
    name: "ACT Official Free Practice Test",
    authors: "ACT",
    publisher: "ACT, Inc.",
    description: "Free official ACT practice test including the full English section — 75 passage-embedded grammar and rhetoric questions.",
    type: "practice",
    free: true,
    url: "https://www.act.org/content/act/en/products-and-services/the-act/test-preparation/free-act-test-prep.html",
  },

  // ── ACT Science ──
  {
    course: "ACT_SCIENCE",
    name: "ACT Official Free Practice Test",
    authors: "ACT",
    publisher: "ACT, Inc.",
    description: "Free official ACT practice test including the full Science section — 40 questions on data interpretation, research summaries, and conflicting viewpoints.",
    type: "practice",
    free: true,
    url: "https://www.act.org/content/act/en/products-and-services/the-act/test-preparation/free-act-test-prep.html",
  },

  // ── ACT Reading ──
  {
    course: "ACT_READING",
    name: "ACT Official Free Practice Test",
    authors: "ACT",
    publisher: "ACT, Inc.",
    description: "Free official ACT practice test including the full Reading section — 4 passages (literary, social science, humanities, natural science) with 40 questions.",
    type: "practice",
    free: true,
    url: "https://www.act.org/content/act/en/products-and-services/the-act/test-preparation/free-act-test-prep.html",
  },
  {
    course: "ACT_READING",
    name: "Khan Academy ACT Reading Practice",
    authors: "Khan Academy",
    publisher: "Khan Academy",
    description: "Free video lessons and exercises on ACT Reading strategies: main idea, inference, vocabulary in context, and passage analysis.",
    type: "curriculum",
    free: true,
    url: "https://www.khanacademy.org/test-prep/act-reading",
  },
];

// ── AP Exam skills & tips ──────────────────────────────────────────────────
export const EXAM_SKILLS = [
  {
    skill: "MCQ Strategy",
    description: "Process of elimination, stimulus analysis, key command words",
    heimlerVideoId: "W9RHJfpNUCM",
    url: "https://apcentral.collegeboard.org/exam-administration-ordering-scores/scores/ap-scores/score-setting",
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
  {
    skill: "FRQ Strategy",
    description: "Free Response Question approach for Math and Science AP exams",
    heimlerVideoId: "",
    url: "https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam/past-exam-questions",
  },
];
