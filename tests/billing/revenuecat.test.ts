import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  entitlementToPlan,
  reconcileFromEvent,
  parseRevenueCatEvent,
  type RCEvent,
  type RCEventType,
} from "@/lib/billing/revenuecat";
import type { RawBilling } from "@/lib/billing/snapshot";
import { allowanceFor } from "@/lib/billing/plans";

const NOW = new Date("2026-07-21T00:00:00.000Z");
const EXPIRY_MS = Date.UTC(2026, 7, 21); // 2026-08-21
const UID = "11111111-1111-4111-8111-111111111111";

function currentRow(over: Partial<RawBilling & { provider: string }> = {}): RawBilling & { provider: string } {
  return {
    plan: "free",
    status: "active",
    provider: "revolut",
    tokens_allowance: 0,
    tokens_used: 0,
    free_questions_used: 0,
    cycle_end: "2026-07-01T00:00:00.000Z",
    next_charge_at: null,
    canceled_at: null,
    ...over,
  };
}

function event(type: RCEventType, over: Partial<RCEvent> = {}): RCEvent {
  return {
    id: "evt_1",
    type,
    appUserId: UID,
    entitlementIds: ["pro"],
    expirationAtMs: EXPIRY_MS,
    environment: "PRODUCTION",
    ...over,
  };
}

describe("entitlementToPlan", () => {
  it("pro wins over starter", () => {
    expect(entitlementToPlan(["pro", "starter"])).toBe("pro");
  });
  it("starter when only starter", () => {
    expect(entitlementToPlan(["starter"])).toBe("starter");
  });
  it("free when none active", () => {
    expect(entitlementToPlan([])).toBe("free");
  });
  it("ignores unknown entitlements", () => {
    expect(entitlementToPlan(["premium", "starter"])).toBe("starter");
  });
});

describe("reconcileFromEvent", () => {
  it("INITIAL_PURCHASE (pro) → provider apple, pro active, fresh period", () => {
    const mut = reconcileFromEvent(currentRow(), event("INITIAL_PURCHASE"), NOW);
    expect(mut).toMatchObject({
      provider: "apple",
      plan: "pro",
      status: "active",
      tokens_allowance: allowanceFor("pro"),
      tokens_used: 0,
      canceled_at: null,
      next_charge_at: null,
    });
    expect(mut.apple_expires_at).toBe(new Date(EXPIRY_MS).toISOString());
    expect(mut.cycle_end).toBe(new Date(EXPIRY_MS).toISOString());
  });

  it("TRIAL_STARTED is treated as an active period", () => {
    const mut = reconcileFromEvent(currentRow(), event("TRIAL_STARTED", { entitlementIds: ["starter"] }), NOW);
    expect(mut.plan).toBe("starter");
    expect(mut.status).toBe("active");
    expect(mut.tokens_allowance).toBe(allowanceFor("starter"));
  });

  it("RENEWAL resets tokens_used to 0", () => {
    const mut = reconcileFromEvent(
      currentRow({ plan: "pro", provider: "apple", tokens_allowance: allowanceFor("pro"), tokens_used: 1_234_567 }),
      event("RENEWAL"),
      NOW,
    );
    expect(mut.tokens_used).toBe(0);
    expect(mut.status).toBe("active");
  });

  it("CANCELLATION keeps the plan + expiry, sets canceled_at", () => {
    const mut = reconcileFromEvent(
      currentRow({ plan: "pro", provider: "apple", cycle_end: "2026-08-21T00:00:00.000Z" }),
      event("CANCELLATION"),
      NOW,
    );
    expect(mut.status).toBe("canceled");
    expect(mut.canceled_at).toBe(NOW.toISOString());
    // access continues to expiry — plan / cycle_end must not be touched
    expect(mut).not.toHaveProperty("plan");
    expect(mut).not.toHaveProperty("cycle_end");
    expect(mut).not.toHaveProperty("apple_expires_at");
  });

  it("EXPIRATION → free, zero allowance, canceled", () => {
    const mut = reconcileFromEvent(
      currentRow({ plan: "pro", provider: "apple", tokens_allowance: allowanceFor("pro") }),
      event("EXPIRATION"),
      NOW,
    );
    expect(mut).toMatchObject({ plan: "free", status: "canceled", tokens_allowance: 0, tokens_used: 0 });
  });

  it("REFUND → free / canceled", () => {
    const mut = reconcileFromEvent(currentRow({ plan: "pro", provider: "apple" }), event("REFUND"), NOW);
    expect(mut.plan).toBe("free");
    expect(mut.status).toBe("canceled");
  });

  it("BILLING_ISSUE → past_due (live dunning state)", () => {
    const mut = reconcileFromEvent(currentRow({ plan: "pro", provider: "apple" }), event("BILLING_ISSUE"), NOW);
    expect(mut.plan).toBe("free");
    expect(mut.status).toBe("past_due");
  });
});

