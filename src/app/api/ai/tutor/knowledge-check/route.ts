import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApCourse } from "@prisma/client";
import { VALID_AP_COURSES } from "@/lib/courses";

export const dynamic = "force-dynamic";

interface KnowledgeCheckQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

async function generateQuestionsViaGroq(
  tutorResponse: string,
  course: string,
  topic: string | null,
  count: number = 3
): Promise<KnowledgeCheckQuestion[] | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const topicLine = topic ? `\nTopic: ${topic}` : "";
  const prompt = `You are a quiz generator for ${course.replace(/_/g, " ")} students.${topicLine}

Given the tutor explanation below, write exactly ${count} multiple-choice question${count === 1 ? "" : "s"} to check a student's understanding. Keep questions simple and direct, focused on the key concepts explained.

Return ONLY valid JSON — no markdown fences, no extra text:
{"questions":[{"question":"...","options":["A...","B...","C...","D..."],"correctIndex":0,"explanation":"1-sentence why"}]}

Tutor explanation:
${tutorResponse.slice(0, 2000)}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: count === 1 ? 250 : 700,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";
    const parsed = JSON.parse(text) as { questions: KnowledgeCheckQuestion[] };
    if (!Array.isArray(parsed.questions) || parsed.questions.length < 1) return null;
    return parsed.questions.slice(0, count);
  } catch {
    return null;
  }
}

async function generateQuestionsViaPolinations(
  tutorResponse: string,
  course: string,
  topic: string | null,
  count: number = 3
): Promise<KnowledgeCheckQuestion[] | null> {
  const topicLine = topic ? `\nTopic: ${topic}` : "";
  const prompt = `You are a quiz generator for ${course.replace(/_/g, " ")} students.${topicLine}

Given the tutor explanation below, write exactly ${count} multiple-choice question${count === 1 ? "" : "s"} to check a student's understanding. Keep questions simple and direct.

Return ONLY valid JSON — no markdown fences, no extra text:
{"questions":[{"question":"...","options":["A...","B...","C...","D..."],"correctIndex":0,"explanation":"1-sentence why"}]}

Tutor explanation:
${tutorResponse.slice(0, 1500)}`;

  try {
    const res = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: count === 1 ? 250 : 700,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";
    const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(clean) as { questions: KnowledgeCheckQuestion[] };
    if (!Array.isArray(parsed.questions) || parsed.questions.length < 1) return null;
    return parsed.questions.slice(0, count);
  } catch {
    return null;
  }
}

// POST /api/ai/tutor/knowledge-check
// POST /api/ai/tutor/knowledge-check?action=submit
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = (await req.json()) as any;
  const course = body.course as ApCourse;

  if (!VALID_AP_COURSES.includes(course)) {
    return NextResponse.json({ error: "Invalid course" }, { status: 400 });
  }

  if (action === "submit") {
    const { conversationId, topic, questions, answers } = body as {
      conversationId: string | null;
      topic: string | null;
      questions: KnowledgeCheckQuestion[];
      answers: number[];
    };

    if (!Array.isArray(questions) || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const score = answers.reduce((acc: number, a: number, i: number) => {
      return acc + (a === questions[i]?.correctIndex ? 1 : 0);
    }, 0);

    await prisma.tutorKnowledgeCheck.create({
      data: {
        userId: session.user.id,
        conversationId: conversationId ?? null,
        course,
        topic: topic ?? null,
        questions: questions as object[],
        answers: answers as number[],
        score,
      },
    });

    return NextResponse.json({ score, total: 3 });
  }

  // Default: generate questions
  const { tutorResponse, topic, count: rawCount } = body as {
    tutorResponse: string;
    topic: string | null;
    count?: number;
  };
  const count = typeof rawCount === "number" && rawCount >= 1 && rawCount <= 10 ? rawCount : 3;

  if (!tutorResponse || tutorResponse.length < 50) {
    return NextResponse.json({ error: "tutorResponse too short" }, { status: 400 });
  }

  let questions = await generateQuestionsViaGroq(tutorResponse, course, topic ?? null, count);
  if (!questions) {
    questions = await generateQuestionsViaPolinations(tutorResponse, course, topic ?? null, count);
  }

  if (!questions) {
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 503 });
  }

  return NextResponse.json({ questions });
}
