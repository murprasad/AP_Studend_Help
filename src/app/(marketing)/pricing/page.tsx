"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Zap, Crown } from "lucide-react";

const FREE_FEATURES = [
  "All 16 AP/SAT/ACT courses",
  "Unlimited MCQ practice questions",
  "MCQ sessions — 3 sessions/day",
  "AI Tutor — 5 conversations/day",
  "Progress analytics & mastery tracking",
  "Mock exam simulator",
  "Basic study plan",
  "Achievements & XP system",
];

const PREMIUM_FEATURES = [
  "Everything in Free, plus:",
  "All 6 CLEP exam courses (earn college credit)",
  "Unlimited MCQ practice sessions",
  "FRQ / SAQ / DBQ / LEQ practice with AI scoring",
  "Unlimited AI Tutor conversations",
  "AI-personalized study plan (updates weekly)",
  "Streaming AI responses (faster answers)",
  "Advanced analytics & weak-area insights",
  "Cancel anytime — keep access until period ends",
  "Early access to new courses",
  "Email support",
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const isAnnual = billingCycle === "annual";
  const monthlyPrice = "9.99";
  const annualPrice = "79.99";
  const annualMonthly = "6.67";

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Start free. Upgrade when you want unlimited AI tutoring, a personalized study plan,
          and access to all 6 CLEP college-credit exams.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            !isAnnual
              ? "bg-indigo-600 text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle("annual")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            isAnnual
              ? "bg-indigo-600 text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Annual
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
            isAnnual ? "bg-white/20 text-white" : "bg-green-500/20 text-green-500"
          }`}>
            Save 33%
          </span>
        </button>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
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

          <Link
            href="/register"
            className="block text-center py-3 px-6 rounded-xl border border-border/40 text-sm font-medium hover:bg-accent transition-colors"
          >
            Get started free
          </Link>
        </div>

        {/* Premium tier */}
        <div className="rounded-2xl border-2 border-indigo-500 bg-card p-8 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-bl-xl">
            MOST POPULAR
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-indigo-400" />
              <h2 className="text-xl font-bold">Premium</h2>
            </div>
            {isAnnual ? (
              <>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold">${annualPrice}</span>
                  <span className="text-muted-foreground mb-1">/year</span>
                </div>
                <p className="text-sm text-green-500 font-medium">≈${annualMonthly}/mo — save 33%</p>
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
          </div>

          <ul className="space-y-3 flex-1 mb-8">
            {PREMIUM_FEATURES.map((f, i) => (
              <li key={f} className={`flex items-start gap-2 text-sm ${i === 0 ? "font-medium text-foreground" : ""}`}>
                <CheckCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${i === 0 ? "text-indigo-400" : "text-green-500"}`} />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <Link
            href={isAnnual ? "/register?plan=annual" : "/register"}
            className="block text-center py-3 px-6 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Start free trial
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-20 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
        <div className="space-y-6">
          {[
            {
              q: "Can I cancel anytime?",
              a: "Yes. Cancel from your billing page and you'll keep Premium access until the end of your billing period.",
            },
            {
              q: "Can I pay annually?",
              a: "Yes — $79.99/year saves you 33% compared to monthly billing (≈$6.67/mo). Select Annual above to get started.",
            },
            {
              q: "What is your refund policy?",
              a: "We offer a 7-day money-back guarantee on new Premium subscriptions. If you're not satisfied within 7 days of your first payment, email contact@studentnest.ai and we'll issue a full refund — no questions asked. After 7 days, subscriptions are non-refundable but you can cancel anytime and keep access until the end of your billing period.",
            },
            {
              q: "What happens when I hit the free AI limit?",
              a: "Free users can start 5 new AI Tutor conversations per day. Your existing conversations are never deleted.",
            },
            {
              q: "Is there a student discount?",
              a: "We keep the free tier generous so every student can prepare for their AP exams. Premium is designed to be affordable at $9.99/month — or $79.99/year.",
            },
            {
              q: "Which payment methods are accepted?",
              a: "All major credit and debit cards via Stripe. Your payment info is never stored on our servers.",
            },
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
