"use client";

/**
 * GreetingCard — Beta 9.1.2 (2026-04-29).
 *
 * Personalized greeting at the top of the dashboard. Shows the student's
 * first name (or "there" fallback) + current plan tier. Tells the user:
 *   - the system knows who they are
 *   - what plan they're on (no surprise about features they can/can't use)
 *
 * Greeting tone shifts by time of day:
 *   - 5–11:    Good morning
 *   - 12–17:   Good afternoon
 *   - 18–4:    Welcome back / Good evening
 */

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";
import { hasAnyPremium, isPremiumForTrack } from "@/lib/tiers";
import type { ModuleSub } from "@/lib/tiers";

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Welcome back";
}

export function GreetingCard() {
  const { data: session } = useSession();
  if (!session?.user) return null;

  const user = session.user as {
    firstName?: string | null;
    name?: string | null;
    subscriptionTier?: string;
    track?: string;
    moduleSubs?: ModuleSub[];
  };

  const firstName = user.firstName?.trim() || (user.name ?? "").split(" ")[0]?.trim() || null;
  const track = user.track ?? "ap";
  const moduleSubs: ModuleSub[] = user.moduleSubs ?? [];
  const isPremium =
    hasAnyPremium(moduleSubs) ||
    isPremiumForTrack(user.subscriptionTier ?? "FREE", track);

  const greeting = timeOfDayGreeting();
  const nameStr = firstName ? `, ${firstName}` : "";

  return (
    <div className="flex items-center justify-between gap-3 px-1 pt-1 pb-2">
      <div className="min-w-0">
        <p className="text-[15px] sm:text-base font-semibold leading-tight">
          {greeting}{nameStr}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          You&apos;re on the{" "}
          {isPremium ? (
            <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 font-medium">
              <Crown className="h-3 w-3" /> Premium plan
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
              Free plan
              <Link href="/billing" className="ml-1 text-blue-700 dark:text-blue-400 hover:underline">
                — upgrade
              </Link>
            </span>
          )}
        </p>
      </div>
      {!isPremium && (
        <Link href="/billing?utm_source=dashboard_greeting" className="shrink-0">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
            <Sparkles className="h-3 w-3" />
            $9.99/mo
          </span>
        </Link>
      )}
    </div>
  );
}
