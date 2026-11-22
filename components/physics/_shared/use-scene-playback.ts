"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

/**
 * - `idle`    — never started (first frame shown)
 * - `playing` — time is advancing
 * - `paused`  — stopped by the reader mid-run
 * - `ended`   — reached `duration`; last frame held until Replay
 */
export type PlaybackStatus = "idle" | "playing" | "paused" | "ended";

export interface UseScenePlaybackOptions {
  /** Element whose visibility gates autoplay and frame requests. */
  elementRef: RefObject<HTMLElement | null>;
  /** Draws the frame for scene time `t` (seconds, already clamped to duration). */
  draw: (t: number) => void;
  /** Length of one run in scene seconds. Omit for an open-ended scene. */
  duration?: number;
  /** Scene seconds per real second (0.5 = half-speed slow motion). Default 1. */
  rate?: number;
  /** Start playing the first time the scene scrolls into view. Default true. */
  autoplay?: boolean;
  /** Initial loop setting. Default false: play once, then hold. */
  loop?: boolean;
}

export interface ScenePlayback {
  status: PlaybackStatus;
  /** Scene time for display, refreshed about ten times a second. */
  time: number;
  duration: number | undefined;
  loop: boolean;
  setLoop: (loop: boolean) => void;
  /** Resume, or restart from zero if the run has ended. */
  play: () => void;
  pause: () => void;
  toggle: () => void;
  /** Jump back to zero and play. */
  replay: () => void;
  /**
   * Start the run again because a parameter changed (not because the reader
   * pressed a button): plays from zero, or just rewinds to zero when the
   * reader prefers reduced motion.
   */
  restart: () => void;
  /** Jump to scene time `t` without changing play/pause. */
  seek: (t: number) => void;
  /** Exact current scene time (not throttled). */
  getTime: () => number;
}

/** How long a looping scene holds its last frame before restarting (real seconds). */
export const LOOP_HOLD_SECONDS = 1.5;
/** Fraction of the scene that must be on screen before autoplay starts. */
const AUTOPLAY_THRESHOLD = 0.35;
const DISPLAY_INTERVAL_SECONDS = 0.1;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Standard clock for an animated scene.
 *
 * The scene plays once when it first scrolls into view, holds its last frame,
 * and waits for Replay (or restarts after a short hold when loop is on). With
 * `prefers-reduced-motion` nothing autoplays; Play still works.
 *
 * `draw` is called on every animation frame while playing and once after
 * every React render, so resize, theme and parameter changes repaint a paused
 * scene without any extra wiring.
 */
export function useScenePlayback({
  elementRef,
  draw,
  duration,
  rate = 1,
  autoplay = true,
  loop: initialLoop = false,
}: UseScenePlaybackOptions): ScenePlayback {
  const reducedMotion = useReducedMotion();
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [loop, setLoop] = useState(initialLoop);
  const [time, setTime] = useState(0);

  const timeRef = useRef(0);
  const holdRef = useRef(0);
  const sinceDisplayRef = useRef(0);
  const autoplayedRef = useRef(false);

  // Latest values for the frame callback, which must not go stale.
  const latest = useRef({ draw, duration, rate, loop });
  latest.current = { draw, duration, rate, loop };

  const clamp = useCallback((t: number) => {
    const d = latest.current.duration;
    return d === undefined ? Math.max(0, t) : Math.min(Math.max(0, t), d);
  }, []);

  const paint = useCallback(() => {
    latest.current.draw(clamp(timeRef.current));
  }, [clamp]);

  const jumpTo = useCallback(
    (t: number) => {
      timeRef.current = Math.max(0, t);
      holdRef.current = 0;
      sinceDisplayRef.current = 0;
      setTime(clamp(timeRef.current));
      paint();
    },
    [clamp, paint],
  );

  useAnimationFrame({
    elementRef,
    paused: status !== "playing",
    onFrame: (_elapsed, dt) => {
      const { duration: d, rate: r, loop: looping } = latest.current;
      const atEnd = d !== undefined && timeRef.current >= d;

      if (atEnd) {
        if (looping) {
          holdRef.current += dt;
          if (holdRef.current >= LOOP_HOLD_SECONDS) {
            holdRef.current = 0;
            timeRef.current = 0;
          }
        } else {
          setStatus("ended");
        }
        setTime(clamp(timeRef.current));
        paint();
        return;
      }

      timeRef.current += dt * r;
      sinceDisplayRef.current += dt;
      const reachedEnd = d !== undefined && timeRef.current >= d;
      if (sinceDisplayRef.current >= DISPLAY_INTERVAL_SECONDS || reachedEnd) {
        sinceDisplayRef.current = 0;
        setTime(clamp(timeRef.current));
      }
      paint();
    },
  });

  // Repaint after every render: covers resize, theme, parameters, and the
  // paused / ended states where no animation frame is running.
  useEffect(() => {
    paint();
  });

  // Autoplay once, the first time enough of the scene is on screen.
  useEffect(() => {
    if (!autoplay || reducedMotion || autoplayedRef.current) return;
    const el = elementRef.current;
    if (!el) return;
    const start = () => {
      // Read the setting at the moment of starting: `reducedMotion` from the
      // hook is still false on the first render, before its effect has run.
      if (prefersReducedMotion()) return;
      autoplayedRef.current = true;
      setStatus((s) => (s === "idle" ? "playing" : s));
    };
    if (typeof IntersectionObserver === "undefined") {
      start();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          start();
          observer.disconnect();
        }
      },
      { threshold: AUTOPLAY_THRESHOLD },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [autoplay, reducedMotion, elementRef]);

  const play = useCallback(() => {
    autoplayedRef.current = true;
    const d = latest.current.duration;
    if (d !== undefined && timeRef.current >= d) jumpTo(0);
    setStatus("playing");
  }, [jumpTo]);

  const pause = useCallback(() => {
    autoplayedRef.current = true;
    setStatus((s) => (s === "playing" ? "paused" : s));
  }, []);

  const replay = useCallback(() => {
    autoplayedRef.current = true;
    jumpTo(0);
    setStatus("playing");
  }, [jumpTo]);

  const restart = useCallback(() => {
    autoplayedRef.current = true;
    jumpTo(0);
    setStatus(prefersReducedMotion() ? "paused" : "playing");
  }, [jumpTo]);

  const seek = useCallback(
    (t: number) => {
      autoplayedRef.current = true;
      jumpTo(t);
    },
    [jumpTo],
  );

  // A new duration can move the clamp point, so refresh the displayed time.
  useEffect(() => {
    setTime(clamp(timeRef.current));
  }, [duration, clamp]);

  // Keep `status` consistent with the clock after a seek or a change of
  // duration: a scene moved back from its end is paused, and one moved to
  // (or left at) its end has ended.
  useEffect(() => {
    setStatus((s) => {
      if (duration === undefined) return s === "ended" ? "paused" : s;
      const atEnd = timeRef.current >= duration;
      if (s === "ended" && !atEnd) return "paused";
      if (s === "paused" && atEnd) return "ended";
      return s;
    });
  }, [duration, time]);

  const toggle = useCallback(() => {
    if (status === "playing") pause();
    else play();
  }, [status, pause, play]);

  const getTime = useCallback(() => clamp(timeRef.current), [clamp]);

  return useMemo(
    () => ({
      status,
      time,
      duration,
      loop,
      setLoop,
      play,
      pause,
      toggle,
      replay,
      restart,
      seek,
      getTime,
    }),
    [status, time, duration, loop, play, pause, toggle, replay, restart, seek, getTime],
  );
}
