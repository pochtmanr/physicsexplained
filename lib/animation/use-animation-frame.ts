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
 *  - accumulates elapsed only while visible, so scrolling away and back
 *    never produces a position jump in downstream physics
 *  - caps per-frame dt to avoid big jumps when the tab is backgrounded
 *    then refocused
 *  - cleans up on unmount
 *
 * Note: this does NOT respect reduced-motion — the consumer should check
 * useReducedMotion() and either skip rendering or render a single frame.
 */
const MAX_DT_SECONDS = 0.1;

export function useAnimationFrame({
  elementRef,
  onFrame,
  alwaysOn = false,
}: UseAnimationFrameOptions) {
  const visibleRef = useRef(alwaysOn);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const onFrameRef = useRef(onFrame);

  // Keep latest callback without re-starting the loop
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    const el = elementRef.current;

    const tick = (now: number) => {
      if (!visibleRef.current) {
        // Paused — drop the last timestamp so the next visible frame
        // starts with dt = 0 instead of the accumulated gap
        lastRef.current = null;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const rawDt =
        lastRef.current === null ? 0 : (now - lastRef.current) / 1000;
      lastRef.current = now;
      const dt = Math.min(rawDt, MAX_DT_SECONDS);
      elapsedRef.current += dt;
      onFrameRef.current(elapsedRef.current, dt);
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
          // Reset timer on re-enter so dt starts fresh at 0
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
