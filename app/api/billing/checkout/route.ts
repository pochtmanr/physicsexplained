import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getSsrClient, getServiceClient } from "@/lib/supabase-server";
import { getPlan, type PlanId } from "@/lib/billing/plans";
import { createOrder } from "@/lib/billing/revolut";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ plan: z.enum(["starter", "pro"]) });

// M3: dedupe window — if the same user already has a pending order created
// within this window, return it instead of hitting Revolut again.
const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  const ssr = await getSsrClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  let body: z.infer<typeof Body>;
  try { body = Body.parse(await req.json()); }
  catch (e) { return NextResponse.json({ error: "BAD_REQUEST", message: (e as Error).message }, { status: 400 }); }

  const plan = getPlan(body.plan as PlanId);
  const svc = getServiceClient();

  // M3: look for an existing pending order for this user + plan within
  // the dedupe window. Concurrent clicks / double-submits should land on
  // the same Revolut session rather than create duplicate pending orders.
  const sinceIso = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString();
  const { data: existing } = await svc
    .from("billing_orders")
    .select("revolut_order_id,revolut_public_id,plan,amount_cents")
    .eq("user_id", user.id)
    .eq("state", "pending")
    .eq("plan", plan.id)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.revolut_order_id && existing.revolut_public_id) {
    return NextResponse.json({
      publicId: existing.revolut_public_id,
      orderId: existing.revolut_order_id,
      plan: existing.plan,
      amountCents: existing.amount_cents,
      deduped: true,
    });
  }

  const externalRef = `user:${user.id}:${randomUUID()}`;

  let order;
  try {
    order = await createOrder({
      amountCents: plan.priceCents,
      currency: "USD",
      externalRef,
      customer: {
        email: user.email ?? "",
        fullName: (user.user_metadata?.full_name as string | undefined) ?? undefined,
      },
      savePaymentMethod: true,
    });
  } catch (e) {
    console.error("[billing/checkout] Revolut createOrder failed:", e);
    return NextResponse.json(
      { error: "REVOLUT_ERR", message: (e as Error).message },
      { status: 502 },
    );
  }

  const { error } = await svc.from("billing_orders").insert({
    user_id: user.id,
    revolut_order_id: order.id,
    revolut_public_id: order.publicId,
    plan: plan.id,
    amount_cents: plan.priceCents,
    currency: "USD",
    state: "pending",
  });
  if (error) return NextResponse.json({ error: "DB_ERR", message: error.message }, { status: 500 });

  return NextResponse.json({
    publicId: order.publicId,
    orderId: order.id,
    plan: plan.id,
    amountCents: plan.priceCents,
  });
}
