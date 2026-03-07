import Anthropic from "@anthropic-ai/sdk";
import { ApUnit, Difficulty, QuestionType } from "@prisma/client";
import { AP_UNITS } from "./utils";
import { UNIT_RESOURCES, GLOBAL_RESOURCES } from "@/data/resources";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── AP Curriculum context (drawn from College Board, OER Project, Fiveable) ──
const AP_CURRICULUM_CONTEXT = `
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

Key AP exam resources this tutor references:
- College Board AP Central (official curriculum)
- OER Project World History (open educational resources)
- Fiveable AP World History study guides
- Zinn Education Project (multiple perspectives)
- World History For Us All (SDSU)
`;

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

// ── Fetch web content from open educational resources ─────────────────────
async function fetchResourceContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AP-SmartPrep/1.0; Educational)" },
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
  const unitResource = UNIT_RESOURCES.find((r) => r.unit === unit);
  if (!unitResource) return "";

  const context = `
Unit: ${unitResource.unitName} (${unitResource.timePeriod})
Key Themes: ${unitResource.keyThemes.join(", ")}
Study Resources: OER Project, Fiveable, College Board AP Central
`;

  // Try to fetch Fiveable content for richer context
  const fiveableContent = await fetchResourceContent(unitResource.fiveableUrl);
  if (fiveableContent) {
    return context + `\nCurriculum Content Preview:\n${fiveableContent.slice(0, 1000)}`;
  }

  return context;
}

// ── Question Generation ───────────────────────────────────────────────────
export async function generateQuestion(
  unit: ApUnit,
  difficulty: Difficulty,
  questionType: QuestionType = QuestionType.MCQ,
  topic?: string
): Promise<GeneratedQuestion> {
  const unitName = AP_UNITS[unit];
  const unitResource = UNIT_RESOURCES.find((r) => r.unit === unit);
  const topicContext = topic ? `specifically about: ${topic}` : "";
  const keyThemes = unitResource?.keyThemes.join(", ") || "";
  const timePeriod = unitResource?.timePeriod || "";

  const prompt = `You are an AP World History exam question generator trained on College Board AP Central curriculum standards.

Unit: ${unitName} (${timePeriod})
Key Themes for this unit: ${keyThemes}
Difficulty: ${difficulty}
Topic: ${topicContext || "any major theme from this unit"}

AP Exam alignment:
- Questions must align with College Board AP World History: Modern curriculum
- Use AP Historical Thinking Skills (Causation, Comparison, CCOT, Contextualization)
- MCQ questions often use a primary source stimulus (document, image, map, chart)
- Difficulty EASY = straightforward recall; MEDIUM = analysis; HARD = synthesis across themes

Requirements:
- Create a historically accurate, College Board-style question
- Include a primary source stimulus if appropriate (quote from historical document, description of map/image)
- Provide exactly 4 answer choices labeled A, B, C, D
- Only one correct answer
- Explanation should reference why each wrong answer is a "trap" (common misconception)

Return ONLY a JSON object (no markdown, no extra text):
{
  "topic": "specific topic name",
  "subtopic": "specific subtopic",
  "questionText": "the question text",
  "stimulus": "primary source passage or description (null if not needed)",
  "options": ["A) option text", "B) option text", "C) option text", "D) option text"],
  "correctAnswer": "A",
  "explanation": "detailed explanation referencing historical evidence"
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from AI");

  const parsed = JSON.parse(content.text);

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
  difficulty?: Difficulty
): Promise<GeneratedQuestion[]> {
  const units = unit ? [unit] : (Object.keys(AP_UNITS) as ApUnit[]);
  const difficulties: Difficulty[] = difficulty
    ? [difficulty]
    : [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD];

  const questions: GeneratedQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const randomUnit = units[Math.floor(Math.random() * units.length)];
    const randomDiff = difficulties[Math.floor(Math.random() * difficulties.length)];
    const unitResource = UNIT_RESOURCES.find((r) => r.unit === randomUnit);
    const randomTopic = unitResource?.keyThemes[
      Math.floor(Math.random() * (unitResource?.keyThemes.length || 1))
    ];

    try {
      const q = await generateQuestion(randomUnit, randomDiff, QuestionType.MCQ, randomTopic);
      questions.push(q);
    } catch (error) {
      console.error(`Failed to generate question ${i + 1}:`, error);
    }
  }

  return questions;
}

// ── Study Plan Generation ─────────────────────────────────────────────────
export async function generateStudyPlan(
  masteryScores: Array<{ unit: ApUnit; masteryScore: number; accuracy: number }>,
  recentPerformance: { accuracy: number; totalAnswered: number }
): Promise<object> {
  const unitSummary = masteryScores
    .map((m) => `${AP_UNITS[m.unit]}: ${m.masteryScore.toFixed(0)}% mastery, ${m.accuracy.toFixed(0)}% accuracy`)
    .join("\n");

  // Build resource recommendations per weak unit
  const weakUnits = masteryScores
    .filter((m) => m.masteryScore < 70)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 3);

  const resourceRecs = weakUnits.map((w) => {
    const ur = UNIT_RESOURCES.find((r) => r.unit === w.unit);
    return ur
      ? `${AP_UNITS[w.unit]}: Watch Heimler's History (youtube.com/watch?v=${ur.heimlerVideoId}), Study at Fiveable (${ur.fiveableUrl}), Practice on OER Project (${ur.oerUrl})`
      : "";
  }).filter(Boolean).join("\n");

  const prompt = `You are an expert AP World History tutor creating a personalized study plan.
You reference these proven resources: College Board AP Central, OER Project, Fiveable, Heimler's History (YouTube), Khan Academy, PracticeQuiz, Zinn Education Project.

Student's current mastery scores:
${unitSummary}

Recent performance: ${recentPerformance.accuracy.toFixed(0)}% accuracy across ${recentPerformance.totalAnswered} questions

Recommended resources for weak units:
${resourceRecs || "Practice all units consistently"}

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
      "resources": ["Heimler's History video", "Fiveable study guide", "OER Project reading"]
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

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from AI");
  return JSON.parse(content.text);
}

// ── AI Tutor (Enhanced with curriculum resources) ─────────────────────────
export async function askTutor(
  question: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  unitContext?: ApUnit
): Promise<string> {
  // Optionally fetch live content from open resources
  let liveContext = "";
  if (unitContext) {
    const ur = UNIT_RESOURCES.find((r) => r.unit === unitContext);
    if (ur) {
      const content = await fetchResourceContent(ur.fiveableUrl);
      if (content) liveContext = `\n\nCurrent study material from Fiveable:\n${content.slice(0, 800)}`;
    }
  }

  const systemPrompt = `You are an expert AP World History tutor for high school students (ages 15-18).

