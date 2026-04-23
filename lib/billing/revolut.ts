import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getRevolutConfig } from "./config";

export interface CreateOrderInput {
  amountCents: number;
  currency: "USD";
  externalRef: string;
  customer: { email: string; fullName?: string };
  savePaymentMethod?: boolean;
}

export interface ChargeTokenInput {
  amountCents: number;
  currency: "USD";
  externalRef: string;
  token: string;
}

export interface RevolutOrder {
  id: string;
  publicId: string;
  state: string;
}

const API_VERSION_HEADER = { "Revolut-Api-Version": "2024-09-01" };

async function postOrder(body: Record<string, unknown>): Promise<RevolutOrder> {
  const cfg = getRevolutConfig();
  const res = await fetch(`${cfg.apiBase}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
      ...API_VERSION_HEADER,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[revolut] POST /orders failed", { status: res.status, body: text, sentBody: body });
    throw new Error(`Revolut API ${res.status}: ${text}`);
  }
  const json = (await res.json()) as { id: string; token: string; state: string };
  return { id: json.id, publicId: json.token, state: json.state };
}

export async function createOrder(input: CreateOrderInput): Promise<RevolutOrder> {
  const body: Record<string, unknown> = {
    amount: input.amountCents,
    currency: input.currency,
    capture_mode: "automatic",
    merchant_order_data: { reference: input.externalRef },
  };
  if (input.customer.email) {
    body.customer = {
      email: input.customer.email,
      ...(input.customer.fullName ? { full_name: input.customer.fullName } : {}),
    };
  }
  return postOrder(body);
}

export async function chargeToken(input: ChargeTokenInput): Promise<RevolutOrder> {
  return postOrder({
    amount: input.amountCents,
    currency: input.currency,
    capture_mode: "automatic",
    merchant_order_data: { reference: input.externalRef },
    payment_method: { type: "token", id: input.token },
  });
}

export interface RetrievedOrder {
  id: string;
  state: string;
  customer_id?: string;
  payment_method_token?: string;
}

export async function retrieveOrder(orderId: string): Promise<RetrievedOrder> {
  const cfg = getRevolutConfig();
  const res = await fetch(`${cfg.apiBase}/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      ...API_VERSION_HEADER,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Revolut retrieve ${res.status}: ${text}`);
  }
  const json = (await res.json()) as {
    id: string;
    state: string;
    customer_id?: string;
    payments?: Array<{ payment_method?: { id?: string } }>;
  };
  return {
    id: json.id,
    state: json.state,
    customer_id: json.customer_id,
    payment_method_token: json.payments?.[0]?.payment_method?.id,
  };
}

export type WebhookVerifyErrorCode =
  | "MISSING_HEADER"
  | "BAD_TIMESTAMP"
  | "STALE_TIMESTAMP"
  | "BAD_SIGNATURE";

export interface WebhookVerifyResult {
  ok: boolean;
  error?: WebhookVerifyErrorCode;
}

// 5-minute tolerance window per Revolut docs.
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

// Revolut signs `v1.<timestamp>.<rawBody>` with HMAC-SHA256.
// The signature header is `Revolut-Signature: v1=<hex>` and during key
// rotation may contain multiple comma-separated `v1=<hex>` values — accept
// a match against ANY of them.
// Reference:
//   https://developer.revolut.com/docs/guides/accept-payments/tutorials/work-with-webhooks/verify-the-payload-signature
export function verifyWebhook(
  rawBody: string,
  signatureHeader: string,
  timestampHeader: string,
): WebhookVerifyResult {
  if (!signatureHeader || !timestampHeader) {
    return { ok: false, error: "MISSING_HEADER" };
  }

  // Timestamp must be a parseable integer (milliseconds since epoch).
  if (!/^-?\d+$/.test(timestampHeader.trim())) {
    return { ok: false, error: "BAD_TIMESTAMP" };
  }
  const ts = Number.parseInt(timestampHeader.trim(), 10);
  if (!Number.isFinite(ts)) {
    return { ok: false, error: "BAD_TIMESTAMP" };
  }

  const delta = Math.abs(Date.now() - ts);
  if (delta > TIMESTAMP_TOLERANCE_MS) {
    return { ok: false, error: "STALE_TIMESTAMP" };
  }

  const cfg = getRevolutConfig();
  const signedPayload = `v1.${timestampHeader.trim()}.${rawBody}`;
  const expectedHex = createHmac("sha256", cfg.webhookSecret)
    .update(signedPayload)
    .digest("hex");
  const expectedBytes = new Uint8Array(Buffer.from(expectedHex, "hex"));

  const candidates = signatureHeader
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("v1="))
    .map((s) => s.slice(3));

  if (candidates.length === 0) {
    return { ok: false, error: "BAD_SIGNATURE" };
  }

  for (const candidate of candidates) {
    // Cheap sanity: must look like hex; skip otherwise.
    if (!/^[0-9a-fA-F]+$/.test(candidate)) continue;
    const receivedBytes = new Uint8Array(Buffer.from(candidate, "hex"));
    if (receivedBytes.length !== expectedBytes.length) continue;
    if (timingSafeEqual(receivedBytes, expectedBytes)) {
      return { ok: true };
    }
  }

  return { ok: false, error: "BAD_SIGNATURE" };
}
