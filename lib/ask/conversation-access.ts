import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * True only if the conversation exists and belongs to the user.
 *
 * The ask routes talk to the database with the service-role client, which
 * bypasses row-level security, so a client-supplied conversation id must be
 * checked against the authenticated user before it is read or written.
 */
export async function userOwnsConversation(
  db: Pick<SupabaseClient, "from">,
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await db
    .from("ask_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  return !error && data !== null;
}
