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
  const res = await fetch(`${cfg.apiBase}/1.0/orders`, {
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
    throw new Error(`Revolut API ${res.status}: ${text}`);
  }
  const json = (await res.json()) as { id: string; public_id: string; state: string };
  return { id: json.id, publicId: json.public_id, state: json.state };
}

export async function createOrder(input: CreateOrderInput): Promise<RevolutOrder> {
  return postOrder({
    amount: input.amountCents,
    currency: input.currency,
    capture_mode: "automatic",
    merchant_order_ext_ref: input.externalRef,
    ...(input.savePaymentMethod ? { save_payment_method_for: "customer" } : {}),
    customer: {
      email: input.customer.email,
      ...(input.customer.fullName ? { full_name: input.customer.fullName } : {}),
    },
  });
}

export async function chargeToken(input: ChargeTokenInput): Promise<RevolutOrder> {
  return postOrder({
    amount: input.amountCents,
    currency: input.currency,
    capture_mode: "automatic",
    merchant_order_ext_ref: input.externalRef,
    payment_method: { type: "token", id: input.token },
  });
}

export function verifyWebhook(rawBody: string, signatureHeader: string): boolean {
  if (!signatureHeader?.startsWith("v1=")) return false;
  const cfg = getRevolutConfig();
  const received = signatureHeader.slice(3);
  const expected = createHmac("sha256", cfg.webhookSecret).update(rawBody).digest("hex");
  const a = new Uint8Array(Buffer.from(received, "hex"));
  const b = new Uint8Array(Buffer.from(expected, "hex"));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
