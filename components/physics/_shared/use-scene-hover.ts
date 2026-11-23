"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useFigureLink } from "./figure-link";

export interface ScenePointer {
  /** Pointer position in the canvas's logical (CSS pixel) coordinates. */
  x: number;
  y: number;
}

export interface SceneHover {
  /** False inline and without a guide: draw nothing extra. */
  enabled: boolean;
  /** Where the pointer is over the canvas, or null. For measurement guidelines. */
  pointer: ScenePointer | null;
  /** The guide key to emphasise: pointed at here, in the controls or in the guide. */
  activeKey: string | null;
}

/**
 * Canvas side of the figure ↔ guide hover link (docs/figure-full-view.md).
 *
 * `hitTest` says which guide key lies under a point of the canvas, or null.
 * The hook reports that key to the link while the reader points at it, and
 * returns the pointer and the active key so the scene's draw code can show
 * guidelines and emphasise the matching element.
 *
 * Switched off (no listeners, constant result) unless the figure is in full
 * view with a guide, so inline figures are unaffected.
 */
export function useSceneHover(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  hitTest: (x: number, y: number) => string | null,
): SceneHover {
  const link = useFigureLink();
  const [pointer, setPointer] = useState<ScenePointer | null>(null);
  const hitTestRef = useRef(hitTest);
  hitTestRef.current = hitTest;
  const { enabled, setActive } = link;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setPointer((prev) => (prev && prev.x === x && prev.y === y ? prev : { x, y }));
      setActive(hitTestRef.current(x, y), "scene");
    };
    const onLeave = () => {
      setPointer(null);
      setActive(null, "scene");
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointercancel", onLeave);
    return () => {
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointercancel", onLeave);
      onLeave();
    };
  }, [canvasRef, enabled, setActive]);

  return {
    enabled,
    pointer: enabled ? pointer : null,
    activeKey: enabled ? (link.active?.key ?? null) : null,
  };
}
