"use client";
import { useState } from "react";
import { DeleteConfirm } from "./delete-confirm";
import { UsageMeter } from "./usage-meter";
import type { BillingSnapshot } from "@/lib/billing/snapshot";
import { deleteAllChats, deleteAccount } from "@/app/actions/account";
import { useAccountDrawer } from "./account-drawer-context";

interface Props {
  user: { id: string; email: string | null; fullName: string | null; avatarUrl: string | null; provider: string; joined: string };
  snapshot: BillingSnapshot | null;
}

export function ProfileTab({ user, snapshot }: Props) {
  const [modal, setModal] = useState<"none" | "chats" | "account">("none");
  const { setTab } = useAccountDrawer();

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" width={48} height={48} className="rounded-full border border-[var(--color-fg-4)]" />
        ) : (
          <div className="w-12 h-12 rounded-full border border-[var(--color-fg-4)] bg-[var(--color-fg-4)]/20 flex items-center justify-center font-mono text-sm text-[var(--color-fg-1)]">
            {(user.fullName ?? user.email ?? "?").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-[var(--color-fg-0)] truncate">{user.fullName ?? user.email ?? "—"}</div>
          <div className="font-mono text-xs text-[var(--color-fg-3)] truncate">{user.email ?? ""}</div>
        </div>
      </header>

      {snapshot && (
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">Usage</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)]">
              Plan: <span className="text-[var(--color-fg-0)]">{snapshot.plan.label}</span>
            </div>
          </div>
          <UsageMeter snapshot={snapshot} />
          {snapshot.plan.id === "free" && (
            <button
              type="button"
              onClick={() => setTab("billing")}
              className="mt-4 w-full bg-[var(--color-cyan)] text-[var(--color-bg-0)] px-4 py-2.5 font-mono text-xs uppercase tracking-[0.2em] hover:opacity-90"
            >
              Upgrade plan →
            </button>
          )}
          {snapshot.plan.id !== "free" && (
            <button
              type="button"
              onClick={() => setTab("billing")}
              className="mt-4 w-full border border-[var(--color-cyan-dim)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)] hover:bg-[var(--color-cyan-dim)]/10"
            >
              Manage subscription →
            </button>
          )}
        </section>
      )}

      <section className="space-y-2">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">Info</div>
        <Row label="User ID" value={user.id} mono />
        <Row label="Provider" value={user.provider} />
        <Row label="Joined" value={user.joined} last />
      </section>

      <section className="space-y-3 pt-3 border-t border-[var(--color-fg-4)]">
        <button
          type="button"
          onClick={() => setModal("chats")}
          className="w-full border border-[var(--color-magenta)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-magenta)] hover:bg-[var(--color-magenta)]/10"
        >
          Delete all chats
        </button>
        <button
          type="button"
          onClick={() => setModal("account")}
          className="w-full bg-[var(--color-magenta)] text-[var(--color-bg-0)] px-4 py-2 font-mono text-xs uppercase tracking-wider hover:opacity-90"
        >
          Delete account
        </button>
      </section>

      <DeleteConfirm
        open={modal === "chats"}
        onClose={() => setModal("none")}
        title="Delete all chats"
        description="This permanently removes every conversation and message. This cannot be undone."
        expected="delete chats"
        action={async (t) => deleteAllChats(t)}
      />
      <DeleteConfirm
        open={modal === "account"}
        onClose={() => setModal("none")}
        title="Delete account"
        description="This cancels your subscription, deletes all chats and data, and removes your account. This cannot be undone."
        expected={user.email ?? ""}
        action={async (t) => deleteAccount(t)}
      />
    </div>
  );
}

function Row({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 py-2 ${last ? "" : "border-b border-[var(--color-fg-4)]"}`}>
      <dt className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)] shrink-0">{label}</dt>
      <dd className={`text-[var(--color-fg-1)] text-sm text-right truncate min-w-0 ${mono ? "font-mono text-xs" : ""}`} title={value}>
        {value}
      </dd>
    </div>
  );
}
