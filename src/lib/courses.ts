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
