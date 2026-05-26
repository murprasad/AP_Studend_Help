/**
 * @preplion/generation-loop — closed-loop generator for AI-authored
 * test-prep questions.
 *
 * Layers:
 *   1. Per-Q sync retry — failed gate → re-prompt with reason, up to N
 *   2. Per-topic negative-prompt memory — failures accumulate on disk and
 *      prepend to every future prompt for that topic
 *   3. Template registry + scorer + selector — multi-template A/B with
 *      automatic winner weighting (dormant with 1 template)
 *
 * The package is host-agnostic: callers inject LLM + gate adapters. This
 * keeps it portable across PrepLion and StudentNest (and any other consumer).
 *
 * Pairs with @preplion/question-gates for the gate engine.
 *
 * Quick start:
 *   import {
 *     registerTemplate, DEFAULT_MCQ_TEMPLATE, generateWithFeedback
 *   } from "@preplion/generation-loop";
 *
 *   registerTemplate(DEFAULT_MCQ_TEMPLATE);
 *
 *   const result = await generateWithFeedback({
 *     course: "CLEP_BIOLOGY",
 *     topic: "cellular respiration",
 *     llm: ({ systemPrompt, userPrompt }) => callGroq(systemPrompt, userPrompt),
 *     gates: (q) => runDeterministicGates(q),
 *     maxRetries: 3,
 *     dataDir: "./data",
 *   });
 *
 *   if (result.result === "passed") insertToDb(result.q);
 */
export { generateWithFeedback } from "./generate-with-feedback.js";
export { recordGateOutcome, getNegativePromptForTopic, getTopicStats } from "./feedback-store.js";
export { registerTemplate, getTemplate, listTemplates, scoreTemplate, selectTemplate, _resetRegistryForTests, } from "./template-registry.js";
export { DEFAULT_MCQ_TEMPLATE } from "./templates/default-mcq.js";
//# sourceMappingURL=index.js.map