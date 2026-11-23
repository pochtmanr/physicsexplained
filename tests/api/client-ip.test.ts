import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase-server", () => ({ getServiceClient: () => { throw new Error("not used"); } }));
import { getClientIp } from "@/lib/rate-limit";

const h = (init: Record<string, string>) => new Headers(init);

describe("getClientIp", () => {
  it("prefers X-Real-IP, which the proxy sets from the socket address", () => {
    expect(getClientIp(h({ "x-real-ip": "203.0.113.9", "x-forwarded-for": "1.2.3.4" }))).toBe("203.0.113.9");
  });

  it("uses the last X-Forwarded-For hop, not the client-supplied first one", () => {
    expect(getClientIp(h({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("collapses requests with no proxy headers into one bucket", () => {
    expect(getClientIp(h({}))).toBe("unknown");
  });
});
