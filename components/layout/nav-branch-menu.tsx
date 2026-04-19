"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { GitBranch } from "lucide-react";
import { useTranslations } from "next-intl";
import { BRANCHES } from "@/lib/content/branches";
import { WIDE_CONTAINER } from "@/lib/layout";

export function NavBranchMenu() {
  const t = useTranslations("home.branches");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const items = useMemo(
    () =>
      t.raw("items") as Record<
        string,
        { title: string; subtitle: string } | undefined
      >,
    [t],
  );

  const stats = useMemo(() => {
    const total = BRANCHES.length;
    const live = BRANCHES.filter((b) => b.status === "live").length;
    return { total, live };
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleMouseDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 border border-[var(--color-fg-4)] px-2 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)] md:px-3"
      >
        <GitBranch aria-hidden="true" size={14} strokeWidth={1.5} />
        <span className="hidden md:inline">{t("menuLabel")}</span>
        <span className="text-[10px] leading-none">{"\u25BE"}</span>
      </button>

      {/* Mega panel — absolutely positioned inside the <nav> (sticky) so it
          spans the full nav width regardless of where the button sits. */}
      <div
        role="menu"
        aria-hidden={!open}
        className={`absolute inset-x-0 top-full z-30 max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain border-b border-[var(--color-fg-4)]/40 bg-[var(--color-bg-0)] shadow-[0_16px_32px_-8px_rgb(0_0_0_/_0.25)] transition-all duration-[200ms] ease-out ${
          open
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
      >
        <div className={`${WIDE_CONTAINER} py-6 md:py-10`}>
          <div className="mb-6 flex items-center justify-between">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
              {t("tag")}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)]">
              {t("menuStats", stats)}
            </div>
          </div>
          <ul className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-3 [&>li]:-mt-px [&>li]:-ms-px">
            {BRANCHES.map((b) => {
              const isComingSoon = b.status === "coming-soon";
              const item = items[b.slug];
              const title = item?.title ?? b.title;
              const subtitle = item?.subtitle ?? b.subtitle;
              return (
                <li key={b.slug}>
                  <Link
                    role="menuitem"
                    href={`/${b.slug}`}
                    onClick={close}
                    className="group relative flex h-full min-h-[72px] flex-col border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] p-3 transition-colors duration-[180ms] hover:z-10 hover:border-[var(--color-cyan)] md:min-h-[140px] md:p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-cyan-dim)]">
                        {b.eyebrow}
                      </div>
                      <span
                        aria-hidden="true"
                        className="inline-flex h-5 w-5 items-center justify-center text-base leading-none text-[var(--color-fg-3)] transition-all duration-[240ms] ease-out group-hover:-rotate-45 rtl:-scale-x-100 rtl:group-hover:rotate-45 group-hover:text-[var(--color-cyan)]"
                      >
                        →
                      </span>
                    </div>
                    <div
                      className={`mt-2 font-mono text-xs uppercase tracking-wider transition-colors group-hover:text-[var(--color-cyan)] md:mt-3 md:text-sm ${
                        isComingSoon
                          ? "text-[var(--color-fg-3)]"
                          : "text-[var(--color-fg-0)]"
                      }`}
                    >
                      {title}
                    </div>
                    <p className="mt-1.5 hidden text-xs leading-snug text-[var(--color-fg-3)] md:block">
                      {subtitle}
                    </p>
                    <div className="mt-auto hidden pt-4 md:block">
                      {isComingSoon ? (
                        <span className="inline-block border border-[var(--color-magenta)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--color-magenta)]">
                          {t("comingSoon")}
                        </span>
                      ) : (
                        <span className="inline-block border border-[var(--color-cyan-dim)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--color-cyan-dim)]">
                          {t("topicsCount", { count: b.topics.length })}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
