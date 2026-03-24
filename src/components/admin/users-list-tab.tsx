"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isAnyPremium, tierLabel } from "@/lib/tiers";
import { Users, DollarSign, UserCheck, UserX, Search } from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  gradeLevel: string | null;
  tier: string;
  track: string;
  signedUp: string;
  subscriptions: { module: string; status: string }[];
}

interface Stats {
  total: number;
  free: number;
  premium: number;
  monthlyPlans: number;
  annualPlans: number;
  estimatedMRR: number;
  estimatedARR: number;
}

export function AdminUsersListTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterTier, setFilterTier] = useState<"all" | "free" | "premium">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("start", startDate);
      if (endDate) params.set("end", endDate);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users || []);
      setStats(data.stats || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Fetch on mount (all users)
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users client-side by tier and search
  const filteredUsers = users.filter((u) => {
    if (filterTier === "free" && isAnyPremium(u.tier)) return false;
    if (filterTier === "premium" && !isAnyPremium(u.tier)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const tierColors: Record<string, string> = {
    FREE: "bg-zinc-500/20 text-zinc-400",
    PREMIUM: "bg-amber-500/20 text-amber-400",
    AP_PREMIUM: "bg-indigo-500/20 text-indigo-300",
    SAT_PREMIUM: "bg-blue-500/20 text-blue-300",
    ACT_PREMIUM: "bg-violet-500/20 text-violet-300",
    CLEP_PREMIUM: "bg-emerald-500/20 text-emerald-300",
  };

  return (
    <div className="space-y-6">
      {/* Date range + filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-secondary border border-border rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-secondary border border-border rounded px-3 py-1.5 text-sm"
              />
            </div>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded disabled:opacity-50"
            >
              {loading ? "Loading..." : "Apply"}
            </button>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Clear dates
              </button>
            )}
            <div className="ml-auto flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-secondary border border-border rounded pl-8 pr-3 py-1.5 text-sm w-52"
                />
              </div>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value as "all" | "free" | "premium")}
                className="bg-secondary border border-border rounded px-3 py-1.5 text-sm"
              >
                <option value="all">All Tiers</option>
                <option value="free">Free Only</option>
                <option value="premium">Premium Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <div className="text-center py-4 text-red-400">Error: {error}</div>}

      {/* Summary stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                in selected range
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserX className="h-4 w-4" /> Free Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.free}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.free / stats.total) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserCheck className="h-4 w-4" /> Premium Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-400">{stats.premium}</div>
              <p className="text-xs text-muted-foreground">
                {stats.monthlyPlans} monthly + {stats.annualPlans} annual
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Revenue (MRR)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">${stats.estimatedMRR}</div>
              <p className="text-xs text-muted-foreground">
                ${stats.estimatedARR} est. annual
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>All Users</span>
            <span className="text-sm font-normal text-muted-foreground">
              Showing {filteredUsers.length} of {users.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground text-left">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Tier</th>
                    <th className="pb-3 font-medium">Track</th>
                    <th className="pb-3 font-medium">Signed Up</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-border/20 hover:bg-secondary/30">
                      <td className="py-3 font-medium">{u.name}</td>
                      <td className="py-3 text-muted-foreground">{u.email}</td>
                      <td className="py-3">
                        <Badge className={`text-xs ${tierColors[u.tier] || "bg-zinc-500/20 text-zinc-400"}`}>
                          {tierLabel(u.tier)}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="text-xs">
                          {u.track.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(u.signedUp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
