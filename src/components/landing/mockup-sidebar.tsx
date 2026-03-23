import { Sparkles, ChevronDown, BarChart3, Zap, BookOpen, Target } from "lucide-react";

const navItems = [
  { icon: BarChart3, label: "Dashboard", active: false },
  { icon: Zap, label: "Practice", active: true },
  { icon: BookOpen, label: "Study Plan", active: false },
  { icon: Target, label: "Analytics", active: false },
];

export function MockupSidebar() {
  return (
    <div className="w-full p-3 space-y-3">
      {/* Logo */}
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-4 w-4 text-indigo-400" />
        <span className="text-xs font-bold">
          <span className="gradient-text">Student</span>
          <span className="text-foreground/80 font-medium">Nest</span>
        </span>
      </div>

      {/* Course selector */}
      <div className="flex items-center justify-between px-2 py-1.5 rounded-md border border-border/30 bg-secondary/20">
        <span className="text-[10px] font-medium truncate">AP World History</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      </div>

      {/* Streak + Exam */}
      <div className="flex items-center gap-3 px-1">
        <span className="text-[10px]">&#128293; 12 days</span>
        <span className="text-[10px] text-indigo-400">&#128197; 47d to exam</span>
      </div>

      {/* Nav */}
      <div className="space-y-0.5">
        {navItems.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] ${
              item.active
                ? "bg-indigo-500/10 text-indigo-300 font-medium"
                : "text-muted-foreground"
            }`}
          >
            <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
