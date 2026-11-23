"use client";

import clsx from "clsx";
import {
  createElement,
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

// useLayoutEffect warns during server rendering; the effect is client-only.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface RevealProps {
  children: ReactNode;
  /** Position in a group, for a staggered entrance (0 = first, no delay). */
  index?: number;
  /** Element to render. Default "div". */
  as?: "div" | "li" | "section" | "figure";
  className?: string;
}

/**
 * Plays a one-time entrance (fade and a short rise, `.reveal` in globals.css)
 * when the block first appears.
 *
 * A block that is on screen when the page loads animates straight away, from
 * the stylesheet alone. A block further down is held transparent until any part of it scrolls into view, or something inside
 * it takes keyboard focus. Without JavaScript nothing is held, so the content
 * always appears; it is in the accessibility tree throughout, and it is
 * never held in print. Readers who prefer reduced motion get no animation.
 */
export function Reveal({ children, index = 0, as = "div", className }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    // Already on screen (or above it): let the animation run as it is.
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    el.dataset.reveal = "waiting";
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          // The stagger is for a group arriving together at page load. A
          // block reached by scrolling appears at once.
          el.style.setProperty("--reveal-index", "0");
          delete el.dataset.reveal;
          observer.disconnect();
        }
      },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      delete el.dataset.reveal;
    };
  }, []);

  return createElement(
    as,
    {
      ref,
      className: clsx("reveal", className),
      style: index ? ({ "--reveal-index": index } as CSSProperties) : undefined,
    },
    children,
  );
}
