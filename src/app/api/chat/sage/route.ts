import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitAsync } from "@/lib/rate-limit";

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
🤖 Sage Live Tutor — deep-dive chat for course content questions.
🌐 Resources — curated free textbooks, videos, links per unit.

16 courses: 10 AP, 2 SAT, 4 ACT. If a student asks about CLEP or DSST, point them to https://preplion.ai — that's our sister platform covering 34 CLEP + 22 DSST exams (separate platform since 2026-04-14).

Pricing: Free forever (MCQ practice, 5 AI chats/day, basic study plan). One Premium subscription unlocks every exam (AP + SAT + ACT) for $9.99/mo or $79.99/yr (save 33%) — unlimited Sage Live Tutor, personalized study plans, FRQ scoring, streaming AI. 7-day refund policy.

Contact: contact@studentnest.ai
When students ask content questions: give a brief answer and suggest Sage Live Tutor for deep dives.

IMPORTANT: Keep most responses under 3 sentences. Be helpful, be fun, be Sage! 🌿`;

// Page-specific context injections
function getPageContext(page: string, course: string): string {
  if (page === "/" || page === "")
    return `\n\nCONTEXT: The user is on the landing page — likely a prospective student. Answer questions about pricing, features, how it works, and what makes StudentNest different from ChatGPT or private tutoring. Encourage signing up free. Key facts: Free forever, no credit card, 72 courses, $9.99/mo Premium.`;

  if (page === "/pricing")
    return `\n\nCONTEXT: User is on the pricing page. Answer billing questions clearly: Free = MCQ practice + 5 chats/day. ONE Premium subscription ($9.99/mo or $79.99/yr, save 33%) unlocks every exam — AP, SAT, ACT — for the same price. Sign up via any exam; you get all of them. 7-day refund policy. No credit card for free tier. CLEP/DSST prep lives at preplion.ai (separate platform).`;

  if (page.includes("-prep")) {
    const exam = page.includes("ap") ? "AP" : page.includes("sat") ? "SAT" : page.includes("act") ? "ACT" : "AP";
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
    return `\n\nCONTEXT: User is in the Sage Live Tutor chat. This is the deep-dive tool for course content. Sage (you) handles platform questions; Sage Live Tutor handles subject-matter questions. If they ask content questions here, tell them to use the main chat area above — that's the Sage Live Tutor.`;

  if (page.includes("/dashboard"))
    return `\n\nCONTEXT: User is on the dashboard. Help them navigate: Practice (⚡), Mock Exam (🏆), Analytics (📈), Study Plan (📚), Sage Live Tutor (🤖). Point out streak tracking, XP progress, and quick actions.`;

  return "";
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  // Allow unauthenticated users on public pages — Sage works for everyone.
  // Rate-limit by session user (when logged in) or IP (when public) to
  // prevent the unauth path from being used as an unlimited AI cost vector.
  const ipHeader = req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? "unknown";
  const ip = ipHeader.split(",")[0]?.trim() || "unknown";
  const rlKey = session?.user?.id ?? `anon:${ip}`;
  const rlLimit = session?.user?.id ? 30 : 10; // logged-in: 30/min, anon: 10/min
  // SEC-2b (2026-04-25): use edge-persistent CF binding for the anon path
  // (the actual abuse vector — anonymous AI cost flood). Authed path stays
  // on the sync limiter since per-user keying + downstream Stripe/AI
  // provider limits already throttle real users.
  const { allowed } = session?.user?.id
    ? rateLimit(rlKey, "sage-chat", rlLimit)
    : await rateLimitAsync(rlKey, "sage-chat", rlLimit);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests — try again in a minute." },
      { status: 429 },
    );
  }

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
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        const reply = data.choices?.[0]?.message?.content;
        if (reply?.trim()) {
          return NextResponse.json({ reply: reply.trim(), provider: "Groq" });
        }
      } else {
        console.warn("[Sage] Groq HTTP", res.status);
      }
    } catch (err) {
      console.warn("[Sage] Groq failed:", err instanceof Error ? err.message : err);
    }
  }

  // Fallback 2: Gemini (if key available)
  if (process.env.GOOGLE_AI_API_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: `${systemPrompt.slice(0, 1200)}\n\nStudent says: ${message}` }] }],
            generationConfig: { maxOutputTokens: 300, temperature: 0.8 },
          }),
          signal: AbortSignal.timeout(15000),
        }
      );
      if (res.ok) {
        const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply?.trim()) {
          return NextResponse.json({ reply: reply.trim().slice(0, 500), provider: "Gemini" });
        }
      } else {
        console.warn("[Sage] Gemini HTTP", res.status);
      }
    } catch (err) {
      console.warn("[Sage] Gemini failed:", err instanceof Error ? err.message : err);
    }
  }

  // Fallback 3: Pollinations via POST (avoids URL length issues)
  try {
    const pollinationsBody = {
      messages: [
        { role: "system", content: systemPrompt.slice(0, 800) },
        { role: "user", content: message },
      ],
      model: "openai",
      seed: 42,
    };
    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pollinationsBody),
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const text = await res.text();
      if (text?.trim()) {
        return NextResponse.json({ reply: text.trim().slice(0, 500), provider: "Pollinations" });
      }
    } else {
      console.warn("[Sage] Pollinations HTTP", res.status);
    }
  } catch (err) {
    console.warn("[Sage] Pollinations failed:", err instanceof Error ? err.message : err);
  }

  // Last resort: return a helpful static response instead of error
  const fallbackReplies = [
    "I'm having a brief connection issue! 🌿 Try asking again in a moment — I'll be right back.",
    "Hmm, my AI brain needs a quick reset! Try again in a few seconds. In the meantime, check out our FAQ page for common questions!",
    "Quick hiccup on my end! 🌿 I'll be back shortly. You can also email contact@studentnest.ai if you need help right away.",
  ];
  return NextResponse.json({
    reply: fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)],
    provider: "fallback",
  });
}
