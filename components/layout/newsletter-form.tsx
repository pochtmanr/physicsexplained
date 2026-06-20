"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import {
  subscribeToNewsletter,
  type NewsletterResult,
} from "@/app/actions/newsletter";
import { Button } from "@/components/ui/button";

export function NewsletterForm() {
  const [state, formAction, isPending] = useActionState<
    NewsletterResult | null,
    FormData
  >(subscribeToNewsletter, null);

  return (
    <div className="w-full max-w-md">
      <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-fg-3)] mb-3">
        Stay in the loop
      </p>

      {state?.ok ? (
        <p className="font-mono text-sm text-[var(--color-mint)]">
          {state.message}
        </p>
      ) : (
        <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            aria-label="Email address"
            className="min-w-0 flex-1 h-8 rounded-[var(--radius-control)] border border-[var(--color-fg-4)] bg-[color-mix(in_srgb,var(--color-fg-4)_22%,transparent)] px-3 font-mono text-xs text-[var(--color-fg-0)] placeholder:text-[var(--color-fg-3)] shadow-[var(--shadow-control)] outline-none transition-colors duration-[var(--duration-fast)] focus:border-[var(--color-cyan)]"
          />
          <Button
            variant="secondary"
            size="sm"
            type="submit"
            disabled={isPending}
          >
            <Send className="h-3.5 w-3.5" />
            {isPending ? "..." : "Subscribe"}
          </Button>
        </form>
      )}

      {state && !state.ok && (
        <p className="mt-2 font-mono text-xs text-red-400">{state.message}</p>
      )}
    </div>
  );
}
