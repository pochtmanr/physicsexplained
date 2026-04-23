"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.4;
const MAX_HEIGHT = 280;

export type Mode = "time" | "space" | "rotation";
export type SymmetryMode = Mode | "auto";

interface Props {
  /**
   * Controls which symmetry is displayed.
   *  - omitted: current interactive behavior (user starts on "time", can click tabs).
   *  - "time" | "space" | "rotation": tabs hidden, scene locked to that mode.
   *  - "auto": tabs hidden, cycle through the three modes every 5 s.
   */
  mode?: SymmetryMode;
}

/**
 * Three little vignettes that each illustrate one symmetry of physics and
 * the conserved quantity it implies:
 *   - time translation  → energy
 *   - space translation → momentum
 *   - rotation          → angular momentum
 *
 * Each vignette animates a pair of mechanical setups displaced from each
 * other in the relevant coordinate and shows that they behave identically.
 */
export function SymmetryTriptychScene({ mode: modeProp }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const initialMode: Mode = modeProp && modeProp !== "auto" ? modeProp : "time";
  const [mode, setMode] = useState<Mode>(initialMode);
  const tabsVisible = modeProp === undefined;
  const [size, setSize] = useState({ width: 640, height: 280 });

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

  useEffect(() => {
    if (modeProp !== "auto") return;
    const ORDER: Mode[] = ["time", "space", "rotation"];
    const id = setInterval(() => {
      setMode((prev) => {
        const i = ORDER.indexOf(prev);
        return ORDER[(i + 1) % ORDER.length];
      });
    }, 5000);
    return () => clearInterval(id);
  }, [modeProp]);

  useEffect(() => {
    if (modeProp === undefined || modeProp === "auto") return;
    setMode(modeProp);
  }, [modeProp]);

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

      const padX = 30;
      const leftCx = padX + (width - 2 * padX) * 0.25;
      const rightCx = padX + (width - 2 * padX) * 0.75;
      const groundY = height * 0.72;

      // Header
      ctx.font = "13px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = colors.fg1;

      if (mode === "time") {
        const periodA = 1.2;
        const periodB = 1.2;
        const offsetB = 0.5; // seconds — started half a second later
        const amp = 60;
        const ballY = (t0: number, per: number) =>
          Math.sin((2 * Math.PI * t0) / per) * amp;

        // Pendulum left (started at t=0)
        drawPendulum(ctx, leftCx, height * 0.3, 90, ballY(t, periodA), colors.fg0);
        // Pendulum right (started at t=offsetB)
        drawPendulum(
          ctx,
          rightCx,
          height * 0.3,
          90,
          ballY(t - offsetB, periodB),
          colors.fg0,
        );

        ctx.fillStyle = colors.fg1;
        ctx.fillText("LEFT started at t = 0", leftCx, groundY + 30);
        ctx.fillText("RIGHT started at t = ½ s", rightCx, groundY + 30);
        ctx.fillStyle = "#6FB8C6";
        ctx.fillText(
          "Same pendulum, different start times. Indistinguishable physics ⇒ ENERGY conserved.",
          width / 2,
          height - 18,
        );
      } else if (mode === "space") {
        // Two identical mass-spring oscillators offset in x
        const period = 1.4;
        const amp = 50;
        const x = Math.sin((2 * Math.PI * t) / period) * amp;

        drawSpring(ctx, leftCx, groundY, leftCx + x, groundY, colors.fg3);
        drawMass(ctx, leftCx + x, groundY, 16, "#6FB8C6", colors.fg0);

        drawSpring(ctx, rightCx, groundY, rightCx + x, groundY, colors.fg3);
        drawMass(ctx, rightCx + x, groundY, 16, "#6FB8C6", colors.fg0);

        ctx.fillStyle = colors.fg1;
        ctx.fillText("LEFT oscillator", leftCx, groundY + 40);
        ctx.fillText("RIGHT oscillator (shifted in x)", rightCx, groundY + 40);
        ctx.fillStyle = "#6FB8C6";
        ctx.fillText(
          "Same spring, different locations. Indistinguishable physics ⇒ MOMENTUM conserved.",
          width / 2,
          height - 18,
        );
      } else {
        // Two identical rotators oriented at different angles
        const omega = 2;
        const theta = omega * t;
        drawRotator(ctx, leftCx, groundY - 30, 60, theta, colors.fg0);
        drawRotator(ctx, rightCx, groundY - 30, 60, theta + Math.PI / 4, colors.fg0);

        ctx.fillStyle = colors.fg1;
        ctx.fillText("LEFT rotator", leftCx, groundY + 50);
        ctx.fillText("RIGHT (rotated 45°)", rightCx, groundY + 50);
        ctx.fillStyle = "#6FB8C6";
        ctx.fillText(
          "Same rotator, different orientation. Indistinguishable physics ⇒ ANGULAR MOMENTUM conserved.",
          width / 2,
          height - 18,
        );
      }
    },
  });

  const tabStyle = (active: boolean) =>
    `px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors ${
      active
        ? "bg-[var(--color-cyan)] text-[var(--color-bg-0)]"
        : "bg-transparent text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
    }`;

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      {tabsVisible && (
        <div className="mt-2 flex gap-2 px-2">
          <button
            type="button"
            onClick={() => setMode("time")}
            className={tabStyle(mode === "time")}
          >
            time → energy
          </button>
          <button
            type="button"
            onClick={() => setMode("space")}
            className={tabStyle(mode === "space")}
          >
            space → momentum
          </button>
          <button
            type="button"
            onClick={() => setMode("rotation")}
            className={tabStyle(mode === "rotation")}
          >
            rotation → angular L
          </button>
        </div>
      )}
    </div>
  );
}

function drawPendulum(
  ctx: CanvasRenderingContext2D,
  pivotX: number,
  pivotY: number,
  length: number,
  xOffset: number,
  color: string,
) {
  const ballX = pivotX + xOffset;
  const ballY = pivotY + length - Math.abs(xOffset) * 0.3;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(ballX, ballY);
  ctx.stroke();

  ctx.fillStyle = "#6FB8C6";
  ctx.beginPath();
  ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawSpring(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  const coils = 10;
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const nx = -uy;
  const ny = ux;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 0; i < coils; i++) {
    const frac = (i + 0.5) / coils;
    const sx = x1 + ux * len * frac + nx * (i % 2 === 0 ? 5 : -5);
    const sy = y1 + uy * len * frac + ny * (i % 2 === 0 ? 5 : -5);
    ctx.lineTo(sx, sy);
  }
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawMass(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill: string,
  stroke: string,
) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.rect(x - r, y - r, 2 * r, 2 * r);
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawRotator(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  theta: number,
  color: string,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(theta);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.lineTo(r, 0);
  ctx.stroke();
  ctx.fillStyle = "#E4C27A";
  ctx.beginPath();
  ctx.arc(-r, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6FB8C6";
  ctx.beginPath();
  ctx.arc(r, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
