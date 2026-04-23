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
import { isAnyPremium, tierLabel, hasAnyPremium as hasAnyModulePremium, modulePremiumName, type ModuleSub } from "@/lib/tiers";

interface ModuleSubStatus {
  module: string;
  status: string;
  currentPeriodEnd: string | null;
}

interface BillingStatus {
  subscriptionTier: string;
  track?: string;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  hasSubscriptionId: boolean;
  moduleSubs?: ModuleSubStatus[];
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

  // After Stripe redirects back with ?success=1, poll the DB billing status
  // (not the JWT) to detect when the webhook has upgraded the account.
  // Once the DB shows PREMIUM, call update() once to sync the JWT, then stop.
  useEffect(() => {
    if (searchParams.get("success") !== "1") return;

    setRefreshing(true);
    let stopped = false;

    const poll = async () => {
      if (stopped) return;
      try {
        const res = await fetch("/api/billing/status");
        if (res.ok) {
          const data = await res.json() as BillingStatus;
          setBillingStatus(data);
          if (isAnyPremium(data.subscriptionTier) || (data.moduleSubs ?? []).some(s => s.status === "active")) {
            stopped = true;
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            // Flip refreshing off BEFORE update() so a rejected JWT-sync
            // doesn't strand the UI in "Activating..." forever.
            setRefreshing(false);
            try { await update(); } catch { /* JWT sync best-effort */ }
          }
        }
      } catch { /* ignore transient errors */ }
    };

    // Poll immediately, then every 2 s
    poll();
    const intervalId = setInterval(poll, 2000);
    // Hard stop after 30 s in case the webhook is delayed
    const timeoutId = setTimeout(() => {
      if (!stopped) {
        stopped = true;
        clearInterval(intervalId);
        setRefreshing(false);
      }
    }, 30000);

    return () => { stopped = true; clearInterval(intervalId); clearTimeout(timeoutId); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  // Use billingStatus (live DB) as the primary source of truth for premium state.
  // Module subscriptions from billing status
  const moduleSubs: ModuleSubStatus[] = billingStatus?.moduleSubs ?? [];
  const activeModuleSubs = moduleSubs.filter(s => s.status === "active" || s.status === "canceling");
  // The JWT (session) can lag until update() syncs it; billingStatus is always current.
  const isPremium =
    isAnyPremium(session?.user?.subscriptionTier ?? "") ||
    isAnyPremium(billingStatus?.subscriptionTier ?? "") ||
    activeModuleSubs.length > 0;
  const premiumLabel = activeModuleSubs.length > 0
    ? activeModuleSubs.map(s => modulePremiumName(s.module)).join(" + ")
    : tierLabel(billingStatus?.subscriptionTier ?? session?.user?.subscriptionTier ?? "FREE");
  const isCanceling = billingStatus?.subscriptionStatus === "canceling" || activeModuleSubs.some(s => s.status === "canceling");
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
          <Crown className="h-8 w-8 text-blue-500" />
          Billing
        </h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and payment details.</p>
      </div>

      {/* Payment success banner — three states:
            1. Polling (refreshing && !isPremium): "Activating..."
            2. Confirmed PREMIUM (isPremium): "Welcome to Premium!"
            3. Polling timed out but still FREE (!refreshing && !isPremium):
               honest "We received payment but activation is delayed" — never
               claim Premium when the DB doesn't show it. */}
      {justUpgraded && (
        <div
          className={`mb-6 rounded-xl border p-4 flex items-start gap-3 ${
            isPremium
              ? "border-emerald-500/30 bg-emerald-500/10"
              : refreshing
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-amber-500/30 bg-amber-500/10"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isPremium || refreshing ? "bg-emerald-500/20" : "bg-amber-500/20"
            }`}
          >
            {isPremium ? (
              <PartyPopper className="h-5 w-5 text-emerald-400" />
            ) : refreshing ? (
              <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
            ) : (
              <Calendar className="h-5 w-5 text-amber-400" />
            )}
          </div>
          <div className="flex-1">
            {isPremium ? (
              <>
                <p className="font-semibold text-emerald-400">Welcome to Premium!</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Your Premium subscription is active. Enjoy unlimited Sage Live Tutor and all premium features!
                </p>
              </>
            ) : refreshing ? (
              <>
                <p className="font-semibold text-emerald-400">Activating your Premium account…</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Payment confirmed. Waiting for Stripe to activate your account — usually under 10 seconds.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-amber-400">Payment received — activation pending</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  We&rsquo;ve received your payment but your account hasn&rsquo;t activated yet. Please refresh this page in a few minutes. If it still shows Free, email{" "}
                  <a href="mailto:contact@studentnest.ai" className="text-amber-300 underline">
                    contact@studentnest.ai
                  </a>{" "}
                  with your purchase email and we&rsquo;ll fix it within an hour.
                </p>
              </>
            )}
          </div>
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
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                <Crown className="h-3 w-3 mr-1" />
                {premiumLabel}
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
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPremium ? "bg-blue-500/20" : "bg-secondary"}`}>
                {isPremium ? (
                  <Crown className="h-5 w-5 text-blue-500" />
                ) : (
                  <Zap className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold">{isPremium ? premiumLabel : "Free"}</p>
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
                <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Upgrade to {(session?.user as { track?: string })?.track === "clep" ? "CLEP Premium" : "AP Premium"}
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
                  : "border-blue-500/20 bg-blue-500/5"
            }`}>
              <Calendar className={`h-4 w-4 flex-shrink-0 ${
                isCanceling ? "text-amber-400" : "text-blue-500"
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
                    <p className="text-sm font-medium text-blue-400">
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
                  className="text-xs gap-1.5 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
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
        <Card className="mb-6 border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-blue-500" />
              You&apos;re enjoying Premium access
              <Badge className="bg-blue-600 text-white text-xs border-0">Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {((session?.user as { track?: string })?.track === "clep" ? [
                "Unlimited Sage Live Tutor conversations",
                "All 34 CLEP courses with full prep",
                "AI-personalized CLEP study plan",
                "Streaming AI responses",
                "Advanced analytics & weak-area insights",
                "Save $1,200+ per exam passed",
              ] : [
                "Unlimited Sage Live Tutor conversations",
                "AI-personalized study plan (updates weekly)",
                "Streaming AI responses",
                "Priority model access",
                "Advanced analytics & weak-area insights",
                "All 10 AP courses with full question types",
                "FRQ / SAQ / DBQ / LEQ practice with AI scoring",
                "Early access to new courses",
              ]).map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className={`h-4 w-4 flex-shrink-0 ${(session?.user as { track?: string })?.track === "clep" ? "text-emerald-400" : "text-blue-500"}`} />
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                Upgrade Your Modules
              </h2>
              <p className="text-sm text-muted-foreground">Each module is $9.99/mo or $79.99/yr. Subscribe to as many as you need.</p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
              <button onClick={() => setBillingCycle("monthly")} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${billingCycle === "monthly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>Monthly</button>
              <button onClick={() => setBillingCycle("annual")} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${billingCycle === "annual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>Annual <span className="text-green-500 text-[10px] ml-1">-33%</span></button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {([
              { module: "ap", label: "AP Premium", desc: "10 AP courses + FRQ scoring", color: "indigo", btn: "bg-blue-600 hover:bg-blue-700", border: "border-blue-500/30" },
              { module: "sat", label: "SAT Premium", desc: "SAT Math + Reading & Writing", color: "blue", btn: "bg-blue-600 hover:bg-blue-700", border: "border-blue-500/30" },
              { module: "act", label: "ACT Premium", desc: "All 4 ACT sections", color: "violet", btn: "bg-violet-600 hover:bg-violet-700", border: "border-violet-500/30" },
              { module: "clep", label: "CLEP Premium", desc: "34 CLEP exams · Save $1,200+", color: "emerald", btn: "bg-emerald-600 hover:bg-emerald-700", border: "border-emerald-500/30" },
            ] as const).map((m) => {
              const activeSub = moduleSubs.find(s => s.module === m.module && (s.status === "active" || s.status === "canceling"));
              return (
                <Card key={m.module} className={activeSub ? `${m.border} bg-${m.color}-500/5` : "border-border/40"}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{m.label}</p>
                      {activeSub ? (
                        <Badge className={`text-xs ${activeSub.status === "canceling" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"}`}>
                          {activeSub.status === "canceling" ? "Canceling" : "Active"}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">{billingCycle === "annual" ? "$79.99/yr" : "$9.99/mo"}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                    {activeSub ? (
                      <div className="space-y-2">
                        {activeSub.currentPeriodEnd && (
                          <p className="text-xs text-muted-foreground">
                            {activeSub.status === "canceling" ? "Access until" : "Renews"} {formatDate(activeSub.currentPeriodEnd)}
                          </p>
                        )}
                        {activeSub.status === "active" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-muted-foreground hover:text-red-400"
                            onClick={async () => {
                              if (!confirm(`Cancel ${m.label}? You'll keep access until the end of your billing period.`)) return;
                              const res = await fetch(`/api/billing/cancel?module=${m.module}`, { method: "POST" });
                              const data = await res.json();
                              if (data.success) { await fetchBillingStatus(); }
                              else { alert(data.error || "Could not cancel."); }
                            }}
                          >
                            Cancel {m.label}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-blue-500 hover:text-blue-400"
                            onClick={async () => {
                              const res = await fetch(`/api/billing/cancel?module=${m.module}`, { method: "DELETE" });
                              const data = await res.json();
                              if (data.success) { await fetchBillingStatus(); }
                              else { alert(data.error || "Could not reactivate."); }
                            }}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" /> Reactivate
                          </Button>
                        )}
                      </div>
                    ) : (
                      <form action={`/api/checkout?plan=${billingCycle}&module=${m.module}`} method="POST">
                        <Button type="submit" size="sm" className={`w-full ${m.btn} text-white text-xs gap-1.5`}>
                          <Crown className="h-3.5 w-3.5" /> Upgrade
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="text-xs text-center text-muted-foreground">Cancel anytime · Secure payment via Stripe</p>
        </div>
      )}

      {/* Portal link for existing subscribers */}
      {isPremium && (
        <p className="text-xs text-muted-foreground mt-6 text-center">
          To update payment info or view invoices, use{" "}
          <button
            onClick={openPortal}
            className="text-blue-500 hover:underline"
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
