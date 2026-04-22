import { createHash } from "crypto";
import { ApUnit, ApCourse, Difficulty, QuestionType } from "@prisma/client";
import { COURSE_UNITS } from "./utils";
import { COURSE_REGISTRY, getCourseForUnit } from "./courses";
import { callAIWithCascade, callAIForTier, callAIForCLEP, callSonnetDirect, validateQuestion, AICallResult } from "./ai-providers";
import { prisma } from "./prisma";
import { getWikipediaSummary, getEduContextForQuery, searchStackExchange, getEnrichedContext, fetchMITOCWContent, fetchDIGContent, fetchOpenStaxContent, fetchSmithsonianContent, fetchCollegeBoardSATTopics, fetchACTTopics, fetchCBFRQContent, getCBFRQUrl, fetchKhanAcademyContext } from "./edu-apis";

// ── Unified helpers (thin wrappers over the cascade engine) ────────────────
async function callAI(prompt: string, systemPrompt?: string): Promise<string> {
  return callAIWithCascade(prompt, systemPrompt);
}

async function callAIChat(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  systemPrompt: string
): Promise<string> {
  const history = messages.slice(0, -1);
  const lastMsg = messages[messages.length - 1];
  return callAIWithCascade(lastMsg.content, systemPrompt, history);
}

// Course contexts and tutor resources live in src/lib/courses.ts (COURSE_REGISTRY).
// Access them via: COURSE_REGISTRY[course].curriculumContext / .tutorResources

export interface GeneratedQuestion {
  unit: ApUnit;
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  questionType: QuestionType;
  questionText: string;
  stimulus?: string;
  stimulusImageUrl?: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  estimatedMinutes: number;
  modelUsed?: string;
  generatedForTier?: "FREE" | "PREMIUM";
  apSkill?: string;
  contentHash?: string;
  bloomLevel?: string;
}

// ── Fetch web content from open educational resources ──────────────────────
async function fetchResourceContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; StudentNest/1.0; Educational)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return "";
    const html = await response.text();
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000);
  } catch {
    return "";
  }
}

// Get unit-specific curriculum context from open resources
async function getUnitContext(unit: ApUnit): Promise<string> {
  const course = getCourseForUnit(unit);
  const unitMeta = COURSE_REGISTRY[course]?.units[unit];
  if (!unitMeta) return "";

  const isSTEM = course === "AP_PHYSICS_1" || course === "AP_COMPUTER_SCIENCE_PRINCIPLES";
  const seSite = course === "AP_PHYSICS_1" ? "physics" : "cs";
  const searchQuery = unitMeta.keyThemes?.slice(0, 2).join(" ") || unitMeta.name;

  const context = [
    `Unit: ${unitMeta.name}${unitMeta.timePeriod ? ` (${unitMeta.timePeriod})` : ""}`,
    unitMeta.keyThemes?.length ? `Key Themes: ${unitMeta.keyThemes.join(", ")}` : "",
    "Sources: College Board AP Central, Wikipedia, Library of Congress, Stack Exchange (CC BY-SA), Reddit AP Communities",
  ].filter(Boolean).join("\n");

  const openStaxSubject = COURSE_REGISTRY[course]?.openStaxSubject;
  const useSmithsonian = course === "AP_WORLD_HISTORY";

  // Fetch content in parallel from all available free sources
  const [fiveableContent, wikiResult, seResults, mitocwContent, digContent, openStaxContent, smithsonianContent] = await Promise.allSettled([
    unitMeta.fiveableUrl ? fetchResourceContent(unitMeta.fiveableUrl) : Promise.resolve(""),
    isSTEM ? Promise.resolve(null) : getWikipediaSummary(unitMeta.name.replace(/Unit \d+: /, "")),
    isSTEM ? searchStackExchange(searchQuery, seSite, 3) : Promise.resolve([]),
    // MIT OCW for Physics — live static HTML fetch
    unitMeta.mitocwUrl ? fetchMITOCWContent(unitMeta.mitocwUrl) : Promise.resolve(""),
    // Digital Inquiry Group for World History — live static HTML fetch
    unitMeta.digUrl ? fetchDIGContent(unitMeta.digUrl, searchQuery) : Promise.resolve(""),
    // OpenStax curriculum content
    openStaxSubject ? fetchOpenStaxContent(searchQuery, openStaxSubject) : Promise.resolve(""),
    // Smithsonian for World History primary source context
    useSmithsonian ? fetchSmithsonianContent(searchQuery, 2) : Promise.resolve(""),
  ]);

  let enriched = context;
  if (fiveableContent.status === "fulfilled" && fiveableContent.value) {
    enriched += `\nFiveable curriculum content:\n${fiveableContent.value.slice(0, 800)}`;
  }
  if (wikiResult.status === "fulfilled" && wikiResult.value?.summary) {
    enriched += `\nWikipedia overview:\n${wikiResult.value.summary.slice(0, 400)}`;
  }
  if (seResults.status === "fulfilled" && seResults.value.length > 0) {
    enriched += `\nStack Exchange community Q&A (CC BY-SA):\n${seResults.value
      .map((s) => `• ${s.title}: ${s.body}`)
      .join("\n").slice(0, 600)}`;
  }
  if (mitocwContent.status === "fulfilled" && mitocwContent.value) {
    enriched += `\nMIT OpenCourseWare 8.01SC lesson content:\n${mitocwContent.value.slice(0, 700)}`;
  }
  if (digContent.status === "fulfilled" && digContent.value) {
    enriched += `\nDigital Inquiry Group (Stanford) historical thinking context:\n${digContent.value.slice(0, 600)}`;
  }
  if (openStaxContent.status === "fulfilled" && openStaxContent.value) {
    enriched += `\nOpenStax curriculum content (open license):\n${openStaxContent.value.slice(0, 500)}`;
  }
  if (smithsonianContent.status === "fulfilled" && smithsonianContent.value) {
    enriched += `\nSmithsonian collections (open access):\n${smithsonianContent.value.slice(0, 400)}`;
  }
  // SAT courses: inject static College Board topic context + Khan Academy context
  if (course === "SAT_MATH" || course === "SAT_READING_WRITING") {
    const satContext = fetchCollegeBoardSATTopics(unit);
    if (satContext) enriched += `\nCollege Board SAT Curriculum Guide:\n${satContext}`;
    // Khan Academy context enrichment (fails silently if unavailable)
    const kaContext = await fetchKhanAcademyContext(searchQuery, course).catch(() => "");
    if (kaContext) enriched += `\n${kaContext}`;
  }
  // ACT courses: inject static ACT topic context
  if (course === "ACT_MATH" || course === "ACT_ENGLISH" ||
      course === "ACT_SCIENCE" || course === "ACT_READING") {
    const actContext = fetchACTTopics(unit);
    if (actContext) enriched += `\nACT Curriculum Guide:\n${actContext}`;
  }
  // AP courses with CB FRQ catalog entries: inject FRQ seed context (Phase 4)
  const cbFrqUrl = getCBFRQUrl(course);
  if (cbFrqUrl) {
    const frqContext = await fetchCBFRQContent(cbFrqUrl).catch(() => "");
    if (frqContext && frqContext.length > 50) {
      enriched += `\nCollege Board Official FRQ Seed (public domain — use as style/difficulty reference only, generate a DIFFERENT question):\n${frqContext.slice(0, 800)}`;
    }
  }
  return enriched;
}

