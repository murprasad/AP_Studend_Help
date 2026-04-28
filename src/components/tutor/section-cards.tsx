"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { AlertTriangle, Zap, Target, BarChart2, BookOpen } from "lucide-react";
import type { TutorSections } from "./section-parser";

// ── Mermaid support via npm-installed package ─────────────────────────────
// Switched 2026-04-27 from CDN (cdn.jsdelivr.net) to dynamic import of the
// installed mermaid@11 package. The CDN was being blocked by our production
// Content-Security-Policy (next.config.mjs script-src didn't list jsdelivr),
// causing every Mermaid block to silently fall back to the raw-code <pre>
// display — students saw "graph LR; A-->B" as text instead of a flowchart.

let mermaidInit = false;

function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`);
  const [state, setState] = useState<"pending" | "ok" | "fallback">("pending");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("mermaid");
        const mermaid = mod.default;
        if (cancelled) return;
        if (!mermaidInit) {
          mermaid.initialize({
            theme: "dark",
            startOnLoad: false,
            securityLevel: "strict",
            fontFamily: "inherit",
          });
          mermaidInit = true;
        }
        try {
          await mermaid.parse(code);
        } catch {
          if (!cancelled) setState("fallback");
          return;
        }
        try {
          const { svg } = await mermaid.render(idRef.current, code);
          if (!cancelled && ref.current) {
            ref.current.innerHTML = svg;
            setState("ok");
          }
        } catch {
          if (!cancelled) setState("fallback");
        }
      } catch {
        if (!cancelled) setState("fallback");
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  if (state === "fallback") {
    return (
      <pre className="text-xs text-muted-foreground p-3 bg-secondary/50 rounded-lg overflow-x-auto border border-border/40 whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
    );
  }
  return <div ref={ref} className={`overflow-x-auto ${state === "pending" ? "hidden" : ""}`} />;
}

// normalizeMarkdownTables moved to src/lib/markdown-helpers.ts so unit tests
// can import it without pulling in client/JSX deps. Re-export for any
// existing callers that imported it from here.
import { normalizeMarkdownTables } from "@/lib/markdown-helpers";
export { normalizeMarkdownTables };

// ── Shared markdown renderer ───────────────────────────────────────────────

export const tableComponents = {
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-2">
      <table className="w-full border-collapse border border-blue-500/20 text-sm">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="bg-blue-500/10 px-3 py-2 text-xs uppercase font-semibold border border-blue-500/20 text-left">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border border-blue-500/20 px-3 py-2 text-sm">{children}</td>
  ),
};

export const mermaidComponents = {
  ...tableComponents,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  code: ({ className, children }: any) => {
    const lang = /language-(\w+)/.exec(className || "")?.[1];
    if (lang === "mermaid") {
      return <MermaidBlock code={String(children).trim()} />;
    }
    return (
      <code className="bg-secondary px-1 py-0.5 rounded text-xs font-mono">{children}</code>
    );
  },
};

export function MarkdownContent({ content, useMermaid = false }: { content: string; useMermaid?: boolean }) {
  return (
    <div className="prose prose-invert max-w-none
      prose-p:text-foreground prose-p:leading-relaxed prose-p:my-1
      prose-li:text-foreground prose-li:leading-relaxed
      prose-strong:text-foreground prose-strong:font-semibold
      prose-headings:text-foreground prose-headings:font-semibold
      prose-h2:text-lg prose-h3:text-base
      prose-code:text-blue-700 dark:text-blue-400 prose-code:bg-blue-500/10
      prose-code:px-1 prose-code:py-0.5 prose-code:rounded
      prose-ul:my-1 prose-ol:my-1"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={useMermaid ? mermaidComponents : tableComponents}
      >
        {normalizeMarkdownTables(content)}
      </ReactMarkdown>
    </div>
  );
}

// ── Skeleton shimmer ───────────────────────────────────────────────────────

function SkeletonShimmer() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-3 bg-muted/40 rounded w-3/4" />
      <div className="h-3 bg-muted/40 rounded w-full" />
      <div className="h-3 bg-muted/40 rounded w-5/6" />
      <div className="h-3 bg-muted/40 rounded w-4/5" />
    </div>
  );
}

// ── Section card wrapper ───────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  borderColor,
  bgColor,
  children,
  isCompleted,
  isStreaming,
  extra,
}: {
  title: string;
  icon: React.ReactNode;
  borderColor: string;
  bgColor: string;
  children: React.ReactNode;
  isCompleted: boolean;
  isStreaming: boolean;
  extra?: React.ReactNode;
}) {
  const showSkeleton = isStreaming && !isCompleted;

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {extra}
      </div>
      {showSkeleton ? <SkeletonShimmer /> : children}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

interface SectionCardsProps {
  sections: TutorSections | null;
  isStreaming: boolean;
  wikiImageUrl?: string;
}

export function SectionCards({ sections, isStreaming, wikiImageUrl }: SectionCardsProps) {
  if (!sections && !isStreaming) return null;

  const s = sections;
  const completed = s?.completedSections ?? new Set();

  // Determine which sections have been "seen" (heading appeared in text)
  const seenCore = !!(s?.coreConceptMd);
  const seenVisual = !!(s?.visualBreakdownMd);
  const seenAp = !!(s?.apExampleMd);
  const seenTraps = !!(s?.commonTrapsMd);
  const seenHook = !!(s?.memoryHookMd);

  return (
    <div className="space-y-4">
      {/* 🎯 Core Concept */}
      <SectionCard
        title="Core Concept"
        icon={<Target className="h-4 w-4 text-blue-500" />}
        borderColor="border-blue-500/30"
        bgColor="bg-blue-500/5"
        isCompleted={completed.has("core")}
        isStreaming={isStreaming && !seenCore}
        extra={
          wikiImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={wikiImageUrl}
              alt="Wikipedia thumbnail"
              className="w-16 h-16 object-cover rounded-lg opacity-80"
            />
          ) : undefined
        }
      >
        {seenCore ? (
          <MarkdownContent content={s!.coreConceptMd} />
        ) : isStreaming ? (
          <SkeletonShimmer />
        ) : null}
      </SectionCard>

      {/* 📊 Visual Breakdown */}
      <SectionCard
        title="Visual Breakdown"
        icon={<BarChart2 className="h-4 w-4 text-blue-700 dark:text-blue-400" />}
        borderColor="border-blue-500/30"
        bgColor="bg-blue-500/5"
        isCompleted={completed.has("visual")}
        isStreaming={isStreaming && !seenVisual}
      >
        {seenVisual ? (
          <MarkdownContent content={s!.visualBreakdownMd} useMermaid />
        ) : isStreaming ? (
          <SkeletonShimmer />
        ) : null}
      </SectionCard>

      {/* 📝 How AP Asks This */}
      <SectionCard
        title="How AP Asks This"
        icon={<BookOpen className="h-4 w-4 text-purple-700 dark:text-purple-400" />}
        borderColor="border-purple-500/30"
        bgColor="bg-purple-500/5"
        isCompleted={completed.has("apExample")}
        isStreaming={isStreaming && !seenAp}
      >
        {seenAp ? (
          <div className="border-l-2 border-purple-500/40 pl-3">
            <div className="text-xs font-medium text-purple-700 dark:text-purple-400 uppercase tracking-wide mb-2">
              AP Exam Style
            </div>
            <MarkdownContent content={s!.apExampleMd} />
          </div>
        ) : isStreaming ? (
          <SkeletonShimmer />
        ) : null}
      </SectionCard>

      {/* ⚠️ Common Traps */}
      <SectionCard
        title="Common Traps"
        icon={<AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400" />}
        borderColor="border-amber-500/30"
        bgColor="bg-amber-500/5"
        isCompleted={completed.has("traps")}
        isStreaming={isStreaming && !seenTraps}
      >
        {seenTraps ? (
          <MarkdownContent content={s!.commonTrapsMd} />
        ) : isStreaming ? (
          <SkeletonShimmer />
        ) : null}
      </SectionCard>

      {/* 💡 Memory Hook */}
      <SectionCard
        title="Memory Hook"
        icon={<Zap className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />}
        borderColor="border-emerald-500/30"
        bgColor="bg-emerald-500/5"
        isCompleted={completed.has("hook")}
        isStreaming={isStreaming && !seenHook}
      >
        {seenHook ? (
          <MarkdownContent content={s!.memoryHookMd} />
        ) : isStreaming ? (
          <SkeletonShimmer />
        ) : null}
      </SectionCard>
    </div>
  );
}
