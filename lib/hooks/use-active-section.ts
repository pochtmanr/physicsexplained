"use client";

import { useEffect, useRef, useState } from "react";

interface Options {
  /** Pixel offset below the viewport top that defines the activation line.
   *  The last section whose top is <= this line becomes active. */
  activationOffset?: number;
}

/**
 * Tracks the active section for a sticky scroll-nav by picking the section
 * whose top has most-recently crossed a fixed activation line. Monotonic:
 * as you scroll down, sections activate one after another and never flip
 * back unless you scroll up — no IntersectionObserver tie-breaks, no flicker.
 *
 * Returns the active slug and a `lock(slug)` helper to pin the active slug
 * while a click-initiated smooth scroll is in flight.
 */
export function useActiveSection(
  slugs: readonly string[],
  idPrefix: string,
  options: Options = {},
) {
  const { activationOffset = 160 } = options;
  const [activeSlug, setActiveSlug] = useState<string>(slugs[0] ?? "");
  const lockedRef = useRef<string | null>(null);

  useEffect(() => {
    if (slugs.length === 0) return;

    let raf = 0;

    const compute = () => {
      raf = 0;
      if (lockedRef.current) return;

      const line = activationOffset;
      let chosen: string = slugs[0];
      for (const slug of slugs) {
        const el = document.getElementById(`${idPrefix}${slug}`);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top - line <= 0) chosen = slug;
        else break;
      }

      setActiveSlug((prev) => (prev === chosen ? prev : chosen));
    };

    const schedule = () => {
      if (raf !== 0) return;
      raf = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf !== 0) cancelAnimationFrame(raf);
    };
  }, [slugs, idPrefix, activationOffset]);

  function lock(slug: string, releaseAfterMs = 1200) {
    lockedRef.current = slug;
    setActiveSlug(slug);
    const release = () => {
      lockedRef.current = null;
      window.removeEventListener("scrollend", release);
    };
    window.addEventListener("scrollend", release, { once: true });
    window.setTimeout(release, releaseAfterMs);
  }

  return { activeSlug, lock };
}
