"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ScrollText, Telescope, Target } from "lucide-react";

type Tone = "blue" | "indigo" | "emerald" | "amber" | "purple";

const toneClass: Record<Tone, string> = {
  blue: "border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-blue-500/5",
  indigo: "border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-indigo-500/5",
  emerald: "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/5",
  amber: "border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-500/5",
  purple: "border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-purple-500/5",
};

const iconMap: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="h-7 w-7" />,
  scroll: <ScrollText className="h-7 w-7" />,
  telescope: <Telescope className="h-7 w-7" />,
  target: <Target className="h-7 w-7" />,
};

interface Props {
  eyebrow?: string;
  title: string;
  body: string;
  cta: string;
  tone?: Tone;
  icon?: keyof typeof iconMap;
  onContinue: () => void;
}

export function TransitionCard({
  eyebrow,
  title,
  body,
  cta,
  tone = "blue",
  icon = "sparkles",
  onContinue,
}: Props) {
  return (
    <div className="pt-12">
      <div className={`rounded-2xl border p-8 text-center space-y-4 ${toneClass[tone]}`}>
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-blue-700 dark:text-blue-400">
          {iconMap[icon]}
        </div>
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-bold leading-snug max-w-md mx-auto">{title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          {body}
        </p>
        <Button size="lg" onClick={onContinue} className="rounded-full gap-2 mt-2">
          {cta}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
