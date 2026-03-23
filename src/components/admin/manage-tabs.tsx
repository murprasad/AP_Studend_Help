"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminAutoPopulateSettings } from "@/components/admin/auto-populate-settings";
import { AdminBulkGenerate } from "@/components/admin/bulk-generate";
import { AdminMegaPopulate } from "@/components/admin/mega-populate";
import { AdminCoverageTab } from "@/components/admin/coverage-tab";
import { AdminFeatureFlags } from "@/components/admin/feature-flags";
import { AdminPaymentSetup } from "@/components/admin/payment-setup";
import { AdminQualityTab } from "@/components/admin/quality-tab";

interface UnitCount {
  course: string;
  unit: string;
  _count: { id: number };
}

interface TopicCount {
  unit: string;
  topic: string | null;
  _count: { id: number };
}

interface Props {
  questionsByUnit: UnitCount[];
  questionsByTopic: TopicCount[];
}

export function AdminManageTabs({ questionsByUnit, questionsByTopic }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") ?? "bank";

  const tabs = [
    { id: "bank", label: "Question Bank" },
    { id: "coverage", label: "Coverage" },
    { id: "config", label: "Config" },
    { id: "quality", label: "Quality" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => router.push(`/admin/manage?tab=${t.id}`)}
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

      {/* Question Bank tab */}
      {tab === "bank" && (
        <div className="space-y-6">
          <AdminAutoPopulateSettings />
          <AdminBulkGenerate />
          <AdminMegaPopulate />
        </div>
      )}

      {/* Coverage tab */}
      {tab === "coverage" && (
        <div className="space-y-6">
          <AdminCoverageTab questionsByUnit={questionsByUnit} />
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="text-lg">Topic Coverage</CardTitle>
              <p className="text-xs text-muted-foreground">
                Red &lt;3 questions per topic · Yellow 3–7 · Green ≥8 — sorted by least covered
              </p>
            </CardHeader>
            <CardContent>
              <div className="max-h-72 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                {questionsByTopic.map((row) => (
                  <div key={`${row.unit}-${row.topic}`} className="flex items-center justify-between py-1 px-2 rounded hover:bg-secondary/30">
                    <span className="text-xs text-muted-foreground truncate">{row.topic || "(no topic)"}</span>
                    <Badge
                      variant={row._count.id < 3 ? "destructive" : "secondary"}
                      className={
                        row._count.id >= 8
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 ml-2 shrink-0"
                          : row._count.id >= 3
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 ml-2 shrink-0"
                          : "ml-2 shrink-0"
                      }
                    >
                      {row._count.id}
                    </Badge>
                  </div>
                ))}
                {questionsByTopic.length === 0 && (
                  <p className="text-xs text-muted-foreground col-span-3">No topic data yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Config tab */}
      {tab === "config" && (
        <div className="space-y-6">
          <AdminFeatureFlags />
          <AdminPaymentSetup />
        </div>
      )}

      {/* Quality tab */}
      {tab === "quality" && <AdminQualityTab />}
    </div>
  );
}
