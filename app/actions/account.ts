"use server";
import { getSsrClient } from "@/lib/supabase-server";
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
