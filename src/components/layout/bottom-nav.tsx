"use client";

/**
 * Mobile bottom-nav bar (ported from PrepLion).
 *
 * Fixed-bottom tab bar visible only below md breakpoint. Five tabs:
 * Home / Practice / Mock Exam / Progress / Sage. Sage is a button that
 * toggles the Sage Live Tutor panel rather than a route.
 *
 * Hidden during exam mode (mock exam / practice session / diagnostic
 * focused UI) so the test-taking surface stays distraction-free.
 * Respects iOS safe-area-inset-bottom for the home indicator bar.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Zap, Trophy, BarChart3, Sparkles } from "lucide-react";

const TABS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/practice", icon: Zap, label: "Practice" },
  { href: "/mock-exam", icon: Trophy, label: "Mock" },
  { href: "/analytics", icon: BarChart3, label: "Progress" },
];

interface Props {
  examMode?: boolean;
  onSageClick?: () => void;
  sageOpen?: boolean;
}

export function BottomNav({ examMode, onSageClick, sageOpen }: Props) {
  const pathname = usePathname();
  if (examMode) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-background/95 backdrop-blur border-t border-border/40"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center h-14">
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[48px] transition-colors duration-200 ${
                active ? "text-blue-500" : "text-muted-foreground"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
              {active && <span className="w-1 h-1 rounded-full bg-blue-500" />}
            </Link>
          );
        })}
        {/* Sage — button, not route; opens the chat drawer */}
        {onSageClick && (
          <button
            onClick={onSageClick}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[48px] transition-colors duration-200 ${
              sageOpen ? "text-purple-500" : "text-muted-foreground"
            }`}
            aria-label={sageOpen ? "Close Sage" : "Open Sage"}
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-medium">Sage</span>
            {sageOpen && <span className="w-1 h-1 rounded-full bg-purple-500" />}
          </button>
        )}
      </div>
    </nav>
  );
}
