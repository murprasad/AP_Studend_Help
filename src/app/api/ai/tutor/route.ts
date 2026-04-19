import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askTutor } from "@/lib/ai";
import { ApCourse } from "@prisma/client";
import { VALID_AP_COURSES } from "@/lib/courses";
import { isAiLimitEnabled, isPaymentsEnabled } from "@/lib/settings";
import { rateLimit } from "@/lib/rate-limit";
import { isPremiumForTrack, hasAnyPremium, type ModuleSub } from "@/lib/tiers";

async function computeCacheKey(message: string, course: string): Promise<string> {
  const input = `${message.toLowerCase().trim()}|${course}`;
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Per-minute rate limit (20 req/min per user)
    const rl = rateLimit(session.user.id, "ai:tutor", 20);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    const body = await req.json();
    const { message, conversationId, history = [], course = "AP_WORLD_HISTORY", skipAI, savedResponse } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!VALID_AP_COURSES.includes(course as ApCourse)) {
      return NextResponse.json({ error: "Invalid course" }, { status: 400 });
    }

    // Daily limit for non-premium users (only for new conversations)
    const moduleSubs: ModuleSub[] = (session.user as { moduleSubs?: ModuleSub[] }).moduleSubs ?? [];
    const hasPremium = hasAnyPremium(moduleSubs) || isPremiumForTrack(session.user.subscriptionTier, session.user.track ?? "ap");
    if (!conversationId && !hasPremium) {
      const [limitsOn, paymentsOn] = await Promise.all([isAiLimitEnabled(), isPaymentsEnabled()]);
      if (limitsOn && paymentsOn) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const dailyCount = await prisma.tutorConversation.count({
          where: { userId: session.user.id, createdAt: { gte: startOfDay } },
        });
        if (dailyCount >= 5) {
          return NextResponse.json({
            error: "Daily limit reached. Free accounts can start 5 new conversations per day. Upgrade to Premium for unlimited access.",
            limitExceeded: true,
            upgradeUrl: "/pricing",
          }, { status: 429 });
        }
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

    // Cache lookup — only for first-turn messages (no prior history)
    let answer: string;
    let followUps: string[];
    let cacheHit = false;

    if (history.length === 0) {
      const cacheKey = await computeCacheKey(message, course);
      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48h TTL
      const cached = await prisma.aiResponseCache.findUnique({ where: { cacheKey } });

      if (cached && cached.createdAt > cutoff) {
        answer = cached.response;
        followUps = JSON.parse(cached.followUps) as string[];
        cacheHit = true;

        // Fire-and-forget: record conversation for history tracking
        prisma.tutorConversation.create({
          data: {
            userId: session.user.id,
            course: course as ApCourse,
            messages: [
              { role: "user", content: message },
              { role: "assistant", content: answer },
            ],
            topic: message.slice(0, 100),
          },
        }).catch(() => {});

        return NextResponse.json({ response: answer, followUps, conversationId: null, fromCache: true });
      }

      // Cache miss — call AI then write to cache
      const result = await askTutor(message, history, undefined, course as ApCourse);
      answer = result.answer;
      followUps = result.followUps;

      // Fire-and-forget cache write
      prisma.aiResponseCache.upsert({
        where: { cacheKey },
        create: { cacheKey, course, response: answer, followUps: JSON.stringify(followUps) },
        update: { response: answer, followUps: JSON.stringify(followUps), createdAt: new Date() },
      }).catch(() => {});
    } else {
      const result = await askTutor(message, history, undefined, course as ApCourse);
      answer = result.answer;
      followUps = result.followUps;
    }

    // Save or update conversation
    const messages = [
      ...history,
      { role: "user", content: message },
      { role: "assistant", content: answer },
    ];

    if (conversationId) {
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
      return NextResponse.json(
        { error: "Sage Live Tutor is temporarily unavailable. Please try again in a minute." },
        { status: 503 },
      );
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
