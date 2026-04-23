"use client";
import { useTransition } from "react";
import { signOut } from "@/app/actions/auth";

export function SignOutButton() {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(async () => { await signOut(); })}
      disabled={pending}
      className="inline-flex items-center gap-2 border border-[var(--color-magenta)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-magenta)] transition-colors hover:bg-[var(--color-magenta)]/10 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
