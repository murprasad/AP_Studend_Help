import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, GraduationCap, Clock, TrendingUp, DollarSign, Users, Shield, BookOpen } from "lucide-react";
import { FadeIn } from "@/components/landing/fade-in";

export const metadata: Metadata = {
  title: "DSST Exam Prep — Pass and Save $1,000+ Per Course | StudentNest Prep",
  description: "Pass your DSST exam with AI-powered prep. 5 high-demand exams in Business & Psychology. $85 exam replaces a $1,000+ college course. Free to start.",
  openGraph: {
    title: "Pass Your DSST Exam — Save $1,000+ | StudentNest Prep",
    description: "One $85 exam replaces a full college course. AI builds your custom study plan. 5 DSST exams. Free to start.",
    url: "https://studentnest.ai/dsst-prep",
  },
};

const topExams = [
  { name: "Principles of Supervision", hours: "15–25", passRate: "High", savings: "$1,000", tip: "Easiest DSST — mostly common-sense management" },
  { name: "Human Resource Management", hours: "20–30", passRate: "High", savings: "$1,000", tip: "Employment law + HR processes — very practical" },
  { name: "Organizational Behavior", hours: "20–30", passRate: "High", savings: "$1,000", tip: "Leadership theories + motivation — intuitive content" },
  { name: "Personal Finance", hours: "15–25", passRate: "High", savings: "$1,000", tip: "Budgeting, investing, insurance — real-world knowledge helps" },
  { name: "Lifespan Developmental Psychology", hours: "20–30", passRate: "Medium", savings: "$1,000", tip: "Overlaps with AP/CLEP Psych — Piaget, Erikson, attachment" },
];

const domains = [
  {
    name: "Business & Management",
    emoji: "💼",
    totalSavings: "$4,000",
    courses: [
      { name: "Principles of Supervision", savings: "$1,000" },
      { name: "Human Resource Management", savings: "$1,000" },
      { name: "Organizational Behavior", savings: "$1,000" },
      { name: "Personal Finance", savings: "$1,000" },
    ],
  },
  {
    name: "Social Sciences",
    emoji: "🧠",
    totalSavings: "$1,000",
    courses: [
      { name: "Lifespan Developmental Psychology", savings: "$1,000" },
    ],
  },
];

const allCourses = domains.flatMap(d => d.courses.map(c => ({ ...c, domain: d.name })));

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "DSST Exam Prep Courses",
  description: "5 DSST exams with AI-powered practice — earn college credit and save thousands",
  numberOfItems: 5,
  itemListElement: allCourses.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Course",
      name: c.name,
      description: `AI-powered ${c.name} DSST prep. 5 units. Pass and save ${c.savings} in tuition.`,
      provider: { "@type": "Organization", name: "StudentNest Prep", url: "https://studentnest.ai" },
      isAccessibleForFree: true,
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
        { "@type": "Offer", price: "9.99", priceCurrency: "USD", name: "DSST Premium", billingIncrement: "P1M" },
      ],
    },
  })),
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What is a DSST exam?", acceptedAnswer: { "@type": "Answer", text: "DSST (DANTES Subject Standardized Tests) are credit-by-exam tests accepted at 1,900+ colleges. Pass one and earn 3 college credits — skipping a full course." } },
    { "@type": "Question", name: "What's the easiest DSST exam?", acceptedAnswer: { "@type": "Answer", text: "Principles of Supervision is widely considered the easiest DSST exam, with high pass rates and mostly common-sense management content." } },
    { "@type": "Question", name: "How much does a DSST exam cost?", acceptedAnswer: { "@type": "Answer", text: "Each DSST exam costs $85. Active military can take DSSTs for free through DANTES funding." } },
    { "@type": "Question", name: "Do colleges accept DSST credit?", acceptedAnswer: { "@type": "Answer", text: "Over 1,900 colleges accept DSST credit, but policies vary by institution. Check with your school's registrar before testing." } },
    { "@type": "Question", name: "How is DSST different from CLEP?", acceptedAnswer: { "@type": "Answer", text: "Both are credit-by-exam programs. CLEP is run by College Board (34 exams), DSST by Prometric (30+ exams). DSST covers more specialized business and military topics. Many students take both." } },
  ],
};

