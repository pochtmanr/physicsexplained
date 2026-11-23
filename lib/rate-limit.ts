import "server-only";
import { createHash } from "node:crypto";
import { getServiceClient } from "@/lib/supabase-server";

/**
 * Per-IP sliding-window rate limiting for anonymous / expensive endpoints.
 *
 * Generalizes the pattern originally inlined in app/actions/contact.ts. The raw
 * IP never touches the DB — only a salted SHA-256 hash — so we can throttle
 * abusers without retaining PII. Backed by the `request_rate_limits` table
 * (migration 0011); writes/reads go through the service-role client.
 */

/**
 * Client IP as seen by the reverse proxy. nginx sets X-Real-IP to the socket
 * address and overwrites X-Forwarded-For with it (physics-proxy.conf), so
 * X-Real-IP is preferred. If only X-Forwarded-For is present, the LAST entry
 * is used: proxies append, so earlier entries are whatever the client sent.
 * Falls back to "unknown" so a missing header collapses all such requests into
 * one bucket rather than silently disabling the limit.
 */
export function getClientIp(h: Headers): string {
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const hops = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }
  return "unknown";
}

/**
 * Salt + hash an IP. Reuses IP_PEPPER, falling back to the legacy
 * CONTACT_IP_PEPPER so existing deployments keep working without a new env var.
 */
export function hashIp(ip: string): string {
  const pepper = process.env.IP_PEPPER ?? process.env.CONTACT_IP_PEPPER;
  if (!pepper) {
    throw new Error("IP_PEPPER (or CONTACT_IP_PEPPER) is not set");
  }
  return createHash("sha256").update(`${pepper}|${ip}`).digest("hex");
}

/** PostgREST: the function is not in the schema cache (migration not applied). */
const FUNCTION_NOT_FOUND = "PGRST202";

export interface RateLimitOptions {
  /** Logical bucket name, e.g. "ask:stream" or "glossary-batch". */
  routeKey: string;
  /** Max requests allowed within the window for a single IP. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Pre-hashed IP. Pass either this or `ip` (raw). */
  ipHash?: string;
  /** Raw IP; hashed internally if `ipHash` not supplied. */
  ip?: string;
}

export interface RateLimitResult {
  /** True when the request is within the limit and may proceed. */
  ok: boolean;
  /** Requests already seen in the window (including this one when allowed). */
  count: number;
  /** Seconds until the window frees up (best-effort; equals window when blocked). */
  retryAfterSeconds: number;
}

/**
 * Count this IP's recent hits for `routeKey`; if under `max`, record the hit and
 * allow. Fails OPEN on DB error (returns ok) — a rate limiter must never take
 * the site down, and other layers (nginx limit_req, per-user quota, Turnstile)
 * still apply.
 *
 * Uses the `rate_limit_hit` database function (migration 0016), which counts
 * and records in one serialised call. Until that migration is applied the
 * function does not exist, and this falls back to a separate count and insert,
 * which parallel requests can slip through.
 */
export async function enforceIpRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const { routeKey, max, windowMs } = opts;
  const ipHash = opts.ipHash ?? hashIp(opts.ip ?? "unknown");
  const retryAfterSeconds = Math.ceil(windowMs / 1000);

  try {
    const db = getServiceClient();

    const rpc = await db.rpc("rate_limit_hit", {
      p_route_key: routeKey,
      p_ip_hash: ipHash,
      p_max: max,
      p_window_seconds: retryAfterSeconds,
    });
    if (!rpc.error) {
      const row = (Array.isArray(rpc.data) ? rpc.data[0] : rpc.data) as { allowed?: boolean; hits?: number } | null;
      if (row && typeof row.allowed === "boolean") {
        return { ok: row.allowed, count: row.hits ?? 0, retryAfterSeconds };
      }
    } else if (rpc.error.code !== FUNCTION_NOT_FOUND) {
      console.error(`[rate-limit] rate_limit_hit failed for ${routeKey}:`, rpc.error.message);
      return { ok: true, count: 0, retryAfterSeconds };
    }

    const windowStart = new Date(Date.now() - windowMs).toISOString();

    const { count, error } = await db
      .from("request_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("route_key", routeKey)
      .eq("ip_hash", ipHash)
      .gte("created_at", windowStart);

    if (error) {
      console.error(`[rate-limit] count failed for ${routeKey}:`, error.message);
      return { ok: true, count: 0, retryAfterSeconds };
    }

    const current = count ?? 0;
    if (current >= max) {
      return { ok: false, count: current, retryAfterSeconds };
    }

    // Record this hit. Best-effort: a failed insert must not block the request.
    const { error: insertError } = await db
      .from("request_rate_limits")
      .insert({ route_key: routeKey, ip_hash: ipHash });
    if (insertError) {
      console.error(`[rate-limit] insert failed for ${routeKey}:`, insertError.message);
    }

    return { ok: true, count: current + 1, retryAfterSeconds };
  } catch (err) {
    console.error(`[rate-limit] unexpected error for ${routeKey}:`, err);
    return { ok: true, count: 0, retryAfterSeconds };
  }
}
