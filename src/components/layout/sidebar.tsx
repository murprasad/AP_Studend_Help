"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { AP_COURSE_SHORT } from "@/lib/utils";
import { useCourse } from "@/hooks/use-course";
import { ApCourse } from "@prisma/client";
import { COURSE_REGISTRY } from "@/lib/courses";
import { SidebarReadiness } from "@/components/layout/sidebar-readiness";
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
  Calendar,
  PenLine,
  Mic,
  Layers,
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

interface NavItem {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  /** If set, item only renders when userTrack matches one of these values. */
  tracks?: string[];
  /** When true, only ADMIN role sees this nav item. */
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/practice", icon: Zap, label: "Practice" },
  // FRQ Practice — AP only (SAT/ACT don't have FRQs). Admins always see it.
  { href: "/frq-practice", icon: PenLine, label: "FRQ Practice", tracks: ["ap"] },
  { href: "/mock-exam", icon: Trophy, label: "Mock Exam" },
  { href: "/diagnostic", icon: ClipboardList, label: "Diagnostic" },
  { href: "/flashcards", icon: Layers, label: "Flashcards" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/study-plan", icon: BookOpen, label: "Study Plan" },
  { href: "/resources", icon: Library, label: "Resources" },
  { href: "/ai-tutor", icon: MessageSquare, label: "Sage Live Tutor" },
  // Sage Coach — oral-response training. Available to all users (2026-04-21).
  // Free users get 1 evaluation per day; unlimited on paid.
  { href: "/sage-coach", icon: Mic, label: "Sage Coach" },
  { href: "/community", icon: Users, label: "Community" },
  { href: "/billing", icon: Crown, label: "Billing" },
  { href: "/about", icon: Info, label: "About" },
];

// Derived from COURSE_REGISTRY — no hardcoded course names here.
const COURSE_OPTIONS = (Object.entries(COURSE_REGISTRY) as [ApCourse, { name: string; shortName: string }][]).map(
  ([value, cfg]) => ({ value, label: cfg.name, short: cfg.shortName })
);

const BASE_COURSE_GROUPS: { label: string; shortLabel: string; keys: ApCourse[] }[] = [
  {
    label: "AP Courses",
    shortLabel: "AP",
    // Extended 2026-05-02 to include the 4 newer AP courses that were
    // already in COURSE_REGISTRY but never wired into the sidebar:
    // AP_ENVIRONMENTAL_SCIENCE, AP_HUMAN_GEOGRAPHY, AP_US_GOVERNMENT,
    // AP_PRECALCULUS. Without them, the visible_courses filter (which
    // includes these) would have 0 keys to match against, leaving the
    // sidebar with only AP_CHEMISTRY, AP_COMPUTER_SCIENCE_PRINCIPLES,
    // and AP_PSYCHOLOGY (the 3 visible courses that overlap the legacy
    // list). Bug surfaced 2026-05-02 evening when user signed in as test
    // student and saw 10 unfiltered courses (loading-state fallback).
    keys: [
      "AP_WORLD_HISTORY", "AP_COMPUTER_SCIENCE_PRINCIPLES", "AP_PHYSICS_1",
      "AP_CALCULUS_AB", "AP_CALCULUS_BC", "AP_STATISTICS",
      "AP_CHEMISTRY", "AP_BIOLOGY", "AP_US_HISTORY", "AP_PSYCHOLOGY",
      "AP_ENVIRONMENTAL_SCIENCE", "AP_HUMAN_GEOGRAPHY",
      "AP_US_GOVERNMENT", "AP_PRECALCULUS",
    ] as ApCourse[],
  },
  {
    label: "SAT Prep",
    shortLabel: "SAT",
    keys: ["SAT_MATH", "SAT_READING_WRITING"] as ApCourse[],
  },
  {
    label: "ACT Prep",
    shortLabel: "ACT",
    keys: ["ACT_MATH", "ACT_ENGLISH", "ACT_SCIENCE", "ACT_READING"] as ApCourse[],
  },
];

interface SidebarProps {
  userRole?: string;
  userTrack?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ userRole, userTrack, isOpen = false, onClose = () => {} }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [course, setCourse] = useCourse();
  const { theme, toggleTheme } = useTheme();
  const [streakDays, setStreakDays] = useState<number>(0);
  const [streakFreezes, setStreakFreezes] = useState<number>(0);
  const [examDate, setExamDate] = useState<Date | null>(null);
  const [hiddenPages, setHiddenPages] = useState<Set<string>>(new Set());
  // Bank-quality course filter (added 2026-05-02). Two pieces of state
  // to distinguish "loading" from "loaded with no filter."
  // - flagsLoaded=false : /api/feature-flags hasn't returned yet
  // - visibleCourses=null after load : SiteSetting has no allowlist (show all)
  // - visibleCourses=[...]      : allowlist applied
  // For non-admin users during the brief loading window we render NO
  // courses rather than flashing the unfiltered list (which previously
  // showed students courses they couldn't actually use).
  const [flagsLoaded, setFlagsLoaded] = useState<boolean>(false);
  const [visibleCourses, setVisibleCourses] = useState<string[] | null>(null);
  // Always trust the session track prop when available
  const effectiveTrack = userTrack || "ap";

