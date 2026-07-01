"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Defers mounting `children` until the placeholder nears the viewport, then
 * keeps them mounted for good. Scene chunks (and jsxgraph itself) are fetched
 * by next/dynamic the moment the lazy component renders, so on scene-dense
 * essays every board used to download and initBoard at hydration — this gate
 * makes below-the-fold scenes free until the reader approaches them.
 *
 * `rootMargin` pre-triggers one screen early so the chunk usually lands
 * before the scene scrolls into view. Falls back to mounting immediately when
 * IntersectionObserver is unavailable.
 */
export function LazyMount({
  children,
  fallback,
  rootMargin = "50% 0px",
}: {
  children: ReactNode;
  fallback: ReactNode;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setMounted(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted, rootMargin]);

  if (mounted) return <>{children}</>;
  return <div ref={ref}>{fallback}</div>;
}
