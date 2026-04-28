/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * COURSE REGISTRY — single source of truth for every AP course.
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * To add a new AP course:
 *   1. Add the enum value to `ApCourse` in  prisma/schema.prisma
 *   2. Add enum values to `ApUnit`          in  prisma/schema.prisma
 *   3. Run `npx prisma migrate dev`
 *   4. Add one `CourseConfig` block to `COURSE_REGISTRY` below (this file only)
 *   5. Optionally add seed questions to     prisma/seed.ts
 *
 * Everything else — sidebar dropdown, API validation, AI prompts, mock-exam
 * timing, suggested tutor questions, unit lookups — updates automatically.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { ApCourse, ApUnit } from "@prisma/client";

// ── Per-unit metadata ─────────────────────────────────────────────────────────

export interface UnitMeta {
  /** Display name shown in UI, e.g. "Unit 1: Global Tapestry" */
  name: string;
  /** Optional time period label, e.g. "1200–1450 CE" */
  timePeriod?: string;
  /** Key topics used in question generation and AI context */
  keyThemes?: string[];
  // ── Optional free resource links (no key required) ──
  fiveableUrl?: string;
  heimlerVideoId?: string;  // YouTube video ID
  khanPlaylistId?: string;  // Khan Academy playlist ID
  oerUrl?: string;
  zinnUrl?: string;
  worldHistoryUrl?: string;
  /** MIT OpenCourseWare week page URL (Physics only — confirmed working) */
  mitocwUrl?: string;
  /** Digital Inquiry Group (Stanford) lesson search URL (World History only) */
  digUrl?: string;
  /** PhET Interactive Simulations URL (Physics only) */
  phetUrl?: string;
  /** Direct unit-level Khan Academy section URL */
  khanUrl?: string;
  /** CK-12 section URL for this unit */
  ck12Url?: string;
  /** OpenStax textbook chapter URL for this unit */
  openStaxUrl?: string;
}

/** Per-question-type generation specification */
export interface QuestionTypeFormat {
  /** Full generation instruction replacing stimulusRequirement for this type */
  generationPrompt: string;
  /** JSON response format hint (what fields to return) */
  responseFormat: string;
  /** Typical minutes a student takes to answer */
  estimatedMinutes: number;
}

// ── Per-course configuration ──────────────────────────────────────────────────

export interface CourseConfig {
  /** Full display name, e.g. "AP World History: Modern" */
  name: string;
  /** Compact sidebar label, e.g. "AP World History" */
  shortName: string;
  /**
   * All units for this course keyed by ApUnit enum value.
   * Used for: unit picker, AI context, mastery display, getCourseForUnit().
   */
  units: Partial<Record<ApUnit, UnitMeta>>;
  /** Seconds allocated per question on the real AP exam (for mock-exam timer) */
  examSecsPerQuestion: number;
  /**
   * Real exam Section I (MCQ) shape — single source of truth for mock-exam
   * length + pacing. Every course in the registry MUST populate this.
   * Derive per-Q seconds as: (mcqTimeMinutes * 60) / mcqCount — the mock-exam
   * UI applies this formula for both Full Section and Quick Mock modes so
   * pacing stays faithful even when only 10 Qs are served.
   */
  mockExam: {
    /** Real MCQ count on the official exam (e.g. AP World = 55, Physics 1 = 50) */
    mcqCount: number;
    /** Real total minutes allocated to Section I MCQ (e.g. AP World = 55, Physics 1 = 90) */
    mcqTimeMinutes: number;
    // Future: frqCount, frqTimeMinutes, splitMode for Calc no-calc / calc sections
  };
  /** Sample questions shown in the Sage Live Tutor sidebar */
  suggestedTutorQuestions: string[];
  /**
   * Verbatim curriculum context injected into AI system prompts.
   * Include: units overview, key skills/practices, exam format notes.
   */
  curriculumContext: string;
  /**
   * Resource recommendation paragraph injected into the Sage Live Tutor prompt.
   * One bullet per free resource.
   */
  tutorResources: string;
  /**
   * Exam-alignment bullet points for the question-generation prompt.
   * Describes how questions should map to the real AP exam.
   */
  examAlignmentNotes: string;
  /**
   * When true, hide from sidebar / landing pickers / marketing routes for
   * non-ADMIN users. ADMIN users still see everything so they can QA the
   * course before exposing it. Introduced 2026-04-22 for the 2026 AP
   * catalog expansion so new courses don't surface empty question banks
   * (would error with 400 "No questions available") while Phase C is
   * still generating. Remove this flag per-course once Phase C reaches
   * a reasonable question density.
   */
  hidden?: boolean;
  /** Describes the stimulus type for question generation + JSON format hint */
  stimulusRequirement: string;
  /** One-liner for the JSON "stimulus" field description */
  stimulusDescription: string;
  /** Describes what the AI explanation should reference */
  explanationGuidance: string;
  /**
   * Whether the Sage Live Tutor should fetch live Wikipedia + Library of Congress
   * context for every question. Enable for humanities/history courses.
   */
  enrichWithEduAPIs: boolean;
  /**
   * Per-question-type generation specs. MCQ falls back to the existing
   * stimulusRequirement / stimulusDescription fields if not listed here.
   */
  questionTypeFormats?: Partial<Record<string, QuestionTypeFormat>>;
  /**
   * Subject key for OpenStax content fetching.
   */
  openStaxSubject?: "physics" | "world-history" | "cs";
  /** Official College Board links shown on the Resources page */
  collegeBoardLinks?: Array<{ label: string; url: string }>;
  /** Per-difficulty rubric used in question generation prompts */
  difficultyRubric?: { EASY: string; MEDIUM: string; HARD: string };
  /** Distractor taxonomy: 3 named trap types for wrong answers */
  distractorTaxonomy?: string;
  /** Guidance on what a high-quality stimulus looks like vs a generic one */
  stimulusQualityGuidance?: string;
  /** AP skill codes tested on this exam */
  skillCodes?: string[];
  /**
   * College Board official topic weight percentages for weighted question distribution.
   * Keys are topic labels matching unit keyThemes; values are decimals summing to ~1.0.
   * When present, buildDifficultyQueue distributes questions proportionally.
   */
  topicWeights?: Record<string, number>;
  /** College Board-recommended textbooks and authoritative study resources */
  recommendedTextbooks?: string[];
}

// ═════════════════════════════════════════════════════════════════════════════
// COURSE REGISTRY
// ═════════════════════════════════════════════════════════════════════════════

export const COURSE_REGISTRY: Record<ApCourse, CourseConfig> = {

  // ── AP World History: Modern ──────────────────────────────────────────────
  AP_WORLD_HISTORY: {
    name: "AP World History: Modern",
    shortName: "AP World History",
    examSecsPerQuestion: 60, // 55 MCQ in 55 min
    mockExam: { mcqCount: 55, mcqTimeMinutes: 55 },
    enrichWithEduAPIs: true,
    openStaxSubject: "world-history",
    questionTypeFormats: {
      SAQ: {
        generationPrompt:
          "Generate a College Board AP World History Short Answer Question (SAQ). " +
          "The SAQ must have THREE labeled parts: (A), (B), and (C). " +
          "Part A: Describe one historical development. " +
          "Part B: Explain a cause or effect. " +
          "Part C: Evaluate similarity, difference, or change over time. " +
          "Each part should be answerable in 2-4 sentences. Total time: ~15 minutes.",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"Full 3-part SAQ prompt with (A)(B)(C)", ' +
          '"stimulus":"primary source excerpt or null", "correctAnswer":"Complete sample response for all three parts", ' +
          '"explanation":"Scoring rubric: 1 point each for A, B, C. Describe what earns each point."}',
        estimatedMinutes: 15,
      },
      DBQ: {
        generationPrompt:
          "Generate a College Board AP World History Document-Based Question (DBQ) PROMPT ONLY (not the full 7-document set). " +
          "Include: a historical context paragraph (2-3 sentences), the essay prompt asking students to " +
          "evaluate the extent of a historical development using evidence and reasoning, " +
          "and a description of 2-3 types of documents a student would analyze. " +
          "Focus on themes from the AP World History curriculum.",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"Full DBQ prompt with context + question", ' +
          '"stimulus":"Historical context paragraph", "correctAnswer":"Sample thesis and 2-3 sentence argument outline", ' +
          '"explanation":"Rubric: thesis (1pt), contextualization (1pt), evidence (3pt), analysis/reasoning (2pt), complexity (1pt)"}',
        estimatedMinutes: 45,
      },
      LEQ: {
        generationPrompt:
          "Generate a College Board AP World History Long Essay Question (LEQ). " +
          "The LEQ must ask students to make and support an argument about a historical development " +
          "using one of: causation, continuity and change over time, or comparison. " +
          "Provide the time period and geographic scope. The question should be answerable in ~40 minutes.",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"Full LEQ prompt", ' +
          '"stimulus":null, "correctAnswer":"Sample thesis statement and 3-sentence outline", ' +
          '"explanation":"Rubric: thesis (1pt), contextualization (1pt), evidence (2pt), argument (2pt), complexity (1pt)"}',
        estimatedMinutes: 40,
      },
      MCQ: {
        generationPrompt:
          "Generate a College Board AP World History MCQ with a primary source stimulus (document excerpt, map description, or image description). " +
          "The question must test AP Historical Thinking Skills (Causation, Comparison, CCOT, or Contextualization). " +
          "Three wrong answers must each represent a common student misconception. " +
          "Also include a 'wikiImageTopic' field with a specific Wikipedia article title that would provide a relevant contextual image (e.g., 'Silk Road', 'Atlantic slave trade', 'Ibn Battuta') — use null if no image is relevant.",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"question", "stimulus":"primary source stimulus", ' +
          '"wikiImageTopic":"Specific Wikipedia article title for a contextual image, or null", ' +
          '"apSkill":"Causation | Comparison | Continuity and Change | Contextualization | Argumentation | Data Analysis", ' +
          '"bloomLevel":"remember | apply | analyze", ' +
          '"options":["A) ...","B) ...","C) ...","D) ..."], "correctAnswer":"A", ' +
          '"explanation":"Why correct + why each trap answer is wrong, citing historical evidence"}',
        estimatedMinutes: 2,
      },
    },

    units: {
      UNIT_1_GLOBAL_TAPESTRY: {
        name: "Unit 1: The Global Tapestry",
        timePeriod: "1200–1450 CE",
        keyThemes: ["Song Dynasty China", "Dar al-Islam", "South/Southeast Asia", "Americas & Africa", "Comparison of States"],
        fiveableUrl: "https://library.fiveable.me/ap-world/unit-1",
        heimlerVideoId: "6YCZFQBFNok",
        khanPlaylistId: "PLSQl0a2vh4HCLqA9FiKGSqzqHGwBFRFZu",
        oerUrl: "https://www.oerproject.com/AP-World-History/Unit-1",
        zinnUrl: "https://www.zinnedproject.org/materials/?era=medieval-renaissance-1200-1500",
        worldHistoryUrl: "https://worldhistoryforusall.sdsu.edu/eras/era5.htm",
        digUrl: "https://www.inquirygroup.org/history-lessons",
      },
      UNIT_2_NETWORKS_OF_EXCHANGE: {
        name: "Unit 2: Networks of Exchange",
        timePeriod: "1200–1450 CE",
        keyThemes: ["Silk Roads", "Mongol Empire", "Indian Ocean Trade", "Trans-Saharan Trade", "Cultural Diffusion"],
        fiveableUrl: "https://library.fiveable.me/ap-world/unit-2",
        heimlerVideoId: "0rFjzHevFtc",
        khanPlaylistId: "PLSQl0a2vh4HCLqA9FiKGSqzqHGwBFRFZu",
        oerUrl: "https://www.oerproject.com/AP-World-History/Unit-2",
        zinnUrl: "https://www.zinnedproject.org/materials/?era=medieval-renaissance-1200-1500",
        worldHistoryUrl: "https://worldhistoryforusall.sdsu.edu/eras/era5.htm",
        digUrl: "https://www.inquirygroup.org/history-lessons",
      },
      UNIT_3_LAND_BASED_EMPIRES: {
        name: "Unit 3: Land-Based Empires",
        timePeriod: "1450–1750 CE",
        keyThemes: ["Ottoman Empire", "Safavid Empire", "Mughal Empire", "Ming/Qing China", "Gunpowder Empires"],
        fiveableUrl: "https://library.fiveable.me/ap-world/unit-3",
        heimlerVideoId: "t_l0BIKMdvs",
        khanPlaylistId: "PLSQl0a2vh4HDnHWiAaOhwMJkSRLXxLrOK",
        oerUrl: "https://www.oerproject.com/AP-World-History/Unit-3",
        zinnUrl: "https://www.zinnedproject.org/materials/?era=1400s-1600s",
        worldHistoryUrl: "https://worldhistoryforusall.sdsu.edu/eras/era6.htm",
        digUrl: "https://www.inquirygroup.org/history-lessons",
      },
      UNIT_4_TRANSOCEANIC_INTERCONNECTIONS: {
        name: "Unit 4: Transoceanic Interconnections",
        timePeriod: "1450–1750 CE",
        keyThemes: ["Columbian Exchange", "European Colonization", "Atlantic Slave Trade", "Maritime Empires", "Coercive Labor Systems"],
        fiveableUrl: "https://library.fiveable.me/ap-world/unit-4",
        heimlerVideoId: "WMCgLxVFwqc",
        khanPlaylistId: "PLSQl0a2vh4HDnHWiAaOhwMJkSRLXxLrOK",
        oerUrl: "https://www.oerproject.com/AP-World-History/Unit-4",
        zinnUrl: "https://www.zinnedproject.org/materials/?era=1400s-1600s",
        worldHistoryUrl: "https://worldhistoryforusall.sdsu.edu/eras/era6.htm",
        digUrl: "https://www.inquirygroup.org/history-lessons",
      },
      UNIT_5_REVOLUTIONS: {
        name: "Unit 5: Revolutions",
        timePeriod: "1750–1900 CE",
        keyThemes: ["Enlightenment", "American Revolution", "French Revolution", "Haitian Revolution", "Latin American Independence"],
        fiveableUrl: "https://library.fiveable.me/ap-world/unit-5",
        heimlerVideoId: "GcBmkPmAFkM",
        khanPlaylistId: "PLSQl0a2vh4HA0wMGD5JpWDqTTjI7Lbj3L",
        oerUrl: "https://www.oerproject.com/AP-World-History/Unit-5",
        zinnUrl: "https://www.zinnedproject.org/materials/?era=american-revolution-civil-war-reconstruction",
        worldHistoryUrl: "https://worldhistoryforusall.sdsu.edu/eras/era7.htm",
        digUrl: "https://www.inquirygroup.org/history-assessments",
      },
      UNIT_6_INDUSTRIALIZATION: {
        name: "Unit 6: Industrialization & Imperialism",
        timePeriod: "1750–1900 CE",
        keyThemes: ["Industrial Revolution", "Social Effects of Industrialization", "Imperialism", "Resistance to Imperialism", "Economic Systems"],
        fiveableUrl: "https://library.fiveable.me/ap-world/unit-6",
        heimlerVideoId: "UIF_W7g-glU",
        khanPlaylistId: "PLSQl0a2vh4HA0wMGD5JpWDqTTjI7Lbj3L",
        oerUrl: "https://www.oerproject.com/AP-World-History/Unit-6",
        zinnUrl: "https://www.zinnedproject.org/materials/?era=industrialization-imperialism",
        worldHistoryUrl: "https://worldhistoryforusall.sdsu.edu/eras/era7.htm",
        digUrl: "https://www.inquirygroup.org/history-assessments",
      },
      UNIT_7_GLOBAL_CONFLICT: {
        name: "Unit 7: Global Conflict",
        timePeriod: "1900–Present",
        keyThemes: ["World War I", "World War II", "Causes of Global Conflict", "Nationalism", "Genocide & Atrocities"],
        fiveableUrl: "https://library.fiveable.me/ap-world/unit-7",
        heimlerVideoId: "Xx6pBGiRAzE",
        khanPlaylistId: "PLSQl0a2vh4HB43bYC5Ll3mKlalvC0mxEp",
        oerUrl: "https://www.oerproject.com/AP-World-History/Unit-7",
        zinnUrl: "https://www.zinnedproject.org/materials/?era=world-war-ii-postwar",
        worldHistoryUrl: "https://worldhistoryforusall.sdsu.edu/eras/era8.htm",
        digUrl: "https://www.inquirygroup.org/history-assessments",
      },
      UNIT_8_COLD_WAR: {
        name: "Unit 8: Cold War & Decolonization",
        timePeriod: "1900–Present",
        keyThemes: ["Cold War", "Decolonization", "Independence Movements", "Proxy Wars", "Non-Aligned Movement"],
        fiveableUrl: "https://library.fiveable.me/ap-world/unit-8",
        heimlerVideoId: "1HOu-P5fvEY",
        khanPlaylistId: "PLSQl0a2vh4HB43bYC5Ll3mKlalvC0mxEp",
        oerUrl: "https://www.oerproject.com/AP-World-History/Unit-8",
        zinnUrl: "https://www.zinnedproject.org/materials/?era=world-war-ii-postwar",
        worldHistoryUrl: "https://worldhistoryforusall.sdsu.edu/eras/era8.htm",
        digUrl: "https://www.inquirygroup.org/history-assessments",
      },
      UNIT_9_GLOBALIZATION: {
        name: "Unit 9: Globalization",
        timePeriod: "1900–Present",
        keyThemes: ["Economic Globalization", "Cultural Exchange", "Technology", "Environment", "Resistance to Globalization"],
        fiveableUrl: "https://library.fiveable.me/ap-world/unit-9",
        heimlerVideoId: "QhR3RVFc0gk",
        khanPlaylistId: "PLSQl0a2vh4HB43bYC5Ll3mKlalvC0mxEp",
        oerUrl: "https://www.oerproject.com/AP-World-History/Unit-9",
        zinnUrl: "https://www.zinnedproject.org/materials/?era=globalization",
        worldHistoryUrl: "https://worldhistoryforusall.sdsu.edu/eras/era9.htm",
        digUrl: "https://www.inquirygroup.org/history-assessments",
      },
    },

    suggestedTutorQuestions: [
      "Explain the causes of the French Revolution",
      "What was the significance of the Silk Roads?",
      "How did the Industrial Revolution change society?",
      "What were the effects of the Mongol conquests?",
      "Explain the differences between the Ottoman, Safavid, and Mughal empires",
      "What caused World War I?",
      "How did the Cold War shape global politics?",
      "What is the Columbian Exchange and why does it matter?",
    ],

    curriculumContext: `
You are trained on the official AP World History: Modern curriculum as defined by the College Board.
The course covers 1200 CE to present across 9 units:
- Unit 1 (1200-1450): Empires in Asia, Africa, and Europe; Islam's spread; trade networks
- Unit 2 (1200-1450): Silk Roads, Mongols, Indian Ocean, Trans-Saharan trade, cultural exchange
- Unit 3 (1450-1750): Ottoman, Safavid, Mughal, Ming/Qing empires; gunpowder; administration
- Unit 4 (1450-1750): European maritime exploration, Columbian Exchange, Atlantic slave trade, colonialism
- Unit 5 (1750-1900): Enlightenment, Atlantic Revolutions (American, French, Haitian, Latin American)
- Unit 6 (1750-1900): Industrial Revolution, imperialism, social effects, resistance movements
- Unit 7 (1900-present): WWI, WWII, causes of global conflict, nationalism, propaganda
- Unit 8 (1900-present): Cold War, decolonization, independence movements, proxy wars
- Unit 9 (1900-present): Globalization, economic integration, technology, cultural exchange, environment

AP Historical Thinking Skills: Argumentation, Causation, Comparison, Continuity & Change Over Time, Contextualization
AP Disciplinary Practices: Analyzing evidence, reasoning about historical context, making historical claims

Key resources: College Board AP Central, OER Project World History, Fiveable AP World History, Heimler's History (YouTube), Zinn Education Project, Digital Inquiry Group (Stanford)
`,

    tutorResources: `
When referencing resources:
- Digital Inquiry Group / Stanford (inquirygroup.org): Stanford-developed "Reading Like a Historian" lessons and primary-source assessments — the gold standard for historical thinking (actively fetched to enrich answers)
- Heimler's History (YouTube): Great for visual reviews of each unit
- Khan Academy: Free videos and articles on all topics
- Fiveable: Excellent study guides and key concept summaries
- OER Project: Primary sources and in-depth readings
- College Board AP Central: Official exam info and sample questions
- Zinn Education Project: Alternative perspectives and primary sources
- Wikipedia: Quick facts and article overviews on any historical topic
- Library of Congress (loc.gov): Free primary source documents, maps, and photographs
- OpenStax World History (openstax.org): Free peer-reviewed textbook covering all periods`,

    examAlignmentNotes: `AP Exam alignment:
- Questions must align with College Board AP World History: Modern curriculum
- Use AP Historical Thinking Skills (Causation, Comparison, CCOT, Contextualization)
- MCQ questions often use a primary source stimulus (document, image, map, chart)
- Difficulty EASY = straightforward recall; MEDIUM = analysis; HARD = synthesis across themes`,

    stimulusRequirement: "Include a primary source stimulus if appropriate (quote from historical document, description of map/image)",
    stimulusDescription: "primary source passage or description (null if not needed)",
    explanationGuidance: "referencing why each wrong answer is a 'trap' (common misconception) and citing historical evidence",
    collegeBoardLinks: [
      { label: "AP World History Course Overview", url: "https://apcentral.collegeboard.org/courses/ap-world-history" },
      { label: "Course & Exam Description (CED)", url: "https://apcentral.collegeboard.org/media/pdf/ap-world-history-modern-course-and-exam-description.pdf" },
      { label: "Past Exam Questions (FRQ)", url: "https://apcentral.collegeboard.org/courses/ap-world-history/exam/past-exam-questions" },
      { label: "Scoring Guidelines", url: "https://apcentral.collegeboard.org/courses/ap-world-history/exam/past-exam-questions" },
    ],
    difficultyRubric: {
      EASY: "Direct recall of one concept, event, or person using a single skill step. ~60-65% of test-takers answer correctly.",
      MEDIUM: "Applies one AP Historical Thinking Skill (Causation, Comparison, CCOT, or Contextualization) to analyzed evidence. ~40-55% correct.",
      HARD: "Multi-skill synthesis connecting evidence across time periods, regions, or themes, or evaluating a historiographical argument. ~25-40% correct.",
    },
    distractorTaxonomy: "Create exactly 3 distractor types: (1) TEMPORAL TRAP — true fact from the wrong time period; (2) GEOGRAPHIC TRAP — true development from a different region; (3) CAUSAL INVERSION — reverses the cause-effect relationship or conflates correlation with causation.",
    stimulusQualityGuidance: "GOOD: A verbatim primary source excerpt (Ibn Battuta, a colonial charter, a diplomatic letter) with date and attribution, or a specific map/image description. AVOID: Vague paraphrases ('A historian noted that…') or textbook summaries.",
    skillCodes: ["Causation", "Comparison", "Continuity and Change Over Time (CCOT)", "Contextualization", "Argumentation"],
    // College Board official exam weights (midpoints of CB published ranges).
    // Used by auto-populate to scale per-unit question targets to real exam distribution.
    topicWeights: {
      UNIT_1_GLOBAL_TAPESTRY: 0.09,                // CB: 8–10%
      UNIT_2_NETWORKS_OF_EXCHANGE: 0.09,           // CB: 8–10%
      UNIT_3_LAND_BASED_EMPIRES: 0.135,            // CB: 12–15%
      UNIT_4_TRANSOCEANIC_INTERCONNECTIONS: 0.135, // CB: 12–15%
      UNIT_5_REVOLUTIONS: 0.135,                   // CB: 12–15%
      UNIT_6_INDUSTRIALIZATION: 0.135,             // CB: 12–15%
      UNIT_7_GLOBAL_CONFLICT: 0.09,                // CB: 8–10%
      UNIT_8_COLD_WAR: 0.09,                       // CB: 8–10%
      UNIT_9_GLOBALIZATION: 0.09,                  // CB: 8–10%
    },
  },

  // ── AP Computer Science Principles ───────────────────────────────────────
  AP_COMPUTER_SCIENCE_PRINCIPLES: {
    name: "AP Computer Science Principles",
    shortName: "AP CS Principles",
    examSecsPerQuestion: 103, // 70 MCQ in 120 min ≈ 1.7 min/q
    mockExam: { mcqCount: 70, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    openStaxSubject: "cs",
    questionTypeFormats: {
      MCQ: {
        generationPrompt:
          "Generate a College Board AP CSP MCQ. Alternate between these sub-types: " +
          "(1) PSEUDOCODE TRACE — show AP pseudocode and ask what the output or variable value is; " +
          "(2) ALGORITHM ANALYSIS — describe an algorithm scenario and ask about its behavior/efficiency; " +
          "(3) CONCEPT APPLICATION — ask about binary, data compression, networks, cybersecurity, or ethics; " +
          "(4) CODE READING — provide a code segment and ask what it does. " +
          "Use the AP CSP pseudocode reference syntax (DISPLAY, INPUT, IF/ELSE, REPEAT, PROCEDURE).",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"question", ' +
          '"stimulus":"pseudocode block or scenario description (use ``` fences for code)", ' +
          '"apSkill":"Algorithmic Reasoning | Abstraction | Data Analysis | Code Tracing | Computing Innovation Analysis", ' +
          '"bloomLevel":"remember | apply | analyze", ' +
          '"options":["A) ...","B) ...","C) ...","D) ..."], "correctAnswer":"A", ' +
          '"explanation":"Step-by-step trace or concept explanation referencing AP CSP big ideas"}',
        estimatedMinutes: 3,
      },
      CODING: {
        generationPrompt:
          "Generate an AP Computer Science Principles written response question. " +
          "Alternate between these sub-types: " +
          "(1) ALGORITHM EXPLANATION — provide an AP pseudocode procedure and ask the student to explain what it does, " +
          "trace through it step-by-step, or describe its purpose and efficiency; " +
          "(2) CODE REASONING — provide a pseudocode segment with a bug or design choice and ask the student " +
          "to identify the error, correct it, or justify the design; " +
          "(3) PROGRAM DESIGN — ask the student to write or describe an algorithm in AP pseudocode to solve a " +
          "specific problem (e.g., search a list, compute a result, process user input). " +
          "Use AP CSP pseudocode syntax: DISPLAY, INPUT, IF/ELSE IF/ELSE, REPEAT TIMES, REPEAT UNTIL, " +
          "FOR EACH item IN list, PROCEDURE name(params), RETURN. Always include a pseudocode stimulus.",
        responseFormat:
          '{"topic":"...","subtopic":"...","questionText":"written response question with clear task description",' +
          '"stimulus":"AP pseudocode block enclosed in ``` fences — required for all sub-types",' +
          '"correctAnswer":"Model response: complete accurate explanation or pseudocode solution hitting all rubric points",' +
          '"explanation":"Scoring rubric: 4 points total. Point 1: [criterion]. Point 2: [criterion]. Point 3: [criterion]. Point 4: [criterion]. Common errors: [list 2-3 mistakes students make]."}',
        estimatedMinutes: 20,
      },
    },

    units: {
      CSP_1_CREATIVE_DEVELOPMENT: {
        name: "Unit 1: Creative Development",
        keyThemes: ["Collaboration", "Program Design", "Development Process", "Documentation"],
        fiveableUrl: "https://library.fiveable.me/ap-computer-science-principles/unit-1",
      },
      CSP_2_DATA: {
        name: "Unit 2: Data",
        keyThemes: ["Binary", "Data Compression", "Extracting Information", "Data Visualization"],
        fiveableUrl: "https://library.fiveable.me/ap-computer-science-principles/unit-2",
      },
      CSP_3_ALGORITHMS_AND_PROGRAMMING: {
        name: "Unit 3: Algorithms and Programming",
        keyThemes: ["Variables", "Control Structures", "Procedures", "Lists", "Searching", "Sorting", "Efficiency"],
        fiveableUrl: "https://library.fiveable.me/ap-computer-science-principles/unit-3",
      },
      CSP_4_COMPUTER_SYSTEMS_NETWORKS: {
        name: "Unit 4: Computer Systems and Networks",
        keyThemes: ["Computing Devices", "Networks", "Protocols", "Fault Tolerance", "Cybersecurity"],
        fiveableUrl: "https://library.fiveable.me/ap-computer-science-principles/unit-4",
      },
      CSP_5_IMPACT_OF_COMPUTING: {
        name: "Unit 5: Impact of Computing",
        keyThemes: ["Beneficial/Harmful Effects", "Digital Divide", "Privacy", "Intellectual Property", "Legal/Ethical Concerns"],
        fiveableUrl: "https://library.fiveable.me/ap-computer-science-principles/unit-5",
      },
    },

    suggestedTutorQuestions: [
      "What is the difference between lossless and lossy compression?",
      "How does binary represent numbers and text?",
      "Explain what an algorithm is with examples",
      "What is the difference between the internet and the World Wide Web?",
      "How do symmetric and asymmetric encryption work?",
      "What are the ethical concerns around big data and privacy?",
      "Explain how searching algorithms like binary search work",
      "What is abstraction and why is it important in programming?",
    ],

    curriculumContext: `
You are trained on the official AP Computer Science Principles curriculum as defined by the College Board.
The course covers computational thinking and the impact of computing across 5 units:
- Unit 1: Creative Development — collaboration, program design, development process
- Unit 2: Data — binary, data compression, extracting information from data, visualizations
- Unit 3: Algorithms and Programming — variables, control structures, procedures, lists, searching, sorting, efficiency
- Unit 4: Computer Systems and Networks — computing devices, networks, protocols, fault tolerance, cybersecurity
- Unit 5: Impact of Computing — beneficial/harmful effects, digital divide, privacy, intellectual property, legal/ethical concerns

AP CS Principles Big Ideas: Creative Development, Data, Algorithms and Programming, Computer Systems and Networks, Impact of Computing
AP CS Practices: Computational Solution Design, Algorithms and Program Development, Abstraction in Program Development, Code Analysis, Computing Innovations, Responsible Computing
`,

    tutorResources: `
When referencing resources:
- Khan Academy AP CS Principles: Free interactive lessons and videos
- Code.org: Interactive programming exercises
- Runestone Academy: AP CSP textbook with coding environments
- Fiveable AP CS Principles: Study guides and key concept summaries
- College Board AP Central: Official exam info, performance tasks, and practice questions`,

    examAlignmentNotes: `AP Exam alignment:
- Questions must align with College Board AP CSP curriculum
- Focus on conceptual understanding, not syntax-heavy coding
- Difficulty EASY = recall/recognition; MEDIUM = application; HARD = analysis/evaluation
- Include pseudocode scenarios, algorithm traces, or data interpretation where appropriate
- Questions may reference the AP CSP reference sheet or Explore Performance Task`,

    stimulusRequirement: "Include pseudocode, an algorithm trace, or a data scenario as stimulus where appropriate",
    stimulusDescription: "code block, pseudocode, or data scenario (null if not needed)",
    explanationGuidance: "referencing AP CSP concepts and addressing common misconceptions",
    collegeBoardLinks: [
      { label: "AP CSP Course Overview", url: "https://apcentral.collegeboard.org/courses/ap-computer-science-principles" },
      { label: "Course & Exam Description (CED)", url: "https://apcentral.collegeboard.org/media/pdf/ap-computer-science-principles-course-and-exam-description.pdf" },
      { label: "Past Exam Questions (FRQ)", url: "https://apcentral.collegeboard.org/courses/ap-computer-science-principles/exam/past-exam-questions" },
      { label: "AP CSP Reference Sheet", url: "https://apcentral.collegeboard.org/media/pdf/ap-computer-science-principles-exam-reference-sheet.pdf" },
    ],
    difficultyRubric: {
      EASY: "Direct recall of a term or rule (e.g., what DISPLAY outputs). 65%+ correct.",
      MEDIUM: "Trace a 3-5 step pseudocode segment or apply a concept to a new scenario. 40-55% correct.",
      HARD: "Analyze algorithm correctness/efficiency, evaluate ethical tradeoffs with multiple stakeholders, or debug a multi-procedure program. 25-40% correct.",
    },
    distractorTaxonomy: "(1) OFF-BY-ONE TRAP — plausible but wrong by one iteration; (2) SYNTAX CONFUSION — correct in Python/Java but wrong in AP pseudocode; (3) PARTIAL-TRACE TRAP — correct value at an intermediate step, not the final output.",
    stimulusQualityGuidance: "GOOD: Complete AP pseudocode block using DISPLAY, INPUT, IF/ELSE, REPEAT UNTIL, PROCEDURE with clear variable names. AVOID: Natural-language code descriptions, incomplete fragments, or mixed Python/AP syntax.",
    skillCodes: ["Computational Solution Design", "Algorithms and Program Development", "Abstraction in Program Development", "Code Analysis", "Computing Innovations", "Responsible Computing"],
    // College Board Big Idea exam weights (midpoints of CB published ranges).
    // CSP exam = 70 MCQs (70% of score). The 5 units map 1:1 to the 5 Big Ideas.
    topicWeights: {
      CSP_1_CREATIVE_DEVELOPMENT: 0.115,         // BI 1: 10–13%
      CSP_2_DATA: 0.195,                         // BI 2: 17–22%
      CSP_3_ALGORITHMS_AND_PROGRAMMING: 0.325,   // BI 3: 30–35%
      CSP_4_COMPUTER_SYSTEMS_NETWORKS: 0.13,     // BI 4: 11–15%
      CSP_5_IMPACT_OF_COMPUTING: 0.235,          // BI 5: 21–26%
    },
  },

  // ── AP Physics 1: Algebra-Based ───────────────────────────────────────────
  AP_PHYSICS_1: {
    name: "AP Physics 1: Algebra-Based",
    shortName: "AP Physics 1",
    // Confirmed against apcentral.collegeboard.org/courses/ap-physics-1/exam
    // (May 2026 administration):
    //   Section I  — 40 MCQ / 80 min (50% of score)
    //   Section II — 4 FRQ / 100 min (50% of score)
    //   Total exam  — 180 min (3 hours)
    examSecsPerQuestion: 120, // 40 MCQ in 80 min = 2 min/q
    mockExam: { mcqCount: 40, mcqTimeMinutes: 80 },
    enrichWithEduAPIs: false,
    openStaxSubject: "physics",
    questionTypeFormats: {
      MCQ: {
        generationPrompt:
          "Generate a College Board AP Physics 1 MCQ. Alternate between these sub-types: " +
          "(1) CONCEPTUAL — test understanding of a physics principle without numbers; " +
          "(2) CALCULATION — provide given values and ask for an algebraic solution (no calculus). For the stimulus, use a markdown table with two columns 'Given' and 'Value (units)' listing all known quantities; " +
          "(3) GRAPH INTERPRETATION — include a Mermaid xychart-beta diagram in the stimulus showing the graph (e.g., position vs time, velocity vs time, or force vs displacement). Use realistic data points. Example format: ```mermaid\\nxychart-beta\\n  title \\\"Velocity vs Time\\\"\\n  x-axis \\\"Time (s)\\\" [0, 1, 2, 3, 4]\\n  y-axis \\\"Velocity (m/s)\\\" 0 --> 20\\n  line [0, 5, 10, 15, 20]\\n```; " +
          "(4) EXPERIMENTAL — describe a lab scenario and ask about variables, sources of error, or predictions. " +
          "All math must be algebra-based. No calculus.",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"question", ' +
          '"stimulus":"null for conceptual | markdown table of given values for calculation | ```mermaid xychart-beta ... ``` block for graph | scenario text for experimental", ' +
          '"apSkill":"Model Analysis | Mathematical Routines | Scientific Questioning | Experimental Design | Data Analysis | Argumentation", ' +
          '"bloomLevel":"remember | apply | analyze", ' +
          '"options":["A) ...","B) ...","C) ...","D) ..."], "correctAnswer":"A", ' +
          '"explanation":"Physics law/principle, equation used, step-by-step solution if calculation"}',
        estimatedMinutes: 3,
      },
      FRQ: {
        generationPrompt:
          "Generate an AP Physics 1 Free Response Question (FRQ). " +
          "Alternate between these official College Board FRQ types: " +
          "(1) EXPERIMENTAL DESIGN — ask students to design an experiment: identify independent/dependent variables, " +
          "describe a procedure, identify sources of uncertainty, and predict results; " +
          "(2) QUANTITATIVE/QUALITATIVE TRANSLATION — provide a scenario with given values, ask students to " +
          "derive or calculate a quantity (show equation, substitution, final answer with units), then explain " +
          "qualitatively what would change if a variable were different; " +
          "(3) CONCEPTUAL EXPLANATION — ask students to explain a physics principle or phenomenon in terms of " +
          "fundamental concepts (no calculation required), predict how a system behaves, or compare two scenarios. " +
          "Structure the question with clearly labeled parts: (a), (b), and optionally (c). " +
          "Algebra-based only (no calculus). Use Mermaid xychart-beta or a markdown data table as stimulus when relevant.",
        responseFormat:
          '{"topic":"...","subtopic":"...","questionText":"Full multi-part FRQ with (a)(b)[(c)] clearly labeled",' +
          '"stimulus":"scenario / ```mermaid xychart-beta...``` graph / markdown data table, or null",' +
          '"correctAnswer":"(a) [complete model answer with equation+substitution+units where applicable] (b) [model response] (c) [model response if part c exists]",' +
          '"explanation":"Scoring rubric: (a) X pts — [state what each point requires]. (b) X pts — [state what each point requires]. Total: 10 pts. Common errors: [2-3 typical student mistakes]."}',
        estimatedMinutes: 15,
      },
      // SAQ kept for backward compatibility with questions already in the database
      SAQ: {
        generationPrompt:
          "Generate an AP Physics 1 Free Response Question (FRQ) with THREE labeled parts: (a), (b), (c). " +
          "Part (a): Derive or calculate a quantity — show the equation, substitution, and final answer with units. " +
          "Part (b): Qualitative explanation, graph sketch description, or two-scenario comparison. " +
          "Part (c): Experimental design or prediction — identify variables, describe a procedure, or predict " +
          "how changing one quantity affects an outcome. " +
          "Algebra-based only (no calculus). Ground in one AP Physics 1 unit. " +
          "Return stimulus as a short scenario, data table, or diagram description when relevant.",
        responseFormat:
          '{"topic":"...","subtopic":"...","questionText":"Full 3-part FRQ with (a)(b)(c) clearly labeled",' +
          '"stimulus":"scenario / data table / diagram description (null if not needed)",' +
          '"correctAnswer":"(a) [full worked answer with equation+substitution+units] (b) [model qualitative response] (c) [model experimental design]",' +
          '"explanation":"Scoring rubric: (a) 4 pts — equation 1, substitution 1, answer 1, units 1. (b) 3 pts — state what earns each. (c) 3 pts — state what earns each."}',
        estimatedMinutes: 12,
      },
    },

    units: {
      PHY1_1_KINEMATICS: {
        name: "Unit 1: Kinematics",
        keyThemes: ["Displacement", "Velocity", "Acceleration", "Motion Graphs", "Projectile Motion"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-1",
        mitocwUrl: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/week-1-kinematics/",
        phetUrl: "https://phet.colorado.edu/en/simulations/moving-man",
        khanUrl: "https://www.khanacademy.org/science/ap-physics-1/ap-one-dimensional-motion",
        ck12Url: "https://www.ck12.org/section/kinematics",
        openStaxUrl: "https://openstax.org/books/university-physics-vol-1/pages/3-introduction",
      },
      PHY1_2_FORCES_AND_NEWTONS_LAWS: {
        name: "Unit 2: Forces and Newton's Laws",
        keyThemes: ["Newton's Three Laws", "Free Body Diagrams", "Friction", "Tension", "Normal Force"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-2",
        mitocwUrl: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/week-2-newtons-laws/",
        phetUrl: "https://phet.colorado.edu/en/simulations/forces-and-motion-basics",
        khanUrl: "https://www.khanacademy.org/science/ap-physics-1/ap-forces-newtons-laws",
        ck12Url: "https://www.ck12.org/section/newtons-laws",
        openStaxUrl: "https://openstax.org/books/university-physics-vol-1/pages/5-introduction",
      },
      PHY1_3_CIRCULAR_MOTION_GRAVITATION: {
        name: "Unit 3: Circular Motion and Gravitation",
        keyThemes: ["Centripetal Acceleration", "Gravitational Force", "Orbital Motion"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-3",
        mitocwUrl: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/week-3-circular-motion/",
        phetUrl: "https://phet.colorado.edu/en/simulations/gravity-and-orbits",
        khanUrl: "https://www.khanacademy.org/science/ap-physics-1/ap-centripetal-force-and-gravitation",
        ck12Url: "https://www.ck12.org/section/circular-motion",
        openStaxUrl: "https://openstax.org/books/university-physics-vol-1/pages/6-introduction",
      },
      PHY1_4_ENERGY: {
        name: "Unit 4: Energy",
        keyThemes: ["Work", "Kinetic Energy", "Potential Energy", "Conservation of Energy", "Power"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-4",
        mitocwUrl: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/week-6-energy-and-work/",
        phetUrl: "https://phet.colorado.edu/en/simulations/energy-skate-park",
        khanUrl: "https://www.khanacademy.org/science/ap-physics-1/ap-work-and-energy",
        ck12Url: "https://www.ck12.org/section/work-energy-and-power",
        openStaxUrl: "https://openstax.org/books/university-physics-vol-1/pages/7-introduction",
      },
      PHY1_5_MOMENTUM: {
        name: "Unit 5: Momentum",
        keyThemes: ["Impulse", "Linear Momentum", "Conservation of Momentum", "Collisions"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-5",
        mitocwUrl: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/week-5-momentum-and-impulse/",
        phetUrl: "https://phet.colorado.edu/en/simulations/collision-lab",
        khanUrl: "https://www.khanacademy.org/science/ap-physics-1/ap-impulse-and-momentum",
        ck12Url: "https://www.ck12.org/section/momentum",
        openStaxUrl: "https://openstax.org/books/university-physics-vol-1/pages/9-introduction",
      },
      PHY1_6_SIMPLE_HARMONIC_MOTION: {
        name: "Unit 6: Simple Harmonic Motion",
        keyThemes: ["Springs", "Pendulums", "Period", "Frequency", "Amplitude"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-6",
        mitocwUrl: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/week-7-simple-harmonic-motion/",
        phetUrl: "https://phet.colorado.edu/en/simulations/masses-and-springs",
        khanUrl: "https://www.khanacademy.org/science/ap-physics-1/ap-simple-harmonic-motion",
        ck12Url: "https://www.ck12.org/section/simple-harmonic-motion",
        openStaxUrl: "https://openstax.org/books/university-physics-vol-1/pages/15-introduction",
      },
      PHY1_7_TORQUE_AND_ROTATION: {
        name: "Unit 7: Torque and Rotational Motion",
        keyThemes: ["Torque", "Rotational Inertia", "Angular Momentum"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-7",
        mitocwUrl: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/week-10-rotational-motion/",
        phetUrl: "https://phet.colorado.edu/en/simulations/torque",
        khanUrl: "https://www.khanacademy.org/science/ap-physics-1/ap-torque-and-angular-momentum",
        ck12Url: "https://www.ck12.org/section/torque",
        openStaxUrl: "https://openstax.org/books/university-physics-vol-1/pages/10-introduction",
      },
      // PHY1_8 (Electric Charge & Force) and PHY1_9 (DC Circuits) removed
      // 2026-04-29 — College Board moved both units to AP Physics 2 in the
      // 2024-25 AP Physics 1 redesign. User feedback (Luke Hagood) flagged
      // them as off-syllabus minutes after sign-up. Approved questions in
      // those units were unapproved via scripts/unapprove-physics1-deprecated-units.mjs
      // (95 questions retired, marker "ap-physics-1-redesign-2024").
      // PHY1_10 (Mechanical Waves & Sound) removed 2026-04-29 — also moved to
      // AP Physics 2 in 2024-25 CB redesign (52 questions retired, marker
      // "ap-physics-1-redesign-2024-waves").
      PHY1_FLUIDS: {
        name: "Unit 8: Fluids",
        keyThemes: ["Density", "Pressure", "Buoyancy", "Archimedes' Principle", "Continuity Equation", "Bernoulli's Equation"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-8-fluids",
        phetUrl: "https://phet.colorado.edu/en/simulations/fluid-pressure-and-flow",
        khanUrl: "https://www.khanacademy.org/science/ap-physics-1/ap-fluids",
        openStaxUrl: "https://openstax.org/books/university-physics-vol-1/pages/14-introduction",
      },
    },

    suggestedTutorQuestions: [
      "Explain Newton's three laws of motion with examples",
      "Walk me through a step-by-step solution for a projectile motion problem",
      "How does conservation of energy work — show me the math step by step",
      "Explain the difference between elastic and inelastic collisions with equations",
      "Design an experiment to find the spring constant of an unknown spring",
      "How do I interpret a velocity-time graph for constant acceleration?",
      "Walk me through analyzing a DC circuit with series and parallel resistors",
      "What happens to the period of a pendulum if you triple its length?",
      "How does wave interference produce standing waves on a string?",
      "What is centripetal acceleration and how is it derived algebraically?",
    ],

    curriculumContext: `
You are trained on the official AP Physics 1: Algebra-Based curriculum as defined by the College Board.
The course covers fundamental physics concepts across 10 units:
- Unit 1: Kinematics — displacement, velocity, acceleration, motion graphs, projectile motion
- Unit 2: Forces and Newton's Laws — Newton's three laws, free body diagrams, friction, tension, normal force
- Unit 3: Circular Motion and Gravitation — centripetal acceleration, gravitational force, orbital motion
- Unit 4: Energy — work, kinetic energy, potential energy, conservation of energy, power
- Unit 5: Momentum — impulse, linear momentum, conservation of momentum, collisions
- Unit 6: Simple Harmonic Motion — springs, pendulums, period, frequency, amplitude
- Unit 7: Torque and Rotational Motion — torque, rotational inertia, angular momentum
- Unit 8: Electric Charge and Electric Force — charge, Coulomb's law, electric fields
- Unit 9: DC Circuits — current, voltage, resistance, Ohm's law, series/parallel circuits, power
- Unit 10: Mechanical Waves and Sound — wave properties, interference, standing waves, sound

AP Physics Science Practices: Modeling, Mathematical Routines, Scientific Questioning, Experimental Design, Data Analysis, Argumentation

AP Exam Format: Section I — 50 MCQs (90 min, 50% of score). Section II — 5 FRQs (90 min, 50% of score) including Experimental Design, Quantitative/Qualitative Translation, and Short Answer types.
`,

    tutorResources: `
When referencing resources:
- MIT OpenCourseWare 8.01SC (ocw.mit.edu): Free MIT Classical Mechanics course — lecture notes, worked examples, and problem sets for kinematics through rotational motion (actively fetched to enrich answers)
- Khan Academy AP Physics 1: Free videos, articles, and practice problems
- Flipping Physics (YouTube): Excellent conceptual and worked example videos
- Professor Leonard (YouTube): Comprehensive supplement
- Fiveable AP Physics 1: Study guides and key concept summaries
- PhET Simulations (phet.colorado.edu): Free interactive physics simulations for visualizing concepts
- College Board AP Central: Official exam info, free-response questions, and scoring`,

    examAlignmentNotes: `AP Exam alignment:
- Questions must align with College Board AP Physics 1 curriculum
- Use algebra-based reasoning only (no calculus)
- Difficulty EASY = single-concept recall; MEDIUM = multi-step application; HARD = synthesis/experimental design
- Many questions involve interpreting graphs, diagrams, or experimental scenarios
- Questions test science practices: modeling, math routines, argumentation`,

    stimulusRequirement: "Include a diagram description, data table, or experimental scenario as stimulus where appropriate",
    stimulusDescription: "diagram description, equation, or scenario (null if not needed)",
    explanationGuidance: "referencing the relevant physics law or principle and associated equations",
    collegeBoardLinks: [
      { label: "AP Physics 1 Course Overview", url: "https://apcentral.collegeboard.org/courses/ap-physics-1" },
      { label: "Course & Exam Description (CED)", url: "https://apcentral.collegeboard.org/media/pdf/ap-physics-1-course-and-exam-description.pdf" },
      { label: "Past Exam Questions (FRQ)", url: "https://apcentral.collegeboard.org/courses/ap-physics-1/exam/past-exam-questions" },
      { label: "AP Physics 1 Formula Sheet", url: "https://apcentral.collegeboard.org/media/pdf/ap-physics-1-formulas-tables.pdf" },
    ],
    difficultyRubric: {
      EASY: "Recall of one law, equation, or definition. No multi-step calculation. 65%+ correct.",
      MEDIUM: "2-3 algebraic steps using one equation, or qualitative reasoning with one variable changing. 40-55% correct.",
      HARD: "Multiple equations in sequence, graph interpretation where two variables co-vary, or experiment design/critique. 25-40% correct.",
    },
    distractorTaxonomy: "(1) MAGNITUDE TRAP — correct formula but forgot to square, root, or negate; (2) DIRECTION/SIGN TRAP — correct magnitude, wrong direction (force diagrams, momentum, work); (3) FORMULA SUBSTITUTION TRAP — plugged numbers into wrong equation for superficially similar scenario.",
    stimulusQualityGuidance: "GOOD: (a) Markdown table of given values with units for calculation questions; (b) Mermaid xychart-beta block with realistic data for graph questions; (c) Specific scenario description with numbers (e.g., '5 kg block on frictionless surface connected by string to 2 kg hanging mass'). AVOID: Generic 'an object moves' setups without numbers or vague diagram descriptions.",
    skillCodes: ["Modeling", "Mathematical Routines", "Scientific Questioning", "Experimental Design", "Data Analysis", "Argumentation"],
    // Topic weights aligned to College Board AP Physics 1 (current redesign) exam content distribution.
    // CB lists 8 official units; AP_Help schema has 10 units (older split keeping E&M topics).
    // We weight kinematics/dynamics/energy/momentum highest (mechanics core, ~70% of real exam),
    // and give the legacy E&M units (Charge/Force, DC Circuits) reduced weight since the
    // current redesigned exam excludes them. Sums to 1.0.
    topicWeights: {
      PHY1_1_KINEMATICS: 0.125,                  // CB: 10–15%
      PHY1_2_FORCES_AND_NEWTONS_LAWS: 0.205,     // CB: 18–23% (Force & Translational Dynamics)
      PHY1_3_CIRCULAR_MOTION_GRAVITATION: 0.10,  // shared between Forces + Rotational
      PHY1_4_ENERGY: 0.205,                      // CB: 18–23% (Work, Energy, Power)
      PHY1_5_MOMENTUM: 0.125,                    // CB: 10–15%
      PHY1_6_SIMPLE_HARMONIC_MOTION: 0.065,      // CB: 5–8% (Oscillations)
      PHY1_7_TORQUE_AND_ROTATION: 0.115,         // CB: 10–15% (Torque & Rotational Dynamics)
      PHY1_FLUIDS: 0.065,                         // CB: 5–8% (Unit 8 Fluids — added Fall 2024 redesign)
    },
  },

  // ── AP Calculus AB ────────────────────────────────────────────────────────
  AP_CALCULUS_AB: {
    name: "AP Calculus AB",
    shortName: "AP Calculus AB",
    examSecsPerQuestion: 96, // 45 MCQ in 105 min (Section I), plus FRQ
    // Real exam splits 30 no-calc/60m + 15 calc/45m; treat as unified 45/105 for now.
    mockExam: { mcqCount: 45, mcqTimeMinutes: 105 },
    enrichWithEduAPIs: false,
    openStaxSubject: undefined,
    units: {
      CALC_AB_1_LIMITS: {
        name: "Unit 1: Limits and Continuity",
        keyThemes: ["limit definition", "one-sided limits", "continuity", "intermediate value theorem", "squeeze theorem"],
        khanUrl: "https://www.khanacademy.org/math/ap-calculus-ab/ab-limits-new",
        openStaxUrl: "https://openstax.org/books/calculus-volume-1/pages/2-introduction",
        ck12Url: "https://www.ck12.org/calculus/",
      },
      CALC_AB_2_DIFFERENTIATION_BASICS: {
        name: "Unit 2: Differentiation — Definition and Fundamental Properties",
        keyThemes: ["derivative definition", "power rule", "product rule", "quotient rule", "chain rule basics"],
        khanUrl: "https://www.khanacademy.org/math/ap-calculus-ab/ab-differentiation-1-new",
        openStaxUrl: "https://openstax.org/books/calculus-volume-1/pages/3-introduction",
      },
      CALC_AB_3_DIFFERENTIATION_COMPOSITE: {
        name: "Unit 3: Differentiation — Composite, Implicit, and Inverse Functions",
        keyThemes: ["chain rule", "implicit differentiation", "inverse trig derivatives", "logarithmic differentiation"],
        khanUrl: "https://www.khanacademy.org/math/ap-calculus-ab/ab-differentiation-2-new",
        openStaxUrl: "https://openstax.org/books/calculus-volume-1/pages/3-6-the-chain-rule",
      },
      CALC_AB_4_CONTEXTUAL_APPLICATIONS: {
        name: "Unit 4: Contextual Applications of Differentiation",
        keyThemes: ["related rates", "linearization", "L'Hôpital's rule", "motion along a line"],
        khanUrl: "https://www.khanacademy.org/math/ap-calculus-ab/ab-diff-contextual-applications-new",
        openStaxUrl: "https://openstax.org/books/calculus-volume-1/pages/4-introduction",
      },
      CALC_AB_5_ANALYTICAL_APPLICATIONS: {
        name: "Unit 5: Analytical Applications of Differentiation",
        keyThemes: ["mean value theorem", "increasing/decreasing", "concavity", "optimization", "curve sketching"],
        khanUrl: "https://www.khanacademy.org/math/ap-calculus-ab/ab-diff-analytical-applications-new",
        openStaxUrl: "https://openstax.org/books/calculus-volume-1/pages/4-3-maxima-and-minima",
      },
      CALC_AB_6_INTEGRATION: {
        name: "Unit 6: Integration and Accumulation of Change",
        keyThemes: ["Riemann sums", "definite integral", "fundamental theorem of calculus", "u-substitution", "antiderivatives"],
        khanUrl: "https://www.khanacademy.org/math/ap-calculus-ab/ab-integration-new",
        openStaxUrl: "https://openstax.org/books/calculus-volume-1/pages/5-introduction",
      },
      CALC_AB_7_DIFFERENTIAL_EQUATIONS: {
        name: "Unit 7: Differential Equations",
        keyThemes: ["slope fields", "separation of variables", "exponential growth and decay", "logistic model"],
        khanUrl: "https://www.khanacademy.org/math/ap-calculus-ab/ab-differential-equations-new",
        openStaxUrl: "https://openstax.org/books/calculus-volume-2/pages/4-introduction",
      },
      CALC_AB_8_APPLICATIONS_INTEGRATION: {
        name: "Unit 8: Applications of Integration",
        keyThemes: ["area between curves", "volume of solids", "average value", "motion and accumulation"],
        khanUrl: "https://www.khanacademy.org/math/ap-calculus-ab/ab-applications-of-integration-new",
        openStaxUrl: "https://openstax.org/books/calculus-volume-1/pages/6-introduction",
      },
    },
    suggestedTutorQuestions: [
      "What is the formal definition of a derivative?",
      "How do I use the chain rule for composite functions?",
      "When can I apply L'Hôpital's rule?",
      "How do I set up a related rates problem?",
      "What does the fundamental theorem of calculus state?",
      "How do I find the area between two curves?",
    ],
    curriculumContext: `AP Calculus AB covers:
- Unit 1: Limits and Continuity — limit laws, one-sided limits, IVT, squeeze theorem
- Unit 2: Differentiation Basics — power, product, quotient rules
- Unit 3: Differentiation Advanced — chain rule, implicit, inverse trig
- Unit 4: Contextual Applications — related rates, L'Hôpital, motion
- Unit 5: Analytical Applications — MVT, optimization, curve sketching
- Unit 6: Integration — Riemann sums, FTC, u-substitution
- Unit 7: Differential Equations — slope fields, separation of variables
- Unit 8: Applications of Integration — area, volume, average value

AP Exam: Section I — 45 MCQ (105 min). Section II — 6 FRQ (90 min).
Mathematical Practices: Implementing Mathematical Processes, Connecting Representations, Justification, Communication.`,
    tutorResources: `
- MIT OpenCourseWare 18.01SC (ocw.mit.edu): Single Variable Calculus — complete free course
- Khan Academy AP Calculus AB: Free videos and practice for every topic
- Paul's Online Math Notes (tutorial.math.lamar.edu): Excellent worked examples
- OpenStax Calculus Volume 1 (openstax.org): Free peer-reviewed textbook
- College Board AP Calculus AB: Official practice exams and FRQ scoring`,
    examAlignmentNotes: `AP Exam alignment:
- Algebra-only reasoning; no limit theorems beyond L'Hôpital
- Difficulty EASY = single formula application; MEDIUM = multi-step problem; HARD = proof/justification or applied optimization
- Include Riemann sum, graph-reading, and "justify your reasoning" questions`,
    stimulusRequirement: "Include a graph description, equation, or data table as stimulus where appropriate for calculation or analysis questions",
    stimulusDescription: "graph description, equation, or data table (null if not needed)",
    explanationGuidance: "referencing the relevant calculus theorem or rule with step-by-step algebra",
    collegeBoardLinks: [
      { label: "AP Calculus AB Course Overview", url: "https://apcentral.collegeboard.org/courses/ap-calculus-ab" },
      { label: "Course & Exam Description (CED)", url: "https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-and-bc-course-and-exam-description.pdf" },
      { label: "Past FRQ Questions", url: "https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam/past-exam-questions" },
    ],
    difficultyRubric: {
      EASY: "Single-rule application or limit evaluation. Straightforward substitution. 65%+ correct.",
      MEDIUM: "2–3 step problem: e.g., apply chain rule then integrate, or set up and solve related rates. 40–55% correct.",
      HARD: "Requires justification, epsilon-delta reasoning, multi-part FRQ, or synthesis across two units. 25–40% correct.",
    },
    distractorTaxonomy: "(1) CHAIN RULE TRAP — differentiates outer function only, forgets inner derivative; (2) SIGN/CONSTANT TRAP — drops negative sign or constant of integration; (3) THEOREM MISAPPLICATION — applies FTC or MVT when conditions aren't met.",
    stimulusQualityGuidance: "GOOD: (a) Graph of f(x) described with labeled intercepts and extrema; (b) Table of x and f(x) values for Riemann sum; (c) Equation like f(x)=3x²sin(x) for differentiation. AVOID: Vague 'a function' without specifics.",
    skillCodes: ["Implementing Mathematical Processes", "Connecting Representations", "Justification", "Communication"],
    questionTypeFormats: {
      FRQ: {
        generationPrompt:
          "Generate a College Board AP Calculus AB Free Response Question (FRQ). " +
          "The FRQ must have 2–4 labeled parts (a), (b), (c), (d). " +
          "Include a graph, table, or equation as stimulus. " +
          "Test skills: derivatives, integrals, analysis of functions, or applied problems. " +
          "Each part should require 3–8 steps to solve.",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"Full FRQ with parts (a)-(d)", ' +
          '"stimulus":"graph description or equation", "correctAnswer":"Complete solution for all parts with work shown", ' +
          '"explanation":"Step-by-step solutions for each part with point breakdown (9 points total)"}',
        estimatedMinutes: 15,
      },
    },
  },

  // ── AP Calculus BC ────────────────────────────────────────────────────────
  AP_CALCULUS_BC: {
    name: "AP Calculus BC",
    shortName: "AP Calculus BC",
    examSecsPerQuestion: 96,
    // Real exam splits 30 no-calc/60m + 15 calc/45m; treat as unified 45/105 for now.
    mockExam: { mcqCount: 45, mcqTimeMinutes: 105 },
    enrichWithEduAPIs: false,
    openStaxSubject: undefined,
    units: {
      CALC_BC_1_LIMITS: {
        name: "Unit 1: Limits and Continuity",
        keyThemes: ["limit definition", "continuity", "IVT", "squeeze theorem"],
        khanUrl: "https://www.khanacademy.org/math/ap-calculus-bc/bc-limits-new",
        openStaxUrl: "https://openstax.org/books/calculus-volume-1/pages/2-introduction",
      },
      CALC_BC_2_DIFFERENTIATION_BASICS: {
        name: "Unit 2: Differentiation — Definition and Fundamental Properties",
        keyThemes: ["power rule", "product rule", "quotient rule"],
        khanUrl: "https://www.khanacademy.org/math/ap-calculus-bc/bc-differentiation-1-new",
        openStaxUrl: "https://openstax.org/books/calculus-volume-1/pages/3-introduction",
      },
      CALC_BC_3_DIFFERENTIATION_COMPOSITE: {
        name: "Unit 3: Differentiation — Composite, Implicit, and Inverse Functions",
        keyThemes: ["chain rule", "implicit differentiation", "inverse trig"],
        khanUrl: "https://www.khanacademy.org/math/ap-calculus-bc/bc-differentiation-2-new",
        openStaxUrl: "https://openstax.org/books/calculus-volume-1/pages/3-6-the-chain-rule",
      },
      CALC_BC_4_CONTEXTUAL_APPLICATIONS: {
        name: "Unit 4: Contextual Applications of Differentiation",
        keyThemes: ["related rates", "linearization", "L'Hôpital's rule"],
        khanUrl: "https://www.khanacademy.org/math/ap-calculus-bc/bc-diff-contextual-applications-new",
        openStaxUrl: "https://openstax.org/books/calculus-volume-1/pages/4-introduction",
      },
      CALC_BC_5_ANALYTICAL_APPLICATIONS: {
        name: "Unit 5: Analytical Applications of Differentiation",
        keyThemes: ["MVT", "optimization", "curve sketching", "concavity"],
        khanUrl: "https://www.khanacademy.org/math/ap-calculus-bc/bc-diff-analytical-applications-new",
      },
      CALC_BC_6_INTEGRATION: {
        name: "Unit 6: Integration and Accumulation of Change",
        keyThemes: ["FTC", "u-substitution", "Riemann sums", "integration by parts"],
        khanUrl: "https://www.khanacademy.org/math/ap-calculus-bc/bc-integration-new",
        openStaxUrl: "https://openstax.org/books/calculus-volume-1/pages/5-introduction",
      },
      CALC_BC_7_DIFFERENTIAL_EQUATIONS: {
        name: "Unit 7: Differential Equations",
        keyThemes: ["slope fields", "Euler's method", "separation of variables", "logistic model"],
        khanUrl: "https://www.khanacademy.org/math/ap-calculus-bc/bc-differential-equations-new",
      },
      CALC_BC_8_APPLICATIONS_INTEGRATION: {
        name: "Unit 8: Applications of Integration",
        keyThemes: ["area", "volume", "arc length", "accumulation"],
        khanUrl: "https://www.khanacademy.org/math/ap-calculus-bc/bc-applications-of-integration-new",
      },
      CALC_BC_9_PARAMETRIC_POLAR_VECTORS: {
        name: "Unit 9: Parametric Equations, Polar Coordinates, and Vector-Valued Functions",
        keyThemes: ["parametric derivatives", "polar area", "vectors", "arc length in parametric form"],
        khanUrl: "https://www.khanacademy.org/math/ap-calculus-bc/bc-advanced-functions-new",
        openStaxUrl: "https://openstax.org/books/calculus-volume-2/pages/7-introduction",
      },
      CALC_BC_10_INFINITE_SEQUENCES_SERIES: {
        name: "Unit 10: Infinite Sequences and Series",
        keyThemes: ["convergence tests", "Taylor series", "Maclaurin series", "radius of convergence", "power series"],
        khanUrl: "https://www.khanacademy.org/math/ap-calculus-bc/bc-series-new",
        openStaxUrl: "https://openstax.org/books/calculus-volume-2/pages/5-introduction",
      },
    },
    suggestedTutorQuestions: [
      "How do I test a series for convergence?",
      "What is the difference between Maclaurin and Taylor series?",
      "How do I find derivatives of parametric equations?",
      "When should I use integration by parts?",
      "How do I find the area enclosed by a polar curve?",
      "What is Euler's method and when is it used?",
    ],
    curriculumContext: `AP Calculus BC covers all of Calculus AB plus:
- Unit 9: Parametric, Polar, and Vector-Valued Functions
- Unit 10: Infinite Sequences and Series (convergence, Taylor/Maclaurin series)
Additional BC topics within Units 1–8: integration by parts, partial fractions, arc length, Euler's method, logistic growth.

AP Exam: Section I — 45 MCQ (105 min). Section II — 6 FRQ (90 min).`,
    tutorResources: `
- MIT OpenCourseWare 18.01SC and 18.02 (ocw.mit.edu): Complete calculus sequences
- Khan Academy AP Calculus BC: Free videos for all units including series
- Paul's Online Math Notes: Comprehensive series convergence reference
- OpenStax Calculus Volume 1 & 2 (openstax.org): Free textbooks`,
    examAlignmentNotes: `AP Exam alignment:
- Includes all AB topics plus series, parametric, polar
- HARD questions often involve series convergence, error bounds, or Taylor polynomial approximations`,
    stimulusRequirement: "Include a graph, equation, or table as stimulus for calculation questions",
    stimulusDescription: "graph description, equation, or partial sums table (null if not needed)",
    explanationGuidance: "referencing the calculus theorem, convergence test, or integration technique with full work",
    collegeBoardLinks: [
      { label: "AP Calculus BC Course Overview", url: "https://apcentral.collegeboard.org/courses/ap-calculus-bc" },
      { label: "Past FRQ Questions", url: "https://apcentral.collegeboard.org/courses/ap-calculus-bc/exam/past-exam-questions" },
    ],
    difficultyRubric: {
      EASY: "Single-concept recall from AB content or direct ratio/root test. 65%+ correct.",
      MEDIUM: "Multi-step: parametric derivative, polar integration, or alternating series error bound. 40–55% correct.",
      HARD: "Taylor polynomial error analysis, radius of convergence proof, or multi-concept FRQ. 25–40% correct.",
    },
    distractorTaxonomy: "(1) AB/BC CONFUSION TRAP — applies AB technique to BC-only scenario; (2) CONVERGENCE CONDITION TRAP — forgets to check absolute value or boundary; (3) NOTATION TRAP — confuses σ and Σ or misreads vector component.",
    stimulusQualityGuidance: "GOOD: Partial sums table for series questions; graph of parametric curve with labeled t-values; explicit f(x) for Taylor series expansion. AVOID: Generic 'a series' without terms.",
    skillCodes: ["Implementing Mathematical Processes", "Connecting Representations", "Justification", "Communication"],
    questionTypeFormats: {
      FRQ: {
        generationPrompt:
          "Generate a College Board AP Calculus BC Free Response Question (FRQ). " +
          "Include a BC-specific topic (series, parametric, polar, or Euler's method). " +
          "Provide 2–4 labeled parts (a)–(d) with stimulus (equation, table, or graph description). " +
          "Test skills that go beyond AB: convergence, error bounds, or vector functions.",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"Full FRQ", ' +
          '"stimulus":"equation or graph", "correctAnswer":"Complete solutions", ' +
          '"explanation":"Step-by-step with point totals"}',
        estimatedMinutes: 15,
      },
    },
  },

  // ── AP Statistics ─────────────────────────────────────────────────────────
  AP_STATISTICS: {
    name: "AP Statistics",
    shortName: "AP Statistics",
    examSecsPerQuestion: 90, // 40 MCQ in 90 min
    mockExam: { mcqCount: 40, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    openStaxSubject: undefined,
    units: {
      STATS_1_EXPLORING_DATA: {
        name: "Unit 1: Exploring One-Variable Data",
        keyThemes: ["distributions", "center and spread", "boxplots", "histograms", "z-scores", "normal distribution"],
        khanUrl: "https://www.khanacademy.org/math/ap-statistics/quantitative-data-ap",
        openStaxUrl: "https://openstax.org/books/introductory-statistics/pages/1-introduction",
      },
      STATS_2_MODELING_DATA: {
        name: "Unit 2: Exploring Two-Variable Data",
        keyThemes: ["scatterplots", "correlation", "least-squares regression", "residuals", "influential points"],
        khanUrl: "https://www.khanacademy.org/math/ap-statistics/bivariate-data-ap",
        openStaxUrl: "https://openstax.org/books/introductory-statistics/pages/12-introduction",
      },
      STATS_3_COLLECTING_DATA: {
        name: "Unit 3: Collecting Data",
        keyThemes: ["sampling methods", "observational vs experimental", "randomization", "bias", "blocking"],
        khanUrl: "https://www.khanacademy.org/math/ap-statistics/gathering-data-ap",
        openStaxUrl: "https://openstax.org/books/introductory-statistics/pages/1-2-data-sampling-and-variation-in-data-and-sampling",
      },
      STATS_4_PROBABILITY: {
        name: "Unit 4: Probability, Random Variables, and Probability Distributions",
        keyThemes: ["addition/multiplication rules", "conditional probability", "discrete distributions", "geometric and binomial"],
        khanUrl: "https://www.khanacademy.org/math/ap-statistics/probability-ap",
        openStaxUrl: "https://openstax.org/books/introductory-statistics/pages/4-introduction",
      },
      STATS_5_SAMPLING_DISTRIBUTIONS: {
        name: "Unit 5: Sampling Distributions",
        keyThemes: ["central limit theorem", "sampling distribution of x̄", "sampling distribution of p̂", "standard error"],
        khanUrl: "https://www.khanacademy.org/math/ap-statistics/sampling-distribution-ap",
        openStaxUrl: "https://openstax.org/books/introductory-statistics/pages/7-introduction",
      },
      STATS_6_INFERENCE_PROPORTIONS: {
        name: "Unit 6: Inference for Categorical Data — Proportions",
        keyThemes: ["one-sample z-test", "two-sample z-test", "confidence intervals for proportions", "p-values"],
        khanUrl: "https://www.khanacademy.org/math/ap-statistics/two-sample-inference",
        openStaxUrl: "https://openstax.org/books/introductory-statistics/pages/8-introduction",
      },
      STATS_7_INFERENCE_MEANS: {
        name: "Unit 7: Inference for Quantitative Data — Means",
        keyThemes: ["t-distribution", "one-sample t-test", "two-sample t-test", "paired t-test", "confidence intervals"],
        khanUrl: "https://www.khanacademy.org/math/ap-statistics/xfb5d8e68:inference-quantitative-univariate",
        openStaxUrl: "https://openstax.org/books/introductory-statistics/pages/9-introduction",
      },
      STATS_8_CHI_SQUARE: {
        name: "Unit 8: Inference for Categorical Data — Chi-Square",
        keyThemes: ["goodness of fit", "test for homogeneity", "test for independence", "expected counts"],
        khanUrl: "https://www.khanacademy.org/math/ap-statistics/chi-square-tests",
        openStaxUrl: "https://openstax.org/books/introductory-statistics/pages/11-introduction",
      },
      STATS_9_INFERENCE_SLOPES: {
        name: "Unit 9: Inference for Quantitative Data — Slopes",
        keyThemes: ["t-test for slope", "confidence interval for slope", "conditions for inference in regression"],
        khanUrl: "https://www.khanacademy.org/math/ap-statistics/inference-slope-ap",
        openStaxUrl: "https://openstax.org/books/introductory-statistics/pages/12-4-testing-the-significance-of-the-correlation-coefficient",
      },
    },
    suggestedTutorQuestions: [
      "What is the difference between a parameter and a statistic?",
      "How do I interpret a p-value?",
      "When should I use a t-test vs z-test?",
      "What conditions must be checked for a chi-square test?",
      "How do I interpret residuals in a regression model?",
      "What does the central limit theorem say?",
    ],
    curriculumContext: `AP Statistics covers:
- Unit 1: One-Variable Data — distributions, normal, z-scores
- Unit 2: Two-Variable Data — regression, correlation, residuals
- Unit 3: Collecting Data — sampling, experiments, bias
- Unit 4: Probability — rules, distributions, binomial, geometric
- Unit 5: Sampling Distributions — CLT, standard error
- Unit 6–9: Inference — proportions, means, chi-square, regression slopes

AP Exam: Section I — 40 MCQ (90 min). Section II — 6 FRQ (90 min) including 1 investigative task.`,
    tutorResources: `
- Khan Academy AP Statistics: Complete free course with exercises
- OpenStax Introductory Statistics (openstax.org): Free peer-reviewed textbook
- College Board AP Statistics: Official practice exams and FRQ
- StatTrek (stattrek.com): Statistical tables and worked examples`,
    examAlignmentNotes: `AP Exam alignment:
- Always state hypotheses formally (H₀ and Hₐ)
- Check conditions before every inference procedure
- HARD questions involve multi-step investigative tasks or choosing the correct procedure`,
    stimulusRequirement: "Include a table of data, output from a statistical analysis, or a study description as stimulus",
    stimulusDescription: "data table, computer output, or study description (null if not needed)",
    explanationGuidance: "referencing the correct statistical procedure, conditions, and interpretation in context",
    collegeBoardLinks: [
      { label: "AP Statistics Course Overview", url: "https://apcentral.collegeboard.org/courses/ap-statistics" },
      { label: "Past FRQ Questions", url: "https://apcentral.collegeboard.org/courses/ap-statistics/exam/past-exam-questions" },
    ],
    difficultyRubric: {
      EASY: "Read a graph, identify a distribution, or recall a definition. 65%+ correct.",
      MEDIUM: "Multi-step inference: state hypotheses, check conditions, calculate, conclude. 40–55% correct.",
      HARD: "Choose the correct test, justify assumptions, or interpret simulation output. 25–40% correct.",
    },
    distractorTaxonomy: "(1) DIRECTION TRAP — one-tailed vs two-tailed confusion; (2) CONDITION SKIP TRAP — performs test without checking normality or independence; (3) INTERPRETATION TRAP — misinterprets confidence interval or p-value.",
    stimulusQualityGuidance: "GOOD: Computer regression output with coefficients and SE; two-way table of counts; dotplot with labeled scale. AVOID: Generic 'a study found' without data.",
    skillCodes: ["Selecting Statistical Methods", "Data Analysis", "Using Probability and Simulation", "Statistical Argumentation"],
    questionTypeFormats: {
      FRQ: {
        generationPrompt:
          "Generate a College Board AP Statistics Free Response Question. " +
          "Include a study description, data table, or computer output as stimulus. " +
          "Provide 2–4 labeled parts covering hypothesis testing, confidence intervals, or regression. " +
          "Require students to check conditions, perform calculations, and interpret results in context.",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"Full FRQ with parts", ' +
          '"stimulus":"data table or output", "correctAnswer":"Complete solution with H₀/Hₐ, conditions, work, conclusion", ' +
          '"explanation":"Point-by-point scoring with correct statistical reasoning"}',
        estimatedMinutes: 15,
      },
    },
  },

  // ── AP Chemistry ──────────────────────────────────────────────────────────
  AP_CHEMISTRY: {
    name: "AP Chemistry",
    shortName: "AP Chemistry",
    examSecsPerQuestion: 96, // 60 MCQ in 90 min
    mockExam: { mcqCount: 60, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    openStaxSubject: undefined,
    units: {
      CHEM_1_ATOMIC_STRUCTURE: {
        name: "Unit 1: Atomic Structure and Properties",
        keyThemes: ["mole concept", "mass spectroscopy", "electron configuration", "periodic trends", "photoelectron spectroscopy"],
        khanUrl: "https://www.khanacademy.org/science/ap-chemistry-beta/x2eef969c74e0d802:atomic-structure-and-properties",
        openStaxUrl: "https://openstax.org/books/chemistry-2e/pages/2-introduction",
        phetUrl: "https://phet.colorado.edu/en/simulation/build-an-atom",
      },
      CHEM_2_MOLECULAR_BONDING: {
        name: "Unit 2: Molecular and Ionic Compound Structure and Properties",
        keyThemes: ["Lewis structures", "VSEPR theory", "bond types", "hybridization", "resonance"],
        khanUrl: "https://www.khanacademy.org/science/ap-chemistry-beta/x2eef969c74e0d802:molecular-and-ionic-compound-structure-and-properties",
        openStaxUrl: "https://openstax.org/books/chemistry-2e/pages/7-introduction",
      },
      CHEM_3_INTERMOLECULAR_FORCES: {
        name: "Unit 3: Intermolecular Forces and Properties",
        keyThemes: ["IMFs", "London dispersion", "hydrogen bonding", "polarity", "solubility", "colligative properties"],
        khanUrl: "https://www.khanacademy.org/science/ap-chemistry-beta/x2eef969c74e0d802:intermolecular-forces-and-properties",
        openStaxUrl: "https://openstax.org/books/chemistry-2e/pages/10-introduction",
      },
      CHEM_4_CHEMICAL_REACTIONS: {
        name: "Unit 4: Chemical Reactions",
        keyThemes: ["stoichiometry", "reaction types", "net ionic equations", "precipitation", "acid-base neutralization", "redox"],
        khanUrl: "https://www.khanacademy.org/science/ap-chemistry-beta/x2eef969c74e0d802:chemical-reactions",
        openStaxUrl: "https://openstax.org/books/chemistry-2e/pages/4-introduction",
      },
      CHEM_5_KINETICS: {
        name: "Unit 5: Kinetics",
        keyThemes: ["rate law", "integrated rate laws", "activation energy", "Arrhenius equation", "reaction mechanisms", "catalysis"],
        khanUrl: "https://www.khanacademy.org/science/ap-chemistry-beta/x2eef969c74e0d802:kinetics",
        openStaxUrl: "https://openstax.org/books/chemistry-2e/pages/12-introduction",
      },
      CHEM_6_THERMODYNAMICS: {
        name: "Unit 6: Thermodynamics",
        keyThemes: ["enthalpy", "Hess's law", "bond enthalpies", "entropy", "Gibbs free energy", "spontaneity"],
        khanUrl: "https://www.khanacademy.org/science/ap-chemistry-beta/x2eef969c74e0d802:thermodynamics",
        openStaxUrl: "https://openstax.org/books/chemistry-2e/pages/5-introduction",
      },
      CHEM_7_EQUILIBRIUM: {
        name: "Unit 7: Equilibrium",
        keyThemes: ["K expression", "Q vs K", "Le Chatelier's principle", "Kp and Kc", "ICE tables"],
        khanUrl: "https://www.khanacademy.org/science/ap-chemistry-beta/x2eef969c74e0d802:equilibrium",
        openStaxUrl: "https://openstax.org/books/chemistry-2e/pages/13-introduction",
      },
      CHEM_8_ACIDS_BASES: {
        name: "Unit 8: Acids and Bases",
        keyThemes: ["Brønsted-Lowry", "Ka and Kb", "buffer solutions", "Henderson-Hasselbalch", "titration curves", "pKa"],
        khanUrl: "https://www.khanacademy.org/science/ap-chemistry-beta/x2eef969c74e0d802:acids-and-bases",
        openStaxUrl: "https://openstax.org/books/chemistry-2e/pages/14-introduction",
      },
      CHEM_9_ELECTROCHEMISTRY: {
        name: "Unit 9: Thermodynamics and Electrochemistry",
        keyThemes: ["entropy", "Gibbs free energy", "thermodynamic vs kinetic control", "free energy of dissolution", "coupled reactions", "galvanic and electrolytic cells", "cell potential and free energy", "Nernst equation", "electrolysis"],
        khanUrl: "https://www.khanacademy.org/science/ap-chemistry-beta/x2eef969c74e0d802:applications-of-thermodynamics",
        openStaxUrl: "https://openstax.org/books/chemistry-2e/pages/17-introduction",
        phetUrl: "https://phet.colorado.edu/en/simulation/circuit-construction-kit-dc",
      },
    },
    suggestedTutorQuestions: [
      "How do I draw a Lewis structure with formal charges?",
      "What is Le Chatelier's principle and how do I apply it?",
      "How do I determine reaction order from experimental data?",
      "What is the difference between ΔH and ΔG?",
      "How do I set up an ICE table for equilibrium?",
      "How do I calculate the pH of a buffer solution?",
    ],
    curriculumContext: `AP Chemistry covers:
- Unit 1: Atomic Structure — mole concept, electron config, periodic trends
- Unit 2: Bonding — Lewis structures, VSEPR, hybridization
- Unit 3: IMFs — polarity, solubility, colligative properties
- Unit 4: Chemical Reactions — stoichiometry, redox, precipitation
- Unit 5: Kinetics — rate laws, Arrhenius, mechanisms
- Unit 6: Thermodynamics — enthalpy, entropy, Gibbs free energy
- Unit 7: Equilibrium — K expressions, Le Chatelier, ICE tables
- Unit 8: Acids & Bases — Ka/Kb, buffers, titrations
- Unit 9: Thermodynamics and Electrochemistry — entropy, Gibbs free energy, cell potential, electrolysis (Fall 2024 CED title)

AP Exam: Section I — 60 MCQ (90 min). Section II — 7 FRQ (105 min).
Science Practices: Models, Math/Calculation, Experimental Design, Data Analysis, Argumentation.`,
    tutorResources: `
- Khan Academy AP Chemistry: Complete free course
- OpenStax Chemistry 2e (openstax.org): Free peer-reviewed textbook
- PhET Simulations (phet.colorado.edu): Acid-Base Solutions, Build an Atom, Reactions
- College Board AP Chemistry: Official practice exams and FRQ scoring guidelines`,
    examAlignmentNotes: `AP Exam alignment:
- Include stoichiometry calculations, equilibrium expressions, and titration curve interpretation
- HARD questions often require multi-step reasoning: combine thermodynamics + equilibrium, or kinetics + mechanism analysis`,
    stimulusRequirement: "Include molecular diagrams, reaction equations, data tables, or experimental setup descriptions as stimulus",
    stimulusDescription: "reaction equation, data table, molecular diagram, or experimental scenario",
    explanationGuidance: "referencing the relevant chemistry principle with correct equations, units, and significant figures",
    collegeBoardLinks: [
      { label: "AP Chemistry Course Overview", url: "https://apcentral.collegeboard.org/courses/ap-chemistry" },
      { label: "Past FRQ Questions", url: "https://apcentral.collegeboard.org/courses/ap-chemistry/exam/past-exam-questions" },
    ],
    difficultyRubric: {
      EASY: "Recall definition, identify compound type, or balance equation. 65%+ correct.",
      MEDIUM: "Multi-step: stoichiometry with limiting reagent, or ICE table calculation. 40–55% correct.",
      HARD: "Synthesis across two units, experimental design critique, or mechanistic analysis. 25–40% correct.",
    },
    distractorTaxonomy: "(1) SIGNIFICANT FIGURES TRAP — correct setup but wrong rounding; (2) EQUILIBRIUM DIRECTION TRAP — Q vs K confusion or Le Chatelier opposite effect; (3) UNIT TRAP — uses g instead of mol or forgets to convert pressure units.",
    stimulusQualityGuidance: "GOOD: Kinetics data table (concentration vs time); titration curve with labeled equivalence point; molecular diagram with partial charges. AVOID: Generic 'an experiment was done' without measurements.",
    skillCodes: ["Models and Representations", "Question and Method", "Representing Data and Phenomena", "Model Analysis", "Mathematical Routines", "Argumentation"],
    questionTypeFormats: {
      FRQ: {
        generationPrompt:
          "Generate a College Board AP Chemistry Free Response Question. " +
          "Include a reaction equation, data table, or molecular structure as stimulus. " +
          "Provide 3–5 labeled parts testing stoichiometry, thermodynamics, kinetics, equilibrium, or electrochemistry. " +
          "Require calculations, explanations, and predictions with justification.",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"Full FRQ with parts", ' +
          '"stimulus":"equation or data table", "correctAnswer":"Complete solutions with units and sig figs", ' +
          '"explanation":"Step-by-step with point allocation"}',
        estimatedMinutes: 15,
      },
    },
  },

  // ── AP Biology ────────────────────────────────────────────────────────────
  AP_BIOLOGY: {
    name: "AP Biology",
    shortName: "AP Biology",
    examSecsPerQuestion: 90, // 60 MCQ in 90 min
    mockExam: { mcqCount: 60, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    openStaxSubject: undefined,
    units: {
      BIO_1_CHEMISTRY_OF_LIFE: {
        name: "Unit 1: Chemistry of Life",
        keyThemes: ["water properties", "macromolecules", "functional groups", "enzymes", "activation energy"],
        khanUrl: "https://www.khanacademy.org/science/ap-biology/chemistry-of-life",
        openStaxUrl: "https://openstax.org/books/biology-2e/pages/2-introduction",
      },
      BIO_2_CELL_STRUCTURE_FUNCTION: {
        name: "Unit 2: Cell Structure and Function",
        keyThemes: ["prokaryotes vs eukaryotes", "cell organelles", "membrane transport", "osmosis", "endocytosis"],
        khanUrl: "https://www.khanacademy.org/science/ap-biology/cell-structure-and-function",
        openStaxUrl: "https://openstax.org/books/biology-2e/pages/4-introduction",
        phetUrl: "https://phet.colorado.edu/en/simulation/membrane-channels",
      },
      BIO_3_CELLULAR_ENERGETICS: {
        name: "Unit 3: Cellular Energetics",
        keyThemes: ["photosynthesis", "cellular respiration", "ATP synthesis", "glycolysis", "Krebs cycle", "electron transport chain"],
        khanUrl: "https://www.khanacademy.org/science/ap-biology/cellular-energetics",
        openStaxUrl: "https://openstax.org/books/biology-2e/pages/7-introduction",
        phetUrl: "https://phet.colorado.edu/en/simulation/photosynthesis",
      },
      BIO_4_CELL_COMMUNICATION: {
        name: "Unit 4: Cell Communication and Cell Cycle",
        keyThemes: ["signal transduction", "cell cycle", "mitosis", "apoptosis", "cancer", "feedback loops"],
        khanUrl: "https://www.khanacademy.org/science/ap-biology/cell-communication-and-cell-cycle",
        openStaxUrl: "https://openstax.org/books/biology-2e/pages/11-introduction",
      },
      BIO_5_HEREDITY: {
        name: "Unit 5: Heredity",
        keyThemes: ["Mendelian genetics", "meiosis", "chromosomal inheritance", "non-Mendelian genetics", "chi-square analysis"],
        khanUrl: "https://www.khanacademy.org/science/ap-biology/heredity",
        openStaxUrl: "https://openstax.org/books/biology-2e/pages/12-introduction",
      },
      BIO_6_GENE_EXPRESSION: {
        name: "Unit 6: Gene Expression and Regulation",
        keyThemes: ["DNA replication", "transcription", "translation", "mutations", "gene regulation", "biotechnology"],
        khanUrl: "https://www.khanacademy.org/science/ap-biology/gene-expression-and-regulation",
        openStaxUrl: "https://openstax.org/books/biology-2e/pages/16-introduction",
      },
      BIO_7_NATURAL_SELECTION: {
        name: "Unit 7: Natural Selection",
        keyThemes: ["natural selection", "Hardy-Weinberg", "speciation", "phylogenetics", "evidence of evolution"],
        khanUrl: "https://www.khanacademy.org/science/ap-biology/natural-selection",
        openStaxUrl: "https://openstax.org/books/biology-2e/pages/18-introduction",
      },
      BIO_8_ECOLOGY: {
        name: "Unit 8: Ecology",
        keyThemes: ["population growth", "carrying capacity", "community ecology", "energy flow", "biogeochemical cycles", "biomes"],
        khanUrl: "https://www.khanacademy.org/science/ap-biology/ecology",
        openStaxUrl: "https://openstax.org/books/biology-2e/pages/45-introduction",
      },
    },
    suggestedTutorQuestions: [
      "How does the electron transport chain produce ATP?",
      "What is the difference between transcription and translation?",
      "How does Hardy-Weinberg equilibrium work?",
      "What is signal transduction and why does it matter?",
      "How do I set up a chi-square test for genetic ratios?",
      "What factors affect population growth?",
    ],
    curriculumContext: `AP Biology covers:
- Unit 1: Chemistry of Life — macromolecules, enzymes, water
- Unit 2: Cell Structure — organelles, membranes, transport
- Unit 3: Cellular Energetics — photosynthesis, respiration, ATP
- Unit 4: Cell Communication — signal transduction, cell cycle, mitosis
- Unit 5: Heredity — Mendelian genetics, meiosis, chromosomes
- Unit 6: Gene Expression — DNA → RNA → protein, regulation, biotech
- Unit 7: Natural Selection — evolution, Hardy-Weinberg, phylogenetics
- Unit 8: Ecology — populations, communities, energy flow, cycles

AP Exam: Section I — 60 MCQ (90 min). Section II — 6 FRQ (90 min).
Science Practices: Models, Quantitative Skills, Experimental Design, Data Analysis, Argumentation.`,
    tutorResources: `
- Khan Academy AP Biology: Complete free course with all units
- OpenStax Biology 2e (openstax.org): Free peer-reviewed textbook
- PhET Simulations: Natural Selection, Membrane Channels, Photosynthesis
- Bozeman Science (YouTube): Outstanding AP Biology concept videos
- College Board AP Biology: Official practice exams and FRQ scoring`,
    examAlignmentNotes: `AP Exam alignment:
- Include data interpretation, experimental design critique, and mathematical reasoning (Hardy-Weinberg, population growth equations)
- HARD questions require multi-unit synthesis: combine evolution + genetics or energetics + ecology`,
    stimulusRequirement: "Include graphs, diagrams, data tables, or experimental descriptions as stimulus",
    stimulusDescription: "graph, molecular diagram, data table, or experimental scenario",
    explanationGuidance: "referencing the relevant biological process, mechanism, or equation with full reasoning",
    collegeBoardLinks: [
      { label: "AP Biology Course Overview", url: "https://apcentral.collegeboard.org/courses/ap-biology" },
      { label: "Past FRQ Questions", url: "https://apcentral.collegeboard.org/courses/ap-biology/exam/past-exam-questions" },
    ],
    difficultyRubric: {
      EASY: "Identify organelle function, name a process, or recall a definition. 65%+ correct.",
      MEDIUM: "Apply Mendelian ratios, read an energy diagram, or interpret a graph. 40–55% correct.",
      HARD: "Design an experiment, calculate Hardy-Weinberg frequencies, or synthesize across units. 25–40% correct.",
    },
    distractorTaxonomy: "(1) PROCESS CONFUSION TRAP — transcription vs translation or mitosis vs meiosis; (2) DIRECTION TRAP — energy input vs output in metabolic pathways; (3) LEVEL TRAP — individual vs population vs community responses.",
    stimulusQualityGuidance: "GOOD: ATP yield table for respiration; pedigree chart for inheritance; population growth curve with labeled K. AVOID: Generic 'a cell performs photosynthesis' without data.",
    skillCodes: ["Concept Application", "Visual Representation", "Data Analysis", "Scientific Reasoning", "Mathematical Analysis"],
    questionTypeFormats: {
      FRQ: {
        generationPrompt:
          "Generate a College Board AP Biology Free Response Question. " +
          "Include a graph, data table, or experimental design as stimulus. " +
          "Provide 3–5 labeled parts requiring explanation of mechanisms, data analysis, prediction with justification, or experimental critique.",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"Full FRQ with parts", ' +
          '"stimulus":"graph or table", "correctAnswer":"Complete answer with biological reasoning", ' +
          '"explanation":"Point-by-point scoring rubric"}',
        estimatedMinutes: 22,
      },
    },
  },

  // ── AP US History (APUSH) ─────────────────────────────────────────────────
  AP_US_HISTORY: {
    name: "AP US History",
    shortName: "AP US History",
    examSecsPerQuestion: 60, // 55 MCQ in 55 min
    mockExam: { mcqCount: 55, mcqTimeMinutes: 55 },
    enrichWithEduAPIs: true,
    openStaxSubject: undefined,
    units: {
      APUSH_1_PERIOD_1491_1607: {
        name: "Unit 1: Period 1 — 1491–1607",
        timePeriod: "1491–1607",
        keyThemes: ["Native American societies", "European exploration", "Columbian Exchange", "early contact"],
        khanUrl: "https://www.khanacademy.org/humanities/us-history/precontact-and-early-colonial-era",
        digUrl: "https://sheg.stanford.edu/history-lessons/american-history",
        worldHistoryUrl: "https://www.loc.gov/classroom-materials/united-states-history-primary-source-timeline/colonial-settlement-1600-1763/",
      },
      APUSH_2_PERIOD_1607_1754: {
        name: "Unit 2: Period 2 — 1607–1754",
        timePeriod: "1607–1754",
        keyThemes: ["colonial economies", "slavery", "indentured servitude", "British mercantilism", "Great Awakening"],
        khanUrl: "https://www.khanacademy.org/humanities/us-history/colonial-america",
        digUrl: "https://sheg.stanford.edu/history-lessons",
      },
      APUSH_3_PERIOD_1754_1800: {
        name: "Unit 3: Period 3 — 1754–1800",
        timePeriod: "1754–1800",
        keyThemes: ["American Revolution", "Articles of Confederation", "Constitution", "Federalism", "Early Republic"],
        khanUrl: "https://www.khanacademy.org/humanities/us-history/road-to-revolution",
        worldHistoryUrl: "https://www.loc.gov/classroom-materials/united-states-history-primary-source-timeline/the-american-revolution-1763-1783/",
      },
      APUSH_4_PERIOD_1800_1848: {
        name: "Unit 4: Period 4 — 1800–1848",
        timePeriod: "1800–1848",
        keyThemes: ["Jacksonian democracy", "Market Revolution", "reform movements", "Manifest Destiny", "sectional tensions"],
        khanUrl: "https://www.khanacademy.org/humanities/us-history/the-early-republic",
        worldHistoryUrl: "https://www.loc.gov/classroom-materials/united-states-history-primary-source-timeline/national-expansion-and-reform-1815-1880/",
      },
      APUSH_5_PERIOD_1844_1877: {
        name: "Unit 5: Period 5 — 1844–1877",
        timePeriod: "1844–1877",
        keyThemes: ["Civil War causes", "slavery and sectionalism", "Emancipation", "Reconstruction", "13th/14th/15th Amendments"],
        khanUrl: "https://www.khanacademy.org/humanities/us-history/civil-war-era",
        worldHistoryUrl: "https://www.loc.gov/classroom-materials/united-states-history-primary-source-timeline/civil-war-and-reconstruction-1861-1877/",
      },
      APUSH_6_PERIOD_1865_1898: {
        name: "Unit 6: Period 6 — 1865–1898",
        timePeriod: "1865–1898",
        keyThemes: ["Gilded Age", "industrialization", "immigration", "Populism", "Jim Crow", "West settlement"],
        khanUrl: "https://www.khanacademy.org/humanities/us-history/the-gilded-age",
        worldHistoryUrl: "https://www.loc.gov/classroom-materials/united-states-history-primary-source-timeline/rise-of-industrial-america-1876-1900/",
      },
      APUSH_7_PERIOD_1890_1945: {
        name: "Unit 7: Period 7 — 1890–1945",
        timePeriod: "1890–1945",
        keyThemes: ["Progressive Era", "World War I", "Great Depression", "New Deal", "World War II"],
        khanUrl: "https://www.khanacademy.org/humanities/us-history/rise-to-world-power",
        worldHistoryUrl: "https://www.loc.gov/classroom-materials/united-states-history-primary-source-timeline/progressive-era-to-new-era-1900-1929/",
      },
      APUSH_8_PERIOD_1945_1980: {
        name: "Unit 8: Period 8 — 1945–1980",
        timePeriod: "1945–1980",
        keyThemes: ["Cold War", "Korean War", "Civil Rights Movement", "Vietnam", "Great Society", "counterculture"],
        khanUrl: "https://www.khanacademy.org/humanities/us-history/postwar-era",
        worldHistoryUrl: "https://www.loc.gov/classroom-materials/united-states-history-primary-source-timeline/post-world-war-ii-1945-1968/",
      },
      APUSH_9_PERIOD_1980_PRESENT: {
        name: "Unit 9: Period 9 — 1980–Present",
        timePeriod: "1980–Present",
        keyThemes: ["Reagan Revolution", "end of Cold War", "globalization", "culture wars", "September 11", "digital age"],
        khanUrl: "https://www.khanacademy.org/humanities/us-history/us-history-overview-2",
        worldHistoryUrl: "https://www.loc.gov/classroom-materials/",
      },
    },
    suggestedTutorQuestions: [
      "What were the main causes of the Civil War?",
      "How did Reconstruction succeed and fail?",
      "What was the significance of the New Deal?",
      "How did the Cold War shape domestic US policy?",
      "What factors led to the Civil Rights Movement?",
      "How do I write a strong APUSH LEQ thesis?",
    ],
    curriculumContext: `AP US History covers:
- Unit 1: Native America and Early Contact (1491–1607)
- Unit 2: Colonial America (1607–1754) — economies, slavery, religion
- Unit 3: Revolution and Early Republic (1754–1800)
- Unit 4: Expansion and Reform (1800–1848) — Jackson, Market Revolution, Manifest Destiny
- Unit 5: Sectionalism and Civil War (1844–1877)
- Unit 6: Gilded Age (1865–1898) — industrialization, immigration, Populism
- Unit 7: Progressive Era through World War II (1890–1945)
- Unit 8: Cold War America (1945–1980) — Civil Rights, Vietnam, Great Society
- Unit 9: Recent US History (1980–Present) — Reagan, globalization, September 11

AP Exam: Section I — 55 MCQ + 3 SAQ (95 min). Section II — 1 DBQ + 1 LEQ (100 min).
Historical Thinking Skills: Argumentation, Causation, Comparison, CCOT, Contextualization.`,
    tutorResources: `
- Khan Academy AP US History: Free videos for all periods
- Library of Congress Primary Sources (loc.gov): Documents, photographs, maps for DBQ practice
- Digital Inquiry Group / Stanford History (sheg.stanford.edu): "Reading Like a Historian" lessons
- Heimler's History (YouTube): Excellent review videos for all APUSH periods
- College Board AP US History: Official practice exams and FRQ scoring guidelines`,
    examAlignmentNotes: `AP Exam alignment:
- MCQ questions always have a primary source stimulus (document, image, map, or chart)
- SAQ requires 3-part responses referencing historical evidence
- DBQ requires thesis, contextualization, 6 document analysis, and outside evidence
- LEQ requires causation, comparison, or CCOT argument with specific evidence`,
    stimulusRequirement: "Include a primary source excerpt, political cartoon description, map description, or data chart as stimulus",
    stimulusDescription: "primary source excerpt, political cartoon, map, or data chart",
    explanationGuidance: "referencing the historical context, causation, or significance with specific evidence",
    collegeBoardLinks: [
      { label: "AP US History Course Overview", url: "https://apcentral.collegeboard.org/courses/ap-united-states-history" },
      { label: "Course & Exam Description", url: "https://apcentral.collegeboard.org/media/pdf/ap-us-history-course-and-exam-description.pdf" },
      { label: "Past Exam Questions", url: "https://apcentral.collegeboard.org/courses/ap-united-states-history/exam/past-exam-questions" },
    ],
    difficultyRubric: {
      EASY: "Identify a key event, person, or policy from a description. 65%+ correct.",
      MEDIUM: "Analyze causation or context from a primary source; describe significance across periods. 40–55% correct.",
      HARD: "Evaluate historical argument, compare perspectives, or construct essay outline with specific evidence. 25–40% correct.",
    },
    distractorTaxonomy: "(1) CHRONOLOGY TRAP — correct event but wrong time period; (2) CAUSATION REVERSAL TRAP — effect stated as cause; (3) SIMILAR EVENT TRAP — confuses analogous events from different periods (e.g., two reform movements).",
    stimulusQualityGuidance: "GOOD: Actual speech excerpt or editorial cartoon description with date and author; data table of immigration statistics; map with labeled regions. AVOID: Generic 'a historian wrote' without attribution.",
    skillCodes: ["Argumentation", "Causation", "Comparison", "Continuity and Change Over Time", "Contextualization"],
    questionTypeFormats: {
      SAQ: {
        generationPrompt:
          "Generate a College Board AP US History Short Answer Question (SAQ). " +
          "Include a primary source, secondary source excerpt, or image description as stimulus. " +
          "Provide THREE labeled parts (A), (B), (C): describe evidence, explain causation/effect, and connect to broader context. " +
          "Each part requires 2–4 sentences of evidence-based writing.",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"Full 3-part SAQ with (A)(B)(C)", ' +
          '"stimulus":"primary source excerpt or image description", ' +
          '"correctAnswer":"Sample responses for all three parts with specific historical evidence", ' +
          '"explanation":"Scoring rubric: 1 point each for A, B, C. Must use specific evidence."}',
        estimatedMinutes: 15,
      },
      DBQ: {
        generationPrompt:
          "Generate a College Board AP US History Document-Based Question (DBQ) PROMPT (not full document set). " +
          "Include historical context paragraph, the essay question asking students to evaluate extent of a development, " +
          "and descriptions of 4–5 types of documents a student would analyze. " +
          "Focus on turning points: Revolution, Civil War, Progressive Era, New Deal, or Cold War.",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"DBQ prompt with context + question", ' +
          '"stimulus":"Historical context paragraph (2-3 sentences)", ' +
          '"correctAnswer":"Sample thesis and 3-sentence argument outline referencing documents", ' +
          '"explanation":"Rubric: thesis (1pt), context (1pt), evidence (3pt), analysis (3pt), complexity (1pt)"}',
        estimatedMinutes: 60,
      },
      LEQ: {
        generationPrompt:
          "Generate a College Board AP US History Long Essay Question (LEQ). " +
          "Use one of: causation, comparison, or continuity and change over time. " +
          "Specify a clear time period and require argument supported by specific evidence. " +
          "Choose a significant turning point or transformation in US history.",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"LEQ prompt with time period", ' +
          '"stimulus":null, "correctAnswer":"Sample thesis with 3-sentence argument outline", ' +
          '"explanation":"Rubric: thesis (1pt), context (1pt), evidence (2pt), argument (2pt), complexity (1pt)"}',
        estimatedMinutes: 40,
      },
    },
  },

  // ── AP Psychology ─────────────────────────────────────────────────────────
  AP_PSYCHOLOGY: {
    name: "AP Psychology",
    shortName: "AP Psychology",
    // Confirmed against apcentral.collegeboard.org/courses/ap-psychology/exam
    // (2025-26 redesigned format):
    //   Section I  — 75 MCQ / 90 min (66.7% of score)
    //   Section II — 1 AAQ + 1 EBQ / 70 min (33.3% of score)
    examSecsPerQuestion: 72, // 75 MCQ in 90 min = 72s/q
    mockExam: { mcqCount: 75, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    openStaxSubject: undefined,
    units: {
      PSYCH_1_SCIENTIFIC_FOUNDATIONS: {
        name: "Unit 1: Scientific Foundations of Psychology",
        keyThemes: ["history of psychology", "research methods", "statistics", "ethics", "major perspectives"],
        khanUrl: "https://www.khanacademy.org/science/ap-psychology/history-and-approaches-to-psychology-ap",
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/1-introduction",
      },
      PSYCH_2_BIOLOGICAL_BASES: {
        name: "Unit 2: Biological Bases of Behavior",
        keyThemes: ["neurons", "neurotransmitters", "brain structures", "hemispheres", "genetics and behavior", "nervous system"],
        khanUrl: "https://www.khanacademy.org/science/ap-psychology/biological-bases-of-behavior-ap",
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/3-introduction",
      },
      PSYCH_3_SENSATION_PERCEPTION: {
        name: "Unit 3: Sensation and Perception",
        keyThemes: ["signal detection", "sensory thresholds", "visual processing", "perceptual constancy", "Gestalt principles"],
        khanUrl: "https://www.khanacademy.org/science/ap-psychology/sensation-perception-ap",
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/5-introduction",
      },
      PSYCH_4_LEARNING: {
        name: "Unit 4: Learning",
        keyThemes: ["classical conditioning", "operant conditioning", "reinforcement schedules", "observational learning", "behavior modification"],
        khanUrl: "https://www.khanacademy.org/science/ap-psychology/learning-ap",
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/6-introduction",
      },
      PSYCH_5_COGNITION: {
        name: "Unit 5: Cognitive Psychology",
        keyThemes: ["memory types", "encoding and retrieval", "forgetting", "problem solving", "language", "heuristics and biases"],
        khanUrl: "https://www.khanacademy.org/science/ap-psychology/memory-ap",
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/8-introduction",
      },
      PSYCH_6_DEVELOPMENTAL: {
        name: "Unit 6: Developmental Psychology",
        keyThemes: ["Piaget's stages", "Erikson's stages", "attachment theory", "temperament", "adolescence", "aging"],
        khanUrl: "https://www.khanacademy.org/science/ap-psychology/developmental-psychology-ap",
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/9-introduction",
      },
      PSYCH_7_MOTIVATION_EMOTION: {
        name: "Unit 7: Motivation, Emotion, and Personality",
        keyThemes: ["Maslow's hierarchy", "drive reduction", "emotions", "stress", "personality theories", "trait theory"],
        khanUrl: "https://www.khanacademy.org/science/ap-psychology/motivation-and-emotion-ap",
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/10-introduction",
      },
      PSYCH_8_CLINICAL: {
        name: "Unit 8: Clinical Psychology",
        keyThemes: ["psychological disorders", "DSM-5", "anxiety", "mood disorders", "schizophrenia", "therapies", "biomedical treatments"],
        khanUrl: "https://www.khanacademy.org/science/ap-psychology/psychological-disorders-ap",
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/15-introduction",
      },
      PSYCH_9_SOCIAL: {
        name: "Unit 9: Social Psychology",
        keyThemes: ["attribution", "conformity", "obedience", "groupthink", "prejudice", "aggression", "altruism", "attitudes"],
        khanUrl: "https://www.khanacademy.org/science/ap-psychology/social-psychology-ap",
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/12-introduction",
      },
    },
    suggestedTutorQuestions: [
      "What is the difference between classical and operant conditioning?",
      "How does Piaget's theory of cognitive development work?",
      "What brain structures are associated with memory?",
      "What is the difference between positive and negative reinforcement?",
      "How do psychologists explain conformity?",
      "What is the difference between the DSM-5 categories of anxiety disorders?",
    ],
    curriculumContext: `AP Psychology covers:
- Unit 1: Scientific Foundations — research methods, history, statistics
- Unit 2: Biological Bases — neurons, neurotransmitters, brain anatomy
- Unit 3: Sensation & Perception — thresholds, visual/auditory processing
- Unit 4: Learning — classical/operant conditioning, observational learning
- Unit 5: Cognition — memory, problem solving, language, biases
- Unit 6: Development — Piaget, Erikson, attachment, lifespan
- Unit 7: Motivation & Personality — Maslow, emotions, trait theories
- Unit 8: Clinical — DSM-5 disorders, therapies, medications
- Unit 9: Social — attribution, conformity, obedience, prejudice

AP Exam: Section I — 100 MCQ (70 min). Section II — 2 FRQ (50 min).`,
    tutorResources: `
- Khan Academy AP Psychology: Complete free course
- OpenStax Psychology 2e (openstax.org): Free peer-reviewed textbook
- Crash Course Psychology (YouTube): Engaging unit-by-unit videos
- Simplypsychology.org: Concise summaries of studies and theories
- College Board AP Psychology: Official practice exams and FRQ scoring`,
    examAlignmentNotes: `AP Exam alignment:
- MCQ tests vocabulary recall, application of theories, and research interpretation
- FRQ requires defining terms in context AND applying concepts to a scenario
- HARD questions apply multiple theories or analyze a described study's validity`,
    stimulusRequirement: "Include a scenario, case study description, or experiment description as stimulus",
    stimulusDescription: "scenario description, case study, or research study description (null for pure definition questions)",
    explanationGuidance: "referencing the correct psychological theory, researcher, or mechanism with application to the scenario",
    collegeBoardLinks: [
      { label: "AP Psychology Course Overview", url: "https://apcentral.collegeboard.org/courses/ap-psychology" },
      { label: "Past Exam Questions", url: "https://apcentral.collegeboard.org/courses/ap-psychology/exam/past-exam-questions" },
    ],
    difficultyRubric: {
      EASY: "Recall a definition, identify a conditioning type, or match researcher to theory. 65%+ correct.",
      MEDIUM: "Apply a theory to a scenario (e.g., 'which reinforcement schedule is this?'); identify disorder from symptoms. 40–55% correct.",
      HARD: "Evaluate research design, apply multiple theories to a complex case, or design an ethical study. 25–40% correct.",
    },
    distractorTaxonomy: "(1) TERMINOLOGY TRAP — similar-sounding terms (negative reinforcement vs punishment); (2) RESEARCHER TRAP — correct concept but wrong theorist; (3) DIRECTION TRAP — confuses acquisition with extinction or encoding with retrieval.",
    stimulusQualityGuidance: "GOOD: Scenario describing a specific behavior pattern needing diagnosis; experiment with IV/DV for methodology questions; case study for application of learning theories. AVOID: Abstract questions without behavioral context.",
    skillCodes: ["Concept Understanding", "Research Methods", "Data Interpretation", "Concept Application", "Experimental Design"],
    questionTypeFormats: {
      FRQ: {
        generationPrompt:
          "Generate a College Board AP Psychology Free Response Question. " +
          "Provide a scenario or case study as stimulus. " +
          "Ask students to: (1) define 4–6 psychological terms in context, and (2) apply those terms to explain the scenario. " +
          "Include concepts from 2–3 different AP Psychology units.",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"FRQ with scenario + required concepts", ' +
          '"stimulus":"case study or scenario description", ' +
          '"correctAnswer":"Definitions of all required terms + application to scenario", ' +
          '"explanation":"1 point per correct definition in context + 1 point per correct application"}',
        estimatedMinutes: 25,
      },
    },
  },

  // ── AP Human Geography ────────────────────────────────────────────────────
  // 2026 catalog expansion. CED source: https://apcentral.collegeboard.org —
  // exam format is 60 MCQ / 60 min + 3 FRQ / 75 min. Unit weights from CB
  // 2022 CED. Per-Q MCQ pace = 60s. FRQ types: Q1 no-stim concept (6pts),
  // Q2 single stimulus (7pts), Q3 two-stimulus (7pts) → 20 pts total.
  AP_HUMAN_GEOGRAPHY: {
    name: "AP Human Geography",
    shortName: "AP HuGeo",
    hidden: false, // 2026-04-22 — flipped after Phase C populated 500 MCQs
    examSecsPerQuestion: 60, // 60 MCQ in 60 min
    mockExam: { mcqCount: 60, mcqTimeMinutes: 60 },
    enrichWithEduAPIs: true,
    questionTypeFormats: {
      MCQ: {
        generationPrompt:
          "Generate a College Board AP Human Geography MCQ. The question must be " +
          "grounded in the CED and test a specific content standard (e.g., demographic " +
          "transition model, Christaller's central place theory, Von Thunen land-use, " +
          "Weber's industrial location, rostow's stages of economic development, " +
          "the gravity model, Ravenstein's laws). " +
          "Often include a stimulus: map, chart, graph, data table, or excerpt. " +
          "Three wrong answers must each represent a realistic student misconception " +
          "(common confusion with related concepts, inverted cause/effect, or " +
          "conflating two theories). " +
          "Single unambiguous correct answer only. Distractors plausible-but-wrong.",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"question stem", "stimulus":"map/chart/excerpt text or null", ' +
          '"wikiImageTopic":"e.g., Demographic transition, Central place theory, or null", ' +
          '"apSkill":"Spatial Patterns | Scale Analysis | Data Analysis | Source Analysis | Geographic Models", ' +
          '"bloomLevel":"remember | apply | analyze", ' +
          '"options":["A) ...","B) ...","C) ...","D) ..."], "correctAnswer":"A", ' +
          '"explanation":"Why correct + why each distractor is wrong, citing CED content standard"}',
        estimatedMinutes: 1,
      },
      FRQ: {
        generationPrompt:
          "Generate a College Board AP Human Geography FRQ. Three valid FRQ shapes: " +
          "(i) Q1 no-stimulus concept application (6 pts, parts A-C); " +
          "(ii) Q2 single-stimulus (map/chart/image) analysis (7 pts, parts A-D); " +
          "(iii) Q3 two-stimulus comparison (7 pts, parts A-E). " +
          "Each lettered part asks for Describe / Explain / Compare / Apply. " +
          "Scoring: 1 pt per part, graded against model responses.",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"Full FRQ prompt with lettered parts (A)(B)(C)...", ' +
          '"stimulus":"stimulus text or null for Q1-style", ' +
          '"correctAnswer":"Complete model response for each part", ' +
          '"explanation":"Rubric — what earns each point per part"}',
        estimatedMinutes: 25,
      },
    },
    units: {
      HUGEO_1_THINKING_GEOGRAPHICALLY: {
        name: "Unit 1: Thinking Geographically",
        keyThemes: ["Maps & projections", "Spatial concepts", "Types of regions", "Scales of analysis", "Geographic data"],
        fiveableUrl: "https://library.fiveable.me/ap-hug/unit-1",
        khanPlaylistId: "PLCspJkUtmbZHYFsrpvmoDv_ii5ujUK7Pi",
      },
      HUGEO_2_POPULATION_MIGRATION: {
        name: "Unit 2: Population and Migration Patterns",
        keyThemes: ["Population distribution", "Demographic transition model", "Malthusian theory", "Ravenstein's laws", "Push & pull factors"],
        fiveableUrl: "https://library.fiveable.me/ap-hug/unit-2",
        khanPlaylistId: "PLCspJkUtmbZHYFsrpvmoDv_ii5ujUK7Pi",
      },
      HUGEO_3_CULTURAL_PATTERNS: {
        name: "Unit 3: Cultural Patterns and Processes",
        keyThemes: ["Cultural landscapes", "Language diffusion", "Religion distribution", "Cultural diffusion types", "Globalization of culture"],
        fiveableUrl: "https://library.fiveable.me/ap-hug/unit-3",
        khanPlaylistId: "PLCspJkUtmbZHYFsrpvmoDv_ii5ujUK7Pi",
      },
      HUGEO_4_POLITICAL_PATTERNS: {
        name: "Unit 4: Political Patterns and Processes",
        keyThemes: ["States, nations, nation-states", "Boundaries & geopolitics", "Centripetal & centrifugal forces", "Devolution", "Supranational organizations"],
        fiveableUrl: "https://library.fiveable.me/ap-hug/unit-4",
        khanPlaylistId: "PLCspJkUtmbZHYFsrpvmoDv_ii5ujUK7Pi",
      },
      HUGEO_5_AGRICULTURE_RURAL: {
        name: "Unit 5: Agriculture and Rural Land-Use",
        keyThemes: ["Agricultural revolutions", "Von Thunen model", "Intensive vs extensive", "Agribusiness", "Food security"],
        fiveableUrl: "https://library.fiveable.me/ap-hug/unit-5",
        khanPlaylistId: "PLCspJkUtmbZHYFsrpvmoDv_ii5ujUK7Pi",
      },
      HUGEO_6_URBAN_LAND_USE: {
        name: "Unit 6: Cities and Urban Land-Use",
        keyThemes: ["Christaller's central place theory", "Rank-size rule & primate cities", "Burgess concentric, Hoyt sector, Harris-Ullman models", "Urban sprawl & gentrification", "Sustainability"],
        fiveableUrl: "https://library.fiveable.me/ap-hug/unit-6",
        khanPlaylistId: "PLCspJkUtmbZHYFsrpvmoDv_ii5ujUK7Pi",
      },
      HUGEO_7_INDUSTRIAL_ECONOMIC: {
        name: "Unit 7: Industrial and Economic Development",
        keyThemes: ["Weber's industrial location", "Rostow's stages", "Wallerstein's world-systems", "Economic sectors", "Women & development (GII)"],
        fiveableUrl: "https://library.fiveable.me/ap-hug/unit-7",
        khanPlaylistId: "PLCspJkUtmbZHYFsrpvmoDv_ii5ujUK7Pi",
      },
    },
    suggestedTutorQuestions: [
      "Explain the demographic transition model and give a country example for each stage",
      "Compare Christaller's central place theory with Burgess's concentric zone model",
      "How do centripetal and centrifugal forces affect state cohesion?",
      "What are the differences between Ravenstein's push and pull migration factors?",
      "Describe Wallerstein's world-systems theory with core, semi-periphery, periphery examples",
    ],
    curriculumContext: `
AP Human Geography is a yearlong introductory college course on the spatial
patterns of human activity. The exam is 60 MCQs (60 min, 50% score) + 3 FRQs
(75 min, 50% score).

Unit weights on the exam (CED 2022):
  Unit 1 Thinking Geographically — 8–10%
  Unit 2 Population & Migration — 12–17%
  Unit 3 Cultural Patterns & Processes — 12–17%
  Unit 4 Political Patterns & Processes — 12–17%
  Unit 5 Agriculture & Rural Land-Use — 12–17%
  Unit 6 Cities & Urban Land-Use — 12–17%
  Unit 7 Industrial & Economic Development — 12–17%

Core skills assessed: interpreting spatial patterns, analyzing scale (local →
regional → global), reading maps/charts/data, applying geographic models
(DTM, Von Thunen, Christaller, Weber, Rostow, Wallerstein), and comparing
geographic concepts across regions.
    `.trim(),
    tutorResources: `
- Fiveable AP HuGeo — https://library.fiveable.me/ap-hug
- Khan Academy AP Human Geography — dedicated playlist with unit videos
- Mr. Sinn YouTube — full CED walkthroughs
- CB AP Central — official released FRQs (2022–2025) for self-grading
- National Geographic Education — spatial-thinking concepts + case studies
    `.trim(),
    examAlignmentNotes: `AP Human Geography exam alignment:
- 60 MCQs include stimulus-based sets (map/chart/excerpt + 2–3 Qs each) and stand-alone concept Qs
- Questions test CED-defined content standards, not memorization of country trivia
- Distractors should reflect common misconceptions: confusing DTM stages, conflating Weber with Von Thunen, assuming rank-size rule == primate city
- FRQs require defined terminology + specific examples + causal reasoning; no thesis essay format
- Each FRQ part earns 1 point from a rubric; partial credit common when reasoning is clear but example is wrong`,
    stimulusRequirement: "When appropriate, include a stimulus: a map description (choropleth / dot-density / flow), a data table (population pyramid, DTM-stage table), a chart (rank-size graph, Lorenz curve), or a brief excerpt from a geographer (Sauer, Hagerstrand, Castells). Stimuli should be analyzable without requiring external data lookups.",
    stimulusDescription: "Concrete text-only description of a map/chart/excerpt that the question interprets. Null if the question is concept-only.",
    explanationGuidance: "Explanations should name the CED content standard (e.g., 'CED 2.2.A Population distribution'), identify which AP Geography skill was tested (Spatial Patterns / Scale / Data / Source / Models), cite the specific geographer or model when applicable, and explain WHY each distractor is wrong — not just that it's wrong.",
  },

  // ── AP U.S. Government and Politics ───────────────────────────────────────
  // 2026 catalog expansion. Format: 55 MCQ / 80 min + 4 FRQs / 100 min.
  // Unit weights from CB 2019 CED. FRQ types are distinctive: Concept
  // Application (3 pts), Quantitative Analysis (4 pts), SCOTUS Case
  // Comparison (4 pts), Argument Essay (6 pts).
  AP_US_GOVERNMENT: {
    name: "AP U.S. Government and Politics",
    shortName: "AP US Gov",
    hidden: false, // 2026-04-23 — flipped after Phase C crossed the 300+ threshold
    examSecsPerQuestion: 87, // 55 MCQ in 80 min = 87s each
    mockExam: { mcqCount: 55, mcqTimeMinutes: 80 },
    enrichWithEduAPIs: true,
    questionTypeFormats: {
      MCQ: {
        generationPrompt:
          "Generate a College Board AP US Government MCQ. Test a specific CED " +
          "content standard. Stimuli are common: excerpts from foundational " +
          "documents (Constitution, Federalist/Anti-Federalist papers, MLK's " +
          "Letter from Birmingham Jail, SCOTUS opinions), visual sources " +
          "(political cartoons, maps, data tables on turnout/polling), or " +
          "quantitative data (line chart, bar graph). " +
          "Three wrong answers each represent a common misconception " +
          "(confusing enumerated vs implied powers, formal vs informal " +
          "amendment, federalism misreading). Single unambiguous answer.",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"question stem", "stimulus":"source excerpt or chart description or null", ' +
          '"wikiImageTopic":"e.g., Federalist Papers, McCulloch v. Maryland, or null", ' +
          '"apSkill":"Concept Application | SCOTUS Case | Data Analysis | Source Analysis | Argumentation", ' +
          '"bloomLevel":"remember | apply | analyze", ' +
          '"options":["A) ...","B) ...","C) ...","D) ..."], "correctAnswer":"A", ' +
          '"explanation":"Why correct + why each distractor wrong, citing CED standard and relevant foundational document/case"}',
        estimatedMinutes: 1,
      },
      FRQ: {
        generationPrompt:
          "Generate a College Board AP US Government FRQ. Four valid shapes: " +
          "(i) Concept Application — scenario + parts A-C testing 3 different " +
          "concepts (3 pts); (ii) Quantitative Analysis — data source + parts " +
          "A-D interpreting it (4 pts); (iii) SCOTUS Case Comparison — a " +
          "non-required case + parts A-C comparing it to a required case " +
          "(4 pts); (iv) Argument Essay — thesis defending a position using " +
          "two required foundational documents (6 pts). " +
          "Required foundational documents: Declaration of Independence, " +
          "Articles of Confederation, Constitution, Brutus No. 1, " +
          "Federalist 10/51/70/78, MLK Letter from Birmingham Jail. " +
          "Required SCOTUS cases: Marbury v. Madison, McCulloch v. Maryland, " +
          "US v. Lopez, Engel v. Vitale, Wisconsin v. Yoder, Tinker v. Des " +
          "Moines, NYT v. US, Schenck v. US, Gideon v. Wainwright, Roe v. " +
          "Wade (historical), McDonald v. Chicago, Brown v. Board, Citizens " +
          "United v. FEC, Baker v. Carr, Shaw v. Reno.",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"Full FRQ prompt with lettered parts", ' +
          '"stimulus":"scenario/data/case excerpt or null", "correctAnswer":"Complete model response", ' +
          '"explanation":"Rubric — what earns each point"}',
        estimatedMinutes: 25,
      },
    },
    units: {
      USGOV_1_FOUNDATIONS: {
        name: "Unit 1: Foundations of American Democracy",
        keyThemes: ["Declaration of Independence", "Articles of Confederation", "Constitution ratification", "Federalism", "Separation of powers"],
        fiveableUrl: "https://library.fiveable.me/ap-gov/unit-1",
        khanPlaylistId: "PLSQl0a2vh4HCbqUz4B1IBHGWOLcbsCx0r",
      },
      USGOV_2_INTERACTIONS_BRANCHES: {
        name: "Unit 2: Interactions Among Branches of Government",
        keyThemes: ["Congress (structure, powers, committees)", "Presidency (formal & informal powers)", "Federal judiciary (judicial review)", "Bureaucracy (iron triangles, rulemaking)", "Checks & balances"],
        fiveableUrl: "https://library.fiveable.me/ap-gov/unit-2",
        khanPlaylistId: "PLSQl0a2vh4HCbqUz4B1IBHGWOLcbsCx0r",
      },
      USGOV_3_CIVIL_LIBERTIES_RIGHTS: {
        name: "Unit 3: Civil Liberties and Civil Rights",
        keyThemes: ["Bill of Rights (1st, 2nd, 4th, 5th, 6th, 8th)", "Incorporation doctrine", "Equal Protection Clause", "Selective incorporation cases", "Civil rights movement"],
        fiveableUrl: "https://library.fiveable.me/ap-gov/unit-3",
        khanPlaylistId: "PLSQl0a2vh4HCbqUz4B1IBHGWOLcbsCx0r",
      },
      USGOV_4_IDEOLOGIES_BELIEFS: {
        name: "Unit 4: American Political Ideologies and Beliefs",
        keyThemes: ["Liberal vs conservative ideologies", "Core American values", "Political socialization", "Public opinion polling", "Voting behavior correlates"],
        fiveableUrl: "https://library.fiveable.me/ap-gov/unit-4",
        khanPlaylistId: "PLSQl0a2vh4HCbqUz4B1IBHGWOLcbsCx0r",
      },
      USGOV_5_POLITICAL_PARTICIPATION: {
        name: "Unit 5: Political Participation",
        keyThemes: ["Voting rights & turnout", "Political parties (realignment, polarization)", "Interest groups (pluralism, free-rider)", "Campaign finance (Citizens United)", "Media & elections"],
        fiveableUrl: "https://library.fiveable.me/ap-gov/unit-5",
        khanPlaylistId: "PLSQl0a2vh4HCbqUz4B1IBHGWOLcbsCx0r",
      },
    },
    suggestedTutorQuestions: [
      "Explain the difference between enumerated, implied, and inherent powers of Congress",
      "How did McCulloch v. Maryland expand federal power over states?",
      "Compare Federalist 10 and Brutus No. 1 on factions",
      "What are the differences between selective and total incorporation?",
      "How did Citizens United v. FEC change campaign finance?",
    ],
    curriculumContext: `
AP U.S. Government and Politics is a college-level introductory course on
American political institutions, behaviors, and ideologies. Exam: 55 MCQ
(80 min, 50% score) + 4 FRQs (100 min, 50% score).

Unit weights (CED 2019):
  Unit 1 Foundations — 15–22%
  Unit 2 Interactions Among Branches — 25–36%
  Unit 3 Civil Liberties & Civil Rights — 13–18%
  Unit 4 Ideologies & Beliefs — 10–15%
  Unit 5 Political Participation — 20–27%

Required content (tested directly):
  9 foundational documents — Dec Independence, Articles, Constitution,
  Federalist 10/51/70/78, Brutus No. 1, MLK Letter from Birmingham Jail
  15 required SCOTUS cases — from Marbury v Madison to Baker v Carr

Skills: Concept Application, SCOTUS Case Analysis, Data Analysis, Source
Analysis, Argumentation.
    `.trim(),
    tutorResources: `
- Fiveable AP Gov — https://library.fiveable.me/ap-gov
- Khan Academy AP US Government — dedicated playlist per CED unit
- Oyez.org — authoritative SCOTUS case briefs with audio
- Constitution Annotated (congress.gov) — authoritative document commentary
- CB AP Central — released FRQs 2023-2025 for self-grading
    `.trim(),
    examAlignmentNotes: `AP US Government exam alignment:
- 55 MCQs blend source-based sets (document excerpt + 2-3 Qs) and stand-alone concept Qs
- Distractors must hinge on common misconceptions: confusing enumerated vs implied powers, selective vs total incorporation, Citizens United vs BCRA particulars
- FRQs are SHORT answers — each lettered part is 1-3 sentences, graded against a rubric
- Argument Essay FRQ requires a thesis + two required foundational documents as evidence
- SCOTUS Case Comparison requires naming facts, holding, and reasoning for both cases`,
    stimulusRequirement: "When appropriate include a stimulus: a foundational-document excerpt (Federalist/Brutus/Constitution), a SCOTUS majority/dissent excerpt, a political cartoon description, a data table (turnout by demographic, confidence in institutions poll), or a line/bar graph. Stimuli should be self-contained.",
    stimulusDescription: "Concrete text-only description of a document excerpt, case opinion, cartoon, or data visual the question interprets. Null if the question is concept-only.",
    explanationGuidance: "Explanations should cite the exact CED content standard, name the required document or SCOTUS case when applicable (e.g., 'CED 2.4 — Interactions; cites Federalist 70 on unitary executive'), and explicitly rule out each distractor by naming its misconception.",
  },

  // ── AP Environmental Science ──────────────────────────────────────────────
  // 2026 expansion. Format: 80 MCQ / 90 min + 3 FRQ / 70 min. Unit weights
  // from CED 2020. Strong lab + field-investigation component.
  AP_ENVIRONMENTAL_SCIENCE: {
    name: "AP Environmental Science",
    shortName: "AP Env Sci",
    hidden: false, // 2026-04-22 — flipped after Phase C populated 501 MCQs
    examSecsPerQuestion: 68, // 80 MCQ in 90 min = 68s each
    mockExam: { mcqCount: 80, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: true,
    questionTypeFormats: {
      MCQ: {
        generationPrompt:
          "Generate a College Board AP Environmental Science MCQ. Grounded in the " +
          "CED with a specific environmental concept (e.g., carbon cycle feedback loops, " +
          "tragedy of the commons, biomagnification, trophic efficiency, LD50, K vs r " +
          "selection, Coriolis effect, watershed dynamics). Frequent stimulus types: " +
          "data table (species counts, water-quality metrics), graph (exponential " +
          "vs logistic growth), map (biome/ecoregion), lab scenario (DO/BOD, half-life " +
          "calculation). Three wrong answers each reflect common misconceptions (confusing " +
          "primary vs secondary succession, conflating weather with climate, mixing up " +
          "point vs non-point source pollution).",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"question stem", "stimulus":"data/lab/scenario or null", ' +
          '"wikiImageTopic":"e.g., Biogeochemical cycle, Food web, or null", ' +
          '"apSkill":"Concept Explanation | Visual Analysis | Data Analysis | Scientific Argument | Environmental Solutions", ' +
          '"bloomLevel":"remember | apply | analyze", ' +
          '"options":["A) ...","B) ...","C) ...","D) ..."], "correctAnswer":"A", ' +
          '"explanation":"Why correct + why each distractor wrong, citing CED standard and natural-process mechanism"}',
        estimatedMinutes: 1,
      },
      FRQ: {
        generationPrompt:
          "Generate a College Board AP Environmental Science FRQ. Three shapes: " +
          "(i) Design an Investigation (10 pts), (ii) Analyze an Environmental " +
          "Problem and Propose a Solution (10 pts), (iii) Analyze an Environmental " +
          "Problem and Propose a Solution Doing Calculations (10 pts). Each has " +
          "~8-10 lettered parts (Describe / Explain / Calculate / Justify).",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"Full FRQ prompt with lettered parts", ' +
          '"stimulus":"scenario, data table, or lab setup description", ' +
          '"correctAnswer":"Complete model response for each part incl. calculation work", ' +
          '"explanation":"Rubric — pts per part with required elements"}',
        estimatedMinutes: 23,
      },
    },
    units: {
      APES_1_ECOSYSTEMS: { name: "Unit 1: The Living World: Ecosystems", keyThemes: ["Biosphere & biomes", "Energy flow (10% rule)", "Biogeochemical cycles (C, N, P, H2O)", "Primary productivity", "Trophic levels"] },
      APES_2_BIODIVERSITY: { name: "Unit 2: The Living World: Biodiversity", keyThemes: ["Species / genetic / ecosystem diversity", "Ecological tolerance", "Natural disruptions", "Adaptations", "Ecological succession"] },
      APES_3_POPULATIONS: { name: "Unit 3: Populations", keyThemes: ["Generalist vs specialist species", "K vs r selection", "Survivorship curves", "Logistic vs exponential growth", "Demographic transition"] },
      APES_4_EARTH_SYSTEMS: { name: "Unit 4: Earth Systems and Resources", keyThemes: ["Plate tectonics", "Soil formation & erosion", "Earth's atmosphere", "Global wind patterns & Coriolis", "El Niño / La Niña"] },
      APES_5_LAND_WATER_USE: { name: "Unit 5: Land and Water Use", keyThemes: ["Tragedy of the commons", "Agricultural practices", "Irrigation & fertilizer impacts", "Urbanization & ecological footprints", "Mining impacts"] },
      APES_6_ENERGY: { name: "Unit 6: Energy Resources and Consumption", keyThemes: ["Fossil fuels formation", "Nuclear fission", "Renewable sources", "Energy conservation", "Distributed vs centralized generation"] },
      APES_7_ATMOSPHERIC_POLLUTION: { name: "Unit 7: Atmospheric Pollution", keyThemes: ["Acid rain", "Photochemical smog", "Ozone depletion vs tropospheric ozone", "Noise pollution", "Thermal inversions"] },
      APES_8_AQUATIC_TERRESTRIAL_POLLUTION: { name: "Unit 8: Aquatic and Terrestrial Pollution", keyThemes: ["Point vs non-point sources", "Eutrophication & DO/BOD", "Biomagnification of toxins", "LD50 & dose-response", "Solid & hazardous waste"] },
      APES_9_GLOBAL_CHANGE: { name: "Unit 9: Global Change", keyThemes: ["Greenhouse gases & radiative forcing", "Ocean acidification", "Invasive species", "Habitat fragmentation & HIPPCO", "Sustainability & IPAT"] },
    },
    suggestedTutorQuestions: [
      "Explain the 10% rule and why trophic efficiency limits food chain length",
      "Compare the carbon cycle with the nitrogen cycle — what sources and sinks differ?",
      "Walk me through a logistic growth curve — what is K and why is it reached?",
      "How does biomagnification differ from bioaccumulation?",
      "What causes ocean acidification and how does it connect to CO2 emissions?",
    ],
    curriculumContext: `
AP Environmental Science is a college-level introductory environmental science
course. Exam: 80 MCQ (90 min, 60% score) + 3 FRQ (70 min, 40% score).

Unit weights (CED 2020):
  Unit 1 Ecosystems — 6-8%    Unit 2 Biodiversity — 6-8%
  Unit 3 Populations — 10-15%  Unit 4 Earth Systems — 10-15%
  Unit 5 Land & Water Use — 10-15%  Unit 6 Energy — 10-15%
  Unit 7 Atmospheric Pollution — 7-10%
  Unit 8 Aquatic/Terrestrial Pollution — 7-10%
  Unit 9 Global Change — 15-20%

Required lab/field component. Frequent FRQ calculations: half-life, energy
conversion, population growth rate, carbon sequestration.
    `.trim(),
    tutorResources: `
- Fiveable AP Env Sci — https://library.fiveable.me/ap-enviro
- Bozeman Science YouTube — CED-aligned video walkthroughs
- EPA, NOAA, USGS — authoritative primary data sources
- Khan Academy AP Environmental Science — full playlist
- CB AP Central — released FRQs 2023-25
    `.trim(),
    examAlignmentNotes: `AP Environmental Science exam alignment:
- 80 MCQs heavily weighted toward Concept Explanation + Data Analysis skills
- Distractors should mirror common misconceptions: confusing weather/climate, primary/secondary succession, bioaccumulation/biomagnification, acid rain/ozone depletion
- FRQs always test one Calculation path with partial credit for shown work
- Data interpretation is central: ~40% of MCQs include a stimulus (graph, table, map, lab scenario)`,
    stimulusRequirement: "Include stimulus often: data table (species counts, water quality indicators), graph (DTM, DO vs depth, species-area), map (biomes, ecoregions), lab scenario (DO/BOD measurement, half-life), or chemistry problem (radioactive decay, reaction stoichiometry).",
    stimulusDescription: "Concrete description of a data source, graph, map, or lab scenario. Null if the question is purely conceptual.",
    explanationGuidance: "Explanations should name the CED standard, cite the natural process or mechanism (not just the outcome), include any calculation steps, and explain WHY each distractor reflects a common misconception.",
  },

  // ── AP Precalculus ────────────────────────────────────────────────────────
  // New exam (first admin 2024). Format: 40 MCQ Sec I (80 min + 40 min =
  // Part A no calc, Part B calc) + 4 FRQs (3 Units 1-3 tested, Unit 4 not
  // on exam). CED 2023.
  AP_PRECALCULUS: {
    name: "AP Precalculus",
    shortName: "AP Precalc",
    hidden: false, // 2026-04-23 — flipped after Phase C crossed the 300+ threshold
    examSecsPerQuestion: 120, // 40 MCQ in 80 min avg (2 min per Q)
    mockExam: { mcqCount: 40, mcqTimeMinutes: 80 },
    enrichWithEduAPIs: true,
    questionTypeFormats: {
      MCQ: {
        generationPrompt:
          "Generate a College Board AP Precalculus MCQ. Cover concepts from " +
          "CED Units 1-3 (Polynomial & Rational Functions, Exp & Log Functions, " +
          "Trig & Polar Functions). Questions test function behavior (domain, " +
          "range, asymptotes, end behavior, transformations), modeling, and " +
          "rate of change analysis. Split between no-calculator (Part A, ~30) " +
          "and calculator-required (Part B, ~10). Three distractors must each " +
          "reflect a specific procedural error (sign error in log rule, " +
          "quadrant error in arcsin, wrong asymptote direction).",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"question stem with math expressions in LaTeX syntax", "stimulus":"graph/table or null", ' +
          '"apSkill":"Procedural | Conceptual | Modeling | Functional Analysis", ' +
          '"bloomLevel":"remember | apply | analyze", ' +
          '"calculatorAllowed":"yes | no", ' +
          '"options":["A) ...","B) ...","C) ...","D) ..."], "correctAnswer":"A", ' +
          '"explanation":"Complete worked solution with each step justified + why each distractor is a common procedural error"}',
        estimatedMinutes: 2,
      },
      FRQ: {
        generationPrompt:
          "Generate a College Board AP Precalculus FRQ. Four FRQs per exam, 2 " +
          "no-calculator + 2 calculator. Each has parts A-F testing modeling, " +
          "computational work, and function-behavior analysis with justification.",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"Full FRQ prompt with lettered parts", ' +
          '"stimulus":"graph / table / function description", ' +
          '"correctAnswer":"Complete worked solution showing all steps", ' +
          '"explanation":"Rubric — pts per part and what must be shown"}',
        estimatedMinutes: 15,
      },
    },
    units: {
      PRECALC_1_POLYNOMIAL_RATIONAL: { name: "Unit 1: Polynomial and Rational Functions", keyThemes: ["Polynomial end behavior", "Rational asymptotes (horizontal, vertical, slant)", "Zeros & multiplicity", "Polynomial long division", "Complex zeros"] },
      PRECALC_2_EXPONENTIAL_LOGARITHMIC: { name: "Unit 2: Exponential and Logarithmic Functions", keyThemes: ["Exp growth/decay models", "Log rules", "Change of base", "Solving exp/log equations", "Inverse functions"] },
      PRECALC_3_TRIGONOMETRIC_POLAR: { name: "Unit 3: Trigonometric and Polar Functions", keyThemes: ["Unit circle values", "Transformations of sin/cos/tan", "Inverse trig & principal values", "Polar coordinates & graphs", "Parametric equations"] },
      PRECALC_4_FUNCTIONS_PARAMETERS_VECTORS_MATRICES: { name: "Unit 4: Functions Involving Parameters, Vectors, and Matrices (not assessed on exam)", keyThemes: ["Vectors", "Matrix operations", "Vector-valued functions"] },
    },
    suggestedTutorQuestions: [
      "Find all zeros (real and complex) of a polynomial step by step",
      "Explain the difference between horizontal and oblique asymptotes",
      "Walk through a log-solving problem using change of base",
      "How do I know which quadrant an arcsin result is in?",
      "Compare exponential growth with logistic growth equations",
    ],
    curriculumContext: `
AP Precalculus is a college-level precalculus course bridging Algebra 2 and
Calculus. Exam: 40 MCQ (Section I, 80 min, 62.5% score) + 4 FRQs (Section II,
60 min, 37.5% score). Unit 4 content NOT assessed on the May exam.

Unit weights (CED 2023):
  Unit 1 Polynomial & Rational — 30-40%
  Unit 2 Exponential & Logarithmic — 27-40%
  Unit 3 Trigonometric & Polar — 30-35%
  Unit 4 Functions/Vectors/Matrices — not on exam

Calculator policy: Section I Part A no calc (≤30 min), Part B calculator
allowed. Section II is 2 no-calc + 2 calc.
    `.trim(),
    tutorResources: `
- Khan Academy AP Precalculus — full playlist
- Fiveable AP Precalc — https://library.fiveable.me/ap-precalc
- Professor Leonard YouTube — rigorous worked examples
- AoPS intro + intermediate texts — problem-solving depth
- CB AP Central — released FRQs 2024-25
    `.trim(),
    examAlignmentNotes: `AP Precalculus exam alignment:
- Each MCQ test either a procedural or conceptual skill
- Distractors must reflect specific errors (not just wrong numbers): sign-flip in log rule, missed quadrant in inverse trig, confused vertical vs horizontal asymptote
- No-calc section requires exact values; calc section allows decimal approximations
- FRQs score with partial credit — show ALL work for full points`,
    stimulusRequirement: "Include a stimulus when appropriate: a graph (function, data plot), a table of function values, or a function expression to analyze. Keep numeric values clean (integer or simple fraction coefficients) unless the problem specifically tests decimal/calculator use.",
    stimulusDescription: "Concrete description of a graph, table, or function expression. Null if the question is algebraic-only.",
    explanationGuidance: "Explanations should show every step of the worked solution, flag the specific procedural rule used, and explain precisely what error produced each distractor.",
  },

  // ── AP English Language and Composition ──────────────────────────────────
  // 2026 expansion. Format: 45 MCQ Sec I / 60 min (45% score) + 3 FRQs Sec II /
  // 135 min (55% score). FRQs: Synthesis Essay, Rhetorical Analysis, Argument.
  AP_ENGLISH_LANGUAGE: {
    name: "AP English Language and Composition",
    shortName: "AP Eng Lang",
    hidden: true, // 2026-04-22 — thin grounding (8 samples); needs passage-aware CED parser + Phase C
    examSecsPerQuestion: 80, // 45 MCQ in 60 min
    mockExam: { mcqCount: 45, mcqTimeMinutes: 60 },
    enrichWithEduAPIs: true,
    questionTypeFormats: {
      MCQ: {
        generationPrompt:
          "Generate a College Board AP English Language MCQ. Always include a " +
          "passage excerpt (approximately 200-400 words) from non-fiction prose: " +
          "essay, speech, letter, memoir, or journalistic piece. Two MCQ types: " +
          "(i) Reading — rhetorical analysis of an existing passage; " +
          "(ii) Writing — targeted edits to an unfinished student draft. " +
          "Test skills: identify rhetorical situation (audience, purpose, " +
          "context), trace claims & evidence, evaluate word choice, recognize " +
          "syntactic patterns. Three distractors reflect common errors: " +
          "mistaking subject for theme, conflating ethos with logos, choosing " +
          "grammatically-correct-but-rhetorically-weak answer.",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"question stem", "stimulus":"the 200-400 word passage excerpt (required)", ' +
          '"apSkill":"Rhetorical Situation | Claims & Evidence | Reasoning & Organization | Style", ' +
          '"bloomLevel":"remember | apply | analyze", ' +
          '"passageType":"essay | speech | letter | memoir | journalism", ' +
          '"options":["A) ...","B) ...","C) ...","D) ..."], "correctAnswer":"A", ' +
          '"explanation":"Why correct is the strongest + why each distractor is rhetorically weaker, citing specific line references"}',
        estimatedMinutes: 1.3,
      },
      FRQ: {
        generationPrompt:
          "Generate a College Board AP English Language FRQ. Three shapes: " +
          "(i) Synthesis Essay — prompt + 6-7 sources on a contemporary topic " +
          "(must cite 3+ sources in a coherent argument); " +
          "(ii) Rhetorical Analysis — passage + prompt to analyze author's " +
          "rhetorical choices; " +
          "(iii) Argument Essay — open claim prompt, no sources required. " +
          "Each scored 0-6 on the CB rubric (Thesis 1, Evidence 4, Sophistication 1).",
        responseFormat:
          '{"topic":"...", "subtopic":"...", "questionText":"Full FRQ prompt", ' +
          '"stimulus":"passage text (for Rhetorical Analysis) OR synthesis source-set summaries (for Synthesis) OR null (for Argument)", ' +
          '"correctAnswer":"Strong sample thesis + 2-3 sentence outline of evidence/reasoning", ' +
          '"explanation":"Rubric: Thesis (1pt), Evidence & Commentary (4pts), Sophistication (1pt). Describe what earns each bucket."}',
        estimatedMinutes: 45,
      },
    },
    units: {
      ENGLANG_1_CLAIMS_EVIDENCE: { name: "Unit 1: Claims, Reasoning, and Evidence Analysis", keyThemes: ["Thesis identification", "Claim-evidence linkage", "Strength of evidence", "Reasoning quality"] },
      ENGLANG_2_ORGANIZATION_AUDIENCE: { name: "Unit 2: Organization and Audience Appeals", keyThemes: ["Text structure", "Audience targeting", "Appeals (ethos, pathos, logos)", "Introduction & conclusion strategy"] },
      ENGLANG_3_MULTIPLE_PERSPECTIVES: { name: "Unit 3: Multiple Perspectives and Counterarguments", keyThemes: ["Perspective identification", "Counterargument structure", "Concession vs refutation"] },
      ENGLANG_4_DEVELOPMENT_METHODS: { name: "Unit 4: Development Methods", keyThemes: ["Narration, description, comparison", "Cause-effect", "Examples & anecdotes"] },
      ENGLANG_5_SENTENCE_WRITING: { name: "Unit 5: Sentence-Level Writing Choices", keyThemes: ["Syntax variation", "Punctuation for effect", "Diction", "Tone"] },
      ENGLANG_6_POSITION_BIAS: { name: "Unit 6: Position, Perspective, and Bias", keyThemes: ["Author's stance", "Acknowledging bias", "Qualified claims"] },
      ENGLANG_7_ARGUMENT_COMPLEXITY: { name: "Unit 7: Argument Complexity and Effectiveness", keyThemes: ["Nuance", "Qualified argumentation", "Complex reasoning"] },
      ENGLANG_8_STYLISTIC_CHOICES: { name: "Unit 8: Stylistic Choices and Audience Perception", keyThemes: ["Figurative language", "Stylistic patterns", "Effect on audience"] },
      ENGLANG_9_COMPLEX_ARGUMENTATION: { name: "Unit 9: Complex Argumentation with Multiple Viewpoints", keyThemes: ["Sophisticated thesis", "Multiple viewpoints synthesis", "Rhetorical sophistication"] },
    },
    suggestedTutorQuestions: [
      "What's the difference between ethos, pathos, and logos?",
      "How do I write a strong thesis for a synthesis essay?",
      "Compare the rhetorical strategies in MLK's Letter from Birmingham Jail vs Lincoln's Gettysburg Address",
      "What counts as 'sophistication' on the AP Lang rubric?",
      "How do I quickly identify the author's tone in a passage?",
    ],
    curriculumContext: `
AP English Language and Composition is a college-level rhetoric and writing
course. Exam: 45 MCQ Sec I (60 min, 45% score) + 3 FRQs Sec II (135 min, 55%).

Section I MCQs split:
  Reading set (~23-25 Qs) — 5 passages, analyze rhetoric
  Writing set (~20-22 Qs) — 4 student drafts, targeted revisions

Section II FRQs (each 0-6 pts):
  Q1 Synthesis Essay — prompt + 6-7 sources
  Q2 Rhetorical Analysis — one non-fiction passage
  Q3 Argument Essay — open claim, no sources

CED units are skill bands, not content domains. FRQs score against a unified
6-point rubric: Thesis (1) + Evidence/Commentary (4) + Sophistication (1).
    `.trim(),
    tutorResources: `
- Fiveable AP Lang — https://library.fiveable.me/ap-lang
- CB AP Central — released FRQs 2023-25 with scoring guidelines
- Khan Academy AP Lang — rubric walkthroughs + sample essays
- Perrin's Pocket Handbook (style reference)
- Purdue OWL (rhetoric + writing mechanics)
    `.trim(),
    examAlignmentNotes: `AP English Language exam alignment:
- Reading MCQs: line-referenced questions about WHY an author made a rhetorical choice (not WHAT they said)
- Writing MCQs: pick the revision that best accomplishes a stated rhetorical purpose
- Distractors should be grammatically plausible but rhetorically weaker
- FRQs are hand-scored — rubric-aligned thesis + specific textual evidence + sophisticated complexity earn the 6`,
    stimulusRequirement: "MCQs ALWAYS include a 200-400 word passage. FRQs include either a passage (Rhetorical Analysis), a source-set (Synthesis), or no stimulus (Argument).",
    stimulusDescription: "The passage excerpt (non-fiction prose) or source summaries the question is built on.",
    explanationGuidance: "Explanations should cite specific lines of the passage, name the rhetorical move (anaphora, antithesis, concession, etc.), and explain WHY each distractor is rhetorically weaker.",
  },

  // ── SAT Math ──────────────────────────────────────────────────────────────
  SAT_MATH: {
    name: "SAT Math",
    shortName: "SAT Math",
    examSecsPerQuestion: 90,
    mockExam: { mcqCount: 44, mcqTimeMinutes: 70 },
    enrichWithEduAPIs: true,
    units: {
      SAT_MATH_1_ALGEBRA: { name: "Algebra", keyThemes: ["linear equations", "systems of equations", "inequalities", "linear functions", "slope", "point-slope form", "absolute value equations", "word problems with variables"] },
      SAT_MATH_2_ADVANCED_MATH: { name: "Advanced Math", keyThemes: ["quadratics", "polynomials", "exponential functions", "rational equations", "vertex form", "complex numbers", "radical equations", "function notation"] },
      SAT_MATH_3_PROBLEM_SOLVING: { name: "Problem-Solving and Data Analysis", keyThemes: ["ratios", "proportions", "percentages", "statistics", "probability", "unit conversion", "sampling", "linear vs exponential growth"] },
      SAT_MATH_4_GEOMETRY_TRIG: { name: "Geometry and Trigonometry", keyThemes: ["area", "volume", "coordinate geometry", "trigonometry", "circles", "Pythagorean theorem", "similarity", "radian measure"] },
    },
    suggestedTutorQuestions: [
      "How do I solve a system of linear equations?",
      "What is the quadratic formula and when do I use it?",
      "How do I interpret a scatterplot on the SAT?",
    ],
    curriculumContext: "SAT Math covers algebra, advanced math, problem-solving/data analysis, and geometry/trigonometry. Questions range from multiple-choice to student-produced responses.",
    tutorResources: "• Khan Academy SAT Math (khanacademy.org/sat)\n• College Board SAT Practice (bluebook.collegeboard.org)",
    examAlignmentNotes: "SAT Math tests real-world application of math skills. Calculators are permitted on most sections.",
    stimulusRequirement: "Include a relevant word problem or data table when appropriate.",
    stimulusDescription: "word problem context, table, or graph description, or null",
    explanationGuidance: "show step-by-step solution and identify the math concept tested",
    skillCodes: ["Algebra", "Advanced Math", "Problem-Solving & Data Analysis", "Geometry & Trigonometry"],
    difficultyRubric: {
      EASY: "Single-concept, one or two-step problem. SAT score range 200–450. 70%+ of students answer correctly. Examples: solve a simple linear equation, compute a basic percentage, identify a graph feature, substitute values into a formula.",
      MEDIUM: "Multi-step problem or word problem requiring setup. SAT score range 450–600. 50–65% correct. Examples: system of equations word problem, interpreting a data table with a ratio, quadratic with substitution.",
      HARD: "Complex multi-step reasoning or unfamiliar context requiring modeling. SAT score range 600–800. 25–40% correct. Examples: exponential growth modeling, circle theorem with algebra, polynomial factoring in real-world context.",
    },
    distractorTaxonomy: "(1) SIGN ERROR TRAP — loses a negative sign during algebraic manipulation (e.g., distributes incorrectly); (2) FORMULA CONFUSION TRAP — uses the wrong formula for the concept (e.g., circumference instead of area, slope instead of midpoint); (3) PARTIAL-SOLVE TRAP — stops one step early and selects the intermediate value as the final answer.",
    stimulusQualityGuidance: "GOOD: A concrete word problem with named variables and a real-world scenario (e.g., 'A store sells...', 'A car travels...', 'A rectangle has...'). Describe any figures numerically (e.g., 'a circle with radius 5') — never use diagram placeholders like [FIGURE]. AVOID: Pure symbol manipulation without any real-world context.",
  },

  // ── SAT Reading & Writing ─────────────────────────────────────────────────
  SAT_READING_WRITING: {
    name: "SAT Reading & Writing",
    shortName: "SAT Reading",
    examSecsPerQuestion: 75,
    mockExam: { mcqCount: 54, mcqTimeMinutes: 64 },
    enrichWithEduAPIs: true,
    units: {
      SAT_RW_1_CRAFT_STRUCTURE: { name: "Craft and Structure", keyThemes: ["vocabulary in context", "text structure", "author's purpose", "cross-text connections", "point of view", "rhetorical situation", "word choice impact", "genre conventions"] },
      SAT_RW_2_INFO_IDEAS: { name: "Information and Ideas", keyThemes: ["central ideas", "supporting evidence", "inferences", "quantitative data interpretation", "textual evidence", "summary", "multiple texts synthesis", "fact vs. opinion"] },
      SAT_RW_3_STANDARD_ENGLISH: { name: "Standard English Conventions", keyThemes: ["punctuation", "sentence boundaries", "subject-verb agreement", "modifiers", "pronoun-antecedent agreement", "verb tense consistency", "parallelism", "comma usage"] },
      SAT_RW_4_EXPRESSION_IDEAS: { name: "Expression of Ideas", keyThemes: ["rhetorical synthesis", "transitions", "logical organization", "precise language", "sentence combining", "introductory phrases", "concision and clarity", "supporting a claim"] },
    },
    suggestedTutorQuestions: [
      "How do I identify the main idea of a passage?",
      "What are common SAT grammar rules I should know?",
      "How do I answer vocabulary-in-context questions?",
    ],
    curriculumContext: "SAT Reading & Writing tests comprehension, vocabulary, grammar, and writing skills through short passages across literature, history, science, and social science.",
    tutorResources: "• Khan Academy SAT Reading (khanacademy.org/sat)\n• College Board SAT Practice Tests",
    examAlignmentNotes: "Each question is paired with a short passage (1-2 paragraphs). Focus on evidence-based reasoning. Every question MUST include a passage stimulus.",
    stimulusRequirement: "ALWAYS include a passage excerpt as stimulus — every SAT Reading & Writing question requires one.",
    stimulusDescription: "1-2 paragraph passage excerpt from literary, historical, scientific, or social science text",
    explanationGuidance: "cite specific evidence from the passage and explain why each distractor is wrong",
    skillCodes: ["Craft & Structure", "Information & Ideas", "Standard English Conventions", "Expression of Ideas"],
    difficultyRubric: {
      EASY: "Short (1-3 sentence) literary or informational excerpt with a direct vocabulary-in-context or main-idea question. SAT score range 200–500. 70%+ correct. Example: identify the meaning of an underlined word using context clues from a science passage.",
      MEDIUM: "Moderate-length excerpt (4-6 sentences) requiring inference, evidence evaluation, or transition selection. SAT score range 500–650. 45–60% correct. Example: choose the evidence that best supports a claim; identify the logical transition between two paragraphs.",
      HARD: "Nuanced literary or rhetoric-heavy passage requiring synthesis, perspective analysis, or rhetorical strategy identification. SAT score range 650–800. 20–35% correct. Example: cross-text perspective comparison, author's rhetorical choice in context of a counterargument.",
    },
    distractorTaxonomy: "(1) LITERAL RESTATEMENT TRAP — repeats words from the passage but misreads their meaning in context; (2) OUT-OF-SCOPE INFERENCE TRAP — a plausible-sounding claim that requires knowledge beyond what the passage states; (3) OPPOSITE-RELATIONSHIP TRAP — confuses contrast with agreement, or cause with effect, in the passage's argument.",
    stimulusQualityGuidance: "GOOD: A 1-2 paragraph excerpt from a literary, historical, scientific, or social science passage. The question must be fully answerable from the passage alone. Attribute the passage (e.g., 'The following passage is adapted from...'). AVOID: Passages shorter than 40 words, passages requiring outside knowledge, or stimuli that are a single isolated sentence without context.",
  },

  // ── ACT Math ──────────────────────────────────────────────────────────────
  ACT_MATH: {
    name: "ACT Math",
    shortName: "ACT Math",
    // Confirmed against act.org — Enhanced ACT (2025+):
    //   Math: 45 questions / 50 min. Prior format was 60 / 60.
    examSecsPerQuestion: 67, // 45 MCQ in 50 min = 66.6s/q
    mockExam: { mcqCount: 45, mcqTimeMinutes: 50 },
    enrichWithEduAPIs: false,
    units: {
      ACT_MATH_1_NUMBER: { name: "Number and Quantity", keyThemes: ["arithmetic", "integers", "fractions", "exponents", "number properties"] },
      ACT_MATH_2_ALGEBRA: { name: "Algebra", keyThemes: ["linear equations", "inequalities", "systems", "polynomials", "functions"] },
      ACT_MATH_3_GEOMETRY: { name: "Geometry", keyThemes: ["triangles", "circles", "coordinate geometry", "3D shapes", "angles"] },
      ACT_MATH_4_STATISTICS: { name: "Statistics and Probability", keyThemes: ["mean", "median", "probability", "data interpretation", "counting"] },
      ACT_MATH_5_INTEGRATING_SKILLS: { name: "Integrating Essential Skills", keyThemes: ["multi-step problems", "real-world applications", "modeling"] },
    },
    suggestedTutorQuestions: [
      "What math topics are covered on the ACT Math section?",
      "How is ACT Math different from SAT Math?",
      "What trigonometry do I need to know for the ACT?",
    ],
    curriculumContext: "ACT Math has 60 questions in 60 minutes covering algebra, geometry, statistics, and trigonometry. All questions are multiple choice with 5 options (A–E).",
    tutorResources: "• Khan Academy ACT Math prep\n• ACT official practice (act.org)",
    examAlignmentNotes: "ACT Math is 60 minutes for 60 questions (1 minute each). Calculator always permitted. EVERY question has EXACTLY 5 choices (A, B, C, D, E).",
    stimulusRequirement: "Include a word problem, diagram description, or data context when relevant.",
    stimulusDescription: "word problem context or diagram description, or null",
    explanationGuidance: "show all calculation steps and identify the concept tested",
    skillCodes: ["Number & Quantity", "Algebra", "Geometry", "Statistics & Probability"],
    difficultyRubric: {
      EASY: "Single-step arithmetic, basic percent, simple geometry recall (area of rectangle, perimeter). One clear operation. ACT score 1–16. 65%+ correct.",
      MEDIUM: "Two-to-three step problems: systems of linear equations, quadratic formula application, coordinate geometry (slope, midpoint, distance), probability with combinations, interpreting graphs/tables. ACT score 17–24. 40–55% correct.",
      HARD: "Four+ step multi-concept synthesis: trigonometric identities applied to coordinate geometry, polynomial factoring with complex roots, exponential/logarithmic modeling from data tables, matrix operations, law of sines/cosines in non-right triangles, optimization word problems requiring system setup. Must require strategic reasoning — not just computation. ACT score 25–36. 25–40% correct.",
    },
    distractorTaxonomy: "(1) PARTIAL CALCULATION TRAP — correct first step but stops early (e.g., solves for x but question asks for 2x+1); (2) SIGN/DIRECTION TRAP — correct magnitude but wrong sign, or reverses inequality direction; (3) FORMULA MIX-UP TRAP — applies a related but wrong formula (area vs perimeter, sin vs cos, permutation vs combination); (4) MISREAD TRAP — answers a slightly different question than asked (finds x instead of y); (5) E-OPTION TRAP — represents a common calculator-entry error or order-of-operations mistake.",
    stimulusQualityGuidance: "GOOD: A concrete word problem with named variables (e.g., 'A train travels...'), a coordinate grid description, or a table of values. AVOID: Abstract symbol manipulation without any context.",
    questionTypeFormats: {
      MCQ: {
        generationPrompt:
          "Generate an ACT Math question with EXACTLY 5 answer choices labeled A, B, C, D, E. " +
          "Never use 4 choices. The 5th option (E) should represent a common arithmetic or calculator error. " +
          "Include a word problem, equation, or diagram description as context.",
        responseFormat:
          '{"topic":"...","subtopic":"...","questionText":"question","stimulus":"context or null",' +
          '"options":["A) ...","B) ...","C) ...","D) ...","E) ..."],' +
          '"correctAnswer":"A","explanation":"step-by-step solution identifying concept and distractors"}',
        estimatedMinutes: 1,
      },
    },
  },

  // ── ACT English ───────────────────────────────────────────────────────────
  ACT_ENGLISH: {
    name: "ACT English",
    shortName: "ACT English",
    // Confirmed against act.org — Enhanced ACT (2025+):
    //   English: 50 questions / 35 min. Prior format was 75 / 45.
    examSecsPerQuestion: 42, // 50 MCQ in 35 min = 42s/q
    mockExam: { mcqCount: 50, mcqTimeMinutes: 35 },
    enrichWithEduAPIs: false,
    units: {
      ACT_ENG_1_PRODUCTION_WRITING: { name: "Production of Writing", keyThemes: ["topic development", "organization", "unity", "cohesion"] },
      ACT_ENG_2_KNOWLEDGE_LANGUAGE: { name: "Knowledge of Language", keyThemes: ["word choice", "style", "tone", "clarity", "concision"] },
      ACT_ENG_3_CONVENTIONS: { name: "Conventions of Standard English", keyThemes: ["punctuation", "grammar", "sentence structure", "usage"] },
    },
    suggestedTutorQuestions: [
      "What grammar rules are tested most on the ACT English section?",
      "How do I improve my ACT English score quickly?",
      "What is the difference between ACT English and SAT Writing?",
    ],
    curriculumContext: "ACT English has 75 questions in 45 minutes. Questions test grammar, punctuation, sentence structure, and rhetorical skills using full passage contexts.",
    tutorResources: "• Khan Academy ACT English practice\n• ACT official practice tests (act.org)",
    examAlignmentNotes: "75 questions in 45 minutes. Questions are embedded in 5 passages. Focus on error identification and improvement.",
    stimulusRequirement: "Always include a passage sentence/paragraph as stimulus.",
    stimulusDescription: "sentence or paragraph from the passage being edited",
    explanationGuidance: "explain the grammar rule and why the correct answer follows it",
    skillCodes: ["Production of Writing", "Knowledge of Language", "Conventions of Standard English"],
    difficultyRubric: {
      EASY: "Identify a clear punctuation or subject-verb agreement error with one obvious fix. No passage context needed to answer. 65%+ correct.",
      MEDIUM: "Choose the best revision for parallel structure, modifier placement, or concision. Requires reading 2-3 surrounding sentences for context. Involves style vs correctness tradeoffs. 40–55% correct.",
      HARD: "Evaluate the rhetorical purpose of adding, deleting, or relocating a sentence within a passage. Requires understanding the author's argument structure, transitions between paragraphs, and how a change affects tone or logical flow. Must distinguish between grammatically correct options that differ in rhetorical effect. 25–40% correct.",
    },
    distractorTaxonomy: "(1) COMMA-SPLICE TRAP — adds a comma where a semicolon or period is needed, or vice versa; (2) WORDINESS TRAP — grammatically correct but unnecessarily verbose; (3) MEANING-SHIFT TRAP — grammatically perfect but subtly changes the author's intended meaning; (4) FALSE-FIX TRAP — 'corrects' something that was already correct in context.",
    stimulusQualityGuidance: "GOOD: 1-3 sentence excerpt from a coherent passage with an underlined portion to revise. AVOID: Isolated sentences with no surrounding context.",
  },

  // ── ACT Science ───────────────────────────────────────────────────────────
  ACT_SCIENCE: {
    name: "ACT Science",
    shortName: "ACT Science",
    // Confirmed against act.org — Enhanced ACT (2025+):
    //   Science: 40 questions / 40 min. Now OPTIONAL.
    //   Prior format was 40 / 35, required.
    examSecsPerQuestion: 60, // 40 MCQ in 40 min = 60s/q
    mockExam: { mcqCount: 40, mcqTimeMinutes: 40 },
    enrichWithEduAPIs: false,
    units: {
      ACT_SCI_1_DATA_REPRESENTATION: { name: "Data Representation", keyThemes: ["graphs", "tables", "figures", "scientific notation", "data reading"] },
      ACT_SCI_2_RESEARCH_SUMMARIES: { name: "Research Summaries", keyThemes: ["experimental design", "hypotheses", "conclusions", "variables", "controls"] },
      ACT_SCI_3_CONFLICTING_VIEWPOINTS: { name: "Conflicting Viewpoints", keyThemes: ["scientific debate", "comparing theories", "evidence evaluation", "strengths and weaknesses"] },
    },
    suggestedTutorQuestions: [
      "How do I read graphs and tables quickly on the ACT Science section?",
      "What science knowledge do I actually need for the ACT Science section?",
      "How do I approach conflicting viewpoints passages?",
    ],
    curriculumContext: "ACT Science has 40 questions in 35 minutes. It primarily tests data interpretation, scientific reasoning, and reading comprehension — not specific science facts.",
    tutorResources: "• Khan Academy ACT Science practice\n• ACT official practice (act.org)",
    examAlignmentNotes: "Focus on reading graphs, tables, and experimental descriptions. Prior science knowledge is minimal — reasoning is key.",
    stimulusRequirement: "Always include a data table, graph description, or experimental summary as stimulus.",
    stimulusDescription: "data table, graph description, or experimental passage excerpt",
    explanationGuidance: "explain what the data shows and how to read the figures to find the answer",
    skillCodes: ["Data Representation", "Research Summaries", "Conflicting Viewpoints"],
    difficultyRubric: {
      EASY: "Read a single value directly from a clearly labeled graph or table. One data point, one figure. 65%+ correct.",
      MEDIUM: "Identify a trend across multiple data points, compare results between two experiments, or predict what would happen if a variable changed. Requires reading 2+ columns or rows. 40–55% correct.",
      HARD: "Synthesize data from two or more figures to draw a conclusion, evaluate which of two competing scientific hypotheses is better supported by specific evidence, or design a follow-up experiment that would distinguish between theories. Must require multi-step reasoning across data sources. 25–40% correct.",
    },
    distractorTaxonomy: "(1) ADJACENT-ROW TRAP — reads the correct column but wrong row (or vice versa); (2) DIRECTION TRAP — reverses the correlation (positive vs negative, increasing vs decreasing); (3) SCOPE TRAP — generalizes beyond what the data actually shows; (4) VARIABLE CONFUSION TRAP — confuses independent and dependent variables or mixes up experimental groups.",
    stimulusQualityGuidance: "GOOD: A pipe-delimited data table with labeled columns (e.g., Trial | Temperature (°C) | Rate (mol/s)) or a 4-6 sentence experiment description with named variables. AVOID: Vague 'scientists studied X' without actual data.",
  },

  // ── ACT Reading ───────────────────────────────────────────────────────────
  ACT_READING: {
    name: "ACT Reading",
    shortName: "ACT Reading",
    // Confirmed against act.org — Enhanced ACT (2025+):
    //   Reading: 36 questions / 40 min. Prior format was 40 / 35.
    examSecsPerQuestion: 67, // 36 MCQ in 40 min = 66.6s/q
    mockExam: { mcqCount: 36, mcqTimeMinutes: 40 },
    enrichWithEduAPIs: false,
    units: {
      ACT_READ_1_LITERARY: {
        name: "Literary Narrative",
        keyThemes: ["prose fiction", "literary narrative", "character motivation", "tone", "narrator perspective", "figurative language"],
      },
      ACT_READ_2_SOCIAL_SCIENCE: {
        name: "Social Science",
        keyThemes: ["economics", "psychology", "sociology", "anthropology", "main idea", "inference", "author's purpose"],
      },
      ACT_READ_3_HUMANITIES: {
        name: "Humanities",
        keyThemes: ["arts", "language", "philosophy", "cultural commentary", "rhetorical devices", "point of view"],
      },
      ACT_READ_4_NATURAL_SCIENCE: {
        name: "Natural Science",
        keyThemes: ["biology", "chemistry", "physics", "earth science", "scientific reasoning", "evidence evaluation"],
      },
    },
    suggestedTutorQuestions: [
      "How do I find the main idea of an ACT Reading passage quickly?",
      "How do I answer inference questions on the ACT?",
      "What is the best strategy for the Literary Narrative passage?",
      "How do I approach vocabulary-in-context questions on the ACT?",
    ],
    curriculumContext: "ACT Reading has 40 questions in 35 minutes across 4 passage types: Literary Narrative, Social Science, Humanities, and Natural Science. Questions test main idea, detail recall, inference, vocabulary in context, and author technique.",
    tutorResources: "• Khan Academy ACT Reading practice\n• ACT official practice tests (act.org)",
    examAlignmentNotes: "4 passages, 10 questions each. All answers are based strictly on the passage — no outside knowledge required. Reading strategy (skimming, annotating) is critical.",
    stimulusRequirement: "Always include a 5-8 sentence passage excerpt as stimulus. Answers must be derivable from the passage alone.",
    stimulusDescription: "5-8 sentence passage excerpt matching the unit's genre (fiction, social science, humanities, or natural science)",
    explanationGuidance: "cite specific evidence from the passage excerpt and explain why other options are not supported",
    skillCodes: ["Main Idea", "Detail", "Inference", "Vocabulary in Context", "Author Technique"],
    difficultyRubric: {
      EASY: "Locate a specific detail stated directly in the passage. One sentence reference. No inference needed. 65%+ correct.",
      MEDIUM: "Infer a character's motivation, determine the author's purpose, or identify the meaning of a word from context. Requires reading 3-4 sentences and making a logical inference. 40–55% correct.",
      HARD: "Analyze how a literary technique (irony, juxtaposition, unreliable narration) contributes to the passage's theme, evaluate the strength of an author's argument by identifying assumptions, or synthesize information from two paragraphs. Must distinguish between plausible interpretations. 25–40% correct.",
    },
    distractorTaxonomy: "(1) OUTSIDE-KNOWLEDGE TRAP — true in general but not stated in this passage; (2) TOO-EXTREME TRAP — overstates the passage's claim (always, never, must); (3) ADJACENT-DETAIL TRAP — true of a nearby sentence but not the referenced one; (4) PARTIAL-ANSWER TRAP — captures part of the correct answer but misses a critical qualifier.",
    stimulusQualityGuidance: "GOOD: A self-contained 5-8 sentence excerpt with a named narrator or author, specific nouns, and a clear situation or argument. AVOID: Generic paraphrases without actual quoted text or passages that require background knowledge.",
    questionTypeFormats: {
      MCQ: {
        generationPrompt:
          "Generate an ACT Reading question. ALWAYS include a 5-8 sentence passage excerpt as the 'stimulus' field. " +
          "The question must be answerable using only the passage — no outside knowledge. " +
          "Use question types from this list: main idea, specific detail, vocabulary in context, inference, author's purpose, or literary technique. " +
          "Provide exactly 4 answer choices labeled A, B, C, D.",
        responseFormat:
          '{"topic":"...","subtopic":"...","questionText":"question about the passage","stimulus":"5-8 sentence passage excerpt",' +
          '"options":["A) ...","B) ...","C) ...","D) ..."],' +
          '"correctAnswer":"A","explanation":"cite the specific passage evidence that supports the correct answer and explain why each distractor is wrong"}',
        estimatedMinutes: 1,
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEP — College-Level Examination Program
  // All questions are original AI-generated content.
  // CLEP® is a registered trademark of College Board, which is not affiliated
  // with, and does not endorse, this product or site.
  // Resources referenced are freely available (OpenStax CC BY, Khan Academy,
  // Wikipedia CC BY-SA) — no copyrighted exam content is reproduced.
  // ═══════════════════════════════════════════════════════════════════════════

  // ── CLEP College Algebra ──────────────────────────────────────────────────
  CLEP_COLLEGE_ALGEBRA: {
    name: "CLEP College Algebra",
    shortName: "CLEP Algebra",
    examSecsPerQuestion: 90, // 60 questions in 90 minutes
    mockExam: { mcqCount: 60, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_ALGEBRA_1_FOUNDATIONS: {
        name: "Unit 1: Algebraic Foundations",
        keyThemes: ["real numbers", "order of operations", "absolute value", "exponent rules", "radicals", "factoring"],
        openStaxUrl: "https://openstax.org/books/college-algebra-2e/pages/1-introduction-to-prerequisites",
        khanUrl: "https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:foundation-algebra",
      },
      CLEP_ALGEBRA_2_EQUATIONS_INEQUALITIES: {
        name: "Unit 2: Equations and Inequalities",
        keyThemes: ["linear equations", "quadratic equations", "systems of equations", "compound inequalities", "absolute value equations"],
        openStaxUrl: "https://openstax.org/books/college-algebra-2e/pages/2-introduction-to-equations-and-inequalities",
        khanUrl: "https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:solve-equations-inequalities",
      },
      CLEP_ALGEBRA_3_FUNCTIONS_GRAPHS: {
        name: "Unit 3: Functions and Their Graphs",
        keyThemes: ["domain and range", "function notation", "transformations", "piecewise functions", "inverse functions", "graphing"],
        openStaxUrl: "https://openstax.org/books/college-algebra-2e/pages/3-introduction-to-functions",
        khanUrl: "https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:functions",
      },
      CLEP_ALGEBRA_4_POLYNOMIAL_RATIONAL: {
        name: "Unit 4: Polynomial and Rational Functions",
        keyThemes: ["polynomial division", "rational roots theorem", "asymptotes", "holes", "end behavior", "partial fractions"],
        openStaxUrl: "https://openstax.org/books/college-algebra-2e/pages/5-introduction-to-polynomial-and-rational-functions",
        khanUrl: "https://www.khanacademy.org/math/algebra2/x2ec2f6f830c9fb89:poly-graphs",
      },
      CLEP_ALGEBRA_5_EXPONENTIAL_LOGARITHMIC: {
        name: "Unit 5: Exponential and Logarithmic Functions",
        keyThemes: ["exponential growth and decay", "logarithm properties", "change of base", "natural log", "solving exponential equations"],
        openStaxUrl: "https://openstax.org/books/college-algebra-2e/pages/6-introduction-to-exponential-and-logarithmic-functions",
        khanUrl: "https://www.khanacademy.org/math/algebra2/x2ec2f6f830c9fb89:logs",
      },
    },
    suggestedTutorQuestions: [
      "How do I solve a quadratic equation by factoring?",
      "What is the difference between domain and range?",
      "How do I find a vertical asymptote?",
      "What are the properties of logarithms?",
      "How do I solve a system of two equations?",
      "What does it mean for a function to be one-to-one?",
    ],
    curriculumContext: `CLEP College Algebra covers algebraic foundations through exponential and logarithmic functions.
Exam: 60 questions, 90 minutes, multiple choice. Passing score (~50 correct) earns 3 college credits.
Typical credit value: ~$1,200 in tuition savings at most colleges.
Topics: algebraic operations (25%), equations/inequalities (25%), functions and their graphs (30%), number systems (10%), sequences/series (10%).`,
    tutorResources: `
- OpenStax College Algebra 2e (openstax.org/books/college-algebra-2e): Free, CC-licensed textbook — matches CLEP content exactly
- Khan Academy Algebra 1 & 2 (khanacademy.org/math/algebra): Free video lessons for every topic
- Paul's Online Math Notes (tutorial.math.lamar.edu): Reference for functions, polynomials, logs`,
    examAlignmentNotes: `CLEP College Algebra alignment (College Board official weights):
- Algebraic operations: 25% of exam
- Equations and inequalities: 25%
- Functions and their properties: 30%
- Number systems and operations: 20%
~60 questions in 90 minutes. ~50% routine problems (basic algebraic skills), ~50% nonroutine (multi-step reasoning).
TI-30XS MultiView scientific calculator integrated into exam software.
Passing score: 50 (ACE recommendation), earns 3 semester hours.
All questions are 4-choice MCQ.`,
    stimulusRequirement: "Include a function definition, equation, or graph description as stimulus where relevant; null for direct computation questions",
    stimulusDescription: "equation, function definition, or graph description (null for direct computation)",
    explanationGuidance: "showing full algebraic steps and naming the property or theorem applied at each step",
    difficultyRubric: {
      EASY: "Evaluate or simplify a single expression; recall a property of logs or exponents. 65%+ of test-takers correct.",
      MEDIUM: "Solve a multi-step equation, identify asymptotes, or evaluate composite functions. 40–55% correct.",
      HARD: "Solve a system involving nonlinear equations, apply transformation sequences, or analyze end behavior of rational functions. 25–40% correct.",
    },
    distractorTaxonomy: "(1) SIGN FLIP TRAP — forgets to distribute a negative; (2) LOG PROPERTY TRAP — incorrectly applies log(a+b) = log(a)+log(b); (3) DOMAIN RESTRICTION TRAP — ignores where the function is undefined.",
    stimulusQualityGuidance: "GOOD: A specific function like f(x) = (x²-4)/(x-2) with an explicit question. AVOID: Abstract 'let f be a function' without definition.",
    skillCodes: ["Algebraic Operations", "Equation Solving", "Function Analysis", "Graphical Interpretation"],
    // CB weights: Algebraic operations 25%, Equations/inequalities 25%, Functions/properties 30%, Number systems 20%
    topicWeights: {
      "CLEP_ALGEBRA_1_FOUNDATIONS": 0.20,
      "CLEP_ALGEBRA_2_EQUATIONS_INEQUALITIES": 0.25,
      "CLEP_ALGEBRA_3_FUNCTIONS_GRAPHS": 0.30,
      "CLEP_ALGEBRA_4_POLYNOMIAL_RATIONAL": 0.13,
      "CLEP_ALGEBRA_5_EXPONENTIAL_LOGARITHMIC": 0.12,
    },
    recommendedTextbooks: [
      "OpenStax College Algebra 2e (free: openstax.org/books/college-algebra-2e)",
      "Sullivan, Algebra and Trigonometry (Pearson)",
      "Stewart et al., College Algebra (Cengage)",
    ],
  },

  // ── CLEP College Composition ─────────────────────────────────────────────
  CLEP_COLLEGE_COMPOSITION: {
    name: "CLEP College Composition",
    shortName: "CLEP Composition",
    examSecsPerQuestion: 90, // Part I: 90 MCQ in 95 min + Part II: 2 essays in 70 min
    mockExam: { mcqCount: 50, mcqTimeMinutes: 95 }, // Section I MCQ only; essays handled separately
    enrichWithEduAPIs: false,
    units: {
      CLEP_COMP_1_ESSAY_STRATEGIES: {
        name: "Unit 1: Essay Organization and Strategies",
        keyThemes: ["thesis development", "paragraph structure", "introductions", "conclusions", "transitions", "unity and coherence"],
        openStaxUrl: "https://openstax.org/books/writing-guide/pages/1-unit-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/grammar/writing",
      },
      CLEP_COMP_2_RHETORICAL_ANALYSIS: {
        name: "Unit 2: Rhetorical Analysis and Audience",
        keyThemes: ["ethos pathos logos", "tone and voice", "purpose", "audience awareness", "diction", "figurative language"],
        openStaxUrl: "https://openstax.org/books/writing-guide/pages/9-unit-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/ap-language-arts/x34d1f6760bc08fe2:welcome-to-ap-lang",
      },
      CLEP_COMP_3_RESEARCH_DOCUMENTATION: {
        name: "Unit 3: Research Skills and Documentation",
        keyThemes: ["source evaluation", "MLA citation", "paraphrase vs quote", "plagiarism", "annotated bibliography", "synthesizing sources"],
        openStaxUrl: "https://openstax.org/books/writing-guide/pages/13-unit-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/grammar/style-and-usage",
      },
      CLEP_COMP_4_REVISION_EDITING: {
        name: "Unit 4: Revision, Editing, and Mechanics",
        keyThemes: ["sentence-level revision", "grammar and usage", "punctuation", "clarity", "concision", "passive vs active voice"],
        openStaxUrl: "https://openstax.org/books/writing-guide/pages/1-4-annotated-student-sample",
        khanUrl: "https://www.khanacademy.org/humanities/grammar",
      },
      CLEP_COMP_5_ARGUMENTATION: {
        name: "Unit 5: Argumentation and Evidence",
        keyThemes: ["claim and warrant", "counterargument", "logical fallacies", "evidence types", "refutation", "concession"],
        openStaxUrl: "https://openstax.org/books/writing-guide/pages/10-unit-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/grammar/writing",
      },
    },
    suggestedTutorQuestions: [
      "What is the difference between a thesis and a topic sentence?",
      "How do I identify ethos, pathos, and logos in an argument?",
      "How should I cite a source in MLA format?",
      "What is a logical fallacy and how do I spot one?",
      "How do I improve the coherence of my paragraphs?",
      "What is the difference between paraphrasing and quoting?",
    ],
    curriculumContext: `CLEP College Composition tests college-level writing skills.
Exam: Part I — 90 MCQ in 95 minutes (multiple choice on grammar, usage, rhetoric, research).
Passing (~48/90) earns 6 college credits — worth ~$2,400 in tuition savings at most institutions.
Tests: revision (35%), conventions of standard written English (30%), rhetorical analysis (20%), research (15%).`,
    tutorResources: `
- OpenStax Writing Guide with Handbook (openstax.org/books/writing-guide): Free, CC-licensed
- Purdue OWL (owl.purdue.edu): Free reference for grammar, citation, and writing process
- Khan Academy Grammar (khanacademy.org/humanities/grammar): Free video lessons on usage and mechanics`,
    examAlignmentNotes: `CLEP College Composition alignment:
- Revision: 35% (improve effectiveness of passages)
- Conventions of Standard Written English: 30% (grammar, usage, mechanics)
- Ability to Use Source Materials: 20% (research integration, citation)
- Rhetorical Analysis: 15% (purpose, audience, tone)
MCQ section only — essay scoring is separate and institution-specific.`,
    stimulusRequirement: "ALWAYS include a 4-6 sentence passage excerpt as stimulus — the question must reference a specific underlined portion or the passage as a whole",
    stimulusDescription: "4-6 sentence passage excerpt with underlined portion (required for all questions)",
    explanationGuidance: "citing the specific grammatical rule, rhetorical principle, or stylistic guideline that supports the correct revision",
    difficultyRubric: {
      EASY: "Identify an obvious grammar error (comma splice, subject-verb agreement) or name a rhetorical appeal in a clear example. 65%+ correct.",
      MEDIUM: "Choose the best revision for an awkward sentence or identify the logical fallacy in an argument. 40–55% correct.",
      HARD: "Evaluate whether adding/removing a sentence strengthens the passage's argument, or identify a subtle diction issue that undercuts the author's purpose. 25–40% correct.",
    },
    distractorTaxonomy: "(1) TOO-WORDY TRAP — technically correct but verbose when a shorter option is available; (2) TONE-SHIFT TRAP — correct grammar but wrong register for the passage's formal/informal voice; (3) OVER-CITATION TRAP — adds citation where paraphrase is already sufficient.",
    stimulusQualityGuidance: "GOOD: A 5-sentence paragraph with a clear argument, one underlined sentence, and a question asking how to improve it. AVOID: Fragments without context or single-sentence stimuli that don't give enough rhetorical context.",
    skillCodes: ["Revision", "Grammar and Mechanics", "Rhetorical Analysis", "Research Integration"],
    // CB weights: Conventions 10%, Revision 10%, Source Materials 25%, Rhetorical Analysis 25%, Essays 30%
    topicWeights: {
      "CLEP_COMP_1_ESSAY_STRATEGIES": 0.30,
      "CLEP_COMP_2_RHETORICAL_ANALYSIS": 0.25,
      "CLEP_COMP_3_RESEARCH_DOCUMENTATION": 0.25,
      "CLEP_COMP_4_REVISION_EDITING": 0.10,
      "CLEP_COMP_5_ARGUMENTATION": 0.10,
    },
    recommendedTextbooks: [
      "Lunsford, The St. Martin's Handbook (Bedford/St. Martin's)",
      "Hacker & Sommers, A Writer's Reference (Bedford/St. Martin's)",
    ],
  },

  // ── CLEP Introductory Psychology ─────────────────────────────────────────
  CLEP_INTRO_PSYCHOLOGY: {
    name: "CLEP Introductory Psychology",
    shortName: "CLEP Psychology",
    examSecsPerQuestion: 57, // 95 questions in 90 minutes
    mockExam: { mcqCount: 95, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_PSY_1_BIOLOGICAL_BASES: {
        name: "Unit 1: Biological Bases of Behavior",
        keyThemes: ["neurons and neurotransmitters", "brain structures", "peripheral nervous system", "genetics and behavior", "sensation and perception"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/3-introduction",
        khanUrl: "https://www.khanacademy.org/science/ap-biology/cell-communication-and-cell-cycle",
      },
      CLEP_PSY_2_COGNITION_MEMORY: {
        name: "Unit 2: Cognition, Memory, and Learning",
        keyThemes: ["classical conditioning", "operant conditioning", "observational learning", "memory encoding and retrieval", "forgetting", "cognitive biases"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/6-introduction",
        khanUrl: "https://www.khanacademy.org/science/ap-psychology/learning-ap",
      },
      CLEP_PSY_3_DEVELOPMENTAL: {
        name: "Unit 3: Developmental Psychology",
        keyThemes: ["Piaget's stages", "Erikson's stages", "attachment theory", "moral development", "adolescence", "lifespan development"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/9-introduction",
        khanUrl: "https://www.khanacademy.org/science/ap-psychology/developmental-psychology-ap",
      },
      CLEP_PSY_4_SOCIAL_PERSONALITY: {
        name: "Unit 4: Social Psychology and Personality",
        keyThemes: ["attribution theory", "conformity", "obedience", "attitudes", "trait theories", "psychodynamic theory", "humanistic psychology"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/11-introduction",
        khanUrl: "https://www.khanacademy.org/science/ap-psychology/social-psychology-ap",
      },
      CLEP_PSY_5_CLINICAL_ABNORMAL: {
        name: "Unit 5: Clinical and Abnormal Psychology",
        keyThemes: ["DSM-5 categories", "anxiety disorders", "mood disorders", "schizophrenia", "cognitive-behavioral therapy", "psychoanalysis", "drug therapies"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/15-introduction",
        khanUrl: "https://www.khanacademy.org/science/ap-psychology/clinical-psychology-ap",
      },
    },
    suggestedTutorQuestions: [
      "What is the difference between classical and operant conditioning?",
      "What are Piaget's four stages of cognitive development?",
      "How does serotonin affect mood?",
      "What is the difference between long-term and short-term memory?",
      "What is cognitive-behavioral therapy and how does it work?",
      "What are the Big Five personality traits?",
    ],
    curriculumContext: `CLEP Introductory Psychology covers the breadth of an introductory psychology course.
Exam: 95 questions, 90 minutes. Passing (~56 correct) earns 3 college credits (~$1,200 tuition savings).
Topics: History and approaches (2-3%), biological bases (8-10%), sensation/perception (6-8%), states of consciousness (4-6%),
learning (8-10%), cognition/memory (8-10%), language (3-4%), developmental (7-9%), motivation/emotion (6-8%),
personality (5-7%), testing and individual differences (5-7%), abnormal psychology (12-14%), treatment (5-7%),
social psychology (8-10%), statistics and research (3-5%).`,
    tutorResources: `
- OpenStax Psychology 2e (openstax.org/books/psychology-2e): Free, CC-licensed, chapter-by-chapter
- Khan Academy AP Psychology (khanacademy.org/science/ap-psychology): Free video lessons + practice
- Noba Project (nobaproject.com): Free, peer-reviewed psychology textbook modules`,
    examAlignmentNotes: `CLEP Introductory Psychology alignment (College Board official weights):
- History, Approaches, and Methods: 11-12%
- Biological Bases of Behavior: 8-9%
- Sensation and Perception: 7-8%
- States of Consciousness: 5-6%
- Learning: 8-9%
- Cognition: 8-9%
- Motivation and Emotion: 5-6%
- Developmental Psychology: 8-9%
- Personality: 7-8%
- Psychological Disorders and Health: 8-9%
- Treatment of Psychological Disorders: 6-7%
- Social Psychology: 9-10%
- Statistics, Tests, and Measurement: 3-4%
~95 questions (some unscored pretests) in 90 minutes. DSM-5 aligned.
Passing score: 50 (ACE recommendation), earns 3 semester hours.
Questions are application-focused — expect scenario-based questions asking to identify which concept applies.`,
    stimulusRequirement: "Include a brief scenario or case study as stimulus when the question asks the student to identify or apply a concept",
    stimulusDescription: "short scenario (2-3 sentences) describing a behavior or experiment (null for direct recall questions)",
    explanationGuidance: "naming the specific theory, theorist, or brain structure involved and explaining why the distractors describe a different concept",
    difficultyRubric: {
      EASY: "Recall a definition (e.g., what is reinforcement?) or name a theorist's stage. 65%+ correct.",
      MEDIUM: "Apply a concept to a scenario (e.g., identify which type of learning is demonstrated). 40–55% correct.",
      HARD: "Distinguish between two similar concepts (e.g., negative reinforcement vs punishment) in an ambiguous scenario, or evaluate treatment effectiveness. 25–40% correct.",
    },
    distractorTaxonomy: "(1) SIMILAR-TERM TRAP — negative reinforcement vs punishment; classical vs operant; (2) WRONG-THEORIST TRAP — attributes Freud's idea to Erikson or vice versa; (3) DIRECTION TRAP — confuses what increases vs decreases behavior.",
    stimulusQualityGuidance: "GOOD: 'A child cries and his mother gives him a cookie, which stops the crying. The mother is more likely to give cookies in the future.' AVOID: Abstract definitions without a behavioral scenario.",
    skillCodes: ["Concept Identification", "Application to Scenarios", "Research Methods", "Theoretical Frameworks"],
    // CB weights summed into 5 units: Bio bases (8-9% + 7-8% sensation + 5-6% consciousness) ≈ 21%,
    // Cognition (8-9% learning + 8-9% cognition + 5-6% motivation) ≈ 22%, Developmental 8-9% ≈ 9%,
    // Social/Personality (9-10% social + 7-8% personality + 11-12% history/methods + 3-4% stats) ≈ 31%,
    // Clinical (8-9% disorders + 6-7% treatment) ≈ 15%
    topicWeights: {
      "CLEP_PSY_1_BIOLOGICAL_BASES": 0.21,
      "CLEP_PSY_2_COGNITION_MEMORY": 0.22,
      "CLEP_PSY_3_DEVELOPMENTAL": 0.09,
      "CLEP_PSY_4_SOCIAL_PERSONALITY": 0.33,
      "CLEP_PSY_5_CLINICAL_ABNORMAL": 0.15,
    },
    recommendedTextbooks: [
      "Myers & DeWall, Psychology (Worth Publishers)",
      "OpenStax Psychology 2e (free: openstax.org/books/psychology-2e)",
      "Noba Project Psychology Modules (free: nobaproject.com)",
    ],
  },

  // ── CLEP Principles of Marketing ────────────────────────────────────────
  CLEP_PRINCIPLES_OF_MARKETING: {
    name: "CLEP Principles of Marketing",
    shortName: "CLEP Marketing",
    examSecsPerQuestion: 54, // 100 questions in 90 minutes
    mockExam: { mcqCount: 100, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_MARKETING_1_FUNDAMENTALS: {
        name: "Unit 1: Marketing Fundamentals and Environment",
        keyThemes: ["marketing concept", "value creation", "SWOT analysis", "marketing mix 4Ps", "macro and micro environment", "target markets"],
        openStaxUrl: "https://openstax.org/books/principles-marketing/pages/1-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/microeconomics",
      },
      CLEP_MARKETING_2_CONSUMER_BEHAVIOR: {
        name: "Unit 2: Consumer Behavior and Market Research",
        keyThemes: ["buying decision process", "psychological factors", "social influences", "market segmentation", "primary vs secondary research", "survey design"],
        openStaxUrl: "https://openstax.org/books/principles-marketing/pages/3-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/microeconomics/consumer-theory",
      },
      CLEP_MARKETING_3_PRODUCT_PRICING: {
        name: "Unit 3: Product and Pricing Strategy",
        keyThemes: ["product life cycle", "branding", "packaging", "price elasticity", "cost-plus pricing", "penetration vs skimming pricing", "new product development"],
        openStaxUrl: "https://openstax.org/books/principles-marketing/pages/7-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/microeconomics/firm-economic-profit",
      },
      CLEP_MARKETING_4_DISTRIBUTION_PROMOTION: {
        name: "Unit 4: Distribution and Promotion",
        keyThemes: ["distribution channels", "logistics", "wholesalers vs retailers", "integrated marketing communications", "advertising", "personal selling", "sales promotion"],
        openStaxUrl: "https://openstax.org/books/principles-marketing/pages/11-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain",
      },
      CLEP_MARKETING_5_DIGITAL_GLOBAL: {
        name: "Unit 5: Digital and Global Marketing",
        keyThemes: ["social media marketing", "SEO", "content marketing", "global marketing adaptation", "e-commerce", "cultural considerations", "international trade"],
        openStaxUrl: "https://openstax.org/books/principles-marketing/pages/16-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/macroeconomics/international-trade-topic",
      },
    },
    suggestedTutorQuestions: [
      "What is the difference between the 4Ps and the 4Cs of marketing?",
      "How does price elasticity affect a company's pricing strategy?",
      "What is the product life cycle and how does marketing strategy change at each stage?",
      "What is market segmentation and why does it matter?",
      "How is digital marketing different from traditional marketing?",
      "What is integrated marketing communications?",
    ],
    curriculumContext: `CLEP Principles of Marketing covers introductory marketing concepts from an undergraduate business course.
Exam: 100 questions, 90 minutes. Passing earns 3 college credits (~$1,200 tuition savings).
Topics: Role of marketing (10%), marketing strategy (20%), consumer behavior/market research (15%),
product (15%), price (15%), place/distribution (10%), promotion (10%), international marketing (5%).`,
    tutorResources: `
- OpenStax Principles of Marketing (openstax.org/books/principles-marketing): Free, CC-licensed, full textbook
- LibreTexts Business: Marketing (biz.libretexts.org): Free open-access marketing textbook
- SCORE Business Learning Center (score.org/resource/marketing): Free small-business marketing guides`,
    examAlignmentNotes: `CLEP Principles of Marketing alignment:
- Questions are application-focused — given a business scenario, identify the correct marketing concept
- Heavy weight on marketing strategy and marketing mix (4Ps)
- Consumer behavior and segmentation appear frequently
- Digital marketing has growing presence in recent exams`,
    stimulusRequirement: "Include a business scenario or case vignette (2-3 sentences) as stimulus for application questions; null for direct recall",
    stimulusDescription: "business scenario or product launch vignette (null for direct recall questions)",
    explanationGuidance: "naming the specific marketing concept and explaining why the business scenario fits that concept over similar alternatives",
    difficultyRubric: {
      EASY: "Recall a definition (e.g., what is penetration pricing?) or identify a 4P element. 65%+ correct.",
      MEDIUM: "Apply a marketing concept to a business case (e.g., which pricing strategy would Apple use for a new product launch?). 40–55% correct.",
      HARD: "Evaluate a marketing strategy given conflicting objectives (e.g., maximize market share vs maximize profit) or analyze a segmentation scenario with multiple valid approaches. 25–40% correct.",
    },
    distractorTaxonomy: "(1) SIMILAR-STRATEGY TRAP — skimming vs premium pricing; push vs pull strategy; (2) WRONG-STAGE TRAP — applies introduction-stage strategy to maturity stage of PLC; (3) DIRECTION-OF-CAUSATION TRAP — confuses whether consumer demand drives price or price drives demand.",
    stimulusQualityGuidance: "GOOD: 'A tech company launches a flagship phone at $1,499 to signal premium quality and recover R&D costs. Which pricing strategy is this?' AVOID: Hypothetical companies with no industry context.",
    skillCodes: ["Marketing Mix Application", "Consumer Analysis", "Strategic Decision-Making", "Market Research"],
    // CB weights: roughly equal with slight emphasis on fundamentals and product/pricing
    topicWeights: {
      "CLEP_MARKETING_1_FUNDAMENTALS": 0.25,
      "CLEP_MARKETING_2_CONSUMER_BEHAVIOR": 0.15,
      "CLEP_MARKETING_3_PRODUCT_PRICING": 0.25,
      "CLEP_MARKETING_4_DISTRIBUTION_PROMOTION": 0.20,
      "CLEP_MARKETING_5_DIGITAL_GLOBAL": 0.15,
    },
    recommendedTextbooks: [
      "OpenStax Principles of Marketing (free: openstax.org/books/principles-marketing)",
      "Kotler & Armstrong, Principles of Marketing (Pearson)",
      "Lamb et al., MKTG (Cengage)",
    ],
  },

  // ── CLEP Principles of Management ────────────────────────────────────────
  CLEP_PRINCIPLES_OF_MANAGEMENT: {
    name: "CLEP Principles of Management",
    shortName: "CLEP Management",
    examSecsPerQuestion: 54, // 100 questions in 90 minutes
    mockExam: { mcqCount: 100, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_MGMT_1_PLANNING_ORGANIZING: {
        name: "Unit 1: Planning and Organizing",
        keyThemes: ["strategic planning", "SWOT analysis", "organizational structure", "span of control", "centralization vs decentralization", "mission and vision", "MBO"],
        openStaxUrl: "https://openstax.org/books/principles-management/pages/1-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/macroeconomics",
      },
      CLEP_MGMT_2_LEADING_MOTIVATION: {
        name: "Unit 2: Leading and Motivation",
        keyThemes: ["leadership styles", "Maslow's hierarchy", "Herzberg two-factor", "expectancy theory", "equity theory", "transformational vs transactional leadership", "emotional intelligence"],
        openStaxUrl: "https://openstax.org/books/principles-management/pages/12-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain",
      },
      CLEP_MGMT_3_CONTROLLING_OPERATIONS: {
        name: "Unit 3: Controlling and Operations",
        keyThemes: ["control process", "benchmarking", "balanced scorecard", "quality management", "TQM", "supply chain", "inventory management"],
        openStaxUrl: "https://openstax.org/books/principles-management/pages/16-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain",
      },
      CLEP_MGMT_4_HUMAN_RESOURCES: {
        name: "Unit 4: Human Resources and Organizational Behavior",
        keyThemes: ["recruitment and selection", "training and development", "performance appraisal", "compensation", "group dynamics", "conflict resolution", "organizational culture"],
        openStaxUrl: "https://openstax.org/books/principles-management/pages/10-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain",
      },
      CLEP_MGMT_5_STRATEGIC_ETHICS: {
        name: "Unit 5: Strategy, Ethics, and Global Management",
        keyThemes: ["Porter's five forces", "competitive advantage", "corporate social responsibility", "ethical decision-making", "stakeholder theory", "global expansion strategies"],
        openStaxUrl: "https://openstax.org/books/principles-management/pages/4-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/macroeconomics/international-trade-topic",
      },
    },
    suggestedTutorQuestions: [
      "What is the difference between transformational and transactional leadership?",
      "How does Maslow's hierarchy of needs apply to employee motivation?",
      "What is the difference between centralized and decentralized organizations?",
      "What are Porter's five forces and why do they matter?",
      "What is Management by Objectives (MBO)?",
      "What is the balanced scorecard approach to performance management?",
    ],
    curriculumContext: `CLEP Principles of Management covers foundational management concepts from an introductory undergraduate course.
Exam: 100 questions, 90 minutes. Passing earns 3 college credits (~$1,200 tuition savings).
Topics: Organization and management (10%), planning (10%), organizing (15%), staffing (10%), directing/leading (20%),
motivating (15%), controlling (15%), organizational behavior (5%).`,
    tutorResources: `
- OpenStax Principles of Management (openstax.org/books/principles-management): Free, CC-licensed
- LibreTexts Management: Management and Organizational Behavior (biz.libretexts.org): Free open-access
- MindTools Management Skills (mindtools.com): Free practical management frameworks and summaries`,
    examAlignmentNotes: `CLEP Principles of Management alignment:
- Leadership and motivation have combined 35% weight — know all major theories
- Organizing and planning together: ~25%
- Scenario-based questions dominate — given a management situation, identify the correct theory or action
- Herzberg, Maslow, Fiedler, and Vroom appear frequently`,
    stimulusRequirement: "Include a workplace scenario (2-3 sentences) as stimulus for application questions; null for direct recall of theory names",
    stimulusDescription: "workplace or business scenario (null for direct theory-recall questions)",
    explanationGuidance: "naming the specific management theory or framework and explaining how it applies to the scenario and why competing theories don't fit",
    difficultyRubric: {
      EASY: "Recall a theory name and its core idea (e.g., what does Maslow's esteem level represent?). 65%+ correct.",
      MEDIUM: "Apply a motivation or leadership theory to a given workplace situation. 40–55% correct.",
      HARD: "Distinguish between two similar theories (e.g., Hersey-Blanchard vs Fiedler contingency) in an ambiguous scenario, or evaluate a strategic management decision with trade-offs. 25–40% correct.",
    },
    distractorTaxonomy: "(1) THEORY-CONFUSION TRAP — Herzberg hygiene factor vs motivator; McGregor X vs Y; (2) LEVEL-CONFUSION TRAP — Maslow safety vs esteem; (3) DIRECTION TRAP — confuses what increases vs decreases motivation or performance.",
    stimulusQualityGuidance: "GOOD: 'A manager gives employees decision-making authority and trusts them to self-direct. Which leadership style does this represent?' AVOID: Vague 'a company changed its strategy' without enough detail to apply a theory.",
    skillCodes: ["Management Theory Application", "Leadership Analysis", "Organizational Design", "Strategic Thinking"],
    // CB weights: Planning/organizing 30%, Leading/motivation 25%, Controlling/operations 20%, HR 15%, Strategic/ethics 10%
    topicWeights: {
      "CLEP_MGMT_1_PLANNING_ORGANIZING": 0.30,
      "CLEP_MGMT_2_LEADING_MOTIVATION": 0.25,
      "CLEP_MGMT_3_CONTROLLING_OPERATIONS": 0.20,
      "CLEP_MGMT_4_HUMAN_RESOURCES": 0.15,
      "CLEP_MGMT_5_STRATEGIC_ETHICS": 0.10,
    },
    recommendedTextbooks: [
      "OpenStax Principles of Management (free: openstax.org/books/principles-management)",
      "Robbins & Coulter, Management (Prentice Hall)",
      "Daft & Marcic, Understanding Management (Cengage)",
    ],
  },

  // ── CLEP Introductory Sociology ──────────────────────────────────────────
  CLEP_INTRODUCTORY_SOCIOLOGY: {
    name: "CLEP Introductory Sociology",
    shortName: "CLEP Sociology",
    examSecsPerQuestion: 54, // 100 questions in 90 minutes
    mockExam: { mcqCount: 100, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_SOC_1_SOCIOLOGICAL_PERSPECTIVE: {
        name: "Unit 1: The Sociological Perspective and Research Methods",
        keyThemes: ["sociological imagination", "conflict theory", "functionalism", "symbolic interactionism", "quantitative vs qualitative research", "surveys and experiments"],
        openStaxUrl: "https://openstax.org/books/introduction-sociology-3e/pages/1-introduction",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/theories-of-socialization",
      },
      CLEP_SOC_2_SOCIAL_STRUCTURE_GROUPS: {
        name: "Unit 2: Social Structure, Groups, and Culture",
        keyThemes: ["norms and values", "culture and subculture", "socialization", "primary vs secondary groups", "formal organizations", "bureaucracy", "social roles"],
        openStaxUrl: "https://openstax.org/books/introduction-sociology-3e/pages/3-introduction",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior",
      },
      CLEP_SOC_3_SOCIAL_STRATIFICATION: {
        name: "Unit 3: Social Stratification and Inequality",
        keyThemes: ["class systems", "social mobility", "income inequality", "racial and ethnic stratification", "gender inequality", "intersectionality", "global inequality"],
        openStaxUrl: "https://openstax.org/books/introduction-sociology-3e/pages/9-introduction",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/social-inequality",
      },
      CLEP_SOC_4_SOCIAL_INSTITUTIONS: {
        name: "Unit 4: Social Institutions",
        keyThemes: ["family structures", "education systems", "religion and society", "economic institutions", "political institutions", "healthcare systems", "media influence"],
        openStaxUrl: "https://openstax.org/books/introduction-sociology-3e/pages/13-introduction",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior",
      },
      CLEP_SOC_5_SOCIAL_CHANGE_DEVIANCE: {
        name: "Unit 5: Social Change and Deviance",
        keyThemes: ["deviance definitions", "labeling theory", "strain theory", "crime statistics", "social movements", "collective behavior", "globalization effects"],
        openStaxUrl: "https://openstax.org/books/introduction-sociology-3e/pages/7-introduction",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/social-structures",
      },
    },
    suggestedTutorQuestions: [
      "What is the sociological imagination and why does it matter?",
      "What are the three major sociological theories — functionalism, conflict, and symbolic interactionism?",
      "How is social stratification different from social mobility?",
      "What is labeling theory and how does it explain deviance?",
      "What is the difference between primary and secondary socialization?",
      "How do sociologists define culture, and what are norms vs values?",
    ],
    curriculumContext: `CLEP Introductory Sociology covers the scope of an introductory undergraduate sociology course.
Exam: 100 questions, 90 minutes. Passing earns 3 college credits (~$1,200 tuition savings).
Topics: Institutions (15%), social patterns (31%), social processes (17%), social stratification (25%),
sociological theory and methods (12%).`,
    tutorResources: `
- OpenStax Introduction to Sociology 3e (openstax.org/books/introduction-sociology-3e): Free, CC-licensed
- Khan Academy MCAT Social and Behavioral Sciences (khanacademy.org): Free lessons covering key sociological concepts
- LibreTexts Sociology (socialsci.libretexts.org): Free open-access chapters on stratification, deviance, and institutions`,
    examAlignmentNotes: `CLEP Introductory Sociology alignment (College Board official weights):
- Institutions: 20%
- Social Patterns: 10%
- Social Processes: 25%
- Social Stratification: 25%
- The Sociological Perspective: 20%
~100 questions (some unscored pretests) in 90 minutes.
Tested competencies: (1) identifying facts/concepts, (2) understanding concept relationships, (3) understanding research methods, (4) applying concepts to hypothetical situations, (5) interpreting tables and charts.
Passing score: 50 (ACE recommendation), earns 3 semester hours.
Questions are often scenario-based — given a social situation, identify the correct sociological concept.`,
    stimulusRequirement: "Include a brief social scenario or research finding as stimulus for application questions; null for direct theory-recall",
    stimulusDescription: "social scenario or research summary (null for direct recall of theory names)",
    explanationGuidance: "naming the specific sociological theory or concept and explaining how it interprets the scenario, contrasting with the alternative theories in the distractors",
    difficultyRubric: {
      EASY: "Recall a sociological term (e.g., what is a norm?) or identify which major theory explains a given statement. 65%+ correct.",
      MEDIUM: "Apply a sociological concept to a social scenario (e.g., which type of social mobility does this represent?). 40–55% correct.",
      HARD: "Distinguish between two similar theories or levels of analysis (micro vs macro) in an ambiguous social scenario, or evaluate research methodology for a sociological study. 25–40% correct.",
    },
    distractorTaxonomy: "(1) THEORY-DIRECTION TRAP — conflict theory vs functionalism give opposite explanations for the same phenomenon; (2) LEVEL-ANALYSIS TRAP — micro vs macro sociological perspective; (3) ADJACENT-CONCEPT TRAP — folkways vs mores; primary vs secondary groups.",
    stimulusQualityGuidance: "GOOD: 'A sociologist argues that poverty persists because it serves a function for the wealthy by providing a cheap labor supply. Which theoretical perspective does this represent?' AVOID: Abstract definitions without a social context.",
    skillCodes: ["Theory Application", "Social Structure Analysis", "Research Methods", "Stratification and Inequality"],
    // CB weights: Institutions 20%, Social Patterns 10%, Social Processes 25%, Social Stratification 25%, Sociological Perspective 20%
    topicWeights: {
      "CLEP_SOC_1_SOCIOLOGICAL_PERSPECTIVE": 0.20,
      "CLEP_SOC_2_SOCIAL_STRUCTURE_GROUPS": 0.10,
      "CLEP_SOC_3_SOCIAL_STRATIFICATION": 0.25,
      "CLEP_SOC_4_SOCIAL_INSTITUTIONS": 0.20,
      "CLEP_SOC_5_SOCIAL_CHANGE_DEVIANCE": 0.25,
    },
    recommendedTextbooks: [
      "Macionis, Sociology (Pearson)",
      "OpenStax Introduction to Sociology 3e (free: openstax.org/books/introduction-sociology-3e)",
      "Henslin, Essentials of Sociology (Pearson)",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW CLEP COURSES — Phase 1 (High Demand) + Phase 2
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── CLEP American Government ───
  CLEP_AMERICAN_GOVERNMENT: {
    name: "CLEP American Government",
    shortName: "CLEP Am. Gov",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_GOV_1_FOUNDATIONS: { name: "Unit 1: Constitutional Foundations", keyThemes: ["separation of powers", "federalism", "constitutional amendments", "checks and balances"] },
      CLEP_GOV_2_POLITICAL_BELIEFS: { name: "Unit 2: Political Beliefs and Behaviors", keyThemes: ["political socialization", "public opinion polling", "voter turnout", "political ideology spectrum"] },
      CLEP_GOV_3_POLITICAL_PARTIES: { name: "Unit 3: Political Parties and Interest Groups", keyThemes: ["two-party system", "third parties", "interest group tactics", "PACs and campaign finance"] },
      CLEP_GOV_4_INSTITUTIONS: { name: "Unit 4: Institutions of Government", keyThemes: ["congressional committees", "presidential powers", "judicial review", "bureaucratic agencies"] },
      CLEP_GOV_5_CIVIL_RIGHTS: { name: "Unit 5: Civil Rights and Civil Liberties", keyThemes: ["Bill of Rights incorporation", "equal protection clause", "landmark Supreme Court cases", "due process"] },
    },
    suggestedTutorQuestions: ["How does judicial review check the other branches?", "What factors influence voter turnout?", "How do interest groups differ from political parties?"],
    curriculumContext: `CLEP American Government covers the structure and function of the US government. Exam: 100 questions, 120 minutes. Passing earns 3 credits (~$1,200 savings). Content: institutions (30-35%), political behavior (15-20%), civil rights/liberties (15-20%), parties/interest groups (15-20%), constitutional foundations (10-15%). Cognitive: 30-40% Recall, 40-50% Understanding, 20-30% Application.`,
    tutorResources: `- OpenStax American Government 3e (openstax.org/books/american-government-3e): CC BY 4.0\n- Khan Academy US Government (khanacademy.org/humanities/us-government-and-civics)\n- Saylor Academy POLSC231 (learn.saylor.org)`,
    examAlignmentNotes: `CLEP American Government alignment (College Board official weights):
- Institutions and Policy Processes (Presidency, Bureaucracy, Congress, Federal Courts): 30-35%
- Political Parties and Interest Groups: 15-20%
- Political Beliefs and Behavior: 15-20%
- Civil Liberties and Civil Rights: 10-15%
- Constitutional Underpinnings of American Democracy: 15-20%
Competency breakdown: 55-60% knowledge of government/politics, 30-35% understanding processes/behavior patterns, 10-15% analysis and interpretation of data.
~100 questions (some unscored pretests) in 90 minutes.
Passing score: 50 (ACE recommendation), earns 3 semester hours.
Scenario-based preferred.`,
    stimulusRequirement: "Include a political scenario, Supreme Court case excerpt, or policy situation as stimulus; null for direct constitutional recall",
    stimulusDescription: "political scenario, court case reference, or policy situation",
    explanationGuidance: "citing the specific constitutional clause, amendment, or court precedent",
    skillCodes: ["Constitutional Analysis", "Policy Evaluation", "Institutional Comparison", "Civil Liberties Application"],
    difficultyRubric: { EASY: "Recall a constitutional provision or branch power (Bloom's: Remember). 65%+ correct.", MEDIUM: "Explain how a check/balance operates in a scenario (Bloom's: Apply). 40-55% correct.", HARD: "Evaluate competing constitutional interpretations or predict institutional behavior in a novel scenario (Bloom's: Analyze/Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) BRANCH-CONFUSION TRAP — attributes power to wrong branch; (2) AMENDMENT-MIX TRAP — confuses which amendment guarantees which right; (3) FEDERALISM-LEVEL TRAP — assigns state power to federal or vice versa.",
    stimulusQualityGuidance: "GOOD: 'A state passes a law requiring loyalty oaths. A student sues. Which precedent applies?' AVOID: 'Which amendment protects free speech?'",
    // CB weights: Institutions 30-35%, Parties 15-20%, Political beliefs 15-20%, Civil rights 10-15%, Constitutional 15-20%
    topicWeights: {
      "CLEP_GOV_1_FOUNDATIONS": 0.175,
      "CLEP_GOV_2_POLITICAL_BELIEFS": 0.175,
      "CLEP_GOV_3_POLITICAL_PARTIES": 0.175,
      "CLEP_GOV_4_INSTITUTIONS": 0.325,
      "CLEP_GOV_5_CIVIL_RIGHTS": 0.15,
    },
    recommendedTextbooks: [
      "OpenStax American Government 3e (free: openstax.org/books/american-government-3e)",
      "Edwards et al., Government in America (Pearson)",
      "Wilson et al., American Government (Cengage)",
    ],
  },

  // ─── CLEP Macroeconomics ───
  CLEP_MACROECONOMICS: {
    name: "CLEP Principles of Macroeconomics",
    shortName: "CLEP Macro",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 80, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_MACRO_1_BASIC_CONCEPTS: { name: "Unit 1: Basic Economic Concepts", keyThemes: ["scarcity and opportunity cost", "production possibilities curve", "comparative advantage", "circular flow model"] },
      CLEP_MACRO_2_GDP_MEASUREMENT: { name: "Unit 2: Measuring Economic Performance", keyThemes: ["GDP calculation methods", "inflation and CPI", "unemployment types", "business cycle phases"] },
      CLEP_MACRO_3_FISCAL_POLICY: { name: "Unit 3: Fiscal Policy and the Budget", keyThemes: ["government spending multiplier", "automatic stabilizers", "budget deficits and national debt", "crowding out effect"] },
      CLEP_MACRO_4_MONETARY_POLICY: { name: "Unit 4: Money and Monetary Policy", keyThemes: ["money supply M1/M2", "Federal Reserve tools", "money multiplier", "quantity theory of money"] },
      CLEP_MACRO_5_INTERNATIONAL: { name: "Unit 5: International Economics", keyThemes: ["balance of payments", "exchange rate determination", "trade barriers and tariffs", "capital flows"] },
    },
    suggestedTutorQuestions: ["How does the Federal Reserve use open market operations?", "What is the difference between real and nominal GDP?", "How does the multiplier effect work?"],
    curriculumContext: `CLEP Macroeconomics covers aggregate economic behavior and policy. Exam: 80 questions, 90 minutes. Passing earns 3 credits (~$1,200 savings). Content: national income/price (15-20%), financial sector (15-20%), stabilization (20-25%), growth (5-10%), international (10-15%), basics (8-13%). Cognitive: 30-40% Recall, 40-50% Understanding, 20-30% Application.`,
    tutorResources: `- OpenStax Principles of Macroeconomics 3e (openstax.org/books/principles-macroeconomics-3e): CC BY 4.0\n- Khan Academy Macroeconomics (khanacademy.org/economics-finance-domain/macroeconomics)\n- CORE Econ (core-econ.org)`,
    examAlignmentNotes: `National income/price: 15-20%, Financial sector: 15-20%, Stabilization: 20-25%, Growth: 5-10%, International: 10-15%, Basics: 8-13%. All 5-choice MCQ. Graph interpretation heavily tested.`,
    stimulusRequirement: "Include an economic scenario, data table, or AD-AS model description as stimulus; null for definition recall",
    stimulusDescription: "economic scenario, data table, or macroeconomic model description",
    explanationGuidance: "referencing the specific model (AD-AS, Phillips Curve, loanable funds) and tracing the causal chain",
    skillCodes: ["Model Interpretation", "Policy Analysis", "Data Calculation", "Causal Reasoning"],
    difficultyRubric: { EASY: "Recall a macro definition or identify a GDP component (Bloom's: Remember). 65%+ correct.", MEDIUM: "Predict shift direction on AD-AS diagram given a policy change (Bloom's: Apply). 40-55% correct.", HARD: "Analyze combined fiscal+monetary policy effects on output, prices, and interest rates (Bloom's: Analyze/Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) SHIFT-VS-MOVEMENT TRAP — confuses curve shift with movement along it; (2) REAL-NOMINAL TRAP — uses nominal values where real needed; (3) SHORT-RUN/LONG-RUN TRAP — applies short-run logic to long-run equilibrium.",
    stimulusQualityGuidance: "GOOD: 'The central bank increases reserve requirement from 10% to 12%. Calculate the max change in money supply from a $1B deposit.' AVOID: 'What does the Federal Reserve do?'",
    // CB weights: Basic concepts 8-13%, National income 15-20%, Financial sector 15-20%, Stabilization 20-25%, Growth 5-10%, International 10-15%
    topicWeights: {
      "CLEP_MACRO_1_BASIC_CONCEPTS": 0.12,
      "CLEP_MACRO_2_GDP_MEASUREMENT": 0.20,
      "CLEP_MACRO_3_FISCAL_POLICY": 0.25,
      "CLEP_MACRO_4_MONETARY_POLICY": 0.20,
      "CLEP_MACRO_5_INTERNATIONAL": 0.23,
    },
    recommendedTextbooks: [
      "OpenStax Principles of Macroeconomics 3e (free: openstax.org/books/principles-macroeconomics-3e)",
      "Mankiw, Principles of Macroeconomics (Cengage)",
      "McConnell et al., Macroeconomics (McGraw-Hill)",
    ],
  },

  // ─── CLEP Microeconomics ───
  CLEP_MICROECONOMICS: {
    name: "CLEP Principles of Microeconomics",
    shortName: "CLEP Micro",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 80, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_MICRO_1_SUPPLY_DEMAND: { name: "Unit 1: Supply and Demand", keyThemes: ["law of demand", "supply shifters", "equilibrium price", "price ceilings and floors"] },
      CLEP_MICRO_2_ELASTICITY: { name: "Unit 2: Elasticity and Consumer Choice", keyThemes: ["price elasticity of demand", "cross-price elasticity", "income elasticity", "marginal utility"] },
      CLEP_MICRO_3_MARKET_STRUCTURES: { name: "Unit 3: Market Structures", keyThemes: ["perfect competition", "monopoly deadweight loss", "monopolistic competition", "oligopoly and game theory"] },
      CLEP_MICRO_4_FACTOR_MARKETS: { name: "Unit 4: Factor Markets", keyThemes: ["marginal revenue product", "labor demand and supply", "wage determination", "monopsony"] },
      CLEP_MICRO_5_MARKET_FAILURE: { name: "Unit 5: Market Failure and Government", keyThemes: ["externalities and Pigouvian taxes", "public goods and free riders", "asymmetric information", "antitrust policy"] },
    },
    suggestedTutorQuestions: ["How do firms maximize profit in perfect competition vs monopoly?", "What happens with a price ceiling below equilibrium?", "How do externalities cause market failure?"],
    curriculumContext: `CLEP Microeconomics covers individual markets, firm behavior, and resource allocation. Exam: 80 questions, 90 minutes. Passing earns 3 credits (~$1,200 savings). Content: supply/demand (15-20%), firm theory/market structures (25-35%), factor markets (10-15%), market failure (15-20%), basics (8-14%). Cognitive: 30-40% Recall, 40-50% Understanding, 20-30% Application.`,
    tutorResources: `- OpenStax Principles of Microeconomics 3e (openstax.org/books/principles-microeconomics-3e): CC BY 4.0\n- Khan Academy Microeconomics (khanacademy.org/economics-finance-domain/microeconomics)\n- CORE Econ (core-econ.org)`,
    examAlignmentNotes: `Product markets: 55-70% (supply/demand 15-20%, consumer choice 5-10%, production/costs 10-15%, market structure 25-35%), Factor markets: 10-15%, Market failure: 15-20%. All 5-choice MCQ. Graph analysis essential.`,
    stimulusRequirement: "Include a market scenario, cost/revenue data table, or supply-demand description; null for concept recall",
    stimulusDescription: "market scenario, cost table, or supply-demand graph description",
    explanationGuidance: "referencing the market model, identifying MR=MC rule, and tracing surplus/loss areas",
    skillCodes: ["Graph Analysis", "Marginal Analysis", "Market Comparison", "Efficiency Evaluation"],
    difficultyRubric: { EASY: "Identify a supply/demand shifter or recall elasticity definition (Bloom's: Remember). 65%+ correct.", MEDIUM: "Calculate profit/loss from a cost table or predict price changes from simultaneous shifts (Bloom's: Apply). 40-55% correct.", HARD: "Compare welfare outcomes across market structures or evaluate government intervention efficiency using deadweight loss (Bloom's: Analyze/Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) MR-VS-PRICE TRAP — uses price instead of MR for monopoly; (2) FIXED-VARIABLE TRAP — treats fixed costs as relevant to shutdown (should compare P to AVC); (3) SURPLUS-DIRECTION TRAP — confuses consumer and producer surplus areas.",
    stimulusQualityGuidance: "GOOD: 'A firm in perfect competition has TC = 100 + 5Q + Q². Market price is $25. Calculate profit-maximizing Q and economic profit.' AVOID: 'What is perfect competition?'",
    // CB weights: Supply/demand 15-20%, Consumer theory 10-15%, Market structures 25-30%, Factor markets 10%, Public goods/externalities 10-15%
    topicWeights: {
      "CLEP_MICRO_1_SUPPLY_DEMAND": 0.20,
      "CLEP_MICRO_2_ELASTICITY": 0.13,
      "CLEP_MICRO_3_MARKET_STRUCTURES": 0.30,
      "CLEP_MICRO_4_FACTOR_MARKETS": 0.12,
      "CLEP_MICRO_5_MARKET_FAILURE": 0.25,
    },
    recommendedTextbooks: [
      "OpenStax Principles of Microeconomics 3e (free: openstax.org/books/principles-microeconomics-3e)",
      "Mankiw, Principles of Microeconomics (Cengage)",
    ],
  },

  // ─── CLEP Biology ───
  CLEP_BIOLOGY: {
    name: "CLEP Biology",
    shortName: "CLEP Biology",
    examSecsPerQuestion: 47,
    mockExam: { mcqCount: 115, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_BIO_1_MOLECULAR_CELL: { name: "Unit 1: Molecular and Cellular Biology", keyThemes: ["cell membrane transport", "enzyme kinetics", "cellular respiration", "photosynthesis"] },
      CLEP_BIO_2_GENETICS: { name: "Unit 2: Genetics and Molecular Biology", keyThemes: ["Mendelian inheritance", "DNA replication", "gene expression", "biotechnology techniques"] },
      CLEP_BIO_3_EVOLUTION: { name: "Unit 3: Evolution and Diversity", keyThemes: ["natural selection", "speciation", "phylogenetics", "Hardy-Weinberg equilibrium"] },
      CLEP_BIO_4_ORGANISMS: { name: "Unit 4: Organismal Biology", keyThemes: ["plant structure/function", "animal organ systems", "homeostasis", "nervous/endocrine systems"] },
      CLEP_BIO_5_ECOLOGY: { name: "Unit 5: Ecology and Population Biology", keyThemes: ["energy flow and trophic levels", "biogeochemical cycles", "population growth models", "community interactions"] },
    },
    suggestedTutorQuestions: ["How do light reactions and Calvin cycle work together?", "What is the difference between mitosis and meiosis?", "How does natural selection lead to speciation?"],
    curriculumContext: `CLEP Biology covers general college biology. Exam: 115 questions, 90 minutes. Passing earns 6 credits (~$2,400 savings). Content: molecular/cellular (33%), organismal (34%), population/ecology/evolution (33%). Cognitive: 30-40% Recall, 40-50% Understanding, 20-30% Application.`,
    tutorResources: `- OpenStax Biology 2e (openstax.org/books/biology-2e): CC BY 4.0\n- Khan Academy Biology (khanacademy.org/science/biology)\n- LibreTexts Biology (bio.libretexts.org): CC BY-NC-SA`,
    examAlignmentNotes: `Molecular/cellular: 33%, Organismal: 34%, Population/ecology/evolution: 33%. All 5-choice MCQ. Experimental design and data interpretation heavily tested.`,
    stimulusRequirement: "Include an experimental setup, data table, or biological scenario as stimulus; null for direct term recall",
    stimulusDescription: "experimental scenario, data table, or biological diagram description",
    explanationGuidance: "identifying the biological mechanism, explaining cause-and-effect, and connecting to broader principles",
    skillCodes: ["Experimental Design", "Data Interpretation", "Mechanism Explanation", "Evolutionary Reasoning"],
    difficultyRubric: { EASY: "Recall function of a cell organelle or identify a mitosis stage (Bloom's: Remember). 65%+ correct.", MEDIUM: "Predict outcome of a genetic cross or trace energy through a metabolic pathway (Bloom's: Apply). 40-55% correct.", HARD: "Analyze experimental data on enzyme kinetics or evaluate which evolutionary mechanism explains an observed population change (Bloom's: Analyze/Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) PROCESS-REVERSAL TRAP — confuses photosynthesis/respiration reactants and products; (2) DOMINANCE-MISCONCEPTION TRAP — assumes dominant alleles are more common; (3) CORRELATION-CAUSATION TRAP — ecological correlation mistaken for causation.",
    stimulusQualityGuidance: "GOOD: 'An experiment measures O₂ in spinach at 20°C and 35°C. At 35°C, O₂ drops 40%. Which explanation best accounts for this?' AVOID: 'Where does photosynthesis occur?'",
    // CB weights: Molecular/cell biology 33%, Organismal biology 34%, Population biology 33% — mapped across 5 units
    topicWeights: {
      "CLEP_BIO_1_MOLECULAR_CELL": 0.20,
      "CLEP_BIO_2_GENETICS": 0.17,
      "CLEP_BIO_3_EVOLUTION": 0.17,
      "CLEP_BIO_4_ORGANISMS": 0.30,
      "CLEP_BIO_5_ECOLOGY": 0.16,
    },
    recommendedTextbooks: [
      "OpenStax Biology 2e (free: openstax.org/books/biology-2e)",
      "Campbell Biology (Pearson)",
    ],
  },

  // ─── CLEP US History I ───
  CLEP_US_HISTORY_1: {
    name: "CLEP History of the United States I",
    shortName: "CLEP US Hist I",
    examSecsPerQuestion: 45,
    mockExam: { mcqCount: 120, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_USH1_1_COLONIAL: { name: "Unit 1: Colonial Period (1491-1763)", keyThemes: ["Columbian Exchange", "colonial economies", "indentured servitude and slavery", "French and Indian War"] },
      CLEP_USH1_2_REVOLUTION: { name: "Unit 2: American Revolution (1763-1783)", keyThemes: ["taxation without representation", "Declaration of Independence", "Revolutionary War strategy", "Loyalists vs Patriots"] },
      CLEP_USH1_3_EARLY_REPUBLIC: { name: "Unit 3: Early Republic (1783-1820)", keyThemes: ["Articles of Confederation", "Constitutional Convention", "Federalist vs Anti-Federalist", "Marbury v. Madison"] },
      CLEP_USH1_4_EXPANSION_REFORM: { name: "Unit 4: Expansion and Reform (1820-1860)", keyThemes: ["Manifest Destiny", "Jacksonian democracy", "abolitionism and women's suffrage", "Missouri Compromise"] },
      CLEP_USH1_5_CIVIL_WAR: { name: "Unit 5: Civil War and Reconstruction (1860-1877)", keyThemes: ["secession", "Emancipation Proclamation", "total war strategy", "Reconstruction amendments"] },
    },
    suggestedTutorQuestions: ["How did the Columbian Exchange transform both hemispheres?", "What were key compromises at the Constitutional Convention?", "Why did Reconstruction fail?"],
    curriculumContext: `CLEP US History I covers colonization through Reconstruction (1491-1877). Exam: 120 questions, 90 minutes. Passing earns 3 credits (~$1,200 savings). Content: colonial (20%), revolution/early republic (25%), Jacksonian/reform (25%), Civil War/Reconstruction (20%), themes (10%). Cognitive: 30-40% Recall, 40-50% Understanding, 20-30% Application.`,
    tutorResources: `- OpenStax US History (openstax.org/books/us-history): CC BY 4.0\n- Khan Academy US History (khanacademy.org/humanities/us-history)\n- Saylor HIST211 (learn.saylor.org)`,
    examAlignmentNotes: `Political institutions: 35%, Social: 25%, Economic: 15%, Cultural: 15%, Diplomacy: 10%. All 5-choice MCQ. Primary source interpretation common.`,
    stimulusRequirement: "Include a primary source excerpt, historical scenario, or period quotation; null for direct event recall",
    stimulusDescription: "primary source excerpt, historical scenario, or period quotation",
    explanationGuidance: "placing in historical context, explaining cause-and-effect, connecting to broader themes",
    skillCodes: ["Chronological Reasoning", "Causation", "Contextualization", "Source Analysis"],
    difficultyRubric: { EASY: "Identify when an event occurred or a key figure's role (Bloom's: Remember). 65%+ correct.", MEDIUM: "Explain cause/consequence of a political decision in context (Bloom's: Apply). 40-55% correct.", HARD: "Compare developments across periods or evaluate competing historical interpretations (Bloom's: Analyze/Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) CHRONOLOGICAL-DISPLACEMENT TRAP — attributes event to wrong decade; (2) CAUSE-EFFECT-INVERSION TRAP — reverses cause and effect; (3) OVER-GENERALIZATION TRAP — applies regional trend to entire nation.",
    stimulusQualityGuidance: "GOOD: 'In 1832, Jackson vetoed the Bank recharter calling it a monopoly. Which political philosophy does this reflect?' AVOID: 'Who was Andrew Jackson?'",
    // CB weights: Colonial 30%, Revolution/New Nation 30%, Antebellum/Civil War 40% — mapped across 5 units
    topicWeights: {
      "CLEP_USH1_1_COLONIAL": 0.20,
      "CLEP_USH1_2_REVOLUTION": 0.20,
      "CLEP_USH1_3_EARLY_REPUBLIC": 0.15,
      "CLEP_USH1_4_EXPANSION_REFORM": 0.20,
      "CLEP_USH1_5_CIVIL_WAR": 0.25,
    },
  },

  // ─── CLEP US History II ───
  CLEP_US_HISTORY_2: {
    name: "CLEP History of the United States II",
    shortName: "CLEP US Hist II",
    examSecsPerQuestion: 45,
    mockExam: { mcqCount: 120, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_USH2_1_RECONSTRUCTION: { name: "Unit 1: Reconstruction and Gilded Age (1877-1900)", keyThemes: ["Jim Crow laws", "industrialization", "Populist movement", "urbanization and immigration"] },
      CLEP_USH2_2_INDUSTRIALIZATION: { name: "Unit 2: Progressive Era and Imperialism (1890-1920)", keyThemes: ["muckrakers and reform", "Spanish-American War", "Roosevelt progressivism", "women's suffrage"] },
      CLEP_USH2_3_WORLD_WARS: { name: "Unit 3: World Wars and Interwar (1914-1945)", keyThemes: ["US entry into WWI", "Great Depression", "New Deal programs", "WWII home front"] },
      CLEP_USH2_4_COLD_WAR: { name: "Unit 4: Cold War Era (1945-1980)", keyThemes: ["containment doctrine", "McCarthyism", "civil rights movement", "Vietnam War"] },
      CLEP_USH2_5_MODERN_ERA: { name: "Unit 5: Modern America (1980-Present)", keyThemes: ["Reagan conservatism", "end of Cold War", "globalization", "War on Terror"] },
    },
    suggestedTutorQuestions: ["How did the New Deal reshape the federal government?", "What were key civil rights movement strategies?", "How did containment shape US foreign policy?"],
    curriculumContext: `CLEP US History II covers Reconstruction through present (1865-present). Exam: 120 questions, 90 minutes. Passing earns 3 credits (~$1,200 savings). Content: political (35%), social (25%), economic (15%), cultural (15%), diplomacy (10%). Cognitive: 30-40% Recall, 40-50% Understanding, 20-30% Application.`,
    tutorResources: `- OpenStax US History (openstax.org/books/us-history): CC BY 4.0\n- Khan Academy US History (khanacademy.org/humanities/us-history)\n- Saylor HIST212 (learn.saylor.org)`,
    examAlignmentNotes: `Political: 35%, Social: 25%, Economic: 15%, Cultural: 15%, Diplomacy: 10%. All 5-choice MCQ. Primary source and political cartoon interpretation tested.`,
    stimulusRequirement: "Include a primary source, speech quotation, or historical scenario; null for event recall",
    stimulusDescription: "primary source excerpt, speech quotation, or historical scenario",
    explanationGuidance: "placing in historical context, connecting to broader movements, identifying long-term consequences",
    skillCodes: ["Chronological Reasoning", "Causation", "Contextualization", "Comparison"],
    difficultyRubric: { EASY: "Identify a key figure, event date, or New Deal program (Bloom's: Remember). 65%+ correct.", MEDIUM: "Explain how a policy addressed a social/economic problem (Bloom's: Apply). 40-55% correct.", HARD: "Evaluate long-term policy impact across decades or compare two movements' strategies (Bloom's: Analyze/Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) ERA-CONFLATION TRAP — mixes Progressive reforms with New Deal; (2) CAUSE-OVERSIMPLIFICATION TRAP — single cause for complex event; (3) LEADER-POLICY MISMATCH TRAP — assigns policy to wrong president.",
    stimulusQualityGuidance: "GOOD: 'Truman stated in 1947: \"We must support free peoples resisting subjugation.\" This led to which policy?' AVOID: 'What was the Truman Doctrine?'",
    // CB weights: Reconstruction/Industrialization 25%, Progressive/WWI/1920s 25%, Depression/WWII 25%, Cold War/Modern 25%
    topicWeights: {
      "CLEP_USH2_1_RECONSTRUCTION": 0.25,
      "CLEP_USH2_2_INDUSTRIALIZATION": 0.25,
      "CLEP_USH2_3_WORLD_WARS": 0.25,
      "CLEP_USH2_4_COLD_WAR": 0.15,
      "CLEP_USH2_5_MODERN_ERA": 0.10,
    },
  },

  // ─── CLEP Human Growth and Development ───
  CLEP_HUMAN_GROWTH_DEV: {
    name: "CLEP Human Growth and Development",
    shortName: "CLEP Human Dev",
    examSecsPerQuestion: 60,
    mockExam: { mcqCount: 90, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_HGD_1_PRENATAL_INFANCY: { name: "Unit 1: Prenatal Development and Infancy", keyThemes: ["teratogens and prenatal stages", "Piaget's sensorimotor stage", "attachment theory (Bowlby/Ainsworth)", "motor development"] },
      CLEP_HGD_2_CHILDHOOD: { name: "Unit 2: Early and Middle Childhood", keyThemes: ["preoperational/concrete operational stages", "Vygotsky's ZPD", "language acquisition theories", "Erikson's psychosocial stages"] },
      CLEP_HGD_3_ADOLESCENCE: { name: "Unit 3: Adolescence", keyThemes: ["puberty and brain development", "formal operational stage", "identity formation (Erikson/Marcia)", "Kohlberg's moral development"] },
      CLEP_HGD_4_ADULTHOOD: { name: "Unit 4: Adulthood", keyThemes: ["Erikson's intimacy vs isolation", "cognitive changes in midlife", "career development theories", "generativity"] },
      CLEP_HGD_5_AGING_DEATH: { name: "Unit 5: Aging, Death, and Dying", keyThemes: ["cognitive aging and dementia", "Kubler-Ross stages of grief", "social-emotional selectivity theory", "successful aging"] },
    },
    suggestedTutorQuestions: ["How do Piaget's stages differ from Vygotsky's theory?", "What are the four attachment styles?", "How does Erikson's theory apply across the lifespan?"],
    curriculumContext: `CLEP Human Growth and Development covers lifespan development. Exam: 90 questions, 90 minutes. Passing earns 3 credits (~$1,200 savings). Content: theoretical perspectives (10%), research methods (5%), prenatal/infancy (10%), childhood (15%), adolescence (15%), adulthood (15%), aging/death (10%), cross-cutting (20%). Cognitive: 30-40% Recall, 40-50% Understanding, 20-30% Application.`,
    tutorResources: `- OpenStax Psychology 2e Ch.9 (openstax.org/books/psychology-2e): CC BY 4.0\n- Khan Academy Developmental Psych (khanacademy.org/test-prep/mcat)\n- LibreTexts Developmental Psychology (socialsci.libretexts.org)`,
    examAlignmentNotes: `Theoretical perspectives: 10%, Biological/physical: 15%, Cognitive: 20%, Social/emotional: 20%, Research methods: 5%, Learning/intelligence: 15%, Language/personality: 15%. All 5-choice MCQ. Scenario application heavily tested.`,
    stimulusRequirement: "Include a child/adult behavior scenario, research vignette, or developmental observation; null for theory recall",
    stimulusDescription: "developmental scenario, research vignette, or behavioral observation",
    explanationGuidance: "naming the developmental theory and stage, explaining why the behavior fits, contrasting with adjacent stages",
    skillCodes: ["Theory Application", "Stage Identification", "Research Interpretation", "Lifespan Comparison"],
    difficultyRubric: { EASY: "Recall which theorist proposed a concept or identify the correct stage (Bloom's: Remember). 65%+ correct.", MEDIUM: "Apply a developmental theory to a child behavior scenario (Bloom's: Apply). 40-55% correct.", HARD: "Evaluate which theory better explains a complex observation or analyze research design (Bloom's: Analyze/Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) STAGE-ADJACENT TRAP — assigns behavior to wrong Piagetian/Eriksonian stage; (2) THEORIST-SWAP TRAP — attributes concept to wrong psychologist; (3) NATURE-NURTURE CONFLATION TRAP — environmental explanation for biological basis or vice versa.",
    stimulusQualityGuidance: "GOOD: 'A 4-year-old insists a tall glass holds more juice than a short wide glass after watching it poured. Which concept?' AVOID: 'What is conservation?'",
    // CB weights: Theories 10%, Research 5%, Biological 10%, Perceptual/cognitive 15%, Language 5%, Social/personality 20%, Learning 10%, Schooling 5%, Family/peers 10%, Atypical 10% — mapped across 5 units
    topicWeights: {
      "CLEP_HGD_1_PRENATAL_INFANCY": 0.20,
      "CLEP_HGD_2_CHILDHOOD": 0.25,
      "CLEP_HGD_3_ADOLESCENCE": 0.20,
      "CLEP_HGD_4_ADULTHOOD": 0.20,
      "CLEP_HGD_5_AGING_DEATH": 0.15,
    },
  },

  // ─── CLEP Calculus ───
  CLEP_CALCULUS: {
    name: "CLEP Calculus",
    shortName: "CLEP Calculus",
    examSecsPerQuestion: 122,
    mockExam: { mcqCount: 44, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_CALC_1_LIMITS: { name: "Unit 1: Limits and Continuity", keyThemes: ["limit evaluation techniques", "one-sided limits", "continuity and IVT", "limits at infinity"] },
      CLEP_CALC_2_DERIVATIVES: { name: "Unit 2: Derivatives", keyThemes: ["derivative definition", "power/product/quotient/chain rules", "implicit differentiation", "trig/exponential/log derivatives"] },
      CLEP_CALC_3_INTEGRALS: { name: "Unit 3: Integrals", keyThemes: ["Riemann sums", "Fundamental Theorem of Calculus", "u-substitution", "definite integral properties"] },
      CLEP_CALC_4_APPLICATIONS: { name: "Unit 4: Applications", keyThemes: ["related rates", "optimization", "area between curves", "volumes of revolution"] },
      CLEP_CALC_5_SEQUENCES_SERIES: { name: "Unit 5: Differential Equations and Series", keyThemes: ["separable DEs", "slope fields", "Taylor/Maclaurin series", "convergence tests"] },
    },
    suggestedTutorQuestions: ["How do I apply the chain rule?", "What is the Fundamental Theorem of Calculus?", "How do I set up a volume of revolution integral?"],
    curriculumContext: `CLEP Calculus covers limits, derivatives, integrals (Calc I/II). Exam: ~44 questions, 90 minutes. Two sections: calculator and non-calculator. Passing earns 3-4 credits (~$1,200-$1,600 savings). Content: limits (10%), derivatives (30-35%), integrals (30-35%), applications (20-25%). Cognitive: 30-40% Computation, 40-50% Understanding, 20-30% Application.`,
    tutorResources: `- OpenStax Calculus Vol 1 (openstax.org/books/calculus-volume-1): CC BY 4.0\n- Khan Academy Calculus 1 (khanacademy.org/math/calculus-1)\n- Paul's Online Math Notes (tutorial.math.lamar.edu/Classes/CalcI)`,
    examAlignmentNotes: `Limits: 10%, Derivatives + applications: 50%, Integrals + applications: 30-35%, DEs/series: 5-10%. Two sections: calculator and non-calculator.`,
    stimulusRequirement: "Include a function, equation, graph description, or applied scenario; null for direct rule-application",
    stimulusDescription: "function definition, graph description, or applied scenario",
    explanationGuidance: "showing complete step-by-step solution, naming each rule/theorem applied, and verifying",
    skillCodes: ["Limit Evaluation", "Differentiation", "Integration", "Applied Modeling"],
    difficultyRubric: { EASY: "Apply a single differentiation or integration rule (Bloom's: Apply). 65%+ correct.", MEDIUM: "Combine multiple rules or set up an applied problem (Bloom's: Apply/Analyze). 40-55% correct.", HARD: "Multi-step optimization/related rates or determine series convergence (Bloom's: Analyze/Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) CHAIN-RULE-OMISSION TRAP — forgets inner derivative; (2) CONSTANT-OF-INTEGRATION TRAP — omits +C or wrong bounds; (3) SIGN-ERROR TRAP — drops negative during substitution.",
    stimulusQualityGuidance: "GOOD: 'A balloon inflates at 3 ft³/min. Find the rate the radius increases when r = 2 ft.' AVOID: 'Find the derivative of x².'",
    // CB weights: Limits 10%, Derivatives 50%, Integrals 40% — mapped across 5 units
    topicWeights: {
      "CLEP_CALC_1_LIMITS": 0.10,
      "CLEP_CALC_2_DERIVATIVES": 0.30,
      "CLEP_CALC_3_INTEGRALS": 0.25,
      "CLEP_CALC_4_APPLICATIONS": 0.25,
      "CLEP_CALC_5_SEQUENCES_SERIES": 0.10,
    },
  },

  // ─── CLEP Chemistry ───
  CLEP_CHEMISTRY: {
    name: "CLEP Chemistry",
    shortName: "CLEP Chemistry",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 75, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_CHEM_1_ATOMIC_STRUCTURE: { name: "Unit 1: Atomic Structure and Periodicity", keyThemes: ["electron configuration", "periodic trends", "quantum numbers", "atomic orbitals"] },
      CLEP_CHEM_2_BONDING: { name: "Unit 2: Chemical Bonding", keyThemes: ["ionic vs covalent bonds", "Lewis structures and VSEPR", "molecular polarity", "intermolecular forces"] },
      CLEP_CHEM_3_REACTIONS: { name: "Unit 3: Reactions and Stoichiometry", keyThemes: ["balancing equations", "limiting reagents", "mole conversions", "reaction types"] },
      CLEP_CHEM_4_STATES_SOLUTIONS: { name: "Unit 4: States of Matter and Solutions", keyThemes: ["gas laws", "colligative properties", "solution concentration", "phase diagrams"] },
      CLEP_CHEM_5_THERMODYNAMICS: { name: "Unit 5: Thermodynamics and Kinetics", keyThemes: ["enthalpy and Hess's law", "entropy and Gibbs free energy", "rate laws", "equilibrium and Le Chatelier's"] },
    },
    suggestedTutorQuestions: ["How do I determine molecular geometry with VSEPR?", "How do I solve limiting reagent problems?", "What determines reaction spontaneity?"],
    curriculumContext: `CLEP Chemistry covers general college chemistry (two semesters). Exam: 75 questions, 90 minutes. Passing earns 6 credits (~$2,400 savings). Content: structure (20%), states (19%), reactions (12%), stoichiometry (10%), equilibrium (7%), kinetics (4%), thermo (6%), descriptive (14%), experimental (8%). Cognitive: 30-40% Recall, 40-50% Understanding, 20-30% Application.`,
    tutorResources: `- OpenStax Chemistry 2e (openstax.org/books/chemistry-2e): CC BY 4.0\n- Khan Academy Chemistry (khanacademy.org/science/chemistry)\n- LibreTexts Chemistry (chem.libretexts.org)`,
    examAlignmentNotes: `Structure: 20%, States/solutions: 19%, Reactions: 12%, Stoichiometry: 10%, Equilibrium: 7%, Kinetics: 4%, Thermo: 6%, Descriptive: 14%, Experimental: 8%. All 5-choice MCQ. Significant figures expected.`,
    stimulusRequirement: "Include a chemical equation, reaction scenario, data table, or lab observation; null for concept recall",
    stimulusDescription: "chemical equation, reaction data, or lab observation",
    explanationGuidance: "showing stoichiometric setup or calculation step by step, naming the law/principle, checking sig figs",
    skillCodes: ["Stoichiometric Calculation", "Molecular Analysis", "Equilibrium Reasoning", "Lab Interpretation"],
    difficultyRubric: { EASY: "Write an electron configuration or identify a periodic trend (Bloom's: Remember). 65%+ correct.", MEDIUM: "Calculate a limiting reagent or predict molecular geometry from Lewis structure (Bloom's: Apply). 40-55% correct.", HARD: "Use Hess's law to calculate ΔH from multiple equations, or predict simultaneous equilibrium effects (Bloom's: Analyze/Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) MOLE-RATIO TRAP — uses unbalanced coefficients or inverts ratio; (2) GEOMETRY-LONE-PAIR TRAP — ignores lone pairs (e.g., says H₂O is linear); (3) SIGN-CONVENTION TRAP — confuses exothermic (neg ΔH) with endothermic (pos ΔH).",
    stimulusQualityGuidance: "GOOD: 'When 50.0 mL of 0.200 M NaOH mixes with 50.0 mL of 0.150 M HCl, calculate the pH.' AVOID: 'What is an acid-base reaction?'",
    // CB weights: Structure 20%, States 19%, Reactions 12%, Stoichiometry 10%, Equilibrium 7%, Kinetics 4%, Thermo 6%, Descriptive 14%, Lab 8% — mapped across 5 units
    topicWeights: {
      "CLEP_CHEM_1_ATOMIC_STRUCTURE": 0.25,
      "CLEP_CHEM_2_BONDING": 0.20,
      "CLEP_CHEM_3_REACTIONS": 0.22,
      "CLEP_CHEM_4_STATES_SOLUTIONS": 0.18,
      "CLEP_CHEM_5_THERMODYNAMICS": 0.15,
    },
    recommendedTextbooks: [
      "OpenStax Chemistry 2e (free: openstax.org/books/chemistry-2e)",
      "Zumdahl & Zumdahl, Chemistry (Cengage)",
    ],
  },

  // ─── CLEP Financial Accounting ───
  CLEP_FINANCIAL_ACCOUNTING: {
    name: "CLEP Financial Accounting",
    shortName: "CLEP Fin. Acct",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 75, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_FINACCT_1_ACCOUNTING_CYCLE: { name: "Unit 1: The Accounting Cycle", keyThemes: ["double-entry bookkeeping", "journal entries and T-accounts", "adjusting entries", "closing entries and trial balance"] },
      CLEP_FINACCT_2_ASSETS: { name: "Unit 2: Assets", keyThemes: ["accounts receivable and bad debts", "inventory valuation (FIFO, LIFO)", "depreciation methods", "intangible assets"] },
      CLEP_FINACCT_3_LIABILITIES_EQUITY: { name: "Unit 3: Liabilities and Equity", keyThemes: ["current vs long-term liabilities", "bonds payable", "stockholders' equity", "retained earnings and dividends"] },
      CLEP_FINACCT_4_INCOME_STATEMENT: { name: "Unit 4: Income Statement", keyThemes: ["revenue recognition", "cost of goods sold", "multi-step income statement", "earnings per share"] },
      CLEP_FINACCT_5_FINANCIAL_ANALYSIS: { name: "Unit 5: Financial Statement Analysis", keyThemes: ["ratio analysis", "horizontal/vertical analysis", "statement of cash flows", "GAAP principles"] },
    },
    suggestedTutorQuestions: ["How do I record adjusting entries?", "What is FIFO vs LIFO?", "How do I calculate the current ratio?"],
    curriculumContext: `CLEP Financial Accounting covers introductory financial accounting. Exam: 75 questions, 90 minutes. Passing earns 3 credits (~$1,200 savings). Content: general framework (20-30%), accounting cycle (20-30%), financial statements (25-35%), analysis (10-20%). Cognitive: 30-40% Recall, 40-50% Understanding, 20-30% Application.`,
    tutorResources: `- OpenStax Principles of Financial Accounting (openstax.org/books/principles-financial-accounting): CC BY 4.0\n- Khan Academy Accounting (khanacademy.org/economics-finance-domain)\n- Saylor BUS103 (learn.saylor.org)`,
    examAlignmentNotes: `CLEP Financial Accounting alignment (College Board official weights):
- General Topics (accounting principles, conceptual framework): 20-30%
- The Income Statement (revenue recognition, expenses, EPS): 20-30%
- The Balance Sheet (assets, liabilities, equity, valuation): 30-40%
- Statement of Cash Flows: 5-10%
- Miscellaneous: <5%
~75 questions (some unscored pretests) in 90 minutes.
Four-function calculator available in exam software.
Passing score: 50 (ACE recommendation), earns 3 semester hours.
Journal entries and calculations common.`,
    stimulusRequirement: "Include a transaction scenario, partial financial statement, or journal entry; null for principle recall",
    stimulusDescription: "transaction scenario, financial data, or journal entry",
    explanationGuidance: "showing complete journal entry with debits/credits, explaining affected accounts, referencing GAAP",
    skillCodes: ["Journal Entry Recording", "Financial Statement Prep", "Ratio Analysis", "GAAP Application"],
    difficultyRubric: { EASY: "Identify debit/credit or classify item as asset/liability/equity (Bloom's: Remember). 65%+ correct.", MEDIUM: "Record an adjusting entry or calculate depreciation (Bloom's: Apply). 40-55% correct.", HARD: "Analyze effect of an error on multiple statements, or compare inventory methods' impact on net income (Bloom's: Analyze/Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) DEBIT-CREDIT REVERSAL TRAP — reverses debit and credit; (2) INVENTORY-METHOD TRAP — applies FIFO logic when LIFO specified; (3) ACCRUAL-CASH TRAP — uses cash-basis timing for accrual question.",
    stimulusQualityGuidance: "GOOD: 'On Dec 31, $5,000 of services performed but not billed. Prepare the adjusting entry.' AVOID: 'What is an adjusting entry?'",
    // CB weights: General topics 20-30%, Income statement 20-30%, Balance sheet 30-40%, Cash flows 5-10%, Misc <5%
    topicWeights: {
      "CLEP_ACCT_1_FRAMEWORK": 0.25,
      "CLEP_ACCT_2_ACCOUNTING_CYCLE": 0.25,
      "CLEP_ACCT_3_FINANCIAL_STATEMENTS": 0.35,
      "CLEP_ACCT_4_ANALYSIS_REPORTING": 0.08,
      "CLEP_ACCT_5_SPECIAL_TOPICS": 0.07,
    },
    recommendedTextbooks: [
      "OpenStax Principles of Financial Accounting (free: openstax.org/books/principles-financial-accounting)",
      "Weygandt et al., Financial Accounting (Wiley)",
    ],
  },

  // ─── CLEP American Literature ───
  CLEP_AMERICAN_LITERATURE: {
    name: "CLEP American Literature",
    shortName: "CLEP Am. Lit",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 95, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_AMLIT_1_COLONIAL_EARLY: { name: "Unit 1: Colonial and Early National (1620-1830)", keyThemes: ["Puritan literature and plain style", "Enlightenment prose (Franklin, Paine)", "early American poetry (Bradstreet, Wheatley)", "captivity and slave narratives"] },
      CLEP_AMLIT_2_ROMANTIC_PERIOD: { name: "Unit 2: Romantic Period (1830-1865)", keyThemes: ["Transcendentalism (Emerson, Thoreau)", "Dark Romanticism (Hawthorne, Melville, Poe)", "Walt Whitman and free verse", "slave narratives (Douglass)"] },
      CLEP_AMLIT_3_REALISM_NATURALISM: { name: "Unit 3: Realism and Naturalism (1865-1914)", keyThemes: ["literary realism (Twain, James, Howells)", "naturalism (Crane, Dreiser, London)", "regionalism and local color", "Emily Dickinson's poetry"] },
      CLEP_AMLIT_4_MODERNISM: { name: "Unit 4: Modernism (1914-1945)", keyThemes: ["Harlem Renaissance (Hughes, Hurston)", "Lost Generation (Fitzgerald, Hemingway)", "modernist poetry (Frost, Eliot, Stevens)", "experimental narrative techniques"] },
      CLEP_AMLIT_5_CONTEMPORARY: { name: "Unit 5: Contemporary (1945-Present)", keyThemes: ["Beat Generation (Kerouac, Ginsberg)", "postmodern fiction (Pynchon, Morrison)", "confessional poetry (Plath, Sexton)", "multicultural voices and identity literature"] },
    },
    suggestedTutorQuestions: ["How did Transcendentalism influence American literature?", "What distinguishes realism from naturalism?", "How did the Harlem Renaissance reshape American literary culture?"],
    curriculumContext: `CLEP American Literature covers major American authors and movements from colonial times to present. Exam: 100 questions, 90 minutes. Passing earns 3 credits (~$1,200 savings). Content: colonial/early national (10-15%), Romantic period (20-25%), realism/naturalism (20-25%), modernism (20-25%), contemporary (15-20%). Cognitive: 30-40% Recall, 40-50% Understanding, 20-30% Application/Analysis.`,
    tutorResources: `- American Literature LibreTexts (human.libretexts.org): CC BY-NC-SA\n- Khan Academy US History & Arts (khanacademy.org/humanities)\n- Saylor ENGL405 American Literature (learn.saylor.org)`,
    examAlignmentNotes: `Colonial/early: 10-15%, Romantic: 20-25%, Realism/naturalism: 20-25%, Modernism: 20-25%, Contemporary: 15-20%. All 5-choice MCQ. Passage-based analysis and author identification heavily tested.`,
    stimulusRequirement: "Include a literary passage excerpt (2-4 sentences) for analysis; null for direct author/period recall",
    stimulusDescription: "literary passage excerpt, poem stanza, or prose selection",
    explanationGuidance: "identifying the literary period, naming the author and work, analyzing tone/style/theme, and connecting to the broader movement",
    skillCodes: ["Passage Analysis", "Period Identification", "Author Attribution", "Theme Interpretation"],
    difficultyRubric: { EASY: "Identify an author's literary period or recall a major work's theme (Bloom's: Remember). 65%+ correct.", MEDIUM: "Analyze a passage excerpt to identify literary devices or thematic concerns (Bloom's: Analyze). 40-55% correct.", HARD: "Compare two authors' stylistic approaches or evaluate how a passage reflects broader cultural movements (Bloom's: Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) PERIOD-DISPLACEMENT TRAP — assigns author to adjacent literary period; (2) AUTHOR-CONFLATION TRAP — attributes work to wrong author of same era; (3) DEVICE-MISIDENTIFICATION TRAP — confuses irony with satire or allegory with symbolism.",
    stimulusQualityGuidance: "GOOD: 'Read this excerpt: \"I celebrate myself, and sing myself...\" Which literary movement does this opening exemplify?' AVOID: 'Who wrote Leaves of Grass?'",
    // Even distribution — no official CB per-unit breakdown available
    topicWeights: {
      "CLEP_AMLIT_1_COLONIAL_EARLY": 0.20,
      "CLEP_AMLIT_2_ROMANTIC_PERIOD": 0.20,
      "CLEP_AMLIT_3_REALISM_NATURALISM": 0.20,
      "CLEP_AMLIT_4_MODERNISM": 0.20,
      "CLEP_AMLIT_5_CONTEMPORARY": 0.20,
    },
  },

  // ─── CLEP Analyzing and Interpreting Literature ───
  CLEP_ANALYZING_INTERPRETING_LIT: {
    name: "CLEP Analyzing and Interpreting Literature",
    shortName: "CLEP Lit Analysis",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 80, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_ANLIT_1_PROSE_FICTION: { name: "Unit 1: Prose Fiction", keyThemes: ["narrative point of view", "characterization and motivation", "plot structure and conflict", "setting and atmosphere"] },
      CLEP_ANLIT_2_POETRY: { name: "Unit 2: Poetry", keyThemes: ["meter and rhyme scheme", "figurative language (metaphor, simile, personification)", "imagery and sensory detail", "tone and speaker"] },
      CLEP_ANLIT_3_DRAMA: { name: "Unit 3: Drama", keyThemes: ["dramatic irony and foreshadowing", "soliloquy and aside", "tragedy and comedy conventions", "stage directions and subtext"] },
      CLEP_ANLIT_4_NONFICTION: { name: "Unit 4: Nonfiction and Essays", keyThemes: ["rhetorical strategies", "persuasive techniques", "author's purpose and audience", "essay structure and argument"] },
      CLEP_ANLIT_5_LITERARY_ANALYSIS: { name: "Unit 5: Literary Analysis and Interpretation", keyThemes: ["theme identification", "symbolism and allegory", "irony (verbal, situational, dramatic)", "literary criticism approaches"] },
    },
    suggestedTutorQuestions: ["How do I identify the tone of a literary passage?", "What is the difference between a metaphor and a simile?", "How does dramatic irony create tension?"],
    curriculumContext: `CLEP Analyzing and Interpreting Literature tests close reading and analysis of prose, poetry, and drama. Exam: 80 questions, 90 minutes. Passing earns 6 credits (~$2,400 savings). Content: prose fiction (30-40%), poetry (30-40%), drama (15-20%), nonfiction (10-15%). Cognitive: 15-20% Recall, 45-55% Analysis, 25-35% Interpretation/Evaluation. No specific reading list — passages are presented unseen.`,
    tutorResources: `- LibreTexts Writing and Critical Thinking (human.libretexts.org): CC BY-NC-SA\n- Khan Academy Reading & Literature (khanacademy.org/ela)\n- Saylor ENGL101 (learn.saylor.org)`,
    examAlignmentNotes: `Prose fiction: 30-40%, Poetry: 30-40%, Drama: 15-20%, Nonfiction: 10-15%. All 5-choice MCQ. All questions are passage-based — no prior reading required. Emphasis on close reading skills over literary history.`,
    stimulusRequirement: "ALWAYS include a passage excerpt (3-6 lines of prose, 4-8 lines of poetry, or 3-5 lines of dramatic dialogue) — this exam is entirely passage-based",
    stimulusDescription: "literary passage excerpt from prose fiction, poetry, drama, or nonfiction essay",
    explanationGuidance: "citing specific words/phrases from the passage, naming the literary device or technique, explaining how it creates meaning in context",
    skillCodes: ["Close Reading", "Literary Device Identification", "Tone Analysis", "Thematic Interpretation"],
    difficultyRubric: { EASY: "Identify the narrator's point of view or a basic literary device in a clear passage (Bloom's: Understand). 65%+ correct.", MEDIUM: "Analyze how figurative language contributes to tone or theme in a moderately complex passage (Bloom's: Analyze). 40-55% correct.", HARD: "Evaluate the effect of multiple interacting literary techniques or interpret ambiguous symbolism in a complex passage (Bloom's: Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) SURFACE-MEANING TRAP — chooses literal interpretation over figurative; (2) DEVICE-MIS-LABEL TRAP — confuses metaphor with personification or synecdoche; (3) TONE-REVERSAL TRAP — selects opposite tone (earnest vs ironic); (4) OVER-READING TRAP — ascribes symbolism not supported by text.",
    stimulusQualityGuidance: "GOOD: Provide a 4-line poem excerpt and ask 'The speaker's use of \"winter\" in line 3 most likely symbolizes...' AVOID: 'Define personification.' — this exam never tests definitions in isolation.",
    // Even distribution — no official CB per-unit breakdown available
    topicWeights: {
      "CLEP_ANLIT_1_PROSE_FICTION": 0.20,
      "CLEP_ANLIT_2_POETRY": 0.20,
      "CLEP_ANLIT_3_DRAMA": 0.20,
      "CLEP_ANLIT_4_NONFICTION": 0.20,
      "CLEP_ANLIT_5_LITERARY_ANALYSIS": 0.20,
    },
  },

  // ─── CLEP College Composition Modular ───
  CLEP_COLLEGE_COMP_MODULAR: {
    name: "CLEP College Composition Modular",
    shortName: "CLEP Comp Mod",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 90, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_CCM_1_RHETORICAL_ANALYSIS: { name: "Unit 1: Rhetorical Analysis", keyThemes: ["ethos, pathos, logos", "audience and purpose", "rhetorical strategies", "tone and diction analysis"] },
      CLEP_CCM_2_SYNTHESIS: { name: "Unit 2: Synthesis and Source Use", keyThemes: ["integrating multiple sources", "paraphrasing vs summarizing", "evaluating source credibility", "synthesizing conflicting viewpoints"] },
      CLEP_CCM_3_ARGUMENTATION: { name: "Unit 3: Argumentation", keyThemes: ["thesis development", "logical fallacies", "counterargument and rebuttal", "evidence evaluation"] },
      CLEP_CCM_4_RESEARCH_SKILLS: { name: "Unit 4: Research Skills", keyThemes: ["MLA and APA citation", "primary vs secondary sources", "research question formulation", "avoiding plagiarism"] },
      CLEP_CCM_5_CONVENTIONS: { name: "Unit 5: Conventions of Standard Written English", keyThemes: ["sentence structure and fragments", "subject-verb agreement", "pronoun reference and case", "comma splices and run-ons"] },
    },
    suggestedTutorQuestions: ["How do I identify logical fallacies in an argument?", "What is the difference between ethos, pathos, and logos?", "How do I synthesize information from multiple sources?"],
    curriculumContext: `CLEP College Composition Modular tests college-level writing skills (MCQ only — no essay). Exam: 90 questions, 90 minutes. Passing earns 3 credits (~$1,200 savings). Content: conventions of standard written English (10%), revision skills (40%), ability to use source materials (25%), rhetorical analysis (25%). Cognitive: 20% Recall, 40% Application, 40% Analysis.`,
    tutorResources: `- OpenStax Writing Guide with Handbook (openstax.org/books/writing-guide): CC BY 4.0\n- Purdue OWL (owl.purdue.edu): free writing and citation guidance\n- Saylor ENGL001 (learn.saylor.org)`,
    examAlignmentNotes: `Conventions: 10%, Revision skills: 40%, Source materials: 25%, Rhetorical analysis: 25%. All 5-choice MCQ. No essay component (that is the non-modular version). Passage-based revision and rhetoric questions dominate.`,
    stimulusRequirement: "Include a short prose passage (2-4 sentences) with underlined/numbered portions for revision, or a rhetorical passage for analysis; null for grammar rule recall",
    stimulusDescription: "prose passage with revision targets or rhetorical passage for analysis",
    explanationGuidance: "identifying the specific grammar rule, rhetorical strategy, or logical principle and explaining why the correct revision improves clarity, coherence, or effectiveness",
    skillCodes: ["Rhetorical Analysis", "Revision and Editing", "Source Evaluation", "Grammar Application"],
    difficultyRubric: { EASY: "Identify a grammar error (fragment, comma splice) or recall a citation rule (Bloom's: Remember/Apply). 65%+ correct.", MEDIUM: "Choose the best revision of a sentence for clarity and coherence, or identify a rhetorical strategy in a passage (Bloom's: Apply/Analyze). 40-55% correct.", HARD: "Evaluate competing revisions for tone and audience, or analyze how multiple rhetorical strategies interact in a complex passage (Bloom's: Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) WORDINESS TRAP — chooses verbose revision over concise; (2) COMMA-SPLICE TRAP — fixes fragment but creates comma splice; (3) PARALLEL-STRUCTURE TRAP — breaks parallelism in revision; (4) FALLACY-LABEL TRAP — confuses ad hominem with straw man.",
    stimulusQualityGuidance: "GOOD: 'Read this passage and select the revision that best improves coherence between paragraphs 2 and 3.' AVOID: 'Define a comma splice.' — the exam tests application, not definitions.",
    // Even distribution — no official CB per-unit breakdown available
    topicWeights: {
      "CLEP_CCM_1_RHETORICAL_ANALYSIS": 0.20,
      "CLEP_CCM_2_SYNTHESIS": 0.20,
      "CLEP_CCM_3_ARGUMENTATION": 0.20,
      "CLEP_CCM_4_RESEARCH_SKILLS": 0.20,
      "CLEP_CCM_5_CONVENTIONS": 0.20,
    },
  },

  // ─── CLEP English Literature ───
  CLEP_ENGLISH_LITERATURE: {
    name: "CLEP English Literature",
    shortName: "CLEP Eng. Lit",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 95, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_ENGLIT_1_MEDIEVAL_RENAISSANCE: { name: "Unit 1: Medieval and Renaissance (to 1660)", keyThemes: ["Chaucer and Middle English", "Shakespearean drama and sonnets", "Spenser and allegory", "metaphysical poets (Donne, Herbert)"] },
      CLEP_ENGLIT_2_17TH_18TH_CENTURY: { name: "Unit 2: Restoration and 18th Century (1660-1798)", keyThemes: ["Restoration comedy and satire", "Pope and heroic couplets", "Swift's satire", "rise of the novel (Defoe, Fielding, Richardson)"] },
      CLEP_ENGLIT_3_ROMANTIC_PERIOD: { name: "Unit 3: Romantic Period (1798-1837)", keyThemes: ["Wordsworth and nature poetry", "Coleridge and supernatural imagination", "Byron, Shelley, and Keats", "Gothic novel (Mary Shelley)"] },
      CLEP_ENGLIT_4_VICTORIAN: { name: "Unit 4: Victorian Period (1837-1901)", keyThemes: ["Dickens and social realism", "Tennyson and dramatic monologue", "Brontë sisters", "Hardy and late-Victorian pessimism"] },
      CLEP_ENGLIT_5_20TH_CENTURY: { name: "Unit 5: 20th Century and Beyond", keyThemes: ["modernist experimentation (Woolf, Joyce, Eliot)", "post-colonial literature (Achebe, Rushdie)", "dystopian fiction (Orwell, Huxley)", "contemporary British poetry and drama"] },
    },
    suggestedTutorQuestions: ["How did the Romantic poets differ from the Augustan poets?", "What are the key features of a Shakespearean sonnet?", "How did modernist writers break with Victorian conventions?"],
    curriculumContext: `CLEP English Literature covers British literature from Beowulf to contemporary writers. Exam: 95 questions, 90 minutes. Passing earns 6 credits (~$2,400 savings). Content: medieval/Renaissance (20-25%), Restoration/18th century (15-20%), Romantic (15-20%), Victorian (15-20%), 20th century (15-25%). Cognitive: 15-20% Recall, 45-55% Analysis, 25-35% Interpretation/Evaluation.`,
    tutorResources: `- LibreTexts British Literature (human.libretexts.org): CC BY-NC-SA\n- Khan Academy Arts & Humanities (khanacademy.org/humanities)\n- MIT OCW Literature (ocw.mit.edu/courses/literature)`,
    examAlignmentNotes: `Medieval/Renaissance: 20-25%, Restoration/18th C: 15-20%, Romantic: 15-20%, Victorian: 15-20%, 20th C+: 15-25%. All 5-choice MCQ. Passage-based questions dominate; author and period identification from unseen passages.`,
    stimulusRequirement: "Include a literary passage excerpt (3-6 lines of prose or 4-8 lines of poetry) for analysis; null for direct author/period recall",
    stimulusDescription: "literary passage excerpt from British prose, poetry, or drama",
    explanationGuidance: "identifying the literary period and likely author, analyzing stylistic features (diction, syntax, imagery), and connecting to the broader literary movement",
    skillCodes: ["Passage Analysis", "Period Identification", "Stylistic Analysis", "Literary Context"],
    difficultyRubric: { EASY: "Identify the literary period of a clearly marked passage or recall an author's major work (Bloom's: Remember). 65%+ correct.", MEDIUM: "Analyze a passage to determine its literary movement or identify the effect of a specific device (Bloom's: Analyze). 40-55% correct.", HARD: "Compare stylistic features across periods or evaluate competing interpretations of an ambiguous passage (Bloom's: Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) PERIOD-ADJACENT TRAP — assigns Romantic poem to Victorian or vice versa; (2) AUTHOR-SWAP TRAP — attributes Keats quotation to Shelley; (3) FORM-CONFUSION TRAP — confuses Petrarchan and Shakespearean sonnet structures; (4) ANACHRONISM TRAP — applies modern literary theory to pre-modern text.",
    stimulusQualityGuidance: "GOOD: 'Read this stanza: \"My heart aches, and a drowsy numbness pains / My sense...\" The speaker's condition is best described as...' AVOID: 'Who wrote Ode to a Nightingale?'",
    // Even distribution — no official CB per-unit breakdown available
    topicWeights: {
      "CLEP_ENGLIT_1_MEDIEVAL_RENAISSANCE": 0.20,
      "CLEP_ENGLIT_2_17TH_18TH_CENTURY": 0.20,
      "CLEP_ENGLIT_3_ROMANTIC_PERIOD": 0.20,
      "CLEP_ENGLIT_4_VICTORIAN": 0.20,
      "CLEP_ENGLIT_5_20TH_CENTURY": 0.20,
    },
  },

  // ─── CLEP Humanities ───
  CLEP_HUMANITIES: {
    name: "CLEP Humanities",
    shortName: "CLEP Humanities",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 140, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_HUM_1_LITERATURE: { name: "Unit 1: Literature", keyThemes: ["major literary genres and forms", "world literature (Greek, Renaissance, modern)", "poetry analysis (meter, imagery, theme)", "drama (tragedy, comedy, absurdist)"] },
      CLEP_HUM_2_VISUAL_ARTS: { name: "Unit 2: Visual Arts and Architecture", keyThemes: ["art periods (Renaissance, Baroque, Impressionism, Modern)", "sculpture and architecture styles", "elements of visual design", "major artists and movements"] },
      CLEP_HUM_3_MUSIC: { name: "Unit 3: Music", keyThemes: ["musical periods (Baroque, Classical, Romantic)", "major composers and works", "musical forms (sonata, symphony, opera)", "elements of music (rhythm, harmony, texture)"] },
      CLEP_HUM_4_PERFORMING_ARTS: { name: "Unit 4: Performing Arts and Film", keyThemes: ["theater history and conventions", "dance forms and traditions", "film techniques and genres", "performance art and multimedia"] },
      CLEP_HUM_5_PHILOSOPHY_RELIGION: { name: "Unit 5: Philosophy and Religion", keyThemes: ["major philosophical traditions (Greek, Enlightenment, existentialism)", "world religions and sacred texts", "ethics and moral philosophy", "aesthetics and art theory"] },
    },
    suggestedTutorQuestions: ["How do Renaissance art principles differ from medieval conventions?", "What are the key characteristics of Baroque music?", "How did Enlightenment philosophy influence Western art?"],
    curriculumContext: `CLEP Humanities covers literature, visual arts, music, performing arts, and philosophy. Exam: 140 questions, 90 minutes. Passing earns 6 credits (~$2,400 savings). Content: literature (50%), fine arts — visual arts, music, performing arts, film (50%). Within each half: classical/pre-Renaissance (10-15%), Renaissance through 18th century (20-30%), 19th-20th century (30-40%), contemporary (10-15%). Cognitive: 25-35% Recall, 40-50% Analysis, 15-25% Evaluation.`,
    tutorResources: `- Khan Academy Arts & Humanities (khanacademy.org/humanities): free art history, music, literature\n- Smarthistory (smarthistory.org): CC BY-NC-SA art and cultural history\n- MIT OCW Music & Theater Arts (ocw.mit.edu)`,
    examAlignmentNotes: `Literature: 50%, Fine arts: 50%. Chronological breakdown across both: classical/pre-Renaissance (10-15%), Renaissance-18th C (20-30%), 19th-20th C (30-40%), contemporary (10-15%). All 5-choice MCQ. Breadth over depth — recognizing styles and periods across disciplines.`,
    stimulusRequirement: "Include a passage excerpt, artwork description, musical work reference, or philosophical quotation; null for basic period/figure recall",
    stimulusDescription: "literary excerpt, artwork description, musical reference, or philosophical passage",
    explanationGuidance: "identifying the artistic period, naming the relevant creator/movement, explaining stylistic hallmarks, and connecting across disciplines where applicable",
    skillCodes: ["Period Identification", "Cross-Discipline Connection", "Style Analysis", "Cultural Context"],
    difficultyRubric: { EASY: "Identify a major artist, composer, or literary figure's period or style (Bloom's: Remember). 65%+ correct.", MEDIUM: "Analyze stylistic features of a passage or artwork description to identify its period or movement (Bloom's: Analyze). 40-55% correct.", HARD: "Compare artistic expressions across disciplines in the same period or evaluate how cultural context shaped an artistic movement (Bloom's: Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) PERIOD-MIX TRAP — assigns Baroque artwork to Classical period; (2) DISCIPLINE-CROSSOVER TRAP — confuses literary Romanticism dates with musical Romanticism; (3) ARTIST-SWAP TRAP — attributes work to contemporary of the actual creator; (4) STYLE-FEATURE TRAP — assigns Impressionist technique to Realist school.",
    stimulusQualityGuidance: "GOOD: 'A painting uses dramatic chiaroscuro, dynamic composition, and intense emotion. Which period does this exemplify?' AVOID: 'In what century did Baroque art emerge?'",
    // Even distribution — no official CB per-unit breakdown available
    topicWeights: {
      "CLEP_HUM_1_LITERATURE": 0.20,
      "CLEP_HUM_2_VISUAL_ARTS": 0.20,
      "CLEP_HUM_3_MUSIC": 0.20,
      "CLEP_HUM_4_PERFORMING_ARTS": 0.20,
      "CLEP_HUM_5_PHILOSOPHY_RELIGION": 0.20,
    },
  },

  // ─── CLEP French Language ───
  CLEP_FRENCH: {
    name: "CLEP French Language",
    shortName: "CLEP French",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 121, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_FRENCH_1_LISTENING: { name: "Unit 1: Listening Comprehension (Reading Adaptation)", keyThemes: ["dialogue comprehension", "main idea identification", "inference from context", "distinguishing speakers' attitudes"] },
      CLEP_FRENCH_2_READING: { name: "Unit 2: Reading Comprehension", keyThemes: ["passage main idea and details", "vocabulary in context", "author's purpose and tone", "cultural references in text"] },
      CLEP_FRENCH_3_GRAMMAR: { name: "Unit 3: Grammar and Structure", keyThemes: ["verb conjugation (present, passé composé, imparfait, subjonctif)", "pronoun usage (y, en, direct/indirect objects)", "preposition usage", "relative clauses (qui, que, dont, où)"] },
      CLEP_FRENCH_4_VOCABULARY: { name: "Unit 4: Vocabulary in Context", keyThemes: ["false cognates (faux amis)", "idiomatic expressions", "word families and derivation", "register and formality (tu vs vous)"] },
      CLEP_FRENCH_5_CULTURE: { name: "Unit 5: French Culture and Civilization", keyThemes: ["Francophone world geography", "French customs and daily life", "French history and politics basics", "arts and literature in French-speaking cultures"] },
    },
    suggestedTutorQuestions: ["When do I use passé composé vs imparfait?", "What are the most common French false cognates?", "How do French relative pronouns (qui, que, dont) work?"],
    curriculumContext: `CLEP French Language tests the first two years of college French. Exam: 120 questions, 90 minutes (2 sections: listening and reading). Passing earns 6-12 credits depending on score (~$2,400-$4,800 savings). Content: listening comprehension (33%), reading comprehension (33%), grammar/vocabulary (34%). Note: On this platform, listening is adapted to reading-based comprehension questions. Cognitive: 20% Recall, 50% Application, 30% Analysis.`,
    tutorResources: `- Tex's French Grammar (laits.utexas.edu/tex): free CC-licensed grammar\n- Khan Academy French (khanacademy.org): free basics\n- LibreTexts French (human.libretexts.org/Bookshelves/Languages/French): CC BY-NC-SA`,
    examAlignmentNotes: `Listening: 33% (adapted to reading-based on platform), Reading: 33%, Grammar/vocabulary: 34%. All 5-choice MCQ. Passage-based comprehension and fill-in-the-blank grammar dominate. Score of 50 = 6 credits, 59+ = 12 credits at many institutions.`,
    stimulusRequirement: "Include a French passage (2-4 sentences) or dialogue excerpt for comprehension, or a sentence with a blank for grammar/vocabulary; null for direct translation recall",
    stimulusDescription: "French passage excerpt, dialogue, or sentence with grammatical blank",
    explanationGuidance: "explaining the grammar rule in clear terms, providing the English equivalent, noting common errors, and showing how context determines the answer",
    skillCodes: ["Reading Comprehension", "Grammar Application", "Vocabulary in Context", "Cultural Literacy"],
    difficultyRubric: { EASY: "Identify the main idea of a simple French passage or conjugate a regular verb (Bloom's: Remember/Understand). 65%+ correct.", MEDIUM: "Choose the correct pronoun or verb tense in a contextual sentence, or infer meaning from a moderately complex passage (Bloom's: Apply). 40-55% correct.", HARD: "Interpret nuanced meaning in literary French, select the correct subjunctive usage, or navigate a passage with multiple tenses and complex syntax (Bloom's: Analyze). 25-40% correct." },
    distractorTaxonomy: "(1) FALSE-COGNATE TRAP — 'actuellement' means 'currently' not 'actually'; (2) TENSE-CONFUSION TRAP — passé composé vs imparfait in context; (3) PRONOUN-PLACEMENT TRAP — wrong position for object pronouns; (4) GENDER-AGREEMENT TRAP — wrong article/adjective agreement.",
    stimulusQualityGuidance: "GOOD: 'Marie _____ (aller) au marché quand il a commencé à pleuvoir. Choose the correct verb form.' AVOID: 'Conjugate aller in the present tense.' — the exam tests application in context.",
    // Even distribution — no official CB per-unit breakdown available
    topicWeights: {
      "CLEP_FRENCH_1_LISTENING": 0.20,
      "CLEP_FRENCH_2_READING": 0.20,
      "CLEP_FRENCH_3_GRAMMAR": 0.20,
      "CLEP_FRENCH_4_VOCABULARY": 0.20,
      "CLEP_FRENCH_5_CULTURE": 0.20,
    },
  },

  // ─── CLEP German Language ───
  CLEP_GERMAN: {
    name: "CLEP German Language",
    shortName: "CLEP German",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 121, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_GERMAN_1_LISTENING: { name: "Unit 1: Listening Comprehension (Reading Adaptation)", keyThemes: ["dialogue comprehension", "main idea identification", "inference from conversational context", "distinguishing tone and intent"] },
      CLEP_GERMAN_2_READING: { name: "Unit 2: Reading Comprehension", keyThemes: ["passage main idea and supporting details", "vocabulary in context", "author's purpose and perspective", "cultural content in German texts"] },
      CLEP_GERMAN_3_GRAMMAR: { name: "Unit 3: Grammar and Structure", keyThemes: ["noun cases (Nominativ, Akkusativ, Dativ, Genitiv)", "verb conjugation and tenses (Präsens, Perfekt, Präteritum)", "word order (V2, subordinate clauses)", "prepositions with case (Wechselpräpositionen)"] },
      CLEP_GERMAN_4_VOCABULARY: { name: "Unit 4: Vocabulary in Context", keyThemes: ["compound nouns (Komposita)", "false cognates (falsche Freunde)", "idiomatic expressions", "formal vs informal register (Sie vs du)"] },
      CLEP_GERMAN_5_CULTURE: { name: "Unit 5: German Culture and Civilization", keyThemes: ["German-speaking countries geography", "German customs and traditions", "German reunification and modern society", "arts and literature in German culture"] },
    },
    suggestedTutorQuestions: ["How do the four German cases work?", "When do I use Perfekt vs Präteritum?", "How does German word order change in subordinate clauses?"],
    curriculumContext: `CLEP German Language tests the first two years of college German. Exam: 120 questions, 90 minutes (2 sections: listening and reading). Passing earns 6-12 credits depending on score (~$2,400-$4,800 savings). Content: listening comprehension (33%), reading comprehension (33%), grammar/vocabulary (34%). Note: On this platform, listening is adapted to reading-based comprehension questions. Cognitive: 20% Recall, 50% Application, 30% Analysis.`,
    tutorResources: `- Dartmouth German Studies (dartmouth.edu/~deutsch/Grammatik): free grammar reference\n- COERLL Grimm Grammar (coerll.utexas.edu/gg): CC-licensed German grammar\n- LibreTexts German (human.libretexts.org/Bookshelves/Languages/German): CC BY-NC-SA`,
    examAlignmentNotes: `Listening: 33% (adapted to reading-based on platform), Reading: 33%, Grammar/vocabulary: 34%. All 5-choice MCQ. Case usage and word order are the most-tested grammar areas. Score of 50 = 6 credits, 60+ = 12 credits at many institutions.`,
    stimulusRequirement: "Include a German passage (2-4 sentences) or dialogue for comprehension, or a sentence with a blank for grammar/vocabulary; null for direct translation recall",
    stimulusDescription: "German passage excerpt, dialogue, or sentence with grammatical blank",
    explanationGuidance: "explaining the grammar rule (especially case/word order), providing the English equivalent, showing how the context determines the correct form",
    skillCodes: ["Reading Comprehension", "Case System Application", "Vocabulary in Context", "Cultural Literacy"],
    difficultyRubric: { EASY: "Identify the main idea of a simple German passage or select the correct article for a common noun (Bloom's: Remember/Understand). 65%+ correct.", MEDIUM: "Choose the correct case after a two-way preposition in context, or infer meaning from a moderately complex passage (Bloom's: Apply). 40-55% correct.", HARD: "Navigate complex subordinate clause structures, interpret literary German, or resolve ambiguous case usage in context (Bloom's: Analyze). 25-40% correct." },
    distractorTaxonomy: "(1) CASE-CONFUSION TRAP — uses Akkusativ where Dativ required (e.g., nach + Dativ); (2) WORD-ORDER TRAP — places verb incorrectly in subordinate clause; (3) FALSE-COGNATE TRAP — 'Gift' means 'poison' not 'gift'; (4) GENDER-ARTICLE TRAP — wrong gender for noun (der/die/das).",
    stimulusQualityGuidance: "GOOD: 'Er geht _____ (in/die/der) Schule. Choose the correct preposition and article.' AVOID: 'What is the accusative form of der?' — the exam tests grammar in context.",
    // Even distribution — no official CB per-unit breakdown available
    topicWeights: {
      "CLEP_GERMAN_1_LISTENING": 0.20,
      "CLEP_GERMAN_2_READING": 0.20,
      "CLEP_GERMAN_3_GRAMMAR": 0.20,
      "CLEP_GERMAN_4_VOCABULARY": 0.20,
      "CLEP_GERMAN_5_CULTURE": 0.20,
    },
  },

  // ─── CLEP Spanish Language ───
  CLEP_SPANISH: {
    name: "CLEP Spanish Language",
    shortName: "CLEP Spanish",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 121, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_SPANISH_1_LISTENING: { name: "Unit 1: Listening Comprehension (Reading Adaptation)", keyThemes: ["dialogue comprehension", "main idea identification", "inference from context", "distinguishing speakers' attitudes and register"] },
      CLEP_SPANISH_2_READING: { name: "Unit 2: Reading Comprehension", keyThemes: ["passage main idea and details", "vocabulary in context", "author's purpose and tone", "cultural references in Hispanic texts"] },
      CLEP_SPANISH_3_GRAMMAR: { name: "Unit 3: Grammar and Structure", keyThemes: ["preterite vs imperfect", "subjunctive mood (present and past)", "ser vs estar", "direct/indirect object pronouns"] },
      CLEP_SPANISH_4_VOCABULARY: { name: "Unit 4: Vocabulary in Context", keyThemes: ["false cognates (falsos amigos)", "idiomatic expressions (modismos)", "word families and derivation", "regional vocabulary variations"] },
      CLEP_SPANISH_5_CULTURE: { name: "Unit 5: Hispanic Culture and Civilization", keyThemes: ["Spanish-speaking world geography", "Hispanic customs and traditions", "major historical events (colonization, independence)", "arts and literature in Hispanic cultures"] },
    },
    suggestedTutorQuestions: ["When do I use the subjunctive mood in Spanish?", "How do I distinguish preterite from imperfect?", "What are the most common Spanish false cognates?"],
    curriculumContext: `CLEP Spanish Language tests the first two years of college Spanish. Exam: 120 questions, 90 minutes (2 sections: listening and reading). Passing earns 6-12 credits depending on score (~$2,400-$4,800 savings). Content: listening comprehension (33%), reading comprehension (33%), grammar/vocabulary (34%). Note: On this platform, listening is adapted to reading-based comprehension questions. Cognitive: 20% Recall, 50% Application, 30% Analysis.`,
    tutorResources: `- Tex's Spanish Grammar (laits.utexas.edu/spe): free CC-licensed grammar\n- Khan Academy Spanish (khanacademy.org): free basics\n- LibreTexts Spanish (human.libretexts.org/Bookshelves/Languages/Spanish): CC BY-NC-SA`,
    examAlignmentNotes: `Listening: 33% (adapted to reading-based on platform), Reading: 33%, Grammar/vocabulary: 34%. All 5-choice MCQ. Subjunctive and preterite/imperfect are the most frequently tested grammar topics. Score of 50 = 6 credits, 63+ = 12 credits at many institutions.`,
    stimulusRequirement: "Include a Spanish passage (2-4 sentences) or dialogue for comprehension, or a sentence with a blank for grammar/vocabulary; null for direct translation recall",
    stimulusDescription: "Spanish passage excerpt, dialogue, or sentence with grammatical blank",
    explanationGuidance: "explaining the grammar rule, providing the English equivalent, noting common errors, and showing how context (trigger words, clause type) determines the answer",
    skillCodes: ["Reading Comprehension", "Grammar Application", "Vocabulary in Context", "Cultural Literacy"],
    difficultyRubric: { EASY: "Identify the main idea of a simple Spanish passage or conjugate a regular verb in the present (Bloom's: Remember/Understand). 65%+ correct.", MEDIUM: "Choose the correct tense (preterite vs imperfect) in a contextual sentence, or infer meaning from a moderately complex passage (Bloom's: Apply). 40-55% correct.", HARD: "Select the correct subjunctive form in a complex sentence, interpret nuanced literary Spanish, or navigate a passage with multiple tenses (Bloom's: Analyze). 25-40% correct." },
    distractorTaxonomy: "(1) TENSE-CONFUSION TRAP — preterite vs imperfect in narration context; (2) SER-ESTAR TRAP — uses ser where estar required or vice versa; (3) FALSE-COGNATE TRAP — 'embarazada' means 'pregnant' not 'embarrassed'; (4) SUBJUNCTIVE-INDICATIVE TRAP — uses indicative after a subjunctive trigger.",
    stimulusQualityGuidance: "GOOD: 'Es importante que los estudiantes _____ (estudiar) todos los días. Choose the correct verb form.' AVOID: 'Conjugate estudiar in the present subjunctive.' — the exam tests grammar in context.",
    // Even distribution — no official CB per-unit breakdown available
    topicWeights: {
      "CLEP_SPANISH_1_LISTENING": 0.20,
      "CLEP_SPANISH_2_READING": 0.20,
      "CLEP_SPANISH_3_GRAMMAR": 0.20,
      "CLEP_SPANISH_4_VOCABULARY": 0.20,
      "CLEP_SPANISH_5_CULTURE": 0.20,
    },
  },

  // ─── CLEP Spanish with Writing ───
  CLEP_SPANISH_WRITING: {
    name: "CLEP Spanish with Writing",
    shortName: "CLEP Span. Writing",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 84, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_SPANWR_1_LISTENING: { name: "Unit 1: Listening Comprehension (Reading Adaptation)", keyThemes: ["dialogue and narrative comprehension", "main idea and supporting details", "inference and implied meaning", "register and tone identification"] },
      CLEP_SPANWR_2_READING: { name: "Unit 2: Reading Comprehension", keyThemes: ["literary and journalistic passages", "vocabulary in context", "author's argument and evidence", "cultural and historical references"] },
      CLEP_SPANWR_3_GRAMMAR: { name: "Unit 3: Advanced Grammar", keyThemes: ["subjunctive in adverbial clauses", "conditional and future tenses", "passive voice and se constructions", "complex sentence structures"] },
      CLEP_SPANWR_4_WRITING_SKILLS: { name: "Unit 4: Writing Skills (MCQ)", keyThemes: ["sentence completion and cloze", "error identification in paragraphs", "paragraph organization and coherence", "formal writing conventions"] },
      CLEP_SPANWR_5_ESSAY: { name: "Unit 5: Essay Writing Preparation", keyThemes: ["interpersonal writing (emails, letters)", "presentational writing (essays)", "thesis development in Spanish", "transitional expressions and cohesion"] },
    },
    suggestedTutorQuestions: ["How do I use the subjunctive in adverbial clauses?", "What are the key differences between por and para?", "How do I structure a formal essay in Spanish?"],
    curriculumContext: `CLEP Spanish with Writing tests advanced Spanish including writing skills. Full exam: 120 MCQ (90 min) + 2 essays (90 min). Passing earns 6-12 credits depending on score (~$2,400-$4,800 savings). MCQ content: listening (25%), reading (25%), grammar/vocabulary (25%), writing skills (25%). Note: On this platform, MCQ sections are covered; essay practice is supplemented with writing guidance. Cognitive: 15% Recall, 45% Application, 40% Analysis/Creation.`,
    tutorResources: `- Tex's Spanish Grammar (laits.utexas.edu/spe): free CC-licensed grammar\n- OpenStax Spanish resources via LibreTexts (human.libretexts.org/Bookshelves/Languages/Spanish): CC BY-NC-SA\n- Purdue OWL Spanish Writing Resources (owl.purdue.edu)`,
    examAlignmentNotes: `MCQ section: listening 25% (adapted to reading-based), reading 25%, grammar/vocabulary 25%, writing skills 25%. Essay section (not tested on platform): interpersonal + presentational writing. All MCQ are 5-choice. Advanced grammar (subjunctive, conditional, complex clauses) tested more heavily than in CLEP Spanish Language.`,
    stimulusRequirement: "Include a Spanish passage (3-5 sentences) for comprehension/error identification, or a cloze sentence for grammar; null for basic vocabulary recall",
    stimulusDescription: "Spanish passage with errors to identify, cloze sentence, or reading comprehension passage",
    explanationGuidance: "explaining the advanced grammar rule, contrasting with similar constructions, showing how context signals the correct form, and providing writing improvement strategies",
    skillCodes: ["Advanced Grammar", "Error Identification", "Reading Comprehension", "Writing Conventions"],
    difficultyRubric: { EASY: "Identify a clear grammatical error in a simple sentence or complete a cloze with a common verb form (Bloom's: Understand). 65%+ correct.", MEDIUM: "Select the correct subjunctive or conditional form in context, or identify the best revision for paragraph coherence (Bloom's: Apply/Analyze). 40-55% correct.", HARD: "Navigate complex multi-clause sentences with subjunctive/conditional interaction, or evaluate competing paragraph revisions for style and precision (Bloom's: Analyze/Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) SUBJUNCTIVE-TENSE TRAP — uses present subjunctive where past subjunctive required; (2) POR-PARA TRAP — confuses the two prepositions in context; (3) SE-CONSTRUCTION TRAP — confuses reflexive, impersonal, and passive se; (4) COHERENCE TRAP — transition word that sounds right but breaks logical flow.",
    stimulusQualityGuidance: "GOOD: 'Read this paragraph and identify the sentence that contains a grammatical error: \"Si yo tendría más tiempo, estudiaría más.\"' AVOID: 'Conjugate tener in the conditional.' — the exam tests error identification in context.",
    // Even distribution — no official CB per-unit breakdown available
    topicWeights: {
      "CLEP_SPANWR_1_LISTENING": 0.20,
      "CLEP_SPANWR_2_READING": 0.20,
      "CLEP_SPANWR_3_GRAMMAR": 0.20,
      "CLEP_SPANWR_4_WRITING_SKILLS": 0.20,
      "CLEP_SPANWR_5_ESSAY": 0.20,
    },
  },

  // ─── CLEP Educational Psychology ───
  CLEP_EDUCATIONAL_PSYCHOLOGY: {
    name: "CLEP Educational Psychology",
    shortName: "CLEP Ed Psych",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_EDPSY_1_LEARNING_THEORIES: { name: "Unit 1: Learning Theories", keyThemes: ["Behaviorism and classical/operant conditioning", "Constructivism and Piaget's stages", "Social learning theory and Bandura", "Information processing models"] },
      CLEP_EDPSY_2_COGNITIVE_DEV: { name: "Unit 2: Cognitive Development", keyThemes: ["Piaget's stages of cognitive development", "Vygotsky's zone of proximal development", "Language acquisition and development", "Memory, attention, and metacognition"] },
      CLEP_EDPSY_3_MOTIVATION: { name: "Unit 3: Motivation & Learning", keyThemes: ["Intrinsic vs extrinsic motivation", "Self-efficacy and attribution theory", "Maslow's hierarchy and self-determination theory", "Goal orientation and achievement motivation"] },
      CLEP_EDPSY_4_ASSESSMENT: { name: "Unit 4: Assessment & Evaluation", keyThemes: ["Formative vs summative assessment", "Reliability, validity, and standardized testing", "Norm-referenced vs criterion-referenced tests", "Rubrics, portfolios, and authentic assessment"] },
      CLEP_EDPSY_5_CLASSROOM_MGMT: { name: "Unit 5: Classroom Management", keyThemes: ["Proactive classroom management strategies", "Behavioral intervention and reinforcement", "Culturally responsive teaching", "Differentiated instruction and inclusion"] },
    },
    suggestedTutorQuestions: [
      "How does Vygotsky's ZPD differ from Piaget's stages in guiding instruction?",
      "What are the most effective strategies for increasing student intrinsic motivation?",
      "How do formative assessments improve learning outcomes compared to summative tests?",
    ],
    curriculumContext: `CLEP Educational Psychology — 100 questions, 90 minutes, 3 credits.
Covers learning theories, cognitive development, motivation, assessment, and classroom management.
Passing score earns 3 semester hours of college credit (~$1,200 tuition savings).
Content aligns with a typical one-semester introductory educational psychology course.`,
    tutorResources: `- OpenStax Psychology 2e (CC BY 4.0): https://openstax.org/details/books/psychology-2e\n- Saylor Academy PSYCH303 Educational Psychology (CC BY): https://learn.saylor.org/course/psych303\n- Khan Academy psychology & learning: https://www.khanacademy.org/science/ap-psychology`,
    examAlignmentNotes: `Approximate content weights: Learning Theories & Processes ~25%, Cognitive Development ~20%, Motivation & Affect ~15%, Assessment & Evaluation ~20%, Classroom Management & Instruction ~20%.`,
    stimulusRequirement: "Scenario-based: present a classroom situation, student behavior, or teaching dilemma for analysis.",
    stimulusDescription: "A brief classroom scenario (2-4 sentences) describing a teacher's action, student response, or instructional decision.",
    explanationGuidance: "Reference the specific psychological theory or principle. Explain why distractors represent common misconceptions about educational practice.",
    skillCodes: ["Conceptual Understanding", "Application to Practice", "Analysis of Scenarios", "Evaluation of Strategies"],
    difficultyRubric: { EASY: "Recall definitions of key theories and theorists (Bloom's: Remember). 65%+ correct.", MEDIUM: "Apply learning theories to classroom scenarios (Bloom's: Apply). 40-55% correct.", HARD: "Evaluate competing instructional strategies or analyze complex classroom dynamics (Bloom's: Analyze/Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) Theory misattribution — correct concept, wrong theorist; (2) Overgeneralization — applying a principle beyond its scope; (3) Superficial similarity — choosing an answer that sounds related but addresses a different construct.",
    stimulusQualityGuidance: "GOOD: 'A 3rd-grade teacher notices that students who receive verbal praise for effort attempt harder problems. Which theory best explains this?' AVOID: 'What is operant conditioning?'",
    // Even distribution — no official CB per-unit breakdown available
    topicWeights: {
      "CLEP_EDPSY_1_LEARNING_THEORIES": 0.20,
      "CLEP_EDPSY_2_COGNITIVE_DEV": 0.20,
      "CLEP_EDPSY_3_MOTIVATION": 0.20,
      "CLEP_EDPSY_4_ASSESSMENT": 0.20,
      "CLEP_EDPSY_5_CLASSROOM_MGMT": 0.20,
    },
  },

  // ─── CLEP Social Sciences & History ───
  CLEP_SOCIAL_SCIENCES_HISTORY: {
    name: "CLEP Social Sciences & History",
    shortName: "CLEP Soc Sci",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 120, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_SSH_1_US_HISTORY: { name: "Unit 1: US History", keyThemes: ["Colonial period through independence", "Civil War, Reconstruction, and industrialization", "20th-century domestic policy and civil rights", "US foreign policy and global role"] },
      CLEP_SSH_2_WORLD_HISTORY: { name: "Unit 2: World History", keyThemes: ["Ancient civilizations and classical empires", "Medieval and early modern global interactions", "Imperialism, colonialism, and decolonization", "20th-century conflicts and globalization"] },
      CLEP_SSH_3_ECONOMICS: { name: "Unit 3: Economics", keyThemes: ["Supply and demand, market equilibrium", "Macroeconomic indicators: GDP, inflation, unemployment", "Fiscal and monetary policy", "International trade and comparative advantage"] },
      CLEP_SSH_4_GEOGRAPHY: { name: "Unit 4: Geography", keyThemes: ["Physical geography and climate systems", "Human geography and population patterns", "Cultural diffusion and urbanization", "Geopolitics and resource distribution"] },
      CLEP_SSH_5_POLITICAL_SCIENCE: { name: "Unit 5: Political Science", keyThemes: ["Democratic theory and political ideologies", "US government structure and Constitution", "Comparative political systems", "International relations and organizations"] },
    },
    suggestedTutorQuestions: [
      "How did industrialization reshape both US domestic policy and global power dynamics?",
      "What is the relationship between fiscal policy and macroeconomic stability?",
      "How do geographic factors influence political and economic development?",
    ],
    curriculumContext: `CLEP Social Sciences & History — 120 questions, 90 minutes, 6 credits.
Covers US history, world history, economics, geography, and political science.
Passing score earns 6 semester hours of college credit (~$2,400 tuition savings).
Content spans introductory-level courses across five social science disciplines.`,
    tutorResources: `- OpenStax US History (CC BY 4.0): https://openstax.org/details/books/us-history\n- OpenStax Economics 2e (CC BY 4.0): https://openstax.org/details/books/principles-economics-2e\n- Khan Academy world history & economics: https://www.khanacademy.org/humanities/world-history`,
    examAlignmentNotes: `Approximate content weights: US History ~17%, World History ~17%, Economics ~17%, Geography ~16%, Government/Political Science ~17%, Sociology/Psychology ~16%.`,
    stimulusRequirement: "Use primary source excerpts, maps, data tables, or historical scenarios to contextualize questions.",
    stimulusDescription: "A brief passage, data summary, or historical context (2-4 sentences) grounding the question in a specific event, policy, or geographic phenomenon.",
    explanationGuidance: "Connect the answer to broader historical patterns or social science principles. Explain why each distractor represents a plausible but incorrect interpretation.",
    skillCodes: ["Historical Analysis", "Data Interpretation", "Conceptual Application", "Comparative Reasoning"],
    difficultyRubric: { EASY: "Identify key facts, dates, definitions, or geographic features (Bloom's: Remember). 65%+ correct.", MEDIUM: "Apply economic models or compare historical events across regions (Bloom's: Apply). 40-55% correct.", HARD: "Analyze causation across disciplines or evaluate competing interpretations of events (Bloom's: Analyze/Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) Chronological confusion — correct event, wrong time period; (2) Geographic misplacement — valid concept applied to wrong region; (3) Causal reversal — confusing cause and effect in historical or economic processes.",
    stimulusQualityGuidance: "GOOD: 'Between 1870 and 1914, European powers colonized over 80% of Africa. Which economic theory best explains the motivation?' AVOID: 'Name three European colonial powers.'",
    // Even distribution — no official CB per-unit breakdown available
    topicWeights: {
      "CLEP_SSH_1_US_HISTORY": 0.20,
      "CLEP_SSH_2_WORLD_HISTORY": 0.20,
      "CLEP_SSH_3_ECONOMICS": 0.20,
      "CLEP_SSH_4_GEOGRAPHY": 0.20,
      "CLEP_SSH_5_POLITICAL_SCIENCE": 0.20,
    },
  },

  // ─── CLEP Western Civilization I ───
  CLEP_WESTERN_CIV_1: {
    name: "CLEP Western Civilization I",
    shortName: "CLEP West Civ I",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 120, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_WC1_1_ANCIENT_NEAR_EAST: { name: "Unit 1: Ancient Near East", keyThemes: ["Mesopotamian civilizations and cuneiform", "Ancient Egypt: pharaohs, religion, and society", "Hebrew traditions and monotheism", "Persian Empire and governance"] },
      CLEP_WC1_2_GREECE_ROME: { name: "Unit 2: Greece & Rome", keyThemes: ["Athenian democracy and Greek philosophy", "Hellenistic world after Alexander", "Roman Republic institutions and expansion", "Roman Empire: Pax Romana and decline"] },
      CLEP_WC1_3_MEDIEVAL: { name: "Unit 3: Medieval Europe", keyThemes: ["Fall of Rome and early medieval kingdoms", "Feudalism, manorialism, and the Church", "Crusades and East-West cultural exchange", "Byzantine Empire and Islamic civilization"] },
      CLEP_WC1_4_RENAISSANCE_REFORM: { name: "Unit 4: Renaissance & Reformation", keyThemes: ["Italian Renaissance: humanism and art", "Northern Renaissance and printing press", "Protestant Reformation: Luther, Calvin, Zwingli", "Catholic Counter-Reformation and Council of Trent"] },
      CLEP_WC1_5_EARLY_MODERN: { name: "Unit 5: Early Modern Europe", keyThemes: ["Age of Exploration and colonial encounters", "Absolutism: Louis XIV, Peter the Great", "Scientific Revolution: Copernicus to Newton", "Early Enlightenment thought"] },
    },
    suggestedTutorQuestions: [
      "How did Greek democratic ideals influence Roman republican institutions?",
      "What role did the printing press play in the success of the Protestant Reformation?",
      "How did feudalism provide political stability after the fall of Rome?",
    ],
    curriculumContext: `CLEP Western Civilization I — 120 questions, 90 minutes, 3 credits.
Covers Western civilization from ancient Near East through early modern Europe (~1648).
Passing score earns 3 semester hours of college credit (~$1,200 tuition savings).
Content aligns with a typical first-semester Western civilization survey course.`,
    tutorResources: `- OpenStax World History Volume 1 (CC BY 4.0): https://openstax.org/details/books/world-history-volume-1\n- Saylor Academy HIST101 (CC BY): https://learn.saylor.org/course/hist101\n- Khan Academy ancient & medieval history: https://www.khanacademy.org/humanities/world-history`,
    examAlignmentNotes: `Approximate content weights: Ancient Near East ~10%, Greece & Rome ~25%, Medieval Europe ~25%, Renaissance & Reformation ~20%, Early Modern ~20%.`,
    stimulusRequirement: "Use primary source excerpts, artwork descriptions, or historical maps to contextualize questions.",
    stimulusDescription: "A brief excerpt from a historical document, description of an artifact, or summary of a political development (2-4 sentences).",
    explanationGuidance: "Place the answer in chronological context. Explain how distractors relate to different periods or misinterpret primary sources.",
    skillCodes: ["Chronological Reasoning", "Source Analysis", "Causation & Continuity", "Contextualization"],
    difficultyRubric: { EASY: "Identify key figures, events, or time periods in Western history (Bloom's: Remember). 65%+ correct.", MEDIUM: "Compare institutions or trace cause-and-effect across periods (Bloom's: Apply). 40-55% correct.", HARD: "Analyze primary sources or evaluate historiographical interpretations of major developments (Bloom's: Analyze/Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) Anachronism — correct concept placed in wrong century; (2) Attribution error — achievement credited to wrong civilization; (3) Overgeneralization — applying a local development to all of Europe.",
    stimulusQualityGuidance: "GOOD: 'In 1517, Martin Luther nailed 95 theses to the door of a Wittenberg church. Which specific Church practice was his primary target?' AVOID: 'Who started the Protestant Reformation?'",
    // Even distribution — no official CB per-unit breakdown available
    topicWeights: {
      "CLEP_WC1_1_ANCIENT_NEAR_EAST": 0.20,
      "CLEP_WC1_2_GREECE_ROME": 0.20,
      "CLEP_WC1_3_MEDIEVAL": 0.20,
      "CLEP_WC1_4_RENAISSANCE_REFORM": 0.20,
      "CLEP_WC1_5_EARLY_MODERN": 0.20,
    },
  },

  // ─── CLEP Western Civilization II ───
  CLEP_WESTERN_CIV_2: {
    name: "CLEP Western Civilization II",
    shortName: "CLEP West Civ II",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 120, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_WC2_1_ENLIGHTENMENT: { name: "Unit 1: The Enlightenment", keyThemes: ["Enlightenment philosophy: Locke, Voltaire, Rousseau", "Social contract theory and natural rights", "Enlightened absolutism and reform", "Salon culture and public sphere"] },
      CLEP_WC2_2_REVOLUTION_NAPOLEON: { name: "Unit 2: Revolution & Napoleon", keyThemes: ["Causes and phases of the French Revolution", "Napoleonic Wars and the Congress of Vienna", "Latin American independence movements", "Nationalism and the 1848 revolutions"] },
      CLEP_WC2_3_INDUSTRIALIZATION: { name: "Unit 3: Industrialization & Society", keyThemes: ["Industrial Revolution: technology and factory system", "Urbanization, labor movements, and socialism", "Imperialism and the scramble for Africa", "Social Darwinism and new ideologies"] },
      CLEP_WC2_4_WORLD_WARS: { name: "Unit 4: World Wars", keyThemes: ["Causes and conduct of World War I", "Interwar period: fascism, communism, depression", "World War II: causes, Holocaust, and total war", "Decolonization and the postwar order"] },
      CLEP_WC2_5_COLD_WAR_PRESENT: { name: "Unit 5: Cold War to Present", keyThemes: ["Cold War: containment, NATO, and détente", "Fall of communism and German reunification", "European integration and the EU", "Globalization, terrorism, and contemporary challenges"] },
    },
    suggestedTutorQuestions: [
      "How did Enlightenment ideas directly influence the French Revolution's Declaration of the Rights of Man?",
      "What were the long-term consequences of the Congress of Vienna for European stability?",
      "How did the Cold War reshape political boundaries and alliances in Europe?",
    ],
    curriculumContext: `CLEP Western Civilization II — 120 questions, 90 minutes, 3 credits.
Covers Western civilization from the Enlightenment (~1648) to the present.
Passing score earns 3 semester hours of college credit (~$1,200 tuition savings).
Content aligns with a typical second-semester Western civilization survey course.`,
    tutorResources: `- OpenStax World History Volume 2 (CC BY 4.0): https://openstax.org/details/books/world-history-volume-2\n- Saylor Academy HIST102 (CC BY): https://learn.saylor.org/course/hist102\n- Khan Academy modern history: https://www.khanacademy.org/humanities/world-history`,
    examAlignmentNotes: `Approximate content weights: Enlightenment ~15%, Revolutions & Napoleon ~20%, Industrialization & Imperialism ~20%, World Wars ~25%, Cold War to Present ~20%.`,
    stimulusRequirement: "Use primary source excerpts, political cartoons, or diplomatic documents to ground questions in historical evidence.",
    stimulusDescription: "A brief excerpt from a speech, treaty, or historical account (2-4 sentences) that provides context for analysis.",
    explanationGuidance: "Connect answers to broader ideological movements or geopolitical shifts. Explain how distractors confuse related but distinct historical developments.",
    skillCodes: ["Causation & Consequence", "Ideological Analysis", "Source Interpretation", "Periodization"],
    difficultyRubric: { EASY: "Recall key events, leaders, or dates from 1648 to present (Bloom's: Remember). 65%+ correct.", MEDIUM: "Compare revolutions or trace ideological influences across periods (Bloom's: Apply). 40-55% correct.", HARD: "Evaluate the causes of major conflicts or analyze competing historiographical perspectives (Bloom's: Analyze/Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) Ideological conflation — mixing liberal, socialist, and fascist principles; (2) Chronological displacement — correct event in wrong decade; (3) Causal oversimplification — attributing complex events to a single cause.",
    stimulusQualityGuidance: "GOOD: 'In his 1946 speech at Westminster College, Churchill declared an iron curtain had descended across Europe. What geopolitical reality did this metaphor describe?' AVOID: 'What was the Cold War?'",
    // Even distribution — no official CB per-unit breakdown available
    topicWeights: {
      "CLEP_WC2_1_ENLIGHTENMENT": 0.20,
      "CLEP_WC2_2_REVOLUTION_NAPOLEON": 0.20,
      "CLEP_WC2_3_INDUSTRIALIZATION": 0.20,
      "CLEP_WC2_4_WORLD_WARS": 0.20,
      "CLEP_WC2_5_COLD_WAR_PRESENT": 0.20,
    },
  },

  // ─── CLEP College Mathematics ───
  CLEP_COLLEGE_MATH: {
    name: "CLEP College Mathematics",
    shortName: "CLEP College Math",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 60, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_CMATH_1_SETS_LOGIC: { name: "Unit 1: Sets & Logic", keyThemes: ["Set operations: union, intersection, complement", "Venn diagrams and counting principles", "Propositional logic and truth tables", "Conditional statements and logical equivalence"] },
      CLEP_CMATH_2_REAL_NUMBERS: { name: "Unit 2: Real Number System", keyThemes: ["Properties of integers and rational numbers", "Absolute value, exponents, and radicals", "Order of operations and algebraic expressions", "Percentages, ratios, and proportions"] },
      CLEP_CMATH_3_FUNCTIONS: { name: "Unit 3: Functions & Their Graphs", keyThemes: ["Domain, range, and function notation", "Linear, quadratic, and polynomial functions", "Exponential and logarithmic functions", "Composition and inverse functions"] },
      CLEP_CMATH_4_PROBABILITY_STATS: { name: "Unit 4: Probability & Statistics", keyThemes: ["Basic probability rules and counting", "Conditional probability and independence", "Descriptive statistics: mean, median, standard deviation", "Normal distribution and data interpretation"] },
      CLEP_CMATH_5_GEOMETRY: { name: "Unit 5: Geometry & Measurement", keyThemes: ["Properties of lines, angles, and triangles", "Coordinate geometry and distance formula", "Area, perimeter, and volume calculations", "Transformations and symmetry"] },
    },
    suggestedTutorQuestions: [
      "How do you determine if two events are independent using conditional probability?",
      "When should you use logarithmic vs exponential functions to model real-world situations?",
      "How do Venn diagrams help solve counting problems with overlapping sets?",
    ],
    curriculumContext: `CLEP College Mathematics — 60 questions, 90 minutes, 6 credits.
Covers sets and logic, real numbers, functions, probability and statistics, and geometry.
Passing score earns 6 semester hours of college credit (~$2,400 tuition savings).
Content aligns with a general education college mathematics requirement (non-calculus).`,
    tutorResources: `- OpenStax College Algebra (CC BY 4.0): https://openstax.org/details/books/college-algebra\n- OpenStax Introductory Statistics (CC BY 4.0): https://openstax.org/details/books/introductory-statistics\n- Khan Academy algebra & statistics: https://www.khanacademy.org/math`,
    examAlignmentNotes: `Approximate content weights: Sets & Logic ~10%, Real Number System ~20%, Functions & Graphs ~25%, Probability & Statistics ~25%, Geometry ~20%.`,
    stimulusRequirement: "Present a mathematical scenario, data set, or real-world context that requires applying mathematical reasoning.",
    stimulusDescription: "A brief problem setup (1-3 sentences) with numerical data, a function, or a geometric figure description.",
    explanationGuidance: "Show the solution steps clearly. Explain which mathematical property or formula applies and why each distractor results from a common computational error.",
    skillCodes: ["Computational Fluency", "Conceptual Understanding", "Problem Solving", "Data Interpretation"],
    difficultyRubric: { EASY: "Perform straightforward calculations or identify properties of numbers and shapes (Bloom's: Remember). 65%+ correct.", MEDIUM: "Apply formulas to multi-step problems or interpret data displays (Bloom's: Apply). 40-55% correct.", HARD: "Analyze complex functions, evaluate probability scenarios, or synthesize concepts across topics (Bloom's: Analyze/Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) Sign error — incorrect handling of negatives; (2) Formula misapplication — using the wrong formula for the context; (3) Order-of-operations mistake — computing steps in wrong sequence.",
    stimulusQualityGuidance: "GOOD: 'A survey of 200 students found that 120 take math, 80 take science, and 40 take both. How many take neither?' AVOID: 'What is the union of two sets?'",
    // CB weights: Sets 10%, Logic 10%, Real number system 10%, Functions/graphs 15%, Probability/statistics 25%, Misc 30% — mapped across 5 units
    topicWeights: {
      "CLEP_CMATH_1_SETS_LOGIC": 0.15,
      "CLEP_CMATH_2_REAL_NUMBERS": 0.15,
      "CLEP_CMATH_3_FUNCTIONS": 0.20,
      "CLEP_CMATH_4_PROBABILITY_STATS": 0.30,
      "CLEP_CMATH_5_GEOMETRY": 0.20,
    },
    recommendedTextbooks: [
      "OpenStax College Algebra 2e + Introductory Statistics (free: openstax.org)",
      "Angel et al., A Survey of Mathematics with Applications (Pearson)",
    ],
  },

  // ─── CLEP Natural Sciences ───
  CLEP_NATURAL_SCIENCES: {
    name: "CLEP Natural Sciences",
    shortName: "CLEP Nat Sci",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 120, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_NATSCI_1_BIOLOGICAL: { name: "Unit 1: Biological Science", keyThemes: ["Cell structure, function, and reproduction", "Genetics, DNA, and heredity", "Evolution and natural selection", "Ecology: ecosystems, populations, and biodiversity"] },
      CLEP_NATSCI_2_PHYSICAL: { name: "Unit 2: Physical Science", keyThemes: ["Newton's laws and mechanics", "Energy, work, and thermodynamics", "Waves, sound, and light", "Electricity and magnetism fundamentals"] },
      CLEP_NATSCI_3_EARTH_SPACE: { name: "Unit 3: Earth & Space Science", keyThemes: ["Plate tectonics and geological processes", "Atmosphere, weather, and climate", "Solar system and stellar evolution", "Earth's history and fossil record"] },
      CLEP_NATSCI_4_CHEMISTRY: { name: "Unit 4: Chemistry Fundamentals", keyThemes: ["Atomic structure and the periodic table", "Chemical bonding and molecular structure", "Chemical reactions and stoichiometry", "Acids, bases, and solutions"] },
      CLEP_NATSCI_5_SCIENTIFIC_METHOD: { name: "Unit 5: Scientific Method & History", keyThemes: ["Hypothesis testing and experimental design", "Variables, controls, and data analysis", "History of major scientific discoveries", "Ethics and societal impact of science"] },
    },
    suggestedTutorQuestions: [
      "How does natural selection lead to adaptation over multiple generations?",
      "What is the relationship between plate tectonics and the distribution of earthquakes and volcanoes?",
      "How do you design a controlled experiment to test a specific hypothesis?",
    ],
    curriculumContext: `CLEP Natural Sciences — 120 questions, 90 minutes, 6 credits.
Covers biological science, physical science, earth & space science, chemistry, and scientific method.
Passing score earns 6 semester hours of college credit (~$2,400 tuition savings).
Content spans introductory-level courses in biology and physical sciences.`,
    tutorResources: `- OpenStax Biology 2e (CC BY 4.0): https://openstax.org/details/books/biology-2e\n- OpenStax College Physics (CC BY 4.0): https://openstax.org/details/books/college-physics\n- OpenStax Chemistry 2e (CC BY 4.0): https://openstax.org/details/books/chemistry-2e`,
    examAlignmentNotes: `Approximate content weights: Biological Science ~25%, Physical Science ~25%, Earth & Space Science ~20%, Chemistry ~15%, Scientific Method & History ~15%.`,
    stimulusRequirement: "Use experimental scenarios, data tables, diagrams, or natural phenomena descriptions to ground questions.",
    stimulusDescription: "A brief scientific scenario (2-4 sentences) describing an experiment, observation, or natural process.",
    explanationGuidance: "Reference the underlying scientific principle or law. Explain how distractors represent common scientific misconceptions.",
    skillCodes: ["Scientific Reasoning", "Data Analysis", "Conceptual Knowledge", "Experimental Design"],
    difficultyRubric: { EASY: "Recall basic scientific facts, definitions, or processes (Bloom's: Remember). 65%+ correct.", MEDIUM: "Apply scientific principles to novel scenarios or interpret experimental data (Bloom's: Apply). 40-55% correct.", HARD: "Analyze experimental results, evaluate hypotheses, or synthesize concepts across scientific disciplines (Bloom's: Analyze/Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) Common misconception — reflects a widely held but incorrect scientific belief; (2) Partial truth — includes a correct element but reaches a wrong conclusion; (3) Scale confusion — confuses atomic, cellular, organismal, or planetary scale phenomena.",
    stimulusQualityGuidance: "GOOD: 'A scientist observes that a population of beetles on an island has darker coloring than the mainland population. What mechanism best explains this divergence?' AVOID: 'Define natural selection.'",
    // Even distribution — no official CB per-unit breakdown available
    topicWeights: {
      "CLEP_NATSCI_1_BIOLOGICAL": 0.20,
      "CLEP_NATSCI_2_PHYSICAL": 0.20,
      "CLEP_NATSCI_3_EARTH_SPACE": 0.20,
      "CLEP_NATSCI_4_CHEMISTRY": 0.20,
      "CLEP_NATSCI_5_SCIENTIFIC_METHOD": 0.20,
    },
  },

  // ─── CLEP Precalculus ───
  CLEP_PRECALCULUS: {
    name: "CLEP Precalculus",
    shortName: "CLEP Precalc",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 48, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_PRECALC_1_ALGEBRAIC: { name: "Unit 1: Algebraic Expressions & Equations", keyThemes: ["Polynomial operations and factoring", "Rational expressions and equations", "Systems of equations and inequalities", "Complex numbers and quadratic formula"] },
      CLEP_PRECALC_2_TRIGONOMETRY: { name: "Unit 2: Trigonometry", keyThemes: ["Unit circle and radian measure", "Trigonometric functions and identities", "Law of sines and law of cosines", "Inverse trigonometric functions"] },
      CLEP_PRECALC_3_ANALYTIC_GEOMETRY: { name: "Unit 3: Analytic Geometry", keyThemes: ["Conic sections: circles, ellipses, parabolas, hyperbolas", "Parametric equations and polar coordinates", "Vectors in two dimensions", "Transformations and symmetry"] },
      CLEP_PRECALC_4_FUNCTIONS: { name: "Unit 4: Functions & Modeling", keyThemes: ["Polynomial, rational, and piecewise functions", "Exponential growth and decay models", "Logarithmic functions and equations", "Function transformations and composition"] },
      CLEP_PRECALC_5_LIMITS_INTRO: { name: "Unit 5: Sequences, Series & Limits", keyThemes: ["Arithmetic and geometric sequences", "Series and summation notation", "Intuitive concept of limits", "Binomial theorem and counting principles"] },
    },
    suggestedTutorQuestions: [
      "How do you convert between radian and degree measure and why is radian measure preferred in calculus?",
      "What strategies help identify the type of conic section from its general equation?",
      "How do exponential and logarithmic functions model real-world growth and decay?",
    ],
    curriculumContext: `CLEP Precalculus — 48 questions, 90 minutes, 3 credits.
Covers algebraic expressions, trigonometry, analytic geometry, functions, sequences, and introductory limits.
Passing score earns 3 semester hours of college credit (~$1,200 tuition savings).
Content aligns with a precalculus course that prepares students for calculus.`,
    tutorResources: `- OpenStax Precalculus 2e (CC BY 4.0): https://openstax.org/details/books/precalculus-2e\n- OpenStax Algebra and Trigonometry 2e (CC BY 4.0): https://openstax.org/details/books/algebra-and-trigonometry-2e\n- Khan Academy precalculus: https://www.khanacademy.org/math/precalculus`,
    examAlignmentNotes: `Approximate content weights: Algebraic Expressions ~20%, Trigonometry ~25%, Analytic Geometry ~15%, Functions & Modeling ~25%, Sequences, Series & Limits ~15%.`,
    stimulusRequirement: "Present a mathematical function, equation, graph description, or applied problem requiring multi-step reasoning.",
    stimulusDescription: "A function definition, equation, or real-world modeling scenario (1-3 sentences) with specific values or parameters.",
    explanationGuidance: "Walk through the solution algebraically step by step. Identify which property, identity, or theorem applies. Show how distractors arise from common algebraic or trigonometric errors.",
    skillCodes: ["Algebraic Manipulation", "Trigonometric Reasoning", "Graphical Analysis", "Mathematical Modeling"],
    difficultyRubric: { EASY: "Evaluate functions, simplify expressions, or recall trigonometric values at standard angles (Bloom's: Remember). 65%+ correct.", MEDIUM: "Solve multi-step equations, apply identities, or analyze function behavior (Bloom's: Apply). 40-55% correct.", HARD: "Synthesize concepts across topics, analyze complex conic sections, or model real-world scenarios with constraints (Bloom's: Analyze/Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) Sign/quadrant error — incorrect sign from wrong quadrant in trig; (2) Algebraic slip — distributing or factoring incorrectly; (3) Transformation reversal — confusing horizontal and vertical shifts or reflections.",
    stimulusQualityGuidance: "GOOD: 'The height of a Ferris wheel rider is modeled by h(t) = 30sin(πt/4) + 35. What is the maximum height and how long does one full revolution take?' AVOID: 'What is sin(π/4)?'",
    // Even distribution — no official CB per-unit breakdown available
    topicWeights: {
      "CLEP_PRECALC_1_ALGEBRAIC": 0.20,
      "CLEP_PRECALC_2_TRIGONOMETRY": 0.20,
      "CLEP_PRECALC_3_ANALYTIC_GEOMETRY": 0.20,
      "CLEP_PRECALC_4_FUNCTIONS": 0.20,
      "CLEP_PRECALC_5_LIMITS_INTRO": 0.20,
    },
  },

  // ─── CLEP Information Systems ───
  CLEP_INFORMATION_SYSTEMS: {
    name: "CLEP Information Systems",
    shortName: "CLEP Info Sys",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_IS_1_FUNDAMENTALS: { name: "Unit 1: IS Fundamentals", keyThemes: ["Role of information systems in organizations", "Types of IS: TPS, MIS, DSS, ERP", "Information system components and architecture", "IT governance and strategic alignment"] },
      CLEP_IS_2_HARDWARE_SOFTWARE: { name: "Unit 2: Hardware & Software", keyThemes: ["Computer hardware components and architecture", "Operating systems and system software", "Application software and cloud computing", "Mobile computing and emerging technologies"] },
      CLEP_IS_3_DATABASES: { name: "Unit 3: Databases & Data Management", keyThemes: ["Relational database concepts and SQL basics", "Data modeling and entity-relationship diagrams", "Data warehousing and business intelligence", "Big data, data quality, and data governance"] },
      CLEP_IS_4_NETWORKS_SECURITY: { name: "Unit 4: Networks & Security", keyThemes: ["Network topologies, protocols, and the internet", "Cybersecurity threats and defense strategies", "Encryption, authentication, and access control", "Privacy, compliance, and ethical considerations"] },
      CLEP_IS_5_SYSTEMS_DEVELOPMENT: { name: "Unit 5: Systems Development", keyThemes: ["Systems development life cycle (SDLC)", "Agile, Scrum, and iterative methodologies", "Project management and requirements analysis", "Testing, implementation, and maintenance"] },
    },
    suggestedTutorQuestions: [
      "How does an ERP system integrate different business functions within an organization?",
      "What are the key differences between relational databases and NoSQL data stores?",
      "How do Agile methodologies differ from the traditional waterfall SDLC?",
    ],
    curriculumContext: `CLEP Information Systems — 100 questions, 90 minutes, 3 credits.
Covers IS fundamentals, hardware/software, databases, networks/security, and systems development.
Passing score earns 3 semester hours of college credit (~$1,200 tuition savings).
Content aligns with an introductory management information systems (MIS) course.`,
    tutorResources: `- Saylor Academy BUS206 Management Information Systems (CC BY): https://learn.saylor.org/course/bus206\n- MIT OCW 15.561 Information Technology Essentials: https://ocw.mit.edu/courses/15-561-information-technology-essentials-spring-2005/\n- LibreTexts Engineering — Information Systems: https://eng.libretexts.org/`,
    examAlignmentNotes: `Approximate content weights: IS Fundamentals ~15%, Hardware & Software ~20%, Databases & Data Management ~20%, Networks & Security ~25%, Systems Development ~20%.`,
    stimulusRequirement: "Use organizational scenarios, system architecture diagrams, or security incident descriptions to contextualize questions.",
    stimulusDescription: "A brief business or technology scenario (2-4 sentences) describing an organizational challenge, system design decision, or security situation.",
    explanationGuidance: "Reference specific IS concepts, frameworks, or best practices. Explain why distractors represent common misconceptions about technology or process.",
    skillCodes: ["Conceptual Knowledge", "Systems Thinking", "Security Analysis", "Process Application"],
    difficultyRubric: { EASY: "Recall definitions of IS concepts, hardware components, or network protocols (Bloom's: Remember). 65%+ correct.", MEDIUM: "Apply database design principles or recommend appropriate IS solutions for business scenarios (Bloom's: Apply). 40-55% correct.", HARD: "Evaluate system architectures, analyze security vulnerabilities, or compare development methodologies for complex requirements (Bloom's: Analyze/Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) Terminology confusion — mixing up similar-sounding IS concepts; (2) Layer mismatch — confusing application, network, and hardware layer responsibilities; (3) Methodology conflation — attributes of one SDLC methodology applied to another.",
    stimulusQualityGuidance: "GOOD: 'A mid-size retailer wants to unify inventory, sales, and HR into a single platform. Which type of system best addresses this need and why?' AVOID: 'What does ERP stand for?'",
    // Even distribution — no official CB per-unit breakdown available
    topicWeights: {
      "CLEP_IS_1_FUNDAMENTALS": 0.20,
      "CLEP_IS_2_HARDWARE_SOFTWARE": 0.20,
      "CLEP_IS_3_DATABASES": 0.20,
      "CLEP_IS_4_NETWORKS_SECURITY": 0.20,
      "CLEP_IS_5_SYSTEMS_DEVELOPMENT": 0.20,
    },
  },

  // ─── CLEP Introductory Business Law ───
  CLEP_BUSINESS_LAW: {
    name: "CLEP Introductory Business Law",
    shortName: "CLEP Biz Law",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: false,
    units: {
      CLEP_BIZLAW_1_LEGAL_SYSTEM: { name: "Unit 1: The Legal System", keyThemes: ["Sources of law: constitutional, statutory, administrative", "Court systems and jurisdiction", "Civil vs criminal procedure", "Alternative dispute resolution: mediation and arbitration"] },
      CLEP_BIZLAW_2_CONTRACTS: { name: "Unit 2: Contracts", keyThemes: ["Elements of a valid contract: offer, acceptance, consideration", "Capacity, legality, and statute of frauds", "Contract performance, breach, and remedies", "Third-party rights and assignment"] },
      CLEP_BIZLAW_3_SALES_TORTS: { name: "Unit 3: Sales & Torts", keyThemes: ["UCC Article 2: sale of goods", "Warranties: express, implied, and disclaimer", "Intentional torts: battery, fraud, defamation", "Negligence: duty, breach, causation, damages"] },
      CLEP_BIZLAW_4_BUSINESS_ORG: { name: "Unit 4: Business Organizations", keyThemes: ["Sole proprietorships and partnerships", "Corporations: formation, governance, liability", "LLCs and limited partnerships", "Agency law and fiduciary duties"] },
      CLEP_BIZLAW_5_EMPLOYMENT_ETHICS: { name: "Unit 5: Employment Law & Ethics", keyThemes: ["Employment discrimination and Title VII", "Workplace safety: OSHA and workers' compensation", "Intellectual property: patents, trademarks, copyrights", "Business ethics and corporate social responsibility"] },
    },
    suggestedTutorQuestions: [
      "What are the essential elements of a valid contract and what happens when one is missing?",
      "How does the concept of negligence differ from intentional torts in establishing liability?",
      "What factors should an entrepreneur consider when choosing between an LLC and a corporation?",
    ],
    curriculumContext: `CLEP Introductory Business Law — 100 questions, 90 minutes, 3 credits.
Covers the legal system, contracts, sales and torts, business organizations, and employment law.
Passing score earns 3 semester hours of college credit (~$1,200 tuition savings).
Content aligns with a typical introductory business law or legal environment of business course.`,
    tutorResources: `- Saylor Academy BUS205 Business Law (CC BY): https://learn.saylor.org/course/bus205\n- LibreTexts Business Law I Essentials (CC BY-NC-SA): https://biz.libretexts.org/\n- Khan Academy economics & finance — legal concepts: https://www.khanacademy.org/economics-finance-domain`,
    examAlignmentNotes: `Approximate content weights: Legal System & Courts ~15%, Contracts ~30%, Sales & Torts ~20%, Business Organizations ~20%, Employment Law & Ethics ~15%.`,
    stimulusRequirement: "Present legal scenarios, case summaries, or business disputes that require applying legal principles to reach a conclusion.",
    stimulusDescription: "A brief fact pattern (2-4 sentences) describing a business dispute, contractual situation, or legal question requiring analysis.",
    explanationGuidance: "Identify the applicable legal rule or doctrine. Explain how the facts satisfy or fail to satisfy each element. Show why distractors misapply the legal standard.",
    skillCodes: ["Legal Reasoning", "Rule Application", "Issue Identification", "Case Analysis"],
    difficultyRubric: { EASY: "Recall legal definitions, court structures, or elements of basic legal concepts (Bloom's: Remember). 65%+ correct.", MEDIUM: "Apply contract or tort principles to a business scenario to determine liability (Bloom's: Apply). 40-55% correct.", HARD: "Analyze complex fact patterns with multiple legal issues or evaluate the strengths of competing legal arguments (Bloom's: Analyze/Evaluate). 25-40% correct." },
    distractorTaxonomy: "(1) Element confusion — satisfying the wrong element of a legal test; (2) Jurisdiction error — applying the wrong body of law (e.g., UCC to a service contract); (3) Remedy mismatch — selecting a remedy appropriate for a different type of legal claim.",
    stimulusQualityGuidance: "GOOD: 'A customer slips on a wet floor in a grocery store with no warning sign posted. Under negligence law, which element is most critical to establishing the store's liability?' AVOID: 'Define negligence.'",
    // Even distribution — no official CB per-unit breakdown available
    topicWeights: {
      "CLEP_BIZLAW_1_LEGAL_SYSTEM": 0.20,
      "CLEP_BIZLAW_2_CONTRACTS": 0.20,
      "CLEP_BIZLAW_3_SALES_TORTS": 0.20,
      "CLEP_BIZLAW_4_BUSINESS_ORG": 0.20,
      "CLEP_BIZLAW_5_EMPLOYMENT_ETHICS": 0.20,
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DSST — DANTES Subject Standardized Tests
  // DSST® is a registered trademark of Prometric. StudentNest is not
  // affiliated with or endorsed by Prometric or DANTES.
  // All questions are AI-generated original content.
  // ═══════════════════════════════════════════════════════════════════════════

  // ── DSST Principles of Supervision ──────────────────────────────────────
  DSST_PRINCIPLES_OF_SUPERVISION: {
    name: "DSST Principles of Supervision",
    shortName: "DSST Supervision",
    examSecsPerQuestion: 72, // 100 questions in 120 minutes
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_SUPV_1_ROLES_RESPONSIBILITIES: {
        name: "Unit 1: Roles and Responsibilities of Supervisors",
        keyThemes: ["supervisory roles", "management levels", "authority and responsibility", "delegation", "accountability", "span of control"],
        openStaxUrl: "https://openstax.org/books/principles-management/pages/1-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/entrepreneurship2",
      },
      DSST_SUPV_2_MANAGEMENT_FUNCTIONS: {
        name: "Unit 2: Management Functions",
        keyThemes: ["planning", "organizing", "leading", "controlling", "decision-making", "SWOT analysis"],
        openStaxUrl: "https://openstax.org/books/principles-management/pages/2-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/entrepreneurship2",
      },
      DSST_SUPV_3_LEADERSHIP: {
        name: "Unit 3: Leadership and Communication",
        keyThemes: ["leadership styles", "situational leadership", "communication barriers", "active listening", "conflict resolution", "team building"],
        openStaxUrl: "https://openstax.org/books/principles-management/pages/13-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/entrepreneurship2",
      },
      DSST_SUPV_4_LABOR_RELATIONS: {
        name: "Unit 4: Labor Relations and Legal Issues",
        keyThemes: ["labor unions", "collective bargaining", "grievance procedures", "EEOC", "workplace safety", "OSHA"],
        openStaxUrl: "https://openstax.org/books/principles-management/pages/12-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/entrepreneurship2",
      },
      DSST_SUPV_5_TRAINING_PERFORMANCE: {
        name: "Unit 5: Training and Performance Management",
        keyThemes: ["employee orientation", "training methods", "performance appraisal", "feedback techniques", "coaching", "progressive discipline"],
        openStaxUrl: "https://openstax.org/books/principles-management/pages/11-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/entrepreneurship2",
      },
    },
    suggestedTutorQuestions: [
      "What are the four main management functions?",
      "How does situational leadership work?",
      "What is the difference between delegation and abdication?",
      "How should a supervisor handle a grievance?",
      "What are the key steps in a performance appraisal?",
      "How does OSHA protect workers?",
    ],
    curriculumContext: `DSST Principles of Supervision covers the fundamentals of first-line and mid-level supervisory management.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: roles and responsibilities of supervisors (20%), management functions (20%), leadership and communication (25%), labor relations (15%), training and performance (20%).`,
    tutorResources: `
- OpenStax Principles of Management (openstax.org/books/principles-management): Free, CC-licensed textbook
- Saylor Academy BUS209 (learn.saylor.org/course/BUS209): Free Principles of Supervision course
- Khan Academy Entrepreneurship (khanacademy.org): Management fundamentals`,
    examAlignmentNotes: `DSST Principles of Supervision alignment:
- Roles/responsibilities of supervisors: 20%
- Management functions (POLC): 20%
- Leadership and communication: 25%
- Labor relations and legal issues: 15%
- Training, development, and performance: 20%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include a brief workplace scenario as stimulus where relevant; null for concept-definition questions",
    stimulusDescription: "workplace scenario or management situation (null for concept recall)",
    explanationGuidance: "referencing the specific management theory or supervisory principle and explaining why the correct approach is preferred in practice",
    difficultyRubric: {
      EASY: "Define a management term or identify a supervisory function from its description. 65%+ correct.",
      MEDIUM: "Apply a leadership theory to a workplace scenario or determine the correct disciplinary step. 40–55% correct.",
      HARD: "Analyze a multi-factor management dilemma requiring trade-off evaluation between competing principles. 25–40% correct.",
    },
    distractorTaxonomy: "(1) AUTOCRATIC TRAP — chooses unilateral action when participative approach is warranted; (2) LEGAL CONFUSION — mixes up OSHA, EEOC, and FLSA protections; (3) DELEGATION TRAP — confuses accountability with responsibility after delegation.",
    stimulusQualityGuidance: "GOOD: A 3-sentence workplace scenario with a specific supervisory dilemma and question. AVOID: Abstract management theory without applied context.",
    skillCodes: ["Supervisory Functions", "Leadership Application", "Labor Relations", "Performance Management"],
    topicWeights: {
      "DSST_SUPV_1_ROLES_RESPONSIBILITIES": 0.20,
      "DSST_SUPV_2_MANAGEMENT_FUNCTIONS": 0.20,
      "DSST_SUPV_3_LEADERSHIP": 0.25,
      "DSST_SUPV_4_LABOR_RELATIONS": 0.15,
      "DSST_SUPV_5_TRAINING_PERFORMANCE": 0.20,
    },
    recommendedTextbooks: [
      "OpenStax Principles of Management (free: openstax.org/books/principles-management)",
      "Mosley, Pietri & Mosley, Supervisory Management (Cengage)",
      "Certo, Supervision: Concepts and Skill-Building (McGraw-Hill)",
    ],
  },

  // ── DSST Human Resource Management ──────────────────────────────────────
  DSST_HUMAN_RESOURCE_MANAGEMENT: {
    name: "DSST Human Resource Management",
    shortName: "DSST HR Mgmt",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_HRM_1_WORKFORCE_PLANNING: {
        name: "Unit 1: Workforce Planning and Employment Law",
        keyThemes: ["job analysis", "HR planning", "Title VII", "ADA", "FMLA", "equal employment opportunity"],
        openStaxUrl: "https://openstax.org/books/principles-management/pages/11-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/entrepreneurship2",
      },
      DSST_HRM_2_RECRUITMENT_SELECTION: {
        name: "Unit 2: Recruitment and Selection",
        keyThemes: ["recruiting strategies", "interviewing", "selection tests", "background checks", "onboarding", "employer branding"],
        openStaxUrl: "https://openstax.org/books/principles-management/pages/11-2-the-changing-role-of-strategic-human-resource-management-in-principles-of-management",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/entrepreneurship2",
      },
      DSST_HRM_3_TRAINING_DEVELOPMENT: {
        name: "Unit 3: Training and Development",
        keyThemes: ["needs assessment", "training methods", "e-learning", "career development", "succession planning", "mentoring"],
        openStaxUrl: "https://openstax.org/books/principles-management/pages/11-3-recruiting-and-selecting-the-right-employees",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/entrepreneurship2",
      },
      DSST_HRM_4_COMPENSATION_BENEFITS: {
        name: "Unit 4: Compensation and Benefits",
        keyThemes: ["pay structures", "job evaluation", "incentive plans", "health insurance", "401(k)", "FLSA and minimum wage"],
        openStaxUrl: "https://openstax.org/books/principles-management/pages/11-5-building-an-organization-for-the-future",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/core-finance",
      },
      DSST_HRM_5_EMPLOYEE_RELATIONS: {
        name: "Unit 5: Employee and Labor Relations",
        keyThemes: ["employee engagement", "disciplinary procedures", "termination", "unions", "NLRA", "workplace safety"],
        openStaxUrl: "https://openstax.org/books/principles-management/pages/12-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/entrepreneurship2",
      },
    },
    suggestedTutorQuestions: [
      "What is the difference between Title VII and the ADA?",
      "How does a structured interview differ from an unstructured one?",
      "What are the key steps in conducting a training needs assessment?",
      "How are pay structures typically designed?",
      "What rights does the NLRA give employees?",
      "What is progressive discipline?",
    ],
    curriculumContext: `DSST Human Resource Management covers the full HR lifecycle from workforce planning to employee relations.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: workforce planning (20%), recruitment/selection (20%), training/development (20%), compensation/benefits (20%), employee relations (20%).`,
    tutorResources: `
- OpenStax Principles of Management Ch. 11-12 (openstax.org/books/principles-management): Free HR chapters
- Saylor Academy BUS301 (learn.saylor.org/course/BUS301): Free Human Resource Management course
- SHRM Learning System (shrm.org): Professional HR reference materials`,
    examAlignmentNotes: `DSST Human Resource Management alignment:
- Workforce planning and employment law: 20%
- Recruitment and selection: 20%
- Training and development: 20%
- Compensation and benefits: 20%
- Employee and labor relations: 20%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include a brief HR scenario as stimulus where relevant; null for law/regulation recall questions",
    stimulusDescription: "HR scenario or workplace situation (null for definition/regulation recall)",
    explanationGuidance: "citing the relevant employment law, HR principle, or best practice and explaining why the correct HR action is most appropriate",
    difficultyRubric: {
      EASY: "Define an HR term or identify which employment law applies to a described situation. 65%+ correct.",
      MEDIUM: "Determine the correct HR procedure for a scenario involving multiple applicable laws or policies. 40–55% correct.",
      HARD: "Analyze a complex HR dilemma with competing legal, ethical, and business considerations. 25–40% correct.",
    },
    distractorTaxonomy: "(1) WRONG LAW TRAP — applies Title VII when ADA is the correct statute; (2) PROCESS SKIP TRAP — jumps to termination without following progressive discipline; (3) COMPLIANCE TRAP — confuses federal and state employment law thresholds.",
    stimulusQualityGuidance: "GOOD: A 3-sentence HR scenario with specific employee details and a clear dilemma. AVOID: Vague 'an employee has a problem' without enough specifics to analyze.",
    skillCodes: ["Employment Law", "Recruitment", "Compensation Design", "Employee Relations"],
    topicWeights: {
      "DSST_HRM_1_WORKFORCE_PLANNING": 0.20,
      "DSST_HRM_2_RECRUITMENT_SELECTION": 0.20,
      "DSST_HRM_3_TRAINING_DEVELOPMENT": 0.20,
      "DSST_HRM_4_COMPENSATION_BENEFITS": 0.20,
      "DSST_HRM_5_EMPLOYEE_RELATIONS": 0.20,
    },
    recommendedTextbooks: [
      "OpenStax Principles of Management (free: openstax.org/books/principles-management)",
      "Dessler, Human Resource Management (Pearson)",
      "Noe et al., Fundamentals of Human Resource Management (McGraw-Hill)",
    ],
  },

  // ── DSST Organizational Behavior ────────────────────────────────────────
  DSST_ORGANIZATIONAL_BEHAVIOR: {
    name: "DSST Organizational Behavior",
    shortName: "DSST Org Behavior",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_OB_1_INDIVIDUAL_BEHAVIOR: {
        name: "Unit 1: Individual Behavior and Perception",
        keyThemes: ["personality traits", "perception and attribution", "attitudes", "job satisfaction", "Big Five model", "self-efficacy"],
        openStaxUrl: "https://openstax.org/books/organizational-behavior/pages/3-introduction",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior",
      },
      DSST_OB_2_MOTIVATION_THEORIES: {
        name: "Unit 2: Motivation Theories",
        keyThemes: ["Maslow hierarchy", "Herzberg two-factor", "expectancy theory", "equity theory", "goal-setting theory", "self-determination theory"],
        openStaxUrl: "https://openstax.org/books/organizational-behavior/pages/7-introduction",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/theories-of-personality",
      },
      DSST_OB_3_GROUP_DYNAMICS: {
        name: "Unit 3: Group Dynamics and Teams",
        keyThemes: ["group development stages", "groupthink", "social loafing", "team roles", "norms", "cohesion"],
        openStaxUrl: "https://openstax.org/books/organizational-behavior/pages/9-introduction",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/social-psychology",
      },
      DSST_OB_4_LEADERSHIP_POWER: {
        name: "Unit 4: Leadership and Power",
        keyThemes: ["trait theories", "behavioral theories", "transformational leadership", "sources of power", "politics", "ethical leadership"],
        openStaxUrl: "https://openstax.org/books/organizational-behavior/pages/13-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/entrepreneurship2",
      },
      DSST_OB_5_ORGANIZATIONAL_CHANGE: {
        name: "Unit 5: Organizational Structure and Change",
        keyThemes: ["organizational design", "culture", "change management", "Lewin model", "resistance to change", "organizational development"],
        openStaxUrl: "https://openstax.org/books/organizational-behavior/pages/15-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/entrepreneurship2",
      },
    },
    suggestedTutorQuestions: [
      "What is the difference between Maslow's and Herzberg's theories?",
      "What are the five stages of group development?",
      "How does transformational leadership differ from transactional?",
      "What causes groupthink and how can it be prevented?",
      "What is Lewin's three-step change model?",
      "What are the Big Five personality traits?",
    ],
    curriculumContext: `DSST Organizational Behavior covers how individuals and groups behave within organizations.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: individual behavior (20%), motivation (25%), group dynamics (20%), leadership (20%), org structure/change (15%).`,
    tutorResources: `
- OpenStax Organizational Behavior (openstax.org/books/organizational-behavior): Free, CC-licensed textbook — matches DSST content
- Saylor Academy BUS208 (learn.saylor.org/course/BUS208): Free Organizational Behavior course
- CrashCourse Business (youtube.com/@crashcourse): Accessible video series`,
    examAlignmentNotes: `DSST Organizational Behavior alignment:
- Individual behavior and perception: 20%
- Motivation theories: 25%
- Group dynamics and teams: 20%
- Leadership and power: 20%
- Organizational structure and change: 15%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include a brief workplace scenario as stimulus where relevant; null for theory recall questions",
    stimulusDescription: "organizational scenario or workplace behavior case (null for theory identification)",
    explanationGuidance: "naming the specific OB theory or model, then explaining how it applies to the scenario with concrete workplace examples",
    difficultyRubric: {
      EASY: "Name the theory from its description or identify a motivational factor. 65%+ correct.",
      MEDIUM: "Apply a theory to a workplace scenario or determine which leadership style fits a situation. 40–55% correct.",
      HARD: "Evaluate competing OB theories for a complex scenario or predict organizational outcomes from multiple interacting factors. 25–40% correct.",
    },
    distractorTaxonomy: "(1) THEORY MIX-UP — confuses Maslow's esteem needs with Herzberg's motivators; (2) LEADERSHIP CONFUSION — confuses transformational with servant leadership; (3) GROUP STAGE TRAP — applies norming behaviors to a storming-stage team.",
    stimulusQualityGuidance: "GOOD: A workplace scenario describing specific employee behaviors and asking which OB theory best explains them. AVOID: Abstract theory questions with no applied context.",
    skillCodes: ["Individual Behavior", "Motivation Analysis", "Group Dynamics", "Leadership Theory"],
    topicWeights: {
      "DSST_OB_1_INDIVIDUAL_BEHAVIOR": 0.20,
      "DSST_OB_2_MOTIVATION_THEORIES": 0.25,
      "DSST_OB_3_GROUP_DYNAMICS": 0.20,
      "DSST_OB_4_LEADERSHIP_POWER": 0.20,
      "DSST_OB_5_ORGANIZATIONAL_CHANGE": 0.15,
    },
    recommendedTextbooks: [
      "OpenStax Organizational Behavior (free: openstax.org/books/organizational-behavior)",
      "Robbins & Judge, Organizational Behavior (Pearson)",
      "McShane & Von Glinow, Organizational Behavior (McGraw-Hill)",
    ],
  },

  // ── DSST Personal Finance ───────────────────────────────────────────────
  DSST_PERSONAL_FINANCE: {
    name: "DSST Personal Finance",
    shortName: "DSST Personal Finance",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_PF_1_FINANCIAL_PLANNING: {
        name: "Unit 1: Financial Planning and Budgeting",
        keyThemes: ["budgeting methods", "financial goals", "net worth", "time value of money", "opportunity cost", "financial statements"],
        openStaxUrl: "https://openstax.org/books/principles-finance/pages/1-why-finance",
        khanUrl: "https://www.khanacademy.org/college-careers-more/personal-finance",
      },
      DSST_PF_2_CREDIT_DEBT: {
        name: "Unit 2: Credit and Debt Management",
        keyThemes: ["credit scores", "credit reports", "types of credit", "interest rates", "debt reduction strategies", "bankruptcy"],
        openStaxUrl: "https://openstax.org/books/principles-finance/pages/2-why-finance",
        khanUrl: "https://www.khanacademy.org/college-careers-more/personal-finance/pf-saving-and-budgeting",
      },
      DSST_PF_3_INVESTING: {
        name: "Unit 3: Investing Fundamentals",
        keyThemes: ["stocks", "bonds", "mutual funds", "diversification", "risk vs return", "compound interest", "401(k) and IRA"],
        openStaxUrl: "https://openstax.org/books/principles-finance/pages/15-stocks-and-stock-valuation",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/core-finance/stock-and-bonds",
      },
      DSST_PF_4_INSURANCE_RISK: {
        name: "Unit 4: Insurance and Risk Management",
        keyThemes: ["health insurance", "auto insurance", "homeowners insurance", "life insurance", "deductibles", "risk assessment"],
        openStaxUrl: "https://openstax.org/books/principles-finance/pages/1-why-finance",
        khanUrl: "https://www.khanacademy.org/college-careers-more/personal-finance/pf-insurance",
      },
      DSST_PF_5_RETIREMENT_ESTATE: {
        name: "Unit 5: Retirement and Estate Planning",
        keyThemes: ["Social Security", "pension plans", "401(k) matching", "Roth IRA", "estate planning basics", "wills and trusts"],
        openStaxUrl: "https://openstax.org/books/principles-finance/pages/1-why-finance",
        khanUrl: "https://www.khanacademy.org/college-careers-more/personal-finance/pf-retirement",
      },
    },
    suggestedTutorQuestions: [
      "What is the difference between a Roth IRA and a traditional IRA?",
      "How is a credit score calculated?",
      "What is compound interest and why does it matter?",
      "How should I build an emergency fund?",
      "What is diversification in investing?",
      "What types of insurance do I need?",
    ],
    curriculumContext: `DSST Personal Finance covers the fundamentals of managing personal finances across the lifespan.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: financial planning (20%), credit/debt (20%), investing (25%), insurance (15%), retirement/estate (20%).`,
    tutorResources: `
- Khan Academy Personal Finance (khanacademy.org/college-careers-more/personal-finance): Free comprehensive video course
- OpenStax Principles of Finance (openstax.org/books/principles-finance): Free textbook on finance fundamentals
- Investopedia (investopedia.com): Free articles and tutorials on all personal finance topics`,
    examAlignmentNotes: `DSST Personal Finance alignment:
- Financial planning and budgeting: 20%
- Credit and debt management: 20%
- Investing fundamentals: 25%
- Insurance and risk management: 15%
- Retirement and estate planning: 20%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include a personal finance scenario or calculation as stimulus where relevant; null for definition questions",
    stimulusDescription: "personal finance scenario with dollar amounts or financial situation (null for concept recall)",
    explanationGuidance: "showing the financial calculation step-by-step or explaining the financial principle with a concrete dollar-amount example",
    difficultyRubric: {
      EASY: "Define a financial term or identify the correct type of account for a given goal. 65%+ correct.",
      MEDIUM: "Calculate simple interest, compare two investment options, or determine the best debt payoff strategy. 40–55% correct.",
      HARD: "Analyze a complex financial scenario with multiple factors (tax implications, opportunity cost, risk trade-offs). 25–40% correct.",
    },
    distractorTaxonomy: "(1) TAX CONFUSION — confuses pre-tax and post-tax account benefits; (2) INTEREST TRAP — mistakes simple for compound interest calculation; (3) INSURANCE GAP — confuses deductible with premium or copay.",
    stimulusQualityGuidance: "GOOD: A scenario with specific dollar amounts, ages, and financial goals. AVOID: Abstract 'someone wants to save money' without concrete numbers.",
    skillCodes: ["Financial Planning", "Credit Management", "Investment Analysis", "Risk Assessment"],
    topicWeights: {
      "DSST_PF_1_FINANCIAL_PLANNING": 0.20,
      "DSST_PF_2_CREDIT_DEBT": 0.20,
      "DSST_PF_3_INVESTING": 0.25,
      "DSST_PF_4_INSURANCE_RISK": 0.15,
      "DSST_PF_5_RETIREMENT_ESTATE": 0.20,
    },
    recommendedTextbooks: [
      "OpenStax Principles of Finance (free: openstax.org/books/principles-finance)",
      "Garman & Forgue, Personal Finance (Cengage)",
      "Kapoor et al., Personal Finance (McGraw-Hill)",
    ],
  },

  // ── DSST Lifespan Developmental Psychology ──────────────────────────────
  DSST_LIFESPAN_DEV_PSYCHOLOGY: {
    name: "DSST Lifespan Developmental Psychology",
    shortName: "DSST Lifespan Psych",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_LDP_1_PRENATAL_INFANCY: {
        name: "Unit 1: Prenatal Development and Infancy",
        keyThemes: ["nature vs nurture", "prenatal stages", "teratogens", "reflexes", "attachment theory", "sensorimotor stage"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/9-1-what-is-lifespan-development",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/human-development",
      },
      DSST_LDP_2_CHILDHOOD: {
        name: "Unit 2: Early and Middle Childhood",
        keyThemes: ["Piaget stages", "Vygotsky zone of proximal development", "language development", "moral development", "play", "parenting styles"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/9-2-lifespan-theories",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/cognition",
      },
      DSST_LDP_3_ADOLESCENCE: {
        name: "Unit 3: Adolescence",
        keyThemes: ["puberty", "identity formation", "Erikson identity vs role confusion", "peer influence", "formal operational thought", "risk-taking behavior"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/9-3-stages-of-development",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/theories-of-personality",
      },
      DSST_LDP_4_ADULTHOOD: {
        name: "Unit 4: Early and Middle Adulthood",
        keyThemes: ["intimacy vs isolation", "generativity vs stagnation", "career development", "cognitive changes", "midlife transition", "relationships"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/9-4-death-and-dying",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/human-development",
      },
      DSST_LDP_5_AGING_DEATH: {
        name: "Unit 5: Late Adulthood, Aging, and Death",
        keyThemes: ["integrity vs despair", "cognitive decline", "dementia", "Kubler-Ross stages of grief", "end-of-life care", "successful aging"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/9-4-death-and-dying",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/human-development",
      },
    },
    suggestedTutorQuestions: [
      "What are Piaget's four stages of cognitive development?",
      "How does Erikson's identity crisis work in adolescence?",
      "What is attachment theory and why does it matter?",
      "What are common teratogens during prenatal development?",
      "What is the difference between fluid and crystallized intelligence?",
      "What are the Kubler-Ross stages of grief?",
    ],
    curriculumContext: `DSST Lifespan Developmental Psychology covers human development from conception through death.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: prenatal/infancy (20%), childhood (25%), adolescence (20%), adulthood (20%), aging/death (15%).`,
    tutorResources: `
- OpenStax Psychology 2e Ch. 9 (openstax.org/books/psychology-2e/pages/9-introduction): Free developmental psychology chapter
- Saylor Academy PSYCH302 (learn.saylor.org/course/PSYCH302): Free Lifespan Development course
- Khan Academy MCAT Behavior (khanacademy.org): Development topics overlap`,
    examAlignmentNotes: `DSST Lifespan Developmental Psychology alignment:
- Prenatal development and infancy: 20%
- Early and middle childhood: 25%
- Adolescence: 20%
- Early and middle adulthood: 20%
- Late adulthood, aging, and death: 15%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include a developmental scenario or case study as stimulus where relevant; null for theory recall questions",
    stimulusDescription: "developmental case study or age-specific behavior description (null for theory identification)",
    explanationGuidance: "naming the specific developmental theory, stage, or theorist, then connecting it to the observable behavior described in the question",
    difficultyRubric: {
      EASY: "Identify a developmental stage from its description or name the theorist associated with a concept. 65%+ correct.",
      MEDIUM: "Apply a developmental theory to a scenario or determine which stage a described behavior represents. 40–55% correct.",
      HARD: "Compare competing theories for the same developmental phenomenon or analyze a complex case spanning multiple developmental domains. 25–40% correct.",
    },
    distractorTaxonomy: "(1) STAGE MIX-UP — assigns a behavior to the wrong Piaget or Erikson stage; (2) THEORIST CONFUSION — attributes Vygotsky's concepts to Piaget or vice versa; (3) AGE NORM TRAP — expects a milestone at the wrong age.",
    stimulusQualityGuidance: "GOOD: A case describing a child or adult at a specific age exhibiting particular behaviors. AVOID: Abstract 'what happens during adolescence' without a specific case.",
    skillCodes: ["Developmental Theory", "Stage Identification", "Case Analysis", "Lifespan Integration"],
    topicWeights: {
      "DSST_LDP_1_PRENATAL_INFANCY": 0.20,
      "DSST_LDP_2_CHILDHOOD": 0.25,
      "DSST_LDP_3_ADOLESCENCE": 0.20,
      "DSST_LDP_4_ADULTHOOD": 0.20,
      "DSST_LDP_5_AGING_DEATH": 0.15,
    },
    recommendedTextbooks: [
      "OpenStax Psychology 2e (free: openstax.org/books/psychology-2e)",
      "Santrock, Life-Span Development (McGraw-Hill)",
      "Feldman, Development Across the Life Span (Pearson)",
    ],
  },

  // ── DSST Introduction to Business ──────────────────────────────────────
  DSST_INTRO_TO_BUSINESS: {
    name: "DSST Introduction to Business",
    shortName: "DSST Intro Business",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_BUS_1_ECONOMIC_FOUNDATIONS: {
        name: "Unit 1: Economic Foundations",
        keyThemes: ["economic systems", "supply and demand", "market structures", "GDP", "inflation", "business cycles"],
        openStaxUrl: "https://openstax.org/books/introduction-business/pages/1-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/microeconomics",
      },
      DSST_BUS_2_BUSINESS_OWNERSHIP: {
        name: "Unit 2: Business Ownership and Entrepreneurship",
        keyThemes: ["sole proprietorship", "partnerships", "corporations", "LLCs", "franchising", "entrepreneurship"],
        openStaxUrl: "https://openstax.org/books/introduction-business/pages/4-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/entrepreneurship2",
      },
      DSST_BUS_3_MANAGEMENT_LEADERSHIP: {
        name: "Unit 3: Management and Leadership",
        keyThemes: ["management functions", "organizational structure", "leadership styles", "motivation theories", "decision-making", "strategic planning"],
        openStaxUrl: "https://openstax.org/books/introduction-business/pages/6-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/entrepreneurship2",
      },
      DSST_BUS_4_MARKETING_FUNDAMENTALS: {
        name: "Unit 4: Marketing Fundamentals",
        keyThemes: ["marketing mix (4Ps)", "market segmentation", "consumer behavior", "branding", "advertising", "digital marketing"],
        openStaxUrl: "https://openstax.org/books/introduction-business/pages/11-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/entrepreneurship2",
      },
      DSST_BUS_5_FINANCE_ACCOUNTING: {
        name: "Unit 5: Finance and Accounting",
        keyThemes: ["financial statements", "balance sheet", "income statement", "cash flow", "budgeting", "financial ratios"],
        openStaxUrl: "https://openstax.org/books/introduction-business/pages/14-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/core-finance",
      },
    },
    suggestedTutorQuestions: [
      "What are the main differences between sole proprietorships, partnerships, and corporations?",
      "How do supply and demand determine market prices?",
      "What are the four Ps of the marketing mix?",
      "What is the difference between a balance sheet and an income statement?",
      "How do leadership styles affect organizational performance?",
      "What are the stages of the business cycle?",
    ],
    curriculumContext: `DSST Introduction to Business covers foundational concepts in business operations, management, marketing, and finance.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: economic foundations (20%), business ownership (20%), management/leadership (20%), marketing (20%), finance/accounting (20%).`,
    tutorResources: `
- OpenStax Introduction to Business (openstax.org/books/introduction-business): Free, CC-licensed textbook
- Saylor Academy BUS100 (learn.saylor.org/course/BUS100): Free Introduction to Business course
- Khan Academy Microeconomics & Finance (khanacademy.org): Economics and finance fundamentals`,
    examAlignmentNotes: `DSST Introduction to Business alignment:
- Economic foundations: 20%
- Business ownership and entrepreneurship: 20%
- Management and leadership: 20%
- Marketing fundamentals: 20%
- Finance and accounting: 20%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include a brief business scenario as stimulus where relevant; null for concept-definition questions",
    stimulusDescription: "business scenario or market situation (null for concept recall)",
    explanationGuidance: "referencing the specific business concept or theory and explaining how it applies to real-world business operations",
    difficultyRubric: {
      EASY: "Define a business term or identify a type of business ownership from its description. 65%+ correct.",
      MEDIUM: "Apply a marketing or management concept to a business scenario or analyze a simple financial statement. 40–55% correct.",
      HARD: "Evaluate a multi-factor business decision involving trade-offs between competing strategies or financial considerations. 25–40% correct.",
    },
    distractorTaxonomy: "(1) OWNERSHIP CONFUSION — mixes up liability protections across business structures; (2) MARKETING MIX TRAP — assigns the wrong P to a marketing activity; (3) FINANCIAL STATEMENT SWAP — places items on the wrong financial statement.",
    stimulusQualityGuidance: "GOOD: A 3-sentence business scenario describing a specific situation requiring a decision. AVOID: Abstract definitions without applied context.",
    skillCodes: ["Economic Analysis", "Business Operations", "Marketing Application", "Financial Literacy"],
    topicWeights: {
      "DSST_BUS_1_ECONOMIC_FOUNDATIONS": 0.20,
      "DSST_BUS_2_BUSINESS_OWNERSHIP": 0.20,
      "DSST_BUS_3_MANAGEMENT_LEADERSHIP": 0.20,
      "DSST_BUS_4_MARKETING_FUNDAMENTALS": 0.20,
      "DSST_BUS_5_FINANCE_ACCOUNTING": 0.20,
    },
    recommendedTextbooks: [
      "OpenStax Introduction to Business (free: openstax.org/books/introduction-business)",
      "Nickels, McHugh & McHugh, Understanding Business (McGraw-Hill)",
      "Ebert & Griffin, Business Essentials (Pearson)",
    ],
  },

  // ── DSST Human Development ──────────────────────────────────────────────
  DSST_HUMAN_DEVELOPMENT: {
    name: "DSST Human Development",
    shortName: "DSST Human Dev",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_HD_1_THEORIES_RESEARCH: {
        name: "Unit 1: Theories and Research Methods",
        keyThemes: ["developmental theories", "nature vs nurture", "research methods", "cross-sectional vs longitudinal", "ethical research", "scientific method"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/9-1-what-is-lifespan-development",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/human-development",
      },
      DSST_HD_2_PRENATAL_INFANCY: {
        name: "Unit 2: Prenatal Development and Infancy",
        keyThemes: ["prenatal stages", "teratogens", "neonatal development", "attachment theory", "sensorimotor stage", "temperament"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/9-2-lifespan-theories",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/human-development",
      },
      DSST_HD_3_CHILDHOOD: {
        name: "Unit 3: Childhood Development",
        keyThemes: ["cognitive development", "language acquisition", "social development", "moral reasoning", "parenting styles", "play and learning"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/9-3-stages-of-development",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/cognition",
      },
      DSST_HD_4_ADOLESCENCE_ADULTHOOD: {
        name: "Unit 4: Adolescence and Adulthood",
        keyThemes: ["identity formation", "puberty", "Erikson psychosocial stages", "career development", "intimate relationships", "midlife transition"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/9-3-stages-of-development",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/theories-of-personality",
      },
      DSST_HD_5_AGING_DEATH: {
        name: "Unit 5: Aging, Death, and Dying",
        keyThemes: ["physical aging", "cognitive decline", "wisdom", "retirement", "Kubler-Ross stages", "end-of-life issues"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/9-4-death-and-dying",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/human-development",
      },
    },
    suggestedTutorQuestions: [
      "What are the major theories of human development?",
      "How do teratogens affect prenatal development?",
      "What are Piaget's stages of cognitive development?",
      "How does Erikson explain identity formation in adolescence?",
      "What is the difference between cross-sectional and longitudinal studies?",
      "What are the Kubler-Ross stages of grief?",
    ],
    curriculumContext: `DSST Human Development covers the biological, cognitive, and psychosocial development across the lifespan.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: theories/research (20%), prenatal/infancy (20%), childhood (20%), adolescence/adulthood (20%), aging/death (20%).`,
    tutorResources: `
- OpenStax Psychology 2e Ch. 9 (openstax.org/books/psychology-2e/pages/9-introduction): Free developmental psychology chapter
- Saylor Academy PSYCH302 (learn.saylor.org/course/PSYCH302): Free Lifespan Development course
- Khan Academy MCAT Behavior (khanacademy.org): Development and cognition topics`,
    examAlignmentNotes: `DSST Human Development alignment:
- Theories and research methods: 20%
- Prenatal development and infancy: 20%
- Childhood development: 20%
- Adolescence and adulthood: 20%
- Aging, death, and dying: 20%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include a developmental case study or scenario as stimulus where relevant; null for theory recall questions",
    stimulusDescription: "developmental case study or age-specific behavior vignette (null for theory identification)",
    explanationGuidance: "naming the specific developmental theory, stage, or theorist, and explaining how it connects to the observed behavior or milestone",
    difficultyRubric: {
      EASY: "Identify a developmental stage or name a theorist from a description. 65%+ correct.",
      MEDIUM: "Apply a developmental theory to a case scenario or determine which stage a behavior represents. 40–55% correct.",
      HARD: "Compare competing developmental theories or analyze a case spanning multiple developmental domains. 25–40% correct.",
    },
    distractorTaxonomy: "(1) STAGE MIX-UP — assigns behavior to the wrong developmental stage; (2) THEORIST SWAP — attributes one theorist's concept to another; (3) AGE NORM ERROR — expects a milestone at the wrong developmental period.",
    stimulusQualityGuidance: "GOOD: A case describing a person at a specific age exhibiting particular behaviors. AVOID: Abstract theory questions without a real-world connection.",
    skillCodes: ["Developmental Theory", "Stage Identification", "Research Methods", "Lifespan Analysis"],
    topicWeights: {
      "DSST_HD_1_THEORIES_RESEARCH": 0.20,
      "DSST_HD_2_PRENATAL_INFANCY": 0.20,
      "DSST_HD_3_CHILDHOOD": 0.20,
      "DSST_HD_4_ADOLESCENCE_ADULTHOOD": 0.20,
      "DSST_HD_5_AGING_DEATH": 0.20,
    },
    recommendedTextbooks: [
      "OpenStax Psychology 2e (free: openstax.org/books/psychology-2e)",
      "Santrock, Life-Span Development (McGraw-Hill)",
      "Berger, The Developing Person Through the Life Span (Worth)",
    ],
  },

  // ── DSST Ethics in America ──────────────────────────────────────────────
  DSST_ETHICS_IN_AMERICA: {
    name: "DSST Ethics in America",
    shortName: "DSST Ethics",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_EIA_1_ETHICAL_TRADITIONS: {
        name: "Unit 1: Ethical Traditions and Theories",
        keyThemes: ["utilitarianism", "deontology", "virtue ethics", "social contract theory", "natural law", "moral relativism"],
        openStaxUrl: "https://openstax.org/books/introduction-philosophy/pages/8-introduction",
        khanUrl: "https://www.khanacademy.org/partner-content/wi-phi/wiphi-value-theory",
      },
      DSST_EIA_2_CIVIL_LIBERTIES: {
        name: "Unit 2: Civil Liberties and Rights",
        keyThemes: ["freedom of speech", "due process", "equal protection", "privacy rights", "religious freedom", "civil disobedience"],
        openStaxUrl: "https://openstax.org/books/american-government-3e/pages/4-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/us-government-and-civics/us-gov-civil-liberties-and-civil-rights",
      },
      DSST_EIA_3_SOCIAL_JUSTICE: {
        name: "Unit 3: Social Justice and Equality",
        keyThemes: ["distributive justice", "Rawls theory of justice", "affirmative action", "economic inequality", "human rights", "discrimination"],
        openStaxUrl: "https://openstax.org/books/introduction-philosophy/pages/8-3-distributive-justice",
        khanUrl: "https://www.khanacademy.org/partner-content/wi-phi/wiphi-value-theory",
      },
      DSST_EIA_4_BIOETHICS: {
        name: "Unit 4: Bioethics and Medical Ethics",
        keyThemes: ["informed consent", "euthanasia", "genetic engineering", "organ donation", "reproductive ethics", "patient autonomy"],
        openStaxUrl: "https://openstax.org/books/introduction-philosophy/pages/8-4-applied-ethics",
        khanUrl: "https://www.khanacademy.org/partner-content/wi-phi/wiphi-value-theory",
      },
      DSST_EIA_5_BUSINESS_GOV_ETHICS: {
        name: "Unit 5: Business and Government Ethics",
        keyThemes: ["corporate responsibility", "whistleblowing", "environmental ethics", "political corruption", "lobbying", "ethical leadership"],
        openStaxUrl: "https://openstax.org/books/business-ethics/pages/1-introduction",
        khanUrl: "https://www.khanacademy.org/partner-content/wi-phi/wiphi-value-theory",
      },
    },
    suggestedTutorQuestions: [
      "What is the difference between utilitarianism and deontology?",
      "How does Rawls' veil of ignorance work?",
      "What ethical arguments exist for and against euthanasia?",
      "When is civil disobedience morally justified?",
      "What are the main arguments for and against affirmative action?",
      "How do businesses balance profit with corporate social responsibility?",
    ],
    curriculumContext: `DSST Ethics in America covers major ethical theories and their application to contemporary moral issues in American society.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: ethical traditions (20%), civil liberties (20%), social justice (20%), bioethics (20%), business/government ethics (20%).`,
    tutorResources: `
- Yale Open Courses: Moral Philosophy (oyc.yale.edu): Free lectures on ethical theory
- Stanford Encyclopedia of Philosophy (plato.stanford.edu): Authoritative ethics articles
- MIT OCW Ethics (ocw.mit.edu): Free ethics course materials`,
    examAlignmentNotes: `DSST Ethics in America alignment:
- Ethical traditions and theories: 20%
- Civil liberties and rights: 20%
- Social justice and equality: 20%
- Bioethics and medical ethics: 20%
- Business and government ethics: 20%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include an ethical dilemma or scenario as stimulus where relevant; null for theory identification questions",
    stimulusDescription: "ethical dilemma or real-world moral scenario (null for theory recall)",
    explanationGuidance: "identifying the relevant ethical theory or principle, explaining how it applies to the dilemma, and noting why competing perspectives fall short",
    difficultyRubric: {
      EASY: "Identify an ethical theory from its description or match a philosopher to their key concept. 65%+ correct.",
      MEDIUM: "Apply an ethical framework to a specific moral dilemma or compare two ethical positions. 40–55% correct.",
      HARD: "Analyze a complex ethical scenario requiring integration of multiple frameworks and consideration of competing moral claims. 25–40% correct.",
    },
    distractorTaxonomy: "(1) THEORY SWAP — attributes a utilitarian argument to deontology or vice versa; (2) RIGHTS CONFUSION — conflates civil liberties with civil rights; (3) ABSOLUTISM TRAP — treats a context-dependent ethical issue as having a single correct universal answer.",
    stimulusQualityGuidance: "GOOD: A specific ethical dilemma with competing moral claims and stakeholders. AVOID: Abstract philosophy questions without practical application.",
    skillCodes: ["Ethical Reasoning", "Theory Application", "Moral Analysis", "Critical Evaluation"],
    topicWeights: {
      "DSST_EIA_1_ETHICAL_TRADITIONS": 0.20,
      "DSST_EIA_2_CIVIL_LIBERTIES": 0.20,
      "DSST_EIA_3_SOCIAL_JUSTICE": 0.20,
      "DSST_EIA_4_BIOETHICS": 0.20,
      "DSST_EIA_5_BUSINESS_GOV_ETHICS": 0.20,
    },
    recommendedTextbooks: [
      "Rachels & Rachels, The Elements of Moral Philosophy (McGraw-Hill)",
      "Sandel, Justice: What's the Right Thing to Do? (Farrar, Straus and Giroux)",
      "Mappes & DeGrazia, Biomedical Ethics (McGraw-Hill)",
    ],
  },

  // ── DSST Environmental Science ──────────────────────────────────────────
  DSST_ENVIRONMENTAL_SCIENCE: {
    name: "DSST Environmental Science",
    shortName: "DSST Env Science",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_ENV_1_ECOSYSTEMS: {
        name: "Unit 1: Ecosystems and Biodiversity",
        keyThemes: ["ecosystem structure", "food webs", "energy flow", "biogeochemical cycles", "biodiversity", "biomes"],
        openStaxUrl: "https://openstax.org/books/biology-2e/pages/44-1-ecology-of-ecosystems",
        khanUrl: "https://www.khanacademy.org/science/biology/ecology",
      },
      DSST_ENV_2_POPULATION_RESOURCES: {
        name: "Unit 2: Population and Natural Resources",
        keyThemes: ["population growth", "carrying capacity", "demographic transition", "water resources", "soil conservation", "deforestation"],
        openStaxUrl: "https://openstax.org/books/biology-2e/pages/45-1-population-demography",
        khanUrl: "https://www.khanacademy.org/science/biology/ecology",
      },
      DSST_ENV_3_POLLUTION_WASTE: {
        name: "Unit 3: Pollution and Waste Management",
        keyThemes: ["air pollution", "water pollution", "solid waste", "hazardous waste", "ozone depletion", "acid rain"],
        openStaxUrl: "https://openstax.org/books/biology-2e/pages/44-5-threats-to-biodiversity",
        khanUrl: "https://www.khanacademy.org/science/biology/ecology",
      },
      DSST_ENV_4_ENERGY: {
        name: "Unit 4: Energy Sources and Consumption",
        keyThemes: ["fossil fuels", "nuclear energy", "solar energy", "wind power", "hydroelectric", "energy conservation"],
        openStaxUrl: "https://openstax.org/books/biology-2e/pages/44-1-ecology-of-ecosystems",
        khanUrl: "https://www.khanacademy.org/science/biology/ecology",
      },
      DSST_ENV_5_POLICY_SUSTAINABILITY: {
        name: "Unit 5: Environmental Policy and Sustainability",
        keyThemes: ["Clean Air Act", "Clean Water Act", "EPA", "climate change policy", "sustainable development", "international agreements"],
        openStaxUrl: "https://openstax.org/books/biology-2e/pages/44-5-threats-to-biodiversity",
        khanUrl: "https://www.khanacademy.org/science/biology/ecology",
      },
    },
    suggestedTutorQuestions: [
      "How does energy flow through an ecosystem?",
      "What is the difference between renewable and nonrenewable resources?",
      "What causes ozone depletion and how is it different from climate change?",
      "How does the demographic transition model work?",
      "What are the main provisions of the Clean Air Act?",
      "How do biogeochemical cycles maintain ecosystem balance?",
    ],
    curriculumContext: `DSST Environmental Science covers ecosystems, natural resources, pollution, energy, and environmental policy.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: ecosystems/biodiversity (20%), population/resources (20%), pollution/waste (20%), energy (20%), policy/sustainability (20%).`,
    tutorResources: `
- EPA.gov (epa.gov): Authoritative U.S. environmental data and policy resources
- OpenStax Biology 2e Ecology chapters (openstax.org/books/biology-2e): Free ecology content
- Khan Academy Ecology (khanacademy.org/science/biology/ecology): Ecosystem and population ecology`,
    examAlignmentNotes: `DSST Environmental Science alignment:
- Ecosystems and biodiversity: 20%
- Population and natural resources: 20%
- Pollution and waste management: 20%
- Energy sources and consumption: 20%
- Environmental policy and sustainability: 20%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include an environmental scenario or data description as stimulus where relevant; null for concept recall questions",
    stimulusDescription: "environmental scenario, data table, or ecosystem description (null for definition questions)",
    explanationGuidance: "referencing the specific environmental science principle, identifying the ecological mechanism, and connecting it to real-world environmental outcomes",
    difficultyRubric: {
      EASY: "Identify an ecosystem component or define an environmental term. 65%+ correct.",
      MEDIUM: "Apply an ecological principle to a scenario or analyze the impact of a pollutant on an ecosystem. 40–55% correct.",
      HARD: "Evaluate trade-offs in environmental policy or analyze multi-factor ecological interactions. 25–40% correct.",
    },
    distractorTaxonomy: "(1) CYCLE CONFUSION — mixes up steps in different biogeochemical cycles; (2) POLICY SWAP — confuses Clean Air Act provisions with Clean Water Act; (3) ENERGY TRAP — conflates renewable energy advantages with wrong energy source.",
    stimulusQualityGuidance: "GOOD: A specific environmental scenario with measurable impacts or a policy decision with trade-offs. AVOID: Vague 'pollution is bad' statements without specifics.",
    skillCodes: ["Ecosystem Analysis", "Resource Management", "Pollution Assessment", "Policy Evaluation"],
    topicWeights: {
      "DSST_ENV_1_ECOSYSTEMS": 0.20,
      "DSST_ENV_2_POPULATION_RESOURCES": 0.20,
      "DSST_ENV_3_POLLUTION_WASTE": 0.20,
      "DSST_ENV_4_ENERGY": 0.20,
      "DSST_ENV_5_POLICY_SUSTAINABILITY": 0.20,
    },
    recommendedTextbooks: [
      "Withgott & Laposata, Environment: The Science Behind the Stories (Pearson)",
      "Miller & Spoolman, Living in the Environment (Cengage)",
      "OpenStax Biology 2e Ecology chapters (free: openstax.org/books/biology-2e)",
    ],
  },

  // ── DSST Technical Writing ──────────────────────────────────────────────
  DSST_TECHNICAL_WRITING: {
    name: "DSST Technical Writing",
    shortName: "DSST Tech Writing",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_TW_1_PURPOSE_AUDIENCE: {
        name: "Unit 1: Purpose and Audience Analysis",
        keyThemes: ["audience analysis", "purpose identification", "tone and style", "reader expectations", "context of use", "user personas"],
        openStaxUrl: "https://openstax.org/books/writing-guide/pages/1-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/grammar",
      },
      DSST_TW_2_DOCUMENT_DESIGN: {
        name: "Unit 2: Document Design and Organization",
        keyThemes: ["document structure", "headings and subheadings", "visual design", "page layout", "lists and tables", "white space"],
        openStaxUrl: "https://openstax.org/books/writing-guide/pages/4-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/grammar",
      },
      DSST_TW_3_RESEARCH_DOCUMENTATION: {
        name: "Unit 3: Research and Documentation",
        keyThemes: ["source evaluation", "citation styles", "APA format", "MLA format", "plagiarism", "primary vs secondary sources"],
        openStaxUrl: "https://openstax.org/books/writing-guide/pages/13-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/grammar",
      },
      DSST_TW_4_REVISION_EDITING: {
        name: "Unit 4: Revision and Editing",
        keyThemes: ["clarity", "concision", "active voice", "grammar and mechanics", "proofreading", "peer review"],
        openStaxUrl: "https://openstax.org/books/writing-guide/pages/5-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/grammar",
      },
      DSST_TW_5_WORKPLACE_COMM: {
        name: "Unit 5: Workplace Communication",
        keyThemes: ["memos", "business reports", "proposals", "email etiquette", "presentations", "instructions and manuals"],
        openStaxUrl: "https://openstax.org/books/writing-guide/pages/1-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/grammar",
      },
    },
    suggestedTutorQuestions: [
      "How do you analyze an audience for a technical document?",
      "What are the key principles of document design?",
      "When should you use APA vs MLA citation format?",
      "How do you revise a paragraph for clarity and concision?",
      "What is the difference between a memo and a business report?",
      "How do you write effective instructions for a non-technical audience?",
    ],
    curriculumContext: `DSST Technical Writing covers principles of effective technical and professional communication.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: purpose/audience (20%), document design (20%), research/documentation (20%), revision/editing (20%), workplace communication (20%).`,
    tutorResources: `
- Purdue OWL (owl.purdue.edu): Comprehensive writing and citation guidance
- OpenStax Writing Guide (openstax.org/books/writing-guide): Free, CC-licensed writing textbook
- Open technical writing textbooks (various): Free technical communication resources`,
    examAlignmentNotes: `DSST Technical Writing alignment:
- Purpose and audience analysis: 20%
- Document design and organization: 20%
- Research and documentation: 20%
- Revision and editing: 20%
- Workplace communication: 20%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include a writing sample or document excerpt as stimulus where relevant; null for concept recall questions",
    stimulusDescription: "writing sample, document excerpt, or workplace communication scenario (null for definition questions)",
    explanationGuidance: "identifying the specific writing principle or convention, explaining why the correct approach improves communication effectiveness",
    difficultyRubric: {
      EASY: "Identify a document type or define a technical writing term. 65%+ correct.",
      MEDIUM: "Evaluate a writing sample for clarity or select the best revision of a passage. 40–55% correct.",
      HARD: "Analyze a complex document for multiple writing issues or determine the best approach for a multi-audience communication challenge. 25–40% correct.",
    },
    distractorTaxonomy: "(1) STYLE CONFUSION — uses overly formal or informal tone for the given audience; (2) CITATION TRAP — mixes up APA and MLA formatting rules; (3) STRUCTURE ERROR — misidentifies the appropriate document format for a workplace situation.",
    stimulusQualityGuidance: "GOOD: A specific writing sample with identifiable strengths or weaknesses. AVOID: Abstract questions about 'good writing' without concrete examples.",
    skillCodes: ["Audience Analysis", "Document Design", "Research Skills", "Editing and Revision"],
    topicWeights: {
      "DSST_TW_1_PURPOSE_AUDIENCE": 0.20,
      "DSST_TW_2_DOCUMENT_DESIGN": 0.20,
      "DSST_TW_3_RESEARCH_DOCUMENTATION": 0.20,
      "DSST_TW_4_REVISION_EDITING": 0.20,
      "DSST_TW_5_WORKPLACE_COMM": 0.20,
    },
    recommendedTextbooks: [
      "Markel & Selber, Technical Communication (Bedford/St. Martin's)",
      "Lannon & Gurak, Technical Communication (Pearson)",
      "OpenStax Writing Guide (free: openstax.org/books/writing-guide)",
    ],
  },

  // ── DSST Principles of Finance ──────────────────────────────────────────
  DSST_PRINCIPLES_OF_FINANCE: {
    name: "DSST Principles of Finance",
    shortName: "DSST Finance",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_FIN_1_FINANCIAL_STATEMENTS: {
        name: "Unit 1: Financial Statements and Analysis",
        keyThemes: ["balance sheet", "income statement", "cash flow statement", "financial ratios", "liquidity ratios", "profitability ratios"],
        openStaxUrl: "https://openstax.org/books/principles-finance/pages/3-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/core-finance/accounting-and-financial-stateme",
      },
      DSST_FIN_2_TIME_VALUE_MONEY: {
        name: "Unit 2: Time Value of Money",
        keyThemes: ["present value", "future value", "compounding", "discounting", "annuities", "perpetuities"],
        openStaxUrl: "https://openstax.org/books/principles-finance/pages/7-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/core-finance/interest-tutorial",
      },
      DSST_FIN_3_RISK_RETURN: {
        name: "Unit 3: Risk and Return",
        keyThemes: ["risk types", "diversification", "CAPM", "beta", "standard deviation", "risk-return tradeoff"],
        openStaxUrl: "https://openstax.org/books/principles-finance/pages/15-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/core-finance/stock-and-bonds",
      },
      DSST_FIN_4_CAPITAL_MARKETS: {
        name: "Unit 4: Capital Markets and Investments",
        keyThemes: ["stocks", "bonds", "mutual funds", "stock exchanges", "bond pricing", "yield to maturity"],
        openStaxUrl: "https://openstax.org/books/principles-finance/pages/10-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/core-finance/stock-and-bonds",
      },
      DSST_FIN_5_CORPORATE_FINANCE: {
        name: "Unit 5: Corporate Finance and Capital Budgeting",
        keyThemes: ["NPV", "IRR", "payback period", "cost of capital", "capital structure", "dividend policy"],
        openStaxUrl: "https://openstax.org/books/principles-finance/pages/16-introduction",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/core-finance",
      },
    },
    suggestedTutorQuestions: [
      "How do you calculate net present value (NPV)?",
      "What is the difference between stocks and bonds?",
      "How does diversification reduce portfolio risk?",
      "What do liquidity ratios tell us about a company?",
      "How does the Capital Asset Pricing Model (CAPM) work?",
      "What is the difference between NPV and IRR?",
    ],
    curriculumContext: `DSST Principles of Finance covers financial analysis, time value of money, risk/return, capital markets, and corporate finance.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: financial statements (20%), time value of money (20%), risk/return (20%), capital markets (20%), corporate finance (20%).`,
    tutorResources: `
- Khan Academy Finance & Capital Markets (khanacademy.org): Free finance tutorials
- OpenStax Principles of Finance (openstax.org/books/principles-finance): Free, CC-licensed textbook
- MIT OCW Introduction to Finance (ocw.mit.edu): Free finance lectures`,
    examAlignmentNotes: `DSST Principles of Finance alignment:
- Financial statements and analysis: 20%
- Time value of money: 20%
- Risk and return: 20%
- Capital markets and investments: 20%
- Corporate finance and capital budgeting: 20%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include financial data or a scenario as stimulus where relevant; null for concept-definition questions",
    stimulusDescription: "financial data, company scenario, or calculation setup (null for concept recall)",
    explanationGuidance: "showing the relevant formula or financial principle, walking through the calculation or reasoning, and explaining the financial implications",
    difficultyRubric: {
      EASY: "Define a financial term or identify a financial statement component. 65%+ correct.",
      MEDIUM: "Calculate a present/future value or analyze a financial ratio to assess company health. 40–55% correct.",
      HARD: "Evaluate a capital budgeting decision using NPV/IRR or analyze a complex risk-return scenario with multiple variables. 25–40% correct.",
    },
    distractorTaxonomy: "(1) FORMULA SWAP — uses the wrong TVM formula (e.g., PV instead of FV); (2) RATIO CONFUSION — calculates or interprets the wrong financial ratio; (3) RISK TRAP — confuses systematic and unsystematic risk.",
    stimulusQualityGuidance: "GOOD: A specific financial scenario with numbers to analyze or a capital budgeting decision with clear cash flows. AVOID: Abstract finance theory without quantitative context.",
    skillCodes: ["Financial Analysis", "TVM Calculations", "Risk Assessment", "Capital Budgeting"],
    topicWeights: {
      "DSST_FIN_1_FINANCIAL_STATEMENTS": 0.20,
      "DSST_FIN_2_TIME_VALUE_MONEY": 0.20,
      "DSST_FIN_3_RISK_RETURN": 0.20,
      "DSST_FIN_4_CAPITAL_MARKETS": 0.20,
      "DSST_FIN_5_CORPORATE_FINANCE": 0.20,
    },
    recommendedTextbooks: [
      "OpenStax Principles of Finance (free: openstax.org/books/principles-finance)",
      "Berk & DeMarzo, Corporate Finance (Pearson)",
      "Ross, Westerfield & Jordan, Fundamentals of Corporate Finance (McGraw-Hill)",
    ],
  },

  // ── DSST Management Information Systems ──────────────────────────────────
  DSST_MANAGEMENT_INFO_SYSTEMS: {
    name: "DSST Management Information Systems",
    shortName: "DSST MIS",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_MIS_1_IT_FUNDAMENTALS: {
        name: "Unit 1: IT Fundamentals and Infrastructure",
        keyThemes: ["hardware components", "software types", "operating systems", "cloud computing", "IT infrastructure", "virtualization"],
        openStaxUrl: "https://openstax.org/books/introduction-business/pages/13-introduction",
        khanUrl: "https://www.khanacademy.org/computing/computer-science",
      },
      DSST_MIS_2_DATABASES: {
        name: "Unit 2: Databases and Data Management",
        keyThemes: ["relational databases", "SQL basics", "data modeling", "normalization", "data warehousing", "big data"],
        openStaxUrl: "https://openstax.org/books/introduction-business/pages/13-introduction",
        khanUrl: "https://www.khanacademy.org/computing/computer-programming/sql",
      },
      DSST_MIS_3_NETWORKS_SECURITY: {
        name: "Unit 3: Networks and Cybersecurity",
        keyThemes: ["network topologies", "TCP/IP", "LAN/WAN", "firewalls", "encryption", "cybersecurity threats"],
        openStaxUrl: "https://openstax.org/books/introduction-business/pages/13-introduction",
        khanUrl: "https://www.khanacademy.org/computing/computer-science/internet-intro",
      },
      DSST_MIS_4_SYSTEMS_DEVELOPMENT: {
        name: "Unit 4: Systems Development and Project Management",
        keyThemes: ["SDLC phases", "Agile methodology", "Waterfall model", "requirements analysis", "testing", "project management"],
        openStaxUrl: "https://openstax.org/books/introduction-business/pages/13-introduction",
        khanUrl: "https://www.khanacademy.org/computing/computer-science",
      },
      DSST_MIS_5_BUSINESS_INTELLIGENCE: {
        name: "Unit 5: Business Intelligence and Decision Support",
        keyThemes: ["data analytics", "decision support systems", "ERP systems", "CRM", "supply chain management", "business intelligence tools"],
        openStaxUrl: "https://openstax.org/books/introduction-business/pages/13-introduction",
        khanUrl: "https://www.khanacademy.org/computing/computer-science",
      },
    },
    suggestedTutorQuestions: [
      "What are the phases of the Systems Development Life Cycle?",
      "How do relational databases organize data?",
      "What is the difference between LAN and WAN?",
      "How do ERP systems benefit organizations?",
      "What are common cybersecurity threats and defenses?",
      "How does Agile differ from Waterfall methodology?",
    ],
    curriculumContext: `DSST Management Information Systems covers IT infrastructure, databases, networking, systems development, and business intelligence.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: IT fundamentals (20%), databases (20%), networks/security (20%), systems development (20%), business intelligence (20%).`,
    tutorResources: `
- Open MIS textbooks (various): Free management information systems resources
- Harvard CS50 selected modules (cs50.harvard.edu): Free computing fundamentals
- Saylor Academy (learn.saylor.org): Free MIS and business technology courses`,
    examAlignmentNotes: `DSST Management Information Systems alignment:
- IT fundamentals and infrastructure: 20%
- Databases and data management: 20%
- Networks and cybersecurity: 20%
- Systems development and project management: 20%
- Business intelligence and decision support: 20%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include a business technology scenario as stimulus where relevant; null for concept-definition questions",
    stimulusDescription: "business technology scenario or system design situation (null for IT concept recall)",
    explanationGuidance: "identifying the specific IT concept or system, explaining how it functions in a business context, and noting why it solves the described problem",
    difficultyRubric: {
      EASY: "Define an IT term or identify a system type from its description. 65%+ correct.",
      MEDIUM: "Apply an MIS concept to a business scenario or select the best system solution for a given need. 40–55% correct.",
      HARD: "Evaluate a complex system integration decision or analyze trade-offs between competing technology solutions. 25–40% correct.",
    },
    distractorTaxonomy: "(1) SYSTEM TYPE CONFUSION — confuses ERP, CRM, and SCM systems; (2) SDLC PHASE SWAP — places activities in the wrong SDLC phase; (3) NETWORK TRAP — mixes up network topologies or protocols.",
    stimulusQualityGuidance: "GOOD: A specific business scenario describing a technology need or system problem. AVOID: Abstract IT vocabulary without practical context.",
    skillCodes: ["IT Infrastructure", "Database Management", "Network Security", "Systems Analysis"],
    topicWeights: {
      "DSST_MIS_1_IT_FUNDAMENTALS": 0.20,
      "DSST_MIS_2_DATABASES": 0.20,
      "DSST_MIS_3_NETWORKS_SECURITY": 0.20,
      "DSST_MIS_4_SYSTEMS_DEVELOPMENT": 0.20,
      "DSST_MIS_5_BUSINESS_INTELLIGENCE": 0.20,
    },
    recommendedTextbooks: [
      "Laudon & Laudon, Management Information Systems (Pearson)",
      "O'Brien & Marakas, Essentials of MIS (McGraw-Hill)",
      "Stair & Reynolds, Principles of Information Systems (Cengage)",
    ],
  },

  // ── DSST Money and Banking ──────────────────────────────────────────────
  DSST_MONEY_AND_BANKING: {
    name: "DSST Money and Banking",
    shortName: "DSST Money & Banking",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_MB_1_MONEY_FINANCIAL_SYSTEM: {
        name: "Unit 1: Money and the Financial System",
        keyThemes: ["functions of money", "money supply (M1/M2)", "financial intermediaries", "interest rates", "bond markets", "stock markets"],
        openStaxUrl: "https://openstax.org/books/principles-macroeconomics-3e/pages/27-introduction-to-money-and-banking",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/macroeconomics/monetary-system-topic",
      },
      DSST_MB_2_BANKING_INSTITUTIONS: {
        name: "Unit 2: Banking Institutions",
        keyThemes: ["commercial banks", "investment banks", "credit unions", "savings institutions", "deposit insurance (FDIC)", "bank regulation"],
        openStaxUrl: "https://openstax.org/books/principles-macroeconomics-3e/pages/27-1-defining-money-by-its-functions",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/macroeconomics/monetary-system-topic",
      },
      DSST_MB_3_FEDERAL_RESERVE: {
        name: "Unit 3: The Federal Reserve System",
        keyThemes: ["Fed structure", "Board of Governors", "FOMC", "reserve requirements", "discount rate", "bank supervision"],
        openStaxUrl: "https://openstax.org/books/principles-macroeconomics-3e/pages/28-introduction-to-monetary-policy-and-bank-regulation",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/macroeconomics/monetary-system-topic",
      },
      DSST_MB_4_MONETARY_POLICY: {
        name: "Unit 4: Monetary Policy",
        keyThemes: ["open market operations", "federal funds rate", "quantitative easing", "expansionary policy", "contractionary policy", "money multiplier"],
        openStaxUrl: "https://openstax.org/books/principles-macroeconomics-3e/pages/28-2-bank-regulation",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/macroeconomics/monetary-system-topic",
      },
      DSST_MB_5_INTERNATIONAL_FINANCE: {
        name: "Unit 5: International Finance",
        keyThemes: ["exchange rates", "balance of payments", "currency markets", "international monetary system", "trade deficits", "purchasing power parity"],
        openStaxUrl: "https://openstax.org/books/principles-macroeconomics-3e/pages/29-introduction-to-exchange-rates-and-international-capital-flows",
        khanUrl: "https://www.khanacademy.org/economics-finance-domain/macroeconomics/forex-trade-topic",
      },
    },
    suggestedTutorQuestions: [
      "What are the three functions of money?",
      "How does the Federal Reserve control the money supply?",
      "What is the difference between M1 and M2 money supply?",
      "How do open market operations work?",
      "What determines exchange rates between currencies?",
      "What role does the FDIC play in the banking system?",
    ],
    curriculumContext: `DSST Money and Banking covers the financial system, banking institutions, the Federal Reserve, monetary policy, and international finance.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: money/financial system (20%), banking institutions (20%), Federal Reserve (20%), monetary policy (20%), international finance (20%).`,
    tutorResources: `
- Federal Reserve Education (federalreserveeducation.org): Free Fed educational resources
- Khan Academy Macroeconomics (khanacademy.org): Money, banking, and monetary policy
- OpenStax Principles of Macroeconomics (openstax.org/books/principles-macroeconomics-3e): Free textbook`,
    examAlignmentNotes: `DSST Money and Banking alignment:
- Money and the financial system: 20%
- Banking institutions: 20%
- The Federal Reserve System: 20%
- Monetary policy: 20%
- International finance: 20%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include a monetary policy scenario or financial data as stimulus where relevant; null for concept-definition questions",
    stimulusDescription: "monetary policy scenario, banking situation, or economic data (null for concept recall)",
    explanationGuidance: "identifying the specific monetary/banking concept, explaining the mechanism of action, and connecting it to broader economic outcomes",
    difficultyRubric: {
      EASY: "Define a monetary term or identify a function of the Federal Reserve. 65%+ correct.",
      MEDIUM: "Analyze how a monetary policy action affects the money supply or interest rates. 40–55% correct.",
      HARD: "Evaluate the combined effects of multiple monetary policy tools on the economy or analyze an international finance scenario with exchange rate implications. 25–40% correct.",
    },
    distractorTaxonomy: "(1) POLICY DIRECTION SWAP — confuses expansionary with contractionary policy effects; (2) FED TOOL MIX-UP — attributes the wrong mechanism to an open market operation vs discount rate change; (3) MONEY SUPPLY CONFUSION — mixes up M1 and M2 components.",
    stimulusQualityGuidance: "GOOD: A specific economic scenario where the Fed must choose a policy action. AVOID: Abstract monetary theory without applied context.",
    skillCodes: ["Monetary Analysis", "Banking Operations", "Policy Evaluation", "International Finance"],
    topicWeights: {
      "DSST_MB_1_MONEY_FINANCIAL_SYSTEM": 0.20,
      "DSST_MB_2_BANKING_INSTITUTIONS": 0.20,
      "DSST_MB_3_FEDERAL_RESERVE": 0.20,
      "DSST_MB_4_MONETARY_POLICY": 0.20,
      "DSST_MB_5_INTERNATIONAL_FINANCE": 0.20,
    },
    recommendedTextbooks: [
      "OpenStax Principles of Macroeconomics (free: openstax.org/books/principles-macroeconomics-3e)",
      "Mishkin, The Economics of Money, Banking, and Financial Markets (Pearson)",
      "Cecchetti & Schoenholtz, Money, Banking, and Financial Markets (McGraw-Hill)",
    ],
  },

  // ── DSST Substance Abuse ────────────────────────────────────────────────
  DSST_SUBSTANCE_ABUSE: {
    name: "DSST Substance Abuse",
    shortName: "DSST Substance Abuse",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_SA_1_PHARMACOLOGY: {
        name: "Unit 1: Pharmacology and Drug Classification",
        keyThemes: ["drug classification", "pharmacokinetics", "pharmacodynamics", "depressants", "stimulants", "hallucinogens"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/4-5-substance-use-and-abuse",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/drug-use",
      },
      DSST_SA_2_ALCOHOL: {
        name: "Unit 2: Alcohol Use and Abuse",
        keyThemes: ["alcohol pharmacology", "BAC levels", "alcoholism", "fetal alcohol syndrome", "liver disease", "alcohol withdrawal"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/4-5-substance-use-and-abuse",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/drug-use",
      },
      DSST_SA_3_DRUGS_SOCIETY: {
        name: "Unit 3: Drugs and Society",
        keyThemes: ["addiction mechanisms", "tolerance", "dependence", "social factors in drug use", "gateway hypothesis", "drug epidemiology"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/4-5-substance-use-and-abuse",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/drug-use",
      },
      DSST_SA_4_TREATMENT_PREVENTION: {
        name: "Unit 4: Treatment and Prevention",
        keyThemes: ["treatment modalities", "12-step programs", "cognitive-behavioral therapy", "harm reduction", "detoxification", "prevention programs"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/16-3-treatment-modalities",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/drug-use",
      },
      DSST_SA_5_POLICY_LAW: {
        name: "Unit 5: Drug Policy and Law",
        keyThemes: ["Controlled Substances Act", "DEA scheduling", "War on Drugs", "drug courts", "legalization debate", "international drug policy"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/4-5-substance-use-and-abuse",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/drug-use",
      },
    },
    suggestedTutorQuestions: [
      "What is the difference between physical dependence and psychological addiction?",
      "How does alcohol affect the body at different BAC levels?",
      "What are the main drug schedules under the Controlled Substances Act?",
      "How do 12-step programs work for addiction treatment?",
      "What is the gateway drug hypothesis and what does evidence say?",
      "What is harm reduction and how does it differ from abstinence-based approaches?",
    ],
    curriculumContext: `DSST Substance Abuse covers pharmacology, alcohol/drug effects, addiction, treatment approaches, and drug policy.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: pharmacology (20%), alcohol (20%), drugs/society (20%), treatment/prevention (20%), policy/law (20%).`,
    tutorResources: `
- NIH/NIDA (nida.nih.gov): National Institute on Drug Abuse — authoritative substance abuse data
- CDC Substance Abuse (cdc.gov): Public health resources on substance use
- OpenStax Psychology 2e (openstax.org/books/psychology-2e): Free substance use chapter`,
    examAlignmentNotes: `DSST Substance Abuse alignment:
- Pharmacology and drug classification: 20%
- Alcohol use and abuse: 20%
- Drugs and society: 20%
- Treatment and prevention: 20%
- Drug policy and law: 20%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include a case study or scenario involving substance use as stimulus where relevant; null for concept recall questions",
    stimulusDescription: "substance use case study or public health scenario (null for pharmacology definitions)",
    explanationGuidance: "identifying the substance or mechanism involved, explaining the physiological or social effect, and connecting it to treatment or policy implications",
    difficultyRubric: {
      EASY: "Identify a drug classification or define a substance abuse term. 65%+ correct.",
      MEDIUM: "Apply knowledge of drug effects to a case scenario or compare treatment approaches. 40–55% correct.",
      HARD: "Analyze a complex case involving co-occurring disorders or evaluate competing drug policy approaches with their societal implications. 25–40% correct.",
    },
    distractorTaxonomy: "(1) CLASSIFICATION ERROR — puts a drug in the wrong schedule or category; (2) EFFECT SWAP — attributes stimulant effects to depressants or vice versa; (3) TREATMENT CONFUSION — confuses harm reduction with abstinence-only approaches.",
    stimulusQualityGuidance: "GOOD: A specific case describing substance use patterns, effects, or a treatment decision. AVOID: Moralizing statements about drug use without scientific context.",
    skillCodes: ["Pharmacology", "Substance Effects", "Treatment Knowledge", "Policy Analysis"],
    topicWeights: {
      "DSST_SA_1_PHARMACOLOGY": 0.20,
      "DSST_SA_2_ALCOHOL": 0.20,
      "DSST_SA_3_DRUGS_SOCIETY": 0.20,
      "DSST_SA_4_TREATMENT_PREVENTION": 0.20,
      "DSST_SA_5_POLICY_LAW": 0.20,
    },
    recommendedTextbooks: [
      "Hart & Ksir, Drugs, Society, and Human Behavior (McGraw-Hill)",
      "Levinthal, Drugs, Behavior, and Modern Society (Pearson)",
      "Inaba & Cohen, Uppers, Downers, All Arounders (CNS Productions)",
    ],
  },

  // ── DSST Criminal Justice ───────────────────────────────────────────────
  DSST_CRIMINAL_JUSTICE: {
    name: "DSST Criminal Justice",
    shortName: "DSST Criminal Justice",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_CJ_1_CRIME_THEORY: {
        name: "Unit 1: Crime and Criminological Theory",
        keyThemes: ["criminological theories", "classical school", "positivist school", "social learning theory", "strain theory", "crime statistics"],
        openStaxUrl: "https://openstax.org/books/introduction-sociology-3e/pages/7-2-theoretical-perspectives-on-deviance-and-crime",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/social-structures",
      },
      DSST_CJ_2_LAW_ENFORCEMENT: {
        name: "Unit 2: Law Enforcement",
        keyThemes: ["policing models", "community policing", "use of force", "police discretion", "law enforcement agencies", "Fourth Amendment"],
        openStaxUrl: "https://openstax.org/books/american-government-3e/pages/4-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/us-government-and-civics/us-gov-civil-liberties-and-civil-rights",
      },
      DSST_CJ_3_COURTS_ADJUDICATION: {
        name: "Unit 3: Courts and Adjudication",
        keyThemes: ["court structure", "due process", "plea bargaining", "trial procedures", "jury system", "sentencing guidelines"],
        openStaxUrl: "https://openstax.org/books/american-government-3e/pages/13-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/us-government-and-civics/us-gov-interactions-among-branches",
      },
      DSST_CJ_4_CORRECTIONS: {
        name: "Unit 4: Corrections",
        keyThemes: ["incarceration", "probation", "parole", "prison systems", "rehabilitation programs", "recidivism"],
        openStaxUrl: "https://openstax.org/books/introduction-sociology-3e/pages/7-3-crime-and-the-law",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/social-structures",
      },
      DSST_CJ_5_JUVENILE_JUSTICE: {
        name: "Unit 5: Juvenile Justice",
        keyThemes: ["juvenile court", "delinquency", "status offenses", "diversion programs", "waiver to adult court", "restorative justice"],
        openStaxUrl: "https://openstax.org/books/introduction-sociology-3e/pages/7-3-crime-and-the-law",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/social-structures",
      },
    },
    suggestedTutorQuestions: [
      "What are the main criminological theories of why people commit crimes?",
      "How does community policing differ from traditional policing?",
      "What are the steps in the criminal trial process?",
      "What is the difference between probation and parole?",
      "How does the juvenile justice system differ from the adult system?",
      "What is restorative justice and how does it work?",
    ],
    curriculumContext: `DSST Criminal Justice covers criminological theory, law enforcement, courts, corrections, and juvenile justice.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: crime theory (20%), law enforcement (20%), courts (20%), corrections (20%), juvenile justice (20%).`,
    tutorResources: `
- DOJ.gov (justice.gov): U.S. Department of Justice resources
- Saylor Academy CJ101 (learn.saylor.org/course/CJ101): Free Introduction to Criminal Justice course
- Open CJ textbooks (various): Free criminal justice resources`,
    examAlignmentNotes: `DSST Criminal Justice alignment:
- Crime and criminological theory: 20%
- Law enforcement: 20%
- Courts and adjudication: 20%
- Corrections: 20%
- Juvenile justice: 20%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include a criminal justice scenario or case as stimulus where relevant; null for concept recall questions",
    stimulusDescription: "criminal justice scenario, case study, or legal situation (null for theory identification)",
    explanationGuidance: "identifying the relevant criminal justice principle or theory, explaining how it applies to the scenario, and noting the legal or procedural rationale",
    difficultyRubric: {
      EASY: "Identify a criminological theory or define a criminal justice term. 65%+ correct.",
      MEDIUM: "Apply a legal principle to a case scenario or compare corrections approaches. 40–55% correct.",
      HARD: "Analyze a complex criminal justice case involving competing theories or evaluate policy trade-offs in sentencing and corrections. 25–40% correct.",
    },
    distractorTaxonomy: "(1) THEORY CONFUSION — attributes one criminological theory's explanation to another; (2) PROCESS ERROR — places a CJ procedure in the wrong stage of the system; (3) RIGHTS TRAP — confuses procedural protections (e.g., 4th vs 5th vs 6th Amendment).",
    stimulusQualityGuidance: "GOOD: A specific case scenario involving a crime, arrest, trial, or corrections decision. AVOID: Abstract theory without a practical application.",
    skillCodes: ["Criminological Theory", "Legal Procedures", "Corrections Analysis", "Policy Evaluation"],
    topicWeights: {
      "DSST_CJ_1_CRIME_THEORY": 0.20,
      "DSST_CJ_2_LAW_ENFORCEMENT": 0.20,
      "DSST_CJ_3_COURTS_ADJUDICATION": 0.20,
      "DSST_CJ_4_CORRECTIONS": 0.20,
      "DSST_CJ_5_JUVENILE_JUSTICE": 0.20,
    },
    recommendedTextbooks: [
      "Siegel, Introduction to Criminal Justice (Cengage)",
      "Schmalleger, Criminal Justice: A Brief Introduction (Pearson)",
      "Cole, Smith & DeJong, The American System of Criminal Justice (Cengage)",
    ],
  },

  // ── DSST Fundamentals of Counseling ─────────────────────────────────────
  DSST_FUNDAMENTALS_OF_COUNSELING: {
    name: "DSST Fundamentals of Counseling",
    shortName: "DSST Counseling",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_COUN_1_THEORIES: {
        name: "Unit 1: Counseling Theories",
        keyThemes: ["psychodynamic therapy", "cognitive-behavioral therapy", "humanistic counseling", "person-centered therapy", "existential therapy", "solution-focused therapy"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/16-1-mental-health-treatment-past-and-present",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/psychological-disorders",
      },
      DSST_COUN_2_TECHNIQUES: {
        name: "Unit 2: Counseling Techniques and Skills",
        keyThemes: ["active listening", "empathy", "reflection", "open-ended questions", "confrontation", "goal setting"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/16-2-types-of-treatment",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/psychological-disorders",
      },
      DSST_COUN_3_GROUP_FAMILY: {
        name: "Unit 3: Group and Family Counseling",
        keyThemes: ["group dynamics", "stages of group development", "family systems theory", "couples therapy", "group facilitation", "therapeutic factors"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/16-3-treatment-modalities",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/psychological-disorders",
      },
      DSST_COUN_4_ASSESSMENT: {
        name: "Unit 4: Assessment and Diagnosis",
        keyThemes: ["psychological testing", "DSM-5", "intake interviews", "behavioral assessment", "reliability and validity", "cultural considerations"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/15-1-diagnosing-and-classifying-psychological-disorders",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/psychological-disorders",
      },
      DSST_COUN_5_ETHICS_PROFESSIONAL: {
        name: "Unit 5: Ethics and Professional Issues",
        keyThemes: ["ACA ethics code", "confidentiality", "informed consent", "dual relationships", "mandatory reporting", "licensure"],
        openStaxUrl: "https://openstax.org/books/psychology-2e/pages/16-4-substance-related-and-addictive-disorders-a-special-case",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/psychological-disorders",
      },
    },
    suggestedTutorQuestions: [
      "What are the key differences between CBT and psychodynamic therapy?",
      "How does active listening work in counseling?",
      "What are the stages of group development in therapy?",
      "How is the DSM-5 used in psychological diagnosis?",
      "What are the main principles of the ACA ethics code?",
      "What is person-centered therapy and how does it work?",
    ],
    curriculumContext: `DSST Fundamentals of Counseling covers counseling theories, techniques, group/family therapy, assessment, and professional ethics.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: counseling theories (20%), techniques (20%), group/family (20%), assessment (20%), ethics (20%).`,
    tutorResources: `
- OpenStax Psychology 2e therapy chapters (openstax.org/books/psychology-2e): Free therapy and treatment content
- Open counseling textbooks (various): Free counseling theory resources
- ACA (counseling.org): American Counseling Association ethics resources`,
    examAlignmentNotes: `DSST Fundamentals of Counseling alignment:
- Counseling theories: 20%
- Counseling techniques and skills: 20%
- Group and family counseling: 20%
- Assessment and diagnosis: 20%
- Ethics and professional issues: 20%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include a counseling case vignette as stimulus where relevant; null for theory identification questions",
    stimulusDescription: "counseling case vignette or therapeutic scenario (null for theory recall)",
    explanationGuidance: "identifying the relevant counseling theory or technique, explaining why it is appropriate for the described situation, and noting ethical considerations",
    difficultyRubric: {
      EASY: "Identify a counseling theory or define a therapeutic technique. 65%+ correct.",
      MEDIUM: "Apply a counseling approach to a client scenario or determine the appropriate ethical response. 40–55% correct.",
      HARD: "Analyze a complex client case requiring integration of multiple theories or navigate an ethical dilemma with competing obligations. 25–40% correct.",
    },
    distractorTaxonomy: "(1) THEORY SWAP — attributes CBT techniques to psychodynamic therapy or vice versa; (2) ETHICS CONFUSION — misapplies confidentiality exceptions; (3) ASSESSMENT TRAP — uses the wrong assessment tool for the presenting concern.",
    stimulusQualityGuidance: "GOOD: A client case describing presenting concerns, behaviors, and a therapeutic decision point. AVOID: Abstract theory questions without a client context.",
    skillCodes: ["Counseling Theory", "Therapeutic Techniques", "Assessment Skills", "Ethical Practice"],
    topicWeights: {
      "DSST_COUN_1_THEORIES": 0.20,
      "DSST_COUN_2_TECHNIQUES": 0.20,
      "DSST_COUN_3_GROUP_FAMILY": 0.20,
      "DSST_COUN_4_ASSESSMENT": 0.20,
      "DSST_COUN_5_ETHICS_PROFESSIONAL": 0.20,
    },
    recommendedTextbooks: [
      "Corey, Theory and Practice of Counseling and Psychotherapy (Cengage)",
      "Gladding, Counseling: A Comprehensive Profession (Pearson)",
      "Ivey, Ivey & Zalaquett, Intentional Interviewing and Counseling (Cengage)",
    ],
  },

  // ── DSST General Anthropology ───────────────────────────────────────────
  DSST_GENERAL_ANTHROPOLOGY: {
    name: "DSST General Anthropology",
    shortName: "DSST Anthropology",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_ANTH_1_PHYSICAL: {
        name: "Unit 1: Physical Anthropology",
        keyThemes: ["human evolution", "primatology", "natural selection", "hominid fossils", "genetics and heredity", "biological variation"],
        openStaxUrl: "https://openstax.org/books/introduction-anthropology/pages/1-introduction",
        khanUrl: "https://www.khanacademy.org/science/biology/her/evolution-and-natural-selection",
      },
      DSST_ANTH_2_ARCHAEOLOGY: {
        name: "Unit 2: Archaeology",
        keyThemes: ["archaeological methods", "dating techniques", "excavation", "artifact analysis", "cultural chronology", "ethnoarchaeology"],
        openStaxUrl: "https://openstax.org/books/introduction-anthropology/pages/3-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/world-history/world-history-beginnings",
      },
      DSST_ANTH_3_CULTURAL: {
        name: "Unit 3: Cultural Anthropology",
        keyThemes: ["cultural relativism", "ethnocentrism", "kinship systems", "marriage patterns", "subsistence strategies", "political organization"],
        openStaxUrl: "https://openstax.org/books/introduction-anthropology/pages/2-introduction",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/social-structures",
      },
      DSST_ANTH_4_LINGUISTIC: {
        name: "Unit 4: Linguistic Anthropology",
        keyThemes: ["language and culture", "Sapir-Whorf hypothesis", "phonology", "morphology", "sociolinguistics", "language change"],
        openStaxUrl: "https://openstax.org/books/introduction-anthropology/pages/5-introduction",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/social-interactions",
      },
      DSST_ANTH_5_APPLIED: {
        name: "Unit 5: Applied Anthropology",
        keyThemes: ["medical anthropology", "development anthropology", "forensic anthropology", "urban anthropology", "globalization", "ethical issues"],
        openStaxUrl: "https://openstax.org/books/introduction-anthropology/pages/15-introduction",
        khanUrl: "https://www.khanacademy.org/test-prep/mcat/behavior/social-structures",
      },
    },
    suggestedTutorQuestions: [
      "What are the four subfields of anthropology?",
      "How does natural selection drive human evolution?",
      "What is cultural relativism and why is it important?",
      "How do archaeologists date artifacts?",
      "What is the Sapir-Whorf hypothesis?",
      "How does forensic anthropology help solve crimes?",
    ],
    curriculumContext: `DSST General Anthropology covers physical anthropology, archaeology, cultural anthropology, linguistic anthropology, and applied anthropology.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: physical anthropology (20%), archaeology (20%), cultural anthropology (20%), linguistic anthropology (20%), applied anthropology (20%).`,
    tutorResources: `
- Smithsonian open resources (si.edu): Human origins and anthropology exhibits
- OpenStax Introduction to Anthropology (openstax.org/books/introduction-anthropology): Free textbook
- Khan Academy (khanacademy.org): Evolution and world history content`,
    examAlignmentNotes: `DSST General Anthropology alignment:
- Physical anthropology: 20%
- Archaeology: 20%
- Cultural anthropology: 20%
- Linguistic anthropology: 20%
- Applied anthropology: 20%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include an anthropological case study or fieldwork scenario as stimulus where relevant; null for concept recall questions",
    stimulusDescription: "anthropological case study, fieldwork description, or cultural scenario (null for definition questions)",
    explanationGuidance: "identifying the relevant anthropological concept or subfield, explaining the evidence or cultural context, and noting how anthropologists approach the phenomenon",
    difficultyRubric: {
      EASY: "Identify an anthropological subfield or define a key term. 65%+ correct.",
      MEDIUM: "Apply an anthropological concept to a cultural scenario or analyze archaeological evidence. 40–55% correct.",
      HARD: "Compare competing anthropological theories or analyze a complex cross-cultural case requiring integration of multiple subfields. 25–40% correct.",
    },
    distractorTaxonomy: "(1) SUBFIELD CONFUSION — attributes a method from one subfield to another; (2) DATING ERROR — confuses relative and absolute dating techniques; (3) CULTURAL TRAP — applies ethnocentric assumptions to a cross-cultural scenario.",
    stimulusQualityGuidance: "GOOD: A specific ethnographic scenario, fossil discovery, or cultural practice to analyze. AVOID: Abstract definitions without fieldwork context.",
    skillCodes: ["Physical Anthropology", "Archaeological Methods", "Cultural Analysis", "Linguistic Theory"],
    topicWeights: {
      "DSST_ANTH_1_PHYSICAL": 0.20,
      "DSST_ANTH_2_ARCHAEOLOGY": 0.20,
      "DSST_ANTH_3_CULTURAL": 0.20,
      "DSST_ANTH_4_LINGUISTIC": 0.20,
      "DSST_ANTH_5_APPLIED": 0.20,
    },
    recommendedTextbooks: [
      "OpenStax Introduction to Anthropology (free: openstax.org/books/introduction-anthropology)",
      "Kottak, Anthropology: Appreciating Human Diversity (McGraw-Hill)",
      "Haviland et al., Anthropology: The Human Challenge (Cengage)",
    ],
  },

  // ── DSST Introduction to World Religions ────────────────────────────────
  DSST_WORLD_RELIGIONS: {
    name: "DSST Introduction to World Religions",
    shortName: "DSST World Religions",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_REL_1_HINDUISM_BUDDHISM: {
        name: "Unit 1: Hinduism and Buddhism",
        keyThemes: ["Vedas and Upanishads", "karma and dharma", "caste system", "Four Noble Truths", "Eightfold Path", "Mahayana vs Theravada"],
        openStaxUrl: "https://openstax.org/books/introduction-philosophy/pages/4-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/world-history/world-history-beginnings",
      },
      DSST_REL_2_JUDAISM: {
        name: "Unit 2: Judaism",
        keyThemes: ["Torah", "covenant", "prophets", "synagogue worship", "Jewish holidays", "denominations of Judaism"],
        openStaxUrl: "https://openstax.org/books/introduction-philosophy/pages/4-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/world-history/world-history-beginnings",
      },
      DSST_REL_3_CHRISTIANITY: {
        name: "Unit 3: Christianity",
        keyThemes: ["life of Jesus", "New Testament", "sacraments", "Protestant Reformation", "Catholic/Orthodox/Protestant branches", "Christian theology"],
        openStaxUrl: "https://openstax.org/books/introduction-philosophy/pages/4-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/world-history/medieval-times",
      },
      DSST_REL_4_ISLAM: {
        name: "Unit 4: Islam",
        keyThemes: ["Five Pillars of Islam", "Quran", "Prophet Muhammad", "Sunni vs Shia", "Sharia", "Islamic Golden Age"],
        openStaxUrl: "https://openstax.org/books/introduction-philosophy/pages/4-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/world-history/medieval-times",
      },
      DSST_REL_5_OTHER_TRADITIONS: {
        name: "Unit 5: Other Religious Traditions",
        keyThemes: ["Sikhism", "Confucianism", "Taoism", "Shinto", "indigenous religions", "new religious movements"],
        openStaxUrl: "https://openstax.org/books/introduction-philosophy/pages/4-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/world-history/world-history-beginnings",
      },
    },
    suggestedTutorQuestions: [
      "What are the Four Noble Truths of Buddhism?",
      "How do the Five Pillars of Islam structure Muslim life?",
      "What caused the Protestant Reformation?",
      "How do Hinduism's concepts of karma and dharma work?",
      "What are the main differences between Sunni and Shia Islam?",
      "How does Confucianism differ from Taoism?",
    ],
    curriculumContext: `DSST Introduction to World Religions covers major world religions including Hinduism, Buddhism, Judaism, Christianity, Islam, and other traditions.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: Hinduism/Buddhism (20%), Judaism (20%), Christianity (20%), Islam (20%), other traditions (20%).`,
    tutorResources: `
- Harvard/Yale open religion lectures (various): Free comparative religion lectures
- Open comparative religion texts (various): Free world religions resources
- Khan Academy World History (khanacademy.org): Religious history context`,
    examAlignmentNotes: `DSST Introduction to World Religions alignment:
- Hinduism and Buddhism: 20%
- Judaism: 20%
- Christianity: 20%
- Islam: 20%
- Other religious traditions: 20%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include a religious text excerpt or practice description as stimulus where relevant; null for concept recall questions",
    stimulusDescription: "religious text excerpt, ritual description, or comparative scenario (null for definition questions)",
    explanationGuidance: "identifying the specific religion and tradition, explaining the theological or historical significance, and noting connections or distinctions with other traditions",
    difficultyRubric: {
      EASY: "Identify a religion from a description of its practices or name a key text/figure. 65%+ correct.",
      MEDIUM: "Compare two religions on a specific doctrine or apply theological knowledge to a scenario. 40–55% correct.",
      HARD: "Analyze the historical interaction between two religions or evaluate a complex theological debate within a tradition. 25–40% correct.",
    },
    distractorTaxonomy: "(1) RELIGION SWAP — attributes a practice or text to the wrong religion; (2) DENOMINATION CONFUSION — confuses branches within a religion (e.g., Sunni/Shia, Catholic/Protestant); (3) HISTORICAL TRAP — places a religious development in the wrong historical period.",
    stimulusQualityGuidance: "GOOD: A specific religious text, practice, or historical event to analyze. AVOID: Oversimplified or stereotypical descriptions of religious traditions.",
    skillCodes: ["Religious Knowledge", "Comparative Analysis", "Historical Context", "Theological Reasoning"],
    topicWeights: {
      "DSST_REL_1_HINDUISM_BUDDHISM": 0.20,
      "DSST_REL_2_JUDAISM": 0.20,
      "DSST_REL_3_CHRISTIANITY": 0.20,
      "DSST_REL_4_ISLAM": 0.20,
      "DSST_REL_5_OTHER_TRADITIONS": 0.20,
    },
    recommendedTextbooks: [
      "Molloy, Experiencing the World's Religions (McGraw-Hill)",
      "Hopfe & Woodward, Religions of the World (Pearson)",
      "Smith, The World's Religions (HarperOne)",
    ],
  },

  // ── DSST Art of the Western World ───────────────────────────────────────
  DSST_ART_WESTERN_WORLD: {
    name: "DSST Art of the Western World",
    shortName: "DSST Western Art",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_ART_1_ANCIENT_MEDIEVAL: {
        name: "Unit 1: Ancient and Medieval Art",
        keyThemes: ["Greek art and architecture", "Roman art", "Byzantine art", "Romanesque", "Gothic cathedrals", "manuscript illumination"],
        openStaxUrl: "https://openstax.org/books/introduction-philosophy/pages/8-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/ap-art-history/ancient-mediterranean-702-702",
      },
      DSST_ART_2_RENAISSANCE_BAROQUE: {
        name: "Unit 2: Renaissance and Baroque",
        keyThemes: ["Early Renaissance", "High Renaissance", "Leonardo da Vinci", "Michelangelo", "Baroque drama", "Caravaggio and Rembrandt"],
        openStaxUrl: "https://openstax.org/books/introduction-philosophy/pages/8-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/renaissance-reformation",
      },
      DSST_ART_3_NEOCLASSICAL_ROMANTIC: {
        name: "Unit 3: Neoclassical and Romantic Art",
        keyThemes: ["Neoclassicism", "Romanticism", "Jacques-Louis David", "Delacroix", "landscape painting", "Sublime"],
        openStaxUrl: "https://openstax.org/books/introduction-philosophy/pages/8-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/becoming-modern",
      },
      DSST_ART_4_MODERN: {
        name: "Unit 4: Modern Art",
        keyThemes: ["Impressionism", "Post-Impressionism", "Cubism", "Surrealism", "Abstract Expressionism", "Monet, Picasso, Dali"],
        openStaxUrl: "https://openstax.org/books/introduction-philosophy/pages/8-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/art-1010",
      },
      DSST_ART_5_CONTEMPORARY: {
        name: "Unit 5: Contemporary Art",
        keyThemes: ["Pop Art", "Minimalism", "Conceptual Art", "postmodernism", "installation art", "digital art"],
        openStaxUrl: "https://openstax.org/books/introduction-philosophy/pages/8-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/art-1010",
      },
    },
    suggestedTutorQuestions: [
      "What are the key characteristics of Renaissance art?",
      "How did Impressionism break from traditional art?",
      "What is the difference between Romanesque and Gothic architecture?",
      "How did Cubism change the way artists represent reality?",
      "What defines Abstract Expressionism?",
      "How does Pop Art challenge traditional notions of fine art?",
    ],
    curriculumContext: `DSST Art of the Western World covers Western art history from ancient Greece through contemporary movements.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: ancient/medieval (20%), Renaissance/Baroque (20%), Neoclassical/Romantic (20%), Modern (20%), Contemporary (20%).`,
    tutorResources: `
- Khan Academy Art History (khanacademy.org/humanities/art-history): Free comprehensive art history
- The Metropolitan Museum of Art (metmuseum.org): Free art collections and resources
- Smarthistory (smarthistory.org): Free art history multimedia resources`,
    examAlignmentNotes: `DSST Art of the Western World alignment:
- Ancient and medieval art: 20%
- Renaissance and Baroque: 20%
- Neoclassical and Romantic: 20%
- Modern art: 20%
- Contemporary art: 20%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include an artwork description or stylistic comparison as stimulus where relevant; null for identification questions",
    stimulusDescription: "artwork description, stylistic comparison, or art movement scenario (null for artist/period identification)",
    explanationGuidance: "identifying the art movement, period, and key artists, explaining the stylistic characteristics, and noting the historical or cultural context",
    difficultyRubric: {
      EASY: "Identify an art movement or artist from a description. 65%+ correct.",
      MEDIUM: "Compare two art movements or analyze the stylistic features of a described artwork. 40–55% correct.",
      HARD: "Evaluate the cultural/historical forces that drove an artistic shift or analyze how a specific work reflects multiple influences. 25–40% correct.",
    },
    distractorTaxonomy: "(1) PERIOD SWAP — places an artist or work in the wrong art period; (2) MOVEMENT CONFUSION — attributes stylistic features to the wrong art movement; (3) INFLUENCE TRAP — misidentifies the cultural or artistic influence on a movement.",
    stimulusQualityGuidance: "GOOD: A description of a specific artwork or architectural work with identifiable stylistic features. AVOID: Vague 'what style is this' without concrete details.",
    skillCodes: ["Art Identification", "Stylistic Analysis", "Historical Context", "Movement Comparison"],
    topicWeights: {
      "DSST_ART_1_ANCIENT_MEDIEVAL": 0.20,
      "DSST_ART_2_RENAISSANCE_BAROQUE": 0.20,
      "DSST_ART_3_NEOCLASSICAL_ROMANTIC": 0.20,
      "DSST_ART_4_MODERN": 0.20,
      "DSST_ART_5_CONTEMPORARY": 0.20,
    },
    recommendedTextbooks: [
      "Stokstad & Cothren, Art History (Pearson)",
      "Gardner, Gardner's Art Through the Ages (Cengage)",
      "Smarthistory (free: smarthistory.org)",
    ],
  },

  // ── DSST Astronomy ──────────────────────────────────────────────────────
  DSST_ASTRONOMY: {
    name: "DSST Astronomy",
    shortName: "DSST Astronomy",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_ASTR_1_SOLAR_SYSTEM: {
        name: "Unit 1: The Solar System",
        keyThemes: ["planets", "moons", "asteroids and comets", "solar system formation", "Kepler's laws", "planetary atmospheres"],
        openStaxUrl: "https://openstax.org/books/astronomy-2e/pages/7-introduction",
        khanUrl: "https://www.khanacademy.org/science/cosmology-and-astronomy/solar-system-topic",
      },
      DSST_ASTR_2_STARS_STELLAR: {
        name: "Unit 2: Stars and Stellar Evolution",
        keyThemes: ["stellar classification", "HR diagram", "nuclear fusion", "main sequence", "red giants", "supernovae and neutron stars"],
        openStaxUrl: "https://openstax.org/books/astronomy-2e/pages/18-introduction",
        khanUrl: "https://www.khanacademy.org/science/cosmology-and-astronomy/stellar-life-topic",
      },
      DSST_ASTR_3_GALAXIES: {
        name: "Unit 3: Galaxies",
        keyThemes: ["Milky Way", "galaxy types", "galaxy formation", "active galactic nuclei", "quasars", "galaxy clusters"],
        openStaxUrl: "https://openstax.org/books/astronomy-2e/pages/25-introduction",
        khanUrl: "https://www.khanacademy.org/science/cosmology-and-astronomy/universe-scale-topic",
      },
      DSST_ASTR_4_COSMOLOGY: {
        name: "Unit 4: Cosmology",
        keyThemes: ["Big Bang theory", "cosmic microwave background", "dark matter", "dark energy", "expansion of the universe", "fate of the universe"],
        openStaxUrl: "https://openstax.org/books/astronomy-2e/pages/29-introduction",
        khanUrl: "https://www.khanacademy.org/science/cosmology-and-astronomy/universe-scale-topic",
      },
      DSST_ASTR_5_OBSERVATIONAL: {
        name: "Unit 5: Observational Astronomy",
        keyThemes: ["telescopes", "electromagnetic spectrum", "spectroscopy", "celestial coordinates", "space missions", "light pollution"],
        openStaxUrl: "https://openstax.org/books/astronomy-2e/pages/6-introduction",
        khanUrl: "https://www.khanacademy.org/science/cosmology-and-astronomy",
      },
    },
    suggestedTutorQuestions: [
      "How do stars evolve on the HR diagram?",
      "What evidence supports the Big Bang theory?",
      "How do Kepler's laws describe planetary motion?",
      "What is dark matter and how do we know it exists?",
      "How do telescopes collect and focus light?",
      "What is the life cycle of a massive star?",
    ],
    curriculumContext: `DSST Astronomy covers the solar system, stellar evolution, galaxies, cosmology, and observational techniques.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: solar system (20%), stars/stellar evolution (20%), galaxies (20%), cosmology (20%), observational astronomy (20%).`,
    tutorResources: `
- NASA.gov (nasa.gov): Public domain astronomy resources and data
- Khan Academy Cosmology & Astronomy (khanacademy.org): Free astronomy tutorials
- MIT OCW Astronomy (ocw.mit.edu): Free astronomy course materials`,
    examAlignmentNotes: `DSST Astronomy alignment:
- The solar system: 20%
- Stars and stellar evolution: 20%
- Galaxies: 20%
- Cosmology: 20%
- Observational astronomy: 20%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include an astronomical observation or data description as stimulus where relevant; null for concept recall questions",
    stimulusDescription: "astronomical observation, diagram description, or celestial event scenario (null for definition questions)",
    explanationGuidance: "identifying the astronomical concept or phenomenon, explaining the underlying physics, and connecting it to observable evidence",
    difficultyRubric: {
      EASY: "Identify a planet, star type, or astronomical term from its description. 65%+ correct.",
      MEDIUM: "Apply stellar evolution concepts or analyze an astronomical observation to draw conclusions. 40–55% correct.",
      HARD: "Evaluate cosmological evidence or analyze a complex scenario involving multiple astronomical phenomena. 25–40% correct.",
    },
    distractorTaxonomy: "(1) SCALE CONFUSION — confuses solar system, galactic, and cosmological scales; (2) STELLAR STAGE SWAP — places a star in the wrong evolutionary stage; (3) SPECTRUM TRAP — misidentifies what a spectral observation reveals about a celestial object.",
    stimulusQualityGuidance: "GOOD: A specific astronomical observation or data set to interpret. AVOID: Trivia questions about planet names without conceptual depth.",
    skillCodes: ["Solar System Knowledge", "Stellar Physics", "Galactic Structure", "Cosmological Analysis"],
    topicWeights: {
      "DSST_ASTR_1_SOLAR_SYSTEM": 0.20,
      "DSST_ASTR_2_STARS_STELLAR": 0.20,
      "DSST_ASTR_3_GALAXIES": 0.20,
      "DSST_ASTR_4_COSMOLOGY": 0.20,
      "DSST_ASTR_5_OBSERVATIONAL": 0.20,
    },
    recommendedTextbooks: [
      "OpenStax Astronomy 2e (free: openstax.org/books/astronomy-2e)",
      "Seeds & Backman, Foundations of Astronomy (Cengage)",
      "Bennett et al., The Cosmic Perspective (Pearson)",
    ],
  },

  // ── DSST Computing and Information Technology ───────────────────────────
  DSST_COMPUTING_AND_IT: {
    name: "DSST Computing and Information Technology",
    shortName: "DSST Computing & IT",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_CIT_1_HARDWARE_SOFTWARE: {
        name: "Unit 1: Hardware and Software Fundamentals",
        keyThemes: ["CPU and memory", "storage devices", "operating systems", "application software", "binary and data representation", "system architecture"],
        openStaxUrl: "https://openstax.org/books/introduction-business/pages/13-introduction",
        khanUrl: "https://www.khanacademy.org/computing/computer-science/how-computers-work2",
      },
      DSST_CIT_2_NETWORKING: {
        name: "Unit 2: Networking and the Internet",
        keyThemes: ["TCP/IP", "network topologies", "Internet protocols", "Wi-Fi", "cloud computing", "client-server model"],
        openStaxUrl: "https://openstax.org/books/introduction-business/pages/13-introduction",
        khanUrl: "https://www.khanacademy.org/computing/computer-science/internet-intro",
      },
      DSST_CIT_3_PROGRAMMING: {
        name: "Unit 3: Programming Concepts",
        keyThemes: ["programming languages", "algorithms", "control structures", "data types", "functions", "object-oriented programming"],
        openStaxUrl: "https://openstax.org/books/introduction-business/pages/13-introduction",
        khanUrl: "https://www.khanacademy.org/computing/computer-programming",
      },
      DSST_CIT_4_DATABASES_WEB: {
        name: "Unit 4: Databases and Web Technologies",
        keyThemes: ["SQL", "relational databases", "HTML/CSS", "web development", "e-commerce", "content management"],
        openStaxUrl: "https://openstax.org/books/introduction-business/pages/13-introduction",
        khanUrl: "https://www.khanacademy.org/computing/computer-programming/sql",
      },
      DSST_CIT_5_SECURITY_ETHICS: {
        name: "Unit 5: Cybersecurity and IT Ethics",
        keyThemes: ["cybersecurity basics", "malware", "encryption", "privacy", "intellectual property", "IT ethics and social impact"],
        openStaxUrl: "https://openstax.org/books/introduction-business/pages/13-introduction",
        khanUrl: "https://www.khanacademy.org/computing/computer-science/cryptography",
      },
    },
    suggestedTutorQuestions: [
      "How does a CPU process instructions?",
      "What is the difference between TCP and UDP?",
      "How does object-oriented programming work?",
      "What is SQL and how is it used with databases?",
      "What are common cybersecurity threats and defenses?",
      "How does encryption protect data?",
    ],
    curriculumContext: `DSST Computing and Information Technology covers hardware/software, networking, programming, databases, and cybersecurity.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: hardware/software (20%), networking (20%), programming (20%), databases/web (20%), security/ethics (20%).`,
    tutorResources: `
- Harvard CS50 (cs50.harvard.edu): Free comprehensive computing course
- Cisco Networking Academy free modules (netacad.com): Networking fundamentals
- Khan Academy Computing (khanacademy.org/computing): Free programming and CS content`,
    examAlignmentNotes: `DSST Computing and Information Technology alignment:
- Hardware and software fundamentals: 20%
- Networking and the Internet: 20%
- Programming concepts: 20%
- Databases and web technologies: 20%
- Cybersecurity and IT ethics: 20%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include a computing scenario or code snippet as stimulus where relevant; null for concept-definition questions",
    stimulusDescription: "computing scenario, code snippet, or network diagram description (null for concept recall)",
    explanationGuidance: "identifying the specific computing concept, explaining how the technology works, and connecting it to practical applications",
    difficultyRubric: {
      EASY: "Identify a hardware component or define a computing term. 65%+ correct.",
      MEDIUM: "Trace through a simple code snippet or diagnose a network configuration issue. 40–55% correct.",
      HARD: "Analyze a complex system architecture decision or evaluate trade-offs between competing technology solutions. 25–40% correct.",
    },
    distractorTaxonomy: "(1) PROTOCOL CONFUSION — mixes up TCP, UDP, HTTP, and FTP functions; (2) LANGUAGE TRAP — confuses features of different programming paradigms; (3) SECURITY ERROR — misidentifies the correct defense for a given cybersecurity threat.",
    stimulusQualityGuidance: "GOOD: A specific computing scenario, code example, or technology decision to analyze. AVOID: Abstract vocabulary without practical application.",
    skillCodes: ["Hardware/Software", "Networking", "Programming Logic", "Security Analysis"],
    topicWeights: {
      "DSST_CIT_1_HARDWARE_SOFTWARE": 0.20,
      "DSST_CIT_2_NETWORKING": 0.20,
      "DSST_CIT_3_PROGRAMMING": 0.20,
      "DSST_CIT_4_DATABASES_WEB": 0.20,
      "DSST_CIT_5_SECURITY_ETHICS": 0.20,
    },
    recommendedTextbooks: [
      "Brookshear & Brylow, Computer Science: An Overview (Pearson)",
      "Schneider & Gersting, Invitation to Computer Science (Cengage)",
      "Harvard CS50 (free: cs50.harvard.edu)",
    ],
  },

  // ── DSST The Civil War and Reconstruction ───────────────────────────────
  DSST_CIVIL_WAR: {
    name: "DSST The Civil War and Reconstruction",
    shortName: "DSST Civil War",
    examSecsPerQuestion: 72,
    mockExam: { mcqCount: 100, mcqTimeMinutes: 120 },
    enrichWithEduAPIs: false,
    units: {
      DSST_CW_1_ANTEBELLUM: {
        name: "Unit 1: Antebellum America",
        keyThemes: ["slavery debate", "sectionalism", "Compromise of 1850", "Kansas-Nebraska Act", "Dred Scott decision", "abolitionist movement"],
        openStaxUrl: "https://openstax.org/books/us-history/pages/14-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/us-history/civil-war-era",
      },
      DSST_CW_2_SECESSION_EARLY_WAR: {
        name: "Unit 2: Secession and Early War",
        keyThemes: ["election of 1860", "secession", "Fort Sumter", "border states", "early battles", "military leadership"],
        openStaxUrl: "https://openstax.org/books/us-history/pages/15-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/us-history/civil-war-era",
      },
      DSST_CW_3_MAJOR_CAMPAIGNS: {
        name: "Unit 3: Major Campaigns and Battles",
        keyThemes: ["Gettysburg", "Vicksburg", "Antietam", "Sherman's March", "naval warfare", "Grant's strategy"],
        openStaxUrl: "https://openstax.org/books/us-history/pages/15-3-the-war-begins",
        khanUrl: "https://www.khanacademy.org/humanities/us-history/civil-war-era",
      },
      DSST_CW_4_HOME_FRONT: {
        name: "Unit 4: The Home Front",
        keyThemes: ["Emancipation Proclamation", "women in the war", "draft riots", "economic impact", "African American soldiers", "political dissent"],
        openStaxUrl: "https://openstax.org/books/us-history/pages/15-4-the-war-ends",
        khanUrl: "https://www.khanacademy.org/humanities/us-history/civil-war-era",
      },
      DSST_CW_5_RECONSTRUCTION: {
        name: "Unit 5: Reconstruction",
        keyThemes: ["13th Amendment", "14th Amendment", "15th Amendment", "Freedmen's Bureau", "Radical Reconstruction", "end of Reconstruction"],
        openStaxUrl: "https://openstax.org/books/us-history/pages/16-introduction",
        khanUrl: "https://www.khanacademy.org/humanities/us-history/civil-war-era",
      },
    },
    suggestedTutorQuestions: [
      "What were the main causes of the Civil War?",
      "How did the Emancipation Proclamation change the war?",
      "Why was the Battle of Gettysburg a turning point?",
      "What did the 13th, 14th, and 15th Amendments accomplish?",
      "What was the Freedmen's Bureau and what did it do?",
      "Why did Reconstruction ultimately end?",
    ],
    curriculumContext: `DSST The Civil War and Reconstruction covers the causes, major events, and aftermath of the American Civil War and Reconstruction era.
Exam: 100 questions, 120 minutes, multiple choice. Passing score ~400/500 (scaled). Earns 3 college credits.
Typical credit value: ~$1,000+ in tuition savings.
Topics: antebellum America (20%), secession/early war (20%), major campaigns (20%), home front (20%), Reconstruction (20%).`,
    tutorResources: `
- National Archives (archives.gov): Primary source documents from the Civil War era
- Library of Congress (loc.gov): Civil War photographs, maps, and documents
- PBS Civil War resources (pbs.org): Documentary and educational resources`,
    examAlignmentNotes: `DSST The Civil War and Reconstruction alignment:
- Antebellum America: 20%
- Secession and early war: 20%
- Major campaigns and battles: 20%
- The home front: 20%
- Reconstruction: 20%
100 MCQ in 120 min. 4-choice format. ~400/500 passing. Earns 3 semester hours.`,
    stimulusRequirement: "Include a primary source excerpt or historical scenario as stimulus where relevant; null for fact recall questions",
    stimulusDescription: "primary source excerpt, historical scenario, or map/battle description (null for fact identification)",
    explanationGuidance: "identifying the specific historical event, figure, or policy, explaining its significance in the context of the Civil War or Reconstruction, and noting its broader impact on American history",
    difficultyRubric: {
      EASY: "Identify a key figure, battle, or event from the Civil War era. 65%+ correct.",
      MEDIUM: "Analyze the causes or consequences of a specific event or compare military strategies. 40–55% correct.",
      HARD: "Evaluate the long-term impact of Reconstruction policies or analyze how multiple factors contributed to a turning point in the war. 25–40% correct.",
    },
    distractorTaxonomy: "(1) CHRONOLOGY ERROR — places events in the wrong order or year; (2) CAUSE CONFUSION — attributes a battle outcome or policy to the wrong factor; (3) AMENDMENT SWAP — confuses the 13th, 14th, and 15th Amendments.",
    stimulusQualityGuidance: "GOOD: A primary source quote, battle scenario, or policy description requiring analysis. AVOID: Simple date/name recall without historical context.",
    skillCodes: ["Historical Causation", "Military Analysis", "Political Analysis", "Reconstruction Policy"],
    topicWeights: {
      "DSST_CW_1_ANTEBELLUM": 0.20,
      "DSST_CW_2_SECESSION_EARLY_WAR": 0.20,
      "DSST_CW_3_MAJOR_CAMPAIGNS": 0.20,
      "DSST_CW_4_HOME_FRONT": 0.20,
      "DSST_CW_5_RECONSTRUCTION": 0.20,
    },
    recommendedTextbooks: [
      "OpenStax U.S. History (free: openstax.org/books/us-history)",
      "McPherson, Battle Cry of Freedom (Oxford University Press)",
      "Foner, Reconstruction: America's Unfinished Revolution (Harper Perennial)",
    ],
  },

  // ── 8 NEW AP COURSES (added 2026-04-29) — CED-anchored ───────────────────
  // Skeleton entries to expose courses in dropdowns once population starts.
  // Hidden until each hits ≥30 approved Qs (gated by isCourseAvailable check).

  AP_ENGLISH_LITERATURE: {
    name: "AP English Literature and Composition",
    shortName: "AP Eng Lit",
    hidden: true, // Added 2026-04-29 — awaiting full CB material (practice tests, samples) per user directive
    examSecsPerQuestion: 60,
    mockExam: { mcqCount: 55, mcqTimeMinutes: 60 },
    enrichWithEduAPIs: true,
    units: {
      APLIT_1_SHORT_FICTION_I: { name: "Unit 1: Short Fiction I", keyThemes: ["character", "structure", "narration"] },
      APLIT_2_POETRY_I: { name: "Unit 2: Poetry I", keyThemes: ["speaker", "structure", "figurative language"] },
      APLIT_3_LONGER_FICTION_DRAMA_I: { name: "Unit 3: Longer Fiction or Drama I", keyThemes: ["character", "setting", "structure"] },
      APLIT_4_SHORT_FICTION_II: { name: "Unit 4: Short Fiction II", keyThemes: ["narration", "perspective", "literary argument"] },
      APLIT_5_POETRY_II: { name: "Unit 5: Poetry II", keyThemes: ["word choice", "figurative language", "literary devices"] },
      APLIT_6_LONGER_FICTION_DRAMA_II: { name: "Unit 6: Longer Fiction or Drama II", keyThemes: ["plot", "character development", "themes"] },
      APLIT_7_SHORT_FICTION_III: { name: "Unit 7: Short Fiction III", keyThemes: ["literary argument", "interpretation", "complexity"] },
      APLIT_8_POETRY_III: { name: "Unit 8: Poetry III", keyThemes: ["complex meaning", "tone", "style"] },
      APLIT_9_LONGER_FICTION_DRAMA_III: { name: "Unit 9: Longer Fiction or Drama III", keyThemes: ["literary argument", "synthesis", "interpretation"] },
    },
    suggestedTutorQuestions: ["Walk me through analyzing a poem's tone", "How do I write a literary argument?"],
    curriculumContext: "AP English Literature has 9 units across 3 categories (Short Fiction, Poetry, Longer Fiction/Drama) at increasing depth.",
    tutorResources: "- Project Gutenberg for free public-domain literary texts\n- The Poetry Foundation for poems with annotations",
    examAlignmentNotes: "55 MCQ in 60 min + 3 FRQs in 120 min. Focus on close reading, evidence, literary argument.",
    stimulusRequirement: "Each MCQ must include a literary excerpt (poem, short fiction, or drama segment).",
    stimulusDescription: "literary excerpt — passage, poem, or drama segment",
    explanationGuidance: "Explanations should cite specific lines and analyze literary techniques.",
  },

  AP_EUROPEAN_HISTORY: {
    name: "AP European History",
    shortName: "AP Euro",
    hidden: true, // Added 2026-04-29 — awaiting full CB material per user directive
    examSecsPerQuestion: 51,
    mockExam: { mcqCount: 55, mcqTimeMinutes: 55 },
    enrichWithEduAPIs: true,
    units: {
      EURO_1_RENAISSANCE_EXPLORATION: { name: "Unit 1: Renaissance and Exploration", keyThemes: ["Italian Renaissance", "Northern Renaissance", "Age of Exploration"] },
      EURO_2_AGE_OF_REFORMATION: { name: "Unit 2: Age of Reformation", keyThemes: ["Protestant Reformation", "Catholic Counter-Reformation", "religious wars"] },
      EURO_3_ABSOLUTISM_CONSTITUTIONALISM: { name: "Unit 3: Absolutism and Constitutionalism", keyThemes: ["French absolutism", "English constitutionalism", "Eastern European states"] },
      EURO_4_SCIENTIFIC_PHILOSOPHICAL_POLITICAL: { name: "Unit 4: Scientific, Philosophical, and Political Developments", keyThemes: ["Scientific Revolution", "Enlightenment", "Enlightened absolutism"] },
      EURO_5_CONFLICT_LATE_18TH_CENTURY: { name: "Unit 5: Conflict, Crisis, and Reaction in the Late 18th Century", keyThemes: ["French Revolution", "Napoleonic Era", "Congress of Vienna"] },
      EURO_6_INDUSTRIALIZATION: { name: "Unit 6: Industrialization and Its Effects", keyThemes: ["Industrial Revolution", "social changes", "ideologies"] },
      EURO_7_19TH_CENTURY_PERSPECTIVES: { name: "Unit 7: 19th-Century Perspectives and Political Developments", keyThemes: ["nationalism", "imperialism", "Romanticism"] },
      EURO_8_20TH_CENTURY_GLOBAL_CONFLICTS: { name: "Unit 8: 20th-Century Global Conflicts", keyThemes: ["WWI", "interwar period", "WWII", "Holocaust"] },
      EURO_9_COLD_WAR_CONTEMPORARY: { name: "Unit 9: Cold War and Contemporary Europe", keyThemes: ["Cold War", "decolonization", "European integration"] },
    },
    suggestedTutorQuestions: ["Compare the French and Industrial Revolutions", "How did nationalism shape 19th-century Europe?"],
    curriculumContext: "AP European History covers ~1450-present in 9 chronological units.",
    tutorResources: "- OpenStax World History (chapters 18-30 for Europe)\n- The Avalon Project for primary documents",
    examAlignmentNotes: "55 MCQ in 55 min + DBQ + LEQ + 3 SAQs. Skill emphasis: contextualization, sourcing, comparison.",
    stimulusRequirement: "Most MCQs should include a primary source quote, image, map, or chart.",
    stimulusDescription: "primary source excerpt, image, map, or chart",
    explanationGuidance: "Explanations should reference the specific time period and historical context.",
  },

  AP_MACROECONOMICS: {
    name: "AP Macroeconomics",
    shortName: "AP Macro",
    hidden: true, // Added 2026-04-29 — awaiting full CB material per user directive
    examSecsPerQuestion: 70,
    mockExam: { mcqCount: 60, mcqTimeMinutes: 70 },
    enrichWithEduAPIs: true,
    units: {
      MACRO_1_BASIC_ECONOMIC_CONCEPTS: { name: "Unit 1: Basic Economic Concepts", keyThemes: ["scarcity", "opportunity cost", "production possibilities", "supply and demand"] },
      MACRO_2_ECONOMIC_INDICATORS_BUSINESS_CYCLE: { name: "Unit 2: Economic Indicators and the Business Cycle", keyThemes: ["GDP", "unemployment", "inflation", "business cycle"] },
      MACRO_3_NATIONAL_INCOME_PRICE: { name: "Unit 3: National Income and Price Determination", keyThemes: ["aggregate demand", "aggregate supply", "fiscal policy", "multipliers"] },
      MACRO_4_FINANCIAL_SECTOR: { name: "Unit 4: Financial Sector", keyThemes: ["money supply", "banking", "Federal Reserve", "monetary policy"] },
      MACRO_5_LONG_RUN_STABILIZATION: { name: "Unit 5: Long-Run Consequences of Stabilization Policies", keyThemes: ["Phillips curve", "long-run growth", "crowding out"] },
      MACRO_6_OPEN_ECONOMY_TRADE: { name: "Unit 6: Open Economy — International Trade and Finance", keyThemes: ["balance of payments", "exchange rates", "trade"] },
    },
    suggestedTutorQuestions: ["Walk me through how the Fed uses monetary policy", "Explain the AD-AS model with examples"],
    curriculumContext: "AP Macroeconomics — 6 units covering basic concepts, indicators, AD/AS, financial sector, long-run policy, open economy.",
    tutorResources: "- OpenStax Principles of Macroeconomics 2e (free)\n- Federal Reserve Economic Data (FRED) for real datasets",
    examAlignmentNotes: "60 MCQ in 70 min + 3 FRQs (1 long, 2 short) in 60 min. Heavy use of graphs.",
    stimulusRequirement: "Many MCQs should include a graph (AD/AS, money market, Phillips curve).",
    stimulusDescription: "economic graph, data table, or scenario description",
    explanationGuidance: "Explanations should walk through graph shifts and identify the variables involved.",
  },

  AP_MICROECONOMICS: {
    name: "AP Microeconomics",
    shortName: "AP Micro",
    hidden: true, // Added 2026-04-29 — awaiting full CB material per user directive
    examSecsPerQuestion: 70,
    mockExam: { mcqCount: 60, mcqTimeMinutes: 70 },
    enrichWithEduAPIs: true,
    units: {
      MICRO_1_BASIC_ECONOMIC_CONCEPTS: { name: "Unit 1: Basic Economic Concepts", keyThemes: ["scarcity", "trade-offs", "opportunity cost", "comparative advantage"] },
      MICRO_2_SUPPLY_AND_DEMAND: { name: "Unit 2: Supply and Demand", keyThemes: ["demand", "supply", "elasticity", "market equilibrium"] },
      MICRO_3_PRODUCTION_PERFECT_COMPETITION: { name: "Unit 3: Production, Cost, and the Perfect Competition Model", keyThemes: ["production function", "costs", "perfect competition"] },
      MICRO_4_IMPERFECT_COMPETITION: { name: "Unit 4: Imperfect Competition", keyThemes: ["monopoly", "monopolistic competition", "oligopoly"] },
      MICRO_5_FACTOR_MARKETS: { name: "Unit 5: Factor Markets", keyThemes: ["labor market", "wages", "rent", "interest"] },
      MICRO_6_MARKET_FAILURE_GOVERNMENT: { name: "Unit 6: Market Failure and the Role of Government", keyThemes: ["externalities", "public goods", "income distribution"] },
    },
    suggestedTutorQuestions: ["Explain firm shutdown vs exit decisions", "How do externalities cause market failure?"],
    curriculumContext: "AP Microeconomics — 6 units covering basic concepts, supply/demand, perfect/imperfect competition, factor markets, market failure.",
    tutorResources: "- OpenStax Principles of Microeconomics 2e (free)\n- Khan Academy AP/College Microeconomics",
    examAlignmentNotes: "60 MCQ in 70 min + 3 FRQs in 60 min. Heavy graph analysis (cost curves, market structures).",
    stimulusRequirement: "Most MCQs should include cost curves, demand graphs, or market scenarios.",
    stimulusDescription: "graph (cost curve, market diagram), data table, or scenario",
    explanationGuidance: "Explanations should reference graph shifts and identify the relevant economic principle.",
  },

  AP_PHYSICS_2: {
    name: "AP Physics 2: Algebra-Based",
    shortName: "AP Physics 2",
    hidden: true, // Added 2026-04-29 — awaiting full CB material per user directive
    examSecsPerQuestion: 96,
    mockExam: { mcqCount: 50, mcqTimeMinutes: 80 },
    enrichWithEduAPIs: true,
    units: {
      PHY2_9_THERMODYNAMICS: { name: "Unit 9: Thermodynamics", keyThemes: ["heat transfer", "ideal gas law", "entropy", "thermal equilibrium"] },
      PHY2_10_ELECTRIC_FORCE_FIELD_POTENTIAL: { name: "Unit 10: Electric Force, Field, and Potential", keyThemes: ["Coulomb's law", "electric field", "electric potential"] },
      PHY2_11_ELECTRIC_CIRCUITS: { name: "Unit 11: Electric Circuits", keyThemes: ["Ohm's law", "Kirchhoff's laws", "RC circuits"] },
      PHY2_12_MAGNETISM_ELECTROMAGNETISM: { name: "Unit 12: Magnetism and Electromagnetism", keyThemes: ["magnetic fields", "Lenz's law", "Faraday's law"] },
      PHY2_13_GEOMETRIC_OPTICS: { name: "Unit 13: Geometric Optics", keyThemes: ["reflection", "refraction", "lenses", "mirrors"] },
      PHY2_14_WAVES_SOUND_PHYSICAL_OPTICS: { name: "Unit 14: Waves, Sound, and Physical Optics", keyThemes: ["wave properties", "interference", "diffraction"] },
      PHY2_15_MODERN_PHYSICS: { name: "Unit 15: Modern Physics", keyThemes: ["photon", "atomic structure", "nuclear physics"] },
    },
    suggestedTutorQuestions: ["Walk me through Kirchhoff's laws with an example circuit", "Explain how lenses form images"],
    curriculumContext: "AP Physics 2: Algebra-Based — 7 units covering thermodynamics, E&M, optics, modern physics.",
    tutorResources: "- OpenStax College Physics 2e (free)\n- PhET Interactive Simulations",
    examAlignmentNotes: "50 MCQ in 80 min + 4 FRQs (quantitative + qualitative + paragraph) in 100 min.",
    stimulusRequirement: "Most MCQs should include a circuit diagram, ray diagram, or experimental setup.",
    stimulusDescription: "circuit diagram, optical setup, data table, or graph",
    explanationGuidance: "Explanations should derive equations and identify the physical principle applied.",
  },

  AP_PHYSICS_C_MECHANICS: {
    name: "AP Physics C: Mechanics",
    shortName: "AP Phys C Mech",
    hidden: true, // Added 2026-04-29 — awaiting full CB material per user directive
    examSecsPerQuestion: 108,
    mockExam: { mcqCount: 35, mcqTimeMinutes: 45 },
    enrichWithEduAPIs: true,
    units: {
      PHYC_M_1_KINEMATICS: { name: "Unit 1: Kinematics", keyThemes: ["calculus-based motion", "velocity", "acceleration"] },
      PHYC_M_2_FORCE_TRANSLATIONAL_DYNAMICS: { name: "Unit 2: Force and Translational Dynamics", keyThemes: ["Newton's laws", "friction", "drag"] },
      PHYC_M_3_WORK_ENERGY_POWER: { name: "Unit 3: Work, Energy, and Power", keyThemes: ["work-energy theorem", "conservation of energy", "power"] },
      PHYC_M_4_LINEAR_MOMENTUM: { name: "Unit 4: Linear Momentum", keyThemes: ["impulse", "collisions", "center of mass"] },
      PHYC_M_5_ROTATION: { name: "Unit 5: Rotation", keyThemes: ["torque", "rotational dynamics", "angular momentum"] },
      PHYC_M_6_OSCILLATIONS: { name: "Unit 6: Oscillations", keyThemes: ["simple harmonic motion", "pendulum", "springs"] },
      PHYC_M_7_GRAVITATION: { name: "Unit 7: Gravitation", keyThemes: ["Newton's law of gravity", "orbital motion", "Kepler's laws"] },
    },
    suggestedTutorQuestions: ["How do I derive a moment of inertia using calculus?", "Walk me through SHM with energy conservation"],
    curriculumContext: "AP Physics C: Mechanics — 7 units, calculus-based mechanics, parallel to AP Physics 1 with calculus rigor.",
    tutorResources: "- MIT OpenCourseWare 8.01 Classical Mechanics\n- HyperPhysics for derivations",
    examAlignmentNotes: "35 MCQ in 45 min + 3 FRQs in 45 min. Calculus is REQUIRED — derivatives and integrals appear throughout.",
    stimulusRequirement: "Many MCQs include diagrams, graphs (especially for energy/momentum), or experimental setups.",
    stimulusDescription: "physics diagram, graph (v-t, F-x, etc), or scenario with given values",
    explanationGuidance: "Explanations should show calculus steps explicitly and identify which conservation law applies.",
  },

  AP_PHYSICS_C_ELECTRICITY_MAGNETISM: {
    name: "AP Physics C: Electricity and Magnetism",
    shortName: "AP Phys C E&M",
    hidden: true, // Added 2026-04-29 — awaiting full CB material per user directive
    examSecsPerQuestion: 108,
    mockExam: { mcqCount: 35, mcqTimeMinutes: 45 },
    enrichWithEduAPIs: true,
    units: {
      PHYC_EM_8_ELECTRIC_CHARGES_FIELDS_GAUSS: { name: "Unit 8: Electric Charges, Fields, and Gauss's Law", keyThemes: ["Coulomb's law", "electric field", "Gauss's law"] },
      PHYC_EM_9_ELECTRIC_POTENTIAL: { name: "Unit 9: Electric Potential", keyThemes: ["potential difference", "potential energy", "equipotential surfaces"] },
      PHYC_EM_10_CONDUCTORS_CAPACITORS: { name: "Unit 10: Conductors and Capacitors", keyThemes: ["capacitance", "dielectrics", "energy storage"] },
      PHYC_EM_11_ELECTRIC_CIRCUITS: { name: "Unit 11: Electric Circuits", keyThemes: ["resistance", "Kirchhoff's laws", "RC circuits"] },
      PHYC_EM_12_MAGNETIC_FIELDS_ELECTROMAGNETISM: { name: "Unit 12: Magnetic Fields and Electromagnetism", keyThemes: ["Biot-Savart law", "Ampere's law", "magnetic force"] },
      PHYC_EM_13_ELECTROMAGNETIC_INDUCTION: { name: "Unit 13: Electromagnetic Induction", keyThemes: ["Faraday's law", "Lenz's law", "inductance"] },
    },
    suggestedTutorQuestions: ["Walk me through using Gauss's law on a charged sphere", "How do I solve an RC circuit using calculus?"],
    curriculumContext: "AP Physics C: Electricity and Magnetism — 6 units, calculus-based E&M.",
    tutorResources: "- MIT OpenCourseWare 8.02 Electricity and Magnetism\n- HyperPhysics E&M section",
    examAlignmentNotes: "35 MCQ in 45 min + 3 FRQs in 45 min. Calculus REQUIRED — line integrals, derivatives appear.",
    stimulusRequirement: "Most MCQs include circuit diagrams, charge configurations, or field-line drawings.",
    stimulusDescription: "circuit diagram, charge geometry, or field configuration",
    explanationGuidance: "Explanations should show calculus steps and identify which fundamental law applies (Gauss/Ampere/Faraday).",
  },

  AP_COMPUTER_SCIENCE_A: {
    name: "AP Computer Science A",
    shortName: "AP CS A",
    hidden: true, // Added 2026-04-29 — awaiting full CB material per user directive
    examSecsPerQuestion: 90,
    mockExam: { mcqCount: 40, mcqTimeMinutes: 90 },
    enrichWithEduAPIs: true,
    units: {
      CSA_1_USING_OBJECTS_METHODS: { name: "Unit 1: Using Objects and Methods", keyThemes: ["primitive types", "objects", "method calls", "string methods"] },
      CSA_2_SELECTION_ITERATION: { name: "Unit 2: Selection and Iteration", keyThemes: ["if statements", "boolean expressions", "while loops", "for loops"] },
      CSA_3_CLASS_CREATION: { name: "Unit 3: Class Creation", keyThemes: ["class definitions", "constructors", "encapsulation", "inheritance"] },
      CSA_4_DATA_COLLECTIONS: { name: "Unit 4: Data Collections", keyThemes: ["arrays", "ArrayLists", "2D arrays", "recursion"] },
    },
    suggestedTutorQuestions: ["Walk me through writing a recursive method", "How do I traverse a 2D array?"],
    curriculumContext: "AP Computer Science A — 4 units in Java covering objects, control flow, classes, data structures.",
    tutorResources: "- The official AP CS A Java Quick Reference\n- Practice-It (UW)",
    examAlignmentNotes: "40 MCQ in 90 min + 4 FRQs in 90 min. All code is in Java; emphasis on tracing and writing.",
    stimulusRequirement: "Most MCQs include a Java code segment to trace, debug, or extend.",
    stimulusDescription: "Java code segment with line numbers",
    explanationGuidance: "Explanations should trace through the code line by line and call out exactly where state changes.",
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// Derived helpers — do NOT hardcode course names outside this file.
// ═════════════════════════════════════════════════════════════════════════════

/**
 * All valid ApCourse values, derived from the registry.
 * Use this in API route validation instead of a hardcoded array.
 */
export const VALID_AP_COURSES = Object.keys(COURSE_REGISTRY) as ApCourse[];

/**
 * Courses visible to NON-ADMIN users. Hides any course where `hidden: true`
 * is set in its CourseConfig. ADMIN callers should use VALID_AP_COURSES
 * directly so they can QA hidden courses before flipping them public.
 *
 * Use this for: sidebar, landing picker, am-i-ready marketing, how-hard-is
 * generateStaticParams, study-plan picker — anywhere a non-admin user sees
 * a course catalog.
 */
export const VISIBLE_AP_COURSES = VALID_AP_COURSES.filter(
  (c) => !COURSE_REGISTRY[c].hidden,
);

/**
 * Role-aware course list. Returns all courses for ADMIN; filtered to visible
 * for everyone else. Use this in server components where `session.user.role`
 * is known.
 */
export function coursesForRole(role: string | undefined | null): ApCourse[] {
  return role === "ADMIN" ? VALID_AP_COURSES : VISIBLE_AP_COURSES;
}

/**
 * Returns the CourseConfig for the given course.
 * Throws if the course is not in the registry (programming error).
 */
export function getCourseConfig(course: ApCourse): CourseConfig {
  const config = COURSE_REGISTRY[course];
  if (!config) throw new Error(`Unknown AP course: ${course}`);
  return config;
}

/**
 * Returns the ApCourse that owns a given unit.
 * Looks up unit membership from the registry — no fragile prefix inference.
 */
export function getCourseForUnit(unit: ApUnit): ApCourse {
  for (const [courseKey, config] of Object.entries(COURSE_REGISTRY) as [ApCourse, CourseConfig][]) {
    if (unit in config.units) return courseKey;
  }
  // Fallback: should never happen if schema and registry are in sync
  return "AP_WORLD_HISTORY";
}

/**
 * Returns all ApUnit keys belonging to a course.
 */
export function getUnitsForCourse(course: ApCourse): ApUnit[] {
  return Object.keys(COURSE_REGISTRY[course].units) as ApUnit[];
}

/** Returns the track a course belongs to. @deprecated Use getCourseModule instead. */
export function getCourseTrack(course: ApCourse): "ap" | "clep" | "dsst" {
  const s = course as string;
  if (s.startsWith("DSST_")) return "dsst";
  return s.startsWith("CLEP_") ? "clep" : "ap";
}

/** Returns the module a course belongs to (5-way: ap, sat, act, clep, dsst). */
export function getCourseModule(course: ApCourse): "ap" | "sat" | "act" | "clep" | "dsst" {
  const s = course as string;
  if (s.startsWith("DSST_")) return "dsst";
  if (s.startsWith("CLEP_")) return "clep";
  if (s.startsWith("SAT_")) return "sat";
  if (s.startsWith("ACT_")) return "act";
  return "ap";
}

/**
 * Resolves mock-exam length + per-question pacing for a given course and mode.
 * Callers should use this instead of reading `mockExam` directly so the Quick
 * Mock pacing stays derived from real exam pacing (per-Q seconds unchanged).
 *
 * mode = "full": use real exam MCQ count + real total minutes.
 * mode = "quick": serve QUICK_MOCK_QUESTIONS (10 Qs) but keep the real per-Q
 *   seconds, so total time scales down proportionally.
 */
export const QUICK_MOCK_QUESTIONS = 10;

export function getMockExamConfig(
  course: ApCourse,
  mode: "full" | "quick"
): { questionCount: number; totalSecs: number; secsPerQuestion: number; mcqCount: number; mcqTimeMinutes: number } {
  const cfg = COURSE_REGISTRY[course];
  const { mcqCount, mcqTimeMinutes } = cfg.mockExam;
  // Always derive per-Q seconds from the real exam pacing — that way a Quick
  // Mock for AP World (60s/Q) feels the same as a Full Section (60s/Q).
  const secsPerQuestion = Math.round((mcqTimeMinutes * 60) / mcqCount);
  if (mode === "full") {
    const totalSecs = mcqTimeMinutes * 60;
    return { questionCount: mcqCount, totalSecs, secsPerQuestion, mcqCount, mcqTimeMinutes };
  }
  const questionCount = Math.min(QUICK_MOCK_QUESTIONS, mcqCount);
  const totalSecs = secsPerQuestion * questionCount;
  return { questionCount, totalSecs, secsPerQuestion, mcqCount, mcqTimeMinutes };
}
