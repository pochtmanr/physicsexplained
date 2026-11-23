// Shared types for the /ask tutor.
export type Role = "user" | "assistant" | "tool";

export type ClassifierLabel =
  | "glossary-lookup"
  | "article-pointer"
  | "conceptual-explain"
  | "calculation"
  | "viz-request"
  | "off-topic";

export interface UsageRow {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  costMicros: number;
}

export type AnswerStreamChunk =
  | { type: "text"; delta: string }
  | { type: "tool-call-start"; name: string; toolCallId: string }
  | { type: "tool-call-args"; toolCallId: string; args: unknown }
  | { type: "tool-call-end"; toolCallId: string; ok: boolean; resultPreview?: string }
  | { type: "usage"; usage: UsageRow }
  | { type: "flag"; reason: string }
  // The provider is working (thinking) but has nothing to show yet.
  | { type: "activity" }
  | { type: "error"; message: string }
  | { type: "done" };

// The tutor answers with one model. Users do not choose: the route ignores any
// model id a client sends. The classifier is a cheap sibling used only to
// label the question and to title the conversation.
export type ProviderId = "anthropic" | "openai";

export interface ModelOption {
  id: string;            // model id passed to provider
  label: string;         // human-readable label
  provider: ProviderId;
  classifier: string;    // sibling classifier model id
  description: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "claude-opus-5-5",
    label: "Claude Opus 5.5",
    provider: "anthropic",
    classifier: "claude-haiku-4-5",
    description: "Anthropic's current Opus model.",
  },
];

export const DEFAULT_MODEL_ID = "claude-opus-5-5";

export function findModel(id: string): ModelOption {
  return AVAILABLE_MODELS.find((m) => m.id === id) ?? AVAILABLE_MODELS[0];
}
