import { Target, Clock } from "lucide-react";

const focusAreas = [
  {
    unit: "Unit 4: Revolutions",
    priority: "HIGH",
    priorityColor: "bg-red-500/20 text-red-400 border-red-500/30",
    reason: "41% mastery — 12 MCQs recommended",
  },
  {
    unit: "Unit 5: Cold War",
    priority: "MEDIUM",
    priorityColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    reason: "63% mastery — 8 MCQs recommended",
  },
  {
    unit: "Unit 2: Exploration",
    priority: "LOW",
    priorityColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    reason: "74% mastery — 5 MCQs to reinforce",
  },
];

const schedule = ["Mon: Unit 4 MCQs", "Tue: Unit 5 Review", "Wed: Mixed Practice", "Thu: Weak Topics"];

export function MockupStudyPlan() {
  return (
    <div className="p-4 space-y-3">
      {/* This Week's Goal — glowing card */}
      <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 shadow-[0_0_15px_rgba(99,102,241,0.08)]">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Target className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <span className="text-xs font-semibold text-indigo-300">
            This Week&apos;s Goal
          </span>
        </div>
        <p className="text-sm font-medium">
          Master Units 4 &amp; 5 before Friday
        </p>
        <div className="flex items-center gap-1 mt-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            ~30 min/day recommended
          </span>
        </div>
      </div>

      {/* Focus Areas */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium text-muted-foreground">
          Focus Areas
        </p>
        {focusAreas.map((f) => (
          <div
            key={f.unit}
            className="flex items-center justify-between p-2.5 rounded-lg border border-border/30 bg-secondary/20"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{f.unit}</p>
              <p className="text-[10px] text-muted-foreground">{f.reason}</p>
            </div>
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ml-2 ${f.priorityColor}`}
            >
              {f.priority}
            </span>
          </div>
        ))}
      </div>

      {/* Mini weekly schedule */}
      <div className="flex gap-1.5 overflow-hidden">
        {schedule.map((day) => (
          <div
            key={day}
            className="flex-1 min-w-0 p-1.5 rounded-md bg-secondary/30 border border-border/20"
          >
            <p className="text-[9px] text-muted-foreground truncate">{day}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
