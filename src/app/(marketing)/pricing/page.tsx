import Link from "next/link";
import { CheckCircle, Zap, Crown } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isPaymentsEnabled, getStripeConfig } from "@/lib/settings";

const FREE_FEATURES = [
  "Access to all 3 AP courses",
  "MCQ practice — 3 sessions/day",
  "AI Tutor — 10 conversations/day",
  "Progress analytics & mastery tracking",
  "Mock exam simulator",
  "Basic study plan",
  "Achievements & XP system",
];

const PREMIUM_FEATURES = [
  "Everything in Free, plus:",
  "Unlimited MCQ practice sessions",
  "FRQ / SAQ / DBQ / LEQ practice with AI scoring",
  "Unlimited AI Tutor conversations",
  "AI-personalized study plan (updates weekly)",
  "Streaming AI responses (faster answers)",
  "Advanced analytics & weak-area insights",
  "Early access to new AP courses",
  "Email support",
];

export default async function PricingPage() {
  const session = await getServerSession(authOptions);
  const isPremium = session?.user?.subscriptionTier === "PREMIUM";
  const [paymentsEnabled, stripeConfig] = await Promise.all([
    isPaymentsEnabled(),
    getStripeConfig(),
  ]);
  const premiumPrice = stripeConfig.premiumPriceDisplay || "9.99";
  const premiumName = stripeConfig.premiumName || "Premium";

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Start free. Upgrade when you want unlimited AI tutoring and a
          personalized study plan that adapts as you improve.
        </p>
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

          {session ? (
            <Link
              href="/dashboard"
              className="block text-center py-3 px-6 rounded-xl border border-border/40 text-sm font-medium hover:bg-accent transition-colors"
            >
              Go to dashboard
            </Link>
          ) : (
            <Link
              href="/register"
              className="block text-center py-3 px-6 rounded-xl border border-border/40 text-sm font-medium hover:bg-accent transition-colors"
            >
              Get started free
            </Link>
          )}
        </div>

        {/* Premium tier */}
        <div className="rounded-2xl border-2 border-indigo-500 bg-card p-8 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-bl-xl">
            MOST POPULAR
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-indigo-400" />
              <h2 className="text-xl font-bold">{premiumName}</h2>
            </div>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-bold">${premiumPrice}</span>
              <span className="text-muted-foreground mb-1">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">Cancel anytime</p>
          </div>

          <ul className="space-y-3 flex-1 mb-8">
            {PREMIUM_FEATURES.map((f, i) => (
              <li key={f} className={`flex items-start gap-2 text-sm ${i === 0 ? "font-medium text-foreground" : ""}`}>
                <CheckCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${i === 0 ? "text-indigo-400" : "text-green-500"}`} />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          {isPremium ? (
            <Link
              href="/billing"
              className="block text-center py-3 px-6 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Manage subscription
            </Link>
          ) : paymentsEnabled ? (
            <form action="/api/checkout" method="POST">
              <button
                type="submit"
                className="w-full py-3 px-6 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                {session ? "Upgrade to Premium" : "Start free trial"}
              </button>
            </form>
          ) : (
            <div className="block text-center py-3 px-6 rounded-xl bg-secondary text-sm text-muted-foreground">
              Payments temporarily unavailable
            </div>
          )}
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
              q: "What happens when I hit the free AI limit?",
              a: "Free users can start 10 new AI Tutor conversations per day. Your existing conversations are never deleted.",
            },
            {
              q: "Is there a student discount?",
              a: `We keep the free tier generous so every student can prepare for their AP exams. ${premiumName} is designed to be affordable at $${premiumPrice}/month.`,
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
