"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import {
  signupForBranchUpdates,
  type SignupResult,
} from "@/app/actions/email-signup";

interface EmailSignupProps {
  branchSlug: string;
  className?: string;
}

function SubmitButton() {
  const t = useTranslations("home.emailSignup");
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-[var(--color-cyan)] px-6 py-3 font-mono text-sm uppercase tracking-wider text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? t("submitting") : t("submit")}
    </button>
  );
}

export function EmailSignup({ branchSlug, className }: EmailSignupProps) {
  const t = useTranslations("home.emailSignup");
  const [state, formAction] = useActionState<SignupResult | null, FormData>(
    signupForBranchUpdates,
    null,
  );

  return (
    <div className={`max-w-md ${className ?? ""}`}>
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
        {t("eyebrow")}
      </div>
      <p className="mt-3 text-sm text-[var(--color-fg-1)]">{t("body")}</p>
      <form action={formAction} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input type="hidden" name="branchSlug" value={branchSlug} />
        <input
          type="email"
          name="email"
          required
          placeholder={t("placeholder")}
          className="flex-1 bg-[var(--color-bg-1)] border border-[var(--color-fg-4)] px-4 py-3 font-mono text-sm text-[var(--color-fg-0)] placeholder:text-[var(--color-fg-3)] focus:outline-none focus:border-[var(--color-cyan)] focus:ring-2 focus:ring-[var(--color-cyan)]/30"
        />
        <SubmitButton />
      </form>
      {state && (
        <div
          className={`mt-4 font-mono text-xs uppercase tracking-wider ${
            state.ok
              ? "text-[var(--color-mint)]"
              : "text-[var(--color-magenta)]"
          }`}
        >
          {state.message}
        </div>
      )}
    </div>
  );
}
