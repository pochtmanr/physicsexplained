"use client";
import { useAccountDrawer } from "@/components/account/account-drawer-context";
import { Button } from "@/components/ui/button";

interface Props {
  avatarUrl: string | null;
  initial: string;
}

export function MobileAccountButton({ avatarUrl, initial }: Props) {
  const { openDrawer } = useAccountDrawer();
  return (
    <Button
      variant="icon"
      size="icon-lg"
      type="button"
      onClick={() => openDrawer("profile")}
      aria-label="Open account"
      className="md:hidden fixed top-3 right-3 z-30 !rounded-full backdrop-blur"
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" width={28} height={28} className="rounded-full" />
      ) : (
        <span className="font-mono text-xs text-[var(--color-fg-1)]">{initial}</span>
      )}
    </Button>
  );
}
