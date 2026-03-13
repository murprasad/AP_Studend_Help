import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AP_COURSES, COURSE_UNITS } from "@/lib/utils";
import { ApUnit, ApCourse } from "@prisma/client";
import { VALID_AP_COURSES } from "@/lib/courses";
import { Users, BookOpen, BarChart3, Clock } from "lucide-react";
import { AdminBulkGenerate } from "@/components/admin/bulk-generate";
import { AdminFeatureFlags } from "@/components/admin/feature-flags";
import { AdminPaymentSetup } from "@/components/admin/payment-setup";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const [totalUsers, totalQuestions, pendingQuestions, recentUsers, questionsByUnit] =
    await Promise.all([
      prisma.user.count(),
      prisma.question.count({ where: { isApproved: true } }),
      prisma.question.count({ where: { isApproved: false } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          gradeLevel: true,
          createdAt: true,
          subscriptionTier: true,
        },
      }),
      prisma.question.groupBy({
        by: ["course", "unit"],
        where: { isApproved: true },
        _count: { id: true },
      }),
    ]);

  const totalSessions = await prisma.practiceSession.count({ where: { status: "COMPLETED" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: totalUsers, icon: Users, color: "text-indigo-400", bg: "bg-indigo-500/20" },
          { label: "Questions", value: totalQuestions, icon: BookOpen, color: "text-emerald-400", bg: "bg-emerald-500/20" },
          { label: "Pending Review", value: pendingQuestions, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/20" },
          { label: "Sessions Completed", value: totalSessions, icon: BarChart3, color: "text-purple-400", bg: "bg-purple-500/20" },
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

      {/* Bulk Question Generation */}
      <AdminBulkGenerate />

      {/* Payment Setup */}
      <AdminPaymentSetup />

      {/* Feature Flags */}
      <AdminFeatureFlags />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Questions by course and unit */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="text-lg">Question Coverage by Course</CardTitle>
            <p className="text-xs text-muted-foreground">
              Red &lt;10 (critical) · Yellow 10–19 (low) · Green ≥20 (good)
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {VALID_AP_COURSES.map((course) => {
              const courseUnitMap = COURSE_UNITS[course as ApCourse];
              const courseTotal = questionsByUnit
                .filter((q) => q.course === course)
                .reduce((s, q) => s + q._count.id, 0);
              return (
                <div key={course}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-indigo-300">{AP_COURSES[course as ApCourse]}</p>
                    <Badge variant="outline" className="text-xs">{courseTotal} total</Badge>
                  </div>
                  <div className="space-y-1">
                    {(Object.keys(courseUnitMap) as ApUnit[]).map((unit) => {
                      const count = questionsByUnit.find((q) => q.unit === unit && q.course === course)?._count.id || 0;
                      return (
                        <div key={unit} className="flex items-center justify-between py-1">
                          <span className="text-xs text-muted-foreground">{courseUnitMap[unit]}</span>
                          <Badge
                            variant={count < 10 ? "destructive" : "secondary"}
                            className={count >= 20 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                                       count >= 10 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : ""}
                          >
                            {count}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent users */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="text-lg">Recent Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50">
                  <div>
                    <p className="text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={user.subscriptionTier === "PREMIUM" ? "default" : "outline"} className="text-xs">
                      {user.subscriptionTier}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Grade {user.gradeLevel}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
