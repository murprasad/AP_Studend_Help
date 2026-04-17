/**
 * Pure helpers for exam labels and course counts.
 * No DB, no Prisma — safe to import from client components.
 */

/** Build a human-readable exam-type label, e.g. "AP, SAT & ACT" */
export function getExamLabel(clepOn: boolean, dsstOn: boolean): string {
  const parts = ["AP", "SAT", "ACT"];
  if (clepOn) parts.push("CLEP");
  if (dsstOn) parts.push("DSST");
  if (parts.length <= 2) return parts.join(" & ");
  return parts.slice(0, -1).join(", ") + " & " + parts[parts.length - 1];
}

/** Total visible course count: 16 base + 34 CLEP + 22 DSST */
export function getCourseCount(clepOn: boolean, dsstOn: boolean): number {
  return 16 + (clepOn ? 34 : 0) + (dsstOn ? 22 : 0);
}
