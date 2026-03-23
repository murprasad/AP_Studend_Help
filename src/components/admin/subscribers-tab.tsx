"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, TrendingUp, Calendar } from "lucide-react";

interface Subscription {
  module: string;
  status: string;
  planType: "monthly" | "annual" | "unknown";
  renewsAt: string | null;
  subscribedAt: string;
}

interface Subscriber {
  id: string;
  name: string;
  email: string;
  signedUp: string;
  track: string;
  subscriptions: Subscription[];
}

interface Stats {
  totalSubscribers: number;
  totalActive: number;
  monthlyPlans: number;
  annualPlans: number;
  estimatedMRR: number;
  estimatedARR: number;
}

export function AdminSubscribersTab() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/subscribers")
      .then((res) => res.json())
      .then((data) => {
        setSubscribers(data.subscribers || []);
        setStats(data.stats || null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading subscribers...</div>;
  if (error) return <div className="text-center py-8 text-red-400">Error: {error}</div>;

  const moduleColors: Record<string, string> = {
    ap: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    sat: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    act: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    clep: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400",
    canceling: "bg-yellow-500/20 text-yellow-400",
    canceled: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="space-y-6">
      {/* Revenue stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Total Subscribers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalSubscribers}</div>
              <p className="text-xs text-muted-foreground">{stats.totalActive} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Monthly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">${stats.estimatedMRR}</div>
              <p className="text-xs text-muted-foreground">{stats.monthlyPlans} monthly + {stats.annualPlans} annual</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Est. Annual Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${stats.estimatedARR}</div>
              <p className="text-xs text-muted-foreground">projected from current subs</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Plan Mix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stats.monthlyPlans}</span>
                <span className="text-sm text-muted-foreground">monthly</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stats.annualPlans}</span>
                <span className="text-sm text-muted-foreground">annual</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscriber table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Premium Subscribers</CardTitle>
        </CardHeader>
        <CardContent>
          {subscribers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No premium subscribers yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground text-left">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Module</th>
                    <th className="pb-3 font-medium">Plan</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Subscribed</th>
                    <th className="pb-3 font-medium">Renews</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.flatMap((s) =>
                    s.subscriptions.map((sub, i) => (
                      <tr key={`${s.id}-${sub.module}-${i}`} className="border-b border-border/20 hover:bg-secondary/30">
                        <td className="py-3 font-medium">{s.name}</td>
                        <td className="py-3 text-muted-foreground">{s.email}</td>
                        <td className="py-3">
                          <Badge className={`text-xs ${moduleColors[sub.module] || "bg-gray-500/20 text-gray-300"}`}>
                            {sub.module.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Badge variant="outline" className="text-xs">
                            {sub.planType === "annual" ? "$79.99/yr" : sub.planType === "monthly" ? "$9.99/mo" : "—"}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Badge className={`text-xs ${statusColors[sub.status] || ""}`}>
                            {sub.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {new Date(sub.subscribedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {sub.renewsAt ? new Date(sub.renewsAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