  // 2026-05-03 — All ap/sat/act users see ALL 3 groups (AP + SAT + ACT).
  // Reason: students prep for multiple exams simultaneously (AP students take
  // SAT/ACT too; SAT/ACT students may take AP electives). Track determines the
  // *default-selected* tab in the picker, not a hard lock. CLEP/DSST sunset
  // 2026-05-03 — redirected to preplion.ai, no longer exposed here.
  const TRACK_TO_GROUP: Record<string, typeof BASE_COURSE_GROUPS[number][]> = {
    ap: BASE_COURSE_GROUPS,
    sat: BASE_COURSE_GROUPS,
    act: BASE_COURSE_GROUPS,
  };

  // Admin and all tracks see AP/SAT/ACT groups only. CLEP/DSST hidden post-sunset.
  const RAW_COURSE_GROUPS = userRole === "ADMIN"
    ? BASE_COURSE_GROUPS
    : (TRACK_TO_GROUP[effectiveTrack] ?? [BASE_COURSE_GROUPS[0]]);

  // Apply bank-quality visibility filter (2026-05-02). Logic:
  //   - Admin: always see RAW (validate quality).
  //   - Non-admin, flags not yet loaded: render no courses (avoids the
  //     unfiltered-flash bug where students briefly saw hidden courses).
  //   - Non-admin, loaded, no allowlist: see RAW (no filter set in DB).
  //   - Non-admin, loaded, allowlist: filter RAW by allowlist.
  const COURSE_GROUPS = (userRole === "ADMIN")
    ? RAW_COURSE_GROUPS
    : !flagsLoaded
      ? []
      : !visibleCourses
        ? RAW_COURSE_GROUPS
        : RAW_COURSE_GROUPS
            .map((g) => ({ ...g, keys: g.keys.filter((k) => visibleCourses.includes(k as string)) }))
            .filter((g) => g.keys.length > 0);

  const DEFAULT_GROUP: Record<string, string> = {
    ap: "AP Courses", sat: "SAT Prep", act: "ACT Prep",
  };

  const [activeGroup, setActiveGroup] = useState<string>(
    DEFAULT_GROUP[effectiveTrack] ?? "AP Courses"
  );

