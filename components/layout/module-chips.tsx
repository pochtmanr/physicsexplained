"use client";

import { useEffect, useRef, useState } from "react";

interface ModuleChipsProps {
  modules: { slug: string; index: number; title: string }[];
  /** Pixel offset from viewport top when scrolling — should clear sticky nav + chips bar. */
  scrollOffset?: number;
}

export function ModuleChips({ modules, scrollOffset = 120 }: ModuleChipsProps) {
  const [activeSlug, setActiveSlug] = useState<string>(modules[0]?.slug ?? "");
  const containerRef = useRef<HTMLDivElement>(null);
  // Pins the active chip while a click-initiated smooth scroll is in flight,
  // so IntersectionObserver doesn't flicker to intermediate sections.
  const lockedSlugRef = useRef<string | null>(null);
  const scrollEndTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const sections = modules
      .map((m) => document.getElementById(`module-${m.slug}`))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (lockedSlugRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const id = visible[0].target.id.replace(/^module-/, "");
          setActiveSlug(id);
        }
      },
      {
        rootMargin: "-140px 0px -55% 0px",
        threshold: [0, 0.1, 0.25, 0.5],
      },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [modules]);

  useEffect(() => {
    return () => {
      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current);
      }
    };
  }, []);

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

    // Lock the active chip while smooth-scroll is in flight.
    lockedSlugRef.current = slug;
    setActiveSlug(slug);
    history.replaceState(null, "", `#module-${slug}`);

    window.scrollTo({ top: y, behavior: "smooth" });

    // Release the lock when scrolling settles. `scrollend` is the precise
    // signal in modern browsers; a timer falls back for Safari and covers
    // the edge case where we're already at the target (no scrollend fires).
    if (scrollEndTimerRef.current !== null) {
      window.clearTimeout(scrollEndTimerRef.current);
    }
    const release = () => {
      lockedSlugRef.current = null;
      window.removeEventListener("scrollend", release);
      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current);
        scrollEndTimerRef.current = null;
      }
    };
    window.addEventListener("scrollend", release, { once: true });
    scrollEndTimerRef.current = window.setTimeout(release, 1200);
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
