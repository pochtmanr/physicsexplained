import type { UsageRow } from "./types";
import { computeCostMicros } from "./cost";

/** Rough token count for text the provider never reported usage for. */
const estimateTokens = (chars: number) => Math.ceil(chars / 4);

export interface PartialUsageInput {
  model: string;
  /** Usage the provider reported before the stream stopped, if any. */
  reported: UsageRow | null;
  /** Answer text already sent to the client. */
  assistantText: string;
  /** Characters of history plus the new question, for an input estimate. */
  promptChars: number;
}

/**
 * Usage to charge when a stream ends without the pipeline's final usage event
 * (client disconnect, stall watchdog). Returns null when nothing was generated
 * and nothing was reported, i.e. there is nothing to charge for.
 *
 * Providers report output tokens at the end of a message, so an interrupted
 * answer is priced from the text that was actually streamed.
 */
export function usageForInterruptedStream(input: PartialUsageInput): UsageRow | null {
  const { model, reported, assistantText, promptChars } = input;
  const reportedTotal = reported ? reported.inputTokens + reported.outputTokens + reported.cachedTokens : 0;
  if (assistantText.length === 0 && reportedTotal === 0) return null;

  const usage: UsageRow = {
    model,
    // No report at all means the request was cut before the provider's first
    // usage event; the prompt was still sent, so estimate it.
    inputTokens: reportedTotal > 0 ? reported!.inputTokens : estimateTokens(promptChars),
    outputTokens: Math.max(reported?.outputTokens ?? 0, estimateTokens(assistantText.length)),
    cachedTokens: reported?.cachedTokens ?? 0,
    costMicros: 0,
  };
  usage.costMicros = computeCostMicros(model, usage);
  return usage;
}
