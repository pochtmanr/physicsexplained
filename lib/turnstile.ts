import "server-only";

/**
 * Cloudflare Turnstile server-side verification.
 *
 * Used to gate public, unauthenticated forms (contact, email signup) against
 * bots. Supabase Auth verifies its own Turnstile token internally once CAPTCHA
 * is enabled in the dashboard, so the auth flow only needs to *pass* the token
 * (see app/actions/auth.ts) — it does not call this helper.
 *
 * Fails OPEN when TURNSTILE_SECRET_KEY is unset so the site keeps working before
 * the keys are provisioned. Once the secret is set, a missing/invalid token is
 * rejected.
 */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileResult {
  ok: boolean;
  /** Why verification failed, for logging. Absent on success / when disabled. */
  reason?: string;
}

export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(token: string, ip?: string): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Not configured yet → allow, so forms keep working during rollout.
  if (!secret) return { ok: true };

  if (!token) return { ok: false, reason: "missing-token" };

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);

    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      // Don't let a slow Cloudflare round-trip hang the request indefinitely.
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.error(`[turnstile] siteverify HTTP ${res.status}`);
      // Network/Cloudflare issue → fail open rather than lock out real users.
      return { ok: true, reason: `siteverify-http-${res.status}` };
    }

    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (data.success) return { ok: true };

    return { ok: false, reason: (data["error-codes"] ?? ["unknown"]).join(",") };
  } catch (err) {
    console.error("[turnstile] verify error:", err);
    // Timeout / fetch failure → fail open.
    return { ok: true, reason: "verify-exception" };
  }
}