  // Auto-switch course when it doesn't belong to the user's track OR
  // when it was just hidden by the bank-quality visibility filter.
  // Skip for admin — they can access any course.
  useEffect(() => {
    if (userRole === "ADMIN") return;
    // Hold for the visibility list to load before we do anything; null
    // means "haven't fetched yet" — switching during loading would
    // bounce the user from a perfectly valid course.
    const trackGroup = TRACK_TO_GROUP[effectiveTrack];
    if (!trackGroup) return;
    const courseInTrack = trackGroup.some((g) => g.keys.includes(course as ApCourse));
    const courseVisible = !visibleCourses || visibleCourses.includes(course as string);
    if (courseInTrack && courseVisible) return;
    // Pick the first visible-and-in-track course as the fallback.
    for (const g of trackGroup) {
      const candidate = g.keys.find((k) => !visibleCourses || visibleCourses.includes(k as string));
      if (candidate) { setCourse(candidate); return; }
    }
    // No visible course in the user's track — fall back to the first key
    // in track even if hidden, just to avoid leaving the user stranded.
    if (trackGroup[0]?.keys[0]) setCourse(trackGroup[0].keys[0]);
  }, [effectiveTrack, visibleCourses]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync activeGroup when course changes
  useEffect(() => {
    const group = BASE_COURSE_GROUPS.find(g => g.keys.includes(course as ApCourse));
    if (group) setActiveGroup(group.label);
  }, [course]);

  function fetchUserData() {
    fetch("/api/user")
      .then((r) => r.json())
      .then((data: { user?: { streakDays?: number; streakFreezes?: number; examDate?: string }; flags?: { clepEnabled?: boolean } }) => {
        const u = data.user;
        if (u?.streakDays != null) setStreakDays(u.streakDays);
        if (u?.streakFreezes != null) setStreakFreezes(u.streakFreezes);
        if (u?.examDate) setExamDate(new Date(u.examDate));
        else setExamDate(null);
        // clepEnabled flag no longer used — track-based filtering handles course visibility
      })
      .catch(() => {});
  }

  useEffect(() => {
    fetchUserData();
    // Fetch feature flags to hide disabled pages
    fetch("/api/feature-flags")
      .then(r => r.json())
      .then((flags: { analyticsEnabled?: boolean; studyPlanEnabled?: boolean; visibleCourses?: string[] | null }) => {
        const hidden = new Set<string>();
        if (flags.analyticsEnabled === false) hidden.add("/analytics");
        if (flags.studyPlanEnabled === false) hidden.add("/study-plan");
        setHiddenPages(hidden);
        // null = no filter (show all). Array = allowlist.
        if (Array.isArray(flags.visibleCourses)) setVisibleCourses(flags.visibleCourses);
        setFlagsLoaded(true);
      })
      .catch(() => { setFlagsLoaded(true); });
  }, []);

  useEffect(() => {
    window.addEventListener("exam-date-updated", fetchUserData);
    return () => window.removeEventListener("exam-date-updated", fetchUserData);
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
            <Link href="/" className="flex items-center gap-2" onClick={handleNavClick}>
              <Sparkles className="h-6 w-6 text-blue-500" />
              <span className="text-lg font-bold">
                <span className="gradient-text">Student</span><span className="text-foreground/80 font-medium">Nest</span><span className="text-blue-600 dark:text-blue-700 dark:text-blue-400 font-normal text-[0.6em] ml-1">Prep</span>
              </span>
            </Link>
            <div className="flex items-center gap-1.5">
              {streakFreezes > 0 && (
                <span
                  className="text-xs font-semibold text-blue-300 flex items-center gap-0.5"
                  title={`${streakFreezes} streak freeze${streakFreezes !== 1 ? "s" : ""} saved`}
                >
                  🧊{streakFreezes}
                </span>
              )}
              {streakDays > 1 && (
                <span className="text-sm font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-0.5" title={`${streakDays}-day streak`}>
                  🔥{streakDays}
                </span>
              )}
            </div>
          </div>
          {/* Exam countdown */}
          {examDate && (() => {
            const daysLeft = Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 0) return null;
            return (
              <div className={`mt-3 flex items-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-lg ${
                daysLeft <= 14
                  ? "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/20"
                  : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/15"
              }`}>
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{daysLeft} day{daysLeft !== 1 ? "s" : ""} until exam</span>
              </div>
            );
          })()}
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
            <DropdownMenuContent align="start" className="w-64 p-0 max-h-[60vh] overflow-y-auto">
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
                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                      g.label === "CLEP Prep" && activeGroup === g.label
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "",
                      g.label === "DSST Prep" && activeGroup === g.label
                        ? "bg-orange-500/15 text-orange-700 dark:text-orange-400"
                        : ""
                    )}
                  >
                    {g.shortLabel}
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

        {/* Projected score for the selected course (reads /api/readiness) */}
        <SidebarReadiness />

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => !hiddenPages.has(item.href))
            .filter((item) => {
              // Admin-only items (e.g. Sage Coach while in diagnosis).
              if (item.adminOnly && userRole !== "ADMIN") return false;
              // Track-scoped items (e.g. FRQ Practice is AP-only). Admins see all.
              if (!item.tracks) return true;
              if (userRole === "ADMIN") return true;
              // 2026-05-03 — gate by CURRENT course family, not signup track.
              // FRQ Practice is meaningful only when the user's selected course
              // is in the AP family. Since users can now switch across AP/SAT/
              // ACT freely, the right gate is the course they're actually on.
              if (item.tracks.includes("ap") && (course as string).startsWith("AP_")) return true;
              if (item.tracks.includes("sat") && (course as string).startsWith("SAT_")) return true;
              if (item.tracks.includes("act") && (course as string).startsWith("ACT_")) return true;
              return false;
            })
            .map((item) => {
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
