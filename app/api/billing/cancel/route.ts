import { NextResponse } from "next/server";
import { getSsrClient, getServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const ssr = await getSsrClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const svc = getServiceClient();
  // M5: Null out revolut_token on cancel as defense-in-depth — even if a
  // future regression in billing-renew's status filter lets a canceled
  // user through, there is no stored token to charge against.
  const { error } = await svc.from("user_billing").update({
    status: "canceled",
    canceled_at: new Date().toISOString(),
    next_charge_at: null,
    revolut_token: null,
  }).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "DB_ERR", message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
