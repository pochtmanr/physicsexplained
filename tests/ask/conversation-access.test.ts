import { describe, expect, it, vi } from "vitest";
import { userOwnsConversation } from "@/lib/ask/conversation-access";

type Row = { id: string; user_id: string };

/** Minimal stand-in for the supabase query builder used by the helper. */
function fakeDb(rows: Row[], opts: { fail?: boolean } = {}) {
  const from = vi.fn((table: string) => {
    const filters: Record<string, string> = {};
    const builder = {
      select: () => builder,
      eq: (col: string, val: string) => {
        filters[col] = val;
        return builder;
      },
      maybeSingle: async () => {
        if (opts.fail) return { data: null, error: { message: "boom" } };
        if (table !== "ask_conversations") return { data: null, error: null };
        const hit = rows.find(
          (r) => r.id === filters.id && r.user_id === filters.user_id,
        );
        return { data: hit ? { id: hit.id } : null, error: null };
      },
    };
    return builder;
  });
  return { from } as unknown as Parameters<typeof userOwnsConversation>[0];
}

const rows: Row[] = [
  { id: "conv-a", user_id: "alice" },
  { id: "conv-b", user_id: "bob" },
];

describe("userOwnsConversation", () => {
  it("accepts the owner", async () => {
    expect(await userOwnsConversation(fakeDb(rows), "conv-a", "alice")).toBe(true);
  });

  it("rejects another user's conversation", async () => {
    expect(await userOwnsConversation(fakeDb(rows), "conv-b", "alice")).toBe(false);
  });

  it("rejects an unknown conversation id", async () => {
    expect(await userOwnsConversation(fakeDb(rows), "conv-zzz", "alice")).toBe(false);
  });

  it("fails closed on a database error", async () => {
    expect(
      await userOwnsConversation(fakeDb(rows, { fail: true }), "conv-a", "alice"),
    ).toBe(false);
  });
});
