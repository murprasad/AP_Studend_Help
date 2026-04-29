"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { SageChat } from "@/components/layout/sage-chat";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Sparkles, Menu, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { ExamModeContext, useExamModeState } from "@/hooks/use-exam-mode";
import { cn } from "@/lib/utils";

const ONBOARDING_KEY = "onboarding_completed";

// Pages allowed to stay in exam mode. Navigating anywhere else auto-exits.
const EXAM_MODE_PAGES = ["/diagnostic", "/mock-exam", "/ai-tutor", "/practice", "/flashcards"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Start in exam mode if the diagnostic's "start" query param is present
  // so the transition from onboarding → diagnostic feels seamless.
  const isDiagAutoStart =
    typeof window !== "undefined" &&
    pathname === "/diagnostic" &&
    new URLSearchParams(window.location.search).get("start") === "true";
  const examModeState = useExamModeState(isDiagAutoStart);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Beta 8.12 (2026-04-29) — Funnel fix: send first-time users straight
  // into a 5-question starter session via /practice/quickstart, NOT the
  // 3-step onboarding wizard. The 7-day funnel showed 37% of new signups
  // never started a session — dashboard with multiple cards = decision
  // paralysis. Auto-start removes the decision point. Quickstart sets
  // onboardingCompletedAt on session completion so this only fires once.
  //
  // Skip paths: already on quickstart route, or pre-existing /onboarding
  // (still works for users who deep-link to it manually).
  useEffect(() => {
    if (status !== "authenticated") return;
    if (pathname === "/onboarding") return;
    if (pathname.startsWith("/practice/quickstart")) return;
    // Beta 9.0.1 hotfix — exempt /practice (with or without subpath) when
    // arriving from quickstart. Prior check used startsWith("/practice/")
    // which DOESN'T match the bare "/practice" pathname (no trailing slash),
    // causing fresh user click → router.push(/practice?quickstart=1) → layout
    // sees onboardingCompletedAt=null → fetch /api/user → redirect back to
    // /practice/quickstart. Loop. Now matches both /practice and /practice/*
    // when ?quickstart=1 is present.
    if ((pathname === "/practice" || pathname.startsWith("/practice/")) && new URLSearchParams(window.location.search).get("quickstart") === "1") return;

    // Beta 9.0.4 hotfix — also honor the onboarding_completed bridge cookie
    // that PATCH /api/practice/[id] sets at session-complete. Without this,
    // even though middleware lets /frq-practice through (bridged by cookie),
    // this layout's client-side redirect can still fire because JWT is stale
    // null. Reading document.cookie here is OK — same source middleware uses.
    if (typeof document !== "undefined" && document.cookie.includes("onboarding_completed=true")) return;

    const onboardedAtServer = (session?.user as { onboardingCompletedAt?: string | null } | undefined)?.onboardingCompletedAt;

    if (onboardedAtServer === null || onboardedAtServer === undefined) {
      try { localStorage.removeItem(ONBOARDING_KEY); } catch { /* ignore */ }
      fetch("/api/user", { cache: "no-store" })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (!data?.user) return;
          if (data.user.onboardingCompletedAt == null) {
            router.replace("/practice/quickstart");
          }
        })
        .catch(() => { /* silent */ });
      return;
    }

    try {
      const done = localStorage.getItem(ONBOARDING_KEY);
      if (!done) {
        localStorage.setItem(ONBOARDING_KEY, "true");
      }
    } catch { /* ignore */ }
  }, [status, session, pathname, router]);

  // Auto-exit exam mode when navigating away from exam-mode pages
  useEffect(() => {
    if (examModeState.examMode && !EXAM_MODE_PAGES.some(p => pathname.startsWith(p))) {
      examModeState.exitExamMode();
    }
  }, [pathname, examModeState]);

  // Sync track from URL param
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

  const inExamMode = examModeState.examMode;
  const onOnboarding = pathname === "/onboarding";

  return (
    <ExamModeContext.Provider value={examModeState}>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Exam mode top bar — slim bar with exit button, now visible on
            BOTH desktop and mobile (was hidden lg:flex; flipped 2026-04-22
            because mobile users were left with no in-app escape hatch back
            to dashboard during exam-mode pages). */}
        {inExamMode && (
          <div className="fixed top-0 left-0 right-0 h-10 bg-background/95 backdrop-blur border-b border-border/40 z-30 flex items-center px-3 sm:px-4">
            <button
              onClick={() => examModeState.exitExamMode()}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-accent"
              aria-label="Exit full-screen mode, return to dashboard"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </button>
          </div>
        )}

        {/* Mobile header — hidden in exam mode and onboarding */}
        {!inExamMode && !onOnboarding && (
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
                <span className="gradient-text">Student</span><span className="text-foreground/80 font-medium">Nest</span><span className="text-blue-600 dark:text-blue-700 dark:text-blue-400 font-normal text-[0.6em] ml-1">Prep</span>
              </span>
            </Link>
          </header>
        )}

        {/* Sidebar — hidden in exam mode and onboarding */}
        {!inExamMode && !onOnboarding && (
          <Sidebar
            userRole={session.user.role}
            userTrack={session.user.track}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        <main className={cn(
          "flex-1 min-w-0 overflow-y-auto overflow-x-hidden",
          // Exam mode: 10-tall top bar now on all breakpoints.
          // Non-exam: mobile has 14-tall header, desktop has none.
          inExamMode ? "pt-10" : "pt-14 lg:pt-0"
        )}>
          <div className={cn(
            "px-4 py-4 sm:px-6 sm:py-6 mx-auto",
            inExamMode ? "max-w-5xl" : "max-w-7xl"
          )}>
            {/* Option B (2026-04-22) removed the trial banner: we no longer
                enforce a 7-day trial expiry. LockedValueCard on the
                dashboard surfaces the contextual paywall instead. */}
            {children}
          </div>
        </main>
        {/* Hide Sage chat widget while in exam mode — full-screen test UX */}
        {!inExamMode && <SageChat />}
        {/* Mobile bottom nav — hidden in exam mode + onboarding. md:hidden
            inside the component itself so desktop stays untouched. */}
        {!onOnboarding && <BottomNav examMode={inExamMode} />}
      </div>
    </ExamModeContext.Provider>
  );
}
