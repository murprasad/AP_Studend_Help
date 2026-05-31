/**
 * CB official exam structure per AP course.
 *
 * Source: apcentral.collegeboard.org/courses/<course>/exam (verified 2026-04-27).
 * Used by the Course Exam Overview card on /practice to show students the
 * REAL exam composition + which question types they can practice.
 *
 * Each section: type (CB-named), questionType enum (for DB filter),
 * count, percent of total score, time minutes, free/premium gate.
 */

export interface ExamSection {
  /** CB-official label (e.g. "DBQ", "AAQ", "Argument Essay") */
  cbName: string;
  /** Underlying questionType enum value for DB queries */
  questionType: "MCQ" | "SAQ" | "DBQ" | "LEQ" | "FRQ" | "CODING" | "NUMERICAL";
  /** Number of questions on the real exam */
  count: number;
  /** Percent of total score */
  percentOfScore: number;
  /** Time in minutes */
  minutes: number;
  /** Whether FREE tier can practice this */
  freeAccess: boolean;
  /** Specific subtopic tag in DB (matches `questions.subtopic` for filtering) */
  subtopic?: string;
  /**
   * 2026-05-31 (F6 of SAT=CB parity sprint) — Optional unit filter for
   * courses where the CB content domains map to our `unit` field rather
   * than `subtopic`. SAT/PSAT/ACT use this. AP courses still use the
   * legacy subtopic mapping.
   */
  unit?: string;
}

export interface CourseExamStructure {
  course: string;
  totalMinutes: number;
  sections: ExamSection[];
}

