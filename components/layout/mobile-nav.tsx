"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, User, BookOpen, Search, Sun, Moon, Sparkles, Gamepad2 } from "lucide-react";
import { useTranslations } from "next-intl";
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

// Bare icon control — no keycap body, just the glyph. The burger / close
// triggers read as plain marks that tint cyan on hover, rather than boxed
// buttons competing with the wordmark beside them.
const ICON_BTN =
  "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] " +
  "text-[var(--color-fg-1)] transition-colors duration-[var(--duration-fast)] ease-out " +
  "hover:text-[var(--color-cyan)] active:translate-y-px " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cyan)]/50";

// Keycap chrome for the redesigned drawer. These rows are full-width panels with
// their own internal layout (space-between, icon + label), not centered pills, so
// the bevel is applied directly with the shared shadow tokens rather than through
// the centered `Button` component — same look the topic-nav panels use.
const ROW_BASE =
  "btn-tracer rounded-[var(--radius-control)] " +
  "transition-[box-shadow,background-color,border-color,color,transform] " +
  "duration-[var(--duration-fast)] ease-out active:translate-y-px " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cyan)]/50";
const ROW_GHOST =
  "border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] text-[var(--color-fg-0)] " +
  "shadow-[var(--shadow-control)] hover:border-[var(--color-cyan-dim)] " +
  "hover:text-[var(--color-cyan-dim)] hover:shadow-[var(--shadow-control-hover)]";
const ROW_PRIMARY =
  "border border-[var(--color-cyan)] bg-[var(--color-cyan)] !text-white " +
  "shadow-[var(--shadow-control-primary)] hover:bg-[var(--color-cyan-dim)] " +
  "hover:border-[var(--color-cyan-dim)] hover:shadow-[var(--shadow-control-primary-hover)]";
// Pressed-in keycap for the selected theme — cyan surface + inset shadow, the
// inverse of the raised resting bevel (mirrors the shared button ACTIVE token).
const ROW_ACTIVE =
  "border border-[var(--color-cyan)] text-[var(--color-cyan)] " +
  "bg-[color-mix(in_srgb,var(--color-cyan)_18%,transparent)] " +
  "shadow-[inset_0_2px_4px_-1px_color-mix(in_srgb,var(--color-cyan)_35%,transparent)]";

export function MobileNav() {
  const tNav = useTranslations("common.nav");
  const tBranches = useTranslations("home.branches");
  const tSearch = useTranslations("common.search");
  const tTheme = useTranslations("common.theme");

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

  const applyTheme = (next: Theme) => {
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

  const themes = [
    { value: "light", label: tTheme("light"), Icon: Sun },
    { value: "dark", label: tTheme("dark"), Icon: Moon },
  ] as const;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className={`${ICON_BTN} -me-2 min-[1201px]:hidden`}
      >
        {open ? (
          <X aria-hidden="true" size={20} strokeWidth={1.5} />
        ) : (
          <Menu aria-hidden="true" size={20} strokeWidth={1.5} />
        )}
      </button>

      {/* Drawer uses display:none when closed (not opacity:0) so iOS 26
          Safari's Liquid Glass tinting algorithm can't sample its dark
          bg and paint the bottom toolbar dark on every page. */}
      <div
        aria-hidden={!open}
        hidden={!open}
        className="fixed inset-0 z-50 min-[1201px]:hidden bg-[var(--color-bg-0)] overflow-y-auto overscroll-contain"
      >
        <div className="sticky top-0 z-10 border-b border-[var(--color-fg-4)]/40 bg-[var(--color-bg-0)]">
          <div className={`${WIDE_CONTAINER} flex h-12 items-center justify-between gap-4`}>
            <Link
              href="/"
              onClick={close}
              aria-label={tNav("homeAriaLabel")}
              className="inline-flex items-center gap-1 font-display text-base leading-none tracking-tight whitespace-nowrap"
            >
              <Logo className="h-4 w-auto" />
              <div>
                <span className="text-[var(--color-fg-0)]">Physics.</span>
                <span className="text-[var(--color-cyan)]">explained</span>
              </div>
            </Link>
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className={`${ICON_BTN} -me-2`}
            >
              <X aria-hidden="true" size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[640px] px-6 py-8">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
            {tBranches("tag")}
          </div>
          <ul className="grid grid-cols-1 gap-2">
            {BRANCHES.map((b) => {
              const isComingSoon = b.status === "coming-soon";
              const item = items[b.slug];
              const title = item?.title ?? b.title;
              return (
                <li key={b.slug}>
                  <Link
                    href={`/${b.slug}`}
                    onClick={close}
                    className={`group flex items-center justify-between px-4 py-3 ${ROW_BASE} ${ROW_GHOST}`}
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
          <ul className="grid grid-cols-1 gap-2">
            <li>
              <Link
                href="/ask"
                onClick={close}
                className={`flex items-center gap-3 px-4 py-3 font-mono text-xs uppercase tracking-wider ${ROW_BASE} ${ROW_PRIMARY}`}
              >
                <Sparkles aria-hidden="true" size={14} strokeWidth={1.5} />
                Ask
              </Link>
            </li>
            <li>
              <Link
                href="/physicists"
                onClick={close}
                className={`flex items-center gap-3 px-4 py-3 font-mono text-xs uppercase tracking-wider ${ROW_BASE} ${ROW_GHOST}`}
              >
                <User aria-hidden="true" size={14} strokeWidth={1.5} />
                {tNav("physicists")}
              </Link>
            </li>
            <li>
              <Link
                href="/dictionary"
                onClick={close}
                className={`flex items-center gap-3 px-4 py-3 font-mono text-xs uppercase tracking-wider ${ROW_BASE} ${ROW_GHOST}`}
              >
                <BookOpen aria-hidden="true" size={14} strokeWidth={1.5} />
                {tNav("dictionary")}
              </Link>
            </li>
            <li>
              <Link
                href="/play"
                onClick={close}
                className={`flex items-center gap-3 px-4 py-3 font-mono text-xs uppercase tracking-wider ${ROW_BASE} ${ROW_GHOST}`}
              >
                <Gamepad2 aria-hidden="true" size={14} strokeWidth={1.5} />
                {tNav("play")}
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={openSearch}
                className={`flex w-full items-center gap-3 px-4 py-3 font-mono text-xs uppercase tracking-wider ${ROW_BASE} ${ROW_GHOST}`}
              >
                <Search aria-hidden="true" size={14} strokeWidth={1.5} />
                {tSearch("triggerText")}
              </button>
            </li>
          </ul>

          <div className="mt-8 mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
            {tTheme("initial")}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {themes.map(({ value, label, Icon }) => {
              const isActive = mounted && theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => applyTheme(value)}
                  aria-pressed={isActive}
                  className={`flex items-center justify-center gap-2 px-4 py-3 font-mono text-xs uppercase tracking-wider ${ROW_BASE} ${
                    isActive ? ROW_ACTIVE : ROW_GHOST
                  }`}
                >
                  <Icon aria-hidden="true" size={14} strokeWidth={1.5} />
                  {label}
                </button>
              );
            })}
          </div>
          <div className="h-12" />
        </div>
      </div>
    </>
  );
}
