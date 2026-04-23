import { Transcript } from "@/components/ask/transcript";
import { ChatScreen } from "@/components/ask/chat-screen";

export default async function ConversationPage({
  params,
}: { params: Promise<{ locale: string; conversationId: string }> }) {
  const { locale, conversationId } = await params;
  return (
    <ChatScreen conversationId={conversationId} variant="conversation">
      <Transcript conversationId={conversationId} locale={locale} />
    </ChatScreen>
  );
}
