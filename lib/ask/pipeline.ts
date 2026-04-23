import type { LLMProvider, NeutralMessage } from "./provider";
import type { AnswerStreamChunk, ClassifierLabel, UsageRow } from "./types";
import { TOOL_SCHEMAS, type JsonToolDef } from "./tool-schemas";
import { SYSTEM_PROMPT_BASE, OFF_TOPIC_REFUSAL, INJECTION_RE } from "./prompts";
import { renderToc, type TocData } from "./toc";
import { computeCostMicros } from "./cost";
import { selectInitialTools } from "./router";

const MAX_HOPS = 6;

// Per-model output budget. For reasoning models (GPT-5 family, o-series) this
// counts reasoning tokens + visible output together, so the number must leave
// room for both. The previous blanket 800/1500 split forced gpt-5-mini into
// 800 via includes("mini"), which with any reasoning would yield an empty
// response — the user-visible "loads forever, never returns" bug.
function pickMaxTokens(modelId: string): number {
  if (modelId === "gpt-5") return 6000;
  if (modelId.startsWith("gpt-5-mini") || modelId.startsWith("gpt-5-nano")) return 4000;
  if (modelId.startsWith("o1") || modelId.startsWith("o3")) return 6000;
  if (modelId.includes("haiku")) return 800;
  return 1500;
}

// Per-label toolsets. Philosophy: the model answers from its own expertise;
// tools are opt-in decoration (cite lookups, plots) or explicit user asks
// (pointer questions, web freshness). Keeping the toolset small also shrinks
// the system prompt — each tool schema is ~200 tokens.
//
// conceptual-explain deliberately does NOT include searchSiteContent /
// getContentEntry / webSearch: those pull heavy JSON blobs or force
// round-trips that block the first text token on a trivially-answerable
// physics question. article-pointer is the label that offers full content
// retrieval when the user explicitly asks "where can I read about X".
const TOOLS_BY_LABEL: Record<Exclude<ClassifierLabel, "off-topic">, readonly string[]> = {
  "glossary-lookup": ["searchGlossary"],
  "article-pointer": ["searchSiteContent", "getContentEntry", "searchGlossary"],
  "conceptual-explain": [
    "searchGlossary",
    "searchScenes", "showScene", "plotFunction", "plotParametric",
  ],
  "calculation": ["plotFunction", "plotParametric", "searchGlossary"],
  "viz-request": ["searchScenes", "showScene", "plotFunction", "plotParametric", "searchGlossary"],
};

// Hard cap on tool_result payload fed back into the model. Prevents a single
// getContentEntry result from blowing past the prompt window and stalling
// prefill on subsequent hops.
const MAX_TOOL_RESULT_BYTES = 20_000;

function capToolResult(s: string): string {
  if (s.length <= MAX_TOOL_RESULT_BYTES) return s;
  return s.slice(0, MAX_TOOL_RESULT_BYTES) + '…<truncated by tutor: tool result exceeded 20KB>';
}

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

  // Routing is 100% heuristic now. Follow-ups default to conceptual-explain
  // (they're continuations of an already-accepted physics thread). First-turn
  // messages go through the keyword heuristic; anything it can't classify
  // defaults to conceptual-explain too.
  //
  // The classifier LLM call used to gate every first turn with Haiku — even on
  // the happy path that was a full round-trip of latency cost before any text
  // could stream. Off-topic detection now relies on SYSTEM_PROMPT_BASE telling
  // the model to refuse politely in one sentence, which is a much smaller tax
  // than making every user wait for a classification token.
  const isFollowUp = deps.history.length > 0;
  const label: ClassifierLabel = isFollowUp
    ? "conceptual-explain"
    : (selectInitialTools(userMsg) ?? "conceptual-explain");

  if (label === "off-topic") {
    yield { type: "text", delta: OFF_TOPIC_REFUSAL };
    yield { type: "usage", usage: { model: "none", inputTokens: 0, outputTokens: 0, cachedTokens: 0, costMicros: 0 } };
    yield { type: "done" };
    return;
  }

  const systemFull = renderToc(deps.toc) + "\n\n" + SYSTEM_PROMPT_BASE;
  const systemDynamic = [deps.systemTail ?? "", `Route: ${label}`].filter(Boolean).join("\n\n");
  const scopedTools = pickTools(label);

  if (process.env.ASK_SILENT !== "1") {
    console.log(`[ask pipeline] label=${label} tools=${scopedTools.map((t) => t.name).join(",")} systemBytes=${systemFull.length}`);
  }

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

    const hopT0 = Date.now();
    if (process.env.ASK_SILENT !== "1") {
      console.log(`[ask pipeline] hop=${hop} messages=${messages.length} → requesting provider…`);
    }
    const stream = deps.provider.streamAnswer({
      model: deps.answererModel,
      system: systemFull,
      systemDynamic: systemDynamicHop,
      messages,
      tools: isLastHop ? [] : scopedTools,
      maxTokens: pickMaxTokens(deps.answererModel),
      signal: deps.signal,
    });

    let firstDeltaLogged = false;
    for await (const delta of stream) {
      if (!firstDeltaLogged) {
        firstDeltaLogged = true;
        if (process.env.ASK_SILENT !== "1") {
          console.log(`[ask pipeline] hop=${hop} first-provider-event after ${Date.now() - hopT0}ms kind=${delta.kind}`);
        }
      }
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
        case "flag":
          if (delta.reason) yield { type: "flag", reason: delta.reason };
          break;
      }
    }

    if (pendingToolCalls.length === 0) {
      // Empty completion safety net: if the provider returned with no text,
      // no tool calls, and no existing flag (e.g. reasoning budget blown on a
      // reasoning model, or OpenAI returning a zero-content response for any
      // reason), surface a visible error instead of silently closing with an
      // empty bubble.
      if (assistantText.length === 0 && hop === 0) {
        yield {
          type: "flag",
          reason: "empty-completion",
        };
        yield {
          type: "text",
          delta: "The model returned an empty response. This can happen on reasoning models when the output budget is exhausted, or on transient provider errors. Try a shorter question or switch model.",
        };
      }
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

    // Run independent tool calls concurrently. Each has its own try/catch so
    // one failure never cancels siblings. Preserve call order in the
    // tool_result blocks and yield tool-call-end events in the same order so
    // the client's ProgressTree stays in sync.
    const settled = await Promise.all(
      pendingToolCalls.map(async (call) => {
        const fn = deps.toolset[call.name];
        if (!fn) {
          return { call, outStr: JSON.stringify({ error: `Unknown tool ${call.name}` }), isErr: true, preview: undefined as string | undefined };
        }
        try {
          const result = await fn((call.input ?? {}) as never);
          const isErr = (result as { ok?: boolean } | null)?.ok === false;
          return {
            call,
            outStr: capToolResult(JSON.stringify(result)),
            isErr,
            preview: summarizeToolResult(call.name, result),
          };
        } catch (e) {
          return { call, outStr: JSON.stringify({ error: (e as Error).message }), isErr: true, preview: undefined };
        }
      }),
    );

    const toolResultBlocks: import("./provider").NeutralContent[] = [];
    for (const { call, outStr, isErr, preview } of settled) {
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
