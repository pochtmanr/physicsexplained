"use client";

import { useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { coriolisAccel2D } from "@/lib/physics/rotating-frame";

const MINI_W = 220;
const MINI_H = 260;
const PIX_PER_M = 18; // scale: 1 m = 18 px
const G = 9.81; // m/s²
const V0X = 6.0; // m/s — horizontal launch
const V0Y = -8.5; // m/s — upward (canvas y grows downward)
const FLIGHT_TIME = 1.85; // s
const SUBSTEPS = 6;

const CYAN = "#6FB8C6";
const MAGENTA = "#FF6ADE";

interface RotState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function freshRot(): RotState {
  return { x: 0, y: 0, vx: V0X, vy: V0Y };
}

export function RotatingProjectileScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inertialCanvasRef = useRef<HTMLCanvasElement>(null);
  const rotatingCanvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [omega, setOmega] = useState(1.5); // rad/s
  const omegaRef = useRef(omega);
  omegaRef.current = omega;

  const tFlightRef = useRef(0);
  const rotStateRef = useRef<RotState>(freshRot());
  const inertialTrailRef = useRef<Array<{ x: number; y: number }>>([]);
  const rotatingTrailRef = useRef<Array<{ x: number; y: number }>>([]);
  const lastOmegaRef = useRef(omega);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
      // Reset trails when Ω changes mid-flight
      if (lastOmegaRef.current !== omegaRef.current) {
        tFlightRef.current = 0;
        rotStateRef.current = freshRot();
        inertialTrailRef.current = [];
        rotatingTrailRef.current = [];
        lastOmegaRef.current = omegaRef.current;
      }

      const inertialCanvas = inertialCanvasRef.current;
      const rotatingCanvas = rotatingCanvasRef.current;
      if (!inertialCanvas || !rotatingCanvas) return;
      const ictx = inertialCanvas.getContext("2d");
      const rctx = rotatingCanvas.getContext("2d");
      if (!ictx || !rctx) return;
      const dpr = window.devicePixelRatio || 1;
      for (const c of [inertialCanvas, rotatingCanvas]) {
        if (c.width !== MINI_W * dpr || c.height !== MINI_H * dpr) {
          c.width = MINI_W * dpr;
          c.height = MINI_H * dpr;
          c.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
      }

      // Step rotating-frame physics
      const r = rotStateRef.current;
      const h = dt / SUBSTEPS;
      for (let k = 0; k < SUBSTEPS; k++) {
        if (tFlightRef.current >= FLIGHT_TIME) break;
        const aC = coriolisAccel2D({ omegaZ: omegaRef.current }, { x: r.vx, y: r.vy });
        // Gravity: positive y is downward in canvas-space; we stored V0Y as
        // negative (upward). +G means "pull downward" → +y direction.
        r.vx += aC.x * h;
        r.vy += (aC.y + G) * h;
        r.x += r.vx * h;
        r.y += r.vy * h;
        tFlightRef.current += h;
      }

      const tF = tFlightRef.current;
      // Inertial-frame analytic position (no Coriolis): parabola
      const ix = V0X * tF;
      const iy = V0Y * tF + 0.5 * G * tF * tF;

      // Origin in each canvas: bottom-left-ish
      const oX = 30;
      const oY = MINI_H - 30;

      const ipx = oX + ix * PIX_PER_M;
      const ipy = oY + iy * PIX_PER_M;
      const rpx = oX + r.x * PIX_PER_M;
      const rpy = oY + r.y * PIX_PER_M;

      inertialTrailRef.current.push({ x: ipx, y: ipy });
      rotatingTrailRef.current.push({ x: rpx, y: rpy });
      if (inertialTrailRef.current.length > 800) inertialTrailRef.current.shift();
      if (rotatingTrailRef.current.length > 800) rotatingTrailRef.current.shift();

      // Reset cycle
      if (tF >= FLIGHT_TIME) {
        tFlightRef.current = 0;
        rotStateRef.current = freshRot();
        inertialTrailRef.current = [];
        rotatingTrailRef.current = [];
      }

      // ----- Draw helper -----
      const drawPanel = (
        ctx: CanvasRenderingContext2D,
        title: string,
        trail: Array<{ x: number; y: number }>,
        cur: { x: number; y: number },
        color: string,
      ) => {
        ctx.clearRect(0, 0, MINI_W, MINI_H);

        // Ground line
        ctx.strokeStyle = colors.fg2;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(8, oY);
        ctx.lineTo(MINI_W - 8, oY);
        ctx.stroke();

        // Y-axis tick at the launch point
        ctx.strokeStyle = colors.fg3;
        ctx.beginPath();
        ctx.moveTo(oX, 12);
        ctx.lineTo(oX, oY);
        ctx.stroke();

        // Title
        ctx.fillStyle = colors.fg1;
        ctx.font = "11px monospace";
        ctx.textAlign = "left";
        ctx.fillText(title, 10, 16);

        // Trail
        if (trail.length > 1) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(trail[0]!.x, trail[0]!.y);
          for (let i = 1; i < trail.length; i++) {
            ctx.lineTo(trail[i]!.x, trail[i]!.y);
          }
          ctx.stroke();
        }

        // Current marker
        ctx.fillStyle = color;
        ctx.shadowColor =
          color === CYAN ? "rgba(111,184,198,0.55)" : "rgba(255,106,222,0.55)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(cur.x, cur.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      };

      drawPanel(ictx, "inertial · parabola", inertialTrailRef.current, { x: ipx, y: ipy }, CYAN);
      drawPanel(
        rctx,
        "rotating · spiral",
        rotatingTrailRef.current,
        { x: rpx, y: rpy },
        MAGENTA,
      );
    },
  });

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <div className="mx-auto flex w-fit gap-3">
        <canvas
          ref={inertialCanvasRef}
          style={{ width: MINI_W, height: MINI_H }}
          className="block"
        />
        <canvas
          ref={rotatingCanvasRef}
          style={{ width: MINI_W, height: MINI_H }}
          className="block"
        />
      </div>
      <div className="pointer-events-none absolute right-2 top-2">
        <div className="rounded-sm border border-[var(--color-fg-4)] bg-[var(--color-bg-0)]/70 px-2 py-1 font-mono text-[10px] leading-relaxed text-[var(--color-fg-1)] backdrop-blur-sm">
          <div>v₀ = ({V0X.toFixed(1)}, {(-V0Y).toFixed(1)}) m/s</div>
          <div>g = {G.toFixed(2)} m/s²</div>
          <div>
            Ω = <span style={{ color: MAGENTA }}>{omega.toFixed(2)}</span> rad/s
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 px-2">
        <label className="w-20 text-sm text-[var(--color-fg-3)]">Ω</label>
        <input
          type="range"
          min={-3}
          max={3}
          step={0.05}
          value={omega}
          onChange={(e) => setOmega(parseFloat(e.target.value))}
          className="flex-1 accent-[#FF6ADE]"
        />
        <span className="w-16 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {omega.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
