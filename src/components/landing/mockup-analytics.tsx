import { Target, Zap, Star } from "lucide-react";

type Variant = "ap" | "ap-generic" | "act" | "sat" | "clep";

const stats = [
  { label: "Accuracy", value: "78%", icon: Target, color: "text-emerald-700 dark:text-emerald-400" },
  { label: "Questions", value: "342", icon: Zap, color: "text-blue-700 dark:text-blue-400" },
  { label: "Streak", value: "12d", icon: () => <span className="text-sm">&#128293;</span>, color: "text-orange-700 dark:text-orange-400" },
  { label: "XP", value: "2,450", icon: Star, color: "text-purple-700 dark:text-purple-400" },
];

const UNIT_VARIANTS: Record<Variant, { listLabel: string; rows: { name: string; mastery: number; color: string }[] }> = {
  ap: {
    listLabel: "Mastery by Unit",
    rows: [
      { name: "Unit 1: Renaissance", mastery: 92, color: "bg-emerald-500" },
      { name: "Unit 2: Exploration", mastery: 74, color: "bg-yellow-500" },
      { name: "Unit 3: Imperialism", mastery: 85, color: "bg-emerald-500" },
      { name: "Unit 4: Revolutions", mastery: 41, color: "bg-red-500" },
      { name: "Unit 5: Cold War", mastery: 63, color: "bg-yellow-500" },
    ],
  },
  // Course-agnostic — used on the AP overview page that covers 10 courses
  // (World History, Calc AB/BC, Bio, Chem, Stats, USH, etc). Generic
  // "Unit N" labels avoid signaling that the product is history-only.
  "ap-generic": {
    listLabel: "Mastery by Unit",
    rows: [
      { name: "Unit 1", mastery: 92, color: "bg-emerald-500" },
      { name: "Unit 2", mastery: 74, color: "bg-yellow-500" },
      { name: "Unit 3", mastery: 85, color: "bg-emerald-500" },
      { name: "Unit 4", mastery: 41, color: "bg-red-500" },
      { name: "Unit 5", mastery: 63, color: "bg-yellow-500" },
    ],
  },
  act: {
    listLabel: "ACT Section Scores",
    rows: [
      { name: "Math", mastery: 82, color: "bg-emerald-500" },
      { name: "English", mastery: 76, color: "bg-yellow-500" },
      { name: "Reading", mastery: 88, color: "bg-emerald-500" },
      { name: "Science", mastery: 54, color: "bg-red-500" },
      { name: "Composite", mastery: 75, color: "bg-blue-500" },
    ],
  },
  sat: {
    // SAT-native domain breakdown — matches College Board's actual
    // domain structure (Algebra, Advanced Math, Problem Solving & Data
    // Analysis, Geometry & Trig for Math; Info & Ideas, Craft &
    // Structure, Expression of Ideas, Standard English for R&W).
    // Five rows fit cleanly; we surface the most-distinctive ones.
    listLabel: "SAT Domain Mastery",
    rows: [
      { name: "Algebra", mastery: 87, color: "bg-emerald-500" },
      { name: "Advanced Math", mastery: 68, color: "bg-yellow-500" },
      { name: "Problem Solving", mastery: 74, color: "bg-yellow-500" },
      { name: "Info & Ideas", mastery: 81, color: "bg-emerald-500" },
      { name: "Std English", mastery: 49, color: "bg-red-500" },
    ],
  },
  clep: {
    listLabel: "CLEP Topic Mastery",
    rows: [
      { name: "Functions", mastery: 91, color: "bg-emerald-500" },
      { name: "Equations", mastery: 78, color: "bg-yellow-500" },
      { name: "Polynomials", mastery: 84, color: "bg-emerald-500" },
      { name: "Logarithms", mastery: 47, color: "bg-red-500" },
      { name: "Trigonometry", mastery: 62, color: "bg-yellow-500" },
    ],
  },
};

export function MockupAnalytics({ variant = "ap" }: { variant?: Variant }) {
  const { listLabel, rows } = UNIT_VARIANTS[variant];
  return (
    <div className="p-4 space-y-4">
      {/* Stat cards row */}
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="p-2 rounded-lg border border-border/30 bg-secondary/30 text-center"
          >
            <div className="flex items-center justify-center mb-1">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
            </div>
            <p className="text-sm font-bold leading-none">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Mastery — CSS bar chart */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-2">
          {listLabel}
        </p>
        <div className="space-y-1.5">
          {rows.map((u) => (
            <div key={u.name} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-24 truncate flex-shrink-0">
                {u.name}
              </span>
              <div className="flex-1 h-3 rounded-full bg-secondary/40 overflow-hidden">
                <div
                  className={`h-full rounded-full ${u.color} transition-all`}
                  style={{ width: `${u.mastery}%` }}
                />
              </div>
              <span className="text-[10px] font-medium w-7 text-right">
                {u.mastery}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Accuracy trend — simple CSS bars */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-2">
          Accuracy Over Time
        </p>
        <div className="h-12 flex items-end gap-[3px]">
          {[45, 52, 48, 61, 58, 67, 72, 69, 75, 78, 74, 82].map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-blue-500/60 transition-all"
              style={{ height: `${(v / 100) * 100}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-muted-foreground">2 wks ago</span>
          <span className="text-[9px] text-muted-foreground">Today</span>
        </div>
      </div>
    </div>
  );
}
