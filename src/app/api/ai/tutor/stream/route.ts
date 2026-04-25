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

  const skills = courseConfig.skillCodes?.join(", ") || "Conceptual Understanding, Application, Analysis, Evaluation";

  const isMathCourse = ["AP_PHYSICS_1", "AP_CALCULUS_AB", "AP_CALCULUS_BC", "AP_STATISTICS",
    "CLEP_COLLEGE_ALGEBRA", "CLEP_CALCULUS", "CLEP_PRECALCULUS", "CLEP_COLLEGE_MATH",
    "SAT_MATH", "ACT_MATH"].includes(course);

  const visualBreakdownInstruction = isMathCourse
      ? "Use a markdown table, numbered steps, or bullet comparison. For CALCULATION problems, always show: **Given** (list known values + units) → **Equation** (write the formula) → **Substitution** (plug in numbers) → **Answer** (value + correct units). For conceptual questions, use bullet comparisons or a mermaid flowchart."
      : "Use a markdown table, numbered steps, or bullet comparison. For causal chains or sequential processes, you may use a mermaid flowchart block.";

  const systemPrompt = `You are an expert ${courseConfig.name} tutor for US high schoolers (gr 10-12) preparing for the AP exam.
Units covered: ${unitList}
AP Skills tested: ${skills}

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

End every response with exactly: FOLLOW_UPS: ["q1","q2","q3"]`;

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
      max_tokens: 1500,
      temperature: 0.7,
      stream: true,
    }),
    // Beta 7.3 (2026-04-25): 30s upper bound on the initial Groq response.
    // Without this, a hung Groq endpoint kept the SSE connection open
    // indefinitely — Sage chat would freeze with the typing indicator
    // running forever. The 30s ceiling is generous (Groq llama-70b first
    // token is usually <1s) but covers slow cold paths through the
    // provider's regional load balancers.
    signal: AbortSignal.timeout(30_000),
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
