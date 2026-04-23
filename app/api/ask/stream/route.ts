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
import { checkQuota, type BillingRow } from "@/lib/billing/quota";
import { weightedTokens } from "@/lib/ask/pricing";

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

  // Quota gate (billing) — 402 before streaming
  const { data: billingRow, error: billingErr } = await db
    .from("user_billing")
    .select("plan,status,tokens_allowance,tokens_used,free_questions_used,cycle_end")
    .eq("user_id", user.id)
    .maybeSingle();
  if (billingErr || !billingRow) {
    return NextResponse.json({ error: "DB_ERR", message: billingErr?.message ?? "missing billing row" }, { status: 500 });
  }
  const quota = checkQuota(billingRow as BillingRow);
  if (!quota.ok) {
    return NextResponse.json({ error: "QUOTA_EXHAUSTED", reason: quota.reason }, { status: 402 });
  }

  // Legacy daily analytics rate limit stays in place
  const rl = makeRateLimitDepsForUser(db, user.id);
  const rlRes = await checkRateLimit(rl);
  if (!rlRes.ok) return NextResponse.json({ error: "RATE_LIMITED", reason: rlRes.reason }, { status: 429 });

  let conversationId = body.conversationId ?? undefined;
  if (!conversationId) {
    const initialTitle = makeInitialTitle(body.message);
    const { data, error } = await db
      .from("ask_conversations")
      .insert({ user_id: user.id, locale: body.locale, title: initialTitle })
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
  const upstreamAbort = new AbortController();
  const onClientAbort = () => upstreamAbort.abort();
  req.signal.addEventListener("abort", onClientAbort);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(sseEncode("meta", { conversationId })));

      // Keepalive — SSE comment, ignored by clients, keeps idle LBs from dropping us.
      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(": ping\n\n")); } catch { /* controller closed */ }
      }, 15000);

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
            signal: upstreamAbort.signal,
          },
          body.message,
        )) {
          if (upstreamAbort.signal.aborted) break;
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
          }
          // "done" is emitted below, after DB writes commit, so the client's
          // router.refresh() reads post-increment billing state instead of
          // racing the finally block.
        }
      } catch (e) {
        if (!upstreamAbort.signal.aborted) {
          controller.enqueue(encoder.encode(sseEncode("error", { message: (e as Error).message })));
        }
      } finally {
        clearInterval(heartbeat);
        req.signal.removeEventListener("abort", onClientAbort);
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
            const weighted = weightedTokens(finalUsage.model, finalUsage.inputTokens, finalUsage.outputTokens);
            await db.rpc("billing_increment", {
              p_user_id: user.id,
              p_weighted_tokens: weighted,
              p_is_free: (billingRow as BillingRow).plan === "free",
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
        // Send "done" only after all DB writes (billing_increment in particular)
        // have committed. This guarantees the client's router.refresh() reloads
        // the updated quota counters.
        try { controller.enqueue(encoder.encode(sseEncode("done", { conversationId }))); } catch { /* already closed */ }
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

function makeInitialTitle(message: string): string {
  const clean = message.trim().replace(/\s+/g, " ");
  if (clean.length <= 60) return clean;
  const truncated = clean.slice(0, 57);
  const lastSpace = truncated.lastIndexOf(" ");
  const cut = lastSpace > 30 ? truncated.slice(0, lastSpace) : truncated;
  return `${cut}…`;
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
