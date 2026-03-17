"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Crown, Zap, CheckCircle, ExternalLink, Loader2, ArrowUpRight,
  PartyPopper, AlertTriangle, Calendar, RefreshCw, Sparkles,
} from "lucide-react";
import Link from "next/link";

interface BillingStatus {
  subscriptionTier: string;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  hasSubscriptionId: boolean;
}

function daysUntil(isoDate: string): number {
  const end = new Date(isoDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function BillingPage() {
  const { data: session, status, update } = useSession();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [reactivating, setReactivating] = useState(false);

  const fetchBillingStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/status");
      if (res.ok) {
        const data = await res.json() as BillingStatus;
        setBillingStatus(data);
      }
    } catch {
      // ignore
    }
  }, []);

  // On mount, fetch billing status from DB
  useEffect(() => {
    if (status === "authenticated") {
      fetchBillingStatus();
    }
  }, [status, fetchBillingStatus]);

  // After Stripe redirects back with ?success=1, refresh the session so
  // the JWT picks up the new PREMIUM subscriptionTier from the DB.
  useEffect(() => {
    if (searchParams.get("success") === "1") {
      setRefreshing(true);
      const interval = setInterval(async () => {
        await update();
        await fetchBillingStatus();
      }, 1500);
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setRefreshing(false);
      }, 10000);
      return () => { clearInterval(interval); clearTimeout(timeout); };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const isPremium = session?.user?.subscriptionTier === "PREMIUM";
  const isCanceling = billingStatus?.subscriptionStatus === "canceling";
  const periodEnd = billingStatus?.currentPeriodEnd;
  const daysLeft = periodEnd ? daysUntil(periodEnd) : null;

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

  async function cancelSubscription() {
    setCanceling(true);
    setCancelMessage(null);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await res.json() as { success?: boolean; periodEnd?: string; message?: string; error?: string };
      if (data.success) {
        setCancelConfirm(false);
        setCancelMessage(`Your subscription has been scheduled for cancellation. You'll keep Premium access until ${data.periodEnd ? formatDate(data.periodEnd) : "the end of your billing period"}.`);
        await fetchBillingStatus();
      } else {
        alert(data.error || "Could not cancel subscription. Use the billing portal instead.");
      }
    } catch {
      alert("Could not cancel subscription. Please try again.");
    } finally {
      setCanceling(false);
    }
  }

  async function reactivateSubscription() {
    setReactivating(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "DELETE" });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.success) {
        setCancelMessage(null);
        await fetchBillingStatus();
      } else {
        alert(data.error || "Could not reactivate subscription. Please use the billing portal.");
      }
    } catch {
      alert("Could not reactivate subscription. Please try again.");
    } finally {
      setReactivating(false);
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

      {/* Cancellation success message */}
      {cancelMessage && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
          <Calendar className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-300">{cancelMessage}</p>
          </div>
        </div>
      )}

      {/* Current plan */}
      <Card className="mb-6 border-border/40">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Current plan
            {isPremium && (
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs">
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            )}
            {isCanceling && (
              <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-xs">
                Canceling
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Your active StudentNest subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  {isPremium
                    ? isCanceling
                      ? "Access until end of billing period"
                      : "$9.99 / month · Cancel anytime"
                    : "5 AI conversations / day"}
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
                Billing portal
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

          {/* Days remaining / renewal info */}
          {isPremium && periodEnd && (
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              isCanceling
                ? "border-amber-500/30 bg-amber-500/5"
                : daysLeft !== null && daysLeft <= 7
                  ? "border-orange-500/30 bg-orange-500/5"
                  : "border-indigo-500/20 bg-indigo-500/5"
            }`}>
              <Calendar className={`h-4 w-4 flex-shrink-0 ${
                isCanceling ? "text-amber-400" : "text-indigo-400"
              }`} />
              <div className="flex-1">
                {isCanceling ? (
                  <>
                    <p className="text-sm font-medium text-amber-300">
                      Premium access until {formatDate(periodEnd)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {daysLeft !== null ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining` : ""} · No further charges
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-indigo-300">
                      Renews {formatDate(periodEnd)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {daysLeft !== null ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} until renewal` : ""}
                    </p>
                  </>
                )}
              </div>
              {isCanceling && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reactivateSubscription}
                  disabled={reactivating}
                  className="text-xs gap-1.5 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
                >
                  {reactivating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  Reactivate
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premium features */}
      {isPremium ? (
        <Card className="mb-6 border-indigo-500/20 bg-indigo-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-indigo-400" />
              You&apos;re enjoying Premium access
              <Badge className="bg-indigo-600 text-white text-xs border-0">Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {[
                "Unlimited AI Tutor conversations",
                "AI-personalized study plan (updates weekly)",
                "Streaming AI responses",
                "Priority model access",
                "Advanced analytics & weak-area insights",
                "All 10 AP courses with full question types",
                "FRQ / SAQ / DBQ / LEQ practice with AI scoring",
                "Early access to new courses",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {/* Cancel section */}
            {!isCanceling && (
              <div className="pt-2 border-t border-border/30">
                {!cancelConfirm ? (
                  <button
                    onClick={() => setCancelConfirm(true)}
                    className="text-sm text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    Cancel subscription
                  </button>
                ) : (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-300">Cancel your subscription?</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          You&apos;ll keep Premium access until the end of your current billing period.
                          After that, your account will revert to Free tier.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={cancelSubscription}
                        disabled={canceling}
                        className="gap-1.5 text-xs"
                      >
                        {canceling ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        Yes, cancel subscription
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setCancelConfirm(false)}
                        disabled={canceling}
                        className="text-xs"
                      >
                        Keep Premium
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-indigo-500/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              Unlock Premium
            </CardTitle>
            <CardDescription>Get unlimited access to every StudentNest feature.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Billing cycle toggle */}
            <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg w-fit">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  billingCycle === "annual"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annual
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                  Save 33%
                </Badge>
              </button>
            </div>

            {/* Price display */}
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">
                {billingCycle === "annual" ? "$79.99" : "$9.99"}
              </span>
              <span className="text-muted-foreground text-sm">
                {billingCycle === "annual" ? "/ year" : "/ month"}
              </span>
              {billingCycle === "annual" && (
                <span className="text-xs text-muted-foreground ml-1">(≈ $6.67/mo)</span>
              )}
            </div>

            <ul className="space-y-2">
              {[
                "Unlimited AI Tutor conversations (vs 5/day on Free)",
                "Personalized study plan that adapts to your progress",
                "Faster streaming AI responses",
                "Advanced weak-area analytics",
                "FRQ / SAQ / DBQ / LEQ practice with AI scoring",
                "Priority access to new AP courses",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <form action={`/api/checkout${billingCycle === "annual" ? "?plan=annual" : ""}`} method="POST">
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2">
                <Crown className="h-4 w-4" />
                Upgrade to Premium — {billingCycle === "annual" ? "$79.99/yr" : "$9.99/mo"}
              </Button>
            </form>

            <p className="text-xs text-center text-muted-foreground">
              Cancel anytime · Secure payment via Stripe
            </p>
          </CardContent>
        </Card>
      )}

      {/* Portal link for existing subscribers */}
      {isPremium && (
        <p className="text-xs text-muted-foreground mt-6 text-center">
          To update payment info or view invoices, use{" "}
          <button
            onClick={openPortal}
            className="text-indigo-400 hover:underline"
            disabled={isLoading}
          >
            the Stripe billing portal
          </button>
          .
        </p>
      )}
    </div>
  );
}
