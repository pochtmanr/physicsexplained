"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { BRANCHES } from "@/lib/content/branches";
import { WIDE_CONTAINER } from "@/lib/layout";

export function NavBranchMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
        className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] hover:text-[var(--color-cyan)] transition-colors duration-[180ms] ease-out"
      >
        BRANCHES {"\u25BE"}
      </button>

      {/* Mega panel — absolutely positioned inside the <nav> (sticky) so it
          spans the full nav width regardless of where the button sits. */}
      <div
        role="menu"
        aria-hidden={!open}
        className={`absolute inset-x-0 top-full z-30 max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain border-b border-[var(--color-fg-3)]/40 bg-[var(--color-bg-0)]/95 backdrop-blur-sm shadow-2xl transition-all duration-[200ms] ease-out ${
          open
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
      >
        <div className={`${WIDE_CONTAINER} py-6 md:py-10`}>
          <div className="mb-6 flex items-center justify-between">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)]">
              § BRANCHES
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-2)]">
              6 total · 1 live
            </div>
          </div>
          <ul className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-3 [&>li]:-mt-px [&>li]:-ml-px">
            {BRANCHES.map((b) => {
              const isComingSoon = b.status === "coming-soon";
              return (
                <li key={b.slug}>
                  <Link
                    role="menuitem"
                    href={`/${b.slug}`}
                    onClick={close}
                    className="group relative flex h-full min-h-[72px] flex-col border border-[var(--color-fg-3)] bg-[var(--color-bg-1)] p-3 transition-colors duration-[180ms] hover:z-10 hover:border-[var(--color-cyan)] md:min-h-[140px] md:p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-cyan)]">
                        {b.eyebrow}
                      </div>
                      <span
                        aria-hidden="true"
                        className="inline-flex h-5 w-5 items-center justify-center text-base leading-none text-[var(--color-fg-2)] transition-all duration-[240ms] ease-out group-hover:-rotate-45 group-hover:text-[var(--color-cyan)]"
                      >
                        →
                      </span>
                    </div>
                    <div
                      className={`mt-2 font-mono text-xs uppercase tracking-wider transition-colors group-hover:text-[var(--color-cyan)] md:mt-3 md:text-sm ${
                        isComingSoon
                          ? "text-[var(--color-fg-2)]"
                          : "text-[var(--color-fg-0)]"
                      }`}
                    >
                      {b.title}
                    </div>
                    <p className="mt-1.5 hidden text-xs leading-snug text-[var(--color-fg-2)] md:block">
                      {b.subtitle}
                    </p>
                    <div className="mt-auto hidden pt-4 md:block">
                      {isComingSoon ? (
                        <span className="inline-block border border-[var(--color-magenta)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--color-magenta)]">
                          COMING SOON
                        </span>
                      ) : (
                        <span className="inline-block border border-[var(--color-cyan)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--color-cyan)]">
                          {b.topics.length} TOPICS
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
