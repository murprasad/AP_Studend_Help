"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Zap,
  BarChart3,
  BookOpen,
  MessageSquare,
  Globe,
  LogOut,
  Shield,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/practice", icon: Zap, label: "Practice" },
  { href: "/mock-exam", icon: Trophy, label: "Mock Exam" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/study-plan", icon: BookOpen, label: "Study Plan" },
  { href: "/ai-tutor", icon: MessageSquare, label: "AI Tutor" },
];

interface SidebarProps {
  userRole?: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card border-r border-border/40 flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border/40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Globe className="h-7 w-7 text-indigo-400" />
          <span className="text-lg font-bold gradient-text">AP SmartPrep</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}

        {userRole === "ADMIN" && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Shield className="h-5 w-5" />
            Admin
          </Link>
        )}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-border/40">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
