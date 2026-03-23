"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, MessageSquare, Zap, Database, RefreshCw, AlertTriangle } from "lucide-react";

interface Metrics {
  tutorCallsToday: number;
  tutorCallsWeek: number;
  questionsGeneratedToday: number;
  activeUsersToday: number;
  totalQuestions: number;
  totalUsers: number;
  newUsersToday: number;
  knowledgeChecksToday: number;
  totalCacheEntries: number;
  fetchedAt: string;
}

interface Alert {
  level: "amber" | "red";
  message: string;
}

function getAlerts(m: Metrics): Alert[] {
  const alerts: Alert[] = [];
  if (m.tutorCallsToday > 500) {
    alerts.push({ level: "red", message: "Groq rate limit risk — AI tutor calls today exceed 500. Consider upgrading your Groq plan." });
  } else if (m.tutorCallsToday > 200) {
    alerts.push({ level: "amber", message: "Approaching Groq free tier limit — AI tutor calls today exceed 200." });
  }
  if (m.totalQuestions > 40000) {
    alerts.push({ level: "amber", message: "Approaching Neon 0.5 GB storage limit — over 40,000 questions in DB." });
  }
  if (m.activeUsersToday > 800) {
    alerts.push({ level: "amber", message: "Approaching Cloudflare Workers 100k/day limit — over 800 active users today." });
  }
  return alerts;
}

export function AdminInfrastructureMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMetrics(data);
      setLastRefresh(new Date());
      setError(null);
    } catch (e) {
      setError("Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60_000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (loading) {
    return (
      <Card className="card-glow">
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          Loading infrastructure metrics...
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="card-glow">
        <CardContent className="p-8 text-center text-red-400 text-sm">{error ?? "Unknown error"}</CardContent>
      </Card>
    );
  }

  const alerts = getAlerts(metrics);

  const statCards = [
    {
      label: "AI Tutor Calls Today",
      value: metrics.tutorCallsToday,
      sub: `${metrics.tutorCallsWeek} this week`,
      icon: MessageSquare,
      color: "text-blue-500",
      bg: "bg-blue-500/20",
    },
    {
      label: "Questions Generated Today",
      value: metrics.questionsGeneratedToday,
      sub: "AI-generated",
      icon: Zap,
      color: "text-yellow-400",
      bg: "bg-yellow-500/20",
    },
    {
      label: "Active Users Today",
      value: metrics.activeUsersToday,
      sub: "started a session",
      icon: Activity,
      color: "text-emerald-400",
      bg: "bg-emerald-500/20",
    },
    {
      label: "Cache Entries",
      value: metrics.totalCacheEntries,
      sub: "AI response cache",
      icon: RefreshCw,
      color: "text-cyan-400",
      bg: "bg-cyan-500/20",
    },
    {
      label: "Total Questions",
      value: metrics.totalQuestions.toLocaleString(),
      sub: "approved in DB",
      icon: Database,
      color: "text-purple-400",
      bg: "bg-purple-500/20",
    },
    {
      label: "Total Users",
      value: metrics.totalUsers.toLocaleString(),
      sub: `+${metrics.newUsersToday} today`,
      icon: Users,
      color: "text-pink-400",
      bg: "bg-pink-500/20",
    },
    {
      label: "New Users Today",
      value: metrics.newUsersToday,
      sub: "registered today",
      icon: Users,
      color: "text-orange-400",
      bg: "bg-orange-500/20",
    },
    {
      label: "Knowledge Checks Today",
      value: metrics.knowledgeChecksToday,
      sub: "tutor comprehension checks",
      icon: Activity,
      color: "text-teal-400",
      bg: "bg-teal-500/20",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Threshold alerts */}
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 p-4 rounded-lg border text-sm ${
            alert.level === "red"
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
          }`}
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{alert.message}</span>
        </div>
      ))}

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="card-glow">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
                  <p className="text-xs text-muted-foreground/60 leading-tight">{stat.sub}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Last refresh */}
      <p className="text-xs text-muted-foreground/50 text-right">
        Auto-refreshes every 60s · Last updated: {lastRefresh?.toLocaleTimeString() ?? "—"}
      </p>
    </div>
  );
}
