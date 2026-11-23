// Provider abstraction. Anthropic (Claude) + OpenAI (GPT) adapters.
// Message format is neutral; adapters convert at the boundary.
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { ClassifierLabel, UsageRow, ProviderId } from "./types";
import type { JsonToolDef } from "./tool-schemas";
import { findModel } from "./types";

export type NeutralContent =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

export interface NeutralMessage {
  role: "user" | "assistant";
  content: NeutralContent[];
  /**
   * Assistant turns produced earlier in the same request, exactly as the
   * provider returned them (thinking blocks included). The adapter that
   * produced it sends it back unchanged in the tool loop; other adapters
   * ignore it and use `content`.
   */
  raw?: unknown[];
}

export interface StreamDelta {
  kind: "text-delta" | "tool-call-start" | "tool-call-end" | "stop" | "usage" | "flag" | "activity" | "assistant-raw";
  /** With "assistant-raw": the provider's own content blocks for this turn. */
  raw?: unknown[];
  toolCallId?: string;
  toolName?: string;
  text?: string;
  finalInput?: unknown;
  usage?: UsageRow;
  reason?: string;
}

export interface AnswerRequest {
  model: string;
  system: string;
  systemDynamic?: string;
  messages: NeutralMessage[];
  tools?: JsonToolDef[];
  maxTokens: number;
  /**
   * Last hop of the tool loop: the model must answer now, without calling
   * tools. Expressed per provider so the system prompt and the tool list stay
   * identical across the hops of one request.
   */
  forceAnswer?: boolean;
  signal?: AbortSignal;
}

export interface LLMProvider {
  streamAnswer(req: AnswerRequest): AsyncIterable<StreamDelta>;
  classify(classifierModel: string, system: string, user: string, labels: ClassifierLabel[]): Promise<ClassifierLabel>;
}

const FINAL_HOP_NOTE = "Final hop: tools are no longer available. Answer now with what you have.";

// ───────────────────────── Anthropic adapter ─────────────────────────

class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
    // maxRetries=1 caps cascade backoff from transient 529/5xx (default is 2
    // with exponential delay, which can stretch a bad request to 90s+ silent).
    // timeout=60s is a per-request ceiling; the upstream silence watchdog in
    // app/api/ask/stream/route.ts enforces a stricter 45s user-visible ceiling.
    this.client = new Anthropic({ apiKey, maxRetries: 1, timeout: 60_000 });
  }

  async *streamAnswer(req: AnswerRequest): AsyncIterable<StreamDelta> {
    const system = [
      { type: "text", text: req.system, cache_control: { type: "ephemeral" } },
      ...(req.systemDynamic ? [{ type: "text", text: req.systemDynamic }] : []),
    ];
    const tools = (req.tools ?? []).map((t) => ({
      name: t.name, description: t.description, input_schema: t.parameters,
    }));

    // Claude Opus 5.5: thinking is always on (adaptive) and thinking blocks
    // are bound to the conversation that produced them. So within one request
    // the history is append-only: earlier assistant turns go back exactly as
    // returned, and the system prompt and tool list never change between hops.
    const messages: unknown[] = req.messages.map((m) =>
      m.role === "assistant" && m.raw ? { role: "assistant", content: m.raw } : { role: m.role, content: m.content },
    );
    if (req.forceAnswer) {
      // Appended operator instruction rather than an edited system prompt.
      messages.push({ role: "system", content: FINAL_HOP_NOTE });
    }

    const params = {
      model: req.model,
      // Thinking counts toward max_tokens, so this covers thinking plus reply.
      max_tokens: req.maxTokens,
      // No sampling parameters and no `thinking` field: this model rejects
      // temperature and runs adaptive thinking by default. Effort is the
      // control for how long it thinks; "low" keeps a chat tutor responsive.
      output_config: { effort: "low" },
      system,
      tools,
      ...(req.forceAnswer && tools.length ? { tool_choice: { type: "none" } } : {}),
      messages,
    };
    const stream = this.client.messages.stream(
      params as unknown as Anthropic.Messages.MessageStreamParams,
      { signal: req.signal },
    );

    const seenToolUses = new Map<string, string>(); // id -> name
    for await (const ev of stream) {
      if (ev.type === "content_block_start" && ev.content_block.type === "tool_use") {
        seenToolUses.set(ev.content_block.id, ev.content_block.name);
        yield { kind: "tool-call-start", toolCallId: ev.content_block.id, toolName: ev.content_block.name };
      } else if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
        yield { kind: "text-delta", text: ev.delta.text };
      } else {
        // Thinking and other events carry nothing to show, but they prove the
        // provider is alive; the route's stall watchdog needs to see that.
        yield { kind: "activity" };
      }
    }
    const final = await stream.finalMessage();
    yield { kind: "assistant-raw", raw: final.content as unknown[] };
    if ((final.stop_reason as string) === "refusal") {
      yield { kind: "flag", reason: "anthropic-refusal" };
    }
    for (const blk of final.content) {
      if (blk.type === "tool_use") {
        yield { kind: "tool-call-end", toolCallId: blk.id, toolName: blk.name, finalInput: blk.input };
      }
    }
    if (final.stop_reason === "max_tokens") {
      yield { kind: "flag", reason: "anthropic-max-tokens-exhausted" };
    }
    const u = final.usage as Anthropic.Messages.Usage & { cache_read_input_tokens?: number };
    yield {
      kind: "usage",
      usage: {
        model: req.model,
        inputTokens: u.input_tokens ?? 0,
        outputTokens: u.output_tokens ?? 0,
        cachedTokens: u.cache_read_input_tokens ?? 0,
        costMicros: 0,
      },
    };
    yield { kind: "stop" };
  }

  async classify(model: string, system: string, user: string, labels: ClassifierLabel[]): Promise<ClassifierLabel> {
    const res = await this.client.messages.create({
      model, max_tokens: 16, temperature: 0, system,
      messages: [{ role: "user", content: user }],
    });
    const text = res.content.map((c) => (c.type === "text" ? c.text : "")).join("").trim().toLowerCase();
    return labels.find((l) => text.includes(l)) ?? "conceptual-explain";
  }
}

