import { allowanceFor, type PlanId } from "./plans";
import type { RawBilling } from "./snapshot";

// RevenueCat → Apple subscription reconcile. Pure, no I/O: this file is
// unit-tested (tests/billing/revenuecat.test.ts) and mirrors the semantics of
// the Revolut reconcile in webhook-handler.ts / db-port.ts and the web
// billing-tab status-pill meanings. Only the fields we actually consume are
// modeled — RevenueCat sends far more.

/**
 * The RevenueCat webhook event types we act on. Everything else is ignored by
 * the route (200 skipped). The first group opens/renews a paid period; the
 * second group ends or downgrades access.
 */
export type RCEventType =
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "UNCANCELLATION"
  | "PRODUCT_CHANGE"
  | "SUBSCRIPTION_EXTENDED"
  | "TRIAL_STARTED"
  | "CANCELLATION"
  | "EXPIRATION"
  | "REFUND"
  | "BILLING_ISSUE";

const ACTIVE_PERIOD_EVENTS: ReadonlySet<RCEventType> = new Set<RCEventType>([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
  "SUBSCRIPTION_EXTENDED",
  "TRIAL_STARTED",
]);

const HANDLED_EVENTS: ReadonlySet<string> = new Set<RCEventType>([
  ...ACTIVE_PERIOD_EVENTS,
  "CANCELLATION",
  "EXPIRATION",
  "REFUND",
  "BILLING_ISSUE",
]);

export interface RCEvent {
  /** RevenueCat event id — used for webhook idempotency (dedupe). */
  id: string;
  type: RCEventType;
  /** subscriber.original_app_user_id === the Supabase user id (iOS logs in with it). */
  appUserId: string;
  /** Entitlement ids active on the subscriber after this event. */
  entitlementIds: string[];
  /** App Store entitlement expiry (ms epoch); null when RevenueCat omits it. */
  expirationAtMs: number | null;
  environment: "SANDBOX" | "PRODUCTION";
}

/** The subset of user_billing columns the reducer may mutate. */
export type BillingMutation = Partial<{
  provider: "apple";
  plan: PlanId;
  status: RawBilling["status"];
  tokens_allowance: number;
  tokens_used: number;
  free_questions_used: number;
  cycle_start: string;
  cycle_end: string;
  apple_expires_at: string | null;
  canceled_at: string | null;
  next_charge_at: null;
}>;

/**
 * Highest active entitlement wins: pro > starter > free. Unknown entitlement
 * ids are ignored (only `pro`/`starter` map to paid plans).
 */
export function entitlementToPlan(entitlementIds: string[]): PlanId {
  if (entitlementIds.includes("pro")) return "pro";
  if (entitlementIds.includes("starter")) return "starter";
  return "free";
}

/**
 * Parse a RevenueCat webhook body into an RCEvent, or null if it is not a
 * shape/type we handle (the route then returns 200 skipped). Tolerates both the
 * flat `event.environment` shape and the `event.app.environment` shape the
 * runbook references.
 */
export function parseRevenueCatEvent(raw: unknown): RCEvent | null {
  if (typeof raw !== "object" || raw === null) return null;
  const env = (raw as Record<string, unknown>).event;
  if (typeof env !== "object" || env === null) return null;
  const e = env as Record<string, unknown>;

  const type = String(e.type ?? "");
  if (!HANDLED_EVENTS.has(type)) return null;

  const id = typeof e.id === "string" ? e.id : "";
  const appUserId = String(e.app_user_id ?? e.original_app_user_id ?? "");
  if (!id || !appUserId) return null;

  const entitlementIds = Array.isArray(e.entitlement_ids)
    ? (e.entitlement_ids as unknown[]).filter((x): x is string => typeof x === "string")
    : typeof e.entitlement_id === "string"
      ? [e.entitlement_id]
      : [];

  const expirationRaw = e.expiration_at_ms;
  const expirationAtMs =
    typeof expirationRaw === "number"
      ? expirationRaw
      : typeof expirationRaw === "string" && expirationRaw.trim() !== ""
        ? Number(expirationRaw)
        : null;

  const app = e.app as Record<string, unknown> | undefined;
  const environment =
    String(e.environment ?? app?.environment ?? "").toUpperCase() === "SANDBOX"
      ? "SANDBOX"
      : "PRODUCTION";

  return {
    id,
    type: type as RCEventType,
    appUserId,
    entitlementIds,
    expirationAtMs: expirationAtMs !== null && Number.isFinite(expirationAtMs) ? expirationAtMs : null,
    environment,
  };
}

/**
 * Given the current billing row and a parsed event, return the user_billing
 * column mutations. Pure — the caller (db-port `applyRevenueCatEvent`) does the
 * DB write. Semantics mirror the Revolut reconcile + web status-pill meanings.
 */
export function reconcileFromEvent(
  current: RawBilling & { provider: string },
  event: RCEvent,
  now: Date,
): BillingMutation {
  const nowIso = now.toISOString();

  // Opening or renewing a paid period: Apple owns renewal, so next_charge_at is
  // null (our Revolut cron must never touch this row) and cycle_end tracks the
  // App Store expiry. tokens_used resets — a fresh billing period.
  if (ACTIVE_PERIOD_EVENTS.has(event.type)) {
    const plan = entitlementToPlan(event.entitlementIds);
    const expiresIso = event.expirationAtMs !== null ? new Date(event.expirationAtMs).toISOString() : null;
    return {
      provider: "apple",
      plan,
      status: "active",
      tokens_allowance: allowanceFor(plan),
      tokens_used: 0,
      free_questions_used: 0,
      cycle_start: nowIso,
      ...(expiresIso ? { cycle_end: expiresIso } : {}),
      apple_expires_at: expiresIso,
      canceled_at: null,
      next_charge_at: null,
    };
  }

  // Auto-renew turned off but still entitled until expiry: keep the plan and
  // the expiry window (web shows "Access until …"); just flag canceled.
  if (event.type === "CANCELLATION") {
    return {
      status: "canceled",
      canceled_at: nowIso,
    };
  }

  // EXPIRATION / REFUND / BILLING_ISSUE (after grace) → access lost. A live
  // billing issue is past_due (a dunning state); the rest are canceled. Provider
  // stays 'apple' so the web UI keeps the read-only "Managed via Apple" branch.
  const status = event.type === "BILLING_ISSUE" ? "past_due" : "canceled";
  return {
    plan: "free",
    status,
    tokens_allowance: 0,
    tokens_used: 0,
    free_questions_used: 0,
  };
}