export default function DsstPrepPage() {
  return (
    <div className="space-y-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ═══ HERO ═══ */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-12">
        <div className="text-center space-y-5">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium">
              <GraduationCap className="h-4 w-4" /> 5 DSST Exams · Business & Psychology
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.1] tracking-tight mt-4">
              Pass Your DSST Exam.<br />
              <span className="text-orange-400">Save $1,000+ Per Course.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
              One $85 exam replaces a full college course. AI builds your custom study plan — focus only on what&apos;s tested. Accepted at 1,900+ colleges.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/register?module=dsst">
                <Button size="lg" className="gap-2 bg-orange-600 hover:bg-orange-700 w-full sm:w-auto">
                  Start DSST Prep Free <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#exams">
                <Button size="lg" variant="ghost" className="text-orange-400 hover:text-orange-300 w-full sm:w-auto">
                  View All 5 Exams
                </Button>
              </a>
            </div>
            <p className="text-xs text-muted-foreground/60">Free to start. No credit card required.</p>
          </FadeIn>
        </div>
      </section>

      {/* ═══ WHY DSST ═══ */}
      <section className="bg-secondary/20 py-14">
        <div className="max-w-5xl mx-auto px-4">
          <FadeIn>
            <h2 className="text-2xl font-bold text-center mb-2">Why DSST?</h2>
            <p className="text-sm text-muted-foreground text-center mb-8">The fastest way to earn college credit — especially for business courses</p>
          </FadeIn>
          <div className="grid sm:grid-cols-4 gap-5">
            {[
              { icon: DollarSign, label: "Save $1,000+", desc: "Per exam passed — skip the course entirely" },
              { icon: Clock, label: "2–4 Week Prep", desc: "Most students pass with focused AI-guided study" },
              { icon: BookOpen, label: "100 MCQ", desc: "120 minutes, 4-choice format — no essays" },
              { icon: GraduationCap, label: "3 Credits", desc: "Each passing score earns 3 semester hours" },
            ].map((item) => (
              <FadeIn key={item.label}>
                <div className="text-center p-5 rounded-xl border border-border/40 bg-card/50">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center mx-auto mb-3">
                    <item.icon className="h-5 w-5 text-orange-400" />
                  </div>
                  <p className="font-bold text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TOP EXAMS ═══ */}
      <section id="exams" className="max-w-5xl mx-auto px-4 py-16 scroll-mt-20">
        <FadeIn>
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold">5 High-Demand DSST Exams</h2>
            <p className="text-sm text-muted-foreground mt-2">Start with the easiest — Principles of Supervision has the highest pass rate</p>
          </div>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topExams.map((exam, i) => (
            <FadeIn key={exam.name}>
              <div className="relative p-5 rounded-xl border border-border/40 bg-card/50 hover:border-orange-500/30 transition-colors h-full">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">#{i + 1}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${exam.passRate === "High" ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {exam.passRate} pass rate
                    </span>
                  </div>
                  <p className="font-semibold text-sm">{exam.name}</p>
                  <p className="text-xs text-muted-foreground italic">&ldquo;{exam.tip}&rdquo;</p>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-muted-foreground"><Clock className="h-3 w-3 inline mr-1" />{exam.hours} hrs</p>
                    <p className="text-sm font-bold text-orange-400">Save {exam.savings}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link href="/register?module=dsst">
            <Button className="gap-2 bg-orange-600 hover:bg-orange-700">Start with the Easiest Exam <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </section>

      {/* ═══ PERSONA CARDS ═══ */}
      <section className="bg-gradient-to-b from-transparent via-orange-500/[0.03] to-transparent py-14">
        <div className="max-w-5xl mx-auto px-4">
          <FadeIn>
            <h2 className="text-2xl font-bold text-center mb-2">Who Takes DSST Exams?</h2>
            <p className="text-sm text-muted-foreground text-center mb-8">DSST is popular with three groups</p>
          </FadeIn>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: Shield, color: "orange", label: "Military & Veterans",
                title: "Free exams through DANTES",
                desc: "Active duty and eligible veterans take DSST exams at no cost. Free exam + free prep = free college credits toward your degree.",
              },
              {
                icon: Users, color: "amber", label: "Adult Learners",
                title: "Finish your degree faster",
                desc: "Working professionals skip intro courses by testing out. Study on your schedule — schedule your exam any week.",
              },
              {
                icon: TrendingUp, color: "yellow", label: "Cost-Conscious Students",
                title: "Save thousands on tuition",
                desc: "Stack 3-5 DSST + CLEP exams and enter college with a semester of credits already earned.",
              },
            ].map((p) => (
              <FadeIn key={p.label}>
                <div className="p-6 rounded-2xl border border-border/40 bg-card/60 space-y-3 h-full flex flex-col">
                  <div className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-${p.color}-400`}>
                    <p.icon className="h-4 w-4" /> {p.label}
                  </div>
                  <p className="text-lg font-bold">{p.title}</p>
                  <p className="text-sm text-muted-foreground flex-1">{p.desc}</p>
                  <Link href="/register?module=dsst">
                    <Button variant="ghost" size="sm" className={`text-${p.color}-400 hover:text-${p.color}-300 p-0 h-auto`}>
                      Start prep free <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ALL DOMAINS ═══ */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <FadeIn>
          <h2 className="text-2xl font-bold text-center mb-8">All DSST Courses by Domain</h2>
        </FadeIn>
        <div className="grid sm:grid-cols-2 gap-6">
          {domains.map((domain) => (
            <FadeIn key={domain.name}>
              <div className="p-6 rounded-2xl border border-border/40 bg-card/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">{domain.emoji} {domain.name}</h3>
                  <span className="text-xs text-orange-400 font-semibold bg-orange-500/10 px-2 py-1 rounded">
                    Save up to {domain.totalSavings}
                  </span>
                </div>
                <div className="space-y-2">
                  {domain.courses.map((c) => (
                    <div key={c.name} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                      <span className="text-sm">{c.name}</span>
                      <span className="text-xs font-medium text-orange-400">{c.savings}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="bg-secondary/20 py-14">
        <div className="max-w-4xl mx-auto px-4">
          <FadeIn>
            <h2 className="text-2xl font-bold text-center mb-8">How StudentNest DSST Prep Works</h2>
          </FadeIn>
          <div className="grid sm:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Pick Your Exam", desc: "Choose from 5 high-demand DSST exams" },
              { step: "2", title: "Take a Diagnostic", desc: "AI identifies your strengths and weak spots" },
              { step: "3", title: "Follow Your Plan", desc: "Sage builds a personalized study plan" },
              { step: "4", title: "Pass the Exam", desc: "Score 400+ on a 500-point scale and earn 3 credits" },
            ].map((s) => (
              <FadeIn key={s.step}>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center mx-auto mb-3">
                    {s.step}
                  </div>
                  <p className="font-bold text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <FadeIn>
          <h2 className="text-2xl font-bold text-center mb-8">Everything You Need to Pass</h2>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { title: "AI-Generated Questions", desc: "Unlimited practice questions that match DSST exam format — 4-choice MCQ at intro college level" },
            { title: "Sage AI Tutor", desc: "Ask Sage anything about your course material — get instant, detailed explanations" },
            { title: "Personalized Study Plan", desc: "AI analyzes your diagnostic and builds a week-by-week plan targeting your weak areas" },
            { title: "Progress Analytics", desc: "Track your mastery by unit, see readiness scores, and know exactly when you're prepared" },
            { title: "Free Study Resources", desc: "Curated links to OpenStax, Khan Academy, Saylor Academy — all free, all legal" },
            { title: "Mock Exams", desc: "Timed 100-question practice tests that simulate the real DSST exam experience" },
          ].map((f) => (
            <FadeIn key={f.title}>
              <div className="p-5 rounded-xl border border-border/40 bg-card/50 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-400 flex-shrink-0" />
                  <p className="font-semibold text-sm">{f.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="bg-secondary/20 py-14">
        <div className="max-w-3xl mx-auto px-4">
          <FadeIn>
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          </FadeIn>
          <div className="space-y-4">
            {[
              { q: "What is a DSST exam?", a: "DSST (DANTES Subject Standardized Tests) are credit-by-exam tests administered by Prometric and accepted at 1,900+ colleges. Each exam costs $85 and earns 3 college credits if you pass." },
              { q: "What's the easiest DSST exam to pass?", a: "Principles of Supervision is widely considered the easiest DSST exam. It covers common-sense management topics and has a high pass rate." },
              { q: "How is DSST different from CLEP?", a: "Both are credit-by-exam programs. CLEP is by College Board (34 exams), DSST is by Prometric (30+ exams). DSST offers more specialized business and technical subjects. Many students take both." },
              { q: "Do all colleges accept DSST credit?", a: "Over 1,900 colleges accept DSST, but policies vary. Always check with your school's registrar before testing." },
              { q: "Can military take DSST exams for free?", a: "Yes. Active-duty military can take DSST exams at no cost through DANTES funding. Eligible veterans may also qualify." },
              { q: "What score do I need to pass?", a: "Most DSST exams require a score of approximately 400 on a 500-point scale. The ACE-recommended passing score earns 3 semester hours of credit." },
            ].map((faq) => (
              <FadeIn key={faq.q}>
                <div className="p-5 rounded-xl border border-border/40 bg-card/50">
                  <p className="font-semibold text-sm">{faq.q}</p>
                  <p className="text-sm text-muted-foreground mt-2">{faq.a}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <FadeIn>
          <h2 className="text-3xl font-bold">Ready to Earn College Credit?</h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Pass one DSST exam and save $1,000+ in tuition. Start with a free diagnostic to see where you stand.
          </p>
          <div className="mt-6">
            <Link href="/register?module=dsst">
              <Button size="lg" className="gap-2 bg-orange-600 hover:bg-orange-700">
                Start DSST Prep Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-3">Free forever. Premium at $9.99/month.</p>
        </FadeIn>
      </section>

      {/* ═══ DISCLAIMER ═══ */}
      <div className="max-w-3xl mx-auto px-4 pb-8">
        <p className="text-[10px] text-muted-foreground/50 text-center">
          DSST is a registered trademark of Prometric. StudentNest Prep is not affiliated with, endorsed by, or sponsored by Prometric or DANTES.
          All practice questions are AI-generated original content. Exam acceptance varies by institution — verify with your school before testing.
        </p>
      </div>
    </div>
  );
}
