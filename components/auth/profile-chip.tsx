"use client";
import { useAccountDrawer } from "@/components/account/account-drawer-context";

interface Props {
  user: { fullName: string | null; email: string | null; avatarUrl: string | null };
  planLabel: string;
  percentUsed: number;
  collapsed?: boolean;
}

export function ProfileChip({ user, planLabel, percentUsed, collapsed = false }: Props) {
  const { openDrawer } = useAccountDrawer();
  const display = user.fullName ?? user.email ?? "Account";
  const initial = (user.fullName ?? user.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <button
      type="button"
      onClick={() => openDrawer("profile")}
      className={`flex w-full items-center gap-3 border-t border-[var(--color-fg-4)] py-3 hover:bg-[var(--color-fg-4)]/10 ${
        collapsed ? "justify-center px-2" : "px-3 text-left"
      }`}
      aria-label="Open account"
      title={collapsed ? display : undefined}
    >
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt="" width={28} height={28} className="rounded-full border border-[var(--color-fg-4)]" />
      ) : (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--color-fg-4)] bg-[var(--color-fg-4)]/20 font-mono text-xs text-[var(--color-fg-1)]">
          {initial}
        </div>
      )}
      <div
        className={`min-w-0 flex-1 transition-opacity duration-200 ease-out ${
          collapsed ? "pointer-events-none w-0 opacity-0" : "opacity-100"
        }`}
        aria-hidden={collapsed || undefined}
      >
        <div className="truncate text-sm text-[var(--color-fg-0)]">{display}</div>
        <div className="truncate font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)]">
          {planLabel} · {percentUsed}% used
        </div>
      </div>
    </button>
  );
}
