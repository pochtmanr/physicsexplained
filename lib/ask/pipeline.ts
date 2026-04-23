import type { LLMProvider, NeutralMessage } from "./provider";
import type { AnswerStreamChunk, ClassifierLabel, UsageRow } from "./types";
import { TOOL_SCHEMAS, type JsonToolDef } from "./tool-schemas";
import { CLASSIFIER_PROMPT, SYSTEM_PROMPT_BASE, OFF_TOPIC_REFUSAL, INJECTION_RE } from "./prompts";
import { renderToc, type TocData } from "./toc";
import { computeCostMicros } from "./cost";

const MAX_HOPS = 6;
const LABELS: ClassifierLabel[] = [
  "glossary-lookup", "article-pointer", "conceptual-explain", "calculation", "viz-request", "off-topic",
];

// Router — narrow the tool set based on classifier label. Fewer tools in the
// system prompt = smaller payload = faster TTFB + cheaper. The full set is a
// safety net for conceptual-explain (the broadest category).
const TOOLS_BY_LABEL: Record<Exclude<ClassifierLabel, "off-topic">, readonly string[]> = {
  "glossary-lookup": ["searchGlossary", "listGlossaryByCategory", "getContentEntry", "searchSiteContent"],
  "article-pointer": ["searchSiteContent", "getContentEntry", "searchGlossary"],
  "conceptual-explain": [
    "searchSiteContent", "getContentEntry", "searchGlossary",
    "searchScenes", "showScene", "plotFunction", "plotParametric",
    "webSearch", "fetchUrl",
  ],
  "calculation": ["searchSiteContent", "getContentEntry", "plotFunction", "plotParametric"],
  "viz-request": ["searchScenes", "showScene", "plotFunction", "plotParametric", "searchSiteContent"],
};

function pickTools(label: ClassifierLabel): JsonToolDef[] {
  if (label === "off-topic") return [];
  const allowed = new Set(TOOLS_BY_LABEL[label]);
  return TOOL_SCHEMAS.filter((t) => allowed.has(t.name));
}

export interface PipelineDeps {
  provider: LLMProvider;
  classifierModel: string;      // e.g., "claude-haiku-4-5" or "gpt-5-mini"
  answererModel: string;        // e.g., "claude-sonnet-4-6" or "gpt-5"
  toc: TocData;
  toolset: Record<string, (args: unknown) => Promise<unknown>>;
  history: NeutralMessage[];
  systemTail?: string;
  signal?: AbortSignal;
}

