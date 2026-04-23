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

  it("createOrder posts to /1.0/orders and returns public_id + id", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "ord_123", public_id: "pub_abc", state: "pending" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { createOrder } = await import("@/lib/billing/revolut");
    const res = await createOrder({
      amountCents: 1200,
      currency: "USD",
      externalRef: "ext-1",
      customer: { email: "a@b.com", fullName: "A B" },
      savePaymentMethod: true,
    });

    expect(res.id).toBe("ord_123");
    expect(res.publicId).toBe("pub_abc");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://sandbox-merchant.revolut.com/api/1.0/orders");
    expect(init.headers.Authorization).toBe("Bearer sk_test_xx");
    expect(init.headers["Content-Type"]).toBe("application/json");
    const body = JSON.parse(init.body);
    expect(body.amount).toBe(1200);
    expect(body.currency).toBe("USD");
    expect(body.save_payment_method_for).toBe("customer");
    expect(body.merchant_order_ext_ref).toBe("ext-1");
  });

  it("chargeToken posts an order with payment_method.token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "ord_456", public_id: "pub_def", state: "pending" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { chargeToken } = await import("@/lib/billing/revolut");
    await chargeToken({ amountCents: 3500, currency: "USD", externalRef: "ext-2", token: "tok_x" });
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
    const valid = "v1=" + createHmac("sha256", "whsec_shared").update(body).digest("hex");
    const { verifyWebhook } = await import("@/lib/billing/revolut");
    expect(verifyWebhook(body, valid)).toBe(true);
    expect(verifyWebhook(body, "v1=deadbeef")).toBe(false);
    expect(verifyWebhook(body, "")).toBe(false);
  });
});
