"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import {
  signupForBranchUpdates,
  type SignupResult,
} from "@/app/actions/email-signup";
import { Button } from "@/components/ui/button";
import { TurnstileWidget } from "@/components/forms/turnstile-widget";

interface EmailSignupProps {
  branchSlug: string;
  className?: string;
}

function SubmitButton() {
  const t = useTranslations("home.emailSignup");
  const { pending } = useFormStatus();
  return (
    <Button variant="secondary" size="cta-row" type="submit" disabled={pending}>
      {pending ? t("submitting") : t("submit")}
    </Button>
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
      <form action={formAction} className="mt-6 flex flex-col gap-3">
        <input type="hidden" name="branchSlug" value={branchSlug} />
        {/* Honeypot: hidden from real users; trips naive bots. */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="email"
            name="email"
            required
            placeholder={t("placeholder")}
            className="flex-1 min-w-0 bg-[var(--color-bg-1)] border border-[var(--color-fg-4)] px-4 py-2.5 md:py-0 md:h-8 font-mono text-sm text-[var(--color-fg-0)] placeholder:text-[var(--color-fg-3)] focus:outline-none focus:border-[var(--color-cyan)] focus:ring-2 focus:ring-[var(--color-cyan)]/30"
          />
          <SubmitButton />
        </div>
        <TurnstileWidget />
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
