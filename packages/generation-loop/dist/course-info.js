/**
 * Course-specific knowledge the prompt builder needs to know.
 *
 * Ported from scripts/lib/_question-gates.mjs (the canonical gate engine)
 * so this package stays self-contained — no cross-package import.
 *
 * Keep in sync with @preplion/question-gates' expectedOptionCount. If a
 * course's option count ever changes, update both.
 */
const FOUR_CHOICE_COURSES = new Set([
    "CLEP_COLLEGE_MATH",
    "CLEP_SPANISH",
    "CLEP_SPANISH_WRITING",
    "CLEP_FRENCH",
    "CLEP_GERMAN",
]);
// AP/SAT/ACT/PSAT use 4 options universally (post-2025 redesigns).
// DSST + Accuplacer also 4.
const FOUR_CHOICE_PREFIXES = ["DSST_", "AP_", "SAT_", "ACT_", "PSAT_", "ACCUPLACER"];
/** Number of options a question for this course should have. CLEP defaults to 5. */
export function expectedOptionCount(course) {
    if (!course)
        return 5;
    if (FOUR_CHOICE_PREFIXES.some((p) => course.startsWith(p)))
        return 4;
    if (FOUR_CHOICE_COURSES.has(course))
        return 4;
    return 5;
}
/** Option letters for this course (e.g. "A-D" or "A-E"). */
export function optionLetters(course) {
    return expectedOptionCount(course) === 5 ? "A-E" : "A-D";
}
/** Human-readable exam family ("CLEP", "AP", "SAT", "ACT", "DSST", "Accuplacer", "PSAT"). */
export function courseFamily(course) {
    if (!course)
        return "exam";
    if (course.startsWith("CLEP_"))
        return "CLEP";
    if (course.startsWith("AP_"))
        return "AP";
    if (course.startsWith("SAT_"))
        return "digital SAT";
    if (course.startsWith("ACT_"))
        return "ACT";
    if (course.startsWith("DSST_"))
        return "DSST";
    if (course.startsWith("PSAT_"))
        return "PSAT";
    if (course.startsWith("ACCUPLACER"))
        return "Accuplacer";
    return "exam";
}
/** Human-readable subject name extracted from the course id. */
export function courseSubject(course) {
    if (!course)
        return "exam";
    return course
        .replace(/^(CLEP|AP|SAT|ACT|PSAT|DSST|ACCUPLACER)_/, "")
        .replace(/_/g, " ")
        .toLowerCase();
}
//# sourceMappingURL=course-info.js.map