// ── Question generation prompt — data-driven via COURSE_REGISTRY ───────────
// To customise for a new course, update examAlignmentNotes / stimulusRequirement
// / stimulusDescription / explanationGuidance in that course's CourseConfig.

export function buildQuestionPrompt(
  course: ApCourse,
  unit: ApUnit,
  unitName: string,
  difficulty: Difficulty,
  questionType: QuestionType,
  topic?: string
): string {
  const config = COURSE_REGISTRY[course];
  const unitMeta = config.units[unit];
  const typeFormat = config.questionTypeFormats?.[questionType];

  const unitHeader = [
    `Unit: ${unitName}${unitMeta?.timePeriod ? ` (${unitMeta.timePeriod})` : ""}`,
    unitMeta?.keyThemes?.length ? `Key Themes for this unit: ${unitMeta.keyThemes.join(", ")}` : "",
    `Difficulty: ${difficulty}`,
    `Question Type: ${questionType}`,
    `Topic: ${topic ? `specifically about: ${topic}` : "any major theme from this unit"}`,
  ].filter(Boolean).join("\n");

  // Use type-specific format if available, else fall back to MCQ defaults
  const generationInstruction = typeFormat?.generationPrompt
    ?? `Create a College Board-style multiple choice question. ${config.stimulusRequirement}. Provide exactly 4 answer choices labeled A, B, C, D. Only one correct answer. Explanation should ${config.explanationGuidance}`;

  const responseFormat = typeFormat?.responseFormat
    ?? `{"topic":"specific topic name","subtopic":"specific subtopic","apSkill":"the primary AP skill tested (e.g. Causation, Comparison, Data Analysis, Argumentation)","bloomLevel":"remember | apply | analyze","questionText":"the question text","stimulus":"${config.stimulusDescription}","options":["A) option text","B) option text","C) option text","D) option text"],"correctAnswer":"A","explanation":"detailed explanation ${config.explanationGuidance}"}`;

  const difficultySection = config.difficultyRubric?.[difficulty]
    ? `\nDIFFICULTY DEFINITION (${difficulty}):\n${config.difficultyRubric[difficulty]}`
    : "";

  const skillsSection = config.skillCodes?.length
    ? `\nAP SKILLS TO TEST (choose the most relevant one):\n${config.skillCodes.join(" | ")}`
    : "";

  const stimulusSection = `\nSTIMULUS QUALITY STANDARD:\n${config.stimulusQualityGuidance ?? config.stimulusRequirement}`;

  const distractorSection = `\nDISTRACTOR CONSTRUCTION RULES:\n${config.distractorTaxonomy ?? "Each wrong answer should represent a distinct common misconception."}`;

  // Universal anti-ambiguity guardrail — added 2026-04-22 after Reddit-type
  // complaints on live content and a post-generation spot-check showed 2/3
  // sampled questions used "primary" / superlative framings that permit
  // multiple defensible answers. This section is appended to EVERY prompt
  // (not just the new 2026 catalog courses) so quality improves across the
  // whole bank the next time we sweep-regenerate.
  const ambiguityGuardSection = `
UNAMBIGUITY REQUIREMENT (MANDATORY — violation = rejection):
- The correct answer must be DEFINITIVELY correct; each distractor must be DEFINITIVELY incorrect on factual / doctrinal / procedural grounds.
- NEVER write questions with "primary", "main", "most important", "best example of", "chief purpose", or any other superlative framing UNLESS the correct answer is explicitly singled out by a specific CED content standard, named case / document, or named theory.
  * WRONG: "What is the primary responsibility of the Senate?" (ratifying treaties, impeachment trials, and confirming appointments are ALL Senate responsibilities).
  * RIGHT: "According to Article I, Section 3 of the Constitution, who has the sole power to conduct impeachment trials of federal officials?" (one textual answer).
- Before finalizing, read each distractor as if it WERE the answer. If a defensible argument exists that it is also correct, rewrite the stem to be more specific — cite the exact case, document, formula, or process that disambiguates.
- Reject the whole question and regenerate if two or more options are both partially correct given the stem as written. This is the single largest source of student complaints; do not ship ambiguous questions.`;

  const wordCountSection = `\nWORD COUNT TARGETS:\n- questionText: 15–40 words\n- stimulus: 40–120 words (or null if not applicable)\n- each option: 8–25 words\n- explanation: 80–150 words (name the correct answer + explain each distractor's trap)`;

  // SAT-specific format rules injected after the standard sections
  const satFormatSection = (course === "SAT_MATH" || course === "SAT_READING_WRITING")
    ? `\nSAT FORMAT RULES:
- Exactly 4 answer choices labeled A, B, C, D (no E, no "All of the above", no "None of the above")
- SAT Math: describe figures numerically or with coordinates — no diagrams in text
- SAT Reading/Writing: ALWAYS start the "stimulus" field with a 2-4 sentence passage excerpt
- Distractors must reflect common student errors (sign errors, misread transitions, wrong word meanings)
- Difficulty mapping: EASY = score range 800–900, MEDIUM = 900–1100, HARD = 1200+
- Vary question stems — do not use "Which of the following" as the only phrasing`
    : "";

  // ACT-specific format rules
  const actFormatSection = (course === "ACT_MATH" || course === "ACT_ENGLISH" ||
    course === "ACT_SCIENCE" || course === "ACT_READING")
    ? `\nACT FORMAT RULES:
- ACT Math: EXACTLY 5 answer choices labeled A, B, C, D, E — never 4
- ACT English: ALWAYS include 1-3 passage sentences as "stimulus"; question is embedded in editorial context
- ACT Science: ALWAYS include a data table (pipe-delimited) or experimental summary as "stimulus"
- ACT Reading: ALWAYS include a 5-8 sentence passage excerpt as "stimulus"; no outside knowledge tested
- Difficulty: EASY = ACT score 1-16, MEDIUM = 17-24, HARD = 25-36
- Vary question stems — not just "Which of the following"`
    : "";

  // CLEP-specific quality standards
  const isCLEP = (course as string).startsWith("CLEP_");
  const clepSection = isCLEP ? `
CLEP EXAM STANDARDS (College Board level):
- CLEP questions test UNDERSTANDING and APPLICATION, rarely pure recall
- 80% of questions MUST be scenario-based: "A researcher observes...", "A company decides...", "A student reads..."
- DO NOT generate "What is X?" or "Define Y" questions — these fail CLEP standards
- Correct answer is the BEST answer among plausible options
- Reading level: first-year college student (clear, accessible, no unnecessary jargon)
- Time target: solvable in 60-90 seconds by a prepared student

DISTRACTOR CONSTRUCTION (mandatory for CLEP):
- Option A (correct): Clearly best answer when analyzed carefully
- Option B (distractor): Correct concept, wrong application (partial understanding trap)
- Option C (distractor): Related but different concept (similar-term confusion)
- Option D (distractor): Common misconception or oversimplification
- Each distractor MUST represent a DISTINCT error type — no two testing the same mistake

EXPLANATION REQUIREMENTS:
- Explain WHY the correct answer is right (cite the principle/theory)
- Explain WHY each distractor is wrong (name the specific error)
- The explanation should TEACH the concept, not just confirm the answer

CLEP DIFFICULTY CALIBRATION:
- Passing: ~60-65% correct answers needed
- EASY (30%): Textbook-reader level, single concept application
- MEDIUM (50%): Apply concept to unfamiliar scenario, requires reasoning
- HARD (20%): Distinguish between similar concepts in ambiguous context

BLOOM'S TAXONOMY REQUIREMENT (critical for CLEP realism):
- 20% of questions: Remember/Understand — identify, define, describe a concept
- 50% of questions: Apply — use a concept in a new, unfamiliar scenario
- 30% of questions: Analyze/Evaluate — compare concepts, distinguish similar theories, assess outcomes
For THIS question, select the appropriate Bloom's level and include it in your JSON as: "bloomLevel": "remember" | "apply" | "analyze"

DATA INTERPRETATION (10-15% of social science CLEPs):
- Some questions SHOULD present a small data table, survey result, or statistical finding as stimulus
- Format tables using pipe-delimited markdown: | Header1 | Header2 |
- Ask the student to interpret, compare, or draw conclusions from the data

DISTRACTOR STRATEGY (misconception-first):
- Before writing options, identify 3 common student MISCONCEPTIONS about the topic
- Each wrong answer must represent a DISTINCT misconception a real student would hold
- Do NOT create "obviously wrong" distractors — every option must be tempting to an underprepared student

${config.examAlignmentNotes ? `EXAM CONTENT WEIGHTS:\n${config.examAlignmentNotes}` : ""}
` : "";

  return `You are an ${config.name} exam question generator trained on College Board ${config.name} curriculum standards.

${unitHeader}

${config.examAlignmentNotes}${difficultySection}${skillsSection}${stimulusSection}${distractorSection}${ambiguityGuardSection}${wordCountSection}${satFormatSection}${actFormatSection}${clepSection}

GENERATION TASK:
${generationInstruction}

Return ONLY a JSON object (no markdown, no extra text):
${responseFormat}${isCLEP ? `\n\nCLEP ADDITIONAL FIELDS — include these in your JSON:\n"bloomLevel": "remember" | "apply" | "analyze"\n"misconceptionsTested": ["misconception distractor B targets", "misconception distractor C targets", "misconception distractor D targets"]` : ""}`;
}

