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
}

export interface StreamDelta {
  kind: "text-delta" | "tool-call-start" | "tool-call-end" | "stop" | "usage";
  toolCallId?: string;
  toolName?: string;
  text?: string;
  finalInput?: unknown;
  usage?: UsageRow;
}

export interface AnswerRequest {
  model: string;
  system: string;
  systemDynamic?: string;
  messages: NeutralMessage[];
  tools?: JsonToolDef[];
  maxTokens: number;
  temperature?: number;
}

export interface LLMProvider {
  streamAnswer(req: AnswerRequest): AsyncIterable<StreamDelta>;
  classify(classifierModel: string, system: string, user: string, labels: ClassifierLabel[]): Promise<ClassifierLabel>;
}

// ───────────────────────── Anthropic adapter ─────────────────────────

class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
    this.client = new Anthropic({ apiKey });
  }

  async *streamAnswer(req: AnswerRequest): AsyncIterable<StreamDelta> {
    const system = [
      { type: "text", text: req.system, cache_control: { type: "ephemeral" } },
      ...(req.systemDynamic ? [{ type: "text", text: req.systemDynamic }] : []),
    ];
    const tools = (req.tools ?? []).map((t) => ({
      name: t.name, description: t.description, input_schema: t.parameters,
    }));

    const stream = this.client.messages.stream({
      model: req.model,
      max_tokens: req.maxTokens,
      temperature: req.temperature ?? 0.3,
      system: system as unknown as Anthropic.Messages.TextBlockParam[],
      tools: tools as unknown as Anthropic.Messages.Tool[],
      messages: req.messages as unknown as Anthropic.Messages.MessageParam[],
    });

    const seenToolUses = new Map<string, string>(); // id -> name
    for await (const ev of stream) {
      if (ev.type === "content_block_start" && ev.content_block.type === "tool_use") {
        seenToolUses.set(ev.content_block.id, ev.content_block.name);
        yield { kind: "tool-call-start", toolCallId: ev.content_block.id, toolName: ev.content_block.name };
      } else if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
        yield { kind: "text-delta", text: ev.delta.text };
      }
    }
    const final = await stream.finalMessage();
    for (const blk of final.content) {
      if (blk.type === "tool_use") {
        yield { kind: "tool-call-end", toolCallId: blk.id, toolName: blk.name, finalInput: blk.input };
      }
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
    this.client = new OpenAI({ apiKey });
  }

  async *streamAnswer(req: AnswerRequest): AsyncIterable<StreamDelta> {
    const systemParts = [req.system, req.systemDynamic].filter(Boolean).join("\n\n");
    const openaiMessages = toOpenAIMessages(systemParts, req.messages);
    const tools = (req.tools ?? []).map((t) => ({
      type: "function" as const,
      function: { name: t.name, description: t.description, parameters: t.parameters as Record<string, unknown> },
    }));

    const stream = await this.client.chat.completions.create({
      model: req.model,
      messages: openaiMessages as unknown as OpenAI.Chat.ChatCompletionMessageParam[],
      tools: tools.length ? tools : undefined,
      max_completion_tokens: req.maxTokens,
      stream: true,
      stream_options: { include_usage: true },
    });

    const toolAcc = new Map<number, { id: string; name: string; args: string }>();
    const emittedStart = new Set<string>();
    let usage: UsageRow | null = null;

    for await (const chunk of stream) {
      const choice = chunk.choices?.[0];
      const delta = choice?.delta;
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

    if (usage) {
      // OpenAI counts cached tokens within prompt_tokens; subtract so our cost calc doesn't double-count.
      const nonCachedIn = Math.max(0, usage.inputTokens - usage.cachedTokens);
      yield { kind: "usage", usage: { ...usage, inputTokens: nonCachedIn } };
    }
    yield { kind: "stop" };
  }

  async classify(model: string, system: string, user: string, labels: ClassifierLabel[]): Promise<ClassifierLabel> {
    const res = await this.client.chat.completions.create({
      model, max_completion_tokens: 16, temperature: 0,
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
