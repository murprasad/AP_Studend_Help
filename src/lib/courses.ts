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
  /** Official College Board links shown on the Resources page */
  collegeBoardLinks?: Array<{ label: string; url: string }>;
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

Key resources: College Board AP Central, OER Project World History, Fiveable AP World History, Heimler's History (YouTube), Zinn Education Project
`,

    tutorResources: `
When referencing resources:
- Heimler's History (YouTube): Great for visual reviews of each unit
- Khan Academy: Free videos and articles on all topics
- Fiveable: Excellent study guides and key concept summaries
- OER Project: Primary sources and in-depth readings
- College Board AP Central: Official exam info and sample questions
- Zinn Education Project: Alternative perspectives and primary sources
- Wikipedia: Quick facts and article overviews on any historical topic
- Library of Congress (loc.gov): Free primary source documents, maps, and photographs`,

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
  },

  // ── AP Computer Science Principles ───────────────────────────────────────
  AP_COMPUTER_SCIENCE_PRINCIPLES: {
    name: "AP Computer Science Principles",
    shortName: "AP CS Principles",
    examSecsPerQuestion: 103, // 70 MCQ in 120 min ≈ 1.7 min/q
    enrichWithEduAPIs: false,

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
  },

  // ── AP Physics 1: Algebra-Based ───────────────────────────────────────────
  AP_PHYSICS_1: {
    name: "AP Physics 1: Algebra-Based",
    shortName: "AP Physics 1",
    examSecsPerQuestion: 108, // 50 MCQ in 90 min = 1.8 min/q
    enrichWithEduAPIs: false,

    units: {
      PHY1_1_KINEMATICS: {
        name: "Unit 1: Kinematics",
        keyThemes: ["Displacement", "Velocity", "Acceleration", "Motion Graphs", "Projectile Motion"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-1",
      },
      PHY1_2_FORCES_AND_NEWTONS_LAWS: {
        name: "Unit 2: Forces and Newton's Laws",
        keyThemes: ["Newton's Three Laws", "Free Body Diagrams", "Friction", "Tension", "Normal Force"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-2",
      },
      PHY1_3_CIRCULAR_MOTION_GRAVITATION: {
        name: "Unit 3: Circular Motion and Gravitation",
        keyThemes: ["Centripetal Acceleration", "Gravitational Force", "Orbital Motion"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-3",
      },
      PHY1_4_ENERGY: {
        name: "Unit 4: Energy",
        keyThemes: ["Work", "Kinetic Energy", "Potential Energy", "Conservation of Energy", "Power"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-4",
      },
      PHY1_5_MOMENTUM: {
        name: "Unit 5: Momentum",
        keyThemes: ["Impulse", "Linear Momentum", "Conservation of Momentum", "Collisions"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-5",
      },
      PHY1_6_SIMPLE_HARMONIC_MOTION: {
        name: "Unit 6: Simple Harmonic Motion",
        keyThemes: ["Springs", "Pendulums", "Period", "Frequency", "Amplitude"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-6",
      },
      PHY1_7_TORQUE_AND_ROTATION: {
        name: "Unit 7: Torque and Rotational Motion",
        keyThemes: ["Torque", "Rotational Inertia", "Angular Momentum"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-7",
      },
      PHY1_8_ELECTRIC_CHARGE_AND_FORCE: {
        name: "Unit 8: Electric Charge and Electric Force",
        keyThemes: ["Charge", "Coulomb's Law", "Electric Fields"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-8",
      },
      PHY1_9_DC_CIRCUITS: {
        name: "Unit 9: DC Circuits",
        keyThemes: ["Current", "Voltage", "Resistance", "Ohm's Law", "Series/Parallel Circuits", "Power"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-9",
      },
      PHY1_10_WAVES_AND_SOUND: {
        name: "Unit 10: Mechanical Waves and Sound",
        keyThemes: ["Wave Properties", "Interference", "Standing Waves", "Sound"],
        fiveableUrl: "https://library.fiveable.me/ap-physics-1/unit-10",
      },
    },

    suggestedTutorQuestions: [
      "Explain Newton's three laws of motion with examples",
      "What is the difference between speed and velocity?",
      "How does conservation of energy work?",
      "Explain the difference between elastic and inelastic collisions",
      "What is centripetal acceleration?",
      "How do series and parallel circuits differ?",
      "Explain simple harmonic motion for a spring-mass system",
      "What is the relationship between frequency and wavelength for waves?",
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
`,

    tutorResources: `
When referencing resources:
- Khan Academy AP Physics 1: Free videos, articles, and practice problems
- Flipping Physics (YouTube): Excellent conceptual and worked example videos
- Professor Leonard (YouTube): Comprehensive supplement
- Fiveable AP Physics 1: Study guides and key concept summaries
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
