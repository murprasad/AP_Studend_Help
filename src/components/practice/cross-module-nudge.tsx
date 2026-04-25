"use client";

/**
 * CrossModuleNudge — post-session card surfaced on the practice summary
 * for Premium users who haven't yet explored exams outside their primary
 * track. Drives usage expansion now that Beta 7.1 makes Premium all-access.
 *
 * Self-gating: hits /api/cross-module-nudge to decide whether to render.
 *   - Free users → never shown
 *   - Premium user who has already practiced cross-track → never shown
 *   - Premium user who dismissed today → never shown (sessionStorage)
 *
 * One nudge max per session (sessionStorage key tied to date so it
 * naturally re-arms tomorrow). Renders null until the API resolves.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight, X } from "lucide-react";

const DISMISS_KEY = "cross_module_nudge_dismissed_date";

interface NudgeData {
  shouldNudge: boolean;
  currentModule?: string;
  suggestedExam?: "AP" | "SAT" | "ACT";
  suggestedDisplayName?: string;
  href?: string;
}

interface Props {
  course: string;
}

export function CrossModuleNudge({ course }: Props) {
  const [data, setData] = useState<NudgeData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Per-day dismissal — naturally rearms tomorrow.
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === today) {
        setDismissed(true);
        return;
      }
    } catch { /* sessionStorage unavailable — still try the API */ }

    let cancelled = false;
    fetch(`/api/cross-module-nudge?course=${encodeURIComponent(course)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setData(d);
      })
      .catch(() => { /* silent — nudge is enhancement */ });

    return () => { cancelled = true; };
  }, [course]);

  if (dismissed || !data || !data.shouldNudge) return null;

  const dismiss = () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      sessionStorage.setItem(DISMISS_KEY, today);
    } catch { /* non-blocking */ }
    setDismissed(true);
  };

  return (
    <Card className="card-glow border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-blue-500/5">
      <CardContent className="p-5 relative">
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute top-3 right-3 p-1 rounded hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div className="w-10 h-10 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-violet-500" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-bold text-violet-700 dark:text-violet-300">
              You unlocked {data.suggestedExam} too
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Premium covers every exam — try <strong>{data.suggestedDisplayName}</strong> next.
              Just 3 questions, about 2 minutes.
            </p>
          </div>
        </div>

        <Link href={data.href ?? "/practice"} className="block mt-4">
          <Button
            type="button"
            size="sm"
            className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2"
            onClick={dismiss}
          >
            Try {data.suggestedExam} practice
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
