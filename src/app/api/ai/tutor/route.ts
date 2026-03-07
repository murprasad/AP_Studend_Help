import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askTutor } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, conversationId, history = [] } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    const response = await askTutor(message, history);

    // Save or update conversation
    const messages = [
      ...history,
      { role: "user", content: message },
      { role: "assistant", content: response },
    ];

    if (conversationId) {
      await prisma.tutorConversation.update({
        where: { id: conversationId },
        data: { messages, updatedAt: new Date() },
      });
    } else {
      const conversation = await prisma.tutorConversation.create({
        data: {
          userId: session.user.id,
          messages,
          topic: message.slice(0, 100),
        },
      });
      return NextResponse.json({ response, conversationId: conversation.id });
    }

    return NextResponse.json({ response, conversationId });
  } catch (error) {
    console.error("AI tutor error:", error);
    return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await prisma.tutorConversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      id: true,
      topic: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ conversations });
}
