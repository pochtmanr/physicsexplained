import { getSsrClient } from "@/lib/supabase-server";
import { MessageBubble } from "./message-bubble";

export async function Transcript({
  conversationId, locale,
}: { conversationId: string; locale: string }) {
  const db = await getSsrClient();
  const { data } = await db
    .from("ask_messages")
    .select("id,role,content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {(data ?? []).map((m) => {
        if (m.role === "tool") return null;
        const text = (m.content as { text?: string } | null)?.text ?? "";
        return <MessageBubble key={m.id} role={m.role as "user" | "assistant"} text={text} locale={locale} />;
      })}
    </div>
  );
}
