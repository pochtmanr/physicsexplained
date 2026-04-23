import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "node:crypto";

vi.mock("server-only", () => ({}));

function setupEnv() {
  process.env.REVOLUT_ENV = "sandbox";
  process.env.REVOLUT_API_KEY = "sk_test_xx";
  process.env.REVOLUT_WEBHOOK_SECRET = "whsec_shared";
  process.env.NEXT_PUBLIC_REVOLUT_PUBLIC_KEY = "pk_test_xx";
}

describe("revolut client", () => {
  beforeEach(() => { setupEnv(); vi.resetModules(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it("createOrder posts to /orders and returns token as publicId", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "ord_123", token: "pub_abc", state: "pending" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { createOrder } = await import("@/lib/billing/revolut");
    const res = await createOrder({
      amountCents: 600,
      currency: "USD",
      externalRef: "ext-1",
      customer: { email: "a@b.com", fullName: "A B" },
      savePaymentMethod: true,
    });

    expect(res.id).toBe("ord_123");
    expect(res.publicId).toBe("pub_abc");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://sandbox-merchant.revolut.com/api/orders");
    expect(init.headers.Authorization).toBe("Bearer sk_test_xx");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers["Revolut-Api-Version"]).toBe("2024-09-01");
    const body = JSON.parse(init.body);
    expect(body.amount).toBe(600);
    expect(body.currency).toBe("USD");
    expect(body.capture_mode).toBe("automatic");
    expect(body.merchant_order_data).toEqual({ reference: "ext-1" });
    expect(body.customer).toEqual({ email: "a@b.com", full_name: "A B" });
  });

  it("chargeToken posts an order with payment_method.token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "ord_456", token: "pub_def", state: "pending" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { chargeToken } = await import("@/lib/billing/revolut");
    await chargeToken({ amountCents: 2000, currency: "USD", externalRef: "ext-2", token: "tok_x" });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.payment_method).toEqual({ type: "token", id: "tok_x" });
  });

  it("throws when Revolut returns non-2xx", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, status: 422, text: async () => "invalid amount",
    }));
    const { createOrder } = await import("@/lib/billing/revolut");
    await expect(createOrder({ amountCents: 0, currency: "USD", externalRef: "x", customer: { email: "a@b.com" } }))
      .rejects.toThrow(/Revolut API 422/);
  });

  it("verifyWebhook accepts valid signature and rejects invalid", async () => {
    const body = '{"event":"ORDER_COMPLETED"}';
    const ts = String(Date.now());
    const signed = `v1.${ts}.${body}`;
    const valid = "v1=" + createHmac("sha256", "whsec_shared").update(signed).digest("hex");
    const { verifyWebhook } = await import("@/lib/billing/revolut");

    expect(verifyWebhook(body, valid, ts).ok).toBe(true);

    // Wrong signature
    expect(verifyWebhook(body, "v1=deadbeef", ts).ok).toBe(false);
    expect(verifyWebhook(body, "v1=deadbeef", ts).error).toBe("BAD_SIGNATURE");

    // Missing signature
    expect(verifyWebhook(body, "", ts).ok).toBe(false);
    expect(verifyWebhook(body, "", ts).error).toBe("MISSING_HEADER");

    // Missing timestamp
    expect(verifyWebhook(body, valid, "").ok).toBe(false);
    expect(verifyWebhook(body, valid, "").error).toBe("MISSING_HEADER");

    // Non-numeric timestamp
    expect(verifyWebhook(body, valid, "notanumber").error).toBe("BAD_TIMESTAMP");

    // Stale timestamp (older than 5 minutes)
    const stale = String(Date.now() - 6 * 60 * 1000);
    const staleSig = "v1=" + createHmac("sha256", "whsec_shared")
      .update(`v1.${stale}.${body}`).digest("hex");
    expect(verifyWebhook(body, staleSig, stale).error).toBe("STALE_TIMESTAMP");

    // Multiple v1 values (key rotation) — match against any
    const rotated = `v1=deadbeef, ${valid}`;
    expect(verifyWebhook(body, rotated, ts).ok).toBe(true);
  });
});
