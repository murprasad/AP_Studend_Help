"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sparkles, Mail, X } from "lucide-react";

/**
 * Exit-intent email capture for the Am I Ready results page.
 *
 * Mechanics: listens for `mouseleave` on the viewport (desktop) or
 * `visibilitychange` to hidden (mobile tab switch / home). When the
 * user signals they're about to leave, show a modal offering to email
 * the result + a free 7-day study plan.
 *
 * Fires at most once per visitor (localStorage guard) so closing it
 * doesn't retrigger on every mouse-out.
 */

const GUARD_KEY = "studentnest_exit_intent_shown";

interface Props {
  courseName: string;
  scaledScore: number;
  family: "AP" | "SAT" | "ACT";
  scaleMax: number;
  course: string;
}

export function ExitIntentCapture({ courseName, scaledScore, family, scaleMax, course }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(GUARD_KEY) === "1") {
        fired.current = true;
        return;
      }
    } catch { /* storage blocked — let it through */ }

    // Delay arming by 3s so the user has time to read the result.
    const armTimer = setTimeout(() => {
      const handleMouseLeave = (e: MouseEvent) => {
        // Only top-edge exits (pointer moving into the browser chrome).
        if (!fired.current && e.clientY <= 0) {
          fired.current = true;
          setOpen(true);
        }
      };
      const handleVisibility = () => {
        if (document.visibilityState === "hidden" && !fired.current) {
          fired.current = true;
          setOpen(true);
        }
      };
      document.addEventListener("mouseleave", handleMouseLeave);
      document.addEventListener("visibilitychange", handleVisibility);
      return () => {
        document.removeEventListener("mouseleave", handleMouseLeave);
        document.removeEventListener("visibilitychange", handleVisibility);
      };
    }, 3000);

    return () => clearTimeout(armTimer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/am-i-ready-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, courseName, scaledScore, family, course }),
      });
      if (!res.ok) throw new Error("save failed");
      try { localStorage.setItem(GUARD_KEY, "1"); } catch { /* ignore */ }
      setSubmitted(true);
    } catch {
      setError("Couldn't save right now — try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    try { localStorage.setItem(GUARD_KEY, "1"); } catch { /* ignore */ }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 p-1.5 rounded-lg hover:bg-accent transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
              <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold">Check your inbox</h2>
            <p className="text-sm text-muted-foreground">
              We&apos;ll send your {courseName} readiness result + a free 7-day study plan to <strong className="text-foreground">{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/15 flex items-center justify-center mx-auto">
                <Sparkles className="h-6 w-6 text-blue-500" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold">Don&apos;t lose your result</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We&apos;ll email your projected {family} score ({scaledScore}{scaleMax === 5 ? "/5" : ""}) + a free 7-day study plan to close the gap. Takes 10 seconds, no credit card.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground" htmlFor="exit-intent-email">
                Email
              </label>
              <input
                id="exit-intent-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-border/40 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
              {submitting ? "Saving…" : "Email me my result + plan"}
            </Button>

            <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
              We only use your email to send the result + plan. No spam. Unsubscribe anytime.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
