"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { locales, getDirection } from "@/i18n/config";

const LOCALE_LABELS: Record<string, { code: string; name: string }> = {
  en: { code: "EN", name: "English" },
  he: { code: "HE", name: "עברית" },
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const current = LOCALE_LABELS[locale];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={isPending}
        className="inline-flex cursor-pointer items-center gap-1.5 border border-[var(--color-fg-4)] px-2 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)] disabled:opacity-60 md:px-3"
      >
        <span>{current?.code ?? locale.toUpperCase()}</span>
        <ChevronDown
          aria-hidden="true"
          size={12}
          strokeWidth={1.5}
          className={`transition-transform duration-[var(--duration-fast)] ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute end-0 top-full z-30 mt-2 min-w-full border border-[var(--color-fg-4)] bg-[var(--color-bg-0)]/95 backdrop-blur-sm"
        >
          {locales.map((loc) => {
            const label = LOCALE_LABELS[loc];
            const isActive = loc === locale;
            return (
              <li key={loc} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    if (loc !== locale) {
                      // Flip <html dir/lang> immediately so the layout
                      // mirrors without waiting for the navigation commit.
                      document.documentElement.dir = getDirection(loc);
                      document.documentElement.lang = loc;
                      startTransition(() => {
                        router.replace(pathname, { locale: loc });
                      });
                    }
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-4 px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                    isActive
                      ? "text-[var(--color-cyan)]"
                      : "text-[var(--color-fg-1)] hover:bg-[var(--color-bg-2)] hover:text-[var(--color-cyan)]"
                  }`}
                >
                  <span>{label?.code ?? loc.toUpperCase()}</span>
                  <span className="text-[var(--color-fg-3)] normal-case tracking-normal">
                    {label?.name ?? loc}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
