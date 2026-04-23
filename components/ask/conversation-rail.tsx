import Link from "next/link";
import { ProfileChip } from "@/components/auth/profile-chip";

interface Props {
  locale: string;
  conversations: Array<{ id: string; title: string | null; updated_at: string }>;
  activeId?: string;
  user: { fullName: string | null; email: string | null; avatarUrl: string | null };
  planLabel: string;
  percentUsed: number;
}

export function ConversationRail({ locale, conversations, activeId, user, planLabel, percentUsed }: Props) {
  return (
    <aside className="w-64 border-r border-[var(--color-fg-4)] hidden md:flex flex-col shrink-0">
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
        {conversations.map((c) => {
          const active = c.id === activeId;
          return (
            <li key={c.id}>
              <Link
                href={`/${locale}/ask/${c.id}`}
                className={`block px-4 py-2.5 transition-colors border-l-2 ${
                  active
                    ? "border-[var(--color-cyan)] bg-[var(--color-fg-4)]/15"
                    : "border-transparent hover:border-[var(--color-fg-4)] hover:bg-[var(--color-fg-4)]/10"
                }`}
              >
                <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)]">
                  {formatRelative(c.updated_at)}
                </div>
                <div className={`mt-1 text-sm truncate ${active ? "text-[var(--color-fg-0)]" : "text-[var(--color-fg-1)]"}`}>
                  {c.title ?? "Untitled"}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <ProfileChip user={user} planLabel={planLabel} percentUsed={percentUsed} />
    </aside>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
