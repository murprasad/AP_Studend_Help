"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Sparkles, LayoutDashboard, LogOut } from "lucide-react";

/**
 * Auth-aware marketing nav. Mirrors PrepLion's MarketingHeader so the
 * logo + right-hand links adapt to the user's signed-in state:
 *
 * - Unauth: logo → / ; right-hand shows AP/SAT/ACT/Pricing/Sign in/Get started
 * - Authed: logo → /dashboard ; right-hand shows Dashboard + Sign out only
 *
 * Fixes the "I'm still signed in on the landing page" confusion where
 * an authed user could click the logo from a marketing page and stay
 * on the landing without any way to tell they were logged in.
 */
export function MarketingHeader() {
  const { status } = useSession();
  const isAuth = status === "authenticated";

  return (
    <nav className="border-b border-border/40 p-4 flex items-center justify-between max-w-7xl mx-auto w-full">
      <Link href={isAuth ? "/dashboard" : "/"} className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-blue-500" />
        <div>
          <span className="text-lg font-bold">
            <span className="gradient-text">Student</span>
            <span className="text-foreground/80 font-medium">Nest</span>
            <span className="text-blue-600 dark:text-blue-700 dark:text-blue-400 font-normal text-[0.6em] ml-1">Prep</span>
          </span>
          <p className="text-xs text-muted-foreground leading-none hidden sm:block">
            Study Smarter. Score Higher.
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2 sm:gap-4">
        {isAuth ? (
          <>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 rounded-lg transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </>
        ) : (
          <>
            <Link href="/ap-prep" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              AP Prep
            </Link>
            <Link href="/sat-prep" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              SAT Prep
            </Link>
            <Link href="/act-prep" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              ACT Prep
            </Link>
            <Link href="/am-i-ready" className="hidden md:block text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              Am I Ready?
            </Link>
            <Link href="/pricing" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 rounded-lg transition-colors"
            >
              <span className="hidden sm:inline">Get started </span>free
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
