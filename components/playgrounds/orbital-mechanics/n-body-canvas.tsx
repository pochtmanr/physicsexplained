"use client";
import { useEffect, useRef } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { resolveCollisions, step, type Body } from "@/lib/physics/n-body";
import { attachGestures, type GestureCallbacks } from "./gestures";
import {
  clampScale,
  defaultCamera,
  screenToWorld,
  zoomTowardScreenPoint,
  type Camera,
} from "./camera";
import { hitTest } from "./hit-test";
import { colorPalette } from "./palette";
import {
  appendTrails,
  clearTrails,
  createTrailBuffers,
  pruneOrphans,
} from "./trails";
import {
  drawBackground,
  drawBodies,
  drawDragArrow,
  drawHoverGhost,
  drawPredictiveTraces,
  drawSlingshot,
  drawTrails,
  prepareCanvas,
  type DragArrow,
  type HoverGhost,
  type PlaceAim,
} from "./draw";

interface Props {
  bodies: Body[];
  /**
   * Called for ANY user-driven change to the body list (place, remove,
   * drag-to-set-velocity, merge). The parent uses this as the single source
   * of truth — it both updates `state.bodies` and atomically promotes the
   * preset to "custom" in one setState.
   */
  onBodiesChange: (b: Body[]) => void;
  trails: boolean;
  speed: 0.25 | 1 | 4;
  isPlaying: boolean;
  /** Mass used when the user adds a new body via tap */
  placeMass: number;
  /** Bumped by the parent to force a full trails rewind / camera recenter. */
  resetKey: number;
}

const SIM_DT = 0.005;
const BODY_CAP = 8;
/**
 * Slingshot amplification on the empty-canvas drag-to-launch gesture. The
 * gestures module emits a small px→px/s scaling (`0.02`) tuned for nudging
 * existing bodies. For a satisfying "fling" launch we multiply that by this
 * factor — at the default camera scale (80 px/unit) a 150 px drag now yields
 * ~5.6 world u/s, comfortably below the solar-mini orbital velocity (~8 u/s)
 * so a typical drag tends to fall into orbit rather than ejecting.
 */
const LAUNCH_BOOST = 200;
/** Forward sim time used for the predictive-orbit overlay when paused. */
const PREDICTION_SECONDS = 5;

/** Signature that changes whenever the *set* of body ids changes. */
function bodiesSignature(bodies: Body[]): string {
  return bodies.map((b) => b.id).sort().join("|");
}

