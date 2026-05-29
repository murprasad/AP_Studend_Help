"use client";

/**
 * Confidence-Based Repetition rating — Brainscape-style 1-5 self-rate.
 *
 * Rendered between answer-pick and submit-feedback, behind
 * NEXT_PUBLIC_CBR=true. Optional / skippable — null becomes "Pretty sure"
 * (3) for SM-2 scheduling. The widget is intentionally tiny so it doesn't
 * add friction.
 *
 * Used by the Today's Set generator to surface harder cards faster
 * (low confidence + correct still re-shows; high confidence + correct
 * gets extended interval).
 */

interface Props {
  /** Currently selected value, 1-5, or null if not yet rated. */
  value: number | null;
  /** Called when user picks a confidence level. */
  onChange: (value: number) => void;
  /** Optional className override. */
  className?: string;
}

const LABELS: Array<{ value: number; label: string }> = [
  { value: 1, label: "Guessing" },
  { value: 2, label: "Maybe" },
  { value: 3, label: "Pretty sure" },
  { value: 4, label: "Confident" },
  { value: 5, label: "Certain" },
];

export function ConfidenceRating({ value, onChange, className }: Props) {
  return (
    <div className={className ?? "py-3"} data-testid="confidence-rating">
      <p className="text-xs uppercase tracking-wider text-muted-foreground text-center mb-2">
        How sure are you?
      </p>
      <div className="flex justify-center gap-1.5" role="radiogroup" aria-label="Confidence rating">
        {LABELS.map(({ value: v, label }) => {
          const selected = value === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={label}
              data-option-key={`conf-${v}`}
              onClick={() => onChange(v)}
              className={
                "flex-1 max-w-[88px] py-2 px-1 rounded-lg text-[11px] font-medium leading-tight transition-colors border-2 " +
                (selected
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-background text-muted-foreground hover:bg-accent border-border/40")
              }
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
