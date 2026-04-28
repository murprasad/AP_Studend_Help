"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, RotateCcw, Loader2, CheckCircle2, Users } from "lucide-react";

interface TestUser {
  id: string;
  email: string;
  label: string;
  tier: string;
  xp: number;
  level: number;
  streakDays: number;
  freeTrialCourse: string | null;
  freeTrialExpiresAt: string | null;
  trialEmailsSent: number;
  track: string | null;
  sessions: number;
  responses: number;
  masteryUnits: number;
}

export function AdminTestUsersTab() {
  const { toast } = useToast();
  const [users, setUsers] = useState<TestUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState<string | null>(null);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reset-test-users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      toast({ title: "Failed to load test users", variant: "destructive" });
    }
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  async function resetUsers(email?: string) {
    const key = email || "all";
    setResetting(key);
    try {
      const res = await fetch("/api/admin/reset-test-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(email ? { email } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`${res.status} ${data.error || "Unknown error"} — try logging out and back in if 401`);
      const totalDeleted = data.results.reduce((s: number, r: { deleted: number }) => s + r.deleted, 0);
      const failed = data.results.filter((r: { success: boolean }) => !r.success);
      if (failed.length > 0) {
        toast({
          title: "Partial reset",
          description: `${totalDeleted} records deleted. ${failed.length} failed.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: email ? `Reset ${email}` : "All test users reset",
          description: `${totalDeleted} records deleted. Accounts are fresh for QA.`,
        });
      }
      await fetchUsers();
    } catch (err) {
      toast({ title: "Reset failed", description: String(err), variant: "destructive" });
    }
    setResetting(null);
  }

  async function setTier(email: string, tier: "free" | "premium") {
    setResetting(email);
    try {
      const res = await fetch("/api/admin/reset-test-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: `Set ${email} to ${tier.toUpperCase()}` });
      await fetchUsers();
    } catch (err) {
      toast({ title: "Set tier failed", description: String(err), variant: "destructive" });
    }
    setResetting(null);
  }

  function isClean(u: TestUser) {
    // "Fresh" means truly pristine — QA can walk onboarding + diagnostic again.
    return (
      u.xp === 0 &&
      u.sessions === 0 &&
      !u.freeTrialCourse &&
      u.tier === "FREE" &&
      u.trialEmailsSent === 0
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <CardTitle className="text-lg">Test User Accounts</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reset test accounts to fresh state for QA testing. No localStorage clearing needed.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => resetUsers()}
              disabled={resetting !== null}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {resetting === "all" ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-1.5" />
              )}
              Reset All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No test user accounts found. Run <code>node scripts/seed-test-user-std.mjs</code> to seed murprasad+std@gmail.com.
          </p>
        ) : (
          <div className="space-y-3">
            {users.map((u) => {
              const clean = isClean(u);
              return (
                <div
                  key={u.id}
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    clean ? "border-emerald-500/20 bg-emerald-500/5" : "border-border/40"
                  }`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{u.email}</span>
                      <Badge variant="outline" className="text-[10px]">{u.label}</Badge>
                      {u.track && <Badge variant="outline" className="text-[10px] uppercase">{u.track}</Badge>}
                      {clean && (
                        <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Fresh
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>Tier: <span className="text-foreground font-medium">{u.tier}</span></span>
                      <span>XP: <span className="text-foreground font-medium">{u.xp}</span></span>
                      <span>Sessions: <span className="text-foreground font-medium">{u.sessions}</span></span>
                      <span>Responses: <span className="text-foreground font-medium">{u.responses}</span></span>
                      <span>Mastery: <span className="text-foreground font-medium">{u.masteryUnits} units</span></span>
                      {u.freeTrialCourse && (
                        <span>Trial: <span className="text-blue-500 font-medium">{u.freeTrialCourse.replace(/_/g, " ")}</span></span>
                      )}
                      {u.trialEmailsSent > 0 && (
                        <span>Trial emails: <span className="text-amber-500 font-medium">{u.trialEmailsSent}</span></span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 ml-3 shrink-0 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => setTier(u.email, "free")} disabled={resetting !== null} className="text-xs px-2 py-1 h-7">Free</Button>
                    <Button variant="outline" size="sm" onClick={() => setTier(u.email, "premium")} disabled={resetting !== null} className="text-xs px-2 py-1 h-7 border-amber-500/30 text-amber-700 dark:text-amber-400 dark:text-amber-700 dark:text-amber-400 hover:bg-amber-500/10">Premium</Button>
                    <Button variant="outline" size="sm" onClick={() => resetUsers(u.email)} disabled={resetting !== null} className="text-xs px-2 py-1 h-7">
                      {resetting === u.email ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
