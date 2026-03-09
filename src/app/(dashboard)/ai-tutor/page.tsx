"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCourse } from "@/hooks/use-course";
import { AP_COURSES } from "@/lib/utils";
import { COURSE_REGISTRY } from "@/lib/courses";
import { MessageSquare, Send, Loader2, Bot, User, Lightbulb, GraduationCap } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Derived from COURSE_REGISTRY — update suggestedTutorQuestions there when adding a course.
const SUGGESTED_QUESTIONS = Object.fromEntries(
  Object.entries(COURSE_REGISTRY).map(([k, v]) => [k, v.suggestedTutorQuestions])
) as Record<string, string[]>;

export default function AiTutorPage() {
  const { toast } = useToast();
  const [course] = useCourse();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset conversation when course changes
  useEffect(() => {
    setMessages([]);
    setConversationId(null);
    setInput("");
  }, [course]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          conversationId,
          history: messages,
          course,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data.setupGuide
          ? "AI provider not configured. Check the setup guide in the console or contact your admin."
          : data.error || "Failed to reach AI tutor";
        toast({ title: "AI Unavailable", description: errMsg, variant: "destructive" });
        if (data.setupGuide) {
          console.info("AI Setup Guide:", JSON.stringify(data.setupGuide, null, 2));
        }
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }
    } catch {
      toast({ title: "Connection error", description: "Failed to reach AI tutor. Check your connection.", variant: "destructive" });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const suggestedQuestions = SUGGESTED_QUESTIONS[course] || SUGGESTED_QUESTIONS.AP_WORLD_HISTORY;
  const courseLabel = AP_COURSES[course];

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8 text-indigo-400" />
          AI Tutor
        </h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          {courseLabel} — Switch course from the sidebar
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="space-y-6">
            {/* Welcome */}
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">{courseLabel} Tutor</h2>
              <p className="text-muted-foreground max-w-md mx-auto text-sm">
                I can explain any {courseLabel} concept, help you understand exam questions,
                create study summaries, or answer exam prep questions.
              </p>
            </div>

            {/* Suggested questions */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Try asking...
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-left p-3 rounded-lg border border-border/40 hover:bg-accent text-sm transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-indigo-400" />
                </div>
              )}
              <div
                className={`max-w-[85%] p-4 rounded-xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-card border border-border/40 rounded-bl-sm"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="bg-card border border-border/40 rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask about any ${courseLabel} topic...`}
          className="min-h-[52px] max-h-32 resize-none"
          rows={1}
        />
        <Button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoading}
          size="icon"
          className="h-[52px] w-12 flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
