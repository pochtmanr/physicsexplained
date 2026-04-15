"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import {
  subscribeToNewsletter,
  type NewsletterResult,
} from "@/app/actions/newsletter";

export function NewsletterForm() {
  const [state, formAction, isPending] = useActionState<
    NewsletterResult | null,
    FormData
  >(subscribeToNewsletter, null);

  return (
    <div className="w-full max-w-md">
      <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-fg-2)] mb-3">
        Stay in the loop
      </p>

      {state?.ok ? (
        <p className="font-mono text-sm text-[var(--color-cyan)]">
          {state.message}
        </p>
      ) : (
        <form action={formAction} className="flex flex-wrap gap-2">
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            aria-label="Email address"
            className="min-w-0 flex-1 basis-48 border border-[var(--color-fg-3)] bg-transparent px-3 py-2 font-mono text-sm text-[var(--color-fg-0)] placeholder:text-[var(--color-fg-2)] outline-none transition-colors duration-[var(--duration-fast)] focus:border-[var(--color-cyan)]"
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 border border-[var(--color-cyan)] bg-[var(--color-cyan)]/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-cyan)]/20 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {isPending ? "..." : "Subscribe"}
          </button>
        </form>
      )}

      {state && !state.ok && (
        <p className="mt-2 font-mono text-xs text-red-400">{state.message}</p>
      )}
    </div>
  );
}
