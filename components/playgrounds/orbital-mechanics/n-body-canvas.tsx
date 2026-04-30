"use client";
import { useEffect, useRef } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { step, type Body } from "@/lib/physics/n-body";
import { attachGestures, BODY_HIT_RADIUS_PX, type GestureCallbacks } from "./gestures";

interface Props {
  bodies: Body[];
  onBodiesChange: (b: Body[]) => void;
  trails: boolean;
  speed: 0.25 | 1 | 4;
  isPlaying: boolean;
  /** Called when the user creates / edits / deletes bodies (so parent can mark preset = custom) */
  onUserEdit: () => void;
}

const SIM_DT = 0.005; // physics dt per integration sub-step (independent of frame rate)
const PX_PER_UNIT_DEFAULT = 80;
const TRAIL_MAX_AGE_S = 3;

export function NBodyCanvas({
  bodies,
  onBodiesChange,
  trails,
  speed,
  isPlaying,
  onUserEdit,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();

  // Mutable mirror of `bodies` so the rAF loop doesn't capture stale state.
  const bodiesRef = useRef<Body[]>(bodies);
  useEffect(() => {
    bodiesRef.current = bodies;
  }, [bodies]);

  // Trails: per-body ring buffers
  const trailsRef = useRef<Map<string, Array<{ x: number; y: number; age: number }>>>(new Map());

  // Camera: zoom + pan (world units → px). Parent doesn't manage camera.
  const camRef = useRef({ scale: PX_PER_UNIT_DEFAULT, panX: 0, panY: 0 });

  // Drag state for "drag from body" velocity arrow
  const dragRef = useRef<{ index: number; toX: number; toY: number } | null>(null);

  // Hit-test using the latest bodies snapshot
  function hitTest(x: number, y: number): number {
    const cv = canvasRef.current;
    if (!cv) return -1;
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    const cam = camRef.current;
    const bs = bodiesRef.current;
    for (let i = 0; i < bs.length; i++) {
      const b = bs[i]!;
      const sx = w / 2 + (b.x - cam.panX) * cam.scale;
      const sy = h / 2 + (b.y - cam.panY) * cam.scale;
      if (Math.hypot(sx - x, sy - y) <= BODY_HIT_RADIUS_PX) return i;
    }
    return -1;
  }

  function screenToWorld(x: number, y: number): { x: number; y: number } {
    const cv = canvasRef.current!;
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    const cam = camRef.current;
    return {
      x: (x - w / 2) / cam.scale + cam.panX,
      y: (y - h / 2) / cam.scale + cam.panY,
    };
  }

  // Gesture wiring
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const cb: GestureCallbacks = {
      onTap: (x, y) => {
        const { x: wx, y: wy } = screenToWorld(x, y);
        const next = [
          ...bodiesRef.current,
          {
            id: `u${Date.now().toString(36)}`,
            mass: 1,
            x: wx,
            y: wy,
            vx: 0,
            vy: 0,
          },
        ];
        // Cap at 8; replace the oldest user-spawned body if over.
        const trimmed = next.length > 8 ? next.slice(next.length - 8) : next;
        bodiesRef.current = trimmed;
        onBodiesChange(trimmed);
        onUserEdit();
      },
      onBodyDown: () => {},
      onBodyDrag: (index, x, y) => {
        dragRef.current = { index, toX: x, toY: y };
      },
      onBodyUp: (index, dragVx, dragVy) => {
        const bs = [...bodiesRef.current];
        const b = bs[index];
        if (!b) return;
        if (dragVx !== 0 || dragVy !== 0) {
          // Convert px-velocity to world-unit velocity by dividing by scale.
          const cam = camRef.current;
          bs[index] = { ...b, vx: dragVx / cam.scale, vy: dragVy / cam.scale };
        }
        bodiesRef.current = bs;
        onBodiesChange(bs);
        onUserEdit();
        dragRef.current = null;
      },
      onPinch: (scale) => {
        camRef.current.scale = Math.max(20, Math.min(320, PX_PER_UNIT_DEFAULT * scale));
      },
      onPan: (dx, dy) => {
        const cam = camRef.current;
        cam.panX -= dx / cam.scale;
        cam.panY -= dy / cam.scale;
      },
      onLongPress: (index) => {
        // v1: long-press deletes. (Mass picker is a follow-up.)
        const bs = bodiesRef.current.filter((_, i) => i !== index);
        bodiesRef.current = bs;
        onBodiesChange(bs);
        onUserEdit();
      },
    };

    return attachGestures(el, { hit: hitTest }, cb);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onBodiesChange, onUserEdit]);

  // rAF loop
  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      if (cv.width !== w * dpr || cv.height !== h * dpr) {
        cv.width = w * dpr;
        cv.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      // Clear
      ctx.fillStyle = colors.bg0 || "#1A1D24";
      ctx.fillRect(0, 0, w, h);

      // Step physics
      if (isPlaying && !reducedMotion) {
        const totalDt = dt * speed;
        const subSteps = Math.max(1, Math.ceil(totalDt / SIM_DT));
        const subDt = totalDt / subSteps;
        let bs = bodiesRef.current;
        for (let i = 0; i < subSteps; i++) bs = step(bs, subDt);
        bodiesRef.current = bs;
      }

      // Trails
      if (trails) {
        for (const b of bodiesRef.current) {
          const buf = trailsRef.current.get(b.id) ?? [];
          buf.forEach((p) => (p.age += dt));
          while (buf.length > 0 && buf[0]!.age > TRAIL_MAX_AGE_S) buf.shift();
          buf.push({ x: b.x, y: b.y, age: 0 });
          trailsRef.current.set(b.id, buf);
        }
      } else {
        trailsRef.current.clear();
      }

      const cam = camRef.current;
      const cx = w / 2;
      const cy = h / 2;

      // Draw trails
      if (trails) {
        for (const buf of trailsRef.current.values()) {
          for (const p of buf) {
            const alpha = Math.max(0, 1 - p.age / TRAIL_MAX_AGE_S) * 0.5;
            ctx.fillStyle = `rgba(111, 184, 198, ${alpha})`;
            const px = cx + (p.x - cam.panX) * cam.scale;
            const py = cy + (p.y - cam.panY) * cam.scale;
            ctx.fillRect(px - 1, py - 1, 2, 2);
          }
        }
      }

      // Draw bodies
      for (const b of bodiesRef.current) {
        const px = cx + (b.x - cam.panX) * cam.scale;
        const py = cy + (b.y - cam.panY) * cam.scale;
        const r = Math.max(3, Math.min(20, 4 + Math.sqrt(b.mass) * 3));
        ctx.shadowColor = "rgba(111, 184, 198, 0.6)";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#6FB8C6";
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Drag arrow (velocity-from-body during drag)
      if (dragRef.current) {
        const { index, toX, toY } = dragRef.current;
        const b = bodiesRef.current[index];
        if (b) {
          const px = cx + (b.x - cam.panX) * cam.scale;
          const py = cy + (b.y - cam.panY) * cam.scale;
          ctx.strokeStyle = "rgba(111, 184, 198, 0.9)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(toX, toY);
          ctx.stroke();
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
