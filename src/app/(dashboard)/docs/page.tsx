"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Printer, Loader2, BookOpen, Layers, Cpu, ClipboardList, CheckSquare, Link2 } from "lucide-react";

const DOCS = [
  {
    slug: "HLR",
    title: "High Level Requirements",
    description: "Stakeholders, functional & non-functional requirements, supported courses, subscription tiers.",
    icon: ClipboardList,
    color: "text-blue-400",
    version: "1.4",
  },
  {
    slug: "DR",
    title: "Detailed Requirements",
    description: "Line-by-line requirements for every feature: auth, practice, AI tutor, billing, gamification, flags.",
    icon: FileText,
    color: "text-emerald-400",
    version: "1.4",
  },
  {
    slug: "HLD",
    title: "High Level Design",
    description: "System overview, component architecture, data flow diagrams, API route map, DB entity relationships.",
    icon: Layers,
    color: "text-purple-400",
    version: "1.4",
  },
  {
    slug: "ARCH",
    title: "Architecture Document",
    description: "Full tech stack, infrastructure diagram, database schema, deployment pipeline, security model.",
    icon: Cpu,
    color: "text-amber-400",
    version: "1.4",
  },
  {
    slug: "TCR",
    title: "Test Cases & Results",
    description: "43 test cases across auth, practice, mock exam, AI tutor, billing, gamification, and docs.",
    icon: CheckSquare,
    color: "text-green-400",
    version: "1.4",
  },
  {
    slug: "RTM",
    title: "Requirements Traceability Matrix",
    description: "Maps every HLR and DR to implementation files and test cases. 100% requirement coverage.",
    icon: Link2,
    color: "text-rose-400",
    version: "1.4",
  },
];

export default function DocsPage() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function openDoc(slug: string) {
    if (activeSlug === slug) {
      setActiveSlug(null);
      setContent("");
      return;
    }
    setActiveSlug(slug);
    setLoading(true);
    try {
      const res = await fetch(`/docs/${slug}.md`);
      const text = await res.text();
      setContent(text);
    } catch {
      setContent("Failed to load document. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  const activeDoc = DOCS.find((d) => d.slug === activeSlug);

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          nav, aside, header, [data-sidebar], .no-print { display: none !important; }
          .prose { font-size: 11pt; line-height: 1.5; }
          .prose h1 { font-size: 18pt; margin-top: 24pt; }
          .prose h2 { font-size: 14pt; margin-top: 18pt; }
          .prose h3 { font-size: 12pt; margin-top: 12pt; }
          .prose table { border-collapse: collapse; width: 100%; }
          .prose td, .prose th { border: 1px solid #ccc; padding: 4pt 8pt; }
          .prose pre { background: #f5f5f5; padding: 8pt; font-size: 9pt; }
          .prose code { background: #f0f0f0; padding: 1pt 3pt; font-size: 9pt; }
          body { background: white !important; color: black !important; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-indigo-400" />
            Platform Documentation
          </h1>
          <p className="text-muted-foreground mt-1">
            Living documents — updated with every significant feature change. v1.4 · 2026-03-15
          </p>
        </div>

        {/* Document cards */}
        <div className="grid md:grid-cols-2 gap-4 no-print">
          {DOCS.map((doc) => {
            const Icon = doc.icon;
            const isActive = activeSlug === doc.slug;
            return (
              <Card
                key={doc.slug}
                className={`card-glow cursor-pointer transition-all ${
                  isActive ? "border-indigo-500/50 bg-indigo-500/5" : "border-border/40 hover:bg-accent"
                }`}
                onClick={() => openDoc(doc.slug)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${doc.color}`} />
                    {doc.title}
                    <Badge variant="outline" className="ml-auto text-xs font-normal">
                      v{doc.version}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground mb-3">{doc.description}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      className="text-xs h-7"
                      onClick={(e) => { e.stopPropagation(); openDoc(doc.slug); }}
                    >
                      {isActive ? "Close" : "View"}
                    </Button>
                    <a
                      href={`/docs/${doc.slug}.md`}
                      download={`${doc.slug}.md`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button size="sm" variant="ghost" className="text-xs h-7 gap-1">
                        <Download className="h-3 w-3" /> .md
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Document viewer */}
        {activeSlug && (
          <Card className="card-glow">
            <CardHeader className="border-b border-border/40 no-print">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {activeDoc && <activeDoc.icon className={`h-4 w-4 ${activeDoc.color}`} />}
                  {activeDoc?.title}
                </CardTitle>
                <div className="flex gap-2">
                  <a href={`/docs/${activeSlug}.md`} download={`${activeSlug}.md`}>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                      <Download className="h-3.5 w-3.5" /> Download .md
                    </Button>
                  </a>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={handlePrint}>
                    <Printer className="h-3.5 w-3.5" /> Print / Save PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading document…</span>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none
                  prose-headings:font-bold prose-headings:text-foreground
                  prose-h1:text-2xl prose-h1:mb-4 prose-h1:border-b prose-h1:border-border/40 prose-h1:pb-3
                  prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-h2:text-indigo-300
                  prose-h3:text-base prose-h3:mt-5 prose-h3:mb-2
                  prose-p:text-muted-foreground prose-p:leading-relaxed
                  prose-li:text-muted-foreground
                  prose-strong:text-foreground
                  prose-code:text-indigo-300 prose-code:bg-indigo-500/10 prose-code:px-1 prose-code:rounded prose-code:text-xs
                  prose-pre:bg-secondary/50 prose-pre:border prose-pre:border-border/40 prose-pre:text-xs prose-pre:overflow-x-auto
                  prose-table:text-sm prose-th:text-foreground prose-th:font-semibold prose-th:bg-secondary/50
                  prose-td:text-muted-foreground prose-td:border-border/40 prose-tr:border-border/40
                  prose-blockquote:border-indigo-500/50 prose-blockquote:text-muted-foreground
                  prose-hr:border-border/40">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                  </ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
