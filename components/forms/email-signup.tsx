"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  signupForBranchUpdates,
  type SignupResult,
} from "@/app/actions/email-signup";

interface EmailSignupProps {
  branchSlug: string;
  className?: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-[var(--color-cyan)] px-6 py-3 font-mono text-sm uppercase tracking-wider text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Sending…" : "→ Notify me"}
    </button>
  );
}

export function EmailSignup({ branchSlug, className }: EmailSignupProps) {
  const [state, formAction] = useActionState<SignupResult | null, FormData>(
    signupForBranchUpdates,
    null,
  );

  return (
    <div className={`max-w-md ${className ?? ""}`}>
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)]">
        GET NOTIFIED
      </div>
      <p className="mt-3 text-sm text-[var(--color-fg-1)]">
        Enter your email and we'll ping you once this branch is live. No spam,
        no tracking, unsubscribe in one click.
      </p>
      <form action={formAction} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input type="hidden" name="branchSlug" value={branchSlug} />
        <input
          type="email"
          name="email"
          required
          placeholder="your@email.com"
          className="flex-1 bg-[var(--color-bg-1)] border border-[var(--color-fg-3)] px-4 py-3 font-mono text-sm text-[var(--color-fg-0)] placeholder:text-[var(--color-fg-2)] focus:outline-none focus:border-[var(--color-cyan)] focus:ring-2 focus:ring-[var(--color-cyan)]/30"
        />
        <SubmitButton />
      </form>
      {state && (
        <div
          className={`mt-4 font-mono text-xs uppercase tracking-wider ${
            state.ok
              ? "text-[var(--color-cyan)]"
              : "text-[var(--color-magenta)]"
          }`}
        >
          {state.message}
        </div>
      )}
    </div>
  );
}
