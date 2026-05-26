/**
 * Layer 1 + 2 + 3 — The closed loop.
 *
 * 1. Select a template (Layer 3) — usually a single one until you register more.
 * 2. Prepend the per-topic negative-prompt memory (Layer 2) to the system prompt.
 * 3. Call the LLM. Parse a Question shape from the JSON it returns.
 * 4. Run the gate. If pass → record outcome, return passed.
 * 5. If fail → record outcome (memory accumulates the gate name), then re-prompt
 *    with "Previous attempt failed: <reason>. Fix it." Retry up to maxRetries.
 * 6. If still failing after maxRetries → return failed-after-retries (per
 *    user-confirmed policy "a": skip the Q entirely, do NOT save junk to DB).
 *
 * The LLM and gate adapters are passed in so this package never imports
 * Groq/Anthropic/Prisma directly — keeps it portable and testable.
 */
import { recordGateOutcome, getNegativePromptForTopic } from "./feedback-store.js";
import { scoreTemplate, selectTemplate, getTemplate } from "./template-registry.js";
const DEFAULT_DATA_DIR = `${process.cwd()}/data`;
const DEFAULT_MAX_RETRIES = 3;
/**
 * Parse the LLM's response as JSON and coerce into a Question.
 * Returns null if the shape is unrecoverable.
 */
function parseQuestionFromLlm(raw, course, topic) {
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        const m = raw.match(/\{[\s\S]*\}/);
        if (!m)
            return null;
        try {
            parsed = JSON.parse(m[0]);
        }
        catch {
            return null;
        }
    }
    // Accept either {question: {...}} or the question fields at root.
    const root = (parsed.question && typeof parsed.question === "object")
        ? parsed.question
        : parsed;
    // Accept {questions: [{...}]} — take first.
    if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        Object.assign(root, parsed.questions[0]);
    }
    if (typeof root.questionText !== "string")
        return null;
    if (!Array.isArray(root.options))
        return null;
    if (typeof root.correctAnswer !== "string")
        return null;
    if (typeof root.explanation !== "string")
        return null;
    return {
        questionText: root.questionText,
        options: root.options.map(String),
        correctAnswer: root.correctAnswer,
        explanation: root.explanation,
        stimulus: typeof root.stimulus === "string" ? root.stimulus : null,
        topic: typeof root.topic === "string" ? root.topic : topic,
        difficulty: root.difficulty ?? "MEDIUM",
        course,
    };
}
/**
 * Default user-prompt builder. The system prompt comes from the selected
 * template; the user prompt carries the immediate task + any retry feedback
 * from a previous attempt.
 *
 * Callers can override this entirely via GenerateInput.buildUserPrompt
 * when they need to inject context that doesn't fit this shape
 * (e.g. a passage/stimulus). See OER generators for that pattern.
 */
function defaultBuildUserPrompt(course, topic, spec, previousFailure) {
    const parts = [];
    parts.push(`Generate ONE high-quality ${course.replace(/_/g, " ")} exam question on topic: "${topic}".`);
    if (spec && typeof spec === "object") {
        // Surface only the fields the prompt template can use; avoid dumping
        // the whole CB spec which is large and adds noise.
        const useful = ["topic_weights", "difficulty_mix", "function_types_in_scope"];
        const lite = {};
        for (const k of useful)
            if (k in spec)
                lite[k] = spec[k];
        if (Object.keys(lite).length > 0) {
            parts.push(`Course context (CB spec): ${JSON.stringify(lite)}`);
        }
    }
    if (previousFailure && !previousFailure.ok) {
        parts.push(`Previous attempt FAILED gate "${previousFailure.gate}": ${previousFailure.reason ?? "(no reason)"}.`, `Re-generate the question fixing that specific failure. Do not repeat it.`);
    }
    parts.push(`Return JSON only.`);
    return parts.join("\n\n");
}
/**
 * Closed-loop generator. See file docstring.
 */
export async function generateWithFeedback(input) {
    const { course, topic, spec, llm, gates, maxRetries = DEFAULT_MAX_RETRIES, dataDir = DEFAULT_DATA_DIR, forceTemplateId, buildUserPrompt: customBuildUserPrompt, } = input;
    const template = forceTemplateId
        ? (getTemplate(forceTemplateId) ?? selectTemplate(dataDir, course, topic))
        : selectTemplate(dataDir, course, topic);
    // Compose the system prompt = template (string or course-aware function)
    // + per-topic negative memory.
    const templateSystemPrompt = typeof template.systemPrompt === "function"
        ? template.systemPrompt({ course, topic })
        : template.systemPrompt;
    const negativePrompt = getNegativePromptForTopic(dataDir, course, topic);
    const systemPrompt = negativePrompt
        ? `${templateSystemPrompt}\n\n${negativePrompt}`
        : templateSystemPrompt;
    const gateHistory = [];
    let previousFailure = null;
    let lastQ = null;
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        const userPrompt = customBuildUserPrompt
            ? customBuildUserPrompt({ course, topic, spec, previousFailure, attempt })
            : defaultBuildUserPrompt(course, topic, spec, previousFailure);
        // Layer 1 robustness: a transient LLM error (rate limit, 400, timeout)
        // is a retry-able failure, not a thrown exception that breaks the loop.
        // We treat it the same way as a gate failure — record under a synthetic
        // gate id so the memory + scorer see it, then retry.
        let raw;
        try {
            raw = await llm({ systemPrompt, userPrompt });
        }
        catch (e) {
            const llmErr = {
                ok: false,
                gate: "llm-error",
                reason: e instanceof Error ? e.message.slice(0, 200) : "unknown llm error",
            };
            gateHistory.push(llmErr);
            recordGateOutcome(dataDir, course, topic, llmErr);
            previousFailure = llmErr;
            continue;
        }
        const q = parseQuestionFromLlm(raw, course, topic);
        if (!q) {
            // Shape failure: count as a gate-style failure under a synthetic gate id.
            const shapeFail = {
                ok: false,
                gate: "shape-parse-fail",
                reason: "LLM returned unparseable JSON or wrong shape",
            };
            gateHistory.push(shapeFail);
            recordGateOutcome(dataDir, course, topic, shapeFail);
            previousFailure = shapeFail;
            continue;
        }
        lastQ = q;
        const outcome = await gates(q);
        gateHistory.push(outcome);
        recordGateOutcome(dataDir, course, topic, outcome);
        if (outcome.ok) {
            scoreTemplate(dataDir, course, topic, template.id, "passed");
            return {
                q,
                result: "passed",
                attemptsUsed: attempt,
                templateUsed: template.id,
                gateHistory,
            };
        }
        previousFailure = outcome;
    }
    // Exhausted retries — skip the Q (policy "a").
    scoreTemplate(dataDir, course, topic, template.id, "failed-after-retries");
    return {
        q: lastQ,
        result: "failed-after-retries",
        attemptsUsed: maxRetries + 1,
        templateUsed: template.id,
        gateHistory,
    };
}
//# sourceMappingURL=generate-with-feedback.js.map