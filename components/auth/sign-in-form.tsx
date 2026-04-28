"use client";
import { useState, useTransition } from "react";
import { signInWithGoogle } from "@/app/actions/auth";

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
      <button
        type="button"
        onClick={onGoogle}
        disabled={pending}
        className="nav-link btn-tracer group relative inline-flex w-full items-center justify-center gap-2 bg-[var(--color-cyan)] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-white transition-[box-shadow,background-color] duration-[180ms] ease-out hover:bg-[color-mix(in_srgb,var(--color-cyan)_92%,white)] hover:shadow-[0_8px_32px_-8px_color-mix(in_srgb,var(--color-cyan)_60%,transparent),0_0_48px_color-mix(in_srgb,var(--color-cyan)_25%,transparent)] disabled:cursor-not-allowed disabled:opacity-60 md:py-3 md:text-sm"
      >
        {pending ? "Connecting…" : "Continue with Google"}
        <span
          aria-hidden="true"
          className="inline-block transition-transform duration-[180ms] ease-out group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
        >
          →
        </span>
      </button>

      {errMsg && (
        <p className="mt-4 font-mono text-xs uppercase tracking-wider text-[var(--color-magenta)]">
          {errMsg}
        </p>
      )}
    </>
  );
}
