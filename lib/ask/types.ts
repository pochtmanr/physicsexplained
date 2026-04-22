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
  | { type: "tool-call-end"; toolCallId: string; ok: boolean }
  | { type: "usage"; usage: UsageRow }
  | { type: "flag"; reason: string }
  | { type: "error"; message: string }
  | { type: "done" };

// Catalog of user-selectable answerer models. Classifier is always the cheap
// sibling in the same provider.
export type ProviderId = "anthropic" | "openai";

export interface ModelOption {
  id: string;            // model id passed to provider
  label: string;         // human-readable dropdown label
  provider: ProviderId;
  classifier: string;    // sibling classifier model id
  description: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6 (recommended)",
    provider: "anthropic",
    classifier: "claude-haiku-4-5",
    description: "Best LaTeX + physics reasoning, mid cost.",
  },
  {
    id: "claude-haiku-4-5",
    label: "Claude Haiku 4.5 (cheap + fast)",
    provider: "anthropic",
    classifier: "claude-haiku-4-5",
    description: "Cheap and fast; weaker on multi-step conceptual questions.",
  },
  {
    id: "gpt-5",
    label: "GPT-5",
    provider: "openai",
    classifier: "gpt-5-mini",
    description: "OpenAI's strongest general model.",
  },
  {
    id: "gpt-5-mini",
    label: "GPT-5 mini",
    provider: "openai",
    classifier: "gpt-5-mini",
    description: "Cheap OpenAI sibling. Fast.",
  },
];

export const DEFAULT_MODEL_ID = "claude-sonnet-4-6";

export function findModel(id: string): ModelOption {
  return AVAILABLE_MODELS.find((m) => m.id === id) ?? AVAILABLE_MODELS[0];
}
