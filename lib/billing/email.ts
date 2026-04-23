import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PLANS, type PlanId } from "./plans";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}. See .env.example for setup.`);
  return v;
}

// Minimal HTML-entity escaper for user-controlled values interpolated into the
// receipt template. Covers the five characters that matter for attribute + text
// contexts. Not a full sanitizer — only call on values that are meant to render
// as plain text.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface ReceiptInput {
  to: string;
  fullName: string | null;
  orderId: string;
  plan: string;
  amountCents: number;
  currency: string;
  createdAt: string;
}

interface N8nEmailPayload {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  tag: string;
}

async function postToN8n(payload: N8nEmailPayload): Promise<void> {
  const url = requireEnv("N8N_EMAIL_WEBHOOK_URL");
  const secret = requireEnv("N8N_WEBHOOK_SECRET");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Secret": secret,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`n8n email webhook ${res.status}: ${body.slice(0, 300)}`);
  }
}

export async function sendReceiptEmail(input: ReceiptInput): Promise<void> {
  const plan = PLANS[input.plan as PlanId] ?? null;
  const rawPlanLabel = plan?.label ?? input.plan;
  const amount = `${input.currency} ${(input.amountCents / 100).toFixed(2)}`;
  const dateStr = new Date(input.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const firstName = input.fullName ? input.fullName.split(" ")[0] : null;
  const greetingPlain = firstName ? `Hi ${firstName},` : "Hi,";
  const greetingHtml = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi,";

  const siteUrl = requireEnv("NEXT_PUBLIC_SITE_URL").replace(/\/+$/, "");
  const emailFrom = requireEnv("EMAIL_FROM");

  const planLabelHtml = escapeHtml(rawPlanLabel);
  const orderIdHtml = escapeHtml(input.orderId);
  const amountHtml = escapeHtml(amount);
  const dateHtml = escapeHtml(dateStr);

  const manageBillingUrl = `${siteUrl}/en/ask?drawer=billing`;
  const startAskingUrl = `${siteUrl}/en/ask`;

  const companyAddress = process.env.BILLING_COMPANY_ADDRESS?.trim() || null;
  const companyAddressHtml = companyAddress ? escapeHtml(companyAddress) : null;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #e5e5e5; border-radius: 12px;">
      <h2 style="margin: 0 0 8px; color: #fff; font-weight: 400; letter-spacing: 0.02em;">Payment received</h2>
      <p style="color: #a3a3a3; margin: 0 0 24px; font-size: 14px;">${greetingHtml} your ${planLabelHtml} plan on physics.it.com is now active.</p>

      <div style="background: #111; border: 1px solid #262626; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #737373;">Plan</td><td style="padding: 6px 0; text-align: right; color: #fff;">${planLabelHtml}</td></tr>
          <tr><td style="padding: 6px 0; color: #737373;">Amount</td><td style="padding: 6px 0; text-align: right; color: #fff;">${amountHtml}</td></tr>
          <tr><td style="padding: 6px 0; color: #737373;">Date</td><td style="padding: 6px 0; text-align: right; color: #fff;">${dateHtml}</td></tr>
          <tr><td style="padding: 6px 0; color: #737373;">Order ID</td><td style="padding: 6px 0; text-align: right; color: #a3a3a3; font-family: ui-monospace, monospace; font-size: 12px;">${orderIdHtml}</td></tr>
        </table>
      </div>

      <a href="${startAskingUrl}" style="display: inline-block; background: #22d3ee; color: #0a0a0a; padding: 10px 20px; border-radius: 6px; font-weight: 500; text-decoration: none; font-size: 14px;">Start asking</a>

      <p style="color: #525252; margin: 32px 0 0; font-size: 12px; line-height: 1.5;">
        Your subscription renews monthly. You can <a href="${manageBillingUrl}" style="color: #737373; text-decoration: underline;">manage your billing</a> or cancel any time from your account.
        Need help? Reply to this email.
      </p>
      ${companyAddressHtml ? `<p style="color: #404040; margin: 16px 0 0; font-size: 11px; line-height: 1.5;">${companyAddressHtml}</p>` : ""}
    </div>
  `;

  const textLines = [
    greetingPlain,
    ``,
    `Your ${rawPlanLabel} plan on physics.it.com is now active.`,
    ``,
    `Plan:     ${rawPlanLabel}`,
    `Amount:   ${amount}`,
    `Date:     ${dateStr}`,
    `Order ID: ${input.orderId}`,
    ``,
    `Start asking:   ${startAskingUrl}`,
    `Manage billing: ${manageBillingUrl}`,
    ``,
    `Your subscription renews monthly. Cancel any time from your account.`,
  ];
  if (companyAddress) {
    textLines.push(``, companyAddress);
  }
  const text = textLines.join("\n");

  await postToN8n({
    from: emailFrom,
    to: input.to,
    subject: `Payment received — ${rawPlanLabel} plan active`,
    text,
    html,
    tag: "billing.receipt",
  });
}

// Lookup order + user and send receipt. Idempotent guard via billing_orders.receipt_sent_at.
export async function sendReceiptForOrder(
  db: SupabaseClient,
  orderId: string,
): Promise<{ sent: boolean; reason?: string }> {
  const { data: row } = await db
    .from("billing_orders")
    .select("user_id,plan,amount_cents,currency,created_at,receipt_sent_at")
    .eq("revolut_order_id", orderId)
    .maybeSingle();
  if (!row) return { sent: false, reason: "order_not_found" };
  if (row.receipt_sent_at) return { sent: false, reason: "already_sent" };

  const { data: userRes } = await db.auth.admin.getUserById(row.user_id as string);
  const email = userRes?.user?.email;
  if (!email) return { sent: false, reason: "no_email" };

  try {
    await sendReceiptEmail({
      to: email,
      fullName: (userRes.user!.user_metadata?.full_name as string | undefined) ?? null,
      orderId,
      plan: row.plan as string,
      amountCents: row.amount_cents as number,
      currency: row.currency as string,
      createdAt: row.created_at as string,
    });
    await db
      .from("billing_orders")
      .update({ receipt_sent_at: new Date().toISOString() })
      .eq("revolut_order_id", orderId);
    return { sent: true };
  } catch (e) {
    console.error("[billing/email] sendReceiptForOrder failed:", e);
    return { sent: false, reason: "webhook_error" };
  }
}
