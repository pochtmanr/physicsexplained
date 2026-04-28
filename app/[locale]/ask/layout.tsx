import { redirect } from "next/navigation";
import { getSsrClient, getServiceClient } from "@/lib/supabase-server";
import { ConversationRail } from "@/components/ask/conversation-rail";
import {
  MobileChatRail,
  MobileChatRailProvider,
} from "@/components/ask/mobile-chat-rail";
import { KillSwitchBanner } from "@/components/ask/kill-switch-banner";
import { AccountDrawerProvider } from "@/components/account/account-drawer-context";
import { AccountDrawer } from "@/components/account/account-drawer";
import { OpenDrawerFromQuery } from "@/components/account/open-drawer-from-query";
import { loadBillingSnapshot } from "@/app/actions/account";

export default async function AskLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const db = await getSsrClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in?next=/${locale}/ask`);

  const [{ data: convs }, snapshot, { data: orders }] = await Promise.all([
    db.from("ask_conversations")
      .select("id,title,updated_at,starred")
      .order("starred", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(50),
    loadBillingSnapshot(),
    getServiceClient().from("billing_orders")
      .select("id,plan,amount_cents,currency,state,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);

  const userPayload = {
    id: user.id,
    email: user.email ?? null,
    fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
    avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? (user.user_metadata?.picture as string | undefined) ?? null,
    provider: (user.app_metadata?.provider as string | undefined) ?? "email",
    joined: user.created_at
      ? new Date(user.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
      : "—",
  };

  const enabled = process.env.ASK_ENABLED === "true";
  return (
    <AccountDrawerProvider>
      <MobileChatRailProvider>
        <OpenDrawerFromQuery />
        <div className="flex h-[calc(100dvh-3rem)] md:h-[calc(100dvh-3.5rem)] overflow-hidden">
          <ConversationRail
            locale={locale}
            conversations={convs ?? []}
            user={{ fullName: userPayload.fullName, email: userPayload.email, avatarUrl: userPayload.avatarUrl }}
            planLabel={snapshot?.plan.label ?? "Free"}
            percentUsed={snapshot?.percentUsed ?? 0}
          />
          <main className="flex-1 flex flex-col w-full min-w-0 min-h-0">
            {!enabled && <KillSwitchBanner />}
            {children}
          </main>
        </div>
        <MobileChatRail
          locale={locale}
          conversations={convs ?? []}
          user={{ fullName: userPayload.fullName, email: userPayload.email, avatarUrl: userPayload.avatarUrl }}
          planLabel={snapshot?.plan.label ?? "Free"}
          percentUsed={snapshot?.percentUsed ?? 0}
        />
        <AccountDrawer user={userPayload} snapshot={snapshot} orders={orders ?? []} />
      </MobileChatRailProvider>
    </AccountDrawerProvider>
  );
}
