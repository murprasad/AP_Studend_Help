"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  X,
  Send,
  Sparkles,
  Loader2,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const GREETINGS = [
  "Hey there, future 5-scorer! 🌿 I'm Sage, your StudentNest guide. Ask me anything!",
  "Yo! I'm Sage 🌿 — your study sidekick. Lost in the app? Need a pep talk? I got you!",
  "What's up! Sage here 🌿 Ask me about features, courses, or just say hi!",
];

// Page-specific quick prompts
const PROMPTS_BY_PAGE: Record<string, string[]> = {
  "/": [
    "What makes you different from ChatGPT?",
    "How much does it cost?",
    "What exams do you cover?",
    "Is it really free?",
  ],
  "/pricing": [
    "What's the difference between Free and Premium?",
    "Is there a refund policy?",
    "Do I need Premium to practice?",
    "How does annual billing work?",
  ],
  "/ap-prep": [
    "How does AP prep work?",
    "What's included free?",
    "How long until I see results?",
    "Which AP courses do you have?",
  ],
  "/sat-prep": [
    "How does SAT prep work?",
    "Can I improve 200 points?",
    "What's included free?",
    "How long until I see results?",
  ],
  "/act-prep": [
    "How does ACT prep work?",
    "Do you support 5-choice Math?",
    "What's included free?",
    "How long until I see results?",
  ],
  "/clep-prep": [
    "How much can I save with CLEP?",
    "How long does CLEP prep take?",
    "What's a passing CLEP score?",
    "Is it really free to start?",
  ],
  "/about": [
    "Who built StudentNest?",
    "How does the AI work?",
    "What courses are covered?",
    "Is it safe and private?",
  ],
  "/practice": [
    "Which unit should I focus on?",
    "What's Quick Practice vs Mock Exam?",
    "How does scoring work?",
    "Can I practice FRQs?",
  ],
  "/analytics": [
    "How do I improve my accuracy?",
    "What does mastery mean?",
    "How do I set a goal?",
    "What's Tutor Comprehension?",
  ],
  "/study-plan": [
    "How is my plan generated?",
    "Can I change my study plan?",
    "What do priority badges mean?",
    "How often does it update?",
  ],
  "/ai-tutor": [
    "What can I ask you?",
    "How should I use Sage Live Tutor?",
    "What's a knowledge check?",
    "Can you help with homework?",
  ],
};

const DEFAULT_PROMPTS = [
  "How do I start practicing?",
  "What courses are available?",
  "How do I get a study plan?",
  "What's the Mock Exam?",
];

function getPrompts(pathname: string): string[] {
  // Check exact match first, then prefix match for prep pages
  if (PROMPTS_BY_PAGE[pathname]) return PROMPTS_BY_PAGE[pathname];
  for (const key of Object.keys(PROMPTS_BY_PAGE)) {
    if (pathname.startsWith(key) && key !== "/") return PROMPTS_BY_PAGE[key];
  }
  return DEFAULT_PROMPTS;
}

export function SageChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quickPrompts = getPrompts(pathname);

  // Beta 11.0: on the marketing landing page, hide the floating Sage chat
  // until the visitor scrolls past the hero. The chatbot bubble in the
  // hero re-introduces the "AI chatbot" vibe we're trying to remove.
  // Only applies to "/"; other pages show it immediately.
  const isLanding = pathname === "/";
  const [pastHero, setPastHero] = useState(!isLanding);
  useEffect(() => {
    if (!isLanding) return;
    const onScroll = () => {
      if (window.scrollY > 600) setPastHero(true);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLanding]);

  // Stop pulsing after 8 seconds
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 8000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (open) {
      setPulse(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ⚠ Early return MUST come AFTER all hooks. Beta 11.0 originally placed
  // this above the `useEffect`s for `open` and `messages,loading`, which
  // triggered React error #310 ("Rendered more hooks than during the
  // previous render") whenever pastHero flipped true on scroll. Moved
  // here 2026-05-03.
  if (!pastHero) return null;

  // Read course from cookie (works on both marketing and dashboard pages)
  function getCourse(): string {
    try {
      const match = document.cookie.match(/ap_selected_course=([^;]+)/);
      return match?.[1] || "";
    } catch { return ""; }
  }

  async function sendMessage(text: string) {
    const msg = text.trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/sage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: messages.slice(-8),
          context: { page: pathname, course: getCourse() },
        }),
      });

      if (res.status === 401) {
        setMessages((prev) => [...prev, { role: "assistant", content: "I'd love to chat! 🌿 Create a free account to talk with me — it takes 30 seconds. Click 'Get started free' above!" }]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const reply = data.reply || data.error || "Hmm, brain glitch! Try again 🧠";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Oops, I dropped the signal 📡 Try again!" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2">
        {/* Tooltip before first open */}
        {!open && pulse && (
          <div className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg animate-bounce whitespace-nowrap">
            Hey! I&apos;m Sage 🌿 Ask me anything!
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          className={`relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg hover:shadow-blue-500/40 hover:scale-105 transition-all duration-200 flex items-center justify-center ${
            pulse ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-background" : ""
          }`}
          aria-label="Open Sage chat"
        >
          {open ? (
            <ChevronDown className="h-6 w-6 text-white" />
          ) : (
            <Sparkles className="h-6 w-6 text-white" />
          )}
          {pulse && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-background animate-pulse" />
          )}
        </button>
      </div>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-2 sm:bottom-24 sm:right-6 z-50 w-[calc(100vw-1rem)] sm:w-96 bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden"
          style={{ maxHeight: "min(520px, calc(100vh - 7rem))" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">Sage 🌿</p>
                <p className="text-blue-300 text-xs mt-0.5">StudentNest Guide · Powered by Groq</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                  title="Clear chat"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {/* Welcome */}
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="bg-secondary rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%]">
                <p className="text-sm leading-relaxed">{greeting}</p>
              </div>
            </div>

            {/* Quick prompts — page-specific */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-1.5 pl-9">
                {quickPrompts.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs px-3 py-2 rounded-full border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 transition-colors min-h-[36px]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Conversation */}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-3.5 py-2.5 max-w-[85%] text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "bg-secondary rounded-tl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {/* Loading */}
            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border/40 flex-shrink-0">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Sage anything..."
                className="resize-none text-sm min-h-[40px] max-h-[100px] py-2.5 flex-1"
                rows={1}
                disabled={loading}
              />
              <Button
                size="sm"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="bg-blue-600 hover:bg-blue-700 h-11 w-11 p-0 flex-shrink-0"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-1.5">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
}
