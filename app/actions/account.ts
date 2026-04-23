"use server";
import { redirect } from "next/navigation";
import { getSsrClient, getServiceClient } from "@/lib/supabase-server";
import { composeSnapshot, type BillingSnapshot, type RawBilling } from "@/lib/billing/snapshot";

export async function loadBillingSnapshot(): Promise<BillingSnapshot | null> {
  const db = await getSsrClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data } = await db
    .from("user_billing")
    .select("plan,status,tokens_allowance,tokens_used,free_questions_used,cycle_end,next_charge_at,canceled_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return null;
  return composeSnapshot(data as RawBilling);
}

export async function deleteAllChats(confirmText: string): Promise<{ ok: boolean; deleted?: number; error?: string }> {
  if (confirmText.trim().toLowerCase() !== "delete chats") {
    return { ok: false, error: "Confirmation text did not match." };
  }
  const db = await getSsrClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  const { error, count } = await db
    .from("ask_conversations")
    .delete({ count: "exact" })
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, deleted: count ?? 0 };
}

export async function deleteAccount(confirmEmail: string): Promise<{ ok: false; error: string } | never> {
  const db = await getSsrClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  if (confirmEmail.trim().toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return { ok: false, error: "Email did not match." };
  }

  // Best-effort: stop any future Revolut charges by clearing the saved token.
  const svc = getServiceClient();
  await svc.from("user_billing")
    .update({ status: "canceled", canceled_at: new Date().toISOString(), revolut_token: null, next_charge_at: null })
    .eq("user_id", user.id);

  const { error } = await svc.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, error: error.message };

  await db.auth.signOut();
  redirect("/");
}