// ── Question Generation ────────────────────────────────────────────────────
export async function generateQuestion(
  unit: ApUnit,
  difficulty: Difficulty,
  questionType: QuestionType = QuestionType.MCQ,
  topic?: string,
  course?: ApCourse,
  userTier: "FREE" | "PREMIUM" = "FREE",
  seedQuestion?: string,
  quickMode: boolean = false,  // skip validation + CB FRQ fetch for on-demand speed
  opts?: { generatorOverride?: "sonnet" }  // bulk admin: force Anthropic Sonnet generator (validator auto-switches to Haiku)
): Promise<GeneratedQuestion> {
  const inferredCourse = course || getCourseForUnit(unit);
  const unitName = COURSE_REGISTRY[inferredCourse].units[unit]?.name || unit;

  // ── Topic saturation guard: rotate away from over-represented topics ───────
  // Raised to 15 for PrepLion-scale banks (~500 Qs/subject). At 5 themes × 15 = 75/unit ceiling
  // before rotation kicks in — enough headroom to let AI pick varied sub-angles within a theme.
  const MAX_PER_TOPIC = 15;
  if (topic) {
    try {
      const topicCount = await prisma.question.count({
        where: { course: inferredCourse, unit, topic: { contains: topic, mode: "insensitive" } },
      });
      if (topicCount >= MAX_PER_TOPIC) {
        const config = COURSE_REGISTRY[inferredCourse];
        const unitMeta = config.units[unit];
        const themes = unitMeta?.keyThemes ?? [];
        // Pick the first theme that differs from the saturated topic
        topic = themes.find((t) => !t.toLowerCase().includes(topic!.toLowerCase())) ?? undefined;
      }
    } catch {
      // DB error — continue with original topic
    }
  }

  const basePrompt = buildQuestionPrompt(inferredCourse, unit, unitName, difficulty, questionType, topic);

  // Phase 4: Optionally inject CB FRQ seed context for AP courses that have public FRQs
  // Fetch in parallel with a 6s timeout; fails silently if unavailable.
  // Skipped in quickMode (on-demand practice) to avoid adding latency for the student.
  let cbFrqSeedSection = "";
  const cbFrqUrl = !quickMode && getCBFRQUrl(inferredCourse);
  if (cbFrqUrl) {
    try {
      const frqText = await Promise.race([
        fetchCBFRQContent(cbFrqUrl),
        new Promise<string>((resolve) => setTimeout(() => resolve(""), 6000)),
      ]);
      if (frqText && frqText.length > 50) {
        cbFrqSeedSection = `\n\nCOLLEGE BOARD OFFICIAL FRQ REFERENCE (public domain — use for style/difficulty calibration only):\n"${frqText.slice(0, 600)}"\nGenerate a DIFFERENT question inspired by this style and difficulty. Do NOT copy the scenario.`;
      }
    } catch {
      // Fail silently — question generation continues without seed
    }
  }

  // CLEP calibration examples (style reference)
  let clepCalibrationSection = "";
  if ((inferredCourse as string).startsWith("CLEP_") && !quickMode) {
    try {
      const { CLEP_CALIBRATION } = await import("./clep-calibration");
      const examples = CLEP_CALIBRATION[inferredCourse as string];
      if (examples && examples.length > 0) {
        // Inject 2 random examples (if available) for stronger style/difficulty anchoring
        const shuffled = [...examples].sort(() => Math.random() - 0.5);
        const samples = shuffled.slice(0, Math.min(2, shuffled.length));
        const exampleText = samples.map((s, i) => `Example ${i + 1}: "${s}"`).join("\n");
        clepCalibrationSection = `\n\nCALIBRATION EXAMPLES (match this style and difficulty):\n${exampleText}\n\nGenerate a DIFFERENT question at the SAME quality level. Do NOT copy these scenarios or wording.`;
      }
    } catch {
      // clep-calibration module not available — continue without examples
    }
  }

  // AP calibration examples (style reference) — covers AP World History, AP CSP, AP Physics 1
  let apCalibrationSection = "";
  const AP_CALIBRATION_COURSES = new Set([
    "AP_WORLD_HISTORY",
    "AP_COMPUTER_SCIENCE_PRINCIPLES",
    "AP_PHYSICS_1",
    "AP_US_HISTORY",   // added 2026-04-17 — see docs/ap-refs/us-history/
    "AP_STATISTICS",   // added 2026-04-17 — see docs/ap-refs/statistics/
  ]);
  if (AP_CALIBRATION_COURSES.has(inferredCourse as string) && !quickMode) {
    try {
      const { AP_CALIBRATION } = await import("./ap-calibration");
      const examples = AP_CALIBRATION[inferredCourse as string];
      if (examples && examples.length > 0) {
        // Inject 2 random examples for stronger CB style/difficulty anchoring
        const shuffled = [...examples].sort(() => Math.random() - 0.5);
        const samples = shuffled.slice(0, Math.min(2, shuffled.length));
        const exampleText = samples.map((s, i) => `Example ${i + 1}: "${s}"`).join("\n");
        apCalibrationSection = `\n\nCOLLEGE BOARD STYLE CALIBRATION (match the stem pattern, stimulus depth, and cognitive level):\n${exampleText}\n\nGenerate a DIFFERENT question at the SAME quality level. Do NOT copy these scenarios, wording, dates, or numbers — paraphrase fully.`;
      }
    } catch {
      // ap-calibration module not available — continue without examples
    }
  }

  // AP grounding — fetch free educational content (Wikipedia/OpenStax/MIT OCW/DIG/Smithsonian)
  // for factual accuracy. Capped at 6s to avoid slowing generation.
  let apGroundingSection = "";
  if (AP_CALIBRATION_COURSES.has(inferredCourse as string) && !quickMode) {
    try {
      const grounding = await Promise.race([
        getUnitContext(unit),
        new Promise<string>((resolve) => setTimeout(() => resolve(""), 6000)),
      ]);
      if (grounding && grounding.length > 200) {
        const trimmed = grounding.slice(0, 2500);
        apGroundingSection = `\n\nGROUNDED REFERENCE MATERIAL (from free educational sources — Wikipedia CC BY-SA, OpenStax CC BY, MIT OCW CC BY, Library of Congress):\n${trimmed}\n\nCRITICAL: Your question's content, correct answer, and explanation MUST be factually consistent with this authoritative source. Do NOT fabricate primary source quotes, dates, or data. Paraphrase — do not copy.`;
      }
    } catch {
      // Grounding fetch failed — continue without it (not a blocker)
    }
  }

  // CLEP OpenStax content grounding — fetch unit-specific textbook content for factual accuracy
  let openStaxGroundingSection = "";
  if ((inferredCourse as string).startsWith("CLEP_") && !quickMode) {
    const unitMeta = COURSE_REGISTRY[inferredCourse].units[unit];
    const openStaxUrl = unitMeta?.openStaxUrl;
    if (openStaxUrl) {
      try {
        const res = await Promise.race([
          fetch(openStaxUrl, {
            headers: { "User-Agent": "StudentNest/1.0 (Educational CLEP Prep)", Accept: "text/html" },
            signal: AbortSignal.timeout(3000),
          }),
          new Promise<Response>((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
        ]);
        if (res.ok) {
          const html = await res.text();
          // Extract text content from HTML (strip tags, keep first 500 chars of body content)
          const bodyMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) || html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          if (bodyMatch) {
            const text = bodyMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
            if (text.length > 100) {
              openStaxGroundingSection = `\n\nTEXTBOOK REFERENCE (OpenStax, CC BY 4.0 — use for factual accuracy, do NOT copy verbatim):\n"${text}"\nEnsure your question's content and correct answer are consistent with this authoritative source.`;
            }
          }
        }
      } catch {
        // OpenStax fetch failed — continue without grounding (no impact on generation)
      }
    }
  }

  const allEnrichments = `${cbFrqSeedSection}${clepCalibrationSection}${apCalibrationSection}${apGroundingSection}${openStaxGroundingSection}`;
  const prompt = seedQuestion
    ? `${basePrompt}${allEnrichments}\n\nREFERENCE QUESTION (for style/difficulty calibration — generate something DIFFERENT):\n"${seedQuestion}"\n\nGenerate a new question on the SAME concept with entirely different numbers, context, and scenario. Do NOT reuse the same values or phrasing from the reference.`
    : allEnrichments
    ? `${basePrompt}${allEnrichments}`
    : basePrompt;

  // FRQ/open-ended types have no distractors — skip validator (saves ~10s/attempt).
  // Also skip in quickMode (on-demand practice) — speed > perfection for live sessions.
  const needsValidation = !quickMode && !["FRQ", "SAQ", "DBQ", "LEQ", "CODING"].includes(questionType ?? "");

  // CLEP quickMode gets more attempts since validation is skipped (each attempt is fast ~3-5s)
  const isCLEPCourse = (inferredCourse as string).startsWith("CLEP_");
  const MAX_GEN_ATTEMPTS = (isCLEPCourse && quickMode) ? 5 : 3;
  let aiResult: AICallResult | null = null;
  let parsed: Record<string, unknown> | null = null;
  let lastError = "";
  let lastRejectionReason = "";

  for (let attempt = 1; attempt <= MAX_GEN_ATTEMPTS; attempt++) {
    try {
      // On retry, append the previous rejection reason so the model can self-correct
      const retryFeedback = attempt > 1 && lastRejectionReason
        ? `\n\nPREVIOUS ATTEMPT FAILED VALIDATION:\n"${lastRejectionReason}"\nFix this specific issue in your new generation. Do NOT repeat the same error.`
        : "";
      const attemptPrompt = prompt + retryFeedback;

      // Routing:
      //   - generatorOverride="sonnet" (bulk admin): direct Anthropic Sonnet — highest yield on strict v2 validator
      //   - CLEP + !quickMode: CLEP-specific cascade with full quality pipeline
      //   - everything else: standard tier cascade (faster, Groq-first)
      const raw = opts?.generatorOverride === "sonnet"
        ? await callSonnetDirect(attemptPrompt)
        : (isCLEPCourse && !quickMode)
          ? await callAIForCLEP(attemptPrompt)
          : await callAIForTier(userTier, attemptPrompt);
      const rawText = raw.response.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
      const candidate = JSON.parse(rawText) as Record<string, unknown>;

      // Structural checks (cheap, run before LLM validator) — catches CB-format violations
      if (needsValidation && questionType === QuestionType.MCQ) {
        const isAP = (inferredCourse as string).startsWith("AP_");
        const isACTMath = inferredCourse === "ACT_MATH";
        const expectedOptions = isACTMath ? 5 : (isAP ? 4 : 4);
        const opts = candidate.options;
        const qtStr = String(candidate.questionText ?? "");
        const stimStr = candidate.stimulus && candidate.stimulus !== "null" ? String(candidate.stimulus) : "";
        const explStr = String(candidate.explanation ?? "");

        if (!Array.isArray(opts) || opts.length !== expectedOptions) {
          lastRejectionReason = `MCQ must have exactly ${expectedOptions} options, got ${Array.isArray(opts) ? opts.length : "none"}`;
          lastError = lastRejectionReason;
          continue;
        }
        const refsPseudo = /\bpseudocode|\bcode (segment|block|below)|trace (the |this )(following |below )?(pseudo)?code/i.test(qtStr);
        if (refsPseudo && !/\b(PROCEDURE|DISPLAY|INPUT|IF|REPEAT|FOR EACH|RETURN|<-|←)\b/.test(stimStr)) {
          lastRejectionReason = "Question references pseudocode but stimulus lacks AP pseudocode syntax (PROCEDURE/DISPLAY/REPEAT/IF/etc.)";
          lastError = lastRejectionReason;
          continue;
        }
        const refsPassage = /\b(excerpt|passage|letter|document|source|author|text) (above|below|shown)|the (passage|excerpt|source|document) (above|below)/i.test(qtStr);
        if (refsPassage && stimStr.length < 40) {
          lastRejectionReason = "Question references a passage/excerpt but stimulus is missing or too short (need ≥40 chars)";
          lastError = lastRejectionReason;
          continue;
        }
        const refsDiagram = /\b(graph|chart|diagram|figure|table|free-body|FBD) (above|below|shown)/i.test(qtStr);
        if (refsDiagram && stimStr.length < 10) {
          lastRejectionReason = "Question references a diagram/graph/table but no visual stimulus provided";
          lastError = lastRejectionReason;
          continue;
        }
        if (explStr.length < 100) {
          lastRejectionReason = `Explanation too short (${explStr.length} chars, need ≥100)`;
          lastError = lastRejectionReason;
          continue;
        }
      }

      if (needsValidation) {
        // Cross-model validation: pass generator model so validator uses a different model family
        const validation = await validateQuestion(JSON.stringify(candidate), difficulty, undefined, inferredCourse as string, raw.modelUsed);
        if (!validation.approved) {
          console.warn(`[generateQuestion] Attempt ${attempt} rejected: ${validation.reason}`);
          lastRejectionReason = validation.reason ?? "validation failed";
          lastError = lastRejectionReason;
          continue;
        }
      }
      aiResult = raw;
      parsed = candidate;
      break;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`[generateQuestion] Attempt ${attempt} error: ${lastError}`);
    }
  }

  if (!aiResult || !parsed) {
    throw new Error(`generateQuestion: all ${MAX_GEN_ATTEMPTS} attempts failed. Last: ${lastError}`);
  }

  const inferredCourseForReturn = course || getCourseForUnit(unit);
  const typeFormatForReturn = COURSE_REGISTRY[inferredCourseForReturn]?.questionTypeFormats?.[questionType];
  const estimatedMinutes = typeFormatForReturn?.estimatedMinutes
    ?? (difficulty === "EASY" ? 1 : difficulty === "MEDIUM" ? 2 : 3);

  // Fetch Wikipedia image for any course whose MCQ prompt asks for
  // `wikiImageTopic` — real CB exams use visual stimuli ~40-60% of the
  // time and users flagged that our text-only questions feel less real.
  // Son-of-user feedback 2026-04-22. Extended 2026-04-22 from
  // AP_WORLD_HISTORY alone to all courses that request the field: new
  // 2026 catalog expansion courses (HuGeo, USGov, EnvSci) plus World.
  const IMAGE_COURSES = new Set<string>([
    "AP_WORLD_HISTORY",
    "AP_HUMAN_GEOGRAPHY",
    "AP_US_GOVERNMENT",
    "AP_ENVIRONMENTAL_SCIENCE",
  ]);
  let stimulusImageUrl: string | undefined;
  if (
    IMAGE_COURSES.has(inferredCourseForReturn) &&
    parsed.wikiImageTopic &&
    parsed.wikiImageTopic !== "null"
  ) {
    try {
      const wikiResult = await Promise.race([
        getWikipediaSummary(parsed.wikiImageTopic as string),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
      ]);
      stimulusImageUrl = (wikiResult as Awaited<ReturnType<typeof getWikipediaSummary>>)?.imageUrl ?? undefined;
    } catch {
      stimulusImageUrl = undefined;
    }
  }

  const questionText = parsed.questionText as string;
  const normalized = questionText.toLowerCase().replace(/\s+/g, " ").trim();
  const contentHash = createHash("sha256").update(normalized).digest("hex");

  return {
    unit,
    topic: parsed.topic as string,
    subtopic: parsed.subtopic as string,
    difficulty,
    questionType,
    questionText,
    stimulus: (parsed.stimulus as string) || undefined,
    stimulusImageUrl,
    options: parsed.options as string[] | undefined,
    correctAnswer: parsed.correctAnswer as string,
    explanation: parsed.explanation as string,
    estimatedMinutes,
    modelUsed: aiResult.modelUsed,
    generatedForTier: userTier,
    apSkill: (parsed.apSkill as string) || undefined,
    bloomLevel: (parsed.bloomLevel as string) || undefined,
    contentHash,
    isAiGenerated: true,
    isApproved: false,
  } as GeneratedQuestion & { isAiGenerated: boolean; isApproved: boolean };
}

