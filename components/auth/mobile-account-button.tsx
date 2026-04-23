"use client";
import { useAccountDrawer } from "@/components/account/account-drawer-context";

interface Props {
  avatarUrl: string | null;
  initial: string;
}

export function MobileAccountButton({ avatarUrl, initial }: Props) {
  const { openDrawer } = useAccountDrawer();
  return (
    <button
      type="button"
      onClick={() => openDrawer("profile")}
      aria-label="Open account"
      className="md:hidden fixed top-3 right-3 z-30 w-9 h-9 rounded-full border border-[var(--color-fg-4)] bg-[var(--color-bg-1)]/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-[var(--color-fg-4)]/20"
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" width={28} height={28} className="rounded-full" />
      ) : (
        <span className="font-mono text-xs text-[var(--color-fg-1)]">{initial}</span>
      )}
    </button>
  );
}
