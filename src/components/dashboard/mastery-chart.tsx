"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface MasteryData {
  unit: string;
  unitName: string;
  masteryScore: number;
  accuracy: number;
}

interface DashboardMasteryChartProps {
  data: MasteryData[];
}

const SHORT_NAMES: Record<string, string> = {
  UNIT_1_GLOBAL_TAPESTRY: "U1",
  UNIT_2_NETWORKS_OF_EXCHANGE: "U2",
  UNIT_3_LAND_BASED_EMPIRES: "U3",
  UNIT_4_TRANSOCEANIC_INTERCONNECTIONS: "U4",
  UNIT_5_REVOLUTIONS: "U5",
  UNIT_6_INDUSTRIALIZATION: "U6",
  UNIT_7_GLOBAL_CONFLICT: "U7",
  UNIT_8_COLD_WAR: "U8",
  UNIT_9_GLOBALIZATION: "U9",
};

export function DashboardMasteryChart({ data }: DashboardMasteryChartProps) {
  const chartData = data.map((d) => ({
    unit: SHORT_NAMES[d.unit] || d.unit,
    fullName: d.unitName,
    mastery: Math.round(d.masteryScore),
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis
            dataKey="unit"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />
          <Radar
            name="Mastery"
            dataKey="mastery"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string, props) => [
              `${value}%`,
              props.payload.fullName,
            ]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
