import { getSsrClient } from "@/lib/supabase-server";
import { ChatScreen } from "@/components/ask/chat-screen";

export default async function AskLanding() {
  const db = await getSsrClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? null;
  const firstName = fullName?.trim().split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? null;
  return <ChatScreen conversationId={null} variant="landing" userName={firstName} />;
}
