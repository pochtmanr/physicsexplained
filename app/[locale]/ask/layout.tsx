import { redirect } from "next/navigation";
import { getSsrClient } from "@/lib/supabase-server";
import { ConversationRail } from "@/components/ask/conversation-rail";
import { KillSwitchBanner } from "@/components/ask/kill-switch-banner";

export default async function AskLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const db = await getSsrClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in?next=/${locale}/ask`);

  const { data } = await db
    .from("ask_conversations")
    .select("id,title,updated_at")
    .order("updated_at", { ascending: false })
    .limit(20);

  const enabled = process.env.ASK_ENABLED === "true";
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <ConversationRail locale={locale} conversations={data ?? []} />
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {!enabled && <KillSwitchBanner />}
        {children}
      </main>
    </div>
  );
}
