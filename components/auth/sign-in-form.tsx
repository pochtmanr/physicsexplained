"use client";
import { useState, useTransition } from "react";
import { signInWithGoogle } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function SignInForm({ next }: { next: string }) {
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const onGoogle = () =>
    start(async () => {
      const res = await signInWithGoogle(next);
      if (res?.error) setErrMsg(res.error);
    });

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        type="button"
        onClick={onGoogle}
        disabled={pending}
        className="w-full"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-3.5 w-3.5"
        >
          <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
        </svg>
        {pending ? "Connecting…" : "Continue with Google"}
      </Button>

      {errMsg && (
        <p className="mt-4 font-mono text-xs uppercase tracking-wider text-[var(--color-magenta)]">
          {errMsg}
        </p>
      )}
    </>
  );
}
