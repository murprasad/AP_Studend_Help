/**
 * Course-specific knowledge the prompt builder needs to know.
 *
 * Ported from scripts/lib/_question-gates.mjs (the canonical gate engine)
 * so this package stays self-contained — no cross-package import.
 *
 * Keep in sync with @preplion/question-gates' expectedOptionCount. If a
 * course's option count ever changes, update both.
 */
/** Number of options a question for this course should have. CLEP defaults to 5. */
export declare function expectedOptionCount(course: string | undefined | null): number;
/** Option letters for this course (e.g. "A-D" or "A-E"). */
export declare function optionLetters(course: string | undefined | null): string;
/** Human-readable exam family ("CLEP", "AP", "SAT", "ACT", "DSST", "Accuplacer", "PSAT"). */
export declare function courseFamily(course: string | undefined | null): string;
/** Human-readable subject name extracted from the course id. */
export declare function courseSubject(course: string | undefined | null): string;
//# sourceMappingURL=course-info.d.ts.map