"use client";

/**
 * 2026-05-31 — Marketing header migrated to CB design tokens (#102 mirror).
 * Cobalt SN initials mark, Roboto wordmark, cb-yellow CTA pill. Mirrors
 * the PL marketing-header so every PL+SN marketing page shares the same
 * cobalt-on-white chrome.
 */

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, LogOut } from "lucide-react";

export function MarketingHeader() {
  const { status } = useSession();
  const isAuth = status === "authenticated";

  return (
    <header className="border-b border-cb-cardBorder bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href={isAuth ? "/dashboard" : "/"} className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-cb-cobalt text-white text-xs font-bold">
            SN
          </span>
          <span className="text-base font-medium text-cb-indigo font-roboto">
            StudentNest <span className="text-cb-muted font-normal">Prep</span>
          </span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5 text-sm font-roboto">
          {isAuth ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cb-cobalt hover:bg-cb-sky text-white transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-1.5 text-cb-muted hover:text-cb-cobalt transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/ap-prep" className="hidden md:block text-cb-muted hover:text-cb-cobalt transition-colors">
                AP
              </Link>
              <Link href="/sat-prep" className="hidden md:block text-cb-muted hover:text-cb-cobalt transition-colors">
                SAT
              </Link>
              <Link href="/act-prep" className="hidden md:block text-cb-muted hover:text-cb-cobalt transition-colors">
                ACT
              </Link>
              <Link href="/psat-prep" className="hidden md:block text-cb-muted hover:text-cb-cobalt transition-colors">
                PSAT
              </Link>
              <Link href="/pricing" className="hidden sm:block text-cb-muted hover:text-cb-cobalt transition-colors">
                Pricing
              </Link>
              <Link href="/login" className="text-cb-muted hover:text-cb-cobalt transition-colors">
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-cb-yellow text-cb-indigo font-medium hover:bg-yellow-400 transition-colors"
              >
                Start free
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
