"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getExamLabel, getCourseCount } from "@/lib/exam-label";

const ALL_MODULE_CONFIGS = {
  ap: {
    label: "AP Premium",
    color: "indigo",
    features: [
      "Everything in Free, plus:",
      "Unlimited practice — no daily limits",
      "FRQ / SAQ / DBQ / LEQ scored against the official College Board rubric",
      "Unlimited AI explanations — ask Sage anything",
      "Personalized AP study plan that adapts weekly",
      "Faster AI responses (streaming)",
      "Cancel anytime · 7-day money-back guarantee",
    ],
  },
  sat: {
    label: "SAT Premium",
    color: "blue",
    features: [
      "Everything in Free, plus:",
      "Unlimited practice — no daily limits",
      "Unlimited AI explanations — ask Sage anything",
      "Personalized SAT study plan targeting weak areas",
      "Advanced analytics with score prediction",
      "Faster AI responses (streaming)",
      "Cancel anytime · 7-day money-back guarantee",
    ],
  },
  act: {
    label: "ACT Premium",
    color: "violet",
    features: [
      "Everything in Free, plus:",
      "Unlimited practice — no daily limits",
      "Unlimited AI explanations — ask Sage anything",
      "Personalized ACT study plan by section",
      "Section-by-section composite tracking",
      "Faster AI responses (streaming)",
      "Cancel anytime · 7-day money-back guarantee",
    ],
  },
  clep: {
    label: "CLEP Premium",
    color: "emerald",
    features: [
      "Everything in Free, plus:",
      "Full prep for all 34 CLEP exams",
      "Unlimited AI explanations — ask Sage anything",
      "Personalized CLEP study plan (6–12 weeks)",
      "Faster AI responses (streaming)",
      "Save $1,200+ per exam passed in tuition",
      "Cancel anytime · 7-day money-back guarantee",
    ],
  },
  dsst: {
    label: "DSST Premium",
    color: "orange",
    features: [
      "Everything in Free, plus:",
      "Full prep for all 22 DSST exams",
      "Unlimited AI explanations — ask Sage anything",
      "Personalized DSST study plan",
      "Faster AI responses (streaming)",
      "Save $1,000+ per exam passed in tuition",
      "Cancel anytime · 7-day money-back guarantee",
    ],
  },
};

type AllModuleKey = keyof typeof ALL_MODULE_CONFIGS;

interface PricingClientProps {
  clepEnabled: boolean;
  dsstEnabled: boolean;
}

