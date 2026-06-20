"use client";
import { useTransition } from "react";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="danger"
      onClick={() => start(async () => { await signOut(); })}
      disabled={pending}
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
