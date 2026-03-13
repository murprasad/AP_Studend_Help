"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Crown, Zap, CheckCircle, ExternalLink, Loader2, ArrowUpRight, PartyPopper } from "lucide-react";
import Link from "next/link";

export default function BillingPage() {
  const { data: session, status, update } = useSession();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // After Stripe redirects back with ?success=1, refresh the session so
  // the JWT picks up the new PREMIUM subscriptionTier from the DB.
  useEffect(() => {
    if (searchParams.get("success") === "1") {
      setRefreshing(true);
      // Poll until the webhook has updated the DB (usually < 2s)
      const interval = setInterval(async () => {
        await update();
      }, 1500);
      // Stop after 10s regardless
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setRefreshing(false);
      }, 10000);
      return () => { clearInterval(interval); clearTimeout(timeout); };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPremium = session?.user?.subscriptionTier === "PREMIUM";

  async function openPortal() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Could not open billing portal. Please try again.");
      }
    } catch {
      alert("Could not open billing portal. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const justUpgraded = searchParams.get("success") === "1";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Crown className="h-8 w-8 text-indigo-400" />
          Billing
        </h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and payment details.</p>
      </div>

      {/* Payment success banner */}
      {justUpgraded && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <PartyPopper className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-emerald-400">
              {refreshing && !isPremium ? "Activating your Premium account…" : "Welcome to Premium!"}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {refreshing && !isPremium
                ? "Your payment was successful. Activating Premium features — this takes a few seconds."
                : "Your Premium subscription is active. Enjoy unlimited AI tutoring and all premium features!"}
            </p>
          </div>
          {refreshing && !isPremium && (
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400 flex-shrink-0 mt-1" />
          )}
        </div>
      )}

      {/* Current plan */}
      <Card className="mb-6 border-border/40">
        <CardHeader>
          <CardTitle className="text-lg">Current plan</CardTitle>
          <CardDescription>Your active PrepNova subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPremium ? "bg-indigo-500/20" : "bg-secondary"}`}>
                {isPremium ? (
                  <Crown className="h-5 w-5 text-indigo-400" />
                ) : (
                  <Zap className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold">{isPremium ? "Premium" : "Free"}</p>
                <p className="text-sm text-muted-foreground">
                  {isPremium ? "$9.99 / month · Cancel anytime" : "10 AI conversations / day"}
                </p>
              </div>
            </div>

            {isPremium ? (
              <Button
                variant="outline"
                size="sm"
                onClick={openPortal}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="h-3.5 w-3.5" />
                )}
                Manage subscription
              </Button>
            ) : (
              <Link href="/pricing">
                <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Upgrade to Premium
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Premium features */}
      {isPremium ? (
        <Card className="border-indigo-500/20 bg-indigo-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-indigo-400" />
              Premium features active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {[
                "Unlimited AI Tutor conversations",
                "AI-personalized study plan",
                "Streaming AI responses",
                "Priority model access",
                "Advanced analytics",
                "Early access to new courses",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-lg">Unlock Premium</CardTitle>
            <CardDescription>Get unlimited access to every PrepNova feature.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6">
              {[
                "Unlimited AI Tutor conversations (vs 10/day on Free)",
                "Personalized study plan that adapts to your progress",
                "Faster streaming AI responses",
                "Advanced weak-area analytics",
                "Priority access to new AP courses",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/pricing">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                View pricing — from $9.99/month
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Portal link for existing subscribers */}
      {isPremium && (
        <p className="text-xs text-muted-foreground mt-6 text-center">
          To cancel, update payment info, or view invoices, use{" "}
          <button
            onClick={openPortal}
            className="text-indigo-400 hover:underline"
            disabled={isLoading}
          >
            the Stripe customer portal
          </button>
          .
        </p>
      )}
    </div>
  );
}
