"use client";

import { useRef } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { dampedFree } from "@/lib/physics/damped-oscillator";

const CANVAS_W = 540;
const CANVAS_H = 220;
const PANEL_W = CANVAS_W / 3;
const PAD_X = 14;
const PAD_TOP = 16;
const PAD_BOT = 28;
const T_MAX = 10; // seconds plotted
const X0 = 1; // initial displacement
const SWEEP_PERIOD = 6; // seconds to traverse the panel

const CYAN = "#6FB8C6";
const MAGENTA = "#FF6ADE";

const OMEGA0 = 2 * Math.PI; // 1 Hz
const REGIMES = [
  { label: "underdamped", gamma: 1.5 },
  { label: "critically damped", gamma: 2 * OMEGA0 },
  { label: "overdamped", gamma: 6 * OMEGA0 },
];

function panelX(panelIdx: number, t: number): number {
  const left = panelIdx * PANEL_W + PAD_X;
  const w = PANEL_W - 2 * PAD_X;
  return left + (t / T_MAX) * w;
}

function panelY(x: number): number {
  // x is in [-1, 1]; map to [PAD_TOP, CANVAS_H - PAD_BOT]
  const h = CANVAS_H - PAD_TOP - PAD_BOT;
  const mid = PAD_TOP + h / 2;
  return mid - (x / 1.05) * (h / 2);
}

export function DampedRegimesScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
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

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      const sweepT = (t % SWEEP_PERIOD) / SWEEP_PERIOD * T_MAX;

      REGIMES.forEach((regime, i) => {
        const left = i * PANEL_W;
        const innerLeft = left + PAD_X;
        const innerRight = left + PANEL_W - PAD_X;
        const innerTop = PAD_TOP;
        const innerBot = CANVAS_H - PAD_BOT;
        const midY = (innerTop + innerBot) / 2;

        // Panel separator (right edge of every panel except last)
        if (i < REGIMES.length - 1) {
          ctx.strokeStyle = colors.fg3;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(left + PANEL_W, 4);
          ctx.lineTo(left + PANEL_W, CANVAS_H - 4);
          ctx.stroke();
        }

        // Zero axis
        ctx.strokeStyle = colors.fg3;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(innerLeft, midY);
        ctx.lineTo(innerRight, midY);
        ctx.stroke();

        // Magenta envelope on the underdamped panel only
        if (i === 0) {
          ctx.strokeStyle = MAGENTA;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          for (const sign of [1, -1] as const) {
            ctx.beginPath();
            const N = 200;
            for (let k = 0; k <= N; k++) {
              const tt = (k / N) * T_MAX;
              const env = sign * X0 * Math.exp((-regime.gamma * tt) / 2);
              const px = panelX(i, tt);
              const py = panelY(env);
              if (k === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();
          }
          ctx.setLineDash([]);
        }

        // x(t) curve
        ctx.strokeStyle = CYAN;
        ctx.lineWidth = 1.75;
        ctx.beginPath();
        const N = 320;
        for (let k = 0; k <= N; k++) {
          const tt = (k / N) * T_MAX;
          const x = dampedFree(tt, X0, { omega0: OMEGA0, gamma: regime.gamma });
          const px = panelX(i, tt);
          const py = panelY(x);
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Sweeping "now" line
        const sweepPx = panelX(i, sweepT);
        ctx.strokeStyle = colors.fg2;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(sweepPx, innerTop);
        ctx.lineTo(sweepPx, innerBot);
        ctx.stroke();
        ctx.setLineDash([]);

        // Dot at the current sample
        const xNow = dampedFree(sweepT, X0, {
          omega0: OMEGA0,
          gamma: regime.gamma,
        });
        ctx.fillStyle = CYAN;
        ctx.beginPath();
        ctx.arc(sweepPx, panelY(xNow), 3, 0, Math.PI * 2);
        ctx.fill();

        // Top label (regime name)
        ctx.fillStyle = colors.fg1;
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(regime.label, left + PANEL_W / 2, 12);

        // Bottom label strip (γ value)
        ctx.fillStyle = colors.fg2;
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          `γ = ${regime.gamma.toFixed(2)} s⁻¹`,
          left + PANEL_W / 2,
          CANVAS_H - 10,
        );
      });
    },
  });

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: CANVAS_W, height: CANVAS_H, maxWidth: "100%" }}
        className="mx-auto block"
      />
      <div className="pointer-events-none absolute right-2 top-2">
        <div className="rounded-sm border border-[var(--color-fg-4)] bg-[var(--color-bg-0)]/70 px-2 py-1 font-mono text-[10px] leading-relaxed text-[var(--color-fg-1)] backdrop-blur-sm">
          <div>ω₀ = 2π rad/s · x₀ = 1</div>
          <div>
            envelope ±x₀ e^(-γt/2) ·{" "}
            <span style={{ color: MAGENTA }}>magenta</span>
          </div>
        </div>
      </div>
    </div>
  );
}
