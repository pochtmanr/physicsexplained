import { describe, it, expect, vi } from "vitest";
import { applyWebhookEvent, type WebhookEvent, type DbPort } from "@/lib/billing/webhook-handler";

function makeDb(overrides: Partial<DbPort> = {}): DbPort {
  return {
    getOrder: vi.fn().mockResolvedValue(null),
    updateOrderState: vi.fn().mockResolvedValue(undefined),
    activatePlan: vi.fn().mockResolvedValue(undefined),
    markPastDue: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const completedEvent: WebhookEvent = {
  type: "ORDER_COMPLETED",
  orderId: "ord_1",
  externalRef: "user:u1:xyz",
  payload: { customer_id: "cus_1", payment_method_token: "tok_1" },
};

describe("applyWebhookEvent", () => {
  it("ignores if order not found", async () => {
    const db = makeDb({ getOrder: vi.fn().mockResolvedValue(null) });
    await applyWebhookEvent(completedEvent, db);
    expect(db.activatePlan).not.toHaveBeenCalled();
  });

  it("completes first payment: sets state and activates plan", async () => {
    const db = makeDb({
      getOrder: vi.fn().mockResolvedValue({ user_id: "u1", plan: "starter", state: "pending" }),
    });
    await applyWebhookEvent(completedEvent, db);
    expect(db.updateOrderState).toHaveBeenCalledWith("ord_1", "completed");
    expect(db.activatePlan).toHaveBeenCalledWith({
      userId: "u1", plan: "starter",
      revolutCustomerId: "cus_1", revolutToken: "tok_1",
    });
  });

  it("is idempotent: already-completed order is a no-op", async () => {
    const db = makeDb({
      getOrder: vi.fn().mockResolvedValue({ user_id: "u1", plan: "pro", state: "completed" }),
    });
    await applyWebhookEvent(completedEvent, db);
    expect(db.updateOrderState).not.toHaveBeenCalled();
    expect(db.activatePlan).not.toHaveBeenCalled();
  });

  it("on ORDER_FAILED for a paid user, marks past_due", async () => {
    const db = makeDb({
      getOrder: vi.fn().mockResolvedValue({ user_id: "u1", plan: "pro", state: "pending" }),
    });
    await applyWebhookEvent(
      { type: "ORDER_FAILED", orderId: "ord_1", externalRef: "u", payload: {} },
      db,
    );
    expect(db.updateOrderState).toHaveBeenCalledWith("ord_1", "failed");
    expect(db.markPastDue).toHaveBeenCalledWith("u1");
  });

  // C2: a replayed/out-of-order FAILED or CANCELLED event that arrives AFTER
  // the COMPLETED event must not undo the activation — success wins.
  it("does not flip completed order to failed when ORDER_FAILED replays", async () => {
    const db = makeDb({
      getOrder: vi.fn().mockResolvedValue({ user_id: "u1", plan: "pro", state: "completed" }),
    });
    await applyWebhookEvent(
      { type: "ORDER_FAILED", orderId: "ord_1", externalRef: "u", payload: {} },
      db,
    );
    expect(db.updateOrderState).not.toHaveBeenCalled();
    expect(db.markPastDue).not.toHaveBeenCalled();
  });

  it("does not flip completed order to failed when ORDER_CANCELLED replays", async () => {
    const db = makeDb({
      getOrder: vi.fn().mockResolvedValue({ user_id: "u1", plan: "pro", state: "completed" }),
    });
    await applyWebhookEvent(
      { type: "ORDER_CANCELLED", orderId: "ord_1", externalRef: "u", payload: {} },
      db,
    );
    expect(db.updateOrderState).not.toHaveBeenCalled();
    expect(db.markPastDue).not.toHaveBeenCalled();
  });
});