// ── Bulk question generation ───────────────────────────────────────────────
export async function generateBulkQuestions(
  count: number = 5,
  unit?: ApUnit,
  difficulty?: Difficulty,
  course?: ApCourse,
  questionType: QuestionType = QuestionType.MCQ,
  userTier: "FREE" | "PREMIUM" = "PREMIUM"
): Promise<GeneratedQuestion[]> {
  const targetCourse: ApCourse = course || "AP_WORLD_HISTORY";
  const courseUnitKeys = Object.keys(COURSE_UNITS[targetCourse]) as ApUnit[];
  const units = unit ? [unit] : courseUnitKeys;
  const difficulties: Difficulty[] = difficulty
    ? [difficulty]
    : [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD];

  const questions: GeneratedQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const randomUnit = units[Math.floor(Math.random() * units.length)];
    const randomDiff = difficulties[Math.floor(Math.random() * difficulties.length)];
    const unitMeta = COURSE_REGISTRY[targetCourse].units[randomUnit];
    const keyThemes = unitMeta?.keyThemes || [];
    const randomTopic = keyThemes[Math.floor(Math.random() * keyThemes.length)];

    try {
      const q = await generateQuestion(randomUnit, randomDiff, questionType, randomTopic, targetCourse, userTier);
      questions.push(q);
    } catch (error) {
      console.error(`Failed to generate question ${i + 1}:`, error);
    }
  }

  return questions;
}

