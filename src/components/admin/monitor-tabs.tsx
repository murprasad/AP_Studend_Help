"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isAnyPremium, tierLabel } from "@/lib/tiers";
import { Users, BookOpen, BarChart3, Clock } from "lucide-react";
import { AdminInfrastructureMetrics } from "@/components/admin/infrastructure-metrics";
import { AdminFeedbackOverview } from "@/components/admin/feedback-overview";
import { AdminSubscribersTab } from "@/components/admin/subscribers-tab";

interface RecentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gradeLevel: string | null;
  subscriptionTier: string;
}

interface Stats {
  totalUsers: number;
  totalQuestions: number;
  pendingQuestions: number;
  totalSessions: number;
}

interface Props {
  stats: Stats;
  recentUsers: RecentUser[];
}

export function AdminMonitorTabs({ stats, recentUsers }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") ?? "overview";

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users" },
    { id: "subscribers", label: "Subscribers" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => router.push(`/admin?tab=${t.id}`)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/20" },
              { label: "Questions", value: stats.totalQuestions, icon: BookOpen, color: "text-emerald-400", bg: "bg-emerald-500/20" },
              { label: "Pending Review", value: stats.pendingQuestions, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/20" },
              { label: "Sessions Completed", value: stats.totalSessions, icon: BarChart3, color: "text-purple-400", bg: "bg-purple-500/20" },
            ].map((stat) => (
              <Card key={stat.label} className="card-glow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <AdminInfrastructureMetrics />
        </div>
      )}

      {/* Users tab */}
      {tab === "users" && (
        <div className="space-y-6">
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="text-lg">Recent Signups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50">
                    <div>
                      <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={isAnyPremium(user.subscriptionTier) ? "default" : "outline"} className="text-xs">
                        {tierLabel(user.subscriptionTier)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">Grade {user.gradeLevel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <AdminFeedbackOverview />
        </div>
      )}

      {tab === "subscribers" && (
        <AdminSubscribersTab />
      )}
    </div>
  );
}
