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
  /** If true, no frames are requested until it turns false again (default false) */
  paused?: boolean;
}

/**
 * Runs a requestAnimationFrame loop that:
 *  - calls onFrame with (elapsedSeconds, deltaSeconds)
 *  - stops requesting frames while the referenced element is out of view,
 *    while the tab is hidden, or while `paused` is true — and restarts when
 *    all three clear
 *  - accumulates elapsed only while running, so scrolling away and back
 *    never produces a position jump in downstream physics
 *  - caps per-frame dt to avoid big jumps when the tab is backgrounded
 *    then refocused
 *  - cleans up on unmount
 *
 * Note: this does NOT respect reduced-motion — the consumer should check
 * useReducedMotion() and either skip rendering or render a single frame.
 * `useScenePlayback` does that for you.
 */
const MAX_DT_SECONDS = 0.1;

export function useAnimationFrame({
  elementRef,
  onFrame,
  alwaysOn = false,
  paused = false,
}: UseAnimationFrameOptions) {
  const visibleRef = useRef(alwaysOn);
  const pausedRef = useRef(paused);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const onFrameRef = useRef(onFrame);
  /** Starts the loop if it should be running and is not already. */
  const wakeRef = useRef<() => void>(() => {});

  // Keep latest callback without re-starting the loop
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    pausedRef.current = paused;
    if (!paused) wakeRef.current();
  }, [paused]);

  useEffect(() => {
    const el = elementRef.current;

    const shouldRun = () =>
      visibleRef.current && !pausedRef.current && !document.hidden;

    const tick = (now: number) => {
      if (!shouldRun()) {
        // Stop the loop. Dropping the last timestamp makes the next frame
        // after a wake start with dt = 0 instead of the accumulated gap.
        rafRef.current = null;
        lastRef.current = null;
        return;
      }

      const rawDt =
        lastRef.current === null ? 0 : (now - lastRef.current) / 1000;
      lastRef.current = now;
      const dt = Math.min(rawDt, MAX_DT_SECONDS);
      elapsedRef.current += dt;
      try {
        onFrameRef.current(elapsedRef.current, dt);
      } finally {
        // Always keep the loop's bookkeeping true, even if the callback
        // throws: otherwise `rafRef` holds a spent id and `wake` can never
        // start the loop again. onFrame may also have paused us (e.g.
        // playback reached its end); the next tick sees that and stops.
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const wake = () => {
      if (rafRef.current === null && shouldRun()) {
        lastRef.current = null;
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    wakeRef.current = wake;

    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = null;
    };

    document.addEventListener("visibilitychange", wake);

    let observer: IntersectionObserver | null = null;
    if (alwaysOn || typeof IntersectionObserver === "undefined") {
      visibleRef.current = true;
      wake();
    } else if (el) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          visibleRef.current = entry.isIntersecting;
          if (entry.isIntersecting) wake();
        },
        { threshold: 0.05 },
      );
      observer.observe(el);
    }

    return () => {
      document.removeEventListener("visibilitychange", wake);
      observer?.disconnect();
      wakeRef.current = () => {};
      stop();
    };
  }, [elementRef, alwaysOn]);
}