export default function PricingClient({ clepEnabled, dsstEnabled }: PricingClientProps) {
  const visibleKeys = (Object.keys(ALL_MODULE_CONFIGS) as AllModuleKey[]).filter((k) => {
    if (k === "clep" && !clepEnabled) return false;
    if (k === "dsst" && !dsstEnabled) return false;
    return true;
  });

  const MODULE_CONFIGS = Object.fromEntries(
    visibleKeys.map((k) => [k, ALL_MODULE_CONFIGS[k]])
  ) as Record<string, (typeof ALL_MODULE_CONFIGS)[AllModuleKey]>;

  type ModuleKey = (typeof visibleKeys)[number];

  const courseCount = getCourseCount(clepEnabled, dsstEnabled);
  const examLabel = getExamLabel(clepEnabled, dsstEnabled);

  const FREE_FEATURES = [
    `All ${courseCount} courses — ${examLabel}`,
    // Beta 9.1.2 — aligned to FREE_LIMITS source of truth
    // (src/lib/tier-limits.ts). Was previously contradictory across
    // landing/pricing/billing.
    "30 practice questions per day",
    "3 Sage Live Tutor chats per day",
    "1 free FRQ attempt per type, per course (DBQ, LEQ, SAQ)",
    "5-question mock exam preview",
    "Progress tracking & mastery heatmap",
    "Basic study plan",
    "Streaks, XP & achievements",
  ];

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [activeModule, setActiveModule] = useState<ModuleKey>("ap");

  const isAnnual = billingCycle === "annual";
  const monthlyPrice = "9.99";
  const annualPrice = "79.99";
  const annualMonthly = "6.67";
  const config = MODULE_CONFIGS[activeModule] ?? MODULE_CONFIGS[visibleKeys[0]];

  const colorMap: Record<string, { border: string; bg: string; text: string; btn: string; check: string; badge: string }> = {
    indigo: { border: "border-blue-500", bg: "bg-blue-500/5", text: "text-blue-500", btn: "bg-blue-600 hover:bg-blue-700", check: "text-blue-500", badge: "bg-blue-600" },
    blue: { border: "border-blue-500", bg: "bg-blue-500/5", text: "text-blue-700 dark:text-blue-400", btn: "bg-blue-600 hover:bg-blue-700", check: "text-blue-700 dark:text-blue-400", badge: "bg-blue-600" },
    violet: { border: "border-violet-500", bg: "bg-violet-500/5", text: "text-violet-700 dark:text-violet-400", btn: "bg-violet-600 hover:bg-violet-700", check: "text-violet-700 dark:text-violet-400", badge: "bg-violet-600" },
    emerald: { border: "border-emerald-500", bg: "bg-emerald-500/5", text: "text-emerald-700 dark:text-emerald-400", btn: "bg-emerald-700 hover:bg-emerald-800", check: "text-emerald-700 dark:text-emerald-400", badge: "bg-emerald-600" },
    orange: { border: "border-orange-500", bg: "bg-orange-500/5", text: "text-orange-700 dark:text-orange-400", btn: "bg-orange-600 hover:bg-orange-700", check: "text-orange-700 dark:text-orange-400", badge: "bg-orange-600" },
  };
  const c = colorMap[config.color];

  const moduleListLabel = visibleKeys.map((k) => k.toUpperCase()).join(", ");

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Header — Beta 9.4.1 outcome-driven framing (Task #34, 2026-04-30):
          previous "Simple, transparent pricing" was logistical not
          outcome-anchored. New hero leads with the result the student
          gets (a passing exam score) and quantifies the value vs
          tutoring. The price-anchor stays prominent below. */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">
          Score higher on AP, SAT &amp; ACT — for $9.99/month
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The cost of one tutoring session covers a full year of practice across every exam — graded against the official rubric.
        </p>
        <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium mt-3">
          ✦ One subscription unlocks every exam · Cancel anytime · 7-day refund
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            !isAnnual ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle("annual")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            isAnnual ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Annual
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
            isAnnual ? "bg-white/20 text-white" : "bg-green-500/20 text-green-900 dark:text-green-400"
          }`}>Save 33%</span>
        </button>
      </div>

      {/* Module tabs */}
      <div className="flex justify-center gap-2 mb-10">
        {visibleKeys.map((key) => {
          const mc = ALL_MODULE_CONFIGS[key];
          const cm = colorMap[mc.color];
          return (
            <button
              key={key}
              onClick={() => setActiveModule(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeModule === key
                  ? `${cm.badge} text-white`
                  : "text-muted-foreground hover:text-foreground bg-secondary/50"
              }`}
            >
              {mc.label.replace(" Premium", "")}
            </button>
          );
        })}
      </div>

      {/* Pricing cards — 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free tier */}
        <div className="rounded-2xl border border-border/40 bg-card p-8 flex flex-col">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-bold">Free</h2>
            </div>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground mb-1">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">No credit card required</p>
          </div>
          <ul className="space-y-3 flex-1 mb-8">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Link href="/register" className="block text-center py-3 px-6 rounded-xl border border-border/40 text-sm font-medium hover:bg-accent transition-colors">
            Get started free
          </Link>
        </div>

        {/* Premium tier (dynamic per module) */}
        <div className={`rounded-2xl border-2 ${c.border} ${c.bg} p-8 flex flex-col relative overflow-hidden`}>
          <div className={`absolute top-0 right-0 ${c.badge} text-white text-xs font-bold px-3 py-1.5 rounded-bl-xl`}>
            {config.label.replace(" Premium", "").toUpperCase()}
          </div>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Crown className={`h-5 w-5 ${c.text}`} />
              <h2 className="text-xl font-bold">{config.label}</h2>
            </div>
            {isAnnual ? (
              <>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold">${annualPrice}</span>
                  <span className="text-muted-foreground mb-1">/year</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">${annualMonthly}/mo — save 33%</p>
              </>
            ) : (
              <>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold">${monthlyPrice}</span>
                  <span className="text-muted-foreground mb-1">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">Cancel anytime</p>
              </>
            )}
            <p className="text-xs text-muted-foreground mt-1">Less than a single hour of tutoring</p>
          </div>
          <ul className="space-y-3 flex-1 mb-8">
            {config.features.map((f, i) => (
              <li key={f} className={`flex items-start gap-2 text-sm ${i === 0 ? "font-medium text-foreground" : ""}`}>
                <CheckCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${i === 0 ? c.check : "text-green-700 dark:text-green-400"}`} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <form action={`/api/checkout?plan=${isAnnual ? "annual" : "monthly"}&module=${activeModule}`} method="POST">
            <Button type="submit" className={`w-full ${c.btn} text-white`}>
              Start {config.label}
            </Button>
          </form>
        </div>
      </div>

      {/* Trust + outcome anchor + refund (single line — refund repetition was
          flagged in the 2026-04-25 conversion review for sub-conscious doubt) */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-base font-medium text-foreground/90 max-w-xl mx-auto">
          Everything you need to raise your score — without paying for full tutoring.
        </p>
        <p className="text-sm text-emerald-700 dark:text-emerald-700 dark:text-emerald-400 font-medium">
          Cancel anytime · 7-day money-back guarantee
        </p>
      </div>

      {/* How We Compare */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2">How We Compare</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">Save $500+ compared to traditional prep courses</p>
        <div className="rounded-xl border border-border/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/60 text-muted-foreground">
                <th className="text-left p-3 font-medium"></th>
                <th className="text-center p-3 font-medium text-blue-500">StudentNest Prep</th>
                <th className="text-center p-3 font-medium">Prep Course</th>
                <th className="text-center p-3 font-medium">Private Tutor</th>
                <th className="text-center p-3 font-medium">General AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {[
                ["Price", "$0–9.99/mo", "$200–500", "$50–150/hr", "Free–$20/mo"],
                ["Exam-Aligned Questions", "✅", "✅", "✅", "Not exam-format"],
                ["Mastery Tracking", "✅", "Partial", "âŒ", "âŒ"],
                ["Personalized Study Plan", "✅ AI-generated", "Static", "✅", "âŒ"],
                ["Instant AI Explanations", "✅ 24/7", "âŒ", "Scheduled", "✅ General-purpose"],
                ["Score Prediction", "✅", "Partial", "âŒ", "âŒ"],
              ].map(([feature, ...values]) => (
                <tr key={feature} className="hover:bg-secondary/20">
                  <td className="p-3 font-medium text-left">{feature}</td>
                  {values.map((v, i) => (
                    <td key={i} className={`p-3 text-center ${i === 0 ? "text-blue-500 font-medium" : "text-muted-foreground"}`}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-20 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
        <div className="space-y-6">
          {[
            { q: "Do I need to subscribe to multiple modules?", a: `No — one $9.99/mo subscription unlocks everything. Sign up via any exam (${moduleListLabel}) and you get full Premium access to all of them. The module dropdowns just decide which checkout flow you go through.` },
            { q: "Can I cancel anytime?", a: "Yes. Cancel from your billing page and you'll keep Premium access until the end of your billing period." },
            { q: "Can I pay annually?", a: "Yes — $79.99/year saves you 33% compared to monthly billing ($6.67/mo). Same all-access Premium." },
            { q: "What is your refund policy?", a: "We offer a 7-day money-back guarantee on new Premium subscriptions. If you're not satisfied within 7 days of your first payment, email contact@studentnest.ai and we'll issue a full refund — no questions asked. After 7 days, subscriptions are non-refundable but you can cancel anytime and keep access until the end of your billing period." },
            { q: "What happens when I hit the free AI limit?", a: "Free users can start 3 new Sage Live Tutor conversations per day. Your existing conversations are never deleted." },
            { q: "Is there a student discount?", a: "We keep the free tier generous so every student can prepare for their exams. Premium is $9.99/month or $79.99/year — one all-access subscription." },
            { q: "Which payment methods are accepted?", a: "All major credit and debit cards via Stripe. Your payment info is never stored on our servers." },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-border/40 pb-6">
              <h3 className="font-semibold mb-2">{q}</h3>
              <p className="text-sm text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
