import type { SupabaseClient } from "@supabase/supabase-js";

export interface RateLimitDeps {
  getUsage(): Promise<{ message_count: number; tokens_in: number; tokens_out: number } | null>;
  incrementUsage(delta: {
    messages?: number; tokensIn?: number; tokensOut?: number;
    webSearches?: number; fetches?: number; costMicros?: number;
  }): Promise<void>;
  limits: { msgs: number; tokensIn: number; tokensOut: number };
}

export async function checkRateLimit(deps: RateLimitDeps): Promise<{ ok: true } | { ok: false; reason: string }> {
  const row = await deps.getUsage();
  if (!row) return { ok: true };
  if (row.message_count >= deps.limits.msgs) return { ok: false, reason: `Daily message limit reached (${deps.limits.msgs}/day)` };
  if (row.tokens_in >= deps.limits.tokensIn) return { ok: false, reason: "Daily input-token limit reached" };
  if (row.tokens_out >= deps.limits.tokensOut) return { ok: false, reason: "Daily output-token limit reached" };
  return { ok: true };
}

export function makeRateLimitDepsForUser(db: SupabaseClient, userId: string): RateLimitDeps {
  const today = new Date().toISOString().slice(0, 10);
  return {
    async getUsage() {
      const { data } = await db
        .from("ask_usage_daily")
        .select("message_count,tokens_in,tokens_out")
        .eq("user_id", userId).eq("day", today).maybeSingle();
      return data ?? null;
    },
    async incrementUsage(delta) {
      await db.rpc("ask_increment_usage", {
        p_user_id: userId, p_day: today,
        p_messages: delta.messages ?? 0,
        p_tokens_in: delta.tokensIn ?? 0,
        p_tokens_out: delta.tokensOut ?? 0,
        p_web_searches: delta.webSearches ?? 0,
        p_fetches: delta.fetches ?? 0,
        p_cost_micros: delta.costMicros ?? 0,
      });
    },
    limits: {
      msgs: Number(process.env.ASK_RATE_LIMIT_FREE_MSGS ?? 20),
      tokensIn: Number(process.env.ASK_RATE_LIMIT_FREE_TOKENS_IN ?? 60_000),
      tokensOut: Number(process.env.ASK_RATE_LIMIT_FREE_TOKENS_OUT ?? 20_000),
    },
  };
}
