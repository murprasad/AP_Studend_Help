import type { Metadata } from "next";
import { BookOpen, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog & Resources — StudentNest Prep",
  description: "Study tips, exam strategies, and learning science articles from the StudentNest Prep team.",
  openGraph: {
    title: "Blog | StudentNest Prep",
    description: "Study smarter with tips, strategies, and insights for AP, SAT, ACT & CLEP exams.",
  },
};

const articles = [
  {
    title: "How AI-Powered Practice Is Changing Test Prep",
    excerpt: "Traditional flashcards and textbooks can only take you so far. Here's how adaptive AI practice targets your weak areas and accelerates improvement.",
    category: "Learning Science",
    categoryColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    readTime: "5 min read",
    date: "Mar 20, 2026",
  },
  {
    title: "AP vs CLEP: Which Path Is Right for You?",
    excerpt: "Both earn college credit, but they work very differently. We break down cost, difficulty, acceptance rates, and which students benefit most from each.",
    category: "College Planning",
    categoryColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    readTime: "7 min read",
    date: "Mar 18, 2026",
  },
  {
    title: "5 Evidence-Based Ways to Raise Your SAT Score",
    excerpt: "Forget cramming the night before. These research-backed strategies — from spaced repetition to timed practice — produce measurable score gains in 4-6 weeks.",
    category: "Study Tips",
    categoryColor: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    readTime: "6 min read",
    date: "Mar 15, 2026",
  },
  {
    title: "The Science Behind Mastery-Based Learning",
    excerpt: "Why do some students plateau at 70% while others push to 95%? The answer lies in how mastery-based progression rewires study habits and builds lasting understanding.",
    category: "Learning Science",
    categoryColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    readTime: "4 min read",
    date: "Mar 12, 2026",
  },
  {
    title: "How to Save $7,200+ with CLEP Exams",
    excerpt: "Six CLEP exams, $93 each, can replace six college courses. Here's exactly how to plan, prepare, and pass — with a realistic timeline and study strategy.",
    category: "CLEP Guide",
    categoryColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    readTime: "8 min read",
    date: "Mar 10, 2026",
  },
];

export default function BlogPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto">
          <BookOpen className="h-7 w-7 text-blue-500" />
        </div>
        <h1 className="text-4xl font-bold">Blog &amp; Resources</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Study tips, exam strategies, and learning science — from the StudentNest Prep team.
        </p>
      </div>

      {/* Articles grid */}
      <div className="space-y-4">
        {articles.map((a) => (
          <article
            key={a.title}
            className="p-6 rounded-xl border border-border/40 bg-card/50 hover:bg-accent/50 transition-colors space-y-3"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${a.categoryColor}`}>
                {a.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {a.readTime}
              </span>
              <span className="text-xs text-muted-foreground">{a.date}</span>
            </div>
            <h2 className="text-lg font-bold">{a.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{a.excerpt}</p>
            <p className="text-xs text-blue-500 font-medium flex items-center gap-1">
              Coming soon <ArrowRight className="h-3 w-3" />
            </p>
          </article>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center space-y-3 py-8">
        <p className="text-muted-foreground text-sm">More articles coming soon. In the meantime:</p>
        <Link href="/register" className="inline-flex items-center gap-2 text-sm font-medium text-blue-500 hover:underline">
          Start practicing free <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
