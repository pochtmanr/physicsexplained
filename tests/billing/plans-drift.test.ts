import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PLANS } from "@/lib/billing/plans";

// H1: the authoritative plan prices live in public.billing_plans (seeded
// in supabase/migrations/0008_billing_plans.sql). The Deno edge function
// billing-renew reads from that table; the Next.js app reads PLANS from
// lib/billing/plans.ts. If the two drift, renewal charges stop matching
// the price users see at checkout.
//
// This test parses the `insert into public.billing_plans` statement and
// asserts each row's amount_cents equals PLANS[plan].priceCents.
describe("plans <-> migration 0008 price drift guard", () => {
  it("priceCents in plans.ts matches amount_cents in billing_plans seed", () => {
    const sql = readFileSync(
      resolve(process.cwd(), "supabase/migrations/0008_billing_plans.sql"),
      "utf8",
    );

    // Extract rows from the `values (...)` block of the insert statement.
    // Matches e.g. ('starter', 600, 'USD').
    const rowRe = /\(\s*'(free|starter|pro)'\s*,\s*(\d+)\s*,\s*'USD'\s*\)/g;
    const seeded: Record<string, number> = {};
    let match: RegExpExecArray | null;
    while ((match = rowRe.exec(sql)) !== null) {
      seeded[match[1]] = Number.parseInt(match[2], 10);
    }

    expect(Object.keys(seeded).sort()).toEqual(["free", "pro", "starter"]);
    expect(seeded.free).toBe(PLANS.free.priceCents);
    expect(seeded.starter).toBe(PLANS.starter.priceCents);
    expect(seeded.pro).toBe(PLANS.pro.priceCents);
  });
});