// ── Study Plan Generation ──────────────────────────────────────────────────
export async function generateStudyPlan(
  masteryScores: Array<{ unit: ApUnit; masteryScore: number; accuracy: number }>,
  recentPerformance: { accuracy: number; totalAnswered: number },
  course: ApCourse = "AP_WORLD_HISTORY"
): Promise<object> {
  const courseUnits = COURSE_UNITS[course];
  const unitSummary = masteryScores
    .map((m) => `${courseUnits[m.unit] || m.unit}: ${m.masteryScore.toFixed(0)}% mastery, ${m.accuracy.toFixed(0)}% accuracy`)
    .join("\n");

  const weakUnits = masteryScores
    .filter((m) => m.masteryScore < 70)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 3);

  // Build resource recommendations for weak units using registry data
  const config = COURSE_REGISTRY[course];
  const resourceRecs = weakUnits
    .map((w) => {
      const unitMeta = config.units[w.unit as ApUnit];
      if (!unitMeta) return "";
      const links: string[] = [];
      if (unitMeta.heimlerVideoId) links.push(`Heimler's History (youtube.com/watch?v=${unitMeta.heimlerVideoId})`);
      if (unitMeta.fiveableUrl) links.push(`Fiveable (${unitMeta.fiveableUrl})`);
      return links.length ? `${courseUnits[w.unit]}: ${links.join(", ")}` : "";
    })
    .filter(Boolean)
    .join("\n");

  const courseContext = config.curriculumContext;

  const prompt = `You are an expert ${config.name} tutor creating a personalized study plan.

${courseContext}

Student's current mastery scores:
${unitSummary || "No practice data yet — student is just starting out."}

Recent performance: ${recentPerformance.accuracy.toFixed(0)}% accuracy across ${recentPerformance.totalAnswered} questions

${resourceRecs ? `Recommended resources for weak units:\n${resourceRecs}` : ""}

Create a 1-week personalized study plan. Return ONLY a JSON object:
{
  "weeklyGoal": "specific, motivational goal for this week",
  "dailyMinutes": 30,
  "focusAreas": [
    {
      "unit": "unit name",
      "priority": "high|medium|low",
      "reason": "why this unit needs focus based on scores",
      "mcqCount": 10,
      "saqCount": 2,
      "estimatedMinutes": 25,
      "resources": ["specific resource 1", "specific resource 2"]
    }
  ],
  "strengths": ["strong units/topics to maintain"],
  "tips": ["3 specific, actionable study tips tailored to this student's performance"],
  "dailySchedule": {
    "Monday": "brief description",
    "Tuesday": "brief description",
    "Wednesday": "brief description",
    "Thursday": "brief description",
    "Friday": "brief description",
    "Weekend": "brief description"
  }
}`;

  const rawResponse = await callAI(prompt);
  const rawText = rawResponse.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  return JSON.parse(rawText);
}

