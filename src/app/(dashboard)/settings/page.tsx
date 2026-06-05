"use client";

/**
 * /settings — Account control surface (StudentNest).
 *
 * 2026-05-28 Sprint B1 — was missing entirely. Student walkthrough P0:
 * 14-item sidebar with no Settings; no way to change exam date / track /
 * delete account / sign out except via /billing's buried text link.
 *
 * v1 scope:
 *   - Display profile (name + email + grade)
 *   - Edit exam date (via existing /api/user/exam-date)
 *   - Switch track AP / SAT / ACT (via PATCH /api/user)
 *   - Daily quiz email opt-in toggle
 *   - Sign out
 *   - Link to /billing
 *   - Delete account (DELETE /api/user — newly added)
 */

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useFocusPrefs, type ExtendedTime } from "@/hooks/use-focus-prefs";
import { Crown, Calendar, BookOpen, Bell, LogOut, AlertTriangle, ExternalLink, Brain } from "lucide-react";

const EXTENDED_TIME_OPTIONS: ExtendedTime[] = ["1x", "1.5x", "2x"];

interface ProfileSnapshot {
  email: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  track: string;
  examDate: string | null;
  dailyQuizOptIn: boolean;
  subscriptionTier: string;
}

const TRACKS: Array<{ value: string; label: string }> = [
  { value: "ap", label: "AP" },
  { value: "sat", label: "SAT" },
  { value: "act", label: "ACT" },
];

