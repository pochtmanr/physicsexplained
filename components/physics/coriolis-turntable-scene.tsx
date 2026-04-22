"use client";

import { useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  centrifugalAccel2D,
  coriolisAccel2D,
} from "@/lib/physics/rotating-frame";

const CANVAS_W = 380;
const CANVAS_H = 380;
const TURNTABLE_R = 160; // px
const PIX_PER_M = 100; // 1 m = 100 px
const OMEGA = 1.4; // rad/s
const V0 = 0.8; // m/s — outward launch speed in lab frame
const FLIGHT_TIME = 3.2; // s — full flight before reset
const SUBSTEPS = 8; // for rotating-frame integration per displayed frame

const CYAN = "#6FB8C6";
const MAGENTA = "#FF6ADE";

interface State {
  // Rotating-frame state (rider's frame)
  rx: number;
  ry: number;
  rvx: number;
  rvy: number;
  // Time-since-launch
  tFlight: number;
  // Last Coriolis magnitude for HUD
  aCoriolis: number;
}

function freshState(): State {
  return {
    rx: 0,
    ry: 0,
    rvx: V0, // launched along +x in lab; same instantaneous v in rotating frame at t=0
    rvy: 0,
    tFlight: 0,
    aCoriolis: 0,
  };
}

export function CoriolisTurntableScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const stateRef = useRef<State>(freshState());
  const labTrailRef = useRef<Array<{ x: number; y: number }>>([]);
  const rotTrailRef = useRef<Array<{ x: number; y: number }>>([]);
  const [hud, setHud] = useState({ aC: 0, t: 0 });

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== CANVAS_W * dpr || canvas.height !== CANVAS_H * dpr) {
        canvas.width = CANVAS_W * dpr;
        canvas.height = CANVAS_H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const cx = CANVAS_W / 2;
      const cy = CANVAS_H / 2;

      const s = stateRef.current;

      // Step rotating-frame physics with substeps for numerical stability
      const h = dt / SUBSTEPS;
      for (let k = 0; k < SUBSTEPS; k++) {
        if (s.tFlight >= FLIGHT_TIME) break;
        const v = { x: s.rvx, y: s.rvy };
        const r = { x: s.rx, y: s.ry };
        const aC = coriolisAccel2D({ omegaZ: OMEGA }, v);
        const aCf = centrifugalAccel2D({ omegaZ: OMEGA }, r);
        s.rvx += (aC.x + aCf.x) * h;
        s.rvy += (aC.y + aCf.y) * h;
        s.rx += s.rvx * h;
        s.ry += s.rvy * h;
        s.tFlight += h;
        s.aCoriolis = Math.hypot(aC.x, aC.y);
      }

      // Lab-frame position (analytic): straight line at constant V0 along +x
      const labX = V0 * s.tFlight;
      const labY = 0;

      // Append to trails (in canvas-space)
      labTrailRef.current.push({
        x: cx + labX * PIX_PER_M,
        y: cy + labY * PIX_PER_M,
      });
      rotTrailRef.current.push({
        x: cx + s.rx * PIX_PER_M,
        y: cy + s.ry * PIX_PER_M,
      });
      if (labTrailRef.current.length > 600) labTrailRef.current.shift();
      if (rotTrailRef.current.length > 600) rotTrailRef.current.shift();

      // Reset on flight end
      if (s.tFlight >= FLIGHT_TIME) {
        stateRef.current = freshState();
        labTrailRef.current = [];
        rotTrailRef.current = [];
      }

      // ----- Draw -----
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Turntable rim
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, TURNTABLE_R, 0, Math.PI * 2);
      ctx.stroke();

      // Faint cross-axes
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx - TURNTABLE_R, cy);
      ctx.lineTo(cx + TURNTABLE_R, cy);
      ctx.moveTo(cx, cy - TURNTABLE_R);
      ctx.lineTo(cx, cy + TURNTABLE_R);
      ctx.stroke();
      ctx.setLineDash([]);

      // Lab-frame trajectory (cyan, straight)
      if (labTrailRef.current.length > 1) {
        ctx.strokeStyle = CYAN;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(labTrailRef.current[0]!.x, labTrailRef.current[0]!.y);
        for (let i = 1; i < labTrailRef.current.length; i++) {
          ctx.lineTo(labTrailRef.current[i]!.x, labTrailRef.current[i]!.y);
        }
        ctx.stroke();
      }

      // Rotating-frame trajectory (magenta, curved)
      if (rotTrailRef.current.length > 1) {
        ctx.strokeStyle = MAGENTA;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rotTrailRef.current[0]!.x, rotTrailRef.current[0]!.y);
        for (let i = 1; i < rotTrailRef.current.length; i++) {
          ctx.lineTo(rotTrailRef.current[i]!.x, rotTrailRef.current[i]!.y);
        }
        ctx.stroke();
      }

      // Current ball position — lab (cyan)
      ctx.fillStyle = CYAN;
      ctx.shadowColor = "rgba(111,184,198,0.55)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(cx + labX * PIX_PER_M, cy + labY * PIX_PER_M, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Current ball position — rotating (magenta)
      ctx.fillStyle = MAGENTA;
      ctx.shadowColor = "rgba(255,106,222,0.55)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(cx + s.rx * PIX_PER_M, cy + s.ry * PIX_PER_M, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Centre marker
      ctx.fillStyle = colors.fg1;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();

      // Legend
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = CYAN;
      ctx.fillText("lab frame (straight)", 12, CANVAS_H - 28);
      ctx.fillStyle = MAGENTA;
      ctx.fillText("rotating frame (curved by Coriolis)", 12, CANVAS_H - 14);

      // Cheap HUD update — only when value changes meaningfully
      const aC = s.aCoriolis;
      const tNow = s.tFlight;
      setHud((prev) =>
        Math.abs(prev.aC - aC) < 0.01 && Math.abs(prev.t - tNow) < 0.05
          ? prev
          : { aC, t: tNow },
      );
    },
  });

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: CANVAS_W, height: CANVAS_H }}
        className="mx-auto block"
      />
      <div className="pointer-events-none absolute right-2 top-2">
        <div className="rounded-sm border border-[var(--color-fg-4)] bg-[var(--color-bg-0)]/70 px-2 py-1 font-mono text-[10px] leading-relaxed text-[var(--color-fg-1)] backdrop-blur-sm">
          <div>Ω = {OMEGA.toFixed(2)} rad/s</div>
          <div>v₀ = {V0.toFixed(2)} m/s</div>
          <div>
            |a_C| = <span style={{ color: MAGENTA }}>{hud.aC.toFixed(2)}</span> m/s²
          </div>
          <div className="text-[var(--color-fg-3)]">t = {hud.t.toFixed(2)} s</div>
        </div>
      </div>
    </div>
  );
}
