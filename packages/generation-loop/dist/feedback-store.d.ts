import type { GateOutcome, TopicFeedback } from "./types.js";
/**
 * Record the outcome of one gate evaluation against the topic's memory.
 * Updates totalAttempts always; updates totalPassed + failures only on gate fail.
 */
export declare function recordGateOutcome(dataDir: string, course: string, topic: string, gateResult: GateOutcome): void;
/**
 * Read the top-N failures for a topic and return a formatted negative-prompt
 * string suitable for prepending to the next generation prompt.
 *
 * Returns "" if no failures recorded yet.
 */
export declare function getNegativePromptForTopic(dataDir: string, course: string, topic: string, topN?: number): string;
/** Convenience: get raw topic stats (for telemetry / debugging). */
export declare function getTopicStats(dataDir: string, course: string, topic: string): TopicFeedback | null;
//# sourceMappingURL=feedback-store.d.ts.map