import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ApUnit, ApCourse } from "@prisma/client";
import {
  COURSE_REGISTRY,
  getCourseForUnit as _getCourseForUnit,
  getUnitsForCourse,
} from "./courses";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Course display maps — derived from COURSE_REGISTRY ─────────────────────
// Add a new course in src/lib/courses.ts; these update automatically.

export const AP_COURSES = Object.fromEntries(
  Object.entries(COURSE_REGISTRY).map(([k, v]) => [k, v.name])
) as Record<ApCourse, string>;

export const AP_COURSE_SHORT = Object.fromEntries(
  Object.entries(COURSE_REGISTRY).map(([k, v]) => [k, v.shortName])
) as Record<ApCourse, string>;

// ── Unit maps — derived from COURSE_REGISTRY ───────────────────────────────

function buildUnitNameMap(course: ApCourse): Record<string, string> {
  return Object.fromEntries(
    Object.entries(COURSE_REGISTRY[course].units).map(([k, v]) => [k, v.name])
  );
}

export const AP_WORLD_HISTORY_UNITS = buildUnitNameMap("AP_WORLD_HISTORY");
export const AP_CSP_UNITS = buildUnitNameMap("AP_COMPUTER_SCIENCE_PRINCIPLES");
export const AP_PHYSICS1_UNITS = buildUnitNameMap("AP_PHYSICS_1");

export const COURSE_UNITS: Record<ApCourse, Record<string, string>> = Object.fromEntries(
  Object.keys(COURSE_REGISTRY).map((k) => [k, buildUnitNameMap(k as ApCourse)])
) as Record<ApCourse, Record<string, string>>;

// Flat map of every unit across all courses → display name
export const AP_UNITS: Record<ApUnit, string> = Object.assign(
  {},
  ...Object.values(COURSE_UNITS)
) as Record<ApUnit, string>;

// ── Course/unit helpers ────────────────────────────────────────────────────

export function getCourseUnits(course: ApCourse): ApUnit[] {
  return getUnitsForCourse(course);
}

/** Re-exported from courses.ts so callers don't need two imports. */
export { _getCourseForUnit as getCourseForUnit };

// ── AP World History time-period metadata (derived) ───────────────────────

export const UNIT_TIME_PERIODS: Partial<Record<ApUnit, string>> = Object.fromEntries(
  Object.entries(COURSE_REGISTRY.AP_WORLD_HISTORY.units)
    .filter(([, v]) => v.timePeriod)
    .map(([k, v]) => [k, v.timePeriod!])
);

// ── Formatting helpers ─────────────────────────────────────────────────────

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
  if (score >= 85) return "text-emerald-700 dark:text-emerald-400";
  if (score >= 70) return "text-blue-700 dark:text-blue-400";
  if (score >= 50) return "text-yellow-700 dark:text-yellow-400";
  if (score >= 25) return "text-orange-700 dark:text-orange-400";
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
