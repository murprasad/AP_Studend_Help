import { CheckCircle, Sparkles } from "lucide-react";

const options = [
  { id: "A", text: "The invention of the printing press", state: "dimmed" as const },
  { id: "B", text: "Napoleon's military campaigns", state: "correct" as const },
  { id: "C", text: "The Black Death epidemic", state: "dimmed" as const },
  { id: "D", text: "Trade routes along the Silk Road", state: "dimmed" as const },
];

export function MockupPractice() {
  return (
    <div className="p-4 space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-secondary/40 overflow-hidden">
          <div className="h-full w-[30%] rounded-full bg-indigo-500" />
        </div>
        <span className="text-[10px] text-muted-foreground flex-shrink-0">
          3 / 10
        </span>
      </div>

      {/* Question */}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">
          MCQ &middot; Unit 5: Revolutions
        </p>
        <p className="text-xs font-medium text-foreground/90 leading-relaxed">
          Which of the following BEST explains why the French Revolution spread
          ideas of democracy across Europe?
        </p>
      </div>

      {/* Options — static "answered" state */}
      <div className="space-y-1.5">
        {options.map((opt) => (
          <div
            key={opt.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all ${
              opt.state === "correct"
                ? "border-emerald-500/60 bg-emerald-500/10"
                : "border-border/20 bg-secondary/10 opacity-50"
            }`}
          >
            <span className="font-mono font-semibold text-[10px] text-muted-foreground w-4 flex-shrink-0">
              {opt.id}
            </span>
            <span className="flex-1 text-foreground/90">{opt.text}</span>
            {opt.state === "correct" && (
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Sage explanation */}
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-3 w-3 text-indigo-400" />
          </div>
          <span className="text-[10px] font-semibold text-indigo-400">
            Correct! Sage explains:
          </span>
        </div>
        <p className="text-[10px] text-foreground/70 leading-relaxed">
          Napoleon&apos;s military campaigns (1799&ndash;1815) carried
          Revolutionary ideals of liberty and nationalism into conquered
          territories, abolishing feudal privileges across Europe.
        </p>
      </div>
    </div>
  );
}
