import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getSsrClient, getServiceClient } from "@/lib/supabase-server";
import { getPlan, type PlanId } from "@/lib/billing/plans";
import { createOrder } from "@/lib/billing/revolut";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ plan: z.enum(["starter", "pro"]) });

export async function POST(req: Request) {
  const ssr = await getSsrClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  let body: z.infer<typeof Body>;
  try { body = Body.parse(await req.json()); }
  catch (e) { return NextResponse.json({ error: "BAD_REQUEST", message: (e as Error).message }, { status: 400 }); }

  const plan = getPlan(body.plan as PlanId);
  const externalRef = `user:${user.id}:${randomUUID()}`;

  const order = await createOrder({
    amountCents: plan.priceCents,
    currency: "USD",
    externalRef,
    customer: {
      email: user.email ?? "",
      fullName: (user.user_metadata?.full_name as string | undefined) ?? undefined,
    },
    savePaymentMethod: true,
  });

  const svc = getServiceClient();
  const { error } = await svc.from("billing_orders").insert({
    user_id: user.id,
    revolut_order_id: order.id,
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
