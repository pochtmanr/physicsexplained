import type { PlanId } from "./plans";

export type WebhookEventType = "ORDER_COMPLETED" | "ORDER_FAILED" | "ORDER_CANCELLED" | "UNKNOWN";

export interface WebhookEvent {
  type: WebhookEventType;
  orderId: string;
  externalRef: string;
  payload: {
    customer_id?: string;
    payment_method_token?: string;
  };
}

export interface DbPort {
  getOrder(orderId: string): Promise<{ user_id: string; plan: PlanId; state: string } | null>;
  updateOrderState(orderId: string, state: "completed" | "failed" | "refunded"): Promise<void>;
  activatePlan(args: {
    userId: string;
    plan: PlanId;
    revolutCustomerId?: string;
    revolutToken?: string;
  }): Promise<void>;
  markPastDue(userId: string): Promise<void>;
}

export async function applyWebhookEvent(event: WebhookEvent, db: DbPort): Promise<void> {
  const order = await db.getOrder(event.orderId);
  if (!order) return;

  if (event.type === "ORDER_COMPLETED") {
    if (order.state === "completed") return;
    await db.updateOrderState(event.orderId, "completed");
    await db.activatePlan({
      userId: order.user_id,
      plan: order.plan,
      revolutCustomerId: event.payload.customer_id,
      revolutToken: event.payload.payment_method_token,
    });
    return;
  }

  if (event.type === "ORDER_FAILED" || event.type === "ORDER_CANCELLED") {
    // Success wins: if the order already settled as completed, never flip
    // it to failed / past_due (guards against out-of-order or replayed
    // FAILED/CANCELLED events arriving after a COMPLETED).
    if (order.state === "completed") return;
    if (order.state === "failed") return;
    await db.updateOrderState(event.orderId, "failed");
    await db.markPastDue(order.user_id);
  }
}

export function parseRevolutEvent(raw: unknown): WebhookEvent | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const typeStr = String(r.event ?? "");
  const order = (r.order_id ?? (r.order as Record<string, unknown> | undefined)?.id) as string | undefined;
  if (!order) return null;
  const orderObj = (r.order as Record<string, unknown> | undefined) ?? {};
  const externalRef = String((orderObj.merchant_order_ext_ref ?? r.merchant_order_ext_ref) ?? "");
  const type: WebhookEventType =
    typeStr === "ORDER_COMPLETED" ? "ORDER_COMPLETED"
    : typeStr === "ORDER_FAILED" ? "ORDER_FAILED"
    : typeStr === "ORDER_CANCELLED" ? "ORDER_CANCELLED"
    : "UNKNOWN";
  const pm = orderObj.payment_method as Record<string, unknown> | undefined;
  return {
    type,
    orderId: order,
    externalRef,
    payload: {
      customer_id: (orderObj.customer_id as string | undefined) ?? (r.customer_id as string | undefined),
      payment_method_token: pm?.id as string | undefined,
    },
  };
}
