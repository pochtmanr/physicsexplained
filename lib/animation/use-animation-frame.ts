"use client";

import { useEffect, useRef, type RefObject } from "react";

export type FrameCallback = (t: number, dt: number) => void;

export interface UseAnimationFrameOptions {
  /** Ref to the element whose visibility gates the animation */
  elementRef: RefObject<HTMLElement | null>;
  /** Called on every frame while element is visible */
  onFrame: FrameCallback;
  /** If true, ignores visibility and always runs (default false) */
  alwaysOn?: boolean;
}

/**
 * Runs a requestAnimationFrame loop that:
 *  - calls onFrame with (elapsedSeconds, deltaSeconds)
 *  - pauses automatically when the referenced element scrolls out of view
 *  - cleans up on unmount
 *
 * Note: this does NOT respect reduced-motion — the consumer should check
 * useReducedMotion() and either skip rendering or render a single frame.
 */
export function useAnimationFrame({
  elementRef,
  onFrame,
  alwaysOn = false,
}: UseAnimationFrameOptions) {
  const visibleRef = useRef(alwaysOn);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const onFrameRef = useRef(onFrame);

  // Keep latest callback without re-starting the loop
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    const el = elementRef.current;

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = (now - startRef.current) / 1000;
      const dt =
        lastRef.current === null ? 0 : (now - lastRef.current) / 1000;
      lastRef.current = now;

      if (visibleRef.current) {
        onFrameRef.current(elapsed, dt);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    if (alwaysOn) {
      visibleRef.current = true;
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      };
    }

    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          // Reset timer on re-enter to avoid huge dt jumps
          lastRef.current = null;
        }
      },
      { threshold: 0.05 },
    );

    observer.observe(el);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      observer.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [elementRef, alwaysOn]);
}
