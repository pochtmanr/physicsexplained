import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase-server", () => ({
  getRequestClient: vi.fn(),
  getServiceClient: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({
  enforceIpRateLimit: vi.fn(async () => ({ ok: true })),
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

import { POST } from "@/app/api/ask/stream/route";
import { getRequestClient, getServiceClient } from "@/lib/supabase-server";

const OTHER_USERS_CONVERSATION = "7b0e3c52-6a1f-4c9e-9d55-0f2b8c1a4e77";

/** Records every table touched; the conversation lookup finds nothing for this user. */
function fakeDb() {
  const tables: string[] = [];
  const from = vi.fn((table: string) => {
    tables.push(table);
    const builder: Record<string, unknown> = {};
    for (const m of ["select", "eq", "gte", "lte", "order", "limit", "insert", "update"]) {
      builder[m] = () => builder;
    }
    builder.maybeSingle = async () => ({ data: null, error: null });
    builder.single = async () => ({ data: null, error: null });
    return builder;
  });
  return { db: { from, rpc: vi.fn() }, tables };
}

function makeReq(body: object): Request {
  return new Request("http://localhost/api/ask/stream", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ask/stream — conversation ownership", () => {
  beforeEach(() => {
    process.env.ASK_ENABLED = "true";
    vi.mocked(getRequestClient).mockResolvedValue({ user: { id: "alice" } } as never);
  });

  it("returns 404 for a conversation the caller does not own, before touching anything else", async () => {
    const { db, tables } = fakeDb();
    vi.mocked(getServiceClient).mockReturnValue(db as never);

    const res = await POST(
      makeReq({ conversationId: OTHER_USERS_CONVERSATION, message: "what did they ask?" }),
    );

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "NOT_FOUND" });
    // Only the ownership lookup ran: no messages read, nothing inserted.
    expect(tables).toEqual(["ask_conversations"]);
    expect(db.rpc).not.toHaveBeenCalled();
  });
});
