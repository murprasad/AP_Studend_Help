/**
 * Default MCQ template. Derived from PrepLion's _fill-from-cb-spec.mjs system
 * prompt. Course-agnostic at the template level — course-specific details
 * (number of options, family name, etc.) are injected by the caller through
 * the user prompt rather than this system prompt, so this template works for
 * every CLEP / AP / SAT / ACT / DSST / Accuplacer course.
 *
 * When you want to A/B a new prompt, register a second template with a new
 * id; the selector will start equal-weighting until one wins on data.
 */
import type { Template } from "../types.js";
export declare const DEFAULT_MCQ_TEMPLATE: Template;
//# sourceMappingURL=default-mcq.d.ts.map