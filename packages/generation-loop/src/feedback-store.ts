/**
 * Layer 2 — Per-topic accumulated negative-prompt memory.
 *
 * Storage shape: one JSON file per course at
 *   <dataDir>/gate-feedback/<COURSE>.json
 *
 * { course, topics: { "<topic>": TopicFeedback } }
 *
 * The format is human-inspectable so you can `cat` a course's memory to see
 * what the generator has been getting wrong.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { GateOutcome, TopicFeedback, FailureRecord } from "./types.js";

interface CourseFeedbackFile {
  course: string;
  topics: Record<string, TopicFeedback>;
  updatedAt: string;
}

function courseFile(dataDir: string, course: string): string {
  return join(dataDir, "gate-feedback", `${course}.json`);
}

function loadCourse(dataDir: string, course: string): CourseFeedbackFile {
  const path = courseFile(dataDir, course);
  if (!existsSync(path)) {
    return { course, topics: {}, updatedAt: new Date().toISOString() };
  }
  try {
    const raw = readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw) as CourseFeedbackFile;
    if (!parsed.topics) parsed.topics = {};
    return parsed;
  } catch {
    // Corrupt file — start fresh rather than crash the generator.
    return { course, topics: {}, updatedAt: new Date().toISOString() };
  }
}

function saveCourse(dataDir: string, file: CourseFeedbackFile): void {
  const path = courseFile(dataDir, file.course);
  mkdirSync(dirname(path), { recursive: true });
  // Write to tmp then rename for atomicity on POSIX; on Windows rename is best-effort but writes are short.
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(file, null, 2));
  try {
    // node:fs has renameSync but importing it explicitly to keep this file self-contained.
    const { renameSync } = require("node:fs") as typeof import("node:fs");
    renameSync(tmp, path);
  } catch {
    // Fallback if rename fails: direct write.
    writeFileSync(path, JSON.stringify(file, null, 2));
  }
}

/**
 * Record the outcome of one gate evaluation against the topic's memory.
 * Updates totalAttempts always; updates totalPassed + failures only on gate fail.
 */
export function recordGateOutcome(
  dataDir: string,
  course: string,
  topic: string,
  gateResult: GateOutcome,
): void {
  const file = loadCourse(dataDir, course);
  const now = new Date().toISOString();

  let entry = file.topics[topic];
  if (!entry) {
    entry = {
      course,
      topic,
      failures: {},
      totalAttempts: 0,
      totalPassed: 0,
      updatedAt: now,
    };
    file.topics[topic] = entry;
  }

  entry.totalAttempts += 1;
  if (gateResult.ok) {
    entry.totalPassed += 1;
  } else if (gateResult.gate) {
    const gate = gateResult.gate;
    const existing: FailureRecord = entry.failures[gate] ?? {
      gate,
      count: 0,
      lastSeen: now,
    };
    existing.count += 1;
    existing.lastSeen = now;
    if (gateResult.reason) existing.lastReason = gateResult.reason.slice(0, 200);
    entry.failures[gate] = existing;
  }
  entry.updatedAt = now;
  file.updatedAt = now;

  saveCourse(dataDir, file);
}

/**
 * Read the top-N failures for a topic and return a formatted negative-prompt
 * string suitable for prepending to the next generation prompt.
 *
 * Returns "" if no failures recorded yet.
 */
export function getNegativePromptForTopic(
  dataDir: string,
  course: string,
  topic: string,
  topN = 5,
): string {
  const file = loadCourse(dataDir, course);
  const entry = file.topics[topic];
  if (!entry || Object.keys(entry.failures).length === 0) return "";

  const sorted = Object.values(entry.failures)
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);

  const lines = sorted.map((f) => {
    const reasonSnip = f.lastReason ? ` — last seen as: "${f.lastReason.slice(0, 80)}"` : "";
    return `  - "${f.gate}" (${f.count} prior failures on this topic${reasonSnip})`;
  });

  return [
    "AVOID THESE PATTERNS (failed gates on this topic in previous attempts):",
    ...lines,
    "",
    "Re-check your output against each pattern above before returning.",
  ].join("\n");
}

/** Convenience: get raw topic stats (for telemetry / debugging). */
export function getTopicStats(
  dataDir: string,
  course: string,
  topic: string,
): TopicFeedback | null {
  const file = loadCourse(dataDir, course);
  return file.topics[topic] ?? null;
}
