"use client";

import { useEffect, useRef, useState } from "react";
import { orbitPosition, sweptArea } from "@/lib/physics/kepler";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

export interface SweepAreasProps {
  /** Semi-major axis */
  a?: number;
  /** Eccentricity */
  e?: number;
  /** Orbit wall time in seconds */
  T?: number;
  /** Number of wedges */
  wedges?: number;
}

interface FrozenWedge {
  /** Sun-to-planet polyline points in canvas coords */
  points: Array<{ x: number; y: number }>;
  /** Area in AU^2 */
  area: number;
}

export function SweepAreas({
  a = 1,
  e = 0.6,
  T = 18,
  wedges = 6,
}: SweepAreasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<Array<{ x: number; y: number; age: number }>>([]);
  const frozenRef = useRef<FrozenWedge[]>([]);
  const currentWedgeRef = useRef<Array<{ x: number; y: number; px: number; py: number }>>([]);
  const cycleStartRef = useRef<number>(0);
  const [areas, setAreas] = useState<number[]>([]);
  const [size, setSize] = useState({ width: 640, height: 440 });
  const colors = useThemeColors();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * 0.65, 440) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t, dt) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      // Map sim (x,y) to canvas (px, py); sun at canvas center
      const scale = Math.min(width, height) / (2.6 * a);
      const cx = width / 2;
      const cy = height / 2;
      const toCanvas = (x: number, y: number) => ({
        x: cx + x * scale,
        y: cy - y * scale,
      });

      // Time within current orbit
      const tCycle = t - cycleStartRef.current;
      const p = orbitPosition({ t: tCycle, a, e, T });
      const pc = toCanvas(p.x, p.y);

      // Track wedge path
      currentWedgeRef.current.push({
        x: p.x,
        y: p.y,
        px: pc.x,
        py: pc.y,
      });

      // Check if we've crossed a wedge boundary (T/wedges)
      const wedgeDuration = T / wedges;
      const wedgeIndex = Math.floor(tCycle / wedgeDuration);
      if (
        frozenRef.current.length < wedges &&
        frozenRef.current.length < wedgeIndex
      ) {
        // We just crossed boundary wedgeIndex; freeze the wedge that just ended
        const endedIdx = frozenRef.current.length;
        const startTime = endedIdx * wedgeDuration;
        const endTime = (endedIdx + 1) * wedgeDuration;
        const area = sweptArea({ t1: startTime, t2: endTime, a, e, T });
        frozenRef.current.push({
          points: currentWedgeRef.current.map((pt) => ({ x: pt.px, y: pt.py })),
          area,
        });
        setAreas(frozenRef.current.map((w) => w.area));
        // Start new wedge from the last point
        const last = currentWedgeRef.current[currentWedgeRef.current.length - 1];
        currentWedgeRef.current = last ? [last] : [];
      }

      // If we completed an orbit, reset for next loop after a 2s pause
      if (tCycle > T + 2) {
        cycleStartRef.current = t;
        frozenRef.current = [];
        currentWedgeRef.current = [];
        trailRef.current = [];
        setAreas([]);
      }

      // Update trail
      trailRef.current.forEach((q) => (q.age += dt));
      trailRef.current = trailRef.current.filter((q) => q.age < 4);
      trailRef.current.push({ x: pc.x, y: pc.y, age: 0 });
      if (trailRef.current.length > 300) trailRef.current.shift();

      ctx.clearRect(0, 0, width, height);

      // Ellipse outline
      const bSim = a * Math.sqrt(1 - e * e);
      const c = a * e;
      ctx.strokeStyle = "rgba(91, 233, 255, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx - c * scale, cy, a * scale, bSim * scale, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Frozen wedges (magenta filled)
      ctx.fillStyle = "rgba(255, 79, 216, 0.3)";
      ctx.strokeStyle = "rgba(255, 79, 216, 0.6)";
      ctx.lineWidth = 1;
      for (const wedge of frozenRef.current) {
        if (wedge.points.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        for (const pt of wedge.points) ctx.lineTo(pt.x, pt.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Trail
      for (const q of trailRef.current) {
        const alpha = Math.max(0, 1 - q.age / 4) * 0.5;
        ctx.fillStyle = `rgba(91, 233, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(q.x, q.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sun
      ctx.shadowColor = "rgba(91, 233, 255, 0.8)";
      ctx.shadowBlur = 24;
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Planet
      ctx.fillStyle = colors.fg0;
      ctx.beginPath();
      ctx.arc(pc.x, pc.y, 6, 0, Math.PI * 2);
      ctx.fill();
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
      <div
        className="flex flex-wrap justify-center gap-x-4 gap-y-1 font-mono text-xs text-[var(--color-fg-1)] mt-4"
      >
        {areas.length === 0 ? (
          <span>watching orbit…</span>
        ) : (
          areas.map((A, i) => (
            <span key={i}>
              A{i + 1} = {A.toFixed(3)}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
