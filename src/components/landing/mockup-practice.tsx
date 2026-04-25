import { CheckCircle, Sparkles } from "lucide-react";

type Variant = "ap" | "act" | "sat" | "clep";

const VARIANTS: Record<Variant, {
  unitLabel: string;
  question: string;
  options: { id: string; text: string; state: "dimmed" | "correct" }[];
  explanation: string;
}> = {
  ap: {
    unitLabel: "MCQ · Unit 5: Revolutions",
    question: "Which of the following BEST explains why the French Revolution spread ideas of democracy across Europe?",
    options: [
      { id: "A", text: "The invention of the printing press", state: "dimmed" },
      { id: "B", text: "Napoleon's military campaigns", state: "correct" },
      { id: "C", text: "The Black Death epidemic", state: "dimmed" },
      { id: "D", text: "Trade routes along the Silk Road", state: "dimmed" },
    ],
    explanation:
      "Napoleon's military campaigns (1799–1815) carried Revolutionary ideals of liberty and nationalism into conquered territories, abolishing feudal privileges across Europe.",
  },
  act: {
    // ACT Math — distinctive 5-choice format (A–E), the ACT's signature.
    unitLabel: "ACT MATH · Coordinate Geometry",
    question: "What is the slope of the line passing through the points (−2, 3) and (4, −1)?",
    options: [
      { id: "A", text: "−2/3", state: "correct" },
      { id: "B", text: "2/3", state: "dimmed" },
      { id: "C", text: "−3/2", state: "dimmed" },
      { id: "D", text: "3/2", state: "dimmed" },
      { id: "E", text: "−4/6", state: "dimmed" },
    ],
    explanation:
      "Slope = (y₂ − y₁) / (x₂ − x₁) = (−1 − 3) / (4 − (−2)) = −4 / 6 = −2/3. Note E reduces to the same value but isn't in lowest terms — the ACT prefers the simplified form.",
  },
  sat: {
    unitLabel: "SAT MATH · Linear Equations",
    question: "If 3x − 7 = 2x + 5, what is the value of x?",
    options: [
      { id: "A", text: "−2", state: "dimmed" },
      { id: "B", text: "2", state: "dimmed" },
      { id: "C", text: "12", state: "correct" },
      { id: "D", text: "−12", state: "dimmed" },
    ],
    explanation:
      "Subtract 2x from both sides: x − 7 = 5. Add 7 to both sides: x = 12. The SAT rewards quick algebraic manipulation — practice isolating the variable in one step.",
  },
  clep: {
    unitLabel: "CLEP COLLEGE ALGEBRA · Functions",
    question: "If f(x) = 2x² − 3x + 1, what is f(−2)?",
    options: [
      { id: "A", text: "3", state: "dimmed" },
      { id: "B", text: "11", state: "dimmed" },
      { id: "C", text: "15", state: "correct" },
      { id: "D", text: "−9", state: "dimmed" },
    ],
    explanation:
      "Substitute x = −2: f(−2) = 2(4) − 3(−2) + 1 = 8 + 6 + 1 = 15. CLEP College Algebra emphasizes accurate function evaluation under time pressure.",
  },
};

export function MockupPractice({ variant = "ap" }: { variant?: Variant }) {
  const v = VARIANTS[variant];
  return (
    <div className="p-4 space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-secondary/40 overflow-hidden">
          <div className="h-full w-[30%] rounded-full bg-blue-500" />
        </div>
        <span className="text-[10px] text-muted-foreground flex-shrink-0">
          3 / 10
        </span>
      </div>

      {/* Question */}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">
          {v.unitLabel}
        </p>
        <p className="text-xs font-medium text-foreground/90 leading-relaxed">
          {v.question}
        </p>
      </div>

      {/* Options — static "answered" state */}
      <div className="space-y-1.5">
        {v.options.map((opt) => (
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
          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-3 w-3 text-blue-500" />
          </div>
          <span className="text-[10px] font-semibold text-blue-500">
            Correct! Sage explains:
          </span>
        </div>
        <p className="text-[10px] text-foreground/70 leading-relaxed">
          {v.explanation}
        </p>
      </div>
    </div>
  );
}
