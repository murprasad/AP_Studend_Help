"use client";

/**
 * LockedValueCard — Dashboard v2 Block 5.
 *
 * Replaces the old generic "Ask parent to upgrade" plea with a contextual,
 * price-visible, parent-friendly lock.
 *
 * Principle (per 2026-04-22 reviewer + governing principle on tier-limits):
 *   Free users should feel progress — but not certainty.
 *
 * Renders for FREE users only. Shows the 4 things they can't access, each
 * with emotional framing (not a dry feature list). $9.99/mo is anchored.
 * Primary CTA is "Send to parent" (same parent-invite flow as before) so
 * the click leads somewhere concrete for a student without a credit card.
 * Secondary CTA is direct upgrade for parents who are themselves the user.
 *
 * Contextual counts (e.g. "3 mock exams left") will wire through task #32
 * (Option B tier-limits consolidation) once /api/user/limits is live.
 */

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Check, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface LimitsResponse {
  tier: "FREE" | "PREMIUM";
  unlimited: boolean;
  usage?: {
    practice: { used: number; limit: number; remaining: number };
    tutor: { used: number; limit: number; remaining: number };
    mockExam: { previewQuestions: number };
  } | null;
}

export function LockedValueCard() {
  const [data, setData] = useState<LimitsResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [parentName, setParentName] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/limits", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: LimitsResponse | null) => {
        if (!cancelled && d) setData(d);
      })
      .catch(() => { /* silent — component hides on fetch failure */ });
    return () => { cancelled = true; };
  }, []);

  // PREMIUM or loading — hide entirely. Never flash a lock at a paying user.
  if (!data || data.tier !== "FREE" || data.unlimited) return null;
  if (sent) {
    return (
      <Card className="rounded-[16px] border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-4 sm:p-5 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Check className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-[14px] font-semibold leading-tight">Request sent to your parent</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              They&apos;ll receive an email in a minute with a link to upgrade.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const submit = async () => {
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/parent-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentEmail: email.trim(), parentName: parentName.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || (data?.error === "rate_limited" ? "You can send one invite per day." : "Couldn't send — check the email and try again."));
        return;
      }
      setSent(true);
    } catch {
      setError("Network error — try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="rounded-[16px] border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-bold leading-tight">Unlock the rest of your prep</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              <span className="font-semibold text-foreground">$9.99/mo</span>
              {" · "}less than a weekend matinee
            </p>
          </div>
        </div>

        {/* The locks — framed emotionally, not as a feature list.
            Numbers pulled from /api/user/limits so they match the
            actual cap (single source of truth in tier-limits.ts). */}
        <ul className="space-y-2 text-[13px]">
          <li className="flex gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground/70 mt-0.5 shrink-0" />
            <span>
              <span className="font-medium text-foreground">Unlimited practice</span>
              {data.usage && ` — ${data.usage.practice.limit}/day is too slow to pass`}
            </span>
          </li>
          <li className="flex gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground/70 mt-0.5 shrink-0" />
            <span>
              <span className="font-medium text-foreground">Full mock exams</span>
              {data.usage && ` — simulate test day, not just Q1–${data.usage.mockExam.previewQuestions}`}
            </span>
          </li>
          <li className="flex gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground/70 mt-0.5 shrink-0" />
            <span><span className="font-medium text-foreground">FRQ practice</span> — colleges grade written answers</span>
          </li>
          <li className="flex gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground/70 mt-0.5 shrink-0" />
            <span><span className="font-medium text-foreground">Full analytics</span> — see exactly what to fix, not just where you&apos;re weak</span>
          </li>
        </ul>

        {/* CTAs */}
        {!open ? (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" onClick={() => setOpen(true)} className="rounded-full h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90 flex-1 min-w-[140px]">
              Send to parent <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Link href="/billing" className="flex-1 min-w-[120px]">
              <Button size="sm" variant="outline" className="rounded-full h-10 px-4 w-full">
                Upgrade now
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <p className="text-[12px] text-muted-foreground">
              We&apos;ll email your parent with your progress snapshot and a signup link. One invite per day.
            </p>
            <Input
              type="email"
              placeholder="Parent's email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sending}
              className="h-10"
            />
            <Input
              type="text"
              placeholder="Parent's first name (optional)"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              disabled={sending}
              className="h-10"
            />
            {error && <p className="text-[12px] text-destructive">{error}</p>}
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={submit}
                disabled={sending || !email.includes("@")}
                className="rounded-full h-10 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Send invite
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setOpen(false); setError(null); }}
                className="rounded-full h-10 text-muted-foreground"
                disabled={sending}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
