// USD per million tokens. Micros = USD * 1_000_000 (so rate value = micros per token).
export const MODEL_PRICING: Record<string, { in: number; out: number; cache: number }> = {
  "claude-sonnet-4-6": { in: 3,    out: 15,   cache: 0.3 },
  "claude-haiku-4-5":  { in: 1,    out: 5,    cache: 0.1 },
  "claude-opus-4-7":   { in: 15,   out: 75,   cache: 1.5 },
  "gpt-5":             { in: 2.5,  out: 10,   cache: 0.25 },
  "gpt-5-mini":        { in: 0.25, out: 2,    cache: 0.025 },
};

export function computeCostMicros(
  model: string,
  t: { inputTokens: number; outputTokens: number; cachedTokens: number },
): number {
  const p = MODEL_PRICING[model];
  if (!p) return 0;
  return Math.round(t.inputTokens * p.in + t.outputTokens * p.out + t.cachedTokens * p.cache);
}