export const AP_EXAM_STRUCTURES: Record<string, CourseExamStructure> = {
  AP_WORLD_HISTORY: {
    course: "AP_WORLD_HISTORY",
    totalMinutes: 195,
    sections: [
      { cbName: "Multiple Choice", questionType: "MCQ", count: 55, percentOfScore: 40, minutes: 55, freeAccess: true },
      { cbName: "Short Answer (SAQ)", questionType: "SAQ", count: 3, percentOfScore: 20, minutes: 40, freeAccess: false },
      { cbName: "Document-Based Question (DBQ)", questionType: "DBQ", count: 1, percentOfScore: 25, minutes: 60, freeAccess: false },
      { cbName: "Long Essay (LEQ)", questionType: "LEQ", count: 1, percentOfScore: 15, minutes: 40, freeAccess: false },
    ],
  },
  AP_US_HISTORY: {
    course: "AP_US_HISTORY",
    totalMinutes: 195,
    sections: [
      { cbName: "Multiple Choice", questionType: "MCQ", count: 55, percentOfScore: 40, minutes: 55, freeAccess: true },
      { cbName: "Short Answer (SAQ)", questionType: "SAQ", count: 3, percentOfScore: 20, minutes: 40, freeAccess: false },
      { cbName: "Document-Based Question (DBQ)", questionType: "DBQ", count: 1, percentOfScore: 25, minutes: 60, freeAccess: false },
      { cbName: "Long Essay (LEQ)", questionType: "LEQ", count: 1, percentOfScore: 15, minutes: 40, freeAccess: false },
    ],
  },
  AP_US_GOVERNMENT: {
    course: "AP_US_GOVERNMENT",
    // Section I MCQ = 80 min, Section II FRQs = 100 min (CB-recommended
    // 20/20/20/40), total 180. Audit-fix 2026-04-27: per-FRQ minutes were
    // 25/25/25/40 = 115, summing to 195 — adjusted to match CB.
    totalMinutes: 180,
    sections: [
      { cbName: "Multiple Choice", questionType: "MCQ", count: 55, percentOfScore: 50, minutes: 80, freeAccess: true },
      { cbName: "Concept Application", questionType: "FRQ", count: 1, percentOfScore: 12.5, minutes: 20, freeAccess: false, subtopic: "Concept Application" },
      { cbName: "Quantitative Analysis", questionType: "FRQ", count: 1, percentOfScore: 12.5, minutes: 20, freeAccess: false, subtopic: "Quantitative Analysis" },
      { cbName: "SCOTUS Comparison", questionType: "FRQ", count: 1, percentOfScore: 12.5, minutes: 20, freeAccess: false, subtopic: "SCOTUS Comparison" },
      { cbName: "Argument Essay", questionType: "LEQ", count: 1, percentOfScore: 12.5, minutes: 40, freeAccess: false, subtopic: "Argument Essay" },
    ],
  },
  AP_HUMAN_GEOGRAPHY: {
    course: "AP_HUMAN_GEOGRAPHY",
    totalMinutes: 135,
    sections: [
      { cbName: "Multiple Choice", questionType: "MCQ", count: 60, percentOfScore: 50, minutes: 60, freeAccess: true },
      { cbName: "FRQ 1 (No Stimulus)", questionType: "FRQ", count: 1, percentOfScore: 16.7, minutes: 25, freeAccess: false, subtopic: "FRQ 1 (No-Stimulus)" },
      { cbName: "FRQ 2 (1 Stimulus)", questionType: "FRQ", count: 1, percentOfScore: 16.7, minutes: 25, freeAccess: false, subtopic: "FRQ 2 (1-Stimulus)" },
      { cbName: "FRQ 3 (2 Stimuli)", questionType: "FRQ", count: 1, percentOfScore: 16.7, minutes: 25, freeAccess: false, subtopic: "FRQ 3 (2-Stimulus)" },
    ],
  },
  AP_PSYCHOLOGY: {
    course: "AP_PSYCHOLOGY",
    totalMinutes: 160,
    sections: [
      { cbName: "Multiple Choice", questionType: "MCQ", count: 75, percentOfScore: 66.7, minutes: 90, freeAccess: true },
      { cbName: "Article Analysis (AAQ)", questionType: "FRQ", count: 1, percentOfScore: 16.7, minutes: 35, freeAccess: false, subtopic: "AAQ (Article Analysis)" },
      { cbName: "Evidence-Based (EBQ)", questionType: "FRQ", count: 1, percentOfScore: 16.7, minutes: 35, freeAccess: false, subtopic: "EBQ (Evidence-Based)" },
    ],
  },
  AP_ENVIRONMENTAL_SCIENCE: {
    course: "AP_ENVIRONMENTAL_SCIENCE",
    totalMinutes: 160,
    sections: [
      { cbName: "Multiple Choice", questionType: "MCQ", count: 80, percentOfScore: 60, minutes: 90, freeAccess: true },
      { cbName: "Design Investigation", questionType: "FRQ", count: 1, percentOfScore: 13.3, minutes: 23, freeAccess: false, subtopic: "Design Investigation" },
      { cbName: "Analyze + Solution", questionType: "FRQ", count: 1, percentOfScore: 13.3, minutes: 23, freeAccess: false, subtopic: "Analyze + Propose Solution" },
      { cbName: "Analyze + Calculate", questionType: "FRQ", count: 1, percentOfScore: 13.3, minutes: 24, freeAccess: false, subtopic: "Analyze + Calculate" },
    ],
  },
  AP_BIOLOGY: {
    course: "AP_BIOLOGY",
    // Section I MCQ 90 min + Section II Written 90 min = 180. Audit-fix
    // 2026-04-27: per-FRQ recommended times were 22+22+12+12+12+12=92 (off
    // by 2). Real CB allots 22 for one Long, 22 for the other Long, then
    // 12+12+10+12=46 for the four Shorts (not perfectly uniform). Adjusted
    // one Short to 10 min so sum tiles to 180.
    totalMinutes: 180,
    sections: [
      { cbName: "Multiple Choice", questionType: "MCQ", count: 60, percentOfScore: 50, minutes: 90, freeAccess: true },
      { cbName: "Long FRQ (Interpret Experiment)", questionType: "FRQ", count: 1, percentOfScore: 11.25, minutes: 22, freeAccess: false, subtopic: "Long FRQ (Interpret Experiment)" },
      { cbName: "Long FRQ (Graphing)", questionType: "FRQ", count: 1, percentOfScore: 11.25, minutes: 22, freeAccess: false, subtopic: "Long FRQ (Graphing)" },
      { cbName: "Short FRQ (Investigation)", questionType: "FRQ", count: 1, percentOfScore: 6.875, minutes: 12, freeAccess: false, subtopic: "Short FRQ (Investigation)" },
      { cbName: "Short FRQ (Conceptual)", questionType: "FRQ", count: 1, percentOfScore: 6.875, minutes: 12, freeAccess: false, subtopic: "Short FRQ (Conceptual)" },
      { cbName: "Short FRQ (Model/Visual)", questionType: "FRQ", count: 1, percentOfScore: 6.875, minutes: 10, freeAccess: false, subtopic: "Short FRQ (Model/Visual)" },
      { cbName: "Short FRQ (Data Analysis)", questionType: "FRQ", count: 1, percentOfScore: 6.875, minutes: 12, freeAccess: false, subtopic: "Short FRQ (Data Analysis)" },
    ],
  },
  AP_CHEMISTRY: {
    course: "AP_CHEMISTRY",
    totalMinutes: 195,
    sections: [
      { cbName: "Multiple Choice", questionType: "MCQ", count: 60, percentOfScore: 50, minutes: 90, freeAccess: true },
      { cbName: "Long FRQ (10pt)", questionType: "FRQ", count: 3, percentOfScore: 30, minutes: 60, freeAccess: false, subtopic: "Long FRQ (10pt)" },
      { cbName: "Short FRQ (4pt)", questionType: "FRQ", count: 4, percentOfScore: 20, minutes: 45, freeAccess: false, subtopic: "Short FRQ (4pt)" },
    ],
  },
  AP_PHYSICS_1: {
    course: "AP_PHYSICS_1",
    totalMinutes: 180,
    sections: [
      { cbName: "Multiple Choice", questionType: "MCQ", count: 40, percentOfScore: 50, minutes: 80, freeAccess: true },
      { cbName: "Mathematical Routines", questionType: "FRQ", count: 1, percentOfScore: 12.5, minutes: 25, freeAccess: false, subtopic: "Mathematical Routines" },
      { cbName: "Translation Between Representations", questionType: "FRQ", count: 1, percentOfScore: 12.5, minutes: 25, freeAccess: false, subtopic: "Translation Between Representations" },
      { cbName: "Experimental Design", questionType: "FRQ", count: 1, percentOfScore: 12.5, minutes: 25, freeAccess: false, subtopic: "Experimental Design + Analysis" },
      { cbName: "Qual/Quant Translation", questionType: "FRQ", count: 1, percentOfScore: 12.5, minutes: 25, freeAccess: false, subtopic: "Qualitative/Quantitative Translation" },
    ],
  },
  AP_STATISTICS: {
    course: "AP_STATISTICS",
    totalMinutes: 180,
    sections: [
      { cbName: "Multiple Choice", questionType: "MCQ", count: 40, percentOfScore: 50, minutes: 90, freeAccess: true },
      { cbName: "Multipart FRQs", questionType: "FRQ", count: 5, percentOfScore: 37.5, minutes: 65, freeAccess: false, subtopic: "Multipart" },
      { cbName: "Investigative Task", questionType: "FRQ", count: 1, percentOfScore: 12.5, minutes: 25, freeAccess: false, subtopic: "Investigative Task" },
    ],
  },
  AP_CALCULUS_AB: {
    course: "AP_CALCULUS_AB",
    totalMinutes: 195,
    sections: [
      { cbName: "Multiple Choice (No Calc)", questionType: "MCQ", count: 30, percentOfScore: 33.3, minutes: 60, freeAccess: true },
      { cbName: "Multiple Choice (Calc)", questionType: "MCQ", count: 15, percentOfScore: 16.7, minutes: 45, freeAccess: true },
      { cbName: "FRQ (Calc)", questionType: "FRQ", count: 2, percentOfScore: 16.7, minutes: 30, freeAccess: false, subtopic: "FRQ Calculator (Part A)" },
      { cbName: "FRQ (No Calc)", questionType: "FRQ", count: 4, percentOfScore: 33.3, minutes: 60, freeAccess: false, subtopic: "FRQ No-Calculator (Part B)" },
    ],
  },
  AP_CALCULUS_BC: {
    course: "AP_CALCULUS_BC",
    totalMinutes: 195,
    sections: [
      { cbName: "Multiple Choice (No Calc)", questionType: "MCQ", count: 30, percentOfScore: 33.3, minutes: 60, freeAccess: true },
      { cbName: "Multiple Choice (Calc)", questionType: "MCQ", count: 15, percentOfScore: 16.7, minutes: 45, freeAccess: true },
      { cbName: "FRQ (Calc)", questionType: "FRQ", count: 2, percentOfScore: 16.7, minutes: 30, freeAccess: false, subtopic: "FRQ Calculator (Part A)" },
      { cbName: "FRQ (No Calc)", questionType: "FRQ", count: 4, percentOfScore: 33.3, minutes: 60, freeAccess: false, subtopic: "FRQ No-Calculator (Part B)" },
    ],
  },
  AP_PRECALCULUS: {
    course: "AP_PRECALCULUS",
    totalMinutes: 180,
    sections: [
      { cbName: "Multiple Choice (No Calc)", questionType: "MCQ", count: 28, percentOfScore: 43.75, minutes: 80, freeAccess: true },
      { cbName: "Multiple Choice (Calc)", questionType: "MCQ", count: 12, percentOfScore: 18.75, minutes: 40, freeAccess: true },
      { cbName: "Function Concepts", questionType: "FRQ", count: 1, percentOfScore: 9.375, minutes: 15, freeAccess: false, subtopic: "Function Concepts" },
      { cbName: "Modeling Non-Periodic", questionType: "FRQ", count: 1, percentOfScore: 9.375, minutes: 15, freeAccess: false, subtopic: "Modeling Non-Periodic" },
      { cbName: "Modeling Periodic", questionType: "FRQ", count: 1, percentOfScore: 9.375, minutes: 15, freeAccess: false, subtopic: "Modeling Periodic" },
      { cbName: "Symbolic Manipulations", questionType: "FRQ", count: 1, percentOfScore: 9.375, minutes: 15, freeAccess: false, subtopic: "Symbolic Manipulations" },
    ],
  },
  // ────────────────────────────────────────────────────────────────────────────
  // Digital SAT (2024+) — 2-module adaptive structure.
  // Math: 44 Qs in two 35-min modules (~75% MCQ + ~25% SPR/grid-in).
  // R&W:  54 Qs in two 32-min modules (100% MCQ, 1-2 paragraph passage each).
  // Content-domain weights below match collegeboard.org's published
  // operational item counts (sample-test breakdowns 2024-2026). The
  // mock-exam route samples by these weights to keep the practice mix
  // honest. Module-1 mixed difficulty + adaptive Module-2 routing
  // lives in the mock-exam UI (F2), not this static structure.
  // ────────────────────────────────────────────────────────────────────────────
  SAT_MATH: {
    course: "SAT_MATH",
    totalMinutes: 70, // 2 modules × 35 min
    sections: [
      // Multiple-choice questions by content domain (~33 of 44 total = ~75%).
      { cbName: "Algebra (MCQ)",                       questionType: "MCQ",       count: 10, percentOfScore: 26, minutes: 16, freeAccess: true, unit: "SAT_MATH_1_ALGEBRA" },
      { cbName: "Advanced Math (MCQ)",                 questionType: "MCQ",       count: 10, percentOfScore: 26, minutes: 16, freeAccess: true, unit: "SAT_MATH_2_ADVANCED_MATH" },
      { cbName: "Problem-Solving & Data Analysis (MCQ)", questionType: "MCQ",     count: 6,  percentOfScore: 11, minutes: 10, freeAccess: true, unit: "SAT_MATH_3_PROBLEM_SOLVING" },
      { cbName: "Geometry & Trigonometry (MCQ)",       questionType: "MCQ",       count: 7,  percentOfScore: 12, minutes: 12, freeAccess: true, unit: "SAT_MATH_4_GEOMETRY_TRIG" },
      // Student-Produced Response (SPR/grid-in) — ~11 of 44 = ~25%.
      { cbName: "Algebra (SPR)",                       questionType: "NUMERICAL", count: 3, percentOfScore: 9,  minutes: 5, freeAccess: false, unit: "SAT_MATH_1_ALGEBRA" },
      { cbName: "Advanced Math (SPR)",                 questionType: "NUMERICAL", count: 3, percentOfScore: 9,  minutes: 5, freeAccess: false, unit: "SAT_MATH_2_ADVANCED_MATH" },
      { cbName: "Problem-Solving & Data Analysis (SPR)", questionType: "NUMERICAL", count: 3, percentOfScore: 4, minutes: 3, freeAccess: false, unit: "SAT_MATH_3_PROBLEM_SOLVING" },
      { cbName: "Geometry & Trigonometry (SPR)",       questionType: "NUMERICAL", count: 2, percentOfScore: 3,  minutes: 3, freeAccess: false, unit: "SAT_MATH_4_GEOMETRY_TRIG" },
    ],
  },
  SAT_READING_WRITING: {
    course: "SAT_READING_WRITING",
    totalMinutes: 64, // 2 modules × 32 min
    sections: [
      { cbName: "Craft & Structure",        questionType: "MCQ", count: 14, percentOfScore: 28, minutes: 17, freeAccess: true, unit: "SAT_RW_1_CRAFT_STRUCTURE" },
      { cbName: "Information & Ideas",      questionType: "MCQ", count: 13, percentOfScore: 26, minutes: 15, freeAccess: true, unit: "SAT_RW_2_INFO_IDEAS" },
      { cbName: "Standard English Conventions", questionType: "MCQ", count: 14, percentOfScore: 26, minutes: 17, freeAccess: true, unit: "SAT_RW_3_STANDARD_ENGLISH" },
      { cbName: "Expression of Ideas",      questionType: "MCQ", count: 13, percentOfScore: 20, minutes: 15, freeAccess: true, unit: "SAT_RW_4_EXPRESSION_IDEAS" },
    ],
  },
  // PSAT mirrors SAT structure with the SAT_HARD difficulty tier capped out.
  PSAT_MATH: {
    course: "PSAT_MATH",
    totalMinutes: 70,
    sections: [
      { cbName: "Algebra (MCQ)",                       questionType: "MCQ", count: 11, percentOfScore: 25, minutes: 16, freeAccess: true, unit: "PSAT_MATH_1_ALGEBRA" },
      { cbName: "Advanced Math (MCQ)",                 questionType: "MCQ", count: 11, percentOfScore: 25, minutes: 16, freeAccess: true, unit: "PSAT_MATH_2_ADVANCED_MATH" },
      { cbName: "Problem-Solving & Data Analysis (MCQ)", questionType: "MCQ", count: 8, percentOfScore: 19, minutes: 12, freeAccess: true, unit: "PSAT_MATH_3_PROBLEM_SOLVING" },
      { cbName: "Geometry & Trigonometry (MCQ)",       questionType: "MCQ", count: 9,  percentOfScore: 22, minutes: 13, freeAccess: true, unit: "PSAT_MATH_4_GEOMETRY_TRIG" },
      { cbName: "Numeric Entry",                       questionType: "NUMERICAL", count: 5, percentOfScore: 9, minutes: 13, freeAccess: false },
    ],
  },
  PSAT_READING_WRITING: {
    course: "PSAT_READING_WRITING",
    totalMinutes: 64,
    sections: [
      { cbName: "Craft & Structure",        questionType: "MCQ", count: 14, percentOfScore: 28, minutes: 17, freeAccess: true, unit: "PSAT_RW_1_CRAFT_STRUCTURE" },
      { cbName: "Information & Ideas",      questionType: "MCQ", count: 13, percentOfScore: 26, minutes: 15, freeAccess: true, unit: "PSAT_RW_2_INFO_IDEAS" },
      { cbName: "Standard English Conventions", questionType: "MCQ", count: 14, percentOfScore: 26, minutes: 17, freeAccess: true, unit: "PSAT_RW_3_STANDARD_ENGLISH" },
      { cbName: "Expression of Ideas",      questionType: "MCQ", count: 13, percentOfScore: 20, minutes: 15, freeAccess: true, unit: "PSAT_RW_4_EXPRESSION_IDEAS" },
    ],
  },
  // ────────────────────────────────────────────────────────────────────────────
  // ACT — linear (non-adaptive), 5-option MCQ.
  // ────────────────────────────────────────────────────────────────────────────
  ACT_MATH: {
    course: "ACT_MATH",
    totalMinutes: 60,
    sections: [
      { cbName: "Mathematics", questionType: "MCQ", count: 60, percentOfScore: 100, minutes: 60, freeAccess: true },
    ],
  },
  ACT_ENGLISH: {
    course: "ACT_ENGLISH",
    totalMinutes: 45,
    sections: [
      { cbName: "English", questionType: "MCQ", count: 75, percentOfScore: 100, minutes: 45, freeAccess: true },
    ],
  },
  ACT_READING: {
    course: "ACT_READING",
    totalMinutes: 35,
    sections: [
      { cbName: "Reading", questionType: "MCQ", count: 40, percentOfScore: 100, minutes: 35, freeAccess: true },
    ],
  },
  ACT_SCIENCE: {
    course: "ACT_SCIENCE",
    totalMinutes: 35,
    sections: [
      { cbName: "Science", questionType: "MCQ", count: 40, percentOfScore: 100, minutes: 35, freeAccess: true },
    ],
  },
  AP_COMPUTER_SCIENCE_PRINCIPLES: {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    // CB CSP exam = 70 MCQ in 120 min (Section I, the only timed exam-day
    // session). The Create Performance Task was discontinued; in-class
    // written responses are now collected as portfolio (no exam-day timer).
    // For practice, we still surface WR1 + WR2 as 30-min sections so
    // students can rehearse the format — totalMinutes reflects full
    // practice load (120 + 30 + 30 = 180), not the exam-day cap.
    // Audit-fix 2026-04-27: was 120 vs sum-of-sections 180.
    totalMinutes: 180,
    sections: [
      { cbName: "Multiple Choice", questionType: "MCQ", count: 70, percentOfScore: 70, minutes: 120, freeAccess: true },
      { cbName: "Written Response 1 (Program Design)", questionType: "FRQ", count: 1, percentOfScore: 15, minutes: 30, freeAccess: false, subtopic: "Written Response 1 (Program Design)" },
      { cbName: "Written Response 2 (Algorithm/Errors/Data)", questionType: "FRQ", count: 1, percentOfScore: 15, minutes: 30, freeAccess: false, subtopic: "Written Response 2 (Algorithm/Errors/Data)" },
    ],
  },
};

export function getCBExamStructure(course: string): CourseExamStructure | null {
  return AP_EXAM_STRUCTURES[course] ?? null;
}
