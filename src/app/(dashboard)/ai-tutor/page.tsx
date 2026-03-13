"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCourse } from "@/hooks/use-course";
import { AP_COURSES } from "@/lib/utils";
import { COURSE_REGISTRY } from "@/lib/courses";
import {
  MessageSquare,
  Send,
  Loader2,
  Bot,
  User,
  Lightbulb,
  GraduationCap,
  RefreshCw,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  followUps?: string[];
}

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
  // Keep a ref to conversationId so fire-and-forget callbacks read the latest value
  const conversationIdRef = useRef<string | null>(null);
  conversationIdRef.current = conversationId;

  useEffect(() => {
    setMessages([]);
    setConversationId(null);
    setInput("");
  }, [course]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Non-streaming fallback — captures content at call time to avoid stale closure
  const sendMessageNonStreaming = useCallback(
    async (content: string, historySnapshot: Message[]) => {
      try {
        const response = await fetch("/api/ai/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            conversationId: conversationIdRef.current,
            history: historySnapshot.map(({ role, content: c }) => ({ role, content: c })),
            course,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Check if limit exceeded
          if (response.status === 429 && data.limitExceeded) {
            toast({
              title: "Daily limit reached",
              description: data.error,
              variant: "destructive",
            });
          } else {
            toast({
              title: "AI Unavailable",
              description: data.error || "Could not reach the AI tutor. Please try again.",
              variant: "destructive",
            });
          }
          setMessages((prev) => prev.slice(0, -1));
          return;
        }

        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
          followUps: Array.isArray(data.followUps) ? data.followUps : [],
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (data.conversationId && !conversationIdRef.current) {
          setConversationId(data.conversationId);
        }
      } catch {
        toast({
          title: "Connection error",
          description: "Failed to reach AI tutor. Check your connection.",
          variant: "destructive",
        });
        setMessages((prev) => prev.slice(0, -1));
      }
    },
    [course, toast]
  );

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content };
    // Capture history before adding the new user message
    setMessages((prev) => {
      const historySnapshot = prev;

      // Add placeholder for streaming
      const assistantPlaceholder: Message = { role: "assistant", content: "" };

      // Kick off async work — we have historySnapshot captured here
      (async () => {
        setIsLoading(true);
        try {
          const streamRes = await fetch("/api/ai/tutor/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: content,
              history: historySnapshot.map(({ role, content: c }) => ({ role, content: c })),
              course,
            }),
          });

          if (!streamRes.ok || !streamRes.body) {
            // Remove user message + placeholder, fall back to non-streaming
            setMessages((p) => p.slice(0, -2));
            setMessages((p) => [...p, userMessage]);
            await sendMessageNonStreaming(content, historySnapshot);
            return;
          }

          const reader = streamRes.body.getReader();
          const decoder = new TextDecoder();
          let fullText = "";

          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

            for (const line of lines) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data) as {
                  choices?: Array<{ delta?: { content?: string } }>;
                };
                const delta = parsed.choices?.[0]?.delta?.content || "";
                if (delta) {
                  fullText += delta;
                  setMessages((p) => {
                    const updated = [...p];
                    updated[updated.length - 1] = { role: "assistant", content: fullText };
                    return updated;
                  });
                }
              } catch {
                /* skip malformed chunks */
              }
            }
          }

          // Parse FOLLOW_UPS from the complete response
          const followUpMatch = fullText.match(/FOLLOW_UPS:\s*(\[[\s\S]*?\])/);
          let followUps: string[] = [];
          let answer = fullText;
          if (followUpMatch) {
            try {
              followUps = JSON.parse(followUpMatch[1]) as string[];
              answer = fullText.replace(/\n?FOLLOW_UPS:[\s\S]*$/, "").trim();
            } catch {
              /* keep full text */
            }
          }

          setMessages((p) => {
            const updated = [...p];
            updated[updated.length - 1] = { role: "assistant", content: answer, followUps };
            return updated;
          });

          // Fire-and-forget: save to DB via the regular tutor endpoint
          fetch("/api/ai/tutor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: content,
              conversationId: conversationIdRef.current,
              history: historySnapshot.map(({ role, content: c }) => ({ role, content: c })),
              course,
              skipAI: true,
              savedResponse: answer,
            }),
          })
            .then(async (r) => {
              if (r.ok) {
                const d = (await r.json()) as { conversationId?: string };
                if (d.conversationId && !conversationIdRef.current) {
                  setConversationId(d.conversationId);
                }
              }
            })
            .catch(() => {});
        } catch {
          // Remove user + placeholder on network error, fall back
          setMessages((p) => p.slice(0, -2));
          setMessages((p) => [...p, userMessage]);
          await sendMessageNonStreaming(content, historySnapshot);
        } finally {
          setIsLoading(false);
        }
      })();

      return [...prev, userMessage, assistantPlaceholder];
    });

    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function startNewConversation() {
    setMessages([]);
    setConversationId(null);
    setInput("");
  }

  const suggestedQuestions = SUGGESTED_QUESTIONS[course] ?? SUGGESTED_QUESTIONS.AP_WORLD_HISTORY;
  const courseLabel = AP_COURSES[course];

  // The last assistant message (for follow-up chips)
  const lastAssistantIdx = messages.reduce(
    (acc, m, i) => (m.role === "assistant" ? i : acc),
    -1
  );

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-indigo-400" />
            AI Tutor
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
            <GraduationCap className="h-4 w-4" />
            {courseLabel} · Powered by Groq · Switch course from sidebar
          </p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={startNewConversation}
            className="gap-2 flex-shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            New chat
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">{courseLabel} Tutor</h2>
              <p className="text-muted-foreground max-w-md mx-auto text-sm">
                Ask me anything about {courseLabel} — concepts, exam strategies,
                practice questions, or study tips.
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Try asking…
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
            <div key={i} className="space-y-2">
              <div
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
                  {msg.role === "assistant" ? (
                    <div className="prose prose-invert prose-sm max-w-none
                      prose-headings:font-semibold prose-headings:text-foreground
                      prose-h2:text-base prose-h3:text-sm
                      prose-p:text-foreground prose-p:leading-relaxed
                      prose-li:text-foreground prose-li:leading-relaxed
                      prose-strong:text-foreground prose-strong:font-semibold
                      prose-code:text-indigo-300 prose-code:bg-indigo-500/10
                      prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                      prose-pre:bg-secondary prose-pre:border prose-pre:border-border/40
                      prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
                      prose-hr:border-border/40"
                    >
                      {msg.content ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Thinking…</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Follow-up chips — only under the last assistant message */}
              {msg.role === "assistant" &&
                i === lastAssistantIdx &&
                !isLoading &&
                msg.followUps &&
                msg.followUps.length > 0 && (
                  <div className="pl-11">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      Follow-up questions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.followUps.map((q) => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          className="text-xs px-3 py-1.5 rounded-full border border-indigo-500/30
                            bg-indigo-500/5 hover:bg-indigo-500/15 text-indigo-300
                            hover:text-indigo-200 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ))
        )}

        {isLoading && messages.length === 0 && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="bg-card border border-border/40 rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking…</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <Card className="border-border/40">
        <CardContent className="p-3">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask anything about ${courseLabel}…`}
              className="min-h-[44px] max-h-32 resize-none border-0 focus-visible:ring-0 p-0 text-sm bg-transparent"
              rows={1}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-9 w-9 flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Enter to send · Shift+Enter for new line
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
