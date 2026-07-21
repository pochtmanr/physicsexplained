import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getServiceClient } from "@/lib/supabase-server";
import { parseRevenueCatEvent } from "@/lib/billing/revenuecat";
import { applyRevenueCatEvent } from "@/lib/billing/db-port";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RevenueCat → Apple IAP webhook. Reconciles into the same user_billing table
// the Revolut web webhook writes. Auth is a shared secret RevenueCat sends
// verbatim in the Authorization header (not a Supabase session — middleware
// leaves /api/billing/* untouched). RevenueCat retries hard on any 5xx, so
// unknown subscribers and redelivered events return 200, never 5xx.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function authOk(header: string | null, secret: string): boolean {
  if (!header) return false;
  const a = new TextEncoder().encode(header);
  const b = new TextEncoder().encode(secret);
  // timingSafeEqual throws on length mismatch — guard first (the length itself
  // is not secret).
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const secret = process.env.REVENUECAT_WEBHOOK_AUTH;
  if (!secret) {
    // Fail loud like the Revolut route does on a missing verification secret —
    // a misconfigured deployment must not silently accept unauthenticated posts.
    console.error("[billing/revenuecat] REVENUECAT_WEBHOOK_AUTH is not set");
    return NextResponse.json({ error: "MISCONFIGURED" }, { status: 500 });
  }

  if (!authOk(req.headers.get("authorization"), secret)) {
    console.warn("[billing/revenuecat] authorization header mismatch");
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }

  const raw = await req.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "BAD_JSON" }, { status: 400 });
  }

  const event = parseRevenueCatEvent(parsed);
  if (!event) return NextResponse.json({ ok: true, skipped: true });

  // Environment gate: a sandbox event must never mutate a production row (and
  // vice-versa). Default deployment env is production.
  const wantEnv = (process.env.REVENUECAT_ENV ?? "production").toLowerCase() === "sandbox"
    ? "SANDBOX"
    : "PRODUCTION";
  if (event.environment !== wantEnv) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // app_user_id is the Supabase user id (iOS calls Purchases.logIn(uid)). A
  // non-uuid subscriber is not one of ours — skip without logging PII.
  if (!UUID_RE.test(event.appUserId)) {
    console.warn("[billing/revenuecat] non-uuid app_user_id", { type: event.type });
    return NextResponse.json({ ok: true, skipped: true });
  }

  const outcome = await applyRevenueCatEvent(getServiceClient(), {
    appUserId: event.appUserId,
    event,
    now: new Date(),
  });

  if (outcome === "unknown") {
    // Unknown subscriber — 200 so RevenueCat does not storm us with retries.
    console.warn("[billing/revenuecat] no billing row for subscriber", { type: event.type });
    return NextResponse.json({ ok: true, skipped: true });
  }
  if (outcome === "duplicate") {
    return NextResponse.json({ ok: true, deduped: true });
  }

  return NextResponse.json({ ok: true });
}
