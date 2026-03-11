import { ApUnit, ApCourse, Difficulty, QuestionType } from "@prisma/client";
import { COURSE_UNITS } from "./utils";
import { COURSE_REGISTRY, getCourseForUnit } from "./courses";
import { callAIWithCascade } from "./ai-providers";
import { getWikipediaSummary, getEduContextForQuery, searchStackExchange, getEnrichedContext } from "./edu-apis";

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

  // Fetch content in parallel from all available free sources
  const [fiveableContent, wikiResult, seResults] = await Promise.allSettled([
    unitMeta.fiveableUrl ? fetchResourceContent(unitMeta.fiveableUrl) : Promise.resolve(""),
    isSTEM ? Promise.resolve(null) : getWikipediaSummary(unitMeta.name.replace(/Unit \d+: /, "")),
    isSTEM ? searchStackExchange(searchQuery, seSite, 3) : Promise.resolve([]),
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
  topic?: string
): string {
  const config = COURSE_REGISTRY[course];
  const unitMeta = config.units[unit];

  const unitHeader = [
    `Unit: ${unitName}${unitMeta?.timePeriod ? ` (${unitMeta.timePeriod})` : ""}`,
    unitMeta?.keyThemes?.length ? `Key Themes for this unit: ${unitMeta.keyThemes.join(", ")}` : "",
    `Difficulty: ${difficulty}`,
    `Topic: ${topic ? `specifically about: ${topic}` : "any major theme from this unit"}`,
  ].filter(Boolean).join("\n");

  return `You are an ${config.name} exam question generator trained on College Board ${config.name} curriculum standards.

${unitHeader}

${config.examAlignmentNotes}

Requirements:
- Create a College Board-style multiple choice question
- ${config.stimulusRequirement}
- Provide exactly 4 answer choices labeled A, B, C, D
- Only one correct answer
- Explanation should ${config.explanationGuidance}

Return ONLY a JSON object (no markdown, no extra text):
{
  "topic": "specific topic name",
  "subtopic": "specific subtopic",
  "questionText": "the question text",
  "stimulus": "${config.stimulusDescription}",
  "options": ["A) option text", "B) option text", "C) option text", "D) option text"],
  "correctAnswer": "A",
  "explanation": "detailed explanation ${config.explanationGuidance}"
}`;
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
  const prompt = buildQuestionPrompt(inferredCourse, unit, unitName, difficulty, topic);

  const rawResponse = await callAI(prompt);
  const rawText = rawResponse.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const parsed = JSON.parse(rawText);

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
export async function askTutor(
  question: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  unitContext?: ApUnit,
  course: ApCourse = "AP_WORLD_HISTORY"
): Promise<string> {
  const courseConfig = COURSE_REGISTRY[course];
  let liveContext = "";

  // Enrich with live content from free sources (Wikipedia, Stack Exchange, Reddit, LoC)
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

    if (unitCtx.status === "fulfilled" && unitCtx.value) {
      liveContext += `\n\nFiveable study material:\n${unitCtx.value.slice(0, 600)}`;
    }
    if (enrichedCtx.status === "fulfilled" && enrichedCtx.value) {
      liveContext += `\n\nLive educational context (Wikipedia / Stack Exchange / Reddit AP):\n${enrichedCtx.value.slice(0, 800)}`;
    }
  } else {
    // For STEM courses: always pull Stack Exchange + Reddit even without enrichWithEduAPIs
    const enriched = await getEnrichedContext(question.slice(0, 120), course).catch(() => "");
    if (enriched) liveContext += `\n\nLive educational context (Stack Exchange / Reddit AP):\n${enriched.slice(0, 800)}`;
  }

  const systemPrompt = `You are an expert ${courseConfig.name} tutor for high school students (ages 15-18).

${courseConfig.curriculumContext}
${liveContext}

Your teaching approach:
- Connect every answer to AP exam skills and big ideas for ${courseConfig.name}
- Use specific, accurate examples from the curriculum
- When explaining concepts, note how they connect to AP exam themes and question types
- Suggest practice strategies and resources when relevant
- Keep explanations clear and engaging for high schoolers
- Format with headers and bullets when explaining complex topics
- Always mention if a topic is HIGH PRIORITY for the AP exam

${courseConfig.tutorResources}`;

  const messages = [
    ...conversationHistory,
    { role: "user" as const, content: question },
  ];

  return callAIChat(messages, systemPrompt);
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
