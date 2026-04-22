"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, User, BookOpen, Search, Sun, Moon } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { locales, getDirection } from "@/i18n/config";
import { BRANCHES } from "@/lib/content/branches";
import { Logo } from "./logo";
import { WIDE_CONTAINER } from "@/lib/layout";

const STORAGE_KEY = "physics-theme";
type Theme = "dark" | "light";

function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

const LOCALE_LABELS: Record<string, { code: string; name: string }> = {
  en: { code: "EN", name: "English" },
  he: { code: "HE", name: "עברית" },
};

export function MobileNav() {
  const tNav = useTranslations("common.nav");
  const tBranches = useTranslations("home.branches");
  const tSearch = useTranslations("common.search");
  const tTheme = useTranslations("common.theme");

  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getInitialTheme());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage blocked — theme still applies for this session
    }
  };

  const openSearch = () => {
    close();
    // Let the drawer animation settle before dispatching.
    setTimeout(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          metaKey: true,
          bubbles: true,
        }),
      );
    }, 120);
  };

  const items = tBranches.raw("items") as Record<
    string,
    { title: string; subtitle: string } | undefined
  >;

  const themeLabel = mounted
    ? theme === "dark"
      ? tTheme("light")
      : tTheme("dark")
    : tTheme("initial");
  const ThemeIcon = mounted ? (theme === "dark" ? Sun : Moon) : Sun;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center border border-[var(--color-fg-4)] text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)] md:hidden"
      >
        {open ? (
          <X aria-hidden="true" size={18} strokeWidth={1.5} />
        ) : (
          <Menu aria-hidden="true" size={18} strokeWidth={1.5} />
        )}
      </button>

      {/* Drawer uses display:none when closed (not opacity:0) so iOS 26
          Safari's Liquid Glass tinting algorithm can't sample its dark
          bg and paint the bottom toolbar dark on every page. */}
      <div
        aria-hidden={!open}
        hidden={!open}
        className="fixed inset-0 z-50 md:hidden bg-[var(--color-bg-0)] overflow-y-auto overscroll-contain"
      >
        <div className="sticky top-0 z-10 border-b border-[var(--color-fg-4)]/40 bg-[var(--color-bg-0)]">
          <div className={`${WIDE_CONTAINER} flex items-center justify-between gap-4 py-2.5`}>
            <Link
              href="/"
              onClick={close}
              aria-label={tNav("homeAriaLabel")}
              className="inline-flex items-center gap-2.5 font-display text-base leading-none tracking-tight whitespace-nowrap"
            >
              <Logo className="h-5 w-auto" />
              <div>
                <span className="text-[var(--color-fg-0)] font-semibold">Physics.</span>
                <span className="text-[var(--color-cyan)] font-semibold">explained</span>
              </div>
            </Link>
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="inline-flex h-9 w-9 items-center justify-center border border-[var(--color-fg-4)] text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)]"
            >
              <X aria-hidden="true" size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[640px] px-6 py-8">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
            {tBranches("tag")}
          </div>
          <ul className="grid grid-cols-1 gap-0 [&>li]:-mt-px">
            {BRANCHES.map((b) => {
              const isComingSoon = b.status === "coming-soon";
              const item = items[b.slug];
              const title = item?.title ?? b.title;
              return (
                <li key={b.slug}>
                  <Link
                    href={`/${b.slug}`}
                    onClick={close}
                    className="group flex items-center justify-between border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] px-4 py-3 transition-colors hover:border-[var(--color-cyan)]"
                  >
                    <div className="flex min-w-0 items-baseline gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-cyan-dim)] shrink-0">
                        {b.eyebrow}
                      </span>
                      <span
                        className={`truncate font-mono text-xs uppercase tracking-wider ${
                          isComingSoon
                            ? "text-[var(--color-fg-3)]"
                            : "text-[var(--color-fg-0)]"
                        }`}
                      >
                        {title}
                      </span>
                    </div>
                    {isComingSoon ? (
                      <span className="ms-3 shrink-0 border border-[var(--color-magenta)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--color-magenta)]">
                        {tBranches("comingSoon")}
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="ms-3 inline-flex h-5 w-5 shrink-0 items-center justify-center text-base text-[var(--color-fg-3)] group-hover:text-[var(--color-cyan)] rtl:-scale-x-100"
                      >
                        →
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
            EXPLORE
          </div>
          <ul className="grid grid-cols-1 gap-0 [&>li]:-mt-px">
            <li>
              <Link
                href="/physicists"
                onClick={close}
                className="flex items-center gap-3 border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] px-4 py-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-0)] transition-colors hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)]"
              >
                <User aria-hidden="true" size={14} strokeWidth={1.5} />
                {tNav("physicists")}
              </Link>
            </li>
            <li>
              <Link
                href="/dictionary"
                onClick={close}
                className="flex items-center gap-3 border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] px-4 py-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-0)] transition-colors hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)]"
              >
                <BookOpen aria-hidden="true" size={14} strokeWidth={1.5} />
                {tNav("dictionary")}
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={openSearch}
                className="flex w-full items-center gap-3 border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] px-4 py-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-0)] transition-colors hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)]"
              >
                <Search aria-hidden="true" size={14} strokeWidth={1.5} />
                {tSearch("triggerText")}
              </button>
            </li>
          </ul>

          <div className="mt-8 grid grid-cols-2 gap-0 [&>*]:-ms-px">
            <div className="-ms-0 border border-[var(--color-fg-4)] bg-[var(--color-bg-1)]">
              <div className="px-4 pt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-3)]">
                LANG
              </div>
              <div className="grid grid-cols-2 gap-0 px-2 py-2 [&>*]:mx-1">
                {locales.map((loc) => {
                  const label = LOCALE_LABELS[loc];
                  const isActive = loc === locale;
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        if (loc !== locale) {
                          document.documentElement.dir = getDirection(loc);
                          document.documentElement.lang = loc;
                          router.replace(pathname, { locale: loc });
                        }
                        close();
                      }}
                      className={`py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                        isActive
                          ? "text-[var(--color-cyan)]"
                          : "text-[var(--color-fg-1)] hover:text-[var(--color-cyan)]"
                      }`}
                    >
                      {label?.code ?? loc.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex flex-col items-start gap-2 border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] px-4 py-3 text-start transition-colors hover:border-[var(--color-cyan)]"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-3)]">
                THEME
              </div>
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-0)]">
                <ThemeIcon aria-hidden="true" size={14} strokeWidth={1.5} />
                {themeLabel}
              </div>
            </button>
          </div>
          <div className="h-12" />
        </div>
      </div>
    </>
  );
}
