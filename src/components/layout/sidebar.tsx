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
  Globe,
  LogOut,
  Shield,
  Trophy,
  Library,
  ChevronDown,
  Info,
  Crown,
  FileText,
} from "lucide-react";
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
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/study-plan", icon: BookOpen, label: "Study Plan" },
  { href: "/resources", icon: Library, label: "Resources" },
  { href: "/ai-tutor", icon: MessageSquare, label: "AI Tutor" },
  { href: "/billing", icon: Crown, label: "Billing" },
  { href: "/docs", icon: FileText, label: "Docs" },
  { href: "/about", icon: Info, label: "About" },
];

// Derived from COURSE_REGISTRY — no hardcoded course names here.
const COURSE_OPTIONS = (Object.entries(COURSE_REGISTRY) as [ApCourse, { name: string; shortName: string }][]).map(
  ([value, cfg]) => ({ value, label: cfg.name, short: cfg.shortName })
);

interface SidebarProps {
  userRole?: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [course, setCourse] = useCourse();

  function handleCourseChange(newCourse: ApCourse) {
    setCourse(newCourse);
    router.refresh();
  }

  return (
    <aside className="w-64 bg-card border-r border-border/40 flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border/40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Globe className="h-7 w-7 text-indigo-400" />
          <span className="text-lg font-bold gradient-text">PrepNova</span>
        </Link>
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
          <DropdownMenuContent align="start" className="w-60">
            {COURSE_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => handleCourseChange(opt.value)}
                className={cn(
                  "cursor-pointer text-sm",
                  course === opt.value && "bg-primary/10 text-primary font-medium"
                )}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
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
