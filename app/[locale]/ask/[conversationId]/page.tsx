import { Transcript } from "@/components/ask/transcript";
import { Composer } from "@/components/ask/composer";

export default async function ConversationPage({
  params,
}: { params: Promise<{ locale: string; conversationId: string }> }) {
  const { locale, conversationId } = await params;
  return (
    <div className="flex flex-col flex-1">
      <Transcript conversationId={conversationId} locale={locale} />
      <div className="p-4 border-t">
        <Composer conversationId={conversationId} />
      </div>
    </div>
  );
}
