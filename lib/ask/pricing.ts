// Relative to Claude Sonnet 4.6 ($3 / $15 per million tokens) = 1.0.
export const MODEL_MULTIPLIERS: Record<string, number> = {
  "claude-opus-5-5": 1.3, // $4 / $20
  "claude-sonnet-4-6": 1.0,
  "claude-haiku-4-5": 0.3,
  "claude-opus-4-7": 5.0,
  "gpt-5": 1.2,
  "gpt-5-mini": 0.3,
};

export function multiplierFor(modelId: string): number {
  return MODEL_MULTIPLIERS[modelId] ?? 1.0;
}

export function weightedTokens(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const m = multiplierFor(modelId);
  return Math.round((inputTokens + outputTokens) * m);
}
