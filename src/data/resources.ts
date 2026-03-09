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
    description: "Millions of free primary source documents, photographs, maps, newspapers, and timelines from American and world history. Used by AP SmartPrep to enrich AI tutor answers.",
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
    name: "OpenStax World History",
    description: "Peer-reviewed, openly licensed textbooks for World History Volumes 1 & 2 — completely free, covering ancient civilizations through the modern era.",
    url: "https://openstax.org/subjects/humanities",
    type: "reading",
    icon: "BookOpen",
    color: "text-amber-400",
    free: true,
  },
  {
    id: "ck12",
    name: "CK-12 Foundation",
    description: "Free, customizable open-source textbooks and practice for history, science, and math. Includes interactive simulations and study guides.",
    url: "https://www.ck12.org/browse/",
    type: "reading",
    icon: "Layers",
    color: "text-lime-400",
    free: true,
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