export function NBodyCanvas({
  bodies,
  onBodiesChange,
  trails,
  speed,
  isPlaying,
  placeMass,
  resetKey,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();

  // ── Refs first so the effects below can read them without TDZ surprises ──
  const bodiesRef = useRef<Body[]>(bodies);
  const trailsRef = useRef(createTrailBuffers());
  const camRef = useRef<Camera>(defaultCamera());
  const dragRef = useRef<DragArrow | null>(null);
  const hoverRef = useRef<HoverGhost | null>(null);
  const placeAimRef = useRef<PlaceAim | null>(null);
  const placeMassRef = useRef(placeMass);
  const onBodiesChangeRef = useRef(onBodiesChange);

  // ── Ref ←→ prop sync ──
  // Only re-pull `bodies` into the live ref when the *id set* changes (place,
  // remove, merge, preset switch, URL back-nav). For same-id-set updates
  // (drag-to-set-velocity, speed/trails toggles, sim-merge that already
  // propagated through React) we'd otherwise overwrite the freshly-stepped
  // simulation with a stale React snapshot — visible as a jitter every time
  // a merge is reported.
  const incomingSig = bodiesSignature(bodies);
  useEffect(() => {
    if (bodiesSignature(bodiesRef.current) === incomingSig) return;
    bodiesRef.current = bodies;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingSig]);

  useEffect(() => {
    placeMassRef.current = placeMass;
  }, [placeMass]);

  // `onBodiesChange` is a fresh function every parent render. Holding it in a
  // ref lets the gesture / mouse effects mount once instead of tearing down
  // and rebinding on every render (which would, e.g., kill an in-flight
  // long-press timer).
  useEffect(() => {
    onBodiesChangeRef.current = onBodiesChange;
  }, [onBodiesChange]);

  // Prune orphan trail entries (bodies that disappeared via removal or merge).
  useEffect(() => {
    pruneOrphans(trailsRef.current, new Set(bodies.map((b) => b.id)));
    // `incomingSig` encodes the id set (string).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingSig]);

  // Hard reset: rewind the live simulation back to the canonical starting
  // frame, drop trails, recenter camera, abort any in-flight gesture state.
  useEffect(() => {
    clearTrails(trailsRef.current);
    camRef.current = defaultCamera();
    bodiesRef.current = bodies.map((b) => ({ ...b }));
    dragRef.current = null;
    placeAimRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  // ── Coordinate helpers ──
  function viewport(): { w: number; h: number } | null {
    const cv = canvasRef.current;
    if (!cv) return null;
    return { w: cv.clientWidth, h: cv.clientHeight };
  }

  function hit(x: number, y: number): number {
    const vp = viewport();
    if (!vp) return -1;
    return hitTest(bodiesRef.current, camRef.current, vp.w, vp.h, x, y);
  }

  function toWorld(x: number, y: number): { x: number; y: number } {
    const vp = viewport();
    if (!vp) return { x: 0, y: 0 };
    return screenToWorld(camRef.current, vp.w, vp.h, x, y);
  }

  // ── Mouse-only desktop affordances: contextmenu = remove, wheel = zoom,
  //    mousemove = ghost-preview position ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onContextMenu(e: MouseEvent) {
      e.preventDefault();
      const r = el!.getBoundingClientRect();
      const idx = hit(e.clientX - r.left, e.clientY - r.top);
      if (idx < 0) return;
      const removed = bodiesRef.current[idx]!;
      const bs = bodiesRef.current.filter((_, i) => i !== idx);
      bodiesRef.current = bs;
      trailsRef.current.delete(removed.id);
      onBodiesChangeRef.current(bs);
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const r = el!.getBoundingClientRect();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      const vp = viewport();
      if (!vp) return;
      const factor = Math.exp(-e.deltaY * 0.0015);
      zoomTowardScreenPoint(camRef.current, vp.w, vp.h, cx, cy, factor);
    }

    function onMouseMove(e: MouseEvent) {
      const r = el!.getBoundingClientRect();
      hoverRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function onMouseLeave() {
      hoverRef.current = null;
    }

    el.addEventListener("contextmenu", onContextMenu);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onMouseLeave);
    return () => {
      el.removeEventListener("contextmenu", onContextMenu);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onMouseLeave);
    };
    // Mount-once on purpose — handlers read state via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pointer / multitouch gestures ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const cb: GestureCallbacks = {
      onTap: (x, y) => {
        const { x: wx, y: wy } = toWorld(x, y);
        const next: Body[] = [
          ...bodiesRef.current,
          {
            id: `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
            mass: placeMassRef.current,
            x: wx,
            y: wy,
            vx: 0,
            vy: 0,
          },
        ];
        const trimmed =
          next.length > BODY_CAP ? next.slice(next.length - BODY_CAP) : next;
        if (trimmed.length < next.length) {
          // Cap eviction: prune trail state for evicted ids in the same tick
          // so stale ids can't outlive their bodies in the trails map.
          for (const dropped of next.slice(0, next.length - trimmed.length)) {
            trailsRef.current.delete(dropped.id);
          }
        }
        bodiesRef.current = trimmed;
        onBodiesChangeRef.current(trimmed);
      },
      onBodyDown: () => {},
      onBodyDrag: (index, x, y) => {
        dragRef.current = { index, toX: x, toY: y };
      },
      onBodyUp: (index, dragVx, dragVy) => {
        // Bail if the body is gone — Reset / preset switch / merge can wipe
        // the index mid-drag.
        if (index < 0 || index >= bodiesRef.current.length) {
          dragRef.current = null;
          return;
        }
        const bs = [...bodiesRef.current];
        const b = bs[index];
        if (!b) {
          dragRef.current = null;
          return;
        }
        if (dragVx !== 0 || dragVy !== 0) {
          const cam = camRef.current;
          bs[index] = { ...b, vx: dragVx / cam.scale, vy: dragVy / cam.scale };
          bodiesRef.current = bs;
          onBodiesChangeRef.current(bs);
        }
        dragRef.current = null;
      },
      onPinch: (ratio) => {
        // ratio is per-frame relative; multiply the live scale so wheel-zoom
        // and pinch-zoom compose instead of fighting.
        camRef.current.scale = clampScale(camRef.current.scale * ratio);
      },
      onPan: (dx, dy) => {
        const cam = camRef.current;
        cam.panX -= dx / cam.scale;
        cam.panY -= dy / cam.scale;
      },
      onLongPress: (index) => {
        const removed = bodiesRef.current[index];
        if (!removed) return;
        const bs = bodiesRef.current.filter((_, i) => i !== index);
        bodiesRef.current = bs;
        trailsRef.current.delete(removed.id);
        onBodiesChangeRef.current(bs);
      },
      onPlaceDrag: (downX, downY, curX, curY) => {
        placeAimRef.current = { downX, downY, curX, curY };
      },
      onPlaceUp: (downX, downY, dragVx, dragVy) => {
        placeAimRef.current = null;
        const { x: wx, y: wy } = toWorld(downX, downY);
        const cam = camRef.current;
        // Slingshot semantics: pull back, body launches forward. Angry Birds.
        const next: Body[] = [
          ...bodiesRef.current,
          {
            id: `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
            mass: placeMassRef.current,
            x: wx,
            y: wy,
            vx: (-dragVx * LAUNCH_BOOST) / cam.scale,
            vy: (-dragVy * LAUNCH_BOOST) / cam.scale,
          },
        ];
        const trimmed =
          next.length > BODY_CAP ? next.slice(next.length - BODY_CAP) : next;
        if (trimmed.length < next.length) {
          for (const dropped of next.slice(0, next.length - trimmed.length)) {
            trailsRef.current.delete(dropped.id);
          }
        }
        bodiesRef.current = trimmed;
        onBodiesChangeRef.current(trimmed);
      },
      onPlaceCancel: () => {
        placeAimRef.current = null;
      },
    };

    return attachGestures(el, { hit }, cb);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── rAF render + simulation loop ──
  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
      const ctx = prepareCanvas(canvasRef.current);
      if (!ctx) return;
      const cv = canvasRef.current!;
      const width = cv.clientWidth;
      const height = cv.clientHeight;

      // Step physics + resolve collisions (hybrid bounce/absorb).
      if (isPlaying && !reducedMotion) {
        const totalDt = dt * speed;
        const subSteps = Math.max(1, Math.ceil(totalDt / SIM_DT));
        const subDt = totalDt / subSteps;
        const startLen = bodiesRef.current.length;
        let bs = bodiesRef.current;
        for (let s = 0; s < subSteps; s++) {
          bs = step(bs, subDt);
          bs = resolveCollisions(bs);
        }
        bodiesRef.current = bs;
        // If any bodies merged this frame, surface the new list to React so
        // URL state, the body counter, and trail pruning all stay in sync.
        if (bs.length < startLen) {
          onBodiesChangeRef.current(bs);
        }
      }

      // Trails: append latest position once per frame.
      if (trails) {
        appendTrails(trailsRef.current, bodiesRef.current, dt);
      } else {
        clearTrails(trailsRef.current);
      }

      const palette = colorPalette(colors);
      const d = { ctx, width, height, cam: camRef.current, colors, palette };

      drawBackground(d);

      if (trails) drawTrails(d, trailsRef.current);

      // Pause-only predictive trace: when frozen the live trail can't show
      // future motion, so a forward-integrated dashed line answers
      // "is this orbit closed?" at a glance.
      if (!isPlaying && !reducedMotion) {
        drawPredictiveTraces(d, bodiesRef.current, PREDICTION_SECONDS);
      }

      drawBodies(d, bodiesRef.current);

      if (dragRef.current) drawDragArrow(d, bodiesRef.current, dragRef.current);

      const aim = placeAimRef.current;
      if (aim) {
        drawSlingshot(d, aim, placeMass);
      } else {
        const hover = hoverRef.current;
        if (hover && hit(hover.x, hover.y) === -1 && !dragRef.current) {
          drawHoverGhost(d, hover, placeMass);
        }
      }
    },
  });

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
