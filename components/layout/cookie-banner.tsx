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
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-50"
    >
      <div
        role="banner"
        aria-label="Cookie consent"
        className="pointer-events-auto sticky bottom-0 border-t border-[var(--color-fg-4)]/40 bg-[var(--color-bg-1)]/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-row items-center justify-between gap-3 px-4 py-3 md:gap-4 md:px-8 md:py-4">
          <p className="flex-1 text-xs text-[var(--color-fg-1)] sm:text-sm">
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
            className="shrink-0 cursor-pointer border border-[var(--color-cyan)] bg-[var(--color-cyan)]/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-cyan)] transition-all duration-[var(--duration-fast)] hover:bg-[var(--color-cyan)]/20 hover:shadow-[0_0_12px_var(--color-glow)] sm:px-5 sm:py-2 sm:text-xs"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
