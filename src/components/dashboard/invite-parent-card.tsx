"use client";

/**
 * InviteParentCard — low-friction conversion hook.
 *
 * Appears on the student dashboard when they've done enough practice to
 * have a progress story worth showing (≥3 sessions). Clicking "Ask parent
 * to upgrade" expands an inline form for the parent's email. On submit,
 * the backend sends the parent a personalized upgrade email (student
 * progress snapshot + $9.99/mo anchor + Stripe checkout link).
 *
 * Renders null for users who haven't practiced enough — no point wasting
 * a conversion slot on a blank pitch. Also renders null once we get a
 * successful invite (prevents double-sending in the same session).
 */

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Check, Loader2 } from "lucide-react";

interface Props {
  sessionsCount?: number; // passed from parent server component if known
}

export function InviteParentCard({ sessionsCount }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [parentName, setParentName] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownSessions, setOwnSessions] = useState<number | null>(sessionsCount ?? null);

  // Fetch session count client-side if not provided
  useEffect(() => {
    if (sessionsCount != null) return;
    let cancelled = false;
    fetch("/api/user/sessions-count", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.count != null) setOwnSessions(d.count); })
      .catch(() => { /* silent — card just stays hidden */ });
    return () => { cancelled = true; };
  }, [sessionsCount]);

  // Hide until the student has a progress story worth showing
  if (sent) return null;
  if (ownSessions == null) return null;
  if (ownSessions < 3) return null;

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
    <Card className="rounded-[16px] border-rose-500/20 bg-gradient-to-r from-rose-500/5 to-amber-500/5">
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
            <Heart className="h-4 w-4 text-rose-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold leading-tight">Unlock unlimited practice</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Ask your parent to upgrade for $9.99/mo — less than a weekend matinee.
            </p>
          </div>
          {!open && (
            <Button size="sm" onClick={() => setOpen(true)} className="rounded-full h-9 px-3 bg-rose-500 text-white hover:bg-rose-600 shrink-0">
              Ask parent
            </Button>
          )}
        </div>

        {open && (
          <div className="space-y-2 pt-1">
            <p className="text-[12px] text-muted-foreground">
              We'll send your parent an email with your progress and a signup link. One invite per day.
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
                className="rounded-full h-9 bg-rose-500 text-white hover:bg-rose-600"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Send invite
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setOpen(false); setError(null); }}
                className="rounded-full h-9 text-muted-foreground"
                disabled={sending}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {sent && (
          <div className="flex items-center gap-2 text-[13px] text-emerald-600 pt-2">
            <Check className="h-4 w-4" />
            <span>Invite sent! Your parent will receive an email in a minute.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
