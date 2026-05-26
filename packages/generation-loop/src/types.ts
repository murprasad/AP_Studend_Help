/**
 * Shared types for @preplion/generation-loop.
 */

/** A candidate question — same shape the gate engine accepts. */
export interface Question {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  stimulus?: string | null;
  topic?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  course: string;
}

/** Result of running the gate stack against a candidate. */
export interface GateOutcome {
  ok: boolean;
  /** Short gate identifier when ok=false (e.g. "explanation-no-reasoning"). */
  gate?: string;
  /** Human-readable failure reason when ok=false. */
  reason?: string;
}

/** Context passed to a function-based systemPrompt. */
export interface TemplateContext {
  course: string;
  topic: string;
}

/** A registered prompt template the generator can choose from. */
export interface Template {
  id: string;
  /** Semver or date tag; bump when prompt content changes meaningfully. */
  version: string;
  /**
   * System prompt content.
   *
   * - Pass a `string` for a static prompt (course-agnostic).
   * - Pass a `(ctx) => string` to be course-aware — the loop will call it
   *   with the current `{course, topic}` before each generation. This lets
   *   the template inject things like option count, exam family, etc.
   */
  systemPrompt: string | ((ctx: TemplateContext) => string);
  /** Optional per-template metadata for telemetry. */
  metadata?: Record<string, unknown>;
}

/** Per-topic failure histogram entry (Layer 2). */
export interface FailureRecord {
  /** Gate identifier (e.g. "explanation-no-reasoning"). */
  gate: string;
  /** Total times this gate failed for this topic. */
  count: number;
  /** Most recent failure reason text (sampled). */
  lastReason?: string;
  /** ISO timestamp of most recent occurrence. */
  lastSeen: string;
}

/** Per-(course,topic) feedback record persisted to disk. */
export interface TopicFeedback {
  course: string;
  topic: string;
  failures: Record<string, FailureRecord>;
  totalAttempts: number;
  totalPassed: number;
  updatedAt: string;
}

/** Per-(course,topic,template) score for Layer 3. */
export interface TemplateScore {
  templateId: string;
  attempts: number;
  passed: number;
  /** Rolling pass rate = passed / attempts. */
  passRate: number;
  updatedAt: string;
}

/** Per-(course,topic) template score table. */
export interface TopicScores {
  course: string;
  topic: string;
  templates: Record<string, TemplateScore>;
  updatedAt: string;
}

/** Result returned from the closed-loop generator. */
export interface LoopResult {
  q: Question | null;
  /** "passed" = gates accepted; "failed-after-retries" = gave up. */
  result: "passed" | "failed-after-retries";
  attemptsUsed: number;
  templateUsed: string;
  /** Gate outcomes for each attempt, oldest first. */
  gateHistory: GateOutcome[];
}

/** LLM caller — adapter provided by the host (Groq, Haiku, etc.). */
export type LlmFn = (args: {
  systemPrompt: string;
  userPrompt: string;
}) => Promise<string>;

/** Gate caller — adapter provided by the host. */
export type GateFn = (q: Question) => Promise<GateOutcome> | GateOutcome;

/** Context passed to a custom buildUserPrompt callback. */
export interface UserPromptContext {
  course: string;
  topic: string;
  spec?: Record<string, unknown>;
  /** Null on attempt 1; the prior gate outcome on retries. */
  previousFailure: GateOutcome | null;
  /** 1-indexed. attempt=1 is the first try; attempt>1 is a retry. */
  attempt: number;
}

/** Input for generateWithFeedback. */
export interface GenerateInput {
  course: string;
  topic: string;
  /** CB-spec context the prompt template wants (topic_weights, sample_stems, etc.). */
  spec?: Record<string, unknown>;
  /** Adapter functions. */
  llm: LlmFn;
  gates: GateFn;
  /** Max retries when gates fail. Default 3. */
  maxRetries?: number;
  /** Override the data dir (defaults to process.cwd()/data). */
  dataDir?: string;
  /** Override template selection (skip Layer 3). */
  forceTemplateId?: string;
  /**
   * Optional custom user-prompt builder. When provided, the loop calls this
   * instead of its built-in builder. The callback still receives the gate's
   * previous failure on retries, so Layer 1 retry-with-feedback keeps working.
   *
   * Use this when the call has context that doesn't fit the default builder
   * (e.g. a passage/stimulus the question must be grounded in). The OER
   * passage-grounded generators use this pattern.
   *
   * The system prompt (from the selected template) and Layer 2 negative
   * memory are still prepended automatically; you only control the user
   * message.
   */
  buildUserPrompt?: (ctx: UserPromptContext) => string;
}
