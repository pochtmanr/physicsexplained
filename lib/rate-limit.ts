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
 * Extract the best-guess client IP from request headers. Vercel populates
 * x-forwarded-for (client first) and x-real-ip. Falls back to "unknown" so a
 * missing header collapses all such requests into one bucket rather than
 * silently disabling the limit.
 */
export function getClientIp(h: Headers): string {
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
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
 * the site down, and other layers (WAF, per-user quota, Turnstile) still apply.
 */
export async function enforceIpRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const { routeKey, max, windowMs } = opts;
  const ipHash = opts.ipHash ?? hashIp(opts.ip ?? "unknown");
  const retryAfterSeconds = Math.ceil(windowMs / 1000);

  try {
    const db = getServiceClient();
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
