"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "physics-cookie-consent";

export function CookieBanner() {
  const t = useTranslations("common.cookieBanner");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (consent !== "accepted") {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable — show banner as fallback
      setVisible(true);
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // silently proceed if storage is blocked
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="banner"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--color-fg-3)]/40 bg-[var(--color-bg-1)]/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <p className="text-sm text-[var(--color-fg-1)]">
          {t("message")}{" "}
          <Link
            href="/cookies"
            className="text-[var(--color-cyan)] underline underline-offset-2"
          >
            {t("linkText")}
          </Link>
        </p>
        <button
          onClick={accept}
          className="shrink-0 cursor-pointer border border-[var(--color-cyan)] bg-[var(--color-cyan)]/10 px-5 py-2 font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-cyan)] transition-all duration-[var(--duration-fast)] hover:bg-[var(--color-cyan)]/20 hover:shadow-[0_0_12px_var(--color-glow)]"
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
