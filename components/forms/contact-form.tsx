"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  submitContactMessage,
  type ContactResult,
} from "@/app/actions/contact";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-[var(--color-cyan)] px-6 py-3 font-mono text-sm uppercase tracking-wider text-[var(--color-cyan)] transition hover:bg-[var(--color-cyan)]/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Sending…" : "→ Send message"}
    </button>
  );
}

export function ContactForm({ className }: { className?: string }) {
  const [state, formAction] = useActionState<ContactResult | null, FormData>(
    submitContactMessage,
    null,
  );

  return (
    <form action={formAction} className={`flex flex-col gap-4 ${className ?? ""}`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-2)]">
            Name
          </span>
          <input
            type="text"
            name="name"
            required
            minLength={2}
            placeholder="Ada Lovelace"
            className="bg-[var(--color-bg-1)] border border-[var(--color-fg-3)] px-4 py-3 font-mono text-sm text-[var(--color-fg-0)] placeholder:text-[var(--color-fg-2)] focus:border-[var(--color-cyan)] focus:outline-none focus:ring-2 focus:ring-[var(--color-cyan)]/30"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-2)]">
            Email
          </span>
          <input
            type="email"
            name="email"
            required
            placeholder="you@domain.com"
            className="bg-[var(--color-bg-1)] border border-[var(--color-fg-3)] px-4 py-3 font-mono text-sm text-[var(--color-fg-0)] placeholder:text-[var(--color-fg-2)] focus:border-[var(--color-cyan)] focus:outline-none focus:ring-2 focus:ring-[var(--color-cyan)]/30"
          />
        </label>
      </div>
      <label className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-2)]">
          Message
        </span>
        <textarea
          name="message"
          required
          minLength={10}
          rows={6}
          placeholder="Tell us what's on your mind…"
          className="bg-[var(--color-bg-1)] border border-[var(--color-fg-3)] px-4 py-3 font-mono text-sm text-[var(--color-fg-0)] placeholder:text-[var(--color-fg-2)] focus:border-[var(--color-cyan)] focus:outline-none focus:ring-2 focus:ring-[var(--color-cyan)]/30"
        />
      </label>
      <div className="flex items-center justify-between gap-4">
        <SubmitButton />
        {state && (
          <div
            className={`font-mono text-xs uppercase tracking-wider ${
              state.ok
                ? "text-[var(--color-cyan)]"
                : "text-[var(--color-magenta)]"
            }`}
          >
            {state.message}
          </div>
        )}
      </div>
    </form>
  );
}
