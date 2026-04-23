import { describe, it, expect } from "vitest";
import { runPipeline } from "@/lib/ask/pipeline";
import type { AnswerRequest, LLMProvider, StreamDelta } from "@/lib/ask/provider";
import type { ClassifierLabel } from "@/lib/ask/types";

// Scripted provider: hop 1 emits text + a tool_use (in that order, to prove
// text_delta is forwarded before tool-call-end). Hop 2 emits only text and
// stops. Lets us assert the pipeline doesn't buffer text behind tools.
function makeProvider(): LLMProvider {
  let hop = 0;
  return {
    async *streamAnswer(_req: AnswerRequest): AsyncIterable<StreamDelta> {
      hop++;
      if (hop === 1) {
        yield { kind: "text-delta", text: "Let me " };
        yield { kind: "text-delta", text: "check the site. " };
        yield { kind: "tool-call-start", toolCallId: "t1", toolName: "searchSiteContent" };
        yield { kind: "tool-call-end", toolCallId: "t1", toolName: "searchSiteContent", finalInput: { q: "gravity" } };
        yield { kind: "usage", usage: { model: "test", inputTokens: 1, outputTokens: 1, cachedTokens: 0, costMicros: 0 } };
        yield { kind: "stop" };
      } else {
        yield { kind: "text-delta", text: "Gravity is a fundamental force." };
        yield { kind: "usage", usage: { model: "test", inputTokens: 1, outputTokens: 1, cachedTokens: 0, costMicros: 0 } };
        yield { kind: "stop" };
      }
    },
    async classify(_m: string, _s: string, _u: string, _l: ClassifierLabel[]): Promise<ClassifierLabel> {
      return "conceptual-explain";
    },
  };
}

describe("runPipeline event ordering", () => {
  it("emits text deltas before the tool-call-end for the same hop", async () => {
    const emitted: Array<{ type: string; [k: string]: unknown }> = [];
    const provider = makeProvider();

    const toolset: Record<string, (args: unknown) => Promise<unknown>> = {
      searchSiteContent: async () => ({ hits: [] }),
    };

    for await (const chunk of runPipeline({
      provider,
      classifierModel: "test",
      answererModel: "test",
      toc: { scenes: [] },
      toolset,
      history: [],
      systemTail: "",
    }, "explain gravity")) {
      emitted.push(chunk);
    }

    const kinds = emitted.map((e) => e.type);
    const firstText = kinds.indexOf("text");
    const firstToolEnd = kinds.indexOf("tool-call-end");
    expect(firstText).toBeGreaterThanOrEqual(0);
    expect(firstToolEnd).toBeGreaterThan(firstText);

    // And a final usage + done is emitted exactly once.
    expect(kinds.filter((k) => k === "usage").length).toBe(1);
    expect(kinds.filter((k) => k === "done").length).toBe(1);
  });

  it("runs multiple tool calls concurrently within one hop", async () => {
    const order: string[] = [];
    const slowStart = Date.now();
    const toolset: Record<string, (args: unknown) => Promise<unknown>> = {
      slow: async () => {
        order.push("slow-start");
        await new Promise((r) => setTimeout(r, 50));
        order.push("slow-end");
        return { ok: true };
      },
      fast: async () => {
        order.push("fast-start");
        order.push("fast-end");
        return { ok: true };
      },
    };

    const provider: LLMProvider = {
      async *streamAnswer(_req: AnswerRequest): AsyncIterable<StreamDelta> {
        // First hop: two parallel tool calls.
        yield { kind: "tool-call-start", toolCallId: "a", toolName: "slow" };
        yield { kind: "tool-call-start", toolCallId: "b", toolName: "fast" };
        yield { kind: "tool-call-end", toolCallId: "a", toolName: "slow", finalInput: {} };
        yield { kind: "tool-call-end", toolCallId: "b", toolName: "fast", finalInput: {} };
        yield { kind: "usage", usage: { model: "t", inputTokens: 0, outputTokens: 0, cachedTokens: 0, costMicros: 0 } };
        yield { kind: "stop" };
      },
      async classify() { return "conceptual-explain" as const; },
    };

    const consumed: Array<{ type: string }> = [];
    for await (const chunk of runPipeline({
      provider, classifierModel: "t", answererModel: "t",
      toc: { scenes: [] }, toolset, history: [], systemTail: "",
    }, "go")) {
      consumed.push(chunk);
      // Only consume the first hop; after both tool results go back, the
      // scripted provider would loop forever, so we break early.
      if (chunk.type === "tool-call-end" && (chunk as { toolCallId?: string }).toolCallId === "b") break;
    }

    // Parallel execution means fast-start fires before slow-end.
    const slowEndAt = order.indexOf("slow-end");
    const fastStartAt = order.indexOf("fast-start");
    expect(fastStartAt).toBeLessThan(slowEndAt);
    expect(Date.now() - slowStart).toBeLessThan(200); // well under serial 2x50ms
  });
});
