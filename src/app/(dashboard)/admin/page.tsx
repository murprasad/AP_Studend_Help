import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminPageNav } from "@/components/admin/admin-page-nav";
import { AdminMonitorTabs } from "@/components/admin/monitor-tabs";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const [totalUsers, totalQuestions, pendingQuestions, recentUsers] = await Promise.all([
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
        subscriptionTier: true,
        // Location captured from CF Workers headers on dashboard load.
        lastLoginCountry: true,
        lastLoginRegion: true,
        lastLoginCity: true,
      },
    }),
  ]);

  const totalSessions = await prisma.practiceSession.count({ where: { status: "COMPLETED" } });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform health monitoring</p>
        </div>
        <AdminPageNav />
      </div>
      <Suspense fallback={<div className="text-muted-foreground text-sm">Loading...</div>}>
        <AdminMonitorTabs
          stats={{ totalUsers, totalQuestions, pendingQuestions, totalSessions }}
          recentUsers={recentUsers.map((u) => ({
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            gradeLevel: u.gradeLevel ? String(u.gradeLevel) : null,
            subscriptionTier: u.subscriptionTier,
            lastLoginCountry: u.lastLoginCountry,
            lastLoginRegion: u.lastLoginRegion,
            lastLoginCity: u.lastLoginCity,
          }))}
        />
      </Suspense>
    </div>
  );
}
