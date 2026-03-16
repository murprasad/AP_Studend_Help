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
  /** Sample questions shown in the AI Tutor sidebar */
  suggestedTutorQuestions: string[];
  /**
   * Verbatim curriculum context injected into AI system prompts.
   * Include: units overview, key skills/practices, exam format notes.
   */
  curriculumContext: string;
  /**
   * Resource recommendation paragraph injected into the AI tutor prompt.
   * One bullet per free resource.
   */
  tutorResources: string;
  /**
   * Exam-alignment bullet points for the question-generation prompt.
   * Describes how questions should map to the real AP exam.
   */
  examAlignmentNotes: string;
  /** Describes the stimulus type for question generation + JSON format hint */
  stimulusRequirement: string;
  /** One-liner for the JSON "stimulus" field description */
  stimulusDescription: string;
  /** Describes what the AI explanation should reference */
  explanationGuidance: string;
  /**
   * Whether the AI tutor should fetch live Wikipedia + Library of Congress
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
  },

  // ── AP Computer Science Principles ───────────────────────────────────────
  AP_COMPUTER_SCIENCE_PRINCIPLES: {
    name: "AP Computer Science Principles",
    shortName: "AP CS Principles",
    examSecsPerQuestion: 103, // 70 MCQ in 120 min ≈ 1.7 min/q
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
          '"options":["A) ...","B) ...","C) ...","D) ..."], "correctAnswer":"A", ' +
          '"explanation":"Step-by-step trace or concept explanation referencing AP CSP big ideas"}',
        estimatedMinutes: 3,
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
  },

  // ── AP Physics 1: Algebra-Based ───────────────────────────────────────────
  AP_PHYSICS_1: {
    name: "AP Physics 1: Algebra-Based",
    shortName: "AP Physics 1",
    examSecsPerQuestion: 108, // 50 MCQ in 90 min = 1.8 min/q
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
          '"options":["A) ...","B) ...","C) ...","D) ..."], "correctAnswer":"A", ' +
          '"explanation":"Physics law/principle, equation used, step-by-step solution if calculation"}',
        estimatedMinutes: 3,
      },
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
      PHY1_8_ELECTRIC_CHARGE_AND_FORCE: {
        name: "Unit 8: Electric Charge and Electric Force",
        keyThemes: ["Charge", "Coulomb's Law", "Electric Fields"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-8",
        phetUrl: "https://phet.colorado.edu/en/simulations/coulombs-law",
        khanUrl: "https://www.khanacademy.org/science/ap-physics-1/ap-electric-charge-electric-force-and-voltage",
        ck12Url: "https://www.ck12.org/section/electric-charge",
        openStaxUrl: "https://openstax.org/books/university-physics-vol-2/pages/5-introduction",
      },
      PHY1_9_DC_CIRCUITS: {
        name: "Unit 9: DC Circuits",
        keyThemes: ["Current", "Voltage", "Resistance", "Ohm's Law", "Series/Parallel Circuits", "Power"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-9",
        phetUrl: "https://phet.colorado.edu/en/simulations/circuit-construction-kit-dc",
        khanUrl: "https://www.khanacademy.org/science/ap-physics-1/ap-circuits-topic",
        ck12Url: "https://www.ck12.org/section/electric-circuits",
        openStaxUrl: "https://openstax.org/books/university-physics-vol-2/pages/10-introduction",
      },
      PHY1_10_WAVES_AND_SOUND: {
        name: "Unit 10: Mechanical Waves and Sound",
        keyThemes: ["Wave Properties", "Interference", "Standing Waves", "Sound"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-10",
        mitocwUrl: "https://ocw.mit.edu/courses/8-03sc-physics-iii-vibrations-and-waves-fall-2016/pages/part-i-mechanical-vibrations-and-waves/",
        phetUrl: "https://phet.colorado.edu/en/simulations/wave-on-a-string",
        khanUrl: "https://www.khanacademy.org/science/ap-physics-1/ap-mechanical-waves-and-sound",
        ck12Url: "https://www.ck12.org/section/waves",
        openStaxUrl: "https://openstax.org/books/university-physics-vol-1/pages/16-introduction",
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
  },

  // ── AP Calculus AB ────────────────────────────────────────────────────────
  AP_CALCULUS_AB: {
    name: "AP Calculus AB",
    shortName: "AP Calculus AB",
    examSecsPerQuestion: 96, // 45 MCQ in 105 min (Section I), plus FRQ
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
        name: "Unit 9: Applications of Thermodynamics",
        keyThemes: ["electrochemical cells", "standard reduction potentials", "Nernst equation", "electrolysis", "cell potential"],
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
- Unit 9: Electrochemistry — cell potential, Nernst, electrolysis

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
    examSecsPerQuestion: 66, // 100 MCQ in 70 min
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
