"use client";

import { useState } from "react";
import { AdminInfrastructureMetrics } from "@/components/admin/infrastructure-metrics";

interface AdminTabsProps {
  coverageTab: React.ReactNode;
  usersTab: React.ReactNode;
  topicsTab: React.ReactNode;
}

export function AdminTabs({ coverageTab, usersTab, topicsTab }: AdminTabsProps) {
  const [active, setActive] = useState<"coverage" | "users" | "topics" | "infrastructure">("coverage");

  const tabs = [
    { id: "coverage", label: "Question Coverage" },
    { id: "users", label: "Recent Users" },
    { id: "topics", label: "Topic Coverage" },
    { id: "infrastructure", label: "Infrastructure" },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              active === tab.id
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {active === "coverage" && coverageTab}
      {active === "users" && usersTab}
      {active === "topics" && topicsTab}
      {active === "infrastructure" && <AdminInfrastructureMetrics />}
    </div>
  );
}