// ── 7-Day CLEP Pass Plan ─────────────────────────────────────────────────
export async function generateCLEP7DayPlan(
  course: ApCourse,
  masteryScores: Array<{ unit: ApUnit; masteryScore: number; accuracy: number }>,
): Promise<object> {
  const config = COURSE_REGISTRY[course];
  const courseUnits = COURSE_UNITS[course];

  const unitSummary = masteryScores.length > 0
    ? masteryScores
        .map((m) => `${courseUnits[m.unit] || m.unit}: ${m.masteryScore.toFixed(0)}% mastery`)
        .join("\n")
    : "No practice data yet — student is starting fresh.";

  const weakUnits = masteryScores
    .filter((m) => m.masteryScore < 70)
    .sort((a, b) => a.masteryScore - b.masteryScore);

  const unitList = Object.entries(config.units)
    .map(([key, u]) => `${key}: ${u.name} (themes: ${(u.keyThemes || []).join(", ")})`)
    .join("\n");

  const prompt = `You are an expert CLEP exam prep tutor. Create an intensive 7-day study plan to help a student PASS the ${config.name} exam.

CLEP exam info:
${config.curriculumContext}

Course units:
${unitList}

Student's current mastery:
${unitSummary}

${config.tutorResources ? `Free resources available:\n${config.tutorResources}` : ""}

RULES:
- Days 1-2: Foundation — cover the highest-weight topics and weakest units
- Days 3-4: Deep practice — focus on medium-difficulty questions and weak areas
- Days 5-6: Review and practice exams — full mock tests, review mistakes
- Day 7: Final review — quick revision of traps and high-yield facts, confidence building
- Each day should be 60-120 minutes of focused study
- Include specific question counts (e.g., "Complete 20 MCQs on Unit 2")
- Reference the free resources for reading assignments
- The goal is to reach 70%+ mastery across all units — that's the passing threshold

Return ONLY a JSON object with this exact structure:
{
  "planType": "7day",
  "courseName": "${config.name}",
  "days": [
    {
      "day": 1,
      "theme": "Foundation: [specific topic focus]",
      "units": ["unit key 1", "unit key 2"],
      "tasks": [
        "Read OpenStax Chapter X summary (30 min)",
        "Complete 20 MCQs on Unit 1 topics (25 min)",
        "Review wrong answers with Sage tutor (15 min)"
      ],
      "estimatedMinutes": 70,
      "milestone": "Reach 50% mastery on Unit 1"
    }
  ],
  "readinessThreshold": 70,
  "examTip": "One specific exam-day tip for this course"
}

Include exactly 7 days. Make tasks specific and actionable — not vague.`;

  const rawResponse = await callAI(prompt);
  const rawText = rawResponse.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  return JSON.parse(rawText);
}

