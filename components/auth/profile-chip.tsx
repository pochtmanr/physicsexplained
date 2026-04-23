"use client";
import { useAccountDrawer } from "@/components/account/account-drawer-context";

interface Props {
  user: { fullName: string | null; email: string | null; avatarUrl: string | null };
  planLabel: string;
  percentUsed: number;
}

export function ProfileChip({ user, planLabel, percentUsed }: Props) {
  const { openDrawer } = useAccountDrawer();
  const display = user.fullName ?? user.email ?? "Account";
  const initial = (user.fullName ?? user.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <button
      type="button"
      onClick={() => openDrawer("profile")}
      className="w-full flex items-center gap-3 px-3 py-3 border-t border-[var(--color-fg-4)] hover:bg-[var(--color-fg-4)]/10 text-left"
      aria-label="Open account"
    >
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt="" width={28} height={28} className="rounded-full border border-[var(--color-fg-4)]" />
      ) : (
        <div className="w-7 h-7 rounded-full border border-[var(--color-fg-4)] bg-[var(--color-fg-4)]/20 flex items-center justify-center font-mono text-xs text-[var(--color-fg-1)]">
          {initial}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm text-[var(--color-fg-0)] truncate">{display}</div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)] truncate">
          {planLabel} · {percentUsed}% used
        </div>
      </div>
    </button>
  );
}