export default function SettingsPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { prefs: focusPrefs, setFocusMode, setExtendedTime, setEnergyCheckIn } = useFocusPrefs();
  const [profile, setProfile] = useState<ProfileSnapshot | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        // 2026-06-02 — /api/user returns { user: {...}, flags, moduleSubs }.
        // Was reading data.email / data.firstName / etc. directly, which is
        // one level too shallow. Result: Settings Profile rendered "—" for
        // Name/Email/Grade for every user (user-reported on SAT walk).
        const u = data.user ?? data; // tolerate the legacy degraded fallback too
        setProfile({
          email: u.email ?? "",
          firstName: u.firstName ?? "",
          lastName: u.lastName ?? "",
          gradeLevel: u.gradeLevel ?? "",
          track: u.track ?? "ap",
          examDate: u.examDate ?? null,
          dailyQuizOptIn: !!u.dailyQuizOptIn,
          subscriptionTier: u.subscriptionTier ?? "FREE",
        });
      })
      .catch(() => {});
  }, [status]);

  async function patchUser(body: Record<string, unknown>, label: string) {
    setBusy(label);
    try {
      const r = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${r.status}`);
      }
      toast({ title: "Saved." });
      await updateSession().catch(() => {});
    } catch (e) {
      toast({ title: "Couldn't save", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  }

  async function updateExamDate(value: string) {
    setBusy("examDate");
    try {
      const r = await fetch("/api/user/exam-date", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examDate: value || null }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setProfile((p) => (p ? { ...p, examDate: value || null } : p));
      toast({ title: "Exam date updated." });
    } catch {
      toast({ title: "Couldn't update exam date", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  }

  async function deleteAccount() {
    setBusy("delete");
    try {
      const r = await fetch("/api/user", { method: "DELETE" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      toast({ title: "Account deleted." });
      await signOut({ callbackUrl: "/" });
    } catch {
      toast({ title: "Couldn't delete account. Email contact@studentnest.ai.", variant: "destructive" });
      setBusy(null);
    }
  }

  if (status === "loading" || !profile) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading settings…</div>;
  }

  const isPremium = profile.subscriptionTier !== "FREE";
  const examDateValue = profile.examDate ? profile.examDate.slice(0, 10) : "";

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account, prep cadence, and notifications.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <Row label="Name" value={`${profile.firstName} ${profile.lastName}`.trim() || "—"} />
          <Row label="Email" value={profile.email} />
          <Row label="Grade" value={profile.gradeLevel || "—"} />
          <Row label="Plan" value={isPremium ? profile.subscriptionTier : "FREE"} accent={isPremium ? "amber" : undefined} />
          <p className="text-[11px] text-muted-foreground pt-1">
            Email / name editing coming soon. Email <a href="mailto:contact@studentnest.ai" className="underline">contact@studentnest.ai</a> for changes today.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            Exam date
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <input
            type="date"
            defaultValue={examDateValue}
            disabled={busy === "examDate"}
            onChange={(e) => updateExamDate(e.target.value)}
            className="w-full sm:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <p className="text-[11px] text-muted-foreground">
            Drives dashboard countdown + paces your weekly plan.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-500" />
            Track
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            {TRACKS.map((t) => (
              <Button
                key={t.value}
                variant={profile.track === t.value ? "default" : "outline"}
                size="sm"
                disabled={busy === "track"}
                onClick={() => {
                  setProfile((p) => (p ? { ...p, track: t.value } : p));
                  patchUser({ track: t.value }, "track");
                }}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Sidebar always shows all three; this is the default highlight + initial recommendations.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-purple-500" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.dailyQuizOptIn}
              disabled={busy === "dailyQuiz"}
              onChange={(e) => {
                const v = e.target.checked;
                setProfile((p) => (p ? { ...p, dailyQuizOptIn: v } : p));
                patchUser({ dailyQuizOptIn: v }, "dailyQuiz");
              }}
              className="mt-0.5"
            />
            <span className="text-sm">
              <span className="font-medium">Daily quiz email</span>
              <span className="block text-[11px] text-muted-foreground">One 3-question quick win every morning. Free, opt-in.</span>
            </span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-teal-500" />
            Focus tools — for students who learn differently
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={focusPrefs.focusMode}
              onChange={(e) => setFocusMode(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm">
              <span className="font-medium">Focus mode</span>
              <span className="block text-[11px] text-muted-foreground">
                A minimal, distraction-reduced layout while you practice.
              </span>
            </span>
          </label>

          <div className="space-y-1.5">
            <span className="text-sm font-medium block">Extended time</span>
            <div className="flex gap-2 flex-wrap">
              {EXTENDED_TIME_OPTIONS.map((opt) => (
                <Button
                  key={opt}
                  variant={focusPrefs.extendedTime === opt ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExtendedTime(opt)}
                >
                  {opt}
                </Button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Extra time on timed practice and mock exams.
            </p>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={focusPrefs.energyCheckIn}
              onChange={(e) => setEnergyCheckIn(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm">
              <span className="font-medium">Energy check-in</span>
              <span className="block text-[11px] text-muted-foreground">
                A quick how-are-you-feeling check at the start of each session.
              </span>
            </span>
          </label>

          <Link href="/learning-style" className="inline-flex items-center gap-1 text-sm text-primary underline">
            Not sure what helps? Take the 5-min study-style quiz <ExternalLink className="h-3 w-3" />
          </Link>

          <p className="text-[11px] text-muted-foreground/70 pt-1">
            Focus-friendly study aids included with your plan. These are general study tools, not a medical or diagnostic feature.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Plan &amp; billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/billing" className="inline-flex items-center gap-1 text-sm text-primary underline">
            Manage plan, payment method, data export <ExternalLink className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Danger zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!confirmDelete ? (
            <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
              Delete my account
            </Button>
          ) : (
            <>
              <p className="text-sm">
                This wipes your progress, sessions, mastery, and (if any) subscription. Cancel your plan first on /billing if you want to retain billing records.
              </p>
              <p className="text-xs text-muted-foreground">
                Type <span className="font-mono font-semibold">DELETE</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                placeholder="DELETE"
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteConfirmText !== "DELETE" || busy === "delete"}
                  onClick={deleteAccount}
                >
                  {busy === "delete" ? "Deleting…" : "Permanently delete account"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setConfirmDelete(false); setDeleteConfirmText(""); }} disabled={busy === "delete"}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: "amber" }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent === "amber" ? "font-semibold text-amber-600 dark:text-amber-400" : "font-medium"}>{value}</span>
    </div>
  );
}
