"use client";

/**
 * 2026-05-31 — Digital SAT inter-module break (F2 of #100 SAT=CB parity).
 *
 * CB Bluebook gives the student a 10-minute break between Module 1 and
 * Module 2 of every section (Math and Reading & Writing). The timer runs
 * down on its own; the student can click "Resume now" to start Module 2
 * early, or the screen advances automatically when the timer hits 0.
 *
 * This screen is shown ONLY for SAT_MATH, SAT_READING_WRITING, PSAT_MATH,
 * PSAT_READING_WRITING. Other exams (AP, ACT, CLEP) flow through their
 * single section uninterrupted.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Coffee, Play } from "lucide-react";

const BREAK_SECS = 10 * 60;

export function SatModuleBreak({ onContinue }: { onContinue: () => void }) {
  const [secsLeft, setSecsLeft] = useState(BREAK_SECS);

  useEffect(() => {
    if (secsLeft <= 0) {
      onContinue();
      return;
    }
    const id = setInterval(() => setSecsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secsLeft, onContinue]);

  const mm = Math.floor(secsLeft / 60).toString().padStart(2, "0");
  const ss = (secsLeft % 60).toString().padStart(2, "0");

  return (
    <div className="max-w-xl mx-auto py-12">
      <Card className="card-glow">
        <CardContent className="p-8 space-y-6 text-center">
          <Coffee className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold mb-2">Module 1 complete</h2>
            <p className="text-muted-foreground text-base">
              Take a 10-minute break before Module 2 begins. This mirrors
              the digital SAT&apos;s between-module timer.
            </p>
          </div>
          <div className="font-mono text-5xl font-semibold tabular-nums">
            {mm}:{ss}
          </div>
          <p className="text-xs text-muted-foreground">
            The timer counts down automatically. You can resume Module 2 at any time.
          </p>
          <Button onClick={onContinue} size="lg" className="w-full gap-2">
            <Play className="h-4 w-4" />
            Resume now — start Module 2
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
