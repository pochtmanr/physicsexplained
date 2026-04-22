"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { electricFieldAtPoint } from "@/lib/physics/electric-field";
import type { Charge, Vec2 } from "@/lib/physics/electric-field";

const RATIO = 0.55;
const MAX_HEIGHT = 360;
const N_LINES = 22;
const TRACE_STEPS = 280;
const STEP_LEN = 0.05;
const ARROW_DRIFT_SPEED = 0.22;

interface Polyline {
  points: Vec2[];
}

/**
 * Approximate the two plates as a row of point charges along each plate.
 * That is enough to get a near-uniform field in the middle and visible
 * fringing at the edges.
 */
function buildPlates(): Charge[] {
  const sources: Charge[] = [];
  const plateLen = 4;
  const nPerPlate = 21;
  const yTop = 1;
  const yBot = -1;
  const qPer = 1e-9;
  for (let i = 0; i < nPerPlate; i++) {
    const x = -plateLen / 2 + (plateLen * i) / (nPerPlate - 1);
    sources.push({ q: qPer, x, y: yTop });
    sources.push({ q: -qPer, x, y: yBot });
  }
  return sources;
}

function traceLine(sources: readonly Charge[], start: Vec2): Polyline {
  const pts: Vec2[] = [start];
  let p = { ...start };
  for (let i = 0; i < TRACE_STEPS; i++) {
    const e = electricFieldAtPoint(sources, p);
    const mag = Math.hypot(e.x, e.y);
    if (mag === 0) break;
    p = {
      x: p.x + (e.x * STEP_LEN) / mag,
      y: p.y + (e.y * STEP_LEN) / mag,
    };
    pts.push({ ...p });
    // stop if we crossed the bottom plate
    if (p.y < -1.02) break;
    if (Math.abs(p.x) > 4) break;
  }
  return { points: pts };
}

export function FieldLinesParallelPlatesScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 480, height: 280 });

  const sources = useMemo<Charge[]>(buildPlates, []);

  const lines = useMemo<Polyline[]>(() => {
    const all: Polyline[] = [];
    // Spread starting points slightly past the plate edges to capture fringing
    const startSpread = 2.6;
    for (let i = 0; i < N_LINES; i++) {
      const x =
        -startSpread + (i / (N_LINES - 1)) * 2 * startSpread;
      // start just below the top plate
      const start = { x, y: 0.97 };
      all.push(traceLine(sources, start));
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

      // World → screen — fits roughly [-3.6, 3.6] × [-1.6, 1.6]
      const worldW = 7.2;
      const worldH = 3.2;
      const scale = Math.min(width / worldW, height / worldH);
      const tx = (wx: number) => width / 2 + wx * scale;
      const ty = (wy: number) => height / 2 - wy * scale;

      // Plates: solid bars
      const plateLen = 4;
      const xL = tx(-plateLen / 2);
      const xR = tx(plateLen / 2);
      const yTop = ty(1);
      const yBot = ty(-1);

      // top (positive) — warm
      ctx.fillStyle = "#F2C570";
      ctx.fillRect(xL, yTop - 4, xR - xL, 4);
      // bottom (negative) — cool
      ctx.fillStyle = "#7AB6FF";
      ctx.fillRect(xL, yBot, xR - xL, 4);

      // Plate sign labels
      ctx.fillStyle = "#F2C570";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("+", xR + 8, yTop - 2);
      ctx.fillStyle = "#7AB6FF";
      ctx.fillText("−", xR + 8, yBot + 4);

      // Field lines
      ctx.strokeStyle = "rgba(111, 184, 198, 0.6)";
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

      // Drifting arrows
      ctx.fillStyle = "#6FB8C6";
      for (let li = 0; li < lines.length; li++) {
        const line = lines[li]!;
        if (line.points.length < 4) continue;
        const phase = (t * ARROW_DRIFT_SPEED + li * 0.05) % 1;
        const idx = Math.floor(phase * (line.points.length - 2));
        const a = line.points[idx]!;
        const b = line.points[idx + 1]!;
        const ax = tx(a.x);
        const ay = ty(a.y);
        const bx = tx(b.x);
        const by = ty(b.y);
        const dxs = bx - ax;
        const dys = by - ay;
        const len = Math.hypot(dxs, dys) || 1;
        const ux = dxs / len;
        const uy = dys / len;
        const aSize = 4;
        ctx.beginPath();
        ctx.moveTo(bx + ux * aSize, by + uy * aSize);
        ctx.lineTo(bx - ux * aSize - uy * aSize * 0.6, by - uy * aSize + ux * aSize * 0.6);
        ctx.lineTo(bx - ux * aSize + uy * aSize * 0.6, by - uy * aSize - ux * aSize * 0.6);
        ctx.closePath();
        ctx.fill();
      }

      // HUD
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("uniform field inside, fringing at edges", 14, 20);
      ctx.textAlign = "right";
      ctx.fillText("E ≈ σ / ε₀ between the plates", width - 14, 20);
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