${AP_CURRICULUM_CONTEXT}
${liveContext}

Your teaching approach:
- Reference specific resources when helpful: "Check out Heimler's History on YouTube for a great video on this", "Fiveable has excellent study guides at library.fiveable.me/ap-world", "The OER Project has primary sources at oerproject.com/AP-World-History", "Khan Academy has free lessons at khanacademy.org/humanities/ap-world-history"
- Connect every answer to AP exam skills (Causation, Comparison, CCOT, Contextualization, Argumentation)
- Use specific dates, people, and examples from the AP curriculum
- When explaining historical events, note how they connect to AP exam themes
- Suggest practice questions or study strategies when relevant
- Keep explanations clear and engaging for high schoolers
- Format with headers and bullets when explaining complex topics
- Always mention if a topic is HIGH PRIORITY for the AP exam

When referencing resources:
- Heimler's History (YouTube): Great for visual reviews of each unit
- Khan Academy: Free videos and articles on all topics
- Fiveable: Excellent study guides and key concept summaries
- OER Project: Primary sources and in-depth readings
- College Board AP Central: Official exam info and sample questions
- Zinn Education Project: Alternative perspectives and primary sources
- PracticeQuiz: Additional MCQ practice`;

  const messages = [
    ...conversationHistory,
    { role: "user" as const, content: question },
  ];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    system: systemPrompt,
    messages,
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from AI");
  return content.text;
}

// ── Explanation Generator ─────────────────────────────────────────────────
export async function generateExplanation(
  questionText: string,
  correctAnswer: string,
  studentAnswer: string,
  context: string
): Promise<string> {
  const prompt = `An AP World History student answered a question incorrectly.

Question: ${questionText}
Correct Answer: ${correctAnswer}
Student's Answer: ${studentAnswer}
Context: ${context}

${AP_CURRICULUM_CONTEXT}

Provide a brief, encouraging explanation (3-4 sentences) that:
1. Explains why the correct answer is historically accurate
2. Clarifies the student's misconception
3. Gives a memory tip or connects to broader AP themes
4. Suggests a resource: Heimler's History, Khan Academy, Fiveable, or OER Project

Be supportive and educational.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from AI");
  return content.text;
}
