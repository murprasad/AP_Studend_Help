import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { COURSE_REGISTRY, VALID_AP_COURSES } from "@/lib/courses";
import { ApCourse } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { message, history = [], course = "AP_WORLD_HISTORY" } = body as {
    message: string;
    history: Array<{ role: string; content: string }>;
    course: string;
  };

  if (!message?.trim()) return new Response("Message required", { status: 400 });
  if (!VALID_AP_COURSES.includes(course as ApCourse)) return new Response("Invalid course", { status: 400 });

  const courseConfig = COURSE_REGISTRY[course as ApCourse];
  const unitList = Object.values(courseConfig.units)
    .map((u) => u.name.replace(/^Unit \d+: /, ""))
    .join(", ");

  const skills =
    course === "AP_WORLD_HISTORY"
      ? "Causation, Comparison, CCOT, Contextualization"
      : course === "AP_PHYSICS_1"
      ? "Modeling, Math Routines, Experimental Design"
      : "Computational Thinking, Algorithm Analysis, Abstraction";

  const systemPrompt = `AP ${courseConfig.name} tutor. Audience: US high schoolers prepping for the AP exam.
Units: ${unitList}
AP Skills: ${skills}
Instructions: Markdown (bold, ## headers, bullets). Cite evidence. Flag exam-critical topics. Be concise.
End every response with: FOLLOW_UPS: ["q1","q2","q3"]`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-8).map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return new Response("AI not configured", { status: 503 });

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 1200,
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!groqRes.ok) return new Response("AI unavailable", { status: 503 });

  // Pass through the SSE stream directly
  return new Response(groqRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
