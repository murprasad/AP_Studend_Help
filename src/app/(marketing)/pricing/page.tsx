"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const FREE_FEATURES = [
  "All 22 courses — AP, SAT, ACT & CLEP",
  "Unlimited MCQ practice questions",
  "3 practice sessions per day",
  "5 AI explanations per day — never get stuck",
  "Progress tracking & mastery heatmap",
  "Mock exam simulator with score estimate",
  "Basic study plan",
  "Streaks, XP & achievements",
];

const MODULE_CONFIGS = {
  ap: {
    label: "AP Premium",
    color: "indigo",
    features: [
      "Everything in Free, plus:",
      "Unlimited practice — no daily limits",
      "FRQ / SAQ / DBQ / LEQ with AI rubric scoring",
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
      "Full prep for all 6 CLEP exams",
      "Unlimited AI explanations — ask Sage anything",
      "Personalized CLEP study plan (6–12 weeks)",
      "Faster AI responses (streaming)",
      "Save $1,200+ per exam passed in tuition",
      "Cancel anytime · 7-day money-back guarantee",
    ],
  },
};

type ModuleKey = keyof typeof MODULE_CONFIGS;

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [activeModule, setActiveModule] = useState<ModuleKey>("ap");

  const isAnnual = billingCycle === "annual";
  const monthlyPrice = "9.99";
  const annualPrice = "79.99";
  const annualMonthly = "6.67";
  const config = MODULE_CONFIGS[activeModule];

  // Tailwind can't do dynamic classes, so map explicitly
  const colorMap: Record<string, { border: string; bg: string; text: string; btn: string; check: string; badge: string }> = {
    indigo: { border: "border-indigo-500", bg: "bg-indigo-500/5", text: "text-indigo-400", btn: "bg-indigo-600 hover:bg-indigo-700", check: "text-indigo-400", badge: "bg-indigo-600" },
    blue: { border: "border-blue-500", bg: "bg-blue-500/5", text: "text-blue-400", btn: "bg-blue-600 hover:bg-blue-700", check: "text-blue-400", badge: "bg-blue-600" },
    violet: { border: "border-violet-500", bg: "bg-violet-500/5", text: "text-violet-400", btn: "bg-violet-600 hover:bg-violet-700", check: "text-violet-400", badge: "bg-violet-600" },
    emerald: { border: "border-emerald-500", bg: "bg-emerald-500/5", text: "text-emerald-400", btn: "bg-emerald-600 hover:bg-emerald-700", check: "text-emerald-400", badge: "bg-emerald-600" },
  };
  const c = colorMap[config.color];

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Free to start. Upgrade any module for $9.99/mo. Subscribe to multiple modules independently.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            !isAnnual ? "bg-indigo-600 text-white" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle("annual")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            isAnnual ? "bg-indigo-600 text-white" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Annual
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
            isAnnual ? "bg-white/20 text-white" : "bg-green-500/20 text-green-500"
          }`}>Save 33%</span>
        </button>
      </div>

      {/* Module tabs */}
      <div className="flex justify-center gap-2 mb-10">
        {(Object.keys(MODULE_CONFIGS) as ModuleKey[]).map((key) => {
          const mc = MODULE_CONFIGS[key];
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
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
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
                <p className="text-sm text-green-500 font-medium">${annualMonthly}/mo — save 33%</p>
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
            <p className="text-xs text-muted-foreground/60 mt-1">Less than a single hour of tutoring</p>
          </div>
          <ul className="space-y-3 flex-1 mb-8">
            {config.features.map((f, i) => (
              <li key={f} className={`flex items-start gap-2 text-sm ${i === 0 ? "font-medium text-foreground" : ""}`}>
                <CheckCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${i === 0 ? c.check : "text-green-500"}`} />
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

      {/* Trust + refund */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-sm font-medium text-emerald-400">7-day money-back guarantee on all Premium plans</p>
        <p className="text-xs text-muted-foreground">
          Equivalent to 10+ hours of private tutoring per month. Need multiple modules? Subscribe to each independently.
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
                <th className="text-center p-3 font-medium text-indigo-400">StudentNest Prep</th>
                <th className="text-center p-3 font-medium">Prep Course</th>
                <th className="text-center p-3 font-medium">Private Tutor</th>
                <th className="text-center p-3 font-medium">ChatGPT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {[
                ["Price", "$0–9.99/mo", "$200–500", "$50–150/hr", "Free–$20/mo"],
                ["Exam-Aligned Questions", "✅", "✅", "✅", "❌"],
                ["Mastery Tracking", "✅", "Partial", "❌", "❌"],
                ["Personalized Study Plan", "✅ AI-generated", "Static", "✅", "❌"],
                ["Instant AI Explanations", "✅ 24/7", "❌", "Scheduled", "✅ Generic"],
                ["Score Prediction", "✅", "Partial", "❌", "❌"],
              ].map(([feature, ...values]) => (
                <tr key={feature} className="hover:bg-secondary/20">
                  <td className="p-3 font-medium text-left">{feature}</td>
                  {values.map((v, i) => (
                    <td key={i} className={`p-3 text-center ${i === 0 ? "text-indigo-400 font-medium" : "text-muted-foreground"}`}>{v}</td>
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
            { q: "Can I subscribe to multiple modules?", a: "Yes! Each module (AP, SAT, ACT, CLEP) is an independent $9.99/mo subscription. Subscribe to as many as you need." },
            { q: "Can I cancel anytime?", a: "Yes. Cancel from your billing page and you'll keep Premium access until the end of your billing period." },
            { q: "Can I pay annually?", a: "Yes — $79.99/year per module saves you 33% compared to monthly billing ($6.67/mo)." },
            { q: "What is your refund policy?", a: "We offer a 7-day money-back guarantee on new Premium subscriptions. If you're not satisfied within 7 days of your first payment, email contact@studentnest.ai and we'll issue a full refund — no questions asked. After 7 days, subscriptions are non-refundable but you can cancel anytime and keep access until the end of your billing period." },
            { q: "What happens when I hit the free AI limit?", a: "Free users can start 5 new AI Tutor conversations per day. Your existing conversations are never deleted." },
            { q: "Is there a student discount?", a: "We keep the free tier generous so every student can prepare for their exams. Premium is $9.99/month per module — or $79.99/year." },
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
