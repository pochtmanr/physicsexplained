import Link from "next/link";

interface Props {
  locale: string;
  conversations: Array<{ id: string; title: string | null; updated_at: string }>;
  activeId?: string;
}

export function ConversationRail({ locale, conversations, activeId }: Props) {
  return (
    <aside className="w-60 border-r hidden md:flex flex-col shrink-0">
      <Link
        href={`/${locale}/ask`}
        className="m-3 border rounded px-3 py-2 text-sm text-center hover:bg-muted"
      >
        + New chat
      </Link>
      <ul className="flex-1 overflow-y-auto">
        {conversations.length === 0 && (
          <li className="px-3 py-2 text-xs text-muted-foreground">No chats yet.</li>
        )}
        {conversations.map((c) => (
          <li key={c.id}>
            <Link
              href={`/${locale}/ask/${c.id}`}
              className={`block px-3 py-2 text-sm hover:bg-muted truncate ${
                c.id === activeId ? "bg-muted font-medium" : ""
              }`}
            >
              {c.title ?? "Untitled"}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
