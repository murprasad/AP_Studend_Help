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
  {
    id: "library-of-congress",
    name: "Library of Congress Digital Collections",
    description: "Millions of free primary source documents, photographs, maps, newspapers, and timelines from American and world history. Used by PrepNova to enrich AI tutor answers.",
    url: "https://www.loc.gov/collections/",
    type: "primary_source",
    icon: "Library",
    color: "text-indigo-400",
    free: true,
  },
  {
    id: "wikipedia",
    name: "Wikipedia / Wikimedia Foundation",
    description: "Free encyclopedia with deep articles on every historical topic, person, and event. Wikipedia summaries are automatically pulled into AI tutor context to give accurate, sourced answers.",
    url: "https://en.wikipedia.org/wiki/World_history",
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
    description: "Peer-reviewed, openly licensed free textbooks. World History Vol 1 & 2 cover all AP World History periods. College Physics 2e covers AP Physics 1 (algebra-based). Browse at openstax.org.",
    url: "https://openstax.org/subjects/humanities",
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
    description: "Free MIT course materials for AP Physics 1 topics. 8.01SC Classical Mechanics has lecture notes, worked examples, and problem sets for every mechanics unit. PrepNova fetches MIT OCW content to generate better Physics questions.",
    url: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/",
    type: "reading",
    icon: "GraduationCap",
    color: "text-blue-400",
    free: true,
  },
  {
    id: "phet",
    name: "PhET Interactive Simulations",
    description: "Free interactive physics, chemistry, and math simulations from the University of Colorado Boulder. Excellent for visualizing forces, energy, circuits, waves, and kinematics — all core AP Physics 1 topics.",
    url: "https://phet.colorado.edu/en/simulations/filter?subjects=physics&type=html",
    type: "reading",
    icon: "Play",
    color: "text-green-400",
    free: true,
  },
  {
    id: "dig-stanford",
    name: "Digital Inquiry Group (Stanford)",
    description: "Built on two decades as the Stanford History Education Group (SHEG). Provides 'Reading Like a Historian' lessons and primary-source assessments for AP World History. PrepNova fetches DIG content to craft higher-quality historical thinking questions.",
    url: "https://www.inquirygroup.org/history-lessons",
    type: "primary_source",
    icon: "FileText",
    color: "text-violet-400",
    free: true,
  },
];

// ── Recommended textbooks & study guides per course ───────────────────────

export interface CourseTextbook {
  course: "AP_WORLD_HISTORY" | "AP_COMPUTER_SCIENCE_PRINCIPLES" | "AP_PHYSICS_1";
  name: string;
  authors: string;
  publisher: string;
  description: string;
  type: "textbook" | "study_guide" | "curriculum";
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
