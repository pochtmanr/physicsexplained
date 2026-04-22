"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { electricFieldAtPoint } from "@/lib/physics/electric-field";
import type { Charge, Vec2 } from "@/lib/physics/electric-field";

const RATIO = 0.62;
const MAX_HEIGHT = 380;
const N_LINES = 14; // start points around the + charge
const TRACE_STEPS = 600;
const STEP_LEN = 0.035; // metres per step in world units
const ARROW_DRIFT_SPEED = 0.22; // fraction of trace per second

interface Polyline {
  points: Vec2[];
}

/**
 * Trace one field line by integrating dx/ds = E/|E| from a start point.
 * `direction` = +1 follows E, -1 follows -E. Stops when the line wanders
 * outside [bounds] or runs into the opposite charge.
 */
function traceLine(
  sources: readonly Charge[],
  start: Vec2,
  direction: 1 | -1,
  bounds: { xMin: number; xMax: number; yMin: number; yMax: number },
  stopRadius: number,
  stopAt: Vec2,
): Polyline {
  const pts: Vec2[] = [start];
  let p = { ...start };
  for (let i = 0; i < TRACE_STEPS; i++) {
    const e = electricFieldAtPoint(sources, p);
    const mag = Math.hypot(e.x, e.y);
    if (mag === 0) break;
    p = {
      x: p.x + (direction * e.x * STEP_LEN) / mag,
      y: p.y + (direction * e.y * STEP_LEN) / mag,
    };
    pts.push({ ...p });
    if (
      p.x < bounds.xMin ||
      p.x > bounds.xMax ||
      p.y < bounds.yMin ||
      p.y > bounds.yMax
    )
      break;
    const dx = p.x - stopAt.x;
    const dy = p.y - stopAt.y;
    if (dx * dx + dy * dy < stopRadius * stopRadius) break;
  }
  return { points: pts };
}

export function FieldLinesDipoleScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 480, height: 300 });

  // World coordinates: dipole spans roughly from -1 to +1 in x.
  const sources = useMemo<Charge[]>(
    () => [
      { q: 1e-9, x: -1, y: 0 },
      { q: -1e-9, x: 1, y: 0 },
    ],
    [],
  );

  const lines = useMemo<Polyline[]>(() => {
    const bounds = { xMin: -3.2, xMax: 3.2, yMin: -2, yMax: 2 };
    const seedRadius = 0.12;
    const all: Polyline[] = [];
    for (let i = 0; i < N_LINES; i++) {
      const angle = ((i + 0.5) / N_LINES) * Math.PI * 2;
      const start = {
        x: -1 + Math.cos(angle) * seedRadius,
        y: Math.sin(angle) * seedRadius,
      };
      // Forward trace: follow +E from a point near + charge until it lands on −
      all.push(traceLine(sources, start, 1, bounds, 0.13, { x: 1, y: 0 }));
    }
    return all;
  }, [sources]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      // World → screen mapping (centred, fits roughly [-3.2, 3.2] × [-2, 2])
      const worldW = 6.4;
      const worldH = 4;
      const scale = Math.min(width / worldW, height / worldH);
      const tx = (wx: number) => width / 2 + wx * scale;
      const ty = (wy: number) => height / 2 - wy * scale;

      // Field lines
      ctx.strokeStyle = "rgba(111, 184, 198, 0.55)";
      ctx.lineWidth = 1;
      for (const line of lines) {
        if (line.points.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(tx(line.points[0]!.x), ty(line.points[0]!.y));
        for (let i = 1; i < line.points.length; i++) {
          ctx.lineTo(tx(line.points[i]!.x), ty(line.points[i]!.y));
        }
        ctx.stroke();
      }

      // Drifting arrows that walk along each line
      ctx.fillStyle = "#6FB8C6";
      for (let li = 0; li < lines.length; li++) {
        const line = lines[li]!;
        if (line.points.length < 4) continue;
        const phase = (t * ARROW_DRIFT_SPEED + li * 0.07) % 1;
        const idx = Math.floor(phase * (line.points.length - 2));
        const a = line.points[idx]!;
        const b = line.points[idx + 1]!;
        const ax = tx(a.x);
        const ay = ty(a.y);
        const bx = tx(b.x);
        const by = ty(b.y);
        const dx = bx - ax;
        const dy = by - ay;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const aSize = 4;
        ctx.beginPath();
        ctx.moveTo(bx + ux * aSize, by + uy * aSize);
        ctx.lineTo(bx - ux * aSize - uy * aSize * 0.6, by - uy * aSize + ux * aSize * 0.6);
        ctx.lineTo(bx - ux * aSize + uy * aSize * 0.6, by - uy * aSize - ux * aSize * 0.6);
        ctx.closePath();
        ctx.fill();
      }

      // Charges
      for (const s of sources) {
        const isPos = s.q > 0;
        ctx.shadowColor = isPos
          ? "rgba(255, 200, 100, 0.55)"
          : "rgba(120, 180, 255, 0.55)";
        ctx.shadowBlur = 16;
        ctx.fillStyle = isPos ? "#F2C570" : "#7AB6FF";
        ctx.beginPath();
        ctx.arc(tx(s.x), ty(s.y), 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#0B1018";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(isPos ? "+" : "−", tx(s.x), ty(s.y) + 1);
      }

      // HUD
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("dipole — lines start on +, end on −", 14, 20);
      ctx.textAlign = "right";
      ctx.fillText("|E| ~ 1/r³ at distance", width - 14, 20);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
    </div>
  );
}