export async function* runPipeline(deps: PipelineDeps, userMsg: string): AsyncIterable<AnswerStreamChunk> {
  if (INJECTION_RE.test(userMsg)) {
    yield { type: "flag", reason: "injection-heuristic" };
    yield { type: "text", delta: OFF_TOPIC_REFUSAL };
    yield { type: "usage", usage: { model: "none", inputTokens: 0, outputTokens: 0, cachedTokens: 0, costMicros: 0 } };
    yield { type: "done" };
    return;
  }

  // Router: classify only on the first user turn of a conversation. Follow-ups
  // are implicitly treated as continuations of an already-accepted physics
  // discussion — this saves a full classifier round-trip (~300ms) and, more
  // importantly, stops follow-ups like "why?" from being mis-classified as
  // off-topic (which would refuse before history even entered the picture).
  const isFollowUp = deps.history.length > 0;
  const label: ClassifierLabel = isFollowUp
    ? "conceptual-explain"
    : await deps.provider.classify(deps.classifierModel, CLASSIFIER_PROMPT, userMsg, LABELS);

  if (label === "off-topic") {
    yield { type: "text", delta: OFF_TOPIC_REFUSAL };
    yield { type: "usage", usage: { model: "none", inputTokens: 0, outputTokens: 0, cachedTokens: 0, costMicros: 0 } };
    yield { type: "done" };
    return;
  }

  const systemFull = renderToc(deps.toc) + "\n\n" + SYSTEM_PROMPT_BASE;
  const systemDynamic = [deps.systemTail ?? "", `Classifier label: ${label}`].filter(Boolean).join("\n\n");
  const scopedTools = pickTools(label);

  const messages: NeutralMessage[] = [...deps.history, { role: "user", content: [{ type: "text", text: userMsg }] }];
  let totalUsage: UsageRow = { model: deps.answererModel, inputTokens: 0, outputTokens: 0, cachedTokens: 0, costMicros: 0 };

  for (let hop = 0; hop < MAX_HOPS; hop++) {
    const pendingToolCalls: Array<{ id: string; name: string; input: unknown }> = [];
    let assistantText = "";

    if (deps.signal?.aborted) return;

    // On the final hop, strip tools so the model is forced to answer from what
    // it already has. Avoids the "searched 5 times then dead-ended" UX.
    const isLastHop = hop === MAX_HOPS - 1;
    const systemDynamicHop = isLastHop
      ? [systemDynamic, "Final hop: tools are no longer available. Answer now with what you have."].filter(Boolean).join("\n\n")
      : systemDynamic;

    const stream = deps.provider.streamAnswer({
      model: deps.answererModel,
      system: systemFull,
      systemDynamic: systemDynamicHop,
      messages,
      tools: isLastHop ? [] : scopedTools,
      maxTokens: deps.answererModel.includes("mini") || deps.answererModel.includes("haiku") ? 800 : 1500,
      signal: deps.signal,
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
            yield { type: "tool-call-args", toolCallId: delta.toolCallId, args: delta.finalInput };
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
      let outStr: string; let isErr = false; let preview: string | undefined;
      if (!fn) { outStr = JSON.stringify({ error: `Unknown tool ${call.name}` }); isErr = true; }
      else {
        try {
          const result = await fn((call.input ?? {}) as never);
          outStr = JSON.stringify(result);
          if ((result as { ok?: boolean } | null)?.ok === false) isErr = true;
          preview = summarizeToolResult(call.name, result);
        } catch (e) {
          outStr = JSON.stringify({ error: (e as Error).message });
          isErr = true;
        }
      }
      toolResultBlocks.push({ type: "tool_result", tool_use_id: call.id, content: outStr, is_error: isErr });
      yield { type: "tool-call-end", toolCallId: call.id, ok: !isErr, resultPreview: preview };
    }
    messages.push({ role: "user", content: toolResultBlocks });
  }

  // Safety net: the last hop strips tools, so we should always reach the early
  // return above. If we land here, the model emitted no text on the final hop
  // — don't panic the user; just finalize usage and exit cleanly.
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

// Short human-friendly hint shown in the progress tree after a tool runs.
function summarizeToolResult(name: string, result: unknown): string | undefined {
  if (!result || typeof result !== "object") return undefined;
  const r = result as Record<string, unknown>;
  if (name === "searchSiteContent" || name === "searchGlossary" || name === "searchScenes") {
    const hits = (r.hits as Array<unknown> | undefined) ?? (r.results as Array<unknown> | undefined);
    if (Array.isArray(hits)) return `${hits.length} result${hits.length === 1 ? "" : "s"}`;
  }
  if (name === "listGlossaryByCategory") {
    const items = (r.items as Array<unknown> | undefined) ?? (r.entries as Array<unknown> | undefined);
    if (Array.isArray(items)) return `${items.length} entries`;
  }
  if (name === "getContentEntry") {
    const title = (r.title as string | undefined) ?? (r.entry as { title?: string } | undefined)?.title;
    if (title) return title.length > 60 ? `${title.slice(0, 60)}…` : title;
  }
  if (name === "webSearch") {
    const results = (r.results as Array<unknown> | undefined) ?? (r.hits as Array<unknown> | undefined);
    if (Array.isArray(results)) return `${results.length} web result${results.length === 1 ? "" : "s"}`;
  }
  if (name === "fetchUrl") {
    const title = r.title as string | undefined;
    return title ? (title.length > 60 ? `${title.slice(0, 60)}…` : title) : "fetched";
  }
  if (name === "showScene") return "scene rendered";
  if (name === "plotFunction" || name === "plotParametric") return "plot generated";
  return undefined;
}
