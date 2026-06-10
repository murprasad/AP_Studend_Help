"use client";

/**
 * Focus Mode intro — a one-time, friendly explainer shown on first dashboard
 * load so students discover how to ENTER and EXIT Focus Mode (the small pill
 * top-right is easy to miss). 2026-06-08, per user request.
 *
 * Safe-Browsing note: built on the shadcn <Dialog> (allowlisted in
 * scripts/pre-release-check.js §9). It does NOT introduce a raw `fixed inset-0`
 * dark overlay in this file, so it cannot trip Google's deceptive-overlay flag.
 * It is a clearly-labeled, easily-dismissable product dialog — never a fake
 * system prompt, never blocking, with a visible Close (X) + "Maybe later".
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Focus } from "lucide-react";
import { useFocusPrefs } from "@/hooks/use-focus-prefs";

const SEEN_KEY = "sn_focus_intro_seen";

export function FocusModeIntroModal() {
  const { setFocusMode } = useFocusPrefs();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Show once per browser, only after onboarding. Defer a tick so it doesn't
  // fight first paint. NEVER show during the journey/onboarding flow — it
  // popped over the Step-5 "You're set up → pick your next step" tiles and
  // obscured them (journey-rail-96 Step 5 failures). Wait until the student
  // is on the dashboard; the pathname dep re-runs this when they arrive.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname && (pathname.startsWith("/journey") || pathname.startsWith("/onboarding"))) return;
    try {
      if (!localStorage.getItem(SEEN_KEY)) {
        const t = setTimeout(() => setOpen(true), 900);
        return () => clearTimeout(t);
      }
    } catch { /* localStorage blocked — just don't show */ }
  }, [pathname]);

  function dismiss() {
    try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* ignore */ }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Focus className="h-5 w-5 text-primary" /> Meet Focus Mode
          </DialogTitle>
          <DialogDescription>
            When studying feels noisy, switch to Focus Mode — calm colors, one
            thing at a time, no distractions.
          </DialogDescription>
        </DialogHeader>

        {/* Animated demo of the pill students will tap. Pure CSS animation; the
            pill mirrors the real top-right toggle so they know what to look for. */}
        <div className="my-2 rounded-xl border border-border/60 bg-muted/40 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Look for this, top-right of every page:</span>
            <span
              className="relative inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium shadow-sm"
              aria-hidden="true"
            >
              <span className="absolute inset-0 rounded-full ring-2 ring-primary/50 animate-ping" />
              <Focus className="relative h-3.5 w-3.5" />
              <span className="relative">Focus</span>
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            <strong>Tap it</strong> to turn Focus Mode on. <strong>Tap again</strong> to go back to Regular.
            You can switch any time — your progress is never affected.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="ghost" onClick={dismiss}>Maybe later</Button>
          <Button
            className="gap-2"
            onClick={() => { setFocusMode(true); dismiss(); }}
          >
            <Focus className="h-4 w-4" /> Try Focus Mode now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
