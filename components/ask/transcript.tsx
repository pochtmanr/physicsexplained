import { getSsrClient } from "@/lib/supabase-server";
import { MessageBubble } from "./message-bubble";
import { ProgressTree, type ProgressStep } from "./progress-tree";

export async function Transcript({
  conversationId, locale,
}: { conversationId: string; locale: string }) {
  const db = await getSsrClient();
  const { data } = await db
    .from("ask_messages")
    .select("id,role,content,meta")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (
    <>
      {(data ?? []).map((m) => {
        if (m.role === "tool") return null;
        const text = (m.content as { text?: string } | null)?.text ?? "";
        const role = m.role as "user" | "assistant";
        const tools = extractTools(m.meta);
        return (
          <div key={m.id} className={role === "assistant" ? "mr-auto max-w-2xl" : undefined}>
            {tools.length > 0 && <ProgressTree steps={tools} />}
            <MessageBubble role={role} text={text} locale={locale} />
          </div>
        );
      })}
    </>
  );
}

// Read meta.tools off the stored assistant row and re-hydrate the
// ProgressTree. Best-effort: malformed data just means the tree doesn't render
// for that message — no crash.
function extractTools(meta: unknown): ProgressStep[] {
  if (!meta || typeof meta !== "object") return [];
  const raw = (meta as { tools?: unknown }).tools;
  if (!Array.isArray(raw)) return [];
  const out: ProgressStep[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (typeof r.id !== "string" || typeof r.name !== "string") continue;
    const status = r.status === "ok" || r.status === "error" ? r.status : "ok";
    out.push({
      id: r.id,
      name: r.name,
      status,
      args: typeof r.args === "object" && r.args !== null ? (r.args as Record<string, unknown>) : undefined,
      preview: typeof r.preview === "string" ? r.preview : undefined,
      startedAt: typeof r.startedAt === "number" ? r.startedAt : undefined,
      endedAt: typeof r.endedAt === "number" ? r.endedAt : undefined,
    });
  }
  return out;
}
