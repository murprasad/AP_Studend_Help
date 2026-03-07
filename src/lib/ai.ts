import Anthropic from "@anthropic-ai/sdk";
import { ApUnit, Difficulty, QuestionType } from "@prisma/client";
import { AP_UNITS } from "./utils";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

export async function generateQuestion(
  unit: ApUnit,
  difficulty: Difficulty,
  questionType: QuestionType = QuestionType.MCQ,
  topic?: string
): Promise<GeneratedQuestion> {
  const unitName = AP_UNITS[unit];
  const topicContext = topic ? `specifically about: ${topic}` : "";

  const prompt = `You are an AP World History exam question generator. Create a high-quality ${questionType} question for the AP World History exam.

Unit: ${unitName}
Difficulty: ${difficulty}
Topic: ${topicContext || "any topic within this unit"}

Requirements for MCQ:
- Create a historically accurate question with a primary source stimulus if appropriate
- Provide exactly 4 answer choices labeled A, B, C, D
- Only one correct answer
- Include a detailed explanation (2-3 sentences) of why the correct answer is right and why the others are wrong

Return ONLY a JSON object with this exact structure (no markdown, no extra text):
{
  "topic": "specific topic name",
  "subtopic": "specific subtopic",
  "questionText": "the question text",
  "stimulus": "optional primary source or passage (null if not needed)",
  "options": ["A) option text", "B) option text", "C) option text", "D) option text"],
  "correctAnswer": "A",
  "explanation": "detailed explanation of the correct answer"
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from AI");
  }

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

export async function generateStudyPlan(
  masteryScores: Array<{ unit: ApUnit; masteryScore: number; accuracy: number }>,
  recentPerformance: { accuracy: number; totalAnswered: number }
): Promise<object> {
  const unitSummary = masteryScores
    .map((m) => `${AP_UNITS[m.unit]}: ${m.masteryScore.toFixed(0)}% mastery, ${m.accuracy.toFixed(0)}% accuracy`)
    .join("\n");

  const prompt = `You are an AP World History tutor creating a personalized study plan.

Student's current mastery scores:
${unitSummary}

Recent performance: ${recentPerformance.accuracy.toFixed(0)}% accuracy across ${recentPerformance.totalAnswered} questions

Create a 1-week study plan. Return ONLY a JSON object:
{
  "weeklyGoal": "brief motivational goal statement",
  "dailyMinutes": 30,
  "focusAreas": [
    {
      "unit": "unit name",
      "priority": "high|medium|low",
      "reason": "why this unit needs focus",
      "mcqCount": 10,
      "saqCount": 2,
      "estimatedMinutes": 25
    }
  ],
  "strengths": ["list of strong units/topics"],
  "tips": ["2-3 specific study tips for this student"]
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from AI");
  }

  return JSON.parse(content.text);
}

export async function askTutor(
  question: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const systemPrompt = `You are an expert AP World History tutor helping a high school student prepare for the AP exam.

Your responses should:
- Be clear and accessible for high school students (ages 15-18)
- Include relevant historical context, dates, and key figures
- Connect topics to the AP World History curriculum and exam themes
- Suggest related topics to study
- Keep responses focused and educational (aim for 200-400 words)
- Use bullet points and structure when helpful

You cover AP World History units 1-9: Global Tapestry (1200-1450), Networks of Exchange, Land-Based Empires, Transoceanic Interconnections, Revolutions, Industrialization, Global Conflict, Cold War, and Globalization.`;

  const messages = [
    ...conversationHistory,
    { role: "user" as const, content: question },
  ];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from AI");
  }

  return content.text;
}

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

Provide a brief, encouraging explanation (2-3 sentences) that:
1. Explains why the correct answer is right
2. Clarifies why the student's answer was incorrect
3. Gives a helpful memory tip or connection to help them remember

Keep it concise and supportive.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from AI");
  }

  return content.text;
}
