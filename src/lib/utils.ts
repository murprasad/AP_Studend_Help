import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ApUnit } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const AP_UNITS: Record<ApUnit, string> = {
  UNIT_1_GLOBAL_TAPESTRY: "Unit 1: Global Tapestry",
  UNIT_2_NETWORKS_OF_EXCHANGE: "Unit 2: Networks of Exchange",
  UNIT_3_LAND_BASED_EMPIRES: "Unit 3: Land-Based Empires",
  UNIT_4_TRANSOCEANIC_INTERCONNECTIONS: "Unit 4: Transoceanic Interconnections",
  UNIT_5_REVOLUTIONS: "Unit 5: Revolutions",
  UNIT_6_INDUSTRIALIZATION: "Unit 6: Industrialization",
  UNIT_7_GLOBAL_CONFLICT: "Unit 7: Global Conflict",
  UNIT_8_COLD_WAR: "Unit 8: Cold War",
  UNIT_9_GLOBALIZATION: "Unit 9: Globalization",
};

export const UNIT_TIME_PERIODS: Record<ApUnit, string> = {
  UNIT_1_GLOBAL_TAPESTRY: "1200–1450",
  UNIT_2_NETWORKS_OF_EXCHANGE: "1200–1450",
  UNIT_3_LAND_BASED_EMPIRES: "1450–1750",
  UNIT_4_TRANSOCEANIC_INTERCONNECTIONS: "1450–1750",
  UNIT_5_REVOLUTIONS: "1750–1900",
  UNIT_6_INDUSTRIALIZATION: "1750–1900",
  UNIT_7_GLOBAL_CONFLICT: "1900–Present",
  UNIT_8_COLD_WAR: "1900–Present",
  UNIT_9_GLOBALIZATION: "1900–Present",
};

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function getMasteryLabel(score: number): string {
  if (score >= 85) return "Mastered";
  if (score >= 70) return "Proficient";
  if (score >= 50) return "Developing";
  if (score >= 25) return "Beginning";
  return "Not Started";
}

export function getMasteryColor(score: number): string {
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-blue-400";
  if (score >= 50) return "text-yellow-400";
  if (score >= 25) return "text-orange-400";
  return "text-slate-500";
}

export function getMasteryBg(score: number): string {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-blue-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 25) return "bg-orange-500";
  return "bg-slate-600";
}

export function estimateApScore(accuracy: number, totalQuestions: number): number {
  if (totalQuestions < 10) return 0;
  if (accuracy >= 85) return 5;
  if (accuracy >= 70) return 4;
  if (accuracy >= 55) return 3;
  if (accuracy >= 40) return 2;
  return 1;
}

export function calculateXpForLevel(level: number): number {
  return level * 500;
}

export function getLevelFromXp(xp: number): number {
  let level = 1;
  let totalXp = 0;
  while (totalXp + calculateXpForLevel(level) <= xp) {
    totalXp += calculateXpForLevel(level);
    level++;
  }
  return level;
}

export function getXpProgressInLevel(xp: number): { current: number; needed: number } {
  let level = 1;
  let totalXp = 0;
  while (totalXp + calculateXpForLevel(level) <= xp) {
    totalXp += calculateXpForLevel(level);
    level++;
  }
  return {
    current: xp - totalXp,
    needed: calculateXpForLevel(level),
  };
}
