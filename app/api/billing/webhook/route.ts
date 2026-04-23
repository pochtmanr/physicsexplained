import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import { verifyWebhook } from "@/lib/billing/revolut";
import { applyWebhookEvent, parseRevolutEvent } from "@/lib/billing/webhook-handler";
import { makeDbPort } from "@/lib/billing/db-port";
import { sendReceiptForOrder } from "@/lib/billing/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const raw = await req.text();
  // Next.js lowercases header names.
  const sig = req.headers.get("revolut-signature") ?? "";
  const ts = req.headers.get("revolut-request-timestamp") ?? "";

  const verify = verifyWebhook(raw, sig, ts);
  if (!verify.ok) {
    // Log structured error for observability; always return 401 externally so
    // we never leak the specific verification failure mode to the caller.
    console.warn("[billing/webhook] signature verification failed", {
      code: verify.error,
      hasSignature: Boolean(sig),
      hasTimestamp: Boolean(ts),
    });
    return NextResponse.json(
      { error: "INVALID_SIGNATURE", code: verify.error ?? "BAD_SIGNATURE" },
      { status: 401 },
    );
  }

  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return NextResponse.json({ error: "BAD_JSON" }, { status: 400 }); }
  const event = parseRevolutEvent(parsed);
  if (!event || event.type === "UNKNOWN") return NextResponse.json({ ok: true, skipped: true });

  const db = getServiceClient();
  const port = makeDbPort(db);

  await applyWebhookEvent(event, port);

  if (event.type === "ORDER_COMPLETED") {
    await sendReceiptForOrder(db, event.orderId).catch((e) => {
      console.error("[billing/webhook] receipt email failed:", e);
    });
  }

  return NextResponse.json({ ok: true });
}
