"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProfileChip } from "@/components/auth/profile-chip";
import { ConversationRow } from "./conversation-row";

const STORAGE_KEY = "ask.railCollapsed";

interface Props {
  locale: string;
  conversations: Array<{ id: string; title: string | null; updated_at: string; starred: boolean }>;
  activeId?: string;
  user: { fullName: string | null; email: string | null; avatarUrl: string | null };
  planLabel: string;
  percentUsed: number;
}

export function ConversationRail({
  locale,
  conversations,
  activeId,
  user,
  planLabel,
  percentUsed,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <aside
      data-collapsed={collapsed}
      className={`hidden md:flex shrink-0 flex-col overflow-hidden border-r border-[var(--color-fg-4)] bg-[var(--color-bg-0)] transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        collapsed ? "w-14" : "w-64"
      }`}
    >
      <div
        className={`flex h-12 items-center gap-2 border-b border-[var(--color-fg-4)] p-2 ${
          collapsed ? "justify-center" : ""
        }`}
      >
        {!collapsed && (
          <Link
            href={`/${locale}/ask`}
            className="nav-link btn-tracer group relative inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 bg-[var(--color-cyan)] px-3 py-2 font-mono text-xs uppercase tracking-wider !text-white transition-[box-shadow,background-color] duration-[200ms] ease-out hover:bg-[color-mix(in_srgb,var(--color-cyan)_92%,white)] hover:shadow-[0_8px_32px_-8px_color-mix(in_srgb,var(--color-cyan)_60%,transparent),0_0_48px_color-mix(in_srgb,var(--color-cyan)_25%,transparent)]"
          >
            <PlusIcon size={14} />
            <span>New Chat</span>
          </Link>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Show chat list" : "Hide chat list"}
          title={collapsed ? "Show chat list" : "Hide chat list"}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--color-cyan-dim)] bg-[var(--color-bg-1)] text-[var(--color-cyan-dim)] transition-colors hover:bg-[var(--color-cyan)]/10"
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>

      {collapsed && (
        <div className="flex justify-center pt-3">
          <Link
            href={`/${locale}/ask`}
            aria-label="New chat"
            title="New chat"
            className="nav-link btn-tracer group relative inline-flex h-8 w-8 items-center justify-center bg-[var(--color-cyan)] !text-white transition-[box-shadow,background-color] duration-[180ms] ease-out hover:bg-[color-mix(in_srgb,var(--color-cyan)_92%,white)] hover:shadow-[0_0_24px_-4px_color-mix(in_srgb,var(--color-cyan)_60%,transparent)]"
          >
            <PlusIcon size={16} />
          </Link>
        </div>
      )}

      <ul
        aria-hidden={collapsed || undefined}
        className={`flex-1 overflow-y-auto py-2 transition-opacity duration-200 ease-out ${
          collapsed ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
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

      <ProfileChip
        user={user}
        planLabel={planLabel}
        percentUsed={percentUsed}
        collapsed={collapsed}
      />
    </aside>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
