"use client";

import { useEffect, useMemo, useRef } from "react";
import { useActiveSection } from "@/lib/hooks/use-active-section";

interface ModuleChipsProps {
  modules: { slug: string; index: number; title: string }[];
  /** Pixel offset from viewport top when scrolling — should clear sticky nav + chips bar. */
  scrollOffset?: number;
}

export function ModuleChips({ modules, scrollOffset = 120 }: ModuleChipsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slugs = useMemo(() => modules.map((m) => m.slug), [modules]);
  const { activeSlug, lock } = useActiveSection(slugs, "module-", {
    activationOffset: 160,
  });

  // Keep the active chip in view as the user scrolls.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !activeSlug) return;
    const chip = container.querySelector<HTMLAnchorElement>(
      `[data-slug="${activeSlug}"]`,
    );
    if (!chip) return;
    const cRect = container.getBoundingClientRect();
    const bRect = chip.getBoundingClientRect();
    if (bRect.left < cRect.left || bRect.right > cRect.right) {
      chip.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeSlug]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, slug: string) {
    const target = document.getElementById(`module-${slug}`);
    if (!target) return;
    e.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY - scrollOffset;
    lock(slug);
    history.replaceState(null, "", `#module-${slug}`);
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  return (
    <div
      className="sticky top-12 md:top-14 z-40 -mx-6 md:-mx-8 mt-10 border-y border-[var(--color-fg-4)]/60 bg-[var(--color-bg-0)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-0)]/85"
      role="navigation"
      aria-label="Modules"
    >
      <div
        ref={containerRef}
        className="no-scrollbar flex items-center gap-2 overflow-x-auto px-6 py-2.5 md:px-8"
      >
        {modules.map((m) => {
          const isActive = m.slug === activeSlug;
          return (
            <a
              key={m.slug}
              href={`#module-${m.slug}`}
              data-slug={m.slug}
              onClick={(e) => handleClick(e, m.slug)}
              aria-current={isActive ? "true" : undefined}
              className={`nav-link group inline-flex shrink-0 items-center gap-2 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                isActive
                  ? "border-[var(--color-cyan)] bg-[var(--color-cyan)] text-[var(--color-bg-0)] shadow-[0_0_0_1px_var(--color-cyan),0_8px_24px_-12px_var(--color-glow)]"
                  : "border-[var(--color-fg-4)] text-[var(--color-fg-2)] hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)]"
              }`}
            >
              <span
                className={`font-semibold ${
                  isActive
                    ? "text-[var(--color-bg-0)] opacity-70"
                    : "text-[var(--color-fg-3)]"
                }`}
              >
                {String(m.index).padStart(2, "0")}
              </span>
              <span>{m.title}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
