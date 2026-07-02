"use client";

import Script from "next/script";

/**
 * Cloudflare Turnstile widget for public forms.
 *
 * Cloudflare's script auto-renders any element with class `cf-turnstile` and
 * injects a hidden input named `cf-turnstile-response` into the enclosing form
 * on solve — which the server actions read and pass to verifyTurnstile().
 *
 * Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset, so forms work
 * before the keys are provisioned (the server side fails open to match).
 */
export function TurnstileWidget({ className }: { className?: string }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
        strategy="afterInteractive"
      />
      <div
        className={`cf-turnstile ${className ?? ""}`}
        data-sitekey={siteKey}
        data-theme="dark"
        data-size="flexible"
      />
    </>
  );
}
