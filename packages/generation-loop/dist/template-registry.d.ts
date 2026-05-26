import type { Template } from "./types.js";
/** Register a template. Idempotent on (id, version) pair. */
export declare function registerTemplate(t: Template): void;
/** Get a registered template by id, or null. */
export declare function getTemplate(id: string): Template | null;
/** List all registered templates. */
export declare function listTemplates(): Template[];
/** Reset the registry — test-only. */
export declare function _resetRegistryForTests(): void;
/** Record a generation outcome against a template's score for this topic. */
export declare function scoreTemplate(dataDir: string, course: string, topic: string, templateId: string, outcome: "passed" | "failed-after-retries"): void;
/**
 * Pick a template for this (course, topic) call.
 *
 * If only one template is registered, return it (Layer 3 dormant).
 * If multiple registered but any has < MIN_SAMPLES on this topic, equal-weight pick.
 * Otherwise softmax-weighted on passRate.
 */
export declare function selectTemplate(dataDir: string, course: string, topic: string): Template;
//# sourceMappingURL=template-registry.d.ts.map