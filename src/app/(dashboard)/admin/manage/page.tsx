import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminPageNav } from "@/components/admin/admin-page-nav";
import { AdminManageTabs } from "@/components/admin/manage-tabs";

export default async function AdminManagePage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const [questionsByUnit, questionsByTopic] = await Promise.all([
    prisma.question.groupBy({
      by: ["course", "unit"],
      where: { isApproved: true },
      _count: { id: true },
    }),
    prisma.question.groupBy({
      by: ["unit", "topic"],
      where: { isApproved: true },
      _count: { id: true },
      orderBy: { _count: { id: "asc" } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform management</p>
        </div>
        <AdminPageNav />
      </div>
      <AdminManageTabs
        questionsByUnit={questionsByUnit}
        questionsByTopic={questionsByTopic}
      />
    </div>
  );
}
