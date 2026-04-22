"use client";
import { useTransition } from "react";
import { signOut } from "@/app/actions/auth";

export function SignOutButton() {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(async () => { await signOut(); })}
      disabled={pending}
      className="border rounded px-4 py-2 text-sm hover:bg-muted disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
