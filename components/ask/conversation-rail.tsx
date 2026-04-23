import Link from "next/link";
import { ProfileChip } from "@/components/auth/profile-chip";
import { ConversationRow } from "./conversation-row";

interface Props {
  locale: string;
  conversations: Array<{ id: string; title: string | null; updated_at: string; starred: boolean }>;
  activeId?: string;
  user: { fullName: string | null; email: string | null; avatarUrl: string | null };
  planLabel: string;
  percentUsed: number;
}

export function ConversationRail({ locale, conversations, activeId, user, planLabel, percentUsed }: Props) {
  return (
    <aside className="w-64 border-r border-[var(--color-fg-4)] flex flex-col shrink-0">
      <div className="p-3 border-b border-[var(--color-fg-4)]">
        <Link
          href={`/${locale}/ask`}
          className="block w-full text-center border border-[var(--color-cyan-dim)] px-3 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)] transition-colors hover:bg-[var(--color-cyan-dim)]/10"
        >
          + New Chat
        </Link>
      </div>
      <ul className="flex-1 overflow-y-auto py-2">
        {conversations.length === 0 && (
          <li className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
            No chats yet
          </li>
        )}
        {conversations.map((c) => (
          <li key={c.id}>
            <ConversationRow conv={c} locale={locale} active={c.id === activeId} />
          </li>
        ))}
      </ul>
      <ProfileChip user={user} planLabel={planLabel} percentUsed={percentUsed} />
    </aside>
  );
}
