"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import { useAccountDrawer } from "./account-drawer-context";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { BillingSnapshot } from "@/lib/billing/snapshot";
import { ProfileTab } from "./profile-tab";
import { BillingTab } from "./billing-tab";

interface Props {
  user: { id: string; email: string | null; fullName: string | null; avatarUrl: string | null; provider: string; joined: string };
  snapshot: BillingSnapshot | null;
  orders: Array<{ id: string; plan: string; amount_cents: number; currency: string; state: string; created_at: string }>;
}

export function AccountDrawer({ user, snapshot, orders }: Props) {
  const { open, tab, setTab, closeDrawer } = useAccountDrawer();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeDrawer(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeDrawer]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-[var(--color-bg-0)]/60 backdrop-blur-sm" onClick={closeDrawer} />
      <aside className="absolute right-0 top-0 h-full w-full md:w-[420px] bg-[var(--color-bg-1)] border-l border-[var(--color-fg-4)] flex flex-col">
        <div className="flex items-center justify-between border-b border-[var(--color-fg-4)] px-4 py-3">
          <div className="inline-flex items-stretch rounded-sm border border-[var(--color-fg-4)] overflow-hidden">
            {(["profile", "billing"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`font-mono text-xs uppercase tracking-[0.15em] px-4 py-1.5 transition-colors ${
                  tab === t
                    ? "bg-[var(--color-cyan)] text-[var(--color-bg-0)]"
                    : "bg-transparent text-[var(--color-fg-1)] hover:bg-[var(--color-fg-4)]/20"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button type="button" onClick={closeDrawer} aria-label="Close" className="text-[var(--color-fg-3)] hover:text-[var(--color-fg-0)]">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "profile" ? <ProfileTab user={user} snapshot={snapshot} /> : <BillingTab snapshot={snapshot} orders={orders} />}
        </div>
        <div className="border-t border-[var(--color-fg-4)] p-4">
          <SignOutButton />
        </div>
      </aside>
    </div>
  );
}
