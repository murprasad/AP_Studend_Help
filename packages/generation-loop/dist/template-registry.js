/**
 * Layer 3 — Template registry + scorer + selector.
 *
 * Templates are in-process (registered at startup); their pass-rate scores
 * persist per-(course,topic) at <dataDir>/template-scores/<COURSE>.json.
 *
 * Selection policy:
 *   - Until a template has N≥MIN_SAMPLES attempts on a (course,topic), all
 *     registered templates are equal-weighted. (We can't trust a winner with
 *     2 attempts.)
 *   - Once every registered template has ≥MIN_SAMPLES, selection becomes
 *     softmax-weighted on passRate. Top performer wins more often without
 *     freezing out experimentation.
 *
 * Starts dormant: with one registered template, every call returns it.
 * Add a second template and the selector activates automatically.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
const MIN_SAMPLES = 50;
const SOFTMAX_TEMPERATURE = 0.5; // lower = greedier (more likely to pick top)
const registry = new Map();
/** Register a template. Idempotent on (id, version) pair. */
export function registerTemplate(t) {
    registry.set(t.id, t);
}
/** Get a registered template by id, or null. */
export function getTemplate(id) {
    return registry.get(id) ?? null;
}
/** List all registered templates. */
export function listTemplates() {
    return Array.from(registry.values());
}
/** Reset the registry — test-only. */
export function _resetRegistryForTests() {
    registry.clear();
}
// ── Score storage ───────────────────────────────────────────────────────────
function scoresFile(dataDir, course) {
    return join(dataDir, "template-scores", `${course}.json`);
}
function loadCourse(dataDir, course) {
    const path = scoresFile(dataDir, course);
    if (!existsSync(path)) {
        return { course, topics: {}, updatedAt: new Date().toISOString() };
    }
    try {
        const parsed = JSON.parse(readFileSync(path, "utf-8"));
        if (!parsed.topics)
            parsed.topics = {};
        return parsed;
    }
    catch {
        return { course, topics: {}, updatedAt: new Date().toISOString() };
    }
}
function saveCourse(dataDir, file) {
    const path = scoresFile(dataDir, file.course);
    mkdirSync(dirname(path), { recursive: true });
    const tmp = `${path}.tmp`;
    writeFileSync(tmp, JSON.stringify(file, null, 2));
    try {
        const { renameSync } = require("node:fs");
        renameSync(tmp, path);
    }
    catch {
        writeFileSync(path, JSON.stringify(file, null, 2));
    }
}
/** Record a generation outcome against a template's score for this topic. */
export function scoreTemplate(dataDir, course, topic, templateId, outcome) {
    const file = loadCourse(dataDir, course);
    const now = new Date().toISOString();
    let topicScores = file.topics[topic];
    if (!topicScores) {
        topicScores = { course, topic, templates: {}, updatedAt: now };
        file.topics[topic] = topicScores;
    }
    let entry = topicScores.templates[templateId] ?? {
        templateId,
        attempts: 0,
        passed: 0,
        passRate: 0,
        updatedAt: now,
    };
    entry.attempts += 1;
    if (outcome === "passed")
        entry.passed += 1;
    entry.passRate = entry.attempts > 0 ? entry.passed / entry.attempts : 0;
    entry.updatedAt = now;
    topicScores.templates[templateId] = entry;
    topicScores.updatedAt = now;
    file.updatedAt = now;
    saveCourse(dataDir, file);
}
/**
 * Pick a template for this (course, topic) call.
 *
 * If only one template is registered, return it (Layer 3 dormant).
 * If multiple registered but any has < MIN_SAMPLES on this topic, equal-weight pick.
 * Otherwise softmax-weighted on passRate.
 */
export function selectTemplate(dataDir, course, topic) {
    const all = listTemplates();
    if (all.length === 0) {
        throw new Error("No templates registered. Call registerTemplate() at least once.");
    }
    if (all.length === 1)
        return all[0];
    const file = loadCourse(dataDir, course);
    const topicScores = file.topics[topic];
    const needsExploration = !topicScores ||
        all.some((t) => (topicScores.templates[t.id]?.attempts ?? 0) < MIN_SAMPLES);
    if (needsExploration) {
        // Equal-weighted random pick.
        const idx = Math.floor(Math.random() * all.length);
        return all[idx];
    }
    // Softmax-weighted by passRate.
    const rates = all.map((t) => topicScores.templates[t.id]?.passRate ?? 0);
    const exps = rates.map((r) => Math.exp(r / SOFTMAX_TEMPERATURE));
    const total = exps.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < all.length; i++) {
        r -= exps[i];
        if (r <= 0)
            return all[i];
    }
    return all[all.length - 1];
}
//# sourceMappingURL=template-registry.js.map