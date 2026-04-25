import { Target, Clock } from "lucide-react";

type Variant = "ap" | "ap-generic" | "act" | "sat" | "clep";

const PLAN_VARIANTS: Record<Variant, {
  goal: string;
  focusAreas: { unit: string; priority: string; priorityColor: string; reason: string }[];
  schedule: string[];
}> = {
  ap: {
    goal: "Master Units 4 & 5 before Friday",
    focusAreas: [
      { unit: "Unit 4: Revolutions", priority: "HIGH", priorityColor: "bg-red-500/20 text-red-400 border-red-500/30", reason: "41% mastery — 12 MCQs recommended" },
      { unit: "Unit 5: Cold War", priority: "MEDIUM", priorityColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", reason: "63% mastery — 8 MCQs recommended" },
      { unit: "Unit 2: Exploration", priority: "LOW", priorityColor: "bg-blue-500/20 text-blue-400 border-blue-500/30", reason: "74% mastery — 5 MCQs to reinforce" },
    ],
    schedule: ["Mon: Unit 4 MCQs", "Tue: Unit 5 Review", "Wed: Mixed Practice", "Thu: Weak Topics"],
  },
  // Course-agnostic — used on the AP overview page that covers 10 courses.
  "ap-generic": {
    goal: "Master your weakest 2 units before Friday",
    focusAreas: [
      { unit: "Unit 4", priority: "HIGH", priorityColor: "bg-red-500/20 text-red-400 border-red-500/30", reason: "41% mastery — 12 MCQs recommended" },
      { unit: "Unit 5", priority: "MEDIUM", priorityColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", reason: "63% mastery — 8 MCQs recommended" },
      { unit: "Unit 2", priority: "LOW", priorityColor: "bg-blue-500/20 text-blue-400 border-blue-500/30", reason: "74% mastery — 5 MCQs to reinforce" },
    ],
    schedule: ["Mon: Unit 4 MCQs", "Tue: Unit 5 Review", "Wed: Mixed Practice", "Thu: Weak Topics"],
  },
  act: {
    goal: "Lift Science section before next mock",
    focusAreas: [
      { unit: "ACT Science", priority: "HIGH", priorityColor: "bg-red-500/20 text-red-400 border-red-500/30", reason: "54% accuracy — data-interp drills queued" },
      { unit: "ACT English", priority: "MEDIUM", priorityColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", reason: "76% — punctuation rules need review" },
      { unit: "ACT Math (5-choice)", priority: "LOW", priorityColor: "bg-blue-500/20 text-blue-400 border-blue-500/30", reason: "82% — pacing drills 60s/Q" },
    ],
    schedule: ["Mon: Science", "Tue: English", "Wed: Math timing", "Thu: Mixed"],
  },
  sat: {
    goal: "Lift Std English Conventions before next mock",
    focusAreas: [
      { unit: "Standard English Conventions", priority: "HIGH", priorityColor: "bg-red-500/20 text-red-400 border-red-500/30", reason: "49% accuracy — punctuation drills queued" },
      { unit: "Advanced Math", priority: "MEDIUM", priorityColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", reason: "68% — quadratics & nonlinear functions" },
      { unit: "Information & Ideas", priority: "LOW", priorityColor: "bg-blue-500/20 text-blue-400 border-blue-500/30", reason: "81% — passage pacing 75s/Q" },
    ],
    schedule: ["Mon: Std English", "Tue: Adv Math", "Wed: Info & Ideas", "Thu: Mixed"],
  },
  clep: {
    goal: "Master Logarithms before exam attempt",
    focusAreas: [
      { unit: "Logarithms", priority: "HIGH", priorityColor: "bg-red-500/20 text-red-400 border-red-500/30", reason: "47% mastery — 10 problems queued" },
      { unit: "Trigonometry", priority: "MEDIUM", priorityColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", reason: "62% — identities need review" },
      { unit: "Equations", priority: "LOW", priorityColor: "bg-blue-500/20 text-blue-400 border-blue-500/30", reason: "78% — quick-solve drills" },
    ],
    schedule: ["Mon: Logs", "Tue: Trig", "Wed: Mixed", "Thu: Mock"],
  },
};

export function MockupStudyPlan({ variant = "ap" }: { variant?: Variant }) {
  const v = PLAN_VARIANTS[variant];
  return (
    <div className="p-4 space-y-3">
      {/* This Week's Goal — glowing card */}
      <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 shadow-[0_0_15px_rgba(99,102,241,0.08)]">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Target className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <span className="text-xs font-semibold text-blue-400">
            This Week&apos;s Goal
          </span>
        </div>
        <p className="text-sm font-medium">
          {v.goal}
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
        {v.focusAreas.map((f) => (
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
        {v.schedule.map((day) => (
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
