"use client";

/**
 * Analytics charts extracted into a client-only chunk (2026-06-06).
 *
 * recharts (~100KB gzipped) was being pulled into the OpenNext SSR Worker
 * handler via the analytics page, pushing the CF Pages Worker over the 3 MiB
 * limit. Charts are purely interactive client viz — they don't need SSR — so
 * the analytics page imports these via `dynamic(..., { ssr: false })`, which
 * keeps recharts entirely out of the server bundle. Zero feature change.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

const tooltipStyle = {
  backgroundColor: "#1e293b",
  border: "1px solid #334155",
  borderRadius: "8px",
};

export function MasteryBarChart({ data }: { data: { name: string; mastery: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 0 }}>
        <XAxis type="number" domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} width={80} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Mastery"]} />
        <Bar dataKey="mastery" fill="#1865F2" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AccuracyLineChart({ data }: { data: { date: string; accuracy: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Accuracy"]} />
        <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
