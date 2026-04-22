import type { LLMProvider, NeutralMessage } from "./provider";
import type { AnswerStreamChunk, ClassifierLabel, UsageRow } from "./types";
import { TOOL_SCHEMAS } from "./tool-schemas";
import { CLASSIFIER_PROMPT, SYSTEM_PROMPT_BASE, OFF_TOPIC_REFUSAL, INJECTION_RE } from "./prompts";
import { renderToc, type TocData } from "./toc";
import { computeCostMicros } from "./cost";

const MAX_HOPS = 6;
const LABELS: ClassifierLabel[] = [
  "glossary-lookup", "article-pointer", "conceptual-explain", "calculation", "viz-request", "off-topic",
];

export interface PipelineDeps {
  provider: LLMProvider;
  classifierModel: string;      // e.g., "claude-haiku-4-5" or "gpt-5-mini"
  answererModel: string;        // e.g., "claude-sonnet-4-6" or "gpt-5"
  toc: TocData;
  toolset: Record<string, (args: unknown) => Promise<unknown>>;
  history: NeutralMessage[];
  systemTail?: string;
}

export async function* runPipeline(deps: PipelineDeps, userMsg: string): AsyncIterable<AnswerStreamChunk> {
  if (INJECTION_RE.test(userMsg)) {
    yield { type: "flag", reason: "injection-heuristic" };
    yield { type: "text", delta: OFF_TOPIC_REFUSAL };
    yield { type: "usage", usage: { model: "none", inputTokens: 0, outputTokens: 0, cachedTokens: 0, costMicros: 0 } };
    yield { type: "done" };
    return;
  }

  const label = await deps.provider.classify(deps.classifierModel, CLASSIFIER_PROMPT, userMsg, LABELS);

  if (label === "off-topic") {
    yield { type: "text", delta: OFF_TOPIC_REFUSAL };
    yield { type: "usage", usage: { model: "none", inputTokens: 0, outputTokens: 0, cachedTokens: 0, costMicros: 0 } };
    yield { type: "done" };
    return;
  }

  const systemFull = renderToc(deps.toc) + "\n\n" + SYSTEM_PROMPT_BASE;
  const systemDynamic = [deps.systemTail ?? "", `Classifier label: ${label}`].filter(Boolean).join("\n\n");

  const messages: NeutralMessage[] = [...deps.history, { role: "user", content: [{ type: "text", text: userMsg }] }];
  let totalUsage: UsageRow = { model: deps.answererModel, inputTokens: 0, outputTokens: 0, cachedTokens: 0, costMicros: 0 };

  for (let hop = 0; hop < MAX_HOPS; hop++) {
    const pendingToolCalls: Array<{ id: string; name: string; input: unknown }> = [];
    let assistantText = "";

    const stream = deps.provider.streamAnswer({
      model: deps.answererModel,
      system: systemFull,
      systemDynamic,
      messages,
      tools: TOOL_SCHEMAS,
      maxTokens: deps.answererModel.includes("mini") || deps.answererModel.includes("haiku") ? 800 : 1500,
    });

    for await (const delta of stream) {
      switch (delta.kind) {
        case "text-delta":
          if (delta.text) { assistantText += delta.text; yield { type: "text", delta: delta.text }; }
          break;
        case "tool-call-start":
          if (delta.toolCallId && delta.toolName) {
            yield { type: "tool-call-start", name: delta.toolName, toolCallId: delta.toolCallId };
          }
          break;
        case "tool-call-end":
          if (delta.toolCallId && delta.toolName) {
            pendingToolCalls.push({ id: delta.toolCallId, name: delta.toolName, input: delta.finalInput });
          }
          break;
        case "usage":
          if (delta.usage) totalUsage = mergeUsage(totalUsage, delta.usage);
          break;
      }
    }

    if (pendingToolCalls.length === 0) {
      totalUsage.costMicros = computeCostMicros(totalUsage.model, totalUsage);
      yield { type: "usage", usage: totalUsage };
      yield { type: "done" };
      return;
    }

    messages.push({
      role: "assistant",
      content: [
        ...(assistantText ? [{ type: "text" as const, text: assistantText }] : []),
        ...pendingToolCalls.map((c) => ({ type: "tool_use" as const, id: c.id, name: c.name, input: c.input ?? {} })),
      ],
    });

    const toolResultBlocks: import("./provider").NeutralContent[] = [];
    for (const call of pendingToolCalls) {
      const fn = deps.toolset[call.name];
      let outStr: string; let isErr = false;
      if (!fn) { outStr = JSON.stringify({ error: `Unknown tool ${call.name}` }); isErr = true; }
      else {
        try {
          const result = await fn((call.input ?? {}) as never);
          outStr = JSON.stringify(result);
          if ((result as { ok?: boolean } | null)?.ok === false) isErr = true;
        } catch (e) {
          outStr = JSON.stringify({ error: (e as Error).message });
          isErr = true;
        }
      }
      toolResultBlocks.push({ type: "tool_result", tool_use_id: call.id, content: outStr, is_error: isErr });
      yield { type: "tool-call-end", toolCallId: call.id, ok: !isErr };
    }
    messages.push({ role: "user", content: toolResultBlocks });
  }

  yield { type: "text", delta: "\n\n(Couldn't complete tool exploration — returning best effort.)" };
  totalUsage.costMicros = computeCostMicros(totalUsage.model, totalUsage);
  yield { type: "usage", usage: totalUsage };
  yield { type: "done" };
}

function mergeUsage(a: UsageRow, b: UsageRow): UsageRow {
  return {
    model: b.model,
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cachedTokens: a.cachedTokens + b.cachedTokens,
    costMicros: 0,
  };
}