// ───────────────────────── OpenAI adapter ─────────────────────────

class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY missing");
    this.client = new OpenAI({ apiKey, maxRetries: 1, timeout: 60_000 });
  }

  async *streamAnswer(req: AnswerRequest): AsyncIterable<StreamDelta> {
    const systemParts = [req.system, req.systemDynamic, req.forceAnswer ? FINAL_HOP_NOTE : ""].filter(Boolean).join("\n\n");
    const openaiMessages = toOpenAIMessages(systemParts, req.messages);
    const tools = (req.forceAnswer ? [] : req.tools ?? []).map((t) => ({
      type: "function" as const,
      function: { name: t.name, description: t.description, parameters: t.parameters as Record<string, unknown> },
    }));

    // GPT-5 family are reasoning models. `max_completion_tokens` counts
    // reasoning tokens + visible output together, and the default
    // `reasoning_effort: medium` can burn 1000-3000 tokens thinking silently
    // before any visible text — long enough that a 1500 budget routinely
    // returns empty with finish_reason=length (user sees "loads forever").
    // Force `minimal` for a chat tutor; the caller picks a budget that leaves
    // room for the answer after reasoning (see pickMaxTokens in pipeline.ts).
    const isReasoningModel = req.model.startsWith("gpt-5") || req.model.startsWith("o1") || req.model.startsWith("o3");
    const params: Record<string, unknown> = {
      model: req.model,
      messages: openaiMessages,
      tools: tools.length ? tools : undefined,
      max_completion_tokens: req.maxTokens,
      stream: true,
      stream_options: { include_usage: true },
    };
    if (isReasoningModel) {
      params.reasoning_effort = "minimal";
    }
    // GPT-5 family rejects any temperature != 1. Let it default.
    const stream = await this.client.chat.completions.create(
      params as unknown as OpenAI.Chat.ChatCompletionCreateParamsStreaming,
      { signal: req.signal },
    );

    const toolAcc = new Map<number, { id: string; name: string; args: string }>();
    const emittedStart = new Set<string>();
    let usage: UsageRow | null = null;
    let finishReason: string | null = null;

    for await (const chunk of stream) {
      const choice = chunk.choices?.[0];
      const delta = choice?.delta;
      if (choice?.finish_reason) finishReason = choice.finish_reason;
      if (delta?.content) yield { kind: "text-delta", text: delta.content };

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          const prev = toolAcc.get(idx) ?? { id: "", name: "", args: "" };
          if (tc.id) prev.id = tc.id;
          if (tc.function?.name) prev.name = tc.function.name;
          if (tc.function?.arguments) prev.args += tc.function.arguments;
          toolAcc.set(idx, prev);
          if (prev.id && prev.name && !emittedStart.has(prev.id)) {
            emittedStart.add(prev.id);
            yield { kind: "tool-call-start", toolCallId: prev.id, toolName: prev.name };
          }
        }
      }

      if (chunk.usage) {
        usage = {
          model: req.model,
          inputTokens: chunk.usage.prompt_tokens ?? 0,
          outputTokens: chunk.usage.completion_tokens ?? 0,
          cachedTokens:
            (chunk.usage as OpenAI.Completions.CompletionUsage & {
              prompt_tokens_details?: { cached_tokens?: number };
            }).prompt_tokens_details?.cached_tokens ?? 0,
          costMicros: 0,
        };
      }
    }

    for (const v of toolAcc.values()) {
      if (!v.id || !v.name) continue;
      let parsed: unknown;
      try { parsed = JSON.parse(v.args || "{}"); } catch { parsed = {}; }
      yield { kind: "tool-call-end", toolCallId: v.id, toolName: v.name, finalInput: parsed };
    }

    // finish_reason=length means the model hit max_completion_tokens. On
    // reasoning models this can happen mid-thinking, returning zero visible
    // tokens. Surface it so the route can log it and the client can show a
    // helpful error instead of an empty bubble.
    if (finishReason === "length") {
      yield { kind: "flag", reason: "openai-max-completion-tokens-exhausted" };
    }

    if (usage) {
      // OpenAI counts cached tokens within prompt_tokens; subtract so our cost calc doesn't double-count.
      const nonCachedIn = Math.max(0, usage.inputTokens - usage.cachedTokens);
      yield { kind: "usage", usage: { ...usage, inputTokens: nonCachedIn } };
    }
    yield { kind: "stop" };
  }

  async classify(model: string, system: string, user: string, labels: ClassifierLabel[]): Promise<ClassifierLabel> {
    const res = await this.client.chat.completions.create({
      model, max_completion_tokens: 16,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const text = (res.choices?.[0]?.message?.content ?? "").trim().toLowerCase();
    return labels.find((l) => text.includes(l)) ?? "conceptual-explain";
  }
}

function toOpenAIMessages(system: string, messages: NeutralMessage[]) {
  const out: Array<Record<string, unknown>> = [];
  if (system) out.push({ role: "system", content: system });
  for (const m of messages) {
    if (m.role === "user") {
      const toolResults = m.content.filter((c): c is Extract<NeutralContent, { type: "tool_result" }> => c.type === "tool_result");
      const texts = m.content.filter((c): c is Extract<NeutralContent, { type: "text" }> => c.type === "text");
      if (toolResults.length) {
        for (const t of toolResults) {
          out.push({ role: "tool", tool_call_id: t.tool_use_id, content: t.content });
        }
      }
      if (texts.length) {
        out.push({ role: "user", content: texts.map((t) => t.text).join("\n") });
      }
    } else {
      const text = m.content.filter((c) => c.type === "text").map((c) => (c as { text: string }).text).join("");
      const toolCalls = m.content
        .filter((c): c is Extract<NeutralContent, { type: "tool_use" }> => c.type === "tool_use")
        .map((c) => ({
          id: c.id, type: "function" as const,
          function: { name: c.name, arguments: JSON.stringify(c.input ?? {}) },
        }));
      const msg: Record<string, unknown> = { role: "assistant" };
      if (text) msg.content = text;
      if (toolCalls.length) msg.tool_calls = toolCalls;
      if (!text && !toolCalls.length) msg.content = "";
      out.push(msg);
    }
  }
  return out;
}

// ───────────────────────── Factory ─────────────────────────

export function getProvider(providerId: ProviderId): LLMProvider {
  if (providerId === "openai") return new OpenAIProvider();
  return new AnthropicProvider();
}

export function getProviderForModel(modelId: string): { provider: LLMProvider; model: ReturnType<typeof findModel> } {
  const model = findModel(modelId);
  return { provider: getProvider(model.provider), model };
}
