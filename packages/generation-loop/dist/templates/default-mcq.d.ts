/**
 * Default MCQ template — course-aware (v2).
 *
 * v1 was a static string; the generator kept defaulting to 4 options even
 * when the course required 5 (pilot finding, 2026-05-26). v2 takes the
 * course id from the loop's TemplateContext and injects the expected
 * option count + letters + exam family into the system prompt. This way
 * the constraint hits the LLM on attempt #1 rather than being learned
 * over 2-3 retries.
 *
 * Stays generic across all 61 supported courses; per-course knowledge
 * lives in `course-info.ts`.
 */
import type { Template } from "../types.js";
export declare const DEFAULT_MCQ_TEMPLATE: Template;
//# sourceMappingURL=default-mcq.d.ts.map