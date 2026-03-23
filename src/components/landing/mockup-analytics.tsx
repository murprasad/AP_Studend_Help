import { Target, Zap, Star } from "lucide-react";

const stats = [
  { label: "Accuracy", value: "78%", icon: Target, color: "text-emerald-400" },
  { label: "Questions", value: "342", icon: Zap, color: "text-blue-400" },
  { label: "Streak", value: "12d", icon: () => <span className="text-sm">&#128293;</span>, color: "text-orange-400" },
  { label: "XP", value: "2,450", icon: Star, color: "text-purple-400" },
];

const units = [
  { name: "Unit 1: Renaissance", mastery: 92, color: "bg-emerald-500" },
  { name: "Unit 2: Exploration", mastery: 74, color: "bg-yellow-500" },
  { name: "Unit 3: Imperialism", mastery: 85, color: "bg-emerald-500" },
  { name: "Unit 4: Revolutions", mastery: 41, color: "bg-red-500" },
  { name: "Unit 5: Cold War", mastery: 63, color: "bg-yellow-500" },
];

export function MockupAnalytics() {
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

      {/* Mastery by Unit — CSS bar chart */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-2">
          Mastery by Unit
        </p>
        <div className="space-y-1.5">
          {units.map((u) => (
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
          <span className="text-[9px] text-muted-foreground/60">2 wks ago</span>
          <span className="text-[9px] text-muted-foreground/60">Today</span>
        </div>
      </div>
    </div>
  );
}
