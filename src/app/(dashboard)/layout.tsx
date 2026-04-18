"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { SageChat } from "@/components/layout/sage-chat";
import { Sparkles, Menu } from "lucide-react";
import Link from "next/link";

const ONBOARDING_KEY = "onboarding_completed";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Redirect first-time users to onboarding. Server-side
  // `onboardingCompletedAt` on the user row is the source of truth;
  // localStorage is a legacy fallback for existing users whose account
  // predates the DB flag. Admin reset nulls the DB field so test users
  // walk onboarding again on next login.
  useEffect(() => {
    if (status !== "authenticated") return;
    if (pathname === "/onboarding") return;

    const onboardedAtServer = (session?.user as { onboardingCompletedAt?: string | null } | undefined)?.onboardingCompletedAt;

    // If the server says not onboarded, force /onboarding and clear the
    // stale localStorage flag so a reset test user isn't trapped by their
    // browser state.
    if (onboardedAtServer === null || onboardedAtServer === undefined) {
      try { localStorage.removeItem(ONBOARDING_KEY); } catch { /* ignore */ }
      // Fetch the latest user row directly — session JWT can lag a minute
      // or two after a PATCH and shouldn't block an unambiguous redirect.
      fetch("/api/user", { cache: "no-store" })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (!data?.user) return;
          if (data.user.onboardingCompletedAt == null) {
            router.replace("/onboarding");
          }
        })
        .catch(() => { /* silent — fall back to localStorage check below */ });
      return;
    }

    // Server says onboarded — trust it and short-circuit.
    try {
      const done = localStorage.getItem(ONBOARDING_KEY);
      if (!done) {
        // Server says onboarded but localStorage hasn't caught up (new
        // browser or cleared storage). Set the flag; no redirect.
        localStorage.setItem(ONBOARDING_KEY, "true");
      }
    } catch { /* localStorage unavailable — nothing to sync */ }
  }, [status, session, pathname, router]);

  // Sync track from URL param (e.g. /dashboard?track=clep after Google OAuth redirect)
  const trackSynced = useRef(false);
  useEffect(() => {
    if (status !== "authenticated" || trackSynced.current) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const urlTrack = params.get("track");
      const validTracks = ["ap", "sat", "act", "clep", "dsst"];
      if (validTracks.includes(urlTrack ?? "") && urlTrack !== session?.user?.track) {
        trackSynced.current = true;
        fetch("/api/user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ track: urlTrack }),
        }).then(async () => {
          // Force JWT refresh to pick up new track, then reload
          await updateSession();
          window.location.replace(pathname);
        }).catch(() => {});
      }
    } catch { /* ignore */ }
  }, [status, session, pathname]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-background/95 backdrop-blur border-b border-border z-30 flex items-center px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-accent transition-colors mr-3"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-blue-500" />
          <span className="text-lg font-bold">
            <span className="gradient-text">Student</span><span className="text-foreground/80 font-medium">Nest</span><span className="text-blue-500/60 font-normal text-[0.6em] ml-1">Prep</span>
          </span>
        </Link>
      </header>

      <Sidebar userRole={session.user.role} userTrack={session.user.track} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden pt-14 lg:pt-0">
        <div className="px-4 py-4 sm:px-6 sm:py-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <SageChat />
    </div>
  );
}
