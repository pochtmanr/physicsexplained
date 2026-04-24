"use client";

import { useEffect, useMemo, useRef } from "react";
import { useActiveSection } from "@/lib/hooks/use-active-section";

interface CenturyChipsProps {
  centuries: { slug: string; label: string; count: number }[];
  scrollOffset?: number;
}

export function CenturyChips({
  centuries,
  scrollOffset = 120,
}: CenturyChipsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slugs = useMemo(() => centuries.map((c) => c.slug), [centuries]);
  const { activeSlug, lock } = useActiveSection(slugs, "century-", {
    activationOffset: 160,
  });

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
    const target = document.getElementById(`century-${slug}`);
    if (!target) return;
    e.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY - scrollOffset;
    lock(slug);
    history.replaceState(null, "", `#century-${slug}`);
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  return (
    <div
      className="sticky top-12 md:top-14 z-40 -mx-6 md:-mx-8 mt-10 border-y border-[var(--color-fg-4)]/60 bg-[var(--color-bg-0)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-0)]/85"
      role="navigation"
      aria-label="Centuries"
    >
      <div
        ref={containerRef}
        className="no-scrollbar flex items-center gap-2 overflow-x-auto px-6 py-2.5 md:px-8"
      >
        {centuries.map((c) => {
          const isActive = c.slug === activeSlug;
          return (
            <a
              key={c.slug}
              href={`#century-${c.slug}`}
              data-slug={c.slug}
              onClick={(e) => handleClick(e, c.slug)}
              aria-current={isActive ? "true" : undefined}
              className={`nav-link group inline-flex shrink-0 items-center gap-2 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                isActive
                  ? "border-[var(--color-cyan)] bg-[var(--color-cyan)] text-[var(--color-bg-0)] shadow-[0_0_0_1px_var(--color-cyan),0_8px_24px_-12px_var(--color-glow)]"
                  : "border-[var(--color-fg-4)] text-[var(--color-fg-2)] hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)]"
              }`}
            >
              <span>{c.label}</span>
              <span
                className={`font-semibold tabular-nums ${
                  isActive
                    ? "text-[var(--color-bg-0)] opacity-70"
                    : "text-[var(--color-fg-3)]"
                }`}
              >
                {c.count}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