// Re-export from clep-plan.ts (kept separate so client components can import without pulling in Prisma)
export { staticCLEP7DayPlan } from "./clep-plan";

// ── Sage Live Tutor ───────────────────────────────────────────────────────────────

/**
 * askTutor — fast, CF-Workers-safe tutor response.
 *
 * Enrichment (Wikipedia / Stack Exchange / Reddit) is capped at 2.5 s via
 * Promise.race so it never blocks the AI call on slow edge nodes.
 * Returns { answer, followUps } where followUps is an array of 3 suggested
 * follow-on questions the student might want to ask next.
 */
export async function askTutor(
  question: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  unitContext?: ApUnit,
  course: ApCourse = "AP_WORLD_HISTORY"
): Promise<{ answer: string; followUps: string[] }> {
  const courseConfig = COURSE_REGISTRY[course];

  // ── Enrichment: fire off external fetches but hard-cap at 2.5 s ──────────
  // This keeps the total round-trip fast even when Wikipedia/Reddit are slow.
  const enrichmentPromise = (async () => {
    if (courseConfig.enrichWithEduAPIs) {
      const [unitCtx, enrichedCtx] = await Promise.allSettled([
        unitContext
          ? (() => {
              const fiveableUrl = courseConfig.units[unitContext]?.fiveableUrl;
              return fiveableUrl ? fetchResourceContent(fiveableUrl) : Promise.resolve("");
            })()
          : Promise.resolve(""),
        getEnrichedContext(question.slice(0, 120), course),
      ]);
      const parts: string[] = [];
      if (unitCtx.status === "fulfilled" && unitCtx.value)
        parts.push(`Study material:\n${unitCtx.value.slice(0, 400)}`);
      if (enrichedCtx.status === "fulfilled" && enrichedCtx.value)
        parts.push(enrichedCtx.value.slice(0, 500));
      return parts.join("\n\n");
    } else {
      return getEnrichedContext(question.slice(0, 120), course).catch(() => "");
    }
  })();

  const timeoutPromise = new Promise<string>((resolve) =>
    setTimeout(() => resolve(""), 2500)
  );

  const liveContext = await Promise.race([enrichmentPromise, timeoutPromise]);

  // ── Build compact system prompt (~300 tokens) ────────────────────────────
  // Truncate history to last 8 messages (4 turns) to reduce token usage
  const truncatedHistory = conversationHistory.slice(-8);

  // Cap liveContext to 200 chars
  const ctx = liveContext.slice(0, 200);

  // Build compact unit list from registry
  const unitList = Object.values(courseConfig.units)
    .map((u) => u.name.replace(/^Unit \d+: /, ""))
    .join(", ");

  // Use skillCodes from COURSE_REGISTRY if available; fallback to course-family defaults
  const skills = courseConfig.skillCodes?.join(", ") ??
    (courseConfig.name.includes("World History") || courseConfig.name.includes("US History")
      ? "Argumentation, Causation, Comparison, Continuity and Change Over Time, Contextualization"
      : courseConfig.name.includes("Physics")
      ? "Modeling, Mathematical Routines, Experimental Design, Data Analysis, Argumentation"
      : courseConfig.name.includes("Calculus") || courseConfig.name.includes("Statistics")
      ? "Implementing Mathematical Processes, Connecting Representations, Justification, Communication"
      : courseConfig.name.includes("Chemistry") || courseConfig.name.includes("Biology")
      ? "Models and Representations, Mathematical Routines, Data Analysis, Scientific Argumentation"
      : courseConfig.name.includes("Psychology")
      ? "Concept Understanding, Research Methods, Data Interpretation, Concept Application"
      : "Computational Thinking, Algorithm Analysis, Abstraction, Responsible Computing");

  // STEM calculation courses get step-by-step format; humanities get flowchart/narrative format
  const isCalcCourse = courseConfig.name.includes("Physics") ||
    courseConfig.name.includes("Calculus") ||
    courseConfig.name.includes("Statistics") ||
    courseConfig.name.includes("Chemistry") ||
    courseConfig.name.includes("Biology");

  const visualBreakdownInstruction = isCalcCourse
    ? "Use a markdown table, numbered steps, or bullet comparison. For CALCULATION or DERIVATION problems, always show: **Given** (list known values + units) → **Formula/Rule** (write the relevant equation or theorem) → **Work** (show algebraic steps) → **Answer** (value + correct units or interpretation). IMPORTANT for tables: each row MUST be on its own line — the header row, then the separator row (| --- | --- |), then one data row per line."
    : "Use a markdown table, numbered steps, or bullet comparison. For causal chains, historical sequences, or psychological processes, you may use a mermaid flowchart block. IMPORTANT for tables: each row MUST be on its own line — the header row, then the separator row (| --- | --- |), then one data row per line.";

  const systemPrompt = `You are an expert ${courseConfig.name} tutor for US high schoolers (gr 10-12) preparing for the AP exam.
Units covered: ${unitList}
AP Skills tested: ${skills}
${ctx ? `Live context: ${ctx}` : ""}

ALWAYS structure every response with these exact five sections in order:

## 🎯 Core Concept
Explain in 2-3 sentences using simple, memorable language a 10th grader can follow.

## 📊 Visual Breakdown
${visualBreakdownInstruction}

## 📝 How AP Asks This
Write ONE example question stem in the exact style of a real AP ${courseConfig.name} exam question. Label the AP skill being tested (e.g., Skill: ${skills.split(",")[0].trim()}).

## ⚠️ Common Traps
List 2-3 specific misconceptions students fall for on the real exam. Be precise — name the trap, not just "students confuse X."

## 💡 Memory Hook
Give one mnemonic, analogy, or vivid connection that makes this concept stick long-term.

After the Memory Hook, end your response with exactly one line in this format — replace the bracketed text with 3 real, specific follow-up questions a student would actually ask about this topic (do NOT use placeholders like q1, q2, q3):
FOLLOW_UPS: ["<specific follow-up question 1>", "<specific follow-up question 2>", "<specific follow-up question 3>"]`;

  // ── AI call ───────────────────────────────────────────────────────────────
  const messages = [
    ...truncatedHistory,
    { role: "user" as const, content: question },
  ];

  const raw = await callAIChat(messages, systemPrompt);

  // ── Parse follow-up questions out of the response ─────────────────────────
  const followUpMatch = raw.match(/FOLLOW_UPS:\s*(\[[\s\S]*?\])/);
  let followUps: string[] = [];
  let answer = raw;

  if (followUpMatch) {
    try {
      followUps = JSON.parse(followUpMatch[1]) as string[];
      answer = raw.replace(/\n?FOLLOW_UPS:[\s\S]*$/, "").trim();
    } catch {
      // parse failed — keep the raw response as-is
    }
  }

  return { answer, followUps };
}

