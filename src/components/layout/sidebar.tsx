"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { AP_COURSE_SHORT } from "@/lib/utils";
import { useCourse } from "@/hooks/use-course";
import { ApCourse } from "@prisma/client";
import { COURSE_REGISTRY } from "@/lib/courses";
import {
  LayoutDashboard,
  Zap,
  BarChart3,
  BookOpen,
  MessageSquare,
  Sparkles,
  LogOut,
  Shield,
  Trophy,
  Library,
  ChevronDown,
  Info,
  Crown,
  ClipboardList,
  Users,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/practice", icon: Zap, label: "Practice" },
  { href: "/mock-exam", icon: Trophy, label: "Mock Exam" },
  { href: "/diagnostic", icon: ClipboardList, label: "Diagnostic" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/study-plan", icon: BookOpen, label: "Study Plan" },
  { href: "/resources", icon: Library, label: "Resources" },
  { href: "/ai-tutor", icon: MessageSquare, label: "AI Tutor" },
  { href: "/community", icon: Users, label: "Community" },
  { href: "/billing", icon: Crown, label: "Billing" },
  { href: "/about", icon: Info, label: "About" },
];

// Derived from COURSE_REGISTRY — no hardcoded course names here.
const COURSE_OPTIONS = (Object.entries(COURSE_REGISTRY) as [ApCourse, { name: string; shortName: string }][]).map(
  ([value, cfg]) => ({ value, label: cfg.name, short: cfg.shortName })
);

const COURSE_GROUPS: { label: string; keys: ApCourse[] }[] = [
  {
    label: "AP Courses",
    keys: [
      "AP_WORLD_HISTORY", "AP_COMPUTER_SCIENCE_PRINCIPLES", "AP_PHYSICS_1",
      "AP_CALCULUS_AB", "AP_CALCULUS_BC", "AP_STATISTICS",
      "AP_CHEMISTRY", "AP_BIOLOGY", "AP_US_HISTORY", "AP_PSYCHOLOGY",
    ] as ApCourse[],
  },
  {
    label: "SAT Prep",
    keys: ["SAT_MATH", "SAT_READING_WRITING"] as ApCourse[],
  },
  {
    label: "ACT Prep",
    keys: ["ACT_MATH", "ACT_ENGLISH", "ACT_SCIENCE", "ACT_READING"] as ApCourse[],
  },
];

interface SidebarProps {
  userRole?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ userRole, isOpen = false, onClose = () => {} }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [course, setCourse] = useCourse();
  const { theme, toggleTheme } = useTheme();
  const [streakDays, setStreakDays] = useState<number>(0);
  const [activeGroup, setActiveGroup] = useState<string>(() => {
    return COURSE_GROUPS.find(g => g.keys.includes(course as ApCourse))?.label ?? "AP Courses";
  });

  useEffect(() => {
    const group = COURSE_GROUPS.find(g => g.keys.includes(course as ApCourse));
    if (group) setActiveGroup(group.label);
  }, [course]);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((data: { streakDays?: number }) => { if (data.streakDays) setStreakDays(data.streakDays); })
      .catch(() => {});
  }, []);

  function handleCourseChange(newCourse: ApCourse) {
    setCourse(newCourse);
    router.refresh();
  }

  function handleNavClick() {
    onClose();
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border/40 flex flex-col",
        "lg:relative lg:inset-auto lg:z-auto lg:translate-x-0 lg:flex-shrink-0",
        "transform transition-transform duration-200 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-border/40 pt-14 lg:pt-6">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2" onClick={handleNavClick}>
              <Sparkles className="h-6 w-6 text-indigo-400" />
              <span className="text-lg font-bold">
                <span className="gradient-text">Student</span><span className="text-foreground/80 font-medium">Nest</span>
              </span>
            </Link>
            {streakDays > 1 && (
              <span className="text-sm font-semibold text-orange-400 flex items-center gap-0.5" title={`${streakDays}-day streak`}>
                🔥{streakDays}
              </span>
            )}
          </div>
        </div>

        {/* Course Switcher */}
        <div className="px-4 py-3 border-b border-border/40">
          <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Current Course</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between text-left font-normal text-xs h-auto py-2 px-3"
              >
                <span className="truncate">{AP_COURSE_SHORT[course]}</span>
                <ChevronDown className="h-3.5 w-3.5 ml-1 flex-shrink-0 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 p-0">
              {/* Category tabs */}
              <div className="flex gap-1 p-2 border-b border-border/40">
                {COURSE_GROUPS.map((g) => (
                  <button
                    key={g.label}
                    onClick={(e) => { e.preventDefault(); setActiveGroup(g.label); }}
                    className={cn(
                      "flex-1 text-[10px] font-semibold py-1.5 rounded-md transition-colors truncate",
                      activeGroup === g.label
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {g.label === "AP Courses" ? "AP" : g.label === "SAT Prep" ? "SAT" : "ACT"}
                  </button>
                ))}
              </div>
              {/* Course list for active tab only */}
              {COURSE_GROUPS.filter(g => g.label === activeGroup).map((group) =>
                group.keys.map((key) => {
                  const opt = COURSE_OPTIONS.find((o) => o.value === key);
                  if (!opt) return null;
                  return (
                    <DropdownMenuItem
                      key={opt.value}
                      onClick={() => handleCourseChange(opt.value)}
                      className={cn(
                        "cursor-pointer text-sm mx-1 my-0.5 rounded-md",
                        course === opt.value && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      {opt.label}
                    </DropdownMenuItem>
                  );
                })
              )}
              <div className="h-1" />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
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
              onClick={handleNavClick}
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

        {/* Sign out + theme toggle */}
        <div className="p-4 border-t border-border/40 space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
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
    </>
  );
}
