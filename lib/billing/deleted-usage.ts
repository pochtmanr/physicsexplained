import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Free-plan usage that outlives an account deletion.
 *
 * Deleting an account removes its billing row, and signing up again creates a
 * fresh one, so the free monthly questions could be reset at will by deleting
 * and recreating the account. To close that, a deletion leaves one row behind:
 * a peppered hash of the email (never the address), the questions already
 * used, and the date the allowance would have reset. The first question from a
 * new account with the same email picks that row up.
 *
 * Retention is short by construction: the row is useless after the reset date
 * and is removed then (or when it is picked up), so nothing is kept longer
 * than one billing month. Table: deleted_account_usage (migration 0017).
 *
 * Every function here is best-effort. A missing table, a missing pepper or a
 * database error must never block a deletion or an answer.
 */

const TABLE = "deleted_account_usage";

function identityHash(email: string | null | undefined): string | null {
  const pepper = process.env.IP_PEPPER ?? process.env.CONTACT_IP_PEPPER;
  const normalized = email?.trim().toLowerCase();
  if (!pepper || !normalized) return null;
  return createHash("sha256").update(`${pepper}|account|${normalized}`).digest("hex");
}

export interface FreeUsageRow {
  plan: string;
  free_questions_used: number;
  cycle_end: string;
}

/** Call BEFORE the billing row is deleted. */
export async function rememberFreeUsage(
  svc: SupabaseClient,
  email: string | null | undefined,
  row: FreeUsageRow | null | undefined,
  now: Date = new Date(),
): Promise<void> {
  try {
    if (!row || row.plan !== "free" || row.free_questions_used <= 0) return;
    if (new Date(row.cycle_end).getTime() <= now.getTime()) return;
    const hash = identityHash(email);
    if (!hash) return;

    // Housekeeping while we are here: expired rows carry no information.
    await svc.from(TABLE).delete().lte("cycle_end", now.toISOString());
    const { error } = await svc.from(TABLE).upsert(
      { identity_hash: hash, free_questions_used: row.free_questions_used, cycle_end: row.cycle_end },
      { onConflict: "identity_hash" },
    );
    if (error) console.error("[deleted-usage] remember failed:", error.message);
  } catch (e) {
    console.error("[deleted-usage] remember failed:", e);
  }
}

/**
 * Call when a free account has used none of its questions yet. If the same
 * email deleted an account earlier this cycle, carries the old usage and reset
 * date onto the new billing row and returns them; otherwise returns null.
 */
export async function restoreFreeUsage(
  svc: SupabaseClient,
  userId: string,
  email: string | null | undefined,
  now: Date = new Date(),
): Promise<{ free_questions_used: number; cycle_end: string } | null> {
  try {
    const hash = identityHash(email);
    if (!hash) return null;
    const { data, error } = await svc
      .from(TABLE)
      .select("free_questions_used,cycle_end")
      .eq("identity_hash", hash)
      .maybeSingle();
    if (error || !data) return null;

    await svc.from(TABLE).delete().eq("identity_hash", hash);
    if (new Date(data.cycle_end as string).getTime() <= now.getTime()) return null;

    const carried = {
      free_questions_used: data.free_questions_used as number,
      cycle_end: data.cycle_end as string,
    };
    const { error: updateError } = await svc
      .from("user_billing")
      .update(carried)
      .eq("user_id", userId)
      .eq("plan", "free");
    if (updateError) {
      console.error("[deleted-usage] restore failed:", updateError.message);
      return null;
    }
    return carried;
  } catch (e) {
    console.error("[deleted-usage] restore failed:", e);
    return null;
  }
}
