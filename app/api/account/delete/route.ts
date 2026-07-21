import { NextResponse } from "next/server";
import { getRequestClient, getServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Permanent account deletion (App Review 5.1.1(v)).
 *
 * Authenticated as the caller — bearer from the iOS app, cookies from the web —
 * then everything the user owns is removed with the service role and the auth
 * user itself is deleted. There is no soft-delete and no "deactivated" state;
 * a second call 401s because the user no longer exists.
 *
 * Every table below already cascades from `auth.users`, so `deleteUser` alone
 * would clear them. The explicit deletes are defense in depth: a future table
 * added without `on delete cascade` shows up here as a missing line rather than
 * as rows silently outliving their owner.
 */
export async function POST(req: Request) {
  const { user } = await getRequestClient(req);
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const userId = user.id;
  const svc = getServiceClient();

  // Read before destroying: the client warns that a paid subscription will not
  // auto-cancel with the payment provider, and after this point there is no row
  // left to ask. A read failure is not a reason to refuse the deletion.
  const { data: billing } = await svc
    .from("user_billing")
    .select("plan,status")
    .eq("user_id", userId)
    .maybeSingle();
  const hadActivePlan = billing?.status === "active" && billing?.plan !== "free";

  // Children before parents. `ask_messages` cascades from `ask_conversations`
  // and `problem_diagnoses` from `problem_attempts` (migrations 0003, 0010), so
  // the parent delete is what clears them.
  const { data: attempts } = await svc
    .from("problem_attempts")
    .select("id")
    .eq("user_id", userId);
  if (attempts?.length) {
    const { error } = await svc
      .from("problem_diagnoses")
      .delete()
      .in("attempt_id", attempts.map((a) => a.id));
    if (error) return dbError("problem_diagnoses", error.message);
  }

  for (const table of [
    "problem_attempts",
    "ask_conversations",
    "ask_usage_daily",
    "billing_orders",
    "user_billing",
  ]) {
    const { error } = await svc.from(table).delete().eq("user_id", userId);
    if (error) return dbError(table, error.message);
  }

  const { error: authError } = await svc.auth.admin.deleteUser(userId);
  if (authError) {
    // The rows are already gone, so leaving the auth user behind would strand a
    // signed-in session over an empty account — surface it loudly instead.
    console.error("[account/delete] auth user deletion failed:", authError.message);
    return NextResponse.json({ error: "AUTH_DELETE_FAILED" }, { status: 500 });
  }

  // No PII in the log line — the id is enough to correlate with a support
  // request, and the account it named no longer exists.
  console.log(`[account/delete] deleted account ${userId}`);
  return NextResponse.json(hadActivePlan ? { ok: true, hadActivePlan: true } : { ok: true });
}

function dbError(table: string, message: string) {
  console.error(`[account/delete] ${table} delete failed:`, message);
  return NextResponse.json({ error: "DB_ERR", table }, { status: 500 });
}
