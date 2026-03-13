import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askTutor } from "@/lib/ai";
import { ApCourse } from "@prisma/client";
import { VALID_AP_COURSES } from "@/lib/courses";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { message, conversationId, history = [], course = "AP_WORLD_HISTORY", skipAI, savedResponse } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!VALID_AP_COURSES.includes(course as ApCourse)) {
      return NextResponse.json({ error: "Invalid course" }, { status: 400 });
    }

    // Daily limit for free users (only for new conversations)
    if (!conversationId && session.user.subscriptionTier === "FREE") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const dailyCount = await prisma.tutorConversation.count({
        where: { userId: session.user.id, createdAt: { gte: startOfDay } },
      });
      if (dailyCount >= 10) {
        return NextResponse.json({
          error: "Daily limit reached. Free accounts can start 10 new conversations per day. Upgrade to Premium for unlimited access.",
          limitExceeded: true,
          upgradeUrl: "/pricing",
        }, { status: 429 });
      }
    }

    // skipAI mode: save a pre-computed response without calling AI again
    if (skipAI && savedResponse) {
      const messages = [...history, { role: "user", content: message }, { role: "assistant", content: savedResponse }];
      if (conversationId) {
        const existing = await prisma.tutorConversation.findFirst({
          where: { id: conversationId, userId: session.user.id },
        });
        if (existing) {
          await prisma.tutorConversation.update({
            where: { id: conversationId },
            data: { messages, updatedAt: new Date() },
          });
        }
        return NextResponse.json({ conversationId });
      } else {
        const conversation = await prisma.tutorConversation.create({
          data: {
            userId: session.user.id,
            course: course as ApCourse,
            messages,
            topic: message.slice(0, 100),
          },
        });
        return NextResponse.json({ conversationId: conversation.id });
      }
    }

    const { answer, followUps } = await askTutor(message, history, undefined, course as ApCourse);

    // Save or update conversation
    const messages = [
      ...history,
      { role: "user", content: message },
      { role: "assistant", content: answer },
    ];

    if (conversationId) {
      // Verify conversation belongs to user
      const existing = await prisma.tutorConversation.findFirst({
        where: { id: conversationId, userId: session.user.id },
      });

      if (!existing) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }

      await prisma.tutorConversation.update({
        where: { id: conversationId },
        data: { messages, updatedAt: new Date() },
      });

      return NextResponse.json({ response: answer, followUps, conversationId });
    } else {
      const conversation = await prisma.tutorConversation.create({
        data: {
          userId: session.user.id,
          course: course as ApCourse,
          messages,
          topic: message.slice(0, 100),
        },
      });
      return NextResponse.json({ response: answer, followUps, conversationId: conversation.id });
    }
  } catch (error) {
    console.error("POST /api/ai/tutor error:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("No AI provider") || msg.includes("All AI providers failed")) {
      return NextResponse.json({
        error: "No AI provider configured. Please add a free API key — see Setup Guide below.",
        setupGuide: {
          recommended: "Groq (free, instant setup)",
          steps: [
            "1. Go to https://console.groq.com and sign in with Google",
            "2. Click API Keys → Create API Key → copy the key (starts with gsk_)",
            "3. In terminal: cd C:\\Users\\akkil\\project\\AP_Help",
            "4. Run: netlify env:set GROQ_API_KEY \"your-key-here\"",
            "5. Run: netlify deploy --build --prod",
          ],
          alternatives: "OpenRouter, Together.ai, Cohere, HuggingFace, Google Gemini — all have free tiers",
        },
      }, { status: 503 });
    }
    return NextResponse.json({ error: "AI service unavailable. Please try again." }, { status: 503 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const course = searchParams.get("course") as ApCourse | null;

    const conversations = await prisma.tutorConversation.findMany({
      where: {
        userId: session.user.id,
        ...(course ? { course } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        course: true,
        topic: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("GET /api/ai/tutor error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
