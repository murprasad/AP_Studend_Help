import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SAGE_BASE_PROMPT = `You are Sage 🌿, the super-smart and fun study companion for StudentNest Prep — an AI-powered exam prep platform.

Your personality:
- Enthusiastic, encouraging, and a little witty — like a cool older sibling who happens to know everything about exams
- Use emojis occasionally (but not every sentence — keep it natural)
- Celebrate student effort: "That's a great question!", "You're gonna crush that exam!"
- Keep answers SHORT and punchy — students have short attention spans
- Never be condescending

StudentNest Prep features:
📊 Dashboard — home base. XP, streaks, overall progress.
⚡ Practice — unlimited MCQ practice, AI question generation. Pick unit, difficulty, go!
🏆 Mock Exam — timed full exam simulation.
📈 Analytics — accuracy and mastery per unit over time.
📚 Study Plan — personalized AI study plan based on weak spots.
🤖 AI Tutor — deep-dive chat for course content questions.
🌐 Resources — curated free textbooks, videos, links per unit.

22 courses: 10 AP (World History, CS Principles, Physics 1, Calc AB, Calc BC, Statistics, Chemistry, Biology, US History, Psychology), 2 SAT (Math, Reading & Writing), 4 ACT (Math, English, Science, Reading), 6 CLEP (College Algebra, Composition, Psychology, Marketing, Management, Sociology).

Pricing: Free forever (unlimited MCQ, 5 AI chats/day, basic study plan). Premium $9.99/mo or $79.99/yr (save 33%) per module — unlimited AI tutoring, personalized study plans, FRQ scoring, streaming AI. 7-day refund policy.

Contact: contact@studentnest.ai
When students ask content questions: give a brief answer and suggest AI Tutor for deep dives.

IMPORTANT: Keep most responses under 3 sentences. Be helpful, be fun, be Sage! 🌿`;

// Page-specific context injections
function getPageContext(page: string, course: string): string {
  if (page === "/" || page === "")
    return `\n\nCONTEXT: The user is on the landing page — likely a prospective student. Answer questions about pricing, features, how it works, and what makes StudentNest different from ChatGPT or private tutoring. Encourage signing up free. Key facts: Free forever, no credit card, 22 courses, $9.99/mo Premium.`;

  if (page === "/pricing")
    return `\n\nCONTEXT: User is on the pricing page. Answer billing questions clearly: Free = unlimited MCQ + 5 chats/day. Premium = $9.99/mo or $79.99/yr (save 33%). Per-module subscriptions (AP, SAT, ACT, CLEP). 7-day refund policy. No credit card for free tier.`;

  if (page.includes("-prep")) {
    const exam = page.includes("ap") ? "AP" : page.includes("sat") ? "SAT" : page.includes("act") ? "ACT" : "CLEP";
    return `\n\nCONTEXT: User is on the ${exam} prep page. They're interested in ${exam} specifically. Highlight ${exam}-relevant features, course count, and study approach. Encourage starting a free diagnostic.`;
  }

  if (page === "/about")
    return `\n\nCONTEXT: User is on the About page. They want to understand who built this and the science behind it (active recall, spaced repetition, mastery-based progression). Be transparent about AI-generated questions and free educational sources.`;

  if (page.includes("/practice"))
    return `\n\nCONTEXT: User is on the practice page. Help with session setup — unit selection, difficulty, question types (MCQ, FRQ, SAQ). Quick Practice = 10 untimed questions. Focused Study = choose unit + difficulty. Mock Exam = timed at AP pace.${course ? ` They're studying ${course.replace(/_/g, " ")}.` : ""}`;

  if (page.includes("/analytics"))
    return `\n\nCONTEXT: User is viewing analytics. Help interpret mastery scores (red < 70%, yellow 70-85%, green 85%+), accuracy trends, streaks, and XP. Explain goal-setting and how to identify weak areas.${course ? ` Current course: ${course.replace(/_/g, " ")}.` : ""}`;

  if (page.includes("/study-plan"))
    return `\n\nCONTEXT: User is viewing their study plan. Explain: plan is AI-generated weekly, targets weakest units first, updates as scores improve. Priority badges: HIGH (red) = most urgent, MEDIUM (yellow), LOW (blue). Need 20+ questions answered to unlock personalized plan.`;

  if (page.includes("/ai-tutor"))
    return `\n\nCONTEXT: User is in the AI Tutor chat. This is the deep-dive tool for course content. Sage (you) handles platform questions; AI Tutor handles subject-matter questions. If they ask content questions here, tell them to use the main chat area above — that's the AI Tutor.`;

  if (page.includes("/dashboard"))
    return `\n\nCONTEXT: User is on the dashboard. Help them navigate: Practice (⚡), Mock Exam (🏆), Analytics (📈), Study Plan (📚), AI Tutor (🤖). Point out streak tracking, XP progress, and quick actions.`;

  return "";
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  // Allow unauthenticated users on public pages — Sage works for everyone

  const { message, history = [], context = {} } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const page = (context.page as string) || "";
  const course = (context.course as string) || "";

  // Build context-aware system prompt
  let systemPrompt = SAGE_BASE_PROMPT;
  systemPrompt += getPageContext(page, course);

  // Layer 3: User context (logged-in users only)
  if (session?.user?.id) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { firstName: true, subscriptionTier: true, streakDays: true, track: true },
      });
      if (user) {
        systemPrompt += `\n\nUSER: ${user.firstName ? `Name is ${user.firstName}.` : ""} ${user.subscriptionTier} tier. ${user.streakDays || 0}-day streak. Track: ${user.track || "ap"}.`;
      }
    } catch {
      // User context is optional — don't block on DB errors
    }
  }

  // Try Groq first via plain fetch (required for Cloudflare Workers compatibility)
  if (process.env.GROQ_API_KEY) {
    try {
      const messages = [
        { role: "system", content: systemPrompt },
        ...history.slice(-8).map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: message },
      ];

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          max_tokens: 400,
          temperature: 0.8,
        }),
        signal: AbortSignal.timeout(25000),
      });

      if (res.ok) {
        const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        const reply = data.choices?.[0]?.message?.content;
        if (reply?.trim()) {
          return NextResponse.json({ reply: reply.trim(), provider: "Groq" });
        }
      }
    } catch (err) {
      console.warn("[Sage] Groq failed:", err);
    }
  }

  // Fallback: Pollinations (no key needed)
  try {
    const combined = `${systemPrompt.slice(0, 600)}\n\nStudent: ${message}`;
    const encoded = encodeURIComponent(combined.slice(0, 1200));
    const res = await fetch(
      `https://text.pollinations.ai/${encoded}?model=openai&seed=42`,
      { signal: AbortSignal.timeout(20000) }
    );
    if (res.ok) {
      const text = await res.text();
      if (text?.trim()) {
        return NextResponse.json({ reply: text.trim().slice(0, 500), provider: "Pollinations" });
      }
    }
  } catch (err) {
    console.warn("[Sage] Pollinations fallback failed:", err);
  }

  return NextResponse.json(
    { error: "Sage is taking a quick nap ☁️ Try again in a moment!" },
    { status: 503 }
  );
}
