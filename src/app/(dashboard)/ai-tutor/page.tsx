"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCourse } from "@/hooks/use-course";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ApCourse } from "@prisma/client";
import { ChevronDown } from "lucide-react";
import { AP_COURSES } from "@/lib/utils";
import { COURSE_REGISTRY } from "@/lib/courses";
import { parseSections, type TutorSections } from "@/components/tutor/section-parser";
import { SectionCards } from "@/components/tutor/section-cards";
import { KnowledgeCheck } from "@/components/tutor/knowledge-check";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  Loader2,
  Bot,
  User,
  Lightbulb,
  GraduationCap,
  RefreshCw,
  Crown,
  ArrowRight,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  followUps?: string[];
}

const SUGGESTED_QUESTIONS = Object.fromEntries(
  Object.entries(COURSE_REGISTRY).map(([k, v]) => [k, v.suggestedTutorQuestions])
) as Record<string, string[]>;

/** Strip markdown syntax for a compact preview string */
function stripMarkdown(md: string): string {
  return md
    .replace(/[#*_`[\]()>~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const TUTOR_COURSE_OPTIONS = (
  Object.entries(COURSE_REGISTRY) as [ApCourse, { name: string }][]
).map(([value, cfg]) => ({ value, label: cfg.name }));

export default function AiTutorPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const router = useRouter();
  const [course, setCourse] = useCourse();

  function handleCourseChange(newCourse: ApCourse) {
    setCourse(newCourse);
    router.refresh();
  }
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  // Split-panel state
  const [currentSections, setCurrentSections] = useState<TutorSections | null>(null);
  const [wikiImageUrl, setWikiImageUrl] = useState<string | undefined>(undefined);
  const [isStreaming, setIsStreaming] = useState(false);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(null);
  conversationIdRef.current = conversationId;

  useEffect(() => {
    setMessages([]);
    setConversationId(null);
    setInput("");
    setLimitReached(false);
    setCurrentSections(null);
    setWikiImageUrl(undefined);
  }, [course]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          if (response.status === 429 && data.limitExceeded) {
            setLimitReached(true);
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
          followUps: Array.isArray(data.followUps)
            ? data.followUps.filter((q: string) => typeof q === "string" && q.length > 10 && !/^q\d+$/i.test(q.trim()))
            : [],
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setCurrentSections(parseSections(data.response));

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

    setMessages((prev) => {
      const historySnapshot = prev;
      const assistantPlaceholder: Message = { role: "assistant", content: "" };

      (async () => {
        setIsLoading(true);
        setIsStreaming(true);
        setWikiImageUrl(undefined);
        // Reset right panel scroll to top
        rightPanelRef.current?.scrollTo({ top: 0, behavior: "instant" });

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
            setMessages((p) => p.slice(0, -2));
            setMessages((p) => [...p, userMessage]);
            setIsStreaming(false);
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
                  // Live-update right panel sections during streaming
                  setCurrentSections(parseSections(fullText));
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
              const parsed = JSON.parse(followUpMatch[1]) as string[];
              // Filter out placeholder values (e.g. "q1", "q2") that some weaker AI models emit literally
              followUps = parsed.filter((q) => typeof q === "string" && q.length > 10 && !/^q\d+$/i.test(q.trim()));
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

          const finalSections = parseSections(answer);
          setCurrentSections(finalSections);
          setIsStreaming(false);

          // Fetch Wikipedia image from core concept
          if (finalSections.coreConceptMd) {
            const topic = stripMarkdown(finalSections.coreConceptMd).split(/\s+/).slice(0, 4).join(" ");
            fetch(`/api/ai/tutor/image?topic=${encodeURIComponent(topic)}`)
              .then((r) => r.json())
              .then((d: { imageUrl?: string }) => setWikiImageUrl(d.imageUrl ?? undefined))
              .catch(() => {});
          }

          // Fire-and-forget: save to DB
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
          setMessages((p) => p.slice(0, -2));
          setMessages((p) => [...p, userMessage]);
          setIsStreaming(false);
          await sendMessageNonStreaming(content, historySnapshot);
        } finally {
          setIsLoading(false);
          setIsStreaming(false);
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
    setCurrentSections(null);
    setWikiImageUrl(undefined);
  }

  const suggestedQuestions = SUGGESTED_QUESTIONS[course] ?? SUGGESTED_QUESTIONS.AP_WORLD_HISTORY;
  const courseLabel = AP_COURSES[course];

  const lastAssistantIdx = messages.reduce(
    (acc, m, i) => (m.role === "assistant" ? i : acc),
    -1
  );

  // Follow-up chips from last assistant message
  const lastFollowUps = lastAssistantIdx >= 0 ? messages[lastAssistantIdx].followUps ?? [] : [];

  // Input / header shared components
  const inputCard = (
    <Card className={`border-border/40 flex-shrink-0 ${limitReached ? "opacity-50 pointer-events-none" : ""}`}>
      <CardContent className="p-3">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={limitReached ? "Daily limit reached — upgrade to continue" : `Ask anything about ${courseLabel}…`}
            className="min-h-[44px] max-h-32 resize-none border-0 focus-visible:ring-0 p-0 text-sm bg-transparent"
            rows={1}
            disabled={limitReached}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading || limitReached}
            size="icon"
            className="h-9 w-9 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Enter to send · Shift+Enter for new line</p>
      </CardContent>
    </Card>
  );

  const limitBanner = limitReached && session?.user?.subscriptionTier !== "PREMIUM" ? (
    <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-shrink-0">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Crown className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <p className="font-semibold text-sm">Daily limit reached</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Free accounts can start 10 new AI conversations per day. Upgrade to Premium for unlimited access.
          </p>
        </div>
      </div>
      <Link href="/pricing" className="flex-shrink-0">
        <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto">
          <Crown className="h-3.5 w-3.5" />
          Upgrade to Premium
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  ) : null;

  return (
    <>
      {/* ── DESKTOP two-panel layout ─────────────────────────────────────── */}
      <div className="hidden lg:flex h-[calc(100vh-5rem)] overflow-hidden -mx-6">

        {/* LEFT PANEL */}
        <div className="w-[360px] flex-shrink-0 flex flex-col border-r border-border/40 px-4 py-4 gap-3">
          {/* Header */}
          <div className="flex items-start justify-between flex-shrink-0">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-400" />
                AI Tutor
              </h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs hover:text-foreground transition-colors">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>{courseLabel}</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {TUTOR_COURSE_OPTIONS.map((opt) => (
                    <DropdownMenuItem
                      key={opt.value}
                      onClick={() => handleCourseChange(opt.value)}
                      className={cn(
                        "cursor-pointer text-sm",
                        course === opt.value && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {messages.length > 0 && (
              <Button variant="outline" size="sm" onClick={startNewConversation} className="gap-1.5 text-xs h-8">
                <RefreshCw className="h-3 w-3" />
                New chat
              </Button>
            )}
          </div>

          {/* Messages / suggested questions */}
          <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
            {messages.length === 0 ? (
              <div className="space-y-4 py-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                    <Bot className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h2 className="text-base font-bold mb-1">{courseLabel} Tutor</h2>
                  <p className="text-muted-foreground text-xs">
                    Ask anything about {courseLabel} — concepts, strategies, or practice questions.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" />
                    Try asking…
                  </p>
                  <div className="space-y-1.5">
                    {suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="w-full text-left p-2.5 rounded-lg border border-border/40 hover:bg-accent text-xs transition-colors leading-relaxed"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg, i) => (
                  <div key={i}>
                    {msg.role === "user" ? (
                      <div className="flex gap-2 justify-end">
                        <div className="max-w-[85%] p-2.5 rounded-xl text-sm bg-indigo-600 text-white rounded-br-sm">
                          {msg.content}
                        </div>
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-start">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot className="h-3 w-3 text-indigo-400" />
                        </div>
                        <button
                          className="max-w-[85%] p-2.5 rounded-xl text-sm bg-card border border-border/40 rounded-bl-sm text-left hover:border-indigo-500/40 transition-colors"
                          onClick={() => {
                            if (msg.content) {
                              setCurrentSections(parseSections(msg.content));
                              setWikiImageUrl(undefined);
                              rightPanelRef.current?.scrollTo({ top: 0, behavior: "instant" });
                            }
                          }}
                        >
                          {msg.content ? (
                            <span className="text-muted-foreground line-clamp-2">
                              {stripMarkdown(parseSections(msg.content).coreConceptMd).slice(0, 80) ||
                                stripMarkdown(msg.content).slice(0, 80)}
                              {!msg.content && <Loader2 className="h-3 w-3 animate-spin inline" />}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Thinking…
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Follow-up chips — above input so they're always reachable */}
          {!isStreaming && lastFollowUps.length > 0 && (
            <div className="flex-shrink-0 space-y-1.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                Follow-up questions
              </p>
              <div className="flex flex-col gap-1.5">
                {lastFollowUps.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="w-full text-left text-xs lg:text-sm px-3 py-2 rounded-lg border border-indigo-500/30
                      bg-indigo-500/5 hover:bg-indigo-500/15 text-indigo-300
                      hover:text-indigo-200 transition-colors leading-relaxed"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Knowledge check — optional, click-to-start */}
          {!isStreaming && lastAssistantIdx >= 0 && messages[lastAssistantIdx]?.content && (
            <div className="flex-shrink-0">
              <KnowledgeCheck
                tutorResponse={messages[lastAssistantIdx].content}
                course={course}
                topic={null}
                conversationId={conversationId}
              />
            </div>
          )}

          {/* Limit banner */}
          {limitBanner}

          {/* Input */}
          {inputCard}
        </div>

        {/* RIGHT PANEL */}
        <div ref={rightPanelRef} className="flex-1 overflow-y-auto px-6 py-4">
          {currentSections || isStreaming ? (
            <div className="space-y-4 max-w-3xl">
              <SectionCards
                sections={currentSections}
                isStreaming={isStreaming}
                wikiImageUrl={wikiImageUrl}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <MessageSquare className="h-10 w-10 text-indigo-400/50" />
              </div>
              <div>
                <p className="font-semibold text-muted-foreground">Ask a question to see your answer here</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Answers are structured into 5 sections for easy review
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE single-column layout (unchanged) ──────────────────────── */}
      <div className="lg:hidden flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-indigo-400" />
              AI Tutor
            </h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-muted-foreground mt-1 flex items-center gap-2 text-sm hover:text-foreground transition-colors">
                  <GraduationCap className="h-4 w-4" />
                  <span>{courseLabel}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {TUTOR_COURSE_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => handleCourseChange(opt.value)}
                    className={cn(
                      "cursor-pointer text-sm",
                      course === opt.value && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={startNewConversation} className="gap-2 flex-shrink-0">
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
                  Ask me anything about {courseLabel} — concepts, exam strategies, practice questions, or study tips.
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
                <div className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
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
                      <div className="prose prose-invert max-w-none
                        prose-headings:font-semibold prose-headings:text-foreground
                        prose-h2:text-lg prose-h3:text-base
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
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
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

        {/* Follow-up chips — above input, always visible without scrolling */}
        {!isStreaming && lastFollowUps.length > 0 && (
          <div className="mb-3 space-y-1.5 flex-shrink-0">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              Follow-up questions
            </p>
            <div className="flex flex-col gap-1.5">
              {lastFollowUps.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg border border-indigo-500/30
                    bg-indigo-500/5 hover:bg-indigo-500/15 text-indigo-300
                    hover:text-indigo-200 transition-colors leading-relaxed"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Knowledge check — optional, click-to-start */}
        {!isStreaming && lastAssistantIdx >= 0 && messages[lastAssistantIdx]?.content && (
          <div className="mb-3 flex-shrink-0">
            <KnowledgeCheck
              tutorResponse={messages[lastAssistantIdx].content}
              course={course}
              topic={null}
              conversationId={conversationId}
            />
          </div>
        )}

        {limitBanner}
        {inputCard}
      </div>
    </>
  );
}
