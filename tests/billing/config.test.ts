import { describe, it, expect, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("revolut config", () => {
  const save = { ...process.env };
  afterEach(() => {
    for (const k of Object.keys(process.env)) delete process.env[k];
    Object.assign(process.env, save);
    vi.resetModules();
  });

  it("selects sandbox base when REVOLUT_ENV=sandbox", async () => {
    process.env.REVOLUT_ENV = "sandbox";
    process.env.REVOLUT_API_KEY = "sk_test_xx";
    process.env.REVOLUT_WEBHOOK_SECRET = "wsk_xx";
    const { getRevolutConfig } = await import("@/lib/billing/config");
    const cfg = getRevolutConfig();
    expect(cfg.apiBase).toBe("https://sandbox-merchant.revolut.com/api");
    expect(cfg.env).toBe("sandbox");
  });

  it("selects production base when REVOLUT_ENV=production", async () => {
    process.env.REVOLUT_ENV = "production";
    process.env.REVOLUT_API_KEY = "sk_live_xx";
    process.env.REVOLUT_WEBHOOK_SECRET = "wsk_xx";
    const { getRevolutConfig } = await import("@/lib/billing/config");
    const cfg = getRevolutConfig();
    expect(cfg.apiBase).toBe("https://merchant.revolut.com/api");
    expect(cfg.env).toBe("production");
  });

  it("throws with a clear message when a required var is missing", async () => {
    process.env.REVOLUT_ENV = "sandbox";
    delete process.env.REVOLUT_API_KEY;
    const { getRevolutConfig } = await import("@/lib/billing/config");
    expect(() => getRevolutConfig()).toThrow(/REVOLUT_API_KEY/);
  });
});
