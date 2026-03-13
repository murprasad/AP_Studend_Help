import { ApUnit, ApCourse, Difficulty, QuestionType } from "@prisma/client";
import { COURSE_UNITS } from "./utils";
import { COURSE_REGISTRY, getCourseForUnit } from "./courses";
import { callAIWithCascade } from "./ai-providers";
import { getWikipediaSummary, getEduContextForQuery, searchStackExchange, getEnrichedContext, fetchMITOCWContent, fetchDIGContent, fetchOpenStaxContent, fetchSmithsonianContent } from "./edu-apis";

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
  options?: string[];
  correctAnswer: string;
  explanation: string;
  estimatedMinutes: number;
}

// ── Fetch web content from open educational resources ──────────────────────
async function fetchResourceContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PrepNova/1.0; Educational)" },
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
  return enriched;
}

// ── Question generation prompt — data-driven via COURSE_REGISTRY ───────────
// To customise for a new course, update examAlignmentNotes / stimulusRequirement
// / stimulusDescription / explanationGuidance in that course's CourseConfig.

function buildQuestionPrompt(
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
    ?? `{"topic":"specific topic name","subtopic":"specific subtopic","questionText":"the question text","stimulus":"${config.stimulusDescription}","options":["A) option text","B) option text","C) option text","D) option text"],"correctAnswer":"A","explanation":"detailed explanation ${config.explanationGuidance}"}`;

  return `You are an ${config.name} exam question generator trained on College Board ${config.name} curriculum standards.

${unitHeader}

${config.examAlignmentNotes}

GENERATION TASK:
${generationInstruction}

Return ONLY a JSON object (no markdown, no extra text):
${responseFormat}`;
}

// ── Question Generation ────────────────────────────────────────────────────
export async function generateQuestion(
  unit: ApUnit,
  difficulty: Difficulty,
  questionType: QuestionType = QuestionType.MCQ,
  topic?: string,
  course?: ApCourse
): Promise<GeneratedQuestion> {
  const inferredCourse = course || getCourseForUnit(unit);
  const unitName = COURSE_REGISTRY[inferredCourse].units[unit]?.name || unit;
  const prompt = buildQuestionPrompt(inferredCourse, unit, unitName, difficulty, questionType, topic);

  const rawResponse = await callAI(prompt);
  const rawText = rawResponse.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const parsed = JSON.parse(rawText);

  const inferredCourseForReturn = course || getCourseForUnit(unit);
  const typeFormatForReturn = COURSE_REGISTRY[inferredCourseForReturn]?.questionTypeFormats?.[questionType];
  const estimatedMinutes = typeFormatForReturn?.estimatedMinutes
    ?? (difficulty === "EASY" ? 1 : difficulty === "MEDIUM" ? 2 : 3);

  return {
    unit,
    topic: parsed.topic,
    subtopic: parsed.subtopic,
    difficulty,
    questionType,
    questionText: parsed.questionText,
    stimulus: parsed.stimulus || undefined,
    options: parsed.options,
    correctAnswer: parsed.correctAnswer,
    explanation: parsed.explanation,
    estimatedMinutes,
    isAiGenerated: true,
    isApproved: false,
  } as GeneratedQuestion & { isAiGenerated: boolean; isApproved: boolean };
}

// ── Bulk question generation ───────────────────────────────────────────────
export async function generateBulkQuestions(
  count: number = 5,
  unit?: ApUnit,
  difficulty?: Difficulty,
  course?: ApCourse
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
      const q = await generateQuestion(randomUnit, randomDiff, QuestionType.MCQ, randomTopic, targetCourse);
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

// ── AI Tutor ───────────────────────────────────────────────────────────────

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

  // Pick key skills per course type
  const skills = courseConfig.name.includes("World History")
    ? "Causation, Comparison, CCOT, Contextualization, Argumentation"
    : courseConfig.name.includes("Physics")
    ? "Modeling, Math Routines, Experimental Design, Argumentation"
    : "Computational Thinking, Algorithm Analysis, Abstraction, Responsible Computing";

  const systemPrompt = `AP ${courseConfig.name} tutor. Audience: US high schoolers (gr 10-12) prepping for the AP exam.
Units: ${unitList}
AP Skills: ${skills}
${ctx ? `Context: ${ctx}` : ""}
Instructions: Markdown (bold, ## headers, bullets). Cite evidence/examples. Flag exam-critical topics. Be concise and engaging.
End every response with exactly: FOLLOW_UPS: ["q1","q2","q3"]`;

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
