import { NextResponse } from "next/server";
import { getSsrClient, getServiceClient } from "@/lib/supabase-server";
import { retrieveOrder } from "@/lib/billing/revolut";
import { applyWebhookEvent } from "@/lib/billing/webhook-handler";
import { makeDbPort } from "@/lib/billing/db-port";
import { sendReceiptForOrder } from "@/lib/billing/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/billing/orders/:id
//
// Used by the thank-you page to poll order status. Reads the local
// billing_orders row; if still "pending", reconciles with Revolut as a
// fallback in case the webhook is delayed or lost.
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const ssr = await getSsrClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const svc = getServiceClient();
  const { data: row } = await svc
    .from("billing_orders")
    .select("id,user_id,revolut_order_id,plan,amount_cents,currency,state,created_at")
    .eq("revolut_order_id", id)
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (row.user_id !== user.id) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  let state = row.state as "pending" | "completed" | "failed" | "refunded";

  if (state === "pending") {
    try {
      const remote = await retrieveOrder(id);
      const mapped = mapRevolutState(remote.state);
      if (mapped) {
        const port = makeDbPort(svc);
        await applyWebhookEvent(
          {
            type: mapped === "completed" ? "ORDER_COMPLETED" : "ORDER_FAILED",
            orderId: id,
            externalRef: "",
            payload: {
              customer_id: remote.customer_id,
              payment_method_token: remote.payment_method_token,
            },
          },
          port,
        );
        if (mapped === "completed") {
          await sendReceiptForOrder(svc, id).catch((e) => {
            console.error("[billing/orders] receipt email failed:", e);
          });
        }
        state = mapped;
      }
    } catch (e) {
      console.error("[billing/orders] retrieve fallback failed:", e);
    }
  }

  return NextResponse.json({
    orderId: row.revolut_order_id,
    plan: row.plan,
    amountCents: row.amount_cents,
    currency: row.currency,
    state,
    createdAt: row.created_at,
  });
}

function mapRevolutState(s: string): "completed" | "failed" | null {
  if (s === "COMPLETED" || s === "completed") return "completed";
  if (s === "FAILED" || s === "CANCELLED" || s === "failed" || s === "cancelled") return "failed";
  return null;
}
