# @preplion/generation-loop

Closed-loop generator for AI-authored test-prep questions. Couples LLM generation with a gate engine so failures feed back as retries (Layer 1), accumulate as per-topic negative-prompt memory (Layer 2), and drive template selection over time (Layer 3).

Pairs with [`@preplion/question-gates`](../question-gates).

## Why

LLM generators ship the same bugs over and over. A gate engine catches them — but when a failed question is silently dropped, the generator never learns. This package closes the loop so the generator gets smarter the more it generates.

## Three layers

| Layer | What it does | Lives at |
|-------|--------------|----------|
| 1 — Per-Q sync retry | Failed gate → re-prompt with the failure reason, up to N retries | In-process, per call |
| 2 — Per-topic memory | Each gate failure accumulates on disk; every future prompt for that topic prepends "AVOID: \<top-5 failures\>" | `data/gate-feedback/<COURSE>.json` |
| 3 — Template registry | Multiple prompt templates can be registered; the selector A/B tests them and weights toward winners after N=50 samples | `data/template-scores/<COURSE>.json` |

Layer 3 starts dormant — with one registered template it always picks that one. Register a second template and the selector activates.

## Quick start

```ts
import {
  registerTemplate,
  DEFAULT_MCQ_TEMPLATE,
  generateWithFeedback,
} from "@preplion/generation-loop";
import { runDeterministicGates } from "@preplion/question-gates";

registerTemplate(DEFAULT_MCQ_TEMPLATE);

const result = await generateWithFeedback({
  course: "CLEP_BIOLOGY",
  topic: "cellular respiration",
  spec: { topic_weights: { /* ... */ } },
  llm: async ({ systemPrompt, userPrompt }) => {
    // Your Groq / Anthropic / Gemini call here
    return await callGroq(systemPrompt, userPrompt);
  },
  gates: (q) => runDeterministicGates(q),
  maxRetries: 3,
  dataDir: "./data",
});

if (result.result === "passed") {
  await insertToDb(result.q);
} else {
  // Skipped — gate never passed within budget. Memory still updated.
  console.log(`Skipped after ${result.attemptsUsed} attempts. Failures:`, result.gateHistory);
}
```

## Retry policy

When the gate fails after `maxRetries=3`, the Q is **skipped** (not saved with `isApproved=false`). This keeps the bank clean and lets the loop's improving feedback memory backfill volume over time.

## Storage

Both feedback files are human-inspectable JSON. To see what the generator's been getting wrong:

```bash
cat data/gate-feedback/CLEP_BIOLOGY.json
```

Per-course storage; PrepLion learns CLEP patterns, StudentNest learns AP/SAT/ACT patterns — different course universes, different failure profiles.

## API

```ts
generateWithFeedback(input: GenerateInput): Promise<LoopResult>

recordGateOutcome(dataDir, course, topic, gateResult): void
getNegativePromptForTopic(dataDir, course, topic, topN?): string
getTopicStats(dataDir, course, topic): TopicFeedback | null

registerTemplate(template: Template): void
getTemplate(id): Template | null
listTemplates(): Template[]
selectTemplate(dataDir, course, topic): Template
scoreTemplate(dataDir, course, topic, templateId, outcome): void
```

## Development

```bash
npm run build       # compile to dist/
npm test            # vitest, 13 tests
```

## License

MIT
