"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { SageChat } from "@/components/layout/sage-chat";
import { Sparkles, Menu } from "lucide-react";

const ONBOARDING_KEY = "onboarding_completed";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Redirect first-time users to onboarding
  useEffect(() => {
    if (status !== "authenticated") return;
    if (pathname === "/onboarding") return;
    try {
      const done = localStorage.getItem(ONBOARDING_KEY);
      if (!done) {
        router.replace("/onboarding");
      }
    } catch {
      // localStorage unavailable — skip onboarding
    }
  }, [status, pathname, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
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
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-indigo-400" />
          <span className="text-lg font-bold">
            <span className="gradient-text">Student</span><span className="text-foreground/80 font-medium">Nest</span>
          </span>
        </div>
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