describe("parseRevenueCatEvent", () => {
  it("parses a well-formed initial_purchase envelope", () => {
    const parsed = parseRevenueCatEvent({
      event: {
        id: "evt_9",
        type: "INITIAL_PURCHASE",
        app_user_id: UID,
        entitlement_ids: ["pro"],
        expiration_at_ms: EXPIRY_MS,
        environment: "PRODUCTION",
      },
    });
    expect(parsed).toMatchObject({ id: "evt_9", type: "INITIAL_PURCHASE", appUserId: UID, environment: "PRODUCTION" });
    expect(parsed?.entitlementIds).toEqual(["pro"]);
  });

  it("tolerates the nested app.environment shape and string expiry", () => {
    const parsed = parseRevenueCatEvent({
      event: {
        id: "evt_10",
        type: "RENEWAL",
        original_app_user_id: UID,
        entitlement_id: "starter",
        expiration_at_ms: String(EXPIRY_MS),
        app: { environment: "SANDBOX" },
      },
    });
    expect(parsed?.environment).toBe("SANDBOX");
    expect(parsed?.entitlementIds).toEqual(["starter"]);
    expect(parsed?.expirationAtMs).toBe(EXPIRY_MS);
  });

  it("returns null for unhandled event types", () => {
    expect(parseRevenueCatEvent({ event: { id: "e", type: "TEST", app_user_id: UID } })).toBeNull();
  });

  it("returns null when id or app_user_id is missing", () => {
    expect(parseRevenueCatEvent({ event: { type: "RENEWAL", app_user_id: UID } })).toBeNull();
    expect(parseRevenueCatEvent({ event: { id: "e", type: "RENEWAL" } })).toBeNull();
  });
});

// --- Route-level: auth + environment gate ------------------------------------
const { getServiceClient } = vi.hoisted(() => ({ getServiceClient: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase-server", () => ({ getServiceClient }));

import { POST } from "@/app/api/billing/revenuecat/route";

function makeReq(body: unknown, auth?: string): Request {
  return new Request("http://localhost/api/billing/revenuecat", {
    method: "POST",
    headers: { "content-type": "application/json", ...(auth ? { authorization: auth } : {}) },
    body: JSON.stringify(body),
  });
}

describe("POST /api/billing/revenuecat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REVENUECAT_WEBHOOK_AUTH = "test-secret";
    process.env.REVENUECAT_ENV = "production";
  });

  it("401s on a missing Authorization header", async () => {
    const res = await POST(makeReq({ event: {} }));
    expect(res.status).toBe(401);
    expect(getServiceClient).not.toHaveBeenCalled();
  });

  it("401s on a wrong Authorization header", async () => {
    const res = await POST(makeReq({ event: {} }, "wrong-secret"));
    expect(res.status).toBe(401);
    expect(getServiceClient).not.toHaveBeenCalled();
  });

  it("500s when the webhook secret is not configured", async () => {
    delete process.env.REVENUECAT_WEBHOOK_AUTH;
    const res = await POST(makeReq({ event: {} }, "anything"));
    expect(res.status).toBe(500);
  });

  it("skips (200) a SANDBOX event on a production deployment without touching the DB", async () => {
    const res = await POST(
      makeReq(
        {
          event: {
            id: "evt_sb",
            type: "INITIAL_PURCHASE",
            app_user_id: UID,
            entitlement_ids: ["pro"],
            expiration_at_ms: EXPIRY_MS,
            environment: "SANDBOX",
          },
        },
        "test-secret",
      ),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, skipped: true });
    expect(getServiceClient).not.toHaveBeenCalled();
  });
});
