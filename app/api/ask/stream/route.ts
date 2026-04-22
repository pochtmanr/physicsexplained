import { NextResponse } from "next/server";
import { z } from "zod";
import { getSsrClient, getServiceClient } from "@/lib/supabase-server";
import { getProviderForModel } from "@/lib/ask/provider";
import { buildToc } from "@/lib/ask/toc";
import { makeToolset } from "@/lib/ask/toolset";
import { braveSearch, fetchAllowlistedUrl } from "@/lib/ask/web-search";
import { runPipeline } from "@/lib/ask/pipeline";
import { assembleHistory } from "@/lib/ask/context";
import { checkRateLimit, makeRateLimitDepsForUser } from "@/lib/ask/rate-limit";
import { sseEncode } from "@/lib/ask/sse";
import { DEFAULT_MODEL_ID, findModel } from "@/lib/ask/types";
import type { NeutralMessage } from "@/lib/ask/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  conversationId: z.string().uuid().nullable().optional(),
  message: z.string().min(1).max(4000),
  locale: z.string().default("en"),
  modelId: z.string().default(DEFAULT_MODEL_ID),
});

export async function POST(req: Request) {
  if (process.env.ASK_ENABLED !== "true") {
    return NextResponse.json({ error: "ASK_DISABLED" }, { status: 503 });
  }

  const ssr = await getSsrClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  let body: z.infer<typeof BodySchema>;
  try { body = BodySchema.parse(await req.json()); }
  catch (e) { return NextResponse.json({ error: "BAD_REQUEST", message: (e as Error).message }, { status: 400 }); }

  const model = findModel(body.modelId);
  const db = getServiceClient();
  const rl = makeRateLimitDepsForUser(db, user.id);
  const rlRes = await checkRateLimit(rl);
  if (!rlRes.ok) return NextResponse.json({ error: "RATE_LIMITED", reason: rlRes.reason }, { status: 429 });

  let conversationId = body.conversationId ?? undefined;
  if (!conversationId) {
    const { data, error } = await db
      .from("ask_conversations")
      .insert({ user_id: user.id, locale: body.locale })
      .select("id").single();
    if (error) return NextResponse.json({ error: "DB_ERR", message: error.message }, { status: 500 });
    conversationId = data.id as string;
  }

  const { data: historyRows } = await db
    .from("ask_messages")
    .select("role,content,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const summaryRow = await db
    .from("ask_conversations")
    .select("summary")
    .eq("id", conversationId)
    .maybeSingle();

  const { systemTail, kept } = assembleHistory(
    (historyRows ?? [])
      .filter((r) => r.role === "user" || r.role === "assistant")
      .map((r) => ({
        role: r.role as "user" | "assistant",
        text: (r.content as { text?: string } | null)?.text ?? "",
      })),
    summaryRow.data?.summary ?? null,
  );

  await db.from("ask_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: { text: body.message },
  });

  const toolsetImpl = makeToolset({
    db, locale: body.locale,
    webSearch: (q, limit) => braveSearch(q, limit),
    fetchUrl: (url) => fetchAllowlistedUrl(url),
  });
  const toolset: Record<string, (args: unknown) => Promise<unknown>> = Object.fromEntries(
    Object.entries(toolsetImpl).map(([k, v]) => [k, v as (args: unknown) => Promise<unknown>])
  );

  const toc = await buildToc(body.locale);
  const { provider } = getProviderForModel(model.id);

  const pipelineHistory: NeutralMessage[] = kept.map((k) => ({
    role: k.role,
    content: [{ type: "text" as const, text: k.text }],
  }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(sseEncode("meta", { conversationId })));
      let assistantText = "";
      let flagged = false;
      let finalUsage: { model: string; inputTokens: number; outputTokens: number; cachedTokens: number; costMicros: number } | null = null;

      try {
        for await (const chunk of runPipeline(
          {
            provider,
            classifierModel: model.classifier,
            answererModel: model.id,
            toc, toolset,
            history: pipelineHistory,
            systemTail,
          },
          body.message,
        )) {
          if (chunk.type === "text") {
            assistantText += chunk.delta;
            controller.enqueue(encoder.encode(sseEncode("text", { delta: chunk.delta })));
          } else if (chunk.type === "tool-call-start") {
            controller.enqueue(encoder.encode(sseEncode("tool-start", { name: chunk.name, id: chunk.toolCallId })));
          } else if (chunk.type === "tool-call-end") {
            controller.enqueue(encoder.encode(sseEncode("tool-end", { id: chunk.toolCallId, ok: chunk.ok })));
          } else if (chunk.type === "flag") {
            flagged = true;
          } else if (chunk.type === "usage") {
            finalUsage = chunk.usage;
          } else if (chunk.type === "done") {
            controller.enqueue(encoder.encode(sseEncode("done", { conversationId })));
          }
        }
      } catch (e) {
        controller.enqueue(encoder.encode(sseEncode("error", { message: (e as Error).message })));
      } finally {
        try {
          if (finalUsage) {
            await db.from("ask_messages").insert({
              conversation_id: conversationId,
              role: "assistant",
              content: { text: assistantText },
              model: finalUsage.model,
              input_tokens: finalUsage.inputTokens,
              output_tokens: finalUsage.outputTokens,
              cached_tokens: finalUsage.cachedTokens,
              cost_usd_micros: finalUsage.costMicros,
              meta: flagged ? { flagged: true } : null,
            });
            await db.rpc("ask_increment_usage", {
              p_user_id: user.id,
              p_day: new Date().toISOString().slice(0, 10),
              p_messages: 1,
              p_tokens_in: finalUsage.inputTokens + finalUsage.cachedTokens,
              p_tokens_out: finalUsage.outputTokens,
              p_web_searches: 0,
              p_fetches: 0,
              p_cost_micros: finalUsage.costMicros,
            });
            await db.from("ask_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);

            // Fire-and-forget title after first exchange
            const { count } = await db
              .from("ask_messages").select("id", { count: "exact", head: true })
              .eq("conversation_id", conversationId);
            if (count === 2) {
              void summarizeTitle(conversationId!, body.message, assistantText, model.classifier, model.provider).catch(() => {});
            }
          }
        } catch {
          // swallow — stream should still close cleanly
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

async function summarizeTitle(
  conversationId: string,
  q: string,
  a: string,
  classifierModel: string,
  providerId: "anthropic" | "openai",
) {
  const db = getServiceClient();
  let title = "";
  try {
    if (providerId === "anthropic") {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const c = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
      const res = await c.messages.create({
        model: classifierModel, max_tokens: 16, temperature: 0,
        system: "Summarize the exchange in ≤6 words. No punctuation except hyphens. No quotes.",
        messages: [{ role: "user", content: `Q: ${q}\nA: ${a.slice(0, 400)}` }],
      });
      title = res.content.map((c) => (c.type === "text" ? c.text : "")).join("").trim();
    } else {
      const { default: OpenAI } = await import("openai");
      const c = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
      const res = await c.chat.completions.create({
        model: classifierModel, max_completion_tokens: 16, temperature: 0,
        messages: [
          { role: "system", content: "Summarize the exchange in ≤6 words. No punctuation except hyphens. No quotes." },
          { role: "user", content: `Q: ${q}\nA: ${a.slice(0, 400)}` },
        ],
      });
      title = res.choices?.[0]?.message?.content?.trim() ?? "";
    }
  } catch { return; }
  title = title.slice(0, 60);
  if (title) await db.from("ask_conversations").update({ title }).eq("id", conversationId);
}
