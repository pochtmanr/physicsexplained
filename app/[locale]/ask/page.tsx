import { getSsrClient } from "@/lib/supabase-server";
import { ChatScreen } from "@/components/ask/chat-screen";

interface Props {
  searchParams: Promise<{ scene?: string; params?: string; prompt?: string }>;
}

export default async function AskLanding({ searchParams }: Props) {
  const db = await getSsrClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? null;
  const firstName = fullName?.trim().split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? null;

  const sp = await searchParams;
  const deeplink = sp.scene
    ? { sceneId: sp.scene, params: sp.params ?? "", prompt: sp.prompt ?? "" }
    : null;

  return (
    <ChatScreen
      conversationId={null}
      variant="landing"
      userName={firstName}
      deeplink={deeplink}
    />
  );
}
