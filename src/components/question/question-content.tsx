/**
 * QuestionContent — render question stimulus + text with markdown.
 *
 * AI-generated questions commonly contain:
 *   - Tables (units, given/value pairs, reaction matrices)
 *   - LaTeX math ($E = mc^2$, $\\frac{1}{2}mv^2$)
 *   - Bold/italic emphasis
 *   - Code blocks (AP CSP)
 *
 * Previously, `diagnostic/page.tsx`, `practice/page.tsx`, `mock-exam/page.tsx`,
 * and `frq-practice-card.tsx` rendered these as plain `{question.stimulus}`
 * — LLM-collapsed single-line markdown tables (pipes + dashes) showed up
 * as raw text (see B7 in docs/bugs-found-2026-04-24.md).
 *
 * This component wraps `react-markdown` with:
 *   - remark-gfm       (tables, strikethrough, task lists)
 *   - remark-math      + rehype-katex  (LaTeX)
 *   - normalizeMarkdownTables (recovers single-line tables from LLM output)
 *
 * Keep this SSR-safe — no `"use client"`, no React hooks. Callers decide
 * where to mount it.
 */

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { normalizeMarkdownTables } from "@/lib/markdown-helpers";

const tableComponents = {
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-2">
      <table className="w-full border-collapse border border-border/40 text-sm">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="bg-secondary/60 px-3 py-2 text-xs uppercase font-semibold border border-border/40 text-left">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border border-border/40 px-3 py-2 text-sm">{children}</td>
  ),
};

export function QuestionContent({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={
        `prose prose-sm max-w-none
        prose-p:my-1 prose-p:leading-relaxed
        prose-li:leading-relaxed
        prose-strong:font-semibold
        prose-code:text-blue-500 prose-code:bg-blue-500/10
        prose-code:px-1 prose-code:py-0.5 prose-code:rounded ${className}`
      }
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={tableComponents}
      >
        {normalizeMarkdownTables(content)}
      </ReactMarkdown>
    </div>
  );
}
