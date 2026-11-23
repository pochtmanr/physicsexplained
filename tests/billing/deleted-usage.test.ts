import { beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { rememberFreeUsage, restoreFreeUsage } from "@/lib/billing/deleted-usage";

/** Minimal in-memory stand-in for the two tables the helper touches. */
function fakeDb() {
  const tombstones = new Map<string, { identity_hash: string; free_questions_used: number; cycle_end: string }>();
  const billing: Record<string, { plan: string; free_questions_used: number; cycle_end: string }> = {};
  const from = (table: string) => {
    const filters: Array<[string, string, string]> = [];
    let op: "select" | "delete" | "update" = "select";
    let patch: Record<string, unknown> = {};
    const run = () => {
      if (table === "deleted_account_usage") {
        const match = [...tombstones.values()].filter((r) =>
          filters.every(([kind, col, val]) =>
            kind === "eq" ? (r as Record<string, unknown>)[col] === val : String((r as Record<string, unknown>)[col]) <= val));
        if (op === "delete") match.forEach((r) => tombstones.delete(r.identity_hash));
        return { data: match[0] ?? null, error: null };
      }
      const userId = filters.find(([, col]) => col === "user_id")?.[2];
      const planOk = filters.every(([, col, val]) => col !== "plan" || billing[userId!]?.plan === val);
      if (op === "update" && userId && billing[userId] && planOk) Object.assign(billing[userId], patch);
      return { data: null, error: null };
    };
    const b: Record<string, unknown> = {
      select: () => b,
      delete: () => { op = "delete"; return b; },
      update: (p: Record<string, unknown>) => { op = "update"; patch = p; return b; },
      upsert: async (r: { identity_hash: string; free_questions_used: number; cycle_end: string }) => { tombstones.set(r.identity_hash, r); return { error: null }; },
      eq: (c: string, v: string) => { filters.push(["eq", c, v]); return b; },
      lte: (c: string, v: string) => { filters.push(["lte", c, v]); return b; },
      maybeSingle: async () => run(),
      then: (resolve: (v: unknown) => void) => resolve(run()),
    };
    return b;
  };
  return { db: { from } as unknown as SupabaseClient, tombstones, billing };
}

const NOW = new Date("2026-11-23T10:00:00Z");
const CYCLE_END = "2026-12-10T00:00:00.000Z";

describe("free usage across account deletion", () => {
  beforeEach(() => { process.env.IP_PEPPER = "test-pepper"; });

  it("carries used questions and the reset date to a new account with the same email", async () => {
    const { db, tombstones, billing } = fakeDb();
    await rememberFreeUsage(db, "Student@Example.com ", { plan: "free", free_questions_used: 3, cycle_end: CYCLE_END }, NOW);
    expect(tombstones.size).toBe(1);
    expect([...tombstones.keys()][0]).not.toContain("example.com");

    billing["new-user"] = { plan: "free", free_questions_used: 0, cycle_end: "2026-12-23T10:00:00.000Z" };
    const carried = await restoreFreeUsage(db, "new-user", "student@example.com", NOW);
    expect(carried).toEqual({ free_questions_used: 3, cycle_end: CYCLE_END });
    expect(billing["new-user"]).toMatchObject({ free_questions_used: 3, cycle_end: CYCLE_END });
    expect(tombstones.size).toBe(0);
  });

  it("keeps nothing for unused, paid or already-lapsed accounts", async () => {
    const { db, tombstones } = fakeDb();
    await rememberFreeUsage(db, "a@example.com", { plan: "free", free_questions_used: 0, cycle_end: CYCLE_END }, NOW);
    await rememberFreeUsage(db, "b@example.com", { plan: "pro", free_questions_used: 2, cycle_end: CYCLE_END }, NOW);
    await rememberFreeUsage(db, "c@example.com", { plan: "free", free_questions_used: 2, cycle_end: "2026-11-01T00:00:00.000Z" }, NOW);
    expect(tombstones.size).toBe(0);
  });

  it("does not carry usage past the reset date, or to a different email", async () => {
    const { db, billing } = fakeDb();
    await rememberFreeUsage(db, "student@example.com", { plan: "free", free_questions_used: 3, cycle_end: CYCLE_END }, NOW);
    billing["u"] = { plan: "free", free_questions_used: 0, cycle_end: "x" };
    expect(await restoreFreeUsage(db, "u", "someone-else@example.com", NOW)).toBeNull();
    expect(await restoreFreeUsage(db, "u", "student@example.com", new Date("2026-12-11T00:00:00Z"))).toBeNull();
    expect(billing["u"].free_questions_used).toBe(0);
  });

  it("does nothing without a pepper", async () => {
    delete process.env.IP_PEPPER; delete process.env.CONTACT_IP_PEPPER;
    const { db, tombstones } = fakeDb();
    await rememberFreeUsage(db, "student@example.com", { plan: "free", free_questions_used: 3, cycle_end: CYCLE_END }, NOW);
    expect(tombstones.size).toBe(0);
  });
});