// ── Hint Generator (3-level Socratic scaffolding) ─────────────────────────
export async function generateHint(
  questionText: string,
  options: string[],
  attempt?: string,
  hintLevel: 1 | 2 | 3 = 1
): Promise<string> {
  const optionsText = options.map((o, i) => `${String.fromCharCode(65+i)}) ${o}`).join("\n")
  const attemptText = attempt ? `\nStudent previously considered: ${attempt}` : ""

  const levelInstructions: Record<1|2|3, string> = {
    1: `Give a one-sentence concept reminder that identifies what AP topic or skill this question is testing. Do NOT hint at which option is correct.`,
    2: `Give a 2-sentence process clue that tells the student HOW to approach this question — which reasoning strategy to use, what to compare, or what to look for. Do NOT reveal the correct answer or eliminate options directly.`,
    3: `Walk the student through the reasoning process step-by-step (3-4 steps) up to — but not including — the final answer. End with a guiding question that helps them reach the answer themselves. Do NOT state the correct letter.`,
  }

  const prompt = `You are a Socratic AP exam tutor. Help the student think through this question without giving the answer away.

Question: ${questionText}
Options:
${optionsText}${attemptText}

Hint Level ${hintLevel}/3: ${levelInstructions[hintLevel]}

Respond in plain text only. Be concise.`

  const result = await callAIWithCascade(prompt, undefined, undefined)
  return result.trim()
}

// ── Explanation Generator ──────────────────────────────────────────────────
export async function generateExplanation(
  questionText: string,
  correctAnswer: string,
  studentAnswer: string,
  context: string,
  course: ApCourse = "AP_WORLD_HISTORY"
): Promise<string> {
  const { name: courseName, curriculumContext } = COURSE_REGISTRY[course];

  const prompt = `An ${courseName} student answered a question incorrectly.

Question: ${questionText}
Correct Answer: ${correctAnswer}
Student's Answer: ${studentAnswer}
Context: ${context}

${curriculumContext}

Provide a brief, encouraging explanation (3-4 sentences) that:
1. Explains why the correct answer is accurate
2. Clarifies the student's misconception
3. Gives a memory tip or connects to broader AP exam themes
4. Suggests a relevant resource for further review

Be supportive and educational.`;

  return callAI(prompt);
}